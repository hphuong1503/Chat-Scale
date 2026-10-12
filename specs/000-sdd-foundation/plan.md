# Implementation plan

## Approach

Add lightweight Markdown documents and AGENTS.md routing. Provide Make targets and a
stdlib-only structural validator. Keep application behavior unchanged. Override test
settings with an isolated DB, in-memory Channels and eager Celery. Add baseline HTTP
JWT permissions and worker tests. Define a PostgreSQL-backed GitHub Actions job.

## Verification

AC-001/004/005: inspect document links, workflow and PR template.
AC-002: run validator against repository and malformed temporary fixtures.
AC-003: run make check with installed Python 3.13 dependencies.
Record exact results and runtime limitations in evidence.md.

## Rollout and rollback

No data migration. New tests/docs/workflow can be reverted independently. Preserve
existing database changes and untracked roadmap/site work. Do not mark the broader
T007/T008/T009 tasks complete: frontend and full service checks are still missing.
