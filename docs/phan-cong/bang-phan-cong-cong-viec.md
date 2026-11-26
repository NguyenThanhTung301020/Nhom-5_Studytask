# BẢNG PHÂN CÔNG CÔNG VIỆC THEO THÀNH VIÊN – NHÓM 5

- **Đề tài:** Xây dựng website quản lý deadline học tập cho sinh viên (StudyTask)
- **GVHD:** TS. Huỳnh Xuân Phụng
- **Thời điểm viết báo cáo:** 14:34 ngày 26/11/2026 (giờ Việt Nam)
- **Phạm vi ghi nhận:** từ tuần 1 **đến thời điểm viết báo cáo** (tuần 8, chưa kết thúc). Công việc phát sinh sau thời điểm này chưa được tính.

## 1. Thành viên và trách nhiệm chính

| STT | Họ và tên | MSSV | Vai trò | Mảng được phân công chính |
|---|---|---|---|---|
| 1 | Nguyễn Thanh Tùng | 24TX810027 | **Nhóm trưởng** | Bảo mật và phân quyền; hồ sơ, email; kiểm thử trên web thật; bản sao lưu ngoài mã hóa; tổng hợp báo cáo |
| 2 | Trần Đức Tùng | 24TX810026 | Thành viên | Phân tích thiết kế sơ đồ (vẽ tay); logic học vụ; Trắc nghiệm (thiết kế, kiểm thử); CI; tính năng theo kế hoạch |
| 3 | Trương Thanh Vui | 24TX810021 | Thành viên | Máy chủ và vận hành; chuyển hệ thống sang máy chủ riêng; lập trình giao diện và Trắc nghiệm; phần mở rộng ngoài kế hoạch |

## 2. Bảng phân công tổng hợp

Ký hiệu: **C** = phụ trách chính · **P** = phối hợp, làm một phần hoặc kiểm tra · – = không được ghi nhận.

