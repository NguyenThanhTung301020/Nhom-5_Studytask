# Quy ước việc định kỳ không cần đưa vào báo cáo tuần

- Lập ngày 25/11/2026 (tuần 8: 23/11 – 28/11/2026). Người soạn: Trương Thanh Vui (cùng Claude Code, model Claude Opus 5.5).
- Thay cho "Bảng quy ước việc định kỳ" ở cuối Phần 5 [báo cáo tuần 7](../bao-cao-tuan/tuan-07.md) (Q1–Q3). Bảng đó mới ghi chung chung; quy ước này nêu cụ thể **từng việc**, **vì sao không cần báo tuần**, **mốc nào phải báo**, và **ai kiểm tra, khi nào**.
- Áp dụng từ tuần 8 đến hết đề tài. Đánh giá lại quy ước ở mục 5.
- Phần việc ngoài kế hoạch và vận hành máy chủ do Trương Thanh Vui đảm nhận nên nhiều việc phát sinh khiến khối lượng công việc to ra . Quy ước này nhằm giảm tải lượng việc cho thành viên mà vẫn đảm bảo đúng quy trình cũng như các phân công của nhóm

## 1. Nguyên tắc chung

1. **Vẫn làm đều đặn, chỉ không báo cáo mỗi tuần.** Các việc dưới đây là việc vận hành lặp lại, kết quả thường giống nhau giữa các lần ("đạt, không có gì mới"). Ghi lại mỗi tuần làm báo cáo dài mà không thêm thông tin.
2. **Mỗi việc vẫn để lại dấu vết**, kể cả khi không vào báo cáo: tệp kết quả trên máy chủ (`~/health-logs/`, `/mnt/backup/studytask/backup.log`, `~/deploy-log.txt`) hoặc lịch sử CI trên GitHub. Người kiểm tra (mục 3) đọc các dấu vết này, không cần hỏi lại.
3. **Đưa vào báo cáo tuần khi có một trong các điều kiện sau** (gọi chung là "điều kiện báo"):
   - phát sinh lỗi, sự cố hoặc kết quả "không đạt";
   - có thay đổi cấu hình máy chủ, mạng, quyền truy cập hoặc nơi lưu bản sao lưu;
   - đến mốc ghi ở cột "Mốc phải báo" của từng việc;
   - một thành viên thấy cần (ghi lý do một dòng).
4. **Mỗi báo cáo tuần có đúng một dòng tổng hợp** trong Phần 4: "Việc định kỳ theo quy ước 02: đã làm, không phát sinh điều kiện báo", hoặc liệt kê việc có điều kiện báo. Nhờ vậy người đọc biết việc vẫn được làm mà không cần đọc chi tiết.
5. Việc định kỳ **không tính là việc trong kế hoạch tuần** và không cần PR riêng mỗi lần làm. Khi có điều kiện báo thì ghi biên bản trong `docs/van-hanh/` như các việc khác.

## 2. Danh sách việc định kỳ

### 2.1. Máy chủ: mã nguồn và dữ liệu

| # | Việc | Người làm | Tần suất | Vì sao không cần báo tuần | Mốc phải báo (ngoài điều kiện chung) | Dấu vết |
|---|---|---|---|---|---|---|
| D1 | **Đối chiếu từng PR đã gộp với máy chủ**: sau mỗi PR gộp vào `master`, xem PR có đổi mã chạy trên máy chủ (`server/`, giao diện, `deploy/`) hay chỉ đổi tài liệu, kiểm thử | Trương Thanh Vui | Sau mỗi PR gộp (gom lại xử lý ở D2) | Phần lớn PR chỉ đổi tài liệu hoặc kiểm thử, không cần cài lại. Việc đối chiếu chỉ là đọc danh sách tệp đổi | PR có đổi mã nhưng chưa cài được trước lần D2 kế tiếp | Danh sách PR trên GitHub |
| D2 | **Cập nhật máy chủ khớp `master`** (mã nguồn và dữ liệu nạp từ repo như kho sách, dữ liệu lớp học, ảnh đại diện), rồi chạy `~/kiem-chung-master.sh <commit>` | Trương Thanh Vui | **Thứ 2 và thứ 7** hằng tuần (thay cho "thứ 6 và thứ 7" ở báo cáo tuần 7); bỏ qua nếu `master` không đổi mã từ lần trước | Mỗi lần cài đều có script kiểm chứng tự so hash, kết quả thường là ĐẠT; ghi mỗi lần chỉ lặp lại cùng một câu | Script báo KHÔNG ĐẠT; phải quay lại bản cũ; lần cài có thay đổi dữ liệu thật (nạp lại, xóa dữ liệu) | `~/health-logs/kiem-chung-master-*.txt` và `.sha256`; một dòng trong `~/deploy-log.txt` mỗi lần cài |
| D3 | Ghi `~/deploy-log.txt` sau mỗi lần cài (ngày, commit, nhánh, kết quả) | Trương Thanh Vui | Mỗi lần D2 | Là sổ tay nội bộ trên máy chủ | Khi phát hiện nhật ký thiếu dòng so với các lần đã cài (như các lần 12/11 – 22/11) | `~/deploy-log.txt` |
| D4 | Dọn thư mục, tệp nén tạm của các lần cài trong `~` (`deploy-*`, `studytask-deploy-*`) | Trương Thanh Vui | 1 lần/tháng | Không ảnh hưởng hệ thống | Không (chỉ báo khi ổ đầy, xem S1) | Không cần |

