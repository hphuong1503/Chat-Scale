# SDD foundation

Status: Implemented
Owner: Repository maintainer
Related tasks: T007/T008/T009 (backend subset only)

## Intent

Make a scoped backend change follow an explicit contract with repeatable verification.

## Scope

Workflow, templates, baseline, test configuration, regression tests and CI definition.
Application behavior, frontend restoration, production deployment and DB Git cleanup
are outside this change.

## Contract

`make check` from repository root validates specs, Django configuration/migrations
and backend tests. Local checks use isolated in-memory services; remote CI uses
its own PostgreSQL. A feature's Ready status is distinct from Implemented.

## Acceptance criteria

- AC-001: A contributor can find the workflow, template, registry, baseline and next scoped spec from Readme.md.
- AC-002: The spec checker rejects incomplete specs, invalid states and missing acceptance mappings.
- AC-003: Backend checks and non-empty regression tests pass using isolated local settings.
- AC-004: A CI definition runs the same entry point with disposable PostgreSQL, and the PR template requires spec/evidence links.
- AC-005: Spec 001 defines observable permission outcomes, planned tests and honest pending evidence.

## Open questions

None for this foundation. Remote CI execution and frontend verification are separate
limitations, not assertions made by these criteria.
