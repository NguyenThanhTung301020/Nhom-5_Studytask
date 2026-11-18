# Biên bản việc 1 tuần 7: triển khai từ `master` và đối chiếu hash

> **Việc của Nguyễn Thanh Tùng theo kế hoạch tuần 7.** Việc 1, Phần 6 của [báo cáo tuần 6](../bao-cao-tuan/tuan-06.md), ghi người phụ trách là Nguyễn Thanh Tùng. Tùng đã làm phần kiểm tra được từ máy của mình (mục 0). **Máy của Tùng không kết nối được tới máy chủ** (SSH tới `studytask@192.168.2.187` báo `Connection timed out` lúc 18/11 12:12 UTC; máy Tùng ở mạng `192.168.1.x`, khác mạng LAN của máy chủ), nên **Tùng nhờ Trương Thanh Vui kết nối giùm**: Vui (cùng Claude Code) thực hiện các thao tác và đo đạc qua SSH ở các mục 3–6. Việc vẫn ghi là việc 1 của Tùng; **Nguyễn Thanh Tùng cần đọc và xác nhận biên bản này** (mục 7).
>
> Biên bản đã được đưa vào nhánh cục bộ `docs/tuan7-trien-khai-master-18-11` (thay bản nháp biên bản 14 trước đó của Tùng), **chưa đẩy lên GitHub**.

- Kế hoạch (nguyên văn): "Triển khai lại từ `master` (gồm [PR50], [PR51], [PR52], [PR54], [PR56]), so hash `studytask_api.py` và các tệp giao diện; xử lý script cài đặt cũ."
- Kết quả cần đạt: "Máy chủ trùng hash với `master`; có biên bản trong `docs/van-hanh/`."
- Thời điểm đo: **18/11/2026 12:31 UTC** (19:31 giờ Việt Nam). `master` lúc đo: `56c0bb4` (gộp [PR63]).
- Cách đo: Claude Code chạy lệnh qua SSH (`studytask@192.168.2.187`) từ máy của Trương Thanh Vui, không dùng `sudo`. Phần đo hash là **chỉ đọc**; thay đổi duy nhất trên máy chủ là gỡ quyền thực thi ba script cũ (mục 5, 18/11 12:34 UTC). Hash tệp trên máy chủ tính bằng `sha256sum`; hash bản trong kho tính bằng `git show origin/master:<tệp> | sha256sum`.

## 0. Phân công thực hiện

| Phần việc | Người, máy | Kết quả |
|---|---|---|
| `git fetch`, đọc trạng thái PR58–PR64 trên GitHub, xác định commit đích `56c0bb4` | Nguyễn Thanh Tùng, máy của Tùng (Claude Code chạy lệnh) | Làm được. PR58–PR63 đã gộp; PR64 đang mở nhưng chỉ có tài liệu, không đổi tệp chạy |
| Đối chiếu độc lập qua Internet: tải từng tệp giao diện từ `https://sutdytask.io.vn/v202611180911/…`, so SHA256 với `master` `56c0bb4` (18/11 12:12 UTC) | Nguyễn Thanh Tùng, máy của Tùng | Làm được. **53/53 tệp** `app.js`, `style.css`, `components/`, `pages/`, `utils/` trùng; `index.html` trùng sau khi bỏ tiền tố `v202611180911/` (mục 4b) |
| Kiểm tra web từ ngoài: trang chủ, `/api/auth/me`, endpoint mới của PR58, PR63, đường dẫn mã nguồn | Nguyễn Thanh Tùng, máy của Tùng | Làm được (mục 4b) |
| Soạn script chỉ đọc `deploy/kiem-chung-master.sh` để đo lại toàn bộ trên máy chủ | Nguyễn Thanh Tùng, máy của Tùng (Claude Code soạn) | Đã soạn, chỉ kiểm cú pháp, **chưa chạy trên máy chủ** (nhánh cục bộ, chưa đẩy lên GitHub) |
| Hash `/opt/studytask/studytask_api.py`, so tệp trong `/var/www/studytask`, xem thời điểm cài, `~/migration`, `~/deploy-log.txt`; gỡ quyền thực thi script cũ | **Không làm được trên máy Tùng do máy không kết nối được tới máy chủ, nên nhờ Trương Thanh Vui kết nối giùm** (Claude Code trên máy Vui chạy lệnh) | Mục 3–6 |

## 1. Kết luận

