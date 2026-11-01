# Báo cáo tuần 4

**Đề tài:** Xây dựng website quản lý deadline học tập cho sinh viên (sản phẩm: StudyTask)  
**GVHD:** TS. Huỳnh Xuân Phụng  
**Nhóm:**  
- Nguyễn Thanh Tùng (24TX810027)  
- Trần Đức Tùng (24TX810026)  
- Trương Thanh Vui (24TX810021)  

**Thời gian:** 26/10 – 31/10/2026 (cập nhật đến 01/11/2026)  
**Repo GitHub (public):** https://github.com/NguyenThanhTung301020/Nhom-5_Studytask  

---

## Phần 1. Tóm tắt tuần 4

Tuần này nhóm tập trung vào ba việc: kiểm thử, làm bản thử máy chủ và cập nhật tài liệu. Phần lớn kết quả được đưa lên GitHub vào ngày 01/11, tức là **đã quá khung tuần 4 (kết thúc 31/10)**. Nhóm giữ nguyên ngày thực tế để giảng viên tiện đối chiếu.

- **25–26/10:** Trần Đức Tùng đưa sơ đồ DFD và Use Case lên [PR8] (gộp 25/10). Trương Thanh Vui khôi phục sáu trang mới qua [PR9] (gộp 26/10). Cả hai PR được gộp khi chưa có ai Approve.
- **28–29/10:** Trương Thanh Vui chạy `npm run test:rules` (46/46 đạt). Vui viết thêm bộ kiểm thử chuyên sâu 69 ca và công cụ kiểm thử đột biến: có 113 bản đột biến, 110 bản bị phát hiện, 3 bản còn lại là đột biến tương đương. Báo cáo được ghi trên máy Vui và mở thành [PR15] ngày 29/10.
- **01/11:**
  - Nguyễn Thanh Tùng review [PR15], yêu cầu sửa 4 điểm, sau đó Approve và gộp.
  - Nguyễn Thanh Tùng làm bản thử Cloudflare Worker gửi email đặt lại mật khẩu ([PR16]). Thanh Tùng cũng chạy kiểm thử và thử tay các bước [D9] trên máy mình ([PR19]).
  - Trần Đức Tùng chạy kiểm thử và tự thử tay 8 bước [D9] ([PR17]).
  - Trần Đức Tùng cập nhật [D3], thay `netlify.toml` bằng `_headers` và sửa chữ "Netlify" còn sót trong README và chú thích mã ([PR18]).

Mọi bộ test tự động đã chạy trên ba máy đều đạt toàn bộ (mục 4). **Còn hai việc tuần 4 chưa làm được:**
- review bổ sung [PR8], [PR9] trên GitHub;
- deploy `firestore.rules` lên production.

Chi tiết ở mục 3 và mục 5.

---

## Phần 2. Tự đánh giá của các thành viên

### 2.1. Nguyễn Thanh Tùng
Đã hoàn thành bản thử Cloudflare Worker. Cả khi chạy cục bộ lẫn sau khi deploy, Worker đều gửi được thư đặt lại mật khẩu. Kết quả và đề xuất phương án máy chủ cho tuần 5 được ghi trong [PR16]. Trên máy mình, Thanh Tùng đã chạy `test:logic` (42/42), `test:rules` (46/46), `test:rules:deep` (69/69) và thử tay đủ 8 bước [D9] (8/8 đạt) ([PR19]). Thanh Tùng cũng đã review [PR15] của Trương Thanh Vui trên GitHub.

**Chưa làm:**
- review bổ sung [PR9], vốn được giao cho Nguyễn Thanh Tùng trong kế hoạch;
- deploy `firestore.rules` và chuyển mật khẩu sang `userSecrets` (việc 3).

Phương án máy chủ tuần 5 mới dừng ở mức đề xuất, nhóm chưa chốt.

