## 1. Data model và migration

- [x] 1.1 Thêm model Prisma `Conversation` (quan hệ `jobId`, `applicantAccountId`, `recruiterAccountId` hoặc derive recruiter từ job owner), unique constraint `(jobId, applicantAccountId)`
- [x] 1.2 Thêm model `Message` (`conversationId`, `senderAccountId`, `body`, `createdAt`) và index phục vụ phân trang lịch sử
- [x] 1.3 Chạy migration và `prisma generate`; kiểm tra rollback script nếu cần *(đã `db push` + generate — DB dev trước đó dùng `db push` nên chưa có file migrate lịch sử)*

## 2. Domain service và phân quyền

- [x] 2.1 Triển khai service `findOrCreateConversation(jobId, applicantAccountId, actorAccountId)` với kiểm tra quyền recruiter/applicant
- [x] 2.2 Tách guard/policy: recruiter chỉ truy cập job mình sở hữu (hoặc rule đã chốt trong Open Questions)
- [x] 2.3 Hàm `assertParticipant(conversationId, accountId)` dùng chung cho HTTP và WebSocket

## 3. REST API

- [x] 3.1 `GET /conversations` (lọc theo role: applicant vs recruiter) hoặc endpoint tương đương theo convention dự án
- [x] 3.2 `GET /conversations/:id/messages?cursor=` phân trang tin nhắn
- [x] 3.3 `POST /conversations/:id/messages` tạo tin nhắn (fallback khi socket không khả dụng); validate độ dài nội dung

## 4. Real-time (Socket.io)

- [x] 4.1 Gateway JWT handshake; sau khi xác thực, chỉ join room `conversation:{id}` khi `assertParticipant` thành công
- [x] 4.2 Sự kiện gửi tin nhắn: persist → emit tới room; xử lý lỗi và acknowledgement nếu cần
- [ ] 4.3 (Tùy chọn MVP+) Cấu hình Redis adapter khi chạy nhiều instance

## 5. Luồng tích hợp nghiệp vụ

- [x] 5.1 Trong luồng tạo `Application`, gọi `findOrCreateConversation` (transaction cùng apply nếu có thể)
- [x] 5.2 Endpoint hoặc action “recruiter bắt đầu chat với applicant” trên một job — idempotent với conversation đã tồn tại

## 6. Frontend

- [x] 6.1 UI danh sách hội thoại theo job / theo user (theo wireframe sản phẩm)
- [x] 6.2 Khung chat: tải lịch sử phân trang, kết nối socket, hiển thị tin nhắn mới real-time
- [x] 6.3 Xử lý ngắt kết nối / reconnect và trạng thái lỗi gửi tin *(fallback HTTP khi socket lỗi/timeout)*

## 7. Kiểm thử và vận hành

- [x] 7.1 Unit test service conversation + guard; e2e hoặc integration cho REST và socket (ít nhất happy path)
- [x] 7.2 Kiểm tra người ngoài không đọc được tin nhắn (negative test) *(unit: assertParticipant)*
- [ ] 7.3 Ghi chú triển khai: biến môi trường, bật Redis adapter khi scale
