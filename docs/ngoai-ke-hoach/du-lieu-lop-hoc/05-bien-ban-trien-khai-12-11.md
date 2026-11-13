# 05. Biên bản nạp dữ liệu lên máy chủ thật (12/11/2026)
> **NGOÀI KẾ HOẠCH CỦA NHÓM.** Phần việc này do Trương Thanh Vui làm riêng trong 3 tuần, không thuộc kế hoạch tuần 5, tuần 6 và không tính vào khối lượng các việc theo kế hoạch của nhóm. Đọc để hiểu một phần việc riêng, không dùng để đánh giá tiến độ kế hoạch.

Người thực hiện: Trương Thanh Vui (cùng Claude Code). Máy chủ: `192.168.2.187`, tài khoản `studytask`, dữ liệu ở `/var/lib/studytask`.

## 1. Hai lần nạp trong ngày 12/11

| Lần | Nội dung | Kết quả |
|---|---|---|
| Lần 1 (14:08) | Nạp `--preset medium` vào CSDL đang chạy (không dừng dịch vụ); sinh viên chia 8 nhóm theo "học kỳ của khung" | Tài khoản 5 → 2.045 (1.977 sinh viên, 65 giáo viên, 3 phòng ban cũ giữ nguyên); môn 8 → 45; lịch 4 → 674; tài liệu 30 → 363; đề 3 → 114. Phát hiện thư mục `uploads` quyền 750 làm nginx trả 403 (V-17), đã sửa. API và giao diện thật được cài lại lúc 14:58 để có phần lọc theo lớp học phần |
| Lần 2 (15:39, sao lưu lúc 15:37) | Đổi cách lưu sang khóa, năm học và học kỳ 1/2 (xem 02); nạp lại bằng `--replace` | Chi tiết ở mục 2 |

## 2. Lần nạp lại theo khóa và năm học

**Chuẩn bị:**
1. Thử trước trên **bản sao CSDL thật** (sao lưu bằng API sao lưu của SQLite, đặt ở `/tmp`, nạp lại bằng `--replace --force-merge`): xong sau 79 giây; kiểm tra 5 tài khoản thật còn nguyên, 4 khóa, 80 lớp, không còn mã học kỳ kiểu cũ. Xóa bản sao sau khi kiểm.
2. Sao lưu trước khi nạp thật:
   - CSDL: `~/backup-truoc-doi-khoa.db` (3.612 KB; `integrity_check` = ok; 2.045 tài khoản).
   - Tệp tải lên: `~/backup-uploads-truoc-doi-khoa` (390 mục, 119 MB).

**Lệnh nạp** (chạy bằng tài khoản `studytask`, ưu tiên thấp, không dừng dịch vụ):

```bash
nice -n 19 python3 ~/seed-v2/scripts/seed_curriculum.py --data-dir /var/lib/studytask \
    --replace --force-merge --preset medium --workers 2 --nam-hoc 2026 --hoc-ky 1
chmod 600 /var/lib/studytask/seed-accounts.csv
```

**Kết quả** (nạp xong sau 80 giây):

| Hạng mục | Trước | Sau |
|---|---|---|
| Tài khoản | 2.045 | 2.051 (1.977 sinh viên, 71 giáo viên, 3 phòng ban; trong đó có 5 tài khoản thật cũ giữ nguyên) |
| Sinh viên theo khóa | 8 nhóm theo kỳ | 2023-2027: 480; 2024-2028: 514; 2025-2029: 487; 2026-2030: 495 |
| Lớp | 80 (`CNTT222-01` …) | 80 (`CNTT23-01` … `CNTT26-20`) |
| Môn / lịch / lịch thi / tài liệu / đề | 45 / 674 / 373 / 363 / 114 | 45 / 764 / 403 / 363 / 114 |
| Còn `semesterNo` cũ | Có | 0 |
| Toàn vẹn CSDL | | `integrity_check` = ok |

**Kiểm tra sau khi nạp:**
- Đăng nhập thử trên API thật (từ chính máy chủ): `sv2301001` (200), `sv2601001` (200), `gvllct01` (200); tên cũ `sv26101001` bị từ chối (401), đúng như dự kiến.
- Tải một tệp PDF tài liệu qua https://sutdytask.io.vn/uploads/ trả 200.
- Ba dịch vụ `studytask-api`, `nginx`, `cloudflared` đều `active`; trang chủ 200 trong 0,18 giây.
- Danh sách tài khoản `seed-accounts.csv` đặt quyền 600 (chứa mật khẩu mặc định của tài khoản mẫu).

## 3. Cách quay lại

Nếu cần trả về trạng thái trước lần nạp lại (dữ liệu của lần nạp đầu):

```bash
sudo systemctl stop studytask-api
cp /var/lib/studytask/studytask.db ~/studytask.db.sau-doi-khoa      # giữ bản hiện tại, phòng khi cần
rm -f /var/lib/studytask/studytask.db-wal /var/lib/studytask/studytask.db-shm
cp ~/backup-truoc-doi-khoa.db /var/lib/studytask/studytask.db
rsync -a --delete ~/backup-uploads-truoc-doi-khoa/ /var/lib/studytask/uploads/
sudo systemctl start studytask-api
```

Muốn bỏ hẳn dữ liệu mẫu (giữ tài khoản thật): `python3 ~/seed-v2/scripts/seed_curriculum.py --data-dir /var/lib/studytask --purge`.

## 4. Còn dang dở sau lần nạp này

| Việc | Ghi chú |
|---|---|
| Giao diện thật chưa có nhãn "Năm N – Học kỳ 1/2" và ô Khóa | Các sửa này nằm trong máy làm việc, chưa triển khai (V-18) |
| Mã lọc theo lớp, script nạp, bộ đo tải chưa nằm trong `master` | Cần gom vào PR có review rồi triển khai tiếp (V-18) |
| Mật khẩu mặc định đoán được (`student123`, `teacher123`) và tài khoản `admin` thật vẫn dùng mật khẩu đoán được | Chỉ dùng trình diễn; đổi trước khi nộp (V-20) |
| Hai tài khoản thật cũ `student` và `teacher` chưa có khóa và năm học | Admin cập nhật bằng form sửa tài khoản |
| Học kỳ 2 chưa có lớp và lịch | Ngoài phạm vi (không mở rộng). Nếu cần kiểm thử, chạy lại với `--hoc-ky 2`; lúc đó các môn học kỳ chẵn (ngoại ngữ, kỹ năng, khóa luận) mới có lớp |
| Cấu hình tài khoản thật, mật khẩu và nginx của bản đo tải riêng (cổng 8081, 8788) | Chưa bật trên máy chủ; bản đo tải chạy bằng API riêng cổng 8788 |
