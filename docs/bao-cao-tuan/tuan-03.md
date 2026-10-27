# Báo cáo tuần 3

- Đề tài: Xây dựng một website quản lý deadline học tập cho sinh viên (sản phẩm: StudyTask)
- GVHD: TS. Huỳnh Xuân Phụng
- Nhóm: Nguyễn Thanh Tùng (24TX810027) · Trần Đức Tùng (24TX810026) · Trương Thanh Vui (24TX810021)
- Thời gian: 19/10 – 27/10/2026
- Repo GitHub (public): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask
- Toàn bộ link minh chứng: xem mục 8. Các mã [C4], [PR1], [D9]... trong bài trỏ tới mục này.

## 1.Báo cáo tình hình commit tuần 3  

Tuần 3 nhóm tiến hành update mã nguồn từ tuần 2 (trên máy cá nhân) lên github theo kế hoạch. Mỗi phần được thêm vào theo nhánh riêng và chỉ gộp sau khi được thành viên khác check PR.

## Bảng khai báo lịch sử commit 

| Mã | Commit | Người commit (tài khoản GitHub) | Ngày | Nội dung tóm tắt | PR |
|---|---|---|---|---|---|
| [C4] | b90b200 | Trương Thanh Vui (Thanh-Vui-Minx) | 21/10 | Chạy Firebase Emulator trên máy local (đợt 1). | [PR1] |
| [C5] | 9ad8b07 | Trần Đức Tùng (TranDucTung-24tx810026) | 21/10 | Logic tính điểm, học phí, chương trình đào tạo và kiểm thử (đợt 1). | [PR2] |
| [C6] | 089af8b | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 22/10 | README và tài liệu sửa lỗi hồ sơ. | [PR3] |
| [C7] | ba2ae6e | Trương Thanh Vui (Thanh-Vui-Minx) | 22/10 | Sáu trang mới, sổ điểm và lịch học (đợt 2). | [PR4] |
| [C8] | 1b7fed0 | Trương Thanh Vui (Thanh-Vui-Minx) | 22/10 | Hoàn tác thay đổi của PR4. | [PR5] |
| [C9] | d0cfea6 | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 23/10 | Sửa lỗi cập nhật hồ sơ, đăng xuất và đồng bộ dữ liệu theo tài khoản. | [PR6] |
| [C10] | 11de331 | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 23/10 | Vá quy tắc V2, vá tạm V1 và bổ sung kiểm thử rules. | [PR6] |

### Tình trạng review và gộp PR

| PR | Người mở | Người review (Approve) | Người gộp | Ngày gộp |
|---|---|---|---|---|
| [PR1] Emulator | Trương Thanh Vui | Nguyễn Thanh Tùng | Nguyễn Thanh Tùng | 23/10 |
| [PR2] Logic tính toán | Trần Đức Tùng | Trương Thanh Vui | Trương Thanh Vui | 22/10 |
| [PR3] README, tài liệu sửa lỗi | Nguyễn Thanh Tùng | Trần Đức Tùng | Trần Đức Tùng | 22/10 |
| [PR4] Sáu trang mới | Trương Thanh Vui | Không có review | Trương Thanh Vui | 22/10 |
| [PR5] Gỡ PR4 | Trương Thanh Vui | Trần Đức Tùng | Trần Đức Tùng | 23/10 |
| [PR6] Sửa lỗi hồ sơ, vá V2/V1 | Nguyễn Thanh Tùng | Trương Thanh Vui | Trương Thanh Vui | 23/10 |

### Ưu và nhược điểm khi nhóm áp dụng PR vào  `master`
### Ưu điểm:
- Nhóm đảm bảo các nhánh trước khi gộp phải thông qua **Approve**, từ đó tránh việc up các file rác.
- Việc PR giúp nhóm xác định rõ vai trò của các thành viên cũng như xác định được các nội dung có thay đổi trong file mà cách push thông thường dễ bị bỏ qua.

