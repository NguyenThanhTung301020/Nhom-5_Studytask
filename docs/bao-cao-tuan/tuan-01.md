# Báo cáo tuần 1 (05/10 – 10/10/2026)

- **Đề tài:** Xây dựng một website quản lý deadline học tập cho sinh viên (sản phẩm: StudyTask)
- **GVHD:** TS. Huỳnh Xuân Phụng · **Mã môn:** GRPR401979
- **Nhóm:** Nguyễn Thanh Tùng (24TX810027) · Trần Đức Tùng (24TX810026) · Trương Thanh Vui (24TX810021)
- **Repo GitHub (public):** https://github.com/NguyenThanhTung301020/Nhom-5_Studytask
- **Sản phẩm đang chạy:** https://sutdytask.io.vn
- **Nhật ký sử dụng AI tuần 1:** [docs/ai-log/tuan-01.md](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/ai-log/tuan-01.md)

## 1. Trọng tâm tuần và lý do chưa có commit sửa mã

Tuần 1 là tuần **rà soát và lập kế hoạch**. Nhóm đọc lại toàn bộ mã nguồn của đợt trước, đối chiếu với nhận xét của GVHD và GVPB, rồi lập kế hoạch sửa. Vì vậy trong tuần **không có commit sửa mã nguồn**.

Commit duy nhất trên repo là [`3ae6c68`](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/3ae6c68431e8474e8623e7164f5d20771c10a338) (14/10/2026). Commit này đưa nguyên trạng mã nguồn hiện có lên GitHub, không chứa thay đổi mới. Các file nhóm đã rà soát được liệt kê ở mục 2 và mục 3, link trỏ đúng tới commit này.

## 2. Công việc đã làm và phân công

| # | Công việc | Người làm | Minh chứng (link GitHub) |
|---|---|---|---|
| 1 | Đọc lại phần lõi: component gốc, lớp Firebase, hằng số, Security Rules | Nguyễn Thanh Tùng | [app.js](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/app.js) · [utils/firebase.js](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/utils/firebase.js) · [utils/constants.js](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/utils/constants.js) · [firestore.rules](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/firestore.rules) |
| 2 | Rà soát bảo mật Rules, luồng tài khoản và luồng chấm điểm: tìm được 7 vấn đề (mục 3) | Nguyễn Thanh Tùng | Xem link từng vấn đề ở mục 3 |
| 3 | Đọc lại các trang học tập: Dashboard, Môn học, Deadline, Trắc nghiệm, Lịch, Thống kê, Thư viện, Tiện ích | Trần Đức Tùng | [pages/Subjects.js](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Subjects.js) · [pages/Quiz.js](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Quiz.js) · [pages/Deadlines.js](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Deadlines.js) · [pages/Schedule.js](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Schedule.js) · [pages/Tools.js](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Tools.js) |
| 4 | Tìm hiểu công cụ cho kiến trúc mới: Vite, Firebase Emulator, Cloud Functions, GitHub Actions | Trần Đức Tùng | Nguyên tắc tách môi trường trong file báo cáo Word (mục 4.3) |
| 5 | Đọc lại các trang quản lý: Quản trị, Quản lý lớp, Bảng điểm, Hồ sơ, Liên hệ | Trương Thanh Vui | [pages/Admin.js](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Admin.js) · [pages/Reports.js](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Reports.js) · [components/GradeBook.js](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/components/GradeBook.js) · [pages/Profile.js](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Profile.js) · [pages/Contact.js](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Contact.js) |
| 6 | Tổng hợp 11 nhận xét của GVHD và GVPB thành bảng nhận xét → nguyên nhân → hướng khắc phục | Nguyễn Thanh Tùng | Bảng 2 trong file báo cáo Word |
| 6b | Đối chiếu sản phẩm với tiêu chí chấm điểm TC1–TC6; lập nhật ký sử dụng AI tuần 1 | Trương Thanh Vui | Bảng 5 trong file báo cáo Word · [docs/ai-log/tuan-01.md](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/ai-log/tuan-01.md) |
| 7 | Lập bảng Giữ / Bỏ / Sửa / Thêm tính năng (21 mục, có lý do) | Cả nhóm | Bảng 6 trong file báo cáo Word |

## 3. Kết quả rà soát (7 vấn đề, kèm link dòng mã)

