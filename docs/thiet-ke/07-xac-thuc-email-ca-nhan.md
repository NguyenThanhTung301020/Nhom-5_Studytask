# 07. Liên kết email cá nhân và đặt lại mật khẩu bằng mã xác nhận

Ngày: 04/11/2026. Tiếp nối [06](06-chuyen-firebase-sang-may-chu-rieng.md). Tài liệu này mô tả luồng xác thực email đã có trong `server/studytask_api.py`, cách cấu hình gửi thư và những gì đã kiểm chứng.

## 1. Nguyên tắc

Tên đăng nhập là chuỗi ký tự, mật khẩu được băm (PBKDF2-HMAC-SHA256, 200.000 vòng, muối riêng từng tài khoản). Email **không dùng để đăng nhập**, chỉ là email cá nhân tùy chọn để:

1. nhận mã khi quên mật khẩu hoặc mất quyền truy cập;
2. chứng minh người dùng thật sự sở hữu hộp thư đó.

Máy chủ gửi thư từ **một tài khoản Gmail chung của nhóm** (người gửi). Mọi thư đều đi từ tài khoản này tới email của người dùng.

## 2. Hai luồng

| Luồng | Tuyến API | Điều kiện | Kết quả |
|---|---|---|---|
| Liên kết email | `POST /api/account/email` rồi `POST /api/account/email/verify` | Đã đăng nhập **và nhập lại mật khẩu hiện tại** | Email được đánh dấu đã xác minh |
| Quên mật khẩu | `POST /api/auth/forgot` rồi `POST /api/auth/reset` | Nhập tên đăng nhập hoặc email **đã xác minh** | Đặt mật khẩu mới, đăng xuất mọi phiên cũ |

Gỡ liên kết: `DELETE /api/account/email`.

## 3. Giới hạn bảo vệ

| Biện pháp | Giá trị |
|---|---|
| Mã xác nhận | 6 chữ số, chỉ lưu bản băm SHA-256, không lưu mã gốc |
| Hiệu lực | 15 phút |
| Số lần nhập sai tối đa | 5 lần cho mỗi mã |
| Giãn cách gửi lại | 60 giây |
| Hạn mức gửi theo địa chỉ IP | 6 thư mỗi giờ |
| `forgot` | Luôn trả 200 dù tài khoản có tồn tại hay không, để không dò được tên tài khoản |
| Sau khi đặt lại mật khẩu | Mọi phiên đăng nhập cũ bị hủy |

Các điểm này được kiểm thử trong `tests/server/test_account.py`.

## 4. Cấu hình gửi thư (SMTP)

Cấu hình **không nằm trong repo**. Nó được lưu ở `/var/lib/studytask/mail.json` trên máy chủ (quyền 600), nên không bị công khai qua GitHub hay nginx.

1. Dùng một Gmail riêng của nhóm, bật Xác minh 2 bước, tạo **mật khẩu ứng dụng** tại https://myaccount.google.com/apppasswords. Gmail không cho chương trình đăng nhập SMTP bằng mật khẩu thường.
2. Trên máy chủ:

```bash
python3 /opt/studytask/studytask_api.py mail-config smtp.gmail.com 587 TEN@gmail.com "StudyTask <TEN@gmail.com>"
python3 /opt/studytask/studytask_api.py mail-test EMAIL_NHAN
```

Lệnh `mail-config` hỏi mật khẩu trực tiếp trên máy chủ (không hiện ký tự), không truyền qua tham số dòng lệnh nên không để lại trong lịch sử lệnh. Không cần khởi động lại dịch vụ. Lỗi gửi được ghi dòng `MAIL-ERROR` trong `journalctl -u studytask-api`.

### Sự cố đã gặp khi cấu hình và cách xử lý

| Hiện tượng | Nguyên nhân | Xử lý |
|---|---|---|
| `MAIL-ERROR SMTPServerDisconnected('Connection unexpectedly closed')` | Mật khẩu ứng dụng lưu sai (dài 27 ký tự, đúng ra 16): ký tự thừa khi dán. Kết nối TCP và TLS tới Gmail vẫn thành công, Gmail ngắt đúng ở bước đăng nhập | Chạy lại `mail-config`, gõ tay 16 chữ cái liền nhau, không dấu cách |
| Mạng IPv6 báo `Network is unreachable` | Máy chủ chỉ có IPv4 | Không ảnh hưởng: thư viện tự chuyển sang IPv4 |

Cách chẩn đoán dùng được lại: từ máy chủ, chạy `openssl s_client -connect smtp.gmail.com:587 -starttls smtp -brief` để tách lỗi mạng khỏi lỗi mật khẩu.

## 5. Đã kiểm chứng và chưa kiểm chứng

| Nội dung | Tình trạng |
|---|---|
| Máy chủ kết nối được `smtp.gmail.com` cổng 587 và 465 (TLS 1.3) | Đã kiểm chứng ngày 04/11/2026 |
| `mail-test` gửi thư thành công tới hộp thư thật | Đã kiểm chứng, do thành viên nhóm xác nhận |
| Logic mã, hết hạn, giới hạn lần thử, đặt lại mật khẩu | Đã kiểm thử tự động (`test_account.py`, dùng `STUDYTASK_MAIL_DEBUG=1` nên không gửi thư thật) |
| Luồng liên kết email và quên mật khẩu **trên giao diện web** với thư thật | **Chưa ghi nhận kết quả**, cần thử tay rồi bổ sung |

## 6. Hạn chế

1. Gmail giới hạn khoảng 500 thư mỗi ngày. Đủ cho quy mô nhóm, không đủ cho triển khai rộng.
2. Mật khẩu ứng dụng nằm dạng văn bản trong `mail.json` (quyền 600). Cần sao lưu file này cùng thư mục dữ liệu, và thu hồi mật khẩu ứng dụng nếu nghi bị lộ.
3. Nếu người dùng mất cả mật khẩu lẫn quyền vào email cá nhân, vẫn phải nhờ quản trị viên đặt lại bằng `set-password`.
