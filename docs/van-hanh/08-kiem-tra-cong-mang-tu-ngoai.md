# Kiểm tra cổng mạng từ ngoài Internet (việc 6 tuần 6)

Phần kiểm tra mạng của việc 6 trong kế hoạch tuần 6: xác minh cổng 80 (và 22) của máy chủ **không vào thẳng được từ Internet**; chỉ có đường vào qua Cloudflare Tunnel.

## 1. Vì sao phải thử từ ngoài

Trên máy chủ, `ss -tln` (đọc ngày 11/11/2026 10:16 giờ Việt Nam) cho thấy:

| Cổng | Lắng nghe ở | Ý nghĩa |
|---|---|---|
| 22 (SSH) | `0.0.0.0` và `[::]` | Mọi giao diện mạng |
| 80 (nginx) | `0.0.0.0` | Mọi giao diện mạng |
| 8787 (API) | `127.0.0.1` | Chỉ nội bộ |
| 20241 (`cloudflared`) | `127.0.0.1` | Chỉ nội bộ |

Cổng 22 và 80 mở cho cả mạng LAN, nên chúng chỉ an toàn trước Internet nếu **bộ định tuyến không chuyển tiếp cổng** vào máy chủ (port forwarding, UPnP, DMZ). Việc này không đọc được từ máy chủ, phải thử từ mạng ngoài và xem cấu hình bộ định tuyến.

## 2. Cách làm

1. **Khi còn ở mạng nhà**, lấy IP công cộng: `(Invoke-RestMethod https://api.ipify.org)` trên PowerShell.
2. **Chuyển máy tính sang mạng khác** (bật phát 4G từ điện thoại), rồi chạy tại thư mục gốc repo:

```powershell
.\scripts\van-hanh\kiem-tra-cong-tu-ngoai.ps1 -Ip <IP_ở_bước_1>
```

Script chỉ thử kết nối TCP tới các cổng 22, 80, 443, 8787, 20241, từ chối chạy nếu máy đang dùng chính mạng của máy chủ, và ghi kết quả vào `docs/van-hanh/bang-chung/<ngày>/kiem-tra-cong-tu-ngoai.txt` với IP đã che octet cuối (repo công khai).
3. **Xem cấu hình bộ định tuyến** (trang quản trị): mục Port Forwarding / Virtual Server, UPnP, DMZ. Chụp ảnh, giữ trên máy, không đưa vào repo.

## 3. Kết quả

Thử lúc 11/11/2026 03:22 UTC (10:22 giờ Việt Nam) bằng `kiem-tra-cong-tu-ngoai.ps1`, do Trương Thanh Vui yêu cầu, từ máy dùng mạng 4G (khác mạng của máy chủ; IP mạng nhà `113.161.166.x` đã che). Tệp kết quả: [bang-chung/2026-11-11/kiem-tra-cong-tu-ngoai.txt](bang-chung/2026-11-11/kiem-tra-cong-tu-ngoai.txt).

| Cổng | Kết quả từ ngoài | Đánh giá |
|---|---|---|
| 22 (SSH) | Không phản hồi | Đạt |
| 80 | **MỞ** | Cần xử lý (xem dưới) |
| 443 | **MỞ** | Cần xử lý (xem dưới) |
| 8787 (API) | Không phản hồi | Đạt |
| 20241 (`cloudflared`) | Không phản hồi | Đạt |
| Trang web qua Cloudflare | HTTP 200, 0,77 giây | Đạt |

**Cổng 80 và 443 mở, nhưng không phải máy chủ StudyTask.** Dựa trên hai điểm:
- Máy chủ **không lắng nghe cổng 443** (mục 1), nên 443 mở từ ngoài chắc chắn không phải nginx của máy chủ.
- Một yêu cầu `HEAD` tới `http://<IP nhà>/` trả **HTTP 404, `Server: Microsoft-HTTPAPI/2.0`**: đó là dịch vụ HTTP của Windows (HTTP.sys), không phải nginx trên Ubuntu. Cổng 443 chấp nhận kết nối nhưng ngắt khi bắt tay TLS.

Kết luận tạm: **máy chủ StudyTask không bị vào thẳng từ ngoài** (22, 8787, 20241 không phản hồi; 80 không trả nginx), nhưng **có một thiết bị Windows trong mạng nhà đang mở cổng 80/443 ra Internet** (do bộ định tuyến chuyển tiếp cổng, UPnP hoặc DMZ). Cần xác định thiết bị đó và đóng cổng.

**Dò thiết bị từ trong mạng nhà (11/11/2026, chỉ đọc, không đăng nhập vào thiết bị nào):**

