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

### Kết luận và kết thúc việc (11/11/2026)

**Trạng thái: đã kiểm tra, ghi nhận hạn chế; không xử lý được phần cấu hình bộ định tuyến.**

| Mục | Kết quả |
|---|---|
| Bộ định tuyến: Port Forwarding, DMZ, truy cập từ xa | **Không kiểm tra được.** Nhóm không có quyền vào trang quản trị bộ định tuyến (thiết bị do nhà mạng cấp và quản lý). Chỉ đọc được danh sách ánh xạ UPnP (không có cổng 80/443) |
| Thiết bị nhận cổng 80/443 từ ngoài | **Chưa xác định.** Phản hồi từ ngoài là dịch vụ HTTP của Windows, không thiết bị nào trong LAN trả đúng dấu vết đó (máy Windows chạy IIS ở `192.168.2.197` chỉ là ứng viên) |
| Cách xử lý | Không có: không có quyền sửa cấu hình bộ định tuyến, và theo phạm vi ở mục 5 nhóm không can thiệp sâu vào thiết bị của nhà mạng |
| Kết quả chạy lại sau xử lý | Không chạy, vì không có xử lý nào |

Kết luận về yêu cầu của việc 6 ("xác minh cổng 80 không vào thẳng được từ ngoài"):
- **Máy chủ StudyTask không bị vào thẳng từ Internet** tại thời điểm thử: cổng 22 (SSH), 8787 (API) và 20241 (`cloudflared`) không phản hồi; cổng 80 phản hồi nhưng không phải nginx của máy chủ (máy chủ không lắng nghe cổng 443, và dấu vết cổng 80 là HTTP.sys của Windows).
- **Yêu cầu "cổng 80 không vào được từ ngoài" chưa đạt hoàn toàn**: cổng 80 và 443 của mạng nhà vẫn mở ra Internet, đến một thiết bị Windows chưa xác định. Rủi ro này nằm ở thiết bị đó, không ở máy chủ StudyTask, và còn tồn tại.
- Web vẫn vào được qua Cloudflare Tunnel (HTTP 200), nên việc không sửa bộ định tuyến không ảnh hưởng hoạt động của hệ thống.

**Rủi ro còn lại và đề nghị (cho người có quyền với bộ định tuyến, ví dụ chủ thuê bao):** vào trang quản trị, xem Port Forwarding / DMZ / truy cập từ xa, xóa mục chuyển tiếp cổng 80/443 nếu không dùng. Máy chủ StudyTask không cần chuyển tiếp cổng nào. Sau khi xử lý, chạy lại `kiem-tra-cong-tu-ngoai.ps1` từ mạng khác và ghi kết quả bổ sung vào biên bản này.

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

## 6. Biên bản vận hành rủi ro: cổng 80/443 mở tới máy Windows (việc của tuần 7, chuyển sang tuần 8: 23/11 – 28/11/2026)

Biên bản ghi nhận rủi ro còn tồn từ mục 3, gồm: mặt rủi ro (6.3), biện pháp bảo vệ, trọng tâm là Windows Firewall trên máy nhận cổng (6.4), cách kiểm tra sau khi áp dụng (6.5) và mốc đánh giá lại ở đợt kiểm tra bảo mật (6.6).

### 6.1. Thông tin biên bản

| Mục | Nội dung |
|---|---|
| Việc | Việc của **tuần 7**. Nhóm **thực hiện trễ** (tuần 7 chưa làm), nên chuyển sang **tuần 8 (23/11 – 28/11/2026)** thành việc 4, Nhóm A (Phần 5 [báo cáo tuần 7](../bao-cao-tuan/tuan-07.md)). Biên bản lập trong tuần 8 |
| Người phụ trách theo kế hoạch | Trần Đức Tùng (Nguyễn Thanh Tùng review) |
| Người soạn biên bản | **Trương Thanh Vui** (cùng Claude Code, model Claude Opus 5.5), ngày 25/11/2026 |
| Lý do đổi người soạn | Trần Đức Tùng **không truy cập được máy chủ và mạng nhà** nơi đặt máy chủ (máy chủ chỉ vào được bằng SSH từ trong mạng LAN `192.168.2.0/24`), nên không đo lại được hiện trạng. Người review giữ nguyên |
| Điều kiện thực hiện | Sau việc 1 tuần 8 (cập nhật server từ `master`): đã thỏa |
| Hiện trạng đo lại (25/11/2026 01:43 UTC, từ trong LAN, chỉ đọc) | Máy chủ `192.168.2.187` lắng nghe `0.0.0.0:22`, `0.0.0.0:80`; API `127.0.0.1:8787` và `cloudflared` `127.0.0.1:20241` chỉ nội bộ; **không lắng nghe 443**. Máy Windows `192.168.2.197` (ứng viên ở mục 3) vẫn mở cổng 80; cổng 443 không mở khi thử từ trong LAN (một lần thử kết nối TCP tới 2 cổng, không đăng nhập, không thay đổi gì; từ sau biên bản này nhóm không dò thiết bị khác, xem nguyên tắc ở 6.4) |
| Chưa đo lại | Lần thử từ ngoài Internet (mạng 4G) sau 11/11, do cần chuyển máy sang mạng khác. Đo lại theo 6.5 |