### Tuy nhiên việc dùng PR cũng gây ra một số nhược điểm nhất định:
### Tuần 3:
Trình tự gộp PR không đồng nhất gây lỗi về nội dung.
- **PR4 được gộp trước PR1 và chưa có review.** Sau khi PR4 được gộp, `utils/store.js` sử dụng các hàm chỉ được bổ sung trong PR1, trong khi PR1 chưa được gộp vào `master`. Vì vậy, các phụ thuộc chưa đầy đủ và mã trên `master` phát sinh lỗi import. Nhóm phát hiện và đã cập nhật bản PR5 để sửa.
- **PR5 được gộp sau PR6.** `app.js` trong PR6 có import sáu trang mà PR5 vừa gỡ: `pages/MonthCalendar.js`, `pages/Tuition.js`, `pages/GradingPolicy.js`, `pages/Curriculum.js`, `pages/Graduation.js` và `pages/Theses.js`. Do các tệp này không còn trên `master`, **`master` tại commit `dea9dae` hiện chưa chạy được**. Cách sửa: nhóm tiến hành cập nhật lại 6 file trên vào tuần 4 (**PR9**).

### Nửa đầu tuần 4:

- **PR8 và PR9 được gộp mà không thông qua Approved review.** Nhóm nhận sai sót về vấn đề này do nhầm lẫn trong lúc thao tác. Nhóm đã review bổ sung và tiến hành mở cài đặt yêu cầu tài khoản push và tài khoản check phải là 2 tài khoản riêng biệt.

## 2. Công việc đã làm và phân công

Đối chiếu theo kế hoạch tuần 3 ở mục 5 báo cáo tuần 2 [R6].

| # | Công việc | Người phụ trách | Kết quả | Minh chứng |
|---|---|---|---|---|
| 1 | Viết README (cấu trúc thư mục, cách chạy, quy ước nhánh và commit). | Nguyễn Thanh Tùng | Đạt. | [F20], commit [C6], [PR3] |
| 2 | Review mã chạy Emulator rồi commit. | Trương Thanh Vui (Nguyễn Thanh Tùng review) | Đạt một phần: đã có mã trên GitHub, đã review và gộp; chưa có kết quả chạy thử được ghi lại. | [F21]–[F24], commit [C4], [PR1] |
| 3 | Sửa lỗi “gửi yêu cầu cập nhật hồ sơ”. | Nguyễn Thanh Tùng (Trương Thanh Vui review) | Đạt một phần: có commit sửa N1–N9 và tài liệu nguyên nhân; chưa thử tay các bước ở mục 4 của [D9]. | [D9], commit [C9], [PR6] |
| 4 | Vá V2, vá tạm V1 trong `firestore.rules`, có kiểm thử tự động. | Nguyễn Thanh Tùng (Trương Thanh Vui review) | Đạt một phần: có commit rules và tệp kiểm thử; chưa chạy `npm run test:rules`; rules chưa deploy lên production. | [F25], [T1], commit [C10], [PR6] |
| 5 | Vẽ sơ đồ luồng dữ liệu do nhóm tự thực hiện. | Trần Đức Tùng | Chưa đạt: chưa có sơ đồ trên GitHub; chuyển sang tuần 4. | Chưa có |
| 6 | Rà soát tính năng theo bảng Giữ/Bỏ/Sửa/Thêm [D3]. | Cả nhóm | Đạt một phần: đã phân tích và đề xuất lịch mới (mục 3.4), chưa cập nhật tệp [D3]. | Mục 3.4 của báo cáo này |
| 7 | Hoàn thiện nhật ký sử dụng công cụ tuần 3, đối chiếu với commit. | Cả nhóm (Nguyễn Thanh Tùng tổng hợp) | Đạt. | [R9] |
| 7b | Phần tính toán (điểm theo quy chế, học phí, chương trình đào tạo) và sáu trang phát sinh từ tuần 2. | Trần Đức Tùng (tính toán), Trương Thanh Vui (trang) | Phần tính toán đã gộp. Sáu trang đã được gộp rồi gỡ; việc khôi phục đang thực hiện theo kế hoạch tuần 4. | [F26], [T2], commit [C5], [PR2], [PR4], [PR5] |
|8|Tổng hợp việc báo cáo tuần. |Cả nhóm |Chưa đạt  (Nhóm tiến hành viết lại và cập nhật lên github).|PR12|

