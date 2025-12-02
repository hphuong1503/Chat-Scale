# Tổng kết triển khai WebSocket cho ChatApp

Tài liệu này tổng hợp toàn bộ các thay đổi đã thực hiện để tích hợp tính năng chat realtime (WebSocket) vào hệ thống ChatApp, cùng với lý do kỹ thuật cho từng quyết định.

## 1. Mục tiêu
Cho phép client nhận tin nhắn mới ngay lập tức (realtime) mà không cần phải liên tục gửi request (polling) lên server.

## 2. Kiến trúc & Công nghệ
Chúng ta đã chuyển đổi server từ thuần WSGI (Synchronous) sang hỗ trợ ASGI (Asynchronous) để xử lý các kết nối WebSocket lâu dài.

*   **Django Channels**: Thư viện chính để mở rộng Django hỗ trợ WebSocket.
*   **Redis**: Đóng vai trò là **Channel Layer**. Nó là nơi trung gian lưu trữ và chuyển tiếp tin nhắn giữa các process (ví dụ: từ Celery worker bắn tin nhắn sang WebSocket process).
*   **Gunicorn + Uvicorn Worker**:
    *   **Gunicorn**: Quản lý process (Process Manager), đảm bảo tính ổn định.
    *   **Uvicorn Worker**: Worker class giúp Gunicorn hiểu và xử lý được giao thức ASGI/WebSocket.

## 3. Chi tiết các thay đổi

### 3.1. Cấu hình & Dependencies
*   **`requirements.txt`**: Thêm `channels`, `channels-redis`, `uvicorn[standard]`.
*   **`settings.py`**:
    *   Thêm `channels` vào `INSTALLED_APPS`.
    *   Cấu hình `ASGI_APPLICATION` trỏ tới file `asgi.py`.
    *   Cấu hình `CHANNEL_LAYERS` sử dụng Redis (`redis:6379`).
    *   *Lý do*: Đây là các bước bắt buộc để kích hoạt Django Channels.

### 3.2. Cấu hình ASGI (`chatapp/asgi.py`)
*   Chuyển đổi từ `get_asgi_application()` đơn giản sang `ProtocolTypeRouter`.
*   Phân luồng:
    *   `http`: Xử lý bởi Django view thông thường.
    *   `websocket`: Xử lý bởi `ChatConsumer` (qua routing và middleware).
*   **Fix lỗi `AppRegistryNotReady`**: Thêm `django.setup()` trước khi import các module khác để đảm bảo Django nạp xong apps trước khi code chạy.

### 3.3. Core Logic (WebSocket)
*   **`chat/consumers.py`**: Tạo `ChatConsumer`.
    *   Xử lý kết nối (`connect`), ngắt kết nối (`disconnect`).
    *   Tham gia vào group chat dựa trên `room_id` (ví dụ: `chat_1`).
    *   Nhận event từ group và gửi JSON xuống client.
*   **`chat/routing.py`**: Định nghĩa URL `ws/chat/<room_id>/` trỏ tới Consumer.
*   **`chat/middleware.py`**: Tạo `JwtAuthMiddleware`.
    *   *Vấn đề*: WebSocket API trên trình duyệt không cho phép gửi custom Header (như `Authorization: Bearer ...`) khi mở kết nối.
    *   *Giải pháp*: Gửi token qua query param (`?token=...`). Middleware này parse token từ URL và xác thực user.

### 3.4. Tích hợp Business Logic
*   **`chat/tasks.py`** (Celery) & **`chat/views.py`**:
    *   Sau khi lưu tin nhắn vào DB (dù qua Celery hay trực tiếp), code sẽ gọi `channel_layer.group_send()`.
    *   *Lý do*: Để đảm bảo tính nhất quán. Bất kể tin nhắn được tạo ra từ đâu, hệ thống đều bắn tín hiệu realtime cho các client đang online trong phòng đó.

### 3.5. Hạ tầng (`docker-compose.yml`)
*   Thay đổi command khởi chạy:
    *   Cũ: `gunicorn chatapp.wsgi:application ...`
    *   Mới: `gunicorn chatapp.asgi:application -k uvicorn.workers.UvicornWorker ...`
    *   *Lý do*: Để server có thể xử lý đồng thời HTTP request và WebSocket connection trên cùng một port.

## 4. Kết quả
Hệ thống hiện tại hoạt động như sau:
1.  User đăng nhập -> Lấy JWT Token.
2.  User kết nối WebSocket: `ws://host/ws/chat/1/?token=...`.
3.  User gửi tin nhắn qua API REST (`POST /messages/`).
4.  Server lưu tin nhắn -> Bắn tín hiệu vào Redis Channel `chat_1`.
5.  Server WebSocket nhận tín hiệu từ Redis -> Đẩy tin nhắn xuống cho tất cả User đang kết nối vào `chat_1`.

## 5. File kiểm thử
*   `test_websocket.py`: Script Python tự động thực hiện quy trình trên để verify hệ thống.