### 2.2. Trần Đức Tùng
Đã đưa sơ đồ DFD và Use Case lên [PR8] ngày 25/10. Trên máy mình, Đức Tùng đã chạy kiểm thử (42/42, 46/46, 69/69 đều đạt) và tự thao tác đủ 8 bước [D9] (8/8 đạt) ([PR17]). Đức Tùng đã cập nhật [D3] theo đề xuất, thêm `_headers`, sửa chữ "Netlify" trong README và chú thích mã ([PR18]), và đã Approve [PR16], [PR19].

**Chưa làm:** [PR8] vẫn chưa có review bổ sung.

### 2.3. Trương Thanh Vui
Đã khôi phục sáu trang qua [PR9] ngày 26/10. Vui đã chạy `test:rules` (46/46), viết bộ kiểm thử chuyên sâu (69/69) cùng công cụ đột biến và ghi báo cáo chi tiết trên máy mình ([PR15]). Sau khi được review, Vui đã bổ sung đủ tệp, điền nhánh Git và thêm nhật ký AI. Vui cũng đã review và gộp [PR16]–[PR19].

**Chưa làm:**
- chạy `test:logic` và thử [D9] trên máy Vui (hai phần này đã được Trần Đức Tùng và Nguyễn Thanh Tùng chạy trên máy của họ);
- deploy `firestore.rules` (việc 3).

---

## Phần 3. Phản hồi nhận xét của giảng viên (báo cáo tuần 3)

1. **Giữ việc đúng tuần.** Những việc làm ngày 01/11 (bản thử Worker, kiểm thử trên hai máy, [D3], `_headers`) đã nằm ngoài khung 26/10–31/10. Nhóm ghi đúng ngày trong báo cáo và nhật ký AI. Từ tuần 5, mỗi hạng mục sẽ có hạn nằm gọn trong tuần của nó (mục 6).
2. **Hạng mục cần thao tác trên máy.** Theo sự đồng ý của giảng viên, các hạng mục cần một thành viên trực tiếp thao tác trên máy được dời sang sau 31/10. Đó là việc 2 trên máy các thành viên còn lại, việc 4 và việc 6. Các phần khác vẫn giữ tiến độ.
3. **Review bổ sung [PR8], [PR9] phải là review thật.** Tính đến ngày 01/11, [PR8] và [PR9] trên GitHub **vẫn chưa có review hay bình luận nào**. Nhóm không xem việc [PR15]–[PR19] đã có Approve là bù cho hai PR này. Review bổ sung được xếp lên đầu danh sách tuần 5 (mục 6), kèm lệnh đã chạy và bình luận ngay trên GitHub.
4. **Deploy rules và vá V1/V2.** `firestore.rules` mới **vẫn chưa được deploy** lên production. Hệ thống đang chạy vẫn lưu mật khẩu trong `user/{uid}` (V1) và vẫn cho người dùng tự sửa `role` (V2). Điều kiện để deploy là kiểm thử xong, và điều kiện này đã đạt ở tuần 4 (mục 4). Vì vậy deploy là việc ưu tiên số một của tuần 5, có biên bản kết quả lưu trong `docs/`.

---

## Phần 4. Kết quả kiểm thử

| Máy | Ngày chạy | `test:logic` | `test:rules` | `test:rules:deep` | Mục 4 của [D9] (thử tay) | Báo cáo |
|---|---|---|---|---|---|---|
| Trương Thanh Vui | 28–29/10 | chưa chạy | 46/46 | 69/69; đột biến: 110/113 bị phát hiện | chưa thử | [PR15] |
| Trần Đức Tùng | 01/11 | 42/42 | 46/46 | 69/69 | 8/8 bước đạt | [PR17] |
| Nguyễn Thanh Tùng | 01/11 | 42/42 | 46/46 | 69/69 | 8/8 bước đạt | [PR19] |

Không có ca nào không đạt. Trên Windows, nhóm gặp hai sự cố môi trường và đã có cách xử lý:
- Đường dẫn có dấu tiếng Việt khiến Java không đọc được `firestore.rules`.
- Thư mục tạm có tên dạng rút gọn khiến Java 21 không mở được kênh nội bộ. Nhóm xử lý bằng tùy chọn `-Djdk.net.unixdomain.tmpdir`.

