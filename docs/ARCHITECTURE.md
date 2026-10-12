# Current architecture and contracts

Checked against source on 2026-10-12. Update this document when flows, models, or contracts change. Refer to source for configuration details.

## Source map

| Path | Responsibility |
|---|---|
| `chatapp/chatapp/settings.py` | Django, DRF/JWT, DB, Channels, Celery |
| `chatapp/chatapp/urls.py`, `asgi.py` | HTTP router and HTTP/WS protocol routing |
| `chatapp/chatapp/celery.py` | Worker configuration/autodiscovery |
| `chatapp/chat/models.py` | Room, RoomMember, Message |
| `chatapp/chat/views.py` | Rooms, membership, history, and message enqueueing |
| `chatapp/chat/serializer.py` | Schema/validation; the filename is singular |
| `chatapp/chat/middleware.py` | HTTP JWT user ID extraction and WS JWT authentication |
| `chatapp/chat/consumers.py`, `routing.py` | WS connections and events sent to clients |
| `chatapp/chat/tasks.py` | DB write followed by group_send; the send view does not use the raw SQL task |
| `chatapp/quickstart/views.py`, `serializers.py` | Login/refresh and UserViewSet |
| `chatapp/chat/migrations/` | Schema history |
| `chatapp/docker-compose.yml`, `Dockerfile` | web/worker/postgres/redis |
| `frontend/` | React/Vite bundle; application source and package.json are missing |
| `k6-test.js`, `Test Results/` | Load script and historical measurements |
| `ADR/` | Previous decisions/plans, some incomplete |
| `production-roadmap/` | Roadmap/TODO site with a separate Git repository |

## Message flow

HTTP requests go through Django/DRF. POST messages is intended to enqueue a Celery task through Redis and return 202. The worker creates a Message in PostgreSQL, then publishes a Channels event to `chat_<room_id>`. The ASGI web process maintains sockets and sends events to clients. A logging error currently blocks create before enqueueing; see KNOWN_ISSUES.md.

WS accepts an AccessToken through the `token` query parameter, loads the User, and checks RoomMember at connection time. `receive()` does not support sending messages upstream; messages are sent through REST. History reads from the DB. Redis currently serves the broker, result backend, and Channels.

## Data and terminology

| Model/concept | Current state |
|---|---|
| Room | UUID, GROUP/DIRECT type, created_by SET_NULL |
| RoomMember | Room/user FKs, ADMIN/MEMBER role, unique(room,user); source of room permissions |
| Message | UUID, content in the `message` field, nullable room, sender FK, created_at |
| Queued | The broker has accepted the task according to the intended response; this does not prove a DB write |
| Saved | Message has committed; the current API has no separate acknowledgement |
| Delivered/read | Not implemented; cannot be inferred from 202 or group_send |

Deleting a room/user currently cascades to messages. There is no unique DIRECT pair, outbox, client_message_id, receipt, or attachment. Retention/deletion policy changes must account for existing data and migrations.

## Current contracts

Paths have a trailing `/`. HTTP uses Bearer access tokens; SessionAuthentication is also enabled.

| Endpoint | Input / output |
|---|---|
| `POST /auth/login/` | username/password → access, refresh, user(id,username,email) |
| `POST /auth/refresh/` | Intended to accept refresh → access; the nested view invocation needs regression test T012 |
| `/users/` | User CRUD, IsAuthenticated; object permissions need an audit |
| `POST /rooms/` GROUP | name, description, room_type, members (user IDs); creator is ADMIN |
| `POST /rooms/` DIRECT | room_type, target_user_id; returns an existing room or creates one |
| `GET /rooms/` | Rooms the user belongs to, DRF pagination |
| `GET/POST /rooms/{id}/members/` | List / add using user_id; POST requires ADMIN |
| `DELETE /rooms/{id}/members/{user_id}/` | Remove a GROUP member; requires ADMIN |
| `GET /rooms/{id}/messages/?page=1` | Newest-first history, page size 10 |
| `POST /messages/` | `{message, room}` → intended 202 `{status: "Message creation queued"}` |
| `/messages/{id}/` | Inherited CRUD, queryset filtered by sender; policy needs an audit |
| `WS /ws/chat/{room_id}/?token=<access>` | Event `{message, sender_id, room_id}`, missing message ID/time |

Sender is a HiddenField, so history does not return it. Message limits are measured in UTF-8 bytes; the body has a separate limit, so JSON overhead also matters.

## Unimplemented targets

ROADMAP proposes writing Message+OutboxEvent in one transaction, returning 201 after commit, worker retries, and client deduplication/catch-up. T026 requires an architecture decision before implementation. Do not change the status to 201 while only enqueueing. Idempotency does not imply exactly-once delivery.

T002/T003/T068 still require decisions on load, features, permissions, retention, and SLO/RPO/RTO. Record assumptions when designing; do not mark product decisions as agreed without evidence.
