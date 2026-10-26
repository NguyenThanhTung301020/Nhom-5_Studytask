# Báo cáo tuần 3

- Đề tài: Xây dựng một website quản lý deadline học tập cho sinh viên (sản phẩm: StudyTask)
- GVHD: TS. Huỳnh Xuân Phụng
- Nhóm: Nguyễn Thanh Tùng (24TX810027) · Trần Đức Tùng (24TX810026) · Trương Thanh Vui (24TX810021)
- Thời gian: 19/10 – 26/10/2026
- Repo GitHub (public): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask
- Toàn bộ link minh chứng: xem mục 8. Các mã [C4], [PR1], [D9]... trong bài trỏ tới mục này.

## 1. Trọng tâm tuần và tình trạng commit

Tuần 3 đưa mã nguồn tuần 2 (trước đây chỉ nằm trên máy cá nhân) lên GitHub theo kế hoạch: mỗi phần được phát triển trên một nhánh riêng, mở Pull Request (PR), có thành viên khác review trước khi gộp vào `master`. Cả 3 thành viên đều commit và mở PR bằng tài khoản của mình.

Bảng dưới đây ghi tóm tắt nội dung từng commit; mã commit và lịch sử gộp được giữ theo GitHub.

| Mã | Commit | Người commit (tài khoản GitHub) | Ngày | Nội dung tóm tắt | PR |
|---|---|---|---|---|---|
| [C4] | b90b200 | Trương Thanh Vui (Thanh-Vui-Minx) | 21/10 | Chạy Firebase Emulator trên máy local (đợt 1) | [PR1] |
| [C5] | 9ad8b07 | Trần Đức Tùng (TranDucTung-24tx810026) | 21/10 | Logic tính điểm, học phí, chương trình đào tạo và kiểm thử (đợt 1) | [PR2] |
| [C6] | 089af8b | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 22/10 | README và tài liệu sửa lỗi hồ sơ | [PR3] |
| [C7] | ba2ae6e | Trương Thanh Vui (Thanh-Vui-Minx) | 22/10 | Sáu trang mới, sổ điểm và lịch học (đợt 2) | [PR4] |
| [C8] | 1b7fed0 | Trương Thanh Vui (Thanh-Vui-Minx) | 22/10 | Hoàn tác thay đổi của PR4 | [PR5] |
| [C9] | d0cfea6 | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 23/10 | Sửa lỗi cập nhật hồ sơ, đăng xuất và đồng bộ dữ liệu theo tài khoản | [PR6] |
| [C10] | 11de331 | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 23/10 | Vá quy tắc V2, vá tạm V1 và bổ sung kiểm thử rules | [PR6] |

### Tình trạng review và gộp PR

| PR | Người mở | Người review (Approve) | Người gộp | Ngày gộp |
|---|---|---|---|---|
| [PR1] Emulator | Trương Thanh Vui | Nguyễn Thanh Tùng | Nguyễn Thanh Tùng | 23/10 |
| [PR2] Logic tính toán | Trần Đức Tùng | Trương Thanh Vui | Trương Thanh Vui | 22/10 |
| [PR3] README, tài liệu sửa lỗi | Nguyễn Thanh Tùng | Trần Đức Tùng | Trần Đức Tùng | 22/10 |
| [PR4] Sáu trang mới | Trương Thanh Vui | Không có review | Trương Thanh Vui | 22/10 |
| [PR5] Gỡ PR4 | Trương Thanh Vui | Trần Đức Tùng | Trần Đức Tùng | 23/10 |
| [PR6] Sửa lỗi hồ sơ, vá V2/V1 | Nguyễn Thanh Tùng | Trương Thanh Vui | Trương Thanh Vui | 23/10 |

### Trình tự gộp PR và ảnh hưởng đến `master`

