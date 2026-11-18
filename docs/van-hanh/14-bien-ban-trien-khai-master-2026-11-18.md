# Biên bản triển khai máy chủ từ `master` ngày 18/11/2026 (việc của tuần 7)

- Mục đích: đưa máy chủ về chạy **đúng một commit của `master`** sau khi gộp [PR58]–[PR61], có sao lưu trước, đối chiếu SHA256 trước/sau, kiểm tra dịch vụ và web; không để tệp chạy nào nằm ngoài GitHub.
- Thời điểm đo: 18/11/2026 12:12 UTC (19:12 giờ Việt Nam).
- Cách đo: Claude Code (AI) chạy trên máy Windows của nhóm: `git fetch`, GitHub API công khai (trạng thái PR), `curl` tới `https://sutdytask.io.vn` (tải từng tệp giao diện về và tính SHA256). Hash phía repo tính bằng `git show <commit>:<tệp> | sha256sum`.
- **Giới hạn của phiên này:** SSH tới `studytask@192.168.2.187` **không kết nối được** (`Connection timed out`; máy đo đang ở mạng `192.168.1.x`, không cùng LAN với máy chủ, chưa có khóa SSH). Vì vậy các bước cần vào máy chủ (sao lưu, chạy `deploy.sh`, hash `/opt/studytask/studytask_api.py`, `systemctl`, rà tệp thừa) **chưa làm**; mục 5 là kế hoạch để Trương Thanh Vui chạy khi có mặt ở LAN, mục 6 để trống chờ điền.
- Không push, không sửa máy chủ trong phiên này.

## 1. Trạng thái PR và `master`

| PR | Nhánh | Trạng thái | Gộp lúc (UTC) | Commit gộp | Ảnh hưởng tệp chạy |
|---|---|---|---|---|---|
| [PR58] | `feat/tuan7-diem-quizresults-unlink-email` | Đã gộp | 16/11 05:14 | `cd2ab09` | Có (API, `GradeBook.js`) |
| [PR59] | `docs/tuan7-doi-chieu-may-chu-17-11` | Đã gộp | 17/11 09:41 | `4fada7a` | Không (tài liệu) |
| [PR60] | `docs/tuan7-sao-luu-ra-o-ngoai-17-11` | Đã gộp | 17/11 15:05 | `5aa2d07` | Không (tài liệu) |
| [PR61] | `feat/ngoai-ke-hoach-hoc-phan-mo-tkb-tuan` | Đã gộp | 18/11 01:22 | `5aea97e` | Có (API, giao diện, ảnh đại diện) |
| [PR62] | `docs/tuan7-bao-ve-ban-sao-luu-ngoai` | Đã gộp | 18/11 08:54 | `a6b98fd` | Không (tài liệu) |
| [PR63] | `feat/ngoai-ke-hoach-lich-theo-vai-tro-thi-truc-tuyen` | Đã gộp | 18/11 11:49 | `56c0bb4` | Có (thi trực tuyến, chữ theo vai trò) |
| [PR64] | `docs/tuan7-kiem-thu-v3-web-that` | **Đang mở** | – | – | Không (chỉ thêm 1 tệp `.md` trong `docs/kiem-thu/`) |

**Commit `master` mới nhất:** `56c0bb4bf3c8b40bf25630bf51cad742f17293ad` (gộp [PR63], 18/11/2026 18:49 giờ Việt Nam).

## 2. Commit cần triển khai

**`56c0bb4`**. Lý do:
- [PR61] đã được xử lý (gộp `5aea97e`), sau đó `master` còn nhận [PR62] (tài liệu) và [PR63] (có mã chạy). Triển khai `5aea97e` sẽ **làm mất** phần thi trực tuyến của [PR63] đang chạy trên máy chủ, nên mốc đúng là đỉnh `master`.
- [PR64] đang mở chỉ là tài liệu, không đổi tệp chạy: gộp hay chưa đều không làm thay đổi bản triển khai.
- Nếu trước khi triển khai `master` có thêm commit mới, phải đo lại mục 3 với commit đó và cập nhật biên bản này.

