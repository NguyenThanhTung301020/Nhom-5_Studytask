# Báo cáo tuần 3

**Đề tài:** Xây dựng một website quản lý deadline học tập cho sinh viên (sản phẩm: StudyTask)  
**GVHD:** TS. Huỳnh Xuân Phụng  
**Nhóm:**  
- Nguyễn Thanh Tùng (24TX810027)  
- Trần Đức Tùng (24TX810026)  
- Trương Thanh Vui (24TX810021)  

**Thời gian:** 19/10 – 24/10/2026 (cập nhật đến 27/10/2026)  
**Repo GitHub (public):** https://github.com/NguyenThanhTung301020/Nhom-5_Studytask  

---

## Phần 1. Tóm tắt tuần 3 tính đến thời điểm viết lại báo cáo

Trong tuần 3 (19/10–24/10/2026) và đầu tuần 4 (25–27/10), nhóm đưa mã nguồn từ máy cá nhân lên GitHub tạo Pull Request (PR) và review chéo.

- **21/10:** Trương Thanh Vui đưa Firebase Emulator lên repo ([C4], [PR1]); Trần Đức Tùng đưa logic tính điểm, học phí, chương trình đào tạo và kiểm thử ([C5], [PR2]).
- **22/10:** Nguyễn Thanh Tùng hoàn thiện README và tài liệu sửa lỗi hồ sơ ([C6], [PR3]). Trương Thanh Vui đưa sáu trang mới ([C7], [PR4]); PR4 được gộp chưa qua review, phát sinh lỗi phụ thuộc nên được hoàn tác bằng [PR5] ([C8]).
- **23/10:** Nguyễn Thanh Tùng sửa lỗi cập nhật hồ sơ, đăng xuất, đồng bộ dữ liệu và vá rules V1/V2 ([C9], [C10], [PR6]). Nhóm phát hiện `master` bị hỏng tại commit `dea9dae` do thứ tự gộp PR không phù hợp.
- **25–26/10:** Trần Đức Tùng đưa sơ đồ DFD/Use Case ([C12], [PR8]); Trương Thanh Vui khôi phục sáu trang ([C11], [PR9]). PR8 và PR9 được gộp trước khi có Approve; nhóm đã bật bảo vệ nhánh `master` trên GitHub để người đẩy code và người duyệt phải là hai tài khoản khác nhau, và sẽ review bổ sung hai PR này.

Chi tiết commit, PR, tệp và tài liệu được giữ nguyên trong các phụ lục bên dưới.

---

## Phần 2. Tự đánh giá của các thành viên

### 2.1. Nguyễn Thanh Tùng
Hoàn thành README và tài liệu sửa lỗi hồ sơ qua [PR3]; xử lý các lỗi N1–N9 và viết tài liệu nguyên nhân, nhưng chưa thử tay đầy đủ các bước trong [D9]. Đã vá rules V1/V2 và bổ sung tệp kiểm thử, song chưa chạy test hoặc deploy production. Đã review và Approve [PR1]. Phần code cơ bản hoàn thành, còn kiểm thử và triển khai.

### 2.2. Trần Đức Tùng
Hoàn thành logic tính điểm theo quy chế, học phí, chương trình đào tạo và tệp kiểm thử qua [PR2]. Sơ đồ luồng dữ liệu bị trễ đến 25/10 ([C12], [PR8]). Tham gia rà soát bảng Giữ/Bỏ/Sửa/Thêm; đã Approve [PR3] và [PR5]. Sơ đồ mới hoàn thành đầu tuần 4.

### 2.3. Trương Thanh Vui
Đưa Firebase Emulator lên repo ngày 21/10 ([C4], [PR1]). Sáu trang mới ban đầu được gộp qua [PR4] nhưng gây lỗi và phải hoàn tác bằng [PR5]; đến 26/10 đã khôi phục đủ qua [C11], [PR9]. Đã review [PR2] và [PR6]. Rút kinh nghiệm là cần cẩn trọng hơn khi gộp PR.

---

## Phần 3. Lỗi phát sinh do quá trình gộp PR sai thao tác và rút ra kinh nghiệm

