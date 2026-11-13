# 03. Các vấn đề logic phát sinh khi đẩy dữ liệu thật theo lớp của một chuyên ngành
> **NGOÀI KẾ HOẠCH CỦA NHÓM.** Phần việc này do Trương Thanh Vui làm riêng trong 3 tuần, không thuộc kế hoạch tuần 5, tuần 6 và không tính vào khối lượng các việc theo kế hoạch của nhóm. Đọc để hiểu một phần việc riêng, không dùng để đánh giá tiến độ kế hoạch.

## 1. Vì sao dữ liệu thật làm lộ lỗi

Trước khi nạp, hệ thống chỉ có vài tài khoản mẫu: mỗi môn một giáo viên, mỗi vai trò một người. Khi nạp **80 lớp, khoảng 2.000 sinh viên, 71 giáo viên, 760 buổi học mỗi tuần** theo đúng khung của một chuyên ngành, những giả định ngầm của mã bị phá:

| Giả định cũ | Thực tế khi có dữ liệu lớp |
|---|---|
| Một môn do một giáo viên dạy | Một môn mở ở nhiều lớp, do nhiều giáo viên, mỗi người dạy một số lớp |
| Lọc theo môn là đủ để biết ai được xem gì | Cùng môn nhưng khác lớp thì **không được** xem dữ liệu của nhau |
| Sinh viên có "kỳ số mấy" | Sinh viên thuộc một **khóa**, học theo **năm học và học kỳ 1/2** |
| Có thể ghi cả tài liệu dùng chung | Tài liệu dùng chung lớn dần, giáo viên ghi ngược cả danh sách |
| Máy chủ rảnh | Hàng nghìn tài khoản làm lộ điểm nghẽn về băm mật khẩu và danh sách người dùng |

Dưới đây là các vấn đề cụ thể. Cột "Trạng thái" nói thẳng việc nào đã sửa, việc nào mới chỉ ghi nhận.

## 2. Nhóm A: logic phân quyền theo lớp, môn, học kỳ

