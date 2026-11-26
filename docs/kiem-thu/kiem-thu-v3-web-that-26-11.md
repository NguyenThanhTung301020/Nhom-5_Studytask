# Kiểm thử lại V3 (Trắc nghiệm) trên web thật: ca 19, 23, 24

- Việc: phần còn lại của việc 3 kế hoạch tuần 8 (sửa ca 19, 24 ở [PR83]; thử lại ca 19, 23, 24 trên web thật).
- Người được phân công: Trần Đức Tùng. Người review theo kế hoạch: Nguyễn Thanh Tùng.
- Website: https://sutdytask.io.vn, build giao diện `v202611260410`.
- Ngày: 26/11/2026, khoảng 15:40 – 15:49 giờ Việt Nam (theo đồng hồ máy thử, chậm hơn đồng hồ máy chủ khoảng 2 phút 44 giây). Mốc `submittedAt` dưới đây là giờ máy chủ.
- Căn cứ: [báo cáo ngày 18/11](B%C3%A1o%20c%C3%A1o%20ki%E1%BB%83m%20th%E1%BB%AD%20V3%20web%20th%E1%BA%ADt%20Tr%E1%BA%A7n%20%C4%90%E1%BB%A9c%20T%C3%B9ng.md) mục 3, 4.

## 1. Bản đang chạy có bản sửa

Trước khi thử, tải các tệp giao diện từ web và so với git (bỏ qua khác biệt CRLF): 58/60 tệp trùng `d45f229` (sau [PR90]). Hai tệp không trùng là `components/OldDataPanel.js`, `components/TermFilter.js`, hai tệp mới của [PR92] chưa có trên web. Bản sửa V3 ([PR83]) nằm trong `d45f229`. Không đối chiếu mã API máy chủ.

## 2. Kết quả

| Ca | Nội dung | Mong đợi | Kết quả |
|---|---|---|---|
| 19 | Số "lượt nộp" trên thẻ đề (giáo viên) | Đúng số bài nộp | **Đạt** |
| 23 | API-05: sinh viên nộp đề Đang mở đã quá hạn | Máy chủ từ chối, không ghi kết quả | **Đạt** |
| 24 | Đề có hạn trong ngày | Chưa hết hạn, sinh viên còn làm được | **Đạt** |

## 3. Chuẩn bị

| Vai | Tài khoản thử |
|---|---|
| Giáo viên (GV-A) | `gvllct01`, dạy Triết học Mác - Lênin (mã môn trong hệ thống 1000) |
| Sinh viên (SV-1) | `sv2602003`, học môn trên |

Hai đề tạo mới trong lần thử, mỗi đề 1 câu:

| Đề | Mã | Hạn |
|---|---|---|
| ZZ kiem thu V3 26/11 - han 26/11 | `1795682589865` | 26/11/2026 |
| ZZ kiem thu V3 26/11 - han 25/11 | `1795682609965` | 25/11/2026 |

Các đề thử ngày 18/11 trên trang hiện đều ghi 0 lượt nộp và `GET /api/quiz/{mã}/results` của đề `1794985108082`, `1794985185260`, `1794989767782` trả danh sách rỗng, nên không dùng lại. Lần thử này không tìm hiểu nguyên nhân.

## 4. Chi tiết

### Ca 19: số lượt nộp

1. Trước khi tạo đề thử: trang Trắc nghiệm của giáo viên có 37 thẻ, dòng tổng "235 lượt nộp". Đối chiếu từng thẻ với `GET /api/quiz/results`: **37/37 khớp** (ví dụ đề `300001`: 80, `300002`: 78, `300031`: 41, `300032`: 36).
2. Đề hạn 26/11 lúc mới mở: "0 lượt nộp".
3. Sau khi SV-1 nộp: thẻ hiện **"1 lượt nộp"**, dòng tổng "39 đề thi · 236 lượt nộp"; máy chủ có đúng 1 kết quả cho đề này. Đề hạn 25/11 vẫn "0 lượt nộp".

### Ca 23: nộp sau hạn

Giao diện không có nút làm bài cho đề quá hạn, nên gọi thẳng API bằng phiên của SV-1: `POST /api/quiz/1795682609965/submit` với `{"answers": {}}`.

- Phản hồi: **HTTP 400**, mã `quiz-expired`, "Đã quá hạn làm bài."
- Số kết quả của SV-1 trước và sau: 10 và 10; đề này không có kết quả.
- Tệp ghi lại phản hồi: [ca-23-phan-hoi-may-chu.json](anh/v3-web-that-26-11/ca-23-phan-hoi-may-chu.json).

### Ca 24: hạn trong ngày

| Nơi xem | Đề hạn 26/11 | Đề hạn 25/11 (đối chứng) |
|---|---|---|
| Giáo viên, trang Trắc nghiệm | Không ghi "(Hết hạn)" | Ghi "(Hết hạn)" |
| Sinh viên, trang Trắc nghiệm | Không ghi hết hạn, có nút **Làm bài** | "(Hết hạn)", không có nút làm bài |
| Sinh viên, trang Môn học | Không ghi hết hạn, có nút làm bài | "(hết hạn)", không có nút làm bài |

SV-1 nộp đề hạn 26/11: 10/10, đúng 1/1, `submittedAt` `2026-11-26T08:48:56Z`. Dữ liệu đề mà sinh viên nhận không chứa trường đáp án (`correct`, `accepted`) ở cả hai đề thử.

## 5. Minh chứng

| Ảnh | Nội dung |
|---|---|
| [00](anh/v3-web-that-26-11/00-gv-trang-trac-nghiem-235-luot-nop.jpg) | Giáo viên, trang Trắc nghiệm trước khi tạo đề |
| [01](anh/v3-web-that-26-11/01-gv-the-de-thu-han-26-va-25.jpg) | Giáo viên, hai đề thử đang mở, 0 lượt nộp |
| [02](anh/v3-web-that-26-11/02-sv-trang-mon-hoc-han-26-va-25.jpg) | Sinh viên, trang Môn học |
| [03](anh/v3-web-that-26-11/03-sv-trang-trac-nghiem-han-26-va-25.jpg) | Sinh viên, trang Trắc nghiệm |
| [04](anh/v3-web-that-26-11/04-sv-nop-de-han-26-duoc-10-diem.jpg) | Sinh viên, kết quả nộp đề hạn 26/11 |
| [05](anh/v3-web-that-26-11/05-gv-ca-19-de-han-26-hien-1-luot-nop.jpg) | Giáo viên, đề hạn 26/11 hiện 1 lượt nộp |
| [06](anh/v3-web-that-26-11/06-gv-da-dong-hai-de-thu.jpg) | Giáo viên, đã đóng hai đề thử |

## 6. Dữ liệu còn lại và giới hạn

- Hai đề thử đã chuyển **Đã đóng**, còn trên hệ thống (đề đã mở không xóa được trên giao diện).
- Còn 1 bài nộp của `sv2602003` cho đề `1795682589865` trong `quizResults` và 1 sự kiện `quiz` trong nhật ký hoạt động của tài khoản này.
- Ca 24 thử vào buổi chiều ngày hạn. Chưa thử sát nửa đêm (thời điểm chuyển sang hết hạn); phần này có ca kiểm thử tự động trong `tests/logic.test.mjs`, lần này không chạy lại.
- Ca 25 (đề đã đóng bị ẩn phía sinh viên, RULE-09) không thuộc việc 3, không thử lại.

[PR83]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/83
[PR90]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/90
[PR92]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/92
