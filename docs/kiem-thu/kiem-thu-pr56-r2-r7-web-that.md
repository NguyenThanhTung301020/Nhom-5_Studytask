# Kiểm thử PR56 (R2–R7) trên website thật

- Đối tượng: [PR56](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/56), gộp `b9e2663`, commit sửa `e05502e`. Báo cáo sửa lỗi: [`docs/sua-loi/03-review-pr9-r1-r7.md`](../sua-loi/03-review-pr9-r1-r7.md).
- Website: https://sutdytask.io.vn (bản đang vận hành, build giao diện `v202611190241`). Không dùng localhost.
- Tài khoản: Phòng Đào tạo (`daotao`). Người thực hiện tự đăng nhập; Claude Code (AI) thao tác và soạn báo cáo.
- Ngày: 19/11/2026, khoảng 12:25–12:50 giờ Việt Nam.
- Minh chứng: thư mục [`anh/pr56-web-that/`](anh/pr56-web-that/).
- Trạng thái: **ĐÃ KIỂM THỬ, ĐÃ DỌN DỮ LIỆU TẠM** (13:45–13:53 giờ VN; dữ liệu dùng chung trùng 9/9 khóa với lúc trước khi thử, xem mục 5). Đã sửa L1, G2, G3 trên nhánh `fix/tuan7-l1-bao-loi-luu-du-lieu-chung` (commit cục bộ, **chưa push**).

## 1. Điều kiện máy chủ và phạm vi

Lúc 11:35 giờ VN, phép đối chiếu ([`doi-chieu-may-chu-voi-master.txt`](anh/pr56-web-that/doi-chieu-may-chu-voi-master.txt)) cho thấy máy chủ **chưa chạy đúng `master`**. Cụ thể, máy chủ đang chạy thêm nhánh thư viện chưa gộp và thiếu PR67. Riêng 5 tệp giao diện của PR56 thì **trùng `master`**.

Theo quyết định của Nguyễn Thanh Tùng ngày 19/11: **không đối chiếu lại máy chủ ở lần kiểm thử này**, mà kiểm thử thẳng trên web thật. Lý do: mỗi lần mã thay đổi, phần thuật toán mặc định lại phải đối chiếu từ đầu, rất tốn thời gian. Vì vậy, kết quả dưới đây là kết quả **trên bản đang chạy**, không chứng minh `master` hiện tại.

**Thời gian cập nhật mã cho khớp dữ liệu thực tế:** _chờ nhóm chốt mốc_. Người quản trị máy chủ cần triển khai lại từ `master`, hoặc gộp nhánh thư viện qua PR trước rồi mới triển khai.

**Vì sao không chạy trực tiếp từ GitHub:** nhóm không cho phép máy chủ kéo và chạy mã trực tiếp từ GitHub. Phương án đề xuất: người quản trị triển khai thủ công từ một commit cụ thể của `master`, sau đó chạy `deploy/kiem-chung-master.sh` và ghi hash vào biên bản.

## 2. Dữ liệu thử

Chỉ dùng dữ liệu tạm có tiền tố `ZZ56`/`ZZ PR56`. Không sửa hay xóa dữ liệu thật.

| Mục | id | Ghi chú |
|---|---|---|
| Môn ZZ56A | 1795066249116 | Có 1 bài tập tạm `zz56-hw-1` và 1 tài liệu tạm `zz56-mat-1` |
| Môn ZZ56B | 1795066268199 | Không có dữ liệu, đã xóa ở ca 3 |
| Môn ZZ56C | 1795066283021 | Không có dữ liệu, đã bớt ở ca 3 |
| Môn ZZ56D | 1795066428021 | Có 1 tài liệu tạm `zz56-mat-2`, thêm vào sau khi trang đã tải |

Vân tay dữ liệu trước khi thử (SHA-256 từng khóa của `sharedData/global`) nằm ở [`00-van-tay-du-lieu-truoc.json`](anh/pr56-web-that/00-van-tay-du-lieu-truoc.json).

## 3. Kết quả

