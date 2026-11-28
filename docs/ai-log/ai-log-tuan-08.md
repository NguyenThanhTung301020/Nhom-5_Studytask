# Nhật ký sử dụng AI – Tuần 8 (23/11 – 28/11/2026)

- **Công cụ:** Claude Code (Anthropic), ứng dụng máy tính (Windows).
- **Model:**
  - Claude Opus 5.5 (`claude-opus-5-5`): Nguyễn Thanh Tùng; Trần Đức Tùng; Trương Thanh Vui.
  - Claude Sonnet 5.5 (`claude-sonnet-5-5`): Trương Thanh Vui (2 phiên: bảng phân công, ghi chú nhanh và kế hoạch ôn thi); Nguyễn Thanh Tùng (1 phiên: việc 2).
- **Người sử dụng:** Nguyễn Thanh Tùng, Trần Đức Tùng, Trương Thanh Vui.
- **Nhãn commit:** commit có AI tham gia ghi `[AI]` ở đầu tiêu đề và có dòng `Co-Authored-By`.
- **Cột "Prompt chính":** câu trong ngoặc kép là lời nhắn nguyên văn của sinh viên (giữ cả lỗi gõ). Prompt dài được rút gọn bằng `...`. Giờ ghi theo giờ Việt Nam.
- **Người duyệt và gộp PR:** lấy từ GitHub ngày 27/11/2026. Tuần này mọi PR đều do cùng một người Approve và bấm gộp.

## 1. Việc trong kế hoạch tuần 8 có dùng AI

Số việc theo Phần 5 báo cáo tuần 7 (`docs/bao-cao-tuan/tuan-07.md`). Các dòng xếp theo số việc. Việc 14 (chốt tuần làm Vite) không dùng AI.

