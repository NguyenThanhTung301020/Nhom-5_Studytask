# Báo cáo kiểm thử V3 (Trắc nghiệm) trên web thật - 18/11/2026

- Người thực hiện: **Trần Đức Tùng** (việc 2 kế hoạch tuần 7, phần V3).
- Hệ thống:
https://sutdytask.io.vn. Giao diện đang chạy build `v202611170853`, `master` lúc kiểm tra: `5aa2d07`.
- Thời gian: 18/11/2026.
- Căn cứ: D05 mục 6 (ca Rule-xx, API-xx), `docs/thiet-ke/05-trac-nghiem-tach-dap-an-cham-diem-may-chu.md`.
- Cách thử: thao tác trên giao diện và gọi API bằng Console của trình duyệt (F12) với phiên đăng nhập với từng vai.

## 1. Kết luận nhanh

| Tổng số ca | Đạt | Không đạt | Chưa thử được | Ghi nhận |
|---|---|---|---|---|
| 25 | **21** | **2** (ca 19, 24) | 1 (ca 23) | 1 (ca 25) |

- **Máy chủ đạt toàn bộ các ca đã thử:** chấm điểm đúng (kể cả câu nhiều lựa chọn và câu điền khuyết), không lộ đáp án cho sinh viên và giáo viên môn khác, chặn nộp lại, nộp đề đã đóng, nộp sai môn, giáo viên nộp bài và điểm giả.
- **2 lỗi ở giao diện**, không ảnh hưởng điểm và quyền trên máy chủ (mục 4):
  - thẻ đề luôn hiện "0 lượt nộp" (ca 19);
  - thẻ đề báo "(Hết hạn)" và ẩn nút làm bài từ 7 giờ sáng ngày hạn, sớm hơn máy chủ (ca 24).
- **Chưa thử được API-05** (máy chủ từ chối bài nộp sau hạn), vì chưa có đề Đang mở đã quá hạn (ca 23, mục 5).
- **Ghi nhận:** giao diện sinh viên ẩn đề đã đóng, lệch với RULE-09 (ca 25).

## 2. Chuẩn bị
| Vai | Mô tả |
|---|---|
| GV-A | Giáo viên được phân môn Triết học Mác - Lênin |
| GV-B | Giáo viên dạy môn khác |
| SV-1 | Sinh viên học môn Triết học Mác - Lênin |
| SV-2 | Sinh viên không học môn này |

Mỗi vai đăng nhập trong vùng cookie riêng (trình duyệt hoặc cửa sổ riêng). Kiểm tra đúng tài khoản bằng `GET /api/auth/me` trước mỗi ca.

Đề thử (môn Triết học Mác - Lênin):

- **Đề A (Kiểm thử lại V3)** `1794985108082`: 4 câu (một lựa chọn, điền khuyết, một lựa chọn, nhiều lựa chọn), hạn 19/11/2026.

- **Đề B (Kiểm thử lại V3)** `1794985185260`: 4 câu, dùng cho ca dữ liệu giả và đề đã đóng, hạn 19/11/2026.

- **Đề C (Kiểm thử lại V3)** `1794989767782`: 4 câu, hạn 18/11/2026, Đang mở; dùng cho ca nộp sau hạn (API-05).

Đề có sẵn dùng để đối chiếu (không do GV-A tạo):
- **Trắc nghiệm Triết học Mác - Lênin – Đề 1** `300001`: dữ liệu kiểm tải sinh bằng `scripts/seed_curriculum.py`, trạng thái Đã đóng, hạn 03/11/2026.

## 3. Kết quả 