**Việc 1 đạt về kết quả tại thời điểm đo** ("máy chủ trùng hash với `master`"). Máy chủ đang chạy đúng mã của `master`. **Về cách làm còn một điểm chưa đúng kế hoạch:** lần cài hiện tại (18/11) lấy từ nhánh của [PR63] **trước khi gộp**, không phải "triển khai lại từ `master`"; mã trùng là do nội dung `master` sau khi gộp giống hệt bản đã cài (mục 3). Để đúng cả quy trình, cần cài lại một lần từ `master` `56c0bb4` (nội dung không đổi) và ghi `~/deploy-log.txt`.

| Hạng mục | Kết quả |
|---|---|
| `studytask_api.py` | **Trùng** `master` (`1b0d2c701de19738…`) |
| Tệp giao diện (JS, HTML, CSS) | **53/54 tệp trùng** `master` (đo qua SSH); đo độc lập qua Internet từ máy Tùng cho cùng kết quả (mục 4b) |
| Tệp không trùng | `index.html`: khác đúng 2 dòng do `deploy.sh` chèn mã phiên bản vào đường dẫn (mục 4). Đây là hành vi dự kiến, không phải sai khác nội dung |
| 5 PR của việc 1 ([PR50], [PR51], [PR52], [PR54], [PR56]) | Cả năm đã nằm trong `master` (mục 2); vì hash trùng `master` nên mã của chúng đang chạy |
| Script cài đặt cũ | `install-api.sh` đã được đổi tên từ trước; **ngày 18/11 12:34 UTC đã gỡ quyền thực thi của cả ba script cũ** trong `~/migration` (mục 5) |

Còn lại: cài lại từ `master` cho đúng quy trình; chưa rà hết tệp chạy không có trên GitHub (mục 4 chỉ so các tệp `.js`, `.html`, `.css`); `~/deploy-log.txt` chưa ghi các lần triển khai từ 12/11 (mục 6); múi giờ của mốc 18/11 09:11 cần xác nhận (mục 3); biên bản này chưa nằm trong kho GitHub, và Tùng chưa xác nhận (mục 7).

## 2. Năm PR của việc 1 đã nằm trong `master`

Kiểm tra bằng `git merge-base --is-ancestor <commit gộp> origin/master`:

| PR | Commit gộp | Ngày gộp (giờ Việt Nam) | Trong `master` |
|---|---|---|---|
| [PR50] | `849f5c8` | 11/11/2026 13:08 | Có |
| [PR51] | `91cf96b` | 11/11/2026 14:01 | Có |
| [PR52] | `45570a2` | 13/11/2026 10:07 | Có |
| [PR54] | `0c88836` | 13/11/2026 11:51 | Có |
| [PR56] | `b9e2663` | 13/11/2026 21:13 | Có |

Sau [PR56], `master` còn nhận thêm PR58 đến [PR63] (58, 59, 60, 61, 62, 63). Máy chủ trùng `master` **hiện tại** nên cũng gồm các PR này.

## 3. Các lần cài mã lên máy chủ

Đọc từ máy chủ và từ biên bản triển khai trong phần ngoài kế hoạch ([biên bản 08](../ngoai-ke-hoach/du-lieu-lop-hoc/08-bien-ban-trien-khai-14-11-va-17-11.md)):

| Thời điểm (UTC) | Nội dung | Ghi chú |
|---|---|---|
| 14/11 02:51 | Cài từ `b9e2663` (gộp [PR56]) **kèm 4 tệp ảnh đại diện chưa commit** | Đo ngày 17/11: API, `app.js`, `GradeBook.js`, `Quiz.js` trùng `b9e2663`, nhưng `Reports.js`, `Admin.js`, `Directory.js`, `AccountManager.js` **không trùng** ([biên bản 12](12-doi-chieu-may-chu-2026-11-17.md) mục 2). Lần này không thuần `master` |
| 17/11 (phiên bản giao diện `v202611170853`) | Cài từ nhánh của [PR61], lúc đó chưa gộp | Hash trùng `68e0d47` ([biên bản 12](12-doi-chieu-may-chu-2026-11-17.md) mục 2b) |
| **18/11 09:11:41** (phiên bản `v202611180911`) | **Lần cài hiện tại**, từ nhánh `feat/ngoai-ke-hoach-lich-theo-vai-tro-thi-truc-tuyen` bằng `git archive HEAD` ([biên bản 08](../ngoai-ke-hoach/du-lieu-lop-hoc/08-bien-ban-trien-khai-14-11-va-17-11.md) mục 4b). Dịch vụ `studytask-api` khởi động lại lúc này | Trùng `master` tại `56c0bb4` (đo hôm nay) |