| # | Trường hợp | Mã | Kết quả | Minh chứng |
|---|---|---|---|---|
| 1 | Chương trình ĐT: bớt ZZ56A (còn 1 bài tập, 1 tài liệu) | R2 | **PASS**. Hiện "Chưa bớt được môn … còn 1 bài tập, 1 tài liệu", trang cuộn lên đầu, không mở hộp xác nhận. Máy chủ vẫn còn ZZ56A | 01, 02 |
| 2 | Môn học: xóa ZZ56A | R3 | **PASS**. Bị chặn với cùng thông báo; bài tập và tài liệu không bị xóa kèm | 05, 06 |
| 3 | Bớt ZZ56C (Chương trình ĐT) và xóa ZZ56B (Môn học), cả hai không còn dữ liệu | R2, R3 | **PASS**. Hiện hộp xác nhận rồi xóa được; máy chủ giảm từ 159 xuống 157 môn | 03, 04, 07, 08 |
| 4 | Quyền của Phòng Đào tạo | R2–R4 | **PASS**. Menu có Môn học, Chương trình ĐT, Xét tốt nghiệp; không có Trắc nghiệm, Tiện ích, Quản trị. Bớt môn thật DS201 (chỉ còn "1 tài khoản được phân môn") bị chặn | 13, 15 |
| 4b | Máy chủ chặn bớt môn còn dữ liệu (R4) | R4 | **PASS (máy chủ)**. Giao diện còn dữ liệu cũ nên để lọt lệnh xóa ZZ56D; máy chủ trả `409 subject-in-use` "…còn 1 tài liệu" và **không ghi**. **FAIL (giao diện)**: xem lỗi L1 | 09, 10, 12 |
| 5 | Liên kết minh chứng | R5 | **PASS một phần**. `isHttpUrl` của web thật trả `false` cho `javascript:`, `JAVASCRIPT:`, `data:`, `vbscript:`, `//evil.com`, `ftp:` và `true` cho http(s). Đào tạo tạo phiếu có `evidence: javascript:` thì nhận 403. **Chưa kiểm được** nhánh Đào tạo sửa link của phiếu đã có, vì web thật chưa có phiếu nào (Đào tạo không tạo được phiếu) | 18 |
| 6 | Xuất CSV đề trắc nghiệm | R6 | **PASS**. Phòng Đào tạo không có trang Trắc nghiệm nên không có nút "Xuất CSV" (đúng phân quyền). Đã gọi `questionsToCsv` của chính web thật (`/v202611190241/utils/quizFile.js`) trên bộ câu hỏi thử | 16 |
| 7 | Mở CSV bằng Excel 16 (Windows, dấu phân cách `,`) | R6 | **PASS**. 6 dòng × 8 cột, **không ô nào là công thức** (`HasFormula=False` ở mọi ô), tiếng Việt và ô nhiều dòng hiển thị đúng | 17 |
| 8 | Định dạng và nội dung CSV | R6 | **PASS có ghi chú**. Có BOM UTF-8, xuống dòng CRLF; ô có dấu phẩy, ngoặc kép, xuống dòng được bọc `"…"`. Các ô `=…`, `+SUM…`, `@…`, `-2+3`, `+84…` có dấu `'` phía trước; `-5`, `-0.5` giữ là số. Nhập lại cho ra đúng bộ câu hỏi ban đầu. Xem ghi chú G1, G2 | 16, 17 |
| 9 | Dữ liệu sau thao tác | R2–R4 | **PASS**. Sau 409, ZZ56D và tài liệu của nó vẫn còn; tải lại trang thì hiện đúng "còn 1 tài liệu". Sau khi dọn, SHA-256 cả 9 khóa của `sharedData/global` **trùng** lúc trước khi thử (156 môn, 8 bài tập, 427 tài liệu, 172 đề, 1364 lịch học, 1363 lịch thi, 9 deadline, 4 tin, 5 biểu mẫu) | 14, 00, 19 |
| 10 | Trường hợp lỗi | R2–R7 | **FAIL 1 lỗi (L1)**. R7 chỉ là ghi chú trong `firestore.rules`, không có gì để kiểm trên web | 11, 12 |

## 4. Lỗi và ghi chú

### L1. Máy chủ trả 409 nhưng giao diện không báo, và mọi lần sửa môn sau đó trong cùng tab đều mất âm thầm (mức: Cao)

**Bước tái hiện:**
1. Đăng nhập Phòng Đào tạo, mở Môn học. Tạo môn ZZ56D.
2. Thêm 1 tài liệu cho ZZ56D từ phiên khác, hoặc qua `POST /api/doc/sharedData/global/append`. Trang đang mở không biết tài liệu này.
3. Trên trang cũ, bấm Xóa môn học ZZ56D rồi bấm Xóa.
4. Cũng trên tab đó, sửa môn ZZ56A từ 1 thành 2 tín chỉ rồi Lưu.

**Mong đợi:** ở bước 3 có thông báo đỏ "Chưa bớt được môn … còn 1 tài liệu", ZZ56D vẫn hiện trên màn hình. Ở bước 4 lưu được.

