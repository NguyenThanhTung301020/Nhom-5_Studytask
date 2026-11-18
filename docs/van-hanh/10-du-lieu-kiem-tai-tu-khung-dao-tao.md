# Dữ liệu kiểm tải sinh từ khung đào tạo

> **NGOÀI KẾ HOẠCH CỦA NHÓM.** Công cụ nạp dữ liệu và đo tải do Trương Thanh Vui làm riêng trong 3 tuần, không thuộc kế hoạch tuần 5, tuần 6. Xem bộ báo cáo ở `docs/ngoai-ke-hoach/du-lieu-lop-hoc/`.

Bộ công cụ nạp dữ liệu giả lập (môn học, thời khóa biểu, tài liệu, trắc nghiệm, tài khoản giáo viên và sinh viên theo học kỳ) vào máy chủ StudyTask để **đo khả năng chịu tải và lưu trữ**. Dữ liệu sinh từ `Khung đào tạo mẫu.docx` (8 học kỳ, 37 học phần, 116 tín chỉ).

| Tệp | Việc làm |
|---|---|
| `scripts/data/khung-dao-tao.json` | Khung đào tạo đã tách từ `.docx` (có thể đọc thẳng `.docx` bằng `--khung`) |
| `scripts/seed_curriculum.py` | Sinh và nạp dữ liệu vào SQLite; `--purge` xóa đúng phần do nó tạo |
| `scripts/loadtest_studytask.py` | `run` (người dùng ảo), `storage` (dung lượng), `disk` (tốc độ ghi đĩa) |
| `deploy/nginx-studytask-loadtest.conf`, `deploy/studytask-api-loadtest.service` | Bản chạy riêng (cổng 8081/8788) để không đụng trang thật |
| `tests/server/test_seed_curriculum.py` | Kiểm thử tự động của bộ sinh dữ liệu (chạy trong CI `server-tests`) |

## 1. Cảnh báo an toàn (đọc trước khi chạy)

Mật khẩu mặc định là **`<vai trò>123`** (`student123`, `teacher123`, và với `--staff`: `admin123`, `training123`, `finance123`) nên **ai cũng đoán được**. Giáo viên ghi được vào `sharedData`; tài khoản admin (`--staff`) quản trị toàn bộ.

- Nạp vào **CSDL của trang đang chạy công khai** (`/var/lib/studytask`, qua Cloudflare Tunnel) là lựa chọn của nhóm khi muốn dữ liệu nằm trong hệ thống thật; thực hiện theo mục 4.1. Script từ chối nếu CSDL đã có tài khoản thật (`--force-merge` mới ép được). Khi đó các tài khoản giáo viên/sinh viên đăng nhập được trên trang công khai bằng mật khẩu đoán được, và **không** nên dùng `--staff` (admin123 = toàn quyền).
- Muốn tách hẳn, dùng **bản chạy riêng**: thư mục dữ liệu `/var/lib/studytask-loadtest`, API cổng 8788, nginx cổng 8081 chỉ mở cho mạng nội bộ, không đưa vào Tunnel (mục 4).
- Chạy lúc ít người dùng: băm mật khẩu và kiểm tải đều dùng hết CPU của máy chủ.

## 2. Dữ liệu được tạo

Dùng đúng lược đồ hiện có (bảng `accounts`, `docs`), không sửa `studytask_api.py`. Mọi bản ghi gắn `seed: "curriculum-v1"`.