Lần cài ngày 18/11 diễn ra trước khi [PR63] được gộp vào `master` (gộp lúc 18:49 giờ Việt Nam), tức là **cài từ nhánh PR, không từ `master`**. Nội dung `master` sau khi gộp trùng nội dung đã cài (từ commit mã cuối `643aea8` của nhánh đến `56c0bb4`, `git diff` trên `server/`, `deploy/`, `app.js`, `style.css`, `index.html`, `components/`, `pages/`, `utils/` rỗng), nên hash vẫn khớp.

**Cần xác nhận múi giờ của mốc 09:11:41.** Bảng ghi là UTC (tức 16:11 giờ Việt Nam), nhưng biên bản 08 ghi lần cài này là "sáng 18/11", và commit biên bản 08 ghi kết quả của lần cài (`c78682d`) có giờ 16:09:41 giờ Việt Nam, sớm hơn 16:11. Hai cách ghi không thể cùng đúng. Đề nghị Trương Thanh Vui chạy `timedatectl` và `systemctl show studytask-api -p ActiveEnterTimestamp` trên máy chủ để chốt.

## 4. Bảng hash

API:

| Tệp | Máy chủ | `master` `56c0bb4` |
|---|---|---|
| `/opt/studytask/studytask_api.py` | `1b0d2c701de19738` | `1b0d2c701de19738` (trùng) |

Một số tệp giao diện chính (đường dẫn gốc `/var/www/studytask`), 16 ký tự đầu của SHA-256; tất cả **trùng** `master`:

| Tệp | Hash (máy chủ) |
|---|---|
| `components/GradeBook.js` | `a538e9e311a46167` |
| `app.js` | `62b5aea316d31d74` |
| `utils/firebase.js` | `132a830eef083033` |
| `pages/Quiz.js` | `6e1bc4adbfa93a89` |
| `pages/Reports.js` | `c6e712927565d85f` |
| `pages/Admin.js` | `03909cab34853150` |
| `pages/Directory.js` | `d184682f86629e33` |
| `components/AccountManager.js` | `9bb5c3ecce7a7388` |

Toàn bộ: so 54 tệp `.js`, `.html`, `.css` (không tính thư mục `uploads`; các thư mục giao diện của `master` không có tệp `.json`) giữa máy chủ và `master`: **53 trùng, 1 khác (`index.html`)**. Cách so này lọc theo đuôi tệp nên **chưa chứng minh được không còn tệp chạy ngoài GitHub** (tệp đuôi khác, hoặc tệp có trên máy chủ mà `master` không có, chưa được liệt kê); `deploy.sh` chỉ chép đè, không xóa tệp cũ. `index.html` khác ở hai dòng:

| Máy chủ | `master` |
|---|---|
| `href="v202611180911/style.css"` | `href="style.css"` |
| `src="v202611180911/app.js"` | `src="app.js"` |

Nguyên nhân: `deploy/deploy.sh` (dòng 33) chạy `sed` thay `style.css` và `app.js` bằng đường dẫn có mã phiên bản để trình duyệt tải lại bản mới. Mã phiên bản khớp lần cài 18/11 09:11.

### 4b. Đối chiếu độc lập từ máy Nguyễn Thanh Tùng (qua Internet, 18/11 12:12 UTC)

Máy Tùng không SSH được, nhưng tải được các tệp giao diện công khai qua `https://sutdytask.io.vn` (đi qua Cloudflare, tức đúng bản người dùng nhận). Hash phía repo tính bằng `git show 56c0bb4:<tệp> | sha256sum`.

| Hạng mục | Kết quả |
|---|---|
| 53 tệp `app.js`, `style.css`, `components/*`, `pages/*`, `utils/*` tải từ `/v202611180911/<tệp>` | **53/53 trùng SHA256**, không tệp nào thiếu |
| `index.html` | `28af2405f8b2e19d…`, trùng hash của `index.html` trong `master` sau khi chèn `v202611180911/` như `deploy.sh` làm; bỏ tiền tố này thì trùng `f541ae44dce58203…` của `master` |
| `GET /` | 200, 0,51 giây |
| `GET /api/auth/me` (chưa đăng nhập) | 200, `{"user": null}` |
| `GET /api/quiz/results` (của PR58), `POST /api/exam/x/start` (của [PR63]) | 401: đường dẫn mới đã có, bắt đăng nhập |
| `GET /.git/HEAD`, `/uploads/.env` | 404 |
| `GET /server/studytask_api.py`, `/deploy/deploy.sh`, `/docs/`, `/tests/` | Trả `index.html` của trang (1.511 byte, `text/html`): **không lộ mã nguồn** |