| Kiểm tra | Kết quả |
|---|---|
| Ánh xạ cổng UPnP của bộ định tuyến (`192.168.2.1`) | Chỉ có 3 mục: iVCam (TCP/UDP 5895 → `192.168.2.197`) và một ánh xạ Teredo của Windows (UDP 54623). **Không có ánh xạ cổng 80/443** |
| Thiết bị trong `192.168.2.0/24` mở cổng 80 hoặc 443 | `.1` bộ định tuyến (`httpd/2.0`), `.187` máy chủ StudyTask (`nginx/1.28.3`), `.197` máy Windows chạy IIS (`Microsoft-IIS/10.0`), `.213` máy in Canon (`CANON HTTP Server`) |
| So dấu vết với phản hồi từ ngoài (404, `Microsoft-HTTPAPI/2.0`), gửi `Host` là IP công cộng vào từng thiết bị | **Không thiết bị nào trả đúng dấu vết đó** (`.197` trả IIS 200) |

Kết luận: chuyển tiếp 80/443 không đến từ UPnP, nên là quy tắc tĩnh hoặc DMZ trong bộ định tuyến, và chưa xác định được đích. Máy `.197` (Windows, IIS) là ứng viên cần xem trước. Cần đọc bảng chuyển tiếp cổng và DMZ trong trang quản trị bộ định tuyến để biết chắc.

Việc còn lại (điền sau):

| Mục | Kết quả |
|---|---|
| Bộ định tuyến: Port Forwarding / Virtual Server, UPnP, DMZ | (điền: bảng chuyển tiếp cổng, cổng 80/443 trỏ tới IP LAN nào) |
| Thiết bị nhận cổng 80/443 | (điền sau khi xem bộ định tuyến; ứng viên: `192.168.2.197`) |
| Cách xử lý | (điền: xóa chuyển tiếp cổng / tắt UPnP / tắt dịch vụ) |
| Kết quả chạy lại sau xử lý | (điền: dán dòng KẾT QUẢ) |

Đạt hoàn toàn khi chạy lại không cổng nào ở trạng thái MỞ và trang web vẫn vào được qua Cloudflare.

## 4. Nếu có cổng mở

Tắt chuyển tiếp cổng, UPnP hoặc DMZ trong bộ định tuyến, chạy lại script, ghi cả hai lần kết quả. Biện pháp thêm (không bắt buộc): chỉ cho nginx lắng nghe ở `127.0.0.1:80` nếu không cần vào bằng mạng LAN; khi đó các lệnh kiểm tra bằng địa chỉ LAN của máy chủ sẽ không còn dùng được.

## 5. Phạm vi và giới hạn

Đây là kiểm tra của một dự án báo cáo sinh viên, không phải đánh giá bảo mật chuyên sâu.

- **Chỉ dùng công cụ miễn phí và sẵn có:** lệnh của Windows và PowerShell, `ssh`, `ss`, trang quản trị bộ định tuyến. Không mua công cụ quét cổng, dịch vụ giám sát trả phí hay thiết bị bảo mật.
- **Phạm vi thử:** chỉ kết nối TCP tới 5 cổng (22, 80, 443, 8787, 20241) từ một mạng 4G, vào một thời điểm; một yêu cầu `HEAD` để nhận diện dịch vụ ở cổng 80 và 443. Không quét toàn bộ cổng, không thử UDP, không thử IPv6, không dò lỗ hổng, không thử mật khẩu.
- **Không can thiệp sâu vào bộ định tuyến, modem hay nhà mạng:** chỉ đọc cấu hình trong trang quản trị mà nhóm có quyền truy cập, và chỉ đóng quy tắc chuyển tiếp do nhóm tự đặt. Phần do nhà mạng quản lý (cấu hình từ xa, tường lửa của nhà mạng) không kiểm tra và không sửa. Nếu một cổng mở thuộc phần này thì ghi lại như một hạn chế còn tồn tại, không coi là đã xử lý.
- **Dò thiết bị trong LAN:** chỉ quét cổng 80/443 trong dải `192.168.2.0/24` và đọc tiêu đề phản hồi; không đăng nhập vào thiết bị nào.
- **Kết quả "đạt" nghĩa là:** tại thời điểm thử, từ mạng đã dùng, các cổng nêu trên không phản hồi. Không có nghĩa máy chủ an toàn tuyệt đối. IP công cộng của nhà mạng có thể đổi, nên kết quả cần được thử lại khi có thay đổi mạng.
- **Cách giảm rủi ro chính:** máy chủ đi ra Internet qua Cloudflare Tunnel nên không cần chuyển tiếp cổng nào vào mạng nhà.

