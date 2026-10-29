# Báo cáo chi tiết kiểm thử Firestore Security Rules – máy Trương Thanh Vui

| | |
|---|---|
| Người phụ trách | Trương Thanh Vui |
| Máy | `DESKTOP-IMSJ193` (tài khoản Windows `Minx`) |
| Ngày chạy | 28/10/2026 |
| Nhánh Git | `------` (commit gốc `-----`) |
| Công cụ thực hiện | Claude Code (AI) chạy lệnh trên máy này theo yêu cầu của Thanh Vui; cần ghi vào nhật ký sử dụng AI của nhóm |
| Phạm vi | Chỉ các ca chạy trên **máy Thanh Vui**. Máy Nguyễn Thanh Tùng và Trần Đức Tùng chạy và ghi riêng |

Tệp này mô tả đầy đủ cấu hình, từng lượt chạy và từng nhóm ca của riêng máy Thanh Vui. 

## 1. Kết luận nhanh

| Bộ kiểm thử | Lệnh | Số ca | Đạt | Không đạt |
|---|---|---|---|---|
| Bộ gốc (đã có trong repo) | `npm run test:rules` | 46 | **46** | **0** |
| Bộ chuyên sâu (mới) | `npm run test:rules:deep` | 69 | **69** | **0** |
| **Tổng** | | **115** | **115** | **0** |

- Tất cả chạy trên **Firestore Emulator**. **Không** kết nối, **không** deploy, **không** ghi gì vào production.
- Kiểm thử đột biến: 113 bản `firestore.rules` bị sửa sai cố ý, **110/113 bị phát hiện**, 3 bản còn lại là đột biến tương đương (không phải lỗ hổng).
- Phát hiện 6 rủi ro còn tồn tại trong `firestore.rules` hiện tại (mục 7). **Chưa sửa** `firestore.rules`.
- `firestore.rules` mới **chưa deploy production** .

## 2. Cấu hình môi trường

### 2.1. Các thông số về công cụ và phiên bản

