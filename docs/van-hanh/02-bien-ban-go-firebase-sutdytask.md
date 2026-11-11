# Biên bản gỡ project Firebase `sutdytask`

- Việc: gỡ dữ liệu Firebase cũ (việc 4 của kế hoạch tuần 5, việc 5 của kế hoạch tuần 6)
- Người thực hiện trên Firebase Console: **Nguyễn Thanh Tùng** (24TX810027)
- Thời điểm gỡ: **06/11/2026 10:23:56 UTC** (17:23:56 giờ Việt Nam)
- Project: `sutdytask`, Project number `447291046399`, gói Spark
- Hạn khôi phục lần đầu: **06/12/2026 10:23:56 UTC** (17:23:56 giờ Việt Nam). Project đã được khôi phục rồi gỡ lại ngày 11/11/2026; hạn khôi phục hiện tại là **11/12/2026 02:54:32 UTC** (xem mục 5.2)

## 1. Kết luận

Project đã ngừng hoạt động và không còn truy cập được qua API. Web https://sutdytask.io.vn vẫn phản hồi bình thường.

Dữ liệu **chưa bị xóa vĩnh viễn**: theo email của Google, project vẫn khôi phục được đến hạn nêu trên. Tiêu chí "không còn dữ liệu mật khẩu trên Firebase" chỉ đạt hẳn sau hạn đó.

## 2. Căn cứ trước khi gỡ

| Nội dung | Kết quả | Cách kiểm tra |
|---|---|---|
| Web đang chạy có dùng Firebase không | Không: trang chủ và `utils/firebase.js` không có tham chiếu SDK | `curl` tới `sutdytask.io.vn` trước khi gỡ, tìm `gstatic`, `firebase`, `initializeApp` |
| Mã trên `master` (`83e1316`) có nối project thật không | Không còn SDK hay cấu hình. Chỉ `reset-worker/` còn gọi `identitytoolkit.googleapis.com`, nhưng Worker đã gỡ khỏi Cloudflare ngày 06/11; `scripts/seed-emulator.mjs` gọi Emulator trên máy | `git grep` trên `origin/master` |
| API máy chủ có gọi Firebase không | Không, ở cả 3 phiên bản của `server/studytask_api.py` (`68dde16`, `f8af7d9`, `64d0631`) | Tìm `googleapis`, `gstatic`, `firebaseapp`, `firebaseio`, `firebase_admin` trong từng phiên bản |
| CI có cần project thật không | Không: `test:rules` chạy trên Emulator với project `demo-studytask` | `.github/workflows/ci.yml`, `package.json` |
| Đối chiếu dữ liệu | Xem mục 5 | |

## 3. Các bước đã làm

| Bước | Kết quả | Minh chứng |
|---|---|---|
| Mở Project settings, đối chiếu Project ID | `sutdytask`; trang hiển thị "There are no apps in your project" | Ảnh chụp màn hình |
| Xóa project trên Firebase Console | Google gửi email "Your project sutdytask has been shut down", ghi thời điểm 06/11/2026 10:23:56 UTC | Email của Google |

Ảnh chụp và email do Nguyễn Thanh Tùng giữ, không đưa vào repo vì repo công khai.

## 4. Kiểm tra sau khi gỡ

Chạy lúc 06/11/2026 10:26 UTC (17:26 giờ Việt Nam).

| Kiểm tra | Kết quả | Ý nghĩa |
|---|---|---|
| `GET https://firestore.googleapis.com/v1/projects/sutdytask/databases/(default)/documents/users?pageSize=1` | HTTP 403, `PERMISSION_DENIED`, lý do `CONSUMER_INVALID` | Không đọc được Firestore của project |
| `https://sutdytask.io.vn/` và `/utils/firebase.js` | HTTP 200 | Web vẫn phản hồi |
| `https://sutdytask.web.app/`, `https://sutdytask.firebaseapp.com/` | HTTP 404 | **Không dùng làm bằng chứng**, vì trước khi gỡ cũng đã trả 404 |

**Chưa kiểm chứng:**

- Chưa thử đăng nhập và lưu dữ liệu trên giao diện sau khi gỡ.
- Firestore trả 403 chứ không phải 404, và phép thử này không đăng nhập. Trạng thái của project trên trang "Resources pending deletion" chưa được đối chiếu ngoài email.

