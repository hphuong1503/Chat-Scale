# Chat App Production — Todo list

Nguồn: [ROADMAP.md](ROADMAP.md). Ngày lập: 06/10/2026.

Quy trình triển khai: [SDD workflow](docs/development-workflow.md) và
[spec registry](specs/README.md). Nền tảng SDD chỉ hoàn thành phần backend của
T007/T008/T009; không tự đánh dấu các task này hoàn tất. Bước tiếp theo đã được
đặc tả tại [001-room-access](specs/001-room-access/spec.md).

## Cách sử dụng

- Mỗi dòng là một task có đầu ra và tiêu chí nghiệm thu riêng. Đánh dấu `[x]` khi đã có bằng chứng đáp ứng cột Hoàn thành khi.
- Vai trò phụ trách là đề xuất, chưa phải người được phân công: BE = backend, FE = frontend, OPS = DevOps, QA = kiểm thử, PO = người quyết định sản phẩm.
- Phụ thuộc ghi bằng mã task; `—` nghĩa là có thể bắt đầu ngay. Những task chưa phụ thuộc nhau có thể thực hiện đồng thời.
- Ưu tiên P0 = chặn luồng cốt lõi hoặc gây truy cập trái quyền; P1 = cần trước phát hành; P2 = phụ thuộc phạm vi sản phẩm; P3 = tối ưu sau phát hành.
- Task P2 chỉ được bỏ khỏi release khi quyết định phạm vi được ghi lại trong T003. Các gate liên quan chỉ được ghi không áp dụng khi có quyết định đó.
- Không coi việc viết code là hoàn thành nếu chưa đạt tiêu chí nghiệm thu. Lưu PR, kết quả test hoặc tài liệu vào mục Theo dõi ở cuối file.

## 0. Phạm vi và nền tảng phát triển

| Todo | Ưu tiên | Phụ trách | Phụ thuộc | Hoàn thành khi |
|---|---|---|---|---|
| [ ] **T001 — Khôi phục source frontend** | P0 | FE | — | Có source, package.json, lockfile và cấu hình build; build sạch tạo được giao diện hiện có. |
| [ ] **T002 — Ghi tải mục tiêu** | P1 | PO/BE | — | Có DAU, peak sockets, tin/giây, kích thước phòng và dung lượng dữ liệu dự kiến. |
| [ ] **T003 — Chốt phạm vi release** | P1 | PO | — | Ghi rõ tính năng bắt buộc/tùy chọn, self-chat, quyền sửa/xóa, retention, account deletion và giới hạn file. |
| [ ] **T004 — Chốt hạ tầng và ngân sách** | P1 | PO/OPS | T002 | Có nhà cung cấp, vùng, ngân sách, môi trường staging/production và người vận hành dự kiến. |
| [ ] **T005 — Bảo toàn dữ liệu và dọn Git** | P1 | BE/OPS | — | Dữ liệu cần thiết đã được sao lưu; data PostgreSQL, env và artifact build không còn được theo dõi sai trong Git. |
| [ ] **T006 — Tạo cấu hình môi trường mẫu** | P1 | BE/FE | — | Có .env.example không chứa secret thật; liệt kê DB, Redis, API/WS URL và biến bắt buộc. |
| [ ] **T007 — Viết hướng dẫn chạy local** | P1 | BE/FE | T001,T006 | Checkout sạch chạy được backend, worker, DB, Redis và frontend theo hướng dẫn. |
| [ ] **T008 — Ghi baseline hệ thống** | P1 | BE | — | Có sơ đồ hiện trạng, danh mục API/WS và lỗi đã biết, dẫn tới file nguồn liên quan. |
| [ ] **T009 — Thiết lập CI tối thiểu** | P1 | OPS/BE/FE | T001,T007 | CI build frontend, kiểm tra backend và chạy test với DB/Redis riêng; không dùng dữ liệu thật. |

## 1. Tính đúng đắn và quyền truy cập