[PR4] thêm sáu trang nhưng `utils/store.js` gọi các hàm chỉ có trong [PR1], trong khi [PR1] chưa vào `master`, gây lỗi import. Nhóm tạo [PR5] để gỡ thay đổi của PR4, nhưng [PR6] lại được gộp trước khi PR5 hoàn tất. `app.js` trong PR6 vẫn import sáu tệp vừa bị xóa: `MonthCalendar.js`, `Tuition.js`, `GradingPolicy.js`, `Curriculum.js`, `Graduation.js` và `Theses.js`. Vì vậy, `master` không chạy được tại commit `dea9dae`.

Sáu trang đã được khôi phục qua [PR9] (commit `426796b`). [PR8] và [PR9] cũng từng được gộp khi chưa có Approve. Nhóm đã bật cấu hình yêu cầu người commit/đẩy code và người duyệt là hai tài khoản khác nhau (từ [PR11], [PR12] đều có Approve trước khi gộp) và sẽ review bổ sung PR8, PR9.

---

## Phần 4. Việc chưa hoàn thành

- Các tệp kiểm thử đã có trên repo nhưng chưa chạy do một số máy thiếu Node.js và Java.
- `firestore.rules` mới chưa được deploy production. Hệ thống đang chạy vẫn lưu mật khẩu trong `user/{uid}` (lỗ hổng V1) và cho phép người dùng tự sửa trường `role` (lỗ hổng V2).
- Sơ đồ luồng dữ liệu bị trễ sang tuần 4 (đã upload ngày 25/10 qua [PR8]); sáu trang mới khôi phục ngày 26/10 qua [PR9].
- Trong tuần 3, tài khoản Cloudflare chỉ do một thành viên giữ; đến cuối tuần đã cấp quyền cho cả ba thành viên.
- Phương án và chi phí máy chủ chưa được chốt.

Đối chiếu chi tiết với kế hoạch tại Phụ lục C.

---

## Phần 5. Kế hoạch tuần 4 và đề nghị gửi giảng viên

Sáu trang (ngày 26/10) và sơ đồ DFD (ngày 25/10) đã được đưa lên đầu tuần 4. Ưu tiên còn lại của tuần 4: review bổ sung PR8 và PR9, chạy kiểm thử, deploy rules mới lên production. Nhóm đề xuất vá tạm V1/V2 trên hệ thống đang chạy trong tuần 4, chuyển việc loại bỏ hoàn toàn lưu mật khẩu sang tuần 5 vì rules chưa kịp được kiểm thử và deploy trong tuần 3.

Nhóm nhận lỗi vì báo cáo tuần 3 phải nộp lại nhiều lần, ảnh hưởng tiến độ. Một thành viên có việc gia đình và không thể thao tác trên máy tính vào các ngày 29–31/10/2026; nhóm xin ý kiến giảng viên về việc điều chỉnh hạn hoàn thành các hạng mục tuần 4.

---

## Phần 6. Khai báo công cụ AI

Nhóm sử dụng Claude Code (Anthropic): Claude Sonnet 5.5 trong giai đoạn 20/10–23/10 và Claude Opus 5.5 từ 24/10. AI hỗ trợ lập kế hoạch chia việc, chuẩn bị nội dung commit, đối chiếu code trước review và phân tích bảng tính năng; ngày 24/10, AI đối chiếu lịch sử commit, PR trên GitHub và chỉ ra `master` lỗi import sáu trang. Từ 25/10–27/10, AI đối chiếu số liệu, mã commit, link trong báo cáo với GitHub, sửa các câu trạng thái và bảng phụ lục bị lệch so với GitHub (nhóm đã kiểm tra lại), và hướng dẫn điền form; nội dung chính của báo cáo do nhóm viết. Một số mô tả PR có dòng “Generated with Claude Code”. Báo cáo do nhóm tự viết; việc review, quyết định gộp/hoàn tác PR và phát hiện sự cố kỹ thuật do nhóm thực hiện.

---

## Phụ lục

### Phụ lục A. Bảng lịch sử commit