Hai lưu ý này sẽ được bổ sung vào README trong tuần 5.

**Bản thử Cloudflare Worker** (chi tiết trong `docs/thiet-ke/04-thu-cloudflare-worker-dat-lai-mat-khau.md`)
- Worker gọi `accounts:sendOobCode` trên project Firebase thử `studytask-test`.
- Cả khi chạy cục bộ và sau khi deploy, nhóm đều nhận được thư đặt lại mật khẩu. Thời gian phản hồi khoảng 1,2–1,4 giây, và 5/5 ca kiểm thử của Worker đạt.
- Với email không tồn tại, Worker vẫn trả về `{"ok":true}`. Đây là cơ chế chống dò email của Firebase.
- **Chưa kiểm chứng:** gọi từ trình duyệt thật của ứng dụng (CORS), giới hạn tần suất, hạn mức gói Free và project `sutdytask`.
- Worker thử đang để công khai nên nhóm chưa ghi địa chỉ của nó vào tài liệu.

**Đề xuất phương án máy chủ (chưa chốt):** Với chức năng quên mật khẩu, nhóm đề xuất giữ `sendPasswordResetEmail` ở phía máy khách, vì khóa Web API của Firebase vốn đã công khai. Nhóm chỉ thêm Worker hoặc Cloud Functions khi có việc mà máy khách không làm được, như thao tác quản trị, xử lý bí mật, hoặc giới hạn tần suất theo IP. Nhóm sẽ chốt phương án vào đầu tuần 5.

---

## Phần 5. Việc chưa hoàn thành

- Review bổ sung [PR8] và [PR9] trên GitHub.
- Deploy `firestore.rules` mới lên production, chuyển mật khẩu của Quản trị viên sang `userSecrets` và đăng nhập thử ba vai trò (việc 3 của tuần 4).
- Chốt phương án máy chủ; xóa hoặc giới hạn Worker thử đang để công khai.
- Chạy `test:logic` và thử tay [D9] trên máy Trương Thanh Vui.
- Bổ sung vào README lưu ý về lỗi Emulator trên Windows (đường dẫn có dấu, thư mục tạm của Java 21).
- Kiểm tra lại cấu hình phát hành. Cấu hình cũ (`publish = "."`) phục vụ cả thư mục gốc của repo. Sau khi chuyển sang Cloudflare, nhóm cần kiểm tra để `reset-worker/`, `docs/`, `tests/` không bị công khai ngoài ý muốn.

---

## Phần 6. Kế hoạch tuần 5 (02/11 – 07/11/2026)

Kế hoạch được lập dựa trên nhận xét của giảng viên ở báo cáo tuần 3 và cột "Tuần" trong [D3]. Các mục của tuần 5 theo [D3] gồm: bỏ hẳn việc lưu mật khẩu, bỏ dữ liệu mẫu trên bản đang chạy, sửa rules, bắt đầu Cloud Functions/Trắc nghiệm, và CI/CD. Thứ tự ưu tiên theo [D3] là: bảo mật → đúng nghiệp vụ → chất lượng mã và kiểm thử → tính năng mới. **Những việc còn tồn từ tuần 4 được làm trước.**

