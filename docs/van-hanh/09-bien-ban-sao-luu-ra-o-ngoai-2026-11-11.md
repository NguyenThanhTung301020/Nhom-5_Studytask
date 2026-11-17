# Biên bản chép bản sao lưu ra ổ ngoài (việc 1b tuần 6)

- Việc: chép bản sao lưu tự động của máy chủ ra thiết bị ngoài ổ vật lý của máy chủ và ghi một lần kiểm tra khôi phục (việc 1b, kế hoạch tuần 6)
- Người thực hiện: Trương Thanh Vui; Claude Code (AI) chạy các lệnh theo yêu cầu, cần ghi vào nhật ký sử dụng AI
- Thời điểm: 11/11/2026 (khoảng 11:00 giờ Việt Nam)
- Nguồn: `/mnt/backup/studytask` trên máy chủ (ổ LVM cùng ổ vật lý với hệ thống)
- Đích: ổ ngoài nối với máy cá nhân của Trương Thanh Vui, NTFS, 232 GB, thư mục `StudyTask-backup\studytask-tu-may-chu-2026-11-11`

## 1. Kết quả

| Hạng mục | Kết quả |
|---|---|
| Số bản sao lưu đã chép | 6 bản ngày (06/11 06:34, 06/11 20:00, 07/11, 08/11, 09/11, 10/11 20:02 UTC) và `backup.log` |
| Số tệp / dung lượng | 385 tệp, khoảng 3,3 MB |
| So SHA256 từng tệp, máy chủ và ổ ngoài | **Trùng 385/385** (cả đường dẫn lẫn hash) |
| `sha256sum -c SHA256SUMS` trong từng bản (trên ổ ngoài) | 6/6 `OK` |
| `pragma integrity_check` của `studytask.db` từng bản (trên ổ ngoài) | 6/6 `ok` |
| Thử khôi phục: dựng API tạm (thư mục tạm, không đụng ổ ngoài hay máy chủ) từ bản 10/11 | `GET /api/auth/me` trả 200; không có `Traceback` trong nhật ký; `integrity_check: ok` |
| Số bản ghi trong bản 10/11 | `accounts` 5, `docs` 20, `chat` 6, `sessions` 4, `contact_email` 2, `codes` 0, `submission_files` 0 |

Bản sao lưu 10/11 có 57 tệp tải lên và `MANIFEST.txt` ghi `csdl_bytes: 135168`.

## 2. Cách làm

```bash
# Máy chủ chỉ được đọc; bỏ liên kết LATEST vì Windows không tạo được liên kết mềm
ssh studytask@192.168.2.187 'tar -C /mnt/backup/studytask --exclude=LATEST -cf - .' | tar -xf - -C <thư mục trên ổ ngoài>
```

Sau đó so `sha256sum` của từng tệp ở hai phía (lưu ý: `sha256sum` trên Windows in thêm dấu `*` trước tên tệp, cần bỏ khi so), chạy `sha256sum -c SHA256SUMS` và `integrity_check`, rồi dựng API tạm từ bản mới nhất.

## 3. Bảo vệ bản sao

Mỗi bản có `config/mail.json` (mật khẩu ứng dụng gửi email) và `studytask.db` (băm mật khẩu, email, bài nộp), nên **bản chép trên ổ ngoài phải được bảo vệ**:

- **Quyết định của Trương Thanh Vui: không mã hóa ổ.** Đây là ổ di động; sau mỗi lần chép sẽ **rút ra và cất đi**, chỉ cắm vào khi cần chép hoặc khôi phục. Bản chép trên ổ **không được mã hóa**.
- Điều kiện đi kèm để chấp nhận cách này: cất ổ ở nơi an toàn, không để cắm sẵn vào máy; không đưa nội dung ổ vào repo, không gửi qua mạng, không cho mượn khi ổ còn chứa bản sao lưu.
- Rủi ro còn lại: nếu ổ bị mất hoặc bị lấy cắp thì người nhặt được đọc được `config/mail.json` (mật khẩu ứng dụng gửi email), băm mật khẩu, email và bài nộp trong `studytask.db`. Nếu ổ bị mất: đổi mật khẩu ứng dụng email (`mail-config`), và đặt lại mật khẩu các tài khoản.


## 4. Giới hạn

- Đây là **một bản chép tại một thời điểm**. Từ sau 10/11 20:02 UTC bản sao lưu tự động trên máy chủ vẫn chạy mỗi ngày, nhưng bản trên ổ ngoài không tự cập nhật; cần chép lại theo lịch (đề xuất mỗi tuần một lần, và trước mỗi lần triển khai lớn).
- Ổ ngoài nằm ở máy cá nhân của một thành viên, cùng mạng và cùng nơi đặt với máy chủ. Vì thế chưa phải bản sao lưu ngoài địa điểm (chống cháy, mất điện, mất cắp tại chỗ).
- Thử khôi phục ở trên kiểm tra tệp mở được và API dựng được; chưa đăng nhập bằng tài khoản thật. Lần thử khôi phục trên máy chủ bằng `studytask-restore-test.sh` đạt ngày 06/11 ([báo cáo vận hành](01-bao-cao-suc-khoe-may-chu.md)).

