# Báo cáo vận hành: sức khỏe và độ ổn định của máy chủ StudyTask

- Thời điểm đo: **06/11/2026, 02:36–02:38 UTC** (09:36 giờ Việt Nam)
- Khoảng theo dõi: từ **03/11/2026 07:19 UTC** (bản ghi nhật ký hệ thống đầu tiên còn lưu) đến thời điểm đo, khoảng **2 ngày 19 giờ**
- Đối tượng: máy chủ chạy https://sutdytask.io.vn (nginx + API Python + SQLite, ra Internet qua Cloudflare Tunnel). Bối cảnh chuyển từ Firebase sang máy chủ riêng xem [06-chuyen-firebase-sang-may-chu-rieng.md](../thiet-ke/06-chuyen-firebase-sang-may-chu-rieng.md)
- Người thực hiện: **Trương Thanh Vui** (24TX810021)

## 1. Kết luận tóm tắt

Trong khoảng theo dõi, máy chủ **hoạt động ổn định**. Chưa ghi nhận sự cố làm gián đoạn dịch vụ.

| Hạng mục | Kết quả |
|---|---|
| Thời gian chạy liên tục (kể từ lần khởi động 04/11 06:19 UTC) | 1 ngày 20 giờ 16 phút |
| Tải hệ thống | 0,01 / 0,00 / 0,00 (4 luồng) |
| RAM đã dùng | 576 MiB trên 7,2 GiB; swap 0 B trên 4 GiB |
| Ổ đĩa gốc | 7,3 GB trên 295 GB (3%); inode 1% |
| Dịch vụ `studytask-api`, `nginx`, `cloudflared` | Cả ba `active`, 0 lần tự khởi động lại |
| Lỗi mức `err` trong nhật ký hệ thống (lần chạy hiện tại) | 1.655 dòng: 1.647 dòng do thao tác thử nghiệm của nhóm (mục 5.6) và 8 dòng thông báo phần cứng/BIOS khi khởi động (mục 5.3); không có lỗi OOM, I/O, hệ tệp |
| Lỗi 5xx của API | 1 (mã 501 do một yêu cầu `HEAD`, không phải lỗi dịch vụ); không có 500/502/503 |
| Toàn vẹn cơ sở dữ liệu (`PRAGMA integrity_check`) | `ok` |
| Truy cập từ Internet | HTTP 200 trong 0,21 giây |
| Mất gói tin ra ngoài (ping 1.1.1.1, 3 gói) | 0%, trễ trung bình 31,6 ms |

**Cập nhật 06/11/2026 (sau khi đo):** đã bật **sao lưu tự động** hằng ngày vào ổ `/mnt/backup` (LVM 98 GB, cùng ổ vật lý; bản đầu tiên lúc 06:34 UTC, thử khôi phục thành công) và đã đọc được **SMART**: ổ báo `PASSED` nhưng có một số chỉ số tích lũy đáng theo dõi (mục 4.4).

**Việc chưa đạt, cần làm:** theo dõi các chỉ số SMART đáng chú ý ở 4.4, chưa có bản sao lưu ngoài ổ vật lý, có 10 gói chờ cập nhật, chưa có băng thông theo ngày (`vnstat` mới cài). Kế hoạch kiểm tra lại sau 1 tuần và sau 15 ngày ở **mục 8**.

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

Đọc từ `/sys/class/thermal` (khi máy gần như nhàn rỗi):

| Cảm biến | Nhiệt độ |
|---|---|
| `x86_pkg_temp` (gói CPU) | **39–42 °C** (hai lần đo cách nhau vài phút) |
| 3 vùng `acpitz` (bo mạch) | 16,8 °C, 27,8 °C, 29,8 °C |

Nhật ký nhân không có dòng giảm xung nhiệt (throttling). Nhiệt độ ổ cứng xem ở 4.4.

### 4.4. Sức khỏe ổ cứng (SMART)

Đọc bằng `sudo smartctl -H -A /dev/sda` ngày **06/11/2026** (sau lần sao lưu đầu tiên lúc 06:34 UTC; smartctl 7.5). Kết luận tự đánh giá của ổ: **`PASSED`**. Ổ quay, đã dùng **4.699 giờ** (khoảng 196 ngày), 4.355 lần bật nguồn.

