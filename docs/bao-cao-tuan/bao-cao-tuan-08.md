# Báo cáo tuần 8

**Đề tài:** Xây dựng website quản lý deadline học tập cho sinh viên (sản phẩm: StudyTask)  
**GVHD:** TS. Huỳnh Xuân Phụng  
**Nhóm:**  
- Nguyễn Thanh Tùng (24TX810027)  
- Trần Đức Tùng (24TX810026)  
- Trương Thanh Vui (24TX810021)  

**Thời gian:** 23/11 – 28/11/2026  
**Repo GitHub (public):** https://github.com/NguyenThanhTung301020/Nhom-5_Studytask  

---

## Phần 1. Tóm tắt

- **Nguyễn Thanh Tùng:** kiểm lại L1, G2, G3, R5 trên web thật sau khi máy chủ cập nhật, đều đạt ([PR85]); đưa bản sao lưu ngoài lên Google Drive, chỉ người được chia sẻ xem được, link ghi trong `docs/van-hanh/15` ([PR86]); rà [D3] mục 15, 16 (đã làm sớm) và sửa lỗi lịch tháng thừa một hàng ([PR89]); sửa G4, trang cuộn ngang ở khổ hẹp ([PR90]); tổng hợp nhật ký AI tuần 8; review và gộp [PR78], [PR79], [PR80], [PR83], [PR84], [PR88], [PR92].
- **Trần Đức Tùng:** sửa 2 lỗi giao diện V3 (ca 19: thẻ đề đếm lượt nộp từ `quizResults`; ca 24: hạn đề tính hết ngày theo giờ Việt Nam như máy chủ) ([PR83]); làm [D3] mục 14, nhập danh sách lớp từ CSV/Excel, chỉ Admin và Phòng Đào tạo được nhập ([PR87]); cập nhật 8 sơ đồ Use Case, DFD và ghi chú [D05] cho khớp hệ thống đang chạy ([PR96], [PR97]); review và gộp [PR81], [PR82], [PR86], [PR89], [PR93], [PR95].
- **Trương Thanh Vui:** cập nhật GitHub vào server; thử lại V3 ca 19, 23, 24 trên web thật, đều đạt ([PR93]); biên bản rủi ro cổng 80/443 và áp dụng biện pháp hạn chế trên máy chủ ([PR88]); gỡ 33 sách chưa rõ giấy phép ([PR78]); sao lưu có PDF kho sách, thử khôi phục đạt ([PR80], [PR82]); cập nhật gói, 0 gói chờ ([PR81]); điền kết quả CI của [PR61] vào biên bản 08 ([PR82]); review và gộp [PR85], [PR87], [PR90], [PR91], [PR94], [PR96], [PR97].

**Đổi người thực hiện so với kế hoạch** (Trần Đức Tùng không truy cập được máy chủ):
- Việc 3, phần thử lại ca 19, 23, 24 trên web thật: kế hoạch giao Trần Đức Tùng; Trương Thanh Vui thực hiện ([PR93]), Trần Đức Tùng review và gộp.
- Việc 4: kế hoạch giao Trần Đức Tùng; Trương Thanh Vui thực hiện ([PR88]), vì các biện pháp hạn chế phải áp dụng trực tiếp trên máy chủ.

**Đổi người review so với kế hoạch:**
- Việc 5: kế hoạch ghi Trương Thanh Vui review; Trần Đức Tùng review và gộp [PR86].
- Việc 6: kế hoạch ghi Trần Đức Tùng review; [PR80] do Nguyễn Thanh Tùng review và gộp ([PR82] đúng Trần Đức Tùng).
- Việc 10: kế hoạch ghi Nguyễn Thanh Tùng review; Trương Thanh Vui review và gộp [PR96], [PR97].

**Ngoài kế hoạch** (không tính vào khối lượng theo kế hoạch):
- Trần Đức Tùng: cập nhật trang Tiện ích ([PR94]).
- Trương Thanh Vui: kho sách (rà bản quyền đợt 2, chỉ giữ sách tiếng Việt đọc được, thiết kế lại bìa) ([PR78]); thay ảnh đại diện sinh viên bằng ảnh tự vẽ, gỡ ảnh chưa rõ bản quyền ([PR79]); Quản lý lớp học theo lớp học phần thật, sửa lỗi đưa môn ngoài CTĐT vào module ([PR84]); giả lập số liệu học kỳ 1, bộ lọc dữ liệu theo năm học và Admin dọn dữ liệu cũ ([PR92]); thanh ghi chú nhanh nổi, kế hoạch ôn thi theo điểm và tài liệu, sửa điểm cuối kỳ giả lập ([PR95]).

