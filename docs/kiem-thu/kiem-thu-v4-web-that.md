# Kiểm thử V4 (nhật ký hoạt động) trên website thật

- Người thực hiện: Nguyễn Thanh Tùng. Claude Code (AI) gửi yêu cầu kiểm thử, đối chiếu dữ liệu và soạn báo cáo theo yêu cầu. Mật khẩu do người thực hiện tự nhập; cần ghi vào nhật ký sử dụng AI của nhóm.
- Ngày: 18/11/2026, khoảng 13:44–15:03 UTC (20:44–22:03 giờ Việt Nam).
- Website: https://sutdytask.io.vn (bản đang vận hành, không dùng localhost).
- Đối chiếu: [PR52] (vá V4, gộp `45570a2` ngày 13/11/2026).
- Minh chứng: thư mục [`anh/v4-web-that/`](anh/v4-web-that/) và [`anh/tu-dong/`](anh/tu-dong/).

## 1. Điều kiện: máy chủ chạy đúng `master`

| Kiểm tra | Cách làm | Kết quả |
|---|---|---|
| Đỉnh `master` trên GitHub | `git fetch` lúc 13:44 UTC | `56c0bb4` (gộp [PR63]); [PR52] `45570a2` nằm trong lịch sử |
| Giao diện trên web thật | Tải 53 tệp `app.js`, `style.css`, `components/`, `pages/`, `utils/` từ `https://sutdytask.io.vn/v202611180911/…` qua Internet, so SHA-256 với `master` | **53/53 trùng**, 0 khác |
| API `studytask_api.py` | Không đo được từ ngoài. Dựa vào script `deploy/kiem-chung-master.sh` chạy trên máy chủ lúc 13:18 UTC cùng ngày ([biên bản 14](../van-hanh/14-bien-ban-viec-1-trien-khai-tu-master-tuan-7.md), mục 4c) | Hash API trùng `56c0bb4`; tiến trình chạy từ 09:11:41 UTC, tệp không bị sửa sau đó |

**Kết luận: đạt điều kiện**, nên được phép kiểm thử. Giới hạn: phần API dựa vào báo cáo trên máy chủ, cách thời điểm thử khoảng 30 phút. Giữa hai thời điểm không có commit mới trên `master`.

## 2. Phạm vi và tài khoản

| Tài khoản | Vai trò | Dùng cho |
|---|---|---|
| `gvnnkn03` | Giáo viên, dạy môn 1019, 1029, 1056, 1066, 1093, 1103, 1130, 1140 (**không** dạy `sv2610019`) | A1, A2, A5 |
| `gvllct04` | Giáo viên, dạy môn 1000 (Triết học Mác - Lênin) ở lớp CNTT26-06 và CNTT26-10 | A3, A4, A9, A10 |
| `sv2610019` (Bùi Anh Cường) | Sinh viên lớp CNTT26-10, học môn 1000–1004 | A6, A7, A8 |
| `admin` | Quản trị viên | Chỉ dùng để khôi phục dữ liệu sau khi thử (mục 6) |

Đây là các tài khoản sinh từ dữ liệu kiểm tải (`scripts/seed_curriculum.py`), không phải người dùng thật. Lúc bắt đầu, nhật ký của `sv2610019` có 3 sự kiện quiz từ lần thử V3 trước đó. Bản sao ở [`sv2610019-nhat-ky-truoc-khi-thu.json`](anh/v4-web-that/sv2610019-nhat-ky-truoc-khi-thu.json).

**Không thực hiện** (theo phân công): V3 trắc nghiệm; sinh viên làm đề và nộp bài; các chức năng do Trần Đức Tùng phụ trách.

## 3. Kiểm thử tự động và kiểm thử thủ công

