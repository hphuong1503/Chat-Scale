# Ordered history and reconnect recovery

Status: Draft
Owner: Backend and frontend maintainers; product owner confirms ordering and retention
Related tasks: T032–T037/T039; reconnect subset of T040; requires T001/T022

## Intent

A client can recover committed room messages after disconnects and reconcile HTTP,
realtime and optimistic copies into one visible message without skipping late commits.

## Scope

Room order/cursors, bounded history and catch-up API, subscription handshake,
client deduplication/retry state and reconnect. Dependencies: 004 canonical DTO,
005 durable writes, 001 access rules, and
[002-frontend-foundation](../002-frontend-foundation/spec.md) for the basic client
and working WS (T001/T022).
Exclude read receipts/unread counts, edits/deletes, active socket revocation (T038),
production WS ticket design (T045), and multi-region ordering.

Backend protocol work can precede client restoration, but frontend acceptance is
required for Implemented. Proposed decisions below require Q1–Q3 resolution.

## Contract

### Per-room ordering proposal

Use an increasing room_sequence allocated under a room row lock in the same
transaction as Message and OutboxEvent. All write paths use it. A later sequence
cannot commit while an earlier write still holds that lock; rolled-back allocation
must not advance the committed high watermark. Timestamp/UUID and a global DB
sequence alone are not sufficient catch-up checkpoints. No global order is promised.
Add room_sequence to the canonical DTO; initial backfill assigns deterministic
(created_at, id) order to retained rows without claiming historical commit order.
Expose sequence as a decimal string to avoid JavaScript integer precision loss.

### History and catch-up

Preserve the old page-number endpoint during migration. Proposed new route:
GET /rooms/{id}/sync/?limit=50 with optional `after`, `before`, and `until` cursor
parameters. after and before are mutually exclusive; until is valid only for catch-up.
limit is an integer from 1 to 100; bad parameters return 400 `invalid_cursor` or
`invalid_limit`. Authenticate/authorize first (401/404) before exposing cursor details.
Cursors are opaque, signed and bound to room plus protocol version, not credentials;
every request rechecks membership.

- No after/before: latest limit messages, returned in ascending sequence, plus a
  previous_cursor for older pages and a committed high_watermark cursor H.
- before: previous older page in ascending sequence, with previous_cursor/null.
- after: messages strictly after the checkpoint and at or below H, ascending;
  capture H on the first page or accept a valid until from an earlier response.
  Keep H fixed across pages. Return next_cursor for the last scanned message,
  has_more and high_watermark H. If the interval is exhausted, the checkpoint may
  advance to H even when the page is empty. This permits intentional deletion gaps.
- A cursor from another room or invalid signature/version returns 400. A checkpoint
  older than supported retention returns 410 `resync_required`; return no unrelated
  message data. The client reloads a fresh snapshot. Retention policy is Q2.

### Subscribe and recovery

On WS connection, after authentication, membership check and successful room-group
subscription, send `room.ready` with room_id and a committed high_watermark cursor.
The client buffers live events while loading catch-up through that fixed watermark,
then merges buffered and fetched messages by persisted ID and sequence. Subscribe
before reading the watermark: commits before subscription are in catch-up; commits
after it are either in catch-up or live events. Tests must cover all boundaries.

A live event, including the client's own HTTP response, must not advance the durable
catch-up checkpoint past unseen messages. Advance it only after fully consuming a
bounded catch-up interval. Maintain checkpoints per account and room; clear them on
logout/account switch. Buffer overflow triggers another catch-up, never silent drop.
If a room disappears or permission is revoked, stop its sync, clear its local visible
state and require authorization again; this is not a guarantee of immediate socket
revocation, which remains T038.

Redis channel events can be missed without a socket disconnect. Proposed online
anti-entropy polling: sync every 15 seconds while the room is active and on focus,
using the last completed checkpoint. A successfully published event is not the only
recovery signal. After actual disconnect, reconnect with exponential backoff starting
at 1 second, capped at 30 seconds with jitter; reset after a successful handshake.

### Client send states

sending → saved on either a matching committed HTTP DTO or persisted WS event;
failed/unknown after an error/timeout, with retry using the same client_message_id.
Merge optimistic, HTTP and WS copies regardless of arrival order. A late HTTP error
must not downgrade a message already proven saved. Conflict 409 is shown explicitly;
retry must not silently change payload with the same key. saved never means read or
delivered. Retain enough pending key/payload state to resolve a lost response after
reload; namespace it by account and clear it on logout according to the agreed policy.

## Acceptance criteria

- AC-001: Two concurrent room writes cannot expose a later committed checkpoint that skips a delayed earlier commit; rollback does not create an unseen-message gap.
- AC-002: History and bounded catch-up return stable ordered pages with no duplicate/omitted retained messages, including equal timestamps and intentional deletion gaps.
- AC-003: Malformed/cross-room cursors and bad limits return controlled 400 errors; expired-retention cursors return 410, and outsiders/anonymous users get 404/401 before data exposure.
- AC-004: Messages committed before subscribe, between subscribe/watermark, during catch-up and after its last page appear once after client reconciliation.
- AC-005: Duplicate/out-of-order events and either HTTP/WS arrival order produce one row per persisted message; live events never advance the catch-up checkpoint over unseen messages.
- AC-006: After disconnect or a silently lost channel event, catch-up restores retained committed messages; idle active-room polling starts within the configured 15-second interval.
- AC-007: Timeout/reload retry keeps the same client key; confirmed saved messages stay saved after a late HTTP error, and 409 is visible without creating another message.
- AC-008: Account switch, denied sync, buffer overflow and resync_required clear or rebuild the appropriate scoped state without leaking another account/room history.
- AC-009: Legacy page history remains compatible during rollout, all retained rows gain stable sequences, and new sync queries use the intended room/sequence index on representative data.

## Open questions

- Q1 — Backend/product (blocking): approve per-room serialized writes and measure
  contention against T002 targets; record the T032 ordering decision before Ready.
- Q2 — Product/backend (blocking): choose retention/cursor validity and intentional
  deletion behavior. Define the oldest supported checkpoint and resync policy; do
  not infer these from created_at alone.
- Q3 — Frontend/product (blocking): approve anti-entropy interval, local pending-send
  persistence/logout policy and buffer bound (proposed 1,000 events, then resync).
- Q4 — Frontend owner (execution blocker): restore source and complete T022. A backend
  test harness does not establish browser recovery acceptance.

T038 remains a separate security release blocker; periodic sync rejection is not a
replacement for immediate active-socket revocation.
