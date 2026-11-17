# Biên bản đối chiếu máy chủ ngày 17/11/2026 (việc của tuần 7)

Thuộc kế hoạch **tuần 7** (16/11 – 21/11/2026) nêu ở Phần 6 của [báo cáo tuần 6](../bao-cao-tuan/tuan-06.md): các việc 1, 3, 5, 14 của nhóm A/B, liên quan đến máy chủ.

- Mục đích: ghi lại hiện trạng thật của máy chủ để bổ sung minh chứng cho các việc của kế hoạch tuần 7 đã làm nhưng chưa được ghi (việc 1 triển khai lại từ `master`, việc 5 cập nhật gói hệ điều hành, việc 14 điều tra mã 403, việc 3 chép sao lưu ra ổ ngoài) và để xác định việc còn lại.
- Thời điểm đo: 17/11/2026 04:11 UTC (11:11 giờ Việt Nam).
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

## 3. Cập nhật gói hệ điều hành và khởi động lại (việc 5 tuần 7)

| Mục | Kết quả |
|---|---|
| `apt upgrade -y` | Chạy ngày 13/11/2026 01:43:45 UTC (`/var/log/apt/history.log`); trước đó 06/11 07:14 UTC và `unattended-upgrade` 10/11 06:06 UTC |
| Khởi động lại | 13/11/2026 01:49:23 UTC (`journalctl --list-boots`); lần khởi động trước kéo dài từ 04/11 06:19 UTC đến 13/11 01:49 UTC |
| Gói còn chờ | 5 (`distro-info`, `python3-distro-info`, `python3-software-properties`, `snapd`, `software-properties-common`), trước đó 18 |
| Cần khởi động lại | Không (`/var/run/reboot-required` không tồn tại) |

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
| Xác nhận ai, lúc nào, cách nào đã triển khai ngày 14/11; bổ sung vào `~/deploy-log.txt` | Trương Thanh Vui | Mục 2 |
| Đưa phần ảnh đại diện lên GitHub qua PR | Trương Thanh Vui | Mục 2 |
| Triển khai lại từ `master` mới (có [PR58]) và so hash | Trương Thanh Vui | Sửa lỗi `GradeBook.js` trên web thật |
| Chạy `sudo smartctl -t long /dev/sda`, ghi kết quả | Trương Thanh Vui | Cần `sudo`, chưa làm được từ biên bản này |
| ~~Chép bản sao lưu mới nhất ra ổ ngoài~~ **Đã chép 17/11 06:12 UTC**; còn rút ổ, đặt lịch chép tiếp, Thanh Tùng xác nhận ([biên bản 09](09-bien-ban-sao-luu-ra-o-ngoai-2026-11-11.md) mục 6) | Trương Thanh Vui | Ngày rút ổ và lịch chép còn để trống trong biên bản 09 |
| Mốc T+15 (21/11): `scripts/van-hanh/thu-bang-chung.ps1 -Moc T15` | Trương Thanh Vui | [Hướng dẫn](03-huong-dan-kiem-tra-may-chu.md) |

[PR50]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/50
[PR51]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/51
[PR52]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/52
[PR54]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/54
[PR56]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/56
[PR58]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/58