| Thành phần | Phiên bản |
|---|---|
| Hệ điều hành | Windows 11 Pro 10.0.22621 |
| Node.js | v24.22.0 |
| npm | 11.19.1 |
| Java (cho Emulator) | 21.0.2 LTS (`C:\Program Files\Java\jdk-21`) |
| `firebase-tools` | 14.27.0 |
| `firebase` (SDK) | 11.10.0 |
| `@firebase/rules-unit-testing` | 4.0.1 |
| Firestore Emulator | `cloud-firestore-emulator-v1.19.8.jar` (cache tại `C:\Users\Minx\.cache\firebase\emulators\`) |
| Emulator UI | `ui-v1.15.0` |
| Trình chạy test | `node --test` (node:test có sẵn trong Node) |

Phụ thuộc được cài bằng `npm ci` (máy chưa có `node_modules` trước khi chạy).

### 2.2. Project và chế độ

- Project ID: `demo-studytask`. Tiền tố `demo-` làm Emulator chạy chế độ demo: truy cập dịch vụ thật của project này đều thất bại, nên không thể chạm production.
- `singleProjectMode: true` (từ `firebase.json`).
- Dữ liệu nền của mỗi ca được dựng bằng `withSecurityRulesDisabled` và xóa bằng `clearFirestore` trước mỗi ca; không để lại dữ liệu giữa các ca.

### 2.3. Cổng dịch vụ (port)

**Cấu hình chuẩn của dự án** (`firebase.json`), dùng cho `npm run test:rules` và `npm run emulators`:

| Dịch vụ | Địa chỉ | Cổng |
|---|---|---|
| Firestore Emulator | 127.0.0.1 | **8080** (bộ gốc cố định cổng này trong `tests/firestore.rules.test.mjs`) |
| Firestore websocket (Emulator UI) | 127.0.0.1 | 9150 (mặc định, hiện trong log) |
| Authentication Emulator | 127.0.0.1 | 9099 (không bật khi chạy test rules vì `--only firestore`) |
| Emulator UI | 127.0.0.1 | 4000 (không bật khi chạy test rules) |

**Cổng tạm cho các lượt chạy mở rộng.** Sau lần chạy đầu, một tiến trình Java của Emulator còn sót lại chiếm cổng 8080 (xem 2.4). Để không đụng tiến trình đó và không xóa dữ liệu trong nó, các lượt sau dùng tệp cấu hình tạm (nằm ngoài repo) với cổng riêng, truyền bằng `firebase emulators:exec --config <tệp>`. Bộ chuyên sâu tự đọc cổng từ biến môi trường `FIRESTORE_EMULATOR_HOST` mà `emulators:exec` đặt. Bộ chuyên sâu cũng đọc rules từ biến `RULES_FILE` nếu có (dùng cho kiểm thử đột biến), mặc định là `firestore.rules`.

| Lượt | Firestore | Websocket |
|---|---|---|
| Lượt 1 (bộ gốc, bộ sâu lần đầu) | 8080 | 9150 |
| Bộ sâu 67/67; đột biến thử 3 bản; đột biến lần hỏng và lần lỗi đường dẫn | 8091 | 9191 |
| Đột biến thử 2 bản; đột biến lần hỏng cổng | 8101 | 9201 |
| **Đột biến đầy đủ 113 bản (kết quả dùng được)** | **8211** | **9311** |
| Chạy lại 4 bản sống sót | 8221 | 9321 |
| **Bộ sâu 69/69 (sau bổ sung)** | **8231** | **9331** |
| Bộ sâu 69/69 lấy chi tiết từng nhóm | 8241 | 9341 |

### 2.4. Tiến trình Java còn sót lại trên máy

`firebase emulators:exec` trên Windows không tắt hết tiến trình Java của Emulator sau khi xong. Hậu quả: cổng bị giữ và lần chạy sau báo "port taken". Máy hiện có nhiều tiến trình `java` như vậy, trong đó PID 13248 giữ cổng 8080 và 9150 (khởi động 17:25:23). Chưa xác định chắc tiến trình đó do ai mở nên **không tắt tự động**. Cách xử lý: mở Task Manager, kết thúc các tiến trình `java.exe` thuộc Firestore Emulator rồi chạy lại.

## 3. Cách chạy lại

```
npm ci
npm run test:rules          # bộ gốc, 46 ca, cổng 8080
npm run test:rules:deep     # bộ chuyên sâu, 69 ca, cổng 8080
```

Yêu cầu: Node.js, Java (JDK 11 trở lên) trong `PATH`, cổng 8080 và 9150 đang trống.

## 4. Nhật ký các lượt chạy trên máy Thanh Vui

Giờ theo giờ máy (UTC+7). Các lượt in đậm là kết quả dùng làm kết luận.

| # | Lượt chạy | Cách chạy | Cổng | Kết quả | Ghi chú |
|---|---|---|---|---|---|
| 1 | **Bộ gốc** | `npm run test:rules` | 8080 | **46/46 đạt**, 0 lỗi, ~4,3 giây, mã thoát 0 | Khoảng 17:15 (log UTC 10:15). Có cảnh báo "multiple instances of the emulator suite": chỉ là cảnh báo của công cụ |
| 2 | Bộ sâu lần đầu | `npm run test:rules:deep` | 8080 | 66/67 đạt, **1 lỗi** | Lỗi do **ca test sai**: tài khoản `NEW` chưa có hồ sơ nên ca "được phép" bị từ chối, kéo theo các ca "bị chặn" trong cùng test bị chặn vì lý do sai (đạt giả). Đã sửa ca |
| 3 | Bộ sâu sau sửa | `npm run test:rules:deep` | 8080 | Không chạy được | Cổng 8080 bị chiếm bởi Java sót lại sau lần chạy đầu tiên |
| 4 | Bộ sâu | `emulators:exec --config` | 8091 | **67/67 đạt** | Đổi sang cổng tạm; bộ sâu đọc cổng từ `FIRESTORE_EMULATOR_HOST` |
| 5 | Đột biến thử 3 bản | `mutate.mjs` | 8091 | 3/3 bị bắt | Kiểm tra công cụ chạy đúng |
| 6 | Đột biến đầy đủ lần 1 | chạy trên Emulator còn sót | 8091 | **Kết quả bỏ** ("104/113 sống sót") | Lỗi hạ tầng: Emulator tắt giữa chừng, lỗi kết nối bị công cụ tính nhầm thành "sống sót". Đã sửa công cụ (chỉ tính "sống sót" khi mọi ca đều đạt) |
| 7 | Đột biến lần 2 | `emulators:exec` | 8091 | Không chạy | Lỗi dấu nháy trong lệnh Windows |
| 8 | Đột biến lần 3 | `emulators:exec` | 8101 | Không chạy | Cổng 8101 còn Java sót từ lần thử 2 bản |
| 9 | **Đột biến đầy đủ** | `emulators:exec` | 8211 | **113 bản hợp lệ, 0 lỗi hạ tầng, 7 sống sót cả hai bộ** | Kết quả dùng làm kết luận, chi tiết ở mục 6 và phụ lục |
| 10 | **Chạy lại 4 bản sống sót sau bổ sung ca** | `ONLY=14,89,91,105` | 8221 | **4/4 bị bắt** | Sau khi thêm 2 ca vào bộ sâu |
| 11 | **Bộ sâu cuối** | `emulators:exec` | 8231 | **69/69 đạt** | |
| 12 | Bộ sâu lấy chi tiết nhóm | `emulators:exec` | 8241 | 69/69 đạt, 18,0 giây | Số liệu mục 5.2 lấy từ lượt này |

`firestore.rules` **không bị sửa** ở bất kỳ lượt nào (các bản đột biến nằm trong thư mục tạm ngoài repo và được truyền qua biến `RULES_FILE`).

## 5. Chi tiết từng bộ kiểm thử

### 5.1. Bộ gốc (lượt kiểm thử 1) – `tests/firestore.rules.test.mjs` (46 ca, đạt 46)

| Nhóm | Số ca | Đạt | Không đạt |
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

Trong nhật ký có nhiều dòng `PERMISSION_DENIED`. Đây là bình thường: các ca "KHÔNG được ..." cố ý thực hiện thao tác bị cấm và mong bị từ chối, ca vẫn tính là đạt.

### 5.2. Bộ chuyên sâu (Lượt kiểm thử 2)– `tests/firestore.rules.deep.test.mjs` (69 ca, đạt 69)

Mỗi ca "bị chặn" đều đi kèm ca "được phép" đối chứng cùng đường dẫn. Dữ liệu nền được dựng lại trước mỗi người trong ma trận.

| Nhóm | Số ca | Đạt | Không đạt | Nội dung chính |
|---|---|---|---|---|
| Mặc định từ chối | 3 | 3 | 0 | Collection không khai báo (kể cả admin); chưa đăng nhập không đọc/ghi/xóa được 12 collection |
| Vai trò lấy từ hồ sơ | 5 | 5 | 0 | Token tự khai `role: admin`; tài khoản không có hồ sơ; admin bị xóa hồ sơ; đổi role có hiệu lực ngay |
| `user/{uid}` – ca biên | 11 | 11 | 0 | Email lệch token, thừa/thiếu trường, tên 100/101 ký tự, sai kiểu, xóa trường cấm, ghi nửa hợp lệ nửa cấm, ma trận sửa/xóa/đọc |
| `userSecrets` – ma trận | 4 | 4 | 0 | Đọc, xóa, ghi theo vai trò; thiếu/sai kiểu/thừa trường |
| `userData` / `sharedData` – ma trận | 6 | 6 | 0 | Đọc, ghi, xóa theo vai trò |
| Quy chế điểm – ma trận | 9 | 9 | 0 | `gradingPolicies`, `gradingColumns` theo môn 1, 2, 3, id không phải số, giáo viên chỉ dạy môn 5 |
| Học phí – ma trận | 6 | 6 | 0 | `financeConfig`, `tuition` đọc/ghi/xóa |
| Chương trình đào tạo / Khóa luận | 6 | 6 | 0 | `curriculum`, `theses` đọc/ghi/xóa |
| `graduationApps` – ca biên | 10 | 10 | 0 | Trạng thái submitted/needsFix/approved/rejected, trường duyệt, người khác sửa/xóa, quyền Đào tạo/Admin |
| `activities` | 3 | 3 | 0 | Ghi, xóa theo chủ; đọc mở cho mọi người đã đăng nhập |
| Rủi ro còn tồn tại (R1–R6) | 6 | 6 | 0 | Ghi lại hiện trạng, xem mục 7 |
| **Tổng** | **69** | **69** | **0** | |

## 6. Kiểm thử đột biến (mutation testing)

### 6.1. Mục đích và cách làm

Ca "đạt" chưa chắc là ca "thật sự được thông qua". Cách kiểm tra: tự động sinh các bản `firestore.rules` bị **sửa sai cố ý**, chạy cả hai bộ test trên từng bản. Nếu cả hai bộ đều vẫn đạt, quy tắc đó chưa được kiểm thật sự.

Các kiểu sửa sai: bỏ từng vai trò khỏi `hasRole`; thêm vai trò `student`; đổi `isOwner`/`isAdmin` thành `signedIn`; đổi `&&` thành `||`; đổi `==` thành `!=`; xóa một điều kiện; nới danh sách trường cho phép; bỏ trường khỏi danh sách cấm; đổi biên số; bỏ kiểm tra `exists`; đổi điều kiện cho phép thành `true`.

Quy tắc phân loại của công cụ: "bị bắt" khi có ít nhất một ca lỗi; "sống sót" chỉ khi mọi ca đều đạt; lỗi kết nối được đếm riêng là lỗi hạ tầng.

### 6.2. Kết quả (lượt 9 và 10)

| Chỉ tiêu | Số bản |
|---|---|
| Đột biến hợp lệ | 113 |
| Lỗi hạ tầng | 0 |
| Bị bắt bởi cả 2 bộ | 74 |
| Chỉ bộ gốc bắt | 5 |
| Chỉ bộ sâu bắt | 27 |
| Sống sót lượt đầu, bắt được sau khi bổ sung ca | 4 |
| Sống sót, là đột biến tương đương | 3 |

Tổng của năm dòng cuối bằng 113. Số bản bị phát hiện cuối cùng là 110.

### 6.3. Bảy bản sống sót ở lượt đầu và cách xử lý

| Bản | Dòng | Mô tả | Xử lý |
|---|---|---|---|
| #14 | L34 | Giáo viên có môn khác vẫn ghi được cột điểm của môn không dạy (danh sách môn bị trộn) | Thêm ca: giáo viên chỉ được phân môn 5 ghi được môn 5, không ghi được môn 3. Chạy lại: bị bắt |
| #89 | L123 | Sinh viên khác sửa được phiếu tốt nghiệp "submitted" của người khác | Thêm ca sinh viên khác sửa/xóa phiếu submitted. Bị bắt |
| #91 | L123 | Như trên (xóa hẳn điều kiện chủ sở hữu) | Bị bắt |
| #105 | L128 | Sinh viên khác xóa được phiếu "submitted" của người khác | Bị bắt |
| #3 | L16 | Bỏ kiểm tra `exists()` trong `isAdmin()` | **Tương đương**: `get()` vào hồ sơ không tồn tại tự lỗi nên vẫn từ chối |
| #10 | L27 | Bỏ kiểm tra `exists()` trong `hasRole()` | **Tương đương**, lý do như trên |
| #76 | L118 | Thêm `student` vào `hasRole(['student'])` | **Tương đương**: điều kiện đã yêu cầu `student` |

Nguyên nhân thật của 4 bản đầu: các ca cũ chỉ thử sinh viên khác trên phiếu đã duyệt, nên bị điều kiện trạng thái chặn hộ, che mất việc thiếu kiểm tra chủ sở hữu.

### 6.4. Giá trị của hai bộ khi dùng cùng nhau

- Chỉ bộ gốc bắt: 5 bản.
- Chỉ bộ sâu bắt: 27 bản, cộng 4 bản bắt sau khi bổ sung = 31 bản mà riêng bộ gốc bỏ sót.
- Kết luận: nên giữ cả hai bộ.

## 7. Rủi ro phát hiện trong `firestore.rules` hiện tại

Sáu ca R1–R6 trong bộ chuyên sâu ghi lại hiện trạng (đúng với rules hiện tại, không phải hành vi mong muốn). Khi rules được siết lại, ca tương ứng sẽ lỗi và cần cập nhật.

| Mã | Mô tả | Mức | Đề xuất |
|---|---|---|---|
| R1 | Mọi người đã đăng nhập đọc được toàn bộ `user/{uid}` của người khác, **kể cả trường `password` cũ** nếu còn | **Cao** | Xóa trường `password` còn sót khỏi `user/{uid}`, hoặc giới hạn đọc hồ sơ |
| R2 | `userSecrets` chấp nhận mật khẩu rỗng/ngắn, rules không kiểm độ dài | Trung bình | Thêm điều kiện độ dài tối thiểu |
| R3 | `activities` của người khác đọc được bởi mọi sinh viên | Trung bình | Giới hạn đọc cho chủ, admin, giáo viên liên quan |
| R4 | `phone` không kiểm kiểu/độ dài (số, đối tượng, chuỗi 5000 ký tự đều lọt) | Thấp | Kiểm `is string` và `size()` |
| R5 | Giáo viên xóa hoặc ghi đè được toàn bộ `sharedData` | Trung bình | Tách quyền theo trường hoặc chỉ cho sửa phần của mình |
| R6 | Admin và Đào tạo không tạo được phiếu tốt nghiệp thay sinh viên (create chỉ cho role `student`) | Trung bình | Cần xác định rõ lại phân quyền và mục đích của mục |

Chưa sửa `firestore.rules` vì ngoài phạm vi và cần Thầy đồng ý trước khi deploy.

## 8. Giới hạn của kết quả

- Chỉ kiểm quy tắc trên Emulator; không kiểm hành vi giao diện gọi vào Firestore và không kiểm production.
- Kiểm thử đột biến chỉ chứng minh test phát hiện được các kiểu sửa sai đã nêu, không phải mọi lỗi.
- Chưa có kiểm thử về giới hạn kích thước, chi phí truy vấn, hay xác thực email (Authentication).
- Chưa có các bản kiểm thử liên quan đến việc truy vấn trên công cụ lưu trữ
- `npm run test:logic` (kiểm thử phần tính toán) chưa chạy trong lượt này.
- Việc còn lại: Nguyễn Thanh Tùng và Trần Đức Tùng chạy trên máy mình ghi lại kết quả kiểm thử bằng file riêng, tổng hợp thành một file kiểm thử hoàn chỉnh ghi nhận kết quả trên cả ba thiết bị  .

## Phụ lục A. Chi tiết 113 bản đột biến

"bắt (n)" là có n ca lỗi (bản sai bị phát hiện); "sống (0)" là mọi ca vẫn đạt (không phát hiện).

| # | Dòng | Kiểu sửa sai | Đoạn rules gốc | Bộ gốc 46 ca | Bộ sâu | Kết luận |
|---|---|---|---|---|---|---|
| 0 | L7 | signedIn luôn đúng | `return request.auth != null;` | bắt (1) | bắt (8) | Bị bắt bởi cả 2 bộ |
| 1 | L15 | &&→\|\| | `return signedIn() &&` | bắt (17) | bắt (21) | Bị bắt bởi cả 2 bộ |
| 2 | L16 | &&→\|\| | `exists(/databases/$(database)/documents/user/$(request.auth.uid)) &&` | bắt (15) | bắt (16) | Bị bắt bởi cả 2 bộ |
| 3 | L16 | xóa điều kiện | `exists(/databases/$(database)/documents/user/$(request.auth.uid)) &&` | sống (0) | sống (0) | Sống sót – đột biến tương đương |
| 4 | L17 | ==→!= | `myRole() == 'admin';` | bắt (18) | bắt (17) | Bị bắt bởi cả 2 bộ |
| 5 | L21 | &&→\|\| | `return signedIn() && request.auth.uid == uid;` | bắt (6) | bắt (11) | Bị bắt bởi cả 2 bộ |
| 6 | L21 | ==→!= | `return signedIn() && request.auth.uid == uid;` | bắt (12) | bắt (21) | Bị bắt bởi cả 2 bộ |
| 7 | L21 | isOwner luôn đúng | `return signedIn() && request.auth.uid == uid;` | bắt (6) | bắt (11) | Bị bắt bởi cả 2 bộ |
| 8 | L26 | &&→\|\| | `return signedIn() &&` | bắt (15) | bắt (30) | Bị bắt bởi cả 2 bộ |
| 9 | L27 | &&→\|\| | `exists(/databases/$(database)/documents/user/$(request.auth.uid)) &&` | bắt (15) | bắt (28) | Bị bắt bởi cả 2 bộ |
| 10 | L27 | xóa điều kiện | `exists(/databases/$(database)/documents/user/$(request.auth.uid)) &&` | sống (0) | sống (0) | Sống sót – đột biến tương đương |
| 11 | L33 | thêm vai trò student | `return hasRole(['teacher']) &&` | bắt (1) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 12 | L33 | &&→\|\| | `return hasRole(['teacher']) &&` | bắt (2) | bắt (5) | Bị bắt bởi cả 2 bộ |
| 13 | L34 | subjectIds mặc định không rỗng | `get(/databases/$(database)/documents/user/$(request.auth.uid)).data...` | sống (0) | bắt (4) | Chỉ bộ sâu bắt |
| 14 | L34 | hasAny→hasAll(rỗng ok) | `get(/databases/$(database)/documents/user/$(request.auth.uid)).data...` | sống (0) | sống (0), sau bổ sung: bắt | Bắt được sau khi bổ sung ca (lượt 10) |
| 15 | L43 | isAdmin→signedIn | `allow create: if isAdmin() \|\| (` | bắt (2) | bắt (3) | Bị bắt bởi cả 2 bộ |
| 16 | L44 | isOwner→signedIn | `isOwner(uid) &&` | sống (0) | bắt (1) | Chỉ bộ sâu bắt |
| 17 | L44 | &&→\|\| | `isOwner(uid) &&` | bắt (2) | bắt (3) | Bị bắt bởi cả 2 bộ |
| 18 | L44 | xóa điều kiện | `isOwner(uid) &&` | sống (0) | bắt (1) | Chỉ bộ sâu bắt |
| 19 | L45 | &&→\|\| | `request.resource.data.keys().hasOnly(['name', 'email', 'role']) &&` | bắt (2) | bắt (3) | Bị bắt bởi cả 2 bộ |
| 20 | L45 | xóa điều kiện | `request.resource.data.keys().hasOnly(['name', 'email', 'role']) &&` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 21 | L45 | thêm 'subjectIds' vào hasOnly(create) | `request.resource.data.keys().hasOnly(['name', 'email', 'role']) &&` | bắt (1) | sống (0) | Chỉ bộ gốc bắt |
| 22 | L46 | &&→\|\| | `request.resource.data.role == 'student' &&` | bắt (2) | bắt (3) | Bị bắt bởi cả 2 bộ |
| 23 | L46 | ==→!= | `request.resource.data.role == 'student' &&` | bắt (2) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 24 | L46 | xóa điều kiện | `request.resource.data.role == 'student' &&` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 25 | L47 | ==→!= | `request.resource.data.email == request.auth.token.email` | bắt (1) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 26 | L51 | isAdmin→signedIn | `allow update: if isAdmin() \|\| (` | bắt (8) | bắt (6) | Bị bắt bởi cả 2 bộ |
| 27 | L52 | isOwner→signedIn | `isOwner(uid) &&` | bắt (1) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 28 | L52 | &&→\|\| | `isOwner(uid) &&` | bắt (7) | bắt (6) | Bị bắt bởi cả 2 bộ |
| 29 | L52 | xóa điều kiện | `isOwner(uid) &&` | bắt (1) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 30 | L53 | &&→\|\| | `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['...` | bắt (8) | bắt (6) | Bị bắt bởi cả 2 bộ |
| 31 | L53 | xóa điều kiện | `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['...` | bắt (5) | bắt (3) | Bị bắt bởi cả 2 bộ |
| 32 | L53 | thêm 'role' vào hasOnly | `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['...` | bắt (2) | bắt (3) | Bị bắt bởi cả 2 bộ |
| 33 | L53 | bỏ 'phone' khỏi hasOnly | `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['...` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 34 | L54 | &&→\|\| | `request.resource.data.name is string && request.resource.data.name....` | bắt (8) | bắt (6) | Bị bắt bởi cả 2 bộ |
| 35 | L54 | &&→\|\| | `request.resource.data.name is string && request.resource.data.name....` | bắt (8) | bắt (6) | Bị bắt bởi cả 2 bộ |
| 36 | L54 | xóa điều kiện | `request.resource.data.name is string && request.resource.data.name....` | bắt (1) | sống (0) | Chỉ bộ gốc bắt |
| 37 | L54 | > 0 → >= 0 | `request.resource.data.name is string && request.resource.data.name....` | bắt (1) | sống (0) | Chỉ bộ gốc bắt |
| 38 | L55 | <= 100 → <= 101 | `request.resource.data.name.size() <= 100` | sống (0) | bắt (1) | Chỉ bộ sâu bắt |
| 39 | L55 | <= 100 → < 100 | `request.resource.data.name.size() <= 100` | sống (0) | bắt (1) | Chỉ bộ sâu bắt |
| 40 | L58 | isAdmin→signedIn | `allow delete: if isAdmin();` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 41 | L65 | isAdmin→signedIn | `allow read, delete: if isAdmin();` | bắt (3) | bắt (5) | Bị bắt bởi cả 2 bộ |
| 42 | L66 | isAdmin→signedIn | `allow create, update: if isAdmin() \|\| (` | bắt (2) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 43 | L67 | isOwner→signedIn | `isOwner(uid) &&` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 44 | L67 | &&→\|\| | `isOwner(uid) &&` | bắt (2) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 45 | L67 | xóa điều kiện | `isOwner(uid) &&` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 46 | L68 | &&→\|\| | `request.resource.data.keys().hasOnly(['password', 'updatedAt']) &&` | bắt (2) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 47 | L68 | xóa điều kiện | `request.resource.data.keys().hasOnly(['password', 'updatedAt']) &&` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 48 | L68 | thêm 'role' vào hasOnly(secrets) | `request.resource.data.keys().hasOnly(['password', 'updatedAt']) &&` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 49 | L75 | isOwner→signedIn | `allow read, write: if isOwner(uid) \|\| isAdmin();` | bắt (1) | bắt (3) | Bị bắt bởi cả 2 bộ |
| 50 | L75 | isAdmin→signedIn | `allow read, write: if isOwner(uid) \|\| isAdmin();` | bắt (1) | bắt (3) | Bị bắt bởi cả 2 bộ |
| 51 | L81 | bỏ vai trò 'admin' | `allow write: if hasRole(['admin', 'teacher', 'training']);` | bắt (1) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 52 | L81 | bỏ vai trò 'teacher' | `allow write: if hasRole(['admin', 'teacher', 'training']);` | bắt (1) | bắt (4) | Bị bắt bởi cả 2 bộ |
| 53 | L81 | bỏ vai trò 'training' | `allow write: if hasRole(['admin', 'teacher', 'training']);` | bắt (1) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 54 | L81 | thêm vai trò student | `allow write: if hasRole(['admin', 'teacher', 'training']);` | bắt (1) | bắt (3) | Bị bắt bởi cả 2 bộ |
| 55 | L88 | bỏ vai trò 'admin' | `allow write: if hasRole(['admin', 'training']);` | sống (0) | bắt (2) | Chỉ bộ sâu bắt |
| 56 | L88 | bỏ vai trò 'training' | `allow write: if hasRole(['admin', 'training']);` | bắt (1) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 57 | L88 | thêm vai trò student | `allow write: if hasRole(['admin', 'training']);` | bắt (1) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 58 | L93 | thêm vai trò student | `allow write: if hasRole(['admin']) \|\| teachesSubject(subjectId);` | bắt (1) | bắt (4) | Bị bắt bởi cả 2 bộ |
| 59 | L100 | bỏ vai trò 'admin' | `allow write: if hasRole(['admin', 'finance']);` | sống (0) | bắt (2) | Chỉ bộ sâu bắt |
| 60 | L100 | bỏ vai trò 'finance' | `allow write: if hasRole(['admin', 'finance']);` | bắt (1) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 61 | L100 | thêm vai trò student | `allow write: if hasRole(['admin', 'finance']);` | bắt (1) | bắt (3) | Bị bắt bởi cả 2 bộ |
| 62 | L104 | bỏ vai trò 'admin' | `allow read: if isOwner(uid) \|\| hasRole(['admin', 'finance']);` | sống (0) | bắt (1) | Chỉ bộ sâu bắt |
| 63 | L104 | bỏ vai trò 'finance' | `allow read: if isOwner(uid) \|\| hasRole(['admin', 'finance']);` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 64 | L104 | thêm vai trò student | `allow read: if isOwner(uid) \|\| hasRole(['admin', 'finance']);` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 65 | L104 | isOwner→signedIn | `allow read: if isOwner(uid) \|\| hasRole(['admin', 'finance']);` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 66 | L105 | bỏ vai trò 'admin' | `allow write: if hasRole(['admin', 'finance']);` | sống (0) | bắt (2) | Chỉ bộ sâu bắt |
| 67 | L105 | bỏ vai trò 'finance' | `allow write: if hasRole(['admin', 'finance']);` | bắt (1) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 68 | L105 | thêm vai trò student | `allow write: if hasRole(['admin', 'finance']);` | bắt (1) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 69 | L111 | bỏ vai trò 'admin' | `allow write: if hasRole(['admin', 'training']);` | sống (0) | bắt (2) | Chỉ bộ sâu bắt |
| 70 | L111 | bỏ vai trò 'training' | `allow write: if hasRole(['admin', 'training']);` | bắt (1) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 71 | L111 | thêm vai trò student | `allow write: if hasRole(['admin', 'training']);` | sống (0) | bắt (2) | Chỉ bộ sâu bắt |
| 72 | L116 | bỏ vai trò 'admin' | `allow read: if isOwner(uid) \|\| hasRole(['admin', 'training']);` | sống (0) | bắt (1) | Chỉ bộ sâu bắt |
| 73 | L116 | bỏ vai trò 'training' | `allow read: if isOwner(uid) \|\| hasRole(['admin', 'training']);` | sống (0) | bắt (1) | Chỉ bộ sâu bắt |
| 74 | L116 | thêm vai trò student | `allow read: if isOwner(uid) \|\| hasRole(['admin', 'training']);` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 75 | L116 | isOwner→signedIn | `allow read: if isOwner(uid) \|\| hasRole(['admin', 'training']);` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 76 | L118 | thêm vai trò student | `allow create: if hasRole(['student']) && isOwner(uid) &&` | sống (0) | sống (0) | Sống sót – đột biến tương đương |
| 77 | L118 | isOwner→signedIn | `allow create: if hasRole(['student']) && isOwner(uid) &&` | bắt (1) | sống (0) | Chỉ bộ gốc bắt |
| 78 | L118 | &&→\|\| | `allow create: if hasRole(['student']) && isOwner(uid) &&` | bắt (2) | bắt (3) | Bị bắt bởi cả 2 bộ |
| 79 | L118 | &&→\|\| | `allow create: if hasRole(['student']) && isOwner(uid) &&` | bắt (2) | bắt (5) | Bị bắt bởi cả 2 bộ |
| 80 | L119 | &&→\|\| | `request.resource.data.status == 'submitted' &&` | bắt (2) | bắt (5) | Bị bắt bởi cả 2 bộ |
| 81 | L119 | ==→!= | `request.resource.data.status == 'submitted' &&` | bắt (4) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 82 | L119 | xóa điều kiện | `request.resource.data.status == 'submitted' &&` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 83 | L120 | bỏ review khỏi danh sách cấm | `!request.resource.data.keys().hasAny(['review', 'reviewedBy', 'revi...` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 84 | L120 | bỏ reviewedBy khỏi danh sách cấm | `!request.resource.data.keys().hasAny(['review', 'reviewedBy', 'revi...` | sống (0) | bắt (1) | Chỉ bộ sâu bắt |
| 85 | L120 | bỏ reviewedAt khỏi danh sách cấm | `!request.resource.data.keys().hasAny(['review', 'reviewedBy', 'revi...` | sống (0) | bắt (1) | Chỉ bộ sâu bắt |
| 86 | L122 | bỏ vai trò 'admin' | `allow update: if hasRole(['admin', 'training']) \|\| (` | sống (0) | bắt (1) | Chỉ bộ sâu bắt |
| 87 | L122 | bỏ vai trò 'training' | `allow update: if hasRole(['admin', 'training']) \|\| (` | bắt (2) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 88 | L122 | thêm vai trò student | `allow update: if hasRole(['admin', 'training']) \|\| (` | bắt (2) | bắt (4) | Bị bắt bởi cả 2 bộ |
| 89 | L123 | isOwner→signedIn | `isOwner(uid) &&` | sống (0) | sống (0), sau bổ sung: bắt | Bắt được sau khi bổ sung ca (lượt 10) |
| 90 | L123 | &&→\|\| | `isOwner(uid) &&` | bắt (2) | bắt (3) | Bị bắt bởi cả 2 bộ |
| 91 | L123 | xóa điều kiện | `isOwner(uid) &&` | sống (0) | sống (0), sau bổ sung: bắt | Bắt được sau khi bổ sung ca (lượt 10) |
| 92 | L124 | &&→\|\| | `resource.data.status in ['submitted', 'needsFix'] &&` | bắt (2) | bắt (3) | Bị bắt bởi cả 2 bộ |
| 93 | L124 | xóa điều kiện | `resource.data.status in ['submitted', 'needsFix'] &&` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 94 | L124 | cho sửa cả khi approved | `resource.data.status in ['submitted', 'needsFix'] &&` | bắt (1) | sống (0) | Chỉ bộ gốc bắt |
| 95 | L124 | bỏ needsFix | `resource.data.status in ['submitted', 'needsFix'] &&` | bắt (1) | bắt (1) | Bị bắt bởi cả 2 bộ |
| 96 | L125 | &&→\|\| | `request.resource.data.status == 'submitted' &&` | bắt (2) | bắt (3) | Bị bắt bởi cả 2 bộ |
| 97 | L125 | ==→!= | `request.resource.data.status == 'submitted' &&` | bắt (1) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 98 | L125 | xóa điều kiện | `request.resource.data.status == 'submitted' &&` | sống (0) | bắt (1) | Chỉ bộ sâu bắt |
| 99 | L126 | bỏ review khỏi danh sách cấm | `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['...` | bắt (1) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 100 | L126 | bỏ reviewedBy khỏi danh sách cấm | `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['...` | sống (0) | bắt (1) | Chỉ bộ sâu bắt |
| 101 | L126 | bỏ reviewedAt khỏi danh sách cấm | `!request.resource.data.diff(resource.data).affectedKeys().hasAny(['...` | sống (0) | bắt (1) | Chỉ bộ sâu bắt |
| 102 | L128 | bỏ vai trò 'admin' | `allow delete: if hasRole(['admin', 'training']) \|\| (isOwner(uid) ...` | sống (0) | bắt (1) | Chỉ bộ sâu bắt |
| 103 | L128 | bỏ vai trò 'training' | `allow delete: if hasRole(['admin', 'training']) \|\| (isOwner(uid) ...` | sống (0) | bắt (1) | Chỉ bộ sâu bắt |
| 104 | L128 | thêm vai trò student | `allow delete: if hasRole(['admin', 'training']) \|\| (isOwner(uid) ...` | sống (0) | bắt (3) | Chỉ bộ sâu bắt |
| 105 | L128 | isOwner→signedIn | `allow delete: if hasRole(['admin', 'training']) \|\| (isOwner(uid) ...` | sống (0) | sống (0), sau bổ sung: bắt | Bắt được sau khi bổ sung ca (lượt 10) |
| 106 | L128 | &&→\|\| | `allow delete: if hasRole(['admin', 'training']) \|\| (isOwner(uid) ...` | sống (0) | bắt (3) | Chỉ bộ sâu bắt |
| 107 | L128 | ==→!= | `allow delete: if hasRole(['admin', 'training']) \|\| (isOwner(uid) ...` | sống (0) | bắt (3) | Chỉ bộ sâu bắt |
| 108 | L134 | bỏ vai trò 'admin' | `allow write: if hasRole(['admin', 'training']);` | sống (0) | bắt (4) | Chỉ bộ sâu bắt |
| 109 | L134 | bỏ vai trò 'training' | `allow write: if hasRole(['admin', 'training']);` | bắt (1) | bắt (2) | Bị bắt bởi cả 2 bộ |
| 110 | L134 | thêm vai trò student | `allow write: if hasRole(['admin', 'training']);` | bắt (1) | bắt (3) | Bị bắt bởi cả 2 bộ |
| 111 | L142 | isOwner→signedIn | `allow write: if isOwner(uid) \|\| isAdmin();` | sống (0) | bắt (2) | Chỉ bộ sâu bắt |
| 112 | L142 | isAdmin→signedIn | `allow write: if isOwner(uid) \|\| isAdmin();` | sống (0) | bắt (2) | Chỉ bộ sâu bắt |