| Thành phần | Nơi lưu | Quy ước |
|---|---|---|
| Học phần mở (xem mục 9) | `sharedData/global.subjects` | id 1000+; mỗi bản ghi là một **lần mở** của môn: `khoa`, `namHoc`, `ky` (1\|2), `hocKy` (vị trí trong khung 1–8), `namThu`, `trangThai`, `teachers` (1–3 tên) |
| Chương trình đào tạo | `curriculum/khung-cntt-mau` | Khớp `utils/curriculum.js` (các module theo khối kiến thức) |
| Thời khóa biểu | `sharedData/global.schedule` | Theo **từng học kỳ của từng khóa**: mỗi lớp × học phần 2 buổi/tuần (môn 3–4 TC) hoặc 1 buổi; lớp, giáo viên, phòng **không trùng giờ trong cùng học kỳ**; có `classId`, `khoa`, `namHoc`, `ky`, `startDate`, `endDate` của học kỳ |
| Lịch thi | `sharedData/global.exams` | Theo từng học kỳ: trong khoảng thi của học kỳ (tháng 1 hoặc tháng 6), mỗi lớp thi các môn cách nhau 2 ngày; có `khoa`, `namHoc`, `ky` |
| Tài liệu | `sharedData/global.materials` + tệp PDF thật `uploads/<mã>_<tên>.pdf` | Chỉ học phần đã kết thúc/đang học; mỗi học phần có thư mục riêng nhưng **tệp PDF dùng chung giữa các năm** (giáo trình, slide dùng lại) nên số tệp ít hơn số mục; nội dung PDF ngẫu nhiên |
| Trắc nghiệm | `sharedData/global.quizzes` (không đáp án) + `quizKeys/<id>` | Chỉ học phần đã kết thúc (đề đã đóng) và đang học (đề 1 đã đóng, các đề sau đang mở); hợp lệ theo `quiz_shape_ok` |
| Tài khoản | `accounts` + `user/<uid>` + `userData/<uid>` | Xem bên dưới |
| Lớp | `classes/<id>` | Danh sách sinh viên, giáo viên và buổi học của từng lớp học phần. **API không đọc được** (collection lạ bị từ chối); xem bằng SQL |
| Danh sách đăng nhập | `<data-dir>/seed-accounts.csv` | `username,password,role,uid,class,cohort`, dùng cho `loadtest_studytask.py` |

**Khóa, năm học, học kỳ, lớp.** Sinh viên được lưu như ngoài thực tế: theo **khóa** (`2023-2027`, `2024-2028`, …), **năm học** (`2026-2027`) và **học kỳ 1 hoặc 2 của năm**; không lưu "kỳ số mấy" của khung. Năm thứ suy ra từ khóa và năm học (khóa 2023-2027 vào năm học 2026-2027 là năm thứ 4). Với `--nam-hoc 2026 --hoc-ky 1` (mặc định lấy theo ngày chạy: học kỳ 1 từ tháng 8 đến hết tháng 1, học kỳ 2 từ tháng 2 đến tháng 7) có **4 khóa đang học**: 2023-2027 (năm 4), 2024-2028 (năm 3), 2025-2029 (năm 2), 2026-2030 (năm 1). Cả khóa cùng học một học kỳ của khung tại một thời điểm (năm 1 học HK1, năm 2 học HK3, năm 3 học HK5, năm 4 học HK7), nên học kỳ chẵn của khung (ngoại ngữ, kỹ năng, khóa luận) chưa có lớp ở học kỳ 1 mà sẽ có ở học kỳ 2. Mỗi khóa chia thành `2 × --classes` lớp (tổng số lớp = `--classes` × 8, như trước), **mỗi lớp ngẫu nhiên 20–30 sinh viên**; mỗi lớp là một lớp học phần riêng cho từng môn. Mã lớp `CNTT<2 số cuối năm nhập học>-<số lớp>` (vd `CNTT23-01`).

| Nơi lưu | Trường |
|---|---|
| `user/<uid>` của sinh viên | `cohort` (`2023-2027`), `namHoc` (`2026-2027`), `hocKy` (1 hoặc 2), `namThu` (1–4), `classId`, `className`, `studentId` |
| `userData/<uid>.profile` | `cohort`, `semester` ("Học kỳ 1 – Năm học 2026-2027"), `className`, `studentId`, … |
| `classes/<id>` | `cohort`, `namHoc`, `hocKy`, `namThu` |
| học phần trong `sharedData/global.subjects` | `khoa`, `namHoc`, `ky` là lần mở; `hocKy` 1–8 là vị trí trong khung |
| `curriculum/khung-cntt-mau` | `cohort` = năm nhập học sớm nhất còn áp dụng khung (vd `2023`) |

**Giáo viên.** Gom theo bộ môn (Lý luận chính trị, Toán, Ngoại ngữ & Kỹ năng, Lập trình, Hệ thống & Mạng, CNPM & CSDL, AI & Dữ liệu); `canTeachCodes` = mã các môn của bộ môn (một giáo viên dạy được các môn chung cấu trúc và dạy lại cùng môn ở nhiều năm). **Mỗi học phần mở có từ 1 đến 3 giáo viên** (`--max-teachers`, mặc định 3): các lớp của khóa chia cho họ, khoảng `--classes-per-teacher` (4) lớp mỗi người; ít lớp thì 1 giáo viên, 10 lớp thì 2–3. Tải một giáo viên trong một học kỳ tối đa `--max-load` (8) lớp học phần ≈ 16 buổi/tuần; quá tải thì tạo thêm giáo viên mới thay vì vượt 3 người/học phần. Hồ sơ ghi `sections: [{classId, subjectId}]` và `subjectIds` = các học phần **được phân công** (mọi năm).

