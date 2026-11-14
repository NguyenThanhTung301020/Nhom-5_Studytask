# Báo cáo tuần 6

**Đề tài:** Xây dựng website quản lý deadline học tập cho sinh viên (sản phẩm: StudyTask)  
**GVHD:** TS. Huỳnh Xuân Phụng  
**Nhóm:**  
- Nguyễn Thanh Tùng (24TX810027)  
- Trần Đức Tùng (24TX810026)  
- Trương Thanh Vui (24TX810021)  

**Thời gian:** 09/11 – 14/11/2026   
**Repo GitHub (public):** https://github.com/NguyenThanhTung301020/Nhom-5_Studytask  

---

## Phần 1. Tóm tắt tuần 6

Tuần 6 (09/11 – 14/11/2026, số liệu đến 13/11/2026) tập trung vào hai việc chính của kế hoạch: lập trình V3 cho Trắc nghiệm (đề không lộ đáp án, máy chủ chấm và ghi điểm) và vá hoàn toàn V4 (nhật ký hoạt động). Cả hai đã gộp vào master, có kiểm thử tự động và CI xanh ([PR40], [PR43], [PR52]). Nhóm cũng áp dụng quy ước PR mới từ 10/11: mẫu mô tả PR, kiểm tra PR tự động (PR guard), gộp bằng merge commit ([PR44]).

- **09–10/11:** Trương Thanh Vui triển khai lại máy chủ sau sự cố ghi đè 06/11 (biên bản 09/11 và 10/11), thêm kiểm thử Admin đặt lại mật khẩu và siết quyền tải bài nộp ([PR39]), lập trình V3 ([PR40]) cùng câu điền khuyết, nhập đề từ tệp và kho đề ([PR43]), đồng bộ số điện thoại ở máy chủ ([PR41]) và lọc dữ liệu dùng chung theo môn ở máy chủ ([PR42], [PR45]). Thanh Vui cũng viết quy ước PR ([PR44]).
- **11/11:** Nguyễn Thanh Tùng sửa lỗi giáo viên sửa môn làm mất dữ liệu môn khác ([PR50]) và 2 lỗi luồng email cá nhân ([PR51]). Trương Thanh Vui hoàn tất thử [D9] trên hệ thống đang chạy ([PR46]), ghi nhận project Firebase không khôi phục được ([PR47]), kiểm tra cổng mạng từ ngoài ([PR48]) và chép bản sao lưu ra ổ ngoài kèm thử khôi phục ([PR49]).
- **12–13/11:** Nguyễn Thanh Tùng vá hoàn toàn V4 rồi sửa thêm theo review ([PR52]: giữ điểm quiz khi nhật ký đầy, chỉ nhận sự kiện của môn đang học, giới hạn refId), kèm kết quả thử tay trang Quản lý lớp học bằng tài khoản giáo viên. Trương Thanh Vui đo sức khỏe máy chủ mốc T+7 ([PR53]). Trần Đức Tùng cập nhật 8 sơ đồ của [D3], [D05] theo review PR8 và kiến trúc máy chủ (việc 3 và việc 12, [PR55]). Nguyễn Thanh Tùng thử đăng nhập và lưu trên web thật sau khi gỡ Firebase (đạt) và sửa R2–R7 của review [PR9] ([PR56]).

**Đổi người thực hiện so với kế hoạch (theo thống nhất của nhóm):** việc 7 (lập trình V3) kế hoạch giao Trần Đức Tùng, nhưng do Trương Thanh Vui làm. Khi lập trình V3 và lọc dữ liệu theo môn, Thanh Vui ghi thêm phần văn bản [D05] mục 0 "Cập nhật tuần 6" và [D3] mục "Cập nhật tuần 6" ([PR40], [PR42], [PR43]).

**Ngoài kế hoạch:** Trương Thanh Vui làm riêng bộ dữ liệu lớp học theo khung đào tạo một chuyên ngành (khoảng 2.000 sinh viên, 80 lớp học, 114 đề), nạp lên máy chủ thật ngày 12/11 sau khi lưu và đo tải (đạt đến 100 người dùng ảo, chưa đạt ở 200) ([PR54]). Phần này không tính vào khối lượng theo kế hoạch và đang chờ ý kiến của thầy.

---

## Phần 2. Tự đánh giá của các thành viên

### 2.1. Nguyễn Thanh Tùng

**Đã làm được:**
- Vá hoàn toàn V4 ([PR52]), sửa thêm 3 điểm theo review ở [`01886c5`]; `test_activities.py` 162 ca (mục 3.2).
- Sửa 2 lỗi luồng email cá nhân ([PR51]): `test_email_codes.py` 32 ca.
- Hoàn tất review [PR9]: bảng 45 ca thử quyền (43/45 đạt), mở CSV bằng Excel đạt; sửa R1 ở [PR50] (`test_teacher_shared.py` 27 ca) và R2–R7 ở [PR56] (chặn hẳn bớt môn còn dữ liệu; thêm `test_subject_removal.py` 23 ca).
- Thử đăng nhập và lưu trên web thật sau khi gỡ Firebase: đạt (việc 5).
- Review [PR39] có 2 điểm cụ thể, đã được sửa.

**Chưa làm được:**
- Kiểm chứng phần máy chủ của [PR50], [PR51], [PR52], [PR56] trên web thật (chờ máy chủ về đúng `master`).
- Review [PR9] đăng chậm; review [PR43], [PR54] chưa kỹ ([PR43] phải mở lại thành [PR45]).

### 2.2. Trần Đức Tùng

