# Báo cáo tuần 3

- Đề tài: Xây dựng một website quản lý deadline học tập cho sinh viên (sản phẩm: StudyTask)
- GVHD: TS. Huỳnh Xuân Phụng
- Nhóm: Nguyễn Thanh Tùng (24TX810027) · Trần Đức Tùng (24TX810026) · Trương Thanh Vui (24TX810021)
- Thời gian: 19/10 – 24/10/2026
- Repo GitHub (public): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask
- Toàn bộ link minh chứng: xem mục 8. Các mã [C4], [PR1], [D5]... trong bài trỏ tới mục này.

1. Trọng tâm tuần và tình trạng commit

Tuần 3 đưa mã nguồn tuần 2 (trước đây chỉ nằm trên máy cá nhân) lên GitHub theo đúng cam kết ở báo cáo tuần 2: mỗi phần là một nhánh riêng, mở Pull Request (PR), có thành viên khác review rồi mới gộp vào `master`. Cả 3 thành viên đều commit và mở PR bằng tài khoản của mình.

| Mã | Commit | Người commit (tài khoản GitHub) | Ngày | Nội dung | PR |
|---|---|---|---|---|---|
| [C4] | b90b200 | Trương Thanh Vui (Thanh-Vui-Minx) | 21/10 | `[AI] feat: chay Firebase Emulator tren may local (dot 1)` | [PR1] |
| [C5] | 9ad8b07 | Trần Đức Tùng (TranDucTung-24tx810026) | 21/10 | `[AI] feat: logic tinh diem, hoc phi, chuong trinh dao tao + kiem thu (dot 1)` | [PR2] |
| [C6] | 089af8b | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 22/10 | `[AI] docs: README va tai lieu sua loi ho so` | [PR3] |
| [C7] | ba2ae6e | Trương Thanh Vui (Thanh-Vui-Minx) | 22/10 | `[AI] feat: 6 trang moi, so diem va lich hoc (dot 2)` | [PR4] |
| [C8] | 1b7fed0 | Trương Thanh Vui (Thanh-Vui-Minx) | 22/10 | `Revert "[AI] feat: 6 trang moi, so diem va lich hoc (dot 2)" (PR #4)` | [PR5] |
| [C9] | d0cfea6 | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 23/10 | `[AI] fix: loi cap nhat ho so, dang xuat, dong bo du lieu theo tai khoan` | [PR6] |
| [C10] | 11de331 | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 23/10 | `[AI] fix: va V2 (tu nang quyen), va tam V1 (userSecrets), kiem thu rules` | [PR6] |

Review và gộp:

| PR | Người mở | Người review (Approve) | Người gộp | Ngày gộp |
|---|---|---|---|---|
| [PR1] Emulator | Trương Thanh Vui | Nguyễn Thanh Tùng | Nguyễn Thanh Tùng | 23/10 |
| [PR2] Logic tính toán | Trần Đức Tùng | Trương Thanh Vui | Trương Thanh Vui | 22/10 |
| [PR3] README, tài liệu sửa lỗi | Nguyễn Thanh Tùng | Trần Đức Tùng | Trần Đức Tùng | 22/10 |
| [PR4] 6 trang mới | Trương Thanh Vui | **không có review** | Trương Thanh Vui | 22/10 |
| [PR5] Gỡ PR4 | Trương Thanh Vui | Trần Đức Tùng | Trần Đức Tùng | 23/10 |
| [PR6] Sửa lỗi hồ sơ, vá V2/V1 | Nguyễn Thanh Tùng | Trương Thanh Vui | Trương Thanh Vui | 23/10 |

Nói rõ để Thầy dễ đối chiếu:
- [PR4] được gộp khi chưa có review và trước [PR1], làm `master` lỗi import (`utils/store.js` cần các hàm chỉ có trong [PR1]). Trương Thanh Vui tự phát hiện và mở [PR5] để gỡ.
- [PR5] lại được gộp **sau** [PR6]. Vì `app.js` trong [PR6] dùng 6 trang mà [PR5] vừa gỡ, nên **`master` hiện tại (commit dea9dae) chưa chạy được**: `app.js` import `pages/MonthCalendar.js`, `Tuition.js`, `GradingPolicy.js`, `Curriculum.js`, `Graduation.js`, `Theses.js` nhưng các tệp này không còn trên `master`. Cách sửa: đưa lại nội dung [PR4] (revert commit [C8]). Đây là việc số 1 của tuần 4 (mục 5).
- Hệ thống đang chạy **không bị ảnh hưởng**: bản đang vận hành được đưa lên Cloudflare bằng cách upload thủ công, không tự lấy từ `master` (mục 3.3).

