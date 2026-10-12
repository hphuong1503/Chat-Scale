# Canonical message representation

Status: Draft
Owner: Backend and frontend maintainers; product owner resolves compatibility policy
Related tasks: T020/T021/T023 (message subset); depends on T001 for client integration

## Intent

Represent a persisted message consistently in history and realtime events so clients
can identify it, attribute it to a sender, and display its canonical timestamp.

## Scope

Canonical DTO, persisted-message REST serialization, WS event payload and client
adapter after source restoration. Keep the queued send contract from spec 001 until
spec 004 replaces it. Exclude outbox/retry implementation, cursor ordering, receipts,
message editing/deletion and global API error standardization.

Dependencies: [001-room-access](../001-room-access/spec.md) for permissions; T001
for frontend build/E2E. Backend work may proceed independently, but this spec cannot
be Implemented until its client compatibility criterion passes.

## Contract

### Current and target representations

Current REST uses `message` and `room`; sender is hidden. WS sends content and sender
ID without a persisted message ID or timestamp. The proposed canonical DTO is:

```json
{
  "id": "e26a6dc3-2491-46ec-826d-d3f53f141b6d",
  "client_message_id": null,
  "room_id": "f9cba0d9-8e27-498a-ac96-1573b205ea0d",
  "sender": {"id": 17, "username": "alice"},
  "content": "Hello",
  "created_at": "2026-10-12T03:00:00.000000Z"
}
```

IDs for messages/rooms are UUID strings; sender.id retains the current integer user
ID. created_at is the persisted UTC timestamp in ISO 8601, never the browser clock.
client_message_id is null for legacy rows and queued sends until spec 004 persists it.
content exactly reflects stored text; do not silently trim or normalize stored data.
The sender object exposes id/username only, not email, groups or permissions. Username
is the current display value, not a historical snapshot. Editing/version semantics
are deferred until T052; no fake version or delivery receipt is added.

### Compatibility proposal

Keep current routes and pagination wrappers. During this slice, REST output adds
canonical fields and retains `message == content` and `room == room_id` aliases.
There is one serializer for canonical fields; aliases derive from it. Existing
POST `{message, room}` and 202 queued response remain unchanged. New write fields,
client_message_id requirements and 201/200 responses belong to spec 004.

Proposed WS wire payload:

```json
{
  "type": "message.created",
  "data": {"id": "<message UUID>", "client_message_id": null, "room_id": "<room UUID>", "sender": {"id": 17, "username": "alice"}, "content": "Hello", "created_at": "<persisted UTC timestamp>"},
  "message": "Hello",
  "sender_id": "17",
  "room_id": "<room UUID>"
}
```

The internal Channels handler routing key can remain `chat_message`; distinguish
that transport dispatch key from the public event type. Build data from the saved
Message, not only the task arguments. event_id is added by spec 004's outbox; this
slice does not promise reliable delivery. REST and WS canonical fields for the same
row must agree at serialization time (including the current username).

### Errors and limits

Preserve spec 001's authentication and 400/401/404 behavior. The existing content
limit is 10 KiB UTF-8, while the entire HTTP body currently also has a 10 KiB limit;
large JSON overhead may trigger 413 sooner. Retain and document both in this slice.
Avoid claiming every 10 KiB content value is accepted. Broader limits/error envelopes
require a separate decision under T023. Serialization does not widen query access.

## Acceptance criteria

- AC-001: Authorized REST history/detail/list responses contain the canonical fields and persisted values; sender exposes only id/username.
- AC-002: For a saved message, WS data and REST canonical fields match; WS includes the saved UUID and timestamp, and legacy aliases agree.
- AC-003: Existing POST input and 202 queued response remain valid; no response claims saved/delivered from enqueue alone.
- AC-004: Legacy rows serialize client_message_id as null; content and UTC timestamp round-trip without content rewriting.
- AC-005: Aliases and pagination wrappers remain backward compatible while unauthorized users receive no added message/sender information.
- AC-006: The restored frontend renders canonical sender/content/time and reconciles repeated IDs without duplicate rows; legacy payload compatibility is tested.
- AC-007: Message validation preserves documented content/body byte limits and returns controlled errors without publishing rejected input.

## Open questions

- Q1 — Backend/frontend (blocking): approve additive aliases/envelope at existing
  routes, or choose versioned endpoints. If versioned, update paths and rollout before Ready.
- Q2 — Product owner (blocking): approve public sender id/username and current-username
  semantics; snapshot/display-name requirements change this DTO.
- Q3 — Frontend owner (execution blocker): locate recoverable frontend source under
  T001. Backend completion alone cannot satisfy AC-006.

No alias removal is authorized by this spec; a later compatibility decision must
identify supported client versions and evidence before removal.
