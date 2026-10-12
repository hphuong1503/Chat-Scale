# Specification registry

Start with [the workflow](../docs/development-workflow.md). Spec status lives in each
`spec.md`; the table lists purpose, not a duplicate status field.

| Spec | Purpose | Related backlog |
|---|---|---|
| [000-sdd-foundation](000-sdd-foundation/spec.md) | Workflow, isolated tests, CI and baseline | Partial T007/T008/T009 |
| [001-room-access](001-room-access/spec.md) | Send/read/connect authorization | T010/T011/T014; portions of T015/T024 |
| [002-room-lifecycle](002-room-lifecycle/spec.md) | Atomic room creation, DIRECT uniqueness and GROUP administration | T016/T018/T019; room subset of T024 |
| [003-message-contract](003-message-contract/spec.md) | Canonical REST/WS message DTO and client compatibility | T020/T021; message subset of T023 |
| [004-durable-message-delivery](004-durable-message-delivery/spec.md) | Committed acknowledgement, idempotency, outbox retry/replay | T026–T031; durability subset of T040 |
| [005-history-reconnect](005-history-reconnect/spec.md) | Ordered history, catch-up, optimistic reconciliation and reconnect | T032–T037/T039; reconnect subset of T040 |

Create a new numbered directory from [_template](_template/spec.md). Replace all
placeholders and map every acceptance ID in evidence.md. Keep one spec per coherent
behavior; do not convert every TODO row into a document.

## Execution order and decisions

The new specs are proposals, not implemented behavior. Read each spec's Open questions
before changing its status to Ready. Test mappings in their evidence files are planned
checks; Pending does not mean a test has been written or run.

1. Finish and verify 001 without treating local changes as a completed dependency.
2. Resolve 002 lifecycle policies; room administration and 003 backend DTO work can
   proceed independently after their own decisions and dependencies are satisfied.
3. Resolve the T026 decision and 003 backend contract before implementing 004. Align
   its membership-lock/deletion behavior with 002. Full 003 client acceptance depends
   on T001; this need not block backend design, but it blocks complete client rollout.
4. Implement 005 on verified 004 durable writes and the agreed T032 ordering policy.
   Browser recovery requires T001/T022, not just a backend test harness.

Each directory includes spec.md, plan.md, tasks.md and evidence.md. Those files own
requirements, implementation approach, work tracking and acceptance evidence respectively.
Do not mark entire TODO tasks complete when a spec covers only a listed subset.

## Remaining scope

These four specs do not cover the whole production roadmap. User API permissions
(T017), message mutation policy (remaining T015), login/refresh/logout (T012/T013),
active socket revocation (T038), production browser auth (T045), and frontend
restoration (T001) remain separate work. In particular, lifecycle and reconnect
completion do not resolve the active-socket security gate. Prioritize these gaps
alongside the sequence above before a public release.
