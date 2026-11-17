# Báo cáo cập nhật máy chủ theo phân công tuần 7

- Kế hoạch: **tuần 7** (16/11 – 21/11/2026), Phần 6 của [báo cáo tuần 6](../bao-cao-tuan/tuan-06.md). Các việc dưới đây được nêu trong bảng kế hoạch đó và thực hiện từ 13/11, nên ghi nhận là việc của tuần 7.
- Người phụ trách phần máy chủ: Trương Thanh Vui. Nguyễn Thanh Tùng xác nhận các việc ghi "Tùng xác nhận".
- Số liệu đo ngày 17/11/2026 (SSH chỉ đọc, chi tiết ở [biên bản 12](12-doi-chieu-may-chu-2026-11-17.md)) và chép sao lưu ra ổ G cùng ngày ([biên bản 09](09-bien-ban-sao-luu-ra-o-ngoai-2026-11-11.md) mục 6). Claude Code (AI) chạy các lệnh theo yêu cầu của Trương Thanh Vui.
- Phạm vi: các việc liên quan đến **máy chủ** (triển khai, cập nhật hệ điều hành, sao lưu, sức khỏe, nhật ký) trong kế hoạch tuần 7.

## 1. Tóm tắt

- **Đã làm và có minh chứng:** triển khai lại `master` (14/11), cập nhật gói và khởi động lại (13/11), chép bản sao lưu ra ổ ngoài G (17/11), điều tra 17 mã 403.
- **Cập nhật cuối ngày 17/11:** máy chủ đã được cài lại từ nhánh của [PR61] (có [PR58], nên lỗi `GradeBook.js` đã được sửa trên máy chủ; bốn tệp ảnh đại diện đã có trên GitHub nhưng chỉ ở nhánh này). Hash các tệp chính trùng `68e0d47`; **máy chủ không trùng `master`** cho đến khi [PR61] được review và gộp.
- **Chưa đạt hoặc chưa làm:** [PR61] chưa có Approve nên chưa gộp; `~/deploy-log.txt` chưa ghi các lần 12/11, 14/11, 17/11; `smartctl -t long` đã chạy nhưng dừng sớm do lỗi đọc tại LBA 705216 (chưa biết phạm vi lỗi, nhóm cần quyết định về ổ); 5 gói chờ cập nhật đang được Ubuntu phát hành theo đợt (không phải lỗi, không phải bản vá bảo mật); mốc T+15 (21/11) chưa đến; chưa rút ổ G, chưa đặt lịch chép tiếp, chưa có xác nhận mã hóa ổ.

## 2. Đối chiếu với kế hoạch tuần 7

Số việc theo bảng ở Phần 6 báo cáo tuần 6.

| Việc | Nội dung kế hoạch | Người ghi trong kế hoạch | Tình trạng | Minh chứng |
|---|---|---|---|---|
| 1 | Triển khai lại từ `master` (gồm [PR50], [PR51], [PR52], [PR54], [PR56]), so hash, xử lý script cũ | Nguyễn Thanh Tùng | **Đã thực hiện khoảng 14/11** (API khởi động 14/11 02:51 UTC; hash khớp `master` tại `b9e2663`); script cũ không còn. Người thực hiện cần Thanh Vui xác nhận. **Sau đó `master` có thêm [PR58]**, và ngày 17/11 máy chủ được cài lại từ nhánh của [PR61] (chưa gộp): hash các tệp chính trùng `68e0d47`, **không trùng `master`**, nên kết quả cần đạt "trùng hash với `master`" chưa đạt cho đến khi gộp [PR61] và triển khai lại. Có biên bản triển khai 14/11 và 17/11 trong phần ngoài kế hoạch (biên bản 08, nhánh [PR61]); `deploy-log.txt` vẫn thiếu các lần 12/11, 14/11, 17/11 | [Biên bản 12](12-doi-chieu-may-chu-2026-11-17.md) mục 2 và 2b |
| 3 | `smartctl -t long`; chép bản sao lưu mới ra ổ ngoài | Trương Thanh Vui | Sao lưu: **đạt 17/11** (12 bản, 8.362 tệp trùng SHA256, `integrity_check` 12/12 ok, dựng API tạm 200). `smartctl -t long`: **đã chạy 17/11 nhưng kết quả chưa đạt:** `Completed: read failure` tại LBA 705216 (cùng sector với lần kiểm tra ngắn 13/11), dừng sớm, còn 90% ổ chưa quét. Quét chọn lọc từ LBA 705217 cũng dừng ngay với lỗi đọc tại **705217**, nên vùng lỗi dài ít nhất 2 sector liên tiếp; phần ổ từ khoảng LBA 770753 trở đi chưa được kiểm tra. 5, 187, 188, 197, 198 không xấu thêm so với 13/11 (đọc lại sau lần quét chọn lọc, ổ chạy 4.965 giờ); riêng `Multi_Zone_Error_Rate` (200) lần đầu khác 0 (= 1, chưa chạm ngưỡng). Nhóm cần quyết định tiếp tục dùng ổ có điều kiện hay thay ổ | [Biên bản 09](09-bien-ban-sao-luu-ra-o-ngoai-2026-11-11.md) mục 6; [báo cáo 01](01-bao-cao-suc-khoe-may-chu.md) mục 8.4c; [ảnh](bang-chung/2026-11-17/) |
| 4 | Bảo vệ bản sao lưu ngoài: mã hóa hoặc ghi chấp nhận rủi ro | Nguyễn Thanh Tùng | **Chưa có xác nhận.** Thanh Vui đã quyết định không mã hóa (biên bản 09 mục 3); chờ Tùng xác nhận | Biên bản 09 mục 3, 6 |
| 5 | Cập nhật 18 gói, khởi động lại có kế hoạch, ghi thời điểm | Trương Thanh Vui | **Đã làm 13/11 và 17/11; còn 5 gói chờ do phát hành theo đợt:** `apt upgrade` 01:43 UTC, khởi động lại 01:49 UTC; còn 5 gói (`distro-info`, `python3-distro-info`, `python3-software-properties`, `snapd`, `software-properties-common`), không cần khởi động lại. **Kiểm tra lại 17/11:** 5 gói thuộc kênh `resolute-updates`, không có gói bảo mật chờ (`unattended-upgrades` chạy 17/11 06:01 UTC không có gì để cài); nhân đang chạy là nhân mới nhất. Thanh Vui chạy thêm `apt upgrade` ngày 17/11 06:31 UTC: nâng 1 gói (`sos`); 5 gói còn lại **đang được Ubuntu phát hành theo đợt** (`apt-cache policy`: phased 30% và 40%), nên không phải lỗi và sẽ tự được nâng sau. **Đọc lại 17/11 09:17 UTC:** vẫn đúng 5 gói đó (phased 30–40%); kết quả cần đạt "0 gói chờ" **chưa đạt**; muốn nâng ngay có thể chạy `sudo apt -o APT::Get::Always-Include-Phased-Updates=true upgrade`. Dịch vụ vẫn `active`, web trả 200, không cần khởi động lại | Biên bản 12 mục 3 |
| 6 | Sức khỏe máy chủ T+15 (21/11), theo dõi RSS API | Trương Thanh Vui | **Chưa đến hạn.** Lệnh: `.\scripts\van-hanh\thu-bang-chung.ps1 -Moc T15` | [Hướng dẫn 03](03-huong-dan-kiem-tra-may-chu.md) |
| 14 (nhóm B) | Điều tra 17 mã 403 | Trương Thanh Vui | **Đạt:** 14 mã do một tab mất phiên (09/11), 3 mã do script kiểm thử; 403 ở `/uploads/` do quyền thư mục 750 (đã sửa) và dò quét `/uploads/.env`. Không phải sự cố | Biên bản 12 mục 5 |

