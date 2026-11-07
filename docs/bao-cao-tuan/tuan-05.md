# Báo cáo tuần 5

**Đề tài:** Xây dựng website quản lý deadline học tập cho sinh viên (sản phẩm: StudyTask)  
**GVHD:** TS. Huỳnh Xuân Phụng  
**Nhóm:**  
- Nguyễn Thanh Tùng (24TX810027)  
- Trần Đức Tùng (24TX810026)  
- Trương Thanh Vui (24TX810021)  

**Thời gian:** 02/11 – 07/11/2026 (số liệu đến 06/11/2026, cập nhật lại trước khi nộp)  
**Repo GitHub (public):** https://github.com/NguyenThanhTung301020/Nhom-5_Studytask  

---

## Phần 1. Tóm tắt tuần 5

Việc lớn nhất của tuần 5 là chuyển web khỏi Firebase sang máy chủ riêng của nhóm, gồm API Python, SQLite, nginx và Cloudflare Tunnel ([PR26], [D06]). Nhóm đổi hướng vì muốn vá triệt để V1 và V2 thì nghiệp vụ nhạy cảm phải chạy ở máy chủ, trong khi Cloud Functions của Firebase chỉ dùng được ở gói Blaze, phải bật thanh toán. Việc này **thay thế** việc 2 của kế hoạch tuần 5: nhóm không deploy `firestore.rules`, không chuyển mật khẩu sang `userSecrets`. Phương án máy chủ riêng vẫn đang chờ ý kiến của thầy (mục 6).

- **03–04/11:** Trần Đức Tùng đưa lên CI ([PR22]), thiết kế Trắc nghiệm ([PR24]) và mục lỗi Windows trong README ([PR25]). Trương Thanh Vui bỏ tự nạp dữ liệu mẫu ([PR23]), đưa bản chuyển máy chủ lên [PR26], viết tài liệu email cá nhân ([PR27]) và sửa ảnh đại diện ([PR28]).
- **05–06/11:** Trương Thanh Vui khóa sửa hồ sơ ([PR29]), viết báo cáo vận hành ([PR32], [PR33]), bật sao lưu tự động và dọn phần giao diện còn sót của V1 ([PR34]). Nguyễn Thanh Tùng vá một phần V4 ([PR31]) và gỡ Worker thử khỏi Cloudflare.
- **Chiều 06/11:** Trương Thanh Vui có báo cáo `test:logic` và thử [D9] trên máy mình ([PR35]). Nguyễn Thanh Tùng gỡ project Firebase `sutdytask` ([PR36], dữ liệu còn khôi phục được đến 06/12), sửa 4 điểm tìm thấy khi kiểm tra PR9 ([PR37]) rồi cập nhật review trên [PR9] kèm lệnh và kết quả.

CI chạy từ 03/11, đạt 35/35 lượt, tính đến 06/11 17:55. Lập trình V3 **không thuộc tuần 5**: kế hoạch tuần 5 chỉ yêu cầu thiết kế, lập trình là tuần 6 theo [D3].

Ngoài 10 việc của kế hoạch, nhóm còn làm email cá nhân, sửa ảnh đại diện, khóa sửa hồ sơ, báo cáo vận hành và sao lưu tự động. Đây là hệ quả của việc chuyển máy chủ hoặc do nhóm làm sớm, nên khối lượng ngoài kế hoạch khá lớn so với nhận xét của thầy là tập trung việc tồn đọng (mục 3).

**Còn hai việc của tuần 5 chưa hoàn thành:**
- sửa sơ đồ theo review PR8;
- vá nốt 3 điểm của V4, nhóm dời sang tuần 6 cùng việc thiết kế lại Trắc nghiệm;

Ngoài ra, ngày 06/11 có sự cố script cũ ghi đè bản đang chạy (mục 4): giao diện đã triển khai lại, nhưng API chưa xác nhận đã cài lại và [PR37] chưa được triển khai.

---

## Phần 2. Tự đánh giá của các thành viên

### 2.1. Nguyễn Thanh Tùng

Đã vá một phần V4 ở [PR31]: giới hạn quyền đọc `activities`, kiểm tra trường và kiểu dữ liệu khi ghi, ở cả `firestore.rules` và `can()`. Kết quả trên máy mình: `test_activities.py` 99/99, `test:rules` 53/53, `test:rules:deep` 128/128, đột biến 411/413. Thanh Tùng đã gỡ Worker thử khỏi Cloudflare và gỡ project Firebase `sutdytask` trên Console (06/11 17:23), có biên bản ở [PR36]. Thanh Tùng cũng sửa 4 điểm tìm thấy khi kiểm tra PR9 ([PR37]), kèm ca kiểm thử mới.

Về review: [PR25], [PR27], [PR28] có nhận xét cụ thể trên GitHub. Review bổ sung [PR9] đã có 4 điểm cần sửa, lệnh đã chạy và kết quả; nội dung này được cập nhật sau khi [PR37] đã gộp, nên thứ tự chưa đúng là review trước, sửa sau. [PR26] có 2.613 dòng thêm và 37 tệp nhưng chỉ ghi "đã xem và gộp"; theo nhật ký AI, lần đọc diff khi đó chưa đọc `server/studytask_api.py`. [PR33], [PR34], [PR35] được Approve với nhận xét một dòng rồi gộp ngay.

**Chưa làm:**
- vá nốt 3 điểm của V4 và thử trang Quản lý lớp học bằng tài khoản giáo viên;
- thử đăng nhập và lưu dữ liệu trên web thật sau khi gỡ Firebase.

Commit `64d0631` của [PR31] có AI viết mã nhưng thiếu nhãn `[AI]`.

### 2.2. Trần Đức Tùng

Đã đưa CI GitHub Actions lên [PR22], chạy `test:logic` và `test:rules` cho mỗi PR; đến 06/11 17:55, CI đạt 35/35 lượt. Đức Tùng hoàn thành thiết kế Trắc nghiệm ([PR24], [D05]) đúng yêu cầu của tuần 5 và bổ sung mục lỗi Emulator trên Windows vào README ([PR25]). Sau review của Nguyễn Thanh Tùng, Đức Tùng đã sửa lại README bằng [C-RM2]. Đức Tùng đã Approve [PR23], [PR29], [PR30], [PR32], chủ yếu với nhận xét "đã xem".

