# Nhật ký sử dụng AI – Tuần 4 (26/10 – 31/10/2026)

- **Công cụ:** Claude Code (Anthropic)
- **Model:** Claude Sonnet 5.5 (`claude-sonnet-5-5`) ngày 28/10 (chạy kiểm thử); Claude Opus 5.5 (`claude-opus-5-5`) khi đưa báo cáo và tệp kiểm thử lên GitHub (PR #15)
- **Người sử dụng:** Trương Thanh Vui (mục dưới). Nguyễn Thanh Tùng và Trần Đức Tùng bổ sung phần của mình vào tệp này.
- **Công cụ AI khác:** không dùng

## Mã nguồn do AI sinh (Trương Thanh Vui)

**Có.** Mã kiểm thử do AI sinh trên máy Trương Thanh Vui ngày 28/10, đưa lên qua PR #15 (nhánh `docs/kiem-thu-thanh-vui`), gắn nhãn `[AI]`.

| Tệp | Nội dung | Người review |
|---|---|---|
| `tests/firestore.rules.deep.test.mjs` | Bộ kiểm thử chuyên sâu Firestore rules, 69 ca | Nguyễn Thanh Tùng |
| `scripts/mutate.mjs` | Công cụ kiểm thử đột biến `firestore.rules` (113 bản) | Nguyễn Thanh Tùng |
| `package.json` | Thêm script `test:rules:deep` | Nguyễn Thanh Tùng |
| `docs/kiem-thu/Báo cáo chi tiết kiểm thử Firestore Thanh Vui.md` | Báo cáo kết quả chạy trên máy Thanh Vui | Nguyễn Thanh Tùng |

AI **không sửa** `firestore.rules` và **không deploy** gì lên production; mọi lượt chạy dùng Firestore Emulator với project `demo-studytask`.

## Chi tiết từng lần sử dụng (Trương Thanh Vui)

| Ngày | Prompt chính (nguyên văn) | AI tạo ra | Sinh viên kiểm tra / tự làm |
|---|---|---|---|
| 28/10 | "trong file của tôi đã có các tiệp kiểm thử bao gồm : commit rules và tệp kiểm thử; nhưng chưa chạy npm run test:rules; rules chưa deploy lên production hãy thực hiện nó và ghi kết quả vào file doc kèm số ca đạt/ không đạt ( do kiểm thử là cả team nên cần ghi chú rõ ca thực hiện trên máy Thanh Vui)" | Cài phụ thuộc (`npm ci`), chạy `npm run test:rules` (46/46 đạt); viết bộ chuyên sâu 69 ca và công cụ đột biến; chạy 113 bản đột biến (110 bị bắt). Không deploy rules. | _(Thanh Vui tự ghi: đã tự kiểm tra gì)_ |
| 28/10 | "Hãy xuất cho tôi 1 file hoàn chỉnh cho duy nhất trương thanh vui miêu tả chi tiết bao gồm cả cấu hình như công cụ chạy trên cổng nào . chi tiết các bản chạy kiểm thử giúp tôi" | Báo cáo `docs/kiem-thu/…Thanh Vui.md`: cấu hình, cổng, 12 lượt chạy, chi tiết đột biến, rủi ro R1–R6. | _(Thanh Vui tự ghi: đã tự kiểm tra gì)_ |
| 29/10 | Yêu cầu push thư mục `docs/kiem-thu` lên GitHub. | Nhánh `docs/kiem-thu-thanh-vui`, PR #15, mô tả PR có lưu ý. | Nguyễn Thanh Tùng review PR #15 và yêu cầu sửa 4 điểm. |
| 01/11 | "… tiến hành up file trong đường dẫn và fix các lỗi trong mục gộp giúp tôi" (kèm ảnh nhận xét của Nguyễn Thanh Tùng trên PR #15). | Thêm `tests/firestore.rules.deep.test.mjs`, `scripts/mutate.mjs`, script `test:rules:deep`; điền nhánh `docs/so-do-dfd`, commit `d087a67` vào báo cáo; đổi tên tệp còn 1 khoảng trắng; tạo nhật ký này; chạy lại bộ chuyên sâu trên nhánh PR. | Chờ Nguyễn Thanh Tùng review lại PR #15. |

## Sai sót của AI phát hiện trong tuần (Trương Thanh Vui)

1. **Ca kiểm thử viết sai ở lần chạy đầu.** Lượt 2: ca dùng tài khoản `NEW` chưa có hồ sơ nên ca "được phép" bị từ chối, làm các ca "bị chặn" trong cùng test đạt giả. AI phát hiện và sửa ca (bổ sung hồ sơ trước khi thử).
2. **Công cụ đột biến tính nhầm lỗi kết nối thành "sống sót".** Lượt 6 báo "104/113 sống sót" do Emulator tắt giữa chừng; kết quả bị bỏ, công cụ sửa để chỉ tính "sống sót" khi mọi ca đều đạt.
3. **PR #15 lần đầu thiếu tệp và thông tin.** Báo cáo nhắc `test:rules:deep`, bộ chuyên sâu và `mutate.mjs` nhưng PR không có các tệp này; dòng "Nhánh Git" để trống; chưa có nhật ký AI. Nguyễn Thanh Tùng phát hiện khi review; đã bổ sung.
