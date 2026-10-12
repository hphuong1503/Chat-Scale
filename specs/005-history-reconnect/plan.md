# Implementation plan

## Approach

Add a per-room committed sequence counter and Message.room_sequence with a unique
room/sequence constraint and index. Extend the durable transaction from 004; ensure
membership mutations take locks in the same order to avoid deadlocks. Plan a bounded
backfill/cutover and verify every message writer, including utilities, uses the rule.

Implement a cursor codec with protocol version, room binding, integrity checks and
retention validation. Separate backwards history from forward catch-up in query logic.
Use the DB's committed watermark, not latest event delivery, to bound intervals.
Return only authorized messages. During cutover, drain or upgrade pending legacy
outbox payloads that lack room_sequence before enabling the new protocol. A client
receiving a legacy event without sequence must trigger authorized sync rather than
advance its checkpoint or invent an ordering value. Test this transition explicitly.
Add handshake after group subscription, with safe
cleanup when readiness or membership validation fails.

In restored source, implement one message store keyed by ID with optimistic entries
keyed by client_message_id. Keep checkpoint state separate from display order; merge
out-of-order events and sync pages, then advance only a fully consumed interval.
Implement capped buffering, focus/periodic sync, retry backoff and account-scoped
cleanup. Use virtual time for interval/backoff logic and real services for ordering
and delivery boundaries.

## Verification

Map every AC to evidence.md. PostgreSQL concurrency tests must explicitly hold an
earlier writer open while starting another; sequential timestamp fixtures are not
enough. Exercise real Redis, ASGI sockets and restored browser clients for AC-004/006/007/008.
Simulate event loss without disconnect as well as full reconnect. Record captured
message IDs, checkpoint transitions and final DB/UI equality. Use representative
history data and record EXPLAIN for AC-009; latency targets remain T002/T068, not
invented production promises. Run make check and the new integration/client suites.

## Rollout and rollback

Add nullable sequence storage first, rehearse backfill on a copy, then quiesce writes
for final backfill/counter initialization and switch every writer before enabling sync.
Enforce constraints once all retained room messages are covered. Keep old pagination
until restored clients demonstrate compatibility. Gate new sync/handshake/client logic
as one protocol version; disable that version on rollback while preserving sequences
and durable writes. Do not revert writers to a path that bypasses sequence allocation.
A longer zero-downtime migration needs a separately reviewed plan.