| # | Mã ca | Vai | Thao tác | Mong đợi | Kết quả |
|---|---|---|---|---|---|
| 1 | Giao diện | GV-A | Tạo đề A, để một câu chưa chọn đáp án đúng | bị chặn | Đạt (Bị chặn nút Tạo đề thi và hiển thị dòng chú vàng: Mỗi câu cần nội dung câu hỏi; câu chọn đáp án cần ít nhất 2 đáp án có nội dung và 1 đáp án đúng; câu điền khuyết cần ít nhất 1 đáp án chấp nhận cho mỗi chỗ trống) |
| 2 | RULE-07 | GV-A | Lưu đề A, đề B Bản nháp ,sau đó chuyển Đang mở | Lưu được, đề lên máy chủ | Đạt. Hai đề có trên máy chủ, `status: active` |
| 3 | RULE-10 | GV-A | sửa nội dung đề A sau khi mở | Chỉ đổi được trạng thái | Đạt (Thẻ đề A đang mở chỉ còn nút "Đóng đề", không còn nút "Sửa") |
| 4 | Tách đáp án | SV-1 | Đọc `sharedData/global`, tìm `correct`/`accepted` | Không có | Đạt (thấy 2 đề, mỗi đề 4 câu; `false`) |
| 5 | RULE-01 | SV-1 | `GET /api/doc/quizKeys/<đề A>` | Từ chối | Đạt (403) |
| 6 | RULE-13 | SV-1 | `PUT /api/doc/quizResults/<đề A>_x` với `score: 10` | từ chối | Đạt (403)|
| 7 | API-07, API-09 | SV-1 | Làm đề A: câu 1 chọn A (đúng), câu 2 điền (đúng), câu 3 chọn D (sai), câu 4 chỉ chọn A, thiếu C (sai) | 2/4 câu, 5.0 điểm  | Đạt (5/10, đúng 2/4) |
| 8 | API-08 (điền khuyết) | SV-1 | Câu 2 gõ `TƯ Duy` (hoa thường lẫn lộn)| Tính đúng | Đạt |
| 9 | API-12 | SV-1 | Xem phản hồi của `submit` | Chỉ có điểm và số câu, không có đáp án | Đạt (`quizId, score, correct, total, submittedAt`; giao diện báo không hiển thị đáp án đúng) |
| 10 | API-10 | SV-1 | Nộp lại Đề A | Từ chối | Đạt(409 `already-submitted`) |
| 11 | API-08 | SV-1 | Nộp đề A với mã câu hỏi không tồn tại | Từ chối | Đạt (400 `bad-answers`) |
| 12 | API-11, API-06 | SV-1 | Nộp đề B bỏ trống cả bài, kèm `score: 10, correct: 4, total: 4` | Bỏ qua trường giả, câu trống tính sai | Đạt (200, `score: 0`, đúng 0/4; GV-A thấy bài đề B thuộc SV-1, xem ca 16) |
| 13 | API-04 | SV-1 | GV-A đóng đề B, SV-1 nộp lại | Từ chối | Đạt (400 `quiz-closed`) |
| 14 | API-02 | GV-A | Giáo viên nộp đề A | Từ chối | Đạt (403 "Chỉ sinh viên nộp bài trắc nghiệm.") |
| 15 | API-03, RULE-08 | SV-2 | Xem danh sách đề, nộp đề A| không thấy đề, nộp bị từ chối | Đạt (không thấy đề thử; 404; `results: []`) |
| 16 | RULE-16, RULE-02 | GV-A | Xem kết quả và bản lưu đề đã giao | Thấy bài của SV-1, đề đủ đáp án | Đạt (đề A: SV-1: 5 điểm, 2/4; đề B: 0 điểm, 0/4; bản lưu đề A: 200, đủ 4 câu) |
| 17 | RULE-16, RULE-03 | GV-B | `GET /api/quiz/<đề A>/results`, `/archive`, `/api/doc/quizKeys/<đề A>`; tìm đáp án trong dữ liệu chung; xem bảng điểm | Từ chối, không lộ đáp án | Đạt (403, 403, 403; thấy 2 đề nhưng `false`; bảng điểm 0 bài đề thử) |
| 18 | RULE-14, RULE-15 | SV-1 | `GET /api/quiz/mine`; `GET /api/quiz/<đề A>/results`; `GET /api/quiz/results` | Chỉ thấy bài của mình | Đạt (3 bài: đề A, B, C, cùng uid của SV-1; 403; 403) |
| 19 | Giao diện | GV-A | Số "lượt nộp" trên thẻ đề | 1 cho mỗi đề | **không đạt**: hiện 0 |
| 20 | Hiển thị điểm | GV-A | Quản lý lớp học -> Theo dõi hoạt động | Đề A:5, đề B: 0| Đạt (mỗi đề 1/54 đã làm; điểm TB 5.0 và 0.0) |
| 21 | Việc 7 | GV-A | Quản lý lớp học -> Bảng điểm & Chấm điểm | Bảng điểm hiện điểm đề A, đề B| Đạt (trang mở bình thường; điểm gốc đề A 5, đề B 0) |
| 22 | Dọn dẹp | GV-A | Đóng đề A | Đề A "Đã đóng" | Đạt (thẻ GV-A chuyển "Đã đóng", nút "Xem"; phía SV-1 không còn thẻ đề A; nộp lại 400 `quiz-closed`; kết quả SV-1 vẫn 5 điểm) |
| 23 | API-05 | SV-1 | Nộp đề C (hạn 18/11) lúc chiều ngày 18/11 | Từ chối nếu đã quá hạn | Chưa thử được: máy chủ tính hạn đến hết ngày 18/11 nên nhận bài (200, `score: 0`) là đúng |
| 24 | Giao diện | GV-A, SV-1 | Xem thẻ đề C chiều 18/11 | Chưa hết hạn (hạn tính đến hết 18/11) | **Không đạt**: phía GV-A thẻ vẫn "Đang mở" nhưng ghi "(Hết hạn)"; phía SV-1 thẻ đề C vẫn hiện nhưng không còn nút làm bài, trong khi máy chủ vẫn nhận bài (ca 23) |
| 25 | RULE-09 | GV-A, SV-1 | Xem thẻ Đề 1 `300001` (Đã đóng, hạn 03/11) | SV-1 vẫn đọc được đề đã đóng của môn mình để nhận diện bài | Ghi nhận: phía GV-A thẻ chỉ còn nút "Xem"; phía SV-1 không hiện thẻ. Đề bị ẩn vì trạng thái Đã đóng (giao diện sinh viên chỉ hiện đề Đang mở), không phải vì quá hạn. Lệch với RULE-09, xem mục 5 |

