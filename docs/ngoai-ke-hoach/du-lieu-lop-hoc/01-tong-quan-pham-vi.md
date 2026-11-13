# 01. Tổng quan và phạm vi
> **NGOÀI KẾ HOẠCH CỦA NHÓM.** Phần việc này do Trương Thanh Vui làm riêng trong 3 tuần, không thuộc kế hoạch tuần 5, tuần 6 và không tính vào khối lượng các việc theo kế hoạch của nhóm. Đọc để hiểu một phần việc riêng, không dùng để đánh giá tiến độ kế hoạch.

## 1. Đây là việc gì

Đưa vào hệ thống StudyTask một lượng dữ liệu **tương ứng với các lớp học thật của một chuyên ngành**: môn học theo khung đào tạo, thời khóa biểu theo lớp, lịch thi, tài liệu, đề trắc nghiệm, tài khoản giáo viên và sinh viên. Mục đích:

1. **Kiểm thử logic với quy mô thật.** Dữ liệu cũ chỉ có vài tài khoản nên nhiều lỗi phân quyền theo lớp, theo môn, theo học kỳ không lộ ra.
2. **Đo khả năng chịu tải và lưu trữ** của máy chủ riêng thay Firebase (ngưỡng người dùng đồng thời, dung lượng CSDL, ổ đĩa).
3. Có một bộ dữ liệu đủ lớn để các thành viên thử các chức năng (trắc nghiệm, lịch, phân công).

## 2. Việc này không nằm trong kế hoạch của nhóm

Kế hoạch tuần 5 (10 việc) và kế hoạch tuần 6 (nhóm A, nhóm B) của nhóm đã có nhiều việc. Phần dữ liệu quy mô thật **không có trong hai bản kế hoạch đó**, nên **Trương Thanh Vui thực hiện riêng, trong 3 tuần, tách khỏi khối lượng chung của nhóm**.

Hệ quả khi đọc báo cáo tuần:
- Phần này **không được tính** vào 10 việc của tuần 5 hay các việc nhóm A, nhóm B của tuần 6; không dùng để kết luận nhóm đúng hay chậm tiến độ.
- Phần này **không thay thế** việc nào của kế hoạch. Nếu việc phát hiện trong lúc làm (mục 03) cần sửa trong mã chung thì được đưa thành PR riêng, có Approve như quy ước.
- Thời gian bỏ ra cộng thêm vào thời gian làm các việc theo kế hoạch, không thay cho nó.

## 3. Giới hạn nguồn lực và hệ quả: không mở rộng

Nhóm có **3 thành viên**, và phần này chỉ **một người** thực hiện, đồng thời vẫn phải tham gia các việc hiện tại của nhóm. Vì vậy phạm vi được giữ cố định:

- **Không mở rộng dữ liệu.** Không thêm ngành, thêm môn, thêm dữ liệu bài tập, deadline, điểm, học phí. Mở rộng như vậy vượt mức một người có thể xử lý song song với công việc nhóm.
- **Không mở rộng chức năng.** Phần này chỉ gồm: dữ liệu đã nạp, kiểm tra và sửa lỗi của chính dữ liệu và logic đi kèm, rồi kiểm thử độ nghẽn.
- Các việc bị loại khỏi phạm vi được ghi ở mục 6 để người đọc biết đó là lựa chọn có chủ đích, không phải sót.

## 4. Kế hoạch 3 tuần

| Tuần | Thời gian | Nội dung | Tình trạng (13/11) |
|---|---|---|---|
| Tuần 1 | 09/11 – 14/11/2026 | Script sinh dữ liệu từ khung; chia lớp, giáo viên, thời khóa biểu không trùng giờ; lọc dữ liệu theo lớp học phần; bộ đo tải; nạp lần đầu lên máy chủ thật (12/11); đổi cách lưu sang khóa/năm học/học kỳ 1-2 và nạp lại (12/11) | **Đã làm** |
| Tuần 2 | 16/11 – 21/11/2026 | **Chỉ kiểm tra và sửa lỗi.** Rà lại các chỗ chưa hợp lý của **xếp lớp, thời khóa biểu, ngành và bộ môn** (danh sách điểm nghi vấn ở 03, mục 8); sửa những gì đúng là lỗi; đưa mã đang chạy thật vào repo qua PR có review (V-18) | Chưa bắt đầu, `[Thanh Vui xác nhận ngày]` |
| Tuần 3 | 23/11 – 28/11/2026 | **Kiểm thử độ nghẽn và các việc liên quan:** đo lại tải sau khi sửa dữ liệu, lưu trữ, sức chứa; ghi nhận kết quả và các điểm nghẽn (V-12 đến V-16). Không mở rộng | Chưa bắt đầu, `[Thanh Vui xác nhận ngày]` |

Cách hiểu tuần 2 và tuần 3: tuần 2 xử lý **tính hợp lý của dữ liệu và logic xếp lớp**, vì nếu dữ liệu còn chưa hợp lý thì phép đo ở tuần 3 cũng không đáng tin. Tuần 3 đo trên dữ liệu đã chỉnh. Việc sửa kiến trúc để vượt điểm nghẽn (ví dụ tách khóa chung, phân trang danh sách người dùng) chỉ làm khi là thay đổi nhỏ; nếu lớn thì ghi vào danh sách hạn chế và để nhóm quyết định ngoài phạm vi này.

Các ngày của tuần 2 và tuần 3 là đề xuất theo hiện trạng, Thanh Vui chỉnh theo kế hoạch thật của mình.

## 5. Kết quả đến ngày 13/11/2026 (tuần 1)

**Trên máy chủ thật** (nạp ngày 12/11, sau khi sao lưu):