| Mã | Hiện tượng | Nguyên nhân gốc | Cách xử lý | Minh chứng | Trạng thái |
|---|---|---|---|---|---|
| **V-01** | Giáo viên A (dạy môn M ở lớp a1, b1) đọc được nhật ký hoạt động và kết quả trắc nghiệm của sinh viên lớp c1 (cùng môn M nhưng do giáo viên B dạy) | Chỉ lọc theo `subjectIds`; "lớp học phần" (lớp + môn) chưa tồn tại như một khái niệm | Thêm `sections: [{classId, subjectId}]` vào hồ sơ giáo viên và `classId` vào hồ sơ sinh viên, lịch học, lịch thi. Máy chủ lọc bằng `teacher_sections()` khi trả nhật ký, kết quả trắc nghiệm | `tests/server/test_class_scope.py` (20 kiểm tra); `docs/van-hanh/10-…` mục 8 | Đã làm và chạy thật 12/11; **chưa vào `master`** (V-14) |
| **V-02** | Sinh viên lớp a1 thấy lịch học và lịch thi của lớp b1 vì cùng học môn M | Lịch lọc theo môn, không theo lớp | Máy chủ giữ lại mục thuộc lớp của sinh viên và mục chung (không có `classId`) | `test_class_scope.py`: lịch lớp a1 chỉ gồm lịch lớp a1 và mục chung | Như V-01 |
| **V-03** | Giáo viên A sửa, thêm hoặc xóa được lịch của lớp c1 (lớp giáo viên B) dù cùng môn, do giao diện ghi ngược cả danh sách lịch | Quyền ghi kiểm tra theo môn, không theo lớp học phần | `foreign_item()` coi mục thuộc lớp học phần khác là "của người khác": sửa, thêm, xóa đều bị 403; Admin vẫn sửa được mọi lớp | `test_class_scope.py` (7 kiểm tra về ghi lịch) | Như V-01 |
| **V-04** | Giáo viên sửa danh sách môn thì xóa mất dữ liệu của môn khác (phát hiện khi review PR9, điểm R1) | Giao diện chỉ thấy danh sách đã lọc rồi ghi ngược cả danh sách | Sửa để phần không thuộc quyền giáo viên được giữ nguyên | Commit `903d4ed` "giáo viên sửa môn không còn xóa dữ liệu môn khác (R1 review PR9)" | **Đã sửa, đã vào `master`** |
| **V-05** | Hồ sơ cũ (không có `classId`, `sections`) bị chặn hoặc hiện sai khi quy tắc lớp được áp | Quy tắc mới giả định mọi hồ sơ có lớp | Hồ sơ không có `classId`/`sections` giữ hành vi cũ (lọc theo môn); `--upgrade-assignments` nâng cấp phân công cho dữ liệu đã nạp bản cũ mà không đổi tài khoản hay mật khẩu | `test_class_scope.py` (sinh viên và giáo viên hồ sơ cũ); `test_seed_curriculum.py` (nâng cấp chạy hai lần không đổi gì) | Đã làm |
| **V-06** | Bản nạp đầu chia sinh viên thành 8 "kỳ" mỗi kỳ một khóa riêng, không giống cách trường lưu sinh viên | Mô hình lấy trực tiếp "học kỳ của khung" làm thuộc tính của sinh viên | Lưu khóa + năm học + học kỳ 1/2; năm thứ và vị trí trong khung được suy ra (xem 02) | `test_seed_curriculum.py`; `tests/logic.test.mjs` (hàm `studyYear`, `khungPosition`, `termLabel`) | Đã làm, đã nạp lại 12/11 |
| **V-07** | Ở học kỳ 1 không có lớp nào học môn ở học kỳ chẵn (ngoại ngữ, kỹ năng, khóa luận); bộ môn Ngoại ngữ & Kỹ năng không có lớp học phần, giáo viên của bộ môn này không có phân công | Mỗi thời điểm chỉ có một nửa học kỳ của khung đang diễn ra | Giữ nguyên đúng thực tế: các bộ môn đều có giáo viên (tối thiểu 2); giáo viên chưa phân công có `subjectIds` rỗng; môn học kỳ chẵn xuất hiện ở danh sách môn nhưng chưa có lớp | `test_seed_curriculum.py` ("đủ 7 bộ môn đều có giáo viên", "chưa được phân công thì để trống") | Đã làm; **học kỳ 2 chưa có dữ liệu lớp** |
| **V-08** | Rủi ro khi đổi mô hình (chưa thấy xảy ra thật, được chặn bằng kiểm thử): sinh viên có thể bị gán nhầm môn của học kỳ khác | `subjectIds` của sinh viên lấy theo `semesterNo` cũ | `subjectIds` lấy theo vị trí suy ra từ khóa + năm học + học kỳ | `test_seed_curriculum.py` ("sinh viên học đúng các môn của học kỳ đang diễn ra theo khóa của mình") | Đã làm |

## 3. Nhóm B: xếp lịch và tính toàn vẹn của dữ liệu sinh ra

| Mã | Hiện tượng | Nguyên nhân gốc | Cách xử lý | Minh chứng | Trạng thái |
|---|---|---|---|---|---|
| **V-09** | Với 80 lớp, 71 giáo viên và 39 phòng, xếp ngẫu nhiên dễ trùng giờ lớp, giáo viên hoặc phòng | Số ràng buộc giao nhau tăng mạnh theo quy mô | Bộ xếp lịch kiểm tra trước khi nhận một ô giờ: lớp, giáo viên, phòng đều không trùng; môn thực hành vào phòng máy riêng; môn 3–4 tín chỉ 2 buổi mỗi tuần | `test_seed_curriculum.py` ("lớp, giáo viên, phòng không trùng giờ", "môn 3–4 tín chỉ học 2 buổi/tuần") | Đã làm |
| **V-10** | Đề trắc nghiệm sinh số lượng lớn (114 đề) có thể sai cấu trúc, hoặc làm lộ đáp án nếu để trong dữ liệu dùng chung | Đề và đáp án chung một chỗ | Đáp án tách sang `quizKeys/<id>`; đề lưu chung không chứa đáp án đúng; script dùng chính hàm kiểm tra đề của máy chủ (`quiz_shape_ok`) nên đề sinh ra luôn hợp lệ | `test_seed_curriculum.py` (đề không chứa đáp án, nộp bài được chấm, nộp lần hai bị từ chối) | Đã làm |
| **V-11** | Nạp thử trên CSDL đã có tài khoản thật dễ trộn lẫn dữ liệu mẫu vào dữ liệu thật; mật khẩu mặc định đoán được | Không có ranh giới giữa dữ liệu mẫu và dữ liệu thật | Mọi bản ghi gắn `seed: "curriculum-v1"`; script từ chối nếu CSDL có tài khoản thật (cần `--force-merge`); `--purge`, `--replace` chỉ xóa bản ghi có nhãn; tài khoản thật giữ nguyên | `test_seed_curriculum.py` ("từ chối nạp vào CSDL đã có tài khoản thật", "purge giữ nguyên tài khoản thật") | Đã làm; mật khẩu mặc định vẫn đoán được (cảnh báo trong tài liệu 10) |