| Mã | Commit | Người commit (tài khoản GitHub) | Ngày | Nội dung tóm tắt | PR |
|---|---|---|---|---|---|
| [C4] | b90b200 | Trương Thanh Vui (Thanh-Vui-Minx) | 21/10 | Chạy Firebase Emulator trên máy local (đợt 1). | [PR1] |
| [C5] | 9ad8b07 | Trần Đức Tùng (TranDucTung-24tx810026) | 21/10 | Logic tính điểm, học phí, chương trình đào tạo và kiểm thử (đợt 1). | [PR2] |
| [C6] | 089af8b | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 22/10 | README và tài liệu sửa lỗi hồ sơ. | [PR3] |
| [C7] | ba2ae6e | Trương Thanh Vui (Thanh-Vui-Minx) | 22/10 | Sáu trang mới, sổ điểm và lịch học (đợt 2). | [PR4] |
| [C8] | 1b7fed0 | Trương Thanh Vui (Thanh-Vui-Minx) | 22/10 | Hoàn tác thay đổi của PR4. | [PR5] |
| [C9] | d0cfea6 | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 23/10 | Sửa lỗi cập nhật hồ sơ, đăng xuất và đồng bộ dữ liệu theo tài khoản. | [PR6] |
| [C10] | 11de331 | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 23/10 | Vá quy tắc V2, vá tạm V1 và bổ sung kiểm thử rules. | [PR6] |
| [C12] | 7298017 | Trần Đức Tùng (TranDucTung-24tx810026) | 25/10 | Sơ đồ DFD (ngữ cảnh, mức 0, mức 1) và Use Case tổng quát. | [PR8] |
| [C11] | 426796b | Trương Thanh Vui (Thanh-Vui-Minx) | 26/10 | Khôi phục sáu trang mới, sổ điểm và lịch học. | [PR9] |

### Phụ lục B. Bảng review và gộp PR

| PR | Người mở | Người review (Approve) | Người gộp | Ngày gộp |
|---|---|---|---|---|
| [PR1] Emulator | Trương Thanh Vui | Nguyễn Thanh Tùng | Nguyễn Thanh Tùng | 23/10 |
| [PR2] Logic tính toán | Trần Đức Tùng | Trương Thanh Vui | Trương Thanh Vui | 22/10 |
| [PR3] README, tài liệu sửa lỗi | Nguyễn Thanh Tùng | Trần Đức Tùng | Trần Đức Tùng | 22/10 |
| [PR4] Sáu trang mới | Trương Thanh Vui | Không có review | Trương Thanh Vui | 22/10 |
| [PR5] Gỡ PR4 | Trương Thanh Vui | Trần Đức Tùng | Trần Đức Tùng | 23/10 |
| [PR6] Sửa lỗi hồ sơ, vá V2/V1 | Nguyễn Thanh Tùng | Trương Thanh Vui | Trương Thanh Vui | 23/10 |
| [PR8] Sơ đồ DFD và Use Case | Trần Đức Tùng | Chưa có (gộp trước khi review; sẽ review bổ sung) | Trần Đức Tùng | 25/10 |
| [PR9] Khôi phục sáu trang | Trương Thanh Vui | Chưa có (gộp trước khi review; sẽ review bổ sung) | Trương Thanh Vui | 26/10 |

### Phụ lục C. Bảng đối chiếu kế hoạch tuần 3