**Tài khoản.** Sinh viên `sv<2 số cuối năm nhập học><lớp 2 số><số 3 chữ số>` (vd `sv2301001` = khóa 2023, lớp 01, số 001; mã số sinh viên là phần sau `sv`), giáo viên `gv<bộ môn><số>` (vd `gvlt03`). Đủ cả 7 bộ môn đều có giáo viên; bộ môn chưa có lớp học phần ở học kỳ này (Ngoại ngữ & Kỹ năng ở học kỳ 1) có giáo viên chưa được phân công (`subjectIds` trống). Mật khẩu băm PBKDF2 đúng như máy chủ; script kiểm tra khớp thuật toán trước khi ghi.

### Quy mô

| Preset | Lớp mỗi khóa | Sinh viên | Giáo viên | Học phần mở | Buổi/tuần: cả 8 học kỳ → hiện tại | Tệp PDF | `sharedData` |
|---|---|---|---|---|---|---|---|
| `small` | 3 | 292 | 21 | 148 (1 GV mỗi học phần) | 408 → 57 | 138 tệp, 3 MB | 0,7 MB |
| `medium` (mặc định) | 10 | 982 | 44 | 148 (2–3 GV) | 1.360 → 190 | 172 tệp, 28 MB | 2,0 MB |
| `large` | 16 | 1.599 | 63 | 148 (3 GV) | 2.176 → 304 | 206 tệp, 53 MB | 3,0 MB (59% giới hạn ghi 5 MB) |

`--classes` là số lớp **mỗi khóa** (4 khóa đang học). Nhiều lớp hơn 16 mỗi khóa thì một học phần cần quá 3 giáo viên nên script báo lỗi thay vì vượt trần.

Tinh chỉnh bằng `--classes`, `--max-teachers`, `--classes-per-teacher`, `--max-load`, `--nam-hoc`, `--hoc-ky`, `--slides`, `--quizzes`, `--questions`, `--file-kb MIN,MAX`, `--no-files`. Cùng `--seed` cho cùng danh sách. Xem kế hoạch trước khi ghi: `--dry-run`.

## 3. Chạy trên máy cá nhân

```bash
python scripts/seed_curriculum.py --data-dir ./du-lieu-thu --preset small --staff
STUDYTASK_DATA=./du-lieu-thu STUDYTASK_PORT=8787 python server/studytask_api.py serve      # cửa sổ khác
python scripts/loadtest_studytask.py run --accounts ./du-lieu-thu/seed-accounts.csv --users 20 --duration 30
python scripts/loadtest_studytask.py storage --data-dir ./du-lieu-thu
python scripts/seed_curriculum.py --data-dir ./du-lieu-thu --purge        # dọn
```

## 4. Đẩy lên máy chủ Ubuntu

**Cách A (khuyến nghị): sinh dữ liệu ngay trên máy chủ.** Không phải truyền hàng trăm MB.

```bash
# trên máy của bạn
scp -r scripts server USER@MAYCHU:/tmp/studytask-tools
# trên máy chủ
sudo install -d /opt/studytask-tools && sudo cp -r /tmp/studytask-tools/* /opt/studytask-tools/
sudo install -d -o studytask -g studytask -m 755 /var/lib/studytask-loadtest /var/lib/studytask-loadtest/uploads
sudo -u studytask python3 /opt/studytask-tools/scripts/seed_curriculum.py --data-dir /var/lib/studytask-loadtest --preset medium
```

**Cách B: sinh trên máy bạn rồi đẩy lên**, để đo luôn băng thông tải lên:

```bash
python scripts/seed_curriculum.py --data-dir ./du-lieu-thu --preset medium
rsync -a --info=progress2 ./du-lieu-thu/ USER@MAYCHU:/tmp/du-lieu-thu/
# trên máy chủ
sudo rsync -a /tmp/du-lieu-thu/ /var/lib/studytask-loadtest/ && sudo chown -R studytask:studytask /var/lib/studytask-loadtest
```

