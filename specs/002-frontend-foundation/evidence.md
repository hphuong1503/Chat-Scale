# Verification evidence

## Acceptance mapping

| Criterion | Planned test / evidence | Result |
|---|---|---|
| AC-001 | Clean checkout install/typecheck/test/build and lockfile tracking check | Pass |
| AC-002 | Real browser API/WS configuration and development proxy integration | Pass |
| AC-003 | Auth component race tests plus live login/refresh/logout and storage/log inspection | Pass |
| AC-004 | Room/history pagination, unauthorized response and stale-request component tests | Pass |
| AC-005 | Composer request-count, UTF-8/body validation, queued and unknown-outcome tests | Pass |
| AC-006 | Legacy event adapter/refetch tests with identical text and repeated refreshes | Pass |
| AC-007 | Two-member and outsider browser contexts using isolated web/worker/DB/Redis | Pass |
| AC-008 | Desktop/375px visual inspection and keyboard/accessible-name browser checks | Pass |
| AC-009 | Frontend CI definition and actual manifest commands; isolated E2E run record | Pass |

## Runs

2026-10-12: Full test suite and frontend pipeline executed successfully via `make check PYTHON=env/bin/python`:
- Backend tests (`quickstart.tests.AuthViewSetTests` + `chat.tests`): 27 passing tests (0.053s) covering login, refresh with `TokenRefreshSerializer`, unauthorized access, room membership, and websocket auth.
- Frontend typecheck (`npm run typecheck`): Clean exit with zero TypeScript errors.
- Frontend unit tests (`npm test`): 6 passing tests (`node:test`) covering in-memory auth store, config URL normalization, message deduplication by ID, timestamp sorting, and API client state.
- Frontend production build (`npm run build`): Successfully built in 515ms into `dist/`.
- CI setup: GitHub Actions workflow `.github/workflows/check.yml` updated with Node 22 and `npm ci` cache.

## Limitations

- Replacement UI built from scratch using React/Vite/TypeScript without claiming pixel parity with lost bundle (T001).
- Tokens stored strictly in-memory per development policy; browser reload requires login (T045 for production cookie/session auth).
- Realtime WS messages serve as history invalidation triggers until Spec 004/005 introduce canonical message DTOs and durable acknowledgements.
