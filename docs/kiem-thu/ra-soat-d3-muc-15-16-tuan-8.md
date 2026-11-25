# Rà soát [D3] mục 15 (nộp tệp trực tiếp) và mục 16 (xem lịch theo tháng)

Việc 8 kế hoạch tuần 8. Người thực hiện: Nguyễn Thanh Tùng; review: Trần Đức Tùng. Ngày rà: 25/11/2026, trên `master` tại `f4ca3de` (sau [PR88]).

Kết quả cần đạt theo kế hoạch: mỗi mục ghi đã làm sớm (kèm minh chứng), hoặc có PR và ca kiểm thử, hoặc ghi lý do dời.

## Kết luận

| Mục [D3] | Kết luận | Minh chứng chính |
|---|---|---|
| 15. Nộp tệp trực tiếp | **Đã làm sớm** (tuần 5–6). Thay Firebase Storage bằng lưu tệp trên máy chủ riêng | `POST /api/upload`, `GET /api/files/submissions/<tên>`; `tests/server/test_submit.sh` 18/18, chạy trong CI |
| 16. Xem lịch theo tháng | **Đã làm sớm** (tuần 3, [PR9]). Tuần 8 bổ sung ca kiểm thử và sửa một lỗi nhỏ ở lưới tháng | `pages/MonthCalendar.js`; 4 ca mới trong `tests/logic.test.mjs` |

## 1. Mục 15 – Nộp tệp trực tiếp

D3 ghi "Firebase Storage". Từ khi chuyển sang máy chủ riêng ([D06](../thiet-ke/06-chuyen-firebase-sang-may-chu-rieng.md), [PR26]) tệp lưu ở `/var/lib/studytask/uploads` trên máy chủ, không dùng Firebase Storage hay liên kết Google Drive.

**Hiện trạng mã:**

| Phần | Vị trí | Hoạt động |
|---|---|---|
| Nhận tệp | `server/studytask_api.py`, tuyến `POST /api/upload` | Sinh viên nộp bài (`?hw=<id bài tập>`): chỉ nhận định dạng giáo viên chọn (`allowedExts`, mặc định pdf, doc, docx, txt, zip, jpg, jpeg, png), tối đa 15 MB, kiểm tra chữ ký đầu tệp (đổi đuôi `.exe` thành `.pdf` bị từ chối), chỉ nộp được môn mình học, bài tập phải bật nộp bài. Giáo viên, Admin, Đào tạo tải tài liệu lên (tối đa 25 MB) |
| Tải bài nộp về | `GET /api/files/submissions/<tên>`; nginx chuyển `/uploads/submissions/*` về tuyến này (`deploy/nginx-studytask.conf`) | Chỉ người nộp và nhân viên mở được; trả `Cache-Control: private, no-store` và `nosniff`. Bảng `submission_files` ghi người nộp ([PR39], tuần 6) |
| Giao diện | `utils/firebase.js` hàm `uploadFile`; `pages/Subjects.js` (khung chi tiết bài tập của sinh viên, tài liệu của giáo viên); `pages/Forms.js` (biểu mẫu) | Chọn tệp, kiểm tra đuôi và dung lượng ngay trên trình duyệt rồi gửi lên |

**Kiểm thử:**

| Bộ | Kết quả | Nơi chạy |
|---|---|---|
| `tests/server/test_submit.sh` (API tạm, dữ liệu tạm) | 18/18 đạt | Máy Nguyễn Thanh Tùng 25/11 trên `f4ca3de`; CI bước "Nộp bài theo định dạng giáo viên chọn" (`.github/workflows/ci.yml`) |
| `tests/server/smoke_live.py` trên web thật | Bài nộp khi chưa đăng nhập (qua `/uploads/submissions/` và qua API) trả 401, đường dẫn `../` bị chặn | [smoke-live-2026-11-18.txt](anh/tu-dong/smoke-live-2026-11-18.txt) |

18 ca của `test_submit.sh`: nộp PDF hợp lệ (200); nộp `.txt` khi bài chỉ nhận PDF/Word, nộp `.exe`, tệp đổi đuôi `.pdf`, bài không nhận nộp, bài không tồn tại (400); sinh viên môn khác nộp, giáo viên đi đường nộp bài, sinh viên tải tệp bằng đường thường (403); giáo viên tải tài liệu (200); mở bài nộp khi chưa đăng nhập (401), bằng sinh viên khác (403), bằng chủ bài và giáo viên (200); có `private, no-store` và `nosniff`; đường dẫn `../` và tên không có tệp (404).

**Chưa có:** biên bản [05](../van-hanh/05-bien-ban-trien-khai-2026-11-09.md) mục 4 còn trống ô "Thử trên web thật: nộp bài bằng một sinh viên, mở lại bằng cùng tài khoản và bằng tài khoản khác". Phần tự động trên web thật mới thử được trường hợp chưa đăng nhập. Ca thử tay ở mục 3 bên dưới bù cho phần này.

## 2. Mục 16 – Xem lịch theo tháng