2. Công việc đã làm và phân công (theo kế hoạch tuần 3 ở mục 5 báo cáo tuần 2 [R6])

| # | Công việc (kế hoạch tuần 3) | Người phụ trách | Kết quả | Minh chứng |
|---|---|---|---|---|
| 1 | Viết README (cấu trúc thư mục, cách chạy, quy ước nhánh và commit) | Nguyễn Thanh Tùng | Đạt | [F20], commit [C6], [PR3] |
| 2 | Review mã chạy Emulator rồi commit | Trương Thanh Vui (Nguyễn Thanh Tùng review) | Đạt: đã có trên GitHub, đã review và gộp. Chưa có kết quả chạy thử được ghi lại | [F21]–[F24], commit [C4], [PR1] |
| 3 | Sửa lỗi "gửi yêu cầu cập nhật hồ sơ" | Nguyễn Thanh Tùng (Trương Thanh Vui review) | Đạt một phần: có commit sửa N1–N9 và tài liệu nguyên nhân. Chưa thử tay các bước ở mục 4 của [D9] | [D9], commit [C9], [PR6] |
| 4 | Vá V2, vá tạm V1 trong firestore.rules, có kiểm thử tự động | Nguyễn Thanh Tùng (Trương Thanh Vui review) | Đạt một phần: có commit rules và tệp kiểm thử. Chưa chạy `npm run test:rules`; rules **chưa** deploy lên production | [F25], [T1], commit [C10], [PR6] |
| 5 | Vẽ sơ đồ luồng dữ liệu (nhóm tự vẽ, không dùng AI) | Trần Đức Tùng | Chưa đạt: chưa có sơ đồ trên GitHub. Chuyển sang tuần 4 | Chưa có |
| 6 | Rà soát lại tính năng theo bảng Giữ/Bỏ/Sửa/Thêm [D3] | Cả nhóm | Đạt một phần: đã phân tích và đề xuất lịch mới (mục 3.4), chưa cập nhật tệp [D3] | Mục 3.4 của báo cáo này |
| 7 | Nhật ký sử dụng AI tuần 3, đối chiếu với commit | Cả nhóm (Nguyễn Thanh Tùng tổng hợp) | Đạt | [R9] |
| 7b | Phần tính toán (điểm theo quy chế, học phí, chương trình đào tạo) và 6 trang mới (phát sinh từ tuần 2) | Trần Đức Tùng (tính toán), Trương Thanh Vui (trang) | Phần tính toán đã gộp. 6 trang đã gộp rồi bị gỡ, chờ đưa lại | [F26], [T2], commit [C5], [PR2]; [PR4], [PR5] |

3. Kết quả chính

3.1. Đưa mã tuần 2 lên GitHub theo quy trình PR

- 6 PR, 7 commit; 5/6 PR có review Approve của một thành viên khác trước khi gộp. [PR4] là ngoại lệ và đã gây lỗi (mục 1, mục 4).
- Mọi commit mã do AI sinh đều có nhãn `[AI]`, đúng cam kết ở nhật ký AI tuần 1.
- Kiểm tra chéo trước khi gộp [PR1]: mọi hàm mà các tệp khác import từ `utils/firebase.js` đều có trong [PR1]; `scripts/seed-emulator.mjs` import đủ 12 hằng số từ `utils/constants.js` (sau khi gộp [PR6]).

3.2. Nội dung đã lên `master`

- Chạy local bằng Firebase Emulator ([PR1]): chạy trên `localhost`/`127.0.0.1` thì ứng dụng tự nối vào Emulator với project `demo-studytask`, không chạm dữ liệu thật; có script nạp tài khoản demo.
- Sửa lỗi hồ sơ ([PR6], commit [C9]): thông báo lưu, thời hạn 10 giây khi mất mạng, chép cả số điện thoại, dữ liệu cục bộ gắn với tài khoản, hồ sơ trống theo vai trò, kiểm tra dữ liệu nhập, đăng xuất thoát hẳn phiên Firebase. Nguyên nhân N1–N9 ở [D9].
- Vá bảo mật ([PR6], commit [C10]): V2, người dùng chỉ tự sửa `name`, `phone`; `role`, `subjectIds`, `expiresAt` chỉ Quản trị viên sửa. V1 (vá tạm), mật khẩu chuyển sang `userSecrets/{uid}`, chỉ Quản trị viên đọc. Mật khẩu **vẫn là văn bản thuần**, nên V1 chưa hết (xem 3.4).
- Phần tính toán ([PR2]): `utils/grading.js`, `tuition.js`, `curriculum.js`, `store.js` và kiểm thử `tests/logic.test.mjs`.

