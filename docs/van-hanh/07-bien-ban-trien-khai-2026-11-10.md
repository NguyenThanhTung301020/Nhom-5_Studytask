# Biên bản triển khai ngày 10/11/2026

Người thực hiện: Trương Thanh Vui. Việc 1 (triển khai), 7 (V3), 11 (quyền tải bài nộp), 13 (đồng bộ số điện thoại), 14 (lọc dữ liệu theo môn).

## 1. Bản đã triển khai

| Mục | Giá trị |
|---|---|
| Thời điểm | 10/11/2026, khoảng 03:02 UTC (theo mã phiên bản giao diện `v202611100302` do `deploy.sh` in ra) |
| Nguồn | Nhánh `feat/tuan6-loc-du-lieu-theo-mon-may-chu`, commit `d924b69`. Nhánh gồm theo thứ tự: PR40 (V3, xóa tài khoản dọn kết quả trắc nghiệm), `fix/tuan6-dong-bo-so-dien-thoai-may-chu` (việc 13), và việc 14. **Cả ba chưa gộp vào `master` tại thời điểm triển khai** |
| Cách làm | Đóng gói bằng `git archive`, chép lên `~/studytask-deploy`, chuẩn hóa kết thúc dòng về LF, rồi `sudo bash deploy/deploy.sh` (nginx `-t` thành công) |
| Sao lưu trước | `/var/lib/studytask/studytask.db.truoc-loc-mon` (và `.truoc-v3` của lần trước) |
| Người xem và gộp PR | Thành viên khác; ghi lại ở mục 4 khi gộp xong |

## 2. Đối chiếu sau triển khai

| Kiểm tra | Kết quả |
|---|---|
| SHA256 `/opt/studytask/studytask_api.py` | `91ab1f788e3d49b0…`, trùng hash của commit `d924b69` |
| `studytask-api`, `nginx`, `cloudflared` | Cả ba `active` |
| `GET /api/auth/me` nội bộ (cổng 8787) | 200, `{"user": null}` |
| `/.git/config` qua nginx nội bộ | **404** (trước khi sửa: 200) |
| `/var/www/studytask/utils/sanitize.js` | Có (867 byte) |
| Quy tắc nginx `location ~ /\.` | Có trong `/etc/nginx/sites-available/studytask` |
| Kiểm thử động từ Internet | `smoke_live.py` **16/16 đạt**: [smoke-live-2026-11-10-sau-trien-khai.txt](bang-chung/2026-11-10/smoke-live-2026-11-10-sau-trien-khai.txt) (trước triển khai: 15/16, ca `.git` lỗi, [smoke-live-2026-11-10.txt](bang-chung/2026-11-10/smoke-live-2026-11-10.txt)) |

Ghi chú: `~/deploy-log.txt` có dòng "chuẩn bị (chưa chạy deploy.sh)" do bước chuẩn bị ghi trước khi chạy `deploy.sh`; việc chạy `deploy.sh` được xác nhận bằng các kiểm tra trên (hash khớp, nginx đã nạp quy tắc mới).

## 3. Thay đổi người dùng có thể nhận thấy

- Sinh viên chỉ nhận bài tập, tài liệu, lịch học, lịch thi, deadline, đề trắc nghiệm của môn mình học; điểm nhập tay chỉ còn của chính mình. Tài khoản có `subjectIds` rỗng chỉ thấy mục chung.
- Đề trắc nghiệm đã mở không sửa được nội dung; chỉ đóng đề. Đề mới luôn là bản nháp. Điểm trắc nghiệm do máy chủ chấm.
- Xóa tài khoản trong Admin xóa luôn kết quả trắc nghiệm của tài khoản đó.
- Lưu số điện thoại trong Hồ sơ ghi cả hai nơi trong một giao dịch.
- Thư mục `.git` và mọi tệp ẩn trên web trả 404.

## 4. Việc còn lại (điền khi hoàn thành)

| Việc | Người | Kết quả |
|---|---|---|
| Gộp lần lượt PR40, nhánh việc 13, nhánh việc 14 vào `master` | Thành viên review | |
| So `sha256sum /opt/studytask/studytask_api.py` với `master` sau khi gộp cả ba; nếu khác thì triển khai lại | Trương Thanh Vui | |
| Xóa bản clone cũ `/var/www/studytask/.git` (tùy chọn, nginx đã chặn truy cập) | Trương Thanh Vui | |