| STT | Hạng mục công việc | Thanh Tùng | Đức Tùng | Thanh Vui | Tình trạng |
|---|---|---|---|---|---|
| **I** | **Khảo sát, phân tích, kế hoạch** | | | | |
| 1 | Rà soát mã nguồn đợt trước, phát hiện vấn đề V1–V7 | C | P | P | Hoàn thành |
| 2 | Tổng hợp nhận xét GVHD, GVPB và hướng khắc phục | C | – | – | Hoàn thành |
| 3 | Đối chiếu tiêu chí chấm điểm TC1–TC6 | – | – | C | Hoàn thành |
| 4 | Bảng Giữ / Bỏ / Sửa / Thêm tính năng và cập nhật | P | C (cập nhật) | P | Hoàn thành, còn cập nhật theo tiến độ |
| **II** | **Thiết kế** | | | | |
| 5 | Sơ đồ Use Case và DFD (**vẽ tay**) | – | C | P (duyệt) | Hoàn thành một phần |
| 6 | Thiết kế lưu trữ hồ sơ tài khoản | – | C | P | Hoàn thành bản thiết kế |
| 7 | Thiết kế quy chế điểm, phân quyền vai trò mới | – | P (duyệt) | C | Hoàn thành |
| 8 | Thiết kế Trắc nghiệm (tách đáp án, máy chủ chấm) | – | C | P | Hoàn thành |
| 9 | Thiết kế máy chủ riêng, xác thực email cá nhân | P (duyệt) | – | C | Hoàn thành |
| **III** | **Lập trình** | | | | |
| 10 | Hồ sơ cá nhân: sửa lỗi cập nhật, đăng xuất, đồng bộ; khóa sửa hồ sơ | C | – | P | Hoàn thành |
| 11 | Vá bảo mật mật khẩu và phân quyền tài khoản (V1, V2) | C (vá tạm) | – | C (bỏ hẳn, chuyển máy chủ) | Hoàn thành |
| 12 | Phân quyền nhật ký hoạt động (V4) | C | P (review) | P | Hoàn thành |
| 13 | Điểm theo quy chế, học phí, chương trình đào tạo | – | C | P | Hoàn thành |
| 14 | Sáu trang mới: lịch tháng, học phí, quy chế điểm, chương trình đào tạo, tốt nghiệp, khóa luận | P (rà quyền, sửa lỗi) | – | C | Hoàn thành |
| 15 | Chuyển từ Firebase sang API Python, SQLite, nginx, Cloudflare Tunnel | P (gỡ Firebase) | – | C | Hoàn thành |
| 16 | Trắc nghiệm: máy chủ chấm (V3), điền khuyết, nhập đề, kho đề | – | P (sửa lỗi, kiểm thử) | C | Hoàn thành một phần |
| 17 | Bảng điểm, Báo cáo lớp lấy điểm chính thức | C (hoàn thiện) | – | P (phần đầu) | Hoàn thành |
| 18 | Email cá nhân, quên mật khẩu: sửa lỗi | C | – | P | Hoàn thành một phần |
| 19 | Lọc dữ liệu theo môn, quyền tải bài nộp | – | P (review) | C | Hoàn thành |
| 20 | Bỏ dữ liệu mẫu (V6) | – | – | C | Hoàn thành |
| 21 | Bỏ Máy tính, Dịch thuật, Giải trí (V7) | – | C | – | Hoàn thành |
| 22 | Nhập danh sách lớp từ CSV/Excel | – | C | P (review theo kế hoạch) | Đã đưa lên, chưa đánh giá |
| 23 | Nộp tệp trực tiếp, lịch tháng: rà soát và kiểm thử | C | P (review theo kế hoạch) | P | Hoàn thành |
| 24 | Giao diện trên màn hình hẹp | C | – | – | Đã đưa lên, chưa đánh giá |
| **IV** | **Kiểm thử, triển khai, vận hành** | | | | |
| 25 | CI GitHub Actions, quy ước Pull Request | – | C (CI) | C (quy ước, mở rộng CI) | Hoàn thành |
| 26 | Kiểm thử tự động (logic, quyền, máy chủ) | P | P | C | Duy trì theo tính năng |
| 27 | Kiểm thử thủ công và trên web thật | C | P | P | Còn một số ca chưa đạt hoặc chưa thử |
| 28 | Triển khai máy chủ, đối chiếu mã với GitHub | P | – | C | Hoàn thành, thực hiện định kỳ |
| 29 | Sao lưu, khôi phục, bản sao ngoài mã hóa | P (mã hóa, Drive) | – | C | Hoàn thành |
| 30 | Theo dõi sức khỏe máy chủ, ổ đĩa, cổng mạng, cập nhật gói | – | – | C | Còn rủi ro ổ đĩa và mạng |
| **V** | **Tài liệu, báo cáo** | | | | |
| 31 | Báo cáo tuần, nhật ký AI | C (tổng hợp) | P | P | Tuần 1–7 xong; tuần 8 chưa |
| **VI** | **Ngoài kế hoạch** | | | | |
| 32 | Dữ liệu lớp học theo khung đào tạo, đo tải, thời khóa biểu, quản lý lớp | – | P (review) | C | Đã đưa lên |
| 33 | Thi trực tuyến, kho sách điện tử, ảnh đại diện, lọc và dọn dữ liệu cũ | – | P (review) | C | Đã đưa lên |

## 3. Phân công chi tiết theo từng thành viên

### 3.1. Nguyễn Thanh Tùng – Nhóm trưởng

| STT | Nhiệm vụ được phân công | Công việc đã thực hiện | Tuần | Kết quả |
|---|---|---|---|---|
| 1 | Phân tích hiện trạng | Đọc lại phần lõi; rà soát bảo mật, tài khoản, chấm điểm (7 vấn đề); tổng hợp 11 nhận xét của giảng viên | 1 | Hoàn thành |
| 2 | Quản lý mã nguồn và tài liệu | README, quy ước nhánh và commit | 2–3 | Hoàn thành (trễ 1 tuần) |
| 3 | Hồ sơ tài khoản | Sửa các lỗi cập nhật hồ sơ, đăng xuất, đồng bộ dữ liệu; viết tài liệu nguyên nhân | 2–4 | Hoàn thành |
| 4 | Bảo mật, phân quyền | Vá V2, vá tạm V1; vá V4 và hoàn thiện; kiểm thử quyền | 3–6 | Hoàn thành |
| 5 | Phương án máy chủ | Bản thử Cloudflare Worker; gỡ Worker và project Firebase cũ khi đổi hướng | 4–5 | Hoàn thành |
| 6 | Kiểm tra sáu trang mới | Thử 45 ca quyền, sửa lỗi bảo mật và nghiệp vụ R1–R7 | 5–6 | Hoàn thành |
| 7 | Email cá nhân | Sửa 2 lỗi luồng email; thử bằng thư thật; hoàn tác giao dịch gỡ email | 6–7 | Hoàn thành một phần (1 ca email đạt một phần) |
| 8 | Điểm trắc nghiệm | Hoàn thiện Bảng điểm, Báo cáo lớp đọc điểm chính thức | 7 | Hoàn thành |
| 9 | Kiểm thử web thật | Thử phân quyền nhật ký, email, các trang quản lý; sửa lỗi phát hiện; kiểm lại sau cập nhật | 6–8 | Hoàn thành |
| 10 | Triển khai | Viết script kiểm chứng máy chủ, đối chiếu mã (thao tác trên máy chủ do Thanh Vui) | 7 | Hoàn thành một phần |
| 11 | Sao lưu ngoài | Mã hóa 7-Zip AES-256; đưa lên Google Drive | 7–8 | Hoàn thành |
| 12 | Tính năng và giao diện | Rà soát nộp tệp, lịch tháng; sửa cuộn ngang ở màn hình hẹp | 8 | Đã đưa lên, chưa đánh giá |
| 13 | Báo cáo | Soạn, tổng hợp báo cáo tuần và nhật ký AI; review chéo | 1–7 | Hoàn thành |