## 4. Nhóm C: quy mô làm lộ điểm nghẽn

Các điểm này đo được hoặc đọc ra từ mã khi chạy 2.040 tài khoản (mục 04). Chúng **chưa được sửa**; đây là đối tượng đo lại và ghi nhận ở tuần 3 của đợt (mục 01), không mở rộng.

| Mã | Hiện tượng | Nguyên nhân gốc | Số đo | Trạng thái |
|---|---|---|---|---|
| **V-12** | Thông lượng đứng yên ở khoảng 50–55 yêu cầu mỗi giây; ở 200 người dùng ảo p95 lên 5,2 giây trong khi CPU chỉ dùng trung bình 17% | Mọi yêu cầu API chạy **nối đuôi** (cả `route()` nằm trong một khóa chung); đăng nhập băm PBKDF2 200.000 vòng nằm trong khóa này (~0,1 giây mỗi lần) nên trần đăng nhập khoảng 8–10 lần mỗi giây | 100 người: p95 1,97 s (sát ngưỡng 2 s); 200 người: 5,23 s | Ghi nhận, chưa sửa. Hướng sửa: băm mật khẩu ngoài khóa chung |
| **V-13** | Mỗi lần đăng nhập giao diện tải **toàn bộ hồ sơ người dùng** (`GET /api/doc/user`) | Mọi tài khoản đã đăng nhập đều đọc được danh sách để dựng danh bạ; hàm `can()` còn tra CSDL một lần cho từng dòng | ~660 KB mỗi lần với 2.040 tài khoản; ước ~2,6 MB với 8.000 | Ghi nhận, chưa sửa. Hướng sửa: phân trang hoặc chỉ trả hồ sơ cần thiết |
| **V-14** | `sharedData/global` là **một tài liệu duy nhất**; giáo viên và admin ghi ngược cả tài liệu; máy chủ nhận ghi tối đa 5 MB | Thiết kế gom môn, lịch, lịch thi, tài liệu, trắc nghiệm vào một tài liệu | `medium`: 1,3 MB; `large`: 2,7 MB (54% giới hạn) | Ghi nhận. Script cảnh báo khi vượt 4 MB, công cụ `storage --check` in dung lượng. Việc tách theo môn đã nằm trong kế hoạch (mục 14 tuần 6) |
| **V-15** | Kết nối giữ lâu (keep-alive) nối thẳng vào API bị hỏng sau `logout`: yêu cầu kế tiếp trả 501 | Máy chủ không đọc nội dung của POST, phần dư bị hiểu là yêu cầu mới | Qua nginx không gặp; chỉ thấy khi đo nối thẳng | Ghi nhận, chưa sửa |
| **V-16** | Trang Quản lý tài khoản dựng cả 2.000 dòng trong một bảng, chưa phân trang hay tìm kiếm | Giao diện viết cho vài tài khoản | **Chưa đo** độ chậm | Ghi nhận, chưa kiểm chứng |

## 5. Nhóm D: vận hành khi nạp lên máy chủ thật