| Chỉ số | Giá trị thô | Giá trị chuẩn hóa / ngưỡng | Nhận xét |
|---|---|---|---|
| `Reallocated_Sector_Ct` (5) | **2** | 200 / 140 | Có 2 sector đã được thay thế; còn xa ngưỡng |
| `Reallocated_Event_Count` (196) | 2 | 198 / 000 | Khớp với trên |
| `Current_Pending_Sector` (197) | 0 | 200 / 000 | Tốt |
| `Offline_Uncorrectable` (198) | 0 | 100 / 000 | Tốt |
| `UDMA_CRC_Error_Count` (199) | 0 | 200 / 000 | Tốt (cáp dữ liệu không lỗi) |
| `Raw_Read_Error_Rate` (1) | 0 | 200 / 051 | Tốt |
| `Seek_Error_Rate` (7) | 176 | 191 / 051 | Bình thường |
| `Spin_Retry_Count` (10) | 0 | 100 / 051 | Tốt |
| `Reported_Uncorrect` (187) | **1.650** | **001** / 000 | **Đáng chú ý**: ổ từng báo 1.650 lỗi đọc không sửa được; giá trị chuẩn hóa đã chạm đáy (001) |
| `Command_Timeout` (188) | **1.624** | **001** / 000 | **Đáng chú ý**: 1.624 lệnh bị quá thời gian; giá trị chuẩn hóa đã chạm đáy |
| `G-Sense_Error_Rate` (191) | **3.682** | **001** / 000 | **Đáng chú ý**: cảm biến va đập ghi nhiều lần rung/va chạm (phù hợp ổ từng bị di chuyển hoặc dùng ở máy xách tay) |
| `Load_Cycle_Count` (193) | 322.437 | 093 / 000 | Cao (đầu đọc đỗ/nhả nhiều lần), thường gặp ở ổ tiết kiệm điện |
| `Power_On_Hours` (9) / `Power_Cycle_Count` (12) | 4.699 / 4.355 | 094 / 096 | Ổ đã qua sử dụng, bật tắt nhiều |
| Nhiệt độ (190, 194) | 33 °C (31–34) | | Tốt |

**Đánh giá thận trọng:**

- Không có dấu hiệu hỏng cấp tính: không có sector chờ xử lý, không có lỗi không sửa được ngoại tuyến, lỗi cáp bằng 0, nhiệt độ tốt, và ổ không báo ngưỡng vi phạm (các ngưỡng của 187/188/191 đặt là 000 nên ổ không bao giờ coi chúng là "failed").
- Ba chỉ số 187, 188, 191 có giá trị lớn và đã chạm đáy. Chỉ từ **một lần đọc** thì chưa biết các lỗi này xảy ra **trong quá khứ (trước khi nhóm dùng ổ)** hay **vẫn đang tăng**. Đây chính là điều mốc T+7 và T+15 phải xác định: nếu 187 và 188 **không tăng**, rủi ro thấp hơn; nếu **tăng**, coi ổ là không đáng tin.
- 2 sector đã thay thế ở mức này chưa đáng lo, nhưng cần theo dõi xem có tăng không.
- Với một ổ đã qua sử dụng và có các dấu hiệu trên, **sao lưu ra thiết bị vật lý khác là bắt buộc** khi triển khai thật (ổ `/mnt/backup` hiện tại nằm cùng ổ vật lý này nên không bảo vệ khi ổ hỏng).

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
- Nhật ký mức `err` của lần chạy hiện tại có **1.655 dòng**, gồm:
  - **1.647 dòng** `sshd: connect_to 127.0.0.1 port 8800: failed`, từ 04/11 07:25:59 đến 08:46:39, do thao tác thử nghiệm của nhóm (mục 5.6).
  - **8 dòng khi khởi động (04/11 06:19–06:20)**: `ACPI BIOS Error ... _GTF ... AE_NOT_FOUND` (lỗi phương thức ACPI của bo mạch cho cổng SATA, 4 dòng), `ACPI Error: AE_NOT_FOUND` (1), `SGX disabled or unsupported by BIOS` (1), `KHO: Failed to reserve lowmem scratch buffer` (1), `nouveau ... MMIO read ... FAULT` (1, trình điều khiển card đồ họa không dùng đến). Đây là thông báo phần cứng/BIOS thường gặp, chỉ xuất hiện một lần lúc khởi động, hệ thống vẫn chạy bình thường. Nên theo dõi xem có lặp lại sau mỗi lần khởi động không.

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
| 5xx | 1 | 0,05% | Chính là mã 501 ở trên; **không có 500/502/503**, tức không có lỗi thực thi phía máy chủ |

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