### 3.2. Trần Đức Tùng – Thành viên

| STT | Nhiệm vụ được phân công | Công việc đã thực hiện | Tuần | Kết quả |
|---|---|---|---|---|
| 1 | Phân tích hiện trạng | Đọc lại các trang học tập; tìm hiểu công cụ cho kiến trúc mới | 1 | Hoàn thành |
| 2 | Sơ đồ hệ thống (**vẽ tay**) | Vẽ Use Case tổng; DFD ngữ cảnh, mức 0, mức 1, theo chức năng; vẽ lại 8 sơ đồ theo máy chủ riêng | 2–6 | Hoàn thành một phần, còn chi tiết cần chỉnh |
| 3 | Thiết kế hồ sơ lưu trữ | Phụ trách trang lưu trữ hồ sơ tài khoản (bản nháp do AI soạn, Thanh Vui commit) | 2 | Hoàn thành bản thiết kế |
| 4 | Logic học vụ | Tính điểm theo quy chế, học phí, chương trình đào tạo và kiểm thử | 3 | Hoàn thành |
| 5 | Kiểm thử | Chạy bộ kiểm thử, thử tay luồng hồ sơ | 4 | Hoàn thành |
| 6 | Hạ tầng dự án | Cập nhật bảng tính năng, cấu hình Cloudflare; CI GitHub Actions; hướng dẫn xử lý lỗi trên Windows | 4–5 | Hoàn thành |
| 7 | Trắc nghiệm | Thiết kế và chốt tài liệu; thử 25 ca trên web thật (21 đạt); sửa lỗi đếm lượt nộp và hạn nộp | 5–8 | Hoàn thành một phần, chưa thấy biên bản thử lại sau sửa |
| 8 | Tính năng theo kế hoạch | Bỏ 3 tiện ích thừa; ghi nhận mục đã làm sớm | 7 | Hoàn thành |
| 9 | Nhập danh sách lớp | Nhập từ CSV/Excel cho Admin và Phòng Đào tạo | 8 | Đã đưa lên, chưa đánh giá |
| 10 | Review và báo cáo | Review chéo, chạy lại kiểm thử; viết phần báo cáo của mình | 3–8 | Đang thực hiện |

### 3.3. Trương Thanh Vui – Thành viên