| # | Công việc | Người phụ trách | Kết quả cần đạt | Hạn |
|---|---|---|---|---|
| 1 | Review bổ sung [PR8] (sơ đồ DFD, Use Case) và [PR9] (sáu trang khôi phục): chạy mã [PR9] trên Emulator, đối chiếu sơ đồ với mã | Trương Thanh Vui review [PR8]; Nguyễn Thanh Tùng review [PR9] | Review và bình luận trực tiếp trên GitHub, kèm lệnh đã chạy và kết quả; ghi vào phụ lục B của báo cáo tuần 5 | 03/11 |
| 2 | Sao lưu dữ liệu, deploy `firestore.rules` mới lên production, chuyển mật khẩu Quản trị viên sang `userSecrets`, đăng nhập thử 3 vai trò (vá xong V1/V2) | Nguyễn Thanh Tùng, Trương Thanh Vui (một người thao tác, một người xác nhận) | Biên bản từng bước trong `docs/` (lệnh, thời điểm, kết quả); chạy lại kiểm thử rules sau khi deploy | 04/11 |
| 3 | Chốt phương án máy chủ (mục 4); xóa Worker thử khỏi Cloudflare, hoặc đặt `ALLOWED_ORIGIN` và giới hạn tần suất nếu giữ lại | Cả nhóm quyết định; Nguyễn Thanh Tùng thực hiện | Quyết định được ghi vào `docs/thiet-ke/`; Worker thử không còn công khai | 04/11 |
| 4 | Bỏ hẳn việc lưu mật khẩu trong `user/{uid}` (V1) và instance Firebase phụ dùng để đăng nhập ngầm, theo phương án đã chốt | Nguyễn Thanh Tùng, Trương Thanh Vui | Firestore không còn trường mật khẩu; luồng tạo tài khoản và đổi mật khẩu chạy đúng trên Emulator trước, sau đó mới lên production | 06/11 |
| 5 | Bỏ việc tự nạp dữ liệu mẫu và chế độ demo trên bản đang chạy (V6); dữ liệu mẫu chỉ còn được nạp qua script seed trên Emulator | Trương Thanh Vui | Bản đang chạy không ghi dữ liệu mẫu; `npm run seed` vẫn chạy được trên Emulator | 06/11 |
| 6 | Hoàn thiện rules: giới hạn quyền đọc `activities` (V4), kiểm tra trường và kiểu dữ liệu khi ghi; thêm ca kiểm thử tương ứng | Nguyễn Thanh Tùng (rules), Trương Thanh Vui (ca kiểm thử, chạy lại kiểm thử đột biến) | `test:rules`, `test:rules:deep` đạt; các bản đột biến vẫn bị phát hiện; PR có Approve của thành viên khác | 07/11 |
| 7 | Thiết lập CI bằng GitHub Actions để chạy `test:logic` và `test:rules` cho mỗi PR (cần Java cho Emulator) | Trần Đức Tùng | Workflow chạy xanh trên một PR thử; hướng dẫn chạy được ghi vào README | 07/11 |
| 8 | Thiết kế chức năng Trắc nghiệm: tách đáp án ra collection chỉ giáo viên đọc được, điểm do máy chủ ghi (V3, V4). Tuần này chỉ thiết kế, chưa lập trình | Trần Đức Tùng | Tài liệu thiết kế trong `docs/thiet-ke/`; phần lập trình để sang tuần 6 theo [D3] | 07/11 |
| 9 | Chạy `test:logic` và thử tay [D9] trên máy Trương Thanh Vui; bổ sung lưu ý lỗi Emulator trên Windows vào README | Trương Thanh Vui (kiểm thử), Trần Đức Tùng (README) | Có báo cáo bổ sung; README được cập nhật | 05/11 |
| 10 | Hoàn thiện nhật ký sử dụng công cụ tuần 5, đối chiếu với các commit | Cả nhóm | `docs/ai-log/tuan-05.md` | 07/11 |

**Quy ước tuần 5:**
- Mọi PR phải có Approve của một thành viên khác trước khi gộp.
- Không gộp PR trước rồi để review "bổ sung sau".

Việc hoàn thiện Vite + JSX + ESLint (mục 9 của [D3]) được để lại sau tuần 5, đúng theo [D3].

**Xin ý kiến giảng viên:** Nhóm mong giảng viên cho ý kiến về phương án máy chủ ở mục 4. Theo phương án này, chức năng quên mật khẩu được giữ ở phía máy khách, và nhóm chỉ thêm Worker/Cloud Functions khi có việc máy khách không tự làm được.

---

## Phần 7. Khai báo công cụ AI

Trong tuần 4, nhóm sử dụng Claude Code (Anthropic) cho các việc sau:
- chạy và hướng dẫn chạy kiểm thử;
- hướng dẫn và viết mã bản thử Cloudflare Worker;
- hỗ trợ review [PR15];
- cập nhật [D3], `_headers` và README;
- đối chiếu số liệu;
- hỗ trợ soạn tài liệu, trong đó có bản nháp báo cáo này.