**Bật bản chạy riêng** (cần `/opt/studytask/studytask_api.py` đã có, do `deploy/deploy.sh` cài):

```bash
sudo cp deploy/studytask-api-loadtest.service /etc/systemd/system/ && sudo systemctl daemon-reload
sudo systemctl start studytask-api-loadtest
sudo cp deploy/nginx-studytask-loadtest.conf /etc/nginx/sites-available/studytask-loadtest
sudo ln -sf /etc/nginx/sites-available/studytask-loadtest /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx
sudo ufw allow from 192.168.1.0/24 to any port 8081       # chỉ mạng nội bộ; đổi dải cho đúng mạng của bạn
curl -s http://127.0.0.1:8081/api/auth/me                  # phải trả {"user": null}
```

### 4.1 Nạp vào CSDL đang chạy thật (không dừng dịch vụ)

Chạy bằng tài khoản `studytask` (chủ của `/var/lib/studytask`); các bản ghi cũ giữ nguyên, môn/lịch/tài liệu/đề mới ghép vào `sharedData/global` với id từ 1000 trở lên.

```bash
# 1. Sao lưu (API sao lưu của SQLite đã gồm phần WAL) + tệp tải lên
python3 -c "import sqlite3,os;s=sqlite3.connect('file:/var/lib/studytask/studytask.db?mode=ro',uri=True);d=sqlite3.connect(os.path.expanduser('~/backup-truoc-nap.db'));s.backup(d)"
cp -a /var/lib/studytask/uploads ~/backup-uploads-truoc-nap
# 2. Nạp (ưu tiên thấp để không làm chậm người dùng thật; KHÔNG thêm --staff)
nice -n 19 python3 ~/loadtest/tools/scripts/seed_curriculum.py --data-dir /var/lib/studytask --preset medium --workers 2 --force-merge
chmod 600 /var/lib/studytask/seed-accounts.csv
# 3. Hoàn tác khi cần: xóa đúng dữ liệu của script (tài khoản thật giữ nguyên)
python3 ~/loadtest/tools/scripts/seed_curriculum.py --data-dir /var/lib/studytask --purge
```

Sau khi nạp: đăng nhập thử bằng `sv2601001` / `student123` và `gvllct01` / `teacher123`, kiểm tra tài khoản thật cũ vẫn vào được, và tải thử một tệp trong `/uploads/` qua nginx (thư mục `uploads` hiện có quyền 750, nginx chạy bằng `www-data` nên có thể bị 403; nếu vậy cần cấp quyền đọc).

**Đã thực hiện 12/11/2026** (preset `medium`, 80 s): tài khoản 5 → 2.045 (1.977 sinh viên, 65 giáo viên, 3 tài khoản phòng ban cũ giữ nguyên), môn 8 → 45, lịch 4 → 674, tài liệu 30 → 363, đề trắc nghiệm 3 → 114. Đăng nhập qua nginx đúng (`sv26101001`/`student123`, `gvllct01`/`teacher123`; sai mật khẩu 401), 8 môn và 30 tài liệu cũ còn nguyên, đề không lộ đáp án. Bản sao lưu trước khi nạp: `~/loadtest/backup-truoc-nap-du-lieu-2026-11-12.db` và `~/loadtest/backup-uploads-truoc-nap`.
**Nạp lại theo cấu trúc khóa/năm học (12/11/2026, sau lần nạp đầu).** Sinh viên đổi sang lưu theo khóa, năm học và học kỳ 1/2 (xem mục 2). Sao lưu trước bằng API sao lưu của SQLite (`~/backup-truoc-doi-khoa.db`, `integrity_check` = ok) và chép `uploads/` (`~/backup-uploads-truoc-doi-khoa`, 390 mục, 119 MB), rồi chạy `--replace --force-merge --preset medium --workers 2 --nam-hoc 2026 --hoc-ky 1` (80 s, ưu tiên thấp). Kết quả: 2.051 tài khoản (1.977 sinh viên, 71 giáo viên, 3 phòng ban, 5 tài khoản thật cũ giữ nguyên), 80 lớp, 4 khóa (2023-2027: 480, 2024-2028: 514, 2025-2029: 487, 2026-2030: 495 sinh viên), lịch 764 buổi/tuần, thi 403, tài liệu 363, đề 114; không còn `semesterNo`. Đăng nhập thử `sv2301001`, `sv2601001`, `gvllct01` đều 200, tên cũ `sv26101001` bị từ chối (401), tải một tệp PDF qua web trả 200, ba dịch vụ vẫn chạy.

