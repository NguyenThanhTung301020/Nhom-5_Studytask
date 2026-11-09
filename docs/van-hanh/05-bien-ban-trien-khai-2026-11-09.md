# Biên bản triển khai ngày 09/11/2026

Người thực hiện: Trương Thanh Vui. Việc 1 của kế hoạch tuần 6 (triển khai lại sau sự cố ghi đè 06/11) và việc 11 (siết quyền tải bài nộp).

## 1. Bản đã triển khai

| Mục | Giá trị |
|---|---|
| Thời điểm | 09/11/2026, khoảng 07:55 UTC (14:55 giờ Việt Nam; giờ ghi theo thời gian sửa đổi của `utils/sanitize.js` trên máy chủ) |
| Nguồn | Nhánh `test/tuan6-vui-reset-mk-va-quyen-tai-bai-nop`, commit `0ab9fde` (chưa gộp vào `master`; nhánh gồm toàn bộ `master` tại `53296f0`, tức đã có [PR37]) |
| Cách làm | `git clone` nhánh trên vào `~/studytask-deploy` rồi `sudo bash deploy/deploy.sh` |
| Người xem và gộp PR | Thành viên khác của nhóm, sau khi triển khai; ghi lại ở mục 4 khi gộp xong |

## 2. Trạng thái trước khi triển khai (đọc qua SSH, chỉ đọc, 09/11)

| Tệp | Tình trạng so với `master` `53296f0` |
|---|---|
| `/opt/studytask/studytask_api.py` | Khác (49.092 byte, cài 06/11 08:21 UTC; `master` 50.393 byte) |
| `pages/Graduation.js` | Khác (bản trước [PR37]) |
| `utils/sanitize.js` | Chưa có |
| `app.js`, `pages/Profile.js` | Khớp |
| `~/migration/install-api.sh` (script cũ gây sự cố 06/11) | Không còn trên máy chủ |

## 3. Kết quả đối chiếu sau khi triển khai

| Kiểm tra | Kết quả |
|---|---|
| SHA256 `/opt/studytask/studytask_api.py` so với bản vừa clone | Khớp: `14b03defd3d9be7a69da16f832e8d7e92636de49d4427f4f0c7c198bbe44ef7e` |
| SHA256 `/var/www/studytask/pages/Graduation.js` so với bản vừa clone | Khớp: `3711608793c10442cdaa0ffecfb79869a5823f77fe753a4019ed0d3f778611a9` |
| `/var/www/studytask/utils/sanitize.js` | Có (867 byte) |
| `studytask-api`, `nginx`, `cloudflared` | Cả ba `active` |
| Cấu hình nginx đang nạp (`nginx -T`) | Có `location ^~ /uploads/submissions/` chuyển về `/api/files/submissions/` |
| `GET /api/files/submissions/<tên>` khi chưa đăng nhập, gọi từ máy chủ | HTTP 401 |

Hash API khớp với nhánh PR, không phải `master`, vì thay đổi của việc 4 và việc 11 chưa được gộp. Sau khi PR được gộp, so lại hash với `master` và ghi vào mục 4.

Bằng chứng: ảnh chụp cửa sổ SSH ngày 09/11 (lệnh `sha256sum`, `ls -l utils/sanitize.js`, `systemctl is-active`, `nginx -T`, `curl`), lưu cùng thư mục bằng chứng của đợt đo ở `docs/van-hanh/bang-chung/`.

## 4. Việc còn lại (điền khi hoàn thành)

| Việc | Người | Kết quả |
|---|---|---|
| Thử trên web thật: nộp bài bằng một sinh viên, mở lại bằng cùng tài khoản (được) và bằng tài khoản khác hoặc chưa đăng nhập (bị chặn) | Trương Thanh Vui | |
| Gộp PR vào `master`; so hash `studytask_api.py` trên máy chủ với `master` | Thành viên review | |
| Bài nộp cũ (trước khi có bảng `submission_files`) chỉ nhân viên mở được; thông báo cho giáo viên nếu cần | Trương Thanh Vui | |

## 5. Triển khai lần sau từ máy cá nhân

Khi cần đưa một commit lên máy chủ mà chưa chờ gộp PR, chạy `scripts/van-hanh/trien-khai-tu-may-ca-nhan.ps1` (cần commit hết thay đổi trước). Script ghi một dòng vào `~/deploy-log.txt` trên máy chủ (thời điểm, commit, nhánh) và so hash tệp đang chạy với bản vừa giải nén.