**Hỗ trợ nhóm:** đưa lên GitHub quy ước 02 (nhóm cùng soạn) về việc định kỳ không cần đưa vào báo cáo tuần, theo nhận xét của thầy ở tuần 7 ([PR91]).

**Ghi nhận:** bản trang Tiện ích của [PR95] (ngoài kế hoạch, Trương Thanh Vui) được cài lên máy chủ trước khi gộp, trái quy tắc "chỉ cài lên máy chủ mã đã gộp vào `master`". Sau khi [PR95] gộp, phần giao diện trên máy chủ trùng `master`.

---

## Phần 2. Tự đánh giá của các thành viên

### 2.1. Nguyễn Thanh Tùng

**Việc làm được:**
- Việc 2: kiểm lại trên web thật sau khi máy chủ cập nhật, cả 4 mục đạt. L1: xóa môn còn tài liệu thì máy chủ trả 409, trang báo lỗi, không ghi đè; G3: hộp xác nhận xóa nêu tên môn; G2: ô CSV bắt đầu bằng `=`, `+`, `@` được thêm dấu `'`, mở bằng Excel không thành công thức; R5: Phòng Đào tạo đổi link minh chứng sang `javascript:`, `data:`, `//...` đều bị chặn, link https lưu được. Dọn dữ liệu thử sau khi xong ([PR85]).
- Việc 5: tải bản sao lưu lên Google Drive với quyền Hạn chế, hai thành viên còn lại chỉ có quyền Người xem; tải lại kiểm tra trùng bản gốc; link ghi trong `docs/van-hanh/15` ([PR86]).
- Review và gộp: [PR78], [PR79], [PR80] (việc 6), [PR83] (việc 3), [PR84], [PR88] (việc 4), [PR92].

**Việc đạt được một phần:**
- Việc 8: [D3] mục 15 (nộp tệp trực tiếp) và mục 16 (lịch tháng) ghi đã làm sớm, kèm minh chứng; chuyển hàm tính buổi học sang `utils/periods.js` dùng chung với lịch tuần, sửa lỗi tháng có 4 tuần hiện thừa một hàng; `test:logic` 169/169 ([PR89]). **Còn thiếu:** 7 ca thử tay T1–T7 chưa thử trên web thật.
- Việc 12: sửa G4 ở hàng công cụ trang Môn học và thanh trên cùng; đo ở khổ 320, 375, 412, 512 px, khổ 1280 px giữ bố cục cũ; `test:logic` 169/169 ([PR90]). **Còn thiếu:** chưa thử trên điện thoại thật.

### 2.2. Trần Đức Tùng

**Việc làm được:**
- Việc 3: sửa ca 19 (thẻ đề đếm lượt nộp từ `GET /api/quiz/results`, tải lỗi thì hiện "–" thay vì 0) và ca 24 (`quizDuePassed` tính hạn đến hết ngày `dueDate` theo giờ Việt Nam, giống `quiz_due_passed` ở máy chủ); thêm ca kiểm thử, `test:logic` 151/151 ([PR83]). Thử lại trên web thật sau khi máy chủ cập nhật: ca 19, 23 (API-05), 24 đều **Đạt** ([PR93], Trương Thanh Vui thử, Trần Đức Tùng review và gộp).
- Việc 7, [D3] mục 14: nhập danh sách lớp từ tệp CSV UTF-8 hoặc dán từ Excel (cột mã SV, họ tên, lớp, khóa); chỉ Admin và Phòng Đào tạo thấy nút nhập, máy chủ chặn vai trò khác; tài khoản trùng thì bỏ qua, không ghi đè; tối đa 500 dòng mỗi lần. Phân quyền theo ý kiến của thầy. `test:logic` 157/157, `test_import_students.py` 13/13, thêm vào CI; thử tay trên máy đạt; cập nhật [D3] mục 14 ([PR87]).
- Việc 10: cập nhật 8 sơ đồ Use Case và DFD (thêm thi trực tuyến, phòng thi, xem bài nộp, đặt lại mật khẩu, hủy liên kết email; DFD thêm kho `examKeys`, `examSessions`, `libraryBooks`; điểm trắc nghiệm ở Bảng điểm và Báo cáo lớp đọc từ `quizResults`) ([PR96]); sửa ghi chú [D05]: việc 8 (V4) đã xong vì Bảng điểm và Báo cáo lớp đọc `quizResults`, chuyển các mục đã làm (thử trên web thật, tính hạn đề theo cuối ngày giờ Việt Nam) khỏi phần "Chưa làm" ([PR97]). Hai PR đã được Trương Thanh Vui review và gộp.
- Review và gộp: [PR81] (việc 11), [PR82] (việc 6, 13), [PR86] (việc 5), [PR89] (việc 8), [PR93] (việc 3, thử trên web thật), [PR95] (ngoài kế hoạch).