**Đã làm được:**
- Cập nhật 8 sơ đồ (Use Case, DFD các mức) của [D3], [D05] theo review [PR8] và kiến trúc máy chủ riêng ([PR55]; việc 3, kế hoạch ghi ở việc 12). **Đạt một phần:** có cập nhật và bổ sung các sơ đồ, tuy nhiên một số sơ đồ bị thay đổi do quá trình nhóm sửa code và các lỗi logic.
- Review nêu lỗi cụ thể, lỗi đều được sửa trước khi gộp: [PR40] (chặn tự thêm sự kiện `quiz`), [PR41] (chỉ đồng bộ `user.phone` khi có gửi `profile.phone`), [PR52] (giữ điểm quiz, giới hạn `refId`, chỉ nhận sự kiện môn đang học). Review [PR56]: chạy lại toàn bộ kiểm thử đều đạt, xác nhận cách chặn bớt môn.
- Approve và gộp [PR40], [PR41], [PR48], [PR49], [PR51], [PR56]; Approve [PR50], [PR52].

**Chưa làm được:**
- Chỉnh các sơ đồ còn thiếu hoặc sai chi tiết (việc 13 tuần 7); chốt 3 câu còn mở ở [D05] mục 8 (việc 8 tuần 7).
- [PR48], [PR49], [PR51] chỉ ghi "đã xem và gộp", chưa có nhận xét cụ thể.

**Đổi người thực hiện:** việc 7 (lập trình V3) theo thống nhất của nhóm do Trương Thanh Vui làm.

### 2.3. Trương Thanh Vui

**Đã làm được:**
- Triển khai lại máy chủ, có biên bản và so hash ([R-TK09], [R-TK10]).
- Lập trình V3 ([PR40]) và mở rộng Trắc nghiệm ([PR43]); lọc dữ liệu theo môn ([PR42], [PR45]); đồng bộ số điện thoại ([PR41]); kiểm thử Admin đặt lại mật khẩu, siết quyền tải bài nộp ([PR39]).
- Vận hành: sao lưu ra ổ ngoài và thử khôi phục ([PR49]); kiểm tra cổng mạng ([PR48]); đo sức khỏe T+7 ([PR53]); đóng việc Firebase ([PR47]); hoàn tất thử [D9] ([PR46]).
- Quy ước PR, PR guard ([PR44]); Approve [PR50], [PR52].
- Ngoài kế hoạch: bộ dữ liệu lớp học theo khung đào tạo ([PR54]).

**Chưa làm được:**
- Bản sao lưu trên ổ ngoài chưa mã hóa (việc 1b).
- Máy chủ lệch `master` lại do cài mã ngoài kế hoạch trước khi gộp.
- Ổ cứng báo lỗi đọc khi tự kiểm tra; nhóm chưa thay ổ vì kinh phí, tăng theo dõi và sao lưu ngoài.

---

## Phần 3. Phản hồi nhận xét của giảng viên

### 3.1. Tổng hợp

| Yêu cầu của thầy | Thực tế tuần 6 | Minh chứng |
|---|---|---|
| Việc đầu tiên của tuần 6 là triển khai lại bản mới nhất và đối chiếu mã nguồn bằng hash; xong việc đó rồi mới làm việc khác | **Đạt ở đầu tuần:** 09/11 triển khai lại (gồm [PR37] bị sót ở tuần 5), SHA256 của API và `Graduation.js` trên máy chủ khớp bản vừa triển khai. 10/11 triển khai bản có V3 và lọc theo môn; hash `studytask_api.py` trên máy chủ khớp commit `d924b69`; `smoke_live.py` 16/16 từ Internet. **Chưa giữ được đến cuối tuần:** cả hai lần triển khai lấy từ nhánh chưa gộp (đã gộp sau đó); ngày 12/11 máy chủ được cài mã lọc theo lớp học phần trước khi có PR, nên lúc đo T+7 (13/11) hash lại khác `master`; [PR50], [PR51], [PR52], [PR56] chưa triển khai. Đưa vào việc 1 tuần 7 | [R-TK09], [R-TK10], [PR53] |
| Ba vấn đề còn lại của V4 phải kèm kết quả test cho từng vấn đề | **Đạt**, `test_activities.py` 162/162; chạy bộ test mới trên mã chưa sửa thì các ca của từng vấn đề đều không đạt. Kết quả theo từng vấn đề ở bảng 3.2 | [PR52] |
| Cập nhật [D05] và [D3] theo kiến trúc máy chủ; sơ đồ vẫn là bản Firebase cũ | **Đạt một phần:** [D05] thêm mục 0 "Cập nhật tuần 6" (thay Firestore/Worker bằng API Python, `quizKeys`, `quizResults`), ghi chú "đã thay/đã chốt" ở mục 4, 5.1, 7. [D3] thêm "Cập nhật tuần 6", sửa dòng 6, 7. Trần Đức Tùng vẽ lại 8 sơ đồ theo máy chủ riêng: có cập nhật và bổ sung các sơ đồ, tuy nhiên một số sơ đồ bị thay đổi do quá trình nhóm sửa code và các lỗi logic; Trương Thanh Vui duyệt và ghi còn vài chi tiết cần chỉnh ở tuần sau | [PR40], [PR42], [PR43], [PR55] |

### 3.2. Kết quả kiểm thử cho từng vấn đề của V4

Cách đo: chạy bộ `tests/server/test_activities.py` hiện tại (162 ca) trên hai bản của `server/studytask_api.py`:
- **Trước:** `master` ngay trước [PR52] (`91cf96b`);
- **Sau:** `master` `c4a11a5`.

Chạy ngày 13/11 trong môi trường làm việc của AI (Linux, Python 3.13). Trên bản cũ, bộ test **dừng giữa chừng** ở ca 149 (lỗi `TypeError`, vì giáo viên không đọc được danh sách nhật ký), nên 14 ca cuối không chạy.