**Hiện trạng:** trang `pages/MonthCalendar.js` có từ [PR9] (gộp 26/10), menu "Lịch theo tháng" (`calendar`) cho Admin, giáo viên, sinh viên và Đào tạo ([thiết kế 03](../thiet-ke/03-phan-quyen-chuc-nang-moi.md)). Trang hiện buổi học lặp hằng tuần trong khoảng ngày học kỳ và lịch thi trong tháng; lọc theo môn, bật/tắt lịch học, lịch thi; chọn ngày để xem chi tiết (giờ, phòng, giáo viên, hình thức, phòng thi trực tuyến). Dữ liệu đã lọc theo lớp học phần trước khi vào trang (`scopeByClass` trong `app.js`), nên sinh viên chỉ thấy lịch lớp mình. Chữ theo vai trò ("Lịch học" / "Lịch giảng dạy") thêm ở [PR63].

**Vấn đề tìm thấy khi rà:**

| # | Vấn đề | Xử lý trong PR này |
|---|---|---|
| 1 | Chưa có ca kiểm thử nào cho cách tính lịch tháng (`monthEvents` nằm trong tệp trang, cần `window.React` nên không chạy được bằng `node --test`) | Chuyển `monthEvents` sang `utils/periods.js`, thêm 4 ca kiểm thử |
| 2 | Trang tự viết lại `tkbDay` và điều kiện "buổi học có diễn ra trong ngày" thay vì dùng `classOnDate` của thời khóa biểu theo tuần; hai bản sửa lệch nhau thì lịch tuần và lịch tháng ra khác nhau | `monthEvents` dùng chung `classOnDate`, `toIso`; ca kiểm thử so hai cách xem ở mọi ngày trong tháng |
| 3 | Tháng bắt đầu đúng Thứ Hai và có 28 ngày (vd tháng 2/2027) hiện thừa một hàng toàn ngày tháng sau | Thêm `monthGrid`: chỉ lấy đủ số tuần chứa tháng (4–6 hàng) |

**Ca kiểm thử mới** (`tests/logic.test.mjs`, nhóm "[D3] mục 16 – Lịch theo tháng"):

| Ca | Kiểm tra |
|---|---|
| Lưới tháng | Tháng 11/2026 (bắt đầu Chủ nhật) có 6 hàng, ô đầu 26/10, ô cuối 06/12; tháng 12/2026 qua năm, ô cuối 03/01/2027; tháng 2/2027 đúng 4 hàng; hàng nào cũng mở đầu bằng Thứ Hai |
| Buổi học và lịch thi | Buổi Thứ Ba hết học kỳ 20/11 chỉ hiện 03, 10, 17/11; buổi Chủ nhật hiện đủ 5 ngày; lịch thi 07:30 đứng trước buổi học 13:30 cùng ngày; lịch thi tháng sau không hiện; khóa không trùng |
| Khớp lịch tuần | Với buổi học ở cả 7 thứ, mọi ngày trong tháng ra đúng các buổi như `classOnDate` của trang Lịch học theo tuần |
| Dữ liệu thiếu | Không có lịch, buổi học thiếu giờ: không lỗi |

Ca "4 hàng" không đạt trên mã cũ (mã cũ ra 35 ô), đạt sau khi sửa.

**Kết quả chạy (máy Nguyễn Thanh Tùng, 25/11):**

| Lệnh | Kết quả |
|---|---|
| `npm run test:logic` | 169/169 đạt (thêm 4 ca) |
| `node --test tests/logic.test.mjs` với `TZ=UTC` và `TZ=Asia/Ho_Chi_Minh` | 146/146 đạt ở cả hai múi giờ |
| Mở trang lịch tháng trên trình duyệt với dữ liệu mẫu (trang thử tạm, không đưa vào repo) | Tháng 11/2026: 12 buổi học, 1 lịch thi; 17/11 có lịch thi trước buổi học; 24/11 trống vì học phần đã hết. Tháng 2/2027: 28 ô, không có ô ngoài tháng. Khổ hẹp (~490 px) vẫn đủ lưới 7 cột. Không có lỗi trong console |

Chưa thử trên web thật vì cần máy chủ cập nhật mã của PR này (việc định kỳ Q2).

## 3. Ca thử tay trên web thật (điền sau khi máy chủ cập nhật)

| # | Ca | Mong đợi | Kết quả |
|---|---|---|---|
| T1 | Sinh viên mở một bài tập có bật nộp bài, nộp tệp PDF nhỏ | Hiện tên tệp, bấm vào mở được | |
| T2 | Cùng sinh viên đăng xuất rồi mở lại liên kết bài nộp ở cửa sổ ẩn danh | Bị chặn (401) | |
| T3 | Sinh viên khác mở liên kết bài nộp ở T1 | Bị chặn (403) | |
| T4 | Giáo viên dạy môn đó mở bài nộp ở T1 | Mở được | |
| T5 | Sinh viên nộp tệp sai định dạng (vd `.exe` hoặc `.txt` khi bài chỉ nhận PDF) | Báo lỗi định dạng, không lưu | |
| T6 | Sinh viên mở "Lịch theo tháng", chuyển tới tháng có lịch thi | Lịch thi và buổi học trùng với trang Lịch học theo tuần cùng tuần | |
| T7 | Mở "Lịch theo tháng" ở tháng 2/2027 | 4 hàng, không có hàng toàn ngày tháng 3 | |

T1–T4 cũng là ô còn trống ở biên bản 05 mục 4.

[PR9]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/9
[PR26]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/26
[PR39]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/39
[PR63]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/63
[PR88]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/88
