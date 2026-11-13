# 06. Đoạn viết sẵn để dán vào báo cáo tuần
> **NGOÀI KẾ HOẠCH CỦA NHÓM.** Phần việc này do Trương Thanh Vui làm riêng trong 3 tuần, không thuộc kế hoạch tuần 5, tuần 6 và không tính vào khối lượng các việc theo kế hoạch của nhóm. Đọc để hiểu một phần việc riêng, không dùng để đánh giá tiến độ kế hoạch.

Các đoạn dưới đây đã viết theo văn phong của báo cáo tuần. Thanh Vui đọc lại và sửa trước khi dán. Chỗ `[…]` là chỗ cần xác nhận.

## A. Dán vào báo cáo tuần: mục "Việc ngoài kế hoạch, làm riêng"

> **Dữ liệu lớp học theo khung đào tạo (Trương Thanh Vui, làm riêng ngoài kế hoạch nhóm).**
> Ngoài các việc trong kế hoạch tuần, Trương Thanh Vui làm riêng một bộ dữ liệu tương ứng với các lớp học thật của một chuyên ngành (Công nghệ thông tin): 4 khóa đang học, 80 lớp, khoảng 2.000 sinh viên, 71 giáo viên, 37 học phần theo khung 116 tín chỉ, 764 buổi học mỗi tuần, 403 lịch thi, 333 tệp tài liệu và 114 đề trắc nghiệm. Mục đích là kiểm thử logic phân quyền với quy mô thật và đo khả năng chịu tải, lưu trữ của máy chủ riêng.
> Phần này **không có trong kế hoạch nhóm** (kế hoạch tuần 5 và tuần 6 đã có nhiều việc) nên được làm riêng trong 3 tuần, và **không tính vào khối lượng của các việc theo kế hoạch**. Tuần 1 (09/11 – 14/11) đã xong: sinh dữ liệu, nạp lên máy chủ, đo tải lần đầu. Tuần 2 (`[16/11 – 21/11]`) chỉ kiểm tra và sửa lỗi, vì cách xếp lớp, thời khóa biểu, ngành và bộ môn của dữ liệu sinh ra còn chưa hợp lý. Tuần 3 (`[23/11 – 28/11]`) kiểm thử độ nghẽn và các việc liên quan. **Không mở rộng** (không thêm ngành, môn, bài tập, deadline, điểm) vì vượt mức xử lý của nhóm 3 thành viên khi chỉ một người vừa tham gia công việc hiện tại của nhóm vừa sửa phần này. Chi tiết: bộ báo cáo `docs/ngoai-ke-hoach/du-lieu-lop-hoc/00-muc-luc.md`.
> Kết quả đến 13/11/2026: dữ liệu đã nạp lên máy chủ thật ngày 12/11 sau khi sao lưu; sinh viên được lưu theo khóa, năm học và học kỳ 1/2 như cách các trường lưu thật; đã đo tải đến 200 người dùng ảo (đạt đến 100 người, không đạt ở 200 người).
> Khi nạp dữ liệu quy mô thật, nhóm gặp **20 vấn đề**, trong đó nhiều vấn đề là **logic xử lý theo lớp, môn, học kỳ** mà dữ liệu mẫu ít tài khoản không làm lộ ra. Đã sửa 13, còn 7 mới ghi nhận. Cụ thể: cùng một môn mở ở nhiều lớp và do nhiều giáo viên nên chỉ lọc theo môn làm giáo viên đọc được dữ liệu và sửa được lịch của lớp khác; mô hình "kỳ số mấy" không giống cách lưu sinh viên thật; xếp lịch phải không trùng giờ lớp, giáo viên, phòng; và quy mô làm lộ các điểm nghẽn về hiệu năng.
> **Cần lưu ý khi đọc:** mã lọc theo lớp học phần và script nạp dữ liệu đang chạy trên máy chủ nhưng **chưa nằm trong `master`**; đây là việc cần xử lý đầu tiên ở tuần tiếp theo.

## B. Dán vào bảng "Việc ngoài kế hoạch" (nếu báo cáo có bảng)

| Việc | Người | Nguồn gốc | Tình trạng |
|---|---|---|---|
| Dữ liệu lớp học theo khung đào tạo (một chuyên ngành), đo tải, lọc theo lớp học phần | Trương Thanh Vui | Không có trong kế hoạch nhóm; làm riêng trong khoảng 3 tuần | Tuần 1 của đợt đã xong (dữ liệu đã nạp 12/11); còn 7 vấn đề ghi nhận, chưa sửa |

