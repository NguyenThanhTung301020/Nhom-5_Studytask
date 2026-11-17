# 07. Mở rộng 14/11–17/11: học phần mở theo khóa, thời khóa biểu theo tiết và theo tuần, môn hướng dẫn, ảnh đại diện
> **NGOÀI KẾ HOẠCH CỦA NHÓM.** Phần việc này do Trương Thanh Vui làm riêng, không thuộc kế hoạch tuần 5, 6, 7 và không tính vào khối lượng các việc theo kế hoạch của nhóm. Đọc để hiểu một phần việc riêng, không dùng để đánh giá tiến độ kế hoạch.

Người thực hiện: Trương Thanh Vui (cùng Claude Code, model Claude Sonnet 5.5). Nhánh: `feat/ngoai-ke-hoach-hoc-phan-mo-tkb-tuan` (xếp chồng lên nhánh PR tuần 7 `docs/tuan7-sao-luu-ra-o-ngoai-17-11`). Biên bản triển khai và số liệu kiểm: xem [08](08-bien-ban-trien-khai-14-11-va-17-11.md).

## 1. Vì sao có đợt này

Sau lần nạp 12/11 (xem 05), khi dùng thử trên web thật phát sinh các lỗi logic mà dữ liệu ít không lộ ra. Mỗi mục dưới đây có yêu cầu gốc, cách sửa, nơi xem mã và nơi xem minh chứng.

| # | Vấn đề thấy được | Cách xử lý | Mã chính | Kiểm thử |
|---|---|---|---|---|
| V-20 | Một môn chung nhiều năm dùng chung một bản ghi, giáo viên vào thấy rất nhiều thời khóa biểu lớp | Mỗi môn mở lại ở mỗi năm là **một học phần mở riêng**: (môn, khóa, năm học, học kỳ), có `khoa`, `namHoc`, `ky`, `hocKy`, `namThu`, `trangThai` | `scripts/seed_curriculum.py`, `utils/scope.js` | `tests/server/test_seed_curriculum.py`, `tests/logic.test.mjs` |
| V-21 | Một học phần có thể có cả chục giáo viên được cấp quyền | Mỗi học phần mở có **1 đến 3 giáo viên**; máy chủ trả `409 teacher-limit` khi thêm người thứ 4 (chỉ chặn môn mới thêm, không động đến phân công cũ) | `server/studytask_api.py` (`teacher_limit_error`) | `tests/server/test_teacher_limit.py` |
| V-22 | Hiển thị theo học kỳ chung (kỳ 3 hiện là "kỳ 1") khó hiểu | Hiển thị theo **khóa** (ví dụ 2023-2027) rồi năm học, học kỳ 1/2: "HK1 · 2025-2026"; bộ lọc khóa/học kỳ ở trang Môn học, Thời khóa biểu, Quản trị | `utils/scope.js`, `pages/Subjects.js`, `pages/Admin.js` | `tests/logic.test.mjs` |
| V-23 | Hơn 700 buổi học và 400 buổi thi trong một tuần của một môn vì dồn mọi năm vào một lúc | Thời khóa biểu tách **từng học kỳ của từng khóa**: 15 tuần học bắt đầu từ Thứ Hai, rồi 3 tuần thi; học kỳ hiện tại chỉ chiếm phần nhỏ của lịch | `scripts/seed_curriculum.py` (`term_dates`) | `test_seed_curriculum.py` |
| V-24 | Giờ học xếp chưa theo bảng tiết công bố | Xếp theo **bảng 16 tiết** (sáng 1–6, chiều 7–12, tối 13–16); mỗi buổi là khối tiết liền nhau trong một buổi; số tiết mỗi tuần bằng số tín chỉ (2–4); lớp, giáo viên, phòng không trùng tiết trong cùng học kỳ; môn trực tuyến ưu tiên tiết 13–16 và cuối tuần; mỗi lớp có ít nhất 1 ngày nghỉ Thứ Hai–Thứ Bảy, Chủ nhật chỉ có lớp trực tuyến | `scripts/seed_curriculum.py` (`pick_block`, `try_place`), `utils/periods.js` | `test_seed_curriculum.py` |
| V-25 | Tải giáo viên đếm theo buổi nên có người quá tải | Tải đếm theo **tiết/tuần**, trần mặc định `--max-load 8` × 3 = 24 tiết; chọn giáo viên còn chỗ, thiếu thì thêm giáo viên mới nhưng vẫn ≤ 3 người mỗi học phần | `scripts/seed_curriculum.py` | `test_seed_curriculum.py` |
| V-26 | Mục "Thời khóa biểu" đang là một bảng chung, không thể hiện được tuần | Trang Thời khóa biểu là **xem theo tuần có ngày thật**: tuần trước / tuần này / tuần sau, chọn ngày nhảy tới tuần chứa ngày đó, nhãn "Tuần N của học kỳ", lọc theo khóa và lớp; tab lịch thi có bộ lọc riêng; chọn tiết trong biểu mẫu thêm buổi học. Mục thời khóa biểu theo tháng giữ nguyên | `pages/Schedule.js`, `utils/periods.js` | `tests/logic.test.mjs` |
| V-27 | Thực tập, Đồ án chuyên ngành, Khóa luận không có thời khóa biểu cụ thể và không tính điểm theo tỷ trọng | 3 môn (IT405, IT498, IT499) đánh dấu `kieuHoc: 'huong-dan'`: không có buổi học, lịch thi, đề trắc nghiệm; chỉ có tài liệu hướng dẫn/biểu mẫu; quy chế điểm `{cc 0, bt 0, gk 0, ck 100}`; giáo viên hướng dẫn nhập thẳng điểm tổng kết ở Bảng điểm; trang Quy chế điểm hiện ghi chú thay cho bộ trọng số | `utils/grading.js` (`isGuidedSubject`), `components/GradeBook.js`, `pages/GradingPolicy.js` | `tests/logic.test.mjs`, `test_seed_curriculum.py` |
| V-28 | Trang tổng hợp hệ thống chưa khớp số liệu thật và danh mục môn trùng mã | Thống kê thêm số học phần mở và số khóa; bảng "Theo khóa"; môn trùng mã tính vào cùng chương trình, lấy bản mới nhất làm đại diện | `utils/systemStats.js`, `utils/curriculum.js`, `pages/Admin.js` | `tests/logic.test.mjs` |
| V-29 | Cần kiểm tra đồng bộ ảnh ở số lượng lớn | Gắn ảnh đại diện **riêng cho từng sinh viên** từ kho ảnh có sẵn: thu nhỏ 256×256 JPEG (`scripts/prepare_avatars.ps1`), gắn ngẫu nhiên không trùng (`scripts/assign_avatars.py`, nhãn `avatarSeed: 'avatars-v1'`, có `--remove`, `--dry-run`) | `scripts/prepare_avatars.ps1`, `scripts/assign_avatars.py`, `pages/Directory.js`, `components/AccountManager.js` | `tests/server/test_assign_avatars.py` |