| Mã | Hiện tượng | Xử lý | Trạng thái |
|---|---|---|---|
| **V-17** | Thư mục `/var/lib/studytask/uploads` quyền 750 nên nginx (`www-data`) trả 403 cho **mọi** tệp trong `/uploads/`, kể cả tệp tải lên từ trước | `chmod 755` thư mục (chỉ thư mục, tệp bên trong vốn 644); sau khi nạp lại đã kiểm tra vẫn tải được PDF qua web (HTTP 200) | Đã sửa 12/11 |
| **V-18** | **Mã đang chạy thật chưa nằm trong `master`**: lọc theo lớp học phần (`teacher_sections`, `CLASS_SCOPED`), `utils/scope.js`, script nạp dữ liệu, bộ đo tải, tài liệu 10, hai bộ kiểm thử đang là tệp chưa commit trong máy làm việc. API và giao diện thật đã được cài từ bản đó ngày 12/11. Kiểm tra: `master` có 0 chỗ nhắc `teacher_sections`, API thật có 4. Giao diện thật cũng chưa có nhãn "Năm N – Học kỳ 1/2" và ô Khóa | **Nguy cơ:** lần triển khai kế tiếp từ `master` sẽ làm mất toàn bộ phần lọc theo lớp. Cần gom vào PR có review, rồi mới triển khai tiếp | **Chưa xử lý**, ưu tiên đầu tuần 2 của đợt |
| **V-19** | Nạp lại làm các tài khoản mẫu cũ biến mất, tên đăng nhập đổi (`sv26101001` thành `sv2601001`), phiên đăng nhập của họ mất | Chấp nhận vì là tài khoản mẫu; 5 tài khoản thật giữ nguyên; sao lưu trước khi nạp và thử nạp trên bản sao CSDL thật trước | Đã làm; đây là chủ đích |
| **V-20** | Tài khoản `admin` thật vẫn dùng mật khẩu đoán được (đăng nhập bằng mật khẩu mặc định vẫn thành công khi kiểm tra) | Chưa đổi | **Chưa xử lý**, nên đổi trước khi nộp |

## 6. Phân loại và đếm

| Loại | Số vấn đề | Đã sửa | Ghi nhận, chưa sửa |
|---|---|---|---|
| Logic phân quyền, học kỳ, lớp (nhóm A) | 8 | 8 | 0 |
| Toàn vẹn dữ liệu sinh ra (nhóm B) | 3 | 3 | 0 |
| Hiệu năng theo quy mô (nhóm C) | 5 | 0 | 5 |
| Vận hành (nhóm D) | 4 | 2 (V-17, V-19) | 2 (V-18, V-20) |
| **Tổng** | **20** | **13** | **7** |

"Đã sửa" có nghĩa là có mã và kiểm thử tự động đạt trên máy chủ. V-01 đến V-03, V-05, V-06 và V-08 đã chạy trên máy chủ thật nhưng **chưa vào `master`** (V-18); V-04 đã vào `master`.

## 7. Bài học

1. **Dữ liệu ít che giấu lỗi phân quyền.** Cả nhóm lỗi V-01 đến V-04 chỉ lộ khi một môn có nhiều lớp và nhiều giáo viên; kiểm thử trên vài tài khoản không thể thấy.
2. **Tên thuộc tính phải theo cách nghiệp vụ gọi.** "Khóa, năm học, học kỳ 1/2" nghe hiển nhiên với người dùng, trong khi bản đầu dùng "kỳ số mấy" thuận tiện cho người viết mã nhưng làm sai cả danh mục lớp, nhãn và bộ lọc.
3. **Cần kiểm thử trên bản sao dữ liệu thật trước khi nạp.** Lần nạp lại 12/11 chạy thử trên bản sao CSDL (79 giây) rồi mới chạy thật (80 giây), kèm sao lưu; nhờ vậy biết trước kết quả và có đường quay lại.
4. **Hiệu năng là hệ quả của thiết kế chung**, không phải của một hàm: khóa chung, tài liệu dùng chung một khối, danh sách người dùng trả hết. Muốn sửa phải sửa kiến trúc, nên cần kế hoạch riêng.
5. **Mã chạy thật phải nằm trong repo.** V-18 cho thấy một lần triển khai từ máy cá nhân có thể đưa lên máy chủ phần mã mà `master` không có; đây là rủi ro vận hành đáng kể hơn nhiều lỗi nhỏ trong mã.

## 8. Điểm nghi vấn cần kiểm tra ở tuần 2 (chưa xác nhận là lỗi)

Xếp lớp, thời khóa biểu, ngành và bộ môn của dữ liệu sinh ra còn chưa sát thực tế. Đây là danh sách để **rà lại** ở tuần 2, chia theo bốn mảng. Mỗi mục là một câu hỏi: kết luận có lỗi hay không cần người hiểu quy chế của trường quyết định, nên chưa tính vào 20 vấn đề ở trên.

