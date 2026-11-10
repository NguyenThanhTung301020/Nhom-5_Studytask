# Máy chủ StudyTask (thay Firebase)

API Python chỉ dùng thư viện chuẩn, lưu dữ liệu bằng SQLite. Lý do chuyển đổi và bằng chứng: [docs/thiet-ke/06-chuyen-firebase-sang-may-chu-rieng.md](../docs/thiet-ke/06-chuyen-firebase-sang-may-chu-rieng.md).

## Chạy thử trên máy cá nhân

```bash
export STUDYTASK_DATA=/tmp/studytask-dev        # nơi lưu cơ sở dữ liệu và file tải lên
python3 server/studytask_api.py create-user admin MatKhau123 admin "Quản trị viên"
python3 server/studytask_api.py serve           # nghe 127.0.0.1:8787
```

API chỉ phục vụ `/api/*`. Để chạy cả giao diện cần một web server chuyển `/api/` tới cổng 8787 và `/uploads/` tới thư mục `uploads` (xem `deploy/nginx-studytask.conf`). Riêng `/uploads/submissions/` (bài nộp của sinh viên) không phục vụ trực tiếp: nginx chuyển về `GET /api/files/submissions/<tên tệp>`, API kiểm tra đăng nhập và chỉ cho người nộp hoặc nhân viên (admin/giáo viên/đào tạo) tải; phản hồi `Cache-Control: private, no-store`. Tệp nộp trước khi có bảng `submission_files` không có chủ ghi nhận nên chỉ nhân viên mở được.

## Lệnh quản trị

| Lệnh | Việc làm |
|---|---|
| `create-user USERNAME PASSWORD ROLE "Tên"` | Tạo tài khoản. `ROLE`: `admin`, `teacher`, `training`, `finance`, `student`. Tên đăng nhập 3–32 ký tự `a-z 0-9 . _ -` |
| `set-password USERNAME PASSWORD` | Đặt lại mật khẩu (đăng xuất mọi phiên) |
| `delete-user USERNAME` | Xóa tài khoản và dữ liệu liên quan |
| `mail-config SMTP_HOST PORT USER "Tên <mail>"` | Lưu cấu hình gửi email (hỏi mật khẩu SMTP, ghi vào `$STUDYTASK_DATA/mail.json`, quyền 600) |
| `mail-test EMAIL` | Gửi thử một thư |

Biến môi trường: `STUDYTASK_DATA` (mặc định `/var/lib/studytask`), `STUDYTASK_PORT` (mặc định 8787), `STUDYTASK_MAIL_DEBUG=1` (chỉ để thử: ghi nội dung email ra log thay vì gửi).

### Gửi email (mã khôi phục mật khẩu)

Với Gmail: bật xác minh 2 bước, tạo "mật khẩu ứng dụng" tại https://myaccount.google.com/apppasswords, rồi

```bash
python3 /opt/studytask/studytask_api.py mail-config smtp.gmail.com 587 TEN@gmail.com "StudyTask <TEN@gmail.com>"
python3 /opt/studytask/studytask_api.py mail-test email_nhan@example.com
```

Không cần khởi động lại dịch vụ. Lỗi gửi được ghi dòng `MAIL-ERROR` trong `journalctl -u studytask-api`.

## Các tuyến API

| Nhóm | Tuyến |
|---|---|
| Xác thực | `POST /api/auth/login`, `/logout`, `/forgot`, `/reset`, `/change-password`; `GET /api/auth/me` |
| Tài khoản | `GET /api/account`; `POST/DELETE /api/account/email`, `POST /api/account/email/verify`; `POST/DELETE /api/account/avatar` |
| Dữ liệu | `GET /api/doc/{collection}`, `GET/PUT/DELETE /api/doc/{collection}/{id}`, `POST /api/doc/{collection}/{id}/append` |
| Quản trị | `POST /api/admin/users`, `POST /api/admin/users/{uid}/password`, `DELETE /api/admin/users/{uid}` |
| File | `POST /api/upload?filename=` (giáo viên/admin), `POST /api/upload?filename=&hw=` (sinh viên nộp bài) |
| Hỗ trợ | `GET /api/chat/status`, `/threads`, `/messages`; `POST /api/chat/messages`, `/read`; `GET /api/events` (Server-Sent Events) |

Phân quyền theo vai trò nằm trong hàm `can()`, chuyển từ `firestore.rules`.

## Kiểm thử

```bash
python3 tests/server/test_migrate.py
python3 tests/server/test_account.py
python3 tests/server/test_users.py
bash tests/server/test_submit.sh
```

Mỗi bộ test tự tạo cơ sở dữ liệu tạm và cổng riêng, không đụng dữ liệu thật. Cũng chạy tự động trong job `server-tests` của CI.

## Triển khai lên Ubuntu

```bash
sudo bash deploy/deploy.sh
```

Script cài API vào `/opt/studytask`, đăng ký dịch vụ systemd `studytask-api`, chép giao diện vào `/var/www/studytask` và nạp cấu hình nginx. Dữ liệu nằm ở `/var/lib/studytask` (ngoài thư mục web). Báo cáo thông số máy chủ: `bash deploy/server-report.sh`.

## Sao lưu

```bash
sudo tar czf ~/studytask-backup-$(date +%F).tar.gz /var/lib/studytask
```