## 5. Dữ liệu trước khi gỡ

- Báo cáo tuần 5 ghi Trương Thanh Vui xác nhận dữ liệu trên máy chủ **tương đồng hơn 90%** với Firebase. Khi gỡ, Nguyễn Thanh Tùng ghi nhận xác nhận của Thanh Vui là dữ liệu **khớp**. Hai cách ghi này chưa được thống nhất.
- Repo **chưa có bảng đối chiếu** và không có script chuyển dữ liệu từ Firestore sang máy chủ, nên phần dữ liệu khác nhau và cách dữ liệu được đưa sang chưa được ghi lại. Nhóm dựa vào xác nhận của Thanh Vui để gỡ.
- Biên bản này **chưa ghi nhận** bản sao lưu Firestore hoặc Firebase Auth, cũng như ảnh chụp danh sách collection và số tài khoản trước khi gỡ. Nếu nhóm có các tài liệu này thì bổ sung vào đây.

### 5.1. Thử khôi phục project để lấy dữ liệu (11/11/2026)

Nhóm khôi phục project `sutdytask` trong hạn để xuất Firestore và đối chiếu với máy chủ. Kết quả: **không lấy lại được dữ liệu**.

| Kiểm tra (Google Cloud Shell, tài khoản có quyền trên project) | Kết quả |
|---|---|
| Console Firestore | "Error loading collections" |
| Cloud Firestore API ở trang APIs & Services | Đang bật, 12 yêu cầu, 0% lỗi |
| `gcloud firestore databases list --project=sutdytask` | Còn bản ghi `(default)` (tạo 13/06/2026, `nam5`); `pointInTimeRecovery` **DISABLED**, `versionRetentionPeriod` 3600s |
| `POST .../documents:listCollectionIds` (script chỉ đọc) | HTTP 400 `FAILED_PRECONDITION`: "Cannot serve requests because the database was deleted." |
| `gcloud firestore backups list --project=sutdytask` | `Listed 0 items.` (không có bản sao lưu) |

Kết luận: khi project bị gỡ, Google xóa luôn database Firestore; khôi phục project chỉ đưa lại project, không đưa lại dữ liệu. Không có PITR và không có sao lưu nên **dữ liệu Firestore của project `sutdytask` không còn lấy lại được**. Mật khẩu Firebase Auth vốn không xuất được dạng đọc được ([D06] mục 8).

Hệ quả cho việc đối chiếu: **không thể lập bảng đối chiếu** giữa Firebase và máy chủ. Hai ghi nhận trước đó ("khớp" và "tương đồng hơn 90%") đều không có bản đối chiếu làm căn cứ, nên nên đọc là **chưa kiểm chứng được**. Căn cứ còn lại: [D06] mục 8 ghi máy chủ bắt đầu bằng dữ liệu nạp từ script, nhóm chưa từng xuất Firestore; dữ liệu đang dùng là dữ liệu trên máy chủ (`studytask.db`).

### 5.3. Kết thúc việc đối chiếu dữ liệu (11/11/2026)

Việc đối chiếu dữ liệu Firebase với máy chủ **được đóng, không thực hiện thêm**, vì không còn cần thiết và cũng không còn thực hiện được:

1. **Hệ thống không còn phụ thuộc Firebase.** Web và API chạy hoàn toàn trên máy chủ riêng; mã trên `master` không còn SDK hay cấu hình Firebase (mục 2). Dữ liệu đang dùng là dữ liệu trên máy chủ, được sao lưu hằng ngày và đã chép ra ổ ngoài ([biên bản sao lưu](09-bien-ban-sao-luu-ra-o-ngoai-2026-11-11.md)).
2. **Văn bản này thay thế bảng đối chiếu.** Quyết định gỡ project, căn cứ trước khi gỡ (mục 2), kết quả kiểm tra sau khi gỡ (mục 4) và việc thử khôi phục (mục 5.1) đã được ghi lại ở đây; đối chiếu từng bản ghi không thêm thông tin cần cho vận hành.
3. **Không còn nguồn để đối chiếu.** Máy chủ bắt đầu từ dữ liệu nạp bằng script, không có bản xuất Firestore ([D06] mục 8); database Firestore đã bị xóa cùng project và không có sao lưu (mục 5.1).