Việc tồn từ tuần 6 liên quan máy chủ (1b: chép sao lưu ra ổ ngoài) được hoàn tất phần chép ở việc 3 ở trên; mục 6 biên bản 09 ghi cả hai lần chép (11/11 và 17/11).

## 3. Những điểm cần xử lý ngay

1. **Bảng điểm: lỗi `GradeBook.js` đã được sửa trên máy chủ (17/11)** nhờ bản cài từ nhánh [PR61] có [PR58]. Chưa thử tay Bảng điểm trên web thật; cần thử bằng tài khoản giáo viên và ghi kết quả.
2. **Máy chủ chạy mã chưa gộp vào `master`:** [PR61] (mở, chưa có review) chứa ảnh đại diện, học phần mở theo khóa, thời khóa biểu theo tuần. Cần review và gộp; nếu triển khai lại từ `master` trước khi gộp thì mất các thay đổi này.
3. **`~/deploy-log.txt` thiếu các lần triển khai 12/11, 14/11 và 17/11** (dòng cuối ngày 10/11). Bổ sung để biên bản khớp nhật ký trên máy chủ.
4. **Bản sao lưu trên ổ G là trước lần nạp lại dữ liệu ngày 17/11** (982 sinh viên thay cho 2.051 tài khoản). Nên chép lại sau khi bản sao lưu tự động đêm 17/11 có mặt.
5. **Ổ cứng: tự kiểm tra dài báo `read failure` tại LBA 705216** (17/11), lặp lại lỗi của lần kiểm tra ngắn 13/11. Nhóm cần ghi quyết định: tiếp tục dùng có điều kiện (theo dõi chỉ số, chép sao lưu ngoài hằng tuần) hoặc thay ổ. Thư báo lỗi của `smartd` tới root đang gửi không được, nên cần tự đọc SMART định kỳ.

## 4. Thứ tự làm tiếp

| Thứ tự | Việc | Ai làm | Cần gì |
|---|---|---|---|
| 1 | ~~Commit phần ảnh đại diện, mở PR~~ **Đã mở [PR61]**; xin review và Approve, rồi gộp | Thanh Vui, người review | CI trên nhánh PR chưa điền vào biên bản 08 |
| 2 | Sau khi gộp [PR61]: so hash máy chủ với `master`, bổ sung `deploy-log.txt` (12/11, 14/11, 17/11); thử tay Bảng điểm | Thanh Vui | Sau khi gộp [PR61] |
| 3 | ~~`smartctl -t long`~~ **đã chạy 17/11** (dừng sớm, `read failure`). Còn lại: xác định LBA 705216 thuộc phân vùng nào (`sudo fdisk -l /dev/sda`); nhóm quyết định về ổ; nếu cần biết toàn bộ phạm vi lỗi thì đọc quét chỉ đọc `sudo badblocks -sv -b 4096 /dev/sda` vào giờ ít người dùng | Nhóm, Thanh Vui | `sudo` trên máy chủ |
| 4 | Rút ổ G, ghi ngày rút; đặt lịch chép tiếp và ghi vào biên bản 09 mục 6 | Thanh Vui | |
| 5 | Mốc T+15 ngày 21/11, điền cột T+15 của bảng 8.4 và kết luận mục 8.6 | Thanh Vui | |
| 6 | Xác nhận việc 1b/việc 4 và quyết định mã hóa ổ ngoài | Thanh Tùng | |

[PR50]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/50
[PR51]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/51
[PR52]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/52
[PR54]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/54
[PR56]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/56
[PR58]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/58
[PR61]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/61