3.3. Đính chính về nơi triển khai

README (4 chỗ) và chú thích trong `utils/firebase.js` ghi bản đang vận hành chạy trên Netlify. Thực tế nhóm đã chuyển sang **Cloudflare** (Workers & Pages) từ trước vì Netlify giới hạn số lần đưa bản mới; bản mới được upload thủ công. Hệ quả:
- Gộp vào `master` không làm thay đổi trang đang chạy. Nhóm chỉ upload mã mới lên Cloudflare sau khi đã deploy `firestore.rules` mới lên Firebase (có sao lưu).
- Tệp `netlify.toml` (các header bảo mật) không có tác dụng trên Cloudflare, cần thay bằng tệp `_headers`.
- README và một số chú thích trong mã còn ghi "Netlify", sẽ sửa ở tuần 4.

3.4. Rà soát bảng Giữ/Bỏ/Sửa/Thêm [D3] – đề xuất điều chỉnh lịch

Nhóm ưu tiên dồn các mục **Bỏ** và **Sửa** liên quan tới mật khẩu vào tuần 5. Đối chiếu với thực tế, có 3 điểm:

1. **V1 chậm so với bảng.** [D3] ghi bỏ lưu mật khẩu ở tuần 2–3, nhưng tới nay mới có bản vá tạm trên `master`, chưa deploy. Đề xuất tách: vá tạm (deploy rules và chuyển mật khẩu sang `userSecrets`) ở tuần 4; bỏ hẳn ở tuần 5.
2. **Máy chủ để chạy nghiệp vụ tài khoản.** Admin SDK không chạy được trong trình duyệt nên cần một máy chủ:

   | Phương án | Ưu điểm | Nhược điểm |
   |---|---|---|
   | Cloudflare Worker (cùng nền tảng đang dùng) | Không cần thẻ thanh toán, không đổi nơi chạy trang | Admin SDK của Firebase chạy trên Node.js, không dùng trực tiếp trên Workers; phải gọi REST API của Google (Identity Toolkit) bằng khóa dịch vụ lưu trong Workers Secrets, tự kiểm tra token và vai trò |
   | Cloud Functions (Firebase) | Dùng đúng Admin SDK, ít mã | Cần gói Blaze (có thẻ thanh toán) |

   Nhóm nghiêng về Cloudflare Worker, Cloud Functions làm dự phòng. Thiết kế mới không lưu mật khẩu ở đâu cả: Admin tạo tài khoản thì máy chủ tạo người dùng rồi gửi email đặt lại mật khẩu; bỏ chức năng Admin tự nhập mật khẩu cho người khác; bỏ luôn Firebase phụ (mục 4 của [D3]). Nhận định về Workers chưa được chạy thử, tuần 4 làm bản thử nhỏ.
3. **Dữ liệu và thứ tự.** Mật khẩu của các tài khoản thật đã từng đọc được bởi mọi tài khoản, nên sau khi sửa phải bắt đổi mật khẩu và xóa trường `password` khỏi Firestore (kể cả bản sao lưu). Thứ tự phụ thuộc: máy chủ → bỏ lưu mật khẩu → bỏ Firebase phụ → rules bỏ `userSecrets` → chấm trắc nghiệm ở máy chủ. Mục 9 (chuyển sang Vite) nên dời sau tuần 5 để tuần 5 không quá tải.

Đề xuất cột "Tuần" mới cho [D3]: mục 1 → 4 (vá tạm), 5 (bỏ hẳn); mục 3 → 5; mục 4 → 5; mục 5 → 4, 5; mục 6 → 5–6; mục 11 → 4 (bản thử), 5 (hoàn thiện); mục 9 → sau tuần 5. Nhóm sẽ cập nhật tệp [D3] sau khi có ý kiến của Thầy (mục 6).

4. Khó khăn, vướng mắc

