# Kiểm thử `test:logic`, `test:rules` và thử tay mục 4 của [D9] – máy Nguyễn Thanh Tùng

Ngày thực hiện: 01/11/2026. Công cụ: Claude Code (AI) hướng dẫn chạy lệnh và điều khiển trình duyệt theo yêu cầu của Nguyễn Thanh Tùng; cần ghi vào nhật ký sử dụng AI của nhóm.

## 1. Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| `npm run test:logic` | 42/42 đạt |
| `npm run test:rules` | 46/46 đạt |
| `npm run test:rules:deep` (bộ chuyên sâu của Thanh Vui) | 69/69 đạt |
| Thử các bước mục 4 của [D9] | 8/8 bước đạt |

Mã nguồn đã chạy: `master` tại commit `58f8834`.

## 2. Môi trường

Windows 11, Node.js v26.13.0, npm 11.20.0, Java Temurin 21.0.13, `firebase-tools` 14.27.0, Firestore Emulator 1.19.8, project `demo-studytask`. Chạy trên bản clone `C:\dev\studytask-pr15` (đường dẫn không dấu) ở commit `58f8834`. Mọi lượt chạy chỉ dùng Emulator trên `127.0.0.1`, không chạm production, không sửa `firestore.rules`, không deploy.

## 3. Kết quả test tự động

Có thể chạy lại các bộ test bằng tay trong thư mục dự án:

```powershell
npm run test:logic
npm run test:rules
```

| Bộ | Lệnh | Số ca | Đạt | Không đạt |
|---|---|---|---|---|
| Logic tính toán | `npm run test:logic` | 42 (9 nhóm) | **42** | **0** |
| Security Rules (bộ gốc) | `npm run test:rules` | 46 (8 nhóm) | **46** | **0** |
| Security Rules (bộ chuyên sâu) | `npm run test:rules:deep` | 69 (11 nhóm) | **69** | **0** |

Các dòng `PERMISSION_DENIED` trong log là bình thường: đó là những ca kiểm tra "bị chặn". Số liệu của bộ chuyên sâu khớp báo cáo của Thanh Vui.

## 4. Thử các bước mục 4 của [D9]

Tài liệu [D9]: `docs/sua-loi/01-cap-nhat-ho-so.md`.

Chuẩn bị: `npm run emulators`, `npm run seed`, `npm run serve`; mở `http://127.0.0.1:5500`. Cột "Trước khi sửa" của [D9] không tái hiện được trên mã hiện tại nên chỉ kiểm tra cột "Sau khi sửa".

| # | Bước | Kết quả mong đợi | Kết quả thực tế | Kết quả |
|---|---|---|---|---|
| 1 | Đăng nhập `student@studytask.vn`, vào Hồ sơ | Các trường "Chưa cập nhật" | Mã sinh viên, khoa, ngành, lớp, học kỳ đều "Chưa cập nhật"; GPA "—"; không còn `2021001234` / `3.20` | Đạt |
| 2 | Họ tên = khoảng trắng, Lưu | "Họ và tên không được để trống." | Hiện đúng thông báo, kèm "Vui lòng sửa các trường được đánh dấu." | Đạt |
| 3 | Số điện thoại = `12ab`, Lưu | "Số điện thoại không hợp lệ" | Hiện "Số điện thoại không hợp lệ (VD: 0901234567)." | Đạt |
| 4 | Nhập đúng (`0901234567`), Lưu | "Đã lưu lên Firebase" | Hiện "Đã lưu lên Firebase" và số điện thoại đổi; thông báo xuất hiện sau một nhịp ngắn, không tức thì | Đạt |
| 5 | Xem `user/{uid}` trên Emulator | `name`, `phone` đã cập nhật | Đọc tài liệu qua REST của Emulator (cổng 8080): `phone = 0901234567`, `name = Trần Minh Khoa`, `role = student` giữ nguyên. Không mở Emulator UI (cổng 4000) | Đạt |
| 6 | Tắt Emulator rồi Lưu | Sau 10 giây báo "Máy chủ chưa phản hồi…" | Làm trên tài khoản giáo viên, Emulator đã tắt. Sau khoảng 10 giây hiện "Lưu thất bại – thử lại: Máy chủ chưa phản hồi. Kiểm tra kết nối mạng rồi lưu lại."; không treo ở "Đang lưu…". Không đo thời gian chính xác đến từng giây | Đạt |
| 7 | Đăng xuất, tải lại trang | Ở lại màn hình đăng nhập | Ở lại màn hình đăng nhập | Đạt |
| 8 | Đăng nhập `teacher@studytask.vn` trên cùng trình duyệt | Hồ sơ giáo viên riêng | "Hồ sơ giáo viên" của TS. Nguyễn Văn An; số điện thoại "Chưa cập nhật" (không nhận `0901234567` của sinh viên) | Đạt |

Bước 6 chạy cuối vì bước 7 và 8 cần Emulator còn bật. Dữ liệu ghi vào Emulator không được lưu lại sau khi tắt.

**Kết luận:** Toàn bộ test tự động đạt.

## 5. Sự cố môi trường (để thành viên khác khỏi mất thời gian)

`npm run test:rules` và `npm run emulators` lúc đầu **thoát với mã 1** trên máy này, do hai nguyên nhân độc lập, không phải lỗi của mã dự án:

1. **Đường dẫn có dấu tiếng Việt.** Repo nằm ở `D:\Zalo Received Files\Đồ Án\...`; Java không mở được `firestore.rules` (`FileNotFoundException`, tên thư mục bị hỏng). Cách xử lý: clone repo vào đường dẫn không dấu.
2. **Thư mục tạm của Java 21 dùng đường dẫn rút gọn có dấu `~`** (`C:\Users\THANHT~1\AppData\Local\Temp`), làm Java không tạo được kênh nội bộ (`Unable to establish loopback connection`, `Invalid argument: connect`). Ngay cả chương trình Java tối thiểu chỉ mở một `Selector` cũng lỗi. Cách xử lý:

```powershell
New-Item -ItemType Directory -Force C:\dev\tmp
$env:JAVA_TOOL_OPTIONS = "-Djdk.net.unixdomain.tmpdir=C:\dev\tmp"
npm run test:rules
```

Thử `-Djava.net.preferIPv4Stack=true` và `-Djava.io.tmpdir` không giải quyết được; chỉ `jdk.net.unixdomain.tmpdir` có tác dụng.

Cảnh báo không chặn việc chạy: `npm ci` báo `EBADENGINE` (một thư viện của `firebase-tools` chỉ hỗ trợ Node 20, 22, 24 còn máy dùng Node 26) và `npm audit` báo 32 lỗ hổng trong thư viện phát triển. Chưa xử lý.

## 6. Việc còn lại
2. **Nhật ký AI:** bổ sung phần của Nguyễn Thanh Tùng vào `docs/ai-log/tuan-04.md` (chạy test và thử [D9] ngày 01/11).
3. **README:** thêm lưu ý đường dẫn không dấu và `jdk.net.unixdomain.tmpdir` khi Emulator thoát mã 1 trên Windows.
4. **Đối chiếu** số liệu này với máy của Thanh Vui và Trần Đức Tùng.
