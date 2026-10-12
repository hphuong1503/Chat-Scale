# Gaps identified in source

As of 2026-10-12; the stack was not run when this document was written. Reread source before making fixes; use TODO to track acceptance, not as authorization to implement the entire table.

| Area | Evidence / impact | Task |
|---|---|---|
| Refresh | Resolved in Spec 002: TokenRefreshSerializer handles DRF Request cleanly with regression tests | T012 (Verified) |
| Message CRUD | Queryset filtered by sender; room/edit/delete policies need an audit | T015 |
| Room CRUD | Update/destroy do not check ADMIN | T016 |
| User CRUD | Unrestricted queryset, only IsAuthenticated, serializer includes groups | T017 |
| Room creation | No encompassing transaction or unique DIRECT pair | T018,T019 |
| DTO | Sender HiddenField; WS lacks ID/time | T020,T021 |
| Frontend | Resolved in Spec 002: Rebuilt clean React/Vite/TS source with auth, UI, and test suite | T001,T022 (Verified) |
| Durability | 202 enqueue, task writes DB then calls group_send separately; no outbox/idempotency | T026–T031 |
| History | Page number/-created_at; no cursor/catch-up | T032–T037 |
| Socket | Membership checked only at connection time | T038 |
| Production | DEBUG/host/secret/dev reload and storage configured for local use | T057–T066 |
| Tests | Django placeholders; k6 does not prove persistence/delivery | T024,T025,T040,T076–T079 |
| Git/data | DB has tracked/dirty files; ignore /data/postgres does not cover chatapp/data/postgres | T005 |
| Site | Parser handles only empty checkboxes, hardcoded count, localStorage does not sync Markdown | Site task when requested |

After fixing an issue, update current-state documentation and evidence in TODO; do not leave resolved issues marked as open.