### 6.2. Ghi nhận: không thể xử lý bằng cách can thiệp vào modem / bộ định tuyến

Như đã ghi ở mục 3 ("Kết luận và kết thúc việc") và mục 5, nhóm **không xử lý được rủi ro ở phía modem**, và biên bản này **không dùng cách đó**:

- Modem/bộ định tuyến `192.168.2.1` do nhà mạng cấp và quản lý; nhóm **không có quyền** vào trang quản trị để xem hay xóa Port Forwarding, DMZ, truy cập từ xa.
- Chuyển tiếp 80/443 **không đến từ UPnP** (bảng UPnP không có mục 80/443), nên nằm ở quy tắc tĩnh hoặc DMZ trong phần nhà mạng quản lý. Nếu là DMZ thì **mọi cổng** từ Internet đều được đẩy vào máy đích, không chỉ 80/443; biện pháp ở 6.4 tính cả khả năng này.
- Theo phạm vi ở mục 5, nhóm không can thiệp vào thiết bị của nhà mạng. Muốn đóng tận gốc phải do **chủ thuê bao liên hệ nhà mạng**; việc này nằm ngoài khả năng của nhóm và chỉ được ghi nhận.

Vì vậy các biện pháp đặt ở **hai nơi nhóm kiểm soát được**: máy Windows nhận cổng (lớp chính) và máy chủ StudyTask (lớp phụ, chống bị tấn công lan từ LAN).

### 6.3. Mặt rủi ro

| # | Rủi ro | Khả năng | Ảnh hưởng | Ghi chú |
|---|---|---|---|---|
| R1 | Dịch vụ HTTP của Windows (HTTP.sys / IIS) trên máy nhận cổng bị dò quét và tấn công từ Internet: lỗ hổng chưa vá (HTTP.sys từng có lỗi cho phép chạy mã từ xa, ví dụ CVE-2015-1635, CVE-2022-21907), trang mặc định, thư mục ảo bị lộ | Trung bình: bot quét cổng 80/443 liên tục trên mọi IP công cộng | Cao **đối với máy Windows đó**: có thể bị chiếm quyền | Phản hồi từ ngoài ngày 11/11 là `Microsoft-HTTPAPI/2.0` (HTTP.sys) |
| R2 | Nếu modem dùng DMZ: các cổng khác của máy Windows (chia sẻ tệp 445, Remote Desktop 3389, RPC 135, WinRM 5985) cũng lộ ra Internet | Chưa xác định (chưa biết là DMZ hay quy tắc riêng 80/443) | Cao | Lần thử 11/11 chỉ kiểm 5 cổng (mục 5) |
| R3 | Máy Windows bị chiếm quyền trở thành **bàn đạp vào mạng LAN**, từ đó dò SSH (22) và nginx (80) của máy chủ StudyTask, vốn mở cho cả LAN | Thấp (cần R1 hoặc R2 xảy ra trước) | Cao: máy chủ chứa CSDL 1.031 tài khoản và bản sao lưu | Máy chủ không vào thẳng được từ Internet (mục 3); rủi ro chỉ đến gián tiếp qua LAN |
| R4 | Lộ thông tin: IP công cộng của mạng nhà trả lời trên 80/443, cho biết có máy Windows đang chạy dịch vụ web | Cao (đã xảy ra) | Thấp | Không lộ địa chỉ máy chủ StudyTask, vì web đi qua Cloudflare Tunnel |
| R5 | Nhóm **không kiểm soát** nguồn gốc rủi ro (cấu hình modem của nhà mạng); IP công cộng hoặc quy tắc có thể đổi mà nhóm không biết | Trung bình | Trung bình | Lý do cần đánh giá lại định kỳ (6.6) |

