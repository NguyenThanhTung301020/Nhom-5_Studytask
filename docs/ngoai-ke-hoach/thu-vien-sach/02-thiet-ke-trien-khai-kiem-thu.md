# 02. Thiết kế, triển khai, kiểm thử
> **NGOÀI KẾ HOẠCH CỦA NHÓM.** Phần việc này do Trương Thanh Vui làm riêng, không thuộc kế hoạch tuần 5, 6, 7 và không tính vào khối lượng các việc theo kế hoạch của nhóm. Đọc để hiểu một phần việc riêng, không dùng để đánh giá tiến độ kế hoạch.

## 1. Yêu cầu

Đưa các đầu sách đã tải từ Archive.org (179 tệp PDF, khoảng 5,0 GB, đưa lên làm hai đợt) lên trang Thư viện của web thật, lưu trên máy chủ của nhóm, hiển thị **tên sách và trang bìa**.

## 2. Cách làm

| Việc | Cách làm | Mã |
|---|---|---|
| Lập danh mục | Đọc thông tin mục từ API công khai của Archive.org, gộp với phần nhập tay (tên có dấu, thể loại), tính SHA-256 và dung lượng, đặt mã sách ASCII | `scripts/prepare_library.py`, `scripts/data/thu-vien-*.json` |
| Ảnh bìa | Vẽ trang 1 của PDF thành JPEG bằng bộ đọc PDF có sẵn của Windows; sách lỗi thì vẽ bìa thay thế có tên sách. 179/179 sách vẽ được từ PDF | `scripts/render_library_covers.ps1` |
| Nạp lên máy chủ | Chép thư mục chuẩn bị lên máy chủ, kiểm SHA-256 từng tệp, đặt PDF vào `library/books/` (không công khai), bìa vào `uploads/library/`, ghi danh mục vào CSDL; chạy lại được, có `--dry-run` và `--remove` | `scripts/import_library.py` |
| Quyền truy cập | Danh mục đọc được khi đã đăng nhập, không ghi qua `/api/doc`. PDF tải qua `/api/files/library/<mã>.pdf`: API kiểm tra đăng nhập rồi nhờ nginx phát tệp (`X-Accel-Redirect`, hỗ trợ đọc từng trang, không nạp cả tệp vào bộ nhớ API). Không có đường dẫn công khai tới PDF | `server/studytask_api.py`, `deploy/nginx-studytask.conf`, `deploy/deploy.sh` |
| Giao diện | Trang Thư viện chỉ còn kho sách điện tử: lưới bìa, tên sách, tác giả, thể loại, số trang; tìm không cần gõ dấu; lọc thể loại; sắp xếp; chi tiết kèm nguồn, giấy phép, nút Đọc trực tuyến và Tải về. Mục "Liên kết & nguồn tham khảo" đã gỡ theo yêu cầu của Thanh Vui (19/11/2026) | `pages/LibraryBooks.js`, `pages/Library.js`, `utils/library.js` |

## 3. Kiểm thử đã chạy (19/11/2026, trên máy cá nhân)

| Lệnh | Kết quả |
|---|---|
| `npm run test:logic` | Đạt (đợt 1: 128/128; đợt 2 chạy `node --test tests/logic.test.mjs`: 113/113). Có 5 nhóm kiểm tra cho thư viện: tìm không dấu, lọc, sắp xếp, dung lượng, liên kết nguồn |
| `python tests/server/test_library_books.py` | KẾT QUẢ: ĐẠT (nạp, chạy lại, sai SHA-256 bị dừng, quyền đọc, không lộ tệp, tải qua API, gỡ sách) |
| Toàn bộ `tests/server/test_*.py` và `test_submit.sh` | Đạt |
| Chạy thử giao diện với 37 sách thật (dữ liệu thử cục bộ) | Hiện bìa và tên, tìm "dac nhan" ra "Đắc nhân tâm", mở chi tiết, tải về nhận đúng PDF (`%PDF`, 2.589.665 byte) |

Ảnh: `bang-chung/2026-11-19/thu-vien-kho-sach-luoi-bia.jpg`, `bang-chung/2026-11-19/thu-vien-chi-tiet-sach-nguon-ban-quyen.jpg`.

## 5. Biên bản triển khai lên máy chủ thật (19/11/2026)

Máy chủ `192.168.2.187`, tài khoản `studytask`, dữ liệu `/var/lib/studytask`.

