# Báo cáo kiểm thử nguồn điểm quizResults – Bảng điểm và Báo cáo lớp (19/11/2026)

- Người thực hiện: **Nguyễn Thanh Tùng** (có AI hỗ trợ, nhãn `[AI]`).
- Phạm vi: việc 7 tuần 7, sau PR #58. Mục tiêu là Bảng điểm và Báo cáo lớp lấy điểm trắc nghiệm từ `quizResults`, không lấy từ nhật ký `activities`.
- Mã kiểm tra: `master` `f2f47a6`. PR #58 (`25bc2bc`) **đã gộp** vào `master` ngày 16/11 (commit gộp `cd2ab09`).
- Nhánh sửa: `fix/tuan7-diem-quizresults-loi-tai`.
- Môi trường:
  - API `server/studytask_api.py` chạy trên máy cục bộ với CSDL tạm, nạp dữ liệu bằng `tests/server/seed_diem_quizresults.py`.
  - Giao diện web phục vụ cùng địa chỉ với `/api`, giống nginx khi triển khai.
  - Ảnh chụp bằng Edge chạy ẩn (headless), khổ 1280 px.
  - Không thử trên máy chủ thật.
- Minh chứng: thư mục [`minh-chung/2026-11-19-diem-quizresults/`](minh-chung/2026-11-19-diem-quizresults/). Mỗi màn hình có ảnh `.png` và nội dung chữ `.txt`. Phản hồi máy chủ nằm trong các tệp `may-chu-quiz-results-*.json`.

## 1. Kết luận nhanh

| Màn hình | Số ca | Đạt | Không đạt trước khi sửa | Sau khi sửa |
|---|---|---|---|---|
| Bảng điểm (`components/GradeBook.js`) | 8 | 7 | 1 (ca BĐ-8) | 8/8 |
| Báo cáo lớp (`pages/Reports.js`, tab Theo dõi hoạt động) | 8 | 7 | 1 (ca BC-8) | 8/8 |
| Máy chủ `GET /api/quiz/results` | 7 | 7 | 0 | 7/7 |

- Trong mọi ca máy chủ trả lời bình thường, **hai màn hình dùng cùng nguồn `quizResults`**. Điểm hiển thị khớp với máy chủ đến từng bài. Ca nhật ký có điểm giả, nhiều lần làm bài hoặc bị mất cũng vậy.
- **Một lỗi đã sửa:** khi `GET /api/quiz/results` lỗi (500, mất mạng, hết phiên), cả hai màn hình lặng lẽ quay về điểm trong nhật ký. Ví dụ sv02 hiện 9 điểm trong khi điểm chính thức là 6.7, và người xem không được báo gì (mục 5).
- Không đổi cấu trúc dữ liệu và không sửa máy chủ. Chỉ thu hẹp đường quay về nhật ký (còn đúng trường hợp máy chủ bản cũ trả 404) và thêm thông báo lỗi ở hai màn hình.

## 2. Bước 1 – Kiểm tra mã