| Mã | Vấn đề | Mức độ | Vị trí |
|---|---|---|---|
| V1 | Mật khẩu lưu dạng văn bản thuần; mọi tài khoản đã đăng nhập đều đọc được (GVPB đã nêu) | Nghiêm trọng | [utils/firebase.js#L105-L111](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/utils/firebase.js#L105-L111) · [firestore.rules#L11-L12](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/firestore.rules#L11-L12) |
| V2 | Người dùng tự sửa được trường `role`, `subjectIds` trong hồ sơ của mình, nên sinh viên có thể tự nâng quyền thành admin (mới) | Nghiêm trọng | [firestore.rules#L13](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/firestore.rules#L13) |
| V3 | Đáp án đúng lưu trong dữ liệu dùng chung; bài được chấm điểm ở trình duyệt (mới) | Cao | [pages/Quiz.js#L222-L230](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Quiz.js#L222-L230) · [firestore.rules#L21-L22](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/firestore.rules#L21-L22) |
| V4 | `activities`: mọi tài khoản đọc được; sinh viên tự ghi được điểm của mình (mới) | Cao | [firestore.rules#L29-L32](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/firestore.rules#L29-L32) |
| V5 | Tin nhắn Liên hệ hỗ trợ chỉ lưu ở dữ liệu của người gửi, Quản trị viên không nhận được (mới) | Trung bình | [app.js#L468-L472](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/app.js#L468-L472) · [pages/Contact.js#L41](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Contact.js#L41) |
| V6 | Dữ liệu mẫu tự được ghi bổ sung lên Firestore (mới) | Trung bình | [app.js#L43-L50](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/app.js#L43-L50) · [app.js#L132-L138](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/app.js#L132-L138) |
| V7 | Máy tính bỏ túi tính biểu thức bằng `Function()` | Thấp | [pages/Tools.js#L23](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Tools.js#L23) |

Các vấn đề trên mới được xác định bằng cách đọc mã; nhóm **không** thử khai thác trên hệ thống đang chạy.

## 4. Khó khăn, vướng mắc

- Hệ thống đang có người dùng thật, nên mọi bản vá phải được thử ở môi trường riêng trước.
- Cloud Functions và Storage cần nâng cấp lên gói Firebase Blaze (có trả phí).
- Chuyển sang Vite + JSX là thay đổi lớn (≈ 5.900 dòng JavaScript).
- Chưa có lớp học thật để thử nghiệm.

## 5. Kế hoạch tuần 2 (12/10 – 17/10/2026)

| # | Công việc | Người phụ trách | Kết quả cần đạt |
|---|---|---|---|
| 1 | Xử lý GitHub: hoàn thiện repo (README, `.gitignore`, gỡ file cấu hình cá nhân), quy ước nhánh và commit; mỗi thành viên commit bằng tài khoản của mình | Nguyễn Thanh Tùng | Repo có README; cả 3 thành viên có commit |
| 2 | Chạy lại ứng dụng trên máy local, ghi lại các bước cài đặt và lỗi gặp phải | Trương Thanh Vui | Ứng dụng chạy được ở local; hướng dẫn chạy được đưa vào README |
| 3 | Tìm và cập nhật một vài chức năng. Trước tiên: tái hiện và sửa lỗi **gửi yêu cầu cập nhật hồ sơ** (lỗi tồn tại từ TLCN) – [pages/Profile.js](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Profile.js) · [app.js#L334-L341](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/app.js#L334-L341) | Nguyễn Thanh Tùng | Ghi rõ nguyên nhân lỗi; có commit sửa |
| 4 | Tìm hiểu và thiết kế trang lưu trữ hồ sơ tài khoản | Trần Đức Tùng | Bản thiết kế giao diện và cấu trúc dữ liệu trong `docs/` |
| 5 | Làm lại sơ đồ use case và luồng dữ liệu theo hiện trạng mã nguồn. **Nhóm tự vẽ, không dùng AI tạo sơ đồ**, để áp dụng cho đồ án | Cả nhóm | Sơ đồ trong `docs/`; mỗi thành viên giải thích được phần mình phụ trách |
| 6 | Cập nhật nhật ký sử dụng AI tuần 2, đối chiếu với commit | Cả nhóm | `docs/ai-log/tuan-02.md` |

## 6. Kính xin ý kiến Thầy

- Duyệt bảng Giữ / Bỏ / Sửa / Thêm tính năng.
- Đồng ý nâng cấp gói Firebase Blaze, hoặc chấp nhận phương án thay thế.
- Cho phép nhóm vá V1, V2 trên hệ thống đang chạy sau khi đã thử ở môi trường riêng.