Kết quả này trùng với phần Trương Thanh Vui đo qua SSH ở trên. Không đo được từ ngoài: tệp API (`/opt/studytask`) và tệp thừa trên máy chủ.

## 5. Script cài đặt cũ

Việc 1 yêu cầu "xử lý script cài đặt cũ". Hiện trạng trong `~/migration` trên máy chủ (đọc bằng `ls -la`, không sửa):

| Tệp | Quyền / thời điểm sửa | Nhận xét |
|---|---|---|
| `install-api.sh.CU-KHONG-CHAY` | `-rwxrwxr-x`, 04/11 03:53 | Script cài API bản cũ (dòng đầu ghi lệnh `sudo bash ~/migration/install-api.sh`). **Đã bị đổi tên** nên lệnh theo tên cũ không còn chạy được. Nhưng tệp **vẫn có quyền thực thi** và còn chạy được nếu gọi bằng tên mới |
| `deploy.sh` | `-rwxr-xr-x`, 03/11 08:58 | Script triển khai bản đầu, còn thực thi. Dễ nhầm với `deploy/deploy.sh` hiện hành |
| `fix-nginx.sh` | `-rwxrwxr-x`, 03/11 09:12 | Script sửa nginx bản đầu, còn thực thi |
| `content.py`, `gen_docs.py`, thư mục `gen_html`, `img`, `files-final` | 03–04/11 | Công cụ sinh tài liệu giai đoạn đầu, không phải script cài đặt |

Dịch vụ `studytask-api` hiện chạy `ExecStart=/usr/bin/python3 /opt/studytask/studytask_api.py serve`, **không** trỏ vào `~/migration`. Nghĩa là script cũ không còn nằm trên đường chạy của dịch vụ. Biên bản 12 mục 1 ghi "`~/migration/install-api.sh` không còn" là đúng với tên gốc, nhưng chưa nêu các tệp còn thực thi ở trên.

**Đã xử lý ngày 18/11/2026 12:34 UTC** theo yêu cầu của Trương Thanh Vui. Trước khi đổi, đã kiểm tra không có tham chiếu tới `~/migration/` trong crontab của `studytask`, `/etc/systemd/system`, `/etc/cron.*`, `/usr/local/bin`, `/opt/studytask`. Lệnh chạy (tài khoản `studytask`, không cần `sudo`, chỉ đổi quyền, không xóa hay sửa nội dung):

```bash
cd ~/migration && chmod a-x deploy.sh fix-nginx.sh install-api.sh.CU-KHONG-CHAY
```

Kết quả đọc lại:

| Tệp | Quyền trước | Quyền sau |
|---|---|---|
| `deploy.sh` | `-rwxr-xr-x` | `-rw-r--r--` |
| `fix-nginx.sh` | `-rwxrwxr-x` | `-rw-rw-r--` |
| `install-api.sh.CU-KHONG-CHAY` | `-rwxrwxr-x` | `-rw-rw-r--` |

Từ giờ các tệp này không chạy trực tiếp được (`./deploy.sh` bị từ chối). Tệp vẫn còn để tra cứu, và có thể hoàn tác bằng `chmod +x`. Dịch vụ `studytask-api` không bị ảnh hưởng (không trỏ vào `~/migration`).

## 6. Nhật ký triển khai

`~/deploy-log.txt` có 5 dòng, dòng cuối **10/11/2026 05:32:56 UTC** (commit `6249dee`). Không có dòng nào cho các lần 12/11, 14/11, 17/11 và 18/11. Cần bổ sung một dòng cho mỗi lần (thời điểm, commit, nhánh) để nhật ký khớp bảng ở mục 3. Chưa sửa vì đây là tệp trên máy chủ.

## 7. Việc còn lại