## 2. Giới hạn đã biết

- Dữ liệu vẫn là dữ liệu mẫu (nhãn `seed: "curriculum-v1"`), một chuyên ngành; không thêm ngành, môn, bài tập, điểm.
- Kho ảnh nguồn nằm ngoài repo (`E:\file hình ảnh\…`), **không đưa vào git** (ảnh tải từ tìm kiếm, chưa rõ bản quyền, dung lượng lớn); chỉ đưa script. Ảnh chụp màn hình ở mục 3 chỉ hiển thị một vài ảnh đại diện và có số liệu của thời điểm chụp (ảnh 14/11 là trước khi nạp lại ngày 17/11). 1.056 trên 1.061 ảnh xử lý được, 5 tệp là WebP đặt đuôi `.jpg` nên bị bỏ qua.
- Môn hướng dẫn nhận biết bằng `kieuHoc`; bản ghi cũ chưa có dấu thì nhận ra qua tên (thực tập, khóa luận, đồ án).
- Chưa có phản hồi review cho phần này; PR cần Approve trước khi gộp (xem 08, mục 5).

## 3. Minh chứng hình ảnh (chụp trên bản chạy thử trên máy cá nhân với dữ liệu mẫu)

- Danh bạ có ảnh đại diện: [bang-chung/2026-11-14/danh-ba-anh-dai-dien.jpg](bang-chung/2026-11-14/danh-ba-anh-dai-dien.jpg)
- Thời khóa biểu tuần, góc nhìn sinh viên (chỉ thấy lớp mình, học kỳ hiện tại): [bang-chung/2026-11-17/tkb-tuan-sinh-vien.jpg](bang-chung/2026-11-17/tkb-tuan-sinh-vien.jpg)
- Thời khóa biểu tuần, góc nhìn quản trị, lọc khóa và lớp: [bang-chung/2026-11-17/tkb-tuan-admin-loc-khoa-lop.jpg](bang-chung/2026-11-17/tkb-tuan-admin-loc-khoa-lop.jpg)