| Vấn đề V4 | Ca kiểm thử (nhóm ca trong `test_activities.py`) | Trước ([`91cf96b`]) | Sau ([`c4a11a5`]) |
|---|---|---|---|
| **1. Sinh viên tự ghi điểm quiz** | 32 ca: tự ghi sự kiện `quiz`; ghi sự kiện khác kèm `score`/`total`/`correct`; luồng chấm thật (nộp kèm `score=10` tự đặt, thêm/sửa/xóa sự kiện quiz qua PUT, ghi đè cả nhật ký, nộp lại lấy điểm khác, ghi thẳng `quizResults`); nhật ký đầy 2000 sự kiện không mất điểm quiz cũ | 12 đạt, **6 không đạt**, 14 không chạy | **32/32** |
| **2. Sinh viên xóa nhật ký của mình** | 10 ca: sinh viên xóa nhật ký của mình hoặc của người khác; giáo viên, Đào tạo, Tài chính, người chưa đăng nhập xóa; xóa sạch bằng PUT ghi đè; Admin xóa được; xóa tài khoản kéo theo nhật ký | 3 đạt, **7 không đạt** (trả 200 `{"ok": true}`) | **10/10** |
| **3. Giáo viên thấy sự kiện của môn không dạy** | 12 ca: đọc một tài liệu và đọc danh sách; giáo viên dạy 2 môn; sinh viên hồ sơ cũ; `subjectId` sai kiểu; dữ liệu lưu không bị mất khi lọc | 5 đạt, **7 không đạt** | **12/12** |
| 3b. Sinh viên chỉ ghi sự kiện của môn đang học (thêm theo review) | 7 ca: không ghi môn, môn không học, danh sách môn rỗng, được thêm môn, thôi học môn | 2 đạt, **5 không đạt** | **7/7** |
| Cả bộ | 162 ca | 118 đạt, 30 không đạt, 14 không chạy | **162/162** |

Ngoài ra: trang Quản lý lớp học đã thử bằng tài khoản giáo viên `gv01` qua proxy cục bộ với dữ liệu tạm, cả trường hợp nhật ký đầy 2000 sự kiện. Giới hạn đã biết: khi nhật ký đầy, sự kiện cũ nhất không phải quiz bị bỏ, nên cột "Bài tập đã làm" của `sv03` trong lần thử về 0. **Chưa thử trên máy chủ thật**, vì máy chủ chưa chạy bản có [PR52].

---

## Phần 4. Kết quả kiểm thử và vận hành

### 4.1. Kiểm thử tự động

| Bộ kiểm thử | Kết quả trên `master` `c4a11a5` | Ghi chú |
|---|---|---|
| `test:logic` (`logic.test.mjs` + `quizfile.test.mjs`) | 87/87 | Tuần 5: 49/49. Thêm ca nhập/xuất đề từ tệp và ca của phần ngoài kế hoạch |
| `test_activities.py` (V4) | 162/162 | Tuần 5: 99/99; xem mục 3.2 |
| `test_quiz_v3.py` (V3) | 77/77 | Mới, [PR40] |
| `test_quiz_extra.py` (điền khuyết, bản lưu, kho đề) | 48/48 | Mới, [PR43], ngoài kế hoạch |
| `test_email_codes.py` (2 lỗi email) | 32/32 | Mới, [PR51]; trên mã cũ 11 ca lỗi |
| `test_teacher_shared.py` (R1) | 27/27 | Mới, [PR50]; trên mã cũ 15 ca hỏng |
| `test_admin_reset.py` (Admin đặt lại mật khẩu) | 18/18 | Mới, [PR39] |
| `test_shared_scope.py` (lọc theo môn) | 16/16 | Mới, [PR42] |
| `test_profile_lock.py` | 25/25 | Tuần 5: 18/18; thêm ca đồng bộ số điện thoại ([PR41]) |
| `test_account.py`, `test_users.py`, `test_migrate.py`, `test_graduation.py` | 46/46, 13/13, 8/8, 15/15 | Không đổi |
| `test_submit.sh` | 18/18 | Tuần 5: 10/10; thêm ca quyền tải bài nộp ([PR39]) |
| `test_seed_curriculum.py`, `test_class_scope.py` | 50/50, 20/20 | Ngoài kế hoạch ([PR54]) |
| `test:rules`, `test:rules:deep` | Không chạy lại | Chỉ còn là đặc tả; bảo vệ thật là `can()` và `tests/server/` |
| CI GitHub Actions | Chạy cho mọi PR, kể cả PR xếp chồng (từ [PR44]); 15 bộ kiểm thử máy chủ + `test:logic` + `test:rules` | 09–13/11: CI 54 lượt (52 đạt, 1 lỗi, 1 hủy); PR guard 45 lượt đạt, 1 lượt bỏ qua |

Toàn bộ số trong bảng do AI chạy lại ngày 13/11 trong môi trường làm việc của Claude (Linux, Node 22, Python 3.13), không phải trên máy thành viên. Các số do thành viên chạy trên máy mình được ghi trong nhật ký AI tuần 6 (`docs/ai-log/tuan-06.md`).

Số liệu trên lấy ở `c4a11a5`, trước [PR56]. [PR56] (gộp 13/11 21:13, `master` `b9e2663`) thêm `test_subject_removal.py` 23 ca và 9 ca vào `test_graduation.py`; `test:logic` trên nhánh của [PR56] là 90/90.

### 4.2. Kiểm thử thủ công và trên hệ thống đang chạy

