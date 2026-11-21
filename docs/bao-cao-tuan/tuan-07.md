# Báo cáo tuần 7

**Đề tài:** Xây dựng website quản lý deadline học tập cho sinh viên (sản phẩm: StudyTask)  
**GVHD:** TS. Huỳnh Xuân Phụng  
**Nhóm:**  
- Nguyễn Thanh Tùng (24TX810027)  
- Trần Đức Tùng (24TX810026)  
- Trương Thanh Vui (24TX810021)  

**Thời gian:** 16/11 – 21/11/2026  
**Repo GitHub (public):** https://github.com/NguyenThanhTung301020/Nhom-5_Studytask  

---

## Phần 1. Tóm tắt tuần 7

Tuần 7 tập trung vào việc 1 của kế hoạch: đưa máy chủ về đúng `master` rồi mới thử các bản sửa trên web thật. Máy chủ đã được đối chiếu với `master`, script kiểm chứng ra **ĐẠT**: `studytask_api.py` và 54/54 tệp giao diện trùng `master` `56c0bb4` ([PR65]). Sau đó nhóm thử V3, V4, luồng email và [PR56] trên web thật ([PR64], [PR67], [PR72]), sửa các lỗi phát hiện được ([PR67], [PR68], [PR72], [PR73]) và hoàn tất [D05] ([PR69]). Kết quả việc 1 chưa giữ được đến cuối tuần: máy chủ được cài nhánh thư viện sách trước khi gộp nên lại lệch `master`, và chưa triển khai lại từ `master` mới nhất.

- **Nguyễn Thanh Tùng:** phụ trách việc 1: đối chiếu hash giao diện từ Internet, viết script kiểm chứng máy chủ, rà và hoàn thiện biên bản 14 ([PR65]); phần thao tác trên máy chủ do Trương Thanh Vui làm vì Thanh Tùng không vào được máy chủ. Mã hóa bản sao lưu ngoài bằng 7-Zip AES-256 ([PR62]); thử V4 và email trên web thật, sửa 2 lỗi phát hiện (P1: nhật ký đầy mất hoạt động mới; P2: Quản lý lớp học đếm sai) ([PR67]); Bảng điểm và Báo cáo lớp báo lỗi thay vì lặng lẽ dùng điểm nhật ký khi không tải được `quizResults` ([PR68]); thử [PR56] trên web thật, sửa lỗi lưu dữ liệu chung bị từ chối mà giao diện không báo (L1) ([PR72]); `unlink_email` hoàn tác trọn khi lỗi ở mọi bước ([PR73]).
- **Trương Thanh Vui:** làm phần trên máy chủ của việc 1: đối chiếu hash, chạy script kiểm chứng, dời tệp thừa (lần 1 CHƯA ĐẠT, lần 2 ĐẠT) ([PR65]); Bảng điểm đọc điểm từ `quizResults` (việc 7) và `unlink_email` hoàn tác khi lỗi (việc 12), phần đầu ([PR58]); đối chiếu máy chủ, cập nhật gói, điều tra 403 ([PR59]); chạy `smartctl -t long` (dừng sớm, lỗi đọc tại LBA 705216) và quét chọn lọc (vùng lỗi dài ít nhất 2 sector), chép bản sao lưu ra ổ ngoài ([PR60]); đo sức khỏe máy chủ mốc T+15, điền [D-VH] mục 8.4 và kết luận 8.6 ([PR74]).
- **Trần Đức Tùng:** thử V3 trên web thật với 4 vai: 25 ca, 21 đạt, 2 lỗi giao diện, 1 chưa thử được, 1 ghi nhận ([PR64]); hoàn tất [D05] ([PR69]); làm các mục [D3] tuần 7 ([PR71]).

**Đổi người thực hiện so với kế hoạch:**
- Việc 1: kế hoạch giao Nguyễn Thanh Tùng; phần trên máy chủ do Trương Thanh Vui làm vì Thanh Tùng không vào được máy chủ.
- Việc 7 và việc 12: kế hoạch giao Nguyễn Thanh Tùng; Trương Thanh Vui làm phần đầu ([PR58]), Nguyễn Thanh Tùng làm tiếp ([PR68], [PR73]).

**Ngoài kế hoạch** (không tính vào khối lượng theo kế hoạch), Trương Thanh Vui làm: tiếp tục bộ dữ liệu lớp học theo khung đào tạo ([PR54], tuần 2 của đợt): học phần mở theo khóa, thời khóa biểu theo tuần và tiết, 1–3 giáo viên mỗi học phần, ảnh đại diện cho sinh viên ([PR61]); thi trực tuyến trên trang và chữ theo vai trò ([PR63]); kho sách điện tử 179 cuốn từ Internet Archive ([PR70]).

---

## Phần 2. Tự đánh giá của các thành viên

### 2.1. Nguyễn Thanh Tùng

**Việc làm được:**
- Việc 2, phần V4: thử trên web thật 10/10 ca đạt; phát hiện và sửa P1 (nhật ký đầy thì hoạt động mới bị bỏ mà không báo, sửa ở máy chủ) và P2 (Quản lý lớp học đếm cả hoạt động trỏ tới tài liệu, bài tập không có thật, sửa ở `pages/Reports.js`): `test_activities.py` 174/174, `test:logic` 127/127 ([PR67]).
- Việc 7, phần tiếp: thử 16 ca trên Bảng điểm và Báo cáo lớp, sửa 2 ca không đạt (lỗi tải `quizResults` thì báo lỗi, không hiện điểm nhật ký); thêm `test_quiz_results_nguon_diem.py` 13 ca ([PR68]).
- Việc 12, phần tiếp: `unlink_email` hoàn tác trọn khi lỗi ở mọi bước, kể cả COMMIT/ROLLBACK lỗi; gỡ khi chưa liên kết trả 409; `test_unlink_email.py` 50 ca (mã cũ hỏng 20 ca), thêm vào CI; tài liệu `docs/sua-loi/05` ([PR73]).
- Gộp [PR58], [PR63], [PR64], [PR69], [PR71].