| # | Công việc | Người phụ trách | Kết quả | Minh chứng |
|---|---|---|---|---|
| 1 | Viết README (cấu trúc thư mục, cách chạy, quy ước nhánh và commit). | Nguyễn Thanh Tùng | Đạt. | [F20], commit [C6], [PR3] |
| 2 | Review mã chạy Emulator rồi commit. | Trương Thanh Vui (Nguyễn Thanh Tùng review) | Đạt một phần: đã có mã trên GitHub, đã review và gộp; chưa có kết quả chạy thử được ghi lại. | [F21]–[F24], commit [C4], [PR1] |
| 3 | Sửa lỗi “gửi yêu cầu cập nhật hồ sơ”. | Nguyễn Thanh Tùng (Trương Thanh Vui review) | Đạt một phần: có commit sửa N1–N9 và tài liệu nguyên nhân; chưa thử tay các bước ở mục 4 của [D9]. | [D9], commit [C9], [PR6] |
| 4 | Vá V2, vá tạm V1 trong `firestore.rules`, có kiểm thử tự động. | Nguyễn Thanh Tùng (Trương Thanh Vui review) | Đạt một phần: có commit rules và tệp kiểm thử; chưa chạy `npm run test:rules`; rules chưa deploy lên production. | [F25], [T1], commit [C10], [PR6] |
| 5 | Vẽ sơ đồ luồng dữ liệu do nhóm tự thực hiện. | Trần Đức Tùng | Chưa đạt trong tuần 3; đã upload ngày 25/10 (xem Phụ lục D, mục 5). | commit [C12], [PR8], [F28] |
| 6 | Rà soát tính năng theo bảng Giữ/Bỏ/Sửa/Thêm [D3]. | Cả nhóm | Đạt một phần: đã phân tích và đề xuất lịch mới; chưa cập nhật tệp [D3]. | — |
| 7 | Hoàn thiện nhật ký sử dụng công cụ tuần 3, đối chiếu với commit. | Cả nhóm (Nguyễn Thanh Tùng tổng hợp) | Đạt. | [R9] |
| 7b | Phần tính toán (điểm theo quy chế, học phí, chương trình đào tạo) và sáu trang phát sinh từ tuần 2. | Trần Đức Tùng (tính toán), Trương Thanh Vui (trang) | Phần tính toán đã gộp. Sáu trang đã được gộp rồi gỡ trong tuần 3; đã khôi phục ngày 26/10 (xem Phụ lục D, mục 1). | [F26], [T2], commit [C5], [C11], [PR2], [PR4], [PR5], [PR9] |
| 8 | Tổng hợp việc báo cáo tuần. | Cả nhóm | Viết lại theo góp ý của Thầy. | — |

### Phụ lục D. Bảng kế hoạch tuần 4 (26/10 – 31/10/2026)

| # | Công việc | Người phụ trách | Kết quả cần đạt | Trạng thái khi nộp báo cáo tuần 3 |
|---|---|---|---|---|
| 1 | Đưa lại sáu trang của PR4 thông qua việc hoàn tác hoặc upload lại file. | Trương Thanh Vui (Nguyễn Thanh Tùng review) | Khôi phục đủ `MonthCalendar.js`, `Tuition.js`, `GradingPolicy.js`, `Curriculum.js`, `Graduation.js`, `Theses.js`; ứng dụng mở trên Emulator không lỗi import; có PR và commit khôi phục để đối chiếu. | **Đã up load vào 26/10** ([C11], [PR9], [F27]). Tuy nhiên gộp khi chưa có Approve; nhóm sẽ review bổ sung. |
| 2 | Chạy `npm run test:logic`, `npm run test:rules`; thử tay các bước ở mục 4 của [D9]. | Cả nhóm (mỗi người chạy trên máy mình) | Ghi kết quả chạy trong `docs/`, kèm số ca đạt/không đạt. | Theo kế hoạch |
| 3 | Sau khi hoàn tất kiểm thử và sao lưu: deploy `firestore.rules` mới lên production, Quản trị viên chuyển mật khẩu sang `userSecrets`, rồi mới upload mã lên Cloudflare. | Nguyễn Thanh Tùng, Trương Thanh Vui | Biên bản các bước trong `docs/`; đăng nhập thử 3 vai trò. | Theo kế hoạch |
| 4 | Làm bản thử Cloudflare Worker: tạo tài khoản và gửi email đặt lại mật khẩu qua Identity Toolkit trên project thử. | Nguyễn Thanh Tùng | Commit bản thử và ghi chú kết quả; chốt phương án máy chủ cho tuần 5. | Theo kế hoạch |
| 5 | Vẽ sơ đồ luồng dữ liệu do nhóm tự thực hiện. | Trần Đức Tùng | Sơ đồ trong `docs/so do/`. | **Đã up load vào 25/10** ([C12], [PR8], [F28]). Tuy nhiên gộp khi chưa có Approve; nhóm sẽ review bổ sung. |
| 6 | Cập nhật [D3] theo đề xuất; thay `netlify.toml` bằng `_headers`; sửa chữ “Netlify” trong README và chú thích mã. | Trần Đức Tùng | Commit cập nhật. | Theo kế hoạch |
| 7 | Hoàn thiện nhật ký sử dụng công cụ tuần 4, đối chiếu với commit. | Cả nhóm | `docs/ai-log/tuan-04.md` | Theo kế hoạch |