| Nội dung | Kết quả | Nơi chạy |
|---|---|---|
| 45 ca thử quyền các trang của PR9 trên API thật, dữ liệu tạm | 11/11: 42/45. 13/11 trên `master` `c4a11a5`: **43/45**. 2 ca không đạt đều là Đào tạo hoặc Giáo viên ghi vào dữ liệu dùng chung (R2–R4) | Máy Nguyễn Thanh Tùng; bảng đăng trên [PR9] |
| CSV xuất ra mở bằng Excel 16 | Bản cũ: 4/15 ô thành công thức; sau [PR37]: 0/16. Tệp tạo bằng hàm `toCSV` của repo, chưa tải từ nút xuất trên trình duyệt | Máy Nguyễn Thanh Tùng |
| `smoke_live.py` trên hệ thống đang chạy | 16/16 sau triển khai 10/11 (trước đó 15/16, ca `/.git` lỗi) | Từ Internet ([R-TK10]) |
| Quyền tải bài nộp khi chưa đăng nhập | HTTP 401 | Máy chủ, 09/11 ([R-TK09]) |
| Thử khôi phục bản sao lưu trên ổ ngoài | 385/385 tệp trùng SHA256; `integrity_check` ok; dựng API tạm từ bản 10/11 | Máy Trương Thanh Vui ([PR49]) |
| Cổng mở từ ngoài (qua 4G) | 80/443 mở tới một thiết bị Windows chưa xác định, không phải máy chủ StudyTask; không có quyền vào bộ định tuyến nên chưa xử lý | Máy Trương Thanh Vui ([PR48]) |
| Trang Quản lý lớp học bằng tài khoản giáo viên | Đạt trên dữ liệu tạm, kể cả nhật ký đầy | Máy Nguyễn Thanh Tùng (mục 3.2) |
| Đăng nhập và lưu dữ liệu trên web thật sau khi gỡ Firebase | **Đạt** (13/11, tài khoản Quản trị viên): lưu số điện thoại ở trang Hồ sơ, máy chủ ghi cả `user` và `userData`; xóa bộ nhớ trình duyệt, tải lại vẫn còn; đã trả về như cũ | Web thật, AI thao tác trên trình duyệt sau khi Thanh Tùng tự đăng nhập |
| Giao diện đang chạy so với `master` `c4a11a5` | 48 tệp `.js`/`.css`: 40 trùng, 8 khác (đều là tệp của [PR54], bản triển khai 12/11 trước khi gộp). Đã có phần sửa giao diện của [PR50] | Web thật, 13/11 |

**Chưa kiểm chứng:** phần máy chủ của [PR50], [PR51], [PR52], [PR56] trên web thật (cần tài khoản giáo viên, sinh viên; máy chủ chưa chạy đúng `master`); luồng email thật trên giao diện ([D07] mục 5); nộp bài trên web thật ([R-TK09] mục 4); đăng nhập và lưu bằng tài khoản sinh viên, giáo viên.

### 4.3. Vận hành – mốc T+7 (13/11, [D-VH] mục 8.4, 8.4a)

- **Dịch vụ: ổn định.** Chạy liên tục 8 ngày 18 giờ, không khởi động lại ngoài kế hoạch, 5xx = 0, 429 = 0, không OOM, `integrity_check` ok, sao lưu tự động 8 bản và thử khôi phục đạt. Site từ ngoài 200 / 0,24 giây.
- **Ổ đĩa: chưa đạt.** Tự kiểm tra ngắn báo `read failure` tại LBA 705216. Chỉ số 187 tăng từ 1.650 lên 1.651, chỉ số 191 tăng từ 3.682 lên 3.692; chỉ số 5, 197, 198 chưa xấu đi, tổng thể vẫn `PASSED`. Theo [D-VH] mục 8.5 cần chép bản sao lưu ra thiết bị khác ngay và chuẩn bị thay ổ; nhóm quyết định chưa thay ổ vì kinh phí, chỉ thay khi lỗi nặng hơn, trong lúc đó tăng theo dõi và sao lưu ngoài (việc 3 tuần 7). Bản sao lưu `/mnt/backup` nằm cùng ổ vật lý.
- **Cần theo dõi:**
  - RSS API 67 MB, vượt mức 2 lần T0;
  - 18 gói chờ cập nhật, máy cần khởi động lại;
  - 17 mã 403 mới ở API (11 `PUT userData`, 6 `GET sharedData/global`) và 403 ở `/uploads/` trên nginx, có yêu cầu dò `/uploads/.env`; chưa điều tra;
  - dữ liệu tăng mạnh (2.051 tài khoản, 4.306 `docs`, CSDL 126 MB) do nạp dữ liệu mô phỏng.
- **Máy chủ không chạy đúng `master`** (mục 3.1).

---

## Phần 5. Đối chiếu với công việc trong kế hoạch tuần 6

### 5.1. Nhóm A: bắt buộc