## 3. Kết quả chính

### 3.1. Đưa mã tuần 2 lên GitHub theo kế hoạch

- Đã tạo 6 PR với 7 commit để đưa các phần công việc lên GitHub.
- Có 5/6 PR được một thành viên khác Approve trước khi gộp. PR4 là ngoại lệ: chưa có review trước khi gộp và việc gộp không đúng thứ tự phụ thuộc đã làm `master` phát sinh lỗi.
- Qua sự cố PR4 và PR5, nhóm xác định cần ghi rõ phụ thuộc giữa các PR, chỉ gộp sau khi PR phụ thuộc đã được gộp và không gộp PR khi chưa có Approve.

### 3.2. Thực hiện đạt hoặc đạt một phần nhiều mục theo bảng phân công trước đó:

- Đạt: Viết README (cấu trúc thư mục, cách chạy, quy ước nhánh và commit); Hoàn thiện nhật ký sử dụng công cụ và đối chiếu với commit.
- Đạt một phần: Review mã chạy Emulator rồi commit; Sửa lỗi “gửi yêu cầu cập nhật hồ sơ”; Vá V2, vá tạm V1 trong `firestore.rules`, có kiểm thử tự động; Rà soát tính năng theo bảng Giữ/Bỏ/Sửa/Thêm [D3].

## 4. Khó khăn và phương án khắc phục

- **Thứ tự gộp PR chưa đồng nhất.** Các thành viên chưa thống nhất thời gian, trình tự và thao tác khi thực hiện PR. Nhóm đã kiểm điểm nội bộ và lên các phương án khắc phục, bao gồm: yêu cầu các thành viên kiểm tra trình tự Approved review trước đó rồi mới gộp; tiến hành cài đặt lại quy trình trên GitHub để tránh việc tự ý gộp do lỗi thao tác.
- **Chưa có đủ kết quả kiểm thử.** Các tệp kiểm thử đã có trên GitHub nhưng chưa có minh chứng thao tác. Nhóm tiến hành cài các bộ công cụ cần thiết để thực hiện kiểm thử và ghi nhận lại thao tác kiểm thử.
- **Rules chưa deploy lên production.** Vì vậy, trên hệ thống đang chạy, mật khẩu vẫn nằm trong `user/{uid}` (V1) và người dùng vẫn tự sửa được `role` (V2).
- **Quản lý tài khoản triển khai.** Tài khoản Cloudflare đang do một thành viên giữ. Nhóm đã tiến hành cấp quyền cho toàn bộ các thành viên để có thể thực hiện thao tác khi cần thiết.
- **Việc sử dụng công cụ lưu trữ và máy chủ trả phí chưa được triển khai.** Nhóm cần thống nhất các mức chi phí, đồng thời đánh giá tình hình kinh tế để áp dụng hoặc sử dụng các công cụ ít tốn kém hơn.

## 5. Kế hoạch tuần 4 (26/10 – 31/10/2026)