| Mảng | Điểm nghi vấn | Vì sao nghi | Cách kiểm tra |
|---|---|---|---|
| Xếp lớp | Mỗi lớp 20–30 sinh viên, kích cỡ chọn ngẫu nhiên | Cỡ lớp thật của một ngành có thể khác và thường theo quy định, không ngẫu nhiên | Đối chiếu với sĩ số lớp sinh hoạt và lớp học phần thật; đổi `--min-students`, `--max-students` nếu cần |
| Xếp lớp | "Lớp sinh hoạt" và "lớp học phần" đang trùng nhau: mỗi lớp học đủ 5 môn cùng nhau | Thực tế một môn có thể gộp nhiều lớp sinh hoạt vào một lớp học phần, hoặc tách ra | Quyết định mô hình, rồi xem logic lọc theo lớp (V-01 đến V-03) còn đúng không |
| Xếp lớp | Mọi sinh viên của một lớp có đúng cùng danh sách môn | Không có sinh viên học lại, học vượt, môn tự chọn | Ghi rõ là giản lược, hoặc bổ sung vài ngoại lệ nhỏ nếu cần để thử logic |
| Thời khóa biểu | Giáo viên nhận 5–6 lớp học phần, môn 3–4 tín chỉ học 2 buổi mỗi tuần, mỗi buổi 2 giờ 30 | Nếu toàn môn 3–4 tín chỉ, một giáo viên có thể tới khoảng 12 buổi, tức khoảng 30 giờ mỗi tuần, có thể cao hơn thực tế | Tính số buổi và giờ dạy mỗi giáo viên; xem lại `--max-load` |
| Thời khóa biểu | 4 ca mỗi ngày, Thứ Hai đến Thứ Bảy, không có ca tối, có lớp học trực tuyến lẫn trực tiếp không theo quy tắc | Mô hình ca học và tỷ lệ trực tuyến chưa theo quy định | Đối chiếu với khung giờ và hình thức học thật của trường |
| Thời khóa biểu | Bộ kiểm thử chỉ bảo đảm không trùng giờ cho **thời khóa biểu học**; lịch thi mỗi lớp cách nhau 2 ngày nhưng chưa có kiểm thử riêng về trùng phòng, trùng giờ | `test_seed_curriculum.py` chỉ kiểm tra lớp, giáo viên, phòng cho lịch học | Thêm kiểm tra tương tự cho lịch thi, hoặc đối chiếu bằng truy vấn |
| Ngành | Mọi sinh viên có khoa và ngành cùng là "Công nghệ thông tin" (một giá trị cho cả hai trường) | Thực tế khoa và ngành khác nhau (một khoa có nhiều ngành) | Quyết định tên khoa, ngành, mã ngành cho dữ liệu; sửa script và hồ sơ |
| Ngành | CTĐT trên máy chủ đang có **hai** khung: khung CNTT mới sinh và `Kỹ thuật phần mềm – khóa 2024` (dữ liệu demo cũ) trong khi sinh viên chỉ thuộc một ngành | Hai ngành xuất hiện nhưng chỉ một ngành có sinh viên | Bỏ khung demo cũ hoặc ghi rõ nó là dữ liệu demo |
| Bộ môn | 7 bộ môn do script tự gom theo mã môn (Lý luận chính trị, Toán, Ngoại ngữ nằm cùng khoa CNTT; mọi giáo viên đều ghi khoa "Công nghệ thông tin") | Các môn đại cương thường do khoa hoặc bộ môn khác giảng dạy | Quyết định bộ môn nào thuộc khoa nào; sửa trường `faculty`, `department` của giáo viên |
| Bộ môn | Một giáo viên dạy được **mọi môn** trong bộ môn (`canTeachSubjectIds`), và dạy nhiều khóa khác nhau | Thực tế giáo viên thường chuyên một vài môn | Giới hạn `canTeachSubjectIds` theo nhóm môn nhỏ hơn; kiểm tra lại phân công |
| Bộ môn | Số giáo viên mỗi bộ môn lệch nhau: Lập trình và Công nghệ phần mềm & CSDL khoảng 17 người, Hệ thống & Mạng và Trí tuệ nhân tạo & Dữ liệu khoảng 7, Ngoại ngữ & Kỹ năng 2 (chưa có lớp ở học kỳ 1) | Số lượng suy ra từ tải của mô hình, không theo biên chế | Đối chiếu với biên chế giả định của khoa |

**Cách làm ở tuần 2:** đi lần lượt bốn mảng; mỗi mục ghi kết luận (lỗi, giản lược chấp nhận, hoặc ngoài phạm vi), sửa trong `scripts/seed_curriculum.py`, chạy lại `--dry-run`, chạy bộ kiểm thử, rồi nạp lại bằng `--replace` có sao lưu như biên bản 05. Không thêm ngành hoặc môn mới (xem mục 01, phần 3 và 6).
