# 09. Thay ảnh đại diện sinh viên bằng ảnh tự vẽ (23/11/2026)
> **NGOÀI KẾ HOẠCH CỦA NHÓM – KHÔNG THUỘC TUẦN NÀO.** Phần việc do Trương Thanh Vui làm riêng ngày 23/11/2026. Không thuộc kế hoạch tuần 5, 6, 7, không tính vào khối lượng của nhóm và **không cần đưa vào báo cáo tuần**. Tài liệu chỉ để lưu vết, thực hiện cam kết về bản quyền ảnh đại diện.

Người thực hiện: Trương Thanh Vui (cùng Claude Code, model Claude Opus 5.5).

## 1. Vấn đề

Ở V-29 ([07](07-hoc-phan-mo-khoa-tiet-tuan-avatar.md)), 982 sinh viên của dữ liệu mẫu được gắn ảnh đại diện lấy từ 1.056 ảnh tải về từ kết quả tìm kiếm Google. Các ảnh này **chưa rõ bản quyền**. Nhóm đã cam kết thay bằng ảnh chữ cái đầu tên hoặc ảnh sinh tự động, hoặc gỡ khỏi bản demo trước khi nghiệm thu.

## 2. Cách làm

1. **Tự vẽ bộ ảnh mới bằng mã** (`scripts/generate_avatars.py`). Mỗi ảnh là một chân dung minh họa phẳng ghép từ các hình cơ bản vẽ bằng SVG:
   - 16 màu nền;
   - 8 màu da, tỉ lệ nghiêng về các tông phổ biến ở sinh viên Việt Nam;
   - 12 kiểu tóc và 10 màu tóc;
   - 14 màu áo và 5 kiểu cổ áo;
   - 4 kiểu mắt và 4 kiểu miệng;
   - phụ kiện: kính tròn, kính vuông, tai nghe, mũ len, kẹp tóc, má hồng.

   Không dùng ảnh chụp, phông chữ, biểu tượng hay mẫu vẽ của bên thứ ba. Ảnh do nhóm tự tạo nên không phụ thuộc giấy phép của ai.
2. **Không trùng, tái tạo được.**
   - Số ảnh **1.056**, bằng kho cũ.
   - Không có hai ảnh trùng phần nhìn thấy rõ (nền, da, tóc, áo, cổ áo).
   - Hạt giống cố định, nên chạy lại cho ra đúng bộ ảnh cũ.
   - Kích thước 256×256, JPEG chất lượng 88, giống ảnh người dùng tự tải lên. Trung bình 6,8 KB/ảnh, tổng 7,1 MB; kho cũ là 19 MB.
3. **Gắn lại cho sinh viên** bằng `scripts/assign_avatars.py` như cũ.
   - Script chỉ thay ảnh do chính nó gắn trước đó (nhãn `avatarSeed: 'avatars-v1'`) và xóa tệp ảnh cũ.
   - Ảnh người dùng tự tải lên qua giao diện giữ nguyên.
4. **Gỡ ảnh cũ.** Trên máy chủ đã xóa:
   - các tệp ảnh cũ trong `uploads/avatars/`;
   - kho ảnh nguồn đã thu nhỏ: `~/avatars-256.tgz`, `~/loadtest/avatars-256`;
   - hai thư mục sao lưu ảnh cũ: `backup-uploads-truoc-doi-khoa/avatars`, `loadtest/backup-uploads-truoc-nap/avatars`.

   Trong kho mã, ảnh chụp danh bạ ngày 14/11 (có ảnh cũ) được gỡ và thay bằng bảng mẫu ảnh mới: [bang-chung/2026-11-23/bo-anh-dai-dien-tu-ve.jpg](bang-chung/2026-11-23/bo-anh-dai-dien-tu-ve.jpg).

## 3. Kết quả kiểm tra

| Mục | Kết quả |
|---|---|
| Sinh viên được thay ảnh | 982/982, mỗi người một ảnh khác nhau |
| Tệp trong `uploads/avatars/` thuộc bộ ảnh mới | 982 (còn 2 ảnh do người dùng tự tải lên, không phải ảnh của script) |
| Tệp còn trùng với kho ảnh cũ | 0 |
| Hồ sơ trỏ tới tệp không tồn tại | 0 |
| Ảnh tải qua https://sutdytask.io.vn/uploads/avatars/… | 200, đúng dung lượng |
| `tests/server/test_generate_avatars.py` (mới, có trong CI) và `test_assign_avatars.py` | Đạt |

Sao lưu CSDL trước khi thay: `~/loadtest/backup-truoc-doi-avatar-2026-11-23.db`.

## 4. Giới hạn

- Ảnh cũ có thể vẫn còn trong các bản sao lưu ra ổ ngoài làm trước ngày 23/11. Bản sao lưu cũ không bị sửa; các bản mới từ nay không còn ảnh cũ.
- Lịch sử git trước đây vẫn chứa ảnh chụp danh bạ 14/11 (chỉ có vài ảnh thu nhỏ). Muốn xóa hẳn khỏi lịch sử phải viết lại lịch sử nhánh `master`, việc này cần nhóm đồng ý.
- Ảnh được gán ngẫu nhiên, không theo giới tính của tên sinh viên.

## 5. Cách tái hiện

```powershell
python scripts/generate_avatars.py --out du-lieu-thu/avatars-tu-tao
```

Chép thư mục lên máy chủ rồi chạy:

```
python3 scripts/assign_avatars.py --data-dir /var/lib/studytask --images ~/avatars-tu-tao
```
