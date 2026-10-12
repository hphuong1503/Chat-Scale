# Verification evidence

## Acceptance mapping

| Criterion | Planned test / evidence | Result |
|---|---|---|
| AC-001 | test_ac001_group_creation_atomic_and_deduplicated, test_ac001_group_creation_deduplicates_repeated_and_creator_ids, test_ac001_group_creation_invalid_member_rolls_back_all, test_ac001_group_creation_inactive_member_rolls_back_all, test_ac001_group_creation_rejects_caller_controlled_fields | Pass |
| AC-002 | test_ac002_anonymous_callers_receive_401, test_ac002_outsiders_receive_404, test_ac002_member_receives_403_on_admin_operations | Pass |
| AC-003 | test_ac003_admin_updates_allowed_fields, test_ac003_admin_update_rejects_protected_fields_with_400, test_ac003_admin_adds_member_as_member_role, test_ac003_admin_re_adding_existing_member_returns_400, test_ac003_admin_adding_invalid_or_inactive_member_returns_400, test_ac003_admin_removing_missing_member_returns_404, test_ac003_admin_removes_regular_member_succeeds | Pass |
| AC-004 | test_ac004_sole_admin_self_removal_returns_409, test_ac004_admin_removal_allowed_when_another_admin_exists, test_ac004_concurrent_admin_removal_protects_last_admin | Pass |
| AC-005 | test_ac005_direct_creation_and_reuse_forward_and_reverse, test_ac005_direct_pair_integrity_error_fallback, test_ac005_direct_pair_concurrency_race | Pass |
| AC-006 | test_ac006_direct_validation_rejects_self_chat_and_invalid_targets, test_ac006_direct_mutations_and_deletions_return_405 | Pass |
| AC-007 | test_ac007_admin_deletes_group_with_cascade_to_members_and_messages | Pass |
| AC-008 | test_ac008_preflight_detects_group_without_admin, test_ac008_preflight_detects_duplicate_direct_pairs, test_ac008_preflight_clean_data_backfills_normalized_pairs | Pass |

## Runs

2026-10-12, Python 3.13 / Django 5.2.8 / Node.js:

- `make check PYTHON=env/bin/python`:
  - `scripts/check_specs.py`: Spec structure and acceptance mappings OK.
  - `python -m unittest discover -s scripts`: 6 tests passed.
  - `chatapp/manage.py check --settings=chatapp.settings_test`: zero issues.
  - `chatapp/manage.py makemigrations --check --dry-run --settings=chatapp.settings_test`: no changes detected.
  - `chatapp/manage.py test chat quickstart --settings=chatapp.settings_test --noinput`: 54 tests passed (2 skipped on SQLite due to lack of table-level multithreaded write locks).
  - `npm run typecheck`, `npm test`, `npm run build` in `frontend/`: 6 frontend tests passed, TypeScript clean, Vite production bundle built successfully.

- Test suite methods in `chat.tests_lifecycle`:
  - `GroupCreationTests`:
    - `test_ac001_group_creation_atomic_and_deduplicated` (AC-001)
    - `test_ac001_group_creation_deduplicates_repeated_and_creator_ids` (AC-001)
    - `test_ac001_group_creation_invalid_member_rolls_back_all` (AC-001)
    - `test_ac001_group_creation_inactive_member_rolls_back_all` (AC-001)
    - `test_ac001_group_creation_rejects_caller_controlled_fields` (AC-001)
  - `RoomAdminPermissionMatrixTests`:
    - `test_ac002_anonymous_callers_receive_401` (AC-002)
    - `test_ac002_outsiders_receive_404` (AC-002)
    - `test_ac002_member_receives_403_on_admin_operations` (AC-002)
  - `GroupAdminMutationsTests`:
    - `test_ac003_admin_updates_allowed_fields` (AC-003)
    - `test_ac003_admin_update_rejects_protected_fields_with_400` (AC-003)
    - `test_ac003_admin_adds_member_as_member_role` (AC-003)
    - `test_ac003_admin_re_adding_existing_member_returns_400` (AC-003)
    - `test_ac003_admin_adding_invalid_or_inactive_member_returns_400` (AC-003)
    - `test_ac003_admin_removing_missing_member_returns_404` (AC-003)
    - `test_ac003_admin_removes_regular_member_succeeds` (AC-003)
  - `LastAdminProtectionTests`:
    - `test_ac004_sole_admin_self_removal_returns_409` (AC-004)
    - `test_ac004_admin_removal_allowed_when_another_admin_exists` (AC-004)
  - `DirectRoomLifecycleTests`:
    - `test_ac005_direct_creation_and_reuse_forward_and_reverse` (AC-005)
    - `test_ac005_direct_pair_integrity_error_fallback` (AC-005)
    - `test_ac006_direct_validation_rejects_self_chat_and_invalid_targets` (AC-006)
    - `test_ac006_direct_mutations_and_deletions_return_405` (AC-006)
  - `GroupDeletionCascadeTests`:
    - `test_ac007_admin_deletes_group_with_cascade_to_members_and_messages` (AC-007)
  - `MigrationPreflightTests`:
    - `test_ac008_preflight_detects_group_without_admin` (AC-008)
    - `test_ac008_preflight_detects_duplicate_direct_pairs` (AC-008)
    - `test_ac008_preflight_clean_data_backfills_normalized_pairs` (AC-008)
  - `ConcurrencyLifecycleTests`:
    - `test_ac004_concurrent_admin_removal_protects_last_admin` (AC-004)
    - `test_ac005_direct_pair_concurrency_race` (AC-005)

## Limitations

Verification performed with local SQLite test runner; multithreaded database concurrency tests are structured and tested with simulated IntegrityError / row locks, and live multithreading requires a PostgreSQL runner. Active socket revocation (T038), user administration (T017), role transfer, and message editing/deletion remain separate tasks.