- **PR4 được gộp trước PR1 và chưa có review.** Sau khi PR4 được gộp, `utils/store.js` sử dụng các hàm chỉ được bổ sung trong PR1, trong khi PR1 chưa được gộp vào `master`. Vì vậy, các phụ thuộc chưa đầy đủ và mã trên `master` phát sinh lỗi import. Trương Thanh Vui tự phát hiện vấn đề và mở PR5 để hoàn tác PR4.
- **PR5 được gộp sau PR6.** `app.js` trong PR6 có import sáu trang mà PR5 vừa gỡ: `pages/MonthCalendar.js`, `pages/Tuition.js`, `pages/GradingPolicy.js`, `pages/Curriculum.js`, `pages/Graduation.js` và `pages/Theses.js`. Do các tệp này không còn trên `master`, **`master` tại commit `dea9dae` hiện chưa chạy được**. Cách sửa là hoàn tác commit [C8] — commit `1b7fed07871e8bf1e01b14c58c6ae157ed7e44e4` đã hoàn tác PR4 — để khôi phục lại sáu trang, sau đó kiểm tra ứng dụng trên Firebase Emulator và mở PR mới. Đây là việc số 1 của tuần 4 (mục 5), hiện **đang thực hiện**.
- **Bản đang vận hành không bị ảnh hưởng.** Bản này được đưa lên Cloudflare bằng cách upload thủ công, không tự động lấy mã từ nhánh `master` (xem mục 3.3).

## 2. Công việc đã làm và phân công

Đối chiếu theo kế hoạch tuần 3 ở mục 5 báo cáo tuần 2 [R6].

| # | Công việc | Người phụ trách | Kết quả | Minh chứng |
|---|---|---|---|---|
| 1 | Viết README (cấu trúc thư mục, cách chạy, quy ước nhánh và commit) | Nguyễn Thanh Tùng | Đạt | [F20], commit [C6], [PR3] |
| 2 | Review mã chạy Emulator rồi commit | Trương Thanh Vui (Nguyễn Thanh Tùng review) | Đạt một phần: đã có mã trên GitHub, đã review và gộp; chưa có kết quả chạy thử được ghi lại | [F21]–[F24], commit [C4], [PR1] |
| 3 | Sửa lỗi “gửi yêu cầu cập nhật hồ sơ” | Nguyễn Thanh Tùng (Trương Thanh Vui review) | Đạt một phần: có commit sửa N1–N9 và tài liệu nguyên nhân; chưa thử tay các bước ở mục 4 của [D9] | [D9], commit [C9], [PR6] |
| 4 | Vá V2, vá tạm V1 trong `firestore.rules`, có kiểm thử tự động | Nguyễn Thanh Tùng (Trương Thanh Vui review) | Đạt một phần: có commit rules và tệp kiểm thử; chưa chạy `npm run test:rules`; rules chưa deploy lên production | [F25], [T1], commit [C10], [PR6] |
| 5 | Vẽ sơ đồ luồng dữ liệu do nhóm tự thực hiện | Trần Đức Tùng | Chưa đạt: chưa có sơ đồ trên GitHub; chuyển sang tuần 4 | Chưa có |
| 6 | Rà soát tính năng theo bảng Giữ/Bỏ/Sửa/Thêm [D3] | Cả nhóm | Đạt một phần: đã phân tích và đề xuất lịch mới (mục 3.4), chưa cập nhật tệp [D3] | Mục 3.4 của báo cáo này |
| 7 | Hoàn thiện nhật ký sử dụng công cụ tuần 3, đối chiếu với commit | Cả nhóm (Nguyễn Thanh Tùng tổng hợp) | Đạt | [R9] |
| 7b | Phần tính toán (điểm theo quy chế, học phí, chương trình đào tạo) và sáu trang phát sinh từ tuần 2 | Trần Đức Tùng (tính toán), Trương Thanh Vui (trang) | Phần tính toán đã gộp. Sáu trang đã được gộp rồi gỡ; việc khôi phục đang thực hiện theo kế hoạch tuần 4 | [F26], [T2], commit [C5], [PR2], [PR4], [PR5] |