Phần thử tay 8 bước [D9] trong các báo cáo kiểm thử do chính các thành viên tự thao tác. Chi tiết từng lần sử dụng, các sai sót của AI và người kiểm tra được ghi trong [R10]. Các PR có mã hoặc tài liệu do AI soạn đều được gắn nhãn `[AI]` và có Approve của thành viên khác.

---

## Phụ lục

### Phụ lục A. Commit và PR trong tuần 4 và đầu tuần 5

| Mã | Commit | Người commit | Ngày | Nội dung | PR |
|---|---|---|---|---|---|
| [C11] | 426796b | Trương Thanh Vui (Thanh-Vui-Minx) | 26/10 | Khôi phục sáu trang mới, sổ điểm và lịch học | [PR9] |
| [C13] | dfe715b | Trương Thanh Vui (Thanh-Vui-Minx) | 29/10 | Báo cáo kiểm thử Firestore rules trên máy Vui | [PR15] |
| [C14] | c551ca4 | Trương Thanh Vui (Thanh-Vui-Minx) | 01/11 | Bộ kiểm thử chuyên sâu, công cụ đột biến, sửa theo review | [PR15] |
| [C15] | 7bcff16 | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 01/11 | Bản thử Cloudflare Worker | [PR16] |
| [C16] | b486452 | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 01/11 | Ghi chú kết quả bản thử, đề xuất phương án máy chủ | [PR16] |
| [C17] | 849f2e0 | Trần Đức Tùng (TranDucTung-24tx810026) | 01/11 | Báo cáo kiểm thử trên máy Trần Đức Tùng | [PR17] |
| [C18] | 9a99ea9 | Trần Đức Tùng (TranDucTung-24tx810026) | 01/11 | Cập nhật [D3], `_headers`, đổi Netlify thành Cloudflare | [PR18] |
| [C19] | 4a8ae2a | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 01/11 | Báo cáo kiểm thử `test:logic`, `test:rules`, [D9] trên máy Nguyễn Thanh Tùng | [PR19] |

### Phụ lục B. Review và gộp PR

| PR | Người mở | Review | Người gộp | Ngày gộp |
|---|---|---|---|---|
| [PR8] Sơ đồ DFD, Use Case | Trần Đức Tùng | **Chưa có** (kế hoạch: Vui review bổ sung trong tuần 5) | Trần Đức Tùng | 25/10 |
| [PR9] Khôi phục sáu trang | Trương Thanh Vui | **Chưa có** (kế hoạch: Nguyễn Thanh Tùng review bổ sung trong tuần 5) | Trương Thanh Vui | 26/10 |
| [PR15] Báo cáo kiểm thử Vui | Trương Thanh Vui | Nguyễn Thanh Tùng (nhận xét, yêu cầu sửa 4 điểm; Approve sau khi sửa) | Nguyễn Thanh Tùng | 01/11 |
| [PR16] Bản thử Worker | Nguyễn Thanh Tùng | Trần Đức Tùng (Approve), Trương Thanh Vui (nhận xét) | Trương Thanh Vui | 01/11 |
| [PR17] Báo cáo kiểm thử Trần Đức Tùng | Trần Đức Tùng | Trương Thanh Vui (nhận xét, Approve) | Trương Thanh Vui | 01/11 |
| [PR18] Cập nhật [D3], `_headers` | Trần Đức Tùng | Trương Thanh Vui (nhận xét, Approve) | Trương Thanh Vui | 01/11 |
| [PR19] Báo cáo kiểm thử Nguyễn Thanh Tùng | Nguyễn Thanh Tùng | Trần Đức Tùng, Trương Thanh Vui (Approve) | Trương Thanh Vui | 01/11 |

### Phụ lục C. Bảng đối chiếu kế hoạch tuần 4