**Việc đạt được một phần:**
- Việc 1: viết `deploy/kiem-chung-master.sh`, đo từ Internet 53/53 tệp giao diện trùng `master`, rà và hoàn thiện biên bản 14; script ra ĐẠT ([PR65]). **Chưa giữ được:** máy chủ lại lệch `master` sau lần cài nhánh thư viện sách, chưa triển khai lại.
- Việc 4: bản sao lưu đã mã hóa 7-Zip AES-256, mã hóa cả tên tệp, kiểm tra mở lại được, quyết định ghi ở biên bản 09 mục 3 ([PR62]). **Còn thiếu:** hai bản `.7z` nằm trên cùng một máy, chưa có bản ngoài thiết bị; chưa xác nhận ổ G của Trương Thanh Vui.
- Việc 2, phần email: 9 ca đạt, 1 ca (B5) đạt một phần; ca mã hết hạn (B10) lần đầu chỉ thử được qua API, lần sau thử lại hoàn toàn trên giao diện đạt ([PR67]).
- Việc 9: thử [PR56] trên web thật bằng tài khoản Đào tạo: R2, R3, R4, R6 đạt; R5 đạt phần tạo phiếu, chưa thử được phần Đào tạo sửa link (chưa có phiếu); sửa L1, G2, G3, `test:logic` 147/147 ([PR72]). **Giới hạn:** thử trên bản máy chủ đang chạy (chưa đúng `master`); L1, G2, G3 chưa kiểm lại trên web thật.

**Việc chưa làm:**
- Server chưa được cập nhật lại từ `master` `c0c71e1` (Trương Thanh Vui cập nhật đầu tuần 8).
- G4 (cuộn ngang ở khổ hẹp) chưa sửa.

### 2.2. Trần Đức Tùng

**Việc làm được:**
- Việc 8: hoàn tất [D05], mục 0 và mục 8 không còn câu hỏi mở; hạ cờ `correct` ở `SAMPLE_QUIZZES` trong `utils/constants.js`; `test:logic` 127/127 ([PR69]).
- Việc 10, [D3] mục 2: bỏ Máy tính bỏ túi (dùng `Function()`, V7), Dịch thuật, Giải trí khỏi trang Tiện ích; thêm 2 ca kiểm thử chặn `Function(`; `test:logic` 137/137, sau khi gộp `master` 142/142; thử tay trang Tiện ích đạt ([PR71]).
- Việc 10, [D3] mục 8, 10: đã làm sớm, ghi lại trong [D3] (trọng số do Phòng Đào tạo đặt; chat hỗ trợ trên máy chủ thay cho `supportTickets`, `test_account.py` 46/46) ([PR71]).
- Review và gộp [PR59], [PR60], [PR61], [PR65], [PR70], [PR73], [PR74]. Ở [PR61] nêu 2 điểm nhỏ chỉ Admin gây ra (lách giới hạn 3 giáo viên khi đổi vai trò; `subjectIds` sai kiểu trả 500); ở [PR70] nêu 33 sách chưa rõ giấy phép.

**Việc đạt được một phần:**
- Việc 2, phần V3: thử trên web thật với 4 vai (GV-A, GV-B, SV-1, SV-2), 25 ca theo [D05] mục 6: **21 đạt**; máy chủ chấm đúng, không lộ đáp án, chặn nộp lại, nộp đề đã đóng, nộp sai môn ([PR64]). **Còn thiếu:** 2 lỗi giao diện (ca 19: thẻ đề luôn hiện "0 lượt nộp"; ca 24: báo hết hạn sớm hơn máy chủ) chưa sửa; API-05 (từ chối bài nộp sau hạn) chưa thử được (ca 23); 1 điểm lệch RULE-09 (ca 25) mới ghi nhận.
- Việc 10 nói chung: mục 2, 8, 10 xong; mục 14 (nhập danh sách lớp từ CSV/Excel) dời sang tuần 8, lý do ghi trong [D3]. [PR71] đã gộp nhưng chưa có trên web thật, chờ triển khai lại từ `master`.

**Việc chưa làm:**
- Việc 13: chỉnh các sơ đồ [D3], [D05] còn thiếu hoặc sai chi tiết.
- Sửa 2 lỗi giao diện V3 (ca 19, 24).

**Ghi nhận sự cố khi gộp:** gộp [PR65] trước khi [PR64] của mình được gộp, do chưa để ý thứ tự. Định hoàn tác nên tạo [PR66] (Revert [PR65]), nhưng sợ làm hỏng `master` nên đóng [PR66] và xóa nhánh, không gộp. `master` không bị ảnh hưởng; [PR64] được gộp ngay sau đó.

### 2.3. Trương Thanh Vui

**Việc làm được:**
- Việc 14: tìm nguyên nhân 17 mã 403 (14 do một tab mất phiên, 3 do script kiểm thử); 403 ở `/uploads/` do quyền thư mục 750 (đã sửa) và dò quét `/uploads/.env`; ghi biên bản 12 ([PR59]).
- Việc 3, phần sao lưu: chép 12 bản sao lưu (8.362 tệp) ra ổ G, so SHA256 trùng hết, `integrity_check` 12/12, dựng API tạm từ bản sao lưu chạy được ([PR60]).
- Việc 6: đo sức khỏe máy chủ mốc T+15, điền [D-VH] mục 8.4 và kết luận 8.6; sao lưu và thử khôi phục đạt ([PR74]). Kết luận chung: chưa đủ điều kiện "ổn định ở mức đề tài" (2/5 đạt; chưa đạt: mã 500 do trình duyệt ngắt kết nối, RSS của API vượt ngưỡng; chưa đo: tỷ lệ truy cập từ ngoài).
- Gộp [PR62], [PR67], [PR68], [PR72]; gộp `master` vào nhánh [PR60], [PR61] khi Approve bị gỡ và vào nhánh [PR72] trước khi gộp.

