# Specification registry

Start with [the workflow](../docs/development-workflow.md). Spec status lives in each
`spec.md`; the table lists purpose, not a duplicate status field.

| Spec | Purpose | Related backlog |
|---|---|---|
| [000-sdd-foundation](000-sdd-foundation/spec.md) | Workflow, isolated tests, CI and baseline | Partial T007/T008/T009 |
| [001-room-access](001-room-access/spec.md) | Send/read/connect authorization | T010/T011/T014; portions of T015/T024 |
| [002-frontend-foundation](002-frontend-foundation/spec.md) | Recover/build frontend source and basic authenticated chat UI | T001/T022; frontend portions of T006/T007/T009/T012/T025/T055 |
| [003-room-lifecycle](003-room-lifecycle/spec.md) | Atomic room creation, DIRECT uniqueness and GROUP administration | T016/T018/T019; room subset of T024 |
| [004-message-contract](004-message-contract/spec.md) | Canonical REST/WS message DTO and client compatibility | T020/T021; message subset of T023 |
| [005-durable-message-delivery](005-durable-message-delivery/spec.md) | Committed acknowledgement, idempotency, outbox retry/replay | T026–T031; durability subset of T040 |
| [006-history-reconnect](006-history-reconnect/spec.md) | Ordered history, catch-up, optimistic reconciliation and reconnect | T032–T037/T039; reconnect subset of T040 |

Create a new numbered directory from [_template](_template/spec.md). Replace all
placeholders and map every acceptance ID in evidence.md. Keep one spec per coherent
behavior; do not convert every TODO row into a document.

## Execution order and decisions

The new specs are proposals, not implemented behavior. Read each spec's Open questions
before changing its status to Ready. Test mappings in their evidence files are planned
checks; Pending does not mean a test has been written or run.

1. Finish and verify 001 without treating local changes as a completed dependency.
2. Resolve 002's recovery/UI/session choices and implement the basic frontend against
   the current 202 contract. It does not wait for 004/005/006; real integration requires
   verified 001 and working T012 auth endpoints.
3. Resolve 003 lifecycle policies; room administration and 004 backend DTO work can
   proceed independently after their own decisions and dependencies are satisfied.
4. Resolve the T026 decision and 004 backend contract before implementing 005. Align
   its membership-lock/deletion behavior with 003. Full 004 client acceptance depends
   on the frontend from 002; this need not block backend design, but it blocks complete
   client rollout. Extend that frontend instead of repeating source restoration.
5. Implement 006 on verified 005 durable writes and the agreed T032 ordering policy.
   Browser recovery extends 002's basic client; a backend test harness is insufficient.

Each directory includes spec.md, plan.md, tasks.md and evidence.md. Those files own
requirements, implementation approach, work tracking and acceptance evidence respectively.
Do not mark entire TODO tasks complete when a spec covers only a listed subset.

## Remaining scope

These specs do not cover the whole production roadmap. User API permissions
(T017), message mutation policy (remaining T015), backend login/refresh fixes and
server logout policy (remaining T012/T013), active socket revocation (T038), and
production browser auth (T045) remain separate work. Frontend restoration and basic
auth integration are now tracked in 002; full T025/T055 acceptance extends beyond
its explicitly scoped baseline. In particular, lifecycle and reconnect
completion do not resolve the active-socket security gate. Prioritize these gaps
alongside the sequence above before a public release.