| Todo | Ưu tiên | Phụ trách | Phụ thuộc | Hoàn thành khi |
|---|---|---|---|---|
| [ ] **T010 — Sửa logging trong POST /messages/** | P0 | BE | — | Endpoint không còn AttributeError do logging.log.info; request hợp lệ đi tới bước xử lý tin. |
| [ ] **T011 — Thống nhất authentication HTTP** | P0 | BE | T010 | Message API có IsAuthenticated, sender lấy từ user xác thực; bỏ đường giải mã JWT trùng không cần thiết. |
| [ ] **T012 — Kiểm tra login và refresh** | P0 | BE/FE | T001,T011 | Login hợp lệ/sai, access hết hạn và refresh hợp lệ/hết hạn có kết quả đúng; endpoint refresh nhận đúng kiểu request. |
| [ ] **T013 — Chốt và triển khai logout** | P1 | BE/FE | T003,T012 | Chính sách thu hồi token/session được ghi rõ; client xóa trạng thái và đóng socket; hành vi token cũ khớp chính sách. |
| [ ] **T014 — Chặn gửi vào phòng ngoài quyền** | P0 | BE | T011 | Người ngoài phòng không enqueue/lưu tin; thành viên gửi được; quyền được kiểm tra trước ghi. |
| [ ] **T015 — Giới hạn đọc và thao tác tin** | P0 | BE | T003,T011 | List/detail/history chỉ trả dữ liệu có quyền; sửa/xóa kiểm tra sender và chính sách hoặc bị tắt. |
| [ ] **T016 — Khóa quản trị phòng** | P0 | BE | T003 | MEMBER không sửa/xóa phòng hoặc quản trị thành viên; ADMIN thực hiện được đúng chính sách. |
| [ ] **T017 — Audit UserViewSet** | P0 | BE | T003 | User thường không sửa/xóa user khác hoặc groups/quyền; API tìm user chỉ trả trường được phép. |
| [ ] **T018 — Tạo phòng trong transaction** | P1 | BE | T003 | Lỗi tạo membership rollback toàn bộ; không để phòng hoặc membership dở dang. |
| [ ] **T019 — Chống trùng DIRECT room** | P1 | BE | T018 | Có khóa cặp user chuẩn hóa và unique constraint; request đồng thời nhận cùng phòng; dữ liệu cũ được xử lý trước migration. |
| [ ] **T020 — Định nghĩa message DTO** | P1 | BE/FE | T003 | Có schema id, client_message_id, room_id, sender, content, created_at; quy định version khi sửa và event tương ứng. |
| [ ] **T021 — Áp dụng DTO backend/frontend** | P1 | BE/FE | T001,T020 | History, response gửi và WS dùng schema thống nhất; frontend hiển thị sender/thời gian chính thức. |
| [ ] **T022 — Sửa kết nối WS và URL môi trường** | P0 | FE/BE | T001,T012 | Hai client xác thực kết nối và nhận tin; không hardcode localhost; auth tạm thời được thay ở T045. |
| [ ] **T023 — Chuẩn hóa validation và lỗi** | P1 | BE | T014,T020 | UUID sai, room không hợp lệ, payload quá lớn và pagination sai trả lỗi có mã ổn định, không lộ stack trace. |
| [ ] **T024 — Test ma trận quyền** | P0 | QA/BE | T014,T015,T016,T017,T019 | Test thành viên/người ngoài, ADMIN/MEMBER, user API và tạo DIRECT đồng thời chạy trong CI. |
| [ ] **T025 — Test luồng hai trình duyệt** | P1 | QA/FE | T012,T021,T022,T023 | Login, refresh, tạo phòng, gửi, đọc history và nhận realtime qua hai tài khoản đạt. |

## 2. Lưu bền vững và phục hồi realtime

| Todo | Ưu tiên | Phụ trách | Phụ thuộc | Hoàn thành khi |
|---|---|---|---|---|
| [ ] **T026 — Chốt ADR ghi tin và outbox** | P1 | BE | T002,T020 | ADR quy định transaction, 201 sau commit, idempotency, at-least-once event và ý nghĩa saved/delivered/read. |
| [ ] **T027 — Thêm client_message_id** | P1 | BE | T026 | Migration có unique constraint theo sender; retry cùng payload trả cùng message, payload khác cùng ID bị từ chối. |
| [ ] **T028 — Tạo OutboxEvent** | P1 | BE | T026 | Model có event_id, message_id, payload, trạng thái, attempts, next_attempt_at và lỗi; migration chạy được trên dữ liệu có sẵn. |
| [ ] **T029 — Ghi Message + Outbox cùng transaction** | P1 | BE | T014,T027,T028 | POST trả 201 với DTO sau commit; lỗi rollback cả hai; retry đồng thời không tạo trùng. |
| [ ] **T030 — Tạo outbox dispatcher** | P1 | BE | T029 | Worker tự tìm event chưa phát, claim an toàn khi nhiều worker chạy; không phụ thuộc duy nhất vào enqueue sau commit. |
| [ ] **T031 — Triển khai retry và replay** | P1 | BE | T030 | Backoff/giới hạn thử hoạt động; event lỗi được liệt kê và replay có quyền; client chịu được event trùng. |
| [ ] **T032 — Chốt thứ tự và cursor** | P1 | BE | T002,T026 | Có thứ tự ổn định và chiến lược không bỏ sót commit đến muộn; ghi rõ có cần sequence theo phòng không. |
| [ ] **T033 — Cursor history và index** | P1 | BE | T032 | Pagination dùng cursor ổn định; index phù hợp; execution plan và test nhiều tin cùng timestamp đạt. |
| [ ] **T034 — API tải bù sau cursor** | P1 | BE | T029,T032,T033 | Client lấy được tin bị bỏ lỡ, theo đúng quyền; xử lý cursor hết retention và giới hạn batch rõ ràng. |
| [ ] **T035 — Reconcile tin optimistic** | P1 | FE | T021,T027,T029 | Một tin tạm được thay bằng tin chính thức; event/response đến theo mọi thứ tự không tạo bản sao. |
| [ ] **T036 — Reconnect và chống trùng event** | P1 | FE | T022,T034,T035 | Client giữ cursor xác nhận, tải bù, dedupe bằng ID và reconnect có backoff/jitter. |
| [ ] **T037 — Xử lý race subscribe/history** | P1 | BE/FE | T036 | Có handshake/watermark hoặc cơ chế tương đương; gửi đúng lúc subscribe/tải history không làm mất tin. |
| [ ] **T038 — Thu hồi quyền socket đang mở** | P0 | BE | T013,T016,T022 | Xóa membership/khóa user khiến socket liên quan ngừng nhận; token hết hạn có hành vi được định nghĩa và kiểm chứng. |
| [ ] **T039 — UI trạng thái gửi và retry** | P1 | FE | T035,T036 | Có sending/saved/failed; retry giữ nguyên client_message_id; không báo delivered chỉ vì HTTP thành công. |
| [ ] **T040 — Test sự cố và tính bền vững** | P1 | QA/BE/FE | T031,T037,T038,T039 | Dừng worker, mất Redis, crash sau commit, retry trùng và reconnect không làm mất tin đã xác nhận; test cả commit đến muộn. |

## 3. Tính năng sản phẩm

| Todo | Ưu tiên | Phụ trách | Phụ thuộc | Hoàn thành khi |
|---|---|---|---|---|
| [ ] **T041 — Tìm user và tạo hội thoại trên UI** | P1 | FE/BE | T017,T019,T025 | Tìm user theo quyền, tạo GROUP/DIRECT và mở hội thoại hoạt động; lỗi có thông báo rõ. |
| [ ] **T042 — Danh sách phòng và tin cuối** | P1 | BE/FE | T029,T041 | Danh sách có cursor, tin cuối và thứ tự cập nhật đúng; tránh N+1 query; event cập nhật được UI. |
| [ ] **T043 — Read cursor và unread** | P1 | BE/FE | T032,T042 | Cursor theo user/phòng chỉ tiến; unread đúng trên nhiều tab/thiết bị; quyền đọc được kiểm tra. |
| [ ] **T044 — Chốt delivered/read đa thiết bị** | P2 | PO/BE/FE | T003,T043 | Nếu chọn triển khai: định nghĩa acknowledgement và hiển thị receipt đúng cho nhiều thiết bị/phòng nhóm. |
| [ ] **T045 — Auth browser và WS production** | P1 | BE/FE | T003,T012,T022 | Cookie an toàn có CSRF/origin hoặc WS ticket sống ngắn hoạt động; không lộ access token dài hạn qua URL/log. |
| [ ] **T046 — Typing có giới hạn** | P2 | BE/FE | T003,T045 | Event typing kiểm tra membership, rate limit và TTL; hết hạn/mất kết nối không giữ trạng thái. |
| [ ] **T047 — Presence và heartbeat** | P2 | BE/FE | T003,T045 | Presence tổng hợp nhiều thiết bị với TTL; disconnect/crash không để trạng thái online vĩnh viễn. |
| [ ] **T048 — Luồng upload attachment** | P2 | BE/OPS | T003,T004,T014 | Upload vào object storage theo quota/type/size; trạng thái pending/ready/rejected rõ; file chưa kiểm tra không được phát công khai. |
| [ ] **T049 — Kiểm tra và truy cập file** | P2 | BE/OPS | T048 | Kiểm tra nội dung/quét file theo chính sách; download kiểm tra quyền, URL có hạn; cleanup file mồ côi hoạt động. |
| [ ] **T050 — UI attachment** | P2 | FE | T039,T049 | Có progress, cancel/retry, preview/download và trạng thái lỗi; không gửi tham chiếu file chưa sẵn sàng. |
| [ ] **T051 — Tìm kiếm lịch sử** | P2 | BE/FE | T003,T033 | Search PostgreSQL chỉ trả phòng có quyền; phân trang và truy vấn dữ liệu lớn đạt ngưỡng đã chốt. |
| [ ] **T052 — Sửa/xóa tin và đồng bộ event** | P2 | BE/FE | T003,T015,T031 | Nếu chọn: đúng tác giả/thời hạn/quyền; version chống ghi đè; mọi client và history phản ánh trạng thái mới. |
| [ ] **T053 — Block và report** | P2 | BE/FE | T003,T041 | Nếu chọn: block áp dụng nhất quán theo chính sách; report có luồng quản trị và audit. |
| [ ] **T054 — Mute và thông báo offline** | P2 | BE/FE | T003,T031,T043 | Nếu chọn: mute được tôn trọng; notification không trùng, không lộ nội dung ngoài chính sách và không gửi sau khi mất quyền. |
| [ ] **T055 — Responsive và accessibility** | P1 | FE/QA | T039,T041,T042,T043 | Chat dùng được trên mobile/desktop, bàn phím và screen reader; loading/empty/error/mạng chậm được kiểm tra. |
| [ ] **T056 — E2E sản phẩm đa thiết bị** | P1 | QA | T043,T055 | Core journey, nhiều tab và reconnect đạt; các tính năng P2 được chọn có test bổ sung sau task tương ứng. |

## 4. Bảo mật và triển khai

| Todo | Ưu tiên | Phụ trách | Phụ thuộc | Hoàn thành khi |
|---|---|---|---|---|
| [ ] **T057 — Settings và quản lý secret** | P1 | BE/OPS | T004,T006 | Tách local/staging/prod; deployment không chứa secret hardcode; giá trị từng lộ được thay và thu hồi phù hợp. |
| [ ] **T058 — HTTPS/WSS và origin allowlist** | P1 | OPS/BE | T045,T057 | DEBUG tắt; host/origin bị giới hạn; proxy upgrade WS, TLS và timeout được kiểm thử. |
| [ ] **T059 — Rate limit và quota** | P1 | BE/OPS | T002,T003,T045 | Login/send/create/upload/socket có giới hạn; thử vượt trả lỗi rõ; nhiều web instance dùng chung trạng thái giới hạn. |
| [ ] **T060 — Mạng riêng cho DB/Redis** | P1 | OPS | T004,T057 | DB/Redis không public; account tối thiểu quyền và TLS theo mô hình hạ tầng; kết nối trái phép bị chặn. |
| [ ] **T061 — Chính sách Redis theo vai trò** | P1 | OPS/BE | T026,T060 | Chốt tách broker/channel nếu cần; persistence, volume, eviction và dung lượng được cấu hình, restart được kiểm chứng. |
| [ ] **T062 — Build image tái tạo và scan** | P1 | OPS/BE/FE | T009,T057 | Dependency pin/lock; image theo commit; secret/dependency scan chạy trong CI, lỗi nghiêm trọng được xử lý. |
| [ ] **T063 — Health/readiness** | P1 | BE/OPS | T057,T060 | Có endpoint kiểm tra đúng dependency cần thiết; readiness chặn traffic khi chưa sẵn sàng, liveness không gây restart dây chuyền. |
| [ ] **T064 — Release job migration** | P1 | OPS/BE | T062,T063 | Migration chạy một lần, kiểm tra tương thích schema; bỏ migrate/--reload khỏi command phục vụ traffic. |
| [ ] **T065 — Graceful shutdown** | P1 | BE/OPS/FE | T036,T064 | Deploy không ngắt request đang commit sai cách; task/socket được drain hoặc reconnect và tải bù an toàn. |
| [ ] **T066 — Dựng staging tương đương production** | P1 | OPS | T058,T060,T061,T064,T065 | Staging có TLS, web/worker, DB/Redis, storage nếu dùng; deploy từ pipeline bằng cấu hình riêng. |
| [ ] **T067 — Security integration test** | P1 | QA/BE | T024,T038,T045,T058,T059,T066 | Test quyền REST/WS, token, origin, CSRF nếu dùng và giới hạn đạt; attachment được kiểm tra nếu chọn. |

## 5. Quan sát và kiểm chứng vận hành

| Todo | Ưu tiên | Phụ trách | Phụ thuộc | Hoàn thành khi |
|---|---|---|---|---|
| [ ] **T068 — Chốt SLO/RPO/RTO** | P1 | PO/OPS/BE | T002,T004 | Có giá trị, cửa sổ đo, tải kiểm thử và ngoại lệ mạng client; xác nhận hoặc sửa mục tiêu đề xuất trong roadmap. |
| [ ] **T069 — Structured logging và correlation** | P1 | BE | T020,T028 | Log nối được request/message/event/task; token và nội dung chat được loại khỏi log mặc định. |
| [ ] **T070 — Metrics pipeline** | P1 | BE/OPS | T030,T063,T068 | Thu được HTTP latency/error, WS/reconnect, outbox age/backlog, task lỗi, DB và Redis; retention metrics rõ. |
| [ ] **T071 — Đo latency end-to-end** | P1 | BE/FE/QA | T035,T070 | Đo riêng HTTP commit và lưu→nhận; dùng timestamp/correlation có tính sai lệch đồng hồ; không coi 201/202 là giao tin. |
| [ ] **T072 — Dashboard và alert** | P1 | OPS | T069,T070,T071 | Dashboard phản ánh SLO; alert có mức độ, người nhận, ngưỡng và liên kết runbook; thử phát alert thành công. |
| [ ] **T073 — Runbook sự cố** | P1 | OPS/BE | T072 | Có hướng dẫn DB/Redis down, backlog, deploy lỗi, sự cố quyền; có bước giảm tác động và kiểm chứng phục hồi. |
| [ ] **T074 — Backup và retention** | P1 | OPS | T003,T060,T068 | Backup DB, file nếu có; retention/mã hóa/quyền truy cập và PITR theo RPO được cấu hình; thất bại có alert. |
| [ ] **T075 — Diễn tập restore** | P1 | OPS/QA | T074 | Restore sang môi trường riêng, đối chiếu tin/file/quyền; ghi thời gian và điểm dữ liệu phục hồi đáp ứng RPO/RTO. |
| [ ] **T076 — Cập nhật k6 và dữ liệu tải** | P1 | QA/BE | T029,T066,T068 | Test dùng contract mới, nhiều user/room; tách lỗi functional/latency; không xóa dữ liệu khi tác vụ còn chạy. |
| [ ] **T077 — Load test gửi/đọc tin** | P1 | QA/BE | T033,T071,T076 | Có báo cáo tại tải mục tiêu và mức vượt đã chốt; ghi latency/error/backlog/DB, không chỉ số VU. |
| [ ] **T078 — Load test realtime** | P1 | QA/BE/FE | T037,T071,T076 | Đo peak sockets, fan-out phòng lớn và reconnect storm; không mất tin, tài nguyên và latency trong ngưỡng. |
| [ ] **T079 — Soak và failure test staging** | P1 | QA/OPS | T040,T072,T077,T078 | Chạy dài đủ cửa sổ thống nhất; thử worker/Redis/DB down; memory/backlog ổn định và phục hồi đúng SLO. |
| [ ] **T080 — Điều chỉnh capacity theo kết quả** | P1 | BE/OPS | T077,T078,T079 | Có sizing web/worker/DB/Redis, headroom, chi phí và kết quả retest các điểm từng thất bại. |

## 6. Beta và phát hành

| Todo | Ưu tiên | Phụ trách | Phụ thuộc | Hoàn thành khi |
|---|---|---|---|---|
| [ ] **T081 — Feature flag và rollout plan** | P1 | BE/OPS/PO | T003,T066 | Có nhóm beta, các bước mở traffic và điều kiện dừng/rollback theo SLO. |
| [ ] **T082 — Retention, privacy và xóa dữ liệu** | P1 | PO/BE/OPS | T003,T074 | Chính sách theo thị trường được review; job retention/account deletion thực hiện đúng, có audit và test. |
| [ ] **T083 — Diễn tập rollback** | P1 | OPS/BE | T064,T065,T066 | Release trước vẫn chạy với schema sau migration; rollback được thử và thời gian được ghi lại. |
| [ ] **T084 — Chốt support và trực vận hành** | P1 | PO/OPS | T073 | Có người chịu trách nhiệm, kênh support/report, mức độ incident, quy trình phản hồi và lịch vá dependency. |
| [ ] **T085 — Chạy beta giới hạn** | P1 | PO/QA/OPS | T056,T067,T075,T080,T081,T082,T083,T084 | Beta chạy qua cửa sổ quan sát đã chốt; ghi feedback, SLO, lỗi và chi phí; tính năng P2 đã chọn phải hoàn thành trước beta. |
| [ ] **T086 — Sửa lỗi chặn release từ beta** | P1 | BE/FE/OPS | T085 | Không còn lỗi nghiêm trọng mở; regression test hoặc bằng chứng kiểm chứng cho từng lỗi đã sửa. |
| [ ] **T087 — Kiểm tra release gates** | P1 | QA/PO/OPS | T086 | Các gate G01–G07 dưới đây có bằng chứng và người xác nhận. |
| [ ] **T088 — Phát hành theo rollout plan** | P1 | OPS/PO | T087 | Mở traffic theo từng bước, theo dõi SLO, ghi release note; vận hành tiếp nhận hệ thống. |

## 7. Release gates

| Todo | Bằng chứng cần liên kết | Task liên quan |
|---|---|---|
| [ ] **G01 — Quyền và bảo mật** | Báo cáo test REST/WS, user/room admin, token và file nếu có | T024,T038,T067 |
| [ ] **G02 — Độ bền tin nhắn** | Retry không trùng, failure test, reconnect/catch-up và replay outbox | T027,T031,T037,T040,T079 |
| [ ] **G03 — Hợp đồng sản phẩm** | E2E hai user, nhiều thiết bị, history, unread/read và lỗi | T025,T056 |
| [ ] **G04 — Hiệu năng** | Báo cáo HTTP + realtime tại tải mục tiêu, backlog và headroom | T068,T077,T078,T080 |
| [ ] **G05 — Khôi phục** | Biên bản restore thực tế đạt RPO/RTO | T074,T075 |
| [ ] **G06 — Triển khai** | Pipeline, migration, readiness, shutdown và rollback | T064,T065,T066,T083 |
| [ ] **G07 — Vận hành** | Dashboard/alert, runbook, beta, support và trực vận hành | T072,T073,T084,T085,T086 |

## 8. Sau phát hành — chỉ làm khi có số liệu

| Todo | Ưu tiên | Điều kiện bắt đầu | Hoàn thành khi |
|---|---|---|---|
| [ ] **T089 — Connection pooling** | P3 | DB connection hoặc churn là bottleneck | Pool tương thích transaction; load test chứng minh cải thiện và không lỗi session state. |
| [ ] **T090 — Read replica** | P3 | Read load vượt capacity sau tối ưu query | Chính sách replica lag/read-after-write rõ; history/quyền không trả dữ liệu sai do stale read. |
| [ ] **T091 — Tối ưu fan-out** | P3 | Phòng lớn làm latency/tài nguyên vượt SLO | Benchmark trước/sau cho thấy cải thiện và vẫn giữ quyền, catch-up, dedupe. |
| [ ] **T092 — Archive/partition dữ liệu** | P3 | Dung lượng/retention gây bottleneck | Migration, query, retention và restore được thử trên dữ liệu đại diện. |
| [ ] **T093 — Autoscaling web/worker** | P3 | Tải biến thiên cần tự điều chỉnh capacity | Scale theo socket/backlog, có giới hạn DB và graceful drain; không tăng chi phí ngoài ngưỡng. |
| [ ] **T094 — Đánh giá sharding/multi-region/services** | P3 | Giới hạn kiến trúc hiện tại được đo hoặc có yêu cầu mới | ADR có phương án, chi phí, consistency và migration; chỉ triển khai sau quyết định phạm vi mới. |

## Thứ tự khởi động đề xuất

1. Bắt đầu T001, T002, T003, T006, T008 và T010.
2. Tiếp tục T007,T009 và T011–T024 để khóa lỗi/quyền trước.
3. Chốt T020,T026; triển khai T027–T040 cho luồng tin bền vững.
4. Khởi động T004,T057 và staging sớm để kiểm chứng các mốc tiếp theo.
5. Hoàn thiện sản phẩm, bảo mật và vận hành theo dependencies; kết thúc bằng release gates và beta.

## Theo dõi thực hiện

Copy một dòng cho mỗi task khi bắt đầu. Cột trạng thái dùng: Chưa bắt đầu / Đang làm / Bị chặn / Chờ review / Hoàn thành. Các task ở trên hiện đều chưa bắt đầu.

| Task ID | Người thực hiện | Trạng thái | PR/tài liệu/kết quả test | Vướng mắc | Ngày hoàn thành |
|---|---|---|---|---|---|
| T010 | BE | Hoàn thành | specs/001-room-access/evidence.md; chat.tests | — | 2026-10-12 |
| T011 | BE | Hoàn thành | specs/001-room-access/evidence.md; chat.tests | — | 2026-10-12 |
| T014 | BE | Hoàn thành | specs/001-room-access/evidence.md; chat.tests | — | 2026-10-12 |