**Việc đạt được một phần:**
- Việc 1, phần trên máy chủ: đối chiếu hash, bỏ quyền chạy 3 script cài đặt cũ, chạy script kiểm chứng, dời tệp thừa; lần 2 ĐẠT ([PR65]). 
- Việc 5: cập nhật gói hệ điều hành và khởi động lại có ghi thời điểm, nâng thêm 1 gói ([PR59], [PR60]). **Còn thiếu:** kết quả cần đạt "0 gói chờ" chưa đạt, còn 5 gói đang được Ubuntu phát hành theo đợt (không phải gói bảo mật).
- Việc 3, phần ổ cứng: chạy `smartctl -t long` (dừng sớm tại LBA 705216) và quét chọn lọc (vùng lỗi dài ít nhất 2 sector), ghi báo cáo 01, biên bản 09, báo cáo 13 ([PR60]). **Còn thiếu:** ảnh `smartctl -H -A` sau lần quét chọn lọc chưa lưu vào repo; nhóm chưa quyết định thay ổ.
- Việc 7 và việc 12, phần đầu: tuyến `GET /api/quiz/results`, Bảng điểm dùng điểm chính thức, sửa lỗi `ReferenceError` khi mở Bảng điểm; `unlink_email` `ROLLBACK` khi lỗi; `test:logic` 97/97 ([PR58]). **Còn thiếu:** khi không tải được `quizResults`, Bảng điểm lặng lẽ dùng điểm nhật ký; `unlink_email` còn để `BEGIN` ngoài `try`. Nguyễn Thanh Tùng sửa tiếp ở [PR68], [PR73].
- Ngoài kế hoạch, kho sách điện tử: 179 cuốn đã lên web ([PR70]). **Còn thiếu:** 33 sách chưa rõ giấy phép; PDF nằm ngoài CSDL nên chưa có bản sao lưu.

**Việc chưa làm:**
- Biên bản 08 mục 4 còn dòng chờ điền kết quả CI của [PR61].

---

## Phần 3. Phản hồi nhận xét của giảng viên

Thầy đánh giá cao việc nhóm khai thẳng các tồn tại (lỗi đọc ổ cứng tại LBA 705216, 17 lỗi 403 mới, bản sao lưu ngoài chưa mã hóa). Tuần 7 nhóm tiếp tục ghi cả phần chưa đạt, kể cả việc máy chủ lại lệch `master` (Phần 1; Phần 4, việc 1).

### 3.1. Tổng hợp

| Tồn tại | Thực tế tuần 7 | Minh chứng |
|---|---|---|
| Lỗi đọc ổ cứng tại LBA 705216 | **Đã theo dõi, chưa xử lý dứt điểm:** chạy `smartctl -t long`, dừng sớm đúng tại LBA 705216; quét chọn lọc từ 705217 cũng dừng ngay, nên vùng lỗi dài ít nhất 2 sector. Các chỉ số 5, 187, 188, 197, 198 không xấu thêm. Đã chép 12 bản sao lưu ra ổ ngoài (so SHA256 trùng hết). Nhóm chưa quyết định thay ổ | [PR60] |
| 17 lỗi 403 mới | **Đạt:** đã tìm ra nguyên nhân: 14 mã do một tab mất phiên, 3 mã do script kiểm thử; 403 ở `/uploads/` do quyền thư mục 750 (đã sửa) và dò quét `/uploads/.env` từ ngoài | [PR59] |
| Bản sao lưu ngoài chưa mã hóa | **Đạt một phần:** bản của Nguyễn Thanh Tùng đã mã hóa 7-Zip AES-256, mã hóa cả tên tệp, kiểm tra mở lại được; quyết định ghi ở biên bản 09 mục 3. Còn: hai bản `.7z` nằm trên cùng một máy. Ổ G của Trương Thanh Vui là ổ di động (box) nên không mã hóa, rút ra và cất sau mỗi lần chép (biên bản 09 mục 3) | [PR62], [PR60] |

### 3.2. Trả lời 3 câu hỏi của nhóm