**Phát hiện: `/var/lib/studytask/uploads` quyền 750 làm nginx (`www-data`) trả 403 cho MỌI tệp trong `/uploads/`**, kể cả tệp tải lên từ trước. Đã sửa ngày 12/11/2026 bằng `chmod 755 /var/lib/studytask/uploads` (chỉ thư mục này, không đệ quy; `submissions/` vẫn do API kiểm soát). Sau đó PDF mới và ảnh cũ tải được (HTTP 200), `/uploads/` không liệt kê thư mục (403), `/uploads/submissions/…` vẫn đòi đăng nhập (401). Lưu ý: nếu cài lại bằng `deploy.sh` thì kiểm tra lại quyền này.

## 5. Kiểm tải

Chạy từ **máy khác trong cùng mạng** (để tính cả mạng), mỗi bậc 60 s, dừng khi vượt ngưỡng:

```bash
scp USER@MAYCHU:/var/lib/studytask-loadtest/seed-accounts.csv .
for n in 10 25 50 100 200; do
  python scripts/loadtest_studytask.py run --base http://MAYCHU:8081 --static-base http://MAYCHU:8081 \
    --accounts seed-accounts.csv --users $n --ramp 15 --duration 60 --json ketqua-$n.json || break
done
```

Mỗi người dùng ảo lặp: đăng nhập → `/auth/me` → `sharedData/global` → `userData` → `/doc/user` → `/quiz/mine`, rồi 3–8 thao tác (xem dữ liệu, tải tệp tài liệu, nộp trắc nghiệm một lần mỗi đề), đăng xuất. 5% là giáo viên. Mặc định **KHÔNG ĐẠT** khi lỗi > 1% hoặc p95 > 2.000 ms (`--max-error-rate`, `--max-p95-ms`). `--no-submit` để không ghi kết quả vào CSDL. Máy phát tải là Python nên từ vài trăm người dùng ảo trở lên cần chạy nhiều tiến trình/nhiều máy.

Trong lúc chạy, trên máy chủ: `top`, `vmstat 5`, `sudo journalctl -u studytask-api-loadtest -f`.

**Lưu trữ** (trên máy chủ):

```bash
python3 /opt/studytask-tools/scripts/loadtest_studytask.py storage --data-dir /var/lib/studytask-loadtest --check
python3 /opt/studytask-tools/scripts/loadtest_studytask.py disk --data-dir /var/lib/studytask-loadtest --mb 1000
```

`storage` in dung lượng CSDL/WAL, tệp tải lên, từng collection, ổ đĩa còn trống và cảnh báo khi `sharedData/global` gần 5 MB. `disk` ghi N MB (fsync) rồi đọc lại, từ chối nếu ổ còn dưới 1 GB hoặc 10%. Để kiểm tra *sức chứa*, tăng dần: `--preset large`, `--file-kb 5000,20000`, chạy lại `storage` sau mỗi bậc.

## 6. Dọn dẹp

```bash
sudo systemctl stop studytask-api-loadtest
sudo -u studytask python3 /opt/studytask-tools/scripts/seed_curriculum.py --data-dir /var/lib/studytask-loadtest --purge --vacuum
sudo rm -rf /var/lib/studytask-loadtest /opt/studytask-tools        # hoặc xóa luôn thư mục nếu không dùng nữa
sudo rm /etc/nginx/sites-enabled/studytask-loadtest && sudo systemctl reload nginx
```

## 7. Kết quả đo trên máy chủ thật (12/11/2026)

Máy chủ: Ubuntu, 4 nhân, 7,3 GB RAM, ổ 295 GB (trống 274 GB), Python 3.14. Cách làm: `seed_curriculum.py --preset medium` (2.040 tài khoản, 80 s với 2 tiến trình, mức ưu tiên thấp) vào `~/loadtest/data`, API riêng cổng 8788 chạy **đúng mã đang vận hành** (`/opt/studytask/studytask_api.py`), người dùng ảo chạy **ngay trên máy chủ** qua localhost. Không đụng `/var/lib/studytask`, nginx, systemd. Trong suốt phép đo, API thật (cổng 8787) vẫn phản hồi trong ≤ 2,7 ms.

