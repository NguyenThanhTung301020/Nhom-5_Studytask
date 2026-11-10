# Kiểm thử động trên hệ thống đang chạy và phát hiện lộ `.git` (10/11/2026)

Người thực hiện: Trương Thanh Vui. Việc 7, 11, 14 và quy ước của nhóm: các thành viên đã kiểm thử bằng tay ở cả ba máy, nên phần thử tay trên web thật được thay bằng **kiểm thử động** (gửi yêu cầu thật tới hệ thống đang chạy và kiểm tra kết quả bằng chương trình).

## 1. Hai lớp kiểm thử động

| Lớp | Công cụ | Chạy ở đâu | Tác động dữ liệu |
|---|---|---|---|
| API tạm, dữ liệu tạm | `tests/server/test_*.py`, `test_submit.sh` (V3, quyền tải bài nộp, hồ sơ, Admin đặt lại mật khẩu, phân quyền theo môn...) | CI và máy cá nhân | Không (dữ liệu tạm, xóa sau khi chạy) |
| **Hệ thống đang chạy** | `tests/server/smoke_live.py` | Máy cá nhân hoặc chính máy chủ | **Không tạo, không sửa dữ liệu**; chỉ gửi yêu cầu an toàn |

```bash
python3 tests/server/smoke_live.py                       # kiểm tra https://sutdytask.io.vn
python3 tests/server/smoke_live.py http://127.0.0.1:8787 # chạy trên máy chủ, không qua Cloudflare
SMOKE_USER=<sinh viên thử> SMOKE_PASS=<mật khẩu> python3 tests/server/smoke_live.py   # thêm phần đã đăng nhập (chỉ đọc)
```

Thoát mã 0 khi mọi ca đạt, 1 khi có ca lỗi. Phần người ngoài kiểm tra: trang chủ, `utils/sanitize.js`, dữ liệu dùng chung, tải bài nộp, nộp trắc nghiệm, `/api/quiz/mine`, đặt lại mật khẩu bằng đường Admin, `quizKeys`/`quizResults`, đăng nhập sai không gây 5xx, `.git` và mã nguồn máy chủ. Phần có tài khoản thử: đề không có `correct`, `quiz/mine`, không đọc được khóa đáp án.

## 2. Kết quả lần chạy đầu (10/11/2026 02:54 UTC)

Tệp: [bang-chung/2026-11-10/smoke-live-2026-11-10.txt](bang-chung/2026-11-10/smoke-live-2026-11-10.txt). **15/16 ca đạt, 1 ca lỗi.**

| Ca | Kết quả |
|---|---|
| Bài nộp, trắc nghiệm, đặt lại mật khẩu, `quizKeys`, `quizResults` khi chưa đăng nhập | Đạt (401 hoặc bị từ chối) |
| Đăng nhập sai | 401, không 5xx |
| **Không lộ thư mục `.git`** | **Lỗi: `/.git/config`, `/.git/HEAD`, `/.git/index`, `/.git/logs/HEAD`, `/.git/packed-refs` trả 200** |

## 3. Phát hiện: thư mục `.git` của bản clone cũ được phục vụ công khai

- **Nguyên nhân:** `/var/www/studytask/.git` là bản clone ngày 03/11 nằm trong thư mục gốc của web; nginx phục vụ mọi tệp trong đó, kể cả dotfile.
- **Ảnh hưởng:** repo GitHub là công khai nên lịch sử và địa chỉ `origin` vốn đã công khai, **không lộ bí mật**. Tuy vậy vẫn là cấu hình sai: ai cũng tải được cây tệp, và nếu sau này có commit cục bộ chưa đẩy hoặc tệp nhạy cảm bị `git add` nhầm thì sẽ lộ. Không có dấu hiệu `mail.json` hay CSDL nằm trong thư mục này (chúng ở `/var/lib/studytask`).
- **Sửa trong repo:** `deploy/nginx-studytask.conf` thêm `location ~ /\. { return 404; }` đặt trước các location regex khác, nên mọi tệp bắt đầu bằng dấu chấm đều trả 404.
- **Việc cần làm trên máy chủ** (cần `sudo`): triển khai lại để nginx nhận cấu hình mới (`deploy/deploy.sh` hoặc `scripts/van-hanh/trien-khai-tu-may-ca-nhan.ps1`). Tùy chọn nên làm thêm: bản clone cũ không còn dùng, có thể xóa `/var/www/studytask/.git` (repo đã có trên GitHub; trước đó nên chép ra `~/web-backup-...` nếu muốn giữ). Việc xóa do người vận hành quyết định, tôi không tự xóa.
- **Kiểm chứng sau khi sửa:** chạy lại `smoke_live.py`; ca `.git` phải trả 404 và kết quả cuối là `ĐẠT`. Ghi kết quả vào mục 4.

## 4. Kết quả sau khi sửa (điền khi triển khai)

| Ngày giờ | Người chạy | Commit đã triển khai | Kết quả `smoke_live.py` | Ghi chú |
|---|---|---|---|---|
| 10/11/2026 03:01 UTC (đồng hồ máy cá nhân) | Trương Thanh Vui (chạy triển khai); kiểm thử do Claude Code chạy theo yêu cầu | `d924b69` (nhánh `feat/tuan6-loc-du-lieu-theo-mon-may-chu`, chưa gộp) | **16/16 đạt**, ca `.git` trả 404 ([tệp kết quả](bang-chung/2026-11-10/smoke-live-2026-11-10-sau-trien-khai.txt)) | Cũng kiểm tra từ máy chủ: `.git` qua nginx nội bộ trả 404, trang chủ 200, API 200 |