**Việc đạt được một phần:**
- Việc 7: chưa đọc thẳng tệp `.xlsx` vì phải thêm thư viện ngoài; hiện nhận CSV hoặc dán từ Excel (ghi trong [D3] mục 14).

**Việc chưa làm:**
- Việc 4: không tự thực hiện (xem phần đổi người thực hiện).

### 2.3. Trương Thanh Vui

**Việc làm được:**
- Việc 1: cập nhật GitHub vào server, báo nhóm đã cập nhật.
- Việc 3, phần thử lại trên web thật (làm thay Trần Đức Tùng): ca 19, 23 (API-05), 24 đều đạt ([PR93]).
- Việc 4 (làm thay Trần Đức Tùng): biên bản 08 mục 6 nêu mặt rủi ro, biện pháp hạn chế, các bước kiểm tra và mốc đánh giá lại; áp dụng biện pháp trên máy chủ; thử cổng từ mạng 4G ([PR88]).
- Việc 6: gỡ 33 sách chưa rõ giấy phép, thay bằng sách phạm vi công cộng ([PR78]); bản sao lưu có PDF kho sách (262 PDF), thử khôi phục đạt, có ca kiểm thử và bước CI ([PR80], [PR82]).
- Việc 11: cập nhật gói, 0 gói chờ, ghi vào biên bản 12; ghi nhận lần cúp điện làm máy chủ tắt ([PR81]).
- Việc 13: điền kết quả CI của [PR61] vào biên bản 08 mục 4 ([PR82]).
- Review và gộp: [PR85] (việc 2), [PR87] (việc 7), [PR90] (việc 12), [PR91], [PR94], [PR96], [PR97] (việc 10).

---

## Phần 3. Phản hồi nhận xét của giảng viên

| Ý kiến của thầy | Thực tế tuần 8 | Minh chứng |
|---|---|---|
| Gia hạn phần ngoài kế hoạch từ 3 lên 5 tuần, với điều kiện: sửa lỗi trước, kiểm thử sau, không mở chức năng mới, không cập nhật giao diện, hình ảnh | **Đạt một phần:** nhóm tập trung sửa lỗi logic phát sinh trong quá trình thực hiện: Quản lý lớp học theo lớp thật, môn ngoài CTĐT ([PR84]), điểm cuối kỳ giả lập ([PR95]). Tuy nhiên, nhiều hạng mục nhóm nhận thấy chưa phù hợp nên phát sinh giao diện cũng như chức năng mới: trang Tiện ích ([PR94]), thanh ghi chú nổi, kế hoạch ôn thi ([PR95]), bộ lọc dữ liệu theo năm học ([PR92]), bìa sách ([PR78]), ảnh đại diện ([PR79], để gỡ ảnh chưa rõ bản quyền). Từ tuần 9, phần ngoài kế hoạch ưu tiên sửa lỗi và bổ sung kiểm thử, hạn chế hết mức việc phát sinh thêm giao diện và chức năng; trường hợp cần điều chỉnh sẽ ghi rõ lý do trong báo cáo tuần | [PR78], [PR79], [PR84], [PR92], [PR94], [PR95] |
| Đo lại ở T+30 thay cho T+15, với 2 điều kiện: lỗi mã 500 phải sửa trước khi tới T+30; giám sát truy cập từ ngoài phải có sẵn ở T+30, không dời tiếp | Trương Thanh Vui theo dõi. Mốc T+30 (khoảng 04/12/2026) và việc xem lỗi mã 500 hằng tuần đã ghi trong quy ước 02 (việc S1, S3). Kết quả đo T+30 báo ở tuần 9 | [PR91] |
| Phân quyền [D3] mục 14: đồng ý chỉ Admin và Phòng Đào tạo nhập danh sách lớp, giáo viên chỉ xem | **Đạt:** làm đúng phân quyền thầy đồng ý. Chỉ Admin và Phòng Đào tạo thấy nút nhập, máy chủ chặn vai trò khác; tài khoản trùng thì bỏ qua, không ghi đè (việc 7) | [PR87] |
| "Quy ước" cho các việc không báo cáo liên tục: không đồng ý ở dạng chung chung; phải nêu rõ việc nào, vì sao không cần báo tuần, mốc nào, ai kiểm tra khi nào; giữ cấu trúc báo cáo | **Đạt:** quy ước 02 thay cho bảng Q1–Q3 chung chung ở tuần 7. Mỗi việc định kỳ có người làm, tần suất, lý do không cần báo tuần, mốc phải báo và nơi lưu dấu vết; có điều kiện báo chung (lỗi, thay đổi cấu hình, đến mốc). Cấu trúc báo cáo giữ nguyên, chỉ thêm một dòng tổng hợp việc định kỳ ở Phần 4 | [PR91]; `docs/quy-uoc/02-quy-uoc-viec-dinh-ky-khong-bao-cao-tuan.md` |

