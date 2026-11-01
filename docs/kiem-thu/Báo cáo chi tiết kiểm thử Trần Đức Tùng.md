# Báo cáo kết quả kiểm thử – máy Trần Đức Tùng (01/11/2026)

- Người chạy: Trần Đức Tùng (24TX810026).
- Máy: DESKTOP-2F6BH1O
- Ngày chạy : 01/11/2026
- Công cụ thực hiện: Claude Code (AI) chạy lệnh theo yêu cầu vào nhật ký sử dụng AI của nhóm.
- Phạm vi: Chỉ các ca chạy trên máy Trần Đức Tùng. Máy Nguyễn Thanh Tùng và Trương Thanh Vui chạy và ghi riêng

Tệp này mô tả đầy đủ cấu hình, từng lượt chạy và từng nhóm ca của riêng máy Trần Đức Tùng

## 1. Thông tin máy chạy kiểm thử

| Hạng mục | Thông tin |
|---|---|
| Hệ điều hành | Windows 10 Pro 64-bit, phiên bản 10.0.19045 (build 19045) |
| Node.js / npm | v24.22.1 / 11.19.1 |
| Java (cho Firestore Emulator) | Oracle JDK 21.0.2 LTS |
| Git | 2.45.1.windows.1 |
| firebase-tools | 14.27.0 (cài qua `npm ci`, gọi bằng `npx`) |
| @firebase/rules-unit-testing | 4.0.1 |
| Firestore Emulator | cloud-firestore-emulator v1.19.8 |
| Bộ chạy kiểm thử tự động | `node --test` (module `node:test` có sẵn trong Node.js) |
| Trình duyệt thử tay | Trình duyệt tích hợp trong ứng dụng Claude desktop (nhân Chromium), khung nhìn 1024 × 768 |
| Cài gói | `npm ci` theo `package-lock.json` (795 gói, khoảng 34 giây) |

## 2. Tổng hợp kiểm thử

| Phần | Số ca | Đạt | Không đạt | Chưa chạy |
|---|---|---|---|---|
| `npm run test:logic` | 42 | 42 | 0 | 0 |
| `npm run test:rules` | 46 | 46 | 0 | 0 |
| Mục 4 của [D9] (thử tay trên trình duyệt) | 8 | | | 0 |
| **Tổng** | **96** | **96** | **0** | **0** |

Hai lần chạy kiểm thử tự động cho cùng kết quả:

| Lệnh | Lần 1 (khoảng 11:05–11:09) | Lần 2 | Thời gian chạy lần 2 |
|---|---|---|---|
| `npm run test:logic` | 42/42 đạt | 42/42 đạt (11:30:01) | 0,14 giây |
| `npm run test:rules` | 46/46 đạt | 46/46 đạt (11:30:42 – 11:30:55) | 5,6 giây kiểm thử; 13 giây tính cả bật/tắt Emulator |

## 3. `npm run test:logic` – 42/42 đạt

Không cần Emulator.

| Nhóm kiểm thử | Số ca | Đạt | Không đạt |
|---|---|---|---|
| Quy chế điểm – mục 2: bộ trọng số | 2 | 2 | 0 |
| Quy chế điểm – mục 7: ví dụ tính tổng hợp | 4 | 4 | 0 |
| Quy chế điểm – mục 3: tỉ lệ quá trình / cuối kỳ | 3 | 3 | 0 |
| Quy chế điểm – mục 4: bài tập | 7 | 7 | 0 |
| Quy chế điểm – mục 6: kiểm tra khi lưu | 7 | 7 | 0 |
| Quy chế điểm – mục 5: chuyên cần | 5 | 5 | 0 |
| Học phí và công nợ | 6 | 6 | 0 |
| Chương trình đào tạo | 5 | 5 | 0 |
| Quy chế điểm – cột do giáo viên chọn | 3 | 3 | 0 |
| **Tổng** | **42** | **42** | **0** |

## 4. `npm run test:rules` – 46/46 đạt

| Nhóm kiểm thử | Số ca | Đạt | Không đạt |
|---|---|---|---|
| V2 – `user/{uid}`: chặn tự nâng quyền | 13 | 13 | 0 |
| V1 (vá tạm) – `userSecrets/{uid}` | 9 | 9 | 0 |
| Các collection khác giữ nguyên hành vi | 3 | 3 | 0 |
| Quy chế điểm: Đào tạo cập nhật tỉ lệ, giáo viên chọn cột | 8 | 8 | 0 |
| Học phí: Phòng Tài chính | 4 | 4 | 0 |
| Chương trình đào tạo | 1 | 1 | 0 |
| Phiếu đăng ký xét tốt nghiệp | 7 | 7 | 0 |
| Công bố khóa luận | 1 | 1 | 0 |
| **Tổng** | **46** | **46** | **0** |

Cách thiếp lập và chạy chương trình của máy:

- Lúc chạy, máy đang mở sẵn Emulator (`npm run emulators`, cổng 8080) để thử tay. File kiểm thử gọi `clearFirestore()`, nên chạy trên cổng 8080 sẽ xóa dữ liệu seed đang dùng. Vì vậy đã chạy cùng lệnh trên một Emulator riêng ở cổng 8180, dùng bản sao tạm của `firebase.json` và `tests/firestore.rules.test.mjs` chỉ đổi số cổng 8080 → 8180, chạy xong xóa bản sao. Rules và nội dung kiểm thử giữ nguyên.
- Trên Windows, sau khi `emulators:exec` kết thúc, tiến trình Java của Firestore Emulator còn sót lại và giữ cổng. Lần chạy thứ hai báo "port taken" cho tới khi tắt tiến trình đó. Nếu gặp lỗi này, tìm tiến trình đang giữ cổng (`Get-NetTCPConnection -LocalPort 8080`) rồi tắt, hoặc mở lại máy.
- Trên máy không mở Emulator khác thì chạy thẳng `npm run test:rules`.

## 5. Thử các bước ở mục 4 của [D9]

Người thao tác: Trần Đức Tùng, tự làm bằng tay trên trình duyệt. Ngày 01/11/2026, bắt đầu khoảng 13:50.

Môi trường: `npm run emulators`, `npm run seed` (dữ liệu sạch), `npm run serve` chạy từ thư mục `D:\Nhom-5_Studytask` (nhánh `docs/kiem-thu-tran-duc-tung`, cùng mã với commit `58b6dbb`), mở `http://127.0.0.1:5500`, tài khoản seed. Kết quả đối chiếu với cột "Sau khi sửa" của [D9].

| # | Bước | Kết quả mong đợi | Kết quả thực tế | Đánh giá |
|---|---|---|---|---|
| 1 | Đăng nhập `student@studytask.vn`, vào Hồ sơ | Các trường "Chưa cập nhật" | Mã số sinh viên, Khoa/bộ môn, Ngành học, Lớp, Học kỳ hiện tại, Số điện thoại đều không hiện (Chưa cập nhập) và GPA tích luỹ "__".  | Đạt |
| 2 | Sửa họ tên = khoảng trắng, bấm Lưu | Báo "Họ và tên không được để trống." | Hiện đúng dòng thông báo và vẫn giữ form sửa. | Đạt |
| 3 | Sửa số điện thoại = `12ab` | Báo "Số điện thoại không hợp lệ" | Hiện thông báo"Số điện thoại không hợp lệ (VD:091234567)" và giữ form sửa. | Đạt |
| 4 | Nhập đúng, bấm Lưu | Hiện "Đã lưu lên Firebase" | Thực hiện lưu Số điện thoại mới thì hiện thông báo "Đã lưu lên Firebase" và Hồ sơ hiện số mới | Đạt |
| 5 | Mở Emulator UI (cổng 4000) → `user/{uid}` | `name`, `phone` đã cập nhật | Đã hiện lên thông tin đã lưu `name`: "Trần Minh Khoa" và `phone`: "0912345678" | Đạt |
| 6 | Tắt Emulator rồi bấm Lưu | Sau 10 giây báo "Máy chủ chưa phản hồi…" | Sau khi tắt Emulator và nhấn lưu và Đồng bộ đã loading 10 giây xuất hiện thông báo"Lưu thất bại - thử lại: Máy chủ chưa phản hồi. Kiểm tra kết nối mạng rồi lưu lại". | Đạt |
| 7 | Đăng xuất, tải lại trang | Ở lại màn hình đăng nhập | Vẫn ở màn hình đăng nhập | Đạt |
| 8 | Đăng nhập `teacher@studytask.vn` trên cùng trình duyệt | Hồ sơ giáo viên riêng | Mã giáo viên, Bộ môn, Khoa/trường, Học hàm/chức vụ, Số điện thoại hiện "chưa cập nhập". | Đạt |


Ghi chú bước 6: thông báo chỉ hiện sau đúng 10 giây (`SAVE_TIMEOUT_MS = 10000` trong `app.js`), nên cần chờ khoảng 15 giây; trong 10 giây đầu nút luôn ở "Đang lưu…".

## 6. Nhật ký sử dụng AI 

- Chuẩn bị môi trường: khoảng 13:48 bật Emulator (npm run emulators) và seed dữ liệu sạch (npm run seed). Sau đó đăng xuất phiên cũ trên trình duyệt để bạn bắt đầu bước 1 từ màn hình đăng nhập.
- Mở Emulator UI cho bước 5: dùng REST API của Emulator để tìm uid của tài khoản student@studytask.vn, rồi mở thẳng document user/{uid} trên Emulator UI (cổng 4000).
- Sửa lỗi khởi động web: npm run serve báo EADDRINUSE vì cổng 5500 bị một server nền cũ giữ. AI tắt server đó, sửa cổng trong .claude/launch.json từ 3000 thành 5500, rồi chạy lại web. Từ lúc này trang mở bằng http://localhost:5500.
- Tắt Emulator cho bước 6: lúc 14:23:25, chỉ tắt các tiến trình giữ cổng 8080, 9099 và 4000. Web ở cổng 5500 vẫn chạy.
- Bật lại Emulator sau bước 6: lúc 14:32:08 khởi động lại Emulator và seed lại dữ liệu.