**Chưa làm:**
- sửa các lỗi sơ đồ theo review [PR8]; sơ đồ chưa đổi từ 25/10 và vẫn vẽ theo Firebase;
- cập nhật [D05] theo máy chủ riêng; thiết kế làm trước khi đổi hướng nên còn viết theo Firestore và Worker, việc này nằm trong kế hoạch tuần 6.

### 2.3. Trương Thanh Vui

Đã chuyển hệ thống sang máy chủ riêng ([PR26], [D06]), gồm API Python, giao diện gọi API, kiểm thử máy chủ và job CI. Thanh Vui cũng bỏ tự nạp dữ liệu mẫu ([PR23]), viết tài liệu email cá nhân ([PR27]), sửa ảnh đại diện ([PR28]), khóa sửa hồ sơ ([PR29], [PR30]) và dọn phần giao diện còn sót của V1 ([PR34]). Về vận hành, Thanh Vui viết báo cáo sức khỏe máy chủ ([PR32], [PR33]) và bật sao lưu tự động, thử khôi phục đạt.

Trên máy mình, Thanh Vui đã có kết quả `test:logic` 42/42, `test_profile_lock.py` 18/18 và thử [D9] bản máy chủ 8/8 bước ([PR35]); các bước trên giao diện do AI thao tác. Thanh Vui đã review bổ sung [PR8] với bình luận chi tiết nhưng không có lệnh chạy, Approve [PR31] kèm ghi nhận V4 chưa vá hết, và Approve [PR36], [PR37] với nhận xét ngắn.

**Chưa làm:**
- tự thử tay [D9] để xác nhận, vì báo cáo [PR35] ghi rõ lần thử do AI thao tác không thay cho lần thử của thành viên;
- xác nhận đã cài lại API sau sự cố ghi đè 06/11 và xử lý script cũ `~/migration/install-api.sh` (mục 4);
- chép bản sao lưu ra ngoài ổ vật lý của máy chủ;
- ghi phần dữ liệu khác nhau giữa máy chủ và Firebase; hạn trước 06/12, khi project cũ còn khôi phục được.

---

## Phần 3. Phản hồi nhận xét của giảng viên

| Yêu cầu của thầy | Thực tế tuần 5 | Minh chứng |
|---|---|---|
| Review PR8, PR9 là review thật, có lệnh và bình luận | PR8 có bình luận chi tiết, không có lệnh, lỗi sơ đồ chưa sửa. PR9 trên GitHub đã có review kèm 4 điểm cần sửa, lệnh đã chạy và kết quả (06/11); 4 điểm đã sửa ở [PR37]. Bình luận được cập nhật sau khi [PR37] gộp; bảng kết quả các ca thử quyền nằm ở mục 4 của báo cáo này, chưa có trong bình luận | [PR8], [PR9], [PR37] |
| Vá xong V1, V2 và ghi kết quả | Vá bằng cách chuyển máy chủ, không deploy rules (việc 2 được thay thế). Mật khẩu chỉ lưu băm; `can()` chặn tự sửa quyền. Phần giao diện còn sót (cột "Mật khẩu", nút đổi mật khẩu của Admin luôn bị khóa) đã được dọn ở [PR34], gộp 06/11 15:44 | [D06], `tests/server/test_users.py`, `tests/server/test_profile_lock.py`, [PR34] |
| Mỗi PR ghi rõ phụ thuộc | [PR26], [PR28] không ghi, dẫn tới review nhầm ở [PR28] | [PR28] |
| Không gộp PR chưa có Approve | PR tuần này đều có Approve trước khi gộp. [PR22], [PR24], [PR26], [PR32], [PR33], [PR34], [PR35], [PR36], [PR37] Approve rồi gộp trong vòng một phút, không có nhận xét thực chất | Phụ lục B |
| Có link trực tiếp tới commit, PR, tệp | Có ở phụ lục D | Phụ lục D |
| Tập trung việc tồn đọng, không mở thêm chức năng | Chưa đạt 1 một phần : Tuần 6 phát sinh nhiều việc không thuộc kế hoạch tuy nhiên nhóm đã được xác nhận là báo cáo trong vòng 15 tuần nên nhìn chung kế hoạch tổng thể không bị trễ quá nhiều . | [D06] mục 1, 3 |

---

## Phần 4. Kết quả kiểm thử và vận hành

| Bộ kiểm thử | Kết quả | Nơi chạy |
|---|---|---|
| `test:logic` | 49/49 sau [PR37] (thêm 7 ca; trước đó 42/42) | Máy Nguyễn Thanh Tùng (06/11, `53875ee`; 42/42 trên `83e1316`, `f952981`); máy Trương Thanh Vui 42/42 (06/11, `83e1316`, [PR35]); CI |
| `test:rules` | 53/53 (trước đó 46) | Máy Nguyễn Thanh Tùng; CI |
| `test:rules:deep` | 128/128 (trước đó 69) | Máy Nguyễn Thanh Tùng; không nằm trong CI |
| Đột biến rules | 411/413; 2 bản còn sống được đánh giá là tương đương. Chạy 416 bản, bỏ 3 bản không hợp lệ, chạy lại 5 bản nghi vấn | Máy Nguyễn Thanh Tùng; không nằm trong CI |
| `test_activities.py` | 99/99; trên `can()` cũ có 67 ca không đạt | Máy Nguyễn Thanh Tùng (06/11, `83e1316`, `f952981`, Python 3.12.10); CI |
| `test_account.py`, `test_profile_lock.py`, `test_users.py`, `test_migrate.py` | 46/46, 18/18, 13/13, 8/8 | Máy chủ StudyTask (Trương Thanh Vui chạy ngày 04–06/11, đo trực tiếp trên bản mới); máy Nguyễn Thanh Tùng (06/11, `83e1316`, `f952981`); CI |
| `test_submit.sh` | 10/10 | Máy Nguyễn Thanh Tùng (06/11, `83e1316`, mã của [PR37]); CI |
| `test_graduation.py` (mới ở [PR37]) | 15/15 | Máy Nguyễn Thanh Tùng (06/11, `53875ee`); CI |
| Thử quyền các trang của [PR9] trên API thật, dữ liệu tạm | 10 ca từ chối đúng (403); Đào tạo được ghi `gradingPolicies`, duyệt phiếu không mất dữ liệu; máy chủ nhận `evidence = javascript:…` và giá trị CSV bắt đầu bằng `=`, `@`. Đã sửa ở [PR37]: máy chủ từ chối link không phải `http(s)` với sinh viên; giá trị CSV vẫn được nhận nhưng bị vô hiệu hóa lúc xuất | Máy Nguyễn Thanh Tùng, 06/11 |
| Thử giao diện 4 điểm của [PR37] | Bớt môn còn lịch: báo lỗi, không xóa. Mở môn nằm ở 2 module: tạo 1 môn. CSV có dấu `'` trước công thức. Link `javascript:` không hiện; form sinh viên báo lỗi. Không có lỗi console. Chưa mở CSV bằng Excel | Máy Nguyễn Thanh Tùng, máy chủ tạm, AI thao tác trên trình duyệt, 06/11 |
| Thử giao diện bản máy chủ (thay cho bước thử [D9] trên Emulator) | Đạt 8/8 bước, xem mục "Thử [D9]" dưới đây. Thanh Vui chưa tự thử tay | Máy Trương Thanh Vui, máy chủ tạm, AI thao tác trên trình duyệt, 06/11 ([PR35]) |
| CI trên GitHub | 35/35 lượt thành công (tính đến 06/11 17:55) | GitHub Actions |

