# 01. Nguồn và tài liệu tham khảo
> **NGOÀI KẾ HOẠCH CỦA NHÓM.** Phần việc này do Trương Thanh Vui làm riêng, không thuộc kế hoạch tuần 5, 6, 7 và không tính vào khối lượng các việc theo kế hoạch của nhóm. Đọc để hiểu một phần việc riêng, không dùng để đánh giá tiến độ kế hoạch.
> **Đã cũ (21/11/2026):** số liệu dưới đây là trạng thái 179 sách ngày 19/11. Sau các lần rà soát 21/11 kho có 262 sách tiếng Việt chữ quốc ngữ, xem [06](06-ra-soat-sach-doc-duoc.md) và [05](05-danh-sach-sach.md).

## 1. Nguồn

**Internet Archive (https://archive.org)** là nguồn của **cả 179 sách**: 171 sách có mã mục (thuộc 147 mục) và 8 sách tải về bằng tay nên không có mã mục (Trương Thanh Vui xác nhận ngày 19/11/2026). Nhóm không biên soạn, không chỉnh sửa nội dung sách; chỉ lưu bản PDF đã tải về trên máy chủ của nhóm để sinh viên đã đăng nhập đọc và tải trong hệ thống học tập.

**Trang tìm kiếm dùng để tìm sách (do Trương Thanh Vui cung cấp):**
https://archive.org/search?tab=texts&query=T%C3%A1c+ph%E1%BA%A9m+v%C4%83n+h%E1%BB%8Dc&page=3
(từ khóa "Tác phẩm văn học", loại tài liệu văn bản, trang kết quả 3). Đây là trang kết quả tìm kiếm, nội dung thay đổi theo thời gian nên **không dùng làm nguồn của từng sách**. Nguồn của từng sách là trang chi tiết của mục đó (cột "Mã mục" ở bảng dưới, dạng `https://archive.org/details/<mã mục>`).

**Cách lấy thông tin sách:** tên mục, tác giả, giấy phép được đọc ngày **19/11/2026** từ giao diện công khai `https://archive.org/metadata/<mã mục>` của Internet Archive (bản sao lưu trong repo: `scripts/data/thu-vien-archive-meta.json`). Tên sách có dấu, tác giả, thể loại do nhóm nhập tay ở `scripts/data/thu-vien-overrides.json` khi trang nguồn ghi thiếu hoặc không dấu. Năm xuất bản **không** lấy từ Archive vì trường ngày ở đó nhiều khi là ngày tải lên.

**Hai đợt đưa sách lên (cùng ngày 19/11/2026):** đợt 1 gồm 70 sách; đợt 2 thêm 109 sách (101 mục mới, trong đó 100 mục có trong danh sách `E:\sach\danh-sach-100-sach-moi.csv` do Thanh Vui lập, kèm 1 mục tạp chí `2025-vhtt-thang-10`; mục `01-nhung-cuoc-chinh-phuc-ky-dieu` từ 1 tập nay có 9 tập của bộ "Tủ sách em yêu khoa học").

**Ngày tải sách về máy:** `[Thanh Vui điền]` (các thư mục sách nằm ở `E:\sach` trên máy cá nhân; tên thư mục trùng mã mục Archive).

## 2. Tài liệu tham khảo khi xây dựng chức năng

- Internet Archive. *Metadata API* (`https://archive.org/metadata/<identifier>`). Dùng để đọc tên, tác giả, giấy phép của từng mục.
- Creative Commons. *CC BY-NC-ND 3.0 và 4.0, CC BY-NC 4.0, CC BY-SA 4.0, Public Domain Mark 1.0 và tuyên bố phạm vi công cộng kiểu cũ* (https://creativecommons.org/licenses/). Dùng để hiểu và hiển thị giấy phép mà trang nguồn ghi.
- nginx. *`internal` và `X-Accel-Redirect`* (https://nginx.org/en/docs/http/ngx_http_core_module.html#internal). Dùng để chỉ cho tải tệp sách sau khi API đã kiểm tra đăng nhập.
- Microsoft. *`Windows.Data.Pdf.PdfDocument`* (Windows Runtime). Dùng để vẽ trang 1 của PDF làm ảnh bìa, không cần cài thêm phần mềm.

## 3. Giấy phép và bản quyền (cần đọc)

| Giấy phép ghi trên trang nguồn | Số sách |
|---|---|
| CC BY-NC-ND 4.0 (ghi nguồn, phi thương mại, không phái sinh) | 116 |
| CC BY-NC-ND 3.0 (như trên, phiên bản cũ) | 7 |
| Phạm vi công cộng (Public Domain Mark 1.0) | 19 |
| Phạm vi công cộng (tuyên bố kiểu cũ của Creative Commons) | 2 |
| CC BY-SA 4.0 | 1 |
| CC BY-NC 4.0 | 1 |
| **Chưa ghi giấy phép trên trang nguồn** (gồm 8 sách không có mã Archive) | **33** |

- Trang nguồn không ghi giấy phép **không có nghĩa là được dùng tự do**. Nhiều sách trong danh sách còn trong thời hạn bản quyền (ví dụ sách dịch, sách xuất bản gần đây, tạp chí). Việc một sách có trên Archive.org cũng không bảo đảm người đăng có quyền phân phối lại.
- Vì vậy hệ thống **không đặt PDF ở địa chỉ công khai**: chỉ tải được qua `/api/files/library/<mã>.pdf` khi đã đăng nhập; trang Thư viện ghi rõ nguồn, giấy phép, và câu "chỉ dùng học tập, quyền tác giả thuộc tác giả và nhà xuất bản". PDF **không đưa vào git**; trong git chỉ có danh mục (tên, nguồn, giấy phép, SHA-256).
- Giấy phép NC (phi thương mại) phù hợp với việc dùng học tập trong trường; ND (không phái sinh) nghĩa là không chỉnh sửa nội dung: nhóm không sửa sách, chỉ lấy trang 1 làm ảnh bìa hiển thị.
- **8 sách trong thư mục "sách tự down"** (Đắc nhân tâm, Giai thoại và sấm kí Trạng Trình, Mặt trận miền Tây vẫn yên tĩnh, Tarzan of the Apes, Thanh kiếm và lá chắn tập 1 đến 4) cũng tải từ Archive.org nhưng bằng tay nên **không có mã mục** và chưa có giấy phép đọc từ trang nguồn. Trong danh mục ghi nguồn "Internet Archive (tải thủ công, không có mã mục)", không có liên kết tới trang chi tiết. `[Thanh Vui bổ sung đường dẫn trang chi tiết của từng sách nếu còn nhớ, để người đọc kiểm chứng được]`.
- Khuyến nghị trước khi mở cho người dùng bên ngoài trường hoặc công bố công khai: rà giấy phép từng sách, gỡ sách chưa rõ quyền (lệnh gỡ: `scripts/import_library.py --remove`), và xin ý kiến giảng viên hướng dẫn.

## 4. Danh sách 179 sách

Cột "Mã mục" là mã của mục trên Archive.org; một mục có thể chứa nhiều sách (ví dụ `bui-bich-ha` chứa 7 sách, `01-nhung-cuoc-chinh-phuc-ky-dieu` chứa 9 tập).

| # | Tên sách | Tác giả | Thể loại | Mã mục (Archive.org) | Giấy phép |
|---|---|---|---|---|---|
| 1 | Những cuộc chinh phục kỳ diệu | — | Khoa học | [01-nhung-cuoc-chinh-phuc-ky-dieu](https://archive.org/details/01-nhung-cuoc-chinh-phuc-ky-dieu) | CC BY-NC-ND 4.0 |
| 2 | Mùa xuân và khoa học | — | Khoa học | [01-nhung-cuoc-chinh-phuc-ky-dieu](https://archive.org/details/01-nhung-cuoc-chinh-phuc-ky-dieu) | CC BY-NC-ND 4.0 |
| 3 | Những phát minh kỳ lạ trên thế giới | — | Khoa học | [01-nhung-cuoc-chinh-phuc-ky-dieu](https://archive.org/details/01-nhung-cuoc-chinh-phuc-ky-dieu) | CC BY-NC-ND 4.0 |
| 4 | Những loài vật thông thái | — | Khoa học | [01-nhung-cuoc-chinh-phuc-ky-dieu](https://archive.org/details/01-nhung-cuoc-chinh-phuc-ky-dieu) | CC BY-NC-ND 4.0 |
| 5 | Con người – bạn là ai? | — | Khoa học | [01-nhung-cuoc-chinh-phuc-ky-dieu](https://archive.org/details/01-nhung-cuoc-chinh-phuc-ky-dieu) | CC BY-NC-ND 4.0 |
| 6 | Trong thế giới y học | — | Khoa học | [01-nhung-cuoc-chinh-phuc-ky-dieu](https://archive.org/details/01-nhung-cuoc-chinh-phuc-ky-dieu) | CC BY-NC-ND 4.0 |
| 7 | Bí mật của vàng đen | — | Khoa học | [01-nhung-cuoc-chinh-phuc-ky-dieu](https://archive.org/details/01-nhung-cuoc-chinh-phuc-ky-dieu) | CC BY-NC-ND 4.0 |
| 8 | Thế giới vi sinh kỳ diệu | — | Khoa học | [01-nhung-cuoc-chinh-phuc-ky-dieu](https://archive.org/details/01-nhung-cuoc-chinh-phuc-ky-dieu) | CC BY-NC-ND 4.0 |
| 9 | Đường vào vũ trụ | — | Khoa học | [01-nhung-cuoc-chinh-phuc-ky-dieu](https://archive.org/details/01-nhung-cuoc-chinh-phuc-ky-dieu) | CC BY-NC-ND 4.0 |
| 10 | Chú giải 1 Tê-sa-lô-ni-ca (bản tiếng Việt) | Bob Goethe | Tôn giáo | [1-thessalonians-commentary-vietnamese](https://archive.org/details/1-thessalonians-commentary-vietnamese) | CC BY-SA 4.0 |
| 11 | Văn học và Tuổi trẻ – số tháng 10/2025 | Viện Nghiên cứu Sách và Học liệu giáo dục | Tạp chí | [2025-vhtt-thang-10](https://archive.org/details/2025-vhtt-thang-10) | CC BY-NC-ND 4.0 |
| 12 | Văn học và Tuổi trẻ – số tháng 3/2026 | Viện Nghiên cứu Sách và Học liệu giáo dục | Tạp chí | [2026-vhtt-so-thang-3](https://archive.org/details/2026-vhtt-so-thang-3) | CC BY-NC-ND 4.0 |
| 13 | Đối xứng phân tử và ứng dụng lý thuyết nhóm trong hóa học | Đào Đình Thức, Nguyễn Ngọc Hà | Giáo trình | [2160019.pdf-file](https://archive.org/details/2160019.pdf-file) | CC BY-NC-ND 4.0 |
| 14 | Hóa học xanh trong tổng hợp hữu cơ. Tập 1 (Xúc tác xanh và dung môi xanh) | Phan Thanh Sơn Nam | Giáo trình | [2266952.pdf](https://archive.org/details/2266952.pdf) | CC BY-NC-ND 4.0 |
| 15 | Hồ Chí Minh toàn tập – Tập 1 | Hồ Chí Minh | Chính trị – Lịch sử | [8db-359da-464353284fe-705a-538b-5a-568-ho-chi-minh-toan-tap-tap-1](https://archive.org/details/8db-359da-464353284fe-705a-538b-5a-568-ho-chi-minh-toan-tap-tap-1) | Chưa ghi |
| 16 | Captured Vietnamese Records – Loose Pages 1 | — | Chính trị – Lịch sử | [CapturedVietnameseRecordsLoosePages1](https://archive.org/details/CapturedVietnameseRecordsLoosePages1) | Phạm vi công cộng |
| 17 | Chinese Language Seed And Its Applications | Kok-Wah Lee @ XpreeLi | Ngôn ngữ | [ChineseLanguageSeedAndItsApplications](https://archive.org/details/ChineseLanguageSeedAndItsApplications) | CC BY-NC-ND 3.0 |
| 18 | Chuyện cổ tích về các chàng hiệp sĩ | Nhiều tác giả | Thiếu nhi & cổ tích | [ChuyenCoTichVeCacChangHiepSi](https://archive.org/details/ChuyenCoTichVeCacChangHiepSi) | CC BY-NC-ND 3.0 |
| 19 | Hồng Lâu Mộng | Tào Tuyết Cần | Văn học nước ngoài | [HongLauMong_201512](https://archive.org/details/HongLauMong_201512) | Chưa ghi |
| 20 | Gia-cơ và Giu-đe (chú giải, bản tiếng Việt) | Bob Utley | Tôn giáo | [JamesJudeBibleCommentaryVietnameseVersion](https://archive.org/details/JamesJudeBibleCommentaryVietnameseVersion) | CC BY-NC-ND 3.0 |
| 21 | Memorizable Public-Key Cryptography (MePKC) & Its Applications | Kok-Wah Lee @ XpreeLi, Wei-Jian Chui, Wei-Dong Chui @ Wei-Tong Chui | Khoa học | [MemorizablePublic-keyCryptographymepkcItsApplications](https://archive.org/details/MemorizablePublic-keyCryptographymepkcItsApplications) | CC BY-NC-ND 3.0 |
| 22 | Memorizable Public-Key Cryptography (MePKC) & Its Applications (version 3.0) | Kok-Wah Lee @ XpreeLi | Khoa học | [MemorizablePublic-keyCryptographymepkcItsApplicationsversion3.0](https://archive.org/details/MemorizablePublic-keyCryptographymepkcItsApplicationsversion3.0) | CC BY-NC-ND 3.0 |
| 23 | Nguồn gốc dân tộc Việt | Phạm Trần Anh | Chính trị – Lịch sử | [NGUONGOCDANTOCVIET_PhamTranAnh](https://archive.org/details/NGUONGOCDANTOCVIET_PhamTranAnh) | Chưa ghi |
| 24 | The Gospel According to Paul: Romans (chú giải, bản tiếng Việt) | Bob Utley | Tôn giáo | [PhcmTheoPhaoLThRmatheGospelAccordingToPaulRomans](https://archive.org/details/PhcmTheoPhaoLThRmatheGospelAccordingToPaulRomans) | CC BY-NC-ND 3.0 |
| 25 | Sách Công vụ các Sứ đồ – Book of Acts Commentary (bản tiếng Việt) | Bob Utley | Tôn giáo | [SGiaLu-caSchCngVCcSbookOfActsCommentary](https://archive.org/details/SGiaLu-caSchCngVCcSbookOfActsCommentary) | CC BY-NC-ND 3.0 |
| 26 | Việt Nam nước tôi | Phạm Trần Anh | Chính trị – Lịch sử | [VIETNAMNUOCTOIPhamTranAnh](https://archive.org/details/VIETNAMNUOCTOIPhamTranAnh) | Phạm vi công cộng |
| 27 | Việt Nam văn học sử yếu | Dương Quảng Hàm | Văn học VN | [VNVanHocSuYeu1968](https://archive.org/details/VNVanHocSuYeu1968) | Chưa ghi |
| 28 | Việt Nam sử lược | Trần Trọng Kim | Chính trị – Lịch sử | [VietNamSuLuoc](https://archive.org/details/VietNamSuLuoc) | Phạm vi công cộng |
| 29 | Giáo trình Pāḷi sơ cấp (song ngữ) – An Elementary Pali Course | — | Ngôn ngữ | [all-song-ngu-16x-24-an-elementary-pali-course-van-pham-pali_202511](https://archive.org/details/all-song-ngu-16x-24-an-elementary-pali-course-van-pham-pali_202511) | Chưa ghi |
| 30 | Ẩm thực Trung Quốc | Lưu Quân Như (Trương Gia Quyền dịch) | Văn hóa – Nghệ thuật | [am-thuc-trung-quoc-luu-quan-nhu](https://archive.org/details/am-thuc-trung-quoc-luu-quan-nhu) | CC BY-NC-ND 4.0 |
| 31 | Anabasis – Cuộc hành quân của Mười Ngàn người | Xenophon (Nguyễn Đông Hùng dịch) | Chính trị – Lịch sử | [anabasis-cuoc-hanh-quan-cua-muoi-ngan-nguoi](https://archive.org/details/anabasis-cuoc-hanh-quan-cua-muoi-ngan-nguoi) | Phạm vi công cộng |
| 32 | Andersen – Người kể chuyện cổ tích | Hans Christian Andersen | Thiếu nhi & cổ tích | [andersen-nguoi-ke-chuyen-co-tich](https://archive.org/details/andersen-nguoi-ke-chuyen-co-tich) | CC BY-NC-ND 4.0 |
| 33 | Bảng tra cứu quá trình cơ học truyền nhiệt – truyền khối | Bộ môn Máy và Thiết bị | Giáo trình | [bag_tr_cuu_q_trih_co_hoc_truyen_nhiet_truyen_4088](https://archive.org/details/bag_tr_cuu_q_trih_co_hoc_truyen_nhiet_truyen_4088) | CC BY-NC-ND 4.0 |
| 34 | Bài tập hóa đại cương (có lời giải) | Đào Đình Thức | Giáo trình | [bai-tap-hoa-dai-cuong](https://archive.org/details/bai-tap-hoa-dai-cuong) | CC BY-NC-ND 4.0 |
| 35 | Bài Tập Và Lời Giải Vật Lý Nguyên Tử Hạt Nhân | Yung Kuo Lim, Dương Ngọc Huyền, Nguyễn Trường Luyện (người dịch) | Giáo trình | [bai-tap-va-loi-giai-vat-ly-nguyen-tu-hat-nhan](https://archive.org/details/bai-tap-va-loi-giai-vat-ly-nguyen-tu-hat-nhan) | CC BY-NC-ND 4.0 |
| 36 | Bài Tập Hóa Hữu Cơ | Phan Thanh Sơn Nam | Giáo trình | [baitaphoahuuco_phanthanhsonnam_2_5212](https://archive.org/details/baitaphoahuuco_phanthanhsonnam_2_5212) | CC BY-NC-ND 4.0 |
| 37 | Bầu trời tuổi thơ | Nguyễn Quang Riệu | Văn học VN | [bautroituoitho.-vn](https://archive.org/details/bautroituoitho.-vn) | CC BY-NC-ND 4.0 |
| 38 | Bến Nghé xưa | Sơn Nam | Chính trị – Lịch sử | [ben-nghe-xua-son-nam](https://archive.org/details/ben-nghe-xua-son-nam) | CC BY-NC-ND 4.0 |
| 39 | Petit dictionnaire français-annamite | Trương Vĩnh Ký, J. B. Petrus | Ngôn ngữ | [bub_gb_2kg0AQAAMAAJ](https://archive.org/details/bub_gb_2kg0AQAAMAAJ) | Phạm vi công cộng |
| 40 | Notions pour servir à l'étude de la langue annamite | J. M. J, J., J. M | Ngôn ngữ | [bub_gb_B-QNAAAAMAAJ](https://archive.org/details/bub_gb_B-QNAAAAMAAJ) | Phạm vi công cộng |
| 41 | Lexique franco-annamite = Tu vi phalangsaannam | Ravier, H, Dronet, J. B | Ngôn ngữ | [bub_gb_HdQuAAAAYAAJ](https://archive.org/details/bub_gb_HdQuAAAAYAAJ) | Phạm vi công cộng |
| 42 | Grammaire annamite : suivie d'un vocabulaire français-annamite et annamite-français | Aubaret, Gabriel | Ngôn ngữ | [bub_gb_PKQTAAAAQAAJ](https://archive.org/details/bub_gb_PKQTAAAAQAAJ) | Phạm vi công cộng |
| 43 | Petit dictionnaire annamite-français | Génibrel, J.-F.-M | Ngôn ngữ | [bub_gb_QcMVAAAAYAAJ](https://archive.org/details/bub_gb_QcMVAAAAYAAJ) | Phạm vi công cộng |
| 44 | Buổi Sáng Một Mình | Bùi Bích Hà | Văn học VN | [bui-bich-ha](https://archive.org/details/bui-bich-ha) | Chưa ghi |
| 45 | Bạn gái nhỏ to (phần 1) | Bùi Bích Hà | Văn học VN | [bui-bich-ha](https://archive.org/details/bui-bich-ha) | Chưa ghi |
| 46 | Bạn gái nhỏ to | Bùi Bích Hà | Văn học VN | [bui-bich-ha](https://archive.org/details/bui-bich-ha) | Chưa ghi |
| 47 | Hạnh Phúc Có Thật | Bùi Bích Hà | Văn học VN | [bui-bich-ha](https://archive.org/details/bui-bich-ha) | Chưa ghi |
| 48 | Phương Trời Khác | Bùi Bích Hà | Văn học VN | [bui-bich-ha](https://archive.org/details/bui-bich-ha) | Chưa ghi |
| 49 | Đèn khuya (tập 1) | Bùi Bích Hà | Văn học VN | [bui-bich-ha](https://archive.org/details/bui-bich-ha) | Chưa ghi |
| 50 | Đèn khuya (tập 2) | Bùi Bích Hà | Văn học VN | [bui-bich-ha](https://archive.org/details/bui-bich-ha) | Chưa ghi |
| 51 | Lexicon Cochin-Sinense Latinum ad usum missionum | Morrone, Joseph Maria, Rev | Ngôn ngữ | [c495.11d937.2lexicon](https://archive.org/details/c495.11d937.2lexicon) | Phạm vi công cộng |
| 52 | Các phương pháp phân tích công cụ trong Hoá học hiện đại | Hồ Viết Quý | Giáo trình | [cac-phuong-phap-phan-tich-cong-cu-trong-hoa-hoc-hien-dai-ho-viet-quy](https://archive.org/details/cac-phuong-phap-phan-tich-cong-cu-trong-hoa-hoc-hien-dai-ho-viet-quy) | CC BY-NC-ND 4.0 |
| 53 | Câu chuyện khoa học | Nguyễn Văn Tuấn | Khoa học | [cau-chuyen-khoa-hoc-nguyen-van-tuan](https://archive.org/details/cau-chuyen-khoa-hoc-nguyen-van-tuan) | CC BY-NC-ND 4.0 |
| 54 | Cấu Tạo Chất đại cương | Lâm Ngọc Thiềm | Giáo trình | [cau-tao-chat](https://archive.org/details/cau-tao-chat) | CC BY-NC-ND 4.0 |
| 55 | Cây xanh rì rào | A-lếch-xây Mu-xa-tốp | Thiếu nhi & cổ tích | [cay-xanh-ri-rao-a-lech-xay-mu-xa-top](https://archive.org/details/cay-xanh-ri-rao-a-lech-xay-mu-xa-top) | CC BY-NC-ND 4.0 |
| 56 | Chính trị bình dân (bản mới 2018) | Phạm Đoan Trang | Chính trị – Lịch sử | [chinh-tri-binh-dan-ban-moi-2018-pham-doan-trang](https://archive.org/details/chinh-tri-binh-dan-ban-moi-2018-pham-doan-trang) | CC BY-NC-ND 4.0 |
| 57 | Tìm Về Cội Nguồn Chữ Hán | Lý Lạc Nghị, Jim Waters (biên soạn), Nguyễn Văn Đổng (người dịch) | Ngôn ngữ | [chu-han](https://archive.org/details/chu-han) | CC BY-NC-ND 4.0 |
| 58 | Chữ Hán Trung Quốc | Hàn Giám Đường (Đặng Thúy Thúy dịch) | Ngôn ngữ | [chu-han-trung-quoc-han-giam-duong](https://archive.org/details/chu-han-trung-quoc-han-giam-duong) | CC BY-NC-ND 4.0 |
| 59 | Chủ nghĩa đế quốc, giai đoạn tột cùng của chủ nghĩa tư bản | Vladimir Ilyich Lenin | Chính trị – Lịch sử | [chu-nghia-de-quoc-giai-doan-tot-cung-cua-chu-nghia-tu-ban](https://archive.org/details/chu-nghia-de-quoc-giai-doan-tot-cung-cua-chu-nghia-tu-ban) | Phạm vi công cộng |
| 60 | Cơ cấu Việt ngữ – Quyển 1 | Trần Ngọc Ninh | Ngôn ngữ | [co-cau-viet-ngu-quyen-1-tran-ngoc-ninh](https://archive.org/details/co-cau-viet-ngu-quyen-1-tran-ngoc-ninh) | Chưa ghi |
| 61 | Cơ cấu Việt ngữ – Quyển 2 | Trần Ngọc Ninh | Ngôn ngữ | [co-cau-viet-ngu-quyen-2-tran-ngoc-ninh](https://archive.org/details/co-cau-viet-ngu-quyen-2-tran-ngoc-ninh) | Chưa ghi |
| 62 | Cơ Học Vật Rắn | Jean Marie Brebec | Giáo trình | [co-hoc-vat-ran-jean-marie-brebec](https://archive.org/details/co-hoc-vat-ran-jean-marie-brebec) | CC BY-NC-ND 4.0 |
| 63 | Cơ Sở Của Hình Học | Euclid | Khoa học | [co-so-cua-hinh-hoc-1](https://archive.org/details/co-so-cua-hinh-hoc-1) | CC BY-NC-ND 4.0 |
| 64 | Cổ tích Việt Nam bằng thơ | — | Thiếu nhi & cổ tích | [co-tich-viet-nam-bang-tho](https://archive.org/details/co-tich-viet-nam-bang-tho) | CC BY-NC-ND 4.0 |
| 65 | Cơ Sở Lí Thuyết Các Quá Trình Hóa Học | Vũ Đăng Độ | Giáo trình | [co_so_ly_thuyet_6699](https://archive.org/details/co_so_ly_thuyet_6699) | CC BY-NC-ND 4.0 |
| 66 | Con Rồng Việt Nam | Nguyễn Phúc Vĩnh Thụy (Bảo Đại) | Chính trị – Lịch sử | [con-rong-viet-nam-bao-dai-full](https://archive.org/details/con-rong-viet-nam-bao-dai-full) | CC BY-NC-ND 4.0 |
| 67 | Công Nghệ Sản Xuất Gốm Sứ | Nguyễn Văn Dũng | Giáo trình | [cong-nghe-san-xuat-gom-su-nguyen-van-dung](https://archive.org/details/cong-nghe-san-xuat-gom-su-nguyen-van-dung) | CC BY-NC-ND 4.0 |
| 68 | Cuộc đời của Lê-nin – Phần 1 | Ma-ri-a A. Pri-lê-gia-ê-va | Chính trị – Lịch sử | [cuoc-doi-cua-lenin-ma-ria-a-pri-le-gia-e-va-phan-1](https://archive.org/details/cuoc-doi-cua-lenin-ma-ria-a-pri-le-gia-e-va-phan-1) | Chưa ghi |
| 69 | Cuộc đời của Lê-nin – Phần 2 | Ma-ri-a A. Pri-lê-gia-ê-va | Chính trị – Lịch sử | [cuoc-doi-cua-lenin-ma-ria-a-pri-le-gia-e-va-phan-1](https://archive.org/details/cuoc-doi-cua-lenin-ma-ria-a-pri-le-gia-e-va-phan-1) | Chưa ghi |
| 70 | Cuộc phiêu lưu của quả lê khổng lồ | Jakob Martin Strid | Thiếu nhi & cổ tích | [cuoc-phieu-luu-cua-qua-le-khong-lo](https://archive.org/details/cuoc-phieu-luu-cua-qua-le-khong-lo) | Chưa ghi |
| 71 | Vũ Trụ | Carl Sagan, Nguyễn Việt Long (người dịch) | Khoa học | [d99958ab-0601-4ee3-ba49-b597c2d80916](https://archive.org/details/d99958ab-0601-4ee3-ba49-b597c2d80916) | CC BY-NC-ND 4.0 |
| 72 | Dắt dìu về thuở ấu thơ | Nguyễn Chấn Hùng | Văn học VN | [dat-diu-ve-thuo-au-tho-nguyen-chan-hung](https://archive.org/details/dat-diu-ve-thuo-au-tho-nguyen-chan-hung) | CC BY-NC-ND 4.0 |
| 73 | Dấu ấn khơi dòng văn hóa Việt | Lê Minh Quốc | Văn hóa – Nghệ thuật | [dau-an-khoi-dong-van-hoa-viet-le-minh-quoc](https://archive.org/details/dau-an-khoi-dong-van-hoa-viet-le-minh-quoc) | CC BY-NC-ND 4.0 |
| 74 | Đầu xanh tuổi trẻ | Fyodor Dostoevsky | Văn học nước ngoài | [dau-xanh-tuoi-tre-dostoievski](https://archive.org/details/dau-xanh-tuoi-tre-dostoievski) | CC BY-NC-ND 4.0 |
| 75 | Địa Lý Trung Quốc | Trịnh Bình, ThS. Nguyễn Thị Thu Hằng (người dịch) | Văn hóa – Nghệ thuật | [dia-ly-trung-quoc-trinh-binh](https://archive.org/details/dia-ly-trung-quoc-trinh-binh) | CC BY-NC-ND 4.0 |
| 76 | Đồ đồng Trung Quốc | Lý Tùng | Văn hóa – Nghệ thuật | [do-dong-trung-quoc-ly-hung](https://archive.org/details/do-dong-trung-quoc-ly-hung) | CC BY-NC-ND 4.0 |
| 77 | Đồ nội thất Trung Quốc | Trương Hiểu Minh | Văn hóa – Nghệ thuật | [do-noi-that-trung-quoc-truong-hieu-minh](https://archive.org/details/do-noi-that-trung-quoc-truong-hieu-minh) | CC BY-NC-ND 4.0 |
| 78 | Đọc sách như một nghệ thuật | Mortimer J.Adler, Hải Nhi (người dịch) | Kỹ năng | [doc-sach-nhu-mot-nghe-thuat-martimer-jadler](https://archive.org/details/doc-sach-nhu-mot-nghe-thuat-martimer-jadler) | CC BY-NC-ND 4.0 |
| 79 | Bản án chế độ thực dân Pháp | Nguyễn Ái Quốc | Chính trị – Lịch sử | [ebook_ban_an_che_do_thuc_dan_phap_3394](https://archive.org/details/ebook_ban_an_che_do_thuc_dan_phap_3394) | CC BY-NC-ND 4.0 |
| 80 | Phương pháp luận nghiên cứu khoa học | Vũ Cao Đàm | Giáo trình | [file_goc_778257](https://archive.org/details/file_goc_778257) | CC BY-NC-ND 4.0 |
| 81 | Cuộc cách mạng ngược trong khoa học – Phần 1 | Friedrich A. Hayek | Khoa học | [friedrich_august_hayek_new_pdf_p1_9042](https://archive.org/details/friedrich_august_hayek_new_pdf_p1_9042) | CC BY-NC-ND 4.0 |
| 82 | Cuộc cách mạng ngược trong khoa học – Phần 2 | Friedrich A. Hayek | Khoa học | [friedrich_august_hayek_new_pdf_p1_9042](https://archive.org/details/friedrich_august_hayek_new_pdf_p1_9042) | CC BY-NC-ND 4.0 |
| 83 | Thiện ác đấu tranh | — | Khác | [gc-viet-template-merged](https://archive.org/details/gc-viet-template-merged) | Chưa ghi |
| 84 | Giamilia – Truyện núi đồi và thảo nguyên | Chingiz Aitmatov | Văn học nước ngoài | [giamilia-truyen-nui-doi-va-th-tsinghiz-aitomatop](https://archive.org/details/giamilia-truyen-nui-doi-va-th-tsinghiz-aitomatop) | CC BY-NC-ND 4.0 |
| 85 | Giáo Trình Hóa Học Môi Trường | PGS.TS. Đặng Đình Bạch, TS. Nguyễn Văn Hải | Giáo trình | [giao-trinh-hoa-hoc-moi-truong-dang-dinh-bach](https://archive.org/details/giao-trinh-hoa-hoc-moi-truong-dang-dinh-bach) | CC BY-NC-ND 4.0 |
| 86 | Giáo trình Hóa học hữu cơ | Phan Thanh Sơn Nam | Giáo trình | [giao-trinh-hoa-huu-co-phan-thanh-son-nam_compress](https://archive.org/details/giao-trinh-hoa-huu-co-phan-thanh-son-nam_compress) | CC BY-NC-ND 4.0 |
| 87 | Giáo Trình Triết Học Mác Lênin | — | Giáo trình | [giao-trinh-triet-hoc-mac-lenin](https://archive.org/details/giao-trinh-triet-hoc-mac-lenin) | CC BY-NC-ND 4.0 |
| 88 | Giáo trình Xác suất thống kê | Lê Văn Dũng (ĐH Sư phạm Đà Nẵng) | Giáo trình | [giao-trinh-xac-suat-thong-ke-le-van-dung-dhsp-dn](https://archive.org/details/giao-trinh-xac-suat-thong-ke-le-van-dung-dhsp-dn) | Chưa ghi |
| 89 | Giáo trình Tư tưởng Hồ Chí Minh | Hội đồng Trung ương chỉ đạo biên soạn giáo trình quốc gia | Giáo trình | [gtr.tutuonghcm](https://archive.org/details/gtr.tutuonghcm) | Chưa ghi |
| 90 | Hán Việt từ điển (bản đầy đủ, đẹp) | Đào Duy Anh | Ngôn ngữ | [hanviettudien-daoduyanh-bandep](https://archive.org/details/hanviettudien-daoduyanh-bandep) | CC BY-NC-ND 4.0 |
| 91 | How Philosophy Works - Hiểu Hết Về Triết Học | Marcus Weeks | Triết học – Tâm lý | [hieu-het-ve-triet-hoc](https://archive.org/details/hieu-het-ve-triet-hoc) | CC BY-NC-ND 4.0 |
| 92 | Họ đã nghĩ như thế | Nhiều tác giả (đệ tử phương Tây của Đức Phật) | Tôn giáo | [ho-da-nghi-nhu-the](https://archive.org/details/ho-da-nghi-nhu-the) | Chưa ghi |
| 93 | Hóa học đại cương 1 – Cấu tạo chất | Trần Thành Huế | Giáo trình | [hoa-hoc-dai-cuong-1-cau-tao-chat-tran-thanh-hue](https://archive.org/details/hoa-hoc-dai-cuong-1-cau-tao-chat-tran-thanh-hue) | CC BY-NC-ND 4.0 |
| 94 | Tạp chí Học tập – số 9 năm 1958 | Đảng Lao động Việt Nam | Tạp chí | [hoctap-9.1958](https://archive.org/details/hoctap-9.1958) | CC BY-NC 4.0 |
| 95 | Hỗn độn và hài hòa | Trịnh Xuân Thuận | Khoa học | [hon-don-va-hai-hoa-trinh-xuan-thuan](https://archive.org/details/hon-don-va-hai-hoa-trinh-xuan-thuan) | CC BY-NC-ND 4.0 |
| 96 | Kỹ Thuật An Toàn Trong phòng Thí Nghiệm Hoá Học | Trần Kim Tiến | Giáo trình | [ky_thuat_an_toan_trong_phong_thi_nghiem_hoa_hoc_ts_tran_kim_tien_2_806](https://archive.org/details/ky_thuat_an_toan_trong_phong_thi_nghiem_hoa_hoc_ts_tran_kim_tien_2_806) | CC BY-NC-ND 4.0 |
| 97 | Ông già Khốt-ta-bít | Lagin Lazar (Nguyễn Trường Tân dịch) | Thiếu nhi & cổ tích | [lagin-lazar-ong-gia-khottabut-nguyen-truong-tan-dich](https://archive.org/details/lagin-lazar-ong-gia-khottabut-nguyen-truong-tan-dich) | CC BY-NC-ND 4.0 |
| 98 | Lãng Du Trong Văn Hóa Việt Nam | Hữu Ngọc | Văn hóa – Nghệ thuật | [lang-du-trong-van-hoa-viet-nam](https://archive.org/details/lang-du-trong-van-hoa-viet-nam) | CC BY-NC-ND 4.0 |
| 99 | Lịch Sử Báo Chí Việt Nam 1865-1945 | Đỗ Quang Hưng - Nguyễn Thành - Dương Trung Quốc | Chính trị – Lịch sử | [lich-su-bao-chi-viet-nam-18651945-do-quang-hung-nguyen-thanh-duong-trung-quoc](https://archive.org/details/lich-su-bao-chi-viet-nam-18651945-do-quang-hung-nguyen-thanh-duong-trung-quoc) | CC BY-NC-ND 4.0 |
| 100 | Lịch Sử Trung Cận Đông | Nguyễn Thị Thư - Nguyễn Hồng Bích - Nguyễn Văn Sơn | Chính trị – Lịch sử | [lich-su-trung-can-dong-nguyen-thi-thu-nguyen-hong-bich-nguyen-van-son](https://archive.org/details/lich-su-trung-can-dong-nguyen-thi-thu-nguyen-hong-bich-nguyen-van-son) | CC BY-NC-ND 4.0 |
| 101 | Lịch Sử Văn Hóa Thế Giới Cổ Trung Đại | Lương Ninh | Chính trị – Lịch sử | [lich-su-van-hoa-the-gioi-luong-ninh](https://archive.org/details/lich-su-van-hoa-the-gioi-luong-ninh) | CC BY-NC-ND 4.0 |
| 102 | Lịch Sử Vật Lí Học | Đào Văn Phúc | Khoa học | [lich-su-vat-ly-hoc-dao-van-phuc](https://archive.org/details/lich-su-vat-ly-hoc-dao-van-phuc) | CC BY-NC-ND 4.0 |
| 103 | Lịch Sử Vương Quốc Thái Lan | Lê Văn Quang | Chính trị – Lịch sử | [lich-su-vuong-quoc-thai-lan-le-van-quang](https://archive.org/details/lich-su-vuong-quoc-thai-lan-le-van-quang) | CC BY-NC-ND 4.0 |
| 104 | Luyện Văn | Nguyễn Hiến Lê | Ngôn ngữ | [luyen-van-1-nguyen-hien-le](https://archive.org/details/luyen-van-1-nguyen-hien-le) | CC BY-NC-ND 4.0 |
| 105 | Matter ( DK Eyewitness Books) | Christopher Cooper | Khoa học | [matter-dk-eyewitness-books-by-christopher-cooper-z-lib.org](https://archive.org/details/matter-dk-eyewitness-books-by-christopher-cooper-z-lib.org) | CC BY-NC-ND 4.0 |
| 106 | Nghệ thuật viết luận văn | Michel Beaud | Kỹ năng | [nghe-thuat-viet-luan-van-michel-beaud](https://archive.org/details/nghe-thuat-viet-luan-van-michel-beaud) | CC BY-NC-ND 4.0 |
| 107 | Ngụ ngôn Aesop – Những câu chuyện bị lãng quên | Fiona Waters, Fulvio Testa | Thiếu nhi & cổ tích | [ngu-ngon-aesop-nhung-cau-chuyen-bi-lang-quen-fiona-waters-fulvio-testa_202506](https://archive.org/details/ngu-ngon-aesop-nhung-cau-chuyen-bi-lang-quen-fiona-waters-fulvio-testa_202506) | CC BY-NC-ND 4.0 |
| 108 | Người Việt - Phẩm Chất - Thói Hư Và Tật Xấu | Nhiều tác giả | Văn hóa – Nghệ thuật | [nguoi-viet-pham-chat-va-thoi-hu-tat-xau](https://archive.org/details/nguoi-viet-pham-chat-va-thoi-hu-tat-xau) | CC BY-NC-ND 4.0 |
| 109 | Nhà Thờ Công Giáo Ở Việt Nam Kiến Trúc - Lịch Sử | Nguyễn Nghị - Nguyễn Quốc Thái - Khổng Thành Ngọc - Hoàng Minh Thức | Văn hóa – Nghệ thuật | [nha-tho-cong-giao-oviet-nam-kien-truc-lich-su](https://archive.org/details/nha-tho-cong-giao-oviet-nam-kien-truc-lich-su) | CC BY-NC-ND 4.0 |
| 110 | Nhật ký Đặng Thùy Trâm | Đặng Thùy Trâm | Văn học VN | [nhat-ky_202203](https://archive.org/details/nhat-ky_202203) | CC BY-NC-ND 4.0 |
| 111 | Những cây thuốc và vị thuốc Việt Nam | Đỗ Tất Lợi | Khoa học | [nhung-cay-thuoc-va-vi-thuoc-vie-do-tat-loi](https://archive.org/details/nhung-cay-thuoc-va-vi-thuoc-vie-do-tat-loi) | CC BY-NC-ND 4.0 |
| 112 | Những người bạn từ trang sách | Roberto Piumini (Trần Ngọc Mai Thảo dịch) | Thiếu nhi & cổ tích | [nhung-nguoi-ban-tu-trang-sach-roberto-piumini](https://archive.org/details/nhung-nguoi-ban-tu-trang-sach-roberto-piumini) | Chưa ghi |
| 113 | Những người cùng thời | Nhiều tác giả | Văn học VN | [nhung-nguoi-cung-thoi](https://archive.org/details/nhung-nguoi-cung-thoi) | CC BY-NC-ND 4.0 |
| 114 | Những người sinh viên | Yuri Trifonov | Văn học nước ngoài | [nhung-nguoi-sinh-vien-iu-ri-tri-pho-nop](https://archive.org/details/nhung-nguoi-sinh-vien-iu-ri-tri-pho-nop) | CC BY-NC-ND 4.0 |
| 115 | Phần Lan – Ngôi sao phương bắc | Võ Xuân Quế | Chính trị – Lịch sử | [phan-lan-ngoi-sao-phuong-bac-vo-xuan-que](https://archive.org/details/phan-lan-ngoi-sao-phuong-bac-vo-xuan-que) | CC BY-NC-ND 4.0 |
| 116 | Phân Tích Định Lượng | Nguyễn Thị Thu Vân | Giáo trình | [phan-tich-dinh-luong-nguyen-thi-thu-van](https://archive.org/details/phan-tich-dinh-luong-nguyen-thi-thu-van) | CC BY-NC-ND 4.0 |
| 117 | Phân tích dữ liệu với R | Nguyễn Văn Tuấn | Giáo trình | [phan-tich-du-lieu-voi-r-nguyen-van-tuan](https://archive.org/details/phan-tich-du-lieu-voi-r-nguyen-van-tuan) | CC BY-NC-ND 4.0 |
| 118 | Phân tích tác phẩm văn học dân gian | Bùi Mạnh Nhị | Giáo trình | [phantichtacphamvanhocdangian_bmn](https://archive.org/details/phantichtacphamvanhocdangian_bmn) | Chưa ghi |
| 119 | Phê phán lý tính thuần túy | Immanuel Kant (Bùi Văn Nam Sơn dịch) | Triết học – Tâm lý | [phe-phan-ly-tinh-thuan-tuy-immanuel-kant](https://archive.org/details/phe-phan-ly-tinh-thuan-tuy-immanuel-kant) | CC BY-NC-ND 4.0 |
| 120 | 1984 | George Orwell | Văn học nước ngoài | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 121 | AQ chính truyện | Lỗ Tấn | Văn học nước ngoài | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 122 | Chúa ruồi | William Golding | Văn học nước ngoài | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 123 | Liêu Trai chí dị | Bồ Tùng Linh | Văn học nước ngoài | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 124 | Ngự lâm pháo thủ (toàn tập) | Alexandre Dumas | Văn học nước ngoài | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 125 | Truyện cổ Andersen | Hans Christian Andersen | Thiếu nhi & cổ tích | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 126 | Truyện cổ Grimm | Anh em nhà Grimm | Thiếu nhi & cổ tích | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 127 | Truyện ngụ ngôn Aesop | Aesop | Thiếu nhi & cổ tích | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 128 | Trại súc vật | George Orwell | Văn học nước ngoài | [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Phạm vi công cộng |
| 129 | Phương Pháp Nghiên Cứu Khoa Học Sức Khỏe | Phạm Văn Lình | Giáo trình | [phuong-phap-nghien-cuu-khoa-hoc-suc-khoe-pham-van-linh](https://archive.org/details/phuong-phap-nghien-cuu-khoa-hoc-suc-khoe-pham-van-linh) | CC BY-NC-ND 4.0 |
| 130 | Từ điển hình ảnh Anh - Việt | — | Ngôn ngữ | [picture-oxford-dictionary-english-vietnam](https://archive.org/details/picture-oxford-dictionary-english-vietnam) | CC BY-NC-ND 4.0 |
| 131 | Quá trình và thiết bị CNHH&TP. Tập 3: Truyền khối | Võ Văn Bang, Vũ Bá Minh | Giáo trình | [qua_trinh_va_thiet_bi_cong_nghe_hoa_hoc_va_thuc_pham_tap_3_truyen_khoi_1_3496](https://archive.org/details/qua_trinh_va_thiet_bi_cong_nghe_hoa_hoc_va_thuc_pham_tap_3_truyen_khoi_1_3496) | CC BY-NC-ND 4.0 |
| 132 | Quãng đời sau lưng | Trần Đức Phổ | Văn học VN | [quang-doi-sau-lung](https://archive.org/details/quang-doi-sau-lung) | CC BY-NC-ND 4.0 |
| 133 | Quang Học Sóng | Jean Marie Brebec | Giáo trình | [quang-hoc-song-jean-marie-brebec](https://archive.org/details/quang-hoc-song-jean-marie-brebec) | CC BY-NC-ND 4.0 |
| 134 | Cơ Sở Lý Thuyết Các Phản Ứng Hóa Học | Trần Thị Đà, Đặng Trần Phách | Giáo trình | [sa-ch-scan-co-so-ly-thuyet-cac-phan-ung-hoa-hoc-tran-thi-da-da-mo-khoa](https://archive.org/details/sa-ch-scan-co-so-ly-thuyet-cac-phan-ung-hoa-hoc-tran-thi-da-da-mo-khoa) | CC BY-NC-ND 4.0 |
| 135 | Kỹ Thuật Sản Xuất Vật Liệu Gốm Sứ | Đỗ Quang Minh | Giáo trình | [sa-ch-scan-ky-thuat-san-xuat-vat-lieu-gom-su-do-quang-minh-unlocked](https://archive.org/details/sa-ch-scan-ky-thuat-san-xuat-vat-lieu-gom-su-do-quang-minh-unlocked) | CC BY-NC-ND 4.0 |
| 136 | Phương Pháp Cô Lập Hợp Chất Hữu Cơ | Nguyễn Kim Phi Phụng | Giáo trình | [sa-ch-scan-phuong-phap-co-lap-hop-chat-huu-co-nguyen-kim-phi-phung-da-mo-khoa](https://archive.org/details/sa-ch-scan-phuong-phap-co-lap-hop-chat-huu-co-nguyen-kim-phi-phung-da-mo-khoa) | CC BY-NC-ND 4.0 |
| 137 | Sài Gòn - Chuyện Đời Của Phố | Phạm Công Luận | Chính trị – Lịch sử | [sai-gon-chuyen-doi-cua-pho-pham-cong-luan](https://archive.org/details/sai-gon-chuyen-doi-cua-pho-pham-cong-luan) | CC BY-NC-ND 4.0 |
| 138 | Số phận một con người (tập truyện) | Mikhail Sholokhov | Văn học nước ngoài | [so-phan-mot-con-nguoi-mikhail-sholokhov](https://archive.org/details/so-phan-mot-con-nguoi-mikhail-sholokhov) | CC BY-NC-ND 4.0 |
| 139 | Sơn lâm êm đềm | Lev Tolstoy | Văn học nước ngoài | [son-lam-em-dem-leon-tolstoi](https://archive.org/details/son-lam-em-dem-leon-tolstoi) | CC BY-NC-ND 4.0 |
| 140 | Sóng | Jean Marie Brebec | Giáo trình | [song-jean-marie-brebec](https://archive.org/details/song-jean-marie-brebec) | CC BY-NC-ND 4.0 |
| 141 | Đắc nhân tâm | Dale Carnegie | Kỹ năng | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 142 | Giai thoại và sấm kí Trạng Trình | Phạm Đan Quế | Văn học VN | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 143 | Mặt trận miền Tây vẫn yên tĩnh | Erich Maria Remarque | Văn học nước ngoài | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 144 | Tarzan of the Apes | Edgar Rice Burroughs | Văn học nước ngoài | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 145 | Thanh kiếm và lá chắn – Tập 1 | Vađim Kôgiepnhicốp | Văn học nước ngoài | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 146 | Thanh kiếm và lá chắn – Tập 2 | Vađim Kôgiepnhicốp | Văn học nước ngoài | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 147 | Thanh kiếm và lá chắn – Tập 3 | Vađim Kôgiepnhicốp | Văn học nước ngoài | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 148 | Thanh kiếm và lá chắn – Tập 4 | Vađim Kôgiepnhicốp | Văn học nước ngoài | Internet Archive, tải thủ công (không có mã mục) | Chưa ghi |
| 149 | 60 bài luận tiếng Anh thông dụng | Trần Văn Hải | Ngôn ngữ | [taisachmoi.com-60-bai-luan-tieng-anh-thong-dung](https://archive.org/details/taisachmoi.com-60-bai-luan-tieng-anh-thong-dung) | Chưa ghi |
| 150 | Tâm lý gia đình | Nguyễn Khắc Viện | Triết học – Tâm lý | [tam-ly-gia-dinh-nguyen-khac-vien](https://archive.org/details/tam-ly-gia-dinh-nguyen-khac-vien) | CC BY-NC-ND 4.0 |
| 151 | Thần Khúc | Dante Alighieri, Nguyễn Văn Hoàn (người dịch) | Văn học nước ngoài | [than-khuc](https://archive.org/details/than-khuc) | CC BY-NC-ND 4.0 |
| 152 | Thực Vật Dược | Trương Thị Đẹp | Giáo trình | [thuc-vat-duoc-truong-thi-dep](https://archive.org/details/thuc-vat-duoc-truong-thi-dep) | CC BY-NC-ND 4.0 |
| 153 | Tới hệ mặt trời xa lạ | Lê Toán | Khoa học | [toi-he-mat-troi-xa-la-le-toan](https://archive.org/details/toi-he-mat-troi-xa-la-le-toan) | CC BY-NC-ND 4.0 |
| 154 | Kiến và chim bồ câu | Lev Tolstoy | Thiếu nhi & cổ tích | [tolstoy-lev-kien-va-chim-bo-cau](https://archive.org/details/tolstoy-lev-kien-va-chim-bo-cau) | CC BY-NC-ND 4.0 |
| 155 | Tổng tập văn học Việt Nam – Tập 19 | Trung tâm Khoa học Xã hội và Nhân văn Quốc gia | Văn học VN | [tong-tap-van-hoc-viet-nam-19-ntg-2000](https://archive.org/details/tong-tap-van-hoc-viet-nam-19-ntg-2000) | CC BY-NC-ND 4.0 |
| 156 | Tổng tập văn học Việt Nam – Tập 20 | Trung tâm Khoa học Xã hội và Nhân văn Quốc gia | Văn học VN | [tong-tap-van-hoc-viet-nam-20-ntg-2000](https://archive.org/details/tong-tap-van-hoc-viet-nam-20-ntg-2000) | CC BY-NC-ND 4.0 |
| 157 | Tổng tập văn học Việt Nam – Tập 28 | Trung tâm Khoa học Xã hội và Nhân văn Quốc gia | Văn học VN | [tong-tap-van-hoc-viet-nam-28-ntg-2000](https://archive.org/details/tong-tap-van-hoc-viet-nam-28-ntg-2000) | CC BY-NC-ND 4.0 |
| 158 | Truyện Kể Về 109 Nguyên Tố Hóa Học | Trần Ngọc Mai | Khoa học | [truyen-ke-ve-109-nguyen-to-hoa-hoc](https://archive.org/details/truyen-ke-ve-109-nguyen-to-hoa-hoc) | CC BY-NC-ND 4.0 |
| 159 | Truyện Tây Bắc | Tô Hoài | Văn học VN | [truyen-tay-bac](https://archive.org/details/truyen-tay-bac) | CC BY-NC-ND 4.0 |
| 160 | Truyền Thuyết Thần Thoại Trung Quốc | Trần Liên Sơn, Ngô Thị Soa (người dịch) | Văn hóa – Nghệ thuật | [truyen-thuyet-than-thoai-trung-quoc-tran-lien-son](https://archive.org/details/truyen-thuyet-than-thoai-trung-quoc-tran-lien-son) | CC BY-NC-ND 4.0 |
| 161 | Tư bản (Quyển I) | Karl Marx | Chính trị – Lịch sử | [tu-ban-quyen-1](https://archive.org/details/tu-ban-quyen-1) | Phạm vi công cộng |
| 162 | Từ điển hư từ Hán ngữ cổ đại và hiện đại | Trần Văn Chánh | Ngôn ngữ | [tu-dien-hu-tu-han-ngu-co-dai-va-hien-dai-tran-van-chanh](https://archive.org/details/tu-dien-hu-tu-han-ngu-co-dai-va-hien-dai-tran-van-chanh) | CC BY-NC-ND 4.0 |
| 163 | Từ Điển Pháp - Việt | Viện Ngôn Ngữ Học | Ngôn ngữ | [tu-dien-phap-viet-vien-ngon-ngu-hoc](https://archive.org/details/tu-dien-phap-viet-vien-ngon-ngu-hoc) | CC BY-NC-ND 4.0 |
| 164 | Từ điển Việt - Hoa | Lâm Hòa Chiếm, Xuân Huy | Ngôn ngữ | [tu-dien-tieng-hoa-lam-hoa-chiem](https://archive.org/details/tu-dien-tieng-hoa-lam-hoa-chiem) | CC BY-NC-ND 4.0 |
| 165 | Từ điển tiếng Việt (Từ điển Hoàng Phê) | Hoàng Phê (chủ biên) | Ngôn ngữ | [tu-dien-tieng-viet-vien-ngon-ngu-hoc](https://archive.org/details/tu-dien-tieng-viet-vien-ngon-ngu-hoc) | CC BY-NC-ND 4.0 |
| 166 | Từ Điển Trái Nghĩa Đồng Nghĩa Tiếng Việt | Dương Kỳ Đức, Vu Quang Hao | Ngôn ngữ | [tu-dien-trai-nghia-dong-nghia-tieng-viet-duong-ky-duc-vu-quang-hao](https://archive.org/details/tu-dien-trai-nghia-dong-nghia-tieng-viet-duong-ky-duc-vu-quang-hao) | CC BY-NC-ND 4.0 |
| 167 | Từ Điển Truyện Kiều | Đào Duy Anh | Ngôn ngữ | [tu-dien-truyen-kieu-dao-duy-anh](https://archive.org/details/tu-dien-truyen-kieu-dao-duy-anh) | CC BY-NC-ND 4.0 |
| 168 | Tự Học Một Nhu Cầu Của Thời Đại | Nguyễn Hiến Lê | Kỹ năng | [tu-hoc-mot-nhu-cau-thoi-dai-nguyen-hien-le](https://archive.org/details/tu-hoc-mot-nhu-cau-thoi-dai-nguyen-hien-le) | CC BY-NC-ND 4.0 |
| 169 | Tự học tốc ký | Nguyễn Hạnh | Kỹ năng | [tu-hoc-toc-ky-nguyen-hanh](https://archive.org/details/tu-hoc-toc-ky-nguyen-hanh) | CC BY-NC-ND 4.0 |
| 170 | Sổ tay chuyên ngành cơ điện tử | — | Giáo trình | [tu-sa-ch-nha-t-nghe-tinh-chuye-n-nga-nh-co-d-ie-n-tu](https://archive.org/details/tu-sa-ch-nha-t-nghe-tinh-chuye-n-nga-nh-co-d-ie-n-tu) | CC BY-NC-ND 4.0 |
| 171 | Tục ngữ, ca dao Việt Nam - Tuyển chọn | ThS. Bùi Văn Vượng, Huy Linh (Sưu tầm, tuyển chọn) | Văn học VN | [tuc-ngu-ca-dao-viet-nam-tuyen-chon-bui-van-vuong](https://archive.org/details/tuc-ngu-ca-dao-viet-nam-tuyen-chon-bui-van-vuong) | CC BY-NC-ND 4.0 |
| 172 | Tuyển Tập Thành Ngữ Tục Ngữ Ca Dao Việt - Anh Thông Dụng | Nguyễn Đình Hùng | Ngôn ngữ | [tuyen-tap-thanh-ngu-tuc-ngu-ca-dao-viet-anh](https://archive.org/details/tuyen-tap-thanh-ngu-tuc-ngu-ca-dao-viet-anh) | CC BY-NC-ND 4.0 |
| 173 | Tuyển tập truyện ngắn Nguyễn Công Hoan | Nguyễn Công Hoan | Văn học VN | [tuyen-tap-truyen-ngan-nguyen-cong-hoan](https://archive.org/details/tuyen-tap-truyen-ngan-nguyen-cong-hoan) | Chưa ghi |
| 174 | Văn Hóa Tôn Giáo Tín Ngưỡng Việt Nam | Đỗ Trinh Huệ | Văn hóa – Nghệ thuật | [van-hoa-ton-giao-tin-nguong-viet-nam](https://archive.org/details/van-hoa-ton-giao-tin-nguong-viet-nam) | CC BY-NC-ND 4.0 |
| 175 | Văn học phương Tây | — | Văn học nước ngoài | [van-hoc-phuong-tay](https://archive.org/details/van-hoc-phuong-tay) | CC BY-NC-ND 4.0 |
| 176 | Văn minh vật chất của người Việt | Phan Cẩm Thượng | Văn hóa – Nghệ thuật | [van-minh-vat-chat-cua-nguoi-viet-phan-cam-thuong](https://archive.org/details/van-minh-vat-chat-cua-nguoi-viet-phan-cam-thuong) | CC BY-NC-ND 4.0 |
| 177 | Văn học và Tuổi trẻ – số 01/2023 | Viện Nghiên cứu Sách và Học liệu giáo dục | Tạp chí | [vhtt-so-01-2023](https://archive.org/details/vhtt-so-01-2023) | CC BY-NC-ND 4.0 |
| 178 | Việt Nam thời Pháp đô hộ | Nguyễn Thế Anh | Chính trị – Lịch sử | [vietnam-thoi-phap-do-ho-nguyen-the-anh-1970](https://archive.org/details/vietnam-thoi-phap-do-ho-nguyen-the-anh-1970) | CC BY-NC-ND 4.0 |
| 179 | Vương Dương Minh | Trần Trọng Kim | Triết học – Tâm lý | [vuong-duong-minh](https://archive.org/details/vuong-duong-minh) | CC BY-NC-ND 4.0 |