| Việc | Người | Ghi chú |
|---|---|---|
| Đọc và xác nhận biên bản này | Nguyễn Thanh Tùng | Việc 1 là việc của Tùng theo kế hoạch. Đã rà soát bản nháp (mục 9); xác nhận cuối sau khi xong các việc bên dưới |
| Chạy `deploy/kiem-chung-master.sh 56c0bb4` trên máy chủ (chỉ đọc): rà tệp chạy không có trên GitHub, tiến trình API có nạp đúng tệp trên đĩa không, cấu hình `studytask-api.service` và nginx; chụp phần KẾT LUẬN | Trương Thanh Vui (máy Tùng không kết nối được) | Mục 4 |
| Cài lại một lần từ `master` `56c0bb4` bằng `deploy/deploy.sh` (sao lưu trước), chạy lại script trên để có bảng hash "sau" | Trương Thanh Vui | Mục 1, mục 3 |
| Chốt múi giờ mốc 18/11 09:11:41 (`timedatectl`) | Trương Thanh Vui | Mục 3 |
| Bổ sung `~/deploy-log.txt` cho các lần 12/11, 14/11, 17/11, 18/11 | Trương Thanh Vui | Mục 6 |
| ~~Gỡ quyền thực thi ba script cũ trong `~/migration`~~ **Đã làm 18/11 12:34 UTC** | Trương Thanh Vui (Claude Code chạy lệnh) | Mục 5 |
| Đưa biên bản này vào kho GitHub (nhánh riêng, PR, review) để thỏa "có biên bản trong `docs/van-hanh/`" | Nguyễn Thanh Tùng | Đã ở nhánh cục bộ `docs/tuan7-trien-khai-master-18-11`; còn đẩy lên, mở PR, review |
| Cập nhật [báo cáo 13](13-bao-cao-cap-nhat-may-chu-tuan-7.md) việc 1 và [biên bản 12](12-doi-chieu-may-chu-2026-11-17.md): hai tài liệu này vẫn ghi "máy chủ không trùng `master`" (đúng ngày 17/11, đã đổi từ 18/11) | Trương Thanh Vui | |

## 8. Lệnh để đo lại

Từ máy có SSH tới máy chủ, ở thư mục kho (sau `git fetch origin`):

```bash
# API: hash trên máy chủ và trong master
ssh studytask@192.168.2.187 'sha256sum /opt/studytask/studytask_api.py'
git show origin/master:server/studytask_api.py | sha256sum

# Một tệp giao diện
ssh studytask@192.168.2.187 'sha256sum /var/www/studytask/components/GradeBook.js'
git show origin/master:components/GradeBook.js | sha256sum

# Nhật ký triển khai và script cũ
ssh studytask@192.168.2.187 'tail -3 ~/deploy-log.txt; ls -la ~/migration'
```

Script tự động hơn: `deploy/kiem-chung-master.sh` (chạy trên máy chủ, chỉ đọc; so toàn bộ API, cấu hình, giao diện với một commit của `master` tải từ GitHub, liệt kê tệp thừa, kiểm tra dịch vụ và web, in ĐẠT/CHƯA ĐẠT). Mục 16 của `deploy/evidence-check.sh` chỉ in hash của 4 tệp cũ (`Profile.js`, `Graduation.js`…) và không tự so với `master`, nên không đủ cho việc 1.

## 8b. Cài lại từ `master` và kiểm chứng (việc ở mục 7, Trương Thanh Vui chạy)

Nội dung tệp chạy đã trùng `master`, nên lần cài này để **đúng quy trình** (cài từ `master`, không từ nhánh PR), ghi `~/deploy-log.txt` và rà tệp thừa. API khởi động lại vài giây; không nạp lại dữ liệu, CSDL không đổi cấu trúc. Nếu `master` có commit mới trước lúc cài, thay `56c0bb4` bằng commit đó.

1. **Kiểm chứng trước** (bảng hash "trước"): chép [`deploy/kiem-chung-master.sh`](../../deploy/kiem-chung-master.sh) lên máy chủ (`scp`, hoặc `cat > ~/kiem-chung-master.sh` rồi dán, `Ctrl+D`; so `sha256sum` với tệp trong repo), chạy `bash ~/kiem-chung-master.sh 56c0bb4`.
2. **Sao lưu:**
   ```bash
   TS=$(date -u +%Y%m%d-%H%M)
   sudo systemctl start studytask-backup.service && sudo journalctl -u studytask-backup -n 5 --no-pager
   sudo tar czf ~/truoc-trien-khai-$TS.tar.gz /var/www/studytask /opt/studytask \
     /etc/nginx/sites-available/studytask /etc/systemd/system/studytask-api.service
   sha256sum ~/truoc-trien-khai-$TS.tar.gz
   ```
3. **Lấy đúng commit `master`** (không dùng nhánh feature, không dùng `~/deploy-1118`):
   ```bash
   git clone --branch master https://github.com/NguyenThanhTung301020/Nhom-5_Studytask.git ~/deploy-56c0bb4
   cd ~/deploy-56c0bb4 && git checkout --detach 56c0bb4 && git rev-parse HEAD && git status --short
   ```