| Người dùng ảo | Yêu cầu/s | p95 chung | Lỗi | Kết luận (ngưỡng p95 ≤ 2 s) |
|---|---|---|---|---|
| 10 | 16 | 254 ms | 0% | Đạt |
| 25 | 31 | 553 ms | 0% | Đạt |
| 50 | 52 | 596 ms | 0% | Đạt |
| 100 | 53 | 1.971 ms | 0% | Đạt, sát ngưỡng |
| 200 | 51 | 5.233 ms | 0% | **Không đạt** |

- **Trần thông lượng ~50–55 yêu cầu/s** từ 50 người dùng ảo trở lên; thêm người chỉ làm tăng thời gian chờ. CPU chỉ dùng trung bình ~17% (rảnh thấp nhất 71%), phù hợp với việc API xử lý nối đuôi (mục 7.1 điểm 1) chứ không phải thiếu CPU.
- Không có yêu cầu nào lỗi hay quá hạn ở cả 200 người dùng; hệ thống chậm đi chứ không hỏng.
- **Lưu trữ:** CSDL 3,7 MB (+ WAL 3,9 MB), 333 tệp tài liệu 115,8 MB; `quick_check` ok. Ghi đĩa có fsync: 55 MB/s (500 MB, 50 tệp).
- **Chưa đo:** đường mạng LAN/Cloudflare, tải tệp tài liệu qua nginx (cần quyền sudo để cấu hình nginx), chạy lâu hơn 1 phút mỗi bậc, mỗi bậc chỉ một lần. Máy phát tải chia CPU với máy chủ nên số đo hơi bất lợi cho máy chủ.

### 7.1 Những điểm nghẽn thấy trong mã

Đọc mã máy chủ cho thấy bốn điểm đáng chú ý, phù hợp với số đo ở trên (chưa kiểm chứng bằng profiler):

1. **Mọi yêu cầu API chạy nối đuôi nhau**: `dispatch` bọc cả `route()` trong `with _lock`. Đăng nhập băm PBKDF2 200.000 vòng nằm *trong* khóa này (~0,1 s mỗi lần), nên trần đăng nhập khoảng 8–10 lần/giây và các yêu cầu khác phải chờ. Khi 100 người đăng nhập cùng lúc, p95 vọt lên vài giây.
2. **`GET /api/doc/user` trả mọi hồ sơ** cho bất kỳ ai đăng nhập (giao diện gọi mỗi lần đăng nhập, `app.js` dòng 207): ~660 KB/lần với 2.040 tài khoản, ~2,6 MB với 8.000. Hàm `can()` còn tra CSDL một lần cho từng dòng.
3. **`sharedData/global` là một tài liệu duy nhất**: ghi tối đa 5 MB (`MAX_JSON`) và giáo viên/admin ghi ngược cả tài liệu. `medium` chiếm 1,3 MB, `large` 2,7 MB (`--dry-run` in sẵn con số này); vượt 5 MB thì không ai lưu được dữ liệu dùng chung.
4. **Kết nối giữ lâu (keep-alive) trực tiếp tới API bị hỏng sau `logout`** vì máy chủ không đọc nội dung POST (phần dư bị hiểu là yêu cầu kế tiếp → 501). Qua nginx không gặp vì nginx đóng kết nối ngược; công cụ kiểm tải đã tính tới điều này.

Hạn chế của dữ liệu: câu hỏi trắc nghiệm và tài liệu là nội dung giả. Chưa sinh bài tập, deadline, điểm, học phí.

## 8. Lọc theo lớp học phần và học kỳ

Cùng một môn mở ở nhiều lớp và do nhiều giáo viên đảm nhận, nên lọc chỉ theo môn làm giáo viên thấy lịch của mọi lớp. Từ 12/11/2026 dữ liệu được lọc theo **lớp học phần** (lớp + môn), quy tắc nằm ở `utils/scope.js` (giao diện) và `studytask_api.py` (máy chủ):

