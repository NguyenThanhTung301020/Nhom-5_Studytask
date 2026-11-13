# Sửa lỗi 03 – Các lỗi còn lại từ review PR9 lần 2 (R1–R7)

Ngày: 13/11/2026. Nguồn: [review lần 2 trên PR9](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/9) (soạn 11/11, đăng 13/11), mục 6 "Lỗi còn tồn tại".
Có AI tham gia đọc mã, viết kiểm thử và sửa (commit có nhãn `[AI]`).

## 1. Tổng hợp

| Mã | Lỗi | Sửa ở | Kiểm thử |
|---|---|---|---|
| R1 | Giáo viên sửa một môn làm mất môn, deadline, lịch… của môn khác | PR #50 (gộp 11/11) | `test_teacher_shared.py` 27 ca; trên mã cũ 15 ca hỏng |
| R2 | Bớt môn ở trang Chương trình ĐT chỉ đếm lịch học, lịch thi, deadline; môn còn bài tập, tài liệu, đề vẫn bớt được | PR này | `subjectUsageDetail` trong `test:logic`; `test_subject_removal.py` |
| R3 | Trang Môn học có đường xóa môn riêng, không kiểm tra gì, chỉ xóa kèm bài tập | PR này | Thử trên giao diện (mục 4) |
| R4 | Máy chủ không kiểm tra khi bỏ một môn còn được tham chiếu (gọi thẳng API là bớt được) | PR này | `test_subject_removal.py` 23 ca; trên mã cũ 11 ca hỏng |
| R5 | Đào tạo/Admin ghi được `evidence = 'javascript:…'` vào phiếu xét tốt nghiệp | PR này | `test_graduation.py` thêm 9 ca (24 ca); trên mã cũ 6 ca hỏng |
| R6 | Xuất CSV đề trắc nghiệm vẫn sinh công thức trong Excel | PR này | `test:logic` thêm 2 ca (xuất rồi nhập lại) |
| R7 | `firestore.rules` không kiểm tra scheme của `evidence` | Ghi chú trong `firestore.rules` | Không có (tệp chỉ còn là đặc tả) |

## 2. Quyết định: chặn hẳn, không xóa mềm

Review để nhóm chọn giữa chặn hẳn và xóa mềm (`archived: true`) khi bớt một môn còn dữ liệu. **Nguyễn Thanh Tùng chọn chặn hẳn** (13/11); **chờ nhóm xác nhận trong PR**. Lý do:

- Đây là cách PR37 đã làm cho lịch học, lịch thi, deadline; giờ chỉ mở rộng thêm loại dữ liệu.
- Xóa mềm phải sửa mọi trang đọc `subjects` để ẩn môn đã lưu trữ. Rủi ro lớn hơn, khó kiểm thử hơn trong một tuần.

"Còn dữ liệu" gồm: lịch học, lịch thi, deadline, bài tập, tài liệu, đề trắc nghiệm có `subjectId` của môn, và tài khoản có môn trong `subjectIds` (giáo viên được phân công, sinh viên đang học). Cột điểm (`gradingColumns`) là các bài tập được tính điểm, nên đã được chặn qua bài tập.

Hệ quả cần biết:

- Muốn bớt một môn, phải xử lý dữ liệu của môn trước, kể cả bỏ phân công giáo viên và sinh viên (Admin, trang Hồ sơ SV-GV).
- Giáo viên không còn tự xóa được môn mình đang dạy, vì chính tài khoản giáo viên đó vẫn được phân môn.
- Một lần ghi bỏ cả môn lẫn toàn bộ dữ liệu của môn vẫn được, vì máy chủ xét dữ liệu trên bản sau khi ghi.

## 3. Cách sửa

**R2, R3 – giao diện (`utils/curriculum.js`, `pages/Curriculum.js`, `pages/Subjects.js`, `app.js`):**

- `subjectUsageDetail(subjectId, data)` đếm từng loại dữ liệu và trả câu mô tả, ví dụ "1 bài tập, 1 tài liệu". `subjectUsage` giữ nguyên chữ ký, trả tổng.
- Trang Chương trình ĐT và trang Môn học dùng chung hàm này. Môn còn dữ liệu thì hiện thông báo đỏ và cuộn lên đầu trang (trước đây thông báo ở đầu trang còn nút ở cuối, phải tự cuộn lên mới thấy). Môn không còn dữ liệu mới mở hộp xác nhận.
- Trang Môn học không còn xóa kèm bài tập. `app.js` truyền danh sách đầy đủ, chưa lọc theo môn hay lớp (`usageData`), để giáo viên không bỏ sót lịch của lớp khác cùng môn.
- Trang Chương trình ĐT hiện ngay cạnh mỗi môn ngoài CTĐT "còn …".