### 2.2. Sao lưu

| # | Việc | Người làm | Tần suất | Vì sao không cần báo tuần | Mốc phải báo (ngoài điều kiện chung) | Dấu vết |
|---|---|---|---|---|---|---|
| B1 | Sao lưu tự động (CSDL, tệp tải lên, PDF kho sách) | Máy chủ tự chạy (`studytask-backup.timer`, 20:00 UTC hằng ngày) | Hằng ngày | Tự động, có nhật ký; không cần người làm | Một đêm không có dòng `OK` trong `backup.log`; ổ sao lưu còn dưới 10 GB | `/mnt/backup/studytask/backup.log`, `journalctl -u studytask-backup` |
| B2 | Thử khôi phục bản mới nhất (`~/setup/studytask-restore-test.sh`) | Trương Thanh Vui | 2 tuần/lần, cùng đợt S1 | Script chỉ đọc, kết quả "THÀNH CÔNG" giống nhau giữa các lần | Kết quả không THÀNH CÔNG; số bản ghi lệch bất thường | Ảnh chụp hoặc tệp kết quả lưu cùng đợt S1 |
| B3 | Chép bản sao lưu ra ngoài máy chủ, mã hóa `.7z`, tải lên Google Drive ([tài liệu 15](../van-hanh/15-ban-sao-luu-ngoai-google-drive.md)) | Trương Thanh Vui chép từ máy chủ; Nguyễn Thanh Tùng mã hóa và tải lên (chủ sở hữu tệp Drive) | 2 tuần/lần | Quy trình đã có biên bản (09, 15), mỗi lần chỉ khác tên tệp và SHA256 | **Mỗi lần có bản mới**: ghi tên tệp, SHA256, ngày vào tài liệu 15 (một dòng). Báo khi SHA256 bản tải lại không trùng, hoặc quyền chia sẻ không còn "Hạn chế" | Tài liệu 15 |

### 2.3. Sức khỏe máy chủ và ổ cứng

| # | Việc | Người làm | Tần suất | Vì sao không cần báo tuần | Mốc phải báo (ngoài điều kiện chung) | Dấu vết |
|---|---|---|---|---|---|---|
| S1 | Kiểm tra sức khỏe máy chủ (`deploy/health-check.sh "-15 days" --save`): tải, RAM, đĩa, dịch vụ, lỗi 5xx/403/429, `cloudflared`, SSH | Trương Thanh Vui | 2 tuần/lần (đợt tới khoảng 04/12/2026, mốc T+30 của [báo cáo 01](../van-hanh/01-bao-cao-suc-khoe-may-chu.md)) | Chỉ số thay đổi chậm; báo cáo 01 đã có bảng so sánh theo mốc | **Mỗi đợt**: điền một cột vào bảng 8.4 báo cáo 01. Báo tuần khi có chỉ số vượt ngưỡng ở 8.4 | `~/health-logs/<ngày>.txt` |
| S2 | Đọc chỉ số SMART của ổ cứng (`sudo smartctl -H -A /dev/sda`), so với lần trước | Trương Thanh Vui | Hằng tuần, cùng lần D2 thứ 7 | Ổ đã có vùng lỗi đã biết (LBA 705216–705217); chỉ cần biết có xấu thêm hay không | Thuộc tính 5, 187, 188, 197, 198 hoặc 200 tăng; tự đánh giá không còn `PASSED` → chép sao lưu ra ngoài ngay (B3) và báo nhóm | Ảnh chụp lưu cùng đợt S1 |
| S3 | Xem nhanh nhật ký API (mã 500, `Traceback`) và lần khởi động máy (`journalctl --list-boots`) | Trương Thanh Vui | Hằng tuần, cùng lần D2 thứ 7 | Lỗi đã biết (`BrokenPipeError` khi trình duyệt ngắt) lặp lại, không có thông tin mới | Loại lỗi 500 mới; máy khởi động lại ngoài kế hoạch (mất điện, treo) | Nhật ký trên máy chủ |

### 2.4. Cập nhật hệ điều hành và an ninh

