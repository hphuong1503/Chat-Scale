# Verification evidence

## Acceptance mapping

| Criterion | Planned test / evidence | Result |
|---|---|---|
| AC-001 | test_canonical_message_fields_and_sender_privacy for each read endpoint | Pending |
| AC-002 | test_saved_message_rest_ws_equivalence using worker plus routed consumer | Pending |
| AC-003 | test_legacy_send_contract_unchanged including spec 001 regressions | Pending |
| AC-004 | test_legacy_unicode_and_timestamp_serialization | Pending |
| AC-005 | test_legacy_read_aliases_pagination_and_permission_matrix | Pending |
| AC-006 | frontend adapter tests and two-user browser scenario after T001 | Pending |
| AC-007 | test_utf8_and_json_body_boundaries with exact encoded byte counts | Pending |

## Runs

2026-10-12: specification authored against the current source and TODO backlog.
No feature implementation or acceptance test run is claimed. Test names above are
planned identifiers/procedures, not existing passing tests.

Documentation validation (2026-10-12): `make spec-check PYTHON=env/bin/python`
passed (structure checker and six gate regression tests); `git diff --check` passed.
New spec links resolve, and all four document sets are written in English. These
checks validate documentation only; every feature acceptance result remains Pending.

## Limitations

No contract or client tests executed. T001 blocks frontend acceptance. This DTO work does not prove outbox durability or realtime delivery.
