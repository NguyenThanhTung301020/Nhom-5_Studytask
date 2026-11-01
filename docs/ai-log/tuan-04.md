# Nhật ký sử dụng AI – Tuần 4 (26/10 – 31/10/2026)

- **Công cụ:** Claude Code (Anthropic)
- **Model:**
  - Claude Sonnet 5.5 (`claude-sonnet-5-5`): ngày 28/10 trên máy Trương Thanh Vui (chạy kiểm thử).
  - Claude Opus 5.5 (`claude-opus-5-5`): khi đưa báo cáo và tệp kiểm thử lên GitHub (PR #15), và ngày 01/11 trên máy Trần Đức Tùng (ứng dụng Claude desktop).
  - Claude Sonnet 5.5 (`claude-sonnet-5-5`): ngày 01/11 trên máy Nguyễn Thanh Tùng (ứng dụng Claude desktop).
  - Claude Opus 5.5 (`claude-opus-5-5`): ngày 01/11 trong ứng dụng Claude, dùng để viết lại câu chữ báo cáo tuần 4 và nhật ký này.
- **Người sử dụng:** Trương Thanh Vui, Trần Đức Tùng, Nguyễn Thanh Tùng (xem các mục dưới)
- **Công cụ AI khác:** không dùng

## Mã nguồn do AI sinh (Trương Thanh Vui)

**Có.** Ngày 28/10, AI sinh mã kiểm thử trên máy Trương Thanh Vui. Mã được đưa lên qua PR #15 (nhánh `docs/kiem-thu-thanh-vui`) và gắn nhãn `[AI]`.

| Tệp | Nội dung | Người review |
|---|---|---|
| `tests/firestore.rules.deep.test.mjs` | Bộ kiểm thử chuyên sâu Firestore rules, 69 ca | Nguyễn Thanh Tùng |
| `scripts/mutate.mjs` | Công cụ kiểm thử đột biến `firestore.rules` (113 bản) | Nguyễn Thanh Tùng |
| `package.json` | Thêm script `test:rules:deep` | Nguyễn Thanh Tùng |
| `docs/kiem-thu/Báo cáo chi tiết kiểm thử Firestore Thanh Vui.md` | Báo cáo kết quả chạy trên máy Thanh Vui | Nguyễn Thanh Tùng |

AI **không sửa** `firestore.rules` và **không deploy** gì lên production. Mọi lượt chạy đều dùng Firestore Emulator với project `demo-studytask`.

## Mã nguồn do AI sinh (Trần Đức Tùng)

**Không có mã chức năng mới.** Ngày 01/11, AI hỗ trợ việc 2 (kiểm thử) và việc 6 (cập nhật [D3], `_headers`, chữ "Netlify") trong kế hoạch tuần 4. Các commit liên quan đều gắn nhãn `[AI]`.

| Tệp | Nội dung | Ai làm | Commit / nhánh |
|---|---|---|---|
| `docs/kiem-thu/Báo cáo chi tiết kiểm thử Trần Đức Tùng.md` | Báo cáo kiểm thử trên máy Trần Đức Tùng | AI chạy các lệnh kiểm thử tự động và lập khung báo cáo. Trần Đức Tùng tự thử tay 8 bước của [D9], tự ghi kết quả và đổi tên tệp | `849f2e0`, nhánh `docs/kiem-thu-tran-duc-tung` (PR #17) |
| `docs/phan-tich/03-giu-bo-sua-them.md` | Sửa cột "Tuần" của 7 mục theo mục 3.4 báo cáo tuần 3 | AI | `9a99ea9`, nhánh `docs/cap-nhat-d3-cloudflare` (PR #18) |
| `_headers` (thay `netlify.toml`) | Header bảo mật và cache cho Cloudflare | Trần Đức Tùng tự tạo; AI kiểm tra cú pháp | `9a99ea9` |
| `README.md` | Đổi "Netlify" thành "Cloudflare"; thêm `_headers`, `reset-worker/` vào cấu trúc thư mục | Trần Đức Tùng sửa 4 chỗ; AI thêm phần cấu trúc thư mục | `9a99ea9` |
| `utils/firebase.js` | Chỉ sửa dòng chú thích số 5 ("Netlify" → "Cloudflare") | Trần Đức Tùng sửa; AI sửa lỗi gõ "Cloudfare" | `9a99ea9` |

AI **không sửa** `firestore.rules`, **không sửa** logic trong mã và **không deploy** gì lên production. Mọi lượt chạy đều dùng Firestore Emulator với project `demo-studytask`.

## Mã nguồn do AI sinh (Nguyễn Thanh Tùng)

**Có.** Ngày 01/11, AI hỗ trợ việc 2 (kiểm thử) và việc 4 (bản thử Cloudflare Worker) trong kế hoạch tuần 4. Các commit liên quan đều gắn nhãn `[AI]`.

| Tệp | Nội dung | Ai làm | Người review | Commit / PR |
|---|---|---|---|---|
| `reset-worker/` (`src/index.js`, `test/index.spec.js`, `wrangler.jsonc`, `vitest.config.mjs`, `package.json`) | Worker thử nhận email, gọi Identity Toolkit `accounts:sendOobCode` để gửi thư đặt lại mật khẩu; 5 ca kiểm thử không cần mạng | AI hướng dẫn tạo dự án, viết và chỉnh mã Worker cùng các ca kiểm thử. Nguyễn Thanh Tùng tự tạo tài khoản Cloudflare và project Firebase thử `studytask-test`, tự đặt khóa API, tự chạy và triển khai | Trần Đức Tùng (Approve), Trương Thanh Vui (nhận xét) | `7bcff16`, PR #16 |
| `docs/thiet-ke/04-thu-cloudflare-worker-dat-lai-mat-khau.md` | Kết quả đo, lỗi đã gặp, phần chưa kiểm chứng, đề xuất phương án máy chủ tuần 5 | AI soạn khung và điền số liệu từ các lượt chạy. Nguyễn Thanh Tùng đối chiếu với thư thực tế nhận được | Trần Đức Tùng, Trương Thanh Vui | `b486452`, PR #16 |
| `docs/kiem-thu/Báo cáo kiểm thử Thanh Tùng.md` | Kết quả `test:logic` (42/42), `test:rules` (46/46), `test:rules:deep` (69/69) và 8 bước mục 4 của [D9] trên máy Nguyễn Thanh Tùng | AI chạy các lệnh kiểm thử và lập khung báo cáo. Nguyễn Thanh Tùng tự chạy lại các lệnh, tự thử tay 8 bước [D9] và chỉnh nội dung | Trần Đức Tùng, Trương Thanh Vui (Approve) | `4a8ae2a`, PR #19 |

AI **không sửa** và **không deploy** `firestore.rules`. Worker thử đã được triển khai lên Cloudflare bằng tài khoản của Nguyễn Thanh Tùng. Worker chỉ gọi project Firebase thử `studytask-test` và không chạm vào project đang vận hành. Khóa API nằm trong `.dev.vars` và secret của Cloudflare, không đưa lên repo. Các lượt chạy kiểm thử đều dùng Firestore Emulator với project `demo-studytask`.

## Chi tiết từng lần sử dụng (Trương Thanh Vui)

| Ngày | Prompt chính (nguyên văn) | AI tạo ra | Sinh viên kiểm tra / tự làm |
|---|---|---|---|
| 28/10 | "trong file của tôi đã có các tiệp kiểm thử bao gồm : commit rules và tệp kiểm thử; nhưng chưa chạy npm run test:rules; rules chưa deploy lên production hãy thực hiện nó và ghi kết quả vào file doc kèm số ca đạt/ không đạt ( do kiểm thử là cả team nên cần ghi chú rõ ca thực hiện trên máy Thanh Vui)" | Cài phụ thuộc (`npm ci`), chạy `npm run test:rules` (46/46 đạt); viết bộ kiểm thử chuyên sâu 69 ca và công cụ đột biến; chạy 113 bản đột biến (110 bản bị phát hiện). Không deploy rules. | _(Thanh Vui tự ghi: đã tự kiểm tra những gì)_ |
| 29/10 | Yêu cầu đưa thư mục `docs/kiem-thu` lên GitHub. | Tạo nhánh `docs/kiem-thu-thanh-vui`, mở PR #15, viết mô tả PR kèm lưu ý. | Nguyễn Thanh Tùng review PR #15 và yêu cầu sửa 4 điểm. |
| 01/11 | "… tiến hành up file trong đường dẫn và fix các lỗi trong mục gộp giúp tôi" (kèm ảnh nhận xét của Nguyễn Thanh Tùng trên PR #15) | Thêm `tests/firestore.rules.deep.test.mjs`, `scripts/mutate.mjs` và script `test:rules:deep`; điền nhánh `docs/so-do-dfd` và commit `d087a67` vào báo cáo; đổi tên tệp còn một khoảng trắng; tạo nhật ký AI; chạy lại bộ chuyên sâu trên nhánh của PR. | Nguyễn Thanh Tùng review lại và gộp PR #15. |

## Chi tiết từng lần sử dụng (Trần Đức Tùng)

| Ngày | Prompt chính (nguyên văn) | AI tạo ra | Sinh viên kiểm tra / tự làm |
|---|---|---|---|
| 01/11 | "Hãy chạy npm run test:logic, npm run test:rules; thử tay các bước ở mục 4 của [D9].Ghi kết quả chạy trong docs/, kèm số ca đạt/không đạt." | Chạy `test:logic` (42/42 đạt) và `test:rules` (46/46 đạt; chạy trên Emulator riêng ở cổng 8180 vì máy đang mở Emulator ở cổng 8080); tự thao tác các bước [D9] trên trình duyệt; lập báo cáo. | Đọc lại báo cáo, yêu cầu chạy lại và bổ sung thông tin máy. |
| 01/11 | "chạy lại mộn lần nữa sửa lại file ket-qua-kiem-thu-tran-duc-tung.md ghi báo cáo rõ thông tin chi tiết thông tin về máy tôi khi chạy." | Chạy lại hai lệnh (kết quả không đổi), ghi cấu hình máy, so sánh hai lần chạy. | Tự sửa lại phần thông tin máy trong báo cáo. |
| 01/11 | "kiểm tra lại về ket-qua-kiem-thu-tran-duc-tung.md có liên quan đến file 01-cap-nhat-ho-so.md xem lại về các thực trên máy đúng chưa" | Đối chiếu báo cáo với [D9] và mã (`app.js`, `pages/Profile.js`); chỉ ra 6 chỗ sai hoặc thiếu. | Đồng ý sửa cả 6 chỗ. |
| 01/11 | "thui sửa lại ket-qua-kiem-thu-tran-duc-tung.md những cái j mà AI chạy bỏ để về các thao tác tôi thực hiện lên rùi ghi ra. bây hãy run để tôi thực hiện" | Bỏ các lượt AI tự thao tác khỏi mục 5 của báo cáo; bật lại Emulator và seed dữ liệu sạch; mở Emulator UI cho bước 5; tắt/bật Emulator cho bước 6; sửa lỗi cổng 5500 khi khởi động web. | **Tự thao tác đủ 8 bước** ở mục 4 của [D9] trên trình duyệt, tự ghi cột "Kết quả thực tế" và "Đánh giá" (8/8 đạt). |
| 01/11 | "hướng dẫn tôi thực hiện Cập nhật [D3] theo đề xuất; thay netlify.toml bằng _headers; sửa chữ “Netlify” trong README và chú thích mã." | Tìm lại đề xuất ở mục 3.4 (đã bị xóa khỏi báo cáo tuần 3, khôi phục từ commit `fec22af`); hướng dẫn từng bước, kèm nội dung `_headers` và các dòng cần sửa. | Tự tạo `_headers`, tự sửa README, sau đó nhờ AI kiểm tra. |
| 01/11 | "oke tiếp tục" | Sửa cột "Tuần" của [D3], sửa lỗi gõ "Cloudfare", thêm `_headers` và `reset-worker/` vào README; kiểm tra để không còn sót chữ "Netlify". | Xem lại toàn bộ thay đổi trước khi push. |
| 01/11 | "push Theo bảng kế hoạch tuần 4 cho tôi file Báo cáo chi tiết kiểm thử Trần Đức Tùng.md và các file về Cập nhật [D3] … Và người review xác nhận là Nguyễn Thanh Tùng và Trương Thanh Vui 1 trong 2." | Commit và push hai nhánh `docs/cap-nhat-d3-cloudflare` và `docs/kiem-thu-tran-duc-tung`. Chưa tạo được PR vì trình duyệt của ứng dụng chưa đăng nhập GitHub. | Trần Đức Tùng tự tạo PR #18 và #17; Trương Thanh Vui review và gộp. |

## Chi tiết từng lần sử dụng (Nguyễn Thanh Tùng)

| Ngày | Prompt chính (nguyên văn) | AI tạo ra | Sinh viên kiểm tra / tự làm |
|---|---|---|---|
| 29/10 | "nếu bạn đã pull về hãy hướng dẫn tôi Làm bản thử Cloudflare Worker: tạo tài khoản và gửi email đặt lại mật khẩu qua Identity Toolkit trên project thử." (kèm ảnh chụp màn hình từng bước) | Hướng dẫn từng bước: tạo project Firebase thử `studytask-test`, bật đăng nhập email/mật khẩu, cài Node và Wrangler, tạo `reset-worker/`, đặt khóa API, chạy `wrangler dev`, đặt secret, chạy `wrangler deploy`; viết và chỉnh mã Worker. | Tự tạo tài khoản và project, tự nhập khóa API và thao tác trên Cloudflare/Firebase; kiểm tra thư đặt lại mật khẩu nhận được trong Gmail (2 lần: khi chạy cục bộ và sau khi deploy). |
| 01/11 | "hãy Commit bản thử và ghi chú kết quả; chốt phương án máy chủ cho tuần 5 giúp tôi." | Commit `7bcff16`, `b486452`; tạo tệp `docs/thiet-ke/04-thu-cloudflare-worker-dat-lai-mat-khau.md` (kết quả đo, lỗi, phần chưa kiểm chứng, đề xuất phương án tuần 5); viết lại 5 ca kiểm thử. | Đọc lại số liệu; quyết định không ghi địa chỉ Worker vào tài liệu. Phương án tuần 5 **chưa được nhóm chốt**. |
| 01/11 | "hãy pull về trước khi push"; "Mở PR" | Pull, push nhánh `feat/cloudflare-worker-thu`; soạn tiêu đề và mô tả PR (máy chưa cài công cụ `gh`). | Tự mở PR #16 trên GitHub; Trần Đức Tùng Approve, Trương Thanh Vui nhận xét và gộp. |
| 01/11 | "https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/15 hãy kiểm tra lại Pull requests xem thử còn vấn đề nào nữa không"; "hãy ghi review giúp tôi" | Đối chiếu PR #15 với bốn điểm đã yêu cầu sửa (tệp thiếu, nhánh Git, nhật ký AI, tên tệp); soạn nội dung review. | Tự đăng review trên GitHub (nhận xét và Approve) rồi gộp PR #15. |
| 01/11 | "hãy hướng dẫn tôi chạy lại `npm run test:rules` (46 ca) và `npm run test:rules:deep` (69 ca) giúp tôi"; "theo như Teminal kết quả đã đạt chưa?" | Hướng dẫn cách chạy; hướng dẫn xử lý lỗi môi trường (đường dẫn có dấu tiếng Việt; thư mục tạm của Java 21; tùy chọn `-Djdk.net.unixdomain.tmpdir`); đọc kết quả trên terminal. | **Tự chạy lệnh trên máy mình**, kết quả 46/46 và 69/69 đạt. |
| 01/11 | "Hãy kiểm tra lại Chạy npm run test:logic, npm run test:rules; thử tay các bước ở mục 4 của [D9]. Ghi kết quả chạy trong docs/, kèm số ca đạt/không đạt." | Chạy `test:logic` (42/42), `test:rules` (46/46), `test:rules:deep` (69/69) trên bản clone ở đường dẫn không dấu; tự điều khiển trình duyệt thử 8 bước [D9] (kết quả này không dùng trong báo cáo, xem mục sai sót 2); tổng hợp thành báo cáo. | **Tự thử tay lại 8 bước [D9]** trên máy mình; chỉnh báo cáo để kết quả thử tay là của mình; đưa lên GitHub qua PR #19. |
| 01/11 | "hãy tổng hợp lại thành 1 file.md để tôi xem lại, chưa up github vội"; "hãy xem lại file báo cáo này 1 lần cuối xem thử nội dung đã đầy đủ chưa"; "push lên git" | Tổng hợp và rút gọn báo cáo kiểm thử; liệt kê các chỗ còn thiếu (đường dẫn [D9], câu kết luận, lệnh chạy); commit `4a8ae2a`, push; soạn mô tả PR #19. | Tự sửa theo góp ý (thêm đường dẫn [D9], lệnh chạy, kết luận); tự mở PR #19; Trần Đức Tùng và Trương Thanh Vui Approve. |
| 01/11 | "tổng hợp những AI-log của từng thành viên thành 1 file thống nhất"; "làm báo cáo tuần 4 theo nhận xét của giảng viên và lịch của file '03-giu-bo-sua-them' để lên kế hoạch tuần 5"; "viết lại văn của để nhìn tự nhiên hơn" | Gộp nhật ký AI của ba thành viên vào tệp này; soạn bản nháp báo cáo tuần 4 và kế hoạch tuần 5 từ số liệu trên GitHub (PR, review, commit); viết lại câu chữ của hai tệp cho tự nhiên hơn. | _(Ghi lại phần nhóm đã tự đối chiếu số liệu với GitHub và tự chỉnh sửa trước khi nộp)_ |

## Sai sót của AI phát hiện trong tuần (Trương Thanh Vui)

1. **Ca kiểm thử viết sai ở lần chạy đầu.** Ở lượt 2, một ca dùng tài khoản `NEW` chưa có hồ sơ, nên ca "được phép" bị từ chối và kéo theo các ca "bị chặn" trong cùng test đạt giả. AI phát hiện và sửa lại ca này (tạo hồ sơ trước khi thử).
2. **Công cụ đột biến tính nhầm lỗi kết nối thành "sống sót".** Lượt 6 báo "104/113 sống sót" do Emulator bị tắt giữa chừng. Kết quả này bị loại bỏ, và công cụ được sửa để chỉ tính "sống sót" khi mọi ca đều đạt.
3. **PR #15 lần đầu thiếu tệp và thông tin.** Báo cáo có nhắc đến `test:rules:deep`, bộ chuyên sâu và `mutate.mjs` nhưng PR không chứa các tệp này. Dòng "Nhánh Git" còn để trống và PR chưa có nhật ký AI. Nguyễn Thanh Tùng phát hiện khi review, và các phần này đã được bổ sung.

## Sai sót của AI phát hiện trong tuần (Trần Đức Tùng)

1. **Ghi lượt AI tự thao tác như kết quả thử tay.** Bản báo cáo đầu ghi các bước [D9] do AI tự bấm trên trình duyệt, trong khi kế hoạch yêu cầu thành viên tự thử tay. Trần Đức Tùng yêu cầu bỏ phần AI chạy và tự làm lại đủ 8 bước.
2. **Để sót tiến trình chạy nền.** Sau lần chạy `test:rules` ở cổng 8180, tiến trình Java của Emulator vẫn giữ cổng, nên lần chạy sau báo "port taken". Server web chạy nền giữ cổng 5500 khiến lần khởi động web tiếp theo báo `EADDRINUSE`. AI phải tìm và tắt đúng các tiến trình này.
3. **Bảng tổng hợp lệch với kết quả.** Khi làm lại phần thử tay, bảng tổng hợp ở mục 2 của báo cáo vẫn ghi "8 chưa chạy", trong khi mục 5 đã ghi 8/8 đạt. Lỗi này được sửa trước khi mở PR.

## Sai sót của AI phát hiện trong tuần (Nguyễn Thanh Tùng)

1. **Nói sai về trạng thái nhánh `master`.** Bản kết quả đầu ghi `test:rules:deep` "chưa có trên master", trong khi PR #15 đã được gộp. Nguyễn Thanh Tùng chạy lại thì thấy script đã có. Sau đó AI chạy bộ chuyên sâu (69/69) và sửa báo cáo.
2. **Ghi lượt AI tự thao tác như kết quả thử tay (giống lỗi bên Trần Đức Tùng).** AI tự điều khiển trình duyệt thử 8 bước [D9] và ghi "8/8 đạt", trong khi [D9] yêu cầu thành viên tự thử tay trước khi xác nhận. Bản báo cáo đầu đã ghi rõ phần này do AI thực hiện. Sau đó Nguyễn Thanh Tùng tự thử lại, và báo cáo chỉ dùng kết quả của lần thử tay này.
3. **Đánh giá nhầm một bước.** Ở bước 4 của [D9], AI báo "không thấy thông báo lưu", trong khi thực tế thông báo chỉ hiện ra sau một nhịp ngắn. Báo cáo đã được sửa lại thành "thông báo xuất hiện sau một nhịp ngắn, không tức thì".
4. **Hướng dẫn lệnh không chạy được trên máy.** AI hướng dẫn gọi Worker bằng `curl.exe` kèm JSON, nhưng Windows PowerShell 5.1 làm hỏng dấu nháy kép nên lệnh báo lỗi. Cách gọi được đổi sang `Invoke-RestMethod`.