| Ý kiến của thầy | Thực tế tuần 7 | Minh chứng |
|---|---|---|
| [PR54] là phần ngoài kế hoạch: ưu tiên việc bắt buộc trước, tuần sau còn dư lực thì tiếp tục | Trương Thanh Vui làm phần bắt buộc của mình trước (việc 3, 5, 6, 14 và phần máy chủ của việc 1; việc 5 còn 5 gói chờ do phát hành theo đợt) rồi tiếp tục phần ngoài kế hoạch, tách riêng và không tính vào khối lượng. **Tồn tại:** lần cài nhánh thư viện sách (ngoài kế hoạch) lên máy chủ trước khi gộp làm máy chủ lệch `master`, ảnh hưởng tới kết quả việc 1. Từ tuần 8, phần ngoài kế hoạch chỉ cài lên máy chủ sau khi đã gộp vào `master` | [PR59], [PR60], [PR61], [PR63], [PR70] |
| Cổng 80/443 mở tới máy Windows trong mạng nhà: đồng ý chỉ ghi nhận rủi ro, nhưng phải viết rõ trong tài liệu vận hành: mặt rủi ro, biện pháp hạn chế bằng Windows Firewall trên máy đó, và đánh giá lại ở đợt kiểm tra bảo mật | **Chưa làm:** biên bản `docs/van-hanh/08` mới ghi hiện trạng và rủi ro còn lại, chưa có mục biện pháp Windows Firewall và chưa có mốc đánh giá lại. Đưa vào kế hoạch tuần 8 | [PR48] |
| Kế hoạch tuần 7 có 15 việc là nhiều: đồng ý giảm, ưu tiên đồng bộ máy chủ với `master` và đối chiếu SHA256, thử V3/V4/email trên web thật, xử lý 403 và theo dõi ổ cứng; việc theo [D3] dời sang tuần 8 | **Đồng bộ máy chủ:** đạt ([PR65]) nhưng chưa giữ được đến cuối tuần (Phần 4, việc 1). **Thử trên web thật:** V3 25 ca, 21 đạt ([PR64]); V4 10/10 ca, email 9 ca đạt, sửa 2 lỗi phát hiện ([PR67]). **403 và ổ cứng:** xem bảng 3.1. **[D3]:** mục 14 (lớn nhất) dời sang tuần 8; mục 2 vẫn làm ở tuần 7 vì nhỏ và gỡ được `Function()` (V7), làm sau khi xong phần thử V3; mục 8, 10 chỉ ghi lại phần đã làm sớm ([PR71]). Việc 13 (chỉnh sơ đồ) chưa làm | [PR64], [PR65], [PR67], [PR71] |

---

## Phần 4. Đối chiếu với công việc trong kế hoạch tuần 7

### 4.1. Nhóm A: bắt buộc

| # | Việc | Người phụ trách | Tình trạng | Minh chứng |
|---|---|---|---|---|
| 1 | Triển khai lại từ `master`, so hash, xử lý script cài đặt cũ | Nguyễn Thanh Tùng (phần trên máy chủ: Trương Thanh Vui) | **Đạt một phần:** script kiểm chứng ĐẠT, máy chủ trùng hash `master` `56c0bb4`, có biên bản 14. Lần cài lấy từ nhánh [PR63] trước khi gộp chứ không lấy thẳng từ `master` (kết quả vẫn trùng hash). Sau đó máy chủ được cài nhánh thư viện sách chưa gộp nên lệch `master` lại, chưa triển khai lại | [PR65] |
| 2 | Thử V3, V4 và email trên web thật | Nguyễn Thanh Tùng (V4, email); Trần Đức Tùng (V3) | **Đạt một phần:** V4 10/10, sửa P1, P2; email 9 ca đạt, 1 đạt một phần; V3 25 ca, 21 đạt, 2 lỗi giao diện (ca 19, 24) chưa sửa, API-05 chưa thử được (ca 23) | [PR64], [PR67] |
| 3 | Ổ cứng: `smartctl -t long`; chép bản sao lưu mới ra ổ ngoài | Trương Thanh Vui | **Đạt:** có kết quả tự kiểm tra dài (dừng sớm) và quét chọn lọc; 12 bản sao lưu đã chép ra ổ G | [PR60] |
| 4 | Bảo vệ bản sao lưu ngoài | Nguyễn Thanh Tùng | **Đạt một phần:** bản `.7z` đã mã hóa, có quyết định ở biên bản 09 mục 3; hai bản `.7z` còn nằm trên cùng một máy. Ổ G là ổ di động (box) nên không mã hóa | [PR62], [PR60] |
| 5 | Cập nhật gói hệ điều hành (18 gói) và khởi động lại có kế hoạch | Trương Thanh Vui | **Đạt một phần:** đã cập nhật và khởi động lại có ghi thời điểm (biên bản 12 mục 3); nâng thêm 1 gói. Kết quả cần đạt "0 gói chờ" **chưa đạt**: còn 5 gói đang được Ubuntu phát hành theo đợt, không có gói bảo mật chờ | [PR59], [PR60] |
| 6 | Sức khỏe máy chủ T+15 và kết luận chung | Trương Thanh Vui | **Đạt:** [D-VH] mục 8.4, 8.6 đã điền. Kết luận chung chưa đủ điều kiện "ổn định ở mức đề tài" (2/5 đạt, 2 chưa đạt, 1 chưa đo); RSS của API 73 MB, vượt ngưỡng 60 MB | [PR74] |
| 7 | Bảng điểm và Báo cáo lớp đọc điểm từ `quizResults` | Nguyễn Thanh Tùng (phần đầu: Trương Thanh Vui); kế hoạch ghi Trần Đức Tùng review, thực tế Nguyễn Thanh Tùng Approve [PR58], Trương Thanh Vui Approve [PR68] | **Đạt:** hai màn hình dùng nguồn điểm chính thức, báo lỗi khi không tải được; có ca kiểm thử | [PR58], [PR68] |
| 8 | Hoàn tất [D05]; hạ cờ `correct` ở dữ liệu mẫu | Trần Đức Tùng; kế hoạch ghi Trương Thanh Vui review, thực tế Nguyễn Thanh Tùng Approve và gộp | **Đạt:** [D05] không còn câu hỏi mở | [PR69] |
| 9 | Thử [PR56] (R2–R7) trên web thật | Nguyễn Thanh Tùng | **Đạt một phần:** R2, R3, R4, R6 đạt; R5 đạt một phần; sửa L1, G2, G3. Thử trên bản đang chạy, chưa trên `master` | [PR72] |
| 10 | Việc theo [D3] tuần 7 (mục 2, 8, 10, 14) | Trần Đức Tùng | **Đạt:** mục 2 có PR và ca kiểm thử; mục 8, 10 ghi phần đã làm sớm; mục 14 ghi lý do dời sang tuần 8 | [PR71] |
| 11 | Nhật ký AI và báo cáo tuần 7 | Cả nhóm | **Đang hoàn tất:** mỗi người tự viết phần của mình, Nguyễn Thanh Tùng gộp; `docs/ai-log/tuan-07.md` chưa đưa lên repo | Báo cáo này |