| # | Đối tượng | Kết quả |
|---|---|---|
| 1 | PR #58 | Đã gộp vào `master` (`cd2ab09`, 16/11). CI của PR: `test:logic` 97/97, 15 bộ test máy chủ đạt (theo mô tả commit). |
| 2 | `components/GradeBook.js` | Đọc điểm qua `fetchActivities` của `app.js`. Cột "Điểm gốc" lấy sự kiện `quiz` cuối cùng của (sinh viên, môn, đề). Cột "Điểm" là điểm giáo viên sửa (`grades`), nếu chưa sửa thì bằng điểm gốc. Đã có tham số `user` (PR #58 sửa lỗi ReferenceError). |
| 3 | `pages/Reports.js` | Đọc điểm qua cùng `fetchActivities`. Mỗi đề lấy bản mới nhất (`quizMap`), cột "Điểm TB" là trung bình các đề. |
| 4 | `utils/quizScores.js` | `applyQuizResults` bỏ mọi sự kiện `quiz` trong nhật ký rồi thay bằng kết quả chính thức. Sinh viên có kết quả mà chưa có nhật ký vẫn được thêm vào. Đã có 7 test logic. |
| 5 | `GET /api/quiz/results` | Admin xem tất cả. Giáo viên chỉ xem môn trong `subjectIds` và lớp học phần trong `sections`. Sinh viên nhận 403, chưa đăng nhập nhận 401. Phản hồi không kèm `answers`. Đã có test trong `test_quiz_v3.py` và `test_class_scope.py`. |
| 6 | Màn hình còn đọc điểm từ `activities` | **Không còn màn hình điểm nào đọc trực tiếp.** Bảng điểm, Báo cáo lớp và thống kê tổng quan của Admin (`utils/systemStats.js`) đều qua `fetchActivities`, tức là đã thay bằng `quizResults`. Riêng chế độ demo (`?offline`, không có máy chủ) vẫn dùng dữ liệu mẫu và `localStorage` như thiết kế. Lỗ hổng duy nhất là nhánh xử lý lỗi ở mục 5. |

## 3. Dữ liệu thử

Tạo bằng `tests/server/seed_diem_quizresults.py`. Sinh viên nộp bài qua API nên máy chủ tự chấm. Nhật ký cũ được ghi thẳng vào CSDL tạm để giả lập dữ liệu trước V3 và nhật ký bị cắt.

| Tài khoản | Lớp/môn | quizResults (máy chủ chấm) | Nhật ký `activities` (không phải nguồn điểm) |
|---|---|---|---|
| gv01 | dạy môn 1 "Lập trình Web", chỉ lớp A1 | – | – |
| gv02 | dạy môn 2 "Cơ sở dữ liệu" (hồ sơ chưa phân lớp) | – | – |
| sv01 | A1, môn 1 | Q101: **10** (3/3); Q102: **3.3** (1/3); nộp Q101 lần 2 bị từ chối 409 | đã xóa (giả lập nhật ký bị mất) |
| sv02 | A1, môn 1 | Q101: **6.7** (2/3) | 2 sự kiện quiz Q101 giả: 10 và 9 điểm (nhiều lần làm) |
| sv03 | A1, môn 1 | chưa làm | – |
| sv04 | C1, môn 1 (khác lớp của gv01) | Q101: **0** (0/3) | sự kiện máy chủ ghi |
| sv05 | A1, môn 2 | **không có quizResults** | 1 sự kiện quiz Q201 giả: 8 điểm |

## 4. Bước 2 – Kết quả kiểm thử

### 4.1. Bảng điểm (Quản lý lớp học → Bảng điểm & Chấm điểm)

| # | Ca | Vai | Mong đợi | Kết quả | Minh chứng |
|---|---|---|---|---|---|
| BĐ-1 | SV đã nộp (sv01) | gv01 | Điểm gốc Q101 = 10, Q102 = 3.3 | Đạt (10; 3.3; tạm tính môn 6.7) | `gv01-bang-diem-sv01.png` |
| BĐ-2 | SV chưa làm (sv03) | gv01 | "Chưa làm" ở cả 2 đề, điểm TB "—" | Đạt | `gv01-bang-diem-sv03.png` |
| BĐ-3 | Không có quizResults, nhật ký có 8 điểm (sv05) | gv02, Admin | "Chưa làm", không lấy 8 từ nhật ký | Đạt | `gv02-bang-diem-sv05.png`, `admin-bang-diem-sv05.txt` |
| BĐ-4 | Nhiều lần làm bài (sv02: nhật ký 10 và 9; sv01 nộp lại → 409) | gv01 | sv02 = 6.7; sv01 Q101 giữ 10 | Đạt | `gv01-bang-diem-sv02.png` |
| BĐ-5 | Nhật ký bị mất (sv01) | gv01 | Vẫn hiện điểm chính thức | Đạt (10; 3.3) | `gv01-bang-diem-sv01.png` |
| BĐ-6 | Quyền xem: gv01 chỉ lớp A1 | gv01 | Danh sách SV: sv01, sv02, sv03; không có sv04 (lớp C1) | Đạt | `gv01-bang-diem-sv01.txt` |
| BĐ-7 | Quyền xem: Admin | Admin | Thấy cả sv04, Q101 = 0 | Đạt | `admin-bang-diem-sv04.png` |
| BĐ-8 | Máy chủ lỗi 500 ở `/api/quiz/results` | Admin | Báo lỗi, không hiện điểm nhật ký | **Không đạt trước khi sửa:** sv02 hiện 9, sv01 "Chưa làm", không báo lỗi. **Đạt sau khi sửa:** thông báo đỏ, không hiện điểm | `truoc-sua-loi-500-bang-diem-sv02.png`, `sau-sua-loi-500-bang-diem.png` |

### 4.2. Báo cáo lớp (Quản lý lớp học → Theo dõi hoạt động)

| # | Ca | Vai | Mong đợi | Kết quả | Minh chứng |
|---|---|---|---|---|---|
| BC-1 | SV đã nộp | gv01 | Tab Điểm trắc nghiệm: Q101 sv01 10 (3/3), sv02 6.7 (2/3); Q102 sv01 3.3 (1/3) | Đạt | `gv01-bao-cao-diem-trac-nghiem.png` |
| BC-2 | SV chưa làm (sv03) | gv01 | Tab Theo sinh viên: trắc nghiệm 0, điểm TB "—" | Đạt | `gv01-bao-cao-theo-sinh-vien.png` |
| BC-3 | Không có quizResults (môn 2) | gv02, Admin | Q201 "0/1 đã làm", "Chưa có sinh viên nào làm bài này" | Đạt | `gv02-bao-cao-diem-trac-nghiem.png`, `admin-bao-cao-mon2-diem-trac-nghiem.png` |
| BC-4 | Nhiều lần làm bài (sv02) | gv01 | Một dòng Q101 = 6.7, không phải 10 hoặc 9 | Đạt | `gv01-bao-cao-diem-trac-nghiem.png` |
| BC-5 | Nhật ký bị mất (sv01) | gv01 | sv01 vẫn có 2 bài, điểm TB 6.7 | Đạt | `gv01-bao-cao-theo-sinh-vien.png` |
| BC-6 | Quyền xem: gv01 chỉ lớp A1 | gv01 | Sĩ số 3, Q101 "2/3 đã làm", không có sv04 | Đạt | `gv01-bao-cao-theo-sinh-vien.png` |
| BC-7 | Quyền xem: Admin | Admin | Sĩ số 4, Q101 "3/4 đã làm", sv04 = 0 | Đạt | `admin-bao-cao-mon1-diem-trac-nghiem.png` |
| BC-8 | Máy chủ lỗi 500 ở `/api/quiz/results` | Admin | Báo lỗi, không hiện điểm nhật ký | **Không đạt trước khi sửa:** Q101 sv02 = 9 (ngày 02/11 của nhật ký), sv01 mất khỏi danh sách đã làm, Q201 sv05 = 8. **Đạt sau khi sửa** | `truoc-sua-loi-500-bao-cao-mon2.png`, `sau-sua-loi-500-bao-cao.png` |

### 4.3. Đối chiếu giữa hai màn hình và máy chủ

Phản hồi máy chủ lưu ở `may-chu-quiz-results-gv01.json` và `may-chu-quiz-results-ad01.json`. Tài khoản gv02 nhận `[]`, sv01 nhận 403 (`may-chu-quiz-results-sv01.json`).

| Sinh viên / đề | Máy chủ `score` (`correct/total`) | Báo cáo lớp | Bảng điểm (Điểm gốc) | Khớp |
|---|---|---|---|---|
| sv01 / Q101 | 10.0 (3/3) | 10 (3/3 câu) | 10 | ✔ |
| sv01 / Q102 | 3.3 (1/3) | 3.3 (1/3 câu) | 3.3 | ✔ |
| sv02 / Q101 | 6.7 (2/3) | 6.7 (2/3 câu) | 6.7 | ✔ |
| sv03 / – | không có dòng | 0 bài, "—" | Chưa làm | ✔ |
| sv04 / Q101 (Admin) | 0.0 (0/3) | 0 (0/3 câu) | 0 | ✔ |
| sv04 (gv01) | không có dòng (khác lớp) | không có trong danh sách | không có trong danh sách | ✔ |
| sv05 / Q201 | không có dòng | 0/1 đã làm | Chưa làm | ✔ |

Điểm TB môn của sv01 là (10 + 3.3) / 2 = 6.65. Báo cáo lớp (cột Điểm TB) và Bảng điểm (tạm tính môn) đều hiện 6.7.

### 4.4. Máy chủ `GET /api/quiz/results` (test tự động mới)

`tests/server/test_quiz_results_nguon_diem.py`: **13/13 ĐẠT**. Các ca:

- chưa ai nộp → `200 []`;
- sinh viên đã nộp có đúng 1 dòng, sinh viên chưa làm không có dòng;
- điểm giáo viên thấy khớp `GET /api/quiz/mine` của sinh viên (score, correct, total, submittedAt);
- nộp lần 2 → 409, điểm giữ nguyên lần đầu;
- nhật ký có sự kiện quiz giả 10/9/8 hoặc bị xóa hết thì `/quiz/results` không đổi;
- giáo viên môn khác nhận `[]`, sinh viên nhận 403, Admin thấy cùng dữ liệu với giáo viên dạy môn.

## 5. Lỗi phát hiện và cách sửa (Bước 3)

**L1 – Lỗi tải `quizResults` làm hai màn hình lặng lẽ dùng điểm trong nhật ký.**

- **Hiện tượng:** proxy cục bộ giả lập `/api/quiz/results` trả 500. Hai màn hình hiện điểm của nhật ký `activities` và không có thông báo nào:
  - sv02 hiện 9 thay vì 6.7;
  - sv01 hiện "Chưa làm" vì nhật ký bị mất;
  - sv05 hiện 8 dù chưa nộp.
- **Nguyên nhân:** `fetchActivities` trong `app.js` (PR #58) bắt **mọi** lỗi rồi trả lại nhật ký. Đường quay về này được viết cho máy chủ bản cũ chưa có endpoint, nhưng nó cũng chạy khi gặp lỗi 500, mất mạng hoặc hết phiên.
- **Cách sửa (giữ nguyên `applyQuizResults` và cấu trúc dữ liệu):**
  - `utils/quizScores.js`: thêm `loadOfficialActivities(loadActivities, loadResults)`. Hàm chỉ quay về nhật ký khi lỗi là 404 `not-found`/`http-404` (máy chủ bản cũ, giữ hành vi PR #58). Lỗi khác được ném ra. Thêm `quizScoresErrorText` để hai màn hình dùng chung một câu thông báo.
  - `app.js`: `fetchActivities` gọi `loadOfficialActivities` thay cho khối `try/catch` cũ.
  - `pages/Reports.js`, `components/GradeBook.js`: thêm nhánh xử lý lỗi cho promise, hiện thông báo đỏ thay cho điểm. Trước đây promise bị từ chối thì màn hình quay vòng mãi.
- **Sau khi sửa:**
  - Ca lỗi 500 hiện thông báo ở cả hai màn hình (`sau-sua-loi-500-*.png`).
  - Ca bình thường: nội dung chữ của 5 màn hình gv01 **giống hệt trước khi sửa** (đã so sánh từng tệp `.txt`).

## 6. Kiểm thử tự động

| Bộ test | Trước khi sửa | Sau khi sửa |
|---|---|---|
| `npm run test:logic` | 123/123 | **131/131** (+8 ca: nhiều lần làm bài, SV chưa làm, `loadOfficialActivities` với kết quả, danh sách rỗng, 404, 500/502, mất mạng/hết phiên, `isMissingEndpoint`) |
| `tests/server/test_quiz_results_nguon_diem.py` (mới, đã thêm vào CI) | – | **13/13** |
| `tests/server/test_quiz_v3.py` | 83 PASS | 83 PASS (máy chủ không đổi) |
| `tests/server/test_class_scope.py` | 24 PASS | 24 PASS |
| `tests/server/test_activities.py` | 162 PASS | 162 PASS |

Trên Windows cần đặt `PYTHONUTF8=1` khi chạy test máy chủ. Nếu thiếu, dòng in tiếng Việt gây lỗi mã hóa. Đây là lỗi của môi trường, không phải lỗi mã.

## 7. Ghi nhận (không sửa trong PR này)

1. **Điểm giáo viên sửa tay** (cột "Điểm" ở Bảng điểm) không hiện ở Báo cáo lớp. Báo cáo lớp luôn hiện điểm chính thức, tương ứng cột "Điểm gốc". Đây là cách làm hiện có, hai màn hình vẫn cùng nguồn `quizResults`. Nếu nhóm muốn Báo cáo lớp hiện điểm đã sửa thì cần thống nhất trước.
2. **Tổng quan Admin** (`pages/Admin.js`) tự bắt lỗi của `fetchActivities`. Sau khi sửa, nếu `/api/quiz/results` lỗi thì thẻ tổng quan không có số liệu hoạt động, thay vì dùng nhật ký như trước. Trường hợp này chỉ xảy ra khi máy chủ lỗi.
3. **Làm tròn điểm TB của đề** ở Báo cáo lớp dùng `toFixed(1)`. Ví dụ (10 + 6.7) / 2 = 8.35 hiện thành 8.3 do sai số dấu phẩy động. Điểm từng sinh viên không bị ảnh hưởng.
4. Lỗi "0 lượt nộp" trên thẻ đề ở trang Trắc nghiệm (ca 19, báo cáo V3 web thật) vẫn đếm từ `submissions`. Lỗi này không thuộc hai màn hình điểm nên không sửa ở đây.

## 8. Cách chạy lại

```bash
export PYTHONUTF8=1
D=$(mktemp -d)
STUDYTASK_DATA=$D STUDYTASK_PORT=8796 python server/studytask_api.py serve &
STUDYTASK_DATA=$D python tests/server/seed_diem_quizresults.py 8796
# Phục vụ thư mục web và chuyển /api/* sang 127.0.0.1:8796 (như nginx), rồi đăng nhập gv01 / gv02 / ad01.
npm run test:logic
python tests/server/test_quiz_results_nguon_diem.py
```
