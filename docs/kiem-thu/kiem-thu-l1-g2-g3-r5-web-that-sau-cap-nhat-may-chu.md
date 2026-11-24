# Kiểm thử lại L1, G2, G3, R5 trên website thật sau khi máy chủ cập nhật

- Đối tượng: các mục L1, G2, G3 (đã sửa ở PR72) và R5 nhánh Đào tạo sửa link (PR56). Báo cáo gốc: [`kiem-thu-pr56-r2-r7-web-that.md`](kiem-thu-pr56-r2-r7-web-that.md).
- Website: https://sutdytask.io.vn, build giao diện `v202611230746`. Không dùng localhost.
- Điều kiện: Thanh Vui đã cập nhật máy chủ. Đã xác nhận máy chủ phục vụ `utils/sharedSync.js` (có `recoverFromSaveError`), hộp xóa của `pages/Subjects.js` có tên môn, và `quizFile.js` có xử lý dấu `+`.
- Tài khoản: Phòng Đào tạo `daotao`; sinh viên thử `sv2610019` (Bùi Anh Cường). Người thực hiện tự đăng nhập; Claude Code (AI) thao tác và soạn báo cáo.
- Ngày: 24/11/2026, khoảng 11:40–11:55 giờ Việt Nam.
- Trạng thái: **ĐÃ KIỂM THỬ, ĐÃ DỌN DỮ LIỆU TẠM.**

## 1. Kết quả

| Mã | Kết quả | Chi tiết |
|---|---|---|
| L1 | **ĐẠT** | Xem mục 2 |
| G2 | **ĐẠT** | Xem mục 3 |
| G3 | **ĐẠT** | Xem mục 4 |
| R5 (Đào tạo sửa link phiếu đã có) | **ĐẠT** | Xem mục 5 |

## 2. L1: máy chủ từ chối thì giao diện phải báo và khôi phục

Dữ liệu thử: môn `ZZL1D` (1 TC), tài liệu tạm `zzl1-mat-1`.

| Bước | Thực tế |
|---|---|
| 1. Đào tạo mở trang Môn học, tạo môn ZZL1D | Lưu được; máy chủ 157 môn |
| 2. Thêm tài liệu cho ZZL1D qua `POST /api/doc/sharedData/global/append` (trang không biết) | 200. Thẻ môn trên trang vẫn chưa có số tài liệu |
| 3. Trên trang cũ, bấm Xóa môn ZZL1D rồi Xóa | `PUT /api/doc/sharedData/global` trả **409**; ngay sau đó **1 lệnh GET** tải lại; **không có PUT gửi ngược lên**. Hiện banner đỏ: "Chưa lưu được thay đổi môn học: Chưa bớt được môn ZZ kiem thu L1 (mon D): còn 1 tài liệu. Hãy xử lý các mục đó trước. Màn hình đã được đưa về đúng dữ liệu trên máy chủ." Môn ZZL1D hiện lại kèm "1 tài liệu". Không có `Uncaught (in promise)` |
| 4. Cùng tab, sửa ZZL1D từ 1 lên 2 TC rồi Lưu | `PUT` trả **200**; máy chủ lưu 2 TC |

So với lần 19/11 (409 rồi môn biến mất, không báo, các lần sửa sau đều bị 409): lỗi **đã hết**.

## 3. G2: số có dấu `+`

Gọi `questionsToCsv` của chính web thật (`/v202611230746/utils/quizFile.js`). Phòng Đào tạo không có trang Trắc nghiệm nên không có nút "Xuất CSV" (đúng phân quyền).

| Nội dung ô | Ô trong CSV |
|---|---|
| `+5` | `'+5` |
| `+0,5` | `"'+0,5"` |
| `+84901` | `'+84901` |
| `=1+1`, `@x` | `'=1+1`, `'@x` |
| `-5`, `-0.5`, `5` | giữ nguyên là số |

`+5` không còn bị coi là số nên không mất dấu `+`.

**Mở bằng Excel 16** ([`csv-xuat-tu-web-that-24-11.csv`](anh/l1-g2-g3-r5-web-that/csv-xuat-tu-web-that-24-11.csv), kết quả [`excel-ket-qua.txt`](anh/l1-g2-g3-r5-web-that/excel-ket-qua.txt)): không ô nào là công thức (`HasFormula=False`). B2 hiện `'+5`, `'+0,5`, `'=1+1`, `'@x`, `'+84901` là chuỗi; `-5`, `-0.5`, `5` là số. `+5` không còn mất dấu `+`.

## 4. G3: hộp xóa nêu tên môn

Hộp xác nhận hiện: "Xóa môn ZZL1D – ZZ kiem thu L1 (mon D)? Môn không còn dữ liệu liên quan."

## 5. R5: Đào tạo sửa link minh chứng của phiếu đã có

1. Sinh viên `sv2610019` nộp phiếu thử bằng giao diện (đợt "ZZ phieu thu R5", link `https://example.com/zz-r5`). Trạng thái `submitted`.
2. Đăng nhập `daotao`, gọi `PUT /api/doc/graduationApps/<uid>` với `{data:{evidence}, merge:true}`. Giao diện Đào tạo chỉ có ô trạng thái và ý kiến, không có ô sửa link, nên thử trực tiếp qua API bằng phiên Đào tạo.

| Link gửi lên | Mã trả về | Link sau đó |
|---|---|---|
| `javascript:alert(1)` | **403** permission-denied | không đổi |
| `JAVASCRIPT:alert(1)` | **403** | không đổi |
| `data:text/html,x` | **403** | không đổi |
| `//evil.com` | **403** | không đổi |
| `https://example.com/zz-r5-doi` | **200** | đổi thành link mới |

## 6. Dọn dữ liệu tạm

- Đã xóa tài liệu `zzl1-mat-1` (bằng giao diện) rồi môn `ZZL1D` (bằng giao diện).
- Đã xóa phiếu thử `graduationApps/<uid của sv2610019>` (DELETE 200, không còn tồn tại).
- Dữ liệu dùng chung sau khi dọn: 156 môn, 427 tài liệu, trùng số lượng lúc trước khi thử. Chưa so lại vân tay SHA-256 từng khóa.

## 7. Giới hạn

- Minh chứng ảnh trong [`anh/l1-g2-g3-r5-web-that/`](anh/l1-g2-g3-r5-web-that/): 01 (G3), 02 và 03 (L1), 04 (form phiếu R5). Chụp ở khung trình duyệt hẹp (512 px). Không có ảnh riêng cho 409 và PUT 200; số liệu mạng ghi ở mục 2.
- G2 kiểm hàm xuất CSV của web thật rồi mở bằng Excel; không có nút "Xuất CSV" cho Đào tạo để bấm.
- R5 thử qua API, không qua giao diện Đào tạo (giao diện không có ô sửa link).