Hai ghi nhận cũ ("khớp", "tương đồng hơn 90%") được ghi lại là **chưa kiểm chứng được**; không dùng chúng làm căn cứ cho kết luận nào khác. Đề xuất của Trương Thanh Vui; Nguyễn Thanh Tùng xác nhận khi kiểm tra lại sau hạn xóa vĩnh viễn (mục 6).

## 6. Việc còn lại

| Việc | Người phụ trách | Hạn |
|---|---|---|
| ~~Đối chiếu dữ liệu Firebase với máy chủ~~ **Đóng, không thực hiện** (mục 5.3): hệ thống không còn phụ thuộc Firebase, biên bản này thay thế bảng đối chiếu, và không còn dữ liệu để đối chiếu (mục 5.1) | Trương Thanh Vui; Nguyễn Thanh Tùng xác nhận | Đã xong 11/11/2026 |
| **Gỡ lại project `sutdytask`** (đang ở trạng thái đã khôi phục từ 11/11/2026; không còn dữ liệu cần giữ). Ghi thời điểm gỡ lần hai vào biên bản này | Trương Thanh Vui (tài khoản có quyền trên project) | **Đã gỡ lại 11/11/2026 02:54:32 UTC** (mục 5.2) |
| Thử đăng nhập và lưu dữ liệu trên web thật, ghi kết quả vào mục 4 | Nguyễn Thanh Tùng | Sớm nhất có thể |
| Kiểm tra lại sau hạn khôi phục, xác nhận project đã bị xóa hẳn | Nguyễn Thanh Tùng | Sau 11/12/2026 02:54:32 UTC (hạn mới, thay cho 06/12/2026) |
| Xem project thử `studytask-test` ([thiết kế 04](../thiet-ke/04-thu-cloudflare-worker-dat-lai-mat-khau.md)) có còn cần không. Project này không nằm trong đợt gỡ này; ngày 06/11 API Firestore của nó báo `SERVICE_DISABLED` | Nguyễn Thanh Tùng | Tuần 6 |

## 7. Cách khôi phục

Trước hạn khôi phục, tài khoản có quyền trên project vào trang **Resources pending deletion** của Google Cloud, chọn `sutdytask`, bấm **Restore** rồi xác nhận. Nếu không được, dùng lệnh `gcloud projects undelete sutdytask`.

Sau hạn này không khôi phục được nữa.


### 5.2. Gỡ lại project (11/11/2026)

| Mục | Ghi nhận |
|---|---|
| Người thực hiện | Trương Thanh Vui |
| Thời điểm gỡ lần hai | **11/11/2026 02:54:32 UTC** (09:54:32 giờ Việt Nam) |
| Minh chứng | Email của Google "Your project sutdytask has been shut down" (Project Permanent Deletion Warning) gửi lúc 09:54 giờ Việt Nam. Email do người thực hiện giữ, không đưa vào repo công khai |
| Hạn khôi phục mới | **11/12/2026 02:54:32 UTC** (09:54:32 giờ Việt Nam). Hạn tính lại từ lần gỡ này, thay cho hạn 06/12/2026 của lần gỡ đầu |
| Kiểm tra sau gỡ | Chạy trong Google Cloud Shell, có đăng nhập (token của `gcloud auth print-access-token`): `GET https://firestore.googleapis.com/v1/projects/sutdytask/databases/(default)/documents/users?pageSize=1` trả **HTTP 403** `PERMISSION_DENIED`, lý do `CONSUMER_INVALID`, "Permission denied on resource project sutdytask." Giống kết quả sau lần gỡ đầu (mục 4). Chưa chạy phép thử không đăng nhập |

Lưu ý: sau 11/12/2026 02:54:32 UTC project bị xóa vĩnh viễn và không khôi phục được. Việc "kiểm tra lại sau hạn" của Nguyễn Thanh Tùng tính từ mốc này.

[D06]: ../thiet-ke/06-chuyen-firebase-sang-may-chu-rieng.md
