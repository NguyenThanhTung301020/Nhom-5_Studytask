# Biên bản đối chiếu máy chủ ngày 17/11/2026 (việc của tuần 7)

Thuộc kế hoạch **tuần 7** (16/11 – 21/11/2026) nêu ở Phần 6 của [báo cáo tuần 6](../bao-cao-tuan/tuan-06.md): các việc 1, 3, 5, 14 của nhóm A/B, liên quan đến máy chủ.

- Mục đích: ghi lại hiện trạng thật của máy chủ để bổ sung minh chứng cho các việc của kế hoạch tuần 7 đã làm nhưng chưa được ghi (việc 1 triển khai lại từ `master`, việc 5 cập nhật gói hệ điều hành, việc 14 điều tra mã 403, việc 3 chép sao lưu ra ổ ngoài) và để xác định việc còn lại.
- Thời điểm đo: 17/11/2026 04:11 UTC (11:11 giờ Việt Nam). **Mục 2 phản ánh máy chủ lúc 04:11 UTC, trước lần triển khai cuối ngày 17/11**; mục 2b đo lại sau triển khai (09:17 UTC) và thay cho các kết luận "chưa có PR58" và "ảnh đại diện chưa có trên GitHub" của mục 2.
- Cách đo: Claude Code (AI) chạy các lệnh **chỉ đọc** qua SSH (`studytask@192.168.2.187`) theo yêu cầu và với địa chỉ do Trương Thanh Vui cung cấp. Không dùng `sudo`, không sửa tệp hay dịch vụ nào. Hash so với `master` bằng `git show <commit>:<tệp> | sha256sum`.
- **Cần Trương Thanh Vui xác nhận:** ai đã triển khai, bằng cách nào, vào lúc nào (mục 2). Biên bản chỉ ghi những gì đọc được từ máy chủ, không suy đoán thao tác.

## 1. Dịch vụ

| Mục | Kết quả |
|---|---|
| `studytask-api`, `nginx`, `cloudflared` | Cả ba `active` |
| Thời gian chạy liên tục | 4 ngày 2 giờ (từ lần khởi động 13/11/2026 01:49 UTC) |
| Script cài đặt cũ `~/migration/install-api.sh` | **Không còn** |
| Cơ sở dữ liệu (chỉ đọc) | `accounts` 2.051, `docs` 4.314, `sessions` 16; `studytask.db` 4,1 MB + WAL 5,2 MB |

## 2. Phiên bản đang chạy so với GitHub (việc 1 tuần 7)

| Tệp trên máy chủ | Hash (16 ký tự đầu) | Trùng với |
|---|---|---|
| `/opt/studytask/studytask_api.py` | `f6dc8933d4a0942f` | `master` tại `b9e2663` (gộp [PR56], 13/11 21:13) |
| `app.js` | `970b226f8c99afdc` | `b9e2663` |
| `components/GradeBook.js` | `1c868eca2fcd3993` | `b9e2663` |
| `utils/firebase.js` | `4e6f6316175f801d` | `b9e2663` |
| `pages/Quiz.js` | `ace7cbdd20b84676` | `b9e2663` |
| `pages/Reports.js`, `pages/Admin.js`, `pages/Directory.js`, `components/AccountManager.js` | `dc6e113d…`, `6454d5fc…`, `48f94f1d…`, `9bb5c3ec…` | **Không trùng `b9e2663`**; trùng với bản đang sửa chưa commit trên máy cá nhân (thêm ảnh đại diện `UserAvatar`) |

Thời điểm cài, đọc từ máy chủ: API khởi động lúc **14/11/2026 02:51:03 UTC** (tệp `studytask_api.py` ghi 02:51); `app.js` ghi 14/11 01:44 UTC, `pages/Reports.js` ghi 14/11 02:38 UTC.