| Loại | Chạy ở đâu | Dữ liệu | Nội dung | Kết quả |
|---|---|---|---|---|
| Tự động: `tests/server/test_activities.py` ([PR52]) | Máy cá nhân, API tạm cổng 8795, Python 3.12 | Tạm, xóa sau khi chạy | Phân quyền đọc/ghi/xóa, chiếu theo môn, giới hạn 2.000, giữ quiz khi đầy (có nộp bài) | **162/162 đạt** ([log](anh/tu-dong/test_activities-2026-11-18.txt)) |
| Tự động: `tests/server/smoke_live.py` | Máy cá nhân → web thật | Không tạo, không sửa | Các tuyến nhạy cảm khi chưa đăng nhập, `.git`, mã nguồn máy chủ | **18/18 đạt** ([log](anh/tu-dong/smoke-live-2026-11-18.txt)) |
| **Thủ công** (báo cáo này) | Trình duyệt trên **web thật**, đăng nhập bằng tài khoản thử | Dữ liệu thật của tài khoản thử, đã khôi phục | Thao tác giao diện và gọi API bằng chính phiên đăng nhập (`fetch` trong trang, cùng cookie với giao diện) | Bảng mục 4 |

Ghi chú về cách thử thủ công: các ca "bị chặn" (A5, A6, A7) gửi yêu cầu API trong trang đã đăng nhập. Đây chính là việc một sinh viên có thể tự làm bằng công cụ của trình duyệt. Riêng ca A8 dùng vòng lặp gửi 1.995 yêu cầu, vì làm tay 1.995 lần là không thực tế.

## 4. Kết quả

| # | Trường hợp | Cách thử | Kết quả mong đợi | Kết quả thực tế | Đánh giá | Minh chứng |
|---|---|---|---|---|---|---|
| A1 | Đăng nhập bằng tài khoản giáo viên | Đăng nhập `gvnnkn03`, sau đó `gvllct04` | Vào được, vai trò Giáo viên | `/api/auth/me` trả đúng tài khoản, giao diện hiện nhãn Giáo viên | **PASS** | [A2](anh/v4-web-that/A2-gvnnkn03-quan-ly-lop-hoc.jpg) |
| A2 | Mở trang Quản lý lớp học | Menu → Quản lý lớp học | Trang mở, chỉ liệt kê môn mình dạy | `gvnnkn03`: 8 học phần đúng các môn được phân công. `gvllct04`: 11 học phần | **PASS** | [A2](anh/v4-web-that/A2-gvnnkn03-quan-ly-lop-hoc.jpg), [A3](anh/v4-web-that/A3-gvllct04-quan-ly-lop-hoc-toan-trang.jpg) |
| A3 | Danh sách sinh viên | `gvllct04` → Triết học Mác - Lênin · HK1 2026-2027 | Đúng sinh viên các lớp mình dạy môn này | Sĩ số 54 = 28 (CNTT26-06) + 26 (CNTT26-10), khớp `/api/doc/user` | **PASS** | [A3 danh sách](anh/v4-web-that/A3-gvllct04-danh-sach-sinh-vien.jpg), [đối chiếu](anh/v4-web-that/A3-A4-A10-gvllct04-doi-chieu.txt) |
| A4 | Nhật ký hoạt động của sinh viên | Cùng trang, tab Theo dõi hoạt động | Hiện số tài liệu đã xem, bài tập, trắc nghiệm, điểm TB, ngày gần nhất | `sv2610019`: 1996 / 1 / 3 / 1.7 / 18/11/2026; 53 SV còn lại "Chưa hoạt động" | **PASS** | [A3 thống kê](anh/v4-web-that/A3-gvllct04-thong-ke-va-sv2610019.png) |
| A5 | Giáo viên chỉ xem dữ liệu môn mình phụ trách | `gvnnkn03` (không dạy `sv2610019`) đọc/ghi/xóa `activities/<sv2610019>` qua API | Bị từ chối | GET, POST append (quiz 10 điểm), PUT ghi đè, DELETE: đều **403**. Danh sách `activities`: 0 tài liệu | **PASS** (*) | [A5](anh/v4-web-that/A5-gvnnkn03-goi-api.txt) |
| A6 | Quyền ghi nhật ký của sinh viên | `sv2610019` mở tài liệu trên giao diện; gọi append với 8 dạng sự kiện | Chỉ ghi được sự kiện `material`/`homework` hợp lệ, không điểm, thuộc môn đang học, vào nhật ký của mình | Giao diện ghi đúng `{material, 1000, 200001}`. Append homework hợp lệ: 200. Tự ghi quiz, homework kèm điểm, môn không học (1019), thiếu môn, `refId` 101 ký tự, loại lạ, ghi vào nhật ký `sv2610026`: đều **403** | **PASS** | [A6 ảnh](anh/v4-web-that/A6-sv2610019-mo-tai-lieu.jpg), [A6–A7](anh/v4-web-that/A6-A7-sv2610019-goi-api.txt) |
| A7 | Sinh viên không tự sửa/xóa nhật ký | PUT sửa điểm quiz, bỏ quiz, xóa hết, sửa sự kiện cũ; DELETE nhật ký; sửa/xóa `quizResults` | Bị từ chối, dữ liệu giữ nguyên | 7/7 thao tác **403**; 3 sự kiện quiz giữ nguyên điểm 5, 0, 0 | **PASS** | [A6–A7](anh/v4-web-that/A6-A7-sv2610019-goi-api.txt) |
| A8 | Giới hạn 2.000 sự kiện | Ghi tuần tự 1.995 sự kiện `material` đến đủ 2.000; thử sự kiện thứ 2.001 qua API và qua giao diện | Không vượt 2.000; sự kiện quiz không mất | 1.995 lần 200, 0 lỗi, 442,8 giây. Sự kiện thứ 2.001: **403**, vẫn 2.000. Quiz còn đủ 3. **Giao diện không báo gì cho sinh viên**, sự kiện bị mất (phát hiện P1) | **PASS** theo đặc tả [PR52]; có phát hiện P1 | [A8](anh/v4-web-that/A8-sv2610019-gioi-han-2000.txt), [ảnh](anh/v4-web-that/A8-sv2610019-mo-tai-lieu-khi-nhat-ky-day.jpg) |
| A9 | Điểm quiz không mất khi nhật ký đầy | Khi nhật ký đầy, `gvllct04` mở Bảng điểm & Chấm điểm của `sv2610019` | Điểm quiz đã có vẫn hiện đủ | Đề A 5, Đề B 0, Đề C 0; Bài tập/TN 2.5; khớp `/api/quiz/results` và nhật ký | **PASS** (phần kiểm được, **) | [A9 ảnh](anh/v4-web-that/A9-gvllct04-bang-diem-sv2610019-khi-nhat-ky-day.jpg), [A9](anh/v4-web-that/A9-gvllct04-bang-diem.txt) |
| A10 | Dữ liệu hiển thị khớp máy chủ | So từng số trên trang với API đọc bằng phiên `gvllct04` | Trùng | Sĩ số 54=54; tài liệu 1996=1996; bài tập 1=1; trắc nghiệm 3=3; TB 1.7 = (5+0+0)/3; ngày 18/11 | **PASS** | [đối chiếu](anh/v4-web-that/A3-A4-A10-gvllct04-doi-chieu.txt) |

