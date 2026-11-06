# Báo cáo vận hành: sức khỏe và độ ổn định của máy chủ StudyTask

- Thời điểm đo: **06/11/2026, 02:36–02:38 UTC** (09:36 giờ Việt Nam)
- Khoảng theo dõi: từ **03/11/2026 07:19 UTC** (bản ghi nhật ký hệ thống đầu tiên còn lưu) đến thời điểm đo, khoảng **2 ngày 19 giờ**
- Đối tượng: máy chủ chạy https://sutdytask.io.vn (nginx + API Python + SQLite, ra Internet qua Cloudflare Tunnel). Bối cảnh chuyển từ Firebase sang máy chủ riêng xem [06-chuyen-firebase-sang-may-chu-rieng.md](../thiet-ke/06-chuyen-firebase-sang-may-chu-rieng.md)
- Người thực hiện: _(điền tên thành viên nhóm)_

## 1. Kết luận tóm tắt

Trong khoảng theo dõi, máy chủ **hoạt động ổn định**. Chưa ghi nhận sự cố làm gián đoạn dịch vụ.

| Hạng mục | Kết quả |
|---|---|
| Thời gian chạy liên tục (kể từ lần khởi động 04/11 06:19 UTC) | 1 ngày 20 giờ 16 phút |
| Tải hệ thống | 0,01 / 0,00 / 0,00 (4 luồng) |
| RAM đã dùng | 576 MiB trên 7,2 GiB; swap 0 B trên 4 GiB |
| Ổ đĩa gốc | 7,3 GB trên 295 GB (3%); inode 1% |
| Dịch vụ `studytask-api`, `nginx`, `cloudflared` | Cả ba `active`, 0 lần tự khởi động lại |
| Lỗi mức `err` trong nhật ký hệ thống (lần chạy hiện tại) | Chỉ có thông báo do chính thao tác kiểm thử của nhóm (mục 5.6) |
| Lỗi 5xx của API | 0 |
| Toàn vẹn cơ sở dữ liệu (`PRAGMA integrity_check`) | `ok` |
| Truy cập từ Internet | HTTP 200 trong 0,21 giây |
| Mất gói tin ra ngoài (ping 1.1.1.1, 3 gói) | 0%, trễ trung bình 31,6 ms |

**Việc chưa đạt, cần làm:** chưa có sao lưu tự động (mục 8), có 10 gói chờ cập nhật, chưa đo được tình trạng ổ cứng (SMART) và băng thông theo ngày.

## 2. Phương pháp

- Các lệnh chỉ **đọc** (không thay đổi cấu hình) chạy qua SSH bằng tài khoản thường (không `sudo`). Danh sách lệnh ở phụ lục.
- Nguồn số liệu: `uptime`, `free`, `df`, `ps`, `systemctl`, `journalctl` (hệ thống, `studytask-api`, `cloudflared`, `ssh`), nhật ký nginx (`/var/log/nginx`), `ip`, `ping`, `/sys/class/thermal`, và truy vấn chỉ đọc vào SQLite.
- Giờ trong báo cáo là UTC, trừ khi ghi khác.

## 3. Cấu hình máy chủ

| Thành phần | Giá trị |
|---|---|
| CPU | Intel Core i3-9100F @ 3,60 GHz, 4 luồng |
| RAM / swap | 7,2 GiB / 4,0 GiB |
| Ổ cứng | 1 ổ 465,8 GB (ổ quay, `ROTA=1`); phân vùng LVM 463,8 GB, trong đó hệ thống tệp gốc hiện cấp 300 GB, phần còn lại chưa cấp phát |
| Hệ điều hành / nhân | Ubuntu 26.04.1 LTS / Linux 7.0.0-42-generic |
| nginx / Python / SQLite / cloudflared | 1.28.3 / 3.14.4 / 3.46.1 / 2026.10.7 |
| Địa chỉ mạng | `192.168.2.187/24` (cổng mặc định `192.168.2.1`, DHCP) |
| Đồng bộ giờ | Bật, `System clock synchronized: yes` |

Cổng đang mở: 22 (SSH), 80 (nginx), `127.0.0.1:8787` (API, chỉ nội bộ), `127.0.0.1:20241` (cloudflared, chỉ nội bộ), 53 (phân giải tên, nội bộ). API không mở ra ngoài trực tiếp.

