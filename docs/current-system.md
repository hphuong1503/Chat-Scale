# Current system

Baseline inspected 2026-10-12. This is a source inspection plus the checks recorded
in `specs/000-sdd-foundation/evidence.md`, not a production certification.

## Components and contracts

- Django/DRF provides `/auth/login/`, `/auth/refresh/`, `/users/`, `/rooms/`,
  `/messages/`, `/rooms/{id}/members/` and `/rooms/{id}/messages/`.
- Room has DIRECT/GROUP types; RoomMember has ADMIN/MEMBER roles and uniqueness
  per room/user. Message has UUID, nullable room, sender, message, created_at.
- Room list/detail/history are filtered by membership. History is page-number
  pagination ordered by descending created_at. Message list filters by sender.
- `chat/views.py:MessageViewSet.create` requires authentication, checks room membership,
  and enqueues a Celery task returning 202 with `{"status":"Message creation queued"}`.
  It uses `logger.info` and takes sender identity from `request.user`. Nonexistent or
  unauthorized rooms return 404; malformed UUIDs return 400.
- `chat/tasks.py:create_message_task` saves Message, then broadcasts through
  Channels/Redis. The event contains message/sender_id/room_id, without a persisted
  message ID or timestamp. There is no transactional outbox or idempotency key.
- `chat/consumers.py` checks authentication and membership on WS connect, then
  subscribes to the room group. It does not revoke existing connections on member
  removal. Incoming WS messages are ignored; sending is intended through HTTP.
- `chat/middleware.py` authenticates WS query JWTs; the redundant HTTP JWT middleware
  has been removed from settings. `chatapp/asgi.py` wires routing and origin validation.
- Docker Compose starts web, worker, PostgreSQL 15 and Redis 7. Development settings
  use service hostnames and hardcoded development configuration.

## Known gaps

T010/T011/T014 cover send logging/auth/membership. T016/T017 cover room/user
management permissions. T020/T021 cover DTO consistency. T026–T040 cover durability,
idempotency and reconnect. These remain open, including behavior outside spec 001.

Frontend contains a bundle and local dependencies, but no package.json or source
files were found under src. Full UI rebuild/E2E is blocked by T001.
PostgreSQL files are tracked and already have local changes; T005 must preserve
needed data before cleaning Git. This setup does not modify those files.

## Architecture decision status

The historical write-pipeline ADR was marked Accepted with unfinished Decision and
Rationale sections. It is retained as an incomplete historical record. Its async
queue direction matches the intended current pipeline, not a durability guarantee.
ROADMAP Milestone 2 proposes a different contract: 201 after Message + Outbox commit.
That proposal requires T026 and a separate delivery spec before implementation.
Do not change 202 to 201 as part of access-control spec 001.

Room listing also emits an unordered-pagination warning; stable ordering is a known
follow-up, not part of the foundation guarantee.

## Verification baseline

The foundation adds authenticated HTTP history/list isolation tests and a worker
persistence/broadcast test. It does not establish send correctness, WS delivery,
production readiness, or passing remote CI. See the foundation evidence.