**Phần không bị ảnh hưởng:** hoạt động của StudyTask. Người dùng vào web qua Cloudflare Tunnel (HTTP 200); máy chủ không cần chuyển tiếp cổng nào, và cổng 22, 8787, 20241 không vào được từ ngoài (mục 3).

**Mức rủi ro tổng hợp: Trung bình, chấp nhận có điều kiện.** Điều kiện: áp dụng lớp A ở 6.4 trên máy Windows nhận cổng, kiểm tra theo 6.5 và đánh giá lại theo 6.6.

### 6.4. Biện pháp bảo vệ và an ninh

**Nguyên tắc thực hiện: nhóm chỉ thao tác trên máy chủ StudyTask, không can thiệp vào mạng.** Mạng nhà dùng chung với người khác, nên để không ảnh hưởng tới họ:

- Mọi biện pháp **nhóm tự làm** (lớp B) chỉ thay đổi cấu hình **bên trong máy chủ StudyTask** `192.168.2.187`. Không đổi cấu hình modem, không đổi cấu hình mạng LAN, không chặn hay ngắt thiết bị nào khác trong mạng.
- Nhóm **không đăng nhập, không cài đặt, không thay đổi** máy Windows nhận cổng hay bất kỳ thiết bị nào khác trong nhà, và **không quét, dò cổng** các thiết bị đó. Lớp A chỉ là **hướng dẫn gửi chủ máy Windows**; chủ máy tự quyết định có làm hay không, và các lệnh trong đó chỉ đổi cấu hình trên chính máy của họ.
- Modem của nhà mạng (lớp C): chỉ ghi nhận (6.2).

| Lớp | Nơi áp dụng | Ai làm | Ảnh hưởng tới người khác |
|---|---|---|---|
| A | Máy Windows nhận cổng 80/443 (ứng viên `192.168.2.197`) | **Chủ máy tự làm**, theo hướng dẫn dưới đây. Nhóm không thao tác trên máy này | Chỉ máy đó; không đổi gì ở mạng. Bước bắt buộc nếu chủ máy đồng ý: A1–A6, A9; khuyến nghị: A7–A8 |
| B | Máy chủ StudyTask `192.168.2.187` | **Nhóm** (Trương Thanh Vui, cần `sudo`), sau khi nhóm duyệt | Chỉ máy chủ; không đổi gì ở mạng và các máy khác |
| C | Modem của nhà mạng | Chủ thuê bao | Nhóm không làm, chỉ ghi nhận (6.2) |

#### Lớp A: hướng dẫn cho chủ máy Windows nhận cổng (nhóm không thực hiện)

Các lệnh dưới đây chạy **trên chính máy Windows đó**, bằng PowerShell quyền Administrator, do chủ máy tự làm. Chúng chỉ đổi tường lửa và dịch vụ của máy đó, không đổi cấu hình mạng hay modem.

**A1. Xác định đúng máy và dịch vụ đang nghe cổng** (trước mọi bước khác). Chủ máy chạy trên `192.168.2.197`. Nếu máy này không có cổng 80/443 đang nghe thì nhóm báo lại cho các thành viên trong nhà để chủ của các máy Windows khác tự kiểm tra; nhóm không tự dò các máy đó:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 80,443 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress, LocalPort, OwningProcess,
    @{n='Tien_trinh';e={(Get-Process -Id $_.OwningProcess).ProcessName}}