Từ 07:25:59 đến 08:46:39 (04/11), nhật ký SSH ghi 1.647 dòng `connect_to 127.0.0.1 port 8800: failed`, cách nhau khoảng 3 giây. Đây là **hậu quả của việc thử giao diện**: một đường hầm SSH tạm chuyển cổng 8800 tới môi trường thử vẫn còn mở và được trình duyệt gọi liên tục sau khi môi trường thử trên máy chủ đã bị tắt. Từ 08:46:39 không còn dòng nào, và hiện không có cổng 8800 nào đang lắng nghe. Không phải sự cố của hệ thống thật, nhưng là bài học: dọn đường hầm tạm ngay sau khi thử.

### 5.7. nginx và hoạt động dò quét

- Nhật ký truy cập hiện hành (đã xoay vòng): 227 yêu cầu 200, 52 yêu cầu 404, 6 yêu cầu 405.
- Các 404 chủ yếu là **bot dò quét** tìm tệp cấu hình phổ biến: `/config.js`, `/main.js`, `/static/js/config.js`, `/src/config.js`, `/web/api/config.js`… Hoạt động này vẫn diễn ra ở thời điểm đo (02:14–02:17 ngày 06/11).
- Không có tệp nào bị lộ: các đường dẫn đó không tồn tại trong thư mục web. Mã nguồn công khai (`app.js`, `components/`…) vốn là tệp tĩnh, không chứa khóa bí mật. Cấu hình gửi email và mật khẩu nằm ngoài thư mục web (`/var/lib/studytask/mail.json`, quyền 600).
- Địa chỉ nguồn trong nhật ký nginx là `127.0.0.1` do đi qua Cloudflare Tunnel (địa chỉ thật nằm trong header của Cloudflare, nginx chưa ghi lại).

### 5.8. Bảo mật truy cập quản trị

- Đăng nhập SSH sai: **22 lần**, tất cả từ máy `192.168.2.175` (máy của thành viên nhóm) với tên `studtask` (gõ thiếu chữ `y`). **Không có nguồn lạ.**
- Đăng nhập SSH thành công: 201 lần, cũng **chỉ từ `192.168.2.175`** (gồm các phiên kiểm tra tự động của lần làm việc này).
- Không có phiên SSH nào đang mở ngoài phiên kiểm tra.
- SSH lắng nghe trên mọi giao diện (`0.0.0.0:22`) nhưng máy chủ nằm sau mạng nội bộ; **cần kiểm tra bộ định tuyến tại nơi đặt máy mới không chuyển tiếp cổng 22 hay 80 ra Internet** (mục 7).

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
| Độ tin cậy phần cứng | **Cần theo dõi** | SMART `PASSED`, nhiệt độ tốt, không có sector chờ; nhưng 187/188/191 rất cao (4.4) và ổ đã qua sử dụng; chưa biết các lỗi này còn tăng hay không |
| Toàn vẹn dữ liệu | Tốt | `integrity_check = ok` |
| Bảo mật vận hành | Chấp nhận được | API chỉ nội bộ; không có truy cập SSH lạ; còn việc kiểm tra router và cập nhật gói |
| Khả năng khôi phục | **Đạt một phần** | Đã có sao lưu tự động hằng ngày và thử khôi phục thành công (06/11); chưa có bản sao lưu ngoài ổ vật lý |

## 7. Rủi ro và khuyến nghị

Xếp theo mức ưu tiên.

| # | Rủi ro / việc cần làm | Khuyến nghị |
|---|---|---|
| 1 | **Sao lưu mới nằm cùng ổ vật lý** (đã bật 06/11: hằng ngày, giữ 14 bản + 8 bản Chủ nhật, thử khôi phục đạt). Hỏng ổ cứng duy nhất vẫn mất cả dữ liệu lẫn bản sao lưu | Khi triển khai thật gắn ổ di động vào `/mnt/backup` (script không cần sửa); trong lúc này chép tay bản mới nhất ra máy khác định kỳ |
| 2 | **Ổ cứng có chỉ số SMART đáng chú ý** (187 = 1.650, 188 = 1.624, 191 = 3.682, 2 sector đã thay thế; xem 4.4) | Đọc lại SMART ở mốc T+7 và T+15, chạy tự kiểm tra: `sudo smartctl -t short /dev/sda` rồi `sudo smartctl -l selftest -l error /dev/sda`; nếu 187/188 tăng hoặc có sector chờ thì thay ổ |
| 3 | Sau khi dời máy, chưa xác nhận cấu hình bộ định tuyến | Kiểm tra không mở/chuyển tiếp cổng 22, 80 ra Internet; chỉ để Cloudflare Tunnel là đường vào |
| 4 | 10 gói chờ cập nhật | `sudo apt update && sudo apt upgrade` vào khung giờ ít dùng |
| 5 | Chưa có giám sát từ bên ngoài và theo dõi băng thông theo ngày | Cài `vnstat`; dùng dịch vụ kiểm tra HTTP bên ngoài (ví dụ UptimeRobot) để đo uptime thật |
| 6 | Bot dò quét liên tục | Bật Bot Fight Mode / quy tắc WAF của Cloudflare; ghi lại địa chỉ thật của người truy cập trong nginx |
| 7 | 403 ngày 03–04/11 chưa rõ nguồn | Theo dõi; nếu tái diễn, ghi thêm tên người dùng vào nhật ký API để truy vết |
| 8 | Điểm lỗi duy nhất (một máy, một ổ, một đường mạng) | Chấp nhận ở quy mô đề tài; ghi rõ là hạn chế (đã nêu trong tài liệu 06) |