| # | Việc | Người làm | Tần suất | Vì sao không cần báo tuần | Mốc phải báo (ngoài điều kiện chung) | Dấu vết |
|---|---|---|---|---|---|---|
| U1 | Bản vá bảo mật tự động (`unattended-upgrades`) | Máy chủ tự chạy (06:00 UTC hằng ngày) | Hằng ngày | Tự động | Lần chạy lỗi; dịch vụ không lên lại sau bản vá | `/var/log/unattended-upgrades/` |
| U2 | Cập nhật toàn bộ gói (`sudo apt full-upgrade`) và khởi động lại có kế hoạch nếu cần | Trương Thanh Vui | 2 tuần/lần, hoặc khi có nhân Linux mới | Cách làm đã có biên bản ([12](../van-hanh/12-doi-chieu-may-chu-2026-11-17.md) mục 3) | Có khởi động lại (ghi giờ tắt, giờ lên); sau cập nhật dịch vụ không `active` hoặc web không trả 200 | `/var/log/apt/history.log`, `journalctl --list-boots` |
| U3 | Kiểm tra tường lửa máy chủ và đăng nhập SSH (`sudo ufw status numbered`; đăng nhập SSH sai) | Trương Thanh Vui | Cùng đợt S1 | Cấu hình đã ghi ở [biên bản 08](../van-hanh/08-kiem-tra-cong-mang-tu-ngoai.md) mục 6, ít thay đổi | Quy tắc bị đổi hoặc mất; có đăng nhập SSH từ nguồn lạ | `~/health-logs/<ngày>.txt` |
| U4 | Thử cổng từ ngoài Internet (`scripts/van-hanh/kiem-tra-cong-tu-ngoai.ps1`, từ mạng 4G) | Trương Thanh Vui | Ở đợt kiểm tra bảo mật, và khi đổi nhà mạng, modem hoặc IP công cộng | Kết quả phụ thuộc modem của nhà mạng, nhóm không đổi được | Cổng 22, 8787 hoặc 20241 phản hồi từ ngoài; có cổng mới mở trỏ vào máy chủ | `docs/van-hanh/bang-chung/<ngày>/` |

### 2.5. Mã nguồn và kho sách

| # | Việc | Người làm | Tần suất | Vì sao không cần báo tuần | Mốc phải báo (ngoài điều kiện chung) | Dấu vết |
|---|---|---|---|---|---|---|
| M1 | CI trên mỗi PR (`test`, `server-tests`, `PR guard`) | GitHub Actions tự chạy | Mỗi PR | Kết quả nằm sẵn trên từng PR; báo cáo tuần đã dẫn link PR | CI đỏ mà vẫn gộp; CI không chạy (như PR 76) | Tab Checks của PR |
| M2 | Rà giấy phép khi thêm sách vào kho | Người thêm sách | Mỗi lần thêm | Quy trình rà đã có (`docs/ngoai-ke-hoach/thu-vien-sach/06`) | Có sách chưa rõ giấy phép; có yêu cầu gỡ sách | Danh sách sách trong `scripts/data/` |

## 3. Ai kiểm tra, khi nào

| Ai kiểm tra | Kiểm tra gì | Khi nào | Cách kiểm tra |
|---|---|---|---|
| **Nguyễn Thanh Tùng** | D2, D3, B1, B2, S1–S3, U2, U3 | 2 tuần/lần, **trước khi chốt báo cáo tuần chẵn** (tuần 8, 10, …) | Trương Thanh Vui chép về `docs/van-hanh/bang-chung/<ngày>/` các tệp: kết quả `kiem-chung-master` mới nhất, `health-check`, `backup.log` (10 dòng cuối), `deploy-log.txt` (10 dòng cuối). Nguyễn Thanh Tùng đọc, ký xác nhận một dòng trong báo cáo tuần |
| **Trương Thanh Vui** | B3 (bản trên Drive) | Mỗi lần có bản mới | Tải lại từ Drive, so SHA256; mở link khi chưa đăng nhập phải trả 401 |
| **Trần Đức Tùng** | M1, M2, và đọc dòng tổng hợp ở nguyên tắc 4 | Mỗi báo cáo tuần | Xem tab Checks các PR trong tuần; hỏi lại nếu dòng tổng hợp thiếu |
| **Cả nhóm** | Có việc nào bị bỏ quá 2 lần liên tiếp | Khi họp chốt báo cáo tuần | Xem dấu vết; nếu bỏ quá 2 lần thì ghi vào báo cáo tuần như một việc chưa đạt |

## 4. Khi phát sinh điều kiện báo

1. Người làm ghi biên bản ngắn trong `docs/van-hanh/` (hoặc thêm vào biên bản đang có): việc nào, phát hiện gì, đã xử lý gì, bằng chứng.
2. Báo cáo tuần ghi một dòng ở Phần 4, dẫn link biên bản.
3. Nếu chưa xử lý được trong tuần: đưa vào kế hoạch tuần sau như một việc trong kế hoạch (có người phụ trách, kết quả cần đạt).

Ví dụ đã xảy ra: máy chủ ngừng khoảng 6,5 giờ ngày 22/11/2026 do điện lực cắt điện bảo trì (S3, khởi động ngoài kế hoạch) được ghi ở báo cáo 01 mục 8.4e.

## 5. Đánh giá lại quy ước

- Đánh giá lại ở **đợt kiểm tra bảo mật trước nghiệm thu** (nhóm đề xuất tuần 10, cùng mốc ở biên bản 08 mục 6.6): bỏ việc không còn cần, thêm việc mới, chỉnh tần suất.
- Đánh giá lại ngay khi: thay ổ cứng hoặc máy chủ; đổi nơi lưu bản sao lưu ngoài; có sự cố mất dữ liệu.
- Người chịu trách nhiệm về việc quản lý đánh giá vận hành máy chủ : Trương Thanh Vui