| # | Việc | Người phụ trách | Tình trạng | Minh chứng |
|---|---|---|---|---|
| 1 | Triển khai lại `master`, so hash, xử lý script cũ | Trương Thanh Vui | **Đạt ngày 09–10/11** (hash API khớp `d924b69`). Từ 12/11 máy chủ lại khác `master` (mục 3.1) | [R-TK09], [R-TK10], [PR53] |
| 1b | Chép bản sao lưu ra thiết bị ngoài, thử khôi phục | Trương Thanh Vui (Nguyễn Thanh Tùng xác nhận) | **Đạt một phần:** đã chép và thử khôi phục; ổ không mã hóa, chưa có xác nhận của Nguyễn Thanh Tùng; bản chép chưa có dữ liệu nạp ngày 12/11 | [PR49] |
| 2 | Hoàn tất review PR9 | Nguyễn Thanh Tùng | **Đạt:** review lần 2 đăng 13/11 có bảng 45 ca thử quyền (43/45 đạt) và kết quả mở CSV bằng Excel; sửa R1 ở [PR50], R2–R7 ở [PR56]; cách chặn bớt môn còn dữ liệu được Trần Đức Tùng xác nhận khi review [PR56] | [PR9], [PR50], [PR56] |
| 3 | Cập nhật [D05], [D3] theo máy chủ riêng; chốt câu còn mở ở [D05] mục 8 | Trần Đức Tùng | **Đạt một phần:** có cập nhật và bổ sung các sơ đồ, tuy nhiên một số sơ đồ bị thay đổi do quá trình nhóm sửa code và các lỗi logic; chưa chốt 3 câu còn mở ở [D05] mục 8 (chuyển sang việc 8 tuần 7) | [PR55]; phần văn bản [D05], [D3]: [PR40], [PR42], [PR43] |
| 4 | Ca kiểm thử Admin đặt lại mật khẩu | Trương Thanh Vui; Nguyễn Thanh Tùng review | **Đạt** | [PR39] |
| 5 | Dữ liệu Firebase cũ; thử đăng nhập và lưu trên web thật | Trương Thanh Vui, Nguyễn Thanh Tùng | **Đạt:** đóng việc đối chiếu vì không còn dữ liệu; thử đăng nhập và lưu trên web thật đạt 13/11; còn kiểm tra sau 11/12 | [PR47], [PR56] |
| 6 | Sửa 2 lỗi email; kiểm tra cổng 80 | Nguyễn Thanh Tùng; Trương Thanh Vui | **Đạt** phần email; phần cổng đã kiểm tra, còn rủi ro chưa xử lý được | [PR51], [PR48] |
| 7 | Lập trình V3 | Trần Đức Tùng → Trương Thanh Vui | **Đạt** (đổi người làm) | [PR40], [PR43] |
| 8 | Vá hoàn toàn V4, thử tay bằng tài khoản giáo viên | Nguyễn Thanh Tùng | **Đạt**; chưa triển khai | [PR52] |
| 9 | Sức khỏe máy chủ T+7, T+15 | Trương Thanh Vui | **T+7 đạt** (ổ đĩa chưa đạt ngưỡng); T+15 ngày 21/11 | [PR53] |
| 10 | Nhật ký AI và báo cáo tuần 6 | Cả nhóm | **Đạt**; đã viết báo cáo và nhật ký AI; `docs/ai-log/tuan-06.md` đã đưa lên repo | Báo cáo này |

### 5.2. Nhóm B

| # | Việc | Người phụ trách | Tình trạng | Minh chứng |
|---|---|---|---|---|
| 11 | Kiểm tra đăng nhập khi tải bài nộp, bỏ cache công khai | Trương Thanh Vui | **Đạt** | [PR39] |
| 12 | Sửa sơ đồ theo review PR8 và cập nhật theo kiến trúc máy chủ | Trần Đức Tùng | **Đạt một phần**, làm chung với việc 3 (xem bảng 5.1) | [PR55] |
| 13 | Thử tay [D9], quyết định lỗi lưu một nửa | Trương Thanh Vui | **Đạt**; lỗi 4.1 đã sửa | [PR41], [PR46] |
| 14 | Phân quyền đọc `sharedData/global` theo môn | Trương Thanh Vui | **Đạt:** lọc ở máy chủ, không tách collection (lý do ghi ở [D3]) | [PR42], [PR45] |

### 5.3. Việc không thuộc kế hoạch tuần 6

| Việc | Nguồn gốc | Tình trạng |
|---|---|---|
| Quy ước PR, PR guard, CI cho PR xếp chồng | Rút kinh nghiệm các lần gộp nhầm tuần 5 | Đã gộp [PR44], áp dụng từ 10/11 |
| Trắc nghiệm mở rộng: điền khuyết, xem lại đề, nhập từ tệp, kho đề | Nhóm thảo luận và bổ sung khi áp dụng vào các bài tập; trải nghiệm thực tế trong quá trình học | Đã gộp [PR43] |
| Dữ liệu lớp học theo khung đào tạo, đo tải, lọc theo lớp học phần | Trương Thanh Vui làm riêng (khoảng 3 tuần) | Đã gộp [PR54]; chờ ý kiến của thầy |

---

## Phần 6. Kế hoạch tuần 7 (16/11 – 21/11/2026)

Kế hoạch lấy từ mọi việc còn tồn ở phần 2 (mục "Chưa làm"), phần 4 ("Chưa kiểm chứng", điểm cần theo dõi), phần 5 (việc chưa đạt) và cột "Tuần" của [D3]. Người phụ trách giữ theo người đã làm việc đó ở tuần 6; việc mới chia đều cho thành viên còn ít việc.

**Thứ tự (theo nhận xét của thầy tuần 5):** việc 1 xong trước, đối chiếu hash xong mới triển khai hay đổi dữ liệu trên máy chủ.

**Nhóm A: bắt buộc**

