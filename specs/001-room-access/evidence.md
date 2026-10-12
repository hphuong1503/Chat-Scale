# Verification evidence

## Acceptance mapping

| Criterion | Test / evidence planned | Result |
|---|---|---|
| AC-001 | Anonymous send/no side effects | Pass |
| AC-002 | JWT/session sender identity and single enqueue | Pass |
| AC-003 | Outsider/nonexistent room send rejected | Pass |
| AC-004 | Existing history baseline plus second-member history | Pass |
| AC-005 | Former member and legacy null-room list/detail | Pass |
| AC-006 | ASGI JWT connection acceptance/rejection | Pass |
| AC-007 | Malformed UUID/content rejected before enqueue | Pass |

## Runs

2026-10-12, local Python 3.13 / Django 5.2.8:

- `make check PYTHON=env/bin/python`: spec structure passes, Django system check reports zero issues, migration check reports no changes, 22 backend tests pass.
- Test suite methods in `chat.tests`:
  - `RoomHistoryBaselineTests`:
    - `test_member_reads_room_history` (AC-004)
    - `test_member_reads_room_history_with_multiple_members` (AC-004)
    - `test_outsider_cannot_read_room_history` (AC-004)
    - `test_anonymous_cannot_read_room_history` (AC-004)
    - `test_room_listing_excludes_other_users_rooms`
    - `test_worker_persists_and_broadcasts_message`
  - `MessageSendAccessTests`:
    - `test_ac001_anonymous_send_rejected` (AC-001)
    - `test_ac002_member_valid_send_with_jwt_enqueues_authenticated_sender` (AC-002)
    - `test_ac002_member_valid_send_with_session_enqueues_authenticated_sender` (AC-002)
    - `test_ac003_outsider_send_returns_404` (AC-003)
    - `test_ac003_nonexistent_room_send_returns_404` (AC-003)
    - `test_ac007_malformed_room_uuid_returns_400` (AC-007)
    - `test_ac007_empty_message_returns_400` (AC-007)
    - `test_ac007_missing_room_returns_400` (AC-007)
    - `test_ac007_oversized_message_returns_400_or_413` (AC-007)
  - `MessageListAndDetailAccessTests`:
    - `test_ac005_legacy_null_room_message_excluded_from_list_and_detail` (AC-005)
    - `test_ac005_former_member_cannot_list_or_retrieve_messages` (AC-005)
  - `WebSocketAccessTests`:
    - `test_ac006_valid_member_ws_connection_accepted` (AC-006)
    - `test_ac006_outsider_ws_connection_rejected` (AC-006)
    - `test_ac006_anonymous_ws_connection_rejected` (AC-006)
    - `test_ac006_invalid_token_ws_connection_rejected` (AC-006)
    - `test_ac006_malformed_room_ws_connection_rejected` (AC-006)

## Limitations

This spec validates HTTP and WebSocket authorization at connect/enqueue time under local isolated settings. It does not certify real multi-worker Redis delivery (mocked/in-memory), active socket revocation after member removal (T038), message mutation policies, transactional outbox (T026–T029), or frontend client integration (blocked by T001).
