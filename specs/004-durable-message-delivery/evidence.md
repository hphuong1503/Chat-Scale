# Verification evidence

## Acceptance mapping

| Criterion | Planned test / evidence | Result |
|---|---|---|
| AC-001 | test_atomic_send_commit_and_rollback with real PostgreSQL transactions | Pending |
| AC-002 | test_idempotency_concurrency_and_conflict using separate connections | Pending |
| AC-003 | test_durable_send_permission_and_validation_matrix; send/removal race | Pending |
| AC-004 | integration test stopping Redis then restoring it with real worker/dispatcher | Pending |
| AC-005 | failure-injection tests before publish and before acknowledgement | Pending |
| AC-006 | multi-process PostgreSQL claim/fencing and latency test | Pending |
| AC-007 | test_retry_schedule_exhaustion_and_operator_replay | Pending |
| AC-008 | migration/cutover rehearsal and restored-client retry scenario | Pending |

## Runs

2026-10-12: specification authored against the current source and TODO backlog.
No feature implementation or acceptance test run is claimed. Test names above are
planned identifiers/procedures, not existing passing tests.

Documentation validation (2026-10-12): `make spec-check PYTHON=env/bin/python`
passed (structure checker and six gate regression tests); `git diff --check` passed.
New spec links resolve, and all four document sets are written in English. These
checks validate documentation only; every feature acceptance result remains Pending.

## Limitations

No durability tests executed. Accepted T026, operational defaults, deletion policy and compatible client rollout are unresolved. A channel-layer publish does not prove device delivery.