**R4 – máy chủ (`check_subject_removal`, `subject_usage` trong `server/studytask_api.py`):**

- Mỗi lần ghi `sharedData/global` (PUT và `append`): với mỗi môn có trong bản cũ mà không còn trong bản mới (so theo `id`), đếm các loại dữ liệu ở trên trên bản sau khi ghi. Còn dữ liệu thì trả `409 subject-in-use` kèm câu mô tả và không ghi gì.
- Chạy sau kiểm tra quyền, nên giáo viên xóa môn không được phân công vẫn nhận `403` (R1) như cũ.
- Dữ liệu mồ côi có từ trước (của môn đã bị xóa trước đây) không chặn các lần ghi khác.
- Giới hạn: giao diện ghi `saveSharedKey` không xử lý lỗi. Nếu giao diện để lọt (ví dụ danh sách tài khoản chưa tải xong), máy chủ từ chối nhưng môn vẫn biến mất trên màn hình cho tới khi tải lại trang. Dữ liệu trên máy chủ không mất.

**R5 – `can('update', 'graduationApps')`:** Đào tạo/Admin đổi link minh chứng thì link mới phải là http(s) hoặc rỗng (`valid_evidence`). Không đổi link thì không kiểm tra, để phiếu cũ đã lưu link sai vẫn duyệt được, giống luồng của sinh viên.

**R6 – `utils/quizFile.js`:** `questionsToCsv` thêm dấu `'` trước ô bắt đầu bằng `=`, `+`, `-`, `@` (kể cả sau khoảng trắng), giống `utils/sanitize.js`; số thật như `-5` giữ nguyên. Khi nhập CSV, `unFormula` bỏ đúng dấu `'` này nên xuất rồi nhập lại vẫn ra bộ câu hỏi ban đầu. Giới hạn: câu hỏi cố ý bắt đầu bằng `'=` sẽ mất dấu `'` khi nhập.

**R7 – `firestore.rules`:** chỉ thêm ghi chú. Project Firebase đã gỡ, tệp chỉ còn là đặc tả cho `can()` và `test:rules`; khi khác nhau thì `can()` là chuẩn. Không thêm kiểm tra scheme vào rules, vì `test:rules:deep` đang dùng `'a'.repeat(2000)` làm link hợp lệ cho ca giới hạn độ dài.

## 4. Kiểm thử

Chạy ngày 13/11/2026 trên máy Nguyễn Thanh Tùng (Windows 11, Python 3.12.10, Node 26.13):

| Bộ | Kết quả | Trên mã cũ (`master` `c4a11a5`) |
|---|---|---|
| `tests/server/test_subject_removal.py` (mới, đã thêm vào CI) | 23/23 | 12 đạt, **11 không đạt** |
| `tests/server/test_graduation.py` (thêm 9 ca R5) | 24/24 | 18 đạt, **6 không đạt** |
| `tests/server/test_teacher_shared.py` (sửa 3 ca theo quyết định chặn hẳn, thêm 1 ca) | 28/28 | – |
| `npm run test:logic` (thêm `subjectUsageDetail`, R6) | 90/90 | – |
| 12 bộ máy chủ còn lại và `test_submit.sh` | Đều đạt | – |

Ba ca của `test_teacher_shared.py` được đổi kỳ vọng từ `200` sang `409` vì quyết định chặn hẳn: giáo viên xóa môn của mình, Đào tạo bớt môn còn tài liệu, Admin ghi `subjects` rỗng. Mỗi ca vẫn kiểm tra R1 không chặn nhầm (không phải `403`); thêm 1 ca bớt môn trống vẫn được.

Thử trên giao diện (API tạm, dữ liệu tạm, tài khoản Đào tạo `tr01`):

| Thao tác | Kết quả |
|---|---|
| Trang Chương trình ĐT, bấm "Bớt môn" ở X2 (chỉ còn 1 bài tập, 1 tài liệu) | Bị chặn: "Chưa bớt được môn …: còn 1 bài tập, 1 tài liệu", trang cuộn lên thông báo. Trước đây bớt được |
| Bấm "Bớt môn" ở X3 (không còn dữ liệu) → xác nhận | Bớt được; máy chủ còn X1, X2 |
| Trang Môn học, "Xóa môn học" ở X2 | Bị chặn với cùng thông báo, không mở hộp xác nhận; máy chủ vẫn còn X2 và bài tập của X2. Trước đây xóa môn kèm bài tập, để lại tài liệu |

Lần thử giao diện đầu tiên phát hiện một lỗi do chính bản sửa gây ra: `pages/Curriculum.js` còn gọi hàm `usage` đã bị bỏ, nên trang Chương trình ĐT trắng. Đã sửa trước khi commit.