---

## Phần 4. Tình trạng các việc trong kế hoạch tuần 8

| # | Việc | Người phụ trách | Tình trạng | Minh chứng |
|---|---|---|---|---|
| 1 | Cập nhật GitHub vào server | Trương Thanh Vui | **Đạt:** Trương Thanh Vui báo nhóm đã cập nhật | – |
| 2 | Kiểm lại trên web thật: L1, G2, G3; R5 phần Đào tạo sửa link | Nguyễn Thanh Tùng | **Đạt:** cả 4 mục đạt trên web thật sau khi máy chủ cập nhật; Trương Thanh Vui Approve và gộp | [PR85] |
| 3 | Sửa 2 lỗi giao diện V3 (ca 19, 24); thử API-05 trên web thật (ca 23) | Trần Đức Tùng (Nguyễn Thanh Tùng review) | **Đạt:** PR có ca kiểm thử, Nguyễn Thanh Tùng Approve và gộp [PR83]; ca 19, 23, 24 đạt trên web thật (phần thử do Trương Thanh Vui làm thay, [PR93]) | [PR83], [PR93] |
| 4 | Cổng 80/443: rủi ro, biện pháp hạn chế, mốc đánh giá lại trong `docs/van-hanh/08` | Trần Đức Tùng (Nguyễn Thanh Tùng review); thực tế Trương Thanh Vui thực hiện | **Đạt** (do Trương Thanh Vui thực hiện) | [PR88] |
| 5 | Bản sao lưu ngoài: tải lên Google Drive, ghi link vào repo | Nguyễn Thanh Tùng (Trương Thanh Vui review); thực tế Trần Đức Tùng review | **Đạt:** `docs/van-hanh/15` ghi link Drive; chỉ người được chia sẻ xem được | [PR86] |
| 6 | Kho sách: xử lý 33 sách chưa rõ giấy phép; sao lưu PDF | Trương Thanh Vui (Trần Đức Tùng review) | **Đạt:** gỡ 33 sách; bản sao lưu có PDF, thử khôi phục đạt. [PR80] do Nguyễn Thanh Tùng review và gộp, [PR82] do Trần Đức Tùng | [PR78], [PR80], [PR82] |
| 7 | [D3] mục 14: nhập danh sách lớp từ CSV/Excel | Trần Đức Tùng (Trương Thanh Vui review) | **Đạt:** PR có ca kiểm thử máy chủ và giao diện; Trương Thanh Vui Approve và gộp | [PR87] |
| 8 | [D3] mục 15, 16: rà hiện trạng | Nguyễn Thanh Tùng (Trần Đức Tùng review) | **Đạt:** hai mục ghi đã làm sớm kèm minh chứng, có thêm ca kiểm thử; còn 7 ca thử tay trên web thật chưa thử | [PR89] |
| 9 | Nhật ký AI và báo cáo tuần 8 | Cả nhóm | **Đang làm:** đã soạn, chờ đưa lên `docs/ai-log/tuan-08.md` và `docs/bao-cao-tuan/tuan-08.md` | – |
| 10 | Chỉnh các sơ đồ [D3], [D05]; cập nhật ghi chú [D05] "Việc 8 (V4) còn lại" | Trần Đức Tùng (Nguyễn Thanh Tùng review) | **Đạt:** 8 sơ đồ ([PR96]) và ghi chú [D05] ([PR97]) đã cập nhật khớp hệ thống đang chạy, đổi người review Trương Thanh Vui Approve và gộp | [PR96], [PR97] |
| 11 | Cập nhật gói | Trương Thanh Vui | **Đạt:** 0 gói chờ; ghi vào biên bản 12 | [PR81] |
| 12 | G4: trang cuộn ngang ở khổ hẹp | Nguyễn Thanh Tùng | **Đạt một phần:** PR đo ở các khổ điện thoại trên trình duyệt; chưa thử trên điện thoại thật | [PR90] |
| 13 | Biên bản 08 mục 4: điền kết quả CI của [PR61] | Trương Thanh Vui | **Đạt:** không còn dòng chờ điền | [PR82] |
| 14 | Vite + JSX + ESLint ([D3] mục 9): chốt tuần thực hiện | Cả nhóm | **Chuyển tuần 9:** ngày 27/11 nhóm thống nhất việc chốt phạm vi [D3] (gồm mục 9) làm trong tuần 9 (việc 2 Phần 5) | – |