**Kết luận:**
- Việc 1 của kế hoạch tuần 7 ("triển khai lại từ `master`, gồm [PR50], [PR51], [PR52], [PR54], [PR56]"; kế hoạch ghi Nguyễn Thanh Tùng phụ trách) **đã được thực hiện** vào khoảng 14/11: API và các tệp giao diện chính khớp `b9e2663`. Báo cáo tuần 6 (số liệu đến 13/11) và mục 8.4a của báo cáo vận hành còn ghi "máy chủ không chạy đúng `master`"; mục đó đúng ở thời điểm đo 13/11, không còn đúng từ 14/11. Người thực hiện cần Trương Thanh Vui xác nhận (đầu biên bản).
- **Vẫn chưa khớp hoàn toàn với `master` hiện tại (`cd2ab09`)** vì hai lý do:
  1. Thiếu [PR58] (gộp 16/11): endpoint `GET /api/quiz/results`, giao diện Bảng điểm đọc điểm từ `quizResults` và sửa `GradeBook.js` thiếu tham số `user`. Máy chủ vẫn chạy bản `GradeBook.js` cũ; bản này gây `ReferenceError: user is not defined` khi dựng (đã tái hiện: chạy hàm component với bản `b9e2663` báo lỗi, với bản của [PR58] không lỗi). **Nên triển khai lại để sửa lỗi này.**
  2. Bốn tệp giao diện về ảnh đại diện đang chạy trên máy chủ nhưng **chưa có trên GitHub**. Cần đưa lên bằng PR (kèm `scripts/assign_avatars.py`, `scripts/prepare_avatars.ps1`, `tests/server/test_assign_avatars.py`) để bản đang chạy có thể dựng lại từ repo.
- `~/deploy-log.txt` chỉ có 5 dòng, dòng cuối ngày 10/11 05:32 UTC; các lần triển khai 12/11 và 14/11 **không được ghi vào đây**. Cần Thanh Vui bổ sung một dòng cho mỗi lần (commit, nhánh, thời điểm).

### 2b. Đo lại sau triển khai ngày 17/11 (09:17 UTC)

Trong ngày 17/11, sau khi chạy `smartctl -t long` và quét chọn lọc, Trương Thanh Vui đã nạp lại dữ liệu và cài lại API, giao diện từ nhánh `feat/ngoai-ke-hoach-hoc-phan-mo-tkb-tuan` (commit `68e0d47`, [PR61], **đang mở, chưa gộp vào `master`**). Chi tiết thao tác ở [biên bản 08 của phần ngoài kế hoạch](../ngoai-ke-hoach/du-lieu-lop-hoc/08-bien-ban-trien-khai-14-11-va-17-11.md). Đo lại bằng SSH chỉ đọc, so hash với `git show 68e0d47:<tệp>`:

| Tệp trên máy chủ | Hash (16 ký tự đầu) | Trùng với `68e0d47` |
|---|---|---|
| `/opt/studytask/studytask_api.py` | `e347e9426b5395ba` | Trùng |
| `components/GradeBook.js` | `a538e9e311a46167` | Trùng |
| `app.js` | `5661161ce94f85df` | Trùng |
| `pages/Reports.js` | `c6e712927565d85f` | Trùng |
| `pages/Admin.js` | `03909cab34853150` | Trùng |
| `pages/Directory.js` | `d184682f86629e33` | Trùng |
| `components/AccountManager.js` | `9bb5c3ecce7a7388` | Trùng |

Kết luận sau triển khai:
- **Lỗi `GradeBook.js` thiếu tham số `user` đã được sửa trên web thật:** nhánh `68e0d47` chứa commit `25bc2bc` của [PR58] (kiểm tra bằng `git merge-base --is-ancestor`), và hash `GradeBook.js` trên máy chủ trùng nhánh này. Chưa thử tay Bảng điểm trên web thật.
- **Bốn tệp ảnh đại diện đã có trên GitHub, nhưng chỉ ở nhánh của [PR61]**, chưa có trên `master`. Máy chủ chạy bản chưa gộp: nếu triển khai lại từ `master` trước khi gộp [PR61] thì mất các thay đổi này (biên bản 08 mục 5 cũng nêu).
- Dữ liệu trên máy chủ đã đổi so với đo ban đầu của biên bản này (mục 1 ghi 2.051 tài khoản): theo biên bản 08, sau khi nạp lại còn 982 sinh viên, 44 giáo viên, 148 học phần mở. Chưa đo lại bằng script sức khỏe ở mốc này.
- **`~/deploy-log.txt` vẫn dừng ở 10/11 05:32 UTC**, nghĩa là cả các lần 12/11, 14/11 và 17/11 đều chưa được ghi vào đây.
- Bản sao lưu trên ổ G (chép 17/11 06:12 UTC, [biên bản 09](09-bien-ban-sao-luu-ra-o-ngoai-2026-11-11.md) mục 6) là **trước lần nạp lại dữ liệu**. Bản trước khi nạp còn ở `~/loadtest/backup-truoc-nap-tiet-tuan-2026-11-17.db` trên chính ổ máy chủ.