| # | Công việc | Người phụ trách | Kết quả cần đạt |
|---|---|---|---|
| 1 | Triển khai lại từ `master` (gồm [PR50], [PR51], [PR52], [PR54], [PR56]), so hash `studytask_api.py` và các tệp giao diện; xử lý script cài đặt cũ | Nguyễn Thanh Tùng | Máy chủ trùng hash với `master`; có biên bản trong `docs/van-hanh/` |
| 2 | Thử V3, V4 và luồng email trên web thật sau việc 1: giáo viên mở trang Quản lý lớp học, Bảng điểm; sinh viên làm đề và nộp bài; liên kết email và quên mật khẩu bằng thư thật | Nguyễn Thanh Tùng (V4, email); Trần Đức Tùng (V3, trắc nghiệm) | Kết quả thử tay trên máy chủ thật, ghi trong `docs/kiem-thu/` |
| 3 | Ổ cứng: chạy `smartctl -t long`; chép bản sao lưu mới nhất (sau 12/11) ra ổ ngoài. Nhóm đã quyết định chưa thay ổ vì kinh phí, chỉ thay khi SMART xấu thêm (sector chờ, 187/188 tiếp tục tăng, tự kiểm tra lỗi thêm) | Trương Thanh Vui | Có kết quả tự kiểm tra dài; bản sao lưu mới nằm ngoài ổ vật lý của máy chủ |
| 4 | Bảo vệ bản sao lưu ngoài: mã hóa (7-Zip AES hoặc BitLocker To Go) hoặc ghi rõ chấp nhận rủi ro | Nguyễn Thanh Tùng | Quyết định có xác nhận của Nguyễn Thanh Tùng, ghi vào biên bản 09 |
| 5 | Cập nhật gói hệ điều hành (18 gói) và khởi động lại có kế hoạch | Trương Thanh Vui | Cập nhật hết (0 gói chờ); ghi thời điểm khởi động lại |
| 6 | Sức khỏe máy chủ T+15 (21/11) và kết luận chung; theo dõi RSS của API | Trương Thanh Vui | [D-VH] mục 8.4, 8.6 được điền |
| 7 | Bảng điểm và Báo cáo lớp đọc điểm trắc nghiệm từ `quizResults` thay vì `activities` | Nguyễn Thanh Tùng (Trần Đức Tùng review) | Hai màn hình dùng nguồn điểm chính thức; có ca kiểm thử |
| 8 | Hoàn tất [D05]: đổi "cần nhóm xác nhận" thành quyết định đã chốt (mục 0 và mục 8); hạ cờ `correct` ở dữ liệu mẫu `utils/constants.js` | Trần Đức Tùng (Trương Thanh Vui review) | [D05] không còn câu hỏi mở |
| 9 | Thử [PR56] (R2–R7) trên web thật sau việc 1 bằng tài khoản Đào tạo: bớt môn còn dữ liệu bị chặn, link minh chứng, CSV đề trắc nghiệm | Nguyễn Thanh Tùng | Kết quả thử tay trên máy chủ thật, ghi trong `docs/kiem-thu/` |
| 10 | Việc theo [D3] tuần 7: mục 2 (bỏ Giải trí, Dịch thuật, Máy tính bỏ túi; V7), mục 8 (trọng số điểm trung bình môn), mục 10 (liên hệ hỗ trợ, V5), mục 14 (nhập danh sách lớp từ CSV/Excel). Rà hiện trạng trước vì một số phần đã làm sớm | Trần Đức Tùng | Mỗi mục có PR và ca kiểm thử, hoặc ghi lý do dời |
| 11 | Nhật ký AI và báo cáo tuần 7: mỗi người tự viết phần của mình, đối chiếu commit | Cả nhóm | `docs/ai-log/tuan-07.md`; báo cáo có link commit, PR, tệp |

**Nhóm B: làm khi nhóm A đúng tiến độ**

| # | Công việc | Người phụ trách | Kết quả cần đạt |
|---|---|---|---|
| 12 | `unlink_email` hoàn tác giao dịch khi lỗi; tài liệu cho [PR50] trong `docs/` | Nguyễn Thanh Tùng | Có ca kiểm thử; tài liệu trong `docs/` |
| 13 | Chỉnh các sơ đồ liên quan [D3], [D05] còn thiếu hoặc sai chi tiết | Trần Đức Tùng (Nguyễn Thanh Tùng review) | Sơ đồ khớp hệ thống đang chạy |
| 14 | Điều tra 17 mã 403 mới (có yêu cầu dò `/uploads/.env`) | Trương Thanh Vui | Ghi nguyên nhân hoặc rủi ro còn lại |
| 15 | Vite + JSX + ESLint ([D3] mục 9): chốt tuần thực hiện | Cả nhóm chốt | Ghi tuần cụ thể vào kế hoạch |

**Việc có mốc sau tuần 7 (ghi để không quên):**
- Kiểm tra project Firebase đã bị xóa hẳn sau hạn khôi phục 11/12/2026 02:54:32 UTC (Nguyễn Thanh Tùng).

**Việc ngoài kế hoạch đang làm riêng (không tính vào khối lượng theo kế hoạch):**
- Dữ liệu lớp học theo khung đào tạo ([PR54]), tuần 2 của đợt: kiểm tra và sửa lỗi xếp lớp, thời khóa biểu (Trương Thanh Vui), xin ý kiến của thầy.

**Xin ý kiến giảng viên:**
1. Phần dữ liệu lớp học ngoài kế hoạch ([PR54]): nhóm có nên tiếp tục 2 tuần còn lại không.

2. Cổng 80/443 mở tới một thiết bị Windows trong mạng nhà, không phải máy chủ StudyTask ([PR48]). Vì không có quyền vào bộ định tuyến và không can thiệp được phía nhà mạng, nhóm đã chốt chỉ ghi nhận rủi ro, không đưa vào kế hoạch. Thầy có đồng ý với cách xử lý này không ?

3. Kế hoạch tuần 7 hiện có 15 việc (11 bắt buộc), gồm việc còn tồn từ tuần 6 và các mục mới theo [D3]. Nhóm thấy khối lượng nhiều, xin ý kiến thầy có nên giảm bớt, ưu tiên xong việc còn tồn và thử trên web thật trước, dời một phần việc theo [D3] sang tuần sau không ?

---

## Phần 7. Khai báo công cụ AI

Trong tuần 6, nhóm sử dụng Claude Code (Anthropic): Claude Opus 5.5 (Nguyễn Thanh Tùng, Trần Đức Tùng) và Claude Sonnet 5.5 (Trương Thanh Vui), cho các việc sau:
- lập trình V3, mở rộng Trắc nghiệm, lọc dữ liệu theo môn, đồng bộ số điện thoại, siết quyền tải bài nộp;
- sửa lỗi R1, 2 lỗi email, vá V4 và viết kiểm thử máy chủ tương ứng;
- script triển khai, biên bản triển khai, kiểm tra cổng mạng, sao lưu ra ổ ngoài, đo sức khỏe máy chủ;
- quy ước PR, PR guard.