**Việc định kỳ theo quy ước 02:** đã làm; phát sinh 2 điều kiện báo: (1) máy chủ tắt ngoài kế hoạch do cúp điện (việc S3), đã ghi trong biên bản 12 và báo cáo 01 ([PR81]); (2) bản trang Tiện ích được cài lên máy chủ trước khi gộp (việc D2), xem mục Ghi nhận ở Phần 1. Kiểm tra sức khỏe máy chủ và thử khôi phục (S1, B2) đến mốc T+30 ở tuần 9.

---

## Phần 5. Kế hoạch tuần 9 (30/11 – 05/12/2026)

Kế hoạch lấy từ các việc còn tồn ở Phần 2 ("Việc đạt được một phần"), Phần 3 (ý kiến của thầy), Phần 4 (việc chưa đạt) và cột "Tuần" của [D3]; giữ khối lượng 14 việc như tuần 8. Các việc vốn dự kiến ở tuần 10 để lại tuần 10.

**Thứ tự chung:** việc 1 làm từ đầu tuần; các việc thử trên web thật (việc 3, 4, 10, 11) chỉ làm sau khi Trương Thanh Vui báo đã cập nhật GitHub vào server. Việc 3, 4 chuyển từ tuần 8, xong trước thứ 4 02/12. Chỉ cài lên máy chủ mã đã gộp vào `master`. Mỗi PR do đúng người ghi trong cột "Người phụ trách" review; đổi người review thì ghi lại trong báo cáo.

**Mục tiêu tuần 9:** đóng các việc còn mở của tuần 8 và triển khai phạm vi [D3] cho 2 tuần cuối.

**Nhóm A: bắt buộc**

| # | Công việc | Người phụ trách | Kết quả cần đạt |
|---|---|---|---|
| 1 | Cập nhật GitHub vào server và xóa 28 GB sách đã gỡ trong `library/removed` (làm từ đầu tuần) | Trương Thanh Vui | Trương Thanh Vui báo nhóm đã cập nhật xong; ổ máy chủ giảm tương ứng; không cần PR hay biên bản |
| 2 | Triển khai phạm vi [D3] mục 9 (Vite + JSX + ESLint), 13 (Playwright), 17 (PWA), 18 (lớp thật, KPI) theo thống nhất của nhóm ngày 27/11: mỗi mục ghi "làm ở tuần nào" hoặc "không làm trong đợt này" kèm lý do | Cả nhóm | [D3] cập nhật cột "Quyết định" và "Tuần" cho 4 mục |
| 3 | Việc 7 tuần 8: thử nhập danh sách lớp CSV/Excel trên web thật (Admin, Phòng Đào tạo; giáo viên chỉ xem) | Trần Đức Tùng (Trương Thanh Vui review) | Kết quả thử tay trên web thật; dọn tài khoản thử sau khi xong |
| 4 | Việc 8 tuần 8: thử tay 7 ca T1–T7 ([D3] mục 15, 16) trên web thật | Nguyễn Thanh Tùng (Trần Đức Tùng review) | Kết quả 7 ca ghi trong `docs/kiem-thu/ra-soat-d3-muc-15-16-tuan-8.md`; dọn bài nộp thử sau khi xong |
| 5 | Sửa API không trả mã 500 khi trình duyệt ngắt kết nối (`BrokenPipeError`); theo điều kiện của thầy, phải xong trước mốc T+30 | Trương Thanh Vui (Nguyễn Thanh Tùng review) | PR có ca kiểm thử; sau khi cài, nhật ký không còn mã 500 do lỗi này |
| 6 | Mốc T+30 (khoảng 04/12, quy ước 02 việc S1): kiểm tra sức khỏe máy chủ, thử khôi phục; giám sát truy cập từ ngoài phải có sẵn ở mốc này, không dời tiếp (theo phương án của nhóm: theo dõi sau khi cập nhật server rồi đo lại) | Trương Thanh Vui | Điền cột T+30 bảng 8.4 và kết luận 8.6 [báo cáo 01] |
| 7 | Bản sao lưu ngoài mới (bản trên Drive là 17/11): chép bản mới nhất có PDF kho sách, tải lên Google Drive | Trương Thanh Vui chép; Nguyễn Thanh Tùng tải lên (Trần Đức Tùng review) | Tài liệu 15 có link Drive và ngày của bản mới |
| 8 | Cập nhật [D05] mục 4, 5.1, 7 và các mục [D3] còn mô tả Firestore, Firebase (mục 5, 11, 15) theo máy chủ riêng (phần "Chưa làm" còn lại của [D05]) | Trần Đức Tùng (Nguyễn Thanh Tùng review) | [D05] không còn mục "Chưa làm"; [D3] mô tả đúng hệ thống đang chạy |
| 9 | Nhật ký AI và báo cáo tuần 9 | Cả nhóm | `docs/ai-log/tuan-09.md`; báo cáo có link commit, PR, tệp |

