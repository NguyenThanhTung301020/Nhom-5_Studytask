# Sửa lỗi 02 – Hai lỗi ở luồng email cá nhân (tuần 6)

Ngày: 11/11/2026. Phát hiện khi review PR27, ghi trong [báo cáo tuần 5](../bao-cao-tuan/tuan-05.md) mục việc tồn đọng, chuyển sang tuần 6.
Thiết kế gốc: [07-xac-thuc-email-ca-nhan.md](../thiet-ke/07-xac-thuc-email-ca-nhan.md).
Có AI tham gia đọc mã, viết kiểm thử và sửa (commit có nhãn `[AI]`).

## 1. Phạm vi đã đọc

| Tầng | Tệp | Nội dung |
|---|---|---|
| Giao diện | `components/AccountCards.js` | Thẻ email cá nhân: xin mã, xác nhận, gỡ |
| Giao diện | `components/Login.js` | Quên mật khẩu: xin mã, đặt lại |
| Giao diện | `utils/firebase.js` dòng 117–123 | Gọi API, không xử lý gì thêm |
| Máy chủ | `server/studytask_api.py` | Bảng `contact_email`, `codes`; `make_code`, `check_code`, `find_uid`; các tuyến `/auth/forgot`, `/auth/reset`, `/account/email*`; xóa tài khoản |

Giao diện chỉ chuyển tiếp yêu cầu và hiện thông báo lỗi do máy chủ trả về. Cả hai lỗi đều nằm ở máy chủ, nên **không sửa giao diện**.

## 2. Lỗi 1 – `INSERT OR REPLACE` khi xác minh email

### Hiện tượng

1. Tài khoản A và B cùng xin mã liên kết `x@gmail.com` khi email này chưa thuộc ai. Cả hai đều qua bước kiểm tra trùng.
2. A nhập mã trước, nên A có email `x@gmail.com`.
3. B nhập mã sau và cũng thành công. **Liên kết của A mất mà không có thông báo nào.** Từ đó `x@gmail.com` và mọi yêu cầu quên mật khẩu bằng địa chỉ này đều trỏ về B.

Kiểm thử tái hiện trên mã cũ: B xác minh nhận `200` thay vì `409`, A có `recoveryEmail = None`, bảng `contact_email` chỉ còn dòng của B.

### Nguyên nhân

```sql
contact_email (uid TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL COLLATE NOCASE, verified_at REAL NOT NULL)
```

- Bảng có **hai** ràng buộc duy nhất: `uid` và `email`.
- `INSERT OR REPLACE` xử lý vi phạm ở **bất kỳ** ràng buộc duy nhất nào bằng cách **xóa dòng đang có** rồi chèn dòng mới. Vì vậy dòng `(A, x@gmail.com)` bị xóa do trùng `email`.
- Bước kiểm tra trùng (`SELECT 1 FROM contact_email WHERE email=? AND uid<>?`) chỉ chạy ở `POST /account/email` lúc **xin mã**. Bước **xác minh** (`POST /account/email/verify`) không kiểm tra lại.
- Mã cũ: `studytask_api.py` dòng 1146 (bản `master` 3c6c875).

### Có ghi đè dữ liệu tài khoản không?

| Bảng | Bị ảnh hưởng? |
|---|---|
| `accounts` (tên đăng nhập, mật khẩu băm) | Không. Câu lệnh chỉ chạm `contact_email` |
| `docs` `user/{uid}` (hồ sơ) | Không |
| `contact_email` của **tài khoản khác** | **Có**: bị xóa |
| `contact_email` của chính mình | Khi đổi email, dòng cũ bị xóa rồi chèn lại. Kết quả đúng nhưng do may mắn chứ không do thiết kế |

Kiểm thử chụp `accounts` và `docs user/{uid}` của A, B trước và sau toàn bộ luồng, và xác nhận không có gì thay đổi.

### Cách sửa

Hàm mới `link_email(uid, email)`:

1. Kiểm tra lại email có thuộc tài khoản khác không. Nếu có → `409 email-in-use` (cùng mã lỗi và thông báo mà giao diện đã xử lý ở bước xin mã).
2. Trong một giao dịch: `UPDATE contact_email ... WHERE uid=?`. Nếu chưa có dòng nào thì `INSERT` thường (không REPLACE).
3. Nếu vẫn vi phạm `UNIQUE(email)` (lớp bảo vệ cuối ở CSDL) thì `ROLLBACK` và trả `409`.
4. Hủy mã đặt lại mật khẩu đang chờ (xem lỗi 2).

API, cấu trúc bảng và giao diện không đổi. Mã xác minh của B đã bị dùng, nên B phải bắt đầu lại và sẽ nhận `409` ngay ở bước xin mã.

## 3. Lỗi 2 – Mã đặt lại mật khẩu vẫn dùng được sau khi gỡ email

### Hiện tượng

1. Người dùng bấm "Quên mật khẩu". Mã gửi tới email cá nhân `c@gmail.com`, có hiệu lực 15 phút.
2. Người dùng gỡ email này, chẳng hạn vì nghi hộp thư bị lộ, hoặc đổi sang email khác.
3. Ai đang giữ mã trong hộp thư cũ vẫn gọi `POST /auth/reset` với **tên đăng nhập** + mã, và **đặt lại được mật khẩu** trong 15 phút đó.

Kiểm thử tái hiện trên mã cũ: cả trường hợp gỡ email và đổi email đều trả `200`, mật khẩu bị đổi.

### Vòng đời của mã (trước khi sửa)

