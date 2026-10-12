# Task workflow

## 1. Define scope

Read the request, task row, and dependencies in TODO. Record behavior before/after, acceptance criteria, expected files, and checks using TASK_TEMPLATE when needed. Dependencies require code/test or handoff evidence; site checkboxes are insufficient. Work on independent parts when information is missing; ask about decisions that materially change scope/behavior and cannot be inferred from the request.

## 2. Follow the source flow

Use ARCHITECTURE to trace from the boundary to the DB/event. Read KNOWN_ISSUES when touching the relevant area. Identify affected callers/clients and migrations before changing contracts/schemas. Reading the entire repository for every task is unnecessary.

## 3. Implement and verify

Make changes small enough to stay within scope while completing the task. Functional/permission bugs need regression tests demonstrating before/after behavior when the environment permits. Run the checks in TESTING on isolated data. Changes to message writes/auth/ordering need a documented decision, Proposed/Accepted status, and a transition plan; do not mark an unresolved decision Accepted.

Finish only when every criterion has evidence. If runtime/source/dependencies are missing, record blocked and completed portions; source inspection does not replace acceptance criteria requiring actual execution.

## 4. Documentation and progress

- ARCHITECTURE: update current flows/models/contracts.
- DEVELOPMENT/TESTING: update commands and verification procedures as they change.
- KNOWN_ISSUES: remove issues from the open list once resolution is supported by evidence.
- TODO: record assignee, status, PR/tests/blockers in the tracking table; mark complete only after acceptance. ROADMAP is a plan, not a task log.

### Roadmap site caveat

The generator currently parses only `| [ ] **` and asserts 101 items. Marking `[x]` in the TODO task list makes the generator skip the task and fail.

1. Progress-only tasks: record status/evidence in the tracking table and leave task-list checkboxes unchanged.
2. Tasks requesting `[x]` or site synchronization: update the parser to accept both states and verify that all tasks are included before changing checkboxes/rebuilding.

Site localStorage does not sync TODO. The generator/template also hardcode counts; adding/removing tasks requires updating assumptions. Site source is template.html + generate.py; dist is output. Rebuilding requires ROADMAP/TODO from the parent repository; the site's Git source contains only the child project. Do not publish the site as a side effect of backend changes.

## 5. Handoff

Review diffs for edited files, excluding out-of-scope changes and secrets. New branches default to `codex/`; commit/push/create PRs as requested. Report results, files, checks, limitations, and task IDs. One small task/test suite is insufficient to declare production readiness.