- **Thứ tự gộp PR chưa chặt.** Kế hoạch đẩy mã chia theo người nhưng chưa ghi rõ phụ thuộc giữa các tệp (ví dụ `utils/store.js` cần `utils/firebase.js`). Hai lần gộp sai thứ tự ([PR4] trước [PR1]; [PR5] sau [PR6]) làm `master` lỗi. Từ tuần 4: mỗi PR ghi rõ "chỉ gộp sau PR …", và không gộp PR chưa có Approve.
- **Chưa chạy kiểm thử.** Các tệp kiểm thử đã có trên GitHub nhưng chưa có kết quả chạy được ghi lại; một số máy thành viên chưa cài Node.js và Java.
- **Rules chưa deploy lên production**, nên trên hệ thống đang chạy mật khẩu vẫn nằm trong `user/{uid}` (V1) và người dùng vẫn tự sửa được role (V2).
- Tài khoản Cloudflare đang do một thành viên giữ; nhóm cần thống nhất ai giữ khóa dịch vụ khi có máy chủ.

5. Kế hoạch tuần 4 (26/10 – 31/10/2026)

| # | Công việc | Người phụ trách | Kết quả cần đạt |
|---|---|---|---|
| 1 | Đưa lại 6 trang của [PR4] (revert commit [C8]) để `master` chạy được | Trương Thanh Vui (Nguyễn Thanh Tùng review) | PR mới; mở ứng dụng trên Emulator không lỗi import |
| 2 | Chạy `npm run test:logic`, `npm run test:rules`; thử tay các bước ở mục 4 của [D9] | Cả nhóm (mỗi người chạy trên máy mình) | Kết quả chạy ghi vào `docs/` kèm số ca đạt/không đạt |
| 3 | Sau khi Thầy đồng ý (mục 6): deploy `firestore.rules` mới lên production (sao lưu trước), Quản trị viên chuyển mật khẩu sang `userSecrets`, rồi mới upload mã lên Cloudflare | Nguyễn Thanh Tùng, Trương Thanh Vui | Biên bản các bước trong `docs/`; đăng nhập thử 3 vai trò |
| 4 | Bản thử Cloudflare Worker: tạo tài khoản và gửi email đặt lại mật khẩu qua Identity Toolkit trên project thử | Nguyễn Thanh Tùng | Commit bản thử và ghi chú kết quả; chốt phương án máy chủ cho tuần 5 |
| 5 | Vẽ sơ đồ luồng dữ liệu (nhóm tự vẽ, không dùng AI) | Trần Đức Tùng | Sơ đồ trong `docs/so do/` |
| 6 | Cập nhật [D3] theo đề xuất ở mục 3.4; thay `netlify.toml` bằng `_headers`; sửa chữ "Netlify" trong README và chú thích mã | Trần Đức Tùng | Commit cập nhật |
| 7 | Nhật ký sử dụng AI tuần 4, đối chiếu với commit | Cả nhóm | `docs/ai-log/tuan-04.md` |

6. Kính xin ý kiến Thầy

- Phương án máy chủ để bỏ hẳn việc lưu mật khẩu: Cloudflare Worker (không cần trả phí, nhiều mã hơn) hay Cloud Functions trên gói Blaze (có thẻ thanh toán)?
- Lịch mới: vá tạm V1/V2 trên hệ thống đang chạy ở tuần 4, bỏ hẳn lưu mật khẩu ở tuần 5 (thay vì tuần 2–3 như bảng ban đầu).
- Phạm vi các chức năng phát sinh (học phí, quy chế điểm, chương trình đào tạo, xét tốt nghiệp, khóa luận) đã hỏi ở tuần 2: nhóm xin Thầy định hướng giữ hay thu gọn trước khi đưa lại 6 trang ở việc số 1.

7. Khai báo sử dụng AI

- Công cụ AI: Claude Code (Anthropic)
- Model: Claude Sonnet 5.5 (`claude-sonnet-5-5`, 20/10 – 23/10/2026); Claude Opus 5.5 (`claude-opus-5-5`, 24/10/2026)
- Người sử dụng:
  - Nguyễn Thanh Tùng (20/10 – 24/10): lập kế hoạch đẩy mã theo từng người và từng đợt; chuẩn bị gói tệp; tạo nhánh, commit và push phần của mình ([C6], [C9], [C10]); đối chiếu mã [PR1] trước khi review; phân tích [D3]; soạn báo cáo tuần 3 và nhật ký AI tuần 3
  - Trương Thanh Vui: mô tả [PR1], [PR5] có dòng "Generated with Claude Code"
  - Mã nguồn trong các commit tuần 3 là mã AI sinh ở tuần 2 (đã khai báo trong nhật ký AI tuần 2), nay được đưa lên GitHub