| Việc | Người dùng | Prompt chính (nguyên văn) | AI tạo ra | Sinh viên kiểm tra / tự làm | Minh chứng |
|---|---|---|---|---|---|
| Việc 1: cập nhật GitHub vào server | Trương Thanh Vui | "Tiến hành pull data trên github và cập nhật vào server giúp tôi . đối chiếu mã nguồn" (26/11) | Chuẩn bị bản `d45f229` (gộp PR #90) trên máy chủ, đưa lệnh cài, đối chiếu lại: 62 tệp khớp `master` | Tự chạy lệnh cài (`sudo`), báo "Đã chạy xong" | Bản giao diện `v202611260410` |
| Việc 1 (lần 2) | Trương Thanh Vui | " Tiến hành đối chiếu code từ github với server cập nhật máy chủ cho khớp" | Đối chiếu: lệch API và 12 tệp giao diện so với `b650d17` (gộp PR #94); chuẩn bị mã, gói quay lại và script cài | Tự chạy script cài (`sudo`) | Cài 27/11; kiểm chứng **ĐẠT** (`kiem-chung-master-20261127-003547.txt`, chưa có trong repo) |
| Việc 2: kiểm lại L1, G2, G3, R5 trên web thật | Nguyễn Thanh Tùng | "* Hãy kiểm lại trên web thật: L1, G2, G3; R5 phần Đào tạo sửa link (cần một tài khoản sinh viên thử nộp phiếu). Thanh Vui đã cập nhật lại server * Kết quả cần đạt: ..."; "tôi đã đăng nhập tài khoản Phòng Đào tạo xong"; "hãy thực hiện hoặc hướng dẫn tôi thực hiện những việc chưa làm xong"; "Đẩy nhánh lên" (24/11) | Xác nhận web thật (bản `v202611230746`) đã có mã sửa. Thao tác bằng trình duyệt trong ứng dụng trên web thật sau khi sinh viên tự đăng nhập. **L1:** xóa môn tạm ZZL1D đang có tài liệu mà trang chưa biết → máy chủ trả 409, hiện banner đỏ, môn hiện lại kèm "1 tài liệu", không có lệnh lưu gửi ngược; sửa tín chỉ lưu được (200). **G3:** hộp xóa nêu tên môn. **G2:** `+5`, `=1+1`, `@x` được thêm dấu `'`; CSV xuất từ web thật mở bằng Excel 16 không có ô công thức. **R5:** nộp phiếu thử bằng sinh viên `sv2610019`; phiên Đào tạo đổi link sang `javascript:`, `JAVASCRIPT:`, `data:`, `//evil.com` đều bị chặn 403, link https được 200 (qua API vì giao diện không có ô sửa link). Dọn dữ liệu tạm (lại 156 môn, 427 tài liệu). Báo cáo kèm 4 ảnh, CSV, kết quả Excel; commit, push; soạn lại tiêu đề PR bị cắt | Tự đăng nhập lần lượt tài khoản Đào tạo, sinh viên thử, Đào tạo (AI không nhập mật khẩu); tự mở PR #85, sửa tiêu đề. Trương Thanh Vui duyệt và gộp (24/11) | `e029cb9`; [PR #85](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/85); `docs/kiem-thu/kiem-thu-l1-g2-g3-r5-web-that-sau-cap-nhat-may-chu.md` |
| Việc 3: sửa 2 lỗi giao diện V3 (ca 19, ca 24) | Trần Đức Tùng | "Hướng dẫn tôi Việc 3: sửa 2 lỗi giao diện V3 theo kế hoạch tuần 8"; "Tôi tự làm"; "Tôi đã sửa kiểm tra về các file quizScores.js, Quiz.js, Subjects.js, logic.test.mjs"; "Kiểm tra lại các file đã sửa"; "tiếp hướng dẫn"; "kiểm tra lại lần cuối các file về Việc 3: sửa 2 lỗi giao diện V3 theo kế hoạch tuần 8 đã ổn hay chưa ? Nếu đã ổn hãy push lên git ..." (23/11) | Hướng dẫn từng bước: **ca 19** đếm lượt nộp từ `GET /api/quiz/results` (hàm `countSubmissionsByQuiz` trong `utils/quizScores.js`), khi tải lỗi thì hiện "–" thay vì 0; **ca 24** hàm `quizDuePassed` tính hạn đến hết ngày `dueDate` theo giờ Việt Nam, giống `quiz_due_passed` ở máy chủ, dùng ở `pages/Quiz.js` và `pages/Subjects.js`. Gợi ý 2 nhóm ca kiểm thử biên cho `tests/logic.test.mjs`. Rà lại các tệp sau mỗi lần sửa, chạy `test:logic` (151/151), commit và push nhánh | Tự gõ mã theo hướng dẫn vào 4 tệp; tự chạy `test:logic`; tự mở PR #83. Nguyễn Thanh Tùng duyệt và gộp (24/11) | `edd88cc`; [PR #83](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/83) |
| Việc 3 (phần thử lại ca 19, 23, 24 trên web thật; làm thay Trần Đức Tùng) | Trương Thanh Vui | "Tiến hành làm phần còn lại của V3 do Đức Tùng không có quyền truy cập vào server" | AI thao tác trình duyệt, tạo 2 đề thử, kiểm 3 ca (đều đạt), soạn biên bản kèm ảnh | Đồng ý tạo đề thử, tự đăng nhập tài khoản GV và SV; sau đó sửa biên bản trên web (bỏ 2 dòng về người thực hiện và việc AI thao tác). Trần Đức Tùng duyệt và gộp (26/11) | `ff7ada1`, `d72ea3f`; [PR #93](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/93); `docs/kiem-thu/kiem-thu-v3-web-that-26-11.md` |
| Việc 4: rủi ro cổng 80/443 (làm thay Trần Đức Tùng) | Trương Thanh Vui | "hướng dẫn tôi soạn biên bản vận hành rủi ro ( mục 4 trong báo cáo tuần ) Do Đức Tùng không thể truy cập vào máy chủ..."; "hãy hướng dẫn tôi loại bỏ hoặc thực hiện các biện pháp trong mức cho phép..." | Biên bản 08 mục 6 (mặt rủi ro, biện pháp 3 lớp, kiểm tra K1–K6); hướng dẫn bật tường lửa và SSH khóa; thử từ mạng 4G | Yêu cầu sửa; tự áp dụng trên máy chủ; chuyển sang mạng 4G để thử. Nguyễn Thanh Tùng duyệt và gộp (25/11) | `ff3386a`, `c2f8965`, `8567172`; [PR #88](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/88) |
| Việc 5: bản sao lưu ngoài trên Google Drive | Nguyễn Thanh Tùng | "* Hãy thực hiện, hướng dãn tồi thực hiện công việc bản sao lưu ngoài: tải bản .7z đã mã hóa lên nơi lưu trữ ngoài (vd Google Drive), ghi link vào một tệp văn bản trong repo ..."; "link: ... những người đã được chia sẻ quyền xem: Trần Đức Tùng, Trương Thanh Vui ..."; gửi ảnh hộp chia sẻ; "hãy chỉnh lại PR, tôi sẽ tự chỉnh tiêu đề"; "sao Đức Tùng không gộp được?"; "Có, đẩy lên" (24/11) | So SHA256 tệp `.7z` với biên bản 09; hướng dẫn tải lên Drive với quyền **Hạn chế** và **Người xem**, không dán mật khẩu. So SHA256 bản tải lại (trùng). Mở link khi chưa đăng nhập thì thấy tệp đang để "Bất kỳ ai có đường liên kết", nên chưa commit cho tới khi đổi; sau khi đổi, Drive trả 401. Chỉ ra một người đang có quyền chỉnh sửa. Viết `docs/van-hanh/15`, cập nhật biên bản 09 mục 5; commit, push; soạn nội dung PR. Khi nút Merge bị khóa: tìm ra GitHub trả lỗi 500 "diff temporarily unavailable", gộp `origin/master` vào nhánh (`74191e3`) để GitHub tính lại | Tự tải lên Drive, tự đổi quyền chia sẻ, hạ quyền chỉnh sửa xuống Người xem, tự tải lại để so; tự mở PR #86, sửa tiêu đề, mô tả. Trần Đức Tùng duyệt và gộp (24/11) | `1291888`, `ed5c5ff`, `74191e3`; [PR #86](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/86); `docs/van-hanh/15-ban-sao-luu-ngoai-google-drive.md` |
| Việc 6: sao lưu PDF kho sách | Trương Thanh Vui | "Trên git hub đã có file báo cáo tuần 7 . Tiến hành down về và kiểm tra phần việc của Thanh Vui hướng dẫn tôi thực hiện..." | Sửa script sao lưu và thử khôi phục, 12 ca kiểm thử, bước CI; kiểm tra trên máy chủ: 262 PDF, checksum đạt; ghi kết quả vào báo cáo 01 | Tự cài script và chạy sao lưu trên máy chủ. Nguyễn Thanh Tùng duyệt và gộp PR #80 (23/11); Trần Đức Tùng duyệt và gộp PR #82 (23/11) | `319745a` ([PR #80](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/80)), `f1c43b6` ([PR #82](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/82)) |
| Việc 6 (phần 33 sách chưa rõ giấy phép) | Trương Thanh Vui | "Trong danh sách các sách của thư viện có 33 đầu sách bị vấn đề bản quyền tính hành loại bỏ nó và tìm thêm khoản 50 sách đáp ứng đủ yều và cập nhật lại giúp tôi" (21/11) | Commit `ede3fbf` (21/11): gỡ 33 sách không rõ giấy phép, thêm 50 sách phạm vi công cộng | Kiểm tra lại các sách đã gỡ hay chưa và các sách mới có phải là sách cũ đổi bìa hay không. Nguyễn Thanh Tùng duyệt và gộp PR #78 (22/11) | `ede3fbf`; [PR #78](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/78) |
| Việc 7: [D3] mục 14, nhập danh sách lớp từ CSV/Excel | Trần Đức Tùng | "Hướng dẫn làm việc 7: [D3] mục 14, nhập danh sách lớp từ CSV/Excel theo kế hoạch tuần 8"; "Giáo viên đã trả lời về ý kiển: Phân quyền D3 mục 14 (chỉ Admin và Phòng Đào tạo nhập, giáo viên chỉ xem): đồng ý ... Nên hãy hướng dẫn làm việc 7 ..."; "kiểm tra lại các file tôi đã sửa"; "tôi đã sửa lại kiểm tra lại và tiếp tục bước tiếp theo"; "hướng dẫn làm bước 8"; "Nêu hướng dẫn 8.2 các bước thử giao diện cho tôi để tôi thử tay trên máy"; "Kiểm tra tất cả các file về việc 14: nhập danh sách lớp từ CSV/Excel đã ổn hay nếu ổn thì nêu đã ổn thui chứ chưa push" (23/11); "Kiểm tra lại lần cuối các file về việc 7 [D3] mục 14: nhập danh sách lớp từ CSV/Excel đã ổn hết chưa nếu đã ổn hãy push ..."; "Tôi tự mở PR" (24/11) | Hướng dẫn theo bước: định dạng tệp (mã SV, họ tên, lớp, khóa), hàm đọc và kiểm tra tệp `utils/classImport.js`, hộp nhập `components/ClassImportModal.js`, nút nhập ở `pages/Directory.js` chỉ hiện với Admin và Phòng Đào tạo, tuyến nhập ở `server/studytask_api.py` (máy chủ chặn vai trò khác, bỏ qua mã SV trùng). Gợi ý ca kiểm thử `tests/logic.test.mjs` và `tests/server/test_import_students.py`, thêm bước chạy vào CI. Hướng dẫn các bước thử tay giao diện. Rà lại các tệp sau mỗi lần sửa, kiểm tra không xung đột với PR #83; commit và push nhánh | Tự chốt phân quyền theo ý kiến của thầy; tự gõ mã theo hướng dẫn; tự chạy `test:logic` (157/157) và `test_import_students.py` (13/13); tự thử tay nhập tệp trên máy; tự gộp `master` vào nhánh sau khi PR #83 gộp và giải xung đột ở `tests/logic.test.mjs`; tự mở PR #87. Trương Thanh Vui duyệt và gộp (24/11) | `f131a04`, `e361b2b`; [PR #87](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/87); `docs/phan-tich/03-giu-bo-sua-them.md` mục 14 |
| Việc 8: [D3] mục 15, 16 | Nguyễn Thanh Tùng | "* Hãy thực hiện: [D3] mục 15 (nộp tệp trực tiếp), mục 16 (xem lịch theo tháng): rà hiện trạng trước vì đã có /api/upload và pages/MonthCalendar.js * Kết quả cần đạt: ..."; "Commit, đẩy, mở PR" (25/11) | **Mục 15** đã làm sớm (tuần 5–6, PR #39): tệp lưu trên máy chủ riêng (không dùng Firebase Storage như [D3] ghi), giới hạn định dạng, 15 MB, kiểm nội dung tệp; `test_submit.sh` 18/18. **Mục 16** đã làm sớm (tuần 3, PR #9): chuyển hàm tính buổi học sang `utils/periods.js` dùng chung với lịch tuần; sửa lỗi tháng 4 tuần hiện thừa một hàng; thêm 4 ca kiểm thử, `test:logic` 169/169. Biên bản có 7 ca thử tay T1–T7 để trống; ghi [D3]; commit, push; soạn nội dung PR | Tự mở PR #89. Trần Đức Tùng duyệt và gộp (25/11). **Chưa** thử T1–T7 trên web thật | `f5c1959`; [PR #89](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/89); `docs/kiem-thu/ra-soat-d3-muc-15-16-tuan-8.md` |
| Việc 10: chỉnh 8 sơ đồ [D3], [D05]; cập nhật ghi chú [D05] "Việc 8 (V4) còn lại" | Trần Đức Tùng | "push lên git dùm tôi các file sơ đồ theo kế hoạch tuần 8"; "Đã thay, commit"; "kiểm tra còn D05 cập nhật ghi chú [D05] "Việc 8 (V4) còn lại" vì Bảng điểm và Báo cáo lớp đã đọc quizResults tôi chưa làm hãy hướng dẫn tôi làm"; "tôi đã sửa lại kiểm tra lại dùm tôi" (27/11) | **Sơ đồ:** tạo nhánh `docs/tuan8-viec10-cap-nhat-so-do` từ `master`, commit 8 tệp ảnh sơ đồ (xóa bản "(update)", thêm bản "(up 27-11)") và đẩy nhánh; phát hiện tệp DFD mức 1 (tiến trình 1 và 6) trùng ảnh DFD mức 0 (cùng mã băm), báo lại và commit tệp thay thế. **[D05]:** đối chiếu mã trên `master` (Bảng điểm, Báo cáo lớp đọc `quizResults` qua `loadOfficialActivities()`; hạn đề tính bằng `quizDuePassed()`), hướng dẫn câu chữ thay cho ô "Điểm vào Bảng điểm" và dòng "Chưa làm", các lệnh tạo nhánh, commit, push; rà lại phần đã sửa | Tự vẽ 8 sơ đồ trên draw.io, tự xuất lại đúng ảnh DFD mức 1; tự sửa 2 dòng [D05] bằng tay, tự commit `9813569` và push; tự mở PR #96 (27/11), PR #97 (27/11). Cả hai đang mở, chờ Nguyễn Thanh Tùng review | `e927914`, `de5d70c`, `9813569`; [PR #96](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/96), [PR #97](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/97) |
| Việc 11: cập nhật gói | Trương Thanh Vui | "Cập nhật lên github giúp tôi ( Ngoài ra ghi nhận việc máy chủ bị tắt ngày 22/11 là do việc cúp điện...)" | Kiểm tra chỉ đọc: 0 gói chờ; ghi biên bản 12 và báo cáo 01 (cúp điện 22/11) | Tự chạy cập nhật gói và khởi động lại. Trần Đức Tùng duyệt và gộp (23/11) | `02ae1d7`; [PR #81](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/81) |
| Việc 12: G4, trang cuộn ngang ở khổ hẹp | Nguyễn Thanh Tùng | "* Hãy thực hiện: G4: trang bị cuộn ngang ở khổ hẹp * Kết quả cần đạt: PR, thử ở khổ điện thoại" (26/11) | Dựng máy chủ thử trên máy với dữ liệu tạm, không đụng web thật. Tái hiện: 375 px trang rộng 429 px, 512 px rộng 731 px. Nguyên nhân: hàng công cụ trang Môn học không xuống dòng; thanh trên cùng rộng khoảng 340 px. Sửa `pages/Subjects.js`, `components/Navbar.js`, `style.css`. Đo ở 320, 375, 412, 512 px, mỗi khổ 5 trạng thái; rà 12 trang của vai trò Đào tạo; khổ 1280 px giữ bố cục cũ; `test:logic` 169/169. Biên bản kèm 6 ảnh trước/sau; commit, push; soạn nội dung PR | Tự mở PR #90. Trương Thanh Vui duyệt và gộp (26/11). **Chưa** thử trên điện thoại thật | `cca4e27`; [PR #90](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/90); `docs/kiem-thu/kiem-thu-g4-cuon-ngang-kho-hep.md` |
| Việc 13: biên bản 08 mục 4, kết quả CI PR #61 | Trương Thanh Vui | Tiếp nối việc 6 | Điền kết quả CI vào biên bản 08 | Đối chiếu với kết quả thực tế rồi đưa lên GitHub | `f1c43b6`; [PR #82](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/82) |

## 2. Việc ngoài kế hoạch hoặc hỗ trợ có dùng AI

| Việc | Người dùng | Prompt chính (nguyên văn) | AI tạo ra | Sinh viên kiểm tra / tự làm | Minh chứng |
|---|---|---|---|---|---|
| Đồng bộ mã đầu tuần (hỗ trợ) | Nguyễn Thanh Tùng | "hãy pull bản github mới nhất về đường dẫn này 'D:\Zalo Received Files\Đồ Án'" (24/11 11:34) | Clone `master` (`7370266`) vào thư mục mới, không đụng các bản clone cũ đang có sửa dở | Chọn "Clone mới" | Không có commit |
| Quy ước 02: việc định kỳ không cần đưa vào báo cáo tuần (hỗ trợ nhóm, theo nhận xét của thầy ở tuần 7) | Trần Đức Tùng | "push file 02-quy-uoc-viec-dinh-ky-khong-bao-cao-tuan.md lên github ..."; "Đã đăng nhập, mở PR" (26/11) | Rà nội dung tệp quy ước; đưa tệp vào `docs/quy-uoc/`, commit, push nhánh và mở PR | Tự viết nội dung quy ước dựa trên nhận xét của thầy và các việc định kỳ nhóm đã thống nhất; tự đăng nhập GitHub. Trương Thanh Vui duyệt và gộp (26/11 11:20) | `bcb8ead`; [PR #91](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/91) |
| Cập nhật trang Tiện ích (ngoài kế hoạch) | Trần Đức Tùng | "hướng dẫn làm liên kế web học tập trước"; "tôi đã thử có chỗ xoá là không xoá được"; "... ukm tiếp theo hướng dẫn làm cải thiện về các tiện ích đi" (25/11); "Hãy giúp tôi gỡ bỏ liên kết học tập đi vì đã xác nhận lại là không dùng các link bên ngoài vào Trang tiện ích"; "hãy nêu một số ý tưởng để cải hiện thêm ở Trang tiện ích"; "tôi cần những cái mới không phải cứ đưa vào những cái đã có bắt cải thiện"; "tiếp tục về các cải thiện trang tiện ích"; "... hãy kiểm tra lại trước các file tôi đã làm cập nhật Trang tiện ích đã ổn chưa nếu ổn thì push lên ..." (26/11) | Đề xuất ý tưởng tiện ích mới; hướng dẫn và viết mã: giao diện 5 khối thống nhất; Pomodoro gắn với deadline đang làm; Điểm số thêm tab "Cuối kỳ cần đạt"; Lập kế hoạch ôn thi; Chuyển đổi tệp (ghép ảnh thành PDF, nén ảnh, xử lý trên trình duyệt). Thêm `utils/studyTools.js`, `utils/fileTools.js` và 10 ca trong `tests/logic.test.mjs`; commit và push nhánh | Tự đề xuất cập nhật; tự thử tay từng tiện ích và báo lỗi nút xóa liên kết; tự quyết định bỏ liên kết web học tập, bỏ Công cụ lớp học, chọn ý tưởng làm tiếp; tự mở PR #94 ghi rõ ngoài kế hoạch. Trương Thanh Vui duyệt và gộp (26/11 22:10) | `9eec4e0`; [PR #94](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/94) |
| Kho sách: rà bản quyền đợt 2 | Trương Thanh Vui | "Tiến hành Rà soát thêm lần nữa và bổ sung thêm 1 lượng sách tương đối nữa vào thư viện giúp tôi ( có thể là 50 quyển nữa ) cập nhật code và văn bản lên git ghi rõ phần này không thuộc tuần do nhóm đã làm xong báo cáo tuần cũng như không quá quan trọng để thêm vào báo cáo tuần" (21/11 15:58) | Commit `a814219` (21/11 19:12): gỡ 134 sách có nguy cơ, thêm 193 sách tiếng Việt, còn 255 sách | Kiểm tra sách mới đảm bảo đúng yêu cầu về bản quyền | `a814219`; [PR #78](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/78) |
| Kho sách: chỉ giữ sách tiếng Việt đọc được | Trương Thanh Vui | "Các đầu sách quá cũ khiến chúng thay vì hiển thị tiếng việt lại dùng Hán và Nôm trioong khi tôi cần các sách tiếng việt . Ngoài ra nhiều sách là bản scan thành ra nội dung bên trong bị mất hoặc in lệch không đọc được" (21/11 19:21); "riếp tục" (21:11) | Commit `8bb9482` (21/11 21:39): lọc sách chữ Hán, Nôm và bản quét không đọc được; còn 262 sách, trong đó 238 sách dựng từ Wikisource | Phát hiện sách hiển thị chữ Hán, Nôm và bản quét không đọc được, yêu cầu lọc lại | `8bb9482`; [PR #78](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/78) |
| Kho sách: thiết kế lại bìa sách | Trương Thanh Vui | "Có một vấn đề liên quan đến các trang bìa của sách ( do sách cũ và bìa bạn soạn nên nhiều sách có hình ảnh , các bố trí trang bìa giống hệt nhau )..." | 31 bìa bản in gốc, bìa vẽ mới cho 217 sách, dựng lại 238 PDF | Kiểm tra bìa sách trên trang web, báo lỗi khi áp dụng. Nguyễn Thanh Tùng duyệt và gộp PR #78 (22/11 15:39) | `cacabbb`; [PR #78](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/78) |
| Đồng bộ và đối chiếu máy chủ trước tuần mới | Trương Thanh Vui | "PR 78 đã được gộp . Tiếng hành cập nhật đối chiếu với data server của tôi lần cuối . Để chuẩn bị bắt đầu tuần mới" | Repo và máy chủ trùng `d8d0d63`, kiểm chứng ĐẠT | Kiểm tra lại dựa trên kiểm chứng và báo cho nhóm | Không có commit |
| Thay ảnh đại diện sinh viên | Trương Thanh Vui | "hãy gỡ những avatar cũ đã cài trước đó và tìm số lượng ảnh tương đương đáp ứng được yêu cầu bản quyền thay vào giúp tôi" | 1.056 ảnh tự vẽ bằng mã, thay ảnh 982 sinh viên trên web thật | Kiểm tra ảnh đã được thay. Nguyễn Thanh Tùng duyệt và gộp (23/11 10:36) | `96bb330`, `5a02ea8`; [PR #79](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/79) |
| Rà việc còn lại của tuần | Trương Thanh Vui | "Phần việc của tôi còn việc nào nữa" | Danh sách việc còn lại, trạng thái PR | Xem kết quả | Không có commit |
| Quản lý lớp học theo lớp thật | Trương Thanh Vui | "Mục quản lý lớp học còn bị vấn đề chưa cập nhật lại các thông tin dựa trên lớp học thật hiện có..." | Sĩ số theo khoa/lớp, lọc theo lớp, 3 ca kiểm thử; thử gộp với PR của Đức Tùng | Chạy lệnh cài ("Đã chạy xong"). Nguyễn Thanh Tùng duyệt và gộp (24/11 13:06) | `4545297`; [PR #84](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/84) |
| Lỗi đưa môn vào module CTĐT | Trương Thanh Vui | "Mục Chương Trình ĐT ở phần các môn đã mở nhưng ngoài CTĐT ... tôi đã thử trên web nhưng không thành công" | Sửa so sánh mã module, 3 ca kiểm thử | Phát hiện lỗi trên web | `7c09563`; [PR #84](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/84) |
| Đối chiếu mã, lập kế hoạch 2 tuần cuối | Trương Thanh Vui | "tiến hành đối chiếu mã mới trên github với server của tôi .xem các file docs và tiến độ hiện tại lên kế hoạch cho 2 tuần cuối..."; "xuất cho tôi bảng kế hoạch tuần cuối bao gồm phầm ngoài kế hoạch..." | Báo cáo đối chiếu (thiếu mã 4 PR); bảng kế hoạch tuần 9–10 để ngoài kho | Xem kết quả | Không có commit |
| Giả lập số liệu HK1 2026-2027 | Trương Thanh Vui | "Tôi cần bạn cập nhật bộ số liệu mới cho phù hợp với lượng sinh viên hiện tại cũng như hết tháng 12..." | `scripts/seed_semester.py`; nạp lên máy chủ: 4.910 bảng điểm môn, học phí, xét tốt nghiệp, đề tài, deadline | Phát hiện lỗi điểm cuối kỳ ngày 27/11. Nguyễn Thanh Tùng duyệt và gộp (26/11 14:10) | `ec590c6`; [PR #92](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/92) |
| Bộ lọc dữ liệu theo năm, Admin dọn dữ liệu cũ | Trương Thanh Vui | "Tạo thêm bộ lọc và cho phép admin có thể xóa các mục đã quá cũ..."; "gộp 2 pr bạn vừa tạo thành 1 PR duy nhất bao gồm cả 2 phần" | Bộ lọc N năm học, trích lục, xóa dữ liệu cũ, kiểm thử máy chủ | Kiểm tra bộ lọc sau khi triển khai | `06cabf6`; [PR #92](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/92) |
| Rà và dọn dữ liệu trên máy chủ | Trương Thanh Vui | "xóa nhánh feat/gia-lap-hoc-ky-1 . Ngoài ra đối chiếu data server giúp tôi..."; "Làm cả hai" | Xóa nhánh; xóa 8 môn demo cũ cùng dữ liệu, tệp đi kèm; bổ sung tin tức | Đồng ý trước khi sửa dữ liệu | Thay đổi trên máy chủ, không có commit |
| Sao lưu dữ liệu ra ổ G | Trương Thanh Vui | "tiến hành backup data vào ổ G giúp tôi" | Tạo bản sao lưu mới, chép về `G:\StudyTask-backup`, đối chiếu khớp | Chuẩn bị ổ di động, lưu và gửi tệp sao lưu cho thành viên | Không có commit |
| Bảng phân công theo thành viên | Trương Thanh Vui | "...Dựa vào các update có trong github . hãy làm Bảng phân công công việc theo từng thành viên..."; "...yêu cầu là phân công thành viên chứ không phải là liệt kê dựa trên PR" | Bảng phân công 2 phiên bản; ghi nhận sơ đồ vẽ tay | Yêu cầu làm lại; xóa tệp khỏi kho ngày 26/11 | `ff7ada1`, xóa ở `522f9ef`; bản MD để ngoài kho |
| Kiểm tra tiến độ tuần 8, commit và chuẩn bị PR | Trương Thanh Vui | "Tôi cần bạn xem và kiểm tra lần cuối xem tiến độ công việc tuần 8 còn những gì..."; "Commit the working tree changes with a sensible message." | Danh sách việc còn lại; commit, push; liên kết tạo PR | Tự tạo và xử lý PR | [PR #93](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/93) |
| Thanh ghi chú nhanh, kế hoạch ôn thi | Trương Thanh Vui | "Cập nhật tính năng ghi chú nhanh trong mục tiện ích đáp ứng các yêu cầu : cho phép kéo thanh ghi chú sang trang làm việc khác , có thể lưu thành file text , Mục lập kế hoạch ôn thi cần làm rõ..." | Thanh ghi chú nổi, tải `.txt`; so điểm hiện tại với mục tiêu, lịch ôn theo tài liệu môn; `test:logic` 202/202; thử trên trình duyệt với dữ liệu giả | Chưa kiểm tra (chưa thử kéo bằng cảm ứng) | `88b3a01`; [PR #95](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/95) |
| Cài bản Tiện ích mới lên máy chủ | Trương Thanh Vui | "cập nhật lên server trước giúp tôi" | Chuẩn bị gói và lệnh cài | Tự chạy lệnh (`sudo`) | Bản giao diện `v202611270129`, cùng mã `88b3a01` (cài trước khi gộp, mục 6 ghi chú 4) |
| Sửa điểm cuối kỳ HK1 giả lập | Trương Thanh Vui | "Phần dữ liệu bị nhầm lẫn do tôi cập nhật sai . Điểm quá trình đầy đủ là đúng . Tuy nhiên điểm cuối kỳ nhiều môn bắt buộc phải thi . chưa đến hạn..." | Gỡ điểm cuối kỳ chưa thi trên máy chủ, giữ điểm quá trình; script thêm tùy chọn `--ck-as-of` | Phát hiện lỗi, yêu cầu rà soát | `cabce5e`; [PR #95](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/95) |
| Đẩy mã, gộp thành một PR | Trương Thanh Vui | "Tiến hành push toàn bộ lên github"; "đang có 2 pr cùng lúc gộp chúng làm 1..."; "Đẩy vào PR 95" | Push hai nhánh, gộp một nhánh, kiểm tra PR | Tự tạo PR #95. Trần Đức Tùng duyệt và gộp (27/11 10:41) | `44f9c15`; [PR #95](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/95) |

## 3. Commit có AI tham gia

### Nguyễn Thanh Tùng

| Model | Commit | PR | Việc | Người duyệt và gộp |
|---|---|---|---|---|
| Sonnet 5.5 | `e029cb9` | #85 | Việc 2 | Trương Thanh Vui (24/11) |
| Opus 5.5 | `1291888`, `ed5c5ff`, `74191e3` (gộp `master`) | #86 | Việc 5 | Trần Đức Tùng (24/11) |
| Opus 5.5 | `f5c1959` | #89 | Việc 8 | Trần Đức Tùng (25/11) |
| Opus 5.5 | `cca4e27` | #90 | Việc 12 | Trương Thanh Vui (26/11) |

### Trương Thanh Vui

| Model | Commit | PR | Trong / ngoài kế hoạch | Người duyệt và gộp |
|---|---|---|---|---|
| Opus 5.5 | `ede3fbf`, `a814219`, `8bb9482` (21/11), `cacabbb` (22/11) | #78 | Ngoài (`ede3fbf` thuộc nội dung việc 6) | Nguyễn Thanh Tùng (22/11) |
| Opus 5.5 | `96bb330`, `5a02ea8` | #79 | Ngoài | Nguyễn Thanh Tùng (23/11) |
| Opus 5.5 | `319745a` | #80 | Trong (việc 6) | Nguyễn Thanh Tùng (23/11) |
| Opus 5.5 | `02ae1d7` | #81 | Trong (việc 11) | Trần Đức Tùng (23/11) |
| Opus 5.5 | `f1c43b6` | #82 | Trong (việc 6, 13) | Trần Đức Tùng (23/11) |
| Opus 5.5 | `4545297`, `7c09563` | #84 | Ngoài | Nguyễn Thanh Tùng (24/11) |
| Opus 5.5 | `ff3386a`, `c2f8965`, `8567172` | #88 | Trong (việc 4) | Nguyễn Thanh Tùng (25/11) |
| Opus 5.5 | `06cabf6`, `ec590c6` | #92 | Ngoài | Nguyễn Thanh Tùng (26/11) |
| Sonnet 5.5 | `ff7ada1` | #93 | Trong (việc 3) và ngoài (bảng phân công) | Trần Đức Tùng (26/11) |
| Opus 5.5 | `cabce5e` | #95 | Ngoài | Trần Đức Tùng (27/11) |
| Sonnet 5.5 | `88b3a01`, `44f9c15` (gộp nhánh) | #95 | Ngoài | Trần Đức Tùng (27/11) |

### Trần Đức Tùng

| Model | Commit | PR | Việc | Người duyệt và gộp |
|---|---|---|---|---|
| Opus 5.5 | `edd88cc` | #83 | Việc 3 | Nguyễn Thanh Tùng (24/11) |
| Opus 5.5 | `f131a04` | #87 | Việc 7 | Trương Thanh Vui (24/11) |
| Opus 5.5 | `bcb8ead` | #91 | Quy ước 02 (hỗ trợ nhóm) | Trương Thanh Vui (26/11) |
| Opus 5.5 | `9eec4e0` | #94 | Trang Tiện ích (ngoài kế hoạch) | Trương Thanh Vui (26/11) |
| Opus 5.5 | `e927914`, `de5d70c` | #96 | Việc 10 (AI tạo commit và đẩy nhánh; 8 sơ đồ do Trần Đức Tùng tự vẽ) | Đang mở, chờ Nguyễn Thanh Tùng review |

### Commit lệch quy ước nhãn

| Commit | Lệch | Ghi chú |
|---|---|---|
| `f131a04` (Trần Đức Tùng) | Có `[AI]`, thiếu `Co-Authored-By` | Đã gộp, không sửa lịch sử |
| `9eec4e0` (Trần Đức Tùng) | Thiếu cả `[AI]` lẫn `Co-Authored-By` | Đã gộp; Đức Tùng tự ghi nhận có AI tham gia |
| `e927914`, `de5d70c` (Trần Đức Tùng) | Có `Co-Authored-By`, thiếu `[AI]` | PR #96 còn mở |
| `74191e3` (Nguyễn Thanh Tùng) | Commit gộp do AI chạy lệnh, thiếu cả `[AI]` lẫn `Co-Authored-By` | Đã gộp, không sửa lịch sử |

Commit không có AI: `e361b2b` (Trần Đức Tùng tự gộp `master` vào nhánh việc 7); `9813569` (việc 10, PR #97: Trần Đức Tùng tự gõ 2 dòng [D05] theo hướng dẫn của AI rồi tự commit); `d72ea3f`, `522f9ef` (Trương Thanh Vui sửa và xóa tệp trên GitHub).

## 4. Sai sót của AI phát hiện trong tuần

### Nguyễn Thanh Tùng

1. **Biên bản G4 ghi số đo chưa đo thật.** Bản nháp bảng "trước / sau" có số ở cột "trước" cho khổ 412 px và 1280 px dù chưa đo trên mã cũ. AI tự phát hiện khi rà lại và đổi thành "không đo" trước khi commit.
2. **Commit gộp `74191e3` thiếu nhãn AI** (mục 3).
3. **Dùng hết hạn mức API GitHub khi chờ PR #86.** AI hỏi GitHub mỗi phút bằng API không đăng nhập (60 lượt/giờ), hết lượt sau khoảng 9 phút nên không theo dõi tiếp được; Thanh Tùng tự xem trên trình duyệt.
4. **Gửi sai định dạng khi thử R5.** Lần gọi API đầu thiếu lớp `data` bọc thân yêu cầu nên máy chủ từ chối; AI sửa và gửi lại. Không làm đổi dữ liệu.

### Trương Thanh Vui

| Ngày | Sai sót | Xử lý |
|---|---|---|
| 25/11 | Biên bản rủi ro chưa ghi đúng là việc tuần 7 làm trễ sang tuần 8; biên bản rủi ro không dẫn lại nhận xét | Sửa theo nhận xét |
| 26/11 | Bảng phân công bản đầu chỉ liệt kê theo PR; có lỗi gõ; dòng 32–33 thiếu vai review của Nguyễn Thanh Tùng | Làm lại bản 2; tệp đã xóa khỏi kho (`522f9ef`) |
| 26/11 | Nói chưa có bằng chứng máy chủ đã nhận bản sửa V3, trong khi bản sửa đã có trên web | Đối chiếu tệp và đính chính |
| 26–27/11 | Số liệu giả lập có điểm cuối kỳ cho môn chưa thi: script do AI viết dùng chung một ngày chốt (31/12) cho mọi loại số liệu. Người dùng ghi nhận là do mình cập nhật sai | Gỡ điểm cuối kỳ trên máy chủ, sửa script (`cabce5e`) |
| 27/11 | Khi chuẩn bị triển khai, AI chạy nhầm `deploy/deploy.sh` không có `sudo`: đặt lại quyền thư mục dữ liệu (như mọi lần triển khai) rồi dừng vì thiếu quyền | Kiểm tra lại: API, giao diện, dịch vụ không đổi; đã báo người dùng |
| 27/11 | Chỉ đặt lệnh quay lại trong khung lệnh, dẫn tới chạy nhầm lệnh khi cài bản Tiện ích | Đưa lại đúng lệnh cài |
| 27/11 | Khi thử trang Tiện ích: ghi "đủ mọi cột" dù có điểm tự nhập; giao diện tối khó đọc | Đã sửa trước khi commit |

### Trần Đức Tùng

1. **Hướng dẫn việc 3 chưa nêu rõ bước import hàm mới vào tệp kiểm thử.** Lần chạy đầu `test:logic` 150/151, ca 19 lỗi `ReferenceError: countSubmissionsByQuiz is not defined` vì `tests/logic.test.mjs` chưa import hàm. AI phát hiện khi chạy lại kiểm thử và chỉ ra dòng import cần thêm; Đức Tùng tự thêm, chạy lại 151/151 đạt.


## 5. Ghi chú đối chiếu với GitHub (27/11/2026)

Các chỗ đã sửa hoặc bổ sung so với bản nháp của từng người:

1. **PR #96 (việc 10) chưa có trong nhật ký của Đức Tùng.** Trần Đức Tùng tạo PR lúc 27/11 10:33, hai commit `e927914`, `de5d70c` có `Co-Authored-By: Claude Opus 5.5` nhưng thiếu `[AI]`. **Đã bổ sung:** Đức Tùng gửi dòng việc 10, kèm PR #97 (`9813569`, mở 27/11 14:51, tự commit không có AI). Trên GitHub cả hai PR đang mở, chưa có review.
2. **Bản Tiện ích cài lên máy chủ trước khi gộp.** Bản giao diện `v202611270129` (27/11 08:29) cài từ mã `88b3a01`; commit này được tạo lúc 08:39, PR #95 mở lúc 08:46 và gộp lúc 10:41. Phần 5 báo cáo tuần 7 có quy tắc "chỉ cài lên máy chủ mã đã gộp vào `master`, kể cả phần ngoài kế hoạch". Sau khi PR #95 gộp, phần giao diện trên `master` trùng `88b3a01` (khác biệt chỉ ở script giả lập, tài liệu và kiểm thử), nên máy chủ không còn lệch phần giao diện. Cần ghi ngoại lệ này trong báo cáo tuần 8.
3. **Người review khác kế hoạch.** Việc 5: kế hoạch ghi Trương Thanh Vui review, thực tế Trần Đức Tùng duyệt và gộp PR #86. Việc 6: kế hoạch ghi Trần Đức Tùng review, PR #80 do Nguyễn Thanh Tùng duyệt và gộp (PR #82 đúng Trần Đức Tùng). Kế hoạch yêu cầu ghi lại khi đổi người review.
4. **Người thực hiện khác kế hoạch.** Việc 3 (phần thử lại trên web thật) và việc 4 giao Trần Đức Tùng, nhưng Trương Thanh Vui làm thay vì Đức Tùng không vào được máy chủ (PR #93, PR #88).
5. **Bảng phân công (Thanh Vui, sai sót 26/11).** Bản nháp ghi "dòng 32–33 chưa sửa"; tệp đã bị xóa khỏi kho ở `522f9ef`, nên không còn chỗ cần sửa trong repo.
6. **Giờ gộp và người gộp** của mọi PR trong mục 1–3 lấy từ GitHub, không lấy từ bản nháp. Các bản nháp khớp GitHub ở các điểm còn lại (PR #83, #87, #91, #93, #94 và các PR của Thanh Vui).

## Phụ lục: các phiên làm nguồn

| Người dùng | Phiên | Mã | Model | Thời gian |
|---|---|---|---|---|
| Nguyễn Thanh Tùng | Đồng bộ mã, việc 2 | `15e7cc76` | Sonnet 5.5 | 24/11 11:34 – 12:07 |
| Nguyễn Thanh Tùng | Việc 5 | `e21cfed7` | Opus 5.5 | 24/11 12:12 – 15:50 |
| Nguyễn Thanh Tùng | Việc 8 | `0394ede8` | Opus 5.5 | 25/11 15:28 – 15:57 |
| Nguyễn Thanh Tùng | Việc 12 | `b2587818` | Opus 5.5 | 26/11 09:30 – 09:40 |
| Nguyễn Thanh Tùng | Việc 9 (nhật ký AI) | `509d7330` | Opus 5.5 | 27/11 |
| Trương Thanh Vui | Hệ thống CSDL đào tạo | `7a9ce457` | Opus 5.5 | 21/11 09:59 – 27/11 08:36 |
| Trương Thanh Vui | Cập nhật file Studytask | `0aa6550b` | Opus 5.5 | 22/11 15:52 – 26/11 11:04 |
| Trương Thanh Vui | Bảng phân công công việc nhóm | `df51de15` | Sonnet 5.5 | 26/11 14:13 – 27/11 |
| Trương Thanh Vui | Nâng cấp Ghi chú nhanh và Kế hoạch ôn thi | `8e249f9e` | Sonnet 5.5 | 27/11 07:39 – 08:46 |
| Trần Đức Tùng | Không ghi mã phiên | | Opus 5.5 | 23/11 – 27/11 |