## 4. Tài nguyên

### 4.1. CPU, RAM

| Chỉ số | Giá trị |
|---|---|
| Load average (1/5/15 phút) | 0,01 / 0,00 / 0,00 |
| RAM tổng / đã dùng / bộ nhớ đệm / khả dụng | 7,2 / 0,56 / 1,0 / 6,6 GiB |
| Swap đã dùng | 0 B |
| `studytask-api` (RSS) | 30 MB |
| `cloudflared` (RSS) | 41 MB |
| `nginx` (tổng RSS) | 29 MB |

Ba tiến trình chính của hệ thống tiêu tốn chưa tới 100 MB RAM. `cloudflared` là tiến trình dùng CPU nhiều nhất (10 phút CPU tích lũy sau gần 2 ngày), vẫn rất nhẹ.

### 4.2. Ổ đĩa và dữ liệu

| Hạng mục | Giá trị |
|---|---|
| Hệ tệp gốc | 7,3 GB / 295 GB (3%); inode 111.304 / 19.660.800 (1%) |
| `/var/lib/studytask` (dữ liệu) | 6,2 MB |
| `/var/www/studytask` (giao diện) | 3,3 MB |
| Cơ sở dữ liệu `studytask.db` | 116 KB (+ WAL 4,0 MB) |
| Tệp tải lên | 57 mục trong `uploads`, 1 ảnh đại diện |
| Bảng dữ liệu | `accounts` 5, `sessions` 3, `docs` 13, `chat` 6, `contact_email` 2, `codes` 0 |
| Toàn vẹn dữ liệu | `PRAGMA integrity_check` = `ok` |

Dung lượng còn dư rất lớn so với nhu cầu hiện tại.

### 4.3. Nhiệt độ

Ba vùng nhiệt ACPI đọc được từ `/sys/class/thermal`: **16,8 °C, 27,8 °C, 29,8 °C**. Nhật ký nhân không có dòng giảm xung nhiệt (throttling). Lưu ý: đây là cảm biến vùng ACPI của bo mạch, **không phải nhiệt độ từng lõi CPU** (chưa cài `lm-sensors`).

## 5. Độ ổn định và các sự kiện bất thường

### 5.1. Khởi động lại

Nhật ký ghi 3 lần chạy trong khoảng theo dõi:

| Lần | Từ | Đến |
|---|---|---|
| −2 | 03/11 07:19:59 | 03/11 08:28:29 |
| −1 | 03/11 08:31:16 | 04/11 06:18:16 |
| 0 (hiện tại) | 04/11 06:19:51 | (đang chạy) |

- Lần khởi động **04/11 06:19 UTC** do **người vận hành chủ động**: sau khi cấu hình, người vận hành dời máy chủ đến nơi đặt ổn định hơn (theo xác nhận của người vận hành).
- Lần khởi động **03/11 ~08:30 UTC** xảy ra trong ngày cài đặt và cấu hình ban đầu; nhật ký không ghi nguyên nhân, cần người vận hành xác nhận thêm.
- Không có dấu hiệu khởi động lại do lỗi hệ thống (không có OOM, lỗi nhân hay lỗi phần cứng ngay trước các thời điểm trên). Giới hạn: nhật ký không cho biết một lần tắt máy là tắt bình thường hay mất điện đột ngột.

### 5.2. Dịch vụ

| Dịch vụ | Trạng thái | Thời điểm bắt đầu phiên chạy hiện tại | Tự khởi động lại |
|---|---|---|---|
| `studytask-api` | active | 04/11 07:47:02 (cài bản API mới) | 0 |
| `nginx` | active | 04/11 07:15:46 | 0 |
| `cloudflared` | active | 04/11 06:20:18 (ngay sau lần khởi động) | 0 |

`systemctl --failed` không có đơn vị lỗi. Các thời điểm khởi động lại dịch vụ ngày 04/11 trùng với lần triển khai và cập nhật do nhóm thực hiện.

### 5.3. Lỗi hệ thống

- Không có dòng OOM-killer, lỗi I/O ổ đĩa, lỗi hệ tệp (`EXT4-fs error`) hay `Call Trace` trong nhật ký nhân.
- Lỗi mức `err` duy nhất ở lần chạy hiện tại: các dòng `sshd: connect_to 127.0.0.1 port 8800: failed`, xem 5.6.