netsh http show servicestate view=requestq | Select-String -Pattern 'URL|Process|Controller'
Get-Service W3SVC, WAS -ErrorAction SilentlyContinue | Select-Object Name, Status, StartType
```

- `OwningProcess` = 4 (`System`) nghĩa là cổng do HTTP.sys giữ hộ một dịch vụ (IIS, chia sẻ media, ứng dụng .NET, …); `netsh http show servicestate` cho biết tiến trình và địa chỉ URL đã đăng ký.
- Ghi lại tên máy, tiến trình, URL vào bảng 6.7. Chống: xác định đúng đối tượng của R1.

**A2. Sao lưu cấu hình tường lửa trước khi sửa** (để quay lại được):

```powershell
New-Item -ItemType Directory -Force C:\Nhom5 | Out-Null
netsh advfirewall export "C:\Nhom5\tuong-lua-truoc-$(Get-Date -Format yyyyMMdd).wfw"
```

Quay lại cấu hình cũ: `netsh advfirewall import "C:\Nhom5\tuong-lua-truoc-<ngày>.wfw"`.

**A3. Tắt dịch vụ web nếu không dùng** (biện pháp triệt để nhất, không cần sửa modem). Chống R1:

```powershell
Stop-Service W3SVC, WAS -Force
Set-Service W3SVC -StartupType Disabled
Set-Service WAS -StartupType Disabled
```

Nếu tiến trình ở A1 là một ứng dụng khác thì tắt hoặc gỡ ứng dụng đó. Nếu vẫn cần dùng dịch vụ trong nhà thì bỏ qua A3, làm A4–A6.

**A4. Bật tường lửa đủ ba hồ sơ, mặc định chặn kết nối vào, mạng nhà để `Private`:**

```powershell
Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled True `
  -DefaultInboundAction Block -DefaultOutboundAction Allow -NotifyOnListen True
Get-NetConnectionProfile | Select-Object InterfaceAlias, NetworkCategory
# nếu mạng nhà đang là Public:  Set-NetConnectionProfile -InterfaceAlias '<tên card>' -NetworkCategory Private
```

`DefaultInboundAction Block` bảo đảm cổng nào không có quy tắc cho phép thì bị chặn. Chống R1, R2.

**A5. Chặn cổng 80/443 từ mọi địa chỉ ngoài mạng nội bộ** (quy tắc chính). Khi modem chuyển tiếp cổng, gói tin đến máy Windows vẫn mang IP nguồn công cộng của bên dò quét, nên tường lửa chặn được theo địa chỉ nguồn. Quy tắc chặn (Block) của Windows Firewall luôn ưu tiên hơn quy tắc cho phép (Allow), kể cả quy tắc IIS tự tạo. Chống R1, R4:

```powershell
$ngoaiLAN = '1.0.0.0-9.255.255.255','11.0.0.0-100.63.255.255','100.128.0.0-126.255.255.255',
            '128.0.0.0-169.253.255.255','169.255.0.0-172.15.255.255','172.32.0.0-192.167.255.255',
            '192.169.0.0-223.255.255.255'
New-NetFirewallRule -DisplayName 'Nhom5 - chan 80/443 TCP tu Internet' -Group 'Nhom5' -Direction Inbound `
  -Protocol TCP -LocalPort 80,443 -RemoteAddress $ngoaiLAN -Action Block -Profile Any
New-NetFirewallRule -DisplayName 'Nhom5 - chan 443 UDP (HTTP/3) tu Internet' -Group 'Nhom5' -Direction Inbound `
  -Protocol UDP -LocalPort 443 -RemoteAddress $ngoaiLAN -Action Block -Profile Any
```

`$ngoaiLAN` là mọi địa chỉ IPv4 công cộng, đã trừ các dải riêng `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `100.64.0.0/10`, `127.0.0.0/8`, `169.254.0.0/16`. Máy trong nhà vẫn vào được dịch vụ, còn yêu cầu từ Internet bị chặn.

**A6. Chặn các cổng quản trị và chia sẻ của Windows từ Internet** (phòng trường hợp modem dùng DMZ). Chống R2:

```powershell
New-NetFirewallRule -DisplayName 'Nhom5 - chan cong quan tri Windows tu Internet' -Group 'Nhom5' -Direction Inbound `
  -Protocol TCP -LocalPort 135,139,445,3389,5985,5986 -RemoteAddress $ngoaiLAN -Action Block -Profile Any
```

Nếu máy không cần nhận kết nối nào từ Internet thì có thể chặn toàn bộ (mạnh hơn A5 và A6 cộng lại):

```powershell
New-NetFirewallRule -DisplayName 'Nhom5 - chan moi ket noi vao tu Internet' -Group 'Nhom5' -Direction Inbound `
  -RemoteAddress $ngoaiLAN -Action Block -Profile Any