Việc nhỏ về mã nguồn có thể làm sau: hỗ trợ `HEAD /api/auth/me` (hiện trả 501), và không gọi `/api/chat/status` khi chưa đăng nhập (đang gây 40 dòng 401 vô hại).

## 8. Kế hoạch kiểm tra lại

Mục đích: xác nhận máy chủ **tiếp tục ổn định theo thời gian** và phát hiện sớm các xu hướng xấu (rò rỉ bộ nhớ, đĩa đầy dần, kết nối chập chờn, tăng lỗi). Mốc gốc (T0) là báo cáo này, đo ngày **06/11/2026**.

### 8.1. Lịch

| Mốc | Ngày đề xuất | Cửa sổ nhật ký | Người thực hiện | Đầu ra |
|---|---|---|---|---|
| **T0** (báo cáo này) | Thứ Sáu 06/11/2026 | từ 03/11 | Thanh Vui | Tài liệu này + `~/health-logs/2026-11-06.txt` |
| **T+7 ngày** (hơn 1 tuần) | Thứ Sáu 13/11/2026 (làm trong 13–16/11) | `"-7 days"` | Thanh Vui | `~/health-logs/<ngày>.txt` + mục 8.4 |
| **T+15 ngày** | Thứ Bảy 21/11/2026 | `"-15 days"` | Thanh Vui | `~/health-logs/<ngày>.txt` + mục 8.4 + kết luận chung |

Nên đo vào **cùng khung giờ** (khoảng 09:30 giờ Việt Nam) để so sánh công bằng. Ngoài lịch cố định, đo thêm ngay sau mọi sự kiện: mất điện, khởi động lại, thay đổi router/mạng, cập nhật hệ điều hành, triển khai phiên bản mới.

### 8.2. Việc chuẩn bị trước T+7 (hoàn thành trước 13/11)

1. ✅ **Đã xong 06/11:** cài `smartmontools` và đọc SMART lần đầu (kết quả ở 4.4). Việc còn lại: chạy tự kiểm tra ổ (`sudo smartctl -t short /dev/sda`, đợi vài phút, rồi `sudo smartctl -l selftest -l error /dev/sda`) và lưu kết quả, đặc biệt nhật ký lỗi ATA để biết lỗi 187/188 xảy ra khi nào.
2. ✅ **Đã xong 06/11:** cài `vnstat` (cần vài ngày để có số liệu theo ngày; xem bằng `vnstat -d`).
3. ✅ **Đã xong 06/11:** thiết lập **sao lưu tự động** (ổ LVM 98 GB gắn tại `/mnt/backup`, chạy lúc 20:00 UTC mỗi ngày, bản đầu tiên 06:34 UTC). Script kiểm tra hiển thị tuổi bản sao lưu mới nhất; cần ghi thêm kết quả `bash ~/setup/studytask-restore-test.sh` ở mỗi mốc.
4. Áp dụng 10 gói cập nhật đang chờ trong khung giờ ít dùng, ghi nhận việc có khởi động lại hay không.
5. Kiểm tra bộ định tuyến nơi đặt máy mới không mở cổng 22/80 ra Internet.
6. (Khuyến nghị) Đăng ký giám sát HTTP bên ngoài (ví dụ UptimeRobot, kiểm tra mỗi 5 phút) để có **tỷ lệ uptime thật** cho mốc T+15.

### 8.3. Cách đo

Chạy trên máy chủ (không cần `sudo`, chỉ đọc), script nằm trong repo ở [deploy/health-check.sh](../../deploy/health-check.sh):

