# Báo cáo tuần 1

- Đề tài: Xây dựng một website quản lý deadline học tập cho sinh viên (sản phẩm: StudyTask)
- GVHD: TS. Huỳnh Xuân Phụng
- Nhóm: Nguyễn Thanh Tùng (24TX810027) · Trần Đức Tùng (24TX810026) · Trương Thanh Vui (24TX810021)
- Repo GitHub (public): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask
- Toàn bộ link minh chứng: xem mục 8 (các mã [R1], [F1], [L1]... trong bài trỏ tới mục này)

1. Trọng tâm tuần và lý do chưa có commit sửa mã

Tuần 1 là tuần rà soát và lập kế hoạch. Nhóm đọc lại toàn bộ mã nguồn của đợt trước, đối chiếu với nhận xét của GVHD và GVPB, rồi lập kế hoạch sửa. Vì vậy trong tuần không có commit sửa mã nguồn.

Repo có 2 commit, không commit nào sửa mã nguồn ứng dụng:
- 3ae6c68 (14/10/2026) [R2]: đưa nguyên trạng mã nguồn hiện có lên GitHub, không chứa thay đổi mới.
- 53662e8 [R3]: thêm tài liệu (báo cáo tuần, nhật ký AI) và .gitignore, gỡ file cấu hình cá nhân khỏi repo.

Các file nhóm đã rà soát là các file ở mục 8.2 và 8.3, link trỏ đúng tới commit 3ae6c68.

2. Công việc đã làm và phân công

| # | Công việc | Người làm | Minh chứng |
|---|---|---|---|
| 1 | Đọc lại phần lõi: component gốc, lớp Firebase, hằng số, Security Rules | Nguyễn Thanh Tùng | Mục 8.2, nhóm [F1]–[F4] |
| 2 | Rà soát bảo mật Rules, luồng tài khoản và luồng chấm điểm: tìm được 7 vấn đề | Nguyễn Thanh Tùng | Mục 3 và mục 8.3, mã [L1]–[L11] |
| 3 | Đọc lại các trang học tập: Dashboard, Môn học, Deadline, Trắc nghiệm, Lịch, Thống kê, Thư viện, Tiện ích | Trần Đức Tùng | Mục 8.2, nhóm [F5]–[F9] |
| 4 | Tìm hiểu công cụ cho kiến trúc mới: Vite, Firebase Emulator, Cloud Functions, GitHub Actions | Trần Đức Tùng | Mục 8.5, mã [D4] |
| 5 | Đọc lại các trang quản lý: Quản trị, Quản lý lớp, Bảng điểm, Hồ sơ, Liên hệ | Trương Thanh Vui | Mục 8.2, nhóm [F10]–[F14] |
| 6 | Tổng hợp 11 nhận xét của GVHD và GVPB thành bảng nhận xét → nguyên nhân → hướng khắc phục | Nguyễn Thanh Tùng | Mục 8.5, mã [D1] |
| 7 | Đối chiếu sản phẩm với tiêu chí chấm điểm TC1–TC6; lập nhật ký sử dụng AI tuần 1 | Trương Thanh Vui | Mục 8.5, mã [D2]; nhật ký AI [R4] |
| 8 | Lập bảng Giữ / Bỏ / Sửa / Thêm tính năng (21 mục, có lý do) | Cả nhóm | Mục 8.5, mã [D3] |

3. Kết quả rà soát (7 vấn đề)

| Mã | Vấn đề | Mức độ | Link dòng mã (mục 8.3) |
|---|---|---|---|
| V1 | Mật khẩu lưu dạng văn bản thuần; mọi tài khoản đã đăng nhập đều đọc được (GVPB đã nêu) | Nghiêm trọng | [L1], [L2] |
| V2 | Người dùng tự sửa được trường role, subjectIds trong hồ sơ của mình, nên sinh viên có thể tự nâng quyền thành admin (mới) | Nghiêm trọng | [L3] |
| V3 | Đáp án đúng lưu trong dữ liệu dùng chung; bài được chấm điểm ở trình duyệt (mới) | Cao | [L4], [L5] |
| V4 | activities: mọi tài khoản đọc được; sinh viên tự ghi được điểm của mình (mới) | Cao | [L6] |
| V5 | Tin nhắn Liên hệ hỗ trợ chỉ lưu ở dữ liệu của người gửi, Quản trị viên không nhận được (mới) | Trung bình | [L7], [L8] |
| V6 | Dữ liệu mẫu tự được ghi bổ sung lên Firestore (mới) | Trung bình | [L9], [L10] |
| V7 | Máy tính bỏ túi tính biểu thức bằng Function() | Thấp | [L11] |

