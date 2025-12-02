# WebSocket Implementation Plan for ChatApp

## 1. Context
Currently, the ChatApp uses a REST API to send and receive messages. To allow clients to receive new messages immediately without polling, we need to implement WebSockets.

## 2. Solution
Use **Django Channels** combined with **Redis** as the Channel Layer.

### Technologies:
-   **Django Channels**: Extends Django to support WebSockets.
-   **Uvicorn**: High-performance ASGI Server.
-   **Gunicorn**: WSGI/ASGI Process Manager, using Uvicorn worker class.
-   **Redis**: Message broker to store and forward messages between processes (Channel Layer).

## 3. Architecture

1.  **Client**: Connects via WebSocket to endpoint `ws://<server>/ws/chat/<room_id>/`.
2.  **Connection**:
    -   When a client connects, the server authenticates the user (JWT).
    -   The server adds the connection to a **Group** corresponding to the `room_id` (e.g., `chat_1`).
3.  **Sending Messages**:
    -   When a new message is created (via REST API `POST /messages/`), the server sends an event containing the message content to the Group `chat_<room_id>`.
4.  **Receiving Messages**:
    -   All clients in the Group will receive the event and display the message.

## 4. Implementation Steps
### Step 1: Install Libraries
Add to `requirements.txt`:
```text
channels>=4.0.0
channels-redis>=4.0.0
uvicorn[standard]>=0.23.0
```

### Step 2: Configure Settings (`chatapp/settings.py`)
-   Add `channels` to `INSTALLED_APPS`.
-   Configure `ASGI_APPLICATION`.
-   Configure `CHANNEL_LAYERS` using Redis.

```python
INSTALLED_APPS = [
    'channels',
    # ...
]

ASGI_APPLICATION = 'chatapp.asgi.application'

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("redis", 6379)],
        },
    },
}
```

### Step 3: Create Consumer (`chat/consumers.py`)
Create `ChatConsumer` class inheriting from `AsyncWebsocketConsumer` to handle:
-   `connect`: Join group.
-   `disconnect`: Leave group.
-   `receive`: (Optional) Handle messages sent via WS (if supporting sending via WS instead of API).
-   `chat_message`: Handler to send messages down to the client.

### Step 4: Define Routing (`chat/routing.py`)
Map URL `ws/chat/<room_id>/` to `ChatConsumer`.

### Step 5: Update ASGI Config (`chatapp/asgi.py`)
Configure `ProtocolTypeRouter` to route HTTP to Django View and WebSocket to Channels Routing.

```python
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(URLRouter(websocket_urlpatterns))
    ),
})
```

### Step 6: Update Docker Compose
Change the server startup command to use Gunicorn with Uvicorn worker.

```yaml
command: gunicorn chatapp.asgi:application -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
### Step 7: Authentication
Handle JWT Authentication for WebSocket (since WebSocket browser API does not allow sending custom headers easily, typically use query param `?token=...` or cookie). Need to write custom Middleware for Channels to parse JWT from query string.

## 5. Testing Plan
-   Use `wscat` or Postman to test connection to WebSocket.
-   Send messages via API and verify if WebSocket client receives them.