**Thử [D9] bản máy chủ (06/11, [PR35]).** Các bước của [D9] viết cho Emulator và Firebase (ví dụ "Đã lưu lên Firebase", mở Emulator UI), nên không còn chạy nguyên văn được. Phiên bản tương ứng cho máy chủ, chạy trên giao diện với máy chủ tạm và dữ liệu tạm, chưa thử qua nginx và Cloudflare Tunnel. Toàn bộ các bước do AI thao tác trên trình duyệt, không thay cho lần thử tay của thành viên.

| Bước | Kết quả |
|---|---|
| Sinh viên đăng nhập, vào Hồ sơ | Không còn dữ liệu mẫu (MSSV `2021001234`, GPA `3.20`); các trường "Chưa cập nhật" |
| Admin sửa họ tên = khoảng trắng, bấm Lưu | Báo "Họ và tên không được để trống."; tên trên máy chủ không đổi. Sinh viên không có ô họ tên, chỉ có 2 ô email và số điện thoại ([PR29]) |
| Số điện thoại `12ab`; email `khong-phai-email` | Báo "Số điện thoại không hợp lệ (VD: 0901234567).", "Email không hợp lệ." |
| Nhập đúng rồi lưu | Hiện "Đã lưu lên máy chủ"; `phone` đổi ở `user` và `userData.profile`; `email` đổi ở `userData.profile` |
| Máy chủ chậm: giữ yêu cầu ghi 15 giây | Sau 10,1 giây báo "Lưu thất bại – thử lại: Máy chủ chưa phản hồi…", không treo. Tuy nhiên yêu cầu đầu vẫn tới máy chủ nên `userData` có số mới còn `user` giữ số cũ (lỗi nhỏ, [PR35] mục 4.1) |
| API tắt, bấm Lưu | Sau 2,1 giây báo "Lưu thất bại – thử lại: Lỗi máy chủ (502)", không treo |
| Đăng xuất rồi tải lại trang | Ở lại màn hình đăng nhập |
| Đăng nhập giáo viên, rồi Admin, trên cùng trình duyệt | Hồ sơ riêng theo vai trò, không có dữ liệu của sinh viên trước |

**Vận hành, đo 06/11** ([D-VH]): chạy liên tục 1 ngày 20 giờ từ lần khởi động 04/11 (chủ động dời máy chủ); ba dịch vụ không tự khởi động lại; RAM 576 MiB/7,2 GiB; ổ đĩa 3%; toàn vẹn cơ sở dữ liệu `ok`; không có lỗi 500/502/503 (chỉ 1 mã 501 do một yêu cầu `HEAD`). Sau lần đo, ngày 06/11 đã bật **sao lưu tự động** hằng ngày (thử khôi phục đạt) và đọc được SMART: ổ báo `PASSED` nhưng các chỉ số 187 (1.650), 188 (1.624), 191 (3.682) cao, cần theo dõi ở mốc 13/11 và 21/11. Rủi ro còn lại: bản sao lưu nằm cùng ổ vật lý.

**Chưa kiểm chứng:** luồng email thật trên giao diện web ([D07] mục 5); trang Quản lý lớp học bằng tài khoản giáo viên sau khi vá V4; đăng nhập và lưu dữ liệu trên web thật sau khi gỡ Firebase.

**Sự cố triển khai 06/11 (đã phát hiện khi đối chiếu).** Lúc 13:19 (giờ Việt Nam) ngày 06/11, script cài đặt cũ `~/migration/install-api.sh` được chạy lại trên máy chủ, ghi đè API và giao diện bằng bản cũ của 03/11. Hệ quả: máy chủ đang chạy **chưa có** khóa sửa hồ sơ ([PR29]), sửa avatar và chữ "máy chủ" ([PR28]) và bản vá V4 ([PR31]); so với `master`, tệp API khác 115 dòng, `AccountManager.js`, `Profile.js`, `app.js` cũng khác. **Xử lý:** giao diện đã được triển khai lại lúc 06/11 15:18 (đối chiếu hash 5 tệp chính khớp với repo; gồm `master` và thay đổi dọn V1 của [PR34], khi đó chưa gộp, đã gộp lúc 15:44; có bản sao lưu bản cũ trước khi ghi). Phần API chưa cài lại: bản mới đã chuẩn bị sẵn tại `~/api-staged/` và cần chạy `sudo bash ~/api-staged/install.sh`. Cho đến lúc đó, khóa sửa hồ sơ và bản vá V4 chưa có hiệu lực ở máy chủ. Script cũ `~/migration/install-api.sh` vẫn còn nên có nguy cơ chạy nhầm lại. **Đối chiếu từ bên ngoài chiều 06/11:** `app.js`, `style.css`, `utils/firebase.js`, `AccountManager.js`, `Profile.js`, `Graduation.js` trên web thật trùng hash với `master` tại `f952981`; `index.html` chỉ khác ở đường dẫn phiên bản `v202611061518/`. Phiên bản API không kiểm tra được từ bên ngoài, nên chưa xác nhận đã cài lại. **[PR37] chưa được triển khai:** lúc 17:56, `utils/sanitize.js` trên web thật trả 404 và `Graduation.js` vẫn là bản cũ.