## 3. Hiện trạng trước triển khai (đo từ ngoài, 12:12 UTC)

Giao diện công khai đang ở phiên bản `v202611180911`, do lần triển khai sáng 18/11 cài **từ nhánh của [PR63] trước khi gộp** (`git archive HEAD` của nhánh feature, [biên bản 08 ngoài kế hoạch](../ngoai-ke-hoach/du-lieu-lop-hoc/08-bien-ban-trien-khai-14-11-va-17-11.md) mục 4b). Kiểm tra: từ `643aea8` (commit mã cuối của nhánh) đến `56c0bb4`, `git diff` trên `server/`, `deploy/`, `app.js`, `style.css`, `index.html`, `components/`, `pages/`, `utils/` **rỗng**, nên nội dung nhánh đó và `master` giống nhau ở tệp chạy.

**Bảng hash trước triển khai** (SHA256 đầy đủ của `master`; cột "Máy chủ" là tệp tải từ `https://sutdytask.io.vn/v202611180911/<tệp>`):

| Tệp | SHA256 tại `master` `56c0bb4` | Máy chủ (trước) | Kết quả |
|---|---|---|---|
| `server/studytask_api.py` → `/opt/studytask/studytask_api.py` | `1b0d2c701de197382dd1b9fb75abb42caa5bbb8b67f847f2b415c3fce92250a5` | `1b0d2c701de19738` (16 ký tự, theo biên bản 08 mục 4b, **chưa đo lại**) | Khớp theo biên bản cũ; cần đo lại qua SSH |
| `app.js` | `62b5aea316d31d742987ab7f46c938d335042a7c209a8026c4c0d8194241721f` | như cột trái | Khớp |
| `components/GradeBook.js` | `a538e9e311a461677e78dd1c48e1c7916fbb194afef4dabe57966533a2c40dca` | như cột trái | Khớp |
| `pages/Quiz.js` | `6e1bc4adbfa93a89b97c3871f9051f76ca4178a27ad88faa1ae408b04dc81896` | như cột trái | Khớp |
| `pages/Reports.js` | `c6e712927565d85fad1e15fd45c1038927f6209a6ede210ef3e692a2ed8e5ee6` | như cột trái | Khớp |
| `pages/ExamRoom.js` | `b3ee08ea5965b5aa25ea4491aa35611f62a770e50fd39ab0ccd564c3a8c988e5` | như cột trái | Khớp |
| `utils/exams.js` | `598d6009812f17ceefc2949491ea4bebb3863ab07b8f1a11cd6a4d99c3f78b24` | như cột trái | Khớp |
| `utils/roleText.js` | `99a8324562abb91d02e02e237bb752b44d3ed2c1c2ff050e1f5d80ced398a044` | như cột trái | Khớp |
| `utils/firebase.js` | `132a830eef083033f60fc072a81ddd10e82134c19e56fc0409fe57a87ac62664` | như cột trái | Khớp |
| `pages/Admin.js` | `03909cab348531501a39136757be7b9a2784f06a09bcbdfb655cc1ba5c8b955e` | như cột trái | Khớp |
| `pages/Directory.js` | `d184682f86629e33a2625702b6ff6d52677e342c2551b4f6576a821fb4ce1403` | như cột trái | Khớp |
| `components/AccountManager.js` | `9bb5c3ecce7a7388b5afe3f3bfea7922fcb1577f22ae625927c5193b7cce8987` | như cột trái | Khớp |
| `components/UserAvatar.js` | `0331c62337b5124956a4535fad8edc8fc4f6e0f38b25d2e167757934ccc51f7f` | như cột trái | Khớp |
| `style.css` | `11811e53ede63a3120ae456687ec9941dd8d4ec342196c2cade2d3f8a8e5d6e5` | như cột trái | Khớp |
| `index.html` | `f541ae44dce58203060dabad2e2104298c5ddb9881583d5c0e2299f33a4bc12c` | `28af2405f8b2e19d…`; trùng hash của bản `master` sau khi thay `style.css`/`app.js` bằng `v202611180911/…` như `deploy.sh` làm | Khớp (chỉ khác dòng phiên bản) |