### 4.2. Nhóm B

| # | Việc | Người phụ trách | Tình trạng | Minh chứng |
|---|---|---|---|---|
| 12 | `unlink_email` hoàn tác giao dịch khi lỗi; tài liệu cho [PR50] | Nguyễn Thanh Tùng (phần đầu: Trương Thanh Vui) | **Đạt:** 50 ca kiểm thử, có trong CI; tài liệu `docs/sua-loi/05` | [PR58], [PR73] |
| 13 | Chỉnh các sơ đồ [D3], [D05] | Trần Đức Tùng | **Chưa làm** | – |
| 14 | Điều tra 17 mã 403 | Trương Thanh Vui | **Đạt:** có nguyên nhân và phần đã sửa | [PR59] |
| 15 | Vite + JSX + ESLint: chốt tuần thực hiện | Cả nhóm | **Chưa chốt** | – |

### 4.3. Việc không thuộc kế hoạch tuần 7

| Việc | Người làm | Tình trạng |
|---|---|---|
| Tiếp tục bộ dữ liệu lớp học theo khung đào tạo ([PR54], tuần 2 của đợt): học phần mở theo khóa, thời khóa biểu theo tuần và tiết, 1–3 giáo viên mỗi học phần, ảnh đại diện sinh viên | Trương Thanh Vui | Đã gộp [PR61] |
| Thi trực tuyến trên trang, chữ theo vai trò | Trương Thanh Vui | Đã gộp [PR63] |
| Kho sách điện tử 179 cuốn từ Internet Archive | Trương Thanh Vui | Đã gộp [PR70]; còn 33 sách chưa rõ giấy phép |

---

## Phần 5. Kế hoạch tuần 8 (23/11 – 28/11/2026)

Kế hoạch lấy từ mọi việc còn tồn ở Phần 2 ("Việc đạt được một phần", "Việc chưa làm"), Phần 3 (ý kiến của thầy), Phần 4 (việc chưa đạt) và cột "Tuần" của [D3]. Người phụ trách giữ theo người đã làm việc đó ở tuần 7; việc mới chia cho thành viên còn ít việc.

**Thứ tự:** việc 1 làm từ đầu tuần; việc 2, 3, 4 chỉ làm sau khi Trương Thanh Vui đã cập nhật lại server. Các việc làm định kỳ (cập nhật server, sức khỏe máy chủ, ổ cứng) không đưa vào kế hoạch mà làm theo bảng quy ước ở cuối phần này. **Quy tắc mới:** chỉ cài lên máy chủ mã đã gộp vào `master`, kể cả phần ngoài kế hoạch. **Review:** mỗi PR do đúng người được ghi trong cột "Người phụ trách" review; đổi người review thì ghi lại trong báo cáo.

**Nhóm A: bắt buộc**

| # | Công việc | Người phụ trách | Kết quả cần đạt |
|---|---|---|---|
| 1 | Cập nhật GitHub vào server (làm từ đầu tuần) | Trương Thanh Vui | Trương Thanh Vui báo nhóm đã cập nhật xong; không cần PR hay biên bản |
| 2 | Kiểm lại trên web thật: L1, G2, G3; R5 phần Đào tạo sửa link (cần một tài khoản sinh viên thử nộp phiếu). Chỉ thực hiện sau khi Trương Thanh Vui đã cập nhật lại server (việc 1) | Nguyễn Thanh Tùng | Kết quả thử tay trên server đã cập nhật, ghi trong `docs/kiem-thu/` |
| 3 | Sửa 2 lỗi giao diện V3: thẻ đề luôn hiện "0 lượt nộp" (ca 19); báo hết hạn sớm hơn máy chủ, so sánh `dueDate` theo giờ Việt Nam như máy chủ (ca 24); thử API-05 trên web thật (ca 23) | Trần Đức Tùng (Nguyễn Thanh Tùng review) | PR có ca kiểm thử; ca 19, 23, 24 đạt trên web thật sau việc 1 |
| 4 | Cổng 80/443 mở tới máy Windows trong mạng nhà: viết vào `docs/van-hanh/08` mặt rủi ro, biện pháp hạn chế bằng Windows Firewall trên máy đó, mốc đánh giá lại ở đợt kiểm tra bảo mật. Chỉ thực hiện sau khi Trương Thanh Vui đã cập nhật lại server (việc 1) | Trần Đức Tùng (Nguyễn Thanh Tùng review) | Biên bản 08 có đủ 3 mục thầy yêu cầu; kết quả ghi vào phần rủi ro |
| 5 | Bản sao lưu ngoài: tải bản `.7z` đã mã hóa lên nơi lưu trữ ngoài (vd Google Drive), ghi link vào một tệp văn bản trong repo | Nguyễn Thanh Tùng (Trương Thanh Vui review) | Repo có tệp văn bản ghi link tới bản `.7z` đã mã hóa |
| 6 | Kho sách: xử lý 33 sách chưa rõ giấy phép (gỡ hoặc chỉ để liên kết sang Archive.org); có cách sao lưu PDF nằm ngoài CSDL | Trương Thanh Vui (Trần Đức Tùng review) | Không còn sách chưa rõ giấy phép trên web; bản sao lưu có PDF hoặc ghi rõ cách khôi phục |
| 7 | [D3] mục 14: nhập danh sách lớp từ CSV/Excel (dời từ tuần 7, theo ý kiến của thầy); chốt trước người được nhập và định dạng tệp | Trần Đức Tùng (Trương Thanh Vui review) | PR có ca kiểm thử, hoặc ghi lý do dời |
| 8 | [D3] mục 15 (nộp tệp trực tiếp), mục 16 (xem lịch theo tháng): rà hiện trạng trước vì đã có `/api/upload` và `pages/MonthCalendar.js` | Nguyễn Thanh Tùng (Trần Đức Tùng review) | Mỗi mục ghi đã làm sớm (kèm minh chứng), hoặc có PR và ca kiểm thử, hoặc ghi lý do dời |
| 9 | Nhật ký AI và báo cáo tuần 8: mỗi người tự viết phần của mình, kèm link commit | Cả nhóm | `docs/ai-log/tuan-08.md`; báo cáo có link commit, PR, tệp |