```

Lưu ý: quy tắc chặn toàn bộ làm hỏng các ứng dụng cần nhận kết nối từ Internet (ví dụ dùng iVCam hoặc Remote Desktop từ bên ngoài). Chỉ dùng khi chủ máy xác nhận không cần.

**A7. Nếu vẫn giữ dịch vụ web, giới hạn nó chỉ phục vụ trong LAN** (khuyến nghị). Chống R1:

```powershell
Import-Module WebAdministration
Get-WebBinding                                   # xem site đang gắn vào địa chỉ nào
Set-WebBinding -Name 'Default Web Site' -BindingInformation '*:80:' -PropertyName IPAddress -Value '192.168.2.197'
Set-WebConfigurationProperty -Filter /system.webServer/directoryBrowse -PSPath 'IIS:\' -Name enabled -Value False
```

Xóa site mặc định và thư mục `C:\inetpub\wwwroot` mẫu nếu không dùng.

**A8. Giữ máy an toàn chung** (khuyến nghị). Chống R1, R3:

- Bật Windows Update tự động; kiểm tra bản vá gần nhất: `Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 3`.
- Bật Microsoft Defender thời gian thực, quét định kỳ: `Get-MpComputerStatus | Select-Object RealTimeProtectionEnabled, AntivirusSignatureLastUpdated`; `Start-MpScan -ScanType QuickScan`.
- Tài khoản quản trị có mật khẩu mạnh; tắt tài khoản Guest: `Disable-LocalUser -Name Guest`.

**A9. Bật ghi nhật ký gói bị chặn** để có bằng chứng và phát hiện dò quét:

```powershell
Set-NetFirewallProfile -Profile Domain,Private,Public -LogBlocked True -LogMaxSizeKilobytes 16384 `
  -LogFileName '%SystemRoot%\System32\LogFiles\Firewall\pfirewall.log'
# đọc các lần bị chặn ở cổng 80/443:
Select-String -Path "$env:SystemRoot\System32\LogFiles\Firewall\pfirewall.log" -Pattern 'DROP TCP .* (80|443) ' |
  Select-Object -Last 20
```

**Gỡ bỏ (nếu cần quay lại):** `Remove-NetFirewallRule -Group 'Nhom5'`, rồi nhập lại tệp sao lưu ở A2 nếu đã đổi cấu hình hồ sơ.

**Giới hạn của lớp A:** chỉ bảo vệ máy đã áp dụng. Nếu thiết bị nhận cổng không phải Windows (máy in, camera) thì Windows Firewall không áp dụng được, phải tắt dịch vụ trên thiết bị đó. Cổng vẫn hiện "mở" ở modem, chỉ là không còn dịch vụ nào trả lời từ ngoài.

#### Lớp B: máy chủ StudyTask (phần nhóm tự làm; chống bị tấn công lan từ LAN, R3)

Máy chủ không bị vào thẳng từ Internet, nhưng SSH (22) và nginx (80) mở cho cả LAN. Nếu máy Windows bị chiếm, kẻ tấn công có thể dò hai cổng này. Các biện pháp dưới đây **chỉ đổi cấu hình bên trong máy chủ** (tường lửa `ufw` và SSH của máy chủ): chúng chỉ quyết định máy chủ nhận kết nối từ đâu, không chặn, không đổi và không làm chậm mạng hay máy của người khác. **Đã áp dụng ngày 25/11/2026 (B1–B4), kết quả ở 6.7.**

| # | Biện pháp | Lệnh (cần `sudo`) | Lưu ý |
|---|---|---|---|
| B1 | Xem hiện trạng tường lửa máy chủ (dịch vụ `ufw` đang chạy, chưa đọc được quy tắc khi không có `sudo`) | `sudo ufw status verbose` | Ghi kết quả vào bảng 6.7 |
| B2 | Mặc định chặn kết nối vào; SSH và nginx chỉ nhận từ LAN | `sudo ufw default deny incoming`<br>`sudo ufw default allow outgoing`<br>`sudo ufw allow from 192.168.2.0/24 to any port 22 proto tcp`<br>`sudo ufw allow from 192.168.2.0/24 to any port 80 proto tcp`<br>`sudo ufw enable` | **Thêm quy tắc cho phép SSH trước khi `enable`**, giữ cửa sổ SSH cũ mở và thử đăng nhập từ cửa sổ mới. Cho SSH từ cả LAN (không khóa theo một IP, vì IP do modem cấp có thể đổi). `cloudflared` nối ra ngoài và vào nginx qua `localhost` nên không bị ảnh hưởng. Quay lại: `sudo ufw disable` |
| B3 | Máy chủ từ chối kết nối SSH đến từ máy Windows nhận cổng | `sudo ufw insert 1 deny from 192.168.2.197 to any port 22` | Quy tắc nằm trên máy chủ, máy Windows vẫn dùng mạng bình thường. Bỏ quy tắc khi rủi ro được đóng |
| B4 | SSH chỉ đăng nhập bằng khóa, không cho `root` | Tạo `/etc/ssh/sshd_config.d/00-nhom5-bao-mat.conf` gồm `PasswordAuthentication no`, `KbdInteractiveAuthentication no`, `PermitRootLogin no`; `sudo sshd -t && sudo systemctl reload ssh` | Tên tệp bắt đầu `00-` để được ưu tiên hơn `50-cloud-init.conf` (sshd lấy giá trị đầu tiên gặp). Chỉ làm sau khi đã đăng nhập được bằng khóa và nhóm xác nhận không ai cần mật khẩu. Quay lại: xóa tệp rồi `sudo systemctl reload ssh` |
| B5 | Theo dõi đăng nhập SSH sai và nguồn lạ | `journalctl -u ssh --since "-7 days" \| grep -E "Failed\|Accepted"` | Đã có trong `deploy/health-check.sh`; đọc ở mỗi lần kiểm tra sức khỏe |

