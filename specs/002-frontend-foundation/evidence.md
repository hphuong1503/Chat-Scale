# Verification evidence

## Acceptance mapping

| Criterion | Planned test / evidence | Result |
|---|---|---|
| AC-001 | Clean checkout install/typecheck/test/build and lockfile tracking check | Pending |
| AC-002 | Real browser API/WS configuration and development proxy integration | Pending |
| AC-003 | Auth component race tests plus live login/refresh/logout and storage/log inspection | Pending |
| AC-004 | Room/history pagination, unauthorized response and stale-request component tests | Pending |
| AC-005 | Composer request-count, UTF-8/body validation, queued and unknown-outcome tests | Pending |
| AC-006 | Legacy event adapter/refetch tests with identical text and repeated refreshes | Pending |
| AC-007 | Two-member and outsider browser contexts using isolated web/worker/DB/Redis | Pending |
| AC-008 | Desktop/375px visual inspection and keyboard/accessible-name browser checks | Pending |
| AC-009 | Frontend CI definition and actual manifest commands; isolated E2E run record | Pending |

## Runs

2026-10-12: spec authored from current repository scope. No frontend implementation,
build or acceptance test is claimed. Planned checks above are not existing tests.
Documentation validation: `make spec-check PYTHON=env/bin/python` passed
(structure check plus six validator tests); `git diff --check` passed. All document
links resolve and no obsolete spec paths remain after renumbering. These are
document checks, not evidence of frontend acceptance.

## Limitations

Source recovery/replacement, UI scope and session policy await decisions. Actual
refresh behavior must be verified under T012. The current message contract lacks
sender in history and persisted identity in WS events. This spec deliberately does
not claim canonical attribution, durable acknowledgement, gap-free reconnect or
production auth. A replacement does not prove the original interface was recovered.
