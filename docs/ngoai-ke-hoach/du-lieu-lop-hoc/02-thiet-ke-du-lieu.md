# 02. Thiết kế dữ liệu: khóa, năm học, học kỳ 1/2, lớp
> **NGOÀI KẾ HOẠCH CỦA NHÓM.** Phần việc này do Trương Thanh Vui làm riêng trong 3 tuần, không thuộc kế hoạch tuần 5, tuần 6 và không tính vào khối lượng các việc theo kế hoạch của nhóm. Đọc để hiểu một phần việc riêng, không dùng để đánh giá tiến độ kế hoạch.

## 1. Vấn đề của cách lưu ban đầu

Bản nạp đầu tiên (12/11, 14:08) chia sinh viên theo **8 nhóm, mỗi nhóm một "học kỳ của khung"** (HK1 … HK8), mỗi nhóm một khóa riêng (mã `261`, `252`, …, `222`) và lưu `semesterNo` (kỳ số mấy) trong hồ sơ, `semester: "HK6"` trong hồ sơ cá nhân.

Cách này **không giống cách các trường lưu thật**: sinh viên được ghi theo **khóa** (ví dụ 2022-2026, 2023-2027), còn thời điểm học thì gọi là **học kỳ 1 hoặc học kỳ 2 của một năm học**; số thứ tự học kỳ trong cả khóa (1 đến 8) chỉ là vị trí của môn trong khung. Hai hệ quả sai lệch của bản đầu:
- Cùng một thời điểm mà có tới 8 "khóa" ở 8 học kỳ khác nhau, trong khi thực tế chỉ có 4 khóa, mỗi khóa cùng học một học kỳ.
- Hồ sơ lưu một con số "kỳ" thay vì khóa; người quản trị không đọc ra được sinh viên thuộc khóa nào, năm thứ mấy.

## 2. Cách lưu mới

**Nguyên tắc:** lưu **khóa**, **năm học** và **học kỳ 1/2 của năm**. Năm thứ và vị trí trong khung được **suy ra**, không lưu.

Tại thời điểm "học kỳ 1, năm học 2026-2027" (mặc định tính theo ngày chạy: học kỳ 1 từ tháng 8 đến hết tháng 1, học kỳ 2 từ tháng 2 đến tháng 7):

| Khóa | Năm thứ | Học kỳ của khung đang học | Số lớp | Số sinh viên |
|---|---|---|---|---|
| 2023-2027 | 4 | HK7 | 20 | 480 |
| 2024-2028 | 3 | HK5 | 20 | 514 |
| 2025-2029 | 2 | HK3 | 20 | 487 |
| 2026-2030 | 1 | HK1 | 20 | 495 |

Công thức suy ra (có trong `utils/scope.js`, có kiểm thử):
- Năm thứ = (năm bắt đầu năm học) − (năm bắt đầu khóa) + 1.
- Vị trí trong khung = 2 × (năm thứ − 1) + học kỳ 1/2 của năm. Ví dụ khóa 2023-2027, năm học 2026-2027, học kỳ 1 → 2 × 3 + 1 = HK7.
- Hiển thị môn: `hocKy` 1..8 → "Năm N – Học kỳ 1/2" (HK3 → "Năm 2 – Học kỳ 1").

**Về khóa 2022-2026 (ví dụ trong yêu cầu):** vào học kỳ 1 năm học 2026-2027 khóa này đã ra trường (hoàn thành HK8 ở học kỳ 2 năm học 2025-2026), nên không xuất hiện. Nếu cần có khóa này (mô phỏng "đang là học kỳ 2 năm 2025-2026"), chạy với `--nam-hoc 2025 --hoc-ky 2`.

## 3. Các trường dữ liệu

