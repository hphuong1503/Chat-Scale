# Roadmap: Chat App Production

Ngày lập: 06/10/2026. Cơ sở: mã nguồn Django/DRF, Channels, Celery, PostgreSQL, Redis và bundle frontend hiện có trong repository.

Triển khai từng phần theo [SDD workflow](docs/development-workflow.md) và
[spec registry](specs/README.md). [Baseline hiện trạng](docs/current-system.md)
phân biệt hành vi đang có với các đề xuất trong roadmap này.

## Phạm vi và giả định

Mục tiêu là chat trực tiếp và chat nhóm trên web, có lịch sử bền vững, realtime, quyền truy cập chính xác, phục hồi khi mất kết nối, triển khai an toàn và vận hành có quan sát. Roadmap không mặc định bao gồm gọi thoại/video, mã hóa đầu cuối, federation hoặc nhiều vùng địa lý.

Ước lượng ban đầu: 12–16 tuần với 2 backend engineer, 1 frontend engineer và hỗ trợ QA/DevOps bán thời gian. Các giai đoạn có phần chồng lấn; đây là ước lượng lập kế hoạch, cần hiệu chỉnh sau giai đoạn 0. Nếu chỉ có một người, nên dự trù 5–8 tháng tùy kinh nghiệm và phạm vi.

Không cần chuyển sang microservices để đạt production. Giữ backend Django dùng chung mã nguồn, tách tiến trình web và worker; chỉ tách service khi số liệu tải hoặc yêu cầu tổ chức chứng minh nhu cầu.

## Mốc 0 — Chốt yêu cầu và khôi phục khả năng phát triển (tuần 1)

- Khôi phục mã nguồn frontend, package.json, cấu hình build và lockfile; bundle trong dist không đủ làm nguồn phát triển.
- Viết hướng dẫn chạy local và staging; tạo cấu hình môi trường mẫu không chứa secret.
- Chốt quy mô: DAU, peak concurrent sockets, số tin/giây, kích thước phòng, retention và giới hạn attachment.
- Chốt chính sách: ai được tạo phòng, mời/xóa thành viên, sửa/xóa tin; cách xử lý tin đã lưu khi user hoặc room bị xóa.
- Xác định nơi triển khai, ngân sách, nhu cầu backup và trách nhiệm trực vận hành.
- Ghi baseline kiến trúc, danh mục API và các lỗi đã biết; ngừng theo dõi thư mục dữ liệu PostgreSQL trong Git, bảo toàn dữ liệu cần thiết trước khi dọn repository.

**Tiêu chí hoàn thành:** checkout sạch chạy được bằng tài liệu; frontend build được từ source; có bảng tải mục tiêu và phạm vi MVP được thống nhất.

## Mốc 1 — Sửa tính đúng đắn và phân quyền (tuần 1–3)

- Sửa logging.log.info trong endpoint gửi tin và kiểm tra login/refresh/logout end-to-end.
- Đặt IsAuthenticated rõ ràng cho API tin nhắn; lấy sender từ user đã xác thực, thống nhất cách xác thực thay vì giải mã JWT hai lần.
- Kiểm tra membership khi gửi, đọc, sửa/xóa tin; giới hạn queryset room theo user.
- Áp dụng quyền ADMIN cho thao tác quản trị phòng; khóa các action ModelViewSet không thuộc phạm vi sản phẩm. Audit cả UserViewSet để tránh người dùng sửa/xóa tài khoản khác hoặc nhóm quyền.
- Tạo room và membership trong transaction; bảo đảm một phòng DIRECT cho mỗi cặp user bằng khóa cặp chuẩn hóa và unique constraint; xử lý self-chat theo quyết định sản phẩm.
- Chuẩn hóa response tin nhắn: id, client_message_id, room_id, sender, content, created_at và version nếu hỗ trợ sửa tin.
- Đồng bộ frontend với JWT WebSocket, response lịch sử và trạng thái optimistic; cấu hình URL theo môi trường.
- Kiểm tra input, UUID, pagination và giới hạn payload; lỗi trả về có mã ổn định, không lộ stack trace.

**Kiểm chứng:** integration test cho hai thành viên và một người ngoài phòng; test ADMIN/MEMBER; test request tạo DIRECT đồng thời; test đăng nhập, refresh, gửi và nhận tin từ hai trình duyệt.

**Tiêu chí hoàn thành:** luồng chat cơ bản chạy được; không gửi/đọc/quản trị trái quyền; các lỗi hợp đồng frontend/backend được sửa.

## Mốc 2 — Tin nhắn bền vững và phục hồi realtime (tuần 3–5)

**Quyết định kiến trúc đề xuất:** request ghi Message và OutboxEvent trong cùng transaction PostgreSQL, rồi trả 201 với tin nhắn chính thức. Worker phát event từ outbox sang Channels và đánh dấu đã xử lý. HTTP thành công xác nhận lưu dữ liệu; không xác nhận người nhận đã đọc hoặc nhận trên thiết bị.

