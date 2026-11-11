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

## 3. Kết quả (điền sau khi thử)

| Mục | Kết quả |
|---|---|
| Ngày giờ, người thực hiện, mạng dùng để thử | (điền) |
| Cổng 22 từ ngoài | (điền: KHONG PHAN HOI / TU CHOI / MO) |
| Cổng 80 từ ngoài | (điền) |
| Cổng 443, 8787, 20241 từ ngoài | (điền) |
| Trang web qua Cloudflare | (điền: HTTP, thời gian) |
| Bộ định tuyến: có chuyển tiếp cổng, UPnP, DMZ không | (điền) |
| Kết luận | (điền) |

Đạt khi không cổng nào ở trạng thái MỞ và trang web vẫn vào được qua Cloudflare. `TU CHOI` và `KHONG PHAN HOI` đều coi là không vào được; `KHONG PHAN HOI` là kết quả tốt hơn vì không để lộ máy chủ đang tồn tại ở địa chỉ đó.

## 4. Nếu có cổng mở

Tắt chuyển tiếp cổng, UPnP hoặc DMZ trong bộ định tuyến, chạy lại script, ghi cả hai lần kết quả. Biện pháp thêm (không bắt buộc): chỉ cho nginx lắng nghe ở `127.0.0.1:80` nếu không cần vào bằng mạng LAN; khi đó các lệnh kiểm tra bằng địa chỉ LAN của máy chủ sẽ không còn dùng được.