**Tổng: 10/10 PASS**, kèm 2 phát hiện ở mục 5. Hai giới hạn khi thử trên web thật:

- (*) A5 trên web thật chỉ thử được trường hợp giáo viên **không dạy** sinh viên (bị chặn cả tài liệu). Trường hợp giáo viên dạy chung một môn chỉ nhận sự kiện môn mình (`project_activities`) chưa thử được: nhật ký thử chỉ có sự kiện môn 1000, mà `gvllct04` dạy môn này. Trường hợp đó có trong `test_activities.py` và đã đạt.
- (**) A9 không cho sinh viên nộp bài khi nhật ký đầy, vì nộp bài nằm ngoài phạm vi phân công. Nhánh "máy chủ chấm bài khi nhật ký đầy thì bỏ sự kiện cũ không phải quiz" (`trim_activity_events`) chỉ được kiểm thử tự động (ca 157–161 của `test_activities.py`, đạt).

## 5. Phát hiện

Cả hai phát hiện **không phải lỗ hổng phân quyền**: điểm chính thức (`quizResults`) và Bảng điểm không bị ảnh hưởng. Ngày 18/11, Nguyễn Thanh Tùng chọn sửa theo **P1(a)** và **P2(a)**. Phần sửa ghi ở mục 8; **chưa triển khai lên máy chủ**.

### P1 – Nhật ký đầy thì hoạt động mới của sinh viên mất lặng lẽ (mức: trung bình)

**Hiện tượng:** khi `activities/{uid}` đã có 2.000 sự kiện, sinh viên xem tài liệu hay nộp bài tập thì sự kiện không được ghi. Sinh viên không thấy thông báo nào. Cột "Tài liệu đã xem" và "Bài tập đã làm" mà giáo viên xem dừng cập nhật vĩnh viễn với sinh viên đó.