```bash
# nếu máy chủ chưa có repo, chép riêng script từ máy cá nhân:
#   scp deploy/health-check.sh studytask@192.168.2.187:~/health-check.sh
bash ~/health-check.sh "-7 days"  --save     # mốc T+7
bash ~/health-check.sh "-15 days" --save     # mốc T+15
```

`--save` ghi kết quả vào `~/health-logs/AAAA-MM-DD.txt`. Chép các số vào bảng 8.4 rồi cập nhật báo cáo (tạo tài liệu mới `docs/van-hanh/02-...md` cho mỗi mốc, hoặc thêm cột vào bảng này).

Kiểm tra thêm bằng tay ở mỗi mốc: đọc SMART (`sudo smartctl -H -A /dev/sda`), nhật ký nginx có `sudo` nếu cần (`sudo tail -50 /var/log/nginx/error.log`), tải trang https://sutdytask.io.vn từ điện thoại dùng mạng 4G (kiểm tra truy cập từ ngoài), đăng nhập thử một tài khoản và gửi một mã email thử (`mail-test`).

### 8.4. Bảng so sánh và ngưỡng cảnh báo

Điền vào cột T+7 và T+15. Cột "Ngưỡng" là điều kiện để coi là **bình thường**; vượt ngưỡng thì điều tra theo mục 8.5.