4. **Cài bằng script chuẩn và ghi nhật ký:**
   ```bash
   cd ~/deploy-56c0bb4 && sudo bash deploy/deploy.sh
   echo "$(date -u '+%F %T') UTC  master $(git rev-parse --short HEAD)  deploy/deploy.sh  (bien ban 14)" >> ~/deploy-log.txt
   ```
5. **Kiểm chứng sau** (bảng hash "sau"): `bash ~/kiem-chung-master.sh 56c0bb4`. Thử tay trên web thật: Bảng điểm, Trắc nghiệm, Báo cáo, Lịch theo vai trò, Phòng thi; không tạo dữ liệu thật mới.

**Quay lại nếu lỗi:** `sudo tar xzf ~/truoc-trien-khai-$TS.tar.gz -C /` rồi `sudo systemctl restart studytask-api && sudo systemctl reload nginx`.

**Kết quả sau khi cài (điền sau):**

| Mục | Kết quả |
|---|---|
| Người chạy, thời điểm (UTC) | `[điền]` |
| Bản sao lưu chuẩn, gói `truoc-trien-khai-*.tar.gz` và SHA256 | `[điền]` |
| `git rev-parse HEAD` trong `~/deploy-56c0bb4` | `[điền]` |
| Phiên bản giao diện mới `v…` | `[điền]` |
| `kiem-chung-master.sh` trước cài: tệp báo cáo, kết luận | `[điền]` |
| `kiem-chung-master.sh` sau cài: tệp báo cáo, kết luận | `[điền]` (phải ĐẠT) |
| Thử tay trên web thật | `[điền]` |
| Dòng mới trong `~/deploy-log.txt` | `[điền]` |

Ảnh minh chứng lưu `bang-chung/2026-11-18/anh/` (thấy rõ giờ và `studytask@…`): phần KẾT LUẬN của hai lần chạy script. Chép hai tệp `~/health-logs/kiem-chung-master-*.txt` và `.sha256` về `bang-chung/2026-11-18/`.

## 9. Rà soát của Nguyễn Thanh Tùng (18/11, Claude Code hỗ trợ đối chiếu)

Đối chiếu từng số liệu của bản nháp với kho (`git log`, `git merge-base`, `git show`) và với biên bản 08, 12. Đúng: 5 commit gộp và ngày gộp ở mục 2, hash API và 8 tệp ở mục 4, dòng 33 của `deploy.sh`, commit `6249dee` ở mục 6, phiên bản `v202611170853` và commit `68e0d47` ở mục 3. Đã sửa:

| Chỗ | Bản nháp ghi | Sửa thành | Căn cứ |
|---|---|---|---|
| Đầu biên bản | "Tùng không có quyền truy cập máy chủ" | Máy Tùng không kết nối được (SSH hết thời gian chờ), nên nhờ Vui kết nối giùm; thêm mục 0 phân công | Kết quả SSH 18/11 12:12 UTC |
| Mục 1 | "Việc 1 đạt" | Đạt về kết quả; về quy trình, lần cài 18/11 lấy từ nhánh PR trước khi gộp | Biên bản 08 mục 4b; giờ gộp [PR63] |
| Mục 3, dòng 14/11 | "Cài lại từ `master` tại `b9e2663`" | Kèm 4 tệp ảnh đại diện chưa commit, không thuần `master` | Biên bản 12 mục 2 |
| Mục 3, dòng 18/11 | Ghi 09:11:41 là UTC, không nhận xét | Thêm ghi chú mâu thuẫn giờ với biên bản 08 và commit `c78682d`, cần chốt | `git log c78682d` |
| Mục 4 | Có `.json`; ngầm coi là đã so toàn bộ | Bỏ `.json` (không có trong thư mục giao diện); nêu giới hạn lọc theo đuôi, chưa rà tệp thừa | `git ls-tree 56c0bb4` |
| Mục 8 | Gợi ý `evidence-check.sh` | Gợi ý `kiem-chung-master.sh` | Nội dung mục 16 của `evidence-check.sh` |

Phần AI: các lệnh đo và bản nháp do Claude Code tạo (trên máy Vui cho mục 2–6, trên máy Tùng cho mục 0, 4b, 9). Khi đưa vào kho, commit cần gắn nhãn `[AI]` và dòng `Co-Authored-By` theo quy ước của nhóm.

[PR50]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/50
[PR51]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/51
[PR52]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/52
[PR54]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/54
[PR56]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/56
[PR63]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/63
