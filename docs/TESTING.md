# Verifying changes

Use the test DB described in DEVELOPMENT.md. At the time this document was written, `chat/tests.py` and `quickstart/tests.py` were placeholders; a green run with zero tests does not prove functional correctness.

| Change | Verification |
|---|---|
| Documentation | Links/source paths and commands match configuration; current behavior is distinguished from proposals |
| Serializer/API | Valid/invalid input, schema/status, authentication, permissions, UTF-8 payload |
| Permissions | Members/outsiders, MEMBER/ADMIN, direct IDs, relevant HTTP/WS paths |
| Model/migration | No missing migrations; existing data, constraints, and PostgreSQL concurrency |
| Celery | Test logic at the broker boundary; worker/Redis integration when claiming queue/retry/delivery behavior |
| Channels | Allowed/rejected connections, events/disconnects, permission loss/reconnect as required by the task |
| Frontend | Build from source, two users, optimistic updates/history/realtime, network failures/mobile |
| Deployment | Staging, readiness/shutdown, migrations/rollback, end-to-end load according to release gates |

Functional/permission bugs need regression tests. Mock network/broker boundaries when testing logic; verify real boundaries when required by the criteria. Eager mode does not prove that the queue works. SQLite does not prove PostgreSQL concurrency/locking behavior.

Start with the existing Django test runner. Do not assume pytest, pytest-django, or daphne is installed; add only the test dependencies needed for the corresponding tests.

## Core cases

- Send to an authorized room; outsiders cannot enqueue/save; invalid input does not write data.
- History respects membership/schema; pagination has no duplicates/gaps under the implemented contract.
- Admin/member permissions are correct; concurrent DIRECT creation produces no duplicates once T019 is implemented.
- Invalid/expired access/refresh tokens; logout/socket behavior follows policy.
- When implementing T026–T040: retry with the same ID, different payload with the same ID, lost response after commit, worker/Redis failure, duplicate events, late commits, and reconnect catch-up.

Test against the task's contract; do not change assertions to accept bugs or require outbox/201 for a task that has not implemented that architecture.

## Reporting

Record commands, environment, test counts/results, manual cases, checks not run, and reasons. Distinguish existing issues from regressions using evidence where possible. Expand verification when new changes/results require it.

`Test Results/` contains historical results that have not been reproduced; k6 currently measures HTTP enqueueing, and its custom success metric may include latency. Measure persistence/receipt/errors/backlog separately before drawing production conclusions.