Các vấn đề trên mới được xác định bằng cách đọc mã; nhóm không thử khai thác trên hệ thống đang chạy.

4. Khó khăn, vướng mắc

- Hệ thống đang có người dùng thật, nên mọi bản vá phải được thử ở môi trường riêng trước.
- Cloud Functions và Storage cần nâng cấp lên gói Firebase Blaze (có trả phí).
- Chuyển sang Vite + JSX là thay đổi lớn (≈ 5.900 dòng JavaScript).
- Chưa có lớp học thật để thử nghiệm.

5. Kế hoạch tuần 2 (12/10 – 17/10/2026)

| # | Công việc | Người phụ trách | Kết quả cần đạt |
|---|---|---|---|
| 1 | Xử lý GitHub: hoàn thiện repo (README, .gitignore, gỡ file cấu hình cá nhân), quy ước nhánh và commit; mỗi thành viên commit bằng tài khoản của mình | Nguyễn Thanh Tùng | Repo có README; cả 3 thành viên có commit |
| 2 | Chạy lại ứng dụng trên máy local, ghi lại các bước cài đặt và lỗi gặp phải | Trương Thanh Vui | Ứng dụng chạy được ở local; hướng dẫn chạy được đưa vào README |
| 3 | Tìm và cập nhật một vài chức năng. Trước tiên: tái hiện và sửa lỗi "gửi yêu cầu cập nhật hồ sơ" (lỗi tồn tại từ TLCN). Code liên quan: [P1], [P2] | Nguyễn Thanh Tùng | Ghi rõ nguyên nhân lỗi; có commit sửa |
| 4 | Tìm hiểu và thiết kế trang lưu trữ hồ sơ tài khoản | Trần Đức Tùng | Bản thiết kế giao diện và cấu trúc dữ liệu trong docs/ |
| 5 | Làm lại sơ đồ use case và luồng dữ liệu theo hiện trạng mã nguồn. Nhóm tự vẽ, không dùng AI tạo sơ đồ, để áp dụng cho đồ án | Cả nhóm | Sơ đồ trong docs/; mỗi thành viên giải thích được phần mình phụ trách |
| 6 | Cập nhật nhật ký sử dụng AI tuần 2, đối chiếu với commit | Cả nhóm | docs/ai-log/tuan-02.md |

6. Kính xin ý kiến Thầy

- Duyệt bảng Giữ / Bỏ / Sửa / Thêm tính năng.
- Đồng ý nâng cấp gói Firebase Blaze, hoặc chấp nhận phương án thay thế.
- Cho phép nhóm vá V1, V2 trên hệ thống đang chạy sau khi đã thử ở môi trường riêng.

7. Khai báo sử dụng AI

- Công cụ AI: Claude Code (Anthropic), tiện ích trong VS Code
- Model: Claude Opus 5.5 (07/10 – 14/10/2026) và Claude Sonnet 5.5 (từ 15/10/2026)
- Người sử dụng: Nguyễn Thanh Tùng (soạn báo cáo, nhật ký, tài liệu; 07/10, 12/10, 14/10, 15/10); Trương Thanh Vui và Trần Đức Tùng (07/10, rà soát mã nguồn)
- Công cụ AI khác: không dùng
- Phạm vi sử dụng: rà soát mã nguồn và firestore.rules để tìm 7 vấn đề V1–V7; lập bảng nhận xét, bảng đối chiếu tiêu chí, bảng Giữ/Bỏ/Sửa/Thêm; soạn báo cáo tuần và nhật ký AI; tách link GitHub
- Mã nguồn do AI sinh: không có. AI chỉ tạo tài liệu trong docs/ và tệp .gitignore (commit 53662e8 và các commit tài liệu tiếp theo, đều có nhãn [AI])
- Phần nhóm tự làm và kiểm tra: mở từng file, từng dòng mã AI chỉ ra để kiểm chứng; tự quyết định phân công và phạm vi Giữ/Bỏ/Sửa/Thêm; Kế hoạch tuần 2 do nhóm tự lập (ghi chú viết tay), AI chỉ trình bày lại; tự tạo repo, tự commit và push
- Sai sót của AI nhóm đã phát hiện và sửa: ghi sai tên đề tài; hướng dẫn đính kèm tệp (vi phạm yêu cầu); xác định lỗ hổng chỉ bằng đọc mã, chưa chạy thử
- Bằng chứng: nhật ký AI chi tiết, có prompt nguyên văn từng lần dùng, tại [R4]

