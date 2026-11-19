# Sửa lỗi 05 – Hoàn thiện `unlink_email`: gỡ email là một giao dịch, lỗi ở bước nào cũng hoàn tác trọn

Ngày: 19/11/2026. Có AI tham gia đọc mã, viết kiểm thử và sửa (thay đổi có nhãn `[AI]`).
Liên kết: [PR50](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/50) · tài liệu trước: [04 – PR50 và việc tuần 7](04-pr50-giao-vien-sua-mon-va-viec-tuan7.md), mục 2 (việc 12) · mã ban đầu của việc 12 vào `master` qua [PR58](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/58).

> Ghi chú: PR50 (nhánh `fix/r1-giao-vien-ghi-de-danh-sach-mon`, gộp 11/11) sửa lỗi R1 giáo viên sửa môn; bản thân PR50 không đụng tới `unlink_email`. Việc 12 tuần 7 được ghi chung vào tài liệu 04 "cho PR50", nên tài liệu này tiếp nối tài liệu 04 và cũng gắn với PR50.

## 1. Mục tiêu của chức năng

`DELETE /api/account/email` (thẻ "Email cá nhân" trong Cài đặt, nút **Gỡ liên kết**) gỡ email cá nhân dùng để đặt lại mật khẩu. Gỡ email gồm hai việc phải đi cùng nhau:

1. Xóa dòng `contact_email` của tài khoản.
2. Hủy mã đặt lại mật khẩu đang chờ (`codes`, `purpose='reset'`), vì mã đó chỉ có giá trị khi email còn liên kết ([sửa lỗi 02](02-hai-loi-email-ca-nhan.md), lỗi 2).

Yêu cầu: thành công thì cả hai cùng xảy ra; lỗi thì **không** xảy ra việc nào, dữ liệu liên kết cũ còn nguyên, người dùng nhận lỗi rõ ràng, máy chủ ghi log để truy vết, và không lộ thông tin nhạy cảm.

## 2. Hiện trạng ban đầu (sau PR58)

`unlink_email` đã có `BEGIN IMMEDIATE … COMMIT` và `ROLLBACK` khi lỗi ở hai câu `DELETE`. Bộ `tests/server/test_email_codes.py` có 5 ca cho giao dịch (lỗi ở câu thứ hai). Rà mã và viết thêm kiểm thử thì thấy còn các thiếu sót sau:

| # | Thiếu sót | Hậu quả |
|---|---|---|
| T1 | `ROLLBACK` không được bảo vệ: nếu chính `ROLLBACK` lỗi (ví dụ lỗi đĩa sau khi `COMMIT` lỗi) thì kết nối SQLite dùng chung vẫn còn trong giao dịch | Mọi thao tác ghi sau đó (đăng nhập, liên kết email, lưu dữ liệu…) báo `cannot start a transaction within a transaction` cho tới khi khởi động lại API – đúng lỗi việc 12 định sửa, chỉ là đi đường khác |
| T2 | `BEGIN IMMEDIATE` nằm ngoài `try` | CSDL đang bị khóa (sao lưu, lệnh `create-user` chạy cùng lúc) trả `500 Lỗi máy chủ.` chung chung, không có log riêng |
| T3 | Lỗi CSDL trả `500 internal` "Lỗi máy chủ." | Người dùng không biết email còn hay mất; không phân biệt lỗi tạm thời (thử lại được) với lỗi khác |
| T4 | Không có log riêng | Log chỉ có `ERROR <ngoại lệ>` từ bộ xử lý chung, không biết hỏng ở bước nào, đã hoàn tác hay chưa |
| T5 | Gỡ khi **chưa liên kết** hoặc **đã gỡ** vẫn trả `200 {"ok": true}` | Tab/thiết bị khác còn hiện email cũ, bấm gỡ lại báo "Đã gỡ email cá nhân." dù không có gì để gỡ |

Phần quyền đã đúng từ trước (chỉ gỡ được email của chính phiên đăng nhập, phải nhập đúng mật khẩu, chặn yêu cầu khác nguồn gốc); tài liệu này bổ sung kiểm thử cho phần đó.

## 3. Quy trình xử lý giao dịch sau khi sửa

