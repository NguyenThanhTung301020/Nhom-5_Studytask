# Bảng 2. Tổng hợp nhận xét của GVHD, GVPB và hướng khắc phục (tuần 1)

Người thực hiện: Nguyễn Thanh Tùng. Dùng cho mục công việc số 6 của báo cáo tuần 1.

Nguồn nhận xét: phiếu nhận xét GVHD (78 điểm – Khá) và GVPB (73 điểm – Khá) ở đợt đánh giá trước.

| # | Nhận xét | Nguyên nhân (nhóm tự phân tích) | Hướng khắc phục | Tuần |
|---|---|---|---|---|
| | **Giáo viên hướng dẫn** | | | |
| 1 | "Nhóm sinh viên sử dụng AI code để xây dựng ứng dụng" | Không có nhật ký AI, không có lịch sử commit chứng minh quá trình làm việc của từng thành viên | Lập nhật ký AI mỗi tuần; quản lý mã bằng Git, commit nhỏ, đúng tên người làm; commit có mã do AI sinh ghi nhãn [AI] và có thành viên khác review | 1 → hết đợt |
| 2 | "Chưa hiểu rõ về dự án" | Mã đợt trước phần lớn do AI hỗ trợ sinh; thành viên chưa nắm luồng dữ liệu và lý do thiết kế | Mỗi thành viên phụ trách một nhóm module, phải đọc và giải thích được; viết tài liệu kiến trúc; thuyết trình chéo nội bộ hằng tuần | 1–2, liên tục |
| 3 | "Tính khả thi áp dụng trong thực tế còn hạn chế" | Chưa thử với lớp thật; có lỗ hổng bảo mật; chưa nhập được danh sách lớp hàng loạt; nhiều tiện ích ngoài nghiệp vụ | Thu gọn vào nghiệp vụ lõi; vá bảo mật; thêm nhập danh sách lớp; thử nghiệm với một lớp học phần thật và đo KPI | 2–11 |
| | **Giáo viên phản biện** | | | |
| 4 | Mật khẩu lưu dạng văn bản thuần, collection user ai cũng đọc được | Không có máy chủ nên đổi mật khẩu hộ bằng cách đăng nhập ngầm | Xóa trường password; quản lý tài khoản qua Cloud Functions + Admin SDK; tạm thời dùng email đặt lại mật khẩu | 2–3 |
| 5 | Không có tầng backend riêng | Chọn JAMstack thuần, mọi nghiệp vụ ở trình duyệt | Bổ sung Cloud Functions cho nghiệp vụ nhạy cảm: quản lý tài khoản, chấm trắc nghiệm, ghi điểm | 3–4 |
| 6 | Không dùng công cụ build (React UMD, không JSX); LCP 2,9 s, Lighthouse 72/100 | Ưu tiên đơn giản khi triển khai | Chuyển sang Vite + JSX + ESLint, có bước build tối ưu cho production | 5 |
| 7 | Không có kiểm thử tự động | Toàn bộ kiểm thử thủ công | Rules unit test trên Emulator; Vitest cho hàm nghiệp vụ; Playwright cho luồng chính; chạy trong CI | 2, 10 |
| 8 | Security Rules chưa kiểm tra cấu trúc, kiểu dữ liệu | Rules chỉ kiểm tra vai trò, quyền sở hữu | Thêm kiểm tra trường được phép sửa, kiểu dữ liệu, độ dài | 2, 6 |
| 9 | sharedData/global giới hạn 1 MB | Gom toàn bộ dữ liệu chung vào một tài liệu | Tách thành collection theo môn học, có script chuyển dữ liệu | 6 |
| 10 | Điểm trung bình không trọng số | Trung bình cộng đơn giản | Trọng số cấu hình theo từng môn | 7 |
| 11 | Chưa tải tệp trực tiếp, chưa có thông báo đẩy | Chỉ dùng liên kết ngoài; thông báo chỉ trong ứng dụng | Firebase Storage; PWA + Firebase Cloud Messaging | 8–9 |

Ghi chú: cột "Tuần" là tuần dự kiến làm, tính từ tuần 1 = 05/10/2026, có thể điều chỉnh theo ý kiến của GVHD.
