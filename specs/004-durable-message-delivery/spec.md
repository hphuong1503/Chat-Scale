# Durable message writes and outbox delivery

Status: Draft
Owner: Backend maintainer; product and operations approve delivery policy
Related tasks: T026–T031; durability subset of T040; requires T002/T020 decisions

## Intent

A successful send acknowledges a committed message. Retrying after a lost response
must not create another message, and a transient realtime failure must leave work
that can be retried or inspected.

## Scope

Atomic Message/Outbox writes, sender-scoped idempotency, dispatcher claims/retries,
operator replay and saved acknowledgement. Use the canonical fields from
[003-message-contract](../003-message-contract/spec.md). Exclude read/delivered
receipts, cross-region guarantees, reconnect UI and exactly-once event delivery.

Dependencies: verified 001 access rules, agreed 003 backend DTO, and an Accepted T026
ADR replacing the unfinished historical write-pipeline decision. DTO design can be
agreed before frontend implementation; production rollout still requires a compatible
client. All contracts below are proposed, not currently implemented.

## Contract

### Send and retry

POST /messages/ retains `message` and `room` input names and requires a UUID
`client_message_id` for the durable contract. Sender is request.user. On first success,
return 201 only after Message and its OutboxEvent commit in one PostgreSQL transaction;
return the canonical DTO with the persisted client_message_id (and 003's aliases).
A retry by the same sender with the same ID and exact room/content returns 200 with
the same message ID and creates no new message/event. Different room/content with
the same sender/ID returns 409, code `idempotency_conflict`. Different senders may
use the same client ID. No whitespace normalization is used for equality.

Authenticate and authorize the requested room before disclosing any existing retry
result. A former member gets 404, not their stored message. Serialize authorization
and creation against membership removal with a common room-lock protocol shared
with lifecycle mutations. If removal commits first, the send is rejected; if send
commits first, the accepted write remains subject to the later deletion policy.

Missing/malformed client_message_id returns 400. Existing validation/auth limits
remain. A failed DB transaction returns no 2xx and leaves neither row. Redis/broker
unavailability must not prevent a committed message from returning 201. Lost HTTP
response has an unknown client outcome; retry the same ID to resolve it.

### Event and dispatcher

Each new message creates one persisted event with stable UUID event_id and message_id,
public type `message.created`, and canonical DTO data. Preserve compatibility fields
from 003. A publish retry/replay reuses event_id; clients deduplicate by message ID
and event_id. Events may be duplicated or delivered out of order.

Proposed states: pending → leased → published, or retry_wait/dead after failure.
A periodic scan discovers due/unpublished rows even if no enqueue callback ran.
Leases have an expiry and ownership token; only the current owner can acknowledge a
claim. If a worker dies, expired work becomes claimable. A crash after publish but
before acknowledgement can publish twice; it cannot silently drop the row.
`published` means accepted by the channel layer, not received/read by a device.

Proposed configurable defaults: scan every 1 second, lease 60 seconds, 10 attempts,
retry delay min(2^(attempt-1), 300) seconds plus jitter up to 20%. A publish timeout
must be shorter than the lease; renew/fence claims as needed. On exhaustion, retain a
dead row and sanitized error for operator inspection. With two healthy dispatchers,
a due row in an otherwise idle test system must be attempted within 5 seconds; this
is a test condition, not a production SLO. Emit counts/age of pending/dead events.

Replay is an operator-only management command scoped to explicit event IDs, with a
dry-run mode and an audit record; no public replay API. Replay resets delivery work
without changing event identity or creating Message rows. Do not log content/tokens.
Room deletion cancels/skips unpublished events once deletion is observed under the
agreed policy. An already in-flight publication may arrive; no atomic DB/Redis
cancellation is claimed. Persistence acknowledgement does not override intentional
later deletion. Clients must reauthorize through sync when a room is removed.

### Existing clients/data

Legacy messages retain null client_message_id; new messages require it. Apply a
sender/client-ID uniqueness constraint that allows legacy nulls. Preserve dedupe
records for the lifetime of their messages; message deletion and key reuse policy
must be approved in Q3. Do not invent client keys for historical rows or replay all
historical messages as new events. Update k6's 202 assertion for the new contract.
There is no silent fallback from durable 201 to queued 202.

## Acceptance criteria

- AC-001: First valid send returns 201 with a persisted DTO only after both Message and OutboxEvent commit; injected failures roll back both.
- AC-002: Sequential and concurrent identical retries return one message and one event, with one 201 and retries 200; changed payload returns 409 and different senders are independent.
- AC-003: Anonymous/nonmember/former-member requests, invalid keys and malformed payloads return the documented failures with no writes or leaked retry result.
- AC-004: With Redis unavailable, a committed send returns 201; after Redis recovers a periodic scan publishes the retained event without another send.
- AC-005: Worker death before publish allows lease recovery; death after publish permits a duplicate with the same event_id and message_id without duplicating Message.
- AC-006: Two dispatchers claim due work safely; stale lease owners cannot acknowledge reclaimed work and an idle-system due row is attempted within 5 seconds.
- AC-007: Exhausted events remain inspectable as dead; operator replay preserves IDs and message count and produces a sanitized audit record.
- AC-008: Legacy rows survive migration with null keys; old queued work is drained or reconciled before cutover, and compatible clients/k6 exercise 201/200/conflict semantics.

## Open questions

- Q1 — Product/backend (blocking): accept 201-after-commit, 200 on identical retry
  and required client keys, and record the superseding T026 ADR. The existing ADR
  label alone is insufficient evidence.
- Q2 — Operations/backend (blocking): confirm or revise retry/lease/scan defaults,
  replay ownership and backlog/dead-event handling against T002 targets.
- Q3 — Product/backend (blocking): define dedupe retention after message/room/account
  deletion and room-delete cancellation behavior, aligned with spec 002 and T003.
- Q4 — Frontend/backend (rollout blocker): confirm a compatible source client and
  an audited old-queue drain/cutover window. Legacy sends cannot transparently satisfy
  the new idempotency guarantee.
