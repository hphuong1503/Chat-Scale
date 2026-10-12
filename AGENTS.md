# Working in ChatApp

- For feature work or behavior changes, read `docs/development-workflow.md`, then the relevant entry in `specs/README.md` and its spec, plan, tasks, and evidence. Establish acceptance criteria before editing application code.
- For architecture changes, read `docs/current-system.md` and the relevant `ADR/` documents. The roadmap describes future work; it is not evidence of implemented behavior.
- Run `make check PYTHON=<python-with-dependencies>` for backend or workflow changes. Record commands, results, and limitations in the affected spec's `evidence.md`.
- Mark a spec Implemented only when all acceptance criteria have passing evidence. Keep unresolved product decisions visible.
- For small fixes, add a regression criterion to the relevant spec; use the lightweight path in the workflow.
- Preserve existing uncommitted work. `chatapp/data/postgres/` contains database files already tracked by Git; do not run tests against, remove, or stage those files. Cleanup requires a separate backup and migration task.
- Frontend source is incomplete. Report frontend verification as blocked until T001 is resolved; do not edit generated bundles as source.
