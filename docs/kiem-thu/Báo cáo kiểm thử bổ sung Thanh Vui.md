# Kiểm thử `test:logic` và thử [D9] trên bản máy chủ – máy Trương Thanh Vui

Ngày thực hiện: 06/11/2026. Việc số 9 của kế hoạch tuần 5. Công cụ: Claude Code (AI) chạy lệnh và điều khiển trình duyệt theo yêu cầu của Trương Thanh Vui; cần ghi vào nhật ký sử dụng AI của nhóm.

**Lưu ý về người thao tác:** toàn bộ các bước ở mục 3 do AI thao tác trên trình duyệt tích hợp của ứng dụng Claude, không phải Thanh Vui tự bấm. Báo cáo này không thay cho lần thử tay của thành viên.

## 1. Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| `npm run test:logic` | 42/42 đạt |
| `python tests/server/test_profile_lock.py` | 18/18 đạt |
| Thử các bước [D9] phiên bản máy chủ | 8/8 bước đạt |
| Phát hiện mới | 1 lỗi nhỏ, 1 điểm báo cáo tuần 5 ghi chưa đúng (mục 4) |

Mã nguồn đã chạy: `master` tại commit `83e1316` (đã gồm [PR34]).

## 2. Môi trường và lệnh đã chạy

Windows 11 Pro, Node v24.22.0, npm 11.19.1, Python 3.13.5.

```bash
npm ci
npm run test:logic
python tests/server/test_profile_lock.py
```

Thử giao diện trên máy chủ tạm tại `http://127.0.0.1:5500`, không dùng máy chủ thật:

- API `server/studytask_api.py` chạy với thư mục dữ liệu tạm, tạo 3 tài khoản tạm `sv01` (sinh viên), `gv01` (giáo viên), `ad01` (quản trị) bằng `create-user`.
- Một script Python tạm, không đưa vào repo, thay vai trò của nginx: phục vụ giao diện, chuyển `/api/` tới API. Script này cũng tắt được API và giữ yêu cầu ghi 15 giây để tạo kịch bản lỗi. Khi API tắt, script trả 502.

Dữ liệu tạm và script nằm ngoài repo, không có gì ghi lên máy chủ thật.

## 3. Kết quả thử [D9]

Các bước ở [D9] mục 4 viết cho Emulator và Firebase nên được đổi cho tương ứng với máy chủ.

| # | Bước | Kết quả mong đợi | Kết quả thực tế | Đạt |
|---|---|---|---|---|
| 1 | `sv01` đăng nhập, vào Hồ sơ | Không có dữ liệu mẫu | Các trường "Chưa cập nhật", GPA "—"; không có `2021001234`, `3.20` | Đạt |
| 2 | Admin sửa họ tên = khoảng trắng, bấm Lưu | Báo lỗi, không lưu | Báo "Họ và tên không được để trống."; tên trên máy chủ không đổi. Sinh viên không có ô họ tên, chỉ có 2 ô email và số điện thoại | Đạt |
| 3 | Số điện thoại `12ab`, email `khong-phai-email` | Báo lỗi | Báo "Số điện thoại không hợp lệ (VD: 0901234567)." và "Email không hợp lệ." | Đạt |
| 4 | Nhập đúng, bấm Lưu | Có thông báo; dữ liệu đổi trên máy chủ | Hiện "Đã lưu lên máy chủ". `user`: `phone` đã đổi. `userData.profile`: `phone`, `email` đã đổi | Đạt |
| 5 | Máy chủ chậm: giữ yêu cầu ghi 15 giây, bấm Lưu | Sau 10 giây báo lỗi, không treo | "Đang lưu…" rồi sau 10,1 giây báo "Lưu thất bại – thử lại: Máy chủ chưa phản hồi. Kiểm tra kết nối mạng rồi lưu lại." | Đạt (xem 4.1) |
| 6 | API tắt, bấm Lưu | Báo lỗi, không treo | Sau 2,1 giây báo "Lưu thất bại – thử lại: Lỗi máy chủ (502)" | Đạt |
| 7 | Đăng xuất, tải lại trang | Ở lại màn hình đăng nhập | Ở lại màn hình đăng nhập | Đạt |
| 8 | Đăng nhập `gv01`, rồi `ad01`, trên cùng trình duyệt | Hồ sơ riêng theo vai trò | "Hồ sơ giáo viên", "Hồ sơ quản trị"; không có tên, số điện thoại của `sv01` | Đạt |

Bước 5 là kịch bản máy chủ chậm mà báo cáo tuần 5 ghi là chưa thử được.