#### Lớp C: modem của nhà mạng

Ngoài khả năng của nhóm (6.2). Đề nghị chủ thuê bao, khi có dịp làm việc với nhà mạng: gỡ chuyển tiếp 80/443 hoặc DMZ nếu không dùng; đổi mật khẩu trang quản trị modem; tắt quản trị từ xa. Kết quả (nếu có) ghi vào bảng 6.7.

### 6.5. Kiểm tra sau khi áp dụng

| # | Kiểm tra | Lệnh | Kết quả đạt |
|---|---|---|---|
| K1 | Quy tắc đã có trên máy Windows (chủ máy tự kiểm tra, gửi ảnh chụp cho nhóm) | `Get-NetFirewallRule -Group 'Nhom5' \| Select-Object DisplayName, Enabled, Action` | Các quy tắc `Nhom5` đều `Enabled = True`, `Action = Block` |
| K2 | Tường lửa bật đủ hồ sơ (chủ máy tự kiểm tra) | `Get-NetFirewallProfile \| Select-Object Name, Enabled, DefaultInboundAction` | Cả ba `Enabled = True`, `DefaultInboundAction = Block` |
| K3 | Thử từ ngoài Internet (mạng 4G, tại thư mục gốc repo) | `.\scripts\van-hanh\kiem-tra-cong-tu-ngoai.ps1 -Ip <IP_cong_cong_mang_nha>` | 80 và 443 **không phản hồi**; 22, 8787, 20241 vẫn không phản hồi. Nếu 80/443 còn mở thì thiết bị nhận cổng là máy khác: lặp lại A1 trên máy đó |
| K4 | Dịch vụ trên máy Windows vẫn dùng được trong nhà (nếu còn giữ) | Chủ máy tự mở dịch vụ như thường lệ; nhóm không truy cập máy đó | Chủ máy xác nhận dùng bình thường |
| K5 | Có dấu vết bị chặn trong nhật ký | Lệnh đọc nhật ký ở A9 | Có dòng `DROP TCP ... 80` hoặc `443` từ IP ngoài (sau vài giờ, do bot dò quét) |
| K6 | Web StudyTask không bị ảnh hưởng | `curl.exe -sI https://sutdytask.io.vn` | HTTP 200 |

Tệp kết quả của K3 lưu vào `bang-chung/<ngày>/`; các kết quả khác ghi một dòng vào bảng 6.7.

### 6.6. Mốc đánh giá lại ở đợt kiểm tra bảo mật

| Mốc | Khi nào | Làm gì | Người làm |
|---|---|---|---|
| Đánh giá lại định kỳ | **Đợt kiểm tra bảo mật trước nghiệm thu**: nhóm đề xuất tuần 10 (07/12 – 12/12/2026), chốt trong kế hoạch tuần 9 | Chạy lại K1–K6 (K1, K2, K4 do chủ máy Windows tự làm); thử từ 4G thêm các cổng ở A6 vào IP công cộng của mạng nhà để biết modem dùng DMZ hay không; kiểm tra lớp B trên máy chủ (`sudo ufw status verbose`); đánh giá lại R1–R5. Không quét hay dò các thiết bị khác trong LAN | Trần Đức Tùng thực hiện cùng người ở mạng nhà (Trương Thanh Vui); Nguyễn Thanh Tùng review |
| Đánh giá lại khi có thay đổi | Ngay khi: đổi nhà mạng hoặc modem; IP công cộng đổi; thêm máy Windows hoặc dịch vụ web mới trong nhà; dời máy chủ | Như trên | Người phát hiện thay đổi báo nhóm |
| Kết thúc theo dõi | Khi chủ thuê bao nhờ nhà mạng gỡ chuyển tiếp 80/443 (lớp C) và K3 cho 80/443 không phản hồi | Ghi kết quả vào 6.7, chuyển rủi ro sang "đã đóng" | Nhóm |