**Toàn bộ giao diện:** 53/53 tệp `app.js`, `style.css`, `components/*`, `pages/*`, `utils/*` của `56c0bb4` tải được từ máy chủ và **trùng SHA256**; không tệp nào thiếu.

Không đo được từ ngoài: tệp **thừa** trong `/var/www/studytask` hoặc `/opt/studytask` (không có trong repo). `deploy.sh` chỉ chép đè, không xóa, nên tệp cũ từ các lần trước (nếu có) vẫn còn; cần rà ở bước 5.4.

## 4. Kiểm tra web từ ngoài (12:12 UTC)

| Kiểm tra | Kết quả |
|---|---|
| `GET https://sutdytask.io.vn/` | 200, 0,51 giây |
| `GET /api/auth/me` (chưa đăng nhập) | 200, `{"user": null}` |
| `GET /api/quiz/results` (endpoint của [PR58]) | 401 (có đường dẫn, bắt đăng nhập) |
| `POST /api/exam/x/start` (endpoint của [PR63]) | 401 |
| `GET /api/doc/sharedData/global` (chưa đăng nhập) | 403 (đúng thiết kế, xem [biên bản 12](12-doi-chieu-may-chu-2026-11-17.md) mục 5) |
| `GET /.git/HEAD`, `/uploads/.env` | 404 |
| `GET /server/studytask_api.py`, `/deploy/deploy.sh`, `/docs/`, `/tests/` | 200 nhưng là `index.html` của SPA (1.511 byte, `text/html`): **không lộ mã nguồn** |

## 5. Kế hoạch triển khai (chưa chạy; Trương Thanh Vui chạy trên LAN)

Nội dung tệp chạy đã trùng `master`, nên lần triển khai này chủ yếu để **nguồn gốc** đúng (cài từ `master`, không từ nhánh PR), ghi `deploy-log`, và rà tệp thừa. API sẽ khởi động lại vài giây; không nạp lại dữ liệu, CSDL không đổi cấu trúc.

**5.1. Sao lưu (bắt buộc trước khi cài)**

```bash
TS=$(date -u +%Y%m%d-%H%M)
sudo systemctl start studytask-backup.service && sudo journalctl -u studytask-backup -n 5 --no-pager   # bản sao lưu chuẩn vào /mnt/backup/studytask
sudo tar czf ~/truoc-trien-khai-$TS.tar.gz /var/www/studytask /opt/studytask \
  /etc/nginx/sites-available/studytask /etc/systemd/system/studytask-api.service
sha256sum ~/truoc-trien-khai-$TS.tar.gz
sha256sum /opt/studytask/studytask_api.py          # ghi vào bảng mục 3 (cột Máy chủ)
```

**5.2. Lấy đúng commit `master` (không dùng nhánh feature, không dùng `~/deploy-1118`)**

```bash
git clone --branch master https://github.com/NguyenThanhTung301020/Nhom-5_Studytask.git ~/deploy-56c0bb4
cd ~/deploy-56c0bb4 && git checkout --detach 56c0bb4bf3c8b40bf25630bf51cad742f17293ad
git rev-parse HEAD && git status --short            # phải in đúng 56c0bb4bf3c8… và không có dòng thay đổi
```

Nếu máy chủ không có `git`: trên máy Windows `git archive --format=tar.gz -o st-56c0bb4.tar.gz 56c0bb4`, `scp` lên, so `sha256sum` hai đầu rồi giải nén vào `~/deploy-56c0bb4`.

**5.3. Cài bằng script chuẩn**

```bash
cd ~/deploy-56c0bb4 && sudo bash deploy/deploy.sh
echo "$(date -u '+%F %T') UTC  master 56c0bb4  deploy/deploy.sh  (bien ban 14)" >> ~/deploy-log.txt
```

**5.4. Đối chiếu hash và rà tệp thừa**