**Thực tế:** ở bước 3, PUT trả 409 và máy chủ không ghi (đúng), nhưng ZZ56D **biến mất khỏi màn hình**, không có thông báo, console báo `Uncaught (in promise) Error`. Ở bước 4, màn hình hiện "2 TC", nhưng PUT lại trả **409** vì danh sách gửi lên vẫn thiếu ZZ56D, nên máy chủ vẫn giữ **1 TC**. Người dùng tưởng đã lưu.

**Nguyên nhân:** `app.js` tự lưu bằng `useEffect(() => saveSharedKey('subjects', subjects))` và không `catch` lỗi (`utils/firebase.js` `saveSharedKey`). Khi máy chủ từ chối, trạng thái React không được khôi phục. Từ đó mỗi lần lưu `subjects` đều gửi một danh sách thiếu môn, nên đều bị 409. Báo cáo sửa lỗi 03 đã ghi đây là "giới hạn", nhưng hệ quả thứ hai (mất các lần sửa sau) chưa được ghi.

**Đề xuất sửa:**
1. Các hiệu ứng `saveSharedKey` trong `app.js` cần bắt lỗi. Gặp `subject-in-use` thì tải lại `sharedData/global`, đặt lại `subjects` theo máy chủ, và hiện thông báo lỗi (dùng `e.message`).
2. Hoặc trước khi xóa, đọc lại `sharedData/global` rồi mới gọi `subjectUsageDetail`.
3. Thêm ca kiểm thử giao diện cho tình huống dữ liệu cũ.

**Đã sửa** ngày 19/11 trên nhánh `fix/tuan7-l1-bao-loi-luu-du-lieu-chung` (tạo từ `master` `c2cecf5`), đã commit cục bộ, **chưa push**, chờ nhóm xem.

- `utils/sharedSync.js` (mới) có các hàm sau:
  - `serverRejected`: phân biệt máy chủ từ chối (4xx, mã lỗi của máy chủ) với lỗi mạng hoặc 5xx.
  - `keysToReload`: chọn khóa cần tải lại. Riêng `subject-in-use` thì tải lại thêm lịch học, lịch thi, deadline, bài tập, tài liệu, đề, để màn hình hiện đúng dữ liệu đang chặn.
  - `saveErrorText`: soạn câu báo lỗi.
  - `echoGuard`: không gửi ngược lên bản vừa tải.
  - `recoverFromSaveError`: ghép các hàm trên thành luồng xử lý lỗi.
- `app.js`:
  - 9 `useEffect` lưu dữ liệu chung dùng chung hàm `persistShared`. Lỗi lưu được bắt lại, máy chủ từ chối thì tải lại và đặt lại state theo máy chủ.
  - Hiện thông báo đỏ (đóng được) ở đầu màn hình.
  - Lỗi mạng thì giữ màn hình, chỉ báo "kiểm tra kết nối rồi tải lại trang".
  - Không sửa máy chủ.
- Kiểm thử:
  - `npm run test:logic` **141/141 đạt**, thêm 6 ca, trong đó có một ca mô phỏng đúng tình huống trên web thật.
  - Khi tắt bước khôi phục, ca L1 **không đạt**, tức là kiểm thử bắt được lỗi.
- Thử trên giao diện bằng API tạm cục bộ (dữ liệu tạm, tài khoản tạm `tr01`), lặp lại đúng các bước tái hiện ([`20`](anh/pr56-web-that/20-sua-L1-409-co-thong-bao-mon-hien-lai.jpg), [`21`](anh/pr56-web-that/21-sua-L1-mang.txt)):
  - PUT trả 409. Ngay sau đó chỉ có 1 lệnh GET tải lại, không có PUT gửi ngược lên.
  - Hiện thông báo "Chưa lưu được thay đổi môn học: Chưa bớt được môn … còn 1 tài liệu … Màn hình đã được đưa về đúng dữ liệu trên máy chủ".
  - Môn D hiện lại kèm "1 tài liệu".
  - Sửa A thành 2 TC thì PUT trả **200** và máy chủ lưu 2 TC.
  - Console không còn `Uncaught (in promise)`.
- Giới hạn còn lại: nếu một khóa khác vừa được lưu thành công **sau** lần tải lại này, màn hình có thể tạm hiện bản cũ của khóa đó cho tới lần tải trang sau. Dữ liệu trên máy chủ không mất.
- Cần làm thêm: triển khai lên web thật, sau đó lặp lại ca 4b và L1 trên web thật.