| Nơi lưu | Trường |
|---|---|
| `user/<uid>` của sinh viên | `cohort` (`2023-2027`), `namHoc` (`2026-2027`), `hocKy` (1 hoặc 2), `namThu` (1–4), `classId`, `className`, `studentId`, `subjectIds` |
| `userData/<uid>.profile` | `cohort`, `semester` ("Học kỳ 1 – Năm học 2026-2027"), `className`, `studentId`, `faculty`, `major` |
| `classes/<id>` | `cohort`, `namHoc`, `hocKy`, `namThu`, `size`, `studentUids`, `sections` |
| Môn trong `sharedData/global.subjects` | `hocKy` 1–8 (**vị trí trong khung**), `khoiKienThuc`, `boMon` |
| Chương trình đào tạo `curriculum/khung-cntt-mau` | `cohort` = năm nhập học sớm nhất còn áp dụng khung (`2023`) |
| Giáo viên `user/<uid>` | `sections: [{classId, subjectId}]`, `subjectIds` (môn **được phân công**), `canTeachSubjectIds` (môn thuộc bộ môn), `boMon` |

Không còn: `semesterNo`, `semester: "HK6"`, mã khóa 3 chữ số (`222`).

## 4. Quy ước đặt mã

| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| Lớp | `CNTT` + 2 số cuối năm nhập học + `-` + số lớp 2 chữ số | `CNTT23-01` |
| Sinh viên | `sv` + 2 số cuối năm nhập học + lớp 2 chữ số + số 3 chữ số (mã số sinh viên là phần sau `sv`) | `sv2301001` |
| Giáo viên | `gv` + mã bộ môn + số | `gvlt03` |
| Mật khẩu mặc định | `<vai trò>123` | `student123`, `teacher123` |

## 5. Giáo viên, bộ môn, thời khóa biểu

- **7 bộ môn:** Lý luận chính trị & Pháp luật; Toán; Ngoại ngữ & Kỹ năng; Lập trình; Hệ thống & Mạng; Công nghệ phần mềm & Cơ sở dữ liệu; Trí tuệ nhân tạo & Dữ liệu. Giáo viên cùng bộ môn dạy được mọi môn của bộ môn.
- Mỗi giáo viên nhận tối đa 6 **lớp học phần** (một lớp + một môn). Thiếu thì tự thêm giáo viên. Mỗi bộ môn có ít nhất 2 giáo viên, kể cả bộ môn chưa có lớp học phần ở học kỳ này.
- **Thời khóa biểu:** môn 3–4 tín chỉ học 2 buổi mỗi tuần, môn còn lại 1 buổi; lớp, giáo viên, phòng **không trùng giờ**; có phòng máy riêng cho các môn thực hành.
- **Lịch thi:** mỗi lớp thi các môn của học kỳ cách nhau 2 ngày.

## 6. Quy mô và tham số

| Preset | Sinh viên | Giáo viên | Lớp | Buổi/tuần | Ghi chú |
|---|---|---|---|---|---|
| `small` | ~390 | ~18 | 16 | ~152 | Thử nhanh (~10 s) |
| `medium` (đang nạp thật) | ~1.980 | ~71 | 80 | ~760 | ~80 s |
| `large` | ~8.050 | ~250 | 320 | ~2.680 | `sharedData` 2,7 MB, bằng 54% giới hạn ghi 5 MB |

Lệnh chính (xem đầy đủ trong `docs/van-hanh/10-du-lieu-kiem-tai-tu-khung-dao-tao.md`):

```bash
python3 scripts/seed_curriculum.py --data-dir <thư mục> --preset medium --nam-hoc 2026 --hoc-ky 1
python3 scripts/seed_curriculum.py --data-dir <thư mục> --purge          # xóa đúng dữ liệu của script
python3 scripts/seed_curriculum.py --dry-run --preset medium            # chỉ in kế hoạch
```

## 7. Thay đổi ở giao diện đi kèm

| Nơi | Thay đổi |
|---|---|
| Hồ sơ sinh viên | Có thêm trường "Khóa"; "Học kỳ hiện tại" ghi dạng "Học kỳ 1 – Năm học 2026-2027" |
| Môn học, Lịch học, Quản trị (phân công) | Nhóm và lọc theo "Năm N – Học kỳ 1/2" thay cho "Học kỳ 1..8" |
| Form sửa tài khoản của Admin | Có ô "Khóa" và ghi chú cách nhập học kỳ |
| `utils/scope.js` | Hàm `termLabel`, `studyYear`, `khungPosition`; danh mục lớp theo khóa |

Các thay đổi giao diện này **chưa triển khai lên web thật** (mục 03, V-18).