Chi tiết từng việc, phần sinh viên tự kiểm tra và các sai sót của AI được ghi trong `docs/ai-log/tuan-06.md`. Commit thiếu nhãn `[AI]`: `021acee` (việc 13, [PR46]) có dòng `Co-Authored-By` nhưng tiêu đề không gắn `[AI]`; `ff9f2bc` ([PR55]) AI chỉ tạo commit và đẩy nhánh, nội dung là 8 tệp sơ đồ do Trần Đức Tùng tự vẽ. Hai commit đã gộp nên nhóm ghi nhận tại đây, không sửa lịch sử.

---

## Phụ lục

### Phụ lục A. Commit trong tuần 6

| Commit | Người commit | Ngày | Nội dung | PR |
|---|---|---|---|---|
| `0ab9fde` | Trương Thanh Vui | 09/11 | Kiểm thử Admin đặt lại mật khẩu, siết quyền tải bài nộp | [PR39] |
| `ebe9f19` | Trương Thanh Vui | 09/11 | Script triển khai từ máy cá nhân, biên bản 09/11 | [PR39] |
| `0d77610` | Trương Thanh Vui | 09/11 | Lập trình V3 | [PR40] |
| `29f7c16` | Trương Thanh Vui | 09/11 | Script triển khai chuẩn hóa LF | [PR39] |
| `3f2cdd5` | Trương Thanh Vui | 10/11 | Sửa theo review [PR39] | [PR39] |
| `3c9e055` | Trương Thanh Vui | 10/11 | `test_quiz_v3` chờ API sẵn sàng | [PR40] |
| `72e823b` | Trương Thanh Vui | 10/11 | Xóa tài khoản dọn kết quả trắc nghiệm | [PR40] |
| `020b59f` | Trương Thanh Vui | 10/11 | Đồng bộ `user.phone` (việc 13) | [PR41] |
| `d924b69` | Trương Thanh Vui | 10/11 | Lọc dữ liệu theo môn (việc 14), chặn `.git` trên nginx | [PR42] |
| `28f18f3` | Trương Thanh Vui | 10/11 | Biên bản triển khai 10/11 | [PR42] |
| `6cfea9c` | Trương Thanh Vui | 10/11 | Điền khuyết, xem lại đề, nhập từ tệp, kho đề | [PR43] |
| `6dcfe70` | Trương Thanh Vui | 10/11 | Sửa theo review [PR40] | [PR43] |
| `56aa6b6` | Trương Thanh Vui | 10/11 | Sửa theo review [PR41] | [PR41] |
| `87eb55c` | Trương Thanh Vui | 10/11 | Sửa test chập chờn | [PR43] |
| `95f3289` | Trương Thanh Vui | 10/11 | Quy ước PR, PR guard | [PR44] |
| `021acee` | Trương Thanh Vui | 11/11 | Kết quả thử [D9] (việc 13) | [PR46] |
| `9be06eb`, `94d202e`, `9b99678`, `60761df`, `f8ae788` | Trương Thanh Vui | 11/11 | Việc 5: Firebase | [PR47] |
| `55d5e88`, `6752385`, `0a94a72`, `152feee`, `509ab9f`, `3ed52a7` | Trương Thanh Vui | 11/11 | Việc 6: kiểm tra cổng mạng | [PR48] |
| `bb66844`, `ac85d21` | Trương Thanh Vui | 11/11 | Việc 1b: sao lưu ra ổ ngoài | [PR49] |
| `903d4ed` | Nguyễn Thanh Tùng | 11/11 | Sửa lỗi R1 (giáo viên sửa môn) | [PR50] |
| `f9ab67a` | Nguyễn Thanh Tùng | 11/11 | Sửa 2 lỗi email | [PR51] |
| `b76c95d` | Nguyễn Thanh Tùng | 12/11 | Vá hoàn toàn V4 | [PR52] |
| `01886c5` | Nguyễn Thanh Tùng | 12/11 | V4 theo review | [PR52] |
| `253ffc1`, `f882b8b`, `b69aeac` | Trương Thanh Vui | 13/11 | Việc 9: sức khỏe T+7 | [PR53] |
| `63a138b`, `fda188f`, `2048a2b`, `0f69acf` | Trương Thanh Vui | 13/11 | Ngoài kế hoạch: lọc theo lớp học phần, script nạp dữ liệu, bộ báo cáo | [PR54] |
| `ff9f2bc` | Trần Đức Tùng | 13/11 | Việc 3, 12: cập nhật 8 sơ đồ | [PR55] |
| `e05502e` | Nguyễn Thanh Tùng | 13/11 | Việc 2: sửa R2–R7 của review [PR9] | [PR56] |
| `2c3d4e2` | Nguyễn Thanh Tùng | 13/11 | Việc 5: biên bản thử trên web thật | [PR56] |

### Phụ lục B. Review và gộp PR (giờ Việt Nam)

