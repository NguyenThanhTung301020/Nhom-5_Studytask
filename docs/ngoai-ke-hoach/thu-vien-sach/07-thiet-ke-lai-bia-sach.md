# 07. Thiết kế lại bìa sách để không nhìn nhầm (22/11/2026)
> **NGOÀI KẾ HOẠCH CỦA NHÓM – KHÔNG THUỘC TUẦN NÀO.** Phần việc do Trương Thanh Vui làm riêng ngày 22/11/2026, sau khi nhóm đã hoàn tất báo cáo tuần. Không thuộc kế hoạch tuần 5, 6, 7, không tính vào khối lượng của nhóm và **không cần đưa vào báo cáo tuần** (việc phụ, mức độ quan trọng thấp). Tài liệu chỉ để lưu vết.

Người thực hiện: Trương Thanh Vui (cùng Claude Code, model Claude Opus 5.5).

## 1. Vấn đề

Sau rà soát lần 3 ([06](06-ra-soat-sach-doc-duoc.md)), 238 sách dựng từ Wikisource dùng chung một mẫu bìa: nền một màu theo thể loại (gần như toàn đỏ sẫm hoặc xanh đậm), tên sách chữ nhỏ ở giữa. Trên trang Thư viện, ảnh bìa thu nhỏ trông gần như giống hệt nhau, rất dễ nhìn nhầm; 43 tiểu thuyết Hồ Biểu Chánh và 57 văn bản luật gần như không phân biệt được. Ngoài ra 10 bản quét Archive có trang đầu là trang trắng hoặc trang chữ (4 số *Khoa-học Tập-chí*, 2 số *Báo Khoa học*, 4 sách chú giải Kinh Thánh), các số cùng tên trông y hệt nhau.

## 2. Cách làm

1. **Tìm bìa gốc (Google, Wikimedia Commons).** Văn bản Wikisource phần lớn được gõ lại từ bản quét gốc lưu trên Wikimedia Commons (nhiều bản do Thư viện Quốc gia Pháp – BnF Gallica số hóa). Với từng sách, tìm tệp quét gốc trên Commons, tải ảnh 3 trang đầu, xem tận mắt và chọn trang bìa.
   - Chỉ dùng bìa **bản in trước năm 1951**: bìa sách thường là tác phẩm khuyết danh của nhà in, thời hạn bảo hộ 75 năm kể từ khi công bố (Điều 27 Luật Sở hữu trí tuệ) đã hết. Commons cũng ghi các tệp này là phạm vi công cộng.
   - Loại bìa của bản tái bản muộn (ví dụ *Việt Nam phong tục* bản Khai Trí, *Việt thi* bản 1956, *Thơ ngụ ngôn La Fontaine* bản 1951), bìa của tuyển tập thơ (bản quét là sách khác), bìa Kinh Thánh 1925 (các quyển giống hệt nhau), bìa tối hoặc trắng trơn.
   - Kết quả: **31 sách dùng ảnh bìa bản in gốc**, ví dụ *Bỏ chồng* (1939), *Tắt đèn* (1939), *Lều chõng* (1941), *Làm đĩ* (1939), *Khối tình con* (1922), *Luân lý giáo khoa thư* (1925). Phần căn cứ bản quyền của từng sách ghi rõ năm in và tên tệp trên Commons.
2. **Thiết kế bìa mới cho các sách còn lại** (`scripts/library_cover_design.py`): mỗi sách là một tổ hợp riêng của
   - 7 bố cục (khung đôi, dải màu, sọc dọc có tên tác giả, chữ cái lớn, vòng tròn, chéo, dãy núi);
   - 24 bảng màu, 10 hoa văn hình học tự vẽ (sóng, tre, sen, chấm, vòng, tia, tam giác, mưa, hồi văn, sọc), 8 phông chữ;
   - nhãn loại sách (VĂN HỌC, TUYỂN THƠ, VĂN BẢN PHÁP LUẬT, KINH THÁNH…).

   Tổ hợp chọn theo mã băm của mã sách (cố định giữa các lần chạy); sách **cùng tác giả hoặc cùng bộ** được ép không trùng bố cục và bảng màu với các sách gần nhất cùng nhóm. Văn bản luật tách tên chính và năm in to (ví dụ "BỘ LUẬT / Dân sự / **2015**"); các tập, quyển in to số tập; các số tạp chí trùng tên in to năm. Không dùng ảnh, logo hay quốc huy của bên thứ ba.
3. **Trang bìa trong PDF** của 238 sách Wikisource được dựng lại bằng cùng thiết kế (`scripts/build_wikisource_books.py` gọi `library_cover_design.cover_html`), kèm dòng nguồn và giấy phép ở chân trang bìa. Nội dung sách không đổi: danh sách trang con được lưu đệm (`subpages.json`) để lần dựng lại dùng đúng danh sách cũ, không gọi lại API Wikisource.
4. **Tránh hiện bìa cũ do bộ nhớ đệm**: `scripts/import_library.py` thêm `?v=<10 ký tự SHA-256 của ảnh>` vào đường dẫn bìa, nên Cloudflare và trình duyệt tải ảnh mới ngay khi bìa đổi.

## 3. Kết quả

| Nguồn ảnh bìa | Số sách |
|---|---|
| Bìa thiết kế mới (Wikisource) | 207 |
| Bìa bản in gốc trên Wikimedia Commons (Wikisource) | 31 |
| Bìa thiết kế mới thay trang đầu trắng hoặc trang chữ (Archive) | 10 |
| Giữ trang bìa thật của bản quét (Archive) | 14 |
| **Tổng** | **262** |

Nguồn bìa từng sách: `scripts/data/thu-vien-bia.json`. Ảnh so sánh trước và sau: thư mục `bang-chung/` (`bia-truoc-22-11.png`, `bia-sau-22-11.png`).

## 4. Cách tái hiện

```powershell
python scripts/build_wikisource_books.py --out 'E:\sach\wikisource-vi' --force
python scripts/prepare_library.py --src 'E:\sach' --staging du-lieu-thu/library-staging --offline
python scripts/library_cover_design.py --out du-lieu-thu/library-staging/covers
```

Sau đó chép `books/`, `covers/` lên máy chủ và chạy `scripts/import_library.py` như ở [02](02-thiet-ke-trien-khai-kiem-thu.md).
