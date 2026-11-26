# Kiểm thử G4: trang Môn học cuộn ngang ở khổ hẹp

Việc 12 kế hoạch tuần 8 (nhóm B). Người thực hiện: Nguyễn Thanh Tùng. Ngày thử: 26/11/2026, nhánh `fix/tuan8-viec12-g4-cuon-ngang-kho-hep` tách từ `master` tại `dad0b39` (sau [PR89]).

Kết quả cần đạt theo kế hoạch: PR, thử ở khổ điện thoại.

## 1. Lỗi

Phát hiện khi thử [PR56] ([kiem-thu-pr56-r2-r7-web-that.md](kiem-thu-pr56-r2-r7-web-that.md), mục G4): trang Môn học ở khổ 512 px rộng 733 px, phải cuộn ngang.

Nguyên nhân (đo bằng `document.documentElement.scrollWidth` và tìm phần tử có cạnh phải vượt khung nhìn):

| # | Chỗ tràn | Vì sao |
|---|---|---|
| 1 | Hàng công cụ ở đầu trang Môn học (`pages/Subjects.js`): ô lọc khóa, ô lọc học kỳ, ô tìm 200 px, nút "Thêm môn học" | Hàng `d-flex` không có `flex-wrap`, nên các ô luôn nằm trên một dòng. Ô lọc học kỳ có nhãn dài ("Học kỳ 1 · Năm học 2026-2027 (hiện tại)", khoảng 330 px) |
| 2 | Dòng thống kê dưới tiêu đề (số học phần, tín chỉ, bài tập, tài liệu) | Cũng là `d-flex` không xuống dòng; ở 320 px dòng này dài hơn màn hình |
| 3 | Thanh trên cùng (`components/Navbar.js`), chỉ ở khổ dưới 360 px | Nút menu, tên StudyTask, chuông, nút bảng màu, ảnh đại diện và mũi tên cộng lại rộng khoảng 340 px. Lỗi này có ở **mọi trang** khi màn hình 320 px |

## 2. Cách sửa

| Tệp | Thay đổi |
|---|---|
| `pages/Subjects.js` | Hàng công cụ thêm `flex-wrap`; ô lọc khóa, ô lọc học kỳ và ô tìm thêm `maxWidth: '100%'` (ô không rộng quá khung chứa, nhãn dài bị cắt bớt trong ô chọn). Dòng thống kê thêm `flex-wrap` (khoảng cách dọc nhỏ `row-gap-1`) |
| `components/Navbar.js`, `style.css` | Ở khổ dưới 360 px: ẩn nút bảng màu trên thanh trên cùng và thu khoảng cách giữa các nút còn 4 px. Chức năng không mất vì nút nổi "Tùy chỉnh giao diện" (`.fab-settings`, góc dưới phải) luôn hiện và mở cùng một bảng cài đặt |

Khổ máy tính không đổi: hàng công cụ đủ chỗ nên vẫn nằm trên một dòng như cũ (ảnh 05).

## 3. Cách thử

- Môi trường: API Python (`server/studytask_api.py serve`) với dữ liệu tạm trong thư mục tạm của máy, cùng một proxy tĩnh chuyển `/api/` tới cổng 8787 như nginx. Không đụng máy chủ thật.
- Tài khoản: một tài khoản Phòng Đào tạo tạo riêng cho lần thử (`create-user ... training`).
- Dữ liệu: 5 môn ở 2 khóa và 2 học kỳ (để hiện cả hai ô lọc, giống lúc phát hiện lỗi), một môn có tên rất dài (`ZZ56A`), bài tập và tài liệu có tên tệp dài.
- Trình duyệt: trình duyệt trong ứng dụng Claude, giả lập khổ điện thoại (375 × 812 có giả lập thiết bị cảm ứng; 320, 412, 512 px đặt tay).
- Đo: `scrollWidth / clientWidth` của trang. Bằng nhau nghĩa là không cuộn ngang. Ở mỗi khổ đo 5 trạng thái: mới vào trang, mở khung Bài tập, Tài liệu, Trắc nghiệm của môn đầu tiên, và chọn "Tất cả học kỳ".
- Ảnh "trước khi sửa" chụp trên cùng dữ liệu, sau khi tạm cất thay đổi (`git stash`).