| # | Công việc | Người phụ trách | Kết quả cần đạt | Trạng thái khi nộp báo cáo tuần 3 |
|---|---|---|---|---|
| 1 | Đưa lại sáu trang của PR4 thông qua việc hoàn tác hoặc upload lại file. | Trương Thanh Vui (Nguyễn Thanh Tùng review) | Khôi phục đủ `MonthCalendar.js`, `Tuition.js`, `GradingPolicy.js`, `Curriculum.js`, `Graduation.js`, `Theses.js`; ứng dụng mở trên Emulator không lỗi import; có PR và commit khôi phục để đối chiếu. | **Đã up load vào 26/10** ([C11], [PR9], [F27]). Tuy nhiên không thông qua Approved review đã nhờ review bổ sung. |
| 2 | Chạy `npm run test:logic`, `npm run test:rules`; thử tay các bước ở mục 4 của [D9]. | Cả nhóm (mỗi người chạy trên máy mình) | Ghi kết quả chạy trong `docs/`, kèm số ca đạt/không đạt. | Theo kế hoạch trong bản báo cáo trước khi chỉnh sửa. |
| 3 | Sau khi hoàn tất kiểm thử và sao lưu: deploy `firestore.rules` mới lên production, Quản trị viên chuyển mật khẩu sang `userSecrets`, rồi mới upload mã lên Cloudflare. | Nguyễn Thanh Tùng, Trương Thanh Vui | Biên bản các bước trong `docs/`; đăng nhập thử 3 vai trò. | Theo kế hoạch trong bản báo cáo trước khi chỉnh sửa. |
| 4 | Làm bản thử Cloudflare Worker: tạo tài khoản và gửi email đặt lại mật khẩu qua Identity Toolkit trên project thử. | Nguyễn Thanh Tùng | Commit bản thử và ghi chú kết quả; chốt phương án máy chủ cho tuần 5. | Theo kế hoạch trong bản báo cáo trước khi chỉnh sửa. |
| 5 | Vẽ sơ đồ luồng dữ liệu do nhóm tự thực hiện. | Trần Đức Tùng | Sơ đồ trong `docs/so do/`. | **Đã up load vào 25/10** ([C12], [PR8], [F28]). Tuy nhiên không thông qua Approved review nhóm đang tiến hành review. |
| 6 | Cập nhật [D3] theo đề xuất ở mục 3.4; thay `netlify.toml` bằng `_headers`; sửa chữ “Netlify” trong README và chú thích mã. | Trần Đức Tùng | Commit cập nhật. | Theo kế hoạch trong bản báo cáo trước khi chỉnh sửa. |
| 7 | Hoàn thiện nhật ký sử dụng công cụ tuần 4, đối chiếu với commit. | Cả nhóm | `docs/ai-log/tuan-04.md` | Theo kế hoạch trong bản báo cáo trước khi chỉnh sửa. |

## 6. Kính xin ý kiến Thầy

- Lịch điều chỉnh: vá tạm V1/V2 trên hệ thống đang chạy ở tuần 4, bỏ hẳn việc lưu mật khẩu ở tuần 5 (thay vì tuần 2–3 như bảng ban đầu).

- Do tuần 3 nhóm thực hiện sai khi viết báo cáo nên phải viết lại, gây trễ tiến độ.
- Đồng thời, một thành viên trong nhóm có việc gia đình, phải về quê vào các ngày 29/10, 30/10 và 31/10/2026 nên không thể thực hiện các thao tác trên máy tính. Vì vậy, kế hoạch tuần 4 có thể không đạt như kỳ vọng.
- Nhóm kính xin ý kiến Thầy về việc điều chỉnh thời hạn hoàn thành các việc còn lại của tuần 4 cho phù hợp.

## 7. Khai báo công cụ hỗ trợ

- Công cụ: Claude Code (Anthropic).
- Model đã sử dụng: Claude Sonnet 5.5 (`claude-sonnet-5-5`, 20/10–23/10/2026); Claude Opus 5.5 (`claude-opus-5-5`, 24/10/2026).
- Phạm vi sử dụng:
  - Nguyễn Thanh Tùng (20/10–24/10): hỗ trợ lập kế hoạch chia đợt, chuẩn bị gói tệp, tạo nhánh/commit/push phần việc của mình ([C6], [C9], [C10]); đối chiếu mã PR1 trước khi review; phân tích [D3].
  - Trương Thanh Vui: phần mô tả PR1 và PR5 có dòng “Generated with Claude Code”.
  - Mã nguồn trong một số commit tuần 3 được chuẩn bị từ tuần 2 và đã được ghi trong nhật ký tuần 2; tuần 3 đưa các phần đó lên GitHub.
- Công cụ hỗ trợ khác: không dùng.
- Những phần nhóm trực tiếp thực hiện: review và Approve PR; quyết định gộp hoặc gỡ PR; phát hiện hệ thống đang vận hành trên Cloudflare thay vì Netlify; đề xuất điều chỉnh thứ tự các hạng mục; mỗi thành viên commit bằng tài khoản của mình.
- Trương Thanh Vui thực hiện viết lại báo cáo được duyệt bởi Nguyễn Thanh Tùng.