| Hạng mục | Con số |
|---|---|
| Khóa đang học | 4: 2023-2027 (năm 4, 480 SV), 2024-2028 (năm 3, 514), 2025-2029 (năm 2, 487), 2026-2030 (năm 1, 495) |
| Lớp | 80 (`CNTT23-01` … `CNTT26-20`), mỗi lớp 20–30 sinh viên |
| Tài khoản | 2.051 (1.977 sinh viên, 71 giáo viên, 3 phòng ban; trong đó có 5 tài khoản thật cũ giữ nguyên) |
| Môn học | 45 (37 theo khung, 116 tín chỉ, và 8 môn cũ) |
| Thời khóa biểu / lịch thi | 764 buổi mỗi tuần / 403 lịch thi |
| Tài liệu / đề trắc nghiệm | 363 mục (333 tệp PDF thật, 115,8 MB) / 114 đề |

**Kiểm thử và đo:**
- `tests/server/test_seed_curriculum.py` (50 kiểm tra) và `tests/server/test_class_scope.py` (20 kiểm tra) đạt trên máy chủ.
- Đo tải 5 bậc từ 10 đến 200 người dùng ảo (mục 04): đạt ngưỡng p95 ≤ 2 giây đến 100 người, **không đạt ở 200 người**.
- Nạp thử trước trên bản sao CSDL thật (79 giây), rồi mới nạp thật (80 giây).

**Điều chưa hợp lý đã biết** (là lý do có tuần 2): cách xếp lớp, thời khóa biểu, ngành và bộ môn của dữ liệu sinh ra chưa sát thực tế, cần rà lại (03, mục 8).

## 6. Ngoài phạm vi (cố ý không làm)

| Việc | Lý do |
|---|---|
| Thêm ngành, thêm môn, thêm khung đào tạo khác | Vượt mức một người xử lý song song với việc nhóm; dữ liệu một chuyên ngành đã đủ để kiểm thử logic và đo tải |
| Dữ liệu bài tập, deadline, điểm, học phí | Như trên |
| Dữ liệu học kỳ 2 | Chỉ khi cần kiểm thử, chạy lại với `--hoc-ky 2`; không làm thêm thành một đợt nạp riêng |
| Viết lại kiến trúc để bỏ điểm nghẽn | Chỉ sửa điểm nhỏ nếu có; thay đổi lớn để nhóm quyết định |
| Tách `sharedData/global` theo môn | Đã nằm trong kế hoạch tuần 6 của nhóm (mục 14), không làm trùng ở đây |

## 7. Giới hạn của dữ liệu

- **Một ngành, một khung** (Công nghệ thông tin, 37 học phần). Mọi sinh viên cùng ngành.
- Nội dung câu hỏi trắc nghiệm và tài liệu là **nội dung giả** (sinh tự động, PDF ngẫu nhiên không nén được).
- Mật khẩu mặc định của tài khoản mẫu là `<vai trò>123`, ai cũng đoán được. Chỉ phù hợp môi trường trình diễn.
- Mã đang chạy thật (lọc theo lớp học phần, script nạp dữ liệu, `scope.js`) **chưa nằm trong `master`** (03, V-18).

## 8. Xin ý kiến giảng viên hướng dẫn

Sau khi cập nhật bộ báo cáo và đưa mã, tài liệu lên repo (nhánh `feat/ngoai-ke-hoach-du-lieu-lop-hoc`), nhóm **xin ý kiến giảng viên hướng dẫn** về phần việc làm riêng này, vì nó nằm ngoài kế hoạch đã báo cáo và do một người thực hiện song song với công việc chung. Nội dung cần ý kiến:

| # | Câu hỏi | Vì sao hỏi |
|---|---|---|
| 1 | Việc làm riêng ngoài kế hoạch (dữ liệu quy mô thật, 3 tuần) có phù hợp với yêu cầu đề tài không, hay nhóm nên dừng để dồn sức cho các việc theo kế hoạch? | Phần này không có trong kế hoạch tuần 5, 6 và chiếm thời gian của một thành viên |
| 2 | Giữ phạm vi cố định (một chuyên ngành, không mở rộng ngành, môn, bài tập, điểm) có được chấp nhận không, hay thầy yêu cầu thêm phần nào? | Nhóm 3 người, một người làm song song nên không mở rộng được (mục 3) |
| 3 | Cách đo tải (đến 200 người dùng ảo, ngưỡng p95 ≤ 2 giây) và kết quả (đạt đến 100 người, không đạt ở 200 người) có đủ làm minh chứng không, hay cần mục tiêu tải khác? | Đo mỗi bậc một lần, một phút; chưa đo qua mạng thật |
| 4 | Trong 20 vấn đề logic đã ghi (03), thầy muốn ưu tiên nhóm nào ở tuần 2 và tuần 3? Hiện logic phân quyền theo lớp đã sửa, hiệu năng mới ghi nhận | Tuần 2 chỉ kiểm tra và sửa lỗi, tuần 3 kiểm thử độ nghẽn |
| 5 | Mã lọc theo lớp học phần đang chạy trên máy chủ thật trước khi qua review (nay đã đưa vào PR). Thầy có yêu cầu quy trình thêm khi triển khai không? | Rủi ro vận hành đã nêu ở V-18 |

**Cách ghi nhận phản hồi:** điền bảng dưới khi có ý kiến, và cập nhật mục 4 (kế hoạch 3 tuần) nếu thầy yêu cầu đổi hướng.

| Hạng mục | Ghi nhận |
|---|---|
| Ngày gửi xin ý kiến | `[ngày]` |
| Hình thức (thư, họp, comment trên PR…) | `[điền]` |
| Phản hồi của giảng viên | `[chờ phản hồi]` |
| Việc phải đổi theo phản hồi | `[điền sau khi có phản hồi]` |
