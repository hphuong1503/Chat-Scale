# Room creation and administration

Status: Implemented
Owner: Backend maintainer; product owner resolves lifecycle policies
Related tasks: T016/T018/T019; room subset of T024; T003 decisions

## Intent

Create complete rooms atomically, reuse one DIRECT room per user pair, and allow
only authorized administrators to change GROUP rooms and memberships.

## Scope

Room create/list/detail/update/delete and GROUP membership add/remove. Preserve
spec 001's read/send/connect permissions. Exclude user administration (T017), role
transfer/promotion, account deletion, message edit/delete, active socket revocation
(T038), and frontend restoration. This does not complete the full T024 matrix.

Implementation dependency: [001-room-access](../001-room-access/spec.md) verified.
All policies below are proposed until the open questions are resolved.

## Contract

### Current behavior

Room creation writes rows separately; GROUP creation silently skips invalid users.
DIRECT lookup has no database uniqueness guarantee. Membership actions check ADMIN,
but inherited room update/delete actions do not. Room deletion cascades to messages.

### Proposed authorization and responses

Authenticate before room lookup. Missing/invalid authentication returns 401;
nonmembers and unknown valid room IDs return 404; a current MEMBER attempting GROUP
administration receives 403. Malformed input returns 400. Denied requests have no
write side effects. Use existing JWT/session handling and CSRF protection.

| Operation | Proposed behavior |
|---|---|
| Create GROUP | Any active authenticated user; creator becomes ADMIN |
| Read room/members | Current members only |
| PATCH/PUT GROUP | ADMIN only; only name/description may change |
| Add/remove GROUP member | ADMIN only; additions always receive MEMBER |
| Change room_type/created_by/id/role through payload | 400; no partial mutation |
| Delete GROUP | ADMIN only; proposed 204 with existing cascade semantics, pending product approval |
| Modify DIRECT metadata/members or delete DIRECT | 405 for all authenticated callers; unsupported in this slice |

Creating a GROUP returns 201 with the existing room response. The members field,
when supplied, must be a list of valid active user IDs. Deduplicate repeated IDs
and the creator ID. Any invalid/inactive target returns 400 and rolls back the
entire room and membership set. No silently omitted members.

Adding a member returns the existing 200 status response. Re-adding an existing
member returns 400; removing a missing member returns 404. Removing the last ADMIN,
including self-removal, returns 409 with code `last_admin`. Serialize concurrent
administrative mutations so two removals cannot leave an existing room without an
ADMIN. No role-changing endpoint is introduced.

Creating DIRECT requires an active target other than the caller (proposed self-chat
rejection: 400). An unordered user pair has at most one DIRECT room. First creation
returns 201; subsequent or concurrent requests return 200 with that same room ID,
including requests with the user order reversed. Exactly two MEMBER rows exist.
Neither create endpoint accepts caller-controlled creator/role values.

### Existing data

Audit duplicate DIRECT pairs, malformed DIRECT memberships and GROUPs without an
ADMIN before adding constraints. Stop migration with an actionable report when
ambiguous rows exist. Do not automatically discard rooms, merge histories, or invent
an administrator. Remediation requires a recorded decision and a backup.

## Acceptance criteria

- AC-001: An authenticated GROUP creator receives 201 with one ADMIN membership and the complete deduplicated valid member set; any invalid member rolls back all new rows.
- AC-002: Anonymous callers receive 401, outsiders 404, and GROUP MEMBER callers 403 for admin operations; room/membership/message counts and contents remain unchanged.
- AC-003: An ADMIN can update allowed GROUP fields and add/remove MEMBER users; protected fields and duplicate/missing targets return the documented errors without partial writes.
- AC-004: Last-ADMIN removal returns 409; concurrent admin removals preserve at least one ADMIN on PostgreSQL.
- AC-005: Concurrent DIRECT creation by either user returns one room ID with exactly two members, with one 201 and all other successful calls 200.
- AC-006: Self-chat and invalid/inactive targets return 400 without creating rooms; DIRECT mutations return 405.
- AC-007: The approved GROUP deletion policy is enforced; under the proposed cascade policy only ADMIN deletion returns 204 and removes the room, memberships and messages atomically.
- AC-008: Migration preflight detects ambiguous legacy data and leaves it intact; clean data migrates and database uniqueness rejects duplicate DIRECT pairs.

## Open questions

- Q1 (Resolved): ADMIN hard deletion with cascade is approved (returns 204 No Content).
- Q2 (Resolved): Self-chat rejection (400) and no DIRECT mutation/deletion (405) are approved.
- Q3 (Resolved): Last-ADMIN protection returning 409 (`code: last_admin`) is approved. No role transfer endpoint in this slice.
- Q4 (Resolved): Preflight database audit conducted: 0 legacy DIRECT rooms found, all existing groups have an active ADMIN. Schema migration proceeds cleanly.