**Nguyên nhân:**
- `activity_write_ok` (`server/studytask_api.py` dòng 336–352) từ chối mọi bản ghi có `len(events) > 2000`. Nhánh `/append` (dòng 1680) chỉ nối thêm, không cắt bớt.
- Hàm cắt `trim_activity_events` (dòng 369) chỉ được gọi khi máy chủ chấm trắc nghiệm (dòng 1938), không dùng cho sự kiện sinh viên tự ghi.
- Giao diện bắt lỗi rồi chỉ ghi `console.warn` (`app.js` dòng 413).

Đây là hành vi [PR52] chấp nhận ("Nhật ký vượt giới hạn: sinh viên không tự thêm được sự kiện"). Tuy vậy, khi chạy thật thì hậu quả là mất dữ liệu theo dõi mà người dùng không biết.

**Phương án đề xuất** (chọn một):

| Phương án | Nội dung | Ưu | Nhược |
|---|---|---|---|
| **(a) Khuyến nghị:** máy chủ cắt bớt khi sinh viên tự ghi | Ở `/append` cho `activities` của chính chủ: nếu nối thêm làm vượt 2.000 thì bỏ sự kiện **không phải quiz, cũ nhất**, giống `trim_activity_events`. `activity_write_ok` chấp nhận `new == trim(prev + [ev])` thay vì chỉ `cur[:-1] == prev`. Vẫn giữ các điều kiện cũ: không quiz, không điểm, đúng môn | Không mất hoạt động mới; quiz không bao giờ bị cắt; một quy tắc dùng chung với lúc chấm bài | Hoạt động cũ nhất (không phải quiz) bị bỏ. Cần thêm ca kiểm thử: đầy + append, toàn quiz + append, append quiz vẫn bị chặn |
| (b) Chỉ báo trên giao diện | Khi `logActivity` trả 403 vì đầy, hiện thông báo cho sinh viên | Sửa nhỏ | Vẫn mất dữ liệu theo dõi; sinh viên không tự xử lý được |
| (c) Giữ nguyên, ghi vào tài liệu | Ghi rõ là hạn chế đã biết | Không sửa mã | Giáo viên vẫn thấy số liệu sai mà không biết lý do |

### P2 – Sinh viên tự tạo được hoạt động "đã xem tài liệu", "đã làm bài tập" không có thật (mức: thấp)

**Hiện tượng:** ở ca A6a, `sv2610019` gửi sự kiện `homework` với `refId: "kt-a6-hw"`. Không có bài tập nào mang mã này, và sinh viên cũng không nộp bài. Máy chủ vẫn nhận, và trang Quản lý lớp học của `gvllct04` tính "Bài tập đã làm = 1". Tương tự, 1.996 sự kiện `material` với `refId` giả (môn chỉ có 5 tài liệu) được tính thành "1996 tài liệu đã xem".

**Nguyên nhân:**
- `valid_activity_event` (dòng 321) chỉ kiểm tra hình thức: kiểu, ngày, độ dài. Nó không kiểm tra `refId` có phải tài liệu hoặc bài tập thật của môn đó không. Ghi chú ở dòng 241 đã nêu: V4 "chỉ kiểm tra được hình thức".
- `pages/Reports.js` (dòng 66–67) đếm `refId` khác nhau mà không đối chiếu với danh sách tài liệu, bài tập của môn.

**Ảnh hưởng:** chỉ sai thống kê theo dõi hoạt động. Bảng điểm lấy bài tập từ danh sách bài tập thật và điểm trắc nghiệm từ `quizResults`, nên **không bị ảnh hưởng**: ca A9 hiện "BÀI TẬP: Chưa có bài tập".

**Phương án đề xuất:**

| Phương án | Nội dung |
|---|---|
| (a) Giao diện | `Reports.js` chỉ đếm `refId` thuộc `subMaterials` (đã có sẵn trong hàm), và chỉ đếm bài tập có trong danh sách bài tập của môn. Sửa nhỏ, chặn được số liệu phình |
| (b) Máy chủ | Sự kiện `material` phải có `refId` thuộc tài liệu của môn trong `sharedData/global`. Sự kiện `homework` do **máy chủ** ghi khi nhận bài nộp qua `/api/upload`, giống cách quiz được ghi lúc chấm; sinh viên không tự ghi `homework` nữa. Chặn tận gốc, nhưng sửa nhiều hơn và đụng luồng nộp bài |

