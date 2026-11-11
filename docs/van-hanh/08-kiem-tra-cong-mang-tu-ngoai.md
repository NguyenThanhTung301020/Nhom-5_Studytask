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

Việc còn lại (điền sau):

| Mục | Kết quả |
|---|---|
| Bộ định tuyến: Port Forwarding / Virtual Server, UPnP, DMZ | (điền: bảng chuyển tiếp cổng, cổng 80/443 trỏ tới IP LAN nào) |
| Thiết bị nhận cổng 80/443 | (điền: tên thiết bị, dịch vụ nào đang mở) |
| Cách xử lý | (điền: xóa chuyển tiếp cổng / tắt UPnP / tắt dịch vụ) |
| Kết quả chạy lại sau xử lý | (điền: dán dòng KẾT QUẢ) |

Đạt hoàn toàn khi chạy lại không cổng nào ở trạng thái MỞ và trang web vẫn vào được qua Cloudflare.

## 4. Nếu có cổng mở

Tắt chuyển tiếp cổng, UPnP hoặc DMZ trong bộ định tuyến, chạy lại script, ghi cả hai lần kết quả. Biện pháp thêm (không bắt buộc): chỉ cho nginx lắng nghe ở `127.0.0.1:80` nếu không cần vào bằng mạng LAN; khi đó các lệnh kiểm tra bằng địa chỉ LAN của máy chủ sẽ không còn dùng được.