### Phụ lục E. Danh sách link GitHub

**Commit tuần 3 và đầu tuần 4**

- [C4] b90b200 (Trương Thanh Vui) – chạy Firebase Emulator: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/b90b200e25034195c46854b2bee76de21902a82e  
- [C5] 9ad8b07 (Trần Đức Tùng) – logic tính điểm, học phí, chương trình đào tạo và kiểm thử: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/9ad8b070f8a32504a6df1c615ba8d19c07ab0598  
- [C6] 089af8b (Nguyễn Thanh Tùng) – README và tài liệu sửa lỗi hồ sơ: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/089af8bda22bcb2c3c94073c94c817d699539769  
- [C7] ba2ae6e (Trương Thanh Vui) – sáu trang mới: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/ba2ae6ea70915f8f2c10570f9b4a787b083b854a  
- [C8] 1b7fed0 (Trương Thanh Vui) – hoàn tác PR4: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/1b7fed07871e8bf1e01b14c58c6ae157ed7e44e4  
- [C9] d0cfea6 (Nguyễn Thanh Tùng) – sửa lỗi hồ sơ, đăng xuất: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/d0cfea67bcd1e0dd0bea08a30bebb1a6a63165a6  
- [C10] 11de331 (Nguyễn Thanh Tùng) – vá V2, vá tạm V1, kiểm thử rules: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/11de331a8e50afe1196a12f6cc1d6974c9dc9090  
- [C11] 426796b (Trương Thanh Vui) – khôi phục sáu trang mới: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/426796b6dc49f53b6aae9bc7218d5b0564120144  
- [C12] 7298017 (Trần Đức Tùng) – sơ đồ DFD và Use Case: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/7298017348adfcdd7d6231fb0b60becc7e9eed1a  

**Pull Request**

- [PR1] Emulator: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/1  
- [PR2] Logic tính toán: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/2  
- [PR3] README, tài liệu sửa lỗi: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/3  
- [PR4] Sáu trang mới: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/4  
- [PR5] Gỡ PR4: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/5  
- [PR6] Sửa lỗi hồ sơ, vá V2/V1: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/6  
- [PR8] Sơ đồ DFD và Use Case: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/8  
- [PR9] Khôi phục sáu trang mới: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/9  
- [PR11] Cập nhật báo cáo tuần 3: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/11  
- [PR12] Sửa báo cáo tuần 3 và nhật ký AI tuần 3: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/12  

**Tệp trên master**

- [F20] README.md: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/README.md  
- [F21] utils/firebase.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/utils/firebase.js  
- [F22] firebase.json: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/firebase.json  
- [F23] package.json: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/package.json  
- [F24] scripts/seed-emulator.mjs: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/scripts/seed-emulator.mjs  
- [F25] firestore.rules: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/firestore.rules  
- [F26] utils/grading.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/utils/grading.js  
- [T1] tests/firestore.rules.test.mjs: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/tests/firestore.rules.test.mjs  
- [T2] tests/logic.test.mjs: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/tests/logic.test.mjs  
- [F27] Sáu trang khôi phục (ví dụ pages/Tuition.js): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/pages/Tuition.js  
- [F28] Thư mục sơ đồ DFD và Use Case: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/tree/master/docs/so%20do  

**Tài liệu**

- [D9] Sửa lỗi 01 – Cập nhật hồ sơ: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/sua-loi/01-cap-nhat-ho-so.md  
- [D3] Bảng Giữ / Bỏ / Sửa / Thêm: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/03-giu-bo-sua-them.md  
- [R6] Báo cáo tuần 2: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/bao-cao-tuan/tuan-02.md  
- [R9] Nhật ký sử dụng công cụ tuần 3: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/ai-log/tuan-03.md  