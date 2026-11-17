# Báo cáo cập nhật máy chủ theo phân công tuần 7

- Kế hoạch: **tuần 7** (16/11 – 21/11/2026), Phần 6 của [báo cáo tuần 6](../bao-cao-tuan/tuan-06.md). Các việc dưới đây được nêu trong bảng kế hoạch đó và thực hiện từ 13/11, nên ghi nhận là việc của tuần 7.
- Người phụ trách phần máy chủ: Trương Thanh Vui. Nguyễn Thanh Tùng xác nhận các việc ghi "Tùng xác nhận".
- Số liệu đo ngày 17/11/2026 (SSH chỉ đọc, chi tiết ở [biên bản 12](12-doi-chieu-may-chu-2026-11-17.md)) và chép sao lưu ra ổ G cùng ngày ([biên bản 09](09-bien-ban-sao-luu-ra-o-ngoai-2026-11-11.md) mục 6). Claude Code (AI) chạy các lệnh theo yêu cầu của Trương Thanh Vui.
- Phạm vi: các việc liên quan đến **máy chủ** (triển khai, cập nhật hệ điều hành, sao lưu, sức khỏe, nhật ký) trong kế hoạch tuần 7.

## 1. Tóm tắt

- **Đã làm và có minh chứng:** triển khai lại `master` (14/11), cập nhật gói và khởi động lại (13/11), chép bản sao lưu ra ổ ngoài G (17/11), điều tra 17 mã 403.
- **Chưa đạt hoặc chưa làm:** máy chủ chưa có [PR58] (nên Bảng điểm còn lỗi `GradeBook.js`) và bốn tệp ảnh đại diện chưa có trên GitHub; chưa chạy `smartctl -t long`; còn 5 gói chờ cập nhật; mốc T+15 (21/11) chưa đến; chưa rút ổ G, chưa đặt lịch chép tiếp, chưa có xác nhận mã hóa ổ.

## 2. Đối chiếu với kế hoạch tuần 7

Số việc theo bảng ở Phần 6 báo cáo tuần 6.

| Việc | Nội dung kế hoạch | Người ghi trong kế hoạch | Tình trạng | Minh chứng |
|---|---|---|---|---|
| 1 | Triển khai lại từ `master` (gồm [PR50], [PR51], [PR52], [PR54], [PR56]), so hash, xử lý script cũ | Nguyễn Thanh Tùng | **Đã thực hiện khoảng 14/11** (API khởi động 14/11 02:51 UTC; hash khớp `master` tại `b9e2663`); script cũ không còn. Người thực hiện cần Thanh Vui xác nhận. **Sau đó `master` có thêm [PR58]**, nên máy chủ chưa khớp hoàn toàn; bốn tệp ảnh đại diện đang chạy nhưng chưa có trên GitHub. Chưa có biên bản triển khai và `deploy-log.txt` thiếu các lần 12/11, 14/11 | [Biên bản 12](12-doi-chieu-may-chu-2026-11-17.md) mục 2 |
| 3 | `smartctl -t long`; chép bản sao lưu mới ra ổ ngoài | Trương Thanh Vui | Sao lưu: **đạt 17/11** (12 bản, 8.362 tệp trùng SHA256, `integrity_check` 12/12 ok, dựng API tạm 200). `smartctl -t long`: **chưa làm** (cần `sudo` trên máy chủ, chạy vài giờ) | [Biên bản 09](09-bien-ban-sao-luu-ra-o-ngoai-2026-11-11.md) mục 6 |
| 4 | Bảo vệ bản sao lưu ngoài: mã hóa hoặc ghi chấp nhận rủi ro | Nguyễn Thanh Tùng | **Chưa có xác nhận.** Thanh Vui đã quyết định không mã hóa (biên bản 09 mục 3); chờ Tùng xác nhận | Biên bản 09 mục 3, 6 |
| 5 | Cập nhật 18 gói, khởi động lại có kế hoạch, ghi thời điểm | Trương Thanh Vui | **Đã làm 13/11, chưa đạt 0 gói chờ:** `apt upgrade` 01:43 UTC, khởi động lại 01:49 UTC; còn 5 gói (`distro-info`, `python3-distro-info`, `python3-software-properties`, `snapd`, `software-properties-common`), không cần khởi động lại | Biên bản 12 mục 3 |
| 6 | Sức khỏe máy chủ T+15 (21/11), theo dõi RSS API | Trương Thanh Vui | **Chưa đến hạn.** Lệnh: `.\scripts\van-hanh\thu-bang-chung.ps1 -Moc T15` | [Hướng dẫn 03](03-huong-dan-kiem-tra-may-chu.md) |
| 14 (nhóm B) | Điều tra 17 mã 403 | Trương Thanh Vui | **Đạt:** 14 mã do một tab mất phiên (09/11), 3 mã do script kiểm thử; 403 ở `/uploads/` do quyền thư mục 750 (đã sửa) và dò quét `/uploads/.env`. Không phải sự cố | Biên bản 12 mục 5 |

Việc tồn từ tuần 6 liên quan máy chủ (1b: chép sao lưu ra ổ ngoài) được hoàn tất phần chép ở việc 3 ở trên; mục 6 biên bản 09 ghi cả hai lần chép (11/11 và 17/11).

## 3. Những điểm cần xử lý ngay

1. **Bảng điểm trên web thật đang lỗi.** `GradeBook.js` đang chạy thiếu tham số `user` (`ReferenceError`), sửa ở [PR58] chưa được triển khai. Cần triển khai lại.
2. **Bản đang chạy không dựng lại được từ GitHub:** `Reports.js`, `Admin.js`, `Directory.js`, `AccountManager.js` (ảnh đại diện) chưa có trên `master`. Cần PR trước, triển khai sau, vì script `trien-khai-tu-may-ca-nhan.ps1` chỉ chạy khi mọi thay đổi đã commit.
3. **`~/deploy-log.txt` thiếu các lần triển khai 12/11 và 14/11** (dòng cuối ngày 10/11). Bổ sung để biên bản khớp nhật ký trên máy chủ.

## 4. Thứ tự làm tiếp

| Thứ tự | Việc | Ai làm | Cần gì |
|---|---|---|---|
| 1 | Commit phần ảnh đại diện lên nhánh riêng, mở PR (ghi "chỉ gộp sau PR58"), xin Approve | Thanh Vui, người review | |
| 2 | Triển khai lại từ `master`, so hash, bổ sung `deploy-log.txt` và biên bản triển khai | Thanh Vui | Sau khi gộp PR ở bước 1 |
| 3 | `sudo smartctl -t long /dev/sda`; sau vài giờ `sudo smartctl -l selftest -l error /dev/sda`; chụp ảnh | Thanh Vui | `sudo` trên máy chủ |
| 4 | Rút ổ G, ghi ngày rút; đặt lịch chép tiếp và ghi vào biên bản 09 mục 6 | Thanh Vui | |
| 5 | Mốc T+15 ngày 21/11, điền cột T+15 của bảng 8.4 và kết luận mục 8.6 | Thanh Vui | |
| 6 | Xác nhận việc 1b/việc 4 và quyết định mã hóa ổ ngoài | Thanh Tùng | |

[PR50]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/50
[PR51]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/51
[PR52]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/52
[PR54]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/54
[PR56]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/56
[PR58]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/58