- Dùng client_message_id và unique constraint theo sender để retry cùng yêu cầu không tạo tin mới; nếu cùng ID nhưng payload khác thì trả lỗi rõ ràng.
- Outbox có retry/backoff, giới hạn thử, hàng đợi lỗi và cơ chế chạy lại có kiểm soát. Sự kiện có event_id và message_id để client loại trùng; chấp nhận phát event ít nhất một lần.
- Định nghĩa thứ tự chuẩn bằng cursor ổn định; nếu sản phẩm yêu cầu thứ tự tuyệt đối trong từng phòng, thiết kế sequence theo phòng và đo contention.
- Chuyển lịch sử sang cursor pagination; bổ sung index phù hợp với truy vấn room và cursor, kiểm tra execution plan trên dữ liệu lớn.
- Khi reconnect, client tải bù từ cursor đã xác nhận, loại trùng history/event và thay thế tin optimistic bằng tin chính thức.
- Xử lý race giữa subscribe và tải lịch sử; test không có khoảng trống ở ranh giới hai luồng.
- Khi xóa membership hoặc khóa tài khoản, ngắt socket liên quan và kiểm tra lại quyền ở các điểm cần thiết. Định nghĩa thời hạn socket khi JWT hết hạn.
- UI có trạng thái sending, saved, failed và retry. delivered/read là các trạng thái riêng nếu được triển khai.

**Kiểm chứng:** dừng worker, mất Redis, mất kết nối sau commit, event trùng, retry HTTP và reconnect; tin đã được API xác nhận phải còn trong DB và tải bù được.

**Tiêu chí hoàn thành:** không tạo trùng khi retry; phục hồi được tin bị bỏ lỡ; sự kiện lỗi được phát hiện và chạy lại; API có hợp đồng durability rõ ràng.

## Mốc 3 — Hoàn thiện trải nghiệm sản phẩm (tuần 4–7)

- Tìm user, tạo DIRECT/GROUP, danh sách hội thoại, tin cuối và số chưa đọc; cập nhật nhất quán sau khi gửi/đọc.
- Read cursor theo user/phòng; định nghĩa delivered/read cho nhiều thiết bị và tránh tạo một bản ghi receipt cho mọi tin nếu không cần.
- Typing và presence có TTL, heartbeat, giới hạn tần suất; coi đây là trạng thái tạm thời, không dùng làm bằng chứng giao tin.
- Attachment qua object storage: upload có giới hạn, kiểm tra loại nội dung, quét file theo yêu cầu, URL truy cập có quyền và vòng đời xóa rõ ràng.
- Tìm kiếm lịch sử trong phạm vi phòng có quyền; bắt đầu bằng PostgreSQL, đo nhu cầu trước khi thêm search engine.
- Nếu nằm trong MVP: sửa/xóa tin theo chính sách, block/report, thông báo khi offline và mute phòng. Mỗi chức năng phải xử lý quyền và sự kiện đồng bộ.
- Hoàn thiện responsive, accessibility, loading/empty/error state và trải nghiệm mạng chậm.

**Tiêu chí hoàn thành:** bộ hành trình người dùng chạy end-to-end trên desktop/mobile web; nhiều tab và thiết bị không làm sai unread/read; file không truy cập được ngoài quyền.

## Mốc 4 — Bảo mật và môi trường production (tuần 5–8)

- Tách settings theo môi trường; secret qua hệ thống quản lý secret; thay các giá trị đã xuất hiện trong repository khi triển khai.
- DEBUG=False, host/origin allowlist, HTTPS/WSS, reverse proxy với WebSocket upgrade và timeout phù hợp; bỏ --reload khỏi production.
- Chốt cơ chế auth browser. Ưu tiên cookie an toàn có kiểm soát CSRF/origin hoặc WebSocket ticket sống ngắn; tránh access token dài hạn trong URL/log.
- Rate limit login, gửi tin, tạo phòng, upload và socket; giới hạn số kết nối theo user/IP, kích thước phòng và payload.
- Private networking cho DB/Redis, credential riêng, TLS khi cần; tách Redis broker và Channels nếu yêu cầu độ bền hoặc contention khác nhau.
- Cấu hình Redis persistence/volume và eviction phù hợp từng vai trò; không coi persistence Redis là thay thế backup dữ liệu chat.
- Build image bất biến, pin dependency có thể tái tạo; dependency/secret scan, vá lỗi theo lịch.
- Thêm health/readiness, graceful shutdown, reconnect khi deploy và migration chạy một lần qua release job.

**Tiêu chí hoàn thành:** staging dùng cùng mô hình triển khai production; kiểm tra quyền, token, upload và rate limit đạt; không còn secret hardcode hoặc chế độ debug trong deployment.