---

## Phần 5. Đối chiếu với công việc trong kế hoạch tuần 5

Chia theo nguồn gốc của việc để không lẫn khối lượng của tuần 5 với việc phát sinh.

### 5.1. Đối chiếu việc thuộc kế hoạch tuần 5

| Việc (số trong kế hoạch tuần 5) | Tình trạng | Ghi chú |
|---|---|---|
|Review PR9 | **Đạt trên GitHub, còn thiếu một phần kết quả:** bình luận trên [PR9] đã có 4 điểm cần sửa (link `evidence` không kiểm tra scheme, CSV injection, mở trùng môn, bớt môn chỉ cảnh báo), lệnh đã chạy và kết quả, ghi rõ đã sửa ở [PR37] (gộp 06/11 17:55, CI đạt), chưa triển khai. Bình luận được cập nhật sau khi [PR37] gộp nên thứ tự chưa đúng. Dòng `probe_pr9.py` ghi "các ca ở dưới" nhưng chưa có bảng kết quả, xem mục 4 | Nguyễn Thanh Tùng bổ sung bảng kết quả các ca thử quyền vào bình luận |
|Sửa lỗi sơ đồ ở PR8 theo review | Chưa sửa; sơ đồ vẫn vẽ theo Firebase | Trần Đức Tùng; sơ đồ cần vẽ lại theo kiến trúc máy chủ |
|Xử lý Worker thử | **Đạt:** Nguyễn Thanh Tùng đã gỡ `reset-worker` khỏi Cloudflare ngày 06/11 vì không còn dùng sau khi đổi hướng. Kiểm tra bằng `npx wrangler deployments list --name reset-worker`: "This Worker does not exist on your account" (mã 10007) | Mã `reset-worker/` trong repo còn giữ làm minh chứng tuần 4 |
|Bỏ lưu mật khẩu, instance phụ | **Đạt:** máy chủ đã xong; phần giao diện còn sót đã sửa ở [PR34] (gộp 06/11 15:44, 2 kiểm tra CI đạt), đã thử trên giao diện thật và đã triển khai lên web thật 06/11 15:18 | Gồm cột "Mật khẩu", nút "Chuyển N mật khẩu", ghi chú `userSecrets` và nút đổi mật khẩu của Admin bị khóa vĩnh viễn (`!user.password`) |
|Dữ liệu Firebase cũ | **Đã gỡ, còn việc đối chiếu:** Nguyễn Thanh Tùng gỡ project `sutdytask` trên Firebase Console lúc 06/11 17:23; đọc Firestore qua API trả 403, web vẫn phản hồi; biên bản và [D06] mục 7 đã cập nhật ([PR36]). Dữ liệu còn khôi phục được đến 06/12 17:23, sau đó mới bị xóa hẳn. Trương Thanh Vui xác nhận dữ liệu trên máy chủ khớp với Firebase (trước đó ghi tương đồng hơn 90%); chưa có bảng đối chiếu trong repo | Trương Thanh Vui ghi phần dữ liệu khác nhau trước 06/12; Nguyễn Thanh Tùng kiểm tra lại sau hạn đó |
|Hoàn thiện V4 | **Một phần, dời phần còn lại sang tuần 6** ([PR31]). Còn 3 điểm mở: sinh viên tự ghi điểm quiz đúng định dạng, sinh viên xóa nhật ký của mình, giáo viên thấy sự kiện của môn không dạy. Lý do: việc chuyển từ Firebase sang máy chủ tương đối nặng và tốn thời gian; tuần 6 thiết kế lại trang Trắc nghiệm theo kế hoạch nên sẽ cập nhật luôn (đề xuất của Trương Thanh Vui trong review [PR31]) | Việc 8 của kế hoạch tuần 6; chưa thử trang Quản lý lớp học bằng tài khoản giáo viên |
| `test:logic` và thử [D9] trên máy Thanh Vui | **Đạt** ([PR35], `docs/kiem-thu/`): `test:logic` 42/42 trên máy Thanh Vui; thử [D9] bản máy chủ 8/8 bước, gồm cả kịch bản máy chủ chậm 10 giây. | Thanh Vui tự thử tay để xác nhận |

### 5.2. Việc không thuộc kế hoạch tuần 5 (phát sinh do đổi hướng hoặc làm sớm; không tính là chậm)

| Việc | Nguồn gốc | Tình trạng |
|---|---|---|
| Sao lưu tự động | Hệ quả của việc chuyển sang máy chủ riêng; không có trong kế hoạch tuần 5 | **Đã bật 06/11**, thử khôi phục đạt; còn thiếu bản sao lưu ngoài ổ vật lý |
| Cài `smartmontools`, `vnstat`, đọc SMART | Vận hành máy chủ riêng | Đã cài 06/11; SMART cần theo dõi ở mốc 13/11, 21/11 |
| Sửa 2 lỗi ở luồng email (`INSERT OR REPLACE` khi xác minh; mã đặt lại vẫn dùng được sau khi gỡ email) | Phát hiện khi review [PR27], việc email cá nhân nằm ngoài kế hoạch tuần 5 | Chưa sửa trong repo; đưa vào tuần 6 |
| Quyền tải bài nộp: `/uploads/submissions/` ai có đường dẫn cũng mở được, `Cache-Control: public` 7 ngày | Chức năng nộp tệp thuộc mục 15 [D3] (tuần 8), nhóm làm sớm | Đưa vào tuần 6 nhóm B |
| Giới hạn theo IP tin header `CF-Connecting-IP`; chưa kiểm tra bộ định tuyến sau khi dời máy | Vận hành máy chủ riêng ([D-VH] mục 7) | Đưa vào tuần 6 |
| Mật khẩu tài khoản demo yếu | Dữ liệu demo trên máy chủ riêng | Đổi trước khi nộp |
| Triển khai lại bản mới sau sự cố ghi đè 06/11 | Sự cố vận hành (mục 4) | Giao diện khớp `master` đến trước [PR37]; API chưa xác nhận đã cài lại; [PR37] chưa triển khai. Cần làm ngay |
| Báo lưu hồ sơ thất bại nhưng một nửa dữ liệu đã ghi khi máy chủ chậm | Phát hiện khi thử [D9] ([PR35] mục 4.1) | Chưa sửa; nhóm quyết định ở tuần 6 |

