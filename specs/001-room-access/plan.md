# Implementation plan

## Approach

1. Preserve and extend baseline tests. Add POST permission tests using real JWTs and
   patch create_message_task.delay to observe side effects without a real broker.
2. Fix logger call. Declare IsAuthenticated for MessageViewSet; use request.user.pk
   when enqueueing instead of request.jwt_user_id. Remove redundant HTTP JWT parsing
   only after verifying it has no other callers; retain WS middleware.
3. Resolve room authorization so unknown valid UUID/nonmembership produce the same
   404, while malformed UUID stays 400. Avoid serializer's unrestricted room lookup
   turning the documented 404 contract into 400. Check before enqueue.
4. Filter message querysets by both sender and room membership, excluding null rooms.
5. Test WS through the ASGI routing/auth stack using test channel layer and JWT;
   clean up connections and verify accept/reject. Keep active revocation separate.

## Verification

AC-001/002/003/007: API tests asserting HTTP code, task call arguments/count and
unchanged Message count on rejection. Include missing/invalid/expired JWT and a
session-authenticated sender where applicable.
AC-004: extend RoomHistoryBaselineTests with another member's message.
AC-005: remove RoomMember then assert list exclusion/detail 404; test null-room row.
AC-006: ASGI connection tests with member, outsider, missing and invalid token.
Run make check locally and PostgreSQL CI. Real Redis fan-out is not claimed here.

## Rollout and rollback

No schema migration or DTO change. Existing clients sending to unauthorized rooms
will be rejected. Keep 202 queue behavior and room history schema. Permission fixes
should be corrected forward; reverting them restores known access gaps. Document
any unexpected compatibility issue before expanding scope.