**Nhóm B: làm khi nhóm A đúng tiến độ**

| # | Công việc | Người phụ trách | Kết quả cần đạt |
|---|---|---|---|
| 10 | Chỉnh các sơ đồ [D3], [D05] còn thiếu hoặc sai chi tiết (việc 13 tuần 7); cập nhật ghi chú [D05] "Việc 8 (V4) còn lại" vì Bảng điểm và Báo cáo lớp đã đọc `quizResults` | Trần Đức Tùng (Nguyễn Thanh Tùng review) | Sơ đồ và [D05] khớp hệ thống đang chạy |
| 11 | Cập nhật gói: kiểm tra lại 5 gói phát hành theo đợt, nâng khi đã phát hành đủ | Trương Thanh Vui | 0 gói chờ; ghi vào biên bản |
| 12 | G4: trang bị cuộn ngang ở khổ hẹp | Nguyễn Thanh Tùng | PR, thử ở khổ điện thoại |
| 13 | Biên bản 08 mục 4: điền kết quả CI của [PR61] | Trương Thanh Vui | Không còn dòng chờ điền |
| 14 | Vite + JSX + ESLint ([D3] mục 9): chốt tuần thực hiện (việc 15 tuần 7) | Cả nhóm chốt | Ghi tuần cụ thể vào kế hoạch |

**Phân công theo thành viên:**

| Thành viên | Nhóm A | Nhóm B |
|---|---|---|
| Nguyễn Thanh Tùng | 2, 5, 8, 9 (gộp) | 12 |
| Trần Đức Tùng | 3, 4, 7 | 10 |
| Trương Thanh Vui | 1, 6 | 11, 13 |

**Bảng quy ước việc định kỳ (áp dụng từ tuần 8):** các việc dưới đây làm song song với kế hoạch tuần, không tính là việc trong kế hoạch và không cần cập nhật lên GitHub mỗi lần làm. Nhóm làm theo nhịp 2 tuần một lần, có thể ngắt quãng.

| # | Việc định kỳ | Người làm | Tần suất | Đưa vào báo cáo tuần khi |
|---|---|---|---|---|
| Q1 | Kiểm tra sức khỏe máy chủ | Trương Thanh Vui | 2 tuần một lần | Có kết quả của đợt kiểm tra |
| Q2 | Cập nhật server khớp với GitHub (`master` mới nhất) | Trương Thanh Vui | Thứ 6 và thứ 7 | Chỉ khi có kết quả cuối cùng |
| Q3 | Kiểm tra sức khỏe ổ cứng | Trương Thanh Vui | Định kỳ | Chỉ khi phát hiện lỗi nặng |

**Việc có mốc sau tuần 8 (ghi để không quên):**
- Kiểm tra project Firebase đã bị xóa hẳn sau hạn khôi phục 11/12/2026 (Nguyễn Thanh Tùng).

**Xin ý kiến giảng viên:**
1. Do nguồn lực của nhóm có hạn và số lượng công việc nhiều, phần việc ngoài kế hoạch làm song song chưa đạt như kỳ vọng. Nhóm xin thầy cho gia hạn đợt làm phần ngoài kế hoạch từ 3 tuần lên 5 tuần. Trong thời gian gia hạn, nhóm ưu tiên các việc trong kế hoạch; phần ngoài kế hoạch sắp xếp theo thứ tự: sửa lỗi trước, sau đó kiểm thử; không mở thêm chức năng mới và không cập nhật thêm giao diện, hình ảnh. Thầy có đồng ý với cách sắp xếp này không?
2. Mốc T+15 cho thấy máy chủ chạy ổn (không sập, không mất dữ liệu, sao lưu và thử khôi phục đạt) nhưng mới đạt 2/5 điều kiện: còn mã 500 khi trình duyệt ngắt kết nối, RSS của API vượt ngưỡng và chưa có giám sát truy cập từ ngoài ([PR74]). Nhóm đề xuất sửa lỗi mã 500, theo dõi RSS sau lần cập nhật server, rồi đo lại ở mốc T+30 thay vì kết luận ngay ở T+15. Thầy có đồng ý không ?
3. [D3] mục 14 (nhập danh sách lớp từ tệp CSV/Excel) dời sang tuần 8 vì nhóm chưa chốt ai được nhập danh sách: Admin/Phòng Đào tạo hay giáo viên. Nhóm đề xuất chỉ Admin và Phòng Đào tạo được nhập, giáo viên chỉ xem danh sách lớp mình dạy, để tránh tạo trùng hoặc sai tài khoản sinh viên. Thầy có đồng ý với cách phân quyền này không?
4. Do có nhiều việc nhóm nhận thấy vẫn làm bình thường nhưng không cần phải làm báo cáo và kiểm tra liên tục nên nhóm quyết định đưa vào quy ước vậy không có hợp lý không ?

---

## Phần 6. Khai báo công cụ AI