**Nhóm B: làm khi nhóm A đúng tiến độ**

| # | Công việc | Người phụ trách | Kết quả cần đạt |
|---|---|---|---|
| 10 | Việc 12 tuần 8, phần còn lại: thử G4 trên điện thoại thật; rà khổ hẹp (320–512 px) các trang chỉ sinh viên, giáo viên, Admin thấy (Trắc nghiệm, Học phí, Quản trị), theo mục 5 biên bản G4 | Nguyễn Thanh Tùng (Trần Đức Tùng review) | Ảnh chụp trên điện thoại và kết quả rà ghi vào biên bản G4; trang còn cuộn ngang thì có PR sửa |
| 11 | Việc 6 tuần 8: xác nhận không còn sách chưa rõ giấy phép trên web | Trần Đức Tùng | Một dòng xác nhận trong báo cáo tuần 9 |
| 12 | [D3] mục 17 (nếu chốt làm): PWA tối thiểu, gồm manifest, cài lên màn hình điện thoại, nhắc deadline khi trang đang mở | Nguyễn Thanh Tùng (Trần Đức Tùng review) | PR và thử trên điện thoại thật, hoặc ghi lý do dời |
| 13 | Kiểm tra bảo mật trước nghiệm thu (đưa lên từ tuần 10): thử cổng từ mạng 4G, `ufw`, SSH, quyền chia sẻ Drive; đánh giá lại R1–R5 (biên bản 08 mục 6.6) và quy ước 02 | Trương Thanh Vui, Trần Đức Tùng (Nguyễn Thanh Tùng review) | Điền biên bản 08 mục 6.7 và quy ước 02 mục 5 |
| 14 | Việc 7 tuần 8, phần còn lại: nhập danh sách lớp đọc thẳng tệp `.xlsx`, hoặc ghi lý do không làm trong [D3] mục 14 | Trần Đức Tùng (Trương Thanh Vui review) | PR có ca kiểm thử, hoặc [D3] mục 14 ghi rõ lý do |

Việc định kỳ theo quy ước 02 làm song song, không tính là việc trong kế hoạch; báo cáo tuần 9 chỉ có một dòng tổng hợp.

**Việc để lại tuần 10 (ghi để không quên):**
- [D3] mục 13 (vài ca Playwright cho luồng chính) và mục 18 (thử với một nhóm sinh viên, đo KPI), nếu việc 2 chốt làm.
- Báo cáo tổng kết: rà TC1–TC6 (`docs/phan-tich/02`), bảng [D3] cuối cùng, tổng hợp nhật ký AI, hạn chế và hướng phát triển.
- Kiểm tra project Firebase đã bị xóa hẳn sau hạn khôi phục 11/12/2026 (Nguyễn Thanh Tùng).

**Xin ý kiến giảng viên:**
1. [D3] mục 9 (chuyển sang Vite + JSX + ESLint) được triển khai trong tuần 9 theo thống nhất của nhóm ngày 27/11. Do thời gian còn lại không nhiều, nhóm dự kiến làm theo từng bước: thêm ESLint vào CI trước, chuyển Vite + JSX sau, và chỉ cài lên máy chủ khi `test:logic` và CI đều đạt. Nếu phát sinh lỗi ảnh hưởng chức năng đang chạy hoặc không kịp tiến độ, nhóm sẽ giữ nền hiện tại và ghi lý do dời. Thầy có đồng ý với cách làm này không?
2. [D3] mục 18 (thử với lớp thật, đo KPI): trong thời gian còn lại nhóm khó tổ chức thử với cả một lớp học phần. Nhóm dự kiến làm bản thu nhỏ, thử với một nhóm sinh viên, đo tỉ lệ hoàn thành thao tác, thời gian và ghi phản hồi, tùy điều kiện thực tế. Thầy có chấp nhận bản thu nhỏ này làm minh chứng bước đầu cho tính khả thi không?
3. Ở tuần 8, phần ngoài kế hoạch còn phát sinh một số giao diện và chức năng mới (trang Tiện ích, ghi chú nổi, kế hoạch ôn thi). Nhóm đề xuất giữ lại các phần đã gộp; từ tuần 9 nhóm ưu tiên sửa lỗi và bổ sung kiểm thử, hạn chế hết mức việc phát sinh thêm giao diện và chức năng. Trường hợp cần điều chỉnh để sửa lỗi hoặc giữ hệ thống chạy ổn định, nhóm sẽ ghi rõ lý do trong báo cáo tuần. Phần này được ghi riêng trong báo cáo tổng kết, không tính vào khối lượng của nhóm. Thầy có đồng ý cho nhóm giữ lại các phần này không?