## 3. Kết quả chính

### 3.1. Đưa mã tuần 2 lên GitHub theo quy trình PR

- Đã tạo 6 PR với 7 commit để đưa các phần công việc lên GitHub.
- Có 5/6 PR được một thành viên khác Approve trước khi gộp. PR4 là ngoại lệ: chưa có review trước khi gộp và việc gộp không đúng thứ tự phụ thuộc đã làm `master` phát sinh lỗi.
- Qua sự cố PR4 và PR5, nhóm xác định cần ghi rõ phụ thuộc giữa các PR, chỉ gộp sau khi PR phụ thuộc đã được gộp và không gộp PR khi chưa có Approve.

### 3.2. Nội dung đã thực hiện và trạng thái hiện tại của `master`

- **Firebase Emulator ([PR1]):** có cấu hình để khi chạy trên `localhost`/`127.0.0.1`, ứng dụng nối vào Emulator với project `demo-studytask`, tránh chạm dữ liệu thật; có script nạp tài khoản demo.
- **Sửa lỗi hồ sơ ([PR6], commit [C9]):** bổ sung thông báo lưu, thời hạn 10 giây khi mất mạng, sao chép cả số điện thoại, gắn dữ liệu cục bộ theo tài khoản, tạo hồ sơ trống theo vai trò, kiểm tra dữ liệu nhập và thoát hẳn phiên Firebase khi đăng xuất. Các nguyên nhân N1–N9 được ghi trong [D9].
- **Vá quy tắc bảo mật ([PR6], commit [C10]):** V2 giới hạn người dùng tự sửa `name`, `phone`; các trường `role`, `subjectIds`, `expiresAt` chỉ do Quản trị viên sửa. V1 mới là bản vá tạm, chuyển mật khẩu sang `userSecrets/{uid}` và giới hạn quyền đọc cho Quản trị viên. Mật khẩu vẫn ở dạng văn bản thuần nên V1 chưa được xử lý triệt để (xem mục 3.4).
- **Phần tính toán ([PR2]):** có `utils/grading.js`, `tuition.js`, `curriculum.js`, `store.js` và kiểm thử `tests/logic.test.mjs`.
- **Lỗi cần xử lý trước khi xác nhận ứng dụng chạy được:** tại commit `dea9dae`, `app.js` tham chiếu sáu trang đã bị PR5 gỡ. Vì vậy, dù các phần công việc nêu trên đã có commit/PR, `master` hiện chưa thể khởi chạy ứng dụng hoàn chỉnh cho đến khi khôi phục đủ sáu trang và kiểm tra trên Emulator.

### 3.3. Nơi triển khai bản đang vận hành

README (4 chỗ) và chú thích trong `utils/firebase.js` ghi bản đang vận hành chạy trên Netlify. Thực tế nhóm đã chuyển sang **Cloudflare (Workers & Pages)** từ trước; bản mới được upload thủ công.

- Việc gộp mã vào `master` không tự làm thay đổi trang đang chạy. Nhóm upload mã mới lên Cloudflare theo thao tác thủ công sau khi triển khai `firestore.rules` mới lên Firebase và sao lưu trước.
- Tệp `netlify.toml` (các header bảo mật) không có tác dụng trên Cloudflare, cần thay bằng tệp `_headers`.
- README và một số chú thích trong mã vẫn ghi “Netlify”; việc sửa các chỗ này nằm trong kế hoạch tuần 4.

### 3.4. Rà soát bảng Giữ/Bỏ/Sửa/Thêm [D3] – đề xuất điều chỉnh lịch

Nhóm ưu tiên dồn các mục **Bỏ** và **Sửa** liên quan tới mật khẩu vào tuần 5. Đối chiếu với thực tế, có 3 điểm:

1. **V1 chậm so với bảng.** [D3] ghi bỏ lưu mật khẩu ở tuần 2–3, nhưng hiện mới có bản vá tạm trên `master`, chưa deploy. Đề xuất tách: vá tạm (deploy rules và chuyển mật khẩu sang `userSecrets`) ở tuần 4; bỏ hẳn ở tuần 5.
2. **Máy chủ để chạy nghiệp vụ tài khoản.** Admin SDK không chạy được trong trình duyệt nên cần một máy chủ:

   Nhóm sẽ thử nghiệm Cloudflare Worker trên nền tảng đang dùng. Do Admin SDK của Firebase chạy trên Node.js và không dùng trực tiếp trên Workers, bản thử cần gọi REST API của Google (Identity Toolkit), lưu khóa dịch vụ trong Workers Secrets và tự kiểm tra token cùng vai trò. Nhóm chưa bật gói Blaze hoặc lựa chọn dịch vụ có thể phát sinh chi phí; trước khi cân nhắc dịch vụ trả phí, cần đánh giá chi phí cụ thể và thống nhất phương án trong nhóm.

   Thiết kế dự kiến không lưu mật khẩu ở đâu cả: khi Quản trị viên tạo tài khoản, máy chủ tạo người dùng rồi gửi email đặt lại mật khẩu; bỏ chức năng Quản trị viên tự nhập mật khẩu cho người khác và bỏ Firebase phụ (mục 4 của [D3]). Phương án Workers chưa được chạy thử; tuần 4 sẽ làm bản thử nhỏ.
3. **Dữ liệu và thứ tự.** Mật khẩu của các tài khoản thật đã từng đọc được bởi mọi tài khoản, nên sau khi sửa phải bắt đổi mật khẩu và xóa trường `password` khỏi Firestore, kể cả bản sao lưu. Thứ tự phụ thuộc: máy chủ → bỏ lưu mật khẩu → bỏ Firebase phụ → rules bỏ `userSecrets` → chấm trắc nghiệm ở máy chủ. Mục 9 (chuyển sang Vite) nên dời sau tuần 5 để tuần 5 không quá tải.

Đề xuất cột “Tuần” mới cho [D3]: mục 1 → tuần 4 (vá tạm), tuần 5 (bỏ hẳn); mục 3 → tuần 5; mục 4 → tuần 5; mục 5 → tuần 4–5; mục 6 → tuần 5–6; mục 11 → tuần 4 (bản thử), tuần 5 (hoàn thiện); mục 9 → sau tuần 5. Nhóm sẽ cập nhật tệp [D3] theo kế hoạch đã điều chỉnh và kết quả rà soát thực tế.

## 4. Khó khăn, vướng mắc

- **Thứ tự gộp PR chưa chặt.** Kế hoạch chia mã theo người nhưng chưa ghi rõ phụ thuộc giữa các tệp (ví dụ `utils/store.js` cần các hàm trong `utils/firebase.js`). Hai lần gộp sai thứ tự — PR4 trước PR1 và PR5 sau PR6 — khiến `master` lỗi. Từ tuần 4, mỗi PR phải ghi rõ PR phụ thuộc và chỉ gộp sau khi có Approve.
- **Chưa có đủ kết quả kiểm thử.** Các tệp kiểm thử đã có trên GitHub nhưng chưa có kết quả chạy được ghi lại; một số máy thành viên chưa cài Node.js và Java.
- **Rules chưa deploy lên production.** Vì vậy, trên hệ thống đang chạy, mật khẩu vẫn nằm trong `user/{uid}` (V1) và người dùng vẫn tự sửa được `role` (V2).
- **Quản lý tài khoản triển khai.** Tài khoản Cloudflare đang do một thành viên giữ; nhóm cần thống nhất người quản lý khóa dịch vụ khi có máy chủ.

## 5. Kế hoạch tuần 4 (26/10 – 31/10/2026)