## 3. Cập nhật gói hệ điều hành và khởi động lại (việc 5 tuần 7)

| Mục | Kết quả |
|---|---|
| `apt upgrade -y` | Chạy ngày 13/11/2026 01:43:45 UTC (`/var/log/apt/history.log`); trước đó 06/11 07:14 UTC và `unattended-upgrade` 10/11 06:06 UTC |
| Khởi động lại | 13/11/2026 01:49:23 UTC (`journalctl --list-boots`); lần khởi động trước kéo dài từ 04/11 06:19 UTC đến 13/11 01:49 UTC |
| Gói còn chờ | 5 (`distro-info`, `python3-distro-info`, `python3-software-properties`, `snapd`, `software-properties-common`), trước đó 18 |
| Cần khởi động lại | Không (`/var/run/reboot-required` không tồn tại) |

**Kiểm tra lại ngày 17/11 06:29 UTC (chỉ đọc, SSH):**

| Mục | Kết quả |
|---|---|
| Hệ điều hành / nhân | Ubuntu 26.04.1 LTS; nhân đang chạy `7.0.0-43-generic`, trùng nhân mới nhất đã cài (`/boot/vmlinuz-7.0.0-43-generic`) |
| Danh sách gói làm mới lần cuối | 16/11/2026 06:55 UTC (`update-success-stamp`) |
| 5 gói còn chờ | Đều thuộc kênh `resolute-updates` (không phải `resolute-security`): `distro-info` 1.15 → 1.15ubuntu0.1, `python3-distro-info` (cùng bản), `python3-software-properties` và `software-properties-common` 0.120.1 → 0.120.2, `snapd` 2.77.1 → 2.78 |
| Cập nhật bảo mật tự động | `unattended-upgrades` bật và đang chạy; lần chạy 17/11 06:01 UTC ghi "No packages found that can be upgraded unattended": **không còn gói bảo mật chờ** |
| Mô phỏng `apt-get -s upgrade` | `0 upgraded … 5 not upgraded`: lệnh `apt upgrade` thông thường chưa nâng cấp 5 gói này. **Lý do đã xác nhận (xem bên dưới): Ubuntu đang phát hành các bản này theo đợt (phased updates)** |
| Cần khởi động lại | Không |
| Phiên bản thành phần | Python 3.14.4, nginx 1.28.3, cloudflared 2026.11.0 (bản dựng 12/11/2026) |

Kết luận về bảo mật: **không còn bản vá bảo mật nào chưa cài**; 5 gói còn lại là cập nhật thường, không ảnh hưởng ba dịch vụ của StudyTask.

**Chạy `sudo apt upgrade` ngày 17/11/2026 (Trương Thanh Vui chạy trên máy chủ; ghi lại từ `/var/log/apt/history.log`, kiểm tra lại lúc 06:32 UTC):**

| Mục | Kết quả |
|---|---|
| Lần chạy | 17/11/2026 06:31:13–06:31:23 UTC, lệnh `apt upgrade` |
| Gói đã nâng | 1: `sos` 4.11.2-0ubuntu0.1 → 4.11.2-0ubuntu0.2 (xuất hiện sau khi làm mới danh sách lúc 06:30:53 UTC) |
| Gói còn chờ | 5, vẫn như trên |
| Nguyên nhân 5 gói chưa nâng | `apt-cache policy` ghi **"phased 30%"** cho `snapd` 2.78 và **"phased 40%"** cho `distro-info` 1.15ubuntu0.1 và `software-properties-common` 0.120.2 (`python3-distro-info`, `python3-software-properties` đi cùng bản). Ubuntu chỉ đưa các bản này tới một phần máy mỗi đợt; máy này chưa nằm trong phần đó, nên `apt upgrade` bỏ qua. Không phải lỗi, sẽ tự được nâng khi tỷ lệ tăng |
| Cần khởi động lại | Không (`/var/run/reboot-required` không tồn tại); nhân đang chạy `7.0.0-43` |
| Dịch vụ sau khi nâng cấp | `studytask-api`, `nginx`, `cloudflared` đều `active`; API vẫn chạy từ 14/11 02:51:03 UTC (không bị khởi động lại); `https://sutdytask.io.vn/` trả HTTP 200 trong 0,22 giây; `/api/auth/me` nội bộ trả `{"user": null}`; không có lỗi mức `err` của nhân trong 1 giờ qua |