| PR | Người mở | Review | Người gộp | Lúc gộp |
|---|---|---|---|---|
| [PR39] | Trương Thanh Vui | Nguyễn Thanh Tùng bình luận 2 lỗi 09/11, đã sửa ở `3f2cdd5`; Approve 10/11 | Nguyễn Thanh Tùng | 10/11 |
| [PR40] | Trương Thanh Vui | Trần Đức Tùng bình luận 10/11 10:58 (chặn tự thêm sự kiện `quiz`), đã sửa ở `6dcfe70`; Approve 11:26 | Trần Đức Tùng | 10/11 |
| [PR41] | Trương Thanh Vui | Trần Đức Tùng bình luận 10/11 12:25 (chỉ đồng bộ khi yêu cầu gửi `profile.phone`), đã sửa ở `56aa6b6`; Approve 13:12. Review của Nguyễn Thanh Tùng bị gỡ do đẩy thêm commit | Trần Đức Tùng | 10/11 |
| [PR42] | Trương Thanh Vui | Nguyễn Thanh Tùng nhận xét chung, Approve "gộp 10/11/2026" | Nguyễn Thanh Tùng | 10/11 |
| [PR43] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve "đã xem và gộp" | Nguyễn Thanh Tùng | 10/11 |
| [PR44] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve, nhận xét về quy trình | Nguyễn Thanh Tùng | 10/11 |
| [PR45] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve "không có lỗi logic, lỗi dữ liệu hay lỗ hổng bảo mật đáng phải sửa" | Nguyễn Thanh Tùng | 10/11 |
| [PR46] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve "đã xem và gộp" | Nguyễn Thanh Tùng | 11/11 |
| [PR47] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve "đã xem và gộp" | Nguyễn Thanh Tùng | 11/11 |
| [PR48] | Trương Thanh Vui | Trần Đức Tùng Approve 11/11 11:46 "đã xem và gộp" | Trần Đức Tùng | 11/11 |
| [PR49] | Trương Thanh Vui | Trần Đức Tùng Approve 11/11 12:51 "đã xem và gộp" | Trần Đức Tùng | 11/11 |
| [PR50] | Nguyễn Thanh Tùng | Trương Thanh Vui Approve 13:07, góp ý chưa có tài liệu trong `docs/`; Trần Đức Tùng Approve 13:59 | Trương Thanh Vui | 11/11 |
| [PR51] | Nguyễn Thanh Tùng | Trần Đức Tùng Approve 14:01 "đã xem và gộp" | Trần Đức Tùng | 11/11 |
| [PR52] | Nguyễn Thanh Tùng | Trần Đức Tùng bình luận 4 điểm 12/11 20:32, đã sửa ở `01886c5`; Trương Thanh Vui Approve 13/11 10:07 xác nhận đã sửa; Trần Đức Tùng Approve 10:09 | Trương Thanh Vui | 13/11 |
| [PR53] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve "không có thay đổi code" | Nguyễn Thanh Tùng | 13/11 |
| [PR54] | Trương Thanh Vui | Nguyễn Thanh Tùng Approve, nhận xét logic lọc theo lớp học phần | Nguyễn Thanh Tùng | 13/11 |
| [PR55] | Trần Đức Tùng | Trương Thanh Vui Approve 13:48, ghi còn thiếu hoặc sai vài chi tiết, cập nhật ở các tuần sau | Trương Thanh Vui | 13/11 |
| [PR56] | Nguyễn Thanh Tùng | Trần Đức Tùng Approve 21:13: chạy lại toàn bộ kiểm thử máy chủ và `test:logic` đều đạt; đồng ý chặn bớt hoặc xóa môn khi môn còn dữ liệu | Trần Đức Tùng | 13/11 |

### Phụ lục C. Danh sách link GitHub

**Pull Request**

- [PR35] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/35
- [PR39] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/39
- [PR40] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/40
- [PR41] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/41
- [PR42] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/42
- [PR43] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/43
- [PR44] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/44
- [PR45] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/45
- [PR46] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/46
- [PR47] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/47
- [PR48] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/48
- [PR49] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/49
- [PR50] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/50
- [PR51] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/51
- [PR52] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/52
- [PR53] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/53
- [PR54] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/54
- [PR55] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/55
- [PR56] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/56

**Tài liệu**

- [D3] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/03-giu-bo-sua-them.md
- [D05] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/05-trac-nghiem-tach-dap-an-cham-diem-may-chu.md
- [D06] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/06-chuyen-firebase-sang-may-chu-rieng.md
- [D07] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/07-xac-thuc-email-ca-nhan.md
- [D9] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/sua-loi/01-cap-nhat-ho-so.md
- [D-GFB] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/van-hanh/02-bien-ban-go-firebase-sutdytask.md
- [D-VH] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/van-hanh/01-bao-cao-suc-khoe-may-chu.md
- [R-TK09] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/van-hanh/05-bien-ban-trien-khai-2026-11-09.md
- [R-TK10] https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/van-hanh/07-bien-ban-trien-khai-2026-11-10.md

[PR35]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/35
[PR39]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/39
[PR40]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/40
[PR41]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/41
[PR42]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/42
[PR43]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/43
[PR44]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/44
[PR45]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/45
[PR46]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/46
[PR47]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/47
[PR48]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/48
[PR49]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/49
[PR50]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/50
[PR51]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/51
[PR52]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/52
[PR53]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/53
[PR54]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/54
[PR55]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/55
[PR56]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/56
[PR37]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/37
[PR8]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/8
[PR9]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/9
[D3]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/03-giu-bo-sua-them.md
[D05]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/05-trac-nghiem-tach-dap-an-cham-diem-may-chu.md
[D06]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/06-chuyen-firebase-sang-may-chu-rieng.md
[D07]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/07-xac-thuc-email-ca-nhan.md
[D9]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/sua-loi/01-cap-nhat-ho-so.md
[D-GFB]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/van-hanh/02-bien-ban-go-firebase-sutdytask.md
[D-VH]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/van-hanh/01-bao-cao-suc-khoe-may-chu.md
[R-TK09]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/van-hanh/05-bien-ban-trien-khai-2026-11-09.md
[R-TK10]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/van-hanh/07-bien-ban-trien-khai-2026-11-10.md
[`b76c95d`]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/b76c95d
[`01886c5`]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/01886c5
[`3f2cdd5`]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/3f2cdd5
[`91cf96b`]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/91cf96b
[`c4a11a5`]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/c4a11a5
