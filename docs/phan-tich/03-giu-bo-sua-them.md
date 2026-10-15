# Bảng 6. Quyết định Giữ / Bỏ / Sửa / Thêm tính năng (tuần 1)

Người thực hiện: cả nhóm. Dùng cho mục công việc số 8 của báo cáo tuần 1.

Nguyên tắc:
- Không viết lại từ đầu; giữ các module lõi đã chạy ổn, xây dựng lại theo từng phần.
- Mỗi thay đổi đều truy được về một nhận xét của giảng viên, góp ý người dùng thử hoặc tiêu chí chấm điểm.
- Thứ tự ưu tiên: bảo mật, đúng nghiệp vụ, chất lượng mã và kiểm thử, rồi mới đến tính năng mới.
- Tính năng mới được phát triển ở môi trường riêng, không chạy chung với hệ thống đang vận hành (xem file môi trường, mục D4 trong báo cáo).

Mã V1–V7 là 7 vấn đề rà soát ở mục 3 của báo cáo tuần 1.

| # | Tính năng / thành phần | Quyết định | Lý do | Căn cứ | Tuần |
|---|---|---|---|---|---|
| | **BỎ** | | | | |
| 1 | Lưu mật khẩu trong Firestore; cột "Mật khẩu" và chức năng Admin tự nhập mật khẩu mới cho người khác | Bỏ | Lỗ hổng V1; không được lưu mật khẩu dạng văn bản thuần. Thay bằng Cloud Function + Admin SDK hoặc email đặt lại mật khẩu | GVPB | 2–3 |
| 2 | Tiện ích Giải trí, Dịch thuật (chỉ mở Google Translate), Máy tính bỏ túi | Bỏ | Ngoài nghiệp vụ quản lý học tập, không tạo giá trị riêng; máy tính dùng Function() (V7). Thu gọn để tập trung vào nghiệp vụ lõi | GVHD (tính khả thi) | 7 |
| 3 | Tự nạp dữ liệu mẫu vào Firestore và chế độ demo trên bản đang chạy | Bỏ | Dữ liệu mẫu lẫn vào dữ liệu thật (V6). Dữ liệu mẫu chỉ còn dùng qua script seed trên môi trường dev/Emulator | Nhóm rà soát | 6 |
| 4 | Instance Firebase phụ để tạo tài khoản và đổi mật khẩu bằng đăng nhập ngầm | Bỏ | Phụ thuộc vào mật khẩu lưu trữ; thay bằng Admin SDK chạy ở máy chủ | GVPB | 3 |
| | **SỬA** | | | | |
| 5 | Firestore Security Rules | Sửa | Chặn người dùng tự sửa role, subjectIds, expiresAt (V2); giới hạn đọc activities (V4); kiểm tra trường, kiểu dữ liệu khi ghi | GVPB; nhóm rà soát | 2, 6 |
| 6 | Trắc nghiệm | Sửa | Tách đáp án ra collection chỉ giáo viên đọc được; chấm điểm bằng Cloud Function; điểm do máy chủ ghi (V3, V4) | GVHD (tính khả thi); nhóm rà soát | 4 |
| 7 | Cấu trúc dữ liệu sharedData/global | Sửa | Tách thành collection theo môn học để vượt giới hạn 1 MB và phân quyền đọc theo môn | GVPB | 6 |
| 8 | Cách tính điểm trung bình môn | Sửa | Cho giáo viên cấu hình trọng số trắc nghiệm / bài tập / chuyên cần theo quy chế | GVPB | 7 |
| 9 | Nền tảng front-end (React UMD qua CDN, không JSX) | Sửa | Chuyển sang Vite + JSX + ESLint để có bước build tối ưu, cải thiện LCP 2,9 s và Lighthouse 72/100 | GVPB | 5 |
| 10 | Liên hệ hỗ trợ | Sửa | Chuyển tin nhắn vào collection riêng (supportTickets) để Quản trị viên xem và phản hồi (V5) | Nhóm rà soát | 7 |
| | **THÊM** | | | | |
| 11 | Cloud Functions (backend): quản lý tài khoản, gán vai trò bằng custom claims, chấm trắc nghiệm | Thêm | Đưa nghiệp vụ nhạy cảm ra khỏi trình duyệt; bổ sung phần thiết kế, lập trình backend | GVPB | 3–4 |
| 12 | Git/GitHub, quy ước nhánh và commit; CI/CD bằng GitHub Actions | Thêm | Chứng minh quá trình làm việc, đối chiếu nhật ký AI, tự động kiểm thử và triển khai | GVHD (dùng AI); TC2 CI/CD | 2, 5 |
| 13 | Kiểm thử tự động: rules unit test, Vitest, Playwright | Thêm | Thay thế kiểm thử thủ công; chạy trong CI | GVPB; TC2 | 2, 10 |
| 14 | Nhập danh sách lớp từ tệp CSV/Excel | Thêm | Giáo viên đưa lớp thật vào hệ thống nhanh, không phải tạo từng tài khoản – điều kiện để áp dụng thực tế | GVHD (tính khả thi) | 7 |
| 15 | Nộp tệp trực tiếp (Firebase Storage) | Thêm | Không phụ thuộc liên kết Google Drive/OneDrive | GVPB; người dùng thử | 8 |
| 16 | Xem lịch theo tháng | Thêm | 2/5 người dùng thử nghiệm đề nghị | Người dùng thử | 8 |
| 17 | PWA và thông báo đẩy nhắc deadline | Thêm | 3/5 người dùng thử nghiệm đề nghị; nhắc việc khi không mở ứng dụng | Người dùng thử; GVPB | 9 |
| 18 | Thử nghiệm với lớp thật và đo KPI | Thêm | Chứng minh tính khả thi bằng số liệu thực tế | GVHD; TC1, TC2 | 11 |
| | **GIỮ** | | | | |
| 19 | Dashboard, Môn học, Bài tập, Tài liệu, Deadline, Trắc nghiệm, Lịch học – Lịch thi, Thống kê, Bảng điểm, Quản lý lớp, Quản trị, Hồ sơ, Thông báo trong ứng dụng | Giữ | Là nghiệp vụ lõi, cả hai giảng viên ghi nhận "đầy đủ chức năng"; sẽ chỉnh theo các mục Sửa ở trên | GVHD, GVPB (ưu điểm) | – |
| 20 | Thư viện số, Tin tức, Biểu mẫu, Pomodoro, Quy đổi điểm, Ghi chú nhanh, tùy chỉnh giao diện, chế độ tối | Giữ | Chi phí bảo trì thấp, hỗ trợ trực tiếp việc học; không mở rộng thêm trong đợt này | Nhóm đánh giá | – |
| 21 | RBAC hai lớp; offline-first với cờ dataReady | Giữ | Được GVPB đánh giá là điểm mạnh kỹ thuật; tiếp tục củng cố bằng rules test | GVPB (ưu điểm) | – |
