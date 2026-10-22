# Sửa lỗi 01 – Gửi yêu cầu cập nhật hồ sơ (tuần 2)

Người phụ trách: Nguyễn Thanh Tùng. Mục công việc số 3 của kế hoạch tuần 2.
Lỗi tồn tại từ bản TLCN. Code liên quan: `pages/Profile.js` (hàm `handleSave`) và `app.js` (hàm `handleProfileSave`, `loadAppData`).

## 1. Hiện tượng người dùng gặp

- Bấm **Lưu & đồng bộ** xong không thấy thông báo gì, không biết đã lưu hay chưa.
- Khi mạng chập chờn, nút đứng mãi ở **Đang lưu…**, không báo lỗi.
- Sửa số điện thoại trong Hồ sơ nhưng Quản trị viên và trang Danh bạ vẫn thấy số cũ.
- Tài khoản mới đăng nhập lần đầu thấy sẵn mã sinh viên `2021001234`, GPA `3.20`, lớp `KTPM2021A`... không phải của mình; giáo viên mới thấy cả các trường của sinh viên.
- Trên máy dùng chung: người đăng nhập sau có thể nhận hồ sơ của người đăng nhập trước.

## 2. Nguyên nhân (đọc mã, đối chiếu commit 3ae6c68)

| # | Nguyên nhân | Vị trí (commit 3ae6c68) |
|---|---|---|
| N1 | Thông báo "Đã lưu lên Firebase" nằm **bên trong** khối `editing && ...`, nhưng ngay khi lưu xong lại gọi `setEditing(false)` nên thông báo không bao giờ hiện ra | `pages/Profile.js` dòng 220–232 và 345–347 |
| N2 | Firestore Web SDK không báo lỗi khi mất mạng: Promise của `setDoc` chờ tới khi máy chủ xác nhận. Mã `await saveUserKey(...)` không có thời hạn, nên giao diện treo ở "Đang lưu…" | `app.js` dòng 338 |
| N3 | `handleProfileSave` chỉ chép **tên** sang `user/{uid}`. Số điện thoại chỉ nằm trong `userData/{uid}.profile`, mà trang Quản trị và Danh bạ lại đọc `user/{uid}.phone` | `app.js` dòng 339; `pages/Directory.js` dòng 48 |
| N4 | Khi tài khoản chưa có hồ sơ trên Firestore, `loadAppData` lấy `localStorage.st_profile`. Khóa này không gắn với tài khoản nào, nên tài khoản B nhận hồ sơ của tài khoản A đăng nhập trước trên cùng máy, rồi bản đó còn bị ghi ngược lên Firestore của B | `app.js` dòng 83–87, 106, 141–149 |
| N5 | Hồ sơ mặc định luôn là `DEFAULT_PROFILE` (dữ liệu mẫu của sinh viên demo) cho mọi vai trò, kể cả tài khoản thật | `app.js` dòng 83–87; `pages/Profile.js` dòng 127 |
| N6 | `useEffect(..., [profile])` ghi đè form mỗi khi `profile` đổi, kể cả lúc người dùng đang sửa | `pages/Profile.js` dòng 218 |
| N7 | Không kiểm tra dữ liệu: lưu được tên rỗng, số điện thoại hay GPA sai định dạng | `pages/Profile.js` dòng 220 |

Thêm 2 lỗi phát hiện khi chạy thử trên Emulator, cùng luồng tài khoản:

| # | Nguyên nhân | Vị trí |
|---|---|---|
| N8 | Nút **Đăng xuất** chỉ xóa state, không gọi `signOut` của Firebase. Tải lại trang thì tự đăng nhập lại tài khoản cũ | `app.js` dòng 203–216 |
| N9 | Khi chưa đăng nhập, `dataReady` được đặt `true`, nên ngay lúc vừa đăng nhập các `useEffect` có thể ghi dữ liệu mẫu lên Firestore trước khi tải xong dữ liệu thật (liên quan V6) | `app.js` dòng 184 |

## 3. Cách sửa

| # | Sửa | Tệp |
|---|---|---|
| N1 | Thông báo lưu thành công chuyển lên phần tiêu đề, hiện 4 giây sau khi thoát chế độ sửa. Thông báo lỗi có kèm lý do | `pages/Profile.js` |
| N2 | Ghi Firestore **trước**, xong mới cập nhật state. Mỗi lần ghi có thời hạn 10 giây, quá hạn thì báo "Máy chủ chưa phản hồi…" | `app.js` (`withTimeout`, `handleProfileSave`) |
| N3 | Chép cả `name` và `phone` sang `user/{uid}`, làm mới cache danh sách người dùng | `app.js` |
| N4 | Lưu khóa `st_owner` = uid của chủ dữ liệu trong localStorage; chỉ dùng lại dữ liệu cá nhân khi đúng chủ | `app.js` (`loadMine`) |
| N5 | Hồ sơ mặc định theo vai trò; sinh viên thật dùng `BLANK_STUDENT_PROFILE`, dữ liệu mẫu chỉ còn ở chế độ demo | `utils/constants.js`, `app.js`, `pages/Profile.js` |
| N6 | Chỉ đồng bộ lại form khi không ở chế độ sửa | `pages/Profile.js` |
| N7 | Thêm `validateProfile`: tên bắt buộc, tối đa 100 ký tự; số điện thoại Việt Nam; GPA 0–4; email đúng định dạng. Lỗi hiện ngay dưới từng ô | `pages/Profile.js` |
| N8 | `handleLogout` gọi `fbLogout()` | `app.js` |
| N9 | Khi chưa đăng nhập giữ `dataReady = false` | `app.js` |

Security Rules mới (vá V2) chỉ cho chủ tài khoản sửa `name` và `phone` trong `user/{uid}`. Vì vậy luồng lưu hồ sơ vẫn chạy, còn các trường `role`, `subjectIds`, `expiresAt` bị chặn.

## 4. Tái hiện và kiểm tra lại trên Emulator

Chuẩn bị: `npm run emulators`, `npm run seed`, `npm run serve` (xem README).

| Bước | Trước khi sửa | Sau khi sửa |
|---|---|---|
| Đăng nhập `student@studytask.vn`, vào Hồ sơ | Mã SV `2021001234`, GPA `3.20` (dữ liệu mẫu) | Các trường "Chưa cập nhật" |
| Sửa họ tên = khoảng trắng, bấm Lưu | Lưu được tên rỗng | Báo "Họ và tên không được để trống." |
| Sửa số điện thoại = `12ab` | Lưu được | Báo "Số điện thoại không hợp lệ" |
| Nhập đúng, bấm Lưu | Không có thông báo | Hiện "Đã lưu lên Firebase" |
| Mở Emulator UI (cổng 4000) → `user/{uid}` | `phone` không đổi | `name`, `phone` đã cập nhật |
| Tắt Emulator rồi bấm Lưu | Treo ở "Đang lưu…" | Sau 10 giây báo "Máy chủ chưa phản hồi…" |
| Đăng xuất, tải lại trang | Tự đăng nhập lại | Ở lại màn hình đăng nhập |
| Đăng nhập `teacher@studytask.vn` trên cùng trình duyệt | (với tài khoản chưa có hồ sơ) nhận hồ sơ của người trước | Hồ sơ giáo viên riêng |

Ngày 17/10/2026, AI (Claude Code) chạy các bước trên bằng trình duyệt Edge tự động (Playwright) trên Emulator trên máy của Trương Thanh Vui và báo kết quả đạt, trừ bước "tắt Emulator rồi bấm Lưu" chưa chạy tự động. Nhóm chưa tự kiểm tra lại bằng tay: bước này và các bước còn lại cần thành viên thử tay trước khi coi là đã xác nhận.

## 5. Còn tồn tại

- Tài khoản thật đã từng nhận dữ liệu mẫu (N5) trên production thì dữ liệu đó vẫn nằm trong `userData/{uid}.profile`. Người dùng tự xóa trong Hồ sơ, hoặc nhóm viết script dọn khi có Admin SDK (tuần 3).
- Hai tab cùng trình duyệt đăng nhập hai tài khoản khác nhau vẫn có thể gây ghi bị từ chối (Firebase Auth dùng chung phiên giữa các tab). Chưa xử lý vì ít gặp.
