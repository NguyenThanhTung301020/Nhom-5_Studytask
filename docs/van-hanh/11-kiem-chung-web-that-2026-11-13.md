# Biên bản kiểm chứng trên web thật – 13/11/2026

- Người thực hiện: **Nguyễn Thanh Tùng**. AI (Claude Code) thao tác trên trình duyệt trong ứng dụng theo yêu cầu của Thanh Tùng; Thanh Tùng tự đăng nhập, AI không nhập mật khẩu.
- Hệ thống: https://sutdytask.io.vn (máy chủ StudyTask đang chạy, dữ liệu thật). `master` lúc kiểm tra: `c4a11a5`.
- Thời gian: 13/11/2026, 13:05–13:20 UTC (20:05–20:20 giờ Việt Nam).
- Liên quan: [biên bản gỡ Firebase](02-bien-ban-go-firebase-sutdytask.md) mục 4, 6; [báo cáo vận hành](01-bao-cao-suc-khoe-may-chu.md) mục 8.4a; PR #50, #51, #52.

## 1. Đăng nhập và lưu dữ liệu sau khi gỡ Firebase

Tài khoản: `admin` (Quản trị viên), Thanh Tùng đăng nhập trên giao diện. Trang **Hồ sơ của tôi** → **Chỉnh sửa**.

| Bước | Kết quả |
|---|---|
| Đăng nhập trên giao diện | Đạt. `GET /api/auth/me` trả 200, đúng tài khoản `admin` |
| Nhập số điện thoại thử `0900000001`, bấm **Lưu & đồng bộ** (13:13 UTC) | Đạt. Giao diện báo "Đã lưu lên máy chủ" |
| Đọc lại từ máy chủ bằng API (`GET /api/doc/user/<uid>`, `GET /api/doc/userData/<uid>`) | Đạt. Cả `user.phone` và `userData.profile.phone` là `0900000001` (hai nơi được ghi trong cùng giao dịch, PR #41) |
| Xóa `localStorage`, `sessionStorage` rồi tải lại trang | Đạt. Vẫn đăng nhập (phiên nằm ở cookie), trang Hồ sơ hiện `0900000001`: dữ liệu lấy từ máy chủ, không phải bản lưu trên trình duyệt |
| Trả lại như cũ: xóa số điện thoại, bấm **Lưu & đồng bộ** (13:14 UTC) | Đạt. Máy chủ trả về số điện thoại rỗng ở cả hai nơi, giống trước khi thử |

Kết luận: sau khi gỡ Firebase, đăng nhập và lưu dữ liệu trên web thật hoạt động hoàn toàn qua máy chủ riêng.

Giới hạn: chỉ thử bằng tài khoản Quản trị viên và một loại dữ liệu (hồ sơ). Chưa thử bằng tài khoản sinh viên, giáo viên.

## 2. PR #50, #51, #52 trên web thật

### 2.1. Giao diện đang chạy so với `master`

Trang chủ nạp giao diện từ thư mục phiên bản `v202611120758/` (triển khai ngày 12/11 07:58 UTC). So SHA256 của 48 tệp `.js`, `.css` tải từ `https://sutdytask.io.vn/v202611120758/…` với `master` `c4a11a5`:

- **40 tệp trùng**;
- **8 tệp khác**: `components/AccountManager.js`, `pages/Admin.js`, `pages/Profile.js`, `pages/Schedule.js`, `pages/Subjects.js`, `utils/constants.js`, `utils/scope.js`, `utils/tuition.js`. Đây là các tệp của phần dữ liệu lớp học (PR #54): bản triển khai ngày 12/11 là bản trước khi gộp, khác bản đã gộp.

Với PR #50 (R1), cả 3 tệp giao diện đều đã có phần sửa:

| Tệp | So với `master` | Phần sửa của PR #50 |
|---|---|---|
| `pages/Deadlines.js` | Trùng | Có |
| `pages/Quiz.js` | Trùng | Có |
| `pages/Subjects.js` | Khác 3 dòng (nhãn học kỳ `termLabel` của PR #54) | Có: 3 chỗ cập nhật theo `prev` (thêm, sửa, xóa môn) |

PR #51 và PR #52 chỉ sửa máy chủ, không có tệp giao diện.

### 2.2. Phía máy chủ: chưa kiểm chứng được

- Máy chủ không có điểm cuối nào báo phiên bản mã. Hash `studytask_api.py` chỉ đọc được qua SSH.
- Theo báo cáo vận hành mục 8.4a (sáng 13/11), API trên máy chủ (`d26d2f72…`) khác `master`. Vì vậy chưa thể khẳng định máy chủ đã có `teacher_shared_ok` (PR #50), hai bản sửa email (PR #51) và bản vá V4 (PR #52).
- Các hành vi cần thử đều cần tài khoản giáo viên hoặc sinh viên: giáo viên sửa môn (PR #50), sinh viên tự ghi điểm hoặc xóa nhật ký (PR #52), luồng email cá nhân (PR #51). Lần này chỉ có tài khoản Quản trị viên, nên chưa thử.

**Việc tiếp theo:** sau khi đưa máy chủ về đúng `master` (việc 3, kế hoạch tuần 7), so hash `studytask_api.py` với `master` rồi thử lại các hành vi trên bằng tài khoản giáo viên và sinh viên do Trương Thanh Vui cấp (việc 4, kế hoạch tuần 7).
