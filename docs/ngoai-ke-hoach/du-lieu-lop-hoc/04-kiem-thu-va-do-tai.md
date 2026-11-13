# 04. Kiểm thử và đo tải
> **NGOÀI KẾ HOẠCH CỦA NHÓM.** Phần việc này do Trương Thanh Vui làm riêng trong 3 tuần, không thuộc kế hoạch tuần 5, tuần 6 và không tính vào khối lượng các việc theo kế hoạch của nhóm. Đọc để hiểu một phần việc riêng, không dùng để đánh giá tiến độ kế hoạch.

## 1. Kiểm thử tự động

| Bộ kiểm thử | Số kiểm tra | Kết quả | Kiểm tra điều gì | Chạy ở đâu |
|---|---|---|---|---|
| `tests/server/test_seed_curriculum.py` | 50 | Đạt | Cấu trúc 4 khóa, 80 lớp, mỗi lớp 20–30 sinh viên; sinh viên học đúng các môn của học kỳ đang diễn ra theo khóa; giáo viên đúng bộ môn; lớp, giáo viên, phòng không trùng giờ; đề trắc nghiệm không lộ đáp án, nộp bài được chấm; PDF hợp lệ; mật khẩu không nằm dạng văn bản trong CSDL; `--purge`, `--replace`, `--force-merge`, `--upgrade-assignments`; từ chối nạp lẫn vào dữ liệu thật | Máy chủ StudyTask (API tạm, cổng 8796, dữ liệu tạm) |
| `tests/server/test_class_scope.py` | 20 | Đạt (chạy lại 13/11, 20/20) | Sinh viên chỉ thấy lịch học, lịch thi của lớp mình; giáo viên chỉ đọc nhật ký và kết quả trắc nghiệm của lớp học phần mình dạy; giáo viên không sửa, thêm, xóa lịch lớp khác; hồ sơ cũ giữ hành vi theo môn | Máy chủ StudyTask (cổng 8801) |
| `tests/logic.test.mjs` (3 bài thử mới cho `termLabel`, `studyYear`, `khungPosition`, danh mục lớp theo khóa) | 3 bài, 16 phép kiểm tra | Các phép kiểm tra tương đương **đạt khi chạy trong trình duyệt** | Hàm học kỳ theo năm học trong `utils/scope.js`; các hàm `semestersOf`, `sortBySemester` cũ vẫn đúng | Trình duyệt trên máy làm việc. Máy này không có Node nên chưa chạy được `npm run test:logic`; bộ này sẽ chạy trong CI khi mở PR |

Ghi chú về số đếm: trong lúc làm, kết quả của `test_seed_curriculum.py` có lúc được báo là "49 kiểm tra"; số đúng đếm theo tệp là 50.

**Thử trên giao diện thật (dữ liệu tạm, localhost):**
- Đăng nhập sinh viên `sv2301001` (khóa 2023-2027): Hồ sơ hiện Lớp `CNTT23-01`, Khóa `2023-2027`, "Học kỳ 1 – Năm học 2026-2027"; Môn học hiện nhãn "Năm 4 · HK1".
- Đăng nhập Admin: danh sách môn nhóm theo "Năm 1 – Học kỳ 1" … "Năm 4 – Học kỳ 2"; form sửa tài khoản sinh viên hiện ô Khóa và nạp đúng giá trị.

## 2. Đo tải

**Phương pháp** (`scripts/loadtest_studytask.py run`): mỗi "người dùng ảo" lặp: đăng nhập, `/auth/me`, tải `sharedData/global`, `userData`, `/doc/user`, `/quiz/mine`, rồi 3–8 thao tác (xem dữ liệu, tải tệp tài liệu, nộp trắc nghiệm một lần mỗi đề), đăng xuất. Chạy API riêng ở cổng 8788 với **đúng mã đang vận hành**, dữ liệu riêng (`~/loadtest/data`) để không ảnh hưởng trang thật. Mỗi bậc 60 giây. Ngưỡng đạt: p95 ≤ 2 giây.

**Máy chủ:** Ubuntu, 4 nhân, 7,3 GB RAM, ổ 295 GB (trống 274 GB), Python 3.14. Dữ liệu `medium` (2.040 tài khoản).

| Người dùng ảo | Yêu cầu/giây | p95 chung | Lỗi | Kết luận |
|---|---|---|---|---|
| 10 | 16 | 254 ms | 0% | Đạt |
| 25 | 31 | 553 ms | 0% | Đạt |
| 50 | 52 | 596 ms | 0% | Đạt |
| 100 | 53 | 1.971 ms | 0% | Đạt, sát ngưỡng |
| 200 | 51 | 5.233 ms | 0% | **Không đạt** |

Nhận xét:
- Trần thông lượng khoảng 50–55 yêu cầu/giây từ 50 người dùng ảo trở lên; thêm người chỉ làm tăng thời gian chờ.
- CPU dùng trung bình khoảng 17% (rảnh thấp nhất 71%), nên điểm nghẽn là xử lý nối đuôi (V-12), không phải thiếu CPU.
- Không có yêu cầu nào lỗi hay quá hạn ở cả 200 người dùng: hệ thống chậm đi chứ không hỏng.
- Nạp 2.040 tài khoản mất 80 giây với 2 tiến trình ở mức ưu tiên thấp (băm PBKDF2 là phần tốn nhất).

## 3. Lưu trữ

| Hạng mục | Giá trị |
|---|---|
| Cơ sở dữ liệu | 3,7 MB (WAL 3,9 MB); `quick_check` ok (đo 12/11) |
| Tệp tài liệu | 333 tệp, 115,8 MB |
| `sharedData/global` | 1,3 MB (`medium`), 2,7 MB (`large`, ước theo `--dry-run`); giới hạn ghi 5 MB |
| Tốc độ ghi đĩa có fsync | 55 MB/s (500 MB, 50 tệp) |
| Ổ đĩa | 295 GB, trống 274 GB |

Thang quy mô: `large` (khoảng 8.050 sinh viên, 250 giáo viên, 320 lớp) vẫn nằm trong giới hạn `sharedData` nhưng sẽ làm V-13 (danh sách người dùng) nặng khoảng 2,6 MB mỗi lần đăng nhập.

## 4. Những gì chưa đo

- Đường mạng LAN và Cloudflare; tải tệp tài liệu qua nginx (cần quyền `sudo` cấu hình nginx).
- Chạy lâu hơn 1 phút mỗi bậc; mỗi bậc chỉ đo một lần.
- Máy phát tải chia CPU với máy chủ nên số đo hơi bất lợi cho máy chủ.
- Độ chậm của giao diện khi dựng bảng hàng nghìn tài khoản (V-16).
- Chưa đo lại sau khi đổi cách lưu sang khóa/năm học (cùng số tài khoản và lớp nên kỳ vọng tương đương, chưa kiểm chứng).
- Dữ liệu chưa gồm bài tập, deadline, điểm, học phí, nên tải thật sẽ lớn hơn số đo. Đây là giới hạn chấp nhận, không mở rộng (xem mục 01, phần 3 và 6).
