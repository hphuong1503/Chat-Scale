# Verification evidence

## Acceptance mapping

| Criterion | Planned test / evidence | Result |
|---|---|---|
| AC-001 | test_ac001_canonical_message_fields_and_sender_privacy_history and test_ac001_canonical_message_fields_and_sender_privacy_list_and_detail in chat.tests_message_contract | Pass |
| AC-002 | test_ac002_saved_message_rest_ws_equivalence in chat.tests_message_contract | Pass |
| AC-003 | test_ac003_legacy_send_contract_unchanged in chat.tests_message_contract | Pass |
| AC-004 | test_ac004_legacy_unicode_and_timestamp_serialization in chat.tests_message_contract | Pass |
| AC-005 | test_ac005_legacy_read_aliases_pagination_and_permission_matrix in chat.tests_message_contract | Pass |
| AC-006 | frontend adapter tests in src/utils/messageHelpers.test.ts (normalizeMessage & mergeMessages) and ChatView component | Pass |
| AC-007 | test_ac007_utf8_and_json_body_boundaries in chat.tests_message_contract | Pass |

## Runs

2026-10-12: Complete verification passed via `make check PYTHON=env/bin/python`.
- `env/bin/python scripts/check_specs.py`: OK.
- `env/bin/python -m unittest discover -s scripts -p 'test_*.py'`: 6 tests passed.
- `env/bin/python chatapp/manage.py check --settings=chatapp.settings_test`: 0 issues.
- `env/bin/python chatapp/manage.py makemigrations --check --dry-run`: No changes detected.
- `env/bin/python chatapp/manage.py test chat quickstart --settings=chatapp.settings_test --noinput`: 61 tests passed (7 new acceptance tests in `chat.tests_message_contract`).
- Frontend checks:
  - `npm run typecheck`: OK (0 TypeScript errors).
  - `npm test`: 10 tests passed (including 4 new tests for `normalizeMessage` canonical DTO parsing, legacy fallback, WS wire event parsing, and repeated ID deduplication).
  - `npm run build`: built production bundles successfully in `dist/`.

## Limitations

This slice implements the canonical Message representation DTO across REST history/list/detail endpoints and WebSocket broadcast events, keeping backward-compatible aliases (`message`, `room`, `sender_id`). Persistence of `client_message_id`, client-driven idempotency, and transactional outbox reliability are explicitly deferred to Spec 005.