| # | Công việc | Người phụ trách | Kết quả | Minh chứng |
|---|---|---|---|---|
| 1 | Đưa lại sáu trang của PR4 | Trương Thanh Vui (Nguyễn Thanh Tùng review) | Đã khôi phục ngày 26/10; **review bổ sung chưa làm** | [C11], [PR9] |
| 2 | Chạy `test:logic`, `test:rules`; thử tay mục 4 của [D9] | Cả nhóm | Đạt trên hai máy (Trần Đức Tùng, Nguyễn Thanh Tùng), làm ngày 01/11 (sau 31/10). Máy Trương Thanh Vui mới chạy `test:rules`, chưa chạy `test:logic` và [D9] | [PR15], [PR17], [PR19] |
| 3 | Deploy `firestore.rules`, chuyển mật khẩu sang `userSecrets`, đăng nhập thử 3 vai trò | Nguyễn Thanh Tùng, Trương Thanh Vui | **Chưa làm**; chuyển sang việc 2 của tuần 5 | — |
| 4 | Bản thử Cloudflare Worker; chốt phương án máy chủ | Nguyễn Thanh Tùng | Bản thử đạt (01/11); phương án đã đề xuất nhưng **chưa chốt** | [C15], [C16], [PR16], `docs/thiet-ke/04-…` |
| 5 | Sơ đồ luồng dữ liệu | Trần Đức Tùng | Đã đưa lên ngày 25/10; **review bổ sung chưa làm** | [PR8] |
| 6 | Cập nhật [D3]; `_headers`; sửa "Netlify" | Trần Đức Tùng | Đạt (01/11) | [C18], [PR18] |
| 7 | Nhật ký sử dụng công cụ tuần 4 | Cả nhóm | Đạt; nhật ký của ba thành viên được gộp vào một tệp | [R10] |

### Phụ lục D. Danh sách link GitHub

**Pull Request**

- [PR8] Sơ đồ DFD và Use Case: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/8  
- [PR9] Khôi phục sáu trang mới: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/9  
- [PR15] Báo cáo kiểm thử Vui: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/15  
- [PR16] Bản thử Cloudflare Worker: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/16  
- [PR17] Báo cáo kiểm thử Trần Đức Tùng: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/17  
- [PR18] Cập nhật [D3], `_headers`: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/18  
- [PR19] Báo cáo kiểm thử Nguyễn Thanh Tùng: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/19  

**Commit**

- [C11] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/426796b  
- [C13] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/dfe715b  
- [C14] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/c551ca4  
- [C15] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/7bcff16  
- [C16] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/b486452  
- [C17] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/849f2e0  
- [C18] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/9a99ea9  
- [C19] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/4a8ae2a  

**Tài liệu**

- [D3] Bảng Giữ / Bỏ / Sửa / Thêm: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/03-giu-bo-sua-them.md  
- [D9] Sửa lỗi 01 – Cập nhật hồ sơ: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/sua-loi/01-cap-nhat-ho-so.md  
- Báo cáo kiểm thử Vui: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/kiem-thu/B%C3%A1o%20c%C3%A1o%20chi%20ti%E1%BA%BFt%20ki%E1%BB%83m%20th%E1%BB%AD%20Firestore%20Thanh%20Vui.md  
- Báo cáo kiểm thử Trần Đức Tùng: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/kiem-thu/B%C3%A1o%20c%C3%A1o%20chi%20ti%E1%BA%BFt%20ki%E1%BB%83m%20th%E1%BB%AD%20Tr%E1%BA%A7n%20%C4%90%E1%BB%A9c%20T%C3%B9ng.md  
- Báo cáo kiểm thử Nguyễn Thanh Tùng: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/kiem-thu/B%C3%A1o%20c%C3%A1o%20ki%E1%BB%83m%20th%E1%BB%AD%20Thanh%20T%C3%B9ng.md  
- Ghi chú bản thử Worker: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/04-thu-cloudflare-worker-dat-lai-mat-khau.md  
- [R10] Nhật ký sử dụng công cụ tuần 4: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/ai-log/tuan-04.md  