### 5.3. Việc của tuần sau theo [D3] (không phải việc tuần 5)

| Việc | Tuần theo [D3] | Ghi chú |
|---|---|---|
| Lập trình V3 (tách đáp án, máy chủ chấm điểm) | 6 | Tuần 5 chỉ yêu cầu thiết kế ([PR24], đạt) |
| Cập nhật [D3] và [D05] theo máy chủ riêng | 6 | [D05] viết theo Firestore và Worker vì thiết kế làm trước khi đổi hướng; cần cập nhật, không phải lỗi thiết kế |
| Tách `sharedData/global` theo môn | 6 | Lý do giới hạn 1 MB của Firestore không còn; còn lý do phân quyền đọc theo môn |
| Vite, JSX, ESLint | Sau tuần 5 | |

### 5.4. Việc không còn cần vì đã đổi hướng sang máy chủ riêng

- Việc 2 của tuần 5: deploy `firestore.rules`, chuyển mật khẩu sang `userSecrets`, thử 3 vai trò trên production. `firestore.rules` chỉ còn là bản đặc tả cho hàm `can()`.
- Đo lại bằng Emulator `test:rules`, `test:rules:deep`, kiểm thử đột biến cho `firestore.rules`: vẫn chạy trong CI nhưng không còn bảo vệ hệ thống đang chạy; bảo vệ thật là `can()` và `tests/server/`.
- Các bước [D9] viết cho Emulator: thay bằng bản thử tay cho máy chủ (mục 4).
- Worker thử và project Firebase `sutdytask` không còn là phương án của hệ thống; cả hai đã gỡ ngày 06/11 (mục 5.1).

---

## Phần 6. Kế hoạch tuần 6 (09/11 – 14/11/2026)

Kế hoạch dựa trên cột "Tuần" của [D3], thứ tự ưu tiên của [D3] (bảo mật → đúng nghiệp vụ → chất lượng mã và kiểm thử → tính năng mới) và các việc còn tồn đọng ở phần 5.

| Mục [D3] | Nội dung | Tuần theo [D3] | Cách xử lý |
|---|---|---|---|
| 6 | Trắc nghiệm: tách đáp án, máy chủ chấm và ghi điểm (V3, V4) | 5–6 | Việc chính; làm trên máy chủ riêng, không dùng Cloud Function |
| 7 | Tách `sharedData/global` theo môn | 6 | Làm có giới hạn: lý do 1 MB của Firestore không còn, chỉ còn lý do phân quyền đọc theo môn |
| 5 | Kiểm tra quyền, trường và kiểu | 4–5 | Làm nốt V4 trong `can()`, cùng lúc với Trắc nghiệm |
| 1, 4 | Bỏ lưu mật khẩu, instance phụ | 5 | Đã xong ở [PR26], [PR34]; project Firebase cũ đã gỡ ở [PR36]; còn thêm ca kiểm thử tự động |
| 11 | Backend | 5 | Đã thay bằng API Python; cập nhật [D3] |
| 10, 15 | Hỗ trợ, nộp tệp | 7, 8 | Đã làm sớm; cập nhật [D3], siết quyền tải bài nộp |
| 9 | Vite + JSX + ESLint | Sau tuần 5 | Chưa làm ở tuần 6; nhóm chọn tuần cụ thể |
| 2, 8, 14 | Bỏ tiện ích, trọng số điểm, nhập lớp | 7 | Giữ tuần 7 |

**Nhóm A: bắt buộc**

| # | Công việc | Người phụ trách | Kết quả cần đạt |
|---|---|---|---|
| 1 | **Triển khai lại bản `master` mới lên máy chủ** (sau sự cố ghi đè 06/11), ghi lại thời điểm và đối chiếu bằng hash; xóa hoặc đổi tên `~/migration/install-api.sh` cũ để không chạy nhầm lần nữa | Trương Thanh Vui | Máy chủ chạy đúng `master`; `studytask_api.py` và các tệp giao diện trùng hash với repo |
| 1b | Sao lưu tự động đã bật 06/11; việc còn lại: chép bản sao lưu ra thiết bị ngoài và ghi biên bản một lần khôi phục thử trong `docs/van-hanh/`. Bản sao có `mail.json` nên phải bảo vệ | Trương Thanh Vui (Nguyễn Thanh Tùng xác nhận) | Bản sao lưu nằm ngoài ổ vật lý của máy chủ; biên bản khôi phục thử |
| 2 | Review PR9 đã đăng, 4 điểm đã sửa ở [PR37] (gộp 06/11). Còn lại: bổ sung bảng kết quả các ca thử quyền vào bình luận; nhóm xác nhận cách chặn bớt môn còn dữ liệu; mở thử tệp CSV bằng Excel | Nguyễn Thanh Tùng | Bình luận trên PR9 đủ kết quả; [PR37] đã triển khai theo việc 1 |
| 3 | Cập nhật [D05] và [D3] theo máy chủ riêng; chốt 3 câu còn mở ở [D05] mục 8 | Trần Đức Tùng (cả nhóm chốt) | [D05], [D3] khớp hệ thống đang chạy; quyết định được ghi lại |
| 4 | Dọn V1 ở giao diện đã gộp ở [PR34]. Còn lại: thêm một ca kiểm thử tự động cho việc Admin đặt lại mật khẩu | Trương Thanh Vui (mã); Nguyễn Thanh Tùng review | Có ca kiểm thử, CI xanh |
| 5 | Project Firebase `sutdytask` đã gỡ 06/11 ([PR36]). Việc còn lại: ghi phần dữ liệu khác nhau trước hạn khôi phục 06/12; thử đăng nhập và lưu trên web thật; kiểm tra lại project đã bị xóa hẳn sau hạn đó | Trương Thanh Vui (đối chiếu), Nguyễn Thanh Tùng (kiểm tra) | Bổ sung vào `docs/van-hanh/02-bien-ban-go-firebase-sutdytask.md`; không còn dữ liệu mật khẩu trên Firebase |
| 6 | Sửa 2 lỗi luồng email kèm ca kiểm thử; xác minh cổng 80 không vào thẳng được từ ngoài | Nguyễn Thanh Tùng (mã), Trương Thanh Vui (kiểm tra mạng) | PR có ca kiểm thử cho 2 lỗi, CI xanh; kết quả kiểm tra bộ định tuyến được ghi lại |
| 7 | Lập trình V3: đề và khóa đáp án tách riêng, sinh viên không đọc được khóa, máy chủ chấm và ghi điểm, form tạo đề mặc định `draft` | Trần Đức Tùng (Trương Thanh Vui review) | Trình duyệt không nhận `correct` trước khi đề đóng; ca kiểm thử từ [D05] mục 6 chuyển sang `tests/server/` và đạt; CI xanh |
| 8 | Vá hoàn toàn V4 cùng đợt thiết kế lại Trắc nghiệm, sau việc 7: chặn sinh viên tự ghi điểm, chặn xóa nhật ký, lọc sự kiện theo môn giáo viên dạy; thử trang Quản lý lớp học bằng tài khoản giáo viên | Nguyễn Thanh Tùng (Trần Đức Tùng review) | `test_activities.py` có ca cho cả 3 điểm; ghi kết quả thử tay |
| 9 | Kiểm tra sức khỏe máy chủ T+7 (13/11) và T+15 (21/11) theo [D-VH] mục 8; đã cài `smartmontools`, `vnstat` và cập nhật gói ngày 06/11; việc còn lại: đọc lại SMART (187/188 có tăng không), chạy tự kiểm tra ổ | Trương Thanh Vui | Mục 8.4 của báo cáo vận hành được điền |
| 10 | Nhật ký AI và báo cáo tuần 6: mỗi người tự viết phần của mình, đối chiếu commit | Cả nhóm | `docs/ai-log/tuan-06.md`; báo cáo có link trực tiếp tới commit, PR, tệp |