### 5.4. Cloudflare Tunnel

- Trong 72 giờ gần nhất: **23 lần** kết nối lại (`Retrying connection in up to 2s`), **23 lần** đăng ký lại kết nối thành công.
- Nguyên nhân ghi trong log: `failed to accept QUIC stream: Application error 0x0 (remote)`. Đây là phía biên Cloudflare đóng và đổi kết nối, `cloudflared` tự kết nối lại trong khoảng 2 giây.
- Thời điểm gần nhất: 05/11 13:08. Tập trung nhiều nhất vào 04/11 lúc 15 giờ (7 lần, trùng khoảng thời gian nhóm thao tác nhiều).
- Kiểm tra từ máy chủ ra Internet: `https://sutdytask.io.vn` trả 200 trong 0,21 giây.
- Đánh giá: **không gây gián đoạn có thể nhận thấy**; chưa đo được thời gian mất kết nối thực tế (chưa có giám sát ngoài).

### 5.5. Lưu lượng và mã trạng thái của API

Số yêu cầu API theo ngày (nhật ký `studytask-api`):

| Ngày (UTC) | Số dòng nhật ký |
|---|---|
| 03/11 | 278 |
| 04/11 | 1.915 |
| 05/11 | 27 |
| 06/11 (đến 02:36) | 6 |

Ngày 04/11 cao do nhóm thử nghiệm và cấu hình; sau đó giảm hẳn. **Không có đợt tăng đột biến bất thường.** Chưa có người dùng thật sử dụng đáng kể, nên kết quả chưa chứng minh được khả năng chịu tải.

Phân bố mã HTTP (toàn bộ nhật ký, 2.178 yêu cầu):

| Mã | Số lượng | Tỷ lệ | Giải thích |
|---|---|---|---|
| 200 | 1.905 | 87,5% | Thành công |
| 403 | 182 | 8,4% | Máy chủ từ chối do không đủ quyền (xem dưới) |
| 401 | 46 | 2,1% | Chưa đăng nhập: 40 lần là `GET /api/chat/status` khi chưa có phiên; còn lại là tải tệp / đăng nhập sai |
| 404 | 43 | 2,0% | Đường dẫn không tồn tại |
| 501 | 1 | 0,05% | Một yêu cầu `HEAD /api/auth/me` (API chưa hỗ trợ phương thức HEAD) |
| 400 | 1 | 0,05% | Đặt lại mật khẩu với mã sai (đúng như thiết kế) |
| 5xx | 0 | 0% | Không có lỗi phía máy chủ |

**Về 182 lỗi 403:**

| Đường dẫn bị từ chối | Số lần |
|---|---|
| `PUT /api/doc/sharedData/global` | 140 |
| `PUT /api/doc/userData/<mã người dùng kiểu Firebase cũ>` | 28 |
| `GET /api/doc/sharedData/global` | 11 |
| `PUT /api/doc/userData/<id khác>` | 3 |

- Toàn bộ xảy ra ngày 03–04/11 (108 và 74 lần), **không còn lần nào từ 05/11**.
- Đây là hàm phân quyền `can()` hoạt động đúng: tài khoản không có quyền ghi dữ liệu chung hoặc ghi vào hồ sơ người khác thì bị từ chối. Không có yêu cầu nào trong nhóm này được chấp nhận.
- Nguyên nhân chính xác (tài khoản nào, trình duyệt nào) **chưa được xác minh**. Phỏng đoán hợp lý là phiên của tài khoản chuyển từ Firebase hoặc mã giao diện cũ còn lưu trong trình duyệt gửi thao tác ghi không được phép. Khuyến nghị theo dõi nếu 403 xuất hiện lại.
- Không có yêu cầu bị giới hạn tần suất (HTTP 429): cơ chế giới hạn đăng nhập sai chưa bị chạm.

### 5.6. Nhật ký lỗi do thao tác thử nghiệm của nhóm

Lúc ~08:45–08:46 (04/11), nhật ký SSH ghi nhiều dòng `connect_to 127.0.0.1 port 8800: failed`. Đây là **hậu quả của việc thử giao diện**: một đường hầm SSH tạm chuyển cổng 8800 tới môi trường thử đã bị tắt trong lúc trình duyệt còn đang gọi. Môi trường thử và đường hầm đã được dọn, không còn cổng 8800 nào đang lắng nghe. Không phải sự cố của hệ thống thật.