| Vai trò | Lịch học / lịch thi | Môn, tài liệu, trắc nghiệm | Sinh viên, kết quả |
|---|---|---|---|
| Sinh viên | Chỉ lớp của mình (máy chủ lọc) | Các môn của học kỳ mình | Của chính mình |
| Giáo viên | Chỉ lớp học phần được phân công | Chỉ môn được phân công trong kỳ, nhóm theo học kỳ | Chỉ sinh viên thuộc lớp mình dạy (máy chủ kiểm tra nhật ký hoạt động và kết quả trắc nghiệm) |
| Admin, Đào tạo, Tài chính | Tất cả, lọc theo học kỳ và lớp | Tất cả | Tất cả |

- Giáo viên **không sửa được** lịch của lớp khác dù cùng môn (máy chủ trả 403). Khi thêm lịch phải chọn một lớp mình dạy.
- Admin phân công trong **Bảng quản trị → Phân công môn học**: môn nhóm theo học kỳ, với giáo viên chọn thêm các lớp học phần đảm nhiệm. Giáo viên chưa có `sections` (hồ sơ cũ) vẫn lọc theo môn như trước.
- Giáo viên vẫn nhận **toàn bộ** `sharedData/global` từ API (giao diện lọc khi hiển thị): máy chủ cần cả danh sách để kiểm tra khi giáo viên ghi ngược, và các kiểm tra ghi ở trên chặn sửa phần của người khác. Chưa chặn *đọc* ở mức máy chủ cho giáo viên.
- Nâng cấp dữ liệu đã nạp bằng bản cũ (chưa có `sections`), không đổi tài khoản hay mật khẩu:

```bash
python3 ~/loadtest/tools/scripts/seed_curriculum.py --data-dir /var/lib/studytask --upgrade-assignments
```

## 9. Học phần mở theo năm, khóa và học kỳ (17/11/2026)

Trước đây mỗi môn của khung chỉ có **một** bản ghi dùng chung cho mọi khóa, nên một môn dồn nhiều giáo viên và toàn bộ thời khóa biểu 4 năm vào một danh sách (hàng trăm buổi học, hàng trăm lịch thi). Mô hình mới:

- **Học phần mở** = (môn, khóa, năm học, học kỳ). Mỗi khóa học đủ 8 học kỳ của khung nên mỗi môn xuất hiện 4 lần ở 4 năm khác nhau, mỗi lần là một bản ghi riêng ("thư mục" mới: tài liệu, đề, giáo viên riêng) đánh dấu `khoa`, `namHoc`, `ky`. Trạng thái: `da-ket-thuc` / `dang-hoc` / `ke-hoach` so với học kỳ hiện tại; học phần kế hoạch chưa có tài liệu và đề.
- **Mỗi học phần 1–3 giáo viên**: Admin gán trong Bảng quản trị → Phân công môn học (chọn học kỳ, mỗi học phần hiện `n/3 GV`, đủ 3 thì không gán thêm). Máy chủ chặn người thứ 4 (`409 teacher-limit`); chỉ xét học phần mới thêm nên dữ liệu cũ đã vượt trần không bị khóa. Thống kê hệ thống đếm "đang học nhưng chưa có giáo viên" và "vượt 3 giáo viên".
- **Hiển thị theo khóa**: trang Môn học nhóm "Khóa 2024-2028 · Năm 3 · Học kỳ 1 (2026-2027)", có bộ lọc khóa và học kỳ, **mặc định chỉ học kỳ hiện tại** (học kỳ 1 từ tháng 8 đến hết tháng 1, học kỳ 2 từ tháng 2 đến tháng 7). Danh sách chọn môn ở lịch học, deadline, lịch tháng, báo cáo ghi kèm năm học ("Cơ sở dữ liệu · HK1 2025-2026").
- **Thời khóa biểu theo học kỳ của từng khóa**: mỗi mục có `khoa`, `namHoc`, `ky`, `startDate`/`endDate` của học kỳ; trang Lịch học & Thi lọc theo khóa, học kỳ, lớp, mặc định học kỳ hiện tại (medium: 380 buổi/tuần thay vì 2.680; chọn một khóa còn ~95). Lịch tháng chỉ hiện buổi học trong khoảng ngày của học kỳ.
- **Chương trình đào tạo**: nhiều lần mở cùng mã môn đều thuộc chương trình, lần mở mới nhất được dùng để kiểm tra tín chỉ.

Nâng cấp dữ liệu đã nạp bằng mô hình cũ cần nạp lại: `seed_curriculum.py --data-dir ... --replace` (xóa dữ liệu có nhãn của script rồi sinh lại; tài khoản thật giữ nguyên). Sau đó gán lại ảnh đại diện bằng `assign_avatars.py` vì `--replace` xóa tệp ảnh của sinh viên seed.