**Nhóm B: làm khi nhóm A đúng tiến độ**

| # | Công việc | Người phụ trách | Kết quả cần đạt |
|---|---|---|---|
| 11 | Kiểm tra đăng nhập khi tải `/uploads/submissions/`, bỏ cache công khai | Trương Thanh Vui | Người ngoài không mở được bài nộp; có ca kiểm thử |
| 12 | Sửa sơ đồ theo review PR8 và cập nhật theo kiến trúc máy chủ | Trần Đức Tùng (Trương Thanh Vui review) | Sơ đồ mới trong `docs/`, các lỗi ở review được xử lý |
| 13 | `test:logic` đã có kết quả ở [PR35]. Việc còn lại: Thanh Vui tự thử tay; viết lại [D9] mục 4 theo máy chủ; quyết định có sửa lỗi lưu một nửa dữ liệu ([PR35] mục 4.1) không | Trương Thanh Vui | Báo cáo bổ sung trong `docs/kiem-thu/`; [D9] khớp với máy chủ |
| 14 | Mục 7 [D3]: tách `sharedData/global` phần cần phân quyền theo môn, có script chuyển dữ liệu và sao lưu trước | Trương Thanh Vui | Sinh viên chỉ đọc dữ liệu môn mình học; dữ liệu cũ còn nguyên; nếu không kịp thì dời tuần 7, ghi rõ lý do |

**Thứ tự phụ thuộc:**
- Việc 3 xong rồi mới làm việc 7; việc 7 xong rồi mới làm việc 8.
- Việc 1 xong rồi mới làm việc 14 và các thay đổi dữ liệu trên máy chủ.
- Việc 7, 8, 14 cùng sửa `server/studytask_api.py`: gộp lần lượt, mỗi PR ghi rõ "chỉ gộp sau PR …".

**Quy ước tuần 6:**
- PR phải có Approve của thành viên khác trước khi gộp. PR có mã phải có nhận xét, các file không quan trọng hoặc hướng dẫn - ghi chú lại mới được review "đã xem - đã duyệt"
- Mọi commit có AI tham gia đều gắn nhãn `[AI]`.
- Sau khi gộp mã máy chủ, ghi lại đã triển khai chưa.
- Không thêm chức năng ngoài kế hoạch khi nhóm A chưa xong.

**Xin ý kiến giảng viên:**

1. Thầy có đồng ý phương án máy chủ riêng thay Firebase không ([D06] mục 10).
2. Có tắt Trắc nghiệm ở chế độ offline không; xử lý điểm cũ không đối chiếu được ra sao; khi nào trả đáp án cho sinh viên ([D05] mục 8).

---

## Phần 7. Khai báo công cụ AI

Trong tuần 5, nhóm sử dụng Claude Code (Anthropic), model Claude Sonnet 5.5 và Claude Opus 5.5, cho các việc sau:
- viết mã API máy chủ, giao diện gọi API và kiểm thử máy chủ;
- bỏ dữ liệu mẫu, sửa ảnh đại diện, khóa sửa hồ sơ, vá V4;
- thiết lập CI; hỗ trợ tài liệu thiết kế, README và báo cáo vận hành;
- đọc diff và soạn nội dung review cho một số PR;
- chạy `test:logic` và thao tác trình duyệt khi thử [D9] bản máy chủ ([PR35]);
- kiểm tra trước và sau khi gỡ Firebase, soạn biên bản ([PR36]); thao tác xóa project do Nguyễn Thanh Tùng tự thực hiện trên Firebase Console;
- sửa 4 điểm của PR9, viết ca kiểm thử và thao tác trình duyệt khi thử giao diện ([PR37]);
- tổng hợp nhật ký, đối chiếu số liệu với GitHub và soạn dự thảo kế hoạch tuần 6.

Chi tiết từng việc, phần sinh viên tự kiểm tra và các sai sót của AI được ghi trong [R11]. Commit `64d0631` có AI viết mã nhưng thiếu nhãn `[AI]`; các commit còn lại trong nhật ký đều có nhãn hoặc dòng `Co-Authored-By`.

---

## Phụ lục

### Phụ lục A. Commit trong tuần 5