Tiêu chí đạt ở mỗi lần đánh giá lại: từ Internet, cổng 22, 8787, 20241 không phản hồi; cổng 80/443 không phản hồi, hoặc nếu còn thì không phải nginx của máy chủ và máy nhận cổng đã có các quy tắc lớp A.

### 6.7. Kết quả và theo dõi

| Ngày | Việc | Kết quả |
|---|---|---|
| 11/11/2026 | Thử từ 4G (mục 3) | 80, 443 mở tới dịch vụ HTTP.sys của Windows; 22, 8787, 20241 đóng |
| 25/11/2026 (tuần 8) | Lập biên bản này (việc tuần 7 làm trễ); đo lại từ trong LAN | Máy chủ không nghe 443; API và `cloudflared` chỉ nội bộ; `192.168.2.197` vẫn mở 80. Lớp A, B chưa áp dụng tại thời điểm lập biên bản; lớp B áp dụng ngay sau đó (các dòng dưới) |
| 25/11/2026 (tuần 8) | B1: đọc hiện trạng máy chủ trước khi áp dụng lớp B (Trương Thanh Vui chạy) | `ufw`: **`Status: inactive`** (máy chủ chưa có tường lửa lọc kết nối vào). SSH (`sshd -T`): `passwordauthentication yes`, `kbdinteractiveauthentication no`, `pubkeyauthentication yes`, `permitrootlogin prohibit-password` (root không đăng nhập bằng mật khẩu được) |
| 25/11/2026 (tuần 8) | B2 + B3: bật tường lửa `ufw` trên máy chủ (Trương Thanh Vui chạy, khoảng 02:04 UTC) | **Đã áp dụng.** Mặc định chặn kết nối vào, cho phép kết nối ra. Quy tắc (`ufw status numbered`): [1] `22/tcp DENY IN 192.168.2.197` (máy Windows nhận cổng 80/443); [2] `22/tcp ALLOW IN 192.168.2.0/24` (SSH từ LAN); [3] `80/tcp ALLOW IN 192.168.2.0/24` (nginx từ LAN). Điều chỉnh so với đề xuất ban đầu: SSH cho cả LAN thay vì chỉ `192.168.2.175`, vì IP do modem cấp có thể đổi. Chỉ đổi cấu hình bên trong máy chủ, không đổi mạng hay máy khác |
| 25/11/2026 (tuần 8) | Kiểm tra sau B2 + B3 (K6 và kiểm tra lớp B) | Từ laptop (cửa sổ mới): SSH `ssh-ok`; `https://sutdytask.io.vn` HTTP 200 qua Cloudflare; `http://192.168.2.187/` HTTP 200 (nginx 1.28.3). Đọc lại lúc 02:05 UTC: `ufw`, `studytask-api`, `nginx`, `cloudflared` đều `active`; `cloudflared` không có lỗi; API nội bộ 200. **Đạt** |
| 25/11/2026 (tuần 8) | B4: SSH chỉ đăng nhập bằng khóa (Trương Thanh Vui chạy, 02:06 UTC) | **Đã áp dụng.** Tệp `/etc/ssh/sshd_config.d/00-nhom5-bao-mat.conf` (đặt tên `00-` để được ưu tiên hơn `50-cloud-init.conf`): `PasswordAuthentication no`, `KbdInteractiveAuthentication no`, `PermitRootLogin no`; `sshd -t` hợp lệ, `systemctl reload ssh`. `sshd -T`: cả ba giá trị `no`. Kiểm tra từ laptop: đăng nhập bằng khóa vẫn được; thử đăng nhập bằng mật khẩu bị từ chối (`Permission denied (publickey)`). Đăng nhập trực tiếp tại máy chủ (bàn phím, màn hình) vẫn dùng mật khẩu như cũ. **Đạt** |
| 25/11/2026 (tuần 8) | Lớp A (máy Windows nhận cổng) | **Không thực hiện**: máy không thuộc nhóm; nhóm không đăng nhập, không thay đổi máy đó và không can thiệp vào mạng (nguyên tắc ở 6.4). Hướng dẫn A1–A9 giữ làm khuyến nghị cho chủ máy. Nếu chủ máy tự áp dụng thì ghi thêm kết quả K1, K2, K4 vào bảng này |
| 25/11/2026 (tuần 8) | K3: thử từ ngoài Internet sau khi áp dụng lớp B (laptop dùng mạng 4G `27.66.20.x`, 02:07–02:12 UTC). Tệp: [kiem-tra-cong-tu-ngoai.txt](bang-chung/2026-11-25/kiem-tra-cong-tu-ngoai.txt), [kiem-tra-them-cong-tu-ngoai.txt](bang-chung/2026-11-25/kiem-tra-them-cong-tu-ngoai.txt) | Mục tiêu `113.161.166.x` (IP mạng nhà ghi nhận 11/11). **22, 8787, 20241: không phản hồi (đạt)**; web qua Cloudflare HTTP 200, 0,58 giây. **80, 443: vẫn mở**, cả hai trả `404` của `Microsoft-HTTPAPI/2.0` (HTTP.sys của Windows), không phải nginx của máy chủ: đúng như dự kiến, vì lớp A không thực hiện và modem không sửa được. Thử thêm các cổng ở A6: 135, 139, 445, 3389, 5985, 5986 **không phản hồi**, nên modem nhiều khả năng **không dùng DMZ** cho máy Windows (R2 giảm). Phát hiện mới: **8080 mở** (`nginx/1.26.2`, trang của một cổng dịch vụ không thuộc nhóm) và **21 mở** (không gửi lời chào); đều không phải máy chủ StudyTask (máy chủ không nghe 8080, 21 và `ufw` chặn kết nối vào từ ngoài LAN). Nhóm không dò thêm, ghi nhận như R4 |
| | Xác nhận IP công cộng của mạng nhà vẫn là `113.161.166.x` (khi về mạng nhà: `Invoke-RestMethod https://api.ipify.org`) | _(điền khi làm; nếu IP đã đổi thì kết quả K3 ở trên phải đo lại)_ |
| | Đánh giá lại ở đợt kiểm tra bảo mật | _(điền khi làm)_ |

