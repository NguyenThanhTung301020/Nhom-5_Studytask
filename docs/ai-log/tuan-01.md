# Nhật ký sử dụng AI – Tuần 1 (05/10 – 10/10/2026)

- **Công cụ:** Claude Code (Anthropic), tiện ích trong VS Code
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`)
- **Người sử dụng:** Trương Thanh Vui, Trần Đức Tùng (07/10 – rà soát mã); Nguyễn Thanh Tùng (07/10 – soạn báo cáo; 12/10; 14/10)
- **Công cụ AI khác:** không dùng

## Mã nguồn do AI sinh

**Không có.** Tuần 1 không sửa mã nguồn ứng dụng. Commit [`3ae6c68`](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/3ae6c68431e8474e8623e7164f5d20771c10a338) chỉ đưa mã hiện có của đợt trước lên GitHub.

AI có tạo các tệp **tài liệu** sau (ngày 14/10/2026). Nhóm đã đọc lại các tệp này trước khi commit:
- `docs/bao-cao-tuan/tuan-01.md` – bản báo cáo tuần 1 dạng Markdown
- `docs/ai-log/tuan-01.md` – tệp này
- `.gitignore` – loại thư mục cấu hình cá nhân `.claude/` khỏi repo

## Chi tiết từng lần sử dụng

| Ngày | Prompt chính (nguyên văn, rút gọn phần dán kèm) | AI tạo ra | Sinh viên kiểm tra / tự làm |
|---|---|---|---|
| 07/10 (Trương Thanh Vui, Trần Đức Tùng) | "Từ những nội dung ở trên hãy giúp tôi làm 1 file bài báo cáo bằng word để báo cáo tuần 1 như yêu cầu mà thầy ở hình mà tôi gửi" (kèm báo cáo TLCN, nhận xét GVHD/GVPB, email của thầy) | Đọc mã nguồn, liệt kê 7 vấn đề V1–V7 kèm vị trí dòng mã; bảng nhận xét → hướng khắc phục; bản nháp file Word | Mở từng file, dòng mã được chỉ ra để kiểm chứng (link ở mục 3 của báo cáo tuần); chọn phương án: tuần 1 chỉ rà soát, phân công 3 thành viên |
| 07/10 (Nguyễn Thanh Tùng) | "hãy thực hiện và hãy lưu ý những ý sau: 1. xây dựng lại hệ thống, tính năng dự theo nhận xét của giảng viên (thêm, bớt. ghi rõ lý do) 2. khi tạo tính năng mới không được chạy chung với local hot" | Bảng Giữ / Bỏ / Sửa / Thêm (21 mục); nguyên tắc tách môi trường dev / staging / production | Nhóm tự đặt ra 2 yêu cầu trên; đọc lại và duyệt bảng |
| 09/10 | (không dùng AI) | – | Nguyễn Thanh Tùng tự sửa file Word: đổi mã môn thành GRPR401979, sửa tiêu đề phụ, bỏ dòng Kho mã nguồn và Họp nhóm, bỏ một ý trong Mục tiêu, bỏ mục Lộ trình và phần ký |
| 12/10 | "hãy sửa lại những phần tô vàng trong file word …"; "dựa vào nội dung đã sửa hãy hướng dẫn tôi điền vào form trên hình" | Điền các ô còn trống trong nhật ký AI; sửa tham chiếu chéo; soạn nội dung để dán vào form nộp | Trả lời câu hỏi của AI: ai dùng AI, có dùng công cụ AI khác hay không |
| 14/10 | "hãy sửa và hướng dẫn tôi sửa lại file … theo như yêu cầu trên của giảng viên và thay kế hoạch của 2 thành những yêu cầu như hình mà tôi gửi" | Thêm link GitHub vào báo cáo; viết lại Kế hoạch tuần 2 theo ghi chú của nhóm; tạo các tệp docs | **Kế hoạch tuần 2 do nhóm tự lập** (ghi chú viết tay), AI chỉ trình bày lại; nhóm tự tạo repo GitHub và tự commit, push |

## Sai sót của AI mà nhóm phát hiện

1. AI ghi tên đề tài là "STUDYTASK – Hệ thống Quản lý Học tập Sinh viên". Tên đăng ký đúng là **"Xây dựng một website quản lý deadline học tập cho sinh viên"**. Nhóm đã sửa sau khi đối chiếu với thông báo của GVHD.
2. AI hướng dẫn đính kèm tệp PDF khi nộp. Cách này **vi phạm yêu cầu "không dùng đính kèm"**, dẫn đến báo cáo bị từ chối. Nhóm đã bỏ đính kèm và thay bằng link GitHub.
3. AI xác định các lỗ hổng chỉ bằng cách đọc mã, chưa chạy thử để kiểm chứng. Nhóm sẽ kiểm chứng ở môi trường riêng, không thử trên hệ thống đang chạy.

## Cơ chế kiểm soát áp dụng từ tuần 2

- Mã do AI sinh được commit riêng, thông điệp commit có nhãn `[AI]`.
- Mỗi commit như vậy phải có một thành viên khác review.
- Mỗi lần dùng AI được ghi vào `docs/ai-log/tuan-XX.md`, kèm mã commit tương ứng.