Kết luận: việc "cập nhật 18 gói và khởi động lại" **đã làm** ngày 13/11, sau khi đo T+7 (01:19 UTC) không lâu. Ghi chú: lần khởi động lại này xảy ra sau mốc đo T+7 nên không nằm trong số liệu T+7.

## 4. Sao lưu tự động

- 12 bản (06/11 06:34 UTC đến **16/11 20:05 UTC**); `backup.log` đều `OK` ngày 14, 15, 16/11.
- Bản mới nhất: `csdl_bytes: 4268032`, 2.366 tệp tải lên, 157 MB. Ổ `/mnt/backup`: 177 MB / 98 GB.
- Bản sao lưu nằm cùng ổ vật lý với máy chủ. Lúc đo (04:11 UTC) chưa chép ra ổ ngoài; **đã chép ra ổ G lúc 06:12 UTC cùng ngày**, 12 bản, trùng SHA256 8.362/8.362 tệp (xem [biên bản 09](09-bien-ban-sao-luu-ra-o-ngoai-2026-11-11.md) mục 6).

## 5. Điều tra mã 403 (việc 14 tuần 7)

Nguồn: `journalctl -u studytask-api` và `/var/log/nginx/access.log*` (cả tệp nén), lọc mã 403.

**17 mã 403 ở API trong cửa sổ T+7 (06–13/11):**

| Ngày | Số lượng | Nguồn (cột User-Agent trong nginx) | Giải thích |
|---|---|---|---|
| 09/11 12:12 UTC | 3 `GET sharedData/global` + 11 `PUT userData/<id>` | Trình duyệt Windows, referer `sutdytask.io.vn` | Ba đợt trong 28 giây (12:12:00, :17, :28), mỗi đợt 1 `GET` và 3–4 `PUT` trong cùng một giây: đúng dạng một **tab trình duyệt không còn phiên hợp lệ** tải dữ liệu rồi tự lưu |
| 10/11 | 3 `GET sharedData/global` | `curl`, `StudyTask-smoke/1.0` | Script kiểm thử động `smoke_live.py` kiểm tra người chưa đăng nhập bị từ chối: **đúng thiết kế** |
| 13/11 13:51 UTC | 1 `GET sharedData/global` | `StudyTask-smoke/1.0` | Như trên (sau mốc đo T+7) |

Vì sao là 403 mà không phải 401: tuyến `/api/doc/*` không bắt đăng nhập trước; khi không có phiên, hàm `can()` trả "không được phép" nên kết quả là `403`. Kết luận: 17 mã 403 **không phải dò quét**: 14 (3 `GET` và 11 `PUT`) là một tab trình duyệt mất phiên ngày 09/11, 3 `GET` là kiểm thử của nhóm ngày 10/11. Không có tác động tới dữ liệu.

**Chưa xác định:** tab nào, tài khoản nào, và vì sao phiên mất ngày 09/11 12:12 UTC (nhật ký không ghi người dùng). Khuyến nghị (chưa làm): đổi tuyến `/api/doc/*` trả `401` khi chưa đăng nhập để dễ phân biệt hết phiên với thiếu quyền.

**403 của nginx ở `/uploads/`:**

| Thời điểm | Yêu cầu | Giải thích |
|---|---|---|
| 03–04/11 | `curl` và trình duyệt vào `/uploads/…` | Thư mục `uploads` quyền 750 (xem [V-17](../ngoai-ke-hoach/du-lieu-lop-hoc/03-van-de-logic-phat-sinh.md)) |
| 09/11 19:42 UTC và 12/11 04:43 UTC | `GET /uploads/.env` từ Linux (Chrome, X11) | **Dò quét từ bên ngoài**, không phải của nhóm. Lúc đó trả 403 vì lỗi quyền 750, không phải do chặn chủ động |
| 12/11 07:08 UTC | `curl` vào tệp PDF, ảnh trong `/uploads/` | Phát hiện lỗi quyền 750, sửa bằng `chmod 755` cùng ngày; `deploy/deploy.sh` đã có lệnh này |

