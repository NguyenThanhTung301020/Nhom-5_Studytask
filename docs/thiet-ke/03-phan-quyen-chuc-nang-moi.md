# Thiết kế 03 – Vai trò mới và các chức năng Đào tạo, Tài chính

## 1. Vai trò

| Mã | Tên | Ghi chú |
|---|---|---|
| `admin` | Quản trị viên | Làm được mọi việc |
| `teacher` | Giáo viên | Chỉ các môn trong `subjectIds` |
| `student` | Sinh viên | Chỉ các môn trong `subjectIds` |
| `training` | Phòng Đào tạo | **Mới.** Xem toàn bộ môn học |
| `finance` | Phòng Tài chính | **Mới.** Xem toàn bộ sinh viên |

Tài khoản Phòng Đào tạo và Phòng Tài chính do Admin tạo ở **Quản trị → Tài khoản**, chọn vai trò tương ứng. Rules (V2) không cho người dùng tự đặt vai trò.

## 2. Ma trận chức năng

| Chức năng (trang) | Sinh viên | Giáo viên | Đào tạo | Tài chính | Admin |
|---|---|---|---|---|---|
| Lịch theo tháng (`calendar`) | xem lịch của mình | xem | xem | – | xem |
| Lịch học & thi (`schedule`) | xem | sửa | **sửa** | – | sửa |
| Quy chế điểm (`grading`) | xem | **chọn cột BT** | **sửa tỉ lệ** | – | cả hai |
| Chương trình ĐT (`curriculum`) | – | – | **kiểm tra, thêm/bớt môn** | – | có |
| Học phí (`tuition`) | xem, nhận nhắc nợ | – | – | **đơn giá, thu, thông báo** | có |
| Xét tốt nghiệp (`graduation`) | **nộp phiếu** | – | **duyệt** | – | duyệt |
| Công bố khóa luận (`theses`) | xem | xem | **đăng, sửa, gỡ** | xem | có |
| Hồ sơ SV-GV (`directory`) | – | SV môn mình | tất cả | tất cả | tất cả |

## 3. Dữ liệu và Security Rules

| Collection | Đọc | Ghi |
|---|---|---|
| `gradingPolicies/{subjectId}` | mọi người đã đăng nhập | Đào tạo, Admin |
| `gradingColumns/{subjectId}` | mọi người đã đăng nhập | Giáo viên dạy môn đó, Admin |
| `financeConfig/current` | mọi người đã đăng nhập | Tài chính, Admin |
| `tuition/{uid}` (thanh toán, miễn giảm, thông báo) | chính sinh viên, Tài chính, Admin | Tài chính, Admin |
| `curriculum/{programId}` | mọi người đã đăng nhập | Đào tạo, Admin |
| `graduationApps/{uid}` | chính sinh viên, Đào tạo, Admin | Sinh viên: tạo / nộp lại khi phiếu "chờ duyệt" hoặc "cần bổ sung", luôn ở trạng thái `submitted`, không ghi được lời duyệt. Đào tạo, Admin: duyệt |
| `theses/{id}` | mọi người đã đăng nhập | Đào tạo, Admin |
| `sharedData/global` | mọi người đã đăng nhập | Admin, Giáo viên, **Đào tạo** (thêm/bớt môn, xếp lịch) |

Mọi quy tắc trên đều có ca kiểm thử trong `tests/firestore.rules.test.mjs` (46 ca, `npm run test:rules`).

## 4. Học phí

- Học phí = Σ (tín chỉ lý thuyết × đơn giá LT + tín chỉ thực hành × đơn giá TH) trên các môn trong `subjectIds` của sinh viên. Tín chỉ thực hành lấy từ trường `practiceCredits` của môn.
- Còn nợ = học phí − miễn giảm − đã nộp. Trạng thái: chưa nộp / nộp một phần / đã nộp đủ / quá hạn.
- Nhắc đến hạn: nếu còn nợ thì từ mốc nhắc xa nhất (mặc định 14 ngày trước hạn) tới khi nộp đủ, chuông thông báo và trang Học phí của sinh viên hiện nhắc nợ. Quá hạn thì nhắc màu đỏ.
- Phòng Tài chính gửi thông báo công nợ cho từng sinh viên hoặc cho tất cả sinh viên còn nợ.
- Hạn chế:
  - `subjectIds` là danh sách môn hiện tại, chưa tách theo học kỳ.
  - Học phí tính lại theo đơn giá đang lưu; đổi đơn giá giữa kỳ thì học phí của mọi sinh viên đổi theo.
  - Chưa có cổng thanh toán; Phòng Tài chính ghi nhận thủ công.

## 5. Chương trình đào tạo

- CTĐT gồm các module bắt buộc (phải mở đủ mọi môn) và tự chọn (đủ số tín chỉ tối thiểu). Hệ thống đối chiếu theo **mã môn**, không phân biệt hoa thường.
- Kết quả: module đạt/thiếu, môn bắt buộc chưa mở, số tín chỉ lệch giữa CTĐT và môn đang mở, môn đang mở nhưng nằm ngoài CTĐT.
- Thao tác: mở môn còn thiếu (một môn hoặc tất cả), sửa số tín chỉ theo CTĐT, đưa môn ngoài CTĐT vào một module, bớt môn. Khi bớt môn, hệ thống cảnh báo số lịch học / lịch thi / deadline còn liên quan.

## 6. Xét tốt nghiệp

Sinh viên tự kiểm tra các điều kiện: GPA ≥ 2,00; tín chỉ tích lũy ≥ tổng tín chỉ của CTĐT (CTĐT trùng ngành trong hồ sơ, nếu không có thì lấy CTĐT đầu tiên); không còn nợ học phí; đủ 4 chứng chỉ. Đây là **tự khai**. Phòng Đào tạo xác nhận khi duyệt, vì hệ thống chưa có bảng điểm tích lũy chính thức.
