# 04. Rà soát bản quyền kho sách (21/11/2026)
> **NGOÀI KẾ HOẠCH CỦA NHÓM – KHÔNG THUỘC TUẦN NÀO.** Phần rà soát này do Trương Thanh Vui làm riêng ngày 21/11/2026, sau khi nhóm đã hoàn tất báo cáo tuần. Không thuộc kế hoạch tuần 5, 6, 7, không tính vào khối lượng của nhóm và **không cần đưa vào báo cáo tuần** (việc phụ, mức độ quan trọng thấp). Tài liệu chỉ để lưu vết vì sao sách được giữ hoặc gỡ.
> **Đã cũ:** số liệu 255 sách ở đây là kết quả đợt 2. Lần rà soát 3 (sách tiếng Việt đọc được, 262 sách) ở [06](06-ra-soat-sach-doc-duoc.md).

Người thực hiện: Trương Thanh Vui (cùng Claude Code, model Claude Opus 5.5). Thay cho số liệu 179 sách ở 01–03 (các tệp đó giữ nguyên làm lịch sử).

## 1. Kết quả

| | Số sách |
|---|---|
| Trước rà soát (19/11) | 179 |
| Đợt 1 (sáng 21/11): gỡ sách trang nguồn không ghi giấy phép và sách tải tay | −33 |
| Đợt 1: thêm sách Hán Nôm / quốc ngữ in trước 1945 (Public Domain Mark) | +50 |
| Sau đợt 1 | 196 |
| Đợt 2 (chiều 21/11): gỡ sách có nguy cơ (mục 3) | −134 |
| Đợt 2: thêm sách mới an toàn (mục 2) | +193 |
| **Hiện tại** | **255** (tất cả tiếng Việt, tất cả có giấy phép hoặc căn cứ ghi rõ, 24.2 GB) |

Theo nhóm nguồn:

| Nhóm | Số sách |
|---|---|
| Sách Nôm cổ (phạm vi công cộng) | 107 |
| Bộ sưu tập Hoàng Xuân Hãn – BULAC | 62 |
| Sách cổ Hán Nôm và quốc ngữ (phạm vi công cộng) | 50 |
| Sách quốc ngữ trước 1951 | 24 |
| Giữ lại từ kho cũ (có căn cứ riêng) | 12 |

Theo giấy phép / căn cứ hiển thị:

| Giấy phép | Số sách |
|---|---|
| Phạm vi công cộng (Public Domain Mark 1.0) | 167 |
| CC BY-NC 4.0 (ghi nguồn, phi thương mại) | 62 |
| CC BY-NC-ND 4.0 (ghi nguồn, phi thương mại, không phái sinh) | 15 |
| Hết thời hạn bảo hộ quyền tác giả (phạm vi công cộng theo Luật Sở hữu trí tuệ Việt Nam) | 6 |
| CC BY-NC-ND 3.0 (ghi nguồn, phi thương mại, không phái sinh) | 3 |
| CC BY-SA 4.0 (ghi nguồn, chia sẻ tương tự) | 1 |
| Phạm vi công cộng (tuyên bố từ bỏ bản quyền kiểu cũ của Creative Commons) | 1 |

Theo thể loại: Văn học VN 122, Tôn giáo 56, Chính trị – Lịch sử 31, Ngôn ngữ 24, Triết học – Tâm lý 10, Khoa học 10, Nghệ thuật 2.

## 2. Tiêu chí giữ / thêm sách

Căn cứ: Điều 27 Luật Sở hữu trí tuệ (quyền tác giả bảo hộ suốt đời tác giả + 50 năm; tác phẩm khuyết danh, tác phẩm của tổ chức: 75 năm từ khi công bố). Nhãn giấy phép trên Archive.org do người đăng tự chọn nên **không tự động tin** với sách hiện đại. Một sách được giữ khi thuộc một trong các trường hợp:

1. **Sách in cổ (Hán Nôm, quốc ngữ) trước thế kỷ 20 / trước 1945**, tác giả mất từ lâu: phạm vi công cộng. Phần lớn do Quỹ Bảo tồn chữ Nôm (Nôm Preservation Foundation) và các thư viện quét, Archive ghi Public Domain Mark 1.0.
2. **Bộ sưu tập Hoàng Xuân Hãn của thư viện BULAC (Paris)**: chính đơn vị lưu giữ công bố theo CC BY-NC 4.0 (ghi nguồn, phi thương mại) – phù hợp vì StudyTask dùng phi lợi nhuận, chỉ người đăng nhập mới đọc.
3. **Ấn phẩm quốc ngữ trước 1951**: khuyết danh / báo chí / sách của cơ quan đã quá 75 năm, hoặc tác giả (và dịch giả) mất trước 1976.
4. **Tác giả hoặc đơn vị giữ quyền tự phát hành** miễn phí kèm giấy phép (Bible Lessons International – Bob Utley; Bob Goethe).
5. **Tác giả mất trước 1976** (ví dụ Trần Trọng Kim, mất 1953).

Mỗi sách có trường `rightsNote` (căn cứ) trong `scripts/data/thu-vien-sach.json`; trang Thư viện hiện dòng "Căn cứ: …" trong khung chi tiết sách (cần chạy `deploy.sh` để giao diện mới có hiệu lực).

Quy định kỹ thuật: lý do gỡ ghi ở trường `exclude` của `scripts/data/thu-vien-overrides.json`; `scripts/prepare_library.py` bỏ các mục đó và in số lượng. Chỉ nhận PDF ≤ 400 MB để tiết kiệm ổ đĩa máy chủ. Mỗi tệp tải về đối chiếu SHA-1 với Archive.org.

### Nguồn đã xem nhưng KHÔNG nhận

- Bộ "Linh Sơn Đại Tạng Kinh" trên Archive: người đăng ghi tự sưu tầm PDF, không phải chủ sở hữu quyền.
- Sách ghi CC0 do tài khoản mang tên tác giả Nguyễn Đông Hưng đăng: không xác minh được là chính tác giả.
- Sách giáo khoa hiện hành gắn nhãn CC0 / phạm vi công cộng: là ấn phẩm của nhà xuất bản còn thời hạn bảo hộ.
- Tài liệu không phải tiếng Việt (MePKC, Chinese Language Seed, hồ sơ "Captured Vietnamese Records" là ảnh tài liệu rời).

## 3. Sách đã gỡ ở đợt 2 (134 sách thuộc 117 mục Archive.org)

Tệp PDF và bìa đã chuyển vào `/var/lib/studytask/library/removed/<thời điểm>/` trên máy chủ (kèm `danh-muc-da-go.json`), khôi phục được; có thể xóa hẳn sau khi nhóm đồng ý.

**Bản quét sách/tạp chí xuất bản sau 1975 của nhà xuất bản; nhãn giấy phép do người đăng tự chọn, không có căn cứ người đăng là chủ sở hữu quyền.** (76 mục)

