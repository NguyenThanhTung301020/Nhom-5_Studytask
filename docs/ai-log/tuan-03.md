# Nhật ký sử dụng AI – Tuần 3 (19/10 – 24/10/2026)

- **Công cụ:** Claude Code (Anthropic)
- **Model:** Claude Sonnet 5.5 (`claude-sonnet-5-5`) từ 20/10 đến 23/10; Claude Opus 5.5 (`claude-opus-5-5`) ngày 24/10
- **Người sử dụng:** Nguyễn Thanh Tùng (20/10 – 24/10); Trương Thanh Vui (mô tả PR #1, #5 có dòng "Generated with Claude Code")
- **Công cụ AI khác:** không dùng

## Mã nguồn do AI sinh

**Có.** Tuần 3 không sinh mã mới: các commit dưới đây đưa lên GitHub phần mã AI đã sinh ở tuần 2 trên máy Trương Thanh Vui (khai báo trong `docs/ai-log/tuan-02.md`). Mỗi commit có nhãn `[AI]`, đi qua Pull Request.

| Commit | Người commit | PR | Tệp | Người review |
|---|---|---|---|---|
| [`b90b200`](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/b90b200e25034195c46854b2bee76de21902a82e) | Trương Thanh Vui | #1 | `package.json`, `package-lock.json`, `firebase.json`, `scripts/seed-emulator.mjs`, `.gitignore`, `utils/firebase.js` | Nguyễn Thanh Tùng |
| [`9ad8b07`](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/9ad8b070f8a32504a6df1c615ba8d19c07ab0598) | Trần Đức Tùng | #2 | `utils/grading.js`, `tuition.js`, `curriculum.js`, `store.js`, `tests/logic.test.mjs` | Trương Thanh Vui |
| [`089af8b`](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/089af8bda22bcb2c3c94073c94c817d699539769) | Nguyễn Thanh Tùng | #3 | `README.md`, `docs/sua-loi/01-cap-nhat-ho-so.md` | Trần Đức Tùng |
| [`ba2ae6e`](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/ba2ae6ea70915f8f2c10570f9b4a787b083b854a) | Trương Thanh Vui | #4 | 6 trang mới, `components/GradeBook.js`, `pages/Schedule.js`, `style.css` | không có (gộp khi chưa review) |
| [`d0cfea6`](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/d0cfea67bcd1e0dd0bea08a30bebb1a6a63165a6) | Nguyễn Thanh Tùng | #6 | `app.js`, `utils/constants.js`, `pages/Profile.js`, `pages/Directory.js`, `components/Login.js`, `components/Navbar.js` | Trương Thanh Vui |
| [`11de331`](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/11de331a8e50afe1196a12f6cc1d6974c9dc9090) | Nguyễn Thanh Tùng | #6 | `firestore.rules`, `tests/firestore.rules.test.mjs`, `components/AccountManager.js`, `pages/Admin.js` | Trương Thanh Vui |

Trước khi push, AI chỉnh 2 chỗ trong tài liệu (commit `089af8b`): bỏ link ngoài GitHub trong README; sửa câu "nhóm chạy Playwright, tất cả đạt" thành đúng sự thật (AI chạy trên máy Trương Thanh Vui, nhóm chưa tự thử tay).

Commit [`1b7fed0`](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/1b7fed07871e8bf1e01b14c58c6ae157ed7e44e4) (gỡ PR #4) là thao tác revert của Git, không chứa mã mới.

## Chi tiết từng lần sử dụng (Nguyễn Thanh Tùng)

| Ngày | Prompt chính (nguyên văn) | AI tạo ra | Sinh viên kiểm tra / tự làm |
|---|---|---|---|
| 20/10 | "từ file này hãy lên kế hoạch cho nhóm tôi push git cho từng thành viên và kế hoạch cho tuần 4" (kèm tệp zip mã nguồn tuần 2) | So sánh zip với repo (15 tệp sửa, 20 tệp mới); kế hoạch đẩy mã theo 3 đợt, mỗi người một nhánh; kế hoạch tuần 4 (tệp Word) | Nhóm dùng kế hoạch để chia việc; Vui phát hiện kế hoạch xếp `utils/firebase.js` sai đợt (xem "Sai sót") |
| 21/10 | "hãy hướng dẫn tôi thực hiện công việc ở mục 3: Mỗi người clone repo, chép file của mình từ thư mục giải nén vào, đọc lại và chạy thử, tạo nhánh riêng rồi mở Pull Request…"; "Hướng dẫn tôi chạy trực tiếp trên trang github không thông qua lệnh hoặc có thể cài giúp tôi các công cụ để có thể thao tác đơn giản và nhanh nhất" | Hướng dẫn dùng Git và cách upload trực tiếp trên GitHub; 6 gói tệp sẵn để kéo thả; tệp Word hướng dẫn | Mỗi thành viên tự upload hoặc commit phần mình bằng tài khoản riêng |
| 22/10 | "bạn hãy push git những file đợt 1 của Nguyễn Thanh Tùng theo như kế hoạch giúp tôi" (kèm đường dẫn thư mục `studytask-standalone`) | Tạo nhánh `docs/readme-sua-loi`, commit `089af8b`, push; nội dung mô tả PR | Nguyễn Thanh Tùng tự tạo PR #3 trên GitHub; Trần Đức Tùng review và gộp |
| 23/10 | "check hộ tôi phần này với nhá. Đang ưu tiên phần sửa với xóa sang tuần 5 nên có 2-3 điểm cần phân tích. Bao gồm việc chạy SDK sever thay cho lưu trữ fire database." (kèm ảnh bảng Giữ/Bỏ/Sửa/Thêm) | Phân tích 3 điểm và đề xuất cột "Tuần" mới (mục 3.4 báo cáo tuần 3) | Nhóm tự quyết định dồn mục Bỏ/Sửa sang tuần 5; Nguyễn Thanh Tùng cung cấp ảnh Cloudflare để AI sửa lại phân tích |
| 23/10 | "nếu bạn đã pull về hãy push lên phần tiếp theo như kế hoạch" | Kiểm tra phụ thuộc giữa các tệp đợt 3 và `utils/firebase.js`; tạo nhánh `fix/ho-so-va-ban-quyen`, 2 commit `d0cfea6`, `11de331`, push; mô tả PR có cảnh báo thứ tự gộp | Nguyễn Thanh Tùng tự tạo PR #6; Trương Thanh Vui review và gộp |
| 23/10 | "hãy kiểm tra giúp tôi xem 6 file: utils/firebase.js (quan trọng nhất), firebase.json, scripts/seed-emulator.mjs, .gitignore, package.json của thanhvui có cần sửa gì không?" | Đọc 6 tệp của PR #1, kiểm tra chéo các hàm import/export; kết luận không có lỗi chặn, liệt kê một số gợi ý nhỏ (chú thích còn ghi Netlify và "tuần 3", thêm `engines`, bổ sung `.gitignore`) | Nguyễn Thanh Tùng tự đọc các tệp (đánh dấu Viewed 6/6), Approve và gộp PR #1 |
| 21/10 – 23/10 | Các yêu cầu chuyển nội dung thành file Word ("hãy soạn nó thành 1 file word giúp tôi", "hãy xuất ra file word giúp tôi"…) và hỏi cách review, gộp PR ("hãy hướng dẫn tôi cách gộp", "PR nằm ở đâu?") | 5 tệp Word hướng dẫn và phân tích (lưu trên máy, không đưa lên repo); hướng dẫn từng bước trên giao diện GitHub | Nguyễn Thanh Tùng tự thao tác review, Approve, gộp trên GitHub |
| 24/10 | "dựa vào báo cáo của tuần 1 và tuần 2 và lịch sử Commits trên github hãy báo cáo tuần 3 giúp tôi" | Đối chiếu lịch sử commit, PR, review; phát hiện `master` đang lỗi import sau khi gộp PR #5; soạn báo cáo tuần 3 và tệp này | Nguyễn Thanh Tùng đọc lại bản nháp |
| 24/10 | "bạn hãy kiểm tra lại lần cuối ở bản báo cáo tuần 3 có lỗi, lỗi AI nào không, sau đó pull và push lên github giúp tôi" | Đối chiếu lại từng câu với GitHub; sửa 6 chỗ (xem "Sai sót" mục 4); commit và push | Nguyễn Thanh Tùng tạo PR và nhờ thành viên khác review |

## Sai sót của AI phát hiện trong tuần

1. **Kế hoạch đẩy mã bỏ sót phụ thuộc.** Kế hoạch (20/10) xếp `utils/firebase.js` vào đợt 1, nhưng tệp này ghi mật khẩu vào `userSecrets` (rules ở đợt 3), và `scripts/seed-emulator.mjs` cần `SAMPLE_CURRICULUM` (hằng số ở đợt 3). Kế hoạch cũng không ghi rằng `utils/store.js` (đợt 1) cần các hàm trong `utils/firebase.js`. Trương Thanh Vui phát hiện và ghi cảnh báo trong PR #1. Đây là một nguyên nhân dẫn tới việc gộp sai thứ tự (PR #4, PR #5).
2. **Giả định sai nơi triển khai.** AI dựa vào `netlify.toml` và README nên cho rằng bản đang chạy ở Netlify, và hướng dẫn kiểm tra Netlify, khóa Netlify. Nguyễn Thanh Tùng chỉ ra hệ thống đã chuyển sang Cloudflare (upload thủ công). AI sửa lại hướng dẫn và phân tích.
3. **Một lần kiểm tra tự động bị lỗi.** Khi kiểm tra đường dẫn import trên `master` (24/10), đoạn lệnh của AI xử lý sai `../`, báo nhầm hàng loạt tệp thiếu. AI tự nhận ra, chỉ giữ kết quả đúng (6 trang mà `app.js` import nhưng không còn trên `master`).
4. **Bản nháp báo cáo tuần 3 có chỗ sai sự thật.** Khi rà soát lần cuối (24/10, theo yêu cầu của Nguyễn Thanh Tùng), AI đối chiếu lại với GitHub và phát hiện: (a) ghi Trương Thanh Vui soạn mô tả PR #6, thực tế PR #6 do Nguyễn Thanh Tùng mở; (b) ghi báo cáo tuần 2 có nhắc Netlify, thực tế chỉ README và chú thích trong `utils/firebase.js`; (c) tính commit tài liệu `089af8b` vào "mã nguồn do AI sinh"; (d) liệt kê link [D5] không dùng tới; (e) ghi "5 gợi ý nhỏ" không khớp nội dung đã đưa; (f) bỏ sót các lần dùng AI để xuất file Word và hướng dẫn gộp PR. Tất cả đã sửa trước khi push.

## Cơ chế kiểm soát (bổ sung tuần 3)

- Mỗi PR ghi rõ "chỉ gộp sau PR …" khi có phụ thuộc.
- Không gộp PR chưa có Approve của thành viên khác.
- Trước khi soạn báo cáo, đối chiếu từng commit và PR với GitHub; nêu rõ phần chưa chạy thử.
