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

## 4. Tái hiện và kiểm tra lại trên máy chủ riêng (cập nhật tuần 6)

> Các mục 1–3 mô tả lỗi và cách sửa ở thời điểm tuần 2, khi hệ thống còn dùng Firebase. Từ tuần 5 hệ thống chạy trên máy chủ riêng ([D06]), nên mục 4 và 5 được viết lại cho máy chủ. Bản cũ cho Emulator (`npm run emulators`, `npm run seed`, Emulator UI cổng 4000, "Đã lưu lên Firebase") không còn chạy được và đã bỏ.

**Chuẩn bị.** Chạy API tạm với dữ liệu tạm, không đụng dữ liệu thật (cần Python 3 và một web server chuyển `/api/` tới API; xem `server/README.md` và `deploy/nginx-studytask.conf`):

```bash
export STUDYTASK_DATA=$(mktemp -d) STUDYTASK_PORT=8787
python3 server/studytask_api.py create-user admin01 matkhau123 admin "Admin Test"
python3 server/studytask_api.py create-user sv01 matkhau123 student "Sinh Vien Test"
python3 server/studytask_api.py create-user gv01 matkhau123 teacher "Giao Vien Test"
python3 server/studytask_api.py serve
```

Sau khi thử xong: dừng API và xóa thư mục `$STUDYTASK_DATA`.

| Bước | Trước khi sửa (tuần 2) | Sau khi sửa (máy chủ) | Kiểm tra bằng |
|---|---|---|---|
| Đăng nhập `sv01`, vào Hồ sơ | Mã SV `2021001234`, GPA `3.20` (dữ liệu mẫu) | Các trường "Chưa cập nhật" | Giao diện |
| Đăng nhập `admin01`, sửa họ tên = khoảng trắng, bấm Lưu | Lưu được tên rỗng | Báo "Họ và tên không được để trống."; tên trên máy chủ không đổi. Sinh viên/giáo viên không có ô họ tên, chỉ có email và số điện thoại ([PR29]) | Giao diện; `tests/server/test_profile_lock.py` |
| Số điện thoại `12ab`; email `khong-phai-email` | Lưu được | Báo "Số điện thoại không hợp lệ (VD: 0901234567)." và "Email không hợp lệ." | Giao diện |
| Nhập đúng, bấm Lưu | Không có thông báo | Hiện "Đã lưu lên máy chủ" | Giao diện |
| Kiểm tra dữ liệu: `GET /api/doc/user/{uid}` và `GET /api/doc/userData/{uid}` | `phone` không đổi | `phone` đổi ở `user` và `userData.profile`; `email` đổi ở `userData.profile` | `curl` hoặc DevTools (thay cho Emulator UI) |
| Giữ yêu cầu ghi 15 giây (ví dụ làm chậm bằng proxy) | Treo ở "Đang lưu…" | Sau khoảng 10 giây báo "Lưu thất bại – thử lại: Máy chủ chưa phản hồi…" | Giao diện |
| Tắt API rồi bấm Lưu | Treo ở "Đang lưu…" | Sau khoảng 2 giây báo "Lưu thất bại – thử lại: Lỗi máy chủ (502)" (qua nginx) | Giao diện |
| Đăng xuất, tải lại trang | Tự đăng nhập lại | Ở lại màn hình đăng nhập | Giao diện |
| Đăng nhập `gv01`, rồi `admin01` trên cùng trình duyệt | Nhận hồ sơ của người trước | Hồ sơ riêng theo vai trò, không có dữ liệu của người trước | Giao diện |

**Kết quả đã có.** Ngày 06/11/2026, AI (Claude Code) thao tác trình duyệt thử 8/8 bước trên máy chủ tạm, dữ liệu tạm, máy của Trương Thanh Vui; chưa thử qua nginx và Cloudflare Tunnel ([PR35]). Phần kiểm tra bằng mã (`test_profile_lock.py` 18/18) chạy trong CI.

**Chưa xác nhận.** Chưa có thành viên tự thử tay các bước trên. Người thử ghi kết quả vào bảng dưới đây (ngày, người thử, đạt/không đạt từng bước) trước khi coi là đã xác nhận.

| Ngày | Người thử | Máy / môi trường | Kết quả từng bước | Ghi chú |
|---|---|---|---|---|
| | | | | |

## 5. Còn tồn tại

- **Lỗi lưu một nửa dữ liệu khi máy chủ chậm** ([PR35] mục 4.1): giao diện báo "Lưu thất bại" sau 10 giây nhưng yêu cầu đầu vẫn tới máy chủ, nên `userData` có số mới còn `user` giữ số cũ. Cần quyết định có sửa hay không; hướng đề xuất là ghi hai nơi trong một yêu cầu duy nhất ở máy chủ, hoặc để máy chủ tự đồng bộ `phone` từ `userData.profile` khi ghi.
- Dữ liệu mẫu cũ (N5): tài khoản từng nhận dữ liệu mẫu ở thời Firebase đã được chuyển sang máy chủ cùng hồ sơ; người dùng tự xóa trong Hồ sơ, hoặc Admin dọn bằng script khi cần. Từ [PR23] hệ thống không còn tự nạp dữ liệu mẫu.
- Hai tab cùng trình duyệt đăng nhập hai tài khoản khác nhau dùng chung cookie phiên, nên tab đăng nhập sau thay phiên của tab trước. Chưa xử lý vì ít gặp.

[D06]: ../thiet-ke/06-chuyen-firebase-sang-may-chu-rieng.md
[PR29]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/29
[PR35]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/35