Khuyến nghị: làm (a) trước, cân nhắc (b) khi nhóm sửa luồng nộp bài. Nếu (b) đụng luồng nộp bài của thành viên khác thì cần người phụ trách đồng ý.

## 6. Dữ liệu đã thay đổi và đã khôi phục

| Thời điểm (UTC) | Thay đổi | Trạng thái |
|---|---|---|
| ~14:40 | `activities/sv2610019` +1 `material` (giao diện), +1 `homework` (A6a) | Đã khôi phục |
| 14:41:18–14:48:41 | +1.995 `material` `refId: kt-a8-*` (A8) | Đã khôi phục |
| 15:02:48 | `admin` PUT lại đúng bản trước khi thử | **3 sự kiện, trùng từng byte bản gốc** ([biên bản](anh/v4-web-that/don-du-lieu-sau-khi-thu.txt)) |

Không chạm `quizResults` và hồ sơ của bất kỳ tài khoản nào. Mọi lần ghi của giáo viên và các lần ghi sai của sinh viên đều bị từ chối, nên không để lại dữ liệu. Chọn khôi phục thay vì xóa tài liệu: xóa sẽ làm mất 3 sự kiện quiz của lần thử V3 trước đó.

## 7. Đối chiếu với [PR52]

| Nội dung [PR52] | Tự động (`test_activities.py`) | Thủ công trên web thật |
|---|---|---|
| Lỗi 1: sinh viên không tự ghi điểm (chặn quiz, chặn `score/total/correct`) | Đạt | Đạt (A6b, A6c, A7a) |
| Lỗi 2: chỉ Admin xóa nhật ký | Đạt | Đạt (A7e; giáo viên ở A5) |
| Lỗi 3: giáo viên chỉ nhận sự kiện môn mình dạy | Đạt | Đạt một phần (A5: chặn cả tài liệu; chưa thử nhật ký nhiều môn) |
| Review: chỉ nhận sự kiện môn đang học | Đạt | Đạt (A6d, A6e) |
| Review: `refId` ≤ 100 ký tự | Đạt | Đạt (A6f) |
| Review: giữ điểm quiz khi nhật ký đầy | Đạt (có nộp bài) | Đạt phần không nộp bài (A8, A9) |

Báo cáo tuần 6 ghi "**chưa thử trên máy chủ thật**, vì máy chủ chưa chạy bản có [PR52]". Lần này đã thử trên máy chủ thật đang chạy `master` có [PR52].

## 8. Sửa P1(a) và P2(a) (sau khi được xác nhận)

Mã sửa nằm trên nhánh `fix/tuan7-v4-kiem-thu-web-that-p1-p2`. **Chưa triển khai** lên https://sutdytask.io.vn. Sau khi gộp phải triển khai lại từ `master` và thử lại A8 trên web thật.

### 8.1. P1(a) – máy chủ cắt bớt khi sinh viên tự ghi vào nhật ký đầy

| Tệp | Thay đổi |
|---|---|
| `server/studytask_api.py`, nhánh `POST …/append` | Với `activities`, nếu nối thêm làm vượt 2.000 thì gọi `trim_activity_events`, tức bỏ sự kiện **không phải quiz, cũ nhất**. Nếu thứ bị bỏ lại chính là sự kiện mới (nhật ký toàn quiz) thì không cắt, để `can()` từ chối (403) thay vì trả 200 mà thực ra không ghi gì |
| `server/studytask_api.py`, `activity_write_ok` | Ngoài trường hợp "thêm đúng một sự kiện vào cuối", nay nhận thêm đúng **một** dạng khác: `new == trim_activity_events(prev + [sự kiện mới])` khi nhật ký đầy. Sinh viên không tự chọn được sự kiện nào bị bỏ, và không bao giờ bỏ được quiz. Các điều kiện cũ vẫn giữ: không quiz, không điểm, đúng môn đang học, `refId` ≤ 100 |

Hành vi khác trước: [PR52] ghi "nhật ký vượt giới hạn thì sinh viên không tự thêm được sự kiện". Nay điều đó chỉ còn đúng khi nhật ký toàn sự kiện quiz.

