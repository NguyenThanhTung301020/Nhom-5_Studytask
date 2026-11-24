# Bản sao lưu ngoài máy trên Google Drive (việc 5 tuần 8)

- Việc: tải bản `.7z` đã mã hóa lên nơi lưu trữ ngoài máy và ghi link vào repo (việc 5, kế hoạch tuần 8)
- Người thực hiện: Nguyễn Thanh Tùng; Claude Code (AI) tính SHA256 và soạn tệp này theo yêu cầu, cần ghi vào nhật ký sử dụng AI
- Người review: Trương Thanh Vui
- Thời điểm tải lên: 24/11/2026 (tải lại từ Drive để kiểm tra lúc 12:41 giờ Việt Nam)

## 1. Link

**Link Google Drive tới bản `.7z` đã mã hóa:** https://drive.google.com/file/d/1ccmuUtgXcKhqsS7Y_L1g2cB5Z-M0TBOy/view

- Quyền truy cập chung: **Hạn chế** (chỉ người được thêm mới mở được), không để "Bất kỳ ai có đường liên kết". Repo này là public, nên link ghi ở đây ai cũng thấy; quyền truy cập do Google Drive kiểm soát.
- Người được thêm quyền: Trần Đức Tùng, Trương Thanh Vui (tài khoản sinh viên của trường; không ghi địa chỉ email ở đây). Ngày 24/11/2026 một người có quyền **Người chỉnh sửa**, một người **Người xem**. Người chỉnh sửa xóa hoặc thay được tệp sao lưu, nên đề xuất hạ cả hai xuống Người xem.
- Tài khoản Google giữ tệp: tài khoản sinh viên HCMUTE của Nguyễn Thanh Tùng (chủ sở hữu).

## 2. Tệp đã tải lên

| Hạng mục | Giá trị |
|---|---|
| Tên tệp | `studytask-tu-may-chu-2026-11-17.7z` |
| Kích thước | 666636933 byte (636 MiB) |
| SHA256 | `3C9D2B1068CDD0D0AD9B03281AAC8937057D8C1B5EFA65AA5899F79493D321FB` |
| Nội dung | 12 bản sao lưu ngày từ 06/11 đến 16/11/2026 và `backup.log` (49 thư mục, 8386 tệp), xem [biên bản 09](09-bien-ban-sao-luu-ra-o-ngoai-2026-11-11.md) mục 3 |
| Mã hóa | 7-Zip AES-256, có mã hóa cả tên tệp (`-mhe=on`) |
| Mật khẩu | **Không ghi ở đây, trong repo hay trong nhật ký AI.** Cất trong trình quản lý mật khẩu Google của Nguyễn Thanh Tùng (biên bản 09 mục 3) |

Ngày 24/11/2026, SHA256 của bản gốc `D:\…\studytask-tu-may-chu-2026-11-17.7z` và bản chép `C:\backup\…` đều là giá trị trên (trùng với giá trị ghi ở biên bản 09).

## 3. Kiểm tra sau khi tải lên

| Kiểm tra | Kết quả |
|---|---|
| Tải lại tệp từ Drive về thư mục `Downloads`, so SHA256 với bản gốc | **Trùng**: `3C9D2B10…93D321FB`, 666636933 byte. Bản gốc đã đạt `7z t` ngày 17/11 (biên bản 09 mục 3), nên không chạy lại `7z t` trên bản tải lại |
| Mở link khi chưa đăng nhập Google (kiểm tra quyền chia sẻ) | Lần đầu (sau khi tải lên) trang tệp mở được, nghĩa là đang để "Bất kỳ ai có đường liên kết". Đã đổi sang **Hạn chế**; mở lại cùng ngày: Drive trả **401**, không hiện tên tệp |

## 4. Giới hạn

- Đây là bản chụp ngày 17/11/2026 (bản sao lưu mới nhất là 16/11 20:05 UTC). Bản trên Drive **không tự cập nhật**; các bản sao lưu từ sau ngày đó chưa có bản ngoài máy được mã hóa.
- Bản này chỉ có cơ sở dữ liệu và tệp tải lên; **không có** PDF kho sách (chỉ các bản sao lưu sau việc 6 tuần 8 mới có).
- Tệp nằm trên tài khoản sinh viên của trường: tài khoản có thể bị khóa hoặc xóa sau khi ra trường, khi đó bản này mất. Trước thời điểm đó cần chuyển sang nơi lưu trữ khác.
- Nếu mất mật khẩu thì không mở được tệp; nếu tài khoản Google bị chiếm thì người lấy được chỉ có tệp mã hóa, nhưng vẫn nên đổi mật khẩu ứng dụng email (`mail-config`) như biên bản 09 mục 3.
