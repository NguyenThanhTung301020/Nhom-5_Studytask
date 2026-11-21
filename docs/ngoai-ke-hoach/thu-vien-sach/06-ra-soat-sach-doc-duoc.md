# 06. Rà soát lần 3: chỉ giữ sách tiếng Việt đọc được (21/11/2026)
> **NGOÀI KẾ HOẠCH CỦA NHÓM – KHÔNG THUỘC TUẦN NÀO.** Phần việc do Trương Thanh Vui làm riêng ngày 21/11/2026, sau khi nhóm đã hoàn tất báo cáo tuần. Không thuộc kế hoạch tuần 5, 6, 7, không tính vào khối lượng của nhóm và **không cần đưa vào báo cáo tuần** (việc phụ, mức độ quan trọng thấp). Tài liệu chỉ để lưu vết.

Người thực hiện: Trương Thanh Vui (cùng Claude Code, model Claude Opus 5.5). Thay cho số liệu ở 04 (giữ 04 làm lịch sử đợt 2).

## 1. Lý do

Sau đợt 2 (255 sách), Thanh Vui phản hồi: nhiều sách quá cũ nên hiển thị **chữ Hán, chữ Nôm** thay vì tiếng Việt chữ quốc ngữ; nhiều sách là **bản quét** nên chữ bị mất, in lệch, không đọc được. Yêu cầu: thư viện chỉ gồm sách tiếng Việt đọc được, vẫn giữ trên 250 đầu sách và bảo đảm bản quyền.

## 2. Cách kiểm tra

1. Với mỗi sách lấy từ Archive.org: tải văn bản nhận dạng chữ (OCR, tệp `_djvu.txt`) và đo **tỉ lệ âm tiết quốc ngữ hợp lệ**. Sách Hán/Nôm và bản quét mờ có tỉ lệ thấp (0,3–0,6); bản quốc ngữ rõ đạt trên 0,8. Sách ở ngưỡng giữa được mở xem trực tiếp vài trang.
2. Giữ lại sách quốc ngữ in rõ (tỉ lệ ≥ 0,8, trên 3.000 từ) và đã xem tận mắt; còn lại gỡ.
3. Bù số lượng bằng **sách dựng lại từ Wikisource tiếng Việt** (vi.wikisource.org): văn bản quốc ngữ đã được số hóa, in lại thành PDF khổ A5 chữ rõ ràng (công cụ `scripts/build_wikisource_books.py`). Chỉ chọn:
   - tác phẩm của tác giả **và** dịch giả mất trước 1976 (hết thời hạn bảo hộ: đời tác giả + 50 năm, Điều 27 Luật Sở hữu trí tuệ), hoặc tác phẩm khuyết danh cổ;
   - văn bản quy phạm pháp luật, điều ước quốc tế (không thuộc đối tượng bảo hộ quyền tác giả, Điều 15 Luật Sở hữu trí tuệ);
   - bỏ tác phẩm có nhiều chữ Hán (ví dụ "Hán văn độc tu" của Phan Khôi), bản dịch của người dùng Wikisource, văn kiện chính trị gây tranh cãi, văn bản chưa đầy đủ.
   Phần chữ trên Wikisource phát hành theo CC BY-SA 4.0: bìa và trang thông tin của từng sách ghi nguồn và giấy phép.
4. Văn bản lấy từ **bản dump HTML công khai của Wikimedia** (một tệp tải về), trang nào thiếu mới gọi API, tuần tự, chậm – tránh làm quá tải máy chủ Wikisource.

## 3. Kết quả

| | Số sách |
|---|---|
| Sau đợt 2 (21/11) | 255 |
| Gỡ: chữ Hán/Nôm, bản quét khó đọc, bản dịch hiện đại | −231 |
| Giữ: bản quét quốc ngữ in rõ (Archive.org) | 24 |
| Thêm: sách dựng từ Wikisource tiếng Việt | +238 |
| **Hiện tại** | **262** (tất cả tiếng Việt chữ quốc ngữ, 1.4 GB) |

Sách Wikisource theo nhóm: Văn học, khảo cứu hết thời hạn bảo hộ (Wikisource) 165, Văn bản pháp luật (Wikisource) 57, Tuyển tập thơ (Wikisource) 13, Kinh Thánh bản dịch 1925 (Wikisource) 3.

Theo thể loại: Văn học VN 136, Chính trị – Lịch sử – Pháp luật 80, Ngôn ngữ 14, Triết học – Tâm lý 14, Khoa học 11, Tôn giáo 7.

Tác giả có nhiều sách nhất: Hồ Biểu Chánh 43, Phan Khôi 31, Tản Đà 5, Phan Khôi dịch 5, Ngô Tất Tố 4, Trần Trọng Kim 4, Lê Văn Trương 3, Vũ Trọng Phụng 3.

## 4. Sách giữ lại từ Archive.org

| Tên | Năm | Căn cứ |
|---|---|---|
| Báo Khoa học | 1944 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Báo Khoa học | 1942 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Bổn Dạy Phép Toán | 1885 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Chú giải 1 Tê-sa-lô-ni-ca (bản tiếng Việt) | — | Tác giả Bob Goethe tự đăng và cấp phép CC BY-SA 4.0 (bản dịch phát hành miễn phí). |
| Cách trí vệ sinh (Éléments des sciences physiques et naturelles) | 1911 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Gia-cơ và Giu-đe (chú giải, bản tiếng Việt) | — | Bible Lessons International (Bob Utley) phát hành miễn phí bản tiếng Việt theo CC BY-NC-ND 3.0. |
| Khoa-học Tập-chí | 1926 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Khoa-học Tập-chí | 1925 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Khoa-học Tập-chí | 1923 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Khoa-học Tập-chí | 1924 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Nghề Thợ Mộc | 1939 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Nông lâm hóa học kỹ nghệ – Cuốn 1 | 1932 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Phép Vệ Sinh | 1915 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Quilive Du Ký Sang Nước Lilibut Và Nước Khổng Lồ | 1944 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Quốc ngữ viết tắt | 1921 | In trước năm 1945, tác giả mất từ lâu: thuộc phạm vi công cộng (Archive.org ghi Public Domain Mark 1.0). |
| Quốc văn cụ thể (in lần thứ 2) | 1950 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Sách Công vụ các Sứ đồ – Book of Acts Commentary (bản tiếng Việt) | — | Bible Lessons International (Bob Utley) phát hành miễn phí bản tiếng Việt theo CC BY-NC-ND 3.0. |
| The Gospel According to Paul: Romans (chú giải, bản tiếng Việt) | — | Bible Lessons International (Bob Utley) phát hành miễn phí bản tiếng Việt theo CC BY-NC-ND 3.0. |
| Trùng Dương Quái Kiệt | 1937 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Trương Vĩnh Ký | 1943 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Tự chỉ trích | 1939 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Việt Nam sử lược | — | Tác giả Trần Trọng Kim mất năm 1953: hết thời hạn bảo hộ (đời tác giả + 50 năm, Điều 27 Luật Sở hữu trí tuệ). |
| Văn chiêu hồn | 1942 | Ấn phẩm quốc ngữ xuất bản trước 1951: tác phẩm khuyết danh/báo chí đã quá 75 năm, hoặc tác giả mất trước 1976 (hết thời hạn bảo hộ theo Điều 27 Luật Sở hữu trí tuệ). |
| Vương Dương Minh | — | Tác giả Trần Trọng Kim mất năm 1953: hết thời hạn bảo hộ (đời tác giả + 50 năm, Điều 27 Luật Sở hữu trí tuệ). |

