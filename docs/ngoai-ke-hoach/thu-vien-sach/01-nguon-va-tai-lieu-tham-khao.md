# 01. Nguồn và tài liệu tham khảo
> **NGOÀI KẾ HOẠCH CỦA NHÓM.** Phần việc này do Trương Thanh Vui làm riêng, không thuộc kế hoạch tuần 5, 6, 7 và không tính vào khối lượng các việc theo kế hoạch của nhóm. Đọc để hiểu một phần việc riêng, không dùng để đánh giá tiến độ kế hoạch.

## 1. Nguồn

**Internet Archive (https://archive.org)** là nguồn của **cả 70 sách**: 62 sách có mã mục (thuộc 46 mục) và 8 sách tải về bằng tay nên không có mã mục (Trương Thanh Vui xác nhận ngày 19/11/2026). Nhóm không biên soạn, không chỉnh sửa nội dung sách; chỉ lưu bản PDF đã tải về trên máy chủ của nhóm để sinh viên đã đăng nhập đọc và tải trong hệ thống học tập.

**Trang tìm kiếm dùng để tìm sách (do Trương Thanh Vui cung cấp):**
https://archive.org/search?tab=texts&query=T%C3%A1c+ph%E1%BA%A9m+v%C4%83n+h%E1%BB%8Dc&page=3
(từ khóa "Tác phẩm văn học", loại tài liệu văn bản, trang kết quả 3). Đây là trang kết quả tìm kiếm, nội dung thay đổi theo thời gian nên **không dùng làm nguồn của từng sách**. Nguồn của từng sách là trang chi tiết của mục đó (cột "Mã mục" ở bảng dưới, dạng `https://archive.org/details/<mã mục>`).

**Cách lấy thông tin sách:** tên mục, tác giả, giấy phép được đọc ngày **19/11/2026** từ giao diện công khai `https://archive.org/metadata/<mã mục>` của Internet Archive (bản sao lưu trong repo: `scripts/data/thu-vien-archive-meta.json`). Tên sách có dấu, tác giả, thể loại do nhóm nhập tay ở `scripts/data/thu-vien-overrides.json` khi trang nguồn ghi thiếu hoặc không dấu. Năm xuất bản **không** lấy từ Archive vì trường ngày ở đó nhiều khi là ngày tải lên.

**Ngày tải sách về máy:** `[Thanh Vui điền]` (các thư mục sách nằm ở `E:\sach` trên máy cá nhân; tên thư mục trùng mã mục Archive).

## 2. Tài liệu tham khảo khi xây dựng chức năng

- Internet Archive. *Metadata API* (`https://archive.org/metadata/<identifier>`). Dùng để đọc tên, tác giả, giấy phép của từng mục.
- Creative Commons. *CC BY-NC-ND 4.0, CC BY-NC 4.0, CC BY-SA 4.0 và Public Domain Mark 1.0* (https://creativecommons.org/licenses/). Dùng để hiểu và hiển thị giấy phép mà trang nguồn ghi.
- nginx. *`internal` và `X-Accel-Redirect`* (https://nginx.org/en/docs/http/ngx_http_core_module.html#internal). Dùng để chỉ cho tải tệp sách sau khi API đã kiểm tra đăng nhập.
- Microsoft. *`Windows.Data.Pdf.PdfDocument`* (Windows Runtime). Dùng để vẽ trang 1 của PDF làm ảnh bìa, không cần cài thêm phần mềm.

## 3. Giấy phép và bản quyền (cần đọc)

| Giấy phép ghi trên trang nguồn | Số sách |
|---|---|
| CC BY-NC-ND 4.0 (ghi nguồn, phi thương mại, không phái sinh) | 25 |
| Phạm vi công cộng (Public Domain Mark 1.0) | 10 |
| CC BY-SA 4.0 | 1 |
| CC BY-NC 4.0 | 1 |
| **Chưa ghi giấy phép trên trang nguồn** (gồm 8 sách không có mã Archive) | **33** |

- Trang nguồn không ghi giấy phép **không có nghĩa là được dùng tự do**. Nhiều sách trong danh sách còn trong thời hạn bản quyền (ví dụ sách dịch, sách xuất bản gần đây, tạp chí). Việc một sách có trên Archive.org cũng không bảo đảm người đăng có quyền phân phối lại.
- Vì vậy hệ thống **không đặt PDF ở địa chỉ công khai**: chỉ tải được qua `/api/files/library/<mã>.pdf` khi đã đăng nhập; trang Thư viện ghi rõ nguồn, giấy phép, và câu "chỉ dùng học tập, quyền tác giả thuộc tác giả và nhà xuất bản". PDF **không đưa vào git**; trong git chỉ có danh mục (tên, nguồn, giấy phép, SHA-256).
- Giấy phép NC (phi thương mại) phù hợp với việc dùng học tập trong trường; ND (không phái sinh) nghĩa là không chỉnh sửa nội dung: nhóm không sửa sách, chỉ lấy trang 1 làm ảnh bìa hiển thị.
- **8 sách trong thư mục "sách tự down"** (Đắc nhân tâm, Giai thoại và sấm kí Trạng Trình, Mặt trận miền Tây vẫn yên tĩnh, Tarzan of the Apes, Thanh kiếm và lá chắn tập 1 đến 4) cũng tải từ Archive.org nhưng bằng tay nên **không có mã mục** và chưa có giấy phép đọc từ trang nguồn. Trong danh mục ghi nguồn "Internet Archive (tải thủ công, không có mã mục)", không có liên kết tới trang chi tiết. `[Thanh Vui bổ sung đường dẫn trang chi tiết của từng sách nếu còn nhớ, để người đọc kiểm chứng được]`.
- Khuyến nghị trước khi mở cho người dùng bên ngoài trường hoặc công bố công khai: rà giấy phép từng sách, gỡ sách chưa rõ quyền (lệnh gỡ: `scripts/import_library.py --remove`), và xin ý kiến giảng viên hướng dẫn.

## 4. Danh sách 70 sách

Cột "Mã mục" là mã của mục trên Archive.org; một mục có thể chứa nhiều sách (ví dụ `bui-bich-ha` chứa 7 sách).

| # | Tên sách | Tác giả | Thể loại | Mã mục (Archive.org) | Giấy phép |
|---|---|---|---|---|---|
| 1 | Những cuộc chinh phục kỳ diệu | — | Khoa học | [01-nhung-cuoc-chinh-phuc-ky-dieu](https://archive.org/details/01-nhung-cuoc-chinh-phuc-ky-dieu) | CC BY-NC-ND 4.0 |
| 2 | Chú giải 1 Tê-sa-lô-ni-ca (bản tiếng Việt) | Bob Goethe | Tôn giáo | [1-thessalonians-commentary-vietnamese](https://archive.org/details/1-thessalonians-commentary-vietnamese) | CC BY-SA 4.0 |
| 3 | Văn học và Tuổi trẻ – số tháng 3/2026 | Viện Nghiên cứu Sách và Học liệu giáo dục | Tạp chí | [2026-vhtt-so-thang-3](https://archive.org/details/2026-vhtt-so-thang-3) | CC BY-NC-ND 4.0 |
| 4 | Hồ Chí Minh toàn tập – Tập 1 | Hồ Chí Minh | Chính trị – Lịch sử | [8db-359da-464353284fe-705a-538b-5a-568-ho-chi-minh-toan-tap-tap-1](https://archive.org/details/8db-359da-464353284fe-705a-538b-5a-568-ho-chi-minh-toan-tap-tap-1) | Chưa ghi |
| 5 | Hồng Lâu Mộng | Tào Tuyết Cần | Văn học nước ngoài | [HongLauMong_201512](https://archive.org/details/HongLauMong_201512) | Chưa ghi |
| 6 | Nguồn gốc dân tộc Việt | Phạm Trần Anh | Chính trị – Lịch sử | [NGUONGOCDANTOCVIET_PhamTranAnh](https://archive.org/details/NGUONGOCDANTOCVIET_PhamTranAnh) | Chưa ghi |
| 7 | Việt Nam văn học sử yếu | Dương Quảng Hàm | Văn học VN | [VNVanHocSuYeu1968](https://archive.org/details/VNVanHocSuYeu1968) | Chưa ghi |
| 8 | Giáo trình Pāḷi sơ cấp (song ngữ) – An Elementary Pali Course | — | Ngôn ngữ | [all-song-ngu-16x-24-an-elementary-pali-course-van-pham-pali_202511](https://archive.org/details/all-song-ngu-16x-24-an-elementary-pali-course-van-pham-pali_202511) | Chưa ghi |
| 9 | Anabasis – Cuộc hành quân của Mười Ngàn người | Xenophon (Nguyễn Đông Hùng dịch) | Chính trị – Lịch sử | [anabasis-cuoc-hanh-quan-cua-muoi-ngan-nguoi](https://archive.org/details/anabasis-cuoc-hanh-quan-cua-muoi-ngan-nguoi) | Phạm vi công cộng |
| 10 | Andersen – Người kể chuyện cổ tích | Hans Christian Andersen | Thiếu nhi & cổ tích | [andersen-nguoi-ke-chuyen-co-tich](https://archive.org/details/andersen-nguoi-ke-chuyen-co-tich) | CC BY-NC-ND 4.0 |
| 11 | Bầu trời tuổi thơ | Nguyễn Quang Riệu | Văn học VN | [bautroituoitho.-vn](https://archive.org/details/bautroituoitho.-vn) | CC BY-NC-ND 4.0 |
| 12 | Buổi Sáng Một Mình | Bùi Bích Hà | Văn học VN | [bui-bich-ha](https://archive.org/details/bui-bich-ha) | Chưa ghi |
| 13 | Bạn gái nhỏ to (phần 1) | Bùi Bích Hà | Văn học VN | [bui-bich-ha](https://archive.org/details/bui-bich-ha) | Chưa ghi |
| 14 | Bạn gái nhỏ to | Bùi Bích Hà | Văn học VN | [bui-bich-ha](https://archive.org/details/bui-bich-ha) | Chưa ghi |
| 15 | Hạnh Phúc Có Thật | Bùi Bích Hà | Văn học VN | [bui-bich-ha](https://archive.org/details/bui-bich-ha) | Chưa ghi |
| 16 | Phương Trời Khác | Bùi Bích Hà | Văn học VN | [bui-bich-ha](https://archive.org/details/bui-bich-ha) | Chưa ghi |
| 17 | Đèn khuya (tập 1) | Bùi Bích Hà | Văn học VN | [bui-bich-ha](https://archive.org/details/bui-bich-ha) | Chưa ghi |
| 18 | Đèn khuya (tập 2) | Bùi Bích Hà | Văn học VN | [bui-bich-ha](https://archive.org/details/bui-bich-ha) | Chưa ghi |
| 19 | Câu chuyện khoa học | Nguyễn Văn Tuấn | Khoa học | [cau-chuyen-khoa-hoc-nguyen-van-tuan](https://archive.org/details/cau-chuyen-khoa-hoc-nguyen-van-tuan) | CC BY-NC-ND 4.0 |
| 20 | Cây xanh rì rào | A-lếch-xây Mu-xa-tốp | Thiếu nhi & cổ tích | [cay-xanh-ri-rao-a-lech-xay-mu-xa-top](https://archive.org/details/cay-xanh-ri-rao-a-lech-xay-mu-xa-top) | CC BY-NC-ND 4.0 |
| 21 | Cơ cấu Việt ngữ – Quyển 1 | Trần Ngọc Ninh | Ngôn ngữ | [co-cau-viet-ngu-quyen-1-tran-ngoc-ninh](https://archive.org/details/co-cau-viet-ngu-quyen-1-tran-ngoc-ninh) | Chưa ghi |
| 22 | Cơ cấu Việt ngữ – Quyển 2 | Trần Ngọc Ninh | Ngôn ngữ | [co-cau-viet-ngu-quyen-2-tran-ngoc-ninh](https://archive.org/details/co-cau-viet-ngu-quyen-2-tran-ngoc-ninh) | Chưa ghi |
| 23 | Cổ tích Việt Nam bằng thơ | — | Thiếu nhi & cổ tích | [co-tich-viet-nam-bang-tho](https://archive.org/details/co-tich-viet-nam-bang-tho) | CC BY-NC-ND 4.0 |
| 24 | Cuộc đời của Lê-nin – Phần 1 | Ma-ri-a A. Pri-lê-gia-ê-va | Chính trị – Lịch sử | [cuoc-doi-cua-lenin-ma-ria-a-pri-le-gia-e-va-phan-1](https://archive.org/details/cuoc-doi-cua-lenin-ma-ria-a-pri-le-gia-e-va-phan-1) | Chưa ghi |
| 25 | Cuộc đời của Lê-nin – Phần 2 | Ma-ri-a A. Pri-lê-gia-ê-va | Chính trị – Lịch sử | [cuoc-doi-cua-lenin-ma-ria-a-pri-le-gia-e-va-phan-1](https://archive.org/details/cuoc-doi-cua-lenin-ma-ria-a-pri-le-gia-e-va-phan-1) | Chưa ghi |
| 26 | Cuộc phiêu lưu của quả lê khổng lồ | Jakob Martin Strid | Thiếu nhi & cổ tích | [cuoc-phieu-luu-cua-qua-le-khong-lo](https://archive.org/details/cuoc-phieu-luu-cua-qua-le-khong-lo) | Chưa ghi |
| 27 | Dắt dìu về thuở ấu thơ | Nguyễn Chấn Hùng | Văn học VN | [dat-diu-ve-thuo-au-tho-nguyen-chan-hung](https://archive.org/details/dat-diu-ve-thuo-au-tho-nguyen-chan-hung) | CC BY-NC-ND 4.0 |
| 28 | Đầu xanh tuổi trẻ | Fyodor Dostoevsky | Văn học nước ngoài | [dau-xanh-tuoi-tre-dostoievski](https://archive.org/details/dau-xanh-tuoi-tre-dostoievski) | CC BY-NC-ND 4.0 |
| 29 | Đồ đồng Trung Quốc | Lý Tùng | Văn hóa – Nghệ thuật | [do-dong-trung-quoc-ly-hung](https://archive.org/details/do-dong-trung-quoc-ly-hung) | CC BY-NC-ND 4.0 |
| 30 | Đồ nội thất Trung Quốc | Trương Hiểu Minh | Văn hóa – Nghệ thuật | [do-noi-that-trung-quoc-truong-hieu-minh](https://archive.org/details/do-noi-that-trung-quoc-truong-hieu-minh) | CC BY-NC-ND 4.0 |
| 31 | Cuộc cách mạng ngược trong khoa học – Phần 1 | Friedrich A. Hayek | Khoa học | [friedrich_august_hayek_new_pdf_p1_9042](https://archive.org/details/friedrich_august_hayek_new_pdf_p1_9042) | CC BY-NC-ND 4.0 |
| 32 | Cuộc cách mạng ngược trong khoa học – Phần 2 | Friedrich A. Hayek | Khoa học | [friedrich_august_hayek_new_pdf_p1_9042](https://archive.org/details/friedrich_august_hayek_new_pdf_p1_9042) | CC BY-NC-ND 4.0 |
| 33 | Thiện ác đấu tranh | — | Khác | [gc-viet-template-merged](https://archive.org/details/gc-viet-template-merged) | Chưa ghi |
| 34 | Giamilia – Truyện núi đồi và thảo nguyên | Chingiz Aitmatov | Văn học nước ngoài | [giamilia-truyen-nui-doi-va-th-tsinghiz-aitomatop](https://archive.org/details/giamilia-truyen-nui-doi-va-th-tsinghiz-aitomatop) | CC BY-NC-ND 4.0 |
| 35 | Giáo trình Xác suất thống kê | Lê Văn Dũng (ĐH Sư phạm Đà Nẵng) | Giáo trình | [giao-trinh-xac-suat-thong-ke-le-van-dung-dhsp-dn](https://archive.org/details/giao-trinh-xac-suat-thong-ke-le-van-dung-dhsp-dn) | Chưa ghi |
| 36 | Giáo trình Tư tưởng Hồ Chí Minh | Hội đồng Trung ương chỉ đạo biên soạn giáo trình quốc gia | Giáo trình | [gtr.tutuonghcm](https://archive.org/details/gtr.tutuonghcm) | Chưa ghi |
| 37 | Họ đã nghĩ như thế | Nhiều tác giả (đệ tử phương Tây của Đức Phật) | Tôn giáo | [ho-da-nghi-nhu-the](https://archive.org/details/ho-da-nghi-nhu-the) | Chưa ghi |
| 38 | Tạp chí Học tập – số 9 năm 1958 | Đảng Lao động Việt Nam | Tạp chí | [hoctap-9.1958](https://archive.org/details/hoctap-9.1958) | CC BY-NC 4.0 |
| 39 | Hỗn độn và hài hòa | Trịnh Xuân Thuận | Khoa học | [hon-don-va-hai-hoa-trinh-xuan-thuan](https://archive.org/details/hon-don-va-hai-hoa-trinh-xuan-thuan) | CC BY-NC-ND 4.0 |
| 40 | Ông già Khốt-ta-bít | Lagin Lazar (Nguyễn Trường Tân dịch) | Thiếu nhi & cổ tích | [lagin-lazar-ong-gia-khottabut-nguyen-truong-tan-dich](https://archive.org/details/lagin-lazar-ong-gia-khottabut-nguyen-truong-tan-dich) | CC BY-NC-ND 4.0 |
| 41 | Ngụ ngôn Aesop – Những câu chuyện bị lãng quên | Fiona Waters, Fulvio Testa | Thiếu nhi & cổ tích | [ngu-ngon-aesop-nhung-cau-chuyen-bi-lang-quen-fiona-waters-fulvio-testa_202506](https://archive.org/details/ngu-ngon-aesop-nhung-cau-chuyen-bi-lang-quen-fiona-waters-fulvio-testa_202506) | CC BY-NC-ND 4.0 |
| 42 | Những người bạn từ trang sách | Roberto Piumini (Trần Ngọc Mai Thảo dịch) | Thiếu nhi & cổ tích | [nhung-nguoi-ban-tu-trang-sach-roberto-piumini](https://archive.org/details/nhung-nguoi-ban-tu-trang-sach-roberto-piumini) | Chưa ghi |
| 43 | Những người cùng thời | Nhiều tác giả | Văn học VN | [nhung-nguoi-cung-thoi](https://archive.org/details/nhung-nguoi-cung-thoi) | CC BY-NC-ND 4.0 |
| 44 | Những người sinh viên | Yuri Trifonov | Văn học nước ngoài | [nhung-nguoi-sinh-vien-iu-ri-tri-pho-nop](https://archive.org/details/nhung-nguoi-sinh-vien-iu-ri-tri-pho-nop) | CC BY-NC-ND 4.0 |
| 45 | Phân tích tác phẩm văn học dân gian | Bùi Mạnh Nhị | Giáo trình | [phantichtacphamvanhocdangian_bmn](https://archive.org/details/phantichtacphamvanhocdangian_bmn) | Chưa ghi |
| 46 | 1984 | George Orwell | Văn học nước ngoài | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 47 | AQ chính truyện | Lỗ Tấn | Văn học nước ngoài | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 48 | Chúa ruồi | William Golding | Văn học nước ngoài | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 49 | Liêu Trai chí dị | Bồ Tùng Linh | Văn học nước ngoài | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 50 | Ngự lâm pháo thủ (toàn tập) | Alexandre Dumas | Văn học nước ngoài | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 51 | Truyện cổ Andersen | Hans Christian Andersen | Thiếu nhi & cổ tích | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 52 | Truyện cổ Grimm | Anh em nhà Grimm | Thiếu nhi & cổ tích | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 53 | Truyện ngụ ngôn Aesop | Aesop | Thiếu nhi & cổ tích | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 54 | Trại súc vật | George Orwell | Văn học nước ngoài | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 55 | Quãng đời sau lưng | Trần Đức Phổ | Văn học VN | [quang-doi-sau-lung](https://archive.org/details/quang-doi-sau-lung) | CC BY-NC-ND 4.0 |
| 56 | Sơn lâm êm đềm | Lev Tolstoy | Văn học nước ngoài | [son-lam-em-dem-leon-tolstoi](https://archive.org/details/son-lam-em-dem-leon-tolstoi) | CC BY-NC-ND 4.0 |
| 57 | Đắc nhân tâm | Dale Carnegie | Kỹ năng | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 58 | Giai thoại và sấm kí Trạng Trình | Phạm Đan Quế | Văn học VN | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 59 | Mặt trận miền Tây vẫn yên tĩnh | Erich Maria Remarque | Văn học nước ngoài | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 60 | Tarzan of the Apes | Edgar Rice Burroughs | Văn học nước ngoài | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 61 | Thanh kiếm và lá chắn – Tập 1 | Vađim Kôgiepnhicốp | Văn học nước ngoài | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 62 | Thanh kiếm và lá chắn – Tập 2 | Vađim Kôgiepnhicốp | Văn học nước ngoài | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 63 | Thanh kiếm và lá chắn – Tập 3 | Vađim Kôgiepnhicốp | Văn học nước ngoài | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 64 | Thanh kiếm và lá chắn – Tập 4 | Vađim Kôgiepnhicốp | Văn học nước ngoài | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 65 | 60 bài luận tiếng Anh thông dụng | Trần Văn Hải | Ngôn ngữ | [taisachmoi.com-60-bai-luan-tieng-anh-thong-dung](https://archive.org/details/taisachmoi.com-60-bai-luan-tieng-anh-thong-dung) | Chưa ghi |
| 66 | Tổng tập văn học Việt Nam – Tập 19 | Trung tâm Khoa học Xã hội và Nhân văn Quốc gia | Văn học VN | [tong-tap-van-hoc-viet-nam-19-ntg-2000](https://archive.org/details/tong-tap-van-hoc-viet-nam-19-ntg-2000) | CC BY-NC-ND 4.0 |
| 67 | Tổng tập văn học Việt Nam – Tập 20 | Trung tâm Khoa học Xã hội và Nhân văn Quốc gia | Văn học VN | [tong-tap-van-hoc-viet-nam-20-ntg-2000](https://archive.org/details/tong-tap-van-hoc-viet-nam-20-ntg-2000) | CC BY-NC-ND 4.0 |
| 68 | Tổng tập văn học Việt Nam – Tập 28 | Trung tâm Khoa học Xã hội và Nhân văn Quốc gia | Văn học VN | [tong-tap-van-hoc-viet-nam-28-ntg-2000](https://archive.org/details/tong-tap-van-hoc-viet-nam-28-ntg-2000) | CC BY-NC-ND 4.0 |
| 69 | Tuyển tập truyện ngắn Nguyễn Công Hoan | Nguyễn Công Hoan | Văn học VN | [tuyen-tap-truyen-ngan-nguyen-cong-hoan](https://archive.org/details/tuyen-tap-truyen-ngan-nguyen-cong-hoan) | Chưa ghi |
| 70 | Văn học và Tuổi trẻ – số 01/2023 | Viện Nghiên cứu Sách và Học liệu giáo dục | Tạp chí | [vhtt-so-01-2023](https://archive.org/details/vhtt-so-01-2023) | CC BY-NC-ND 4.0 |
