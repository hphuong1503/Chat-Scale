# Verification evidence

## Acceptance mapping

| Criterion | Planned test / evidence | Result |
|---|---|---|
| AC-001 | test_group_creation_atomic_and_deduplicated; invalid/inactive member and injected write-failure cases | Pending |
| AC-002 | test_room_admin_permission_matrix across update, delete, add, remove | Pending |
| AC-003 | test_group_admin_allowed_fields_and_membership_errors | Pending |
| AC-004 | test_last_admin_protected with separate DB connections and synchronized concurrent requests | Pending |
| AC-005 | test_direct_pair_concurrency on PostgreSQL; reverse-pair requests | Pending |
| AC-006 | test_direct_validation_and_unsupported_actions | Pending |
| AC-007 | test_group_delete_policy after Q1 is resolved; failure-injection rollback | Pending |
| AC-008 | migration fixtures for duplicate pairs, orphan groups and invalid member counts | Pending |

## Runs

2026-10-12: specification authored against the current source and TODO backlog.
No feature implementation or acceptance test run is claimed. Test names above are
planned identifiers/procedures, not existing passing tests.

Documentation validation (2026-10-12): `make spec-check PYTHON=env/bin/python`
passed (structure checker and six gate regression tests); `git diff --check` passed.
New spec links resolve, and all four document sets are written in English. These
checks validate documentation only; every feature acceptance result remains Pending.

## Limitations

No feature tests executed. Active socket revocation, user administration and message mutation authorization remain separate security work.