```bash
cd ~/deploy-56c0bb4
cmp server/studytask_api.py /opt/studytask/studytask_api.py && echo "API KHOP"
sha256sum /opt/studytask/studytask_api.py
n=0; for f in app.js style.css $(find components pages utils -type f); do cmp -s "$f" "/var/www/studytask/$f" || { echo "KHAC $f"; n=$((n+1)); }; done; echo "giao dien khac: $n"
find app.js style.css index.html components pages utils -type f | sort > /tmp/repo.txt
(cd /var/www/studytask && find . -type f | sed 's|^\./||' | sort) > /tmp/web.txt
comm -13 /tmp/repo.txt /tmp/web.txt                 # tệp có trên máy chủ mà không có trong repo: phải rỗng
ls -la /opt/studytask
```

Tệp thừa tìm được: ghi vào mục 6, sao lưu (đã nằm trong gói 5.1), rồi xóa sau khi nhóm đồng ý. Thư mục `~/deploy-1118` (bản của nhánh [PR63]) xóa sau khi lần cài này đạt.

**5.5. Dịch vụ và web**

```bash
systemctl is-active studytask-api nginx cloudflared
systemctl show studytask-api -p ActiveEnterTimestamp
journalctl -u studytask-api --since "10 min ago" -p warning --no-pager | tail -20
curl -s http://127.0.0.1:8787/api/auth/me; echo
curl -s -o /dev/null -w "%{http_code} %{time_total}\n" https://sutdytask.io.vn/
```

Thử tay trên web thật: đăng nhập sinh viên và giáo viên, mở Bảng điểm (`GradeBook`, lỗi `user is not defined` cũ), Trắc nghiệm, Báo cáo, Lịch (chữ theo vai trò), Phòng thi (giáo viên thấy mã). Không tạo dữ liệu thật mới.

**Quay lại nếu lỗi:** `sudo tar xzf ~/truoc-trien-khai-$TS.tar.gz -C /` rồi `sudo systemctl restart studytask-api && sudo systemctl reload nginx`.

## 6. Kết quả sau triển khai (điền sau khi chạy mục 5)

| Mục | Kết quả |
|---|---|
| Người chạy, thời điểm (UTC) | `[điền]` |
| Bản sao lưu chuẩn (tên thư mục trong `/mnt/backup/studytask`) | `[điền]` |
| Gói `truoc-trien-khai-*.tar.gz` và SHA256 | `[điền]` |
| `git rev-parse HEAD` trong `~/deploy-56c0bb4` | `[điền]` (phải là `56c0bb4bf3c8b40bf25630bf51cad742f17293ad`) |
| Phiên bản giao diện mới `v…` | `[điền]` |
| SHA256 `/opt/studytask/studytask_api.py` | `[điền]` (phải là `1b0d2c70…92250a5`) |
| Số tệp giao diện khác repo | `[điền]` (phải là 0) |
| Tệp thừa (`comm -13`) và `/opt/studytask` | `[điền]` (phải rỗng / chỉ `studytask_api.py`) |
| `studytask-api`, `nginx`, `cloudflared` | `[điền]` |
| `/api/auth/me` nội bộ, trang công khai | `[điền]` |
| Thử tay các trang ở 5.5 | `[điền]` |
| Dòng mới trong `~/deploy-log.txt` | `[điền]` |

## 7. Kết luận tại thời điểm đo

- [PR58]–[PR61] đều đã gộp; `master` hiện là `56c0bb4` (thêm [PR62], [PR63]). Đây là commit cần triển khai.
- Giao diện đang chạy **trùng nội dung** `56c0bb4` (53/53 tệp và `index.html`), nhưng được cài từ nhánh feature trước khi gộp, trái quy ước "chỉ triển khai từ `master`". API khớp theo biên bản cũ, chưa đo lại.
- **Chưa đạt** yêu cầu "máy chủ chạy đúng commit `master`, không còn tệp ngoài GitHub" cho tới khi chạy xong mục 5 và điền mục 6.

[PR58]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/58
[PR59]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/59
[PR60]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/60
[PR61]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/61
[PR62]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/62
[PR63]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/63
[PR64]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/64