| Chỉ số | T0 (06/11) | T+7 | T+15 | Ngưỡng bình thường |
|---|---|---|---|---|
| Thời gian chạy liên tục / số lần khởi động lại ngoài kế hoạch | 1 ngày 20 giờ / 0 | 8 ngày 18 giờ / 0 |  | Không có lần khởi động ngoài kế hoạch |
| Load trung bình 15 phút | 0,00 | 0,01 |  | < 1,0 (4 luồng) |
| RAM đã dùng (MiB) | 576 | 705 |  | Không tăng liên tục; < 2.000 |
| Swap đã dùng (MiB) | 0 | 0 |  | ≈ 0 |
| RSS `studytask-api` / `cloudflared` / `nginx` (MB) | 30 / 41 / 29 | 67 / 41 / 33 (API khởi động lại 12/11 07:58 UTC, CSDL đã lớn hơn; API vượt mức 2 lần T0 = 60 MB) |  | Không tăng đều theo thời gian (rò rỉ); ≤ 2 lần T0 |
| Ổ đĩa gốc đã dùng | 3% (7,3 GB) | 3% (8,2 GB) |  | < 70%; tăng không quá ~1 GB/tuần nếu không có tệp tải lên mới |
| Inode đã dùng | 1% | 1% |  | < 50% |
| Nhiệt độ CPU `x86_pkg_temp` (nhàn rỗi) | 39–42 °C | 42 °C |  | < 60 °C khi nhàn rỗi |
| SMART: tình trạng tự đánh giá | `PASSED` | `PASSED` |  | `PASSED` |
| SMART `Reallocated_Sector_Ct` (5) | 2 | 2 (không đổi) |  | Không tăng so với T0 |
| SMART `Current_Pending_Sector` (197) / `Offline_Uncorrectable` (198) | 0 / 0 | 0 / 0 |  | 0 / 0 |
| SMART `Reported_Uncorrect` (187) | 1.650 | **1.651 (+1 so với T0, vượt ngưỡng)** |  | **Không tăng** so với T0 (tăng = ổ đang lỗi) |
| SMART `Command_Timeout` (188) | 1.624 | 1.624 (không đổi) |  | **Không tăng** so với T0 |
| SMART `G-Sense_Error_Rate` (191) | 3.682 | **3.692 (+10 so với T0, vượt ngưỡng)** |  | Không tăng (máy đặt cố định, không bị rung) |
| SMART `UDMA_CRC_Error_Count` (199) | 0 | 0 |  | 0 |
| SMART nhiệt độ ổ (194) | 33 °C | 32 °C |  | < 45 °C |
| SMART `Power_On_Hours` (9) | 4.699 | 4.862 (+163 so với T0) |  | Tăng đúng bằng số giờ trôi qua (≈ +168 sau 7 ngày, +360 sau 15 ngày) |
| `studytask-api`, `nginx`, `cloudflared` tự khởi động lại | 0 / 0 / 0 | 0 / 0 / 0 |  | 0 |
| Đơn vị dịch vụ lỗi (`systemctl --failed`) | 0 | 0 |  | 0 |
| Lỗi OOM / I/O / hệ tệp trong nhật ký nhân | 0 | 0 |  | 0 |
| Lỗi mức `err` mới (không tính các dòng đã biết ở 5.3, 5.6) | 0 | 1.651 dòng `connect_to … failed` (5.6 ghi 1.647 dòng ngày 04/11, chênh 4 dòng chưa đối chiếu); 28 dòng TLS/NTS của `chronyd` (đồng bộ giờ vẫn `yes`); vài dòng ACPI/SGX/nouveau của phần cứng |  | 0 |
| Yêu cầu API trong cửa sổ | 2.178 (03–06/11) | 2.184 (06–13/11) |  | Tham khảo để thấy xu hướng sử dụng |
| Mã 5xx (ngoài 501 do `HEAD`) | 0 | 0 |  | 0 |
| Mã 403 mới | 0 từ 05/11 | 17 trong API (11 `PUT userData`, 6 `GET sharedData/global`); nginx có thêm 403 ở `/uploads/` ngày 12/11, trong đó `/uploads/.env`. Chưa điều tra |  | Gần 0; điều tra nếu tăng |
| Mã 429 (bị giới hạn tần suất) | 0 | 0 |  | 0 (có nghĩa là có người dò mật khẩu) |
| `Traceback` / `MAIL-ERROR` trong nhật ký API | 0 | 0 |  | 0 |
| `cloudflared` kết nối lại (72 giờ / cửa sổ) | 23 / 72 giờ | 19 / 7 ngày (17 lần đăng ký lại thành công; cửa sổ dài hơn T0) |  | Tương đương; mỗi lần < vài giây, không có đợt kéo dài |
| Site từ ngoài (HTTP / thời gian) | 200 / 0,20 giây | 200 / 0,24 giây (script đo từ máy chủ); đo từ 4G ngày 11/11: 200 / 0,77 giây |  | 200 và < 1 giây |
| Ping 1.1.1.1 mất gói / trễ trung bình | 0% / ≈ 32–34 ms | 0% / 35,4 ms |  | < 1% / < 100 ms |
| Lưu lượng card mạng (MB nhận/gửi từ lần khởi động) | 72,6 / 72,0 | 609,6 / 366,2 |  | Tham khảo; `vnstat` cho số theo ngày |
| SSH đăng nhập sai / nguồn lạ | 22 / 0 | 5 / 0 (5 lần sai đều từ chính máy chủ) |  | Không có nguồn ngoài `192.168.2.175` |
| Cổng đang lắng nghe | 22, 80, 8787 (nội bộ), 20241 (nội bộ) | 22, 80, 8787 (nội bộ), 20241 (nội bộ), 53 (nội bộ); không có cổng lạ |  | Không thêm cổng lạ |
| Toàn vẹn cơ sở dữ liệu | ok | ok |  | `ok` |
| Số bảng ghi `accounts` / `docs` / `chat` | 5 / 13 / 6 | 2.051 / 4.306 / 6 (tăng mạnh, xem 8.4a) |  | Tăng hợp lý theo việc sử dụng |
| Bản sao lưu tự động mới nhất / số bản | 06/11 06:34 UTC / 1 | 12/11 20:03 UTC / 8 bản |  | < 24 giờ / tăng dần đến 14 |
| Thử khôi phục (`studytask-restore-test.sh`) | Đạt (06/11) | Đạt (13/11): `accounts` 2.051, `docs` 4.306, `chat` 6, `contact_email` 2 khớp; 390 tệp tải lên |  | Đạt: checksum khớp, `integrity_check: ok` |
| Ổ sao lưu `/mnt/backup` còn trống | 97 GB / 98 GB | 97 GB / 98 GB |  | > 20 GB |
| Gói chờ cập nhật / cần khởi động lại | 10 / không | 18 / có (cần khởi động lại) |  | < 20; áp dụng bản vá bảo mật trong vòng 1 tuần |

### 8.4a. Ghi nhận mốc T+7 (13/11/2026)

Đo lúc 13/11/2026 01:19 UTC (08:19 giờ Việt Nam) bằng `deploy/health-check.sh "-7 days" --save` qua SSH; minh chứng ở [bang-chung/2026-11-13/health-check-T7.txt](bang-chung/2026-11-13/health-check-T7.txt). Thử khôi phục bằng `studytask-restore-test.sh`: **thành công**. Claude Code (AI) chạy lệnh theo yêu cầu của Trương Thanh Vui.

