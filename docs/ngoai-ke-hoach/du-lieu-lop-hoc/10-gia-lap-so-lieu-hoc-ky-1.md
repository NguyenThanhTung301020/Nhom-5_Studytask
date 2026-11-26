# 10. Giả lập số liệu trọn học kỳ 1 năm học 2026-2027 (26/11/2026)
> **NGOÀI KẾ HOẠCH CỦA NHÓM – KHÔNG THUỘC TUẦN NÀO.** Phần việc do Trương Thanh Vui làm riêng ngày 26/11/2026. Không thuộc kế hoạch tuần, không tính vào khối lượng của nhóm và **không cần đưa vào báo cáo tuần**. Tài liệu chỉ mô tả cách sinh số liệu, không phải biên bản triển khai.

Người thực hiện: Trương Thanh Vui (cùng Claude Code, model Claude Opus 5.5).

## 1. Vấn đề

`scripts/seed_curriculum.py` đã tạo 982 sinh viên, 4 khóa, 20 học phần đang học. Tuy vậy, các trang dùng điểm và công nợ vẫn gần như trống:

- **Bảng điểm, Báo cáo lớp:** chưa có cột điểm, chưa có bài nộp.
- **Học phí:** chỉ có 1 khoản nộp thử.
- **Xét tốt nghiệp:** chưa có phiếu nào.
- **Đồ án chuyên ngành:** chưa có đề tài.
- **Deadline:** chỉ có 9 mục mẫu, gắn với môn demo cũ.

## 2. Cách làm

Script mới `scripts/seed_semester.py` sinh số liệu cho **mọi sinh viên đang có**. Nó chạy sau `seed_curriculum.py` và chỉ ghi vào bảng `docs`, không tạo hay sửa tài khoản. Theo yêu cầu, số liệu tính **trọn học kỳ đến 31/12/2026** (`--as-of`, mặc định 31/12). Học kỳ kết thúc lớp ngày 20/12 và thi cuối kỳ 21–29/12, nên mọi môn đều đã có điểm cuối kỳ.

| Phần | Nội dung |
|---|---|
| Bài tập (`sharedData.homeworks`) | Mỗi môn lý thuyết có 3 bài tập chương và 1 tiểu luận. Môn thực hành có 5 bài thực hành và 1 bài tập lớn. Hạn nộp rải từ tuần 2 đến tuần 13 và tránh tuần thi giữa kỳ. |
| Deadline (`sharedData.deadlines`) | Gồm kiểm tra giữa kỳ (tuần 8), hạn nộp bài lớn và thi cuối kỳ. Ngày thi lấy theo lịch thi đã có. Mục đã qua ngày chốt được đánh dấu hoàn thành. |
| Quy chế điểm (`gradingPolicies`) | Lý luận chính trị dùng L3, Toán dùng L1, môn lập trình có phòng máy dùng Q50 (điểm danh theo số buổi có mặt), môn CNTT khác dùng L2. Đồ án là môn hướng dẫn: giáo viên nhập thẳng điểm tổng kết. |
| Cột điểm (`sharedData.grades`) | Gồm chuyên cần, điểm từng bài tập, giữa kỳ, cuối kỳ. Sinh viên không nộp bài bị 0 điểm, khoảng 2% vắng thi cuối kỳ. Mỗi sinh viên có một "năng lực" riêng nên điểm các môn nhất quán với nhau. |
| Trắc nghiệm (`quizResults`) | Câu trả lời được giả lập rồi chấm bằng đúng hàm `grade_quiz` của máy chủ, theo khóa đáp án. Bài nộp không muộn hơn hạn. Đề gắn với phòng thi trực tuyến được bỏ qua. |
| Bài nộp, nhật ký (`userData.homeworkSubs`, `activities`) | Gồm bài đã nộp và lượt xem tài liệu, để Báo cáo lớp có số liệu. Mọi sự kiện đều hợp lệ theo `valid_activity_event` của máy chủ. |
| Học phí (`tuition`) | Tính theo tín chỉ × đơn giá trong `financeConfig`. Phân bố: khoảng 74% nộp đủ (một hoặc hai lần), 14% nộp một phần, 12% chưa nộp kèm thông báo nhắc nợ hoặc quá hạn, khoảng 6% được miễn giảm 25/50/100%. |
| GPA (`userData.profile.gpa`) | Chỉ ghi cho sinh viên chưa có GPA. |
| Xét tốt nghiệp (`graduationApps`) | Áp dụng cho khóa năm cuối 2023-2027; khoảng 86% nộp phiếu. Phiếu có GPA, tín chỉ tích lũy, chứng chỉ, đề tài và kết quả tự kiểm tra. Phòng Đào tạo đã duyệt khoảng 70% phiếu, chia thành: đủ điều kiện dự xét, cần bổ sung chứng chỉ hoặc học phí, và không đủ (GPA < 2,00). |
| Đồ án chuyên ngành | Mỗi sinh viên khóa 2023-2027 có một đề tài riêng, không trùng nhau. Giáo viên hướng dẫn là giáo viên được phân công lớp đó. Có 4 mốc nộp (đăng ký đề tài, tiến độ 1, tiến độ 2, báo cáo cuối) và ngày bảo vệ 22–25/12. Bài nộp "Đăng ký đề tài" ghi tên đề tài. Danh sách đề tài được xuất ra tệp CSV, gắn vào tài liệu của học phần IT405. |