**Kết luận:** việc này thuộc tuần 7, làm trễ và hoàn thành trong tuần 8 (23/11 – 28/11/2026) dưới tên việc 4. Biên bản có mặt rủi ro (6.3), biện pháp bảo vệ với Windows Firewall trên máy nhận cổng (6.4), cách kiểm tra (6.5) và mốc đánh giá lại ở đợt kiểm tra bảo mật (6.6).

| Lớp | Trạng thái 25/11/2026 |
|---|---|
| A: máy Windows nhận cổng | Không thực hiện (máy không thuộc nhóm); giữ làm khuyến nghị cho chủ máy |
| B: máy chủ StudyTask | **Đã áp dụng và kiểm tra đạt**: tường lửa `ufw` bật (mặc định chặn kết nối vào; SSH và nginx chỉ từ LAN; chặn `192.168.2.197` vào SSH); SSH chỉ đăng nhập bằng khóa, không cho `root`. Web và dịch vụ hoạt động bình thường |
| C: modem nhà mạng | Không can thiệp được, chỉ ghi nhận (6.2) |

Kiểm tra từ ngoài Internet ngày 25/11 (K3): máy chủ StudyTask vẫn không vào thẳng được (22, 8787, 20241 không phản hồi); 80/443 vẫn mở tới HTTP.sys của Windows; các cổng quản trị Windows không mở (nhiều khả năng không phải DMZ); có thêm 8080 và 21 mở tới thiết bị khác, không phải máy chủ.

Rủi ro được **ghi nhận, giảm một phần, chưa loại bỏ**: R3 (tấn công lan từ máy Windows vào máy chủ) đã giảm nhờ lớp B; R2 giảm vì không thấy dấu hiệu DMZ; R1, R2, R4 nằm ở máy Windows và modem ngoài phạm vi của nhóm; R5 theo dõi bằng mốc đánh giá lại (6.6). Kết quả đã ghi vào phần rủi ro của [báo cáo 01](01-bao-cao-suc-khoe-may-chu.md) mục 7.