Toàn bộ chạy dưới khóa `_lock` (bộ định tuyến cũng giữ khóa này), nên không có yêu cầu nào khác chen vào kết nối dùng chung giữa `BEGIN` và `COMMIT`.

```
endpoint DELETE /api/account/email
  ├─ chưa đăng nhập ............................ 401 unauthenticated
  ├─ Origin khác trang ......................... 403 bad-origin
  ├─ sai mật khẩu .............................. 401 auth/wrong-password
  └─ unlink_email(uid của chính phiên)
       bước bat-dau        BEGIN IMMEDIATE
       bước xoa-email      DELETE contact_email WHERE uid
                           └─ 0 dòng → ROLLBACK → 409 email-not-linked (không đổi gì)
       bước xoa-ma-dat-lai DELETE codes WHERE purpose='reset' AND uid
       bước commit         COMMIT → 200 {"ok": true}

       lỗi ở bất kỳ bước nào:
         ├─ còn trong giao dịch → ROLLBACK
         │     └─ ROLLBACK lỗi → bỏ kết nối dùng chung (drop_db_connection):
         │                       đóng kết nối = SQLite tự hoàn tác; db() lần sau mở kết nối mới
         ├─ log: UNLINK-EMAIL-ROLLBACK uid=<8 ký tự đầu> buoc=<bước> loi=<tên lớp lỗi> hoan-tac=<ok|khong-can|loi(...)>
         └─ ApiError email-unlink-failed: 503 nếu lỗi tạm thời (OperationalError, ví dụ CSDL bị khóa), còn lại 500
```

### 3.1. Commit

Chỉ có một `COMMIT`, sau khi cả hai câu `DELETE` thành công. Không có thao tác nào tự commit giữa chừng (kết nối mở với `isolation_level=None`, giao dịch do mã điều khiển tường minh).

### 3.2. Rollback

- Lỗi ở `BEGIN`: chưa có giao dịch, không cần hoàn tác (`hoan-tac=khong-can`).
- Lỗi ở `DELETE` hoặc `COMMIT`: `ROLLBACK` (`hoan-tac=ok`). Với SQLite, `COMMIT` lỗi (ví dụ khóa ngoại trì hoãn) giữ nguyên giao dịch đang mở nên vẫn hoàn tác được.
- `ROLLBACK` cũng lỗi: không giữ kết nối hỏng. `drop_db_connection` đóng kết nối (SQLite hoàn tác giao dịch dở khi đóng) và đặt `_db = None`; lời gọi `db()` kế tiếp mở kết nối mới, nên các chức năng khác không bị treo.
- Lỗi gốc được gắn vào `ApiError` (`raise … from e`) để không mất dấu khi gỡ lỗi.

### 3.3. Thông báo lỗi và log không lộ thông tin

- Người dùng chỉ nhận mã `email-unlink-failed` và câu "Không gỡ được email cá nhân do lỗi máy chủ. Email cá nhân của bạn vẫn được giữ nguyên, hãy thử lại sau." Không có câu SQL, tên bảng, nội dung lỗi SQLite hay email.
- Log chỉ ghi 8 ký tự đầu của `uid` (mã ngẫu nhiên nội bộ), tên bước, **tên lớp** lỗi (không ghi thông điệp lỗi) và kết quả hoàn tác. Không ghi email, mật khẩu, mã xác nhận.

### 3.4. Giao diện

`components/AccountCards.js`: khi máy chủ trả `email-not-linked` (email đã được gỡ ở tab/thiết bị khác), thẻ tải lại trạng thái để không còn hiện email cũ, đồng thời vẫn hiện thông báo lỗi. Các nhánh khác giữ nguyên.

Không đổi cấu trúc CSDL. Không đụng tới `link_email`, luồng xác minh email, quên/đặt lại mật khẩu.

## 4. Các tình huống phát sinh lỗi