Trong tuần 7, nhóm sử dụng Claude Code (Anthropic): Claude Opus 5.5 (cả ba thành viên) và Claude Sonnet 5.5 (Trương Thanh Vui phần lớn các phiên; Nguyễn Thanh Tùng một số phiên), cho các việc sau:
- script kiểm chứng máy chủ, biên bản triển khai, đối chiếu hash, điều tra 403, cập nhật gói, theo dõi ổ cứng, sao lưu và mã hóa bản sao lưu;
- hướng dẫn và khung biên bản kiểm thử V3; thử V4, email và [PR56] trên web thật; sửa các lỗi phát hiện và viết kiểm thử tương ứng;
- hướng dẫn hoàn tất [D05] và các mục [D3] tuần 7;
- phần ngoài kế hoạch của Trương Thanh Vui.

Chi tiết từng việc, phần sinh viên tự kiểm tra và các sai sót của AI được ghi trong `docs/ai-log/tuan-07.md`. Commit lệch quy ước nhãn: `e79a346` ([PR69]) có `Co-Authored-By` nhưng thiếu `[AI]`; `08fc5a3` ([PR71]) có `[AI]` nhưng thiếu `Co-Authored-By`; một số commit gộp do AI chạy lệnh không có `Co-Authored-By` hoặc `[AI]`. Các commit đã gộp nên nhóm ghi nhận tại đây, không sửa lịch sử.

---

## Phụ lục

### Phụ lục A. Commit trong tuần 7

| Commit | Người commit | Ngày | Nội dung | PR |
|---|---|---|---|---|
| `ce2d679` | Nguyễn Thanh Tùng | 14/11 | Nhật ký AI và báo cáo tuần 6 | [PR57] |
| `25bc2bc` | Trương Thanh Vui | 16/11 | Việc 7, 12 (phần đầu): Bảng điểm đọc `quizResults`, `unlink_email` hoàn tác khi lỗi | [PR58] |
| `f16fe99` | Trương Thanh Vui | 17/11 | Việc 1, 5, 14: biên bản đối chiếu máy chủ 17/11, cập nhật gói, điều tra 403 | [PR59] |
| `9d72e0d`, `4f34bd3`, `4ade3ea`, `704479a`, `692f1bb` | Trương Thanh Vui | 17/11 | Việc 3, 5: chép sao lưu ra ổ G, cập nhật gói, `smartctl -t long`, quét chọn lọc, báo cáo máy chủ | [PR60] |
| `ab39fbe` | Trương Thanh Vui | 17/11 | Gộp `master` vào nhánh (Approve bị gỡ do merge-base đổi) | [PR60] |
| `ac4677a`, `e6590a3`, `0454524`, `68e0d47` | Trương Thanh Vui | 17/11 | Ngoài kế hoạch: 1–3 giáo viên mỗi học phần, học phần mở theo khóa, thời khóa biểu, ảnh đại diện, biên bản | [PR61] |
| `57d49a3`, `62a1f77` | Trương Thanh Vui | 17/11 | Xóa tệp đoạn dán báo cáo; gộp `master` vào nhánh | [PR61] |
| `bc30a8d`, `620f49d` | Nguyễn Thanh Tùng | 17/11 | Việc 4: quyết định mã hóa bản sao lưu ngoài (biên bản 09); gộp `master` | [PR62] |
| `2d702f4`, `643aea8`, `a5b1546`, `c78682d` | Trương Thanh Vui | 18/11 | Ngoài kế hoạch: thi trực tuyến trên trang, chữ theo vai trò, biên bản triển khai 18/11 | [PR63] |
| `44d95da` | Trần Đức Tùng | 18/11 | Việc 2: báo cáo kiểm thử V3 trên web thật | [PR64] |
| `b63ec00`, `76afa58`, `b4773b7` | Nguyễn Thanh Tùng | 18/11 | Việc 1: biên bản 14, script kiểm chứng máy chủ, kết quả ĐẠT | [PR65] |
| `85de5d0` | Trần Đức Tùng | 18/11 | Revert [PR65] (PR đã đóng, không gộp) | [PR66] |
| `226c761`, `f248fbe`, `c6ed7f8`, `d127495` | Nguyễn Thanh Tùng | 19/11 | Việc 2: sửa P1, P2, báo cáo kiểm thử V4 và email trên web thật; gộp `master` | [PR67] |
| `7e77487` | Nguyễn Thanh Tùng | 19/11 | Việc 7: Bảng điểm, Báo cáo lớp báo lỗi khi không tải được `quizResults` | [PR68] |
| `e79a346` | Trần Đức Tùng | 19/11 | Việc 8: hoàn tất [D05], hạ cờ `correct` ở dữ liệu mẫu | [PR69] |
| `46acd43`, `7aef50f`, `d9492f1`, `34da97f`, `bb03af2`, `221a3fc` | Trương Thanh Vui | 19/11 | Ngoài kế hoạch: kho sách điện tử từ Internet Archive (179 cuốn) | [PR70] |
| `08fc5a3`, `0575943` | Trần Đức Tùng | 19/11 | Việc 10: bỏ 3 tiện ích, ghi [D3] mục 2, 8, 10, 14; gộp `master`, giải xung đột | [PR71] |
| `1269ea4`, `37c5dc7`, `e4f096f`, `0c52154`, `0738633` | Nguyễn Thanh Tùng | 19/11 | Việc 9: sửa L1, G2, G3, báo cáo thử [PR56] trên web thật; gộp `master` | [PR72] |
| `34299a1` | Trương Thanh Vui | 19/11 | Gộp `master` vào nhánh [PR72] | [PR72] |
| `fbfa11e` | Nguyễn Thanh Tùng | 19/11 | Việc 12: `unlink_email` hoàn tác trọn khi lỗi, `test_unlink_email.py` | [PR73] |
| `fc062bc` | Trương Thanh Vui | 20/11 | Việc 6: đo sức khỏe máy chủ mốc T+15, điền [D-VH] mục 8.4 và kết luận 8.6 | [PR74] |

