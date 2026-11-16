# Sửa lỗi 04 – Tài liệu cho PR50 (R1) và hai việc tuần 7: gỡ email là một giao dịch, điểm trắc nghiệm từ `quizResults`

Ngày: 16/11/2026. Có AI tham gia đọc mã, viết kiểm thử và sửa (commit có nhãn `[AI]`).
Phần 1 bổ sung tài liệu còn thiếu cho [PR50] (góp ý của Trương Thanh Vui khi Approve PR50: chưa có tài liệu trong `docs/`). Phần 2 và 3 ghi lại việc 12 (nhóm B) và việc 7 (nhóm A) của kế hoạch tuần 7.

## 1. PR50 – giáo viên sửa một môn không còn xóa dữ liệu môn khác (R1)

### 1.1. Lỗi

Giao diện tải cả danh sách (môn, deadline, đề…) rồi ghi ngược lại toàn bộ `sharedData/global`. Nhưng các trang Môn học, Deadline và Trắc nghiệm của giáo viên chỉ giữ **danh sách đã lọc theo môn được phân công**. Khi giáo viên sửa một môn, trang ghi lên máy chủ danh sách đã lọc, nên môn, deadline, đề của giáo viên khác biến mất khỏi `sharedData/global`.

### 1.2. Cách sửa (hai lớp)

| Lớp | Nội dung | Tệp |
|---|---|---|
| Giao diện | Cập nhật trên danh sách đầy đủ bằng `setX(prev => …)` thay vì `setX(danhSachDaLoc.map(…))` | `pages/Deadlines.js`, `pages/Quiz.js`, `pages/Subjects.js` |
| Máy chủ | `teacher_shared_ok(user, old, new)` từ chối lần ghi làm đổi hoặc mất phần không thuộc môn giáo viên được phân công | `server/studytask_api.py` |

Quy tắc ở máy chủ (`teacher_shared_ok`):

- `subjects`: môn ngoài `subjectIds` của giáo viên phải giữ nguyên; **thêm môn mới vẫn được** (giao diện cho giáo viên thêm môn).
- `SUBJECT_SCOPED` (`deadlines`, `homeworks`, `materials`, `schedule`, `exams`): mục có `subjectId` ngoài `subjectIds` phải giữ nguyên, không được thêm mục mới cho môn đó.
- `CLASS_SCOPED` (`schedule`, `exams`): giáo viên đã được phân theo lớp học phần (`sections`) chỉ sửa được mục của lớp mình dạy; mục của lớp khác, kể cả cùng môn, giữ nguyên.
- `quizzes` đã có `guard_quizzes` kiểm tra riêng.
- Hồ sơ giáo viên cũ chưa có `subjectIds` được giao diện coi là dạy mọi môn, nên không bị giới hạn.
- Vi phạm trả `403`.

### 1.3. Kiểm thử

`tests/server/test_teacher_shared.py` (27 ca, chạy trong CI): giáo viên gửi danh sách môn đã lọc (làm mất môn 2, 3), ghi `subjects` rỗng, bỏ hẳn khóa `subjects`, xóa/sửa/thêm deadline của môn không được phân công, chuyển deadline giữa môn mình và môn khác: đều bị `403`, và dữ liệu môn khác còn nguyên sau các lần bị từ chối. Các thao tác hợp lệ vẫn được: sửa tên môn mình, thêm môn mới, thêm/sửa deadline môn mình, sửa deadline chung (không có `subjectId`), xóa tài liệu môn mình, gửi lại nguyên dữ liệu khi tải trang, hồ sơ cũ (không có `subjectIds`). Trên mã trước PR50, 15 ca hỏng. Quy tắc theo lớp học phần (`CLASS_SCOPED`) được kiểm thử ở `tests/server/test_class_scope.py`.

Phần chặn hẳn việc **bớt môn còn dữ liệu** (R2–R4) là việc riêng, xem [03-review-pr9-r1-r7.md](03-review-pr9-r1-r7.md).

## 2. Việc 12 – `unlink_email` hoàn tác giao dịch khi lỗi

### 2.1. Lỗi

`unlink_email(uid)` mở giao dịch (`BEGIN IMMEDIATE`) rồi xóa liên kết email và mã đặt lại mật khẩu, nhưng **không có nhánh hoàn tác**. Nếu câu lệnh thứ hai lỗi:

- giao dịch còn treo trên kết nối SQLite dùng chung, nên mọi `BEGIN` sau đó (liên kết email, nhiều thao tác khác) báo `cannot start a transaction within a transaction` cho đến khi khởi động lại API;
- phần đã xóa dở không được hoàn tác một cách tường minh.

`link_email` (cùng tệp) đã có `ROLLBACK`; `unlink_email` thiếu.

### 2.2. Cách sửa

`unlink_email` bọc hai câu `DELETE` và `COMMIT` trong `try`; khi có lỗi thì `ROLLBACK` (nếu kết nối còn trong giao dịch) rồi ném lỗi lên trên.

### 2.3. Kiểm thử

Thêm vào `tests/server/test_email_codes.py`, chạy hàm trực tiếp trên CSDL tạm, dùng trigger SQLite làm câu `DELETE` thứ hai thất bại:

| Ca | Mã cũ | Mã mới |
|---|---|---|
| Lỗi ở câu thứ hai thì ném lỗi lên trên | đạt | đạt |
| Email vẫn còn liên kết sau lỗi | **không đạt** | đạt |
| Không còn giao dịch treo (`in_transaction` là `False`) | **không đạt** | đạt |
| Hết lỗi thì gỡ lại được cả email lẫn mã đặt lại | không chạy được (`cannot start a transaction…`) | đạt |

## 3. Việc 7 – Bảng điểm và Báo cáo lớp đọc điểm trắc nghiệm chính thức

### 3.1. Vấn đề

Từ V3, điểm do máy chủ chấm và ghi vào `quizResults`; máy chủ còn ghi thêm một sự kiện `quiz` vào `activities` như bản sao. Bảng điểm (`components/GradeBook.js`), Báo cáo lớp (`pages/Reports.js`) và thống kê hệ thống (`utils/systemStats.js`) vẫn đọc bản sao đó. Nhật ký `activities` bị cắt khi đầy (`trim_activity_events`), nên đây không phải nguồn điểm chính thức. Tài liệu [05](../thiet-ke/05-trac-nghiem-tach-dap-an-cham-diem-may-chu.md) mục 8 yêu cầu chuyển hai màn hình sang `quizResults`.

### 3.2. Cách sửa

| Thay đổi | Tệp |
|---|---|
| Endpoint mới `GET /api/quiz/results`: điểm của mọi đề trong phạm vi quyền. Admin: tất cả. Giáo viên: chỉ môn mình dạy và, nếu đã phân theo lớp, chỉ sinh viên thuộc lớp học phần mình dạy (cùng quy tắc với `GET /api/quiz/{id}/results`). Sinh viên: `403`. Mỗi dòng có tên, điểm, số câu đúng/tổng, môn, đề, ngày nộp, cờ `migrated`; **không kèm câu trả lời chi tiết** | `server/studytask_api.py` |
| `loadAllQuizResults()` gọi endpoint trên | `utils/firebase.js` |
| `applyQuizResults(activities, results)`: thay mọi sự kiện `quiz` trong nhật ký bằng kết quả chính thức, giữ nguyên sự kiện loại khác, thêm sinh viên có điểm nhưng chưa có bản ghi nhật ký | `utils/quizScores.js` (mới) |
| `fetchActivities` gọi hàm trên; máy chủ bản cũ chưa có endpoint thì ghi cảnh báo và dùng nhật ký như trước | `app.js` |

Vì cả `GradeBook`, `Reports`, `Admin` (thống kê) đều nhận dữ liệu qua `fetchActivities` và hình dạng dữ liệu không đổi, ba màn hình dùng nguồn điểm chính thức mà không phải sửa cách đọc. Điểm sửa tay trong Bảng điểm (`grades`) vẫn được ưu tiên như cũ.

### 3.3. Lỗi tìm thấy khi làm việc này

`components/GradeBook.js` dùng biến `user` (`studentInScope(user, u)`, thêm ở [PR54]) nhưng không nhận `user` trong tham số của component. Mở Bảng điểm sẽ gây `ReferenceError: user is not defined`. Đã thêm `user` vào tham số (`Reports.js` đã truyền sẵn; `Admin.js` không truyền, và `studentInScope` coi người dùng không truyền là xem tất cả).

### 3.4. Kiểm thử

| Bộ | Ca mới |
|---|---|
| `tests/logic.test.mjs` (`npm run test:logic`) | 7 ca cho `applyQuizResults`/`resultToEvent`: thay chứ không cộng dồn, giữ sự kiện loại khác, không có kết quả thì bỏ điểm trong nhật ký, sinh viên chưa có nhật ký vẫn xuất hiện, không sửa dữ liệu đầu vào, đầu vào lạ |
| `tests/server/test_quiz_v3.py` | 6 ca: Admin thấy đủ 6 bài; dòng có đủ trường và không có `answers`; giáo viên dạy môn thấy; giáo viên môn khác nhận danh sách rỗng; sinh viên `403`; chưa đăng nhập `401` |
| `tests/server/test_class_scope.py` | 4 ca: giáo viên A chỉ thấy lớp a1, b1; giáo viên B chỉ thấy c1 (cùng môn 1, lớp khác không lộ); hồ sơ cũ và Admin thấy cả ba lớp; sinh viên `403` |

### 3.5. Chưa kiểm chứng

- Chưa thử trên giao diện bằng trình duyệt (Bảng điểm, Báo cáo lớp với tài khoản giáo viên và Admin); chỉ có kiểm thử tự động.
- Chưa triển khai lên máy chủ thật. Bản giao diện mới gọi endpoint mới nên cần triển khai API trước hoặc cùng lúc; nếu chỉ triển khai giao diện, trang vẫn chạy nhờ nhánh dự phòng dùng nhật ký.
- Sự kiện `quiz` dựng từ kết quả có `refTitle` rỗng vì `quizResults` không lưu tên đề. Qua rà mã, Báo cáo lớp và Bảng điểm chỉ dùng `refTitle` cho sự kiện bài tập (`homework`), tên đề lấy từ danh sách đề; chưa xác nhận trên giao diện.