- Công cụ AI khác: không dùng
- Mã nguồn do AI sinh trên GitHub: **có**, trong các commit có nhãn `[AI]`: [C4], [C5], [C7], [C9], [C10]. Commit [C6] cũng có nhãn `[AI]` nhưng chỉ chứa tài liệu
- Phần nhóm tự làm, không dùng AI: review và bấm Approve từng PR; quyết định gộp hoặc gỡ PR; phát hiện production chạy trên Cloudflare chứ không phải Netlify; chọn ưu tiên dồn mục Bỏ/Sửa sang tuần 5; mỗi thành viên tự commit bằng tài khoản của mình
- Sai sót của AI nhóm đã phát hiện: kế hoạch đẩy mã do AI soạn xếp `utils/firebase.js` vào đợt 1 mà không thấy nó phụ thuộc vào rules và hằng số ở đợt 3 (Trương Thanh Vui phát hiện, ghi trong [PR1]); AI mặc định bản đang chạy ở Netlify nên đưa hướng dẫn sai (Nguyễn Thanh Tùng chỉ ra là Cloudflare); bản nháp báo cáo này (AI soạn) ghi nhầm người soạn mô tả [PR6] và ghi nhầm báo cáo tuần 2 có nhắc Netlify, phát hiện khi rà soát lần cuối và đã sửa. Chi tiết ở [R9]
- Bằng chứng: nhật ký AI có prompt nguyên văn từng lần dùng tại [R9]

8. Danh sách link GitHub

8.1. Commit tuần 3

- [C4] b90b200 (Trương Thanh Vui) – chạy Firebase Emulator: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/b90b200e25034195c46854b2bee76de21902a82e
- [C5] 9ad8b07 (Trần Đức Tùng) – logic tính điểm, học phí, CTĐT + kiểm thử: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/9ad8b070f8a32504a6df1c615ba8d19c07ab0598
- [C6] 089af8b (Nguyễn Thanh Tùng) – README và tài liệu sửa lỗi hồ sơ: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/089af8bda22bcb2c3c94073c94c817d699539769
- [C7] ba2ae6e (Trương Thanh Vui) – 6 trang mới: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/ba2ae6ea70915f8f2c10570f9b4a787b083b854a
- [C8] 1b7fed0 (Trương Thanh Vui) – gỡ PR #4: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/1b7fed07871e8bf1e01b14c58c6ae157ed7e44e4
- [C9] d0cfea6 (Nguyễn Thanh Tùng) – sửa lỗi hồ sơ, đăng xuất: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/d0cfea67bcd1e0dd0bea08a30bebb1a6a63165a6
- [C10] 11de331 (Nguyễn Thanh Tùng) – vá V2, vá tạm V1, kiểm thử rules: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/11de331a8e50afe1196a12f6cc1d6974c9dc9090

8.2. Pull Request

- [PR1] Emulator: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/1
- [PR2] Logic tính toán: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/2
- [PR3] README, tài liệu sửa lỗi: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/3
- [PR4] 6 trang mới: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/4
- [PR5] Gỡ PR4: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/5
- [PR6] Sửa lỗi hồ sơ, vá V2/V1: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/6

8.3. Tệp trên `master`

- [F20] README.md: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/README.md
- [F21] utils/firebase.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/utils/firebase.js
- [F22] firebase.json: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/firebase.json
- [F23] package.json: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/package.json
- [F24] scripts/seed-emulator.mjs: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/scripts/seed-emulator.mjs
- [F25] firestore.rules: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/firestore.rules
- [F26] utils/grading.js: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/utils/grading.js
- [T1] tests/firestore.rules.test.mjs: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/tests/firestore.rules.test.mjs
- [T2] tests/logic.test.mjs: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/tests/logic.test.mjs

8.4. Tài liệu

- [D9] Sửa lỗi 01 – Cập nhật hồ sơ: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/sua-loi/01-cap-nhat-ho-so.md
- [D3] Bảng Giữ / Bỏ / Sửa / Thêm: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/03-giu-bo-sua-them.md
- [R6] Báo cáo tuần 2: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/bao-cao-tuan/tuan-02.md
- [R8] Báo cáo tuần 3 (file này): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/bao-cao-tuan/tuan-03.md
- [R9] Nhật ký sử dụng AI tuần 3: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/ai-log/tuan-03.md
