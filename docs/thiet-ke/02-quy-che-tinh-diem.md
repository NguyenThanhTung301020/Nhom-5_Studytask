# Thiết kế 02 – Quy chế tính điểm theo loại môn

Căn cứ: tài liệu "Tỉ lệ và cách tính trọng số điểm theo loại môn" (mục 1–9).
Mã nguồn: `utils/grading.js` (phần tính toán), `pages/GradingPolicy.js` (cấu hình), `components/GradeBook.js` (nhập điểm).
Kiểm thử: `tests/logic.test.mjs`, chạy bằng `npm run test:logic`. Các ví dụ số trong tài liệu đều được kiểm thử.

## 1. Ai làm gì

| Vai trò | Quyền | Lưu ở |
|---|---|---|
| Phòng Đào tạo, Admin | Chọn loại môn, cập nhật tỉ lệ (tự động theo số bài hoặc nhập tay), cách tính chuyên cần, môn có cả lý thuyết và thực hành | `gradingPolicies/{subjectId}` |
| Giáo viên dạy môn | Chọn cột bài tập / trắc nghiệm nào tính điểm bài tập (kèm hệ số); các cột còn lại tính vào chuyên cần | `gradingColumns/{subjectId}` |
| Giáo viên, Admin | Nhập điểm từng cột, điểm danh, giữa kỳ, cuối kỳ, thực hành | `sharedData/global.grades` (như trước) |
| Sinh viên | Xem công thức tính điểm các môn mình học | chỉ đọc |

Security Rules: giáo viên chỉ ghi được `gradingColumns` của môn có trong `subjectIds` của mình; giáo viên không sửa được tỉ lệ.

## 2. Công thức

- Điểm môn = Σ (trọng số × điểm thành phần), làm tròn 1 chữ số thập phân (mục 1).
- Điểm bài tập ĐBT = Σ(k × điểm) / Σk trên các cột được tính điểm, sau khi bỏ `drop` bài thấp nhất (mục 4).
- Chuyên cần (mục 5):
  - Điểm danh tính theo 1 trong 3 cách: giáo viên nhập điểm, theo tỉ lệ buổi có mặt (cách 1), hoặc trừ điểm theo vi phạm với hệ số a, b, c (cách 2).
  - Cột không tính điểm cho ra "điểm tham gia" = (số cột đã làm / số cột) × 10.
  - ĐCC = (100% − wP) × điểm danh + wP × điểm tham gia (cách 3), wP mặc định 40%.
  - Chưa nhập điểm danh thì chuyên cần coi là chưa có điểm.
- Môn có cả lý thuyết và thực hành (mục 2.3): điểm môn = (LT × TC LT + TH × TC TH) / (TC LT + TC TH). LT tính theo công thức trên, TH do giáo viên nhập.
- Thiếu thành phần nào thì chưa có điểm môn chính thức. Bảng điểm hiện "Tạm tính" = trung bình có trọng số của các thành phần đã có.

## 3. Tự động chuyển tỉ lệ theo số bài tập

Khi bật "tự động", n = số cột giáo viên chọn tính điểm.

| n | Bài tập (lý thuyết) | Bài tập (thực hành H1) | Số bài bỏ |
|---|---|---|---|
| 1 | 10% | 40% | 0 |
| 2 | 15% | 40% | 0 |
| 3 | 20% | 40% | 0 |
| 4 | 25% | 50% | 0 |
| 5 | 30% | 50% | 1 |
| 6–7 | 35% | 50% | 1 |
| 8–10 | 40% | 60% | 1 |
| 11 | 45% | 60% | 1 |
| ≥ 12 | 45% | 60% | 2 |

Các mốc 2, 3, 5, 8, 10, 12 lấy đúng bảng mục 4; các mốc ở giữa do nhóm nội suy. Sau đó hệ thống:
1. Ép bài tập vào giới hạn của nhóm môn; nếu mỗi bài vượt 10% mà vẫn hạ được thì hạ xuống.
2. Chia phần còn lại (100% − bài tập) cho chuyên cần, giữa kỳ, cuối kỳ theo tỉ lệ của bộ gợi ý.
3. Ép từng phần vào giới hạn, dồn phần chênh vào cuối kỳ, rồi giữa kỳ, rồi chuyên cần, để tổng luôn bằng 100%.

## 4. Kiểm tra khi lưu (mục 6)

Hệ thống báo lỗi và **không cho lưu** (cả tỉ lệ của Phòng Đào tạo lẫn lựa chọn cột của giáo viên) khi:
- tổng khác 100%, hoặc một thành phần nằm ngoài giới hạn của nhóm môn, hoặc chuyên cần vượt 20%;
- không có điểm cuối kỳ, hoặc học phần từ 2 tín chỉ có ít hơn 2 điểm thành phần;
- mỗi bài tập chiếm quá 10% hoặc dưới 2% điểm môn;
- đánh giá trực tuyến vượt 50%. Phần trực tuyến gồm các cột trắc nghiệm được tính điểm, cộng thêm cuối kỳ nếu đánh dấu "thi cuối kỳ trực tuyến";
- có trọng số bài tập nhưng chưa chọn cột nào.

## 5. Điểm lệch so với tài liệu, nhóm cần thống nhất với GVHD

1. **Bảng giới hạn mục 6 xung đột với 2 bộ ở mục 2.** L2 có cuối kỳ 45% (dưới mức tối thiểu 50% của môn lý thuyết). Q70 có bài tập 35% và cuối kỳ 30%, không khớp giới hạn của cả môn lý thuyết lẫn thực hành. Nhóm thêm nhóm giới hạn thứ ba **"môn nặng quá trình" (qt)**: chuyên cần 0–15%, bài tập 10–60%, giữa kỳ 0–30%, cuối kỳ 30–70%, áp dụng cho L2 và Q70.
2. Bảng mục 4 không ghi mốc 1, 4, 6, 7, 9, 11 bài; nhóm tự nội suy (bảng ở mục 3).
3. Môn thực hành chỉ có 1–3 bài thì mỗi bài vượt 10% (40% / 3 bài). Với quy tắc hiện tại, cấu hình này không lưu được, nên giáo viên phải giao thêm bài hoặc Phòng Đào tạo đổi loại môn.
4. Chưa cấu hình cột thì hệ thống tính **tất cả** các cột, để giữ cách tính cũ của bảng điểm.
5. Thang điểm chữ, GPA hệ 4 và điều kiện cấm thi khi vắng quá tỉ lệ chưa làm.
