# Implementation plan

## Approach

Add nullable Message.client_message_id for old rows, a uniqueness constraint and
OutboxEvent with persisted payload, attempts, due time, lease token/expiry and last
sanitized failure. Write through a transaction service called by the view. Handle
unique conflicts with a savepoint or a new valid transaction before loading the
winning row. Acquire the room lock before checking membership/write; bring lifecycle
mutations under the same ordering. Validate the conflict payload exactly.

Replace asynchronous creation with synchronous DB commit; Celery may dispatch events
but must not be the only way to discover work. Use PostgreSQL row locking/skip-locked
or an equivalent atomic claim, release DB locks before external publish, and fence
state updates by claim token. Recheck deletion eligibility before publishing. Treat
publish/ack as non-atomic and expose duplicate delivery as part of the contract.

Add retry scanning, dead-event inspection/replay, and minimal logs/metrics. No new
service split is needed. Full ordering and catch-up are introduced in 005; do not
use created_at as proof that all earlier writes have committed.

## Verification

Use the AC-specific procedures in evidence.md. Fast tests can validate serialization
and retries, but PostgreSQL separate-connection races and real Redis/worker failure
injection are mandatory. Record commands/process counts, injected failure location,
persisted IDs/counts, recovery time and dead/backlog state. Cover lost HTTP responses,
not only exceptions before commit. Run make check plus the feature's integration
suite. Local eager Celery results alone cannot close AC-004–006 or AC-008.

## Rollout and rollback

Expand schema first. Rehearse legacy queue drain/reconciliation on disposable data;
briefly stop legacy writes, let old creation tasks finish, verify DB/queue counts,
then switch clients and server to durable writes and enable scanning. Old creation
workers must not keep accepting bypass writes. Keep schema backward-readable, but
do not roll back to 202 for clients expecting durable acknowledgement. If needed,
disable sends temporarily and fix forward; retain pending/dead events for recovery.
Migration reversal or outbox deletion is not a safe operational rollback.