Ghi chú ca 24 và 25: hai đề bị khóa/ẩn ở phía sinh viên vì hai lý do khác nhau. Đề C vẫn Đang mở nên thẻ còn hiện, chỉ mất nút làm bài do giao diện tính hết hạn sớm. Đề 1 đã Đóng nên thẻ bị ẩn hẳn. Hệ thống không tự đóng đề khi hết hạn; trạng thái Đã đóng của Đề 1 có từ lúc sinh dữ liệu kiểm tải.

## 4. Lỗi phát hiện

1. **Số lượt nộp trên thẻ đề luôn là 0 (ca 19).**
   - Hiện tượng: thẻ đề A, đề B ở trang Trắc nghiệm của GV-A hiện "0 lượt nộp", trong khi tab "Bài làm & khiếu nại" có 1 bài nộp.
   - Nguyên nhân: `pages/Quiz.js` (dòng 496 và 556) đếm từ `submissions` trong dữ liệu riêng của giáo viên. Từ V3, bài nộp nằm ở `quizResults`.
   - Mức độ: thấp – chỉ sai con số hiển thị; điểm và kết quả trên máy chủ vẫn đúng (ca 16, 20, 21).

2. **Giao diện báo hết hạn sớm hơn máy chủ (ca 24).**
   - Hiện tượng: đề C hạn 18/11 đã hiện "(Hết hạn)" ngay trong ngày 18/11; sinh viên không còn nút làm bài, trong khi máy chủ vẫn nhận bài đến hết ngày (ca 23).
   - Nguyên nhân: `pages/Quiz.js` dòng 531 so `new Date(dueDate)` (0 giờ UTC = 7 giờ sáng giờ Việt Nam) với giờ hiện tại; dòng 570 ẩn nút làm bài khi `expired`.
   - Ảnh hưởng: từ 7 giờ sáng ngày hạn, sinh viên không làm bài được trên giao diện dù vẫn còn hạn.
   - Mức độ: trung bình – giao diện và máy chủ chưa thống nhất thời điểm hết hạn (D05 mục 5.2 bước 4).

## 5. Giới hạn
- Không thử khai thác hay ghi đè dữ liệu thật; chỉ dùng các đề thử do GV-A tạo riêng.
- API-05 (máy chủ từ chối bài nộp sau hạn khi đề vẫn Đang mở) chưa thử được (ca 23): đề C chưa quá hạn lúc nộp và SV-1 đã nộp đề C nên không dùng lại được; đề A (hạn 19/11) đã đóng ở ca 22 nên cũng không dùng được; Đề 1 tuy quá hạn nhưng đã Đóng, nộp sẽ bị từ chối với `quiz-closed` trước khi xét hạn. Cần một đề mới Đang mở có hạn đã qua hết ngày.
- Ca 25: giao diện sinh viên chỉ hiện đề Đang mở (`pages/Quiz.js` dòng 485), nên đề đã đóng của môn mình không còn hiện; D05 (RULE-09) cho phép sinh viên đọc đề đã đóng để nhận diện bài. Máy chủ vẫn gửi đề đã đóng, chỉ giao diện ẩn. Không ảnh hưởng bảo mật.
- Chưa thử trên web thật các ca ghi/xóa đề và khóa đáp án (RULE-04 đến RULE-06, RULE-11, RULE-12, RULE-18) để không ảnh hưởng dữ liệu thật; các ca này có trong kiểm thử tự động `tests/server/test_quiz_v3.py`. RULE-17 chưa có ca thử tương ứng. API-13 chỉ áp dụng cho môi trường thử.
- Dữ liệu thử còn lại: đề A, B (Đã đóng), đề C (Đang mở) (Kiểm thử lại V3) và 3 bài nộp của SV-1 trong `quizResults`.