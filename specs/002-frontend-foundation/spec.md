# Frontend foundation and basic chat

Status: Draft
Owner: Frontend maintainer; requester resolves UI and recovery choices
Related tasks: T001/T022; frontend portions of T006/T007/T009/T012/T025/T055

## Intent

Provide maintainable frontend source that builds from a clean checkout and lets two
existing users sign in, open an authorized room, read history, send messages and
observe live updates against the current backend.

## Scope

Recover or rebuild the React/Vite application, configure API/WS URLs, implement the
login/chat shell and current-contract adapters, and add frontend verification/CI.
Use existing accounts and seeded rooms. Include a responsive room list, message
history, composer, connection status and loading/empty/error states.

Dependency: [001-room-access](../001-room-access/spec.md) must be verified for real
backend acceptance. Source recovery/build can proceed independently. This spec uses
the existing queued 202 contract and does not depend on later DTO/outbox specs.

Exclude account registration, user search, room creation/administration (T041 and
spec 003 follow-up UI), attachments, receipts/unread/presence, reliable reconnect,
server logout/revocation, production browser-auth design, and publishing a site.
Spec [004-message-contract](../004-message-contract/spec.md) owns canonical sender
and timestamp integration; [005-durable-message-delivery](../005-durable-message-delivery/spec.md)
owns durable acknowledgement; [006-history-reconnect](../006-history-reconnect/spec.md)
owns optimistic reconciliation, idempotent retry and gap-free catch-up.

## Contract

### Source and reproducible development

Inspect Git history and available source before rebuilding. Restore a verifiable
source snapshot when possible. If none exists, record that finding and implement
an explicit replacement; do not claim source recovery or pixel parity from a bundle.
Keep source under frontend/, with package.json, committed lockfile, build config,
.env.example, tests and documented supported Node version. No generated bundle edits.

Proposed baseline: React/Vite with TypeScript if rebuilding. If recoverable source
uses JavaScript, preserve it unless migration has a stated benefit. The package must
provide dev, build, typecheck and test scripts (typecheck may use checked JavaScript
when recovering JS source). A clean dependency install and build must succeed without
existing node_modules/dist, local absolute paths or secret files. Record actual
commands and tool versions after inspecting/reconstructing the manifest.

### Configuration and authentication

Use documented public API and WS base URLs, for example VITE_API_BASE_URL and
VITE_WS_BASE_URL. Fail visibly when required configuration is invalid. These variables
contain public endpoints only; no passwords/signing keys. Use a Vite development
proxy or an explicitly configured backend origin policy, and test the real browser
connection. Proxying must support both HTTP and WebSocket upgrade.

Login POST /auth/login/ uses username/password and returns access, refresh and user.
Proposed development session policy: keep tokens in memory; reload requires login.
Never write tokens into logs, analytics, localStorage or error UI. Logout clears
session/room state and closes sockets; it does not claim server-side token revocation.

Coordinate a single refresh request when access expires. Retry a read once after a
successful refresh; refresh failure returns to login with an explanation and stops
reconnect attempts. A mutation explicitly rejected with 401 can be retried once after
refresh, but never automatically retry a send after a timeout/network error/5xx whose
outcome may be unknown. Verify the current /auth/refresh/ endpoint: a backend defect
is a T012 blocker, not something to hide with frontend mocks or a bypass.

### Navigation, history and send

GET /rooms/ supplies paginated authorized rooms. Room selection loads
GET /rooms/{id}/messages/?page=N; render oldest to newest within loaded history and
allow loading older pages. Avoid duplicates using persisted message IDs. Page-number
pagination under concurrent writes is not a gap-free guarantee. Cancel or discard
stale responses after room/account changes. A 404 removes inaccessible room content;
an empty list/history is a normal state, not an error.

POST /messages/ sends the current {message, room} payload. Disable duplicate submit
while that request is in flight; reject blank input and show backend validation
errors. Respect UTF-8 content and total JSON-body limits; do not assume character
count equals byte count. A 202 shows “Queued”; it does not mean saved/delivered/read.
On an unknown outcome show “Send status unknown—check history before resending”.
Manual resending can duplicate a message until spec 005; explain this at the action.

Current history has id/message/room/created_at but no sender field. Do not infer
sender from content, timestamps or the active user. Display neutral attribution
when absent. Use actual stored timestamps only. Never manufacture persistence IDs.

### Realtime under the current contract

Connect to /ws/chat/{room_id}/?token=<access> using the configured WS base URL.
Query-token auth is the existing development contract; T045 will replace it for
production. Keep full token-bearing URLs out of logs. One socket belongs to the
selected room/session; close it on selection change/logout and ignore late callbacks.

Current events contain message/sender_id/room_id but no persisted message ID/time.
Treat them as a signal to refetch the latest history page, not as canonical message
rows or evidence that a particular optimistic send succeeded. Replace refreshed
pages by server results and deduplicate persisted IDs; do not append an unidentifiable
event alongside history. Do not deduplicate by text, since distinct sends may match.

Show connecting/connected/disconnected states and offer reconnect/refresh. On
reconnection refresh recent history. This slice does not promise recovery beyond
loaded pages, exactly-once rendering across all races or silent event-loss detection;
those guarantees belong to spec 006. Coalesce event-triggered reads and prevent stale
room responses from overwriting the selected room.

### UI baseline

At desktop widths show a room list beside the conversation. At a 375px viewport use
one pane at a time with a labeled back action. Login and composer have visible labels,
keyboard operation and clear focus. Announce errors/connection changes without
moving focus unexpectedly. Include loading, empty, unauthorized and offline states.
Preserve draft text on a failed send while remaining within the same account/room;
clear account-scoped state on logout. No attachments, admin controls or unavailable
server capabilities are presented as working features.

## Acceptance criteria

- AC-001: A clean checkout can install dependencies, typecheck, test and build the frontend using documented commands and a committed lockfile; no existing artifacts or private env files are required.
- AC-002: API/WS endpoints come from public configuration, and a real browser reaches both through the documented proxy/origin setup without hardcoded localhost assumptions.
- AC-003: Valid login opens the chat shell, invalid login shows a controlled error, refresh is single-flight and bounded, and logout clears tokens/state and closes sockets; tokens never appear in app logs or persistent browser storage.
- AC-004: Room list/history show only backend-authorized data, support existing pagination and empty/error states, and discard stale responses after room/account switches.
- AC-005: Valid submit sends the current payload once while pending and shows Queued for 202; invalid input, 401/404 and unknown outcomes have distinct behavior with no automatic ambiguous resend.
- AC-006: An event causes authoritative history refresh without synthesizing IDs/senders; two distinct messages with identical content remain distinct persisted rows and repeated refreshes do not append copies.
- AC-007: Two authenticated browser contexts in a seeded shared room can exchange messages with worker/Redis running; an outsider cannot open that room, and switching/logout stops old socket updates.
- AC-008: The login/list/history/composer work at desktop and 375px widths with keyboard focus, labels, loading/empty/error/offline states and no horizontal overflow.
- AC-009: CI installs from the lockfile and runs frontend checks/build; isolated browser integration evidence is recorded separately, including backend auth blockers and current-contract limitations.

## Open questions

- Q1 — Requester/frontend (blocking): confirm recovery of available source versus a
  replacement React/Vite UI when history cannot recover the app. Record provenance;
  replacement delivery must not mark T001's existing-interface parity as proven.
- Q2 — Requester (blocking): approve the scoped UI using existing accounts/rooms,
  neutral sender attribution and no room-creation/admin controls in this slice.
- Q3 — Requester/backend (blocking): approve the development-only memory session
  policy and reload-to-login behavior; production auth remains T045.
- Q4 — Backend (execution blocker): prove login/refresh against actual endpoints
  under T012. Open a scoped backend fix if refresh is broken; do not close AC-003
  from mocked responses alone.

After Q1–Q3 are resolved, mark Ready. Backend integration criteria remain pending
until Q4 and spec 001 are verified. This document does not authorize deployment.
