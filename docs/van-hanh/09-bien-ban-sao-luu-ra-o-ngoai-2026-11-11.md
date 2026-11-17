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

### Quyết định của Nguyễn Thanh Tùng về bản sao lưu 17/11/2026 (máy Nguyễn Thanh Tùng)

- **Quyết định: mã hóa bằng 7-Zip AES-256** (không chọn cách ghi chấp nhận rủi ro). Xác nhận ngày 17/11/2026.
- Đối tượng: thư mục `studytask-tu-may-chu-2026-11-17` (12 bản ngày từ 06/11 đến 16/11 và `backup.log`; 49 thư mục, 8386 tệp, 707 MiB) tải từ máy chủ về máy Nguyễn Thanh Tùng.
- Kết quả: tệp `studytask-tu-may-chu-2026-11-17.7z` (636 MiB), phương pháp LZMA2 + 7zAES, **có mã hóa cả tên tệp** (`-mhe=on`). Mật khẩu do Nguyễn Thanh Tùng tự nhập; **mật khẩu không ghi trong biên bản, trong repo hay trong nhật ký AI**.
- Kiểm tra: `7z t` với mật khẩu đúng báo `Everything is Ok`, 49 thư mục, 8386 tệp, 741072412 byte, khớp với thư mục gốc. Chưa so SHA256 từng tệp sau khi giải nén.
- Bản chưa mã hóa: thư mục gốc `studytask-tu-may-chu-2026-11-17` và tệp `.rar` cũ **đã được Nguyễn Thanh Tùng xóa ngày 17/11/2026**, sau khi `7z t` đạt. Trên máy chỉ còn tệp `.7z` mã hóa. (Xóa thường, chưa xóa an toàn; thùng rác Windows cần được dọn nếu có.)
- **Đổi mật khẩu cùng ngày 17/11/2026:** mật khẩu đặt lần đầu bị coi là yếu nên đã bỏ; tệp được giải nén và nén lại bằng mật khẩu mới do Nguyễn Thanh Tùng tự đặt (13 ký tự). `7z t` đạt (49 thư mục, 8386 tệp) cả khi nhập mật khẩu lấy từ nơi cất. Tệp `.7z` dùng mật khẩu cũ và thư mục giải nén tạm đã xóa; hiện chỉ còn một tệp `.7z`.
- **Nơi cất mật khẩu:** trình quản lý mật khẩu của Google (Chrome), mục `studytask-backup.local`. Mật khẩu không ghi trong biên bản, repo hay nhật ký AI.
- **Bản chép thứ hai:** ngày 17/11/2026 Nguyễn Thanh Tùng chép tệp `.7z` sang `C:\backup\` (ổ SSD C, khác ổ vật lý với bản gốc ở ổ D là HDD). SHA256 hai bản trùng (`3C9D2B10…93D321FB`, 666636933 byte). **Giới hạn:** hai bản cùng nằm trong một máy, nên chỉ chống được hỏng một ổ cứng; chưa chống được mất máy, cháy, mã độc. Nguyễn Thanh Tùng chưa có ổ ngoài, chấp nhận rủi ro này cho đến khi có thiết bị ngoài.

## 4. Giới hạn

- Đây là **một bản chép tại một thời điểm**. Từ sau 10/11 20:02 UTC bản sao lưu tự động trên máy chủ vẫn chạy mỗi ngày, nhưng bản trên ổ ngoài không tự cập nhật; cần chép lại theo lịch (đề xuất mỗi tuần một lần, và trước mỗi lần triển khai lớn).
- Ổ ngoài nằm ở máy cá nhân của một thành viên, cùng mạng và cùng nơi đặt với máy chủ. Vì thế chưa phải bản sao lưu ngoài địa điểm (chống cháy, mất điện, mất cắp tại chỗ).
- Thử khôi phục ở trên kiểm tra tệp mở được và API dựng được; chưa đăng nhập bằng tài khoản thật. Lần thử khôi phục trên máy chủ bằng `studytask-restore-test.sh` đạt ngày 06/11 ([báo cáo vận hành](01-bao-cao-suc-khoe-may-chu.md)).

## 5. Việc còn lại

| Việc | Người phụ trách |
|---|---|
| Rút ổ sau mỗi lần chép và cất đi (ghi ngày rút ổ vào biên bản) | Trương Thanh Vui |
| Đặt lịch chép lại (mỗi tuần), ghi lần chép tiếp theo vào biên bản này | Trương Thanh Vui |
| Nguyễn Thanh Tùng xác nhận (theo kế hoạch tuần 6 việc 1b) | Nguyễn Thanh Tùng — đã xác nhận ngày 17/11/2026: mã hóa 7-Zip AES-256 (mục 3) |
| ~~Cất mật khẩu của tệp `.7z`~~ — đã cất trong trình quản lý mật khẩu Google, 17/11/2026 (mục 3) | Nguyễn Thanh Tùng |
| ~~Chép bản thứ hai~~ — đã chép sang `C:\backup\` ngày 17/11/2026 (mục 3) | Nguyễn Thanh Tùng |
| Khi có ổ ngoài hoặc dịch vụ lưu trữ ngoài máy: chép thêm một bản ra đó, thử `7z t`, ghi ngày chép | Nguyễn Thanh Tùng |
| ~~Xóa thư mục gốc và tệp `.rar` cũ chưa mã hóa~~ — đã xóa ngày 17/11/2026 (mục 3); dọn thùng rác Windows | Nguyễn Thanh Tùng |
