# Verification evidence

## Acceptance mapping

| Criterion | Planned test / evidence | Result |
|---|---|---|
| AC-001 | test_room_sequence_late_commit_and_rollback using synchronized PostgreSQL writers | Pending |
| AC-002 | test_sync_pages_fixed_watermark_and_equal_timestamps | Pending |
| AC-003 | test_sync_cursor_validation_retention_and_permissions | Pending |
| AC-004 | integration test with barriers at all handshake/catch-up boundaries | Pending |
| AC-005 | client reconciliation and checkpoint tests with reordered delivery fixtures | Pending |
| AC-006 | two-client real Redis/WS test with dropped event and reconnect/focus scenarios | Pending |
| AC-007 | browser lost-response/reload/retry test against durable write API | Pending |
| AC-008 | browser account isolation, revoked membership, overflow and retention-reset cases | Pending |
| AC-009 | migration rehearsal, legacy endpoint regression and EXPLAIN capture | Pending |

## Runs

2026-10-12: specification authored against the current source and TODO backlog.
No feature implementation or acceptance test run is claimed. Test names above are
planned identifiers/procedures, not existing passing tests.

Documentation validation (2026-10-12): `make spec-check PYTHON=env/bin/python`
passed (structure checker and six gate regression tests); `git diff --check` passed.
New spec links resolve, and all four document sets are written in English. These
checks validate documentation only; every feature acceptance result remains Pending.

## Limitations

No ordering, browser or recovery tests executed. Ordering/retention/persistence choices and restored client source are pending. This spec does not implement active socket revocation or read receipts.