| # | Công việc | Người phụ trách | Kết quả cần đạt | Trạng thái khi nộp báo cáo tuần 3 |
|---|---|---|---|---|
| 1 | Đưa lại sáu trang của PR4 bằng cách hoàn tác commit [C8] (`1b7fed07871e8bf1e01b14c58c6ae157ed7e44e4`) để `master` chạy được; kiểm tra ứng dụng trên Firebase Emulator; mở PR mới và bổ sung link commit mới vào báo cáo sau khi hoàn tất | Trương Thanh Vui (Nguyễn Thanh Tùng review) | Khôi phục đủ `MonthCalendar.js`, `Tuition.js`, `GradingPolicy.js`, `Curriculum.js`, `Graduation.js`, `Theses.js`; ứng dụng mở trên Emulator không lỗi import; có PR và commit khôi phục để đối chiếu | **đang thực hiện**. Chưa có commit khôi phục mới để dẫn link; sẽ bổ sung link commit mới vào báo cáo khi hoàn tất. Kế hoạch sửa giữ nguyên. |
| 2 | Chạy `npm run test:logic`, `npm run test:rules`; thử tay các bước ở mục 4 của [D9] | Cả nhóm (mỗi người chạy trên máy mình) | Ghi kết quả chạy trong `docs/`, kèm số ca đạt/không đạt | Theo kế hoạch trong bản báo cáo trước khi chỉnh sửa |
| 3 | Sau khi hoàn tất kiểm thử và sao lưu: deploy `firestore.rules` mới lên production, Quản trị viên chuyển mật khẩu sang `userSecrets`, rồi mới upload mã lên Cloudflare | Nguyễn Thanh Tùng, Trương Thanh Vui | Biên bản các bước trong `docs/`; đăng nhập thử 3 vai trò | Theo kế hoạch trong bản báo cáo trước khi chỉnh sửa |
| 4 | Làm bản thử Cloudflare Worker: tạo tài khoản và gửi email đặt lại mật khẩu qua Identity Toolkit trên project thử | Nguyễn Thanh Tùng | Commit bản thử và ghi chú kết quả; chốt phương án máy chủ cho tuần 5 | Theo kế hoạch trong bản báo cáo trước khi chỉnh sửa |
| 5 | Vẽ sơ đồ luồng dữ liệu do nhóm tự thực hiện | Trần Đức Tùng | Sơ đồ trong `docs/so do/` | Theo kế hoạch trong bản báo cáo trước khi chỉnh sửa |
| 6 | Cập nhật [D3] theo đề xuất ở mục 3.4; thay `netlify.toml` bằng `_headers`; sửa chữ “Netlify” trong README và chú thích mã | Trần Đức Tùng | Commit cập nhật | Theo kế hoạch trong bản báo cáo trước khi chỉnh sửa |
| 7 | Hoàn thiện nhật ký sử dụng công cụ tuần 4, đối chiếu với commit | Cả nhóm | `docs/ai-log/tuan-04.md` | Theo kế hoạch trong bản báo cáo trước khi chỉnh sửa |

## 6. Kính xin ý kiến Thầy

- Lịch điều chỉnh: vá tạm V1/V2 trên hệ thống đang chạy ở tuần 4, bỏ hẳn việc lưu mật khẩu ở tuần 5 (thay vì tuần 2–3 như bảng ban đầu).

## 7. Khai báo công cụ hỗ trợ

- Công cụ: Claude Code (Anthropic).
- Model đã sử dụng: Claude Sonnet 5.5 (`claude-sonnet-5-5`, 20/10–23/10/2026); Claude Opus 5.5 (`claude-opus-5-5`, 24/10/2026).
- Phạm vi sử dụng:
  - Nguyễn Thanh Tùng (20/10–24/10): hỗ trợ lập kế hoạch chia đợt, chuẩn bị gói tệp, tạo nhánh/commit/push phần việc của mình ([C6], [C9], [C10]); đối chiếu mã PR1 trước khi review; phân tích [D3]; hỗ trợ soạn thảo báo cáo tuần 3 và nhật ký tuần 3. Nhóm đã rà soát nội dung báo cáo và đối chiếu các mốc PR/commit với GitHub.
  - Trương Thanh Vui: phần mô tả PR1 và PR5 có dòng “Generated with Claude Code”.
  - Mã nguồn trong một số commit tuần 3 được chuẩn bị từ tuần 2 và đã được ghi trong nhật ký tuần 2; tuần 3 đưa các phần đó lên GitHub.