Đánh đổi đã chấp nhận: sinh viên cố ghi nhiều lần (như ca A8) sẽ đẩy mất các sự kiện xem tài liệu, nộp bài **cũ của chính mình**. Không ảnh hưởng sinh viên khác. Điểm quiz không bao giờ bị cắt.

Kiểm thử `tests/server/test_activities.py`: **174/174 đạt** ([log](anh/tu-dong/test_activities-sau-sua-P1.txt)). Có 12 ca mới và 2 ca cũ sửa lại:

| Ca | Kết quả |
|---|---|
| Sự kiện thứ 2001 (sửa ca cũ "bị từ chối"): 200, vẫn 2.000, bỏ đúng sự kiện cũ nhất | Đạt |
| Nhật ký đầy, quiz ở đầu: xem tài liệu được ghi, bỏ đúng sự kiện không phải quiz cũ nhất, 2 điểm quiz giữ nguyên, giáo viên thấy sự kiện mới | Đạt (4 ca + 1 ca chuẩn bị) |
| Nhật ký đầy: tự ghi quiz, sự kiện kèm điểm, môn không học → 403, nhật ký không đổi | Đạt (3 ca) |
| PUT tự chọn bỏ quiz / bỏ sự kiện mới nhất / bỏ hai để thêm một → 403 | Đạt (3 ca) |
| PUT đúng bản cắt của máy chủ → 200 (giống append) | Đạt |
| Nhật ký toàn quiz: sinh viên vẫn không tự thêm được, nhật ký không đổi | Đạt |

Chạy bộ kiểm thử mới trên `server/studytask_api.py` của `master` (chưa sửa): **5 ca lỗi**, đúng các ca P1 ([log](anh/tu-dong/test_activities-bo-moi-tren-ma-cu.txt)). Bộ kiểm thử bắt được lỗi, và bản sửa làm hết lỗi.

### 8.2. P2(a) – trang Quản lý lớp học chỉ đếm tài liệu và bài tập có thật

| Tệp | Thay đổi |
|---|---|
| `pages/Reports.js` | "Tài liệu đã xem" chỉ đếm `refId` thuộc tài liệu của môn đang xem. "Bài tập đã làm" và tab Bài tập chỉ đếm `refId` thuộc bài tập của môn (`homeworks`, trước đây đã truyền vào mà chưa dùng). Tên bài tập lấy từ danh sách bài tập, không lấy `refTitle` do sinh viên gửi. So id theo chuỗi để không lệch kiểu số/chuỗi |
| `tests/reports.test.mjs` (mới), `package.json` | 4 ca P2, thêm vào `npm run test:logic`, nên CI chạy tự động |

Không đổi: trắc nghiệm, điểm TB, "Hoạt động gần nhất". Một sự kiện giả vẫn làm sinh viên hiện là "có hoạt động" ở cột cuối. Chặn tận gốc là phương án P2(b) ở máy chủ, chưa làm.

Kiểm thử: `npm run test:logic` **127/127 đạt** (gồm 4 ca mới). Chạy cùng các ca này trên `pages/Reports.js` của `master` thì lỗi: mã cũ đếm `["kt-a6-hw", "501"]` bài tập và `[200001, "kt-a8-1", "kt-a8-2"]` tài liệu.

### 8.3. Hồi quy

Mọi bộ `tests/server/test_*.py` (18 bộ) đều đạt trên Windows, Python 3.12.10: `test_account` 46, `test_activities` 174, `test_admin_reset` 18, `test_assign_avatars` 15, `test_class_scope` 24, `test_email_codes` 37, `test_graduation` 24, `test_migrate` 8, `test_online_exam` 37, `test_profile_lock` 25, `test_quiz_extra` 48, `test_quiz_v3` 83, `test_seed_curriculum` 77, `test_shared_scope` 16, `test_subject_removal` 23, `test_teacher_limit` 13, `test_teacher_shared` 28, `test_users` 13.

Hai bộ chưa chạy trên máy này: `test_submit.sh` (cần `python3`) và `npm run test:rules` (cần Java). Không bộ nào liên quan tới phần sửa; CI Linux sẽ chạy.


[PR52]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/52
[PR63]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/63