---

## Phần 6. Khai báo công cụ AI

Trong tuần 8, nhóm sử dụng Claude Code (Anthropic): Claude Opus 5.5 (cả ba thành viên) và Claude Sonnet 5.5 (Trương Thanh Vui 2 phiên: bảng phân công, ghi chú nhanh và kế hoạch ôn thi; Nguyễn Thanh Tùng 1 phiên: việc 2), cho các việc sau:
- cập nhật máy chủ, biên bản rủi ro cổng 80/443, sao lưu PDF kho sách và thử khôi phục, cập nhật gói;
- thử trên web thật L1, G2, G3, R5 và V3 ca 19, 23, 24; sửa G4 (cuộn ngang ở khổ hẹp); rà [D3] mục 15, 16;
- hướng dẫn sửa 2 lỗi giao diện V3, nhập danh sách lớp từ CSV/Excel ([D3] mục 14) và cập nhật ghi chú [D05]; tạo commit, đẩy nhánh 8 sơ đồ (sơ đồ do Trần Đức Tùng tự vẽ);
- đưa bản sao lưu ngoài lên Google Drive và ghi link vào repo;
- phần ngoài kế hoạch: trang Tiện ích (Trần Đức Tùng); kho sách, ảnh đại diện, Quản lý lớp học theo lớp thật, giả lập số liệu học kỳ 1, ghi chú nhanh nổi và kế hoạch ôn thi (Trương Thanh Vui).

Chi tiết từng việc, phần sinh viên tự kiểm tra và các sai sót của AI được ghi trong `docs/ai-log/tuan-08.md`. Commit lệch quy ước nhãn: `f131a04` ([PR87]) có `[AI]` nhưng thiếu `Co-Authored-By`; `9eec4e0` ([PR94]) thiếu cả `[AI]` lẫn `Co-Authored-By`; `e927914`, `de5d70c` ([PR96]) có `Co-Authored-By` nhưng thiếu `[AI]` (AI chỉ tạo commit, nội dung là sơ đồ tự vẽ); `74191e3` ([PR86], commit gộp do AI chạy lệnh) thiếu cả hai. Các commit đã gộp không sửa lịch sử.

---

## Phụ lục

### A. Commit của Trần Đức Tùng trong tuần 8

| Commit | Ngày | Nội dung | PR |
|---|---|---|---|
| `edd88cc` | 23/11 | Việc 3: thẻ đề đếm lượt nộp từ `quizResults` (ca 19), hạn đề tính hết ngày giờ Việt Nam (ca 24) | [PR83] |
| `f131a04` | 24/11 | Việc 7: [D3] mục 14, nhập danh sách lớp từ CSV/Excel | [PR87] |
| `e361b2b` | 24/11 | Gộp `master` vào nhánh việc 7, giải xung đột `tests/logic.test.mjs` | [PR87] |
| `bcb8ead` | 26/11 | Ngoài kế hoạch: quy ước 02, việc định kỳ không cần đưa vào báo cáo tuần | [PR91] |
| `9eec4e0` | 26/11 | Ngoài kế hoạch: cập nhật trang Tiện ích | [PR94] |
| `e927914`, `de5d70c` | 27/11 | Việc 10: cập nhật 8 sơ đồ Use Case, DFD | [PR96] |
| `9813569` | 27/11 | Việc 10: [D05] ghi chú việc 8 (V4) đã xong, cập nhật mục "Chưa làm" | [PR97] |

### B. Review và gộp PR trong tuần 8