**Ổ đĩa (đọc lúc 01:2x UTC ngày 13/11, `sudo smartctl`, do Trương Thanh Vui chạy):**

- Tự đánh giá tổng thể vẫn là `PASSED`; nhật ký lỗi ATA ghi "No Errors Logged".
- **Tự kiểm tra ngắn (`smartctl -t short`) KHÔNG đạt:** `Completed: read failure`, còn 50%, `LBA_of_first_error` **705216**, tại 4.862 giờ chạy.
- So với T0: `Reported_Uncorrect` (187) tăng từ 1.650 lên **1.651**, `G-Sense_Error_Rate` (191) từ 3.682 lên **3.692**; cả hai vượt ngưỡng "không tăng". `Reallocated_Sector_Ct` (5) vẫn 2, `Current_Pending_Sector` (197) và `Offline_Uncorrectable` (198) vẫn 0, `Command_Timeout` (188) không đổi, `UDMA_CRC_Error_Count` (199) 0, nhiệt độ 32 °C.
- Chỉ số khác cần ghi: `Load_Cycle_Count` (193) **337.945** (ổ laptop thường được nhà sản xuất định mức khoảng 300.000 lần; chưa có mốc T0 để so), `Start_Stop_Count` 4.780, `Power_Cycle_Count` 4.355.

**Kết luận ở mốc T+7 cho ổ đĩa: CHƯA ĐẠT.** Có một lỗi đọc thật ở đầu ổ (LBA 705216) và 187 đã nhích tăng, kích hoạt dòng "SMART không `PASSED`... hoặc 187/188 tăng so với T0" ở mục 8.5: **chép bản sao lưu ra thiết bị khác ngay, chuẩn bị thay ổ**. Mức độ cần được hiểu thận trọng: chỉ số 5, 197, 198 chưa xấu đi và tổng thể vẫn `PASSED`, nên ổ chưa hỏng hẳn, nhưng đã có bằng chứng lỗi đọc.

**Hai việc cần nhóm quyết:**
1. Chép lại bản sao lưu ra ổ ngoài (lần chép 11/11 có 6 bản từ 06–10/11 và **không có** dữ liệu mô phỏng mới nạp ngày 11–12/11). Ổ sao lưu `/mnt/backup` của máy chủ nằm trên **cùng ổ vật lý**, nên nếu ổ hỏng thì mất cả bản sao đó.
2. Thay ổ hoặc không: dự án sinh viên không mua thiết bị mới, nên cần nhóm cân nhắc phương án (chuyển sang ổ có sẵn, hoặc chấp nhận rủi ro và ghi rõ). Chạy thêm tự kiểm tra dài (`sudo smartctl -t long /dev/sda`, nhiều giờ, nên chạy lúc ít người dùng) để biết phạm vi lỗi.

**Điểm cần theo dõi:**
- **Dữ liệu tăng mạnh:** `accounts` từ 5 lên 2.051, `docs` từ 13 lên 4.306, CSDL 126 MB, bản sao lưu 120 MB (T0 khoảng 3 MB). Có 1.976 tài khoản tên dạng `sv<số>`, khoảng 75 tài khoản giáo viên dạng `gv…<số>`, 80 lớp và 114 khóa đáp án: đây là dữ liệu mô phỏng nạp ngày 11–12/11. **Cần nhóm ghi lại ai nạp, vì sao, và mật khẩu của các tài khoản này**; nếu là mật khẩu dễ đoán trên trang công khai thì cần đổi hoặc xóa trước khi dùng thật.
- **RSS của API 67 MB**, vượt mức 2 lần T0 (60 MB), gắn với việc API khởi động lại 12/11 và CSDL lớn hơn. Theo dõi ở T+15.
- **403 mới:** 17 ở API; nginx có 403 ở `/uploads/` ngày 12/11, trong đó `/uploads/.env` trông như dò quét từ bên ngoài, đã bị từ chối. Chưa điều tra nguyên nhân.
- **Gói chờ cập nhật 18** (T0 10), gần ngưỡng 20, và máy cần khởi động lại. Áp dụng bản vá trong tuần theo 8.5.
- **Ổ gốc tăng khoảng 0,9 GB so với T0**, sát mức "không quá ~1 GB/tuần".


### 8.5. Cần làm gì khi vượt ngưỡng

