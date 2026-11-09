# Hướng dẫn kiểm tra sức khỏe máy chủ mốc T+7 và T+15

Người thực hiện: Trương Thanh Vui (Nguyễn Thanh Tùng xác nhận). Căn cứ: báo cáo vận hành [01](01-bao-cao-suc-khoe-may-chu.md) mục 8, việc 9 của kế hoạch tuần 6.

| Mốc | Ngày | Cửa sổ nhật ký | Gói bằng chứng |
|---|---|---|---|
| T+7 | Thứ 5 hoặc thứ 6, 12–13/11/2026 | `-7 days` | `docs/van-hanh/bang-chung/<ngày>/` |
| T+15 | Thứ 7, 21/11/2026 | `-15 days` | như trên |

Nên đo cùng khung giờ với T0 (khoảng 09:30 giờ Việt Nam) để so sánh công bằng. Máy chủ: `studytask@192.168.2.187` (mạng LAN, cần cùng mạng hoặc có đường SSH).

## 1. Chuẩn bị (làm một lần, trên máy Windows)

- Đã cài Git (có `ssh`, `scp`) và Python 3.12, Node.js 26, GitHub CLI (cài ngày 09/11).
- Pull `master` mới nhất của repo; PR của tuần 6 phải có `deploy/evidence-check.sh` và `scripts/van-hanh/thu-bang-chung.ps1`.
- Đăng nhập thử SSH một lần để lưu khóa máy chủ: `ssh studytask@192.168.2.187` (gõ `exit` để thoát).

## 2. Cách nhanh: một lệnh thu toàn bộ bằng chứng

Mở PowerShell tại thư mục gốc repo:

```powershell
.\scripts\van-hanh\thu-bang-chung.ps1 -Moc T7      # mốc T+7
.\scripts\van-hanh\thu-bang-chung.ps1 -Moc T15     # mốc T+15
```

Script làm bốn bước: chép script lên máy chủ, chạy qua SSH (hỏi mật khẩu `sudo` một lần, mất khoảng 4–5 phút vì có chờ tự kiểm tra SMART), kéo gói về máy và kiểm tra SHA256, so hash các tệp đang chạy với `master`.

Kết quả nằm ở `docs/van-hanh/bang-chung/AAAA-MM-DD/`:

| Tệp | Nội dung | Điền vào mục 8.4 |
|---|---|---|
| `01-health-check.txt` | Toàn bộ `health-check.sh`: tải, RAM, đĩa, nhiệt độ, dịch vụ, mã HTTP, tunnel, SSH, CSDL, sao lưu | Gần hết các dòng |
| `02-smart-tong-quan.txt` | `smartctl -H -A`: chỉ số 5, 187, 188, 191, 197, 198, 199, 9, 194 | Các dòng SMART |
| `03-smart-loi-ata.txt` | Nhật ký lỗi ATA: cho biết lỗi 187/188 xảy ra lúc nào (giờ ổ chạy) | Kết luận 187/188 |
| `04`, `05` | Bắt đầu và kết quả tự kiểm tra ổ (short) | Kết luận ổ |
| `06`, `07`, `08` | Trạng thái dịch vụ, đơn vị lỗi, danh sách lần khởi động | Dịch vụ, khởi động lại |
| `09` | Lỗi OOM, I/O, hệ tệp trong nhật ký nhân | Dòng "OOM/I/O/hệ tệp" |
| `10` | `vnstat -d` lưu lượng theo ngày | Lưu lượng |
| `11`, `12` | Cổng đang nghe; 50 dòng cuối `error.log` của nginx | Cổng; lỗi nginx |
| `13`, `14` | Danh sách sao lưu, dung lượng `/mnt/backup`; kết quả thử khôi phục | Dòng sao lưu, thử khôi phục |
| `15` | Truy cập site từ chính máy chủ | Tham khảo |
| `16` | Hash `studytask_api.py`, `app.js`...; còn `~/migration/install-api.sh` hay không | Việc 1 (đối chiếu bản đang chạy) |
| `SHA256SUMS`, `*.tar.gz.sha256` | Hash của từng tệp và của cả gói: chứng minh không sửa sau khi thu | |
| `so-hash-voi-repo.txt` | Bản trên máy chủ có khớp `master` không | Việc 1 |

Nếu script báo `scp` hoặc `ssh` thất bại: kiểm tra đã cùng mạng LAN, địa chỉ IP máy chủ còn đúng (`ip a` trên máy chủ), rồi dùng cách thủ công ở mục 3.

## 3. Cách thủ công (khi không chạy được script)

Trên máy chủ (SSH vào):

```bash
bash ~/evidence-check.sh "-7 days"        # hoặc "-15 days"
```

Chép về máy Windows:

```powershell
scp studytask@192.168.2.187:~/health-logs/bang-chung-AAAA-MM-DD.tar.gz .
```

Hoặc chỉ chạy từng phần: `bash ~/health-check.sh "-7 days" --save`; `sudo smartctl -H -A /dev/sda`; `sudo smartctl -t short /dev/sda` (đợi 2 phút) rồi `sudo smartctl -l error -l selftest /dev/sda`.

## 4. Điền bảng và đọc kết quả

1. Mở `docs/van-hanh/01-bao-cao-suc-khoe-may-chu.md` mục 8.4, điền cột T+7 (hoặc T+15) từ các tệp ở mục 2.
2. So với cột "Ngưỡng bình thường". Điều cần xác định nhất: SMART 187 (T0 = 1.650) và 188 (T0 = 1.624) **có tăng không**. Không tăng: lỗi thuộc quá khứ, rủi ro thấp hơn. Tăng: coi ổ không đáng tin, chép bản sao lưu ra thiết bị ngoài ngay (mục 8.5).
3. Số giờ chạy ổ (`Power_On_Hours`, T0 = 4.699) phải tăng đúng bằng số giờ trôi qua (≈ +168 sau 7 ngày).
4. Điền mục 8.4 của báo cáo vận hành và tạo `docs/van-hanh/04-kiem-tra-t7.md` (hoặc `-t15.md`) ghi: ngày giờ đo, người đo, kết luận từng chỉ số, mọi giá trị vượt ngưỡng kèm cách xử lý.
5. Mốc T+15: viết thêm kết luận theo 5 điều kiện ở mục 8.6.

## 5. Ảnh chụp minh chứng (làm bằng tay, Win + Shift + S)

Lưu vào `docs/van-hanh/bang-chung/AAAA-MM-DD/anh/`, tên theo mẫu bên dưới. Ảnh phải thấy **ngày giờ** (đồng hồ Windows hoặc dòng `thoi_diem` của lệnh) và **tên máy chủ** (`studytask@...`).

| Tên ảnh | Chụp gì |
|---|---|
| `a1-health-check.png` | Cửa sổ SSH sau khi chạy `bash ~/health-check.sh "-7 days"`: phần đầu (hệ thống, dịch vụ) |
| `a2-smart.png` | `sudo smartctl -H -A /dev/sda`: dòng `PASSED` và các chỉ số 5, 187, 188, 191, 197, 198, 199 |
| `a3-smart-selftest.png` | `sudo smartctl -l selftest /dev/sda`: dòng "Completed without error" |
| `a4-dich-vu.png` | `systemctl status studytask-api nginx cloudflared --no-pager`: cả ba `active (running)` |
| `a5-sao-luu-khoi-phuc.png` | Kết quả `studytask-restore-test.sh` (checksum khớp, `integrity_check: ok`) |
| `a6-site-4g.png` | Điện thoại dùng 4G (tắt Wi-Fi) mở https://sutdytask.io.vn, thấy thanh địa chỉ và trang đăng nhập; chụp màn hình điện thoại |
| `a7-dang-nhap.png` | Đăng nhập thử một tài khoản demo trên web thật, thấy trang chính |
| `a8-giam-sat.png` | (Nếu có đăng ký UptimeRobot) trang tỷ lệ uptime; nếu chưa có, ghi "chưa đo" ở mục 8.6 điều 4 |

Mẹo: giữ ảnh gọn (không chụp mật khẩu, token, địa chỉ email thật); nếu lộ thì che bằng khung đen trước khi đưa lên repo, vì repo công khai.

## 6. Việc phải làm cùng lúc với đo (chuẩn bị 8.2)

- Áp dụng gói cập nhật đang chờ (`sudo apt update && sudo apt upgrade`), ghi có khởi động lại hay không. Làm **sau** khi đã thu bằng chứng đầu mốc để số liệu không bị lẫn.
- Kiểm tra bộ định tuyến không mở cổng 22 và 80 ra Internet: từ điện thoại dùng 4G, thử `http://<IP công cộng>:80` và cổng 22 (dùng ứng dụng như ConnectBot); không kết nối được là đạt. Ghi kết quả vào báo cáo (việc 6 của kế hoạch).
- Chép bản sao lưu ra thiết bị ngoài (việc 1b) và ghi biên bản khôi phục thử.

## 7. Đưa bằng chứng lên GitHub

- Tệp `.txt` và gói `.tar.gz` của `health-check` có thể chứa địa chỉ IP và tên người dùng; xem lại trước khi đưa lên repo công khai. Không đưa `mail.json`, mật khẩu hay token.
- Commit có AI tham gia gắn nhãn `[AI]`. Báo cáo tuần 6 dẫn link tới thư mục bằng chứng và commit tương ứng.