## 3. An toàn dữ liệu

- **Không ghi đè dữ liệu thật.** Sinh viên đã có điểm, học phí, phiếu tốt nghiệp, kết quả trắc nghiệm hay GPA thì giữ nguyên phần đó. Ví dụ: khoản nộp thử của sv23201008, 9 deadline và 8 bài tập cũ vẫn còn.
- **Gỡ được đúng phần đã thêm.** Mọi thứ đã thêm được ghi lại trong `docs('meta', 'seed_semester_v1')`, nên `--purge` gỡ đúng phần đó. Kiểm thử xác nhận CSDL trở về giống hệt trước khi nạp.
- **Chạy lại cho ra đúng số liệu cũ.** Hạt giống cố định (`--seed`), còn số ngẫu nhiên tính riêng theo sinh viên và môn.
- **Không vượt giới hạn ghi.** Script dừng và không ghi gì nếu `sharedData/global` vượt 4,5 MB, để còn cách xa giới hạn ghi 5 MB của máy chủ. Với 982 sinh viên, `sharedData/global` tăng từ 1,8 MB lên 2,8 MB.

## 4. Kiểm thử

`tests/server/test_seed_semester.py` (có trong CI) tạo dữ liệu nền nhỏ, nạp, rồi kiểm tra các mục sau:

- đủ cột điểm cho mọi sinh viên ở mọi môn đang học;
- điểm nằm trong thang 0–10;
- kết quả trắc nghiệm chấm khớp với máy chủ;
- học phí có đủ các trạng thái;
- phiếu tốt nghiệp chỉ thuộc khóa năm cuối, đề tài không trùng;
- nhật ký hoạt động hợp lệ;
- không ghi đè dữ liệu đã có;
- `--replace` cho ra đúng số liệu cũ;
- `--as-of 2026-11-26` chưa có điểm cuối kỳ;
- `--purge` trả CSDL về như cũ.

## 5. Giới hạn

- **Điểm học kỳ 1 có trước ngày thật.** Số liệu đã có điểm cuối kỳ và các khoản nộp học phí tháng 12, dù hôm nay mới 26/11. Đây là lựa chọn có chủ ý, để bản demo trông như đã hết học kỳ. Muốn số liệu chỉ đến hôm nay thì chạy lại với `--replace --as-of <ngày>`.
- **Trạng thái deadline dùng chung cho mọi người.** Trạng thái lưu chung trong `sharedData`, không riêng từng sinh viên, nên deadline đã qua ngày chốt hiện "Hoàn thành" với mọi người.
- **Lượt làm trắc nghiệm đã ghi trước.** Đề trắc nghiệm còn mở (hạn 27/11) đã có kết quả cho sinh viên mẫu, nên tài khoản mẫu không nộp lại được đề đó (máy chủ chỉ cho nộp một lần).
- **Điểm học kỳ trước chưa giả lập.** GPA tích lũy chỉ là số ước lượng ghi vào hồ sơ.

## 6. Cách dùng

```powershell
python scripts/seed_semester.py --data-dir du-lieu-thu --dry-run
python scripts/seed_semester.py --data-dir du-lieu-thu
python scripts/seed_semester.py --data-dir du-lieu-thu --purge
```