## Mốc 5 — Quan sát, backup và kiểm chứng tải (tuần 7–10)

- Log có request_id, message_id, event_id và task_id; không ghi token hoặc nội dung chat mặc định.
- Dashboard cho API latency/error, socket count/reconnect, outbox age/backlog, task failure, DB connection/query và Redis memory.
- Đo riêng thời gian HTTP lưu tin và thời gian từ gửi đến client nhận; tách lỗi functional khỏi vi phạm latency.
- Alert gắn với tác động người dùng; có runbook cho DB down, Redis down, backlog, deploy lỗi và sự cố quyền truy cập.
- Backup PostgreSQL và object storage theo retention; diễn tập restore sang môi trường mới và đối chiếu dữ liệu. Chốt nhu cầu PITR và HA theo RPO/RTO.
- CI chạy unit/integration/E2E có ý nghĩa; staging chạy load, soak và failure test. Không teardown room trước khi tác vụ liên quan hoàn tất.
- Đo cả peak sockets, fan-out phòng lớn, reconnect storm, lịch sử lớn, upload và tải gửi; tăng worker/web theo số liệu thay vì chỉ số VU.

**SLO đề xuất ban đầu, phải xác nhận sau baseline:** availability 99,9%/tháng; p95 API gửi <300 ms; p95 lưu đến nhận <1 giây với client online ở vùng kiểm thử; RPO <=15 phút và RTO <=60 phút. Ngoại lệ mạng client và cách đo phải được định nghĩa rõ.

**Tiêu chí hoàn thành:** đạt tải mục tiêu và tải cao hơn mục tiêu đã thống nhất; không mất tin đã xác nhận trong failure test; backlog phục hồi trong ngưỡng; restore đạt RPO/RTO; alert được diễn tập.

## Mốc 6 — Beta, phát hành và vận hành (tuần 10–12; dự phòng đến tuần 16)

- Mở beta giới hạn, theo dõi SLO và feedback; tăng lượng người dùng từng bước bằng feature flag.
- Thực hiện review quyền truy cập, retention, xóa dữ liệu và chính sách riêng tư theo thị trường mục tiêu.
- Kiểm chứng rollback với migration tương thích ngược; release note, runbook và người chịu trách nhiệm được xác định.
- Chốt kế hoạch support, xử lý report và incident; rà soát dung lượng, chi phí và giới hạn dịch vụ.
- Hoàn tất các gate bên dưới trước khi mở rộng công khai; xử lý lỗi nghiêm trọng của beta trước tính năng mới.

**Tiêu chí hoàn thành:** beta ổn định qua chu kỳ quan sát đã thống nhất; có bằng chứng kiểm chứng cho tất cả release gate; đội vận hành thực hiện được deploy, rollback, restore và phản ứng sự cố.

## Release gates

| Gate | Bằng chứng bắt buộc |
|---|---|
| Quyền và bảo mật | Test truy cập trái quyền REST/WS, quản trị user/room, token và attachment đạt |
| Độ bền tin nhắn | Retry không trùng; crash/reconnect không làm mất tin đã xác nhận; outbox phục hồi được |
| Hợp đồng sản phẩm | Hai user, nhiều tab/thiết bị, unread/read, history và trạng thái lỗi đúng |
| Hiệu năng | Báo cáo tải mục tiêu, latency end-to-end, error và backlog; không chỉ HTTP 201/202 |
| Khôi phục | Restore thực tế đạt RPO/RTO, đối chiếu DB và file |
| Triển khai | Pipeline, readiness, graceful shutdown và rollback được diễn tập |
| Vận hành | Dashboard, alert, runbook, người trực và quy trình incident sẵn sàng |

## Sau khi phát hành

Ưu tiên dựa trên số liệu: connection pooling, read replica cho truy vấn phù hợp, tối ưu fan-out phòng lớn, archive/partition dữ liệu theo retention và autoscaling theo backlog/socket. Chỉ xem xét sharding, nhiều vùng hoặc tách microservices khi một nút PostgreSQL/Redis hoặc mô hình triển khai hiện tại trở thành giới hạn đã đo được.

## Backlog khởi động: 10 việc đầu tiên

1. Khôi phục source frontend và build tái tạo.
2. Sửa lỗi logging trong POST /messages/.
3. Viết integration test membership cho gửi/đọc tin.
4. Khóa quyền sửa/xóa room và user API.
5. Chuẩn hóa message DTO và auth WebSocket.
6. Chốt ADR ghi đồng bộ + transactional outbox.
7. Thêm client_message_id và unique constraint.
8. Tạo outbox dispatcher, retry và quan sát lỗi.
9. Hoàn thiện reconcile optimistic và reconnect catch-up.
10. Thiết lập CI và staging tối thiểu để kiểm chứng hai client.