### Phụ lục B. Review và gộp PR (giờ Việt Nam)

| PR | Người mở | Review | Người gộp | Lúc gộp |
|---|---|---|---|---|
| [PR57] | Nguyễn Thanh Tùng | Trần Đức Tùng Approve: nội dung khớp bản nhóm đã chốt, CI đạt | Trần Đức Tùng | 14/11 16:55 |
| [PR58] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve: đã review tuyến `GET /api/quiz/results` (phân quyền theo môn và lớp học phần, không trả câu trả lời), sửa `unlink_email` | Nguyễn Thanh Tùng | 16/11 12:14 |
| [PR59] | Trương Thanh Vui | Trần Đức Tùng Approve: đối chiếu hash các tệp và số liệu trong biên bản với repo, đều khớp | Trần Đức Tùng | 17/11 16:41 |
| [PR60] | Trương Thanh Vui | Trần Đức Tùng Approve: số liệu biên bản khớp hash `68e0d47`, ảnh SMART và kế hoạch tuần 7. Approve bị gỡ 5 lần do `master` tiến lên; Approve lại sau khi gộp `master` vào nhánh (`ab39fbe`) | Trần Đức Tùng | 17/11 22:05 |
| [PR61] | Trương Thanh Vui | Trần Đức Tùng Approve: chạy lại kiểm thử máy chủ và `test:logic` trên nhánh đều đạt; nêu 2 điểm nhỏ chỉ Admin gây ra | Trần Đức Tùng | 18/11 08:22 |
| [PR62] | Nguyễn Thanh Tùng | Trương Thanh Vui Approve: biên bản khớp tình hình nhóm, ghi chú về thời điểm rút ổ cứng | Trương Thanh Vui | 18/11 15:54 |
| [PR63] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve: đã review luồng thi trực tuyến (ẩn câu hỏi, mã truy cập, khóa phiên, khung giờ, chặn nộp khi chưa vào phòng) | Nguyễn Thanh Tùng | 18/11 18:49 |
| [PR64] | Trần Đức Tùng | Nguyễn Thanh Tùng Approve: chỉ thêm báo cáo kiểm thử V3 (25 ca), không đổi mã | Nguyễn Thanh Tùng | 18/11 22:58 |
| [PR65] | Nguyễn Thanh Tùng | Trần Đức Tùng Approve: hash API và tệp kết quả trùng `56c0bb4`; script chỉ đọc, không ảnh hưởng máy chủ | Trần Đức Tùng | 18/11 22:37 |
| [PR66] | Trần Đức Tùng | Không review; PR Revert [PR65], đã đóng, không gộp | – | – |
| [PR67] | Nguyễn Thanh Tùng | Trương Thanh Vui Approve: hình ảnh minh chứng khớp tài liệu | Trương Thanh Vui | 19/11 11:25 |
| [PR68] | Nguyễn Thanh Tùng | Trương Thanh Vui Approve: xác nhận cập nhật theo phân công, còn vấn đề quyền truy cập máy chủ, nhóm họp thống nhất sau (kế hoạch ghi Trần Đức Tùng review) | Trương Thanh Vui | 19/11 14:22 |
| [PR69] | Trần Đức Tùng | Nguyễn Thanh Tùng Approve: chốt [D05], gỡ `correct` khỏi `SAMPLE_QUIZZES`, không ảnh hưởng luồng máy chủ (kế hoạch ghi Trương Thanh Vui review) | Nguyễn Thanh Tùng | 19/11 14:58 |
| [PR70] | Trương Thanh Vui | Trần Đức Tùng Approve; nêu 33 sách chưa rõ giấy phép | Trần Đức Tùng | 19/11 16:39 |
| [PR71] | Trần Đức Tùng | Nguyễn Thanh Tùng Approve: đã bỏ 3 tiện ích (hết `Function()`), cập nhật [D3], thêm test; không ảnh hưởng nghiệp vụ lõi | Nguyễn Thanh Tùng | 19/11 18:56 |
| [PR72] | Nguyễn Thanh Tùng | Trương Thanh Vui Approve, tự gỡ khi gộp `master` vào nhánh (`34299a1`), Approve lại: minh chứng đúng quy ước kiểm thử | Trương Thanh Vui | 19/11 19:11 |
| [PR73] | Nguyễn Thanh Tùng | Trần Đức Tùng Approve: `test_unlink_email` 50/50, `test_email_codes` 37/37 đạt; hoàn tác trọn khi lỗi, không lộ chi tiết SQL | Trần Đức Tùng | 19/11 20:32 |
| [PR74] | Trương Thanh Vui | Trần Đức Tùng Approve: đối chiếu số liệu T+15 với minh chứng, SHA256 khớp, kết luận 8.6 đúng | Trần Đức Tùng | 20/11 16:29 |

### Phụ lục C. Danh sách link GitHub

**Pull Request**

- [PR48] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/48
- [PR54] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/54
- [PR56] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/56
- [PR57] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/57
- [PR58] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/58
- [PR59] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/59
- [PR60] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/60
- [PR61] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/61
- [PR62] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/62
- [PR63] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/63
- [PR64] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/64
- [PR65] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/65
- [PR66] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/66
- [PR67] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/67
- [PR68] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/68
- [PR69] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/69
- [PR70] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/70
- [PR71] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/71
- [PR72] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/72
- [PR73] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/73
- [PR74] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/74

**Tài liệu**

- [D3] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/03-giu-bo-sua-them.md
- [D05] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/05-trac-nghiem-tach-dap-an-cham-diem-may-chu.md
- [D-VH] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/van-hanh/01-bao-cao-suc-khoe-may-chu.md

