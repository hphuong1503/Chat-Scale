# Implementation plan

## Approach

Use the current RoomViewSet/RoomSerializer boundaries. Make action permissions and
allowed fields explicit rather than relying on ModelViewSet defaults. Put validation
and membership mutations in a transaction; lock the room consistently for concurrent
admin operations. Validate targets before writes and recheck relevant state inside
the transaction. Keep current response fields for unaffected room operations.

Represent DIRECT identity using normalized user IDs and a database-enforced unique
pair for DIRECT rooms, with constraints separating GROUP rows. Choose the schema in
the implementation plan after inspecting migration fixtures. Resolve uniqueness
conflicts outside a broken transaction/savepoint, then fetch the winner. Do not rely
on an exists-then-create check for correctness.

Add a read-only preflight report and an expand/backfill/constrain migration path.
Exercise migrations from the current schema with existing messages. Keep T038 socket
revocation separately tracked: successful membership removal does not imply an
already-open socket has been revoked.

## Verification

Implement the named checks in evidence.md with real JWT/session requests. Use
PostgreSQL TransactionTestCase or equivalent separate-connection tests for pair
creation and admin-removal races; SQLite and sequential requests are insufficient.
Assert persisted state as well as status codes. Test both POST directions for DIRECT.
Run make check and a PostgreSQL migration/concurrency job; record exact commands and
results. Update the matrix if Q1 changes; no pending policy may be hidden by a test.

## Rollout and rollback

Approve deletion policy before enabling the endpoint. Run legacy preflight on a
copy, preserve a backup, apply the reviewed remediation, then add constraints. Deploy
all room writers using the same transaction/identity rules. Existing API callers
that previously changed protected fields will now fail explicitly. Reverting to old
writers can violate new invariants: prefer a forward fix or disable mutations while
repairing. Reversing a migration must never silently delete duplicate-room data.