| Tình huống | Kết quả trả về | Dữ liệu sau đó | Log |
|---|---|---|---|
| Chưa đăng nhập | 401 `unauthenticated` | Không đổi | – |
| Sai mật khẩu / dùng mật khẩu người khác trên phiên của mình | 401 `auth/wrong-password` | Không đổi | – |
| Yêu cầu từ trang khác nguồn gốc | 403 `bad-origin` | Không đổi | – |
| Email chưa liên kết | 409 `email-not-linked` | Không đổi | – |
| Email đã được gỡ trước đó (gỡ lần 2) | 409 `email-not-linked` | Không đổi | – |
| CSDL đang bị khóa khi `BEGIN` | 503 `email-unlink-failed` | Không đổi | `buoc=bat-dau … hoan-tac=khong-can` |
| Lỗi CSDL khi xóa email | 500 `email-unlink-failed` | Không đổi | `buoc=xoa-email … hoan-tac=ok` |
| Lỗi CSDL khi xóa mã đặt lại (bước 1 đã chạy) | 500 `email-unlink-failed` | Không đổi (bước 1 được hoàn tác) | `buoc=xoa-ma-dat-lai … hoan-tac=ok` |
| Lỗi tại `COMMIT` | 500 `email-unlink-failed` | Không đổi | `buoc=commit … hoan-tac=ok` |
| `COMMIT` lỗi và `ROLLBACK` cũng lỗi | 500 `email-unlink-failed` | Không đổi (đóng kết nối đã hoàn tác) | `hoan-tac=loi(...)` và `UNLINK-EMAIL-DONG-KET-NOI` |

## 5. Danh sách ca kiểm thử và kết quả

Tệp mới `tests/server/test_unlink_email.py` (thêm vào CI, bước ngay sau `test_email_codes.py`). Toàn bộ chạy trên thư mục dữ liệu tạm (`tempfile.mkdtemp()`), tài khoản `ulka/ulkb/ulkc` và email `@example.com` tạo mới, bị xóa khi kết thúc; `STUDYTASK_MAIL_DEBUG=1` nên không gửi thư thật. Lỗi CSDL được tạo bằng trigger / bảng khóa ngoại **chỉ trên CSDL tạm**. Mỗi ca kiểm tra **cả kết quả trả về lẫn trạng thái dữ liệu** (so toàn bộ bảng `contact_email`, `codes`, `accounts`, hồ sơ `user` trước và sau).

Phần A – qua HTTP trên API tạm (cổng 8806):

| Nhóm | Ca | Mã cũ | Mã mới |
|---|---|---|---|
| Quyền | Chưa đăng nhập → 401; dữ liệu không đổi | PASS | PASS |
| Quyền | Sai mật khẩu → 401; email và mã đặt lại còn nguyên | PASS | PASS |
| Quyền | Khác nguồn gốc → 403; dữ liệu không đổi | PASS | PASS |
| Quyền | Phiên B dùng mật khẩu của A → 401; email của A không bị gỡ | PASS | PASS |
| Chưa liên kết | B chưa có email → 409 `email-not-linked` | **FAIL** (200) | PASS |
| Chưa liên kết | Thông báo không lộ thông tin nội bộ; không phát sinh thay đổi | PASS | PASS |
| Lỗi CSDL bước 2 | Trả 500 `email-unlink-failed` | **FAIL** (500 `internal`) | PASS |
| Lỗi CSDL bước 2 | Thông báo không lộ SQL/tên bảng/email | PASS | PASS |
| Lỗi CSDL bước 2 | Hoàn tác trọn: email và mã đặt lại còn nguyên, không thay đổi một phần; `GET /api/account` vẫn thấy email | PASS | PASS |
| Lỗi CSDL bước 2 | Log có `UNLINK-EMAIL-ROLLBACK … buoc=xoa-ma-dat-lai loi=IntegrityError hoan-tac=ok` | **FAIL** | PASS |
| Lỗi CSDL bước 2 | Dòng log không chứa email hay uid đầy đủ | **FAIL** (không có dòng log) | PASS |
| Lỗi CSDL bước 2 | Sau lỗi không treo giao dịch: `link_email` (cần `BEGIN`) của tài khoản khác vẫn chạy | PASS | PASS |
| Lỗi CSDL bước 1 | Trả 500 `email-unlink-failed` | **FAIL** | PASS |
| Lỗi CSDL bước 1 | Dữ liệu không đổi | PASS | PASS |
| Lỗi CSDL bước 1 | Log ghi `buoc=xoa-email` | **FAIL** | PASS |
| Thành công | 200; dòng `contact_email` và mã đặt lại của A bị xóa; `GET /api/account` không còn email | PASS | PASS |
| Thành công | Liên kết và mã của tài khoản khác không bị đụng; tài khoản, mật khẩu, hồ sơ không đổi; vẫn đăng nhập được | PASS | PASS |
| Đã gỡ | Gỡ lần hai → 409 `email-not-linked` | **FAIL** (200) | PASS |
| Đã gỡ | Gỡ lần hai không thay đổi gì; liên kết lại được (luồng xác minh không bị ảnh hưởng) | PASS | PASS |