## 10. Thời khóa biểu theo bảng 16 tiết, theo tuần thật (17/11/2026)

**Bảng tiết** (nhà trường công bố, áp dụng từ học kỳ 1 năm học 2025-2026; `utils/periods.js` và `TIET` trong `seed_curriculum.py`): 16 tiết × 45 phút; sáng tiết 1–6 (07:30–12:15), chiều tiết 7–12 (12:45–17:30), tối tiết 13–16 (18:00–21:00). Mỗi buổi học/lịch thi lưu `tietStart`, `tietEnd` cùng `start`, `end` đúng giờ của bảng.

**Quy tắc xếp lịch** (bộ sinh dữ liệu; trang thêm tiết học cũng chọn theo tiết và chặn khối tiết bắc qua giờ nghỉ):
- Một buổi học là **một khối tiết liền nhau trong cùng buổi** của một môn. Số tiết/tuần = số tín chỉ (2, 3 hoặc 4): môn 3 tín chỉ = một khối 3 tiết; môn 4 tín chỉ thực hành = một khối 4 tiết; môn 4 tín chỉ lý thuyết = hai khối 2 tiết ở hai ngày khác nhau.
- Lớp **trực tuyến** ưu tiên buổi tối (tiết 13–16) và cuối tuần; lớp **trực tiếp** ưu tiên sáng/chiều. Chủ nhật chỉ dùng cho lớp trực tuyến.
- Mỗi lớp có **ít nhất 1 ngày nghỉ** (Thứ Hai–Thứ Bảy) ở mọi học kỳ (1–2 ngày nghỉ, chọn ngẫu nhiên); lịch dồn vào các ngày lớp đã học và các khối liền nhau để chừa ngày nghỉ, ít tiết trống xen kẽ.
- Lớp, giáo viên, phòng không trùng **tiết** trong cùng học kỳ. Học kỳ gồm 15 tuần học bắt đầu từ Thứ Hai, rồi 3 tuần thi; mỗi bài thi 2 tiết, không thi Chủ nhật, mỗi lớp một môn mỗi ngày.
- Tải giáo viên tính theo tiết (`--max-load` × 3 tiết/tuần, mặc định 24) thay vì theo số lớp.

**Ba môn hướng dẫn** (Đồ án chuyên ngành IT405, Thực tập doanh nghiệp IT498, Khóa luận/Đồ án tốt nghiệp IT499; đánh dấu `kieuHoc: "huong-dan"`, môn cũ nhận ra qua tên): không có buổi học, không có lịch thi, không có đề trắc nghiệm, chỉ có tài liệu hướng dẫn và biểu mẫu. Mỗi lớp vẫn có 1–3 giáo viên hướng dẫn. **Quy chế điểm**: không có bộ trọng số; điểm môn = điểm tổng kết do giáo viên hướng dẫn nhập ở Bảng điểm (kết quả phụ thuộc người học có đáp ứng yêu cầu của người hướng dẫn); trang Quy chế điểm hiện ghi chú thay cho phần cấu hình tỷ trọng. Khi tạo môn tay có ô "Môn hướng dẫn".

**Trang Lịch học & Thi**: thời khóa biểu hiện **theo từng tuần thật** (Thứ Hai–Chủ nhật, tiêu đề "16/11 – 22/11/2026", đánh dấu tuần hiện tại, hôm nay và ngày nghỉ, "Tuần 11 của học kỳ 1 · 2026-2027"), có Tuần trước / Tuần này / Tuần sau và ô chọn ngày để nhảy tới tuần bất kỳ. Buổi học chỉ hiện ở các tuần nằm trong ngày bắt đầu–kết thúc của học kỳ; sau tuần 15 chỉ còn lịch thi (hiện ngay trong ngày thi). Lịch theo tháng vẫn dùng cùng quy tắc ngày. Bộ lọc khóa và lớp áp dụng cho tuần đang xem; tab Lịch thi lọc theo khóa, học kỳ, lớp.

Áp dụng lên server: cần nạp lại dữ liệu (`seed_curriculum.py --replace`, rồi `assign_avatars.py`) và cài gói giao diện mới. Chưa thực hiện lúc ghi (máy chủ đang chạy SMART).