Sau khi sửa quyền, `/uploads/.env` trả 404 (tệp không tồn tại): quy tắc `location ^~ /uploads/` ưu tiên hơn quy tắc chặn tệp ẩn, nhưng tên tệp tải lên luôn bắt đầu bằng chuỗi ngẫu nhiên (`server/studytask_api.py`: `secrets.token_hex`), nên không có tệp ẩn nào trong thư mục này để lộ.

**403 ngày 16–17/11 (sau mốc T+7), ghi nhận để theo dõi:** 16/11 (4 `PUT userData`, 8 `GET userData/<id>`, 1 `GET sharedData/global`, 2 `PUT sharedData/global`, 1 `GET quiz/<n>/archive`) và 17/11 03:48–04:08 UTC (`GET quizKeys`, `PUT quizResults/<n>_x`, `POST quiz/<n>/submit`, `GET quiz/<n>/results`). Cụm ngày 17/11 là các thao tác thử quyền lên khóa đáp án và kết quả trắc nghiệm (tên `…_x` không phải mã thật) bị từ chối đúng; **cần người thực hiện xác nhận đó là kiểm thử của nhóm**.

## 6. Đính chính số liệu báo cáo T+7

Mục 8.4a của báo cáo vận hành ghi "CSDL 126 MB, bản sao lưu 120 MB". Đo lại: dòng `dung_luong_du_lieu: 126M` trong [health-check-T7.txt](bang-chung/2026-11-13/health-check-T7.txt) là **cả thư mục dữ liệu** (phần lớn là `uploads`, nay 153 MB); riêng cơ sở dữ liệu cùng WAL là 9.975 KB (cùng tệp, dòng `db+wal`), nay `studytask.db` 4,1 MB. Bản sao lưu 16/11 có `csdl_bytes` 4,27 MB. Số "126 MB" không phải kích thước CSDL.

## 7. Việc còn lại sau biên bản này

| Việc | Người | Ghi chú |
|---|---|---|
| Bổ sung `~/deploy-log.txt` cho các lần triển khai 12/11, 14/11 và 17/11 (commit, nhánh, thời điểm) | Trương Thanh Vui | Mục 2b |
| ~~Đưa phần ảnh đại diện lên GitHub qua PR~~ **Đã có ở [PR61]** (mở, chưa Approve, chưa gộp); cần review rồi gộp | Trương Thanh Vui, người review | Mục 2b |
| ~~Triển khai lại để sửa `GradeBook.js`~~ **Đã triển khai 17/11 từ nhánh [PR61]** (có [PR58]); cần thử tay Bảng điểm trên web thật | Trương Thanh Vui | Mục 2b |
| ~~Chạy `sudo smartctl -t long /dev/sda`~~ **Đã chạy 17/11**: dừng sớm, `read failure` tại LBA 705216; quét chọn lọc lỗi tại 705217 ([báo cáo 01](01-bao-cao-suc-khoe-may-chu.md) mục 8.4c) | Trương Thanh Vui | Nhóm cần ghi quyết định về ổ |
| ~~Chép bản sao lưu mới nhất ra ổ ngoài~~ **Đã chép 17/11 06:12 UTC**; còn rút ổ, đặt lịch chép tiếp, Thanh Tùng xác nhận ([biên bản 09](09-bien-ban-sao-luu-ra-o-ngoai-2026-11-11.md) mục 6) | Trương Thanh Vui | Ngày rút ổ và lịch chép còn để trống trong biên bản 09 |
| Mốc T+15 (21/11): `scripts/van-hanh/thu-bang-chung.ps1 -Moc T15` | Trương Thanh Vui | [Hướng dẫn](03-huong-dan-kiem-tra-may-chu.md) |

[PR50]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/50
[PR51]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/51
[PR52]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/52
[PR54]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/54
[PR56]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/56
[PR58]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/58
[PR61]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/61
