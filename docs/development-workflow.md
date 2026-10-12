# Spec-driven development

## Authority

Code and baseline tests describe what exists. A Ready spec describes the target
behavior for a scoped change. `plan.md` explains how to build it; an Accepted ADR
records a consequential architecture decision. ROADMAP/TODO prioritize future
work. When they disagree, document the difference before implementation; never
silently treat a proposal as a deployed guarantee.

Keep requirement text in `spec.md`, design in `plan.md`, execution state in
`tasks.md`, and verification in `evidence.md`. Reference TODO task IDs rather than
copying the full backlog. User instructions and decisions in the current task
remain authoritative; record them in the relevant spec.

## Feature workflow

1. Read the registry and current-system baseline. Choose one independently
   verifiable behavior. Copy `specs/_template` to `specs/NNN-short-name` and add it
   to the registry. Completion: scope, owner/decision-maker, dependencies and
   acceptance IDs are recorded.
2. Write observable requirements, success/failure examples, contracts and
   exclusions. Resolve questions that change this feature's behavior. Completion:
   no blocking questions; spec status becomes Ready. Routine implementation
   choices can be made by the implementer within the authorized task. Ask the
   product owner only for consequential unresolved product choices.
3. Write the plan, acceptance-to-test mapping and small tasks. Include migrations,
   compatibility and rollback when needed. Completion: every criterion has a
   planned verification method and each task has an observable outcome.
4. Mark In progress. Add meaningful regression/acceptance tests and implement the
   change. Existing known bugs are gaps to fix, not requirements to preserve.
   Completion: required behavior and relevant checks pass.
5. Record commands, results, test names, manual evidence and limitations. Update
   the current-system baseline and ADRs when behavior/architecture changes.
   Completion: all acceptance criteria pass, tasks are checked, and status becomes
   Implemented. Link evidence in the PR and related TODO rows.

States: Draft → Ready → In progress → Implemented. Use Superseded with a link to
its replacement when a spec is retired. Amend the spec first when changing an
implemented contract, return it to In progress and reverify affected criteria.
An Implemented spec may still await remote CI/review; record that limitation and
require the remote checks before merging.

## Small changes

For a bug within an existing contract, add a regression criterion/test and evidence
to the owning spec; a separate spec is unnecessary. A bug with no owning spec gets
a small spec using the same template. Typo-only/documentation-only changes can use
a PR explanation plus `make spec-check` without a new feature spec.

## Verification

`make check PYTHON=.venv/bin/python` is the local entry point. `make spec-check`,
`make backend-check` and `make test` can run separately.

The spec checker enforces required documents/headings, valid states, unique AC IDs,
and an evidence mapping. It checks format, not truth or product completeness;
reviewers assess whether evidence actually proves the requirement.

Local tests default to SQLite, an in-memory channel layer and eager Celery. This
covers HTTP permissions/serialization and worker behavior, not PostgreSQL locking,
Redis delivery, real worker failure or cross-process WS fan-out.
GitHub CI runs the backend suite on disposable PostgreSQL. For PostgreSQL locally,
provision a separate test-only server, then set `CHATAPP_TEST_POSTGRES=1` and optional
`CHATAPP_TEST_DB_HOST`, `CHATAPP_TEST_DB_PORT`, `CHATAPP_TEST_DB_USER`,
`CHATAPP_TEST_DB_PASSWORD` before `make check`. Django creates/drops
`test_chatapp_ci`; use only a test server/account with CREATEDB permission.
Never point these variables to a development or production data server.

Feature plans must add real Redis/worker/WS or browser tests when their acceptance
criteria depend on those systems. Frontend E2E remains blocked on T001. Failure
of those tests cannot be replaced with a passing in-memory test.

## Merge gate

Use the PR template. Require the GitHub `check` job in repository branch protection
when hosting is configured; a workflow file alone does not enforce this setting.
A reviewer checks the spec/implementation/evidence agreement and relevant open
questions. Tests required by the feature must pass. Keep roadmap release gates
separate from this development gate.
