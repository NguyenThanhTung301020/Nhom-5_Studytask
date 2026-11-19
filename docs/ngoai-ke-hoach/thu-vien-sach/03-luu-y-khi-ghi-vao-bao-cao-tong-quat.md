# 03. Lưu ý khi ghi nhận vào báo cáo tổng quát
> **NGOÀI KẾ HOẠCH CỦA NHÓM.** Phần việc này do Trương Thanh Vui làm riêng, không thuộc kế hoạch tuần 5, 6, 7 và không tính vào khối lượng các việc theo kế hoạch của nhóm. Đọc để hiểu một phần việc riêng, không dùng để đánh giá tiến độ kế hoạch.

## A. Những điều cần giữ khi viết báo cáo tổng quát sau này

1. **Ghi đúng loại việc: ngoài kế hoạch.** Không tính vào khối lượng, tiến độ hoặc "đã hoàn thành" của các việc theo kế hoạch tuần 5, 6, 7. Ghi ở phần việc làm thêm, tách khỏi bảng việc theo kế hoạch.
2. **Ghi nguồn đầy đủ.** Mọi chỗ nhắc đến sách phải ghi "Nguồn: Internet Archive (archive.org)" và kèm mã mục khi nói đến từng sách; liệt kê trang tìm kiếm tham khảo ở phần tài liệu tham khảo (xem 01, mục 1 và 2). Không trình bày sách như sản phẩm của nhóm.
3. **Không viết "đã có bản quyền" hoặc "miễn phí tự do".** 33 trên 179 sách chưa ghi giấy phép trên trang nguồn, 123 sách giấy phép CC BY-NC-ND (chỉ phi thương mại, không chỉnh sửa), 8 sách tải thủ công chưa có mã mục và chưa biết giấy phép. Câu an toàn: "sách lấy từ Internet Archive, chỉ dành cho người dùng đã đăng nhập, dùng cho học tập, chưa rà soát đầy đủ bản quyền".
4. **Số liệu dùng thống nhất** (tránh đếm trùng): **179 sách, đều từ Archive.org** (171 sách có mã mục thuộc 147 mục + 8 sách tải thủ công không có mã mục), **khoảng 5,0 GB** (5094 MB), 13 thể loại, bìa lấy từ trang 1 của PDF, đưa lên hai đợt (70 + 109). Đừng viết "179 mục Archive" (chỉ có 147 mục có mã; 8 sách không có mã).
5. **Phạm vi kỹ thuật phải nêu đúng:** PDF không nằm ở địa chỉ công khai (chỉ tải khi đăng nhập); PDF **không** nằm trong git và **không** nằm trong bản sao lưu CSDL.
6. **Những việc chưa làm cần ghi là chưa làm** (không viết như đã xong): rà giấy phép từng sách, bổ sung đường dẫn nguồn cho 8 sách tải thủ công, đo tải khi nhiều người tải tệp lớn, sao lưu riêng thư mục sách, đọc thử trên điện thoại.
7. **Rủi ro cần để lại trong báo cáo:** bản quyền (mục 3 ở 01), dung lượng ổ đĩa máy chủ tăng thêm khoảng 5,0 GB và ổ đĩa từng báo lỗi đọc (SMART tuần 7), mã đã chạy trên máy chủ thật trước khi PR được Approve.
8. **Việc này nên xin ý kiến giảng viên hướng dẫn** trước khi mở rộng hoặc công bố công khai (kèm câu hỏi: có nên giữ sách chưa rõ giấy phép trên hệ thống không).
9. **Cách tái hiện số liệu:** `python scripts/prepare_library.py --src E:\sach --staging <thư mục> --offline` ghi lại danh mục; trên máy chủ: `SELECT COUNT(*) FROM docs WHERE col='libraryBooks'` phải ra 179.

## B. Đoạn dán vào báo cáo tuần (phần việc ngoài kế hoạch)

> **Ngoài kế hoạch của nhóm (Trương Thanh Vui làm riêng, không tính vào khối lượng kế hoạch tuần 7).** Bổ sung kho sách điện tử cho trang Thư viện: 179 đầu sách (khoảng 5,0 GB) lấy từ Internet Archive, lưu trên máy chủ, hiển thị tên sách và trang bìa, tìm không cần gõ dấu, đọc và tải PDF khi đã đăng nhập. Mỗi sách ghi nguồn (mã mục Archive.org) và giấy phép theo trang nguồn. Nguồn tìm sách: https://archive.org/search?tab=texts&query=T%C3%A1c+ph%E1%BA%A9m+v%C4%83n+h%E1%BB%8Dc&page=3 (tham khảo ngày 19/11/2026). Trang Thư viện bỏ mục liên kết ngoài, chỉ còn kho sách. Kiểm thử: kiểm thử logic đạt, `tests/server/test_library_books.py` đạt. Chưa làm: rà giấy phép từng sách (33/179 chưa ghi giấy phép), bổ sung đường dẫn nguồn cho 8 sách tải thủ công, đo tải khi tải tệp lớn, sao lưu riêng thư mục sách. Chi tiết: `docs/ngoai-ke-hoach/thu-vien-sach/`.