Phần B – gọi thẳng `unlink_email` trên CSDL tạm:

| Nhóm | Ca | Mã cũ | Mã mới |
|---|---|---|---|
| Lỗi tại COMMIT (khóa ngoại trì hoãn) | Ném `ApiError email-unlink-failed` (500) | **FAIL** (ném `IntegrityError` thô) | PASS |
| Lỗi tại COMMIT | Dữ liệu giữ nguyên; không treo giao dịch | PASS | PASS |
| Lỗi tại COMMIT | Log `buoc=commit`, `hoan-tac=ok` | **FAIL** | PASS |
| CSDL bị khóa ở BEGIN | Trả 503 `email-unlink-failed` | **FAIL** (`OperationalError` thô → 500 `internal`) | PASS |
| CSDL bị khóa ở BEGIN | Log `buoc=bat-dau`, `hoan-tac=khong-can`; dữ liệu giữ nguyên | **FAIL** / PASS | PASS |
| COMMIT và ROLLBACK cùng hỏng | Vẫn ném `ApiError email-unlink-failed`; log hoàn tác lỗi và bỏ kết nối | **FAIL** | PASS |
| COMMIT và ROLLBACK cùng hỏng | Kết nối hỏng bị đóng và bỏ; kết nối mới thấy dữ liệu nguyên vẹn, không treo giao dịch | **FAIL** (kết nối treo giao dịch) | PASS |
| Thành công sau lỗi | Không lỗi, không log lỗi; chỉ xóa email và mã đặt lại của `u1`; mã `link` của `u1` và dữ liệu `u2` giữ nguyên | **FAIL** (`cannot start a transaction within a transaction` do ca trước để treo) | PASS |
| Đã gỡ / chưa liên kết | Gọi lại → 409 `email-not-linked`, không đổi gì, không treo giao dịch; `uid` chưa từng có email → 409 | **FAIL** | PASS |

Tổng: **50 ca**. Trên mã cũ (trước khi sửa): 30 đạt, **20 không đạt**. Trên mã mới: **50/50 đạt**, chạy lại 3 lần liên tiếp đều 50/50 (ổn định).

Không viết trùng: các ca đã có ở `test_email_codes.py` (mã đặt lại mất hiệu lực sau khi gỡ, lỗi ở câu thứ hai qua trigger) và `test_account.py` (gỡ email sai mật khẩu) được giữ nguyên và vẫn chạy.

## 6. Kiểm thử hồi quy

Chạy ngày 19/11/2026 trên máy Windows của Nguyễn Thanh Tùng (Python 3.12.10, Node). Lần chạy đầy đủ dưới đây làm trên nhánh `fix/tuan7-l1-bao-loi-luu-du-lieu-chung` (master + PR L1 chưa gộp) cộng thay đổi của tài liệu này; các tệp bị sửa giống hệt nhau giữa hai nhánh. Sau khi chuyển thay đổi sang nhánh `fix/tuan7-unlink-email-hoan-tac` (tạo từ `origin/master`), đã chạy lại: `test_unlink_email` 50/50, `test_email_codes` 37/37, `test_account` 46/46, `test_admin_reset` 18/18, `test_users` 13/13, `test:logic` 140/140 (master chưa có 7 ca của PR L1), đều đạt. Mỗi bộ dùng thư mục dữ liệu tạm riêng.