### 5.7. nginx và hoạt động dò quét

- Nhật ký truy cập hiện hành (đã xoay vòng): 227 yêu cầu 200, 52 yêu cầu 404, 6 yêu cầu 405.
- Các 404 chủ yếu là **bot dò quét** tìm tệp cấu hình phổ biến: `/config.js`, `/main.js`, `/static/js/config.js`, `/src/config.js`, `/web/api/config.js`… Hoạt động này vẫn diễn ra ở thời điểm đo (02:14–02:17 ngày 06/11).
- Không có tệp nào bị lộ: các đường dẫn đó không tồn tại trong thư mục web. Mã nguồn công khai (`app.js`, `components/`…) vốn là tệp tĩnh, không chứa khóa bí mật. Cấu hình gửi email và mật khẩu nằm ngoài thư mục web (`/var/lib/studytask/mail.json`, quyền 600).
- Địa chỉ nguồn trong nhật ký nginx là `127.0.0.1` do đi qua Cloudflare Tunnel (địa chỉ thật nằm trong header của Cloudflare, nginx chưa ghi lại).

### 5.8. Bảo mật truy cập quản trị

- Đăng nhập SSH sai: **22 lần**, tất cả từ máy `192.168.2.175` (máy của thành viên nhóm) với tên `studtask` (gõ thiếu chữ `y`). **Không có nguồn lạ.**
- Không có phiên SSH nào đang mở ngoài phiên kiểm tra.
- SSH lắng nghe trên mọi giao diện (`0.0.0.0:22`) nhưng máy chủ nằm sau mạng nội bộ; **cần kiểm tra bộ định tuyến tại nơi đặt máy mới không chuyển tiếp cổng 22 hay 80 ra Internet** (mục 8).

### 5.9. Mạng và băng thông

| Chỉ số | Giá trị |
|---|---|
| Card mạng `enp5s0`: nhận / gửi (từ lần khởi động 04/11) | 72,5 MB / 71,9 MB |
| Ping 1.1.1.1 | 3/3 gói, 0% mất, trung bình 31,6 ms (30,3–32,4) |

Lưu lượng rất thấp. **Chưa có số liệu băng thông theo ngày** vì chưa cài `vnstat`.

### 5.10. Cập nhật hệ thống

10 gói đang chờ cập nhật; dịch vụ `unattended-upgrades` đang bật; không có thông báo cần khởi động lại để áp dụng cập nhật.

## 6. Đánh giá theo tiêu chí

| Tiêu chí | Đánh giá | Căn cứ |
|---|---|---|
| Sẵn sàng (availability) | Tốt, chưa đo tỷ lệ chính xác | Dịch vụ không tự khởi động lại; site trả 200; chưa có giám sát ngoài để tính % uptime |
| Hiệu năng | Tốt ở tải hiện tại | Load ≈ 0, RAM còn 6,6 GiB, phản hồi 0,21 giây |
| Độ tin cậy phần cứng | Chưa kết luận | Chưa đọc SMART của ổ quay; nhiệt độ thấp |
| Toàn vẹn dữ liệu | Tốt | `integrity_check = ok` |
| Bảo mật vận hành | Chấp nhận được | API chỉ nội bộ; không có truy cập SSH lạ; còn việc kiểm tra router và cập nhật gói |
| Khả năng khôi phục | **Chưa đạt** | Chưa có sao lưu tự động |

## 7. Rủi ro và khuyến nghị

Xếp theo mức ưu tiên.