| Dấu hiệu | Kiểm tra trước | Hướng xử lý |
|---|---|---|
| RAM hoặc RSS tăng đều | `ps aux --sort=-%mem \| head`; so sánh RSS API giữa các mốc | Khởi động lại dịch vụ (`sudo systemctl restart studytask-api`), ghi lại; nếu tái diễn, xem nhật ký để tìm nguyên nhân rò rỉ |
| Ổ đĩa tăng nhanh | `du -sh /var/lib/studytask/uploads /var/log /var/lib/studytask` | Dọn nhật ký/bản sao lưu cũ; kiểm tra tệp tải lên bất thường |
| SMART không `PASSED`, có sector chờ/ngoại tuyến > 0, hoặc 187/188 tăng so với T0 | `sudo smartctl -a /dev/sda`, `sudo smartctl -l error /dev/sda` | **Chép bản sao lưu ra thiết bị khác ngay**, chuẩn bị thay ổ |
| Dịch vụ tự khởi động lại, lỗi 5xx, `Traceback` | `journalctl -u studytask-api -n 100` | Điều tra nguyên nhân gốc trước khi tiếp tục; ghi vào báo cáo |
| `cloudflared` kết nối lại dày đặc hoặc kéo dài | `journalctl -u cloudflared --since "-24 hours" \| grep -E "ERR\|WRN"` | Kiểm tra mạng nơi đặt máy; cân nhắc đặt `protocol: http2` trong cấu hình tunnel nếu QUIC bị chặn |
| 403 tăng | `grep ' 403 '` theo đường dẫn (script đã liệt kê) | Xác định tài khoản/trình duyệt gây ra, kiểm tra quyền; nếu là dò quét thì chặn bằng Cloudflare |
| Có 429 hoặc đăng nhập sai nhiều | `journalctl -u studytask-api \| grep 429` | Kiểm tra nguồn; khóa tài khoản bị dò, đổi mật khẩu |
| SSH có nguồn lạ hoặc cổng lạ đang lắng nghe | `journalctl -u ssh`, `ss -tlnp` | Kiểm tra router, tắt chuyển tiếp cổng, cân nhắc chỉ cho phép khóa SSH |
| Mất điện / khởi động lại ngoài kế hoạch | `journalctl --list-boots`, `journalctl -b -1 -n 50` | Ghi nguyên nhân; kiểm tra toàn vẹn CSDL; cân nhắc UPS |

### 8.6. Tiêu chí kết luận ở mốc T+15

Máy chủ được coi là **ổn định ở mức đề tài** nếu cả năm điều kiện sau đều đạt:

1. Không có lần khởi động lại ngoài kế hoạch; ba dịch vụ không tự khởi động lại.
2. Không có lỗi 5xx (ngoài 501 do `HEAD`) và không có `Traceback` trong nhật ký API.
3. Các chỉ số tài nguyên (RAM, RSS, đĩa) không có xu hướng tăng liên tục và nằm trong ngưỡng 8.4.
4. Tỷ lệ truy cập thành công từ ngoài ≥ 99% (cần giám sát HTTP bên ngoài; nếu chưa có thì ghi rõ "chưa đo").
5. Có ít nhất một bản sao lưu tự động trong 24 giờ gần nhất và đã thử khôi phục thành công một lần.

Nếu có điều kiện không đạt, ghi rõ trong báo cáo cùng nguyên nhân và hướng khắc phục thay vì bỏ qua.

## 9. Hạn chế của báo cáo

- Chỉ phản ánh **2 ngày 19 giờ** và **tải rất thấp** (chưa có người dùng thật đáng kể). Kết quả không chứng minh khả năng chịu tải; cần thêm phép thử tải riêng nếu muốn kết luận.
- SMART chỉ có **một lần đọc**, nên chưa phân biệt được lỗi quá khứ với lỗi đang diễn ra; chưa đọc nhật ký lỗi ATA và kết quả tự kiểm tra. Chưa có băng thông theo ngày (`vnstat` mới cài) và nhiệt độ từng lõi CPU.
- Nhật ký nginx đọc được chỉ gồm tệp hiện hành (không đọc được các tệp đã nén nếu thiếu quyền), nên số liệu nginx không phủ toàn bộ khoảng theo dõi.
- Không có số liệu của Firebase trước đây để so sánh tốc độ hoặc độ ổn định.
- Nguyên nhân các lỗi 403 ngày 03–04/11 chưa được xác minh.

## Phụ lục: các lệnh đã dùng (chạy được lại)

Script sao lưu, khôi phục thử và cài đặt nằm trong [deploy/backup/](../../deploy/backup/). Các lệnh dưới đây đã được gộp thành một script chạy một lần: `bash deploy/health-check.sh "-7 days" --save` (xem mục 8.3).

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
