# 02. Thiết kế, triển khai, kiểm thử
> **NGOÀI KẾ HOẠCH CỦA NHÓM.** Phần việc này do Trương Thanh Vui làm riêng, không thuộc kế hoạch tuần 5, 6, 7 và không tính vào khối lượng các việc theo kế hoạch của nhóm. Đọc để hiểu một phần việc riêng, không dùng để đánh giá tiến độ kế hoạch.

## 1. Yêu cầu

Đưa các đầu sách đã tải từ Archive.org (70 tệp PDF, khoảng 2,2 GB) lên trang Thư viện của web thật, lưu trên máy chủ của nhóm, hiển thị **tên sách và trang bìa**.

## 2. Cách làm

| Việc | Cách làm | Mã |
|---|---|---|
| Lập danh mục | Đọc thông tin mục từ API công khai của Archive.org, gộp với phần nhập tay (tên có dấu, thể loại), tính SHA-256 và dung lượng, đặt mã sách ASCII | `scripts/prepare_library.py`, `scripts/data/thu-vien-*.json` |
| Ảnh bìa | Vẽ trang 1 của PDF thành JPEG bằng bộ đọc PDF có sẵn của Windows; sách lỗi thì vẽ bìa thay thế có tên sách. 70/70 sách vẽ được từ PDF, 3,6 MB tổng | `scripts/render_library_covers.ps1` |
| Nạp lên máy chủ | Chép thư mục chuẩn bị lên máy chủ, kiểm SHA-256 từng tệp, đặt PDF vào `library/books/` (không công khai), bìa vào `uploads/library/`, ghi danh mục vào CSDL; chạy lại được, có `--dry-run` và `--remove` | `scripts/import_library.py` |
| Quyền truy cập | Danh mục đọc được khi đã đăng nhập, không ghi qua `/api/doc`. PDF tải qua `/api/files/library/<mã>.pdf`: API kiểm tra đăng nhập rồi nhờ nginx phát tệp (`X-Accel-Redirect`, hỗ trợ đọc từng trang, không nạp cả tệp vào bộ nhớ API). Không có đường dẫn công khai tới PDF | `server/studytask_api.py`, `deploy/nginx-studytask.conf`, `deploy/deploy.sh` |
| Giao diện | Trang Thư viện có hai mục: "Kho sách điện tử" (lưới bìa, tên sách, tác giả, thể loại, số trang; tìm không cần gõ dấu; lọc thể loại; sắp xếp; chi tiết kèm nguồn, giấy phép, nút Đọc trực tuyến và Tải về) và "Liên kết & nguồn tham khảo" (như cũ) | `pages/LibraryBooks.js`, `pages/Library.js`, `utils/library.js` |

## 3. Kiểm thử đã chạy (19/11/2026, trên máy cá nhân)

| Lệnh | Kết quả |
|---|---|
| `npm run test:logic` | 128/128 đạt (thêm 5 nhóm kiểm tra: tìm không dấu, lọc, sắp xếp, dung lượng, liên kết nguồn) |
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
5. **Cài API và nginx** bằng `sudo bash deploy/deploy.sh` do Trương Thanh Vui chạy (cần mật khẩu `sudo`): `[điền kết quả: hash API, phiên bản giao diện, nginx -t]`.
6. **Kiểm tra sau triển khai:** `[điền: trang công khai 200; đăng nhập thử, danh mục 70 sách, tải một PDF, ảnh bìa hiển thị; PDF không tải được khi chưa đăng nhập]`.

**Quay lại:** `scripts/import_library.py --remove` gỡ danh mục, PDF và bìa do script nạp; cài lại bản `master` bằng `deploy.sh` để bỏ phần API/nginx mới. CSDL chỉ thêm các bản ghi `libraryBooks` nên không cần khôi phục bản sao lưu.

## 6. Giới hạn đã biết

- Bìa là trang 1 của PDF; với vài sách trang 1 là trang bìa do Archive thêm hoặc bìa quét mờ, chưa chọn lại từng sách.
- Tên có dấu, tác giả, thể loại nhập tay cho 70 sách; một số thông tin tác giả/dịch giả có thể chưa đầy đủ (ví dụ "Thiện ác đấu tranh", "Cổ tích Việt Nam bằng thơ" chưa rõ tác giả).
- Chưa đo tải khi nhiều người cùng tải các PDF lớn (lớn nhất 205 MB) qua Cloudflare Tunnel; chưa thử đọc trực tuyến trên điện thoại.
- **Bản sao lưu PDF:** PDF nằm ngoài CSDL nên bản sao lưu CSDL không chứa sách. Bản gốc còn ở `E:\sach` trên máy cá nhân; máy chủ chưa có bản sao lưu riêng của thư mục `library/` (ổ đĩa máy chủ từng báo lỗi đọc tại LBA 705216 trong kiểm tra SMART tuần 7).