## 5. Việc còn lại

| Việc | Người phụ trách |
|---|---|
| Rút ổ sau mỗi lần chép và cất đi (ghi ngày rút ổ vào biên bản) | Trương Thanh Vui |
| Đặt lịch chép lại (mỗi tuần), ghi lần chép tiếp theo vào biên bản này | Trương Thanh Vui |
| Nguyễn Thanh Tùng xác nhận (theo kế hoạch tuần 6 việc 1b) | Nguyễn Thanh Tùng |

## 6. Lần chép lại ngày 17/11/2026 (việc 3 tuần 7)

Bổ sung vì lần chép 11/11 không có dữ liệu mô phỏng nạp ngày 11–12/11 (xem [báo cáo vận hành](01-bao-cao-suc-khoe-may-chu.md) mục 8.4a).

- Người thực hiện: Trương Thanh Vui chuẩn bị ổ G; Claude Code (AI) chạy các lệnh theo yêu cầu, cần ghi vào nhật ký sử dụng AI.
- Thời điểm: 17/11/2026 06:11:59–06:12:34 UTC (13:11–13:12 giờ Việt Nam).
- Nguồn: `/mnt/backup/studytask` trên máy chủ (ổ cùng ổ vật lý với hệ thống), chỉ đọc.
- Đích: ổ ngoài G, NTFS, 232 GB, thư mục `StudyTask-backup\studytask-tu-may-chu-2026-11-17`. Thư mục lần 11/11 (`studytask-tu-may-chu-2026-11-11`) **giữ nguyên**, không bị ghi đè.
- Cách làm: giống mục 2 (`ssh … tar -cf - . | tar -xf -`, bỏ liên kết `LATEST`).

| Hạng mục | Kết quả |
|---|---|
| Số bản đã chép | 12 bản ngày, từ 06/11 06:34 đến **16/11 20:05 UTC**, và `backup.log` |
| Số tệp / dung lượng | 8.362 tệp, 176 MB |
| So SHA256 từng tệp (đường dẫn và hash), máy chủ với ổ G | **Trùng 8.362/8.362** |
| `sha256sum -c SHA256SUMS` trong từng bản (trên ổ G) | 12/12 `OK` |
| `pragma integrity_check` của `studytask.db` từng bản | 12/12 `ok` |
| Dữ liệu trong bản 16/11 | `accounts` 2.051, `docs` 4.307, `chat` 6; `studytask.db` 4.268.032 byte |
| Dữ liệu mô phỏng nạp 12/11 | Có từ bản **12/11 20:03 UTC** (`accounts` 5 → 2.051, `docs` 20 → 4.306) |
| Thử khôi phục | Chép `studytask.db` bản 16/11 sang thư mục tạm trên máy cá nhân, chạy API tạm (cổng 8797): `GET /api/auth/me` trả 200; không có `Traceback` trong nhật ký. Chưa đăng nhập bằng tài khoản thật |

Bảo vệ bản sao: giữ nguyên quyết định ở mục 3 (ổ **không mã hóa**, rút ổ và cất sau khi chép). Các bản chép lần này cũng có `config/mail.json` và băm mật khẩu của 2.051 tài khoản, nên điều kiện ở mục 3 vẫn áp dụng; riêng lần này ổ chứa thêm bản 12–16/11.

Cùng ngày 17/11, Trương Thanh Vui chạy `sudo smartctl -t long /dev/sda` trên máy chủ: kiểm tra dừng sớm với `Completed: read failure` tại LBA 705216 (cùng sector với lần kiểm tra ngắn 13/11); chi tiết ở [báo cáo vận hành](01-bao-cao-suc-khoe-may-chu.md) mục 8.4c. Vì ổ máy chủ có lỗi đọc lặp lại, bản sao trên ổ G là bản sao ngoài duy nhất và nên được chép lại đều đặn.

Còn lại sau lần chép này (cần người thật):

| Việc | Người phụ trách | Ghi chú |
|---|---|---|
| Rút ổ G và cất; ghi ngày rút vào đây | Trương Thanh Vui | Ngày rút: ______ |
| Đặt lịch chép tiếp theo (đề xuất 24/11, và trước mỗi lần triển khai lớn); ghi vào đây | Trương Thanh Vui | Lần tiếp theo: ______ |
| Xác nhận việc 1b (và chấp nhận rủi ro không mã hóa) | Nguyễn Thanh Tùng | |