## 8. Danh sách link GitHub

### 8.1. Commit tuần 3

- [C4] b90b200 (Trương Thanh Vui) – chạy Firebase Emulator: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/b90b200e25034195c46854b2bee76de21902a82e
- [C5] 9ad8b07 (Trần Đức Tùng) – logic tính điểm, học phí, chương trình đào tạo và kiểm thử: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/9ad8b070f8a32504a6df1c615ba8d19c07ab0598
- [C6] 089af8b (Nguyễn Thanh Tùng) – README và tài liệu sửa lỗi hồ sơ: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/089af8bda22bcb2c3c94073c94c817d699539769
- [C7] ba2ae6e (Trương Thanh Vui) – sáu trang mới: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/ba2ae6ea70915f8f2c10570f9b4a787b083b854a
- [C8] 1b7fed0 (Trương Thanh Vui) – hoàn tác PR4: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/1b7fed07871e8bf1e01b14c58c6ae157ed7e44e4
- [C9] d0cfea6 (Nguyễn Thanh Tùng) – sửa lỗi hồ sơ, đăng xuất: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/d0cfea67bcd1e0dd0bea08a30bebb1a6a63165a6
- [C10] 11de331 (Nguyễn Thanh Tùng) – vá V2, vá tạm V1, kiểm thử rules: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/11de331a8e50afe1196a12f6cc1d6974c9dc9090
- [C11] 426796b (Trương Thanh Vui) – khôi phục sáu trang mới, sổ điểm và lịch học (việc số 1 tuần 4, 26/10): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/426796b6dc49f53b6aae9bc7218d5b0564120144
- [C12] 7298017 (Trần Đức Tùng) – sơ đồ DFD (ngữ cảnh, mức 0, mức 1, theo chức năng) và Use Case tổng quát (việc số 5 tuần 4, 25/10): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/7298017348adfcdd7d6231fb0b60becc7e9eed1a

### 8.2. Pull Request

- [PR1] Emulator: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/1
- [PR2] Logic tính toán: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/2
- [PR3] README, tài liệu sửa lỗi: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/3
- [PR4] Sáu trang mới: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/4
- [PR5] Gỡ PR4: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/5
- [PR6] Sửa lỗi hồ sơ, vá V2/V1: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/6
- [PR8] Sơ đồ DFD và Use Case (Trần Đức Tùng): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/8
- [PR9] Khôi phục sáu trang mới (Trương Thanh Vui): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/9

### 8.3. Tệp trên `master`

- [F20] README.md: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/README.md
- [F21] utils/firebase.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/utils/firebase.js
- [F22] firebase.json: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/firebase.json
- [F23] package.json: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/package.json
- [F24] scripts/seed-emulator.mjs: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/scripts/seed-emulator.mjs
- [F25] firestore.rules: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/firestore.rules
- [F26] utils/grading.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/utils/grading.js
- [T1] tests/firestore.rules.test.mjs: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/tests/firestore.rules.test.mjs
- [T2] tests/logic.test.mjs: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/tests/logic.test.mjs
- [F27] Sáu trang khôi phục (Trương Thanh Vui), ví dụ pages/Tuition.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/pages/Tuition.js
- [F28] Thư mục sơ đồ DFD và Use Case (Trần Đức Tùng): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/tree/master/docs/so%20do

### 8.4. Tài liệu

- [D9] Sửa lỗi 01 – Cập nhật hồ sơ: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/sua-loi/01-cap-nhat-ho-so.md
- [D3] Bảng Giữ / Bỏ / Sửa / Thêm: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/03-giu-bo-sua-them.md
- [R6] Báo cáo tuần 2: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/bao-cao-tuan/tuan-02.md
- [R8] Báo cáo tuần 3 (file này): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/bao-cao-tuan/tuan-03.md
- [R9] Nhật ký sử dụng công cụ tuần 3: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/ai-log/tuan-03.md