| PR | Người mở | Review | Người gộp | Ngày gộp |
|---|---|---|---|---|
| [PR78] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve | Nguyễn Thanh Tùng | 22/11 |
| [PR79] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve | Nguyễn Thanh Tùng | 23/11 |
| [PR80] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve (kế hoạch ghi Trần Đức Tùng review) | Nguyễn Thanh Tùng | 23/11 |
| [PR81] | Trương Thanh Vui | Trần Đức Tùng Approve: checksum tệp minh chứng và hash API khớp `master`; số liệu cập nhật gói và cúp điện ghi rõ | Trần Đức Tùng | 23/11 |
| [PR82] | Trương Thanh Vui | Trần Đức Tùng Approve: SHA256 hai script khớp `master`; kết quả sao lưu, thử khôi phục và CI của [PR61] khớp; bản sao lưu chỉ chép sách đang hiện trên web | Trần Đức Tùng | 23/11 |
| [PR83] | Trần Đức Tùng | Nguyễn Thanh Tùng Approve: sửa đúng 2 lỗi giao diện V3, có test biên | Nguyễn Thanh Tùng | 24/11 |
| [PR84] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve | Nguyễn Thanh Tùng | 24/11 |
| [PR85] | Nguyễn Thanh Tùng | Trương Thanh Vui Approve | Trương Thanh Vui | 24/11 |
| [PR86] | Nguyễn Thanh Tùng | Trần Đức Tùng Approve: tải bản sao lưu từ link Drive, kích thước và SHA256 trùng tài liệu (kế hoạch ghi Trương Thanh Vui review) | Trần Đức Tùng | 24/11 |
| [PR87] | Trần Đức Tùng | Trương Thanh Vui Approve: đúng nhiệm vụ phân công, không thấy lỗi quan trọng | Trương Thanh Vui | 24/11 |
| [PR88] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve | Nguyễn Thanh Tùng | 25/11 |
| [PR89] | Nguyễn Thanh Tùng | Trần Đức Tùng Approve: lịch tháng dùng chung `classOnDate`, CI xanh, kiểm thử trên máy đạt | Trần Đức Tùng | 25/11 |
| [PR90] | Nguyễn Thanh Tùng | Trương Thanh Vui Approve | Trương Thanh Vui | 26/11 |
| [PR91] | Trần Đức Tùng | Trương Thanh Vui Approve | Trương Thanh Vui | 26/11 |
| [PR92] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve | Nguyễn Thanh Tùng | 26/11 |
| [PR93] | Trương Thanh Vui | Trần Đức Tùng Approve: liên kết, ảnh, phản hồi máy chủ ổn, hash `.sha256` khớp tệp kiểm chứng | Trần Đức Tùng | 26/11 |
| [PR94] | Trần Đức Tùng | Trương Thanh Vui Approve | Trương Thanh Vui | 26/11 |
| [PR95] | Trương Thanh Vui | Trần Đức Tùng Approve: chạy lại kiểm thử trên nhánh (`test:logic` 202/202, `test_seed_semester` đạt), không thấy lỗi logic hay rủi ro dữ liệu | Trần Đức Tùng | 27/11 |
| [PR96] | Trần Đức Tùng | Trương Thanh Vui Approve: các sơ đồ khớp với tình hình phát triển của nhóm (kế hoạch ghi Nguyễn Thanh Tùng review) | Trương Thanh Vui | 27/11 |
| [PR97] | Trần Đức Tùng | Trương Thanh Vui Approve: chỉ cập nhật tệp MD, không ảnh hưởng mã và logic (kế hoạch ghi Nguyễn Thanh Tùng review) | Trương Thanh Vui | 27/11 |

### C. Link GitHub

- [PR61] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/61
- [PR78] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/78
- [PR79] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/79
- [PR80] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/80
- [PR81] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/81
- [PR82] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/82
- [PR83] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/83
- [PR84] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/84
- [PR85] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/85
- [PR86] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/86
- [PR87] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/87
- [PR88] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/88
- [PR89] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/89
- [PR90] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/90
- [PR91] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/91
- [PR92] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/92
- [PR93] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/93
- [PR94] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/94
- [PR95] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/95
- [PR96] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/96
- [PR97] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/97
- [D3] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/03-giu-bo-sua-them.md
- [D05] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/05-trac-nghiem-tach-dap-an-cham-diem-may-chu.md

[PR61]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/61
[PR78]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/78
[PR79]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/79
[PR80]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/80
[PR81]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/81
[PR82]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/82
[PR83]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/83
[PR84]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/84
[PR85]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/85
[PR86]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/86
[PR87]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/87
[PR88]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/88
[PR89]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/89
[PR90]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/90
[PR91]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/91
[PR92]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/92
[PR93]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/93
[PR94]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/94
[PR95]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/95
[PR96]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/96
[PR97]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/97
[D3]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/03-giu-bo-sua-them.md
[D05]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/05-trac-nghiem-tach-dap-an-cham-diem-may-chu.md
[báo cáo 01]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/van-hanh/01-bao-cao-suc-khoe-may-chu.md