| # | Rủi ro / việc cần làm | Khuyến nghị |
|---|---|---|
| 1 | **Chưa có sao lưu tự động** `/var/lib/studytask` (cơ sở dữ liệu, tệp tải lên, `mail.json`). Máy chủ có một ổ quay duy nhất; hỏng ổ là mất toàn bộ | Sao lưu theo lịch (cron), giữ nhiều bản và chép ra ổ/máy khác; thử khôi phục định kỳ |
| 2 | Chưa đọc được SMART của ổ cứng duy nhất | Cài `smartmontools` và chạy `sudo smartctl -H -A /dev/sda` |
| 3 | Sau khi dời máy, chưa xác nhận cấu hình bộ định tuyến | Kiểm tra không mở/chuyển tiếp cổng 22, 80 ra Internet; chỉ để Cloudflare Tunnel là đường vào |
| 4 | 10 gói chờ cập nhật | `sudo apt update && sudo apt upgrade` vào khung giờ ít dùng |
| 5 | Chưa có giám sát từ bên ngoài và theo dõi băng thông theo ngày | Cài `vnstat`; dùng dịch vụ kiểm tra HTTP bên ngoài (ví dụ UptimeRobot) để đo uptime thật |
| 6 | Bot dò quét liên tục | Bật Bot Fight Mode / quy tắc WAF của Cloudflare; ghi lại địa chỉ thật của người truy cập trong nginx |
| 7 | 403 ngày 03–04/11 chưa rõ nguồn | Theo dõi; nếu tái diễn, ghi thêm tên người dùng vào nhật ký API để truy vết |
| 8 | Điểm lỗi duy nhất (một máy, một ổ, một đường mạng) | Chấp nhận ở quy mô đề tài; ghi rõ là hạn chế (đã nêu trong tài liệu 06) |

Việc nhỏ về mã nguồn có thể làm sau: hỗ trợ `HEAD /api/auth/me` (hiện trả 501), và không gọi `/api/chat/status` khi chưa đăng nhập (đang gây 40 dòng 401 vô hại).

## 8. Hạn chế của báo cáo

- Chỉ phản ánh **2 ngày 19 giờ** và **tải rất thấp** (chưa có người dùng thật đáng kể). Kết quả không chứng minh khả năng chịu tải; cần thêm phép thử tải riêng nếu muốn kết luận.
- Không đo được SMART, nhiệt độ từng lõi CPU, băng thông theo ngày (thiếu công cụ hoặc cần `sudo`).
- Nhật ký nginx đọc được chỉ gồm tệp hiện hành (không đọc được các tệp đã nén nếu thiếu quyền), nên số liệu nginx không phủ toàn bộ khoảng theo dõi.
- Không có số liệu của Firebase trước đây để so sánh tốc độ hoặc độ ổn định.
- Nguyên nhân các lỗi 403 ngày 03–04/11 chưa được xác minh.

## Phụ lục: các lệnh đã dùng (chạy được lại)

```bash
# Thời gian chạy, tải, RAM, đĩa
uptime -p; cat /proc/loadavg; free -h; df -h /; df -i /
du -sh /var/lib/studytask /var/www/studytask

# Khởi động lại và trạng thái dịch vụ
journalctl --list-boots --no-pager
for s in studytask-api nginx cloudflared; do systemctl is-active $s; systemctl show $s -p NRestarts -p ActiveEnterTimestamp; done
systemctl --failed

# Lỗi hệ thống
journalctl -p err -b --no-pager | tail -20
journalctl -k --no-pager | grep -iE "out of memory|oom-killer|I/O error|EXT4-fs error|Call Trace|throttl"

# Lưu lượng và mã lỗi của API
journalctl -u studytask-api --no-pager -o short-iso | grep -oE "^[0-9]{4}-[0-9]{2}-[0-9]{2}" | sort | uniq -c
journalctl -u studytask-api --no-pager | grep -oE 'HTTP/1.1" [0-9]{3}' | sort | uniq -c | sort -rn
journalctl -u studytask-api --no-pager | grep -E '" 403 ' | grep -oE '"(GET|PUT|POST|DELETE) [^ ?]+' | sort | uniq -c | sort -rn

# Cloudflare Tunnel
journalctl -u cloudflared --since "-72 hours" --no-pager | grep -c "Retrying connection"

# nginx (cần quyền đọc /var/log/nginx)
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn
tail -20 /var/log/nginx/error.log

# Mạng
ip -s link; ping -c3 1.1.1.1
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://sutdytask.io.vn/

# Bảo mật
journalctl -u ssh --no-pager | grep -E "Failed password|Invalid user"
ss -tlnp

# Cơ sở dữ liệu (chỉ đọc)
python3 -c "import sqlite3;c=sqlite3.connect('file:/var/lib/studytask/studytask.db?mode=ro',uri=True);print(c.execute('pragma integrity_check').fetchone())"
```