- Công cụ hỗ trợ khác: không dùng.
- Những phần nhóm trực tiếp thực hiện: review và Approve PR; quyết định gộp hoặc gỡ PR; phát hiện hệ thống đang vận hành trên Cloudflare thay vì Netlify; đề xuất điều chỉnh thứ tự các hạng mục; mỗi thành viên commit bằng tài khoản của mình.
- Sai sót được phát hiện trong quá trình rà soát: kế hoạch chia đợt chưa thể hiện đầy đủ phụ thuộc giữa `utils/firebase.js`, rules và các hằng số; thông tin về nền tảng triển khai ban đầu chưa chính xác. Nhóm đã đối chiếu lại các nội dung này với PR, cấu hình triển khai và sửa báo cáo cho phù hợp. Nhật ký và prompt liên quan được lưu tại [R9].
- Bằng chứng: nhật ký sử dụng công cụ tuần 3 và các prompt theo từng lần sử dụng tại [R9].

## 8. Danh sách link GitHub

### 8.1. Commit tuần 3

- [C4] b90b200 (Trương Thanh Vui) – chạy Firebase Emulator: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/b90b200e25034195c46854b2bee76de21902a82e
- [C5] 9ad8b07 (Trần Đức Tùng) – logic tính điểm, học phí, chương trình đào tạo và kiểm thử: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/9ad8b070f8a32504a6df1c615ba8d19c07ab0598
- [C6] 089af8b (Nguyễn Thanh Tùng) – README và tài liệu sửa lỗi hồ sơ: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/089af8bda22bcb2c3c94073c94c817d699539769
- [C7] ba2ae6e (Trương Thanh Vui) – sáu trang mới: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/ba2ae6ea70915f8f2c10570f9b4a787b083b854a
- [C8] 1b7fed0 (Trương Thanh Vui) – hoàn tác PR4: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/1b7fed07871e8bf1e01b14c58c6ae157ed7e44e4
- [C9] d0cfea6 (Nguyễn Thanh Tùng) – sửa lỗi hồ sơ, đăng xuất: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/d0cfea67bcd1e0dd0bea08a30bebb1a6a63165a6
- [C10] 11de331 (Nguyễn Thanh Tùng) – vá V2, vá tạm V1, kiểm thử rules: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/11de331a8e50afe1196a12f6cc1d6974c9dc9090
- **Commit khôi phục sáu trang theo việc số 1 tuần 4:** đang thực hiện; bổ sung link commit mới sau khi hoàn tất, hiện chưa có URL để dẫn.

### 8.2. Pull Request

- [PR1] Emulator: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/1
- [PR2] Logic tính toán: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/2
- [PR3] README, tài liệu sửa lỗi: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/3
- [PR4] Sáu trang mới: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/4
- [PR5] Gỡ PR4: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/5
- [PR6] Sửa lỗi hồ sơ, vá V2/V1: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/6

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

### 8.4. Tài liệu

- [D9] Sửa lỗi 01 – Cập nhật hồ sơ: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/sua-loi/01-cap-nhat-ho-so.md
- [D3] Bảng Giữ / Bỏ / Sửa / Thêm: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/03-giu-bo-sua-them.md
- [R6] Báo cáo tuần 2: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/bao-cao-tuan/tuan-02.md
- [R8] Báo cáo tuần 3 (file này): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/bao-cao-tuan/tuan-03.md
- [R9] Nhật ký sử dụng công cụ tuần 3: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/ai-log/tuan-03.md