| Mã mục Archive.org | Tên trên trang nguồn |
|---|---|
| [01-nhung-cuoc-chinh-phuc-ky-dieu](https://archive.org/details/01-nhung-cuoc-chinh-phuc-ky-dieu) | Tủ sách em yêu khoa học |
| [2025-vhtt-thang-10](https://archive.org/details/2025-vhtt-thang-10) | 2025 VHTT Thang 10 |
| [2026-vhtt-so-thang-3](https://archive.org/details/2026-vhtt-so-thang-3) | 2026 VHTT So Thang 3 |
| [2160019.pdf-file](https://archive.org/details/2160019.pdf-file) | Đối xứng phân tử và ứng dụng lý thuyết nhóm trong hóa học |
| [2266952.pdf](https://archive.org/details/2266952.pdf) | Hóa học xanh trong tổng hợp hữu cơ. Tập 1 (Xúc tác xanh và dung môi xanh) |
| [ChuyenCoTichVeCacChangHiepSi](https://archive.org/details/ChuyenCoTichVeCacChangHiepSi) | Chuyen co tich ve cac chang hiep si |
| [bag_tr_cuu_q_trih_co_hoc_truyen_nhiet_truyen_4088](https://archive.org/details/bag_tr_cuu_q_trih_co_hoc_truyen_nhiet_truyen_4088) | Bảng tra cứu quá trình cơ học truyền nhiệt – truyền khối |
| [bai-tap-hoa-dai-cuong](https://archive.org/details/bai-tap-hoa-dai-cuong) | Bài tập hóa đại cương (có lời giải) |
| [baitaphoahuuco_phanthanhsonnam_2_5212](https://archive.org/details/baitaphoahuuco_phanthanhsonnam_2_5212) | Bài Tập Hóa Hữu Cơ |
| [bautroituoitho.-vn](https://archive.org/details/bautroituoitho.-vn) | Bầu trời tuổi thơ |
| [ben-nghe-xua-son-nam](https://archive.org/details/ben-nghe-xua-son-nam) | Ben Nghe Xua |
| [cac-phuong-phap-phan-tich-cong-cu-trong-hoa-hoc-hien-dai-ho-viet-quy](https://archive.org/details/cac-phuong-phap-phan-tich-cong-cu-trong-hoa-hoc-hien-dai-ho-viet-quy) | Các phương pháp phân tích công cụ trong Hoá học hiện đại |
| [cau-chuyen-khoa-hoc-nguyen-van-tuan](https://archive.org/details/cau-chuyen-khoa-hoc-nguyen-van-tuan) | Câu Chuyện Khoa Học Nguyễn Văn Tuấn |
| [cau-tao-chat](https://archive.org/details/cau-tao-chat) | Cấu Tạo Chất đại cương |
| [chinh-tri-binh-dan-ban-moi-2018-pham-doan-trang](https://archive.org/details/chinh-tri-binh-dan-ban-moi-2018-pham-doan-trang) | Chinh Tri Binh Dan Ban Moi 2018 Pham Doan Trang |
| [co-tich-viet-nam-bang-tho](https://archive.org/details/co-tich-viet-nam-bang-tho) | Co Tich Viet Nam Bang Tho |
| [co_so_ly_thuyet_6699](https://archive.org/details/co_so_ly_thuyet_6699) | Cơ Sở Lí Thuyết Các Quá Trình Hóa Học |
| [con-rong-viet-nam-bao-dai-full](https://archive.org/details/con-rong-viet-nam-bao-dai-full) | Con Rồng Việt Nam |
| [cong-nghe-san-xuat-gom-su-nguyen-van-dung](https://archive.org/details/cong-nghe-san-xuat-gom-su-nguyen-van-dung) | Công Nghệ Sản Xuất Gốm Sứ |
| [dat-diu-ve-thuo-au-tho-nguyen-chan-hung](https://archive.org/details/dat-diu-ve-thuo-au-tho-nguyen-chan-hung) |  Dắt dìu về thuở ấu thơ  |
| [dau-an-khoi-dong-van-hoa-viet-le-minh-quoc](https://archive.org/details/dau-an-khoi-dong-van-hoa-viet-le-minh-quoc) | Dấu ấn khơi dòng văn hóa Việt |
| [file_goc_778257](https://archive.org/details/file_goc_778257) | Phương pháp luận nghiên cứu khoa học |
| [giao-trinh-hoa-hoc-moi-truong-dang-dinh-bach](https://archive.org/details/giao-trinh-hoa-hoc-moi-truong-dang-dinh-bach) | Giáo Trình Hóa Học Môi Trường  |
| [giao-trinh-hoa-huu-co-phan-thanh-son-nam_compress](https://archive.org/details/giao-trinh-hoa-huu-co-phan-thanh-son-nam_compress) | Giáo trình Hóa học hữu cơ |
| [giao-trinh-triet-hoc-mac-lenin](https://archive.org/details/giao-trinh-triet-hoc-mac-lenin) | Giáo Trình Triết Học Mác Lênin |
| [hanviettudien-daoduyanh-bandep](https://archive.org/details/hanviettudien-daoduyanh-bandep) | Hán Việt từ điển (bản đầy đủ, đẹp) |
| [hoa-hoc-dai-cuong-1-cau-tao-chat-tran-thanh-hue](https://archive.org/details/hoa-hoc-dai-cuong-1-cau-tao-chat-tran-thanh-hue) | Hoa Hoc Dai Cuong 1 Cau Tao Chat |
| [hoctap-9.1958](https://archive.org/details/hoctap-9.1958) | Tạp chí Học tập, số 9, năm 1958 |
| [hon-don-va-hai-hoa-trinh-xuan-thuan](https://archive.org/details/hon-don-va-hai-hoa-trinh-xuan-thuan) | Hỗn độn và hài hòa |
| [ky_thuat_an_toan_trong_phong_thi_nghiem_hoa_hoc_ts_tran_kim_tien_2_806](https://archive.org/details/ky_thuat_an_toan_trong_phong_thi_nghiem_hoa_hoc_ts_tran_kim_tien_2_806) | Kỹ Thuật An Toàn Trong phòng Thí Nghiệm Hoá Học |
| [lang-du-trong-van-hoa-viet-nam](https://archive.org/details/lang-du-trong-van-hoa-viet-nam) | Lãng Du Trong Văn Hóa Việt Nam |
| [lich-su-bao-chi-viet-nam-18651945-do-quang-hung-nguyen-thanh-duong-trung-quoc](https://archive.org/details/lich-su-bao-chi-viet-nam-18651945-do-quang-hung-nguyen-thanh-duong-trung-quoc) | Lịch Sử Báo Chí Việt Nam 1865-1945 |
| [lich-su-trung-can-dong-nguyen-thi-thu-nguyen-hong-bich-nguyen-van-son](https://archive.org/details/lich-su-trung-can-dong-nguyen-thi-thu-nguyen-hong-bich-nguyen-van-son) | Lịch Sử Trung Cận Đông |
| [lich-su-van-hoa-the-gioi-luong-ninh](https://archive.org/details/lich-su-van-hoa-the-gioi-luong-ninh) | Lịch Sử Văn Hóa Thế Giới Cổ Trung Đại |
| [lich-su-vat-ly-hoc-dao-van-phuc](https://archive.org/details/lich-su-vat-ly-hoc-dao-van-phuc) | Lịch Sử Vật Lí Học |
| [lich-su-vuong-quoc-thai-lan-le-van-quang](https://archive.org/details/lich-su-vuong-quoc-thai-lan-le-van-quang) | Lịch Sử Vương Quốc Thái Lan |
| [luyen-van-1-nguyen-hien-le](https://archive.org/details/luyen-van-1-nguyen-hien-le) | Luyện Văn  |
| [nguoi-viet-pham-chat-va-thoi-hu-tat-xau](https://archive.org/details/nguoi-viet-pham-chat-va-thoi-hu-tat-xau) | Người Việt - Phẩm Chất - Thói Hư Và Tật Xấu |
| [nha-tho-cong-giao-oviet-nam-kien-truc-lich-su](https://archive.org/details/nha-tho-cong-giao-oviet-nam-kien-truc-lich-su) | Nhà Thờ Công Giáo Ở Việt Nam Kiến Trúc - Lịch Sử |
| [nhat-ky_202203](https://archive.org/details/nhat-ky_202203) | Nhật Ký Đặng Thùy Trâm |
| [nhung-cay-thuoc-va-vi-thuoc-vie-do-tat-loi](https://archive.org/details/nhung-cay-thuoc-va-vi-thuoc-vie-do-tat-loi) | Những cây thuốc và vị thuốc Việt Nam |
| [nhung-nguoi-cung-thoi](https://archive.org/details/nhung-nguoi-cung-thoi) | Những Người Cùng Thời  |
| [phan-lan-ngoi-sao-phuong-bac-vo-xuan-que](https://archive.org/details/phan-lan-ngoi-sao-phuong-bac-vo-xuan-que) | Phần Lan – Ngôi sao phương bắc |
| [phan-tich-dinh-luong-nguyen-thi-thu-van](https://archive.org/details/phan-tich-dinh-luong-nguyen-thi-thu-van) | Phân Tích Định Lượng |
| [phan-tich-du-lieu-voi-r-nguyen-van-tuan](https://archive.org/details/phan-tich-du-lieu-voi-r-nguyen-van-tuan) | Phân tích dữ liệu với R |
| [phuong-phap-nghien-cuu-khoa-hoc-suc-khoe-pham-van-linh](https://archive.org/details/phuong-phap-nghien-cuu-khoa-hoc-suc-khoe-pham-van-linh) | Phương Pháp Nghiên Cứu Khoa Học Sức Khỏe  |
| [qua_trinh_va_thiet_bi_cong_nghe_hoa_hoc_va_thuc_pham_tap_3_truyen_khoi_1_3496](https://archive.org/details/qua_trinh_va_thiet_bi_cong_nghe_hoa_hoc_va_thuc_pham_tap_3_truyen_khoi_1_3496) | Quá trình và thiết bị CNHH&TP. Tập 3: Truyền khối |
| [quang-doi-sau-lung](https://archive.org/details/quang-doi-sau-lung) | Quãng đời sau lưng |
| [sa-ch-scan-co-so-ly-thuyet-cac-phan-ung-hoa-hoc-tran-thi-da-da-mo-khoa](https://archive.org/details/sa-ch-scan-co-so-ly-thuyet-cac-phan-ung-hoa-hoc-tran-thi-da-da-mo-khoa) | Cơ Sở Lý Thuyết Các Phản Ứng Hóa Học |
| [sa-ch-scan-ky-thuat-san-xuat-vat-lieu-gom-su-do-quang-minh-unlocked](https://archive.org/details/sa-ch-scan-ky-thuat-san-xuat-vat-lieu-gom-su-do-quang-minh-unlocked) | Kỹ Thuật Sản Xuất Vật Liệu Gốm Sứ |
| [sa-ch-scan-phuong-phap-co-lap-hop-chat-huu-co-nguyen-kim-phi-phung-da-mo-khoa](https://archive.org/details/sa-ch-scan-phuong-phap-co-lap-hop-chat-huu-co-nguyen-kim-phi-phung-da-mo-khoa) | Phương Pháp Cô Lập Hợp Chất Hữu Cơ |
| [sai-gon-chuyen-doi-cua-pho-pham-cong-luan](https://archive.org/details/sai-gon-chuyen-doi-cua-pho-pham-cong-luan) | Sài Gòn - Chuyện Đời Của Phố |
| [tam-ly-gia-dinh-nguyen-khac-vien](https://archive.org/details/tam-ly-gia-dinh-nguyen-khac-vien) | Tam Ly Gia Dinh |
| [thuc-vat-duoc-truong-thi-dep](https://archive.org/details/thuc-vat-duoc-truong-thi-dep) | Thực Vật Dược |
| [toi-he-mat-troi-xa-la-le-toan](https://archive.org/details/toi-he-mat-troi-xa-la-le-toan) | Tới hệ mặt trời xa lạ |
| [tong-tap-van-hoc-viet-nam-19-ntg-2000](https://archive.org/details/tong-tap-van-hoc-viet-nam-19-ntg-2000) | Tong Tap Van Hoc Viet Nam 19 Ntg 2000 |
| [tong-tap-van-hoc-viet-nam-20-ntg-2000](https://archive.org/details/tong-tap-van-hoc-viet-nam-20-ntg-2000) | Tong Tap Van Hoc Viet Nam 20 Ntg 2000 |
| [tong-tap-van-hoc-viet-nam-28-ntg-2000](https://archive.org/details/tong-tap-van-hoc-viet-nam-28-ntg-2000) | Tong Tap Van Hoc Viet Nam 28 Ntg 2000 |
| [truyen-ke-ve-109-nguyen-to-hoa-hoc](https://archive.org/details/truyen-ke-ve-109-nguyen-to-hoa-hoc) | Truyện Kể Về 109 Nguyên Tố Hóa Học |
| [truyen-tay-bac](https://archive.org/details/truyen-tay-bac) | Truyện Tây Bắc |
| [tu-dien-hu-tu-han-ngu-co-dai-va-hien-dai-tran-van-chanh](https://archive.org/details/tu-dien-hu-tu-han-ngu-co-dai-va-hien-dai-tran-van-chanh) | Từ điển hư từ Hán ngữ cổ đại và hiện đại |
| [tu-dien-phap-viet-vien-ngon-ngu-hoc](https://archive.org/details/tu-dien-phap-viet-vien-ngon-ngu-hoc) | Từ Điển Pháp  - Việt |
| [tu-dien-tieng-hoa-lam-hoa-chiem](https://archive.org/details/tu-dien-tieng-hoa-lam-hoa-chiem) | Từ điển Việt - Hoa |
| [tu-dien-tieng-viet-vien-ngon-ngu-hoc](https://archive.org/details/tu-dien-tieng-viet-vien-ngon-ngu-hoc) | Từ điển tiếng Việt (Từ điển Hoàng Phê) |
| [tu-dien-trai-nghia-dong-nghia-tieng-viet-duong-ky-duc-vu-quang-hao](https://archive.org/details/tu-dien-trai-nghia-dong-nghia-tieng-viet-duong-ky-duc-vu-quang-hao) | Từ Điển Trái Nghĩa Đồng Nghĩa Tiếng Việt |
| [tu-dien-truyen-kieu-dao-duy-anh](https://archive.org/details/tu-dien-truyen-kieu-dao-duy-anh) | Từ Điển Truyện Kiều |
| [tu-hoc-mot-nhu-cau-thoi-dai-nguyen-hien-le](https://archive.org/details/tu-hoc-mot-nhu-cau-thoi-dai-nguyen-hien-le) | Tự Học Một Nhu Cầu Của Thời Đại |
| [tu-hoc-toc-ky-nguyen-hanh](https://archive.org/details/tu-hoc-toc-ky-nguyen-hanh) | Tu Hoc Toc Ky |
| [tu-sa-ch-nha-t-nghe-tinh-chuye-n-nga-nh-co-d-ie-n-tu](https://archive.org/details/tu-sa-ch-nha-t-nghe-tinh-chuye-n-nga-nh-co-d-ie-n-tu) | Sổ tay chuyên ngành cơ điện tử |
| [tuc-ngu-ca-dao-viet-nam-tuyen-chon-bui-van-vuong](https://archive.org/details/tuc-ngu-ca-dao-viet-nam-tuyen-chon-bui-van-vuong) | Tục ngữ, ca dao Việt Nam - Tuyển chọn |
| [tuyen-tap-thanh-ngu-tuc-ngu-ca-dao-viet-anh](https://archive.org/details/tuyen-tap-thanh-ngu-tuc-ngu-ca-dao-viet-anh) | Tuyển Tập Thành Ngữ Tục Ngữ Ca Dao Việt - Anh Thông Dụng |
| [van-hoa-ton-giao-tin-nguong-viet-nam](https://archive.org/details/van-hoa-ton-giao-tin-nguong-viet-nam) | Văn Hóa Tôn Giáo Tín Ngưỡng Việt Nam |
| [van-hoc-phuong-tay](https://archive.org/details/van-hoc-phuong-tay) | Van Hoc Phuong Tay |
| [van-minh-vat-chat-cua-nguoi-viet-phan-cam-thuong](https://archive.org/details/van-minh-vat-chat-cua-nguoi-viet-phan-cam-thuong) | Văn minh vật chất của người Việt  |
| [vhtt-so-01-2023](https://archive.org/details/vhtt-so-01-2023) | VHTT So 01 2023 |
| [vietnam-thoi-phap-do-ho-nguyen-the-anh-1970](https://archive.org/details/vietnam-thoi-phap-do-ho-nguyen-the-anh-1970) | Vietnam Thoi Phap Do Ho Nguyen The Anh 1970 |

**Bản dịch tiếng Việt còn trong thời hạn bảo hộ của dịch giả/nhà xuất bản (nhãn trên Archive do người đăng tự chọn).** (36 mục)

| Mã mục Archive.org | Tên trên trang nguồn |
|---|---|
| [am-thuc-trung-quoc-luu-quan-nhu](https://archive.org/details/am-thuc-trung-quoc-luu-quan-nhu) | Ẩm thực Trung Quốc  |
| [anabasis-cuoc-hanh-quan-cua-muoi-ngan-nguoi](https://archive.org/details/anabasis-cuoc-hanh-quan-cua-muoi-ngan-nguoi) | Anabasis – Cuộc Hành Quân Của Mười Ngàn Người PDF / Xenophon / Lịch Sử Hy Lạp Cổ Đại Và Đế |
| [andersen-nguoi-ke-chuyen-co-tich](https://archive.org/details/andersen-nguoi-ke-chuyen-co-tich) | Andersen Nguoi Ke Chuyen Co Tich |
| [bai-tap-va-loi-giai-vat-ly-nguyen-tu-hat-nhan](https://archive.org/details/bai-tap-va-loi-giai-vat-ly-nguyen-tu-hat-nhan) | Bài Tập Và Lời Giải Vật Lý Nguyên Tử Hạt Nhân |
| [cay-xanh-ri-rao-a-lech-xay-mu-xa-top](https://archive.org/details/cay-xanh-ri-rao-a-lech-xay-mu-xa-top) | Cây Xanh Rì Rào |
| [chu-han](https://archive.org/details/chu-han) | Tìm Về Cội Nguồn Chữ Hán |
| [chu-han-trung-quoc-han-giam-duong](https://archive.org/details/chu-han-trung-quoc-han-giam-duong) | Chữ Hán Trung Quốc |
| [chu-nghia-de-quoc-giai-doan-tot-cung-cua-chu-nghia-tu-ban](https://archive.org/details/chu-nghia-de-quoc-giai-doan-tot-cung-cua-chu-nghia-tu-ban) | Chủ nghĩa đế quốc, giai đoạn tột cùng của chủ nghĩa tư bản |
| [co-hoc-vat-ran-jean-marie-brebec](https://archive.org/details/co-hoc-vat-ran-jean-marie-brebec) | Cơ Học Vật Rắn |
| [co-so-cua-hinh-hoc-1](https://archive.org/details/co-so-cua-hinh-hoc-1) | Cơ Sở Của Hình Học |
| [d99958ab-0601-4ee3-ba49-b597c2d80916](https://archive.org/details/d99958ab-0601-4ee3-ba49-b597c2d80916) | Vũ Trụ |
| [dau-xanh-tuoi-tre-dostoievski](https://archive.org/details/dau-xanh-tuoi-tre-dostoievski) | Đầu Xanh Tuổi Trẻ |
| [dia-ly-trung-quoc-trinh-binh](https://archive.org/details/dia-ly-trung-quoc-trinh-binh) | Địa Lý Trung Quốc |
| [do-dong-trung-quoc-ly-hung](https://archive.org/details/do-dong-trung-quoc-ly-hung) | Đồ đồng Trung Quốc  |
| [do-noi-that-trung-quoc-truong-hieu-minh](https://archive.org/details/do-noi-that-trung-quoc-truong-hieu-minh) | Đồ nội thất Trung Quốc |
| [doc-sach-nhu-mot-nghe-thuat-martimer-jadler](https://archive.org/details/doc-sach-nhu-mot-nghe-thuat-martimer-jadler) | Đọc sách như một nghệ thuật |
| [ebook_ban_an_che_do_thuc_dan_phap_3394](https://archive.org/details/ebook_ban_an_che_do_thuc_dan_phap_3394) | Bản Án Chế Độ Thực Dân Pháp |
| [friedrich_august_hayek_new_pdf_p1_9042](https://archive.org/details/friedrich_august_hayek_new_pdf_p1_9042) | Cuộc cách mạng ngược trong khoa học các nghiên cứu về sự lạm dụng lí tính |
| [giamilia-truyen-nui-doi-va-th-tsinghiz-aitomatop](https://archive.org/details/giamilia-truyen-nui-doi-va-th-tsinghiz-aitomatop) | Giamilia - Truyện Núi Đồi Và Thảo Nguyên |
| [hieu-het-ve-triet-hoc](https://archive.org/details/hieu-het-ve-triet-hoc) | How Philosophy Works - Hiểu Hết Về Triết Học |
| [lagin-lazar-ong-gia-khottabut-nguyen-truong-tan-dich](https://archive.org/details/lagin-lazar-ong-gia-khottabut-nguyen-truong-tan-dich) | Ông Già Khottabut |
| [matter-dk-eyewitness-books-by-christopher-cooper-z-lib.org](https://archive.org/details/matter-dk-eyewitness-books-by-christopher-cooper-z-lib.org) | Matter ( DK Eyewitness Books) |
| [nghe-thuat-viet-luan-van-michel-beaud](https://archive.org/details/nghe-thuat-viet-luan-van-michel-beaud) | Nghệ thuật viết luận văn |
| [ngu-ngon-aesop-nhung-cau-chuyen-bi-lang-quen-fiona-waters-fulvio-testa_202506](https://archive.org/details/ngu-ngon-aesop-nhung-cau-chuyen-bi-lang-quen-fiona-waters-fulvio-testa_202506) | Ngu Ngon Aesop Nhung Cau Chuyen Bi Lang Quen Fiona Waters & Fulvio Testa |
| [nhung-nguoi-sinh-vien-iu-ri-tri-pho-nop](https://archive.org/details/nhung-nguoi-sinh-vien-iu-ri-tri-pho-nop) | Những Người Sinh Viên |
| [phe-phan-ly-tinh-thuan-tuy-immanuel-kant](https://archive.org/details/phe-phan-ly-tinh-thuan-tuy-immanuel-kant) | Phe Phan Ly Tinh Thuan Tuy |
| [phineas-pta-ebooks-collection](https://archive.org/details/phineas-pta-ebooks-collection) | Tuyển tập các tác phẩm văn học kinh điển nước ngoài |
| [picture-oxford-dictionary-english-vietnam](https://archive.org/details/picture-oxford-dictionary-english-vietnam) | Từ điển hình ảnh Anh - Việt |
| [quang-hoc-song-jean-marie-brebec](https://archive.org/details/quang-hoc-song-jean-marie-brebec) | Quang Học Sóng |
| [so-phan-mot-con-nguoi-mikhail-sholokhov](https://archive.org/details/so-phan-mot-con-nguoi-mikhail-sholokhov) | Số phận một con người (tập truyện) |
| [son-lam-em-dem-leon-tolstoi](https://archive.org/details/son-lam-em-dem-leon-tolstoi) | Sơn Lâm Êm Đềm  |
| [song-jean-marie-brebec](https://archive.org/details/song-jean-marie-brebec) | Sóng |
| [than-khuc](https://archive.org/details/than-khuc) | Thần Khúc |
| [tolstoy-lev-kien-va-chim-bo-cau](https://archive.org/details/tolstoy-lev-kien-va-chim-bo-cau) | Kiến Và Chim Bồ Câu |
| [truyen-thuyet-than-thoai-trung-quoc-tran-lien-son](https://archive.org/details/truyen-thuyet-than-thoai-trung-quoc-tran-lien-son) | Truyền Thuyết Thần Thoại Trung Quốc |
| [tu-ban-quyen-1](https://archive.org/details/tu-ban-quyen-1) | Tư bản (Quyển I) |

**Không phải sách tiếng Việt (yêu cầu kho chỉ gồm sách tiếng Việt).** (4 mục)

| Mã mục Archive.org | Tên trên trang nguồn |
|---|---|
| [CapturedVietnameseRecordsLoosePages1](https://archive.org/details/CapturedVietnameseRecordsLoosePages1) | Captured Vietnamese Records, Loose Pages 1 |
| [ChineseLanguageSeedAndItsApplications](https://archive.org/details/ChineseLanguageSeedAndItsApplications) | Chinese Language Seed And Its Applications |
| [MemorizablePublic-keyCryptographymepkcItsApplications](https://archive.org/details/MemorizablePublic-keyCryptographymepkcItsApplications) | Memorizable Public-Key Cryptography (MePKC) & Its Applications |
| [MemorizablePublic-keyCryptographymepkcItsApplicationsversion3.0](https://archive.org/details/MemorizablePublic-keyCryptographymepkcItsApplicationsversion3.0) | Memorizable Public-Key Cryptography (MePKC) & Its Applications (version 3.0) |

**Gắn nhãn phạm vi công cộng nhưng là ấn phẩm hiện đại (xuất bản sau 2000), nhãn do người đăng tự chọn.** (1 mục)

| Mã mục Archive.org | Tên trên trang nguồn |
|---|---|
| [VIETNAMNUOCTOIPhamTranAnh](https://archive.org/details/VIETNAMNUOCTOIPhamTranAnh) | VIET NAM NUOC TOI - Pham Tran Anh |

## 4. Cách tái hiện

```powershell
python scripts/prepare_library.py --src 'E:\sach' --staging du-lieu-thu/library-staging --offline
```

Phải in ra `255 sách`. Trên máy chủ: `SELECT COUNT(*) FROM docs WHERE col='libraryBooks'` ra 255. Danh sách đầy đủ: [05-danh-sach-sach.md](05-danh-sach-sach.md).