1. **Sao lưu CSDL** trước khi làm: `~/loadtest/backup-truoc-thu-vien-sach-2026-11-19.db` (`quick_check` = ok, 1.031 tài khoản, 2.301 bản ghi).
2. **Gói mã** đóng bằng `git archive` từ nhánh `feat/ngoai-ke-hoach-thu-vien-sach-archive`, chép lên `~/deploy-1119`; hash `studytask_api.py` bản chép = bản trong git (`97305fccf4f65c2b`).
3. **Chép sách**: `tar` qua `ssh` với `ionice -c3 nice -n 19`, 70 tệp PDF + 71 tệp bìa (gồm `pages.json`), 2,2 GB, khoảng 31 giây; ổ gốc từ 8,2 GB lên 11 GB trên 295 GB.
4. **Nạp danh mục** bằng `scripts/import_library.py --move` (ưu tiên I/O thấp): kiểm SHA-256 cả 70 tệp đều khớp danh mục, 70 sách vào danh mục. `library/books` quyền 755, tệp 644.
5. **Đợt 2 (109 sách thêm):** sao lưu CSDL `~/loadtest/backup-truoc-thu-vien-dot2-2026-11-19.db` (`quick_check` = ok, 2.372 bản ghi); chép 110 PDF mới (2,8 GB) và bìa bằng `scp`; `import_library.py --dry-run` rồi `--move`: kiểm SHA-256 và nạp, danh mục 179 sách; gỡ mục cũ `01-nhung-cuoc-chinh-phuc-ky-dieu` (đã tách thành 9 tập). Kiểm lại: 179 bản ghi `libraryBooks`, 179 PDF quyền 644 (5,0 GB), 179 bìa, sách nào cũng có bìa và số trang; ổ gốc 14 GB trên 295 GB.
6. **Cài API và nginx** bằng `sudo bash deploy/deploy.sh` trong `~/deploy-1119` (gói từ commit `bb03af2`), do Trương Thanh Vui chạy (cần mật khẩu `sudo`; lần gõ đầu thừa dấu chấm thành `deploy.sh.` nên báo "No such file", gõ lại đúng thì chạy được). Kiểm lại: `studytask-api` và `nginx` đang chạy (active); hash `studytask_api.py` đang chạy = bản trong git (`97305fccf4f65c2b`); `pages/Library.js` đang phục vụ = bản mới (`5d540a6780d98a32`, đã bỏ mục "Liên kết & nguồn tham khảo"); cấu hình nginx có vị trí nội bộ `/_library/`.
7. **Kiểm tra sau triển khai (19/11/2026, từ máy chủ qua tên miền thật):** trang chủ `200`; ảnh bìa `/uploads/library/<mã>.jpg` `200 image/jpeg`; tải PDF khi chưa đăng nhập `401`; gọi thẳng `/_library/<tệp>` `404` (nginx chặn vì là vị trí nội bộ). Thanh Vui mở thử link sách trong cửa sổ ẩn danh: bị chặn đúng nhưng hiện JSON thô `{"error": …"unauthenticated"…}` → đã sửa ở mục 8.
8. **Sửa thông báo khi mở link sách chưa đăng nhập:** khi trình duyệt mở thẳng `/api/files/library/<mã>.pdf` (gửi `Accept: text/html`), API trả trang báo lỗi tiếng Việt "Cần đăng nhập để đọc sách" có nút Đăng nhập (mã `401` giữ nguyên); sách không có thì trang "Không tìm thấy sách" (`404`). Ứng dụng web vẫn nhận JSON như cũ. Thêm 3 kiểm tra vào `tests/server/test_library_books.py` (đạt); toàn bộ `tests/server/test_*.py` đạt. Kết quả cài lên máy chủ: `[điền sau khi chạy deploy.sh lần 2]`.

**Quay lại:** `scripts/import_library.py --remove` gỡ danh mục, PDF và bìa do script nạp; cài lại bản `master` bằng `deploy.sh` để bỏ phần API/nginx mới. CSDL chỉ thêm các bản ghi `libraryBooks` nên không cần khôi phục bản sao lưu.

## 6. Giới hạn đã biết

- Bìa là trang 1 của PDF; với vài sách trang 1 là trang bìa do Archive thêm hoặc bìa quét mờ, chưa chọn lại từng sách.
- Tên có dấu, tác giả, thể loại nhập tay cho 179 sách (đợt 2 đọc thêm tên và tác giả từ Archive, chỉ sửa tay khi thiếu dấu hoặc ghi sai); một số thông tin tác giả/dịch giả có thể chưa đầy đủ (ví dụ "Thiện ác đấu tranh", "Cổ tích Việt Nam bằng thơ" chưa rõ tác giả).
- Chưa đo tải khi nhiều người cùng tải các PDF lớn (lớn nhất 205 MB) qua Cloudflare Tunnel; chưa thử đọc trực tuyến trên điện thoại.
- **Bản sao lưu PDF:** PDF nằm ngoài CSDL nên bản sao lưu CSDL không chứa sách. Bản gốc còn ở `E:\sach` trên máy cá nhân; máy chủ chưa có bản sao lưu riêng của thư mục `library/` (ổ đĩa máy chủ từng báo lỗi đọc tại LBA 705216 trong kiểm tra SMART tuần 7).
