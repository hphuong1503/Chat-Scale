# Verification evidence

## Acceptance mapping

| Criterion | Test / evidence | Result |
|---|---|---|
| AC-001 | Readme links, workflow and registry review | Pass |
| AC-002 | scripts/check_specs.py plus malformed-fixture checks | Pass |
| AC-003 | make check; RoomHistoryBaselineTests (five tests) | Pass |
| AC-004 | .github/workflows/check.yml and pull_request_template.md review | Pass |
| AC-005 | specs/001-room-access document review | Pass |

## Runs

2026-10-12, local Python 3.13 / Django 5.2.8:

- `make check PYTHON=env/bin/python`: spec structure passes, Django system check
  reports zero issues, migration check reports no changes, five backend tests pass.
- `env/bin/python -m unittest discover -s scripts -p 'test_*.py'`: six spec-gate
  regression tests pass, covering valid input, invalid state, duplicate AC ID,
  missing mapping, missing plan, and premature Implemented status.
- Local Markdown link inspection: all links in 23 entry/workflow/spec documents
  resolve. Reviewed CI PostgreSQL service, test settings selection and PR template.
- `git diff --check`: passed.

Backend methods in `chat.tests.RoomHistoryBaselineTests`:
`test_member_reads_room_history`, `test_outsider_cannot_read_room_history`,
`test_anonymous_cannot_read_room_history`,
`test_room_listing_excludes_other_users_rooms`,
`test_worker_persists_and_broadcasts_message`.

The test run emits an existing `UnorderedObjectListWarning` for Room pagination.
The access-isolation test passes, but stable room-list ordering is not established
by this foundation and remains follow-up work.

## Limitations

GitHub Actions has not run remotely. Local SQLite does not prove PostgreSQL-specific
behavior. In-memory Channels and a mocked broadcast do not prove Redis/WS delivery.
The existing send-path defects are not fixed by baseline tests. Frontend restoration
and branch-protection configuration remain separate work.