| Mã | Commit | Người commit | Ngày | Nội dung | PR |
|---|---|---|---|---|---|
| [C-CI] | c3f0876 | Trần Đức Tùng | 03/11 | CI GitHub Actions | [PR22] |
| [C-V6] | c84c403 | Trương Thanh Vui | 03/11 | Bỏ tự nạp dữ liệu mẫu | [PR23] |
| [C-D05] | 59a9146 | Trần Đức Tùng | 03/11 | Thiết kế 05 Trắc nghiệm | [PR24] |
| [C-RM] | 2036edb | Trần Đức Tùng | 04/11 | README lỗi Windows | [PR25] |
| [C-RM2] | 277faac | Trần Đức Tùng | 04/11 | Sửa README theo review | [PR25] |
| [C-API] | 68dde16 | Trương Thanh Vui | 04/11 | API Python, script triển khai | [PR26] |
| [C-WEB] | 0e48b48 | Trương Thanh Vui | 04/11 | Giao diện gọi API | [PR26] |
| [C-TEST] | 401434c | Trương Thanh Vui | 04/11 | Kiểm thử máy chủ, job CI | [PR26] |
| [C-D06] | 4c6afc7 | Trương Thanh Vui | 04/11 | Tài liệu 06 | [PR26] |
| [C-D07] | da5b468 | Trương Thanh Vui | 04/11 | Tài liệu 07 | [PR27] |
| [C-AVT] | b1f9c82 | Trương Thanh Vui | 04/11 | Sửa ảnh đại diện | [PR28] |
| [C-HS] | f8af7d9 | Trương Thanh Vui | 04/11 | Khóa sửa hồ sơ | [PR29] |
| [C-V4] | 64d0631 | Nguyễn Thanh Tùng | 05/11 | V4: rules, `can()`, kiểm thử | [PR31] |
| [C-VH] | d730e23 | Trương Thanh Vui | 06/11 | Báo cáo vận hành | [PR32] |
| [C-HC] | 2feb3b9 | Trương Thanh Vui | 06/11 | Lịch kiểm tra lại, `health-check.sh` | [PR32] |
| [C-D06b] | 8e7f1d6 | Trương Thanh Vui | 04/11 | Sửa tài liệu 06 trên GitHub | [PR26] |
| [C-D06c] | b1553d1 | Trương Thanh Vui | 04/11 | Cập nhật lời văn tài liệu 06 | [PR29], [PR30] |
| [C-VH2] | 9dbdcc4 | Trương Thanh Vui | 06/11 | Điền người phụ trách vào lịch kiểm tra lại | [PR32] |
| [C-VH3] | 4f723de | Trương Thanh Vui | 06/11 | Báo cáo vận hành: SMART, sao lưu tự động; thêm `deploy/backup/` | [PR33] (đẩy sau khi [PR32] đã gộp nên cần PR riêng; gộp 06/11 15:13) |
| [C-V1UI] | f6aa9be | Trương Thanh Vui | 06/11 | Dọn giao diện còn sót của lưu mật khẩu (V1) | [PR34] |
| [C-TL] | ba5ee37 | Trương Thanh Vui | 06/11 | Báo cáo `test:logic` và thử [D9] bản máy chủ | [PR35] |
| [C-FB] | b3e2638 | Nguyễn Thanh Tùng | 06/11 | Biên bản gỡ Firebase, cập nhật [D06] và README | [PR36] |
| [C-PR9F] | 53875ee | Nguyễn Thanh Tùng | 06/11 | Sửa 4 điểm tìm thấy khi kiểm tra PR9, thêm ca kiểm thử | [PR37] |

### Phụ lục B. Review và gộp PR (giờ Việt Nam)

| PR | Người mở | Review | Người gộp | Lúc gộp |
|---|---|---|---|---|
| [PR8] | Trần Đức Tùng | Trương Thanh Vui bình luận chi tiết, 03/11 10:52 | Trần Đức Tùng | 25/10 |
| [PR9] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve một dòng, 03/11 14:22; bình luận 06/11 15:41, ban đầu xác nhận 6 trang khớp, sửa lại sau 18:06 để thêm 4 điểm cần sửa, lệnh và kết quả | Trương Thanh Vui | 26/10 |
| [PR21] | Trương Thanh Vui | Không; PR đóng, không gộp | – | – |
| [PR22] | Trần Đức Tùng | Trương Thanh Vui Approve 04/11 09:29 | Trương Thanh Vui | 04/11 09:29 |
| [PR23] | Trương Thanh Vui | Trần Đức Tùng Approve 03/11 17:11 | Trương Thanh Vui | 04/11 09:31 |
| [PR24] | Trần Đức Tùng | Trương Thanh Vui Approve 04/11 09:32, không có nhận xét; Trương Thanh Vui bổ sung bình luận 06/11 13:54 ("Đã xem và Approve 03/11 nhưng quên không note Comment") | Trương Thanh Vui | 04/11 09:32 |
| [PR25] | Trần Đức Tùng | Nguyễn Thanh Tùng bình luận 11:36, Approve 12:39 | Nguyễn Thanh Tùng | 04/11 12:40 |
| [PR26] | Trương Thanh Vui | Nguyễn Thanh Tùng "đã xem và gộp", Approve 12:52 | Nguyễn Thanh Tùng | 04/11 12:53 |
| [PR27] | Trương Thanh Vui | Nguyễn Thanh Tùng 11 điểm 19:42, Approve 20:45 | Nguyễn Thanh Tùng | 04/11 20:45 |
| [PR28] | Trương Thanh Vui | Nguyễn Thanh Tùng 6 điểm 19:46, Approve 19:57 | Nguyễn Thanh Tùng | 04/11 19:58 |
| [PR29] | Trương Thanh Vui | Trần Đức Tùng "đã xem" 04/11, Approve lại 05/11 06:27 | Trương Thanh Vui | 05/11 08:14 |
| [PR30] | Trương Thanh Vui | Trần Đức Tùng Approve 04/11 23:13 | Trần Đức Tùng | 05/11 06:16 |
| [PR31] | Nguyễn Thanh Tùng | Trương Thanh Vui Approve, nêu V4 chưa vá hết, 06/11 09:29 | Trương Thanh Vui | 06/11 09:30 |
| [PR32] | Trương Thanh Vui | Trần Đức Tùng Approve 06/11 11:31 | Trần Đức Tùng | 06/11 11:31 |
| [PR33] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve 06/11 15:13, "đã xem và gộp" | Nguyễn Thanh Tùng | 06/11 15:13 |
| [PR34] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve 06/11 15:44, "đã xem và gộp" | Nguyễn Thanh Tùng | 06/11 15:44 |
| [PR35] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve 06/11 17:16, "check review bổ sung D9. hợp lệ" | Nguyễn Thanh Tùng | 06/11 17:16 |
| [PR36] | Nguyễn Thanh Tùng | Trương Thanh Vui Approve 06/11 17:32, "Check nhanh" | Nguyễn Thanh Tùng | 06/11 17:33 |
| [PR37] | Nguyễn Thanh Tùng | Trương Thanh Vui Approve 06/11 17:54, "Đã xem 06/11" | Trương Thanh Vui | 06/11 17:55 |

