# Bộ báo cáo: dữ liệu lớp học theo khung đào tạo (một chuyên ngành)
> **NGOÀI KẾ HOẠCH CỦA NHÓM.** Phần việc này do Trương Thanh Vui làm riêng trong 3 tuần, không thuộc kế hoạch tuần 5, tuần 6 và không tính vào khối lượng các việc theo kế hoạch của nhóm. Đọc để hiểu một phần việc riêng, không dùng để đánh giá tiến độ kế hoạch.

Cập nhật ngày 13/11/2026. Người thực hiện: Trương Thanh Vui (cùng Claude Code, model Claude Sonnet 5.5). **Đang chờ ý kiến giảng viên hướng dẫn** (xem 01, phần 8).

| Tệp | Nội dung | Đọc khi cần |
|---|---|---|
| [01-tong-quan-pham-vi.md](01-tong-quan-pham-vi.md) | Vì sao làm riêng ngoài kế hoạch nhóm, phạm vi, mốc 3 tuần, kết quả đến nay | Đưa vào báo cáo tuần, trả lời "việc này nằm ở đâu trong kế hoạch" |
| [02-thiet-ke-du-lieu.md](02-thiet-ke-du-lieu.md) | Cách tổ chức dữ liệu giống thực tế: khóa, năm học, học kỳ 1/2, lớp, giáo viên | Giải thích cấu trúc dữ liệu |
| [03-van-de-logic-phat-sinh.md](03-van-de-logic-phat-sinh.md) | Các vấn đề logic phát sinh khi đẩy dữ liệu thật tương ứng các lớp của một chuyên ngành | Phần quan trọng nhất của bộ báo cáo |
| [04-kiem-thu-va-do-tai.md](04-kiem-thu-va-do-tai.md) | Kết quả kiểm thử tự động, đo tải, đo lưu trữ | Minh chứng số liệu |
| [05-bien-ban-trien-khai-12-11.md](05-bien-ban-trien-khai-12-11.md) | Biên bản nạp dữ liệu lên máy chủ thật, sao lưu, cách quay lại | Minh chứng vận hành |
| [06-doan-dan-vao-bao-cao-tuan.md](06-doan-dan-vao-bao-cao-tuan.md) | Đoạn viết sẵn để dán vào báo cáo tuần | Hoàn thiện báo cáo tuần |

Cách đọc các chỗ `[…]`: là chỗ cần Thanh Vui xác nhận hoặc điền (ngày cụ thể, ý kiến nhóm). Mọi con số còn lại đều lấy từ lần đo hoặc từ mã trong kho, có ghi nguồn.

Quy ước dùng trong bộ báo cáo:
- "Khung" là khung đào tạo mẫu của ngành Công nghệ thông tin: 8 học kỳ, 37 học phần, 116 tín chỉ (`scripts/data/khung-dao-tao.json`).
- "Dữ liệu mẫu" là dữ liệu do script `scripts/seed_curriculum.py` sinh, đều gắn nhãn `seed: "curriculum-v1"`.
- Giờ là giờ Việt Nam, trừ khi ghi UTC.
