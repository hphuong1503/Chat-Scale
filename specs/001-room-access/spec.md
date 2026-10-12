# Room message access

Status: Implemented
Owner: Backend maintainer; requester resolves product changes
Related tasks: T010/T011/T014; read subset of T015 and test subset of T024

## Intent

A user may send/read room messages and connect to its live stream only while an
eligible authenticated member at the time of the operation/connection.

## Scope

POST /messages/, GET /messages/ and /messages/{id}/, GET /rooms/{id}/messages/,
and initial WS connection. Fix send logging and use DRF's authenticated user.
Exclude room administration, message mutation policy, active socket revocation,
outbox, idempotency, DTO redesign and frontend changes. Those remain open backlog.

## Contract

- Authentication: DRF JWT for HTTP; current query JWT for WS. Sender comes from
  request.user. Preserve valid session authentication when provided by DRF.
- Send input: existing message and room fields; a client-provided sender cannot
  override the authenticated identity. Preserve existing validation for content.
- Existing member + valid input: enqueue once per request; return 202 and
  `{"status":"Message creation queued"}`. This acknowledges enqueue, not persistence.
- Anonymous HTTP request: 401 with configured JWT-first authentication.
- Authenticated nonmember or nonexistent room UUID: 404; no task enqueue/DB write.
  Malformed UUID/content remains 400 under serializer validation.
- Room history: members receive existing paginated message schema; outsiders 404.
- Message list/detail retain sender filtering AND require current room membership.
  Thus this slice does not turn /messages/ into shared room history. Legacy null-room
  messages are excluded. Use /rooms/{id}/messages/ for other members' messages.
- WS: anonymous/invalid JWT/nonmembers rejected before accept; a member can connect.
  Do not promise revocation of a socket after connect (T038).

## Acceptance criteria

- AC-001: Anonymous send returns 401 without enqueue or creating a message.
- AC-002: A member's valid send returns 202 and enqueues authenticated sender/content/room exactly once, even if input supplies another sender.
- AC-003: A nonmember or nonexistent room request returns 404 with no enqueue or message creation.
- AC-004: Member history returns room messages; outsiders receive 404 and anonymous callers receive 401.
- AC-005: A former member cannot list/retrieve their own messages from that room; legacy null-room messages are not exposed.
- AC-006: WS allows a valid member and rejects anonymous, invalid-token and nonmember connections before acceptance.
- AC-007: Malformed room UUID or invalid message returns 400 without enqueue.

## Open questions

None blocking this slice. The 404 convention follows existing room history.
Queued 202 remains until a separate durability decision. Mutation policies and
revocation are explicitly outside this slice and must not be reported as resolved.