| STT | Nhiệm vụ được phân công | Công việc đã thực hiện | Tuần | Kết quả |
|---|---|---|---|---|
| 1 | Phân tích hiện trạng | Đọc lại các trang quản lý; đối chiếu tiêu chí TC1–TC6 | 1 | Hoàn thành |
| 2 | Thiết kế nghiệp vụ | Quy chế tính điểm; vai trò Phòng Đào tạo, Phòng Tài chính | 2 | Hoàn thành |
| 3 | Môi trường phát triển | Firebase Emulator trên máy local | 2–3 | Hoàn thành một phần |
| 4 | Sáu trang mới | Lập trình, khôi phục sau sự cố gộp mã | 3–4 | Hoàn thành |
| 5 | Kiểm thử bảo mật | Kiểm thử quyền chuyên sâu, kiểm thử đột biến | 4 | Hoàn thành |
| 6 | Máy chủ riêng | Chuyển hệ thống khỏi Firebase; bỏ lưu mật khẩu; bỏ dữ liệu mẫu; tài liệu thiết kế | 5 | Hoàn thành |
| 7 | Tài khoản | Xác thực email cá nhân (thiết kế), ảnh đại diện, khóa sửa hồ sơ, đồng bộ số điện thoại | 5–6 | Hoàn thành |
| 8 | Trắc nghiệm | Máy chủ chấm điểm, điền khuyết, nhập đề, kho đề (V3 nhận thay Đức Tùng) | 6 | Hoàn thành |
| 9 | Phân quyền dữ liệu | Lọc theo môn học; quyền tải bài nộp; phần đầu điểm chính thức | 6–7 | Hoàn thành |
| 10 | Triển khai | Triển khai, đối chiếu mã, biên bản; cập nhật máy chủ | 5–8 | Hoàn thành, thực hiện định kỳ |
| 11 | Vận hành | Sao lưu tự động, ổ ngoài, thử khôi phục; sức khỏe máy chủ; ổ đĩa; điều tra lỗi 403; cập nhật gói; biên bản rủi ro cổng mạng | 5–8 | Hoàn thành một phần (ổ đĩa lỗi đọc; mốc T+15 chưa đạt đủ điều kiện ổn định) |
| 12 | Quy ước làm việc | Quy ước Pull Request, kiểm tra tự động; soạn quy ước việc định kỳ | 6, 8 | Hoàn thành |
| 13 | Dữ liệu lớp học (ngoài kế hoạch) | Dữ liệu theo khung đào tạo, đo tải, học phần mở, thời khóa biểu, số liệu giả lập học kỳ | 6–8 | Đã đưa lên; đo tải đạt 100 người dùng ảo, chưa đạt 200 |
| 14 | Mở rộng (ngoài kế hoạch) | Thi trực tuyến; kho sách điện tử (rà soát bản quyền, bìa, sao lưu); ảnh đại diện tự vẽ; quản lý lớp; lọc và dọn dữ liệu cũ | 7–8 | Đã đưa lên |
| 15 | Báo cáo | Viết phần báo cáo của mình; review chéo | 1–8 | Đang thực hiện |

## 4. Ghi nhận việc vẽ sơ đồ

- **Sơ đồ Use Case và DFD được vẽ tay** (tự vẽ thủ công bằng công cụ vẽ draw.io, không dùng AI tạo sơ đồ). Người vẽ: **Trần Đức Tùng**.
- **AI chỉ hỗ trợ đưa tệp sơ đồ lên GitHub** (tạo commit, đẩy nhánh).
- AI có hỗ trợ Trương Thanh Vui soạn nội dung **review** sơ đồ (tuần 5); đây không phải việc vẽ.

## 5. Công việc chung của cả nhóm

| Việc | Cách phân chia |
|---|---|
| Thống nhất kế hoạch tuần và đổi người khi cần | Cả nhóm |
| Review chéo trước khi gộp mã | Thành viên khác người làm |
| Nhật ký AI và báo cáo tuần | Mỗi người viết phần của mình, một người tổng hợp |

## 6. Việc còn lại và người phụ trách

| Việc | Người phụ trách | Ghi chú |
|---|---|---|
| Chỉnh sơ đồ cho khớp hệ thống | Trần Đức Tùng | Kế hoạch tuần 7, 8 |
| Thử lại Trắc nghiệm trên web thật | Trần Đức Tùng | Kế hoạch tuần 8 |
| Báo cáo và nhật ký AI tuần 8 | Cả nhóm | |
| Chốt tuần chuyển sang Vite, JSX, ESLint | Cả nhóm | Chưa chốt |
| PWA và thông báo nhắc deadline | Chưa phân công | Dự kiến tuần 9 |
| Thử nghiệm lớp thật, đo KPI | Chưa phân công | Dự kiến tuần 11 |
| Kiểm tra project Firebase đã xóa hẳn | Nguyễn Thanh Tùng | Sau 11/12/2026 |

## 7. Ghi chú

- Nguồn: báo cáo tuần 1–7, kế hoạch tuần 8, tài liệu và lịch sử commit trên GitHub của nhóm (`master` tại `2263676`). Tuần 8 chưa có báo cáo đánh giá.
- Phần ứng dụng có sẵn từ đợt trước (trước ngày 14/10/2026) không phân công lại trong bảng này.
- Nhóm có sử dụng Claude Code trong nhiều việc mã và tài liệu; người ghi trong bảng là người phụ trách. Chi tiết ở nhật ký AI.
- Bảng được soạn với hỗ trợ của AI, nhóm đọc lại và xác nhận trước khi nộp.

**Xác nhận của thành viên**

| Nguyễn Thanh Tùng (Nhóm trưởng) | Trần Đức Tùng | Trương Thanh Vui |
|---|---|---|
| &nbsp;<br><br><br> | | |