8. Danh sách link GitHub

8.1. Repo, commit và tài liệu

- [R1] Repo (public): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask
- [R2] Commit 3ae6c68 (đưa mã hiện có lên GitHub): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/3ae6c68431e8474e8623e7164f5d20771c10a338
- [R3] Commit 53662e8 (thêm tài liệu, .gitignore): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/53662e83b19b987716b4e30f37aa4c604585b5f0
- [R4] Nhật ký sử dụng AI tuần 1: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/ai-log/tuan-01.md
- [R5] Báo cáo tuần 1 (file này): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/bao-cao-tuan/tuan-01.md

8.2. Các file đã rà soát, chia theo thành viên (commit 3ae6c68)

Nguyễn Thanh Tùng:
- [F1] app.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/app.js
- [F2] utils/firebase.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/utils/firebase.js
- [F3] utils/constants.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/utils/constants.js
- [F4] firestore.rules: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/firestore.rules

Trần Đức Tùng:
- [F5] pages/Subjects.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Subjects.js
- [F6] pages/Quiz.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Quiz.js
- [F7] pages/Deadlines.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Deadlines.js
- [F8] pages/Schedule.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Schedule.js
- [F9] pages/Tools.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Tools.js

Trương Thanh Vui:
- [F10] pages/Admin.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Admin.js
- [F11] pages/Reports.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Reports.js
- [F12] components/GradeBook.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/components/GradeBook.js
- [F13] pages/Profile.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Profile.js
- [F14] pages/Contact.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Contact.js

8.3. Link tới đúng dòng mã của 7 vấn đề (commit 3ae6c68)

- [L1] V1 – utils/firebase.js dòng 105–111 (lưu password): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/utils/firebase.js#L105-L111
- [L2] V1 – firestore.rules dòng 11–12 (ai đăng nhập cũng đọc được user): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/firestore.rules#L11-L12
- [L3] V2 – firestore.rules dòng 13 (tự ghi được hồ sơ, kể cả role): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/firestore.rules#L13
- [L4] V3 – pages/Quiz.js dòng 222–230 (chấm điểm ở trình duyệt): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Quiz.js#L222-L230
- [L5] V3 – firestore.rules dòng 21–22 (sharedData ai cũng đọc được): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/firestore.rules#L21-L22
- [L6] V4 – firestore.rules dòng 29–32 (activities): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/firestore.rules#L29-L32
- [L7] V5 – app.js dòng 468–472 (contacts chỉ lưu ở userData): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/app.js#L468-L472
- [L8] V5 – pages/Contact.js dòng 41 (gửi liên hệ): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Contact.js#L41
- [L9] V6 – app.js dòng 43–50 (state khởi tạo bằng dữ liệu mẫu): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/app.js#L43-L50
- [L10] V6 – app.js dòng 132–138 (ghi bổ sung lên Firestore): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/app.js#L132-L138
- [L11] V7 – pages/Tools.js dòng 23 (Function()): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Tools.js#L23

8.4. Code liên quan tới việc tuần 2 (lỗi gửi yêu cầu cập nhật hồ sơ)

- [P1] pages/Profile.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Profile.js
- [P2] app.js dòng 334–341 (hàm handleProfileSave): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/app.js#L334-L341

8.5. Tài liệu phân tích (minh chứng cho các mục công việc 4, 6, 7, 8)

- [D1] Bảng nhận xét GVHD/GVPB và hướng khắc phục (11 nhận xét): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/01-nhan-xet-gvhd-gvpb.md
- [D2] Đối chiếu tiêu chí chấm điểm TC1–TC6: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/02-doi-chieu-tieu-chi-tc1-tc6.md
- [D3] Bảng Giữ / Bỏ / Sửa / Thêm tính năng (21 mục, có lý do): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/03-giu-bo-sua-them.md
- [D4] Nguyên tắc tách môi trường dev / staging / production: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/04-tach-moi-truong.md