## 4. Kết quả

**Trang Môn học** (độ rộng trang / độ rộng màn hình, px):

| Khổ | Trước khi sửa | Sau khi sửa (cả 5 trạng thái) |
|---|---|---|
| 320 (iPhone SE đời 1) | 429 / 320 | 320 / 320 |
| 375 (iPhone 12 mini, SE 2–3) | 429 / 375 | 375 / 375 |
| 412 (Android phổ biến) | không đo | 412 / 412 |
| 512 (khổ lúc phát hiện lỗi, có cả 2 ô lọc) | **731 / 512** (biên bản PR56 ghi 733) | 512 / 512 |
| 1280 (máy tính) | không đo | 1274 / 1274, hàng công cụ vẫn một dòng |

Hai số "trước khi sửa" ở 320 và 375 px đo khi dữ liệu mới có một học kỳ (chỉ hiện ô lọc khóa); khi có thêm ô lọc học kỳ thì mã cũ còn tràn nhiều hơn, như ở 512 px.

**Các trang khác** (vai trò Phòng Đào tạo, sau khi sửa, ở 375 px và 320 px): Dashboard, Môn học, Xếp lịch học & thi, Lịch theo tháng, Quy chế điểm, Chương trình ĐT, Xét tốt nghiệp, Công bố khóa luận, Tin tức, Biểu mẫu, Hồ sơ SV-GV, Liên hệ đều **không cuộn ngang**. Bảng ở trang Xét tốt nghiệp rộng hơn màn hình nhưng chỉ cuộn bên trong khung bảng (`table-responsive`), đúng thiết kế.

`npm run test:logic`: 169/169 đạt.

Ảnh trong [`anh/g4-cuon-ngang/`](anh/g4-cuon-ngang/):

| Ảnh | Nội dung |
|---|---|
| [`01-truoc-sua-375px.jpg`](anh/g4-cuon-ngang/01-truoc-sua-375px.jpg) | Trước: nút "Thêm môn học" bị cắt ở mép phải |
| [`01b-truoc-sua-512px-hai-o-loc.jpg`](anh/g4-cuon-ngang/01b-truoc-sua-512px-hai-o-loc.jpg) | Trước: 512 px có hai ô lọc, trang rộng 731 px; ô tìm, nút Thêm, ảnh đại diện nằm ngoài màn hình |
| [`02-sau-sua-320px.jpg`](anh/g4-cuon-ngang/02-sau-sua-320px.jpg) | Sau: 320 px, các ô xuống dòng; thanh trên cùng không còn nút bảng màu (dùng nút nổi) |
| [`03-sau-sua-375px.jpg`](anh/g4-cuon-ngang/03-sau-sua-375px.jpg) | Sau: 375 px |
| [`04-sau-sua-512px-hai-o-loc.jpg`](anh/g4-cuon-ngang/04-sau-sua-512px-hai-o-loc.jpg) | Sau: 512 px có hai ô lọc |
| [`05-sau-sua-1280px-may-tinh.jpg`](anh/g4-cuon-ngang/05-sau-sua-1280px-may-tinh.jpg) | Sau: khổ máy tính, hàng công cụ vẫn một dòng |

## 5. Giới hạn và việc còn lại

| # | Nội dung |
|---|---|
| 1 | Thử bằng giả lập khổ màn hình trên trình duyệt máy tính, chưa thử trên điện thoại thật. Sau khi gộp và triển khai, mở trang Môn học trên một điện thoại thật để xác nhận |
| 2 | Chỉ rà các trang của vai trò Phòng Đào tạo với dữ liệu mẫu ít. Các trang chỉ sinh viên, giáo viên hoặc Admin thấy (Trắc nghiệm, Học phí, Quản trị...) chưa rà ở khổ hẹp |
| 3 | Thay đổi chỉ ở giao diện (`pages/`, `components/`, `style.css`): cần chép giao diện lên máy chủ khi triển khai, không đổi `studytask_api.py` |

[PR56]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/56
[PR89]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/89
