# Implementation plan

## Approach

1. Audit frontend source, lockfile, Git history and bundle references. Record what
   can be recovered. Recover source first; if impossible and Q1 approves, build a
   replacement with the agreed React/Vite stack. Preserve evidence of the old bundle.
2. Establish package scripts, supported Node version, committed lockfile, env example,
   public config validation and HTTP/WS development proxy. Check .gitignore: it
   currently ignores package-lock.json; scope an exception for the frontend lockfile
   during implementation. Keep generated bundles and node_modules out of source.
3. Separate API/WS adapters, auth session, selected-room state and view components.
   Adapters describe current payloads explicitly so spec 004 can replace them later.
   Use cancellation or session/room generation checks on requests/socket callbacks.
4. Implement login, bounded single-flight refresh and local logout. Check the actual
   backend refresh path before building happy-path assumptions. Track any T012 fix
   separately and preserve CSRF/session semantics if the chosen client uses them.
5. Implement responsive room navigation, history pagination and composer. Reflect
   queued/unknown states faithfully; use realtime only to invalidate/refetch history.
   Preserve identical-content messages by persisted ID. Do not build future outbox,
   optimistic acknowledgement or catch-up guarantees into this foundation.
6. Add unit/component tests for auth concurrency, transport adapters, stale callbacks,
   pagination and send states, then browser integration with isolated seeded rooms.
   Add the frontend CI job once package scripts exist. Keep current backend CI intact.

## Verification

Use the AC mappings in evidence.md. Record exact install/typecheck/test/build commands
from the final manifest; proposed tools and scripts are not evidence of execution.
Prove clean builds in a disposable checkout without existing artifacts. Use fake time
and controlled transport responses for refresh/request-race unit tests.

Run two authenticated browser contexts plus an outsider against isolated PostgreSQL,
Redis, web and worker services. Verify POST 202 separately from subsequent saved
history. Test duplicate text, repeated events, room switches during requests, expired
access, refresh failure, offline send and logout while a socket is active. Real
refresh and WS integration are required even if component tests pass.

Check desktop/375px layouts, keyboard navigation, focus and accessible names. Inspect
storage and captured app logs for token leaks without printing tokens into evidence.
Record frontend CI commands and outcomes; remote CI not run remains explicit.

## Rollout and rollback

No backend schema migration is required. Start against the existing development
contract with seeded test users/rooms; do not publish automatically. Deploy only when
separately requested and the relevant production gates pass. Version the frontend
artifact with its source commit and retain the prior artifact for rollback; an old
bundle is not proof of compatibility with later spec 004/005 contract changes.
Keep config outside source secrets, and remove development query-token assumptions
when T045 is implemented. Later canonical DTO, durability and reconnect work extend
this frontend rather than requiring a second source-restoration effort.