| Bộ kiểm thử | Liên quan | Kết quả |
|---|---|---|
| `tests/server/test_unlink_email.py` (chạy 3 lần) | Gỡ email | PASS 50/50 cả 3 lần |
| `tests/server/test_email_codes.py` | Xác minh email, mã đặt lại khi gỡ/đổi email | PASS 37/37 |
| `tests/server/test_account.py` | Email cá nhân, quên/đặt lại mật khẩu, ảnh đại diện, chat | PASS 46/46 |
| `tests/server/test_admin_reset.py` | Admin đặt lại mật khẩu | PASS 18/18 |
| `tests/server/test_users.py` | Tạo, đăng nhập tài khoản | PASS 13/13 |
| `tests/server/test_migrate.py` | Chuyển email → tên đăng nhập | PASS 8/8 |
| `tests/server/test_profile_lock.py` | Hồ sơ SV/GV | PASS 25/25 |
| `tests/server/test_activities.py` | V4 – activities | PASS 174/174 |
| `tests/server/test_quiz_v3.py` | Trắc nghiệm V3 | PASS 83/83 |
| `tests/server/test_quiz_results_nguon_diem.py` | Điểm từ `quizResults` | PASS 13/13 |
| `tests/server/test_quiz_extra.py` | Điền khuyết, kho đề | PASS 48/48 |
| `tests/server/test_shared_scope.py` | Phân quyền đọc theo môn | PASS 16/16 |
| `tests/server/test_teacher_shared.py` | R1 – PR50 | PASS 28/28 |
| `tests/server/test_subject_removal.py` | R2, R4 | PASS 23/23 |
| `tests/server/test_seed_curriculum.py` | Dữ liệu kiểm tải | PASS 77/77 |
| `tests/server/test_class_scope.py` | Lớp học phần | PASS 24/24 |
| `tests/server/test_assign_avatars.py` | Ảnh đại diện | PASS 15/15 |
| `tests/server/test_teacher_limit.py` | Giới hạn giáo viên | PASS 13/13 |
| `tests/server/test_online_exam.py` | Thi trực tuyến | PASS 37/37 |
| `tests/server/test_graduation.py` | Xét tốt nghiệp | PASS 24/24 |
| `tests/server/test_submit.sh` | Nộp bài | PASS 18/18 (*) |
| `npm run test:logic` | Logic giao diện | PASS 147/147 |

(*) Trên Windows lệnh `python3` chỉ là lối tắt của Microsoft Store nên lần chạy đầu báo "Python was not found" (lỗi môi trường, không phải lỗi mã); chạy lại với một lệnh `python3` tạm trỏ về `python` thì đạt. Trên CI (Ubuntu) không gặp vấn đề này.

Không chạy `npm run test:rules` / `test:rules:deep` (cần Firebase Emulator và Java; thay đổi này không đụng tới `firestore.rules`).

## 7. Những tệp đã thay đổi

| Tệp | Thay đổi |
|---|---|
| `server/studytask_api.py` | `unlink_email`: đưa `BEGIN` vào `try`, ghi nhận bước, `409 email-not-linked`, `ROLLBACK` được bảo vệ, log `UNLINK-EMAIL-ROLLBACK`, trả `ApiError email-unlink-failed` (503/500). Hàm mới `drop_db_connection` bỏ kết nối dùng chung khi không hoàn tác được |
| `components/AccountCards.js` | Nút "Gỡ liên kết": nhận `email-not-linked` thì tải lại thẻ |
| `tests/server/test_unlink_email.py` | Mới – 50 ca (mục 5) |
| `.github/workflows/ci.yml` | Thêm bước chạy `test_unlink_email.py` |
| `docs/sua-loi/05-pr50-unlink-email-hoan-tac-giao-dich.md` | Tài liệu này |

## 8. Chưa kiểm chứng / còn tồn tại

- Chưa thử trên giao diện bằng trình duyệt (thẻ Email cá nhân với hai tab cùng gỡ); thay đổi giao diện chỉ được kiểm tra cú pháp (`node --check`) và rà mã.
- Chưa triển khai lên máy chủ thật.
- Mã trạng thái gỡ email khi chưa liên kết đổi từ `200` sang `409`. Giao diện hiện tại chỉ hiện nút gỡ khi đã liên kết nên không ảnh hưởng luồng thường; nếu có công cụ/kịch bản nào gọi thẳng API và coi gỡ lặp lại là thành công thì cần cập nhật.
- Lỗi khi đóng kết nối hỏng chỉ được ghi log; trường hợp này cực hiếm và không mô phỏng được bằng SQLite thật, chỉ được kiểm thử bằng kết nối giả lập (`BrokenConn`).