**Chưa thử:** máy chủ thật qua nginx và Cloudflare Tunnel; `test:rules`, `test:rules:deep` (không thuộc phạm vi việc này).

## 4. Phát hiện

### 4.1. Lỗi nhỏ: báo lưu thất bại nhưng một nửa dữ liệu đã được ghi

Ở bước 5, sau khi giao diện báo thất bại, đọc lại máy chủ thấy:

| Nơi lưu | Số điện thoại |
|---|---|
| `userData.profile.phone` | `0901234568` (số mới) |
| `user.phone` | `0901234567` (số cũ) |

Nguyên nhân: `handleProfileSave` (`app.js:399-400`) ghi `userData` trước, rồi mới ghi `user`. Yêu cầu đầu quá 10 giây thì giao diện dừng chờ và báo lỗi, không gửi yêu cầu thứ hai; nhưng yêu cầu đầu vẫn tới máy chủ. Theo [D9] mục 2 (N3), Danh bạ và trang Quản trị đọc `user`, nên hai nơi này sẽ thấy số cũ. Theo mã, bấm Lưu lại khi máy chủ bình thường thì hai nơi khớp nhau, nên mức độ thấp (đọc mã, chưa thử bước này). Chưa sửa trong báo cáo này.

### 4.2. Báo cáo tuần 5 ghi chưa đúng về `email`

Bảng thử tay trong báo cáo tuần 5 ghi "`phone` và `email` đã đổi ở cả `user` và `userData`". Thực tế `email` chỉ nằm ở `userData.profile`; `handleProfileSave` chỉ chép `phone` sang `user` (`app.js:400`). Đây là cách làm đúng ý đồ, không phải lỗi mã: cần sửa câu trong báo cáo.

## 5. Kết luận

`test:logic` trên máy Trương Thanh Vui đạt 42/42. Các bước [D9] phiên bản máy chủ đều đạt trên máy chủ tạm, gồm cả kịch bản máy chủ chậm 10 giây. Còn lại: Thanh Vui tự thử tay để xác nhận, và quyết định có sửa lỗi 4.1 ở tuần 6 hay không.

## 6. Cập nhật tuần 6 (việc 13)

Ngày 11/11/2026, `master` tại `3a9a52c`, máy Trương Thanh Vui (Windows, Node v26.13.0, Python 3.12.10). Công cụ: Claude Code (AI) chạy lệnh theo yêu cầu của Trương Thanh Vui; cần ghi vào nhật ký sử dụng AI.

| Hạng mục | Kết quả |
|---|---|
| `npm run test:logic` | 62/62 đạt (mục 1 ghi 42/42 ở thời điểm 06/11; từ đó thêm ca ở [PR37] và phần Trắc nghiệm) |
| `python tests/server/test_profile_lock.py` | 25/25 đạt (mục 1 ghi 18/18) |

**Mục 4.1 (lưu một nửa dữ liệu): đã sửa ở [PR41].** Máy chủ tự ghi `user.phone` trong cùng giao dịch khi yêu cầu có `profile.phone`, nên dù giao diện báo quá hạn sau khi yêu cầu đầu đã tới máy chủ thì `user` và `userData.profile` vẫn khớp. Ca kiểm thử: "Một lần ghi userData cũng cập nhật user.phone", "Chỉ đổi email thì số điện thoại ở user giữ nguyên", "Số điện thoại sai định dạng không làm đổi user.phone", cùng các ca liên quan trong `tests/server/test_profile_lock.py`. Giao diện vẫn có thể báo "Lưu thất bại – thử lại" trong lúc dữ liệu đã được lưu; bấm Lưu lại không gây hại. Quyết định: **đã sửa**, không dời tuần 7.

**Mục 4.2 (`email` chỉ nằm ở `userData.profile`):** [D9] mục 4 đã viết lại đúng như vậy (`phone` đổi ở `user` và `userData.profile`, `email` chỉ ở `userData.profile`). Câu ghi sai trong báo cáo tuần 5 là nội dung đã nộp, nhóm cần xem có đính chính ở báo cáo tuần 6 hay không.

**Chưa chạy lại bằng ca tự động:** các bước thuần giao diện ở mục 3 (bước 1, 5, 6, 7, 8). Kết quả của chúng vẫn là lần thử 06/11 do AI thao tác. **Thanh Vui chưa tự thử tay**; đề xuất dùng kiểm thử động thay thế đang chờ nhóm xác nhận (xem [D9] mục 4).