| Sự kiện | Bảng `codes` (`purpose='reset'`) |
|---|---|
| `forgot` | Chèn/thay mã mới, lưu `email` nhận mã, hạn 15 phút |
| `reset` đúng mã | Xóa mã (dùng 1 lần) ✔ |
| Sai 5 lần / quá hạn | Bị từ chối ✔ |
| **Gỡ email** (`DELETE /account/email`) | **Không đụng tới**: mã còn nguyên ✘ |
| **Đổi email** (xác minh email mới) | **Không đụng tới** ✘ |
| Admin xóa tài khoản | Xóa ✔ |

### Nguyên nhân

- `DELETE /account/email` chỉ xóa dòng `contact_email` mà không xóa mã trong `codes` (dòng 1151 bản cũ).
- `POST /auth/reset` tìm tài khoản theo **tên đăng nhập** hoặc email. Sau đó nó chỉ gọi `check_code('reset', uid, code)` (dòng 1103 bản cũ), kiểm tra mã băm, hạn và số lần thử, mà **không đối chiếu** email nhận mã (`codes.email`) với email đang liên kết. Vì vậy dù email đã bị gỡ, tra bằng tên đăng nhập vẫn ra `uid`, và mã cũ vẫn hợp lệ.

### Cách sửa (hai lớp)

| Lớp | Sửa |
|---|---|
| 1. Hủy mã khi điều kiện mất | `unlink_email(uid)` xóa `contact_email` **và** mã `reset` của uid trong cùng giao dịch. `link_email` cũng xóa mã `reset` khi đổi sang email mới |
| 2. Kiểm tra khi dùng mã | Ở `/auth/reset`: sau khi mã đúng, email nhận mã phải **trùng** email đang liên kết. Nếu không thì trả `400 bad-code`. Lần thử này được tính vào giới hạn sai theo IP, và mã đã bị tiêu hủy nên không thử lại được |

Lớp 2 bảo vệ cả khi liên kết bị gỡ bằng đường khác mà không qua API. Kiểm thử mô phỏng bằng cách xóa thẳng dòng trong CSDL.

Mã liên kết (`purpose='link'`) không bị ảnh hưởng: nó tự bị xóa khi xác minh thành công, và gỡ email không làm nó nguy hiểm, vì nó chỉ gắn email cho chính tài khoản đã đăng nhập.

## 4. Kiểm thử tự động

Tệp mới: `tests/server/test_email_codes.py` (cổng 8799, dữ liệu tạm, `STUDYTASK_MAIL_DEBUG=1`), đã thêm vào CI (`server-tests`).

| Nhóm | Ca kiểm thử |
|---|---|
| Lỗi 1 | Hai tài khoản cùng xin mã cho một email; A xác minh → 200; B xác minh → **409**; A vẫn giữ email; B không có email; CSDL chỉ có 1 dòng thuộc A; `accounts` + hồ sơ A, B không đổi; A vẫn đăng nhập bằng mật khẩu cũ; mã của B không dùng lại được |
| Lỗi 1 – đổi email | A đổi sang email mới → chỉ còn 1 dòng; hồ sơ không đổi; email cũ được giải phóng, B liên kết được |
| Lỗi 2 – hợp lệ | Mã đúng, còn hạn → đặt lại được, đăng nhập bằng mật khẩu mới |
| Lỗi 2 – đã dùng | Dùng lại mã vừa dùng → 400 |
| Lỗi 2 – không hợp lệ | Mã sai → 400; mã đúng nhưng tên tài khoản không tồn tại → 400 |
| Lỗi 2 – hết hạn | Đặt `expires` về quá khứ → 400, mật khẩu không đổi |
| Lỗi 2 – gỡ email | Mã bị xóa khỏi CSDL; mã cũ → 400; mật khẩu không đổi |
| Lỗi 2 – đổi email | Mã gửi tới email cũ → 400; mật khẩu không đổi |
| Lỗi 2 – phòng thủ | Liên kết bị xóa thẳng trong CSDL → mã cũ vẫn bị từ chối |
| Lỗi 2 – quên MK | Tài khoản không còn email thì không gửi thư nào |

Kết quả:

| Lệnh | Trên mã cũ (`master` 3c6c875) | Sau khi sửa |
|---|---|---|
| `python3 tests/server/test_email_codes.py` | **11 ca lỗi** (4 ca lỗi 1, 7 ca lỗi 2) | TẤT CẢ ĐẠT (32 ca) |
| `test_account.py`, `test_migrate.py`, `test_profile_lock.py`, `test_activities.py`, `test_users.py`, `test_admin_reset.py`, `test_quiz_v3.py`, `test_quiz_extra.py`, `test_shared_scope.py`, `test_graduation.py` | — | Đều ĐẠT (chạy trên Windows, Python 3.12.10, SQLite 3.49.1) |
| `tests/server/test_submit.sh` | — | Không chạy được trên máy Windows (thiếu lệnh `python3`); không liên quan tới email, chạy trên CI Linux |

## 5. Còn lại / không thuộc phạm vi

- Admin đặt lại mật khẩu (`POST /api/users/{uid}/password`) không hủy mã `reset` đang chờ. Mã đó vẫn chỉ tới đúng email đang liên kết của chủ tài khoản, nên không phải lỗ hổng. Có thể hủy thêm nếu nhóm muốn.
- Cần triển khai `studytask_api.py` lên máy chủ thì lỗi mới hết trên bản đang chạy. Ghi biên bản trong `docs/van-hanh/` sau khi gộp.