### Ghi chú (không phải lỗi bảo mật)

- **G1.** Excel hiển thị cả dấu `'` (ví dụ `'=1+1`) vì Excel không coi `'` là tiền tố khi mở CSV. Đây là cách chống chèn công thức thông dụng và chấp nhận được, nhưng người xem sẽ thấy dấu này.
- **G2.** Câu hỏi có nội dung đúng là `+5` được coi là số nên không thêm `'`. Excel hiển thị `5`, tức mất dấu `+` (ô B6). Nếu lưu lại từ Excel rồi nhập thì câu hỏi thành `5`. Mức thấp.
  - **Đã sửa** (cùng nhánh với L1): `utils/quizFile.js` chỉ miễn dấu `'` cho số không dấu và số âm (`-5`, `-0.5`). Số có dấu `+` như `+5`, `+0,5` cũng được thêm `'`, nhập lại vẫn ra `+5`.
  - Kiểm thử: thêm 1 ca vào `tests/quizfile.test.mjs`. Ca này không đạt trên mã cũ, vì mã cũ không thêm `'` trước `+5`.
  - Đã mở lại bằng Excel 16 ([`22-csv-sau-sua-G2.csv`](anh/pr56-web-that/22-csv-sau-sua-G2.csv)): 0 ô là công thức, B6 hiện `'+5`. Các ô `-5`, `-0.5` vẫn hiện là số.
- **G3.** Hộp xác nhận xóa ở trang Môn học không nêu tên môn ("Xóa môn học này?"), dễ xóa nhầm. Trang Chương trình ĐT thì có nêu tên.
  - **Đã sửa** (cùng nhánh): `pages/Subjects.js` nay hiện "Xóa môn ZZ56A – Môn A (thử L1)? Môn không còn dữ liệu liên quan." Đã thử trên API tạm cục bộ ([`23`](anh/pr56-web-that/23-sua-G3-hop-xoa-neu-ten-mon.jpg)).
- **G4.** Trang Môn học ở khổ 512 px bị cuộn ngang (rộng 733 px). Lỗi này không thuộc PR56.

## 5. Việc còn lại

| # | Việc | Trạng thái |
|---|---|---|
| 1 | **Dọn dữ liệu tạm** trên web thật: tài liệu `zz56-mat-1`, `zz56-mat-2`, bài tập `zz56-hw-1`, rồi môn ZZ56A, ZZ56D. Làm bằng giao diện trang Môn học, tài khoản Phòng Đào tạo (nút Xóa tài liệu/bài tập có cho vai trò khác sinh viên), theo đúng thứ tự R2–R4 yêu cầu: xóa dữ liệu trước, môn sau | **Xong** 19/11, 13:45–13:53 giờ VN. Không còn mục nào chứa `zz56`/`ZZ56`/`ZZ PR56` |
| 2 | So vân tay dữ liệu sau khi dọn với [`00-van-tay-du-lieu-truoc.json`](anh/pr56-web-that/00-van-tay-du-lieu-truoc.json) | **Xong, TRÙNG 9/9 khóa** ([`19-van-tay-du-lieu-sau-khi-don.json`](anh/pr56-web-that/19-van-tay-du-lieu-sau-khi-don.json)). Phiếu thử `graduationApps/zz-pr56-test` không được tạo (403), nên không cần dọn |
| 3 | Kiểm R5 nhánh sửa link: cần một tài khoản sinh viên thử nộp phiếu, sau đó Đào tạo đổi link sang `javascript:` (mong đợi 403) | Chờ tài khoản thử |
| 4 | Nhóm chốt mốc triển khai lại máy chủ từ `master` (mục 1) | Chờ nhóm |
| 5 | Sửa L1 | **Đã sửa** trên nhánh `fix/tuan7-l1-bao-loi-luu-du-lieu-chung`, đã kiểm thử cục bộ (mục 4). Chưa commit/push; sau khi gộp và triển khai thì kiểm lại trên web thật |
| 6 | G2, G3 | **Đã sửa** trên cùng nhánh; `npm run test:logic` 142/142 đạt, đã kiểm bằng Excel và giao diện cục bộ (mục 4) |
| 7 | G4 (trang Môn học cuộn ngang ở khổ hẹp) | Không thuộc PR56, chưa sửa |
| 8 | Đẩy nhánh lên GitHub, mở PR, nhóm duyệt, gộp `master`, triển khai; sau đó kiểm lại ca 4b, L1, G2, G3 trên web thật | Chờ người thực hiện cho phép push |