## 5. Sách đã gỡ ở lần này

Tệp PDF và bìa được chuyển vào `/var/lib/studytask/library/removed/<thời điểm>/` trên máy chủ (khôi phục được). Lý do ghi ở trường `exclude` của `scripts/data/thu-vien-overrides.json`.

<details><summary><b>Viết bằng chữ Hán/chữ Nôm (bản chép tay hoặc khắc gỗ): người dùng không đọc được, không đáp ứng yêu cầu sách tiếng Việt chữ quốc ngữ.</b> (217 mục)</summary>

| Mã mục Archive.org | Tên trên trang nguồn |
|---|---|
| [ARC.HOANG.10](https://archive.org/details/ARC.HOANG.10) | 宮怨詩 Cung Oán thi |
| [ARC.HOANG.101](https://archive.org/details/ARC.HOANG.101) | 國音賦 Quốc âm phú |
| [ARC.HOANG.103](https://archive.org/details/ARC.HOANG.103) | Recueil factice: [Văn thơ Phật giáo thời Trần] |
| [ARC.HOANG.104](https://archive.org/details/ARC.HOANG.104) | Hoàng Trừ truyện |
| [ARC.HOANG.107](https://archive.org/details/ARC.HOANG.107) | Tứ thời khúc |
| [ARC.HOANG.11](https://archive.org/details/ARC.HOANG.11) | 旅行吟 Lữ hành ngâm |
| [ARC.HOANG.111](https://archive.org/details/ARC.HOANG.111) | Chinh phụ ngâm |
| [ARC.HOANG.116](https://archive.org/details/ARC.HOANG.116) | 国文雜錄 Quốc văn tạp lục |
| [ARC.HOANG.118](https://archive.org/details/ARC.HOANG.118) | Recueil factice: Kim Vân Kiều án - Bài trình của sứ bộ đi Thanh về (1761) |
| [ARC.HOANG.119](https://archive.org/details/ARC.HOANG.119) | Recueil factice : [Gia phả họ Đỗ, Phan] |
| [ARC.HOANG.120](https://archive.org/details/ARC.HOANG.120) | Recueil factice : [Truyền kì mạn lục -1] |
| [ARC.HOANG.121](https://archive.org/details/ARC.HOANG.121) | Recueil factice : [Truyền kì mạn lục -2] |
| [ARC.HOANG.122](https://archive.org/details/ARC.HOANG.122) | Recueil factice: [Văn thơ Nôm 3] |
| [ARC.HOANG.126](https://archive.org/details/ARC.HOANG.126) | 翁聖潘支姑車為傳 Chuyện ông Thánh Phan-chi-cô Xa-vi-ê |
| [ARC.HOANG.127](https://archive.org/details/ARC.HOANG.127) | 明義教篇傳 Minh nghĩa giáo thiên truyện |
| [ARC.HOANG.128](https://archive.org/details/ARC.HOANG.128) | 三祖實錄 Tam tổ thật lục |
| [ARC.HOANG.130](https://archive.org/details/ARC.HOANG.130) | – 時禮誦日用行持集要諸儀 Nhất thời lễ tụng nhật dụng hành trì tập yếu chư nghi |
| [ARC.HOANG.131](https://archive.org/details/ARC.HOANG.131) | Recueil factice: [Văn Nôm công giáo] |
| [ARC.HOANG.133](https://archive.org/details/ARC.HOANG.133) | Recueil factice : [Sử liệu thời Lê Trung Hưng] |
| [ARC.HOANG.15](https://archive.org/details/ARC.HOANG.15) | 㸃迷曲 Điểm mê khúc |
| [ARC.HOANG.16](https://archive.org/details/ARC.HOANG.16) | 吳家世譜 Ngô gia thế phả |
| [ARC.HOANG.19](https://archive.org/details/ARC.HOANG.19) | Thượng sĩ ngữ lục |
| [ARC.HOANG.22](https://archive.org/details/ARC.HOANG.22) | Thơ Lê - chúa Trịnh và các quan |
| [ARC.HOANG.28](https://archive.org/details/ARC.HOANG.28) | Triều đại Việt Nam - Chữ húy |
| [ARC.HOANG.32](https://archive.org/details/ARC.HOANG.32) | 長派侯詩文遺拾 Trường Phái Hầu thi văn di thập |
| [ARC.HOANG.36](https://archive.org/details/ARC.HOANG.36) | Chinh phụ ngâm, Đặng Trần Côn |
| [ARC.HOANG.39](https://archive.org/details/ARC.HOANG.39) | Kim Vân Kiều án và Nguyễn Văn Thắng |
| [ARC.HOANG.44](https://archive.org/details/ARC.HOANG.44) | Thù thế tân thanh (tiết thứ 2) |
| [ARC.HOANG.48](https://archive.org/details/ARC.HOANG.48) | Ngũ canh dạ cảm tình nhân |
| [ARC.HOANG.50](https://archive.org/details/ARC.HOANG.50) | Phủ Diễn hát |
| [ARC.HOANG.51](https://archive.org/details/ARC.HOANG.51) | Ca dao Hưng Nguyên |
| [ARC.HOANG.52](https://archive.org/details/ARC.HOANG.52) | 詩經國語歌 Thi Kinh quốc ngữ ca |
| [ARC.HOANG.57](https://archive.org/details/ARC.HOANG.57) | Nhạc khúc thi văn |
| [ARC.HOANG.60](https://archive.org/details/ARC.HOANG.60) | 梅亭夢記 Mai Đình mộng ký |
| [ARC.HOANG.61](https://archive.org/details/ARC.HOANG.61) | 使程國音集 Sứ trình quốc âm tập |
| [ARC.HOANG.62](https://archive.org/details/ARC.HOANG.62) | 見聞小錄 Kiến văn tiểu lục |
| [ARC.HOANG.63](https://archive.org/details/ARC.HOANG.63) | 軍中對 Quân trung đối |
| [ARC.HOANG.64](https://archive.org/details/ARC.HOANG.64) | 京北進士阮文勝詩集 Kinh Bắc tiến sĩ Nguyễn Văn Thắng thi tập |
| [ARC.HOANG.65](https://archive.org/details/ARC.HOANG.65) | 使程便覽曲 Sứ trình tiện lãm khúc |
| [ARC.HOANG.66](https://archive.org/details/ARC.HOANG.66) | 桂山詩集 Quế Sơn thi tập |
| [ARC.HOANG.69](https://archive.org/details/ARC.HOANG.69) | 書齋詩文國音集 Thư Trai thi văn quốc âm tập |
| [ARC.HOANG.70](https://archive.org/details/ARC.HOANG.70) | 雷陽芮卞黎先生詩集 Lôi Dương Nhuế Biện Lê tiên sinh thi tập |
| [ARC.HOANG.71](https://archive.org/details/ARC.HOANG.71) | 西箱籙記 Tây Sương lục ký |
| [ARC.HOANG.73](https://archive.org/details/ARC.HOANG.73) | Đặng gia thế phả 1600-2000 |
| [ARC.HOANG.74](https://archive.org/details/ARC.HOANG.74) | Lĩnh tạo phú |
| [ARC.HOANG.76](https://archive.org/details/ARC.HOANG.76) | Gia phả họ Nguyễn 阮 ở xă Vy Viễn huyện Nghi Xuân |
| [ARC.HOANG.77](https://archive.org/details/ARC.HOANG.77) | Lê thị tự tình khúc |
| [ARC.HOANG.78](https://archive.org/details/ARC.HOANG.78) | 使文記事 Sứ văn kí sự (rút từ 南北同文集) |
| [ARC.HOANG.79](https://archive.org/details/ARC.HOANG.79) | 黎朝造士登科錄 Lê triều tạo sĩ đăng khoa lục |
| [ARC.HOANG.8](https://archive.org/details/ARC.HOANG.8) | 西楊烈婦傳 Tây dương liệt phụ truyện |
| [ARC.HOANG.80](https://archive.org/details/ARC.HOANG.80) | Kinh phụ mẫu |
| [ARC.HOANG.81](https://archive.org/details/ARC.HOANG.81) | Bản hạnh ngữ lục (Tổ gia thực lục) |
| [ARC.HOANG.82](https://archive.org/details/ARC.HOANG.82) | Ức Trai di tập quyển 7 |
| [ARC.HOANG.83](https://archive.org/details/ARC.HOANG.83) | 吳家文派 Ngô gia văn phái |
| [ARC.HOANG.84](https://archive.org/details/ARC.HOANG.84) | 吳家文派 Ngô gia văn phái |
| [ARC.HOANG.86](https://archive.org/details/ARC.HOANG.86) | Lê triều dã sử |
| [ARC.HOANG.87](https://archive.org/details/ARC.HOANG.87) | [Bản đồ đường đi từ Hà Nội đến Hà Tĩnh] |
| [ARC.HOANG.90](https://archive.org/details/ARC.HOANG.90) | Recueil factice : [Thơ văn Lê -Trịnh - Mạc] |
| [ARC.HOANG.92](https://archive.org/details/ARC.HOANG.92) | Recueil factice: [Truyện thơ Nôm 1] |
| [ARC.HOANG.93](https://archive.org/details/ARC.HOANG.93) | Recueil factice: [Truyện thơ Nôm 2] |
| [ARC.HOANG.97](https://archive.org/details/ARC.HOANG.97) | Recueil factice: [Tuyển tập thơ Nôm 1] |
| [ARC.HOANG.98](https://archive.org/details/ARC.HOANG.98) | 古墨名公傳記演音 |
| [bac-su-thong-luc](https://archive.org/details/bac-su-thong-luc) | Bắc sứ thông lục 北使通錄 |
| [bach-vien-ton-cac-truyen](https://archive.org/details/bach-vien-ton-cac-truyen) | Bạch Viên Tôn các truyện 白猿尊各傳 |
| [ban-dien-tro-ha-o-loi](https://archive.org/details/ban-dien-tro-ha-o-loi) | Bản diễn trò Hà Ô Lôi 本演𠾇何烏雷 |
| [bat-nha-tam-kinh-thich-giai-hoa-ngon-ngon-minh-chau-huong-hai](https://archive.org/details/bat-nha-tam-kinh-thich-giai-hoa-ngon-ngon-minh-chau-huong-hai) | Bát nhã tâm kinh thích giải Hoa ngôn 般若心經釋解華言 |
| [bich-cau-ky-ngo_202509](https://archive.org/details/bich-cau-ky-ngo_202509) | Bích câu kỳ ngộ 碧溝奇遇 |
| [bo-thi-cong-duc-kinh-dien-am-ab.-102](https://archive.org/details/bo-thi-cong-duc-kinh-dien-am-ab.-102) | Bố thí công đức kinh diễn âm 布施公德經演音 |
| [buom-hoa-tan-truyen](https://archive.org/details/buom-hoa-tan-truyen) | Bướm hoa tân truyện 𧊉花新傳 |
| [cac-thanh-truyen](https://archive.org/details/cac-thanh-truyen) | Các thánh truyện 各聖傳 (1646) |
| [chang-chuoi-tan-truyen](https://archive.org/details/chang-chuoi-tan-truyen) | Chàng chuối tân truyện 払𲌻新傳 |
| [chi-nam-ngoc-am-giai-nghia-hia](https://archive.org/details/chi-nam-ngoc-am-giai-nghia-hia) | Chỉ nam ngọc âm giải nghĩa (1641) |
| [chieu-quan-cong-ho-thu](https://archive.org/details/chieu-quan-cong-ho-thu) | Chiêu Quân Cống Hồ thư 昭君貢胡書 |
| [chinh-phu-ngam](https://archive.org/details/chinh-phu-ngam) | Chinh phụ ngâm 征婦吟 |
| [chinh-phu-ngam-1](https://archive.org/details/chinh-phu-ngam-1) | Chinh phụ ngâm 征婦吟 (1922) |
| [chu-dich-luc-thap-tu-quai-giai-am](https://archive.org/details/chu-dich-luc-thap-tu-quai-giai-am) | Chu dịch lục thập tứ quái giải âm 周易六十四卦解音 |
| [chu-kinh-dien-am](https://archive.org/details/chu-kinh-dien-am) | Chư kinh diễn âm 諸經演音 (1900) |
| [co-chau-phap-van-phat-ban-hanh-ngu-luc](https://archive.org/details/co-chau-phap-van-phat-ban-hanh-ngu-luc) | Cổ Châu Pháp Vân phật bản hạnh ngữ lục 古珠法雲佛本行語録 (1752) |
| [co-chau-phat-ban-hanh-1752](https://archive.org/details/co-chau-phat-ban-hanh-1752) | Cổ Châu Phật bản hạnh 古珠佛本行 (1752) |
| [cong-an-tra-nghiem-bi-phap-phap](https://archive.org/details/cong-an-tra-nghiem-bi-phap-phap) | Công án tra nghiệm bí pháp 公案查驗秘法 |
| [cong-van-dich-dinh-bai-bien-cac-dan](https://archive.org/details/cong-van-dich-dinh-bai-bien-cac-dan) | Công văn dịch đình bài biện các đàn 公文役庭排辦各𡊨 (1732) |
| [cu-tran-lac-dao-phu](https://archive.org/details/cu-tran-lac-dao-phu) | Cư trần lạc đạo phú 居塵樂道賦 |
| [cung-oan-ngam-khuc](https://archive.org/details/cung-oan-ngam-khuc) | Cung oán ngâm khúc 宮怨吟曲 |
| [dac-thu-lam-tuyen-thanh-dao-ca](https://archive.org/details/dac-thu-lam-tuyen-thanh-dao-ca) | Đắc thú lâm tuyền thành đạo ca 得趣林泉成道𰙔 |
| [dai-nam-quoc-su-dien-ca](https://archive.org/details/dai-nam-quoc-su-dien-ca) | Đại Nam quốc sử diễn ca 大南國史演歌 |
| [dai-nam-quoc-tuy-uy](https://archive.org/details/dai-nam-quoc-tuy-uy) | Đại Nam quốc túy 大南國粹 (Incomplete) |
| [dat-na-thai-tu-hanh](https://archive.org/details/dat-na-thai-tu-hanh) | Đạt Na thái tử hạnh 達那太子行 |
| [di-da-kinh-thich-giai-hoa-ngon](https://archive.org/details/di-da-kinh-thich-giai-hoa-ngon) | Di Đà kinh thích giải Hoa ngôn 彌陀經釋解華言 |
| [dia-tang-ban-hanh](https://archive.org/details/dia-tang-ban-hanh) | Địa tạng bản hành 地藏本行 |
| [dia-tang-kinh-giai-thich-hoa-ngon-q.-ha](https://archive.org/details/dia-tang-kinh-giai-thich-hoa-ngon-q.-ha) | Địa Tạng Kinh thích giải Hoa ngôn 地蔵經釋解華言 (q. hạ) - (1709) |
| [dich-kinh-dai-toan-tiet-yeu-dien-nghia-q-1](https://archive.org/details/dich-kinh-dai-toan-tiet-yeu-dien-nghia-q-1) | Dịch kinh đại toàn tiết yếu diễn nghĩa (q1) 易經大全節要演義（卷之一）- (18th century)) |
| [duc-ba-phat-truyen](https://archive.org/details/duc-ba-phat-truyen) | Đức Phật Bà truyện: Nam Hải Quan Thế Âm sự tích diễn ca 德𫢋𱙘傳：南海𳁓音𫢋亊蹟𰙔 |
| [duc-chua-giesu-q-2](https://archive.org/details/duc-chua-giesu-q-2) | Đức Chúa Giêsu 德主支秋 (q 2) |
| [duong-ngoc-co-tich](https://archive.org/details/duong-ngoc-co-tich) | Dương Ngọc cổ tích 楊玉古跡 |
| [duong-thi-tuyet-cu-dien-ca](https://archive.org/details/duong-thi-tuyet-cu-dien-ca) | Đường thi tuyệt cú diễn ca 唐詩絶句演歌 |
| [ham-hoa-dien-truyen](https://archive.org/details/ham-hoa-dien-truyen) | Hàm Hòa diễn truyện 咸和演傳 |
| [han-vuong-ton-phu](https://archive.org/details/han-vuong-ton-phu) | Hàn vương tôn phú 韓王孫賦 |
| [ho-thuong-thu-gia-le](https://archive.org/details/ho-thuong-thu-gia-le) | Hồ Thượng thư gia lễ 胡尚書家禮 (1739) |
| [hoa-tien-nhuan-chinh](https://archive.org/details/hoa-tien-nhuan-chinh) | Hoa tiên nhuận chính 花箋潤正 (1875) |
| [hoai-nam-ky](https://archive.org/details/hoai-nam-ky) | Hoài Nam ký 懷南記 |
| [hoang-tru-truyen](https://archive.org/details/hoang-tru-truyen) | Hoàng Trừu truyện 皇儲傳 |
| [hoang-viet-luat-le-toat-yeu-dien-ca-u-dien](https://archive.org/details/hoang-viet-luat-le-toat-yeu-dien-ca-u-dien) | Hoàng Việt luật lệ toát yếu diễn ca 皇越律例撮要演歌 |
| [hoi-dong-tu-giao](https://archive.org/details/hoi-dong-tu-giao) | Hội đồng tứ giáo 會同四教 (1911) |
| [hong-duc-quoc-am-thi-tap](https://archive.org/details/hong-duc-quoc-am-thi-tap) | Hồng Đức quốc âm thi tập 洪德國音詩集 |
| [hong-mong](https://archive.org/details/hong-mong) | Hồng Mông tạo hóa chư duyên bản hạnh 洪蒙造化諸緣本行 |
| [khuyen-hieu-thu](https://archive.org/details/khuyen-hieu-thu) | Khuyến hiếu thư 勸孝書 |
| [kien-van-tieu-luc](https://archive.org/details/kien-van-tieu-luc) | Kiến văn tiểu lục 見聞小錄 (q6) 1777 |
| [kien-van-tieu-luc_202602](https://archive.org/details/kien-van-tieu-luc_202602) | Kiến văn tiểu lục 見聞小錄 (Missing volumes: 3, 7, 8, 11) |
| [kim-cuong-kinh-thich-giai-ly](https://archive.org/details/kim-cuong-kinh-thich-giai-ly) | Kim Cương kinh thích giải lý 金剛經釋解理 |
| [kim-kieu-dien-ca](https://archive.org/details/kim-kieu-dien-ca) | Kim Kiều diễn ca 金翹演歌 |
| [kim-van-kieu-tan-tap](https://archive.org/details/kim-van-kieu-tan-tap) | Kim Vân Kiều tân tập 金雲翹新集 |
| [kinh-nhung-le-mua-phuc-sinh-q-3](https://archive.org/details/kinh-nhung-le-mua-phuc-sinh-q-3) | Kinh những lễ mùa phục sinh 經仍禮務復生 (q3) |
| [lam-sinh-tan-thu](https://archive.org/details/lam-sinh-tan-thu) | Lâm sinh tân thư 林生新書 |
| [lam-tuyen-ky-ngo](https://archive.org/details/lam-tuyen-ky-ngo) | Lâm Tuyền kỳ ngộ 林泉竒遇 |
| [le-ky-dai-toan-tiet-yeu-dien-nghia](https://archive.org/details/le-ky-dai-toan-tiet-yeu-dien-nghia) | Lễ ký đại toàn tiết yếu diễn nghĩa 禮記大全節要演義 (1819) |
| [lich-trieu-hien-chuong-loai-chi-q-1-12](https://archive.org/details/lich-trieu-hien-chuong-loai-chi-q-1-12) | Lịch triều hiến chương loại chí (q1-12) 歷朝憲章類誌 |
| [lich-trieu-hien-chuong-loai-chi-q-13-25](https://archive.org/details/lich-trieu-hien-chuong-loai-chi-q-13-25) | Lịch triều hiến chương loại chí (q13-25) 歷朝憲章類誌 |
| [lich-trieu-hien-chuong-loai-chi-q-26-38](https://archive.org/details/lich-trieu-hien-chuong-loai-chi-q-26-38) | Lịch triều hiến chương loại chí (q26-38) 歷朝憲章類誌 |
| [lich-trieu-hien-chuong-loai-chi-q-39-49](https://archive.org/details/lich-trieu-hien-chuong-loai-chi-q-39-49) | Lịch triều hiến chương loại chí (q39-49) 歷朝憲章類誌 |
| [luc-van-tien-q-1](https://archive.org/details/luc-van-tien-q-1) | Lục Vân Tiên 蓼雲仙 (q1) |
| [luc-van-tien-q-2](https://archive.org/details/luc-van-tien-q-2) | Lục Vân Tiên 蓼雲仙 (q2) |
| [luc-van-tien-q-3](https://archive.org/details/luc-van-tien-q-3) | Lục Vân Tiên 蓼雲仙 (q3) |
| [luu-binh-dien-ca](https://archive.org/details/luu-binh-dien-ca) | Lưu Bình diễn ca 劉平演歌 |
| [luu-binh-phu](https://archive.org/details/luu-binh-phu) | Lưu Bình phú 劉平賦 |
| [ly-cong-tan-thu](https://archive.org/details/ly-cong-tan-thu) | Lý công tân thư 李公新書 |
| [ly-cong-tan-truyen](https://archive.org/details/ly-cong-tan-truyen) | Lý công tân truyện 李公新傳 |
| [minh-tam-bao-giam-thich-nghia](https://archive.org/details/minh-tam-bao-giam-thich-nghia) | Minh tâm bảo giám thích nghĩa 明心寶鑑釋義 |
| [mong-son-thi-thuc-khoa-nghi-1918](https://archive.org/details/mong-son-thi-thuc-khoa-nghi-1918) | Mông Sơn thí thực khoa nghi 蒙山施食科儀 (1918) |
| [nam-hai-quan-am-ban-hanh](https://archive.org/details/nam-hai-quan-am-ban-hanh) | Nam Hải Quan Âm bản hạnh quốc ngữ 南海觀音本行國語 |
| [nam-vo-tan-truyen](https://archive.org/details/nam-vo-tan-truyen) | Nam vô tân truyện 南無新傳 |
| [nan-tu-giai-am-am](https://archive.org/details/nan-tu-giai-am-am) | Nan tự giải âm 難字解音 |
| [ngam-thuong-kho](https://archive.org/details/ngam-thuong-kho) | Ngắm thương khó 吟傷厙 (1865) |
| [ngoc-kieu-le-tan-truyen](https://archive.org/details/ngoc-kieu-le-tan-truyen) | Ngọc Kiều Lê tân truyện 玉嬌黎新傳 |
| [ngu-canh-phu](https://archive.org/details/ngu-canh-phu) | Ngũ canh phú 五更賦 |
| [ngu-kinh-tiet-yeu-dien-nghia](https://archive.org/details/ngu-kinh-tiet-yeu-dien-nghia) | Ngũ kinh tiết yếu diễn nghĩa (q1) 五經節要演義 |
| [nguyet-hoa-van-dap](https://archive.org/details/nguyet-hoa-van-dap) | Nguyệt Hoa vấn đáp 月花問答 |
| [nhat-dung-thuong-dam](https://archive.org/details/nhat-dung-thuong-dam) | Nhật dụng thường đàm 日用常談 (1851) |
| [nhi-do-mai-dien-ca](https://archive.org/details/nhi-do-mai-dien-ca) | Nhị đọ mai diễn ca 二度梅演歌 |
| [nhi-do-mai-tan-truyen](https://archive.org/details/nhi-do-mai-tan-truyen) | Nhị độ mai tân truyện 二度梅新傳 (1920) |
| [nhu-tay-nhat-trinh](https://archive.org/details/nhu-tay-nhat-trinh) | Như tây nhật trình 如西日程 |
| [nhuan-chinh-trung-hieu-tiet-nghia-nhi-do-mai-truyen](https://archive.org/details/nhuan-chinh-trung-hieu-tiet-nghia-nhi-do-mai-truyen) | Nhuận chinh trung hiếu tiết nghĩa nhị độ mai truyện 潤正忠孝節義二度梅傳 |
| [nu-luu-tuong-truyen](https://archive.org/details/nu-luu-tuong-truyen) | Nữ Lưu tướng truyện 女劉將傳 |
| [ong-ninh-co-truyen](https://archive.org/details/ong-ninh-co-truyen) | Ông Ninh cổ truyện 翁寧古傳 |
| [pham-cong-cuc-hoa](https://archive.org/details/pham-cong-cuc-hoa) | Phạm công cúc hoa 范公菊花 |
| [phap-thi-yeu-luc](https://archive.org/details/phap-thi-yeu-luc) | Pháp thí yếu lục 法施要錄 |
| [phat-tu-an-thien-giai-quoc-am-luc-chuong](https://archive.org/details/phat-tu-an-thien-giai-quoc-am-luc-chuong) | Phật tử an thiền giải quốc âm lục chương 佛子安禪觧國音六章 (1845) |
| [phong-tinh-tan-truyen](https://archive.org/details/phong-tinh-tan-truyen) | Phong tình tân truyện 風情新傳 |
| [phu-bien-tap-luc-q-1](https://archive.org/details/phu-bien-tap-luc-q-1) | Phủ biên tạp lục 撫邊雜錄 (q1) |
| [phu-dung-tan-truyen](https://archive.org/details/phu-dung-tan-truyen) | Phù dung tân truyện 芙蓉新傳 |
| [qua-da-gie-si-ma-mua-an-chay-ca](https://archive.org/details/qua-da-gie-si-ma-mua-an-chay-ca) | Qua-da-giê-si-ma Mùa ăn chay cả 戈耶吱搓瑪務咹齋哿 |
| [quan-am-chu-giai-tan-truyen](https://archive.org/details/quan-am-chu-giai-tan-truyen) | Quan Âm chú giải tân truyện 觀音註解新傳 |
| [quan-am-dien-ca-toan-truyen-yen](https://archive.org/details/quan-am-dien-ca-toan-truyen-yen) | Quan Âm diễn ca toàn truyện 觀音演歌全傳 |
| [quan-am-nguyen-tu-ban-hanh](https://archive.org/details/quan-am-nguyen-tu-ban-hanh) | Quan Âm nguyên tử bản hạnh 觀音芫子本行 |
| [quan-am-phu](https://archive.org/details/quan-am-phu) | Quan Âm phú 觀音賦 |
| [quan-phu-tu-kinh-huan-hop-khac](https://archive.org/details/quan-phu-tu-kinh-huan-hop-khac) | Quan phu tử kinh huấn hợp khắc 關夫子經訓合刻 |
| [quy-y-thien-ban-1930](https://archive.org/details/quy-y-thien-ban-1930) | Quy y thiện bản 皈依善本 (1930) |
| [sach-cac-phep](https://archive.org/details/sach-cac-phep) | Sách các phép 冊各法 |
| [sai-vai-tan-luc-quoc-am-dien-ca](https://archive.org/details/sai-vai-tan-luc-quoc-am-dien-ca) | Sãi Vãi tân lục quốc âm diễn ca 仕𠉜新錄国音演𰙔 |
| [so-hoc-van-tan](https://archive.org/details/so-hoc-van-tan) | Sơ học vấn tân 初學問津 (1882) |
| [so-hoc-van-tan_202604](https://archive.org/details/so-hoc-van-tan_202604) | Sơ học vấn tân 初學問津 |
| [so-nghieu-doi-thoai](https://archive.org/details/so-nghieu-doi-thoai) | Kính phụng Táo thần diễn ca 敬奉竈神演歌 - Sô nghiêu đối thoại 芻蕘對話 |
| [su-ly-dung-thong](https://archive.org/details/su-ly-dung-thong) | Sự lý dung thông 事理融通 |
| [tam-thie-n-tu-toa-n-ye-u-1845](https://archive.org/details/tam-thie-n-tu-toa-n-ye-u-1845) | Tam thiên tự toản yếu (1845) |
| [tam-thien-tu-giai-am-tu-hoc-toat-yeu-oat-eu-1887](https://archive.org/details/tam-thien-tu-giai-am-tu-hoc-toat-yeu-oat-eu-1887) | Tam thiên tự giải âm - Tự học toát yếu 三千字觧音 - 字學纂要 (1887) |
| [tam-thien-tu-lich-dai-van-quoc-am](https://archive.org/details/tam-thien-tu-lich-dai-van-quoc-am) | Tam thiên tự lịch đại văn quốc âm 三千字歷代文國音 (1845) |
| [tam-tu-kinh-luc-bat-dien-am](https://archive.org/details/tam-tu-kinh-luc-bat-dien-am) | Tam tự kinh lục bát diễn âm 三字經六八演音 (1906) |
| [tan-bien-truyen-ky-man-luc-tang-bo-giai-am-tap-chu-q-1](https://archive.org/details/tan-bien-truyen-ky-man-luc-tang-bo-giai-am-tap-chu-q-1) | Tân biên Truyền kỳ mạn lục tăng bổ giải âm tập chú 新編傳奇漫錄增補解音集註 (q1) |
| [tan-bien-truyen-ky-man-luc-tang-bo-giai-am-tap-chu-q-2](https://archive.org/details/tan-bien-truyen-ky-man-luc-tang-bo-giai-am-tap-chu-q-2) | Tân biên Truyền kỳ mạn lục tăng bổ giải âm tập chú 新編傳奇漫錄增補解音集註 (q2) |
| [tan-bien-truyen-ky-man-luc-tang-bo-giai-am-tap-chu-q-3](https://archive.org/details/tan-bien-truyen-ky-man-luc-tang-bo-giai-am-tap-chu-q-3) | Tân biên Truyền kỳ mạn lục tăng bổ giải âm tập chú 新編傳奇漫錄增補解音集註 (q3) |
| [tan-bien-truyen-ky-man-luc-tang-bo-giai-am-tap-chu-q-4](https://archive.org/details/tan-bien-truyen-ky-man-luc-tang-bo-giai-am-tap-chu-q-4) | Tân biên Truyền kỳ mạn lục tăng bổ giải âm tập chú 新編傳奇漫錄增補解音集註 (q4) |
| [tan-bien-truyen-ky-man-luc-tang-bo-giai-am-tap-chu-vhv.-1491](https://archive.org/details/tan-bien-truyen-ky-man-luc-tang-bo-giai-am-tap-chu-vhv.-1491) | Tân biên Truyền kỳ mạn lục tăng bổ giải âm tập chú 新編傳奇漫錄增補解音集註 (VHv.1491) |
| [tan-san-chinh-phu-ngam-dien-am-tu-khuc](https://archive.org/details/tan-san-chinh-phu-ngam-dien-am-tu-khuc) | Tân san chinh phụ ngâm diễn âm từ khúc 新刋征婦吟演音辭曲 |
| [tay-duong-liet-phu-truyen-an.-49](https://archive.org/details/tay-duong-liet-phu-truyen-an.-49) | Tây Dương liệt phụ truyện 西楊烈婦傳 |
| [thach-sanh-ly-thong-thu](https://archive.org/details/thach-sanh-ly-thong-thu) | Thạch Sanh Lý Thông thư 石生李通書 |
| [thach-sanh-tan-truyen-ab.-221](https://archive.org/details/thach-sanh-tan-truyen-ab.-221) | Thạch Sanh tân truyện 石生新傳 (1912) |
| [thai-tong-hoang-de-ngu-che-khoa-hu-luc](https://archive.org/details/thai-tong-hoang-de-ngu-che-khoa-hu-luc) | Thái Tông hoàng đế ngự chế khoá hư lục 太宗皇帝御製課虛録 |
| [thanh-giao-kinh-nguyen](https://archive.org/details/thanh-giao-kinh-nguyen) | Thánh giáo kinh nguyện 聖教經願 |
| [thanh-giao-kinh-nguyen-2](https://archive.org/details/thanh-giao-kinh-nguyen-2) | Thánh giáo kinh nguyện 聖教經願 |
| [thanh-giao-yeu-ly](https://archive.org/details/thanh-giao-yeu-ly) | Thánh giáo yếu lý 聖教要理 (1925) |
| [thanh-hoa-quan-phong](https://archive.org/details/thanh-hoa-quan-phong) | Thanh Hoá quan phong  清化觀風 |
| [thap-gioi-co-hon-quoc-ngu-van](https://archive.org/details/thap-gioi-co-hon-quoc-ngu-van) | Thập giới cô hồn quốc ngữ văn 十誡孤魂國語文 |
| [thi-kinh-giai-am](https://archive.org/details/thi-kinh-giai-am) | Thi kinh giải âm (q1) 詩經解音 |
| [thien-nam-minh-giam](https://archive.org/details/thien-nam-minh-giam) | Thiên Nam minh giám 天南明鑑 |
| [thien-nam-ngu-ngoai-ky-ab.-478](https://archive.org/details/thien-nam-ngu-ngoai-ky-ab.-478) | Thiên Nam ngữ lục ngoại kỷ 天南語籙外紀 (AB.478) |
| [thien-nam-ngu-ngoai-ky-quyen-ha](https://archive.org/details/thien-nam-ngu-ngoai-ky-quyen-ha) | Thiên Nam ngữ lục ngoại kỷ 天南語籙外紀 (quyển hạ; 卷下) |
| [thien-nam-ngu-ngoai-ky-quyen-thuong](https://archive.org/details/thien-nam-ngu-ngoai-ky-quyen-thuong) | Thiên Nam ngữ lục ngoại kỷ 天南語籙外紀 (quyển thượng; 卷上) |
| [thien-nam-tiep-chu-ngoai-ki-su-luoc](https://archive.org/details/thien-nam-tiep-chu-ngoai-ki-su-luoc) | Thiên Nam tiệp chú ngoại kỷ sử lược 天南捷註外紀史略 |
| [thien-tong-ban-hanh-anh](https://archive.org/details/thien-tong-ban-hanh-anh) | Thiền tông bản hạnh 禪宗本行 (1745) |
| [thien-tu-van-an](https://archive.org/details/thien-tu-van-an) | Thiên tự văn 千字文 (1845) |
| [thien-uyen-truyen-dang-luc-q.-ha](https://archive.org/details/thien-uyen-truyen-dang-luc-q.-ha) | Thiền uyển truyền đăng lục 禪苑傳燈錄 (q. hạ) |
| [tho-mai-gia-le_202506](https://archive.org/details/tho-mai-gia-le_202506) | Thọ Mai gia lễ 壽梅家禮 (1920) |
| [thu-da-lu-hoai-ngam](https://archive.org/details/thu-da-lu-hoai-ngam) | Thu dạ lữ hoài ngâm 秋夜旅懷吟 |
| [thu-kinh-dien-nghia](https://archive.org/details/thu-kinh-dien-nghia) | Thư kinh diễn nghĩa 書經衍義 |
| [thuy-son-thu-mong-ky](https://archive.org/details/thuy-son-thu-mong-ky) | Thúy Sơn thu mộng ký 翠山秋夢記 |
| [tinh-nghiep-van-dien-nghia](https://archive.org/details/tinh-nghiep-van-dien-nghia) | Tịnh nghiệp văn diễn nghĩa 淨業文演義 |
| [toan-viet-thi-luc-t-2](https://archive.org/details/toan-viet-thi-luc-t-2) | Toàn Việt thi lục (t2) 全越詩錄 |
| [toan-viet-thi-luc-t-3](https://archive.org/details/toan-viet-thi-luc-t-3) | Toàn Việt thi lục (t3) 全越詩錄 |
| [toan-viet-thi-luc-t-4](https://archive.org/details/toan-viet-thi-luc-t-4) | Toàn Việt thi lục (t4) 全越詩錄 |
| [tran-dai-vuong-chinh-kinh-dich-am](https://archive.org/details/tran-dai-vuong-chinh-kinh-dich-am) | Trần Đại vương chính kinh dịch âm 陳大王正經繹音 (1929) |
| [trieu-ngu-nuong-tan-thu](https://archive.org/details/trieu-ngu-nuong-tan-thu) | Triệu ngũ nương tân thư 趙五娘新書 |
| [trinh-quoc-cong-nguyen-binh-khiem-thi-tap](https://archive.org/details/trinh-quoc-cong-nguyen-binh-khiem-thi-tap) | Trình Quốc công Nguyễn Bỉnh Khiêm thi tập 程國公阮秉謙詩集 |
| [trinh-thu-truyen](https://archive.org/details/trinh-thu-truyen) | Trinh thử truyện 貞鼠傳 |
| [trung-quan-doi-ca](https://archive.org/details/trung-quan-doi-ca) | Trung quân đối ca 中軍對歌 |
| [truong-ngao-truyen](https://archive.org/details/truong-ngao-truyen) | Trương Ngáo truyện 張僥傳 |
| [truong-ngo-dien-ca](https://archive.org/details/truong-ngo-dien-ca) | Trương Ngộ diễn ca 張悟演歌 |
| [tu-duc-thanh-che-tu-hoc-giai-nghia-ca-i-nghia](https://archive.org/details/tu-duc-thanh-che-tu-hoc-giai-nghia-ca-i-nghia) | Tự Đức thánh chế tự học giải nghĩa ca 嗣德聖製字學解義歌 (1898) |
| [tu-thu-uoc-giai-gia-ab.-270-1](https://archive.org/details/tu-thu-uoc-giai-gia-ab.-270-1) | Tứ thư ước giải 四書約解 (AB.270-1) |
| [tuyen-phu-ngo-phoi-tan-truyen](https://archive.org/details/tuyen-phu-ngo-phoi-tan-truyen) | Tuyển phu ngộ phối tân truyện 選夫誤配新傳 |
| [uc-trai-tap-quoc-am-thi-tap](https://archive.org/details/uc-trai-tap-quoc-am-thi-tap) | Ức Trai tập (q7) - Quốc âm thi tập 抑齋集－國音詩集 |
| [van-tien-co-tich-truyen](https://archive.org/details/van-tien-co-tich-truyen) | Vân Tiên cổ tích truyện 雲僊古跡傳 (1897) |
| [viet-su-dien-am](https://archive.org/details/viet-su-dien-am) | Việt sử diễn âm 越史演音 |
| [viet-su-dien-nghia](https://archive.org/details/viet-su-dien-nghia) | Việt sử diễn nghĩa 越史演義 |
| [viet-su-dien-nghia-tu-tu-ca](https://archive.org/details/viet-su-dien-nghia-tu-tu-ca) | Việt sử diễn nghĩa tứ tự ca 越史演義四字歌 |
| [viet-su-tiep-luc-dien-nghia](https://archive.org/details/viet-su-tiep-luc-dien-nghia) | Việt sử tiệp lục diễn nghĩa 越史㨗錄演義 |
| [xuan-huong-thi-tap-q-1](https://archive.org/details/xuan-huong-thi-tap-q-1) | Xuân Hương thi tập 春香詩習 (q1) 1930 |
| [xuan-huong-thi-tap-q-2](https://archive.org/details/xuan-huong-thi-tap-q-2) | Xuân Hương thi tập 春香詩習 (q2) 1930 |
| [xuat-gia-sa-di-quoc-am-thap-gioi](https://archive.org/details/xuat-gia-sa-di-quoc-am-thap-gioi) | Xuất gia sa di quốc âm thập giới 出家沙彌國音十戒 |

</details>

<details><summary><b>Chữ quốc ngữ cổ, bản quét chất lượng thấp hoặc chủ yếu tiếng nước ngoài (Pháp, La-tinh): khó đọc, không đáp ứng yêu cầu sách tiếng Việt dễ đọc.</b> (12 mục)</summary>

| Mã mục Archive.org | Tên trên trang nguồn |
|---|---|
| [bub_gb_2kg0AQAAMAAJ](https://archive.org/details/bub_gb_2kg0AQAAMAAJ) | Petit dictionnaire français-annamite |
| [bub_gb_B-QNAAAAMAAJ](https://archive.org/details/bub_gb_B-QNAAAAMAAJ) | Notions pour servir à l'étude de la langue annamite |
| [bub_gb_HdQuAAAAYAAJ](https://archive.org/details/bub_gb_HdQuAAAAYAAJ) | Lexique franco-annamite = Tu vi phalangsaannam |
| [bub_gb_PKQTAAAAQAAJ](https://archive.org/details/bub_gb_PKQTAAAAQAAJ) | Grammaire annamite : suivie d'un vocabulaire français-annamite et annamite-français |
| [bub_gb_QcMVAAAAYAAJ](https://archive.org/details/bub_gb_QcMVAAAAYAAJ) | Petit dictionnaire annamite-français |
| [c495.11d937.2lexicon](https://archive.org/details/c495.11d937.2lexicon) | Lexicon Cochin-Sinense Latinum ad usum missionum. |
| [dai-nam-quoc-ngu](https://archive.org/details/dai-nam-quoc-ngu) | Đại Nam quốc ngữ 大南國語 (1899) |
| [les-fables-de-la-fontaine-1943](https://archive.org/details/les-fables-de-la-fontaine-1943) | Les Fables De La Fontaine (thơ ngụ ngôn La Phông ten) |
| [mss836cochinchinesefrench_202102](https://archive.org/details/mss836cochinchinesefrench_202102) | Cochin-Chinese & French vocabulary = Vocabulaire Cochin-Chinois et Français : Catholic Mi |
| [phep-giang-tam-ngay](https://archive.org/details/phep-giang-tam-ngay) | Phép Giảng Tám Ngày |
| [tam-tu-kinh-quoc-ngu-dien-ca](https://archive.org/details/tam-tu-kinh-quoc-ngu-dien-ca) | Tam Tự Kinh quốc ngữ diễn ca 三字經國演歌 |
| [thanh-giao-yeu-ly-quoc-ngu](https://archive.org/details/thanh-giao-yeu-ly-quoc-ngu) | Thánh giáo yếu lý quốc ngữ 聖教要理國語 |

</details>

<details><summary><b>Bản phiên âm/dịch hiện đại (người dịch, hiệu đính còn trong thời hạn bảo hộ): rủi ro bản quyền.</b> (2 mục)</summary>

| Mã mục Archive.org | Tên trên trang nguồn |
|---|---|
| [kham-thien-giai-ach-kinh-ban-chua-linh-son-1900](https://archive.org/details/kham-thien-giai-ach-kinh-ban-chua-linh-son-1900) | Khâm Thiên Giải Ách Kinh-Bản Chùa Linh Sơn năm 1900 |
| [truyen-ky-tan-pha_202503](https://archive.org/details/truyen-ky-tan-pha_202503) | Truyền Kỳ Tân Phả |

</details>

## 6. Hạn chế còn lại

- Văn bản pháp luật lấy theo bản lúc ban hành trên Wikisource, **có thể đã được sửa đổi hoặc thay thế**; trang chi tiết mỗi sách có ghi chú này. Không dùng thư viện làm nguồn tra cứu hiệu lực pháp luật.
- Văn bản Wikisource do cộng đồng gõ lại, có thể còn lỗi chính tả nhỏ; một vài trang gốc có lỗi định dạng (ví dụ thẻ chú thích gõ sai) nên vài chỗ hiện nguyên ký hiệu.
- Phần bản dump HTML dùng bản ngày 20/03/2025 (bản mới nhất Wikimedia công bố dạng HTML); 181 trang không có trong dump được lấy trực tiếp qua API.

## 7. Cách tái hiện

```powershell
python scripts/build_wikisource_books.py --out 'E:\sach\wikisource-vi' --dump <tệp viwikisource_namespace_0_0.ndjson>
python scripts/prepare_library.py --src 'E:\sach' --staging du-lieu-thu/library-staging --offline
```

Phải in ra `262 sách`. Danh sách đầy đủ: [05-danh-sach-sach.md](05-danh-sach-sach.md).