### Phụ lục C. Đối chiếu kế hoạch tuần 5

| # | Công việc | Người phụ trách | Kết quả | Minh chứng |
|---|---|---|---|---|
| 1 | Review bổ sung PR8, PR9 | Trương Thanh Vui, Nguyễn Thanh Tùng | PR8 có bình luận chi tiết, không có lệnh chạy; PR9 **đạt trên GitHub**, có lệnh và kết quả, còn thiếu bảng các ca thử quyền; 4 điểm tìm thấy đã sửa ở [PR37] | [PR8], [PR9], [PR37] |
| 2 | Deploy rules, chuyển mật khẩu, thử 3 vai trò | Nguyễn Thanh Tùng, Trương Thanh Vui | **Không làm, đổi hướng** sang máy chủ riêng; không có biên bản deploy | [D06] |
| 3 | Chốt phương án máy chủ; xử lý Worker thử | Cả nhóm; Nguyễn Thanh Tùng | Đã triển khai máy chủ, chờ ý kiến thầy; Worker thử đã gỡ khỏi Cloudflare ngày 06/11 | [PR26], [D06] |
| 4 | Bỏ lưu mật khẩu, instance phụ | Nguyễn Thanh Tùng, Trương Thanh Vui | Đạt ở máy chủ ([PR26]) và giao diện ([PR34]); **project Firebase cũ đã gỡ 06/11**, còn khôi phục được đến 06/12, chưa có bảng đối chiếu dữ liệu | [PR26], [PR34], [PR36], [D06], [C-V1UI], [D-GFB] |
| 5 | Bỏ tự nạp dữ liệu mẫu (V6) | Trương Thanh Vui | Đạt | [PR23] |
| 6 | Hoàn thiện rules (V4), ca kiểm thử | Nguyễn Thanh Tùng, Trương Thanh Vui | **Một phần**, còn 3 điểm mở; phần còn lại dời sang tuần 6 cùng Trắc nghiệm | [PR31] |
| 7 | CI GitHub Actions | Trần Đức Tùng | Đạt | [PR22], [PR26] |
| 8 | Thiết kế Trắc nghiệm | Trần Đức Tùng | Đạt; cần cập nhật theo máy chủ riêng | [PR24], [D05] |
| 9 | `test:logic`, D9 trên máy Vui; README | Trương Thanh Vui; Trần Đức Tùng | README đạt; `test:logic` trên máy Vui 42/42; thử [D9] bản máy chủ 8/8, do AI thao tác, Thanh Vui chưa tự thử tay | [PR25], [PR35], [D-KT] |


### Phụ lục D. Danh sách link GitHub

**Pull Request**

- [PR8] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/8
- [PR9] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/9
- [PR21] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/21
- [PR22] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/22
- [PR23] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/23
- [PR24] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/24
- [PR25] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/25
- [PR26] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/26
- [PR27] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/27
- [PR28] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/28
- [PR29] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/29
- [PR30] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/30
- [PR31] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/31
- [PR32] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/32
- [PR33] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/33
- [PR34] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/34
- [PR35] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/35
- [PR36] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/36
- [PR37] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/37

**Commit**

- [C-CI] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/c3f0876
- [C-V6] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/c84c403
- [C-D05] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/59a9146
- [C-RM] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/2036edb
- [C-RM2] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/277faac
- [C-API] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/68dde16
- [C-WEB] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/0e48b48
- [C-TEST] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/401434c
- [C-D06] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/4c6afc7
- [C-D07] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/da5b468
- [C-AVT] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/b1f9c82
- [C-HS] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/f8af7d9
- [C-V4] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/64d0631
- [C-VH] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/d730e23
- [C-HC] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/2feb3b9
- [C-D06b] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/8e7f1d6
- [C-D06c] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/b1553d1
- [C-VH2] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/9dbdcc4
- [C-VH3] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/4f723de
- [C-V1UI] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/f6aa9be
- [C-TL] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/ba5ee37
- [C-FB] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/b3e2638
- [C-PR9F] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/53875ee

**Tài liệu**

- [D3] Bảng Giữ / Bỏ / Sửa / Thêm: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/03-giu-bo-sua-them.md
- [D05] Thiết kế Trắc nghiệm: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/05-trac-nghiem-tach-dap-an-cham-diem-may-chu.md
- [D06] Chuyển sang máy chủ riêng: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/06-chuyen-firebase-sang-may-chu-rieng.md
- [D07] Email cá nhân: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/07-xac-thuc-email-ca-nhan.md
- [D9] Sửa lỗi cập nhật hồ sơ: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/sua-loi/01-cap-nhat-ho-so.md
- [D-VH] Báo cáo vận hành: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/van-hanh/01-bao-cao-suc-khoe-may-chu.md
- [D-GFB] Biên bản gỡ project Firebase: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/van-hanh/02-bien-ban-go-firebase-sutdytask.md
- [D-KT] Kiểm thử bổ sung của Thanh Vui: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/kiem-thu/B%C3%A1o%20c%C3%A1o%20ki%E1%BB%83m%20th%E1%BB%AD%20b%E1%BB%95%20sung%20Thanh%20Vui.md
- CI: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/actions
- Sơ đồ DFD, Use Case: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/tree/master/docs/so%20do
- [R11] Nhật ký sử dụng công cụ tuần 5 (sau khi đưa lên): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/ai-log/tuan-05.md