## C. Dán vào phần "Việc chưa hoàn thành" (tách nhóm "không thuộc kế hoạch")

- Đưa mã lọc theo lớp học phần, `scripts/seed_curriculum.py`, bộ đo tải, `scope.js` và tài liệu 10 vào repo bằng PR có Approve; triển khai lại từ `master` (nguy cơ: triển khai từ `master` hiện tại sẽ làm mất phần lọc theo lớp).
- Ghi nhận và đo lại các điểm nghẽn hiệu năng (chỉ sửa điểm nhỏ nếu có, việc lớn để nhóm quyết định): xử lý nối đuôi và băm mật khẩu trong khóa chung; `GET /api/doc/user` trả hết hồ sơ; `sharedData/global` một tài liệu duy nhất; keep-alive sau `logout`.
- Triển khai giao diện có nhãn "Năm N – Học kỳ 1/2" và ô Khóa lên web thật.
- Đổi mật khẩu của tài khoản `admin` thật; mật khẩu mặc định của tài khoản mẫu đoán được.
- **Tuần 2 (chỉ kiểm tra và sửa lỗi):** rà lại xếp lớp, thời khóa biểu, ngành, bộ môn của dữ liệu theo danh sách điểm nghi vấn ở bộ báo cáo (mục 03, phần 8); sửa trong `scripts/seed_curriculum.py` và nạp lại có sao lưu.
- **Tuần 3 (kiểm thử độ nghẽn và liên quan):** đo lại tải sau khi chỉnh dữ liệu, lưu trữ, sức chứa; ghi nhận các điểm nghẽn. Chỉ sửa điểm nhỏ nếu có.
- **Không làm (cố ý):** thêm ngành, thêm môn, thêm bài tập, deadline, điểm. Vượt mức nhóm 3 thành viên có thể xử lý khi chỉ một người vừa tham gia công việc chung vừa sửa phần này.

## D. Trả lời nhanh nếu giảng viên hỏi

| Câu hỏi | Trả lời |
|---|---|
| Phần dữ liệu này có thuộc kế hoạch tuần 5 hoặc 6 không? | Không. Đây là việc nhóm làm riêng ngoài kế hoạch, trong khoảng 3 tuần, không tính vào khối lượng các việc theo kế hoạch |
| Vì sao làm thêm khi kế hoạch đã nhiều? | Dữ liệu ít tài khoản không làm lộ lỗi logic theo lớp, môn, học kỳ và không đo được tải; cần dữ liệu quy mô thật để kiểm chứng hệ thống thay Firebase |
| Có mở rộng thêm (ngành, môn, điểm…) không? | Không. Nhóm 3 người, phần này chỉ một người làm song song với công việc chung nên giữ phạm vi cố định: tuần 2 kiểm tra và sửa lỗi, tuần 3 kiểm thử độ nghẽn |
| Có ảnh hưởng dữ liệu thật không? | Có nạp lên máy chủ thật nhưng đã sao lưu trước, thử trước trên bản sao CSDL, chỉ xóa/ghi bản ghi có nhãn `seed`, 5 tài khoản thật giữ nguyên, và có cách quay lại |
| Kết quả có đáng tin không? | Các kiểm thử tự động đạt (50 và 20 kiểm tra); dữ liệu mẫu là giả, chỉ một chuyên ngành, chưa có bài tập, deadline, điểm; đo tải mỗi bậc một lần, một phút |


## F. Dán vào báo cáo tuần: xin ý kiến giảng viên

> **Xin ý kiến giảng viên hướng dẫn.** Phần dữ liệu lớp học quy mô thật (ngoài kế hoạch nhóm, làm riêng trong 3 tuần) đã cập nhật lên repo ở nhánh `feat/ngoai-ke-hoach-du-lieu-lop-hoc`. Nhóm xin ý kiến thầy về: (1) việc làm riêng này có phù hợp hay nên dồn sức cho các việc theo kế hoạch; (2) giữ phạm vi cố định một chuyên ngành, không mở rộng; (3) cách đo tải và ngưỡng p95 ≤ 2 giây; (4) mức ưu tiên giữa sửa lỗi logic và xử lý điểm nghẽn ở tuần 2 và tuần 3; (5) quy trình triển khai khi mã chưa qua review. Chi tiết câu hỏi ở `docs/ngoai-ke-hoach/du-lieu-lop-hoc/01-tong-quan-pham-vi.md`, mục 8. Trạng thái: `[đã gửi ngày …, chờ phản hồi]`.
