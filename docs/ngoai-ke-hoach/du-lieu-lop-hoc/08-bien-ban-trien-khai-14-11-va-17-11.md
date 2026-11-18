# 08. Biên bản triển khai lên máy chủ thật (14/11 và 17/11/2026)
> **NGOÀI KẾ HOẠCH CỦA NHÓM.** Phần việc này do Trương Thanh Vui làm riêng, không thuộc kế hoạch tuần 5, 6, 7 và không tính vào khối lượng các việc theo kế hoạch của nhóm. Đọc để hiểu một phần việc riêng, không dùng để đánh giá tiến độ kế hoạch.

Người thực hiện: Trương Thanh Vui (cùng Claude Code). Máy chủ `192.168.2.187`, tài khoản `studytask`, dữ liệu `/var/lib/studytask`, trang https://sutdytask.io.vn. Nội dung thay đổi: xem [07](07-hoc-phan-mo-khoa-tiet-tuan-avatar.md). Biên bản lần trước: [05](05-bien-ban-trien-khai-12-11.md).

## 1. Tóm tắt các lần triển khai

| Ngày | Việc | Sao lưu trước khi làm | Kết quả chính |
|---|---|---|---|
| 12/11 | Nâng cấp phân công theo học phần mở (`--upgrade-assignments`) | `~/loadtest/backup-truoc-nang-cap-phan-cong-2026-11-12.db` | Đã ghi ở 05 và các bản ghi sau đó; số liệu cụ thể xem 05 |
| 14/11 | Gắn ảnh đại diện cho sinh viên (`assign_avatars.py`) | `~/loadtest/backup-truoc-gan-avatar-2026-11-14.db` | 982 sinh viên mỗi người một ảnh riêng; chmod 755 thư mục ảnh để nginx phục vụ (tránh lại lỗi 403 như V-17); `deploy.sh` đã tự chmod |
| 17/11 | Nạp lại dữ liệu theo học phần mở, bảng 16 tiết, thời khóa biểu theo tuần, môn hướng dẫn; cài lại API và giao diện | `~/loadtest/backup-truoc-nap-tiet-tuan-2026-11-17.db` (`quick_check` = ok, 2.051 tài khoản) | Chi tiết ở mục 2 |

Việc đáng lưu ý: `smartctl -t long /dev/sda` được chạy trên cùng máy trong tuần 7 (kết quả ghi ở tài liệu tuần 7 của nhóm: dừng sớm, read failure tại LBA 705216). Việc nạp 17/11 chỉ làm sau khi phép kiểm tra SMART này kết thúc và dùng `ionice -c3` để giảm ảnh hưởng ghi đĩa.

## 2. Triển khai 17/11

**Chuẩn bị:** thử bản mới trên máy cá nhân với dữ liệu mẫu; chạy toàn bộ kiểm thử (mục 4); sao lưu CSDL như bảng trên.

**Nạp dữ liệu:** `scripts/seed_curriculum.py --replace --force-merge --preset medium` (chỉ xóa và ghi bản ghi có nhãn `seed`, tài khoản thật giữ nguyên), chạy ưu tiên thấp (`nice`, `ionice -c3`), sau đó chạy `assign_avatars.py` để gắn lại ảnh cho sinh viên mới. Không dừng dịch vụ.

**Cài mã:** chạy `deploy.sh` trên máy chủ; kết quả hiển thị phiên bản giao diện `v202611170853`. Băm SHA-256 của `studytask_api.py` trên máy chủ khớp bản trong kho (tiền tố `e347e9426b5395ba`).

**Số liệu sau khi nạp (đo trên máy chủ):**

| Hạng mục | Giá trị |
|---|---|
| Sinh viên | 982 |
| Giáo viên | 44 |
| Học phần mở | 148 (trong đó 12 học phần hướng dẫn) |
| Buổi học / buổi thi | 1.360 / 1.360 |
| Buổi học của học kỳ hiện tại | 190 buổi mỗi tuần |
| Tài liệu PDF | 172 tệp, 28 MB |
| Tài liệu dùng chung (`sharedData`) | khoảng 2,0 MB |
| Thời gian nạp / ghi đĩa | 41 giây / khoảng 19 MB (với `ionice -c3`) |
| Ảnh đại diện | 982 (mỗi sinh viên một ảnh riêng) |

**Kiểm tra sau khi nạp (đều đạt):**
- Sinh viên đăng nhập chỉ thấy lớp của mình và học kỳ hiện tại.
- Mỗi học phần có từ 1 đến 3 giáo viên.
- 12 học phần hướng dẫn không có buổi học và không có lịch thi.
- Trang công khai trả HTTP 200.

## 3. Cách quay lại

- CSDL: chép lại `~/loadtest/backup-truoc-nap-tiet-tuan-2026-11-17.db` vào `/var/lib/studytask` khi dịch vụ đã dừng, rồi khởi động lại dịch vụ.
- Chỉ gỡ dữ liệu mẫu: `seed_curriculum.py --purge` (xóa bản ghi nhãn `seed`, kể cả tệp ảnh đại diện và dấu `seed_avatars_v1`); `assign_avatars.py --remove` chỉ gỡ ảnh.
- Giao diện/API: cài lại bản của nhánh `master` bằng `deploy.sh`.

## 4. Kiểm thử đã chạy (trên máy cá nhân, trước khi triển khai)

| Lệnh | Kết quả |
|---|---|
| `npm run test:logic` | 113 kiểm tra đạt |
| `python tests/server/test_*.py` (18 bộ: gồm `test_seed_curriculum`, `test_class_scope`, `test_assign_avatars`, `test_teacher_limit`) và `test_submit.sh` | Đạt toàn bộ |

Các bước này đã được thêm vào `.github/workflows/ci.yml` (`class_scope`, `assign_avatars`, `teacher_limit`). Kết quả chạy lại trên nhánh PR: `[điền sau khi CI chạy]`.

## 5. Việc chưa làm và rủi ro

- Mã đã triển khai lên máy chủ **trước khi** có Approve của PR (cùng cách làm với 05); cần PR này được review và gộp để kho khớp với máy chủ. Nếu triển khai lại từ `master` khi chưa gộp, sẽ mất các thay đổi ở 07.
- Chưa đo tải lại sau khi đổi dữ liệu; số đo ở 04 là của dữ liệu trước đợt này.
- Ổ đĩa máy chủ có lỗi đọc tại LBA 705216 (kết quả SMART tuần 7); nên giữ các bản sao lưu ở `~/loadtest` và ổ G, không coi một ổ là đủ.
- Mật khẩu mặc định `<vai trò>123` của tài khoản mẫu vẫn đoán được; tài khoản `admin` thật cần đổi mật khẩu riêng.
