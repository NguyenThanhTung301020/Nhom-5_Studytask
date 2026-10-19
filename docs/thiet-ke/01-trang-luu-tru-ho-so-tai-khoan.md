# Thiết kế 01 – Trang lưu trữ hồ sơ tài khoản (bản nháp tuần 2)

Người phụ trách: Trần Đức Tùng. Mục công việc số 4 của kế hoạch tuần 2. Tuần 2 chỉ làm bản thiết kế, chưa lập trình.

## 1. Vấn đề hiện tại

- Quản trị viên xóa tài khoản (từng cái, hoặc hàng loạt tài khoản quá hạn) thì `deleteUserData` xóa luôn `user`, `userData`, `activities` (`utils/firebase.js`). Không có bước nào giữ lại thông tin.
- Hết học kỳ, nhà trường vẫn cần tra cứu: sinh viên đó học môn nào, nộp bài, làm trắc nghiệm ra sao, điểm bao nhiêu. Khi xóa thì mất hết, xóa nhầm cũng không khôi phục được.
- Bản ghi trong Firebase Authentication vẫn còn sau khi xóa dữ liệu Firestore, nên người đó vẫn đăng nhập được vào một hồ sơ trống.

## 2. Mục tiêu

1. Thay **xóa** bằng **lưu trữ**: tài khoản ngừng hoạt động nhưng hồ sơ và kết quả học tập vẫn còn để tra cứu.
2. Khôi phục được tài khoản đã lưu trữ.
3. Xóa vĩnh viễn chỉ sau một thời hạn lưu giữ, và phải xác nhận hai lần.
4. Chỉ Quản trị viên xem được; giáo viên chỉ xem bản tóm tắt kết quả của môn mình dạy (giai đoạn sau).

## 3. Tác nhân và chức năng

| Mã | Chức năng | Tác nhân |
|---|---|---|
| LT1 | Lưu trữ một tài khoản (thay cho nút Xóa hiện tại) | Quản trị viên |
| LT2 | Lưu trữ hàng loạt tài khoản quá hạn | Quản trị viên |
| LT3 | Xem danh sách hồ sơ đã lưu trữ: tìm kiếm, lọc theo vai trò, học kỳ, lý do | Quản trị viên |
| LT4 | Xem chi tiết một hồ sơ (thông tin cá nhân, môn học, kết quả) | Quản trị viên |
| LT5 | Khôi phục tài khoản | Quản trị viên |
| LT6 | Xuất danh sách ra CSV | Quản trị viên |
| LT7 | Xóa vĩnh viễn hồ sơ đã quá thời hạn lưu giữ | Quản trị viên |

Sơ đồ use case do nhóm tự vẽ (mục công việc số 5), không dùng AI tạo sơ đồ.

## 4. Cấu trúc dữ liệu

Collection mới `archivedAccounts/{uid}`: mỗi tài khoản một document, giữ bản chụp tại thời điểm lưu trữ.

```
archivedAccounts/{uid}
├─ account        { email, name, role, subjectIds, phone, createdAt, expiresAt }   // chép từ user/{uid}
├─ profile        { studentId, className, faculty, major, ... }                    // chép từ userData/{uid}.profile
├─ summary        { subjects: [{ subjectId, name, quizAvg, homeworkDone, homeworkTotal }],
│                   quizCount, homeworkCount, lastActiveAt }                       // tính từ activities + userData
├─ snapshot       { homeworkSubs, submissions }                                    // dữ liệu thô để khôi phục
├─ archivedAt     "2026-10-17T10:00:00Z"
├─ archivedBy     { uid, name }                                                    // Quản trị viên thực hiện
├─ reason         "expired" | "graduated" | "left" | "manual"
├─ note           "ghi chú tự do"
└─ purgeAfter     "2027-10-17"                                                     // mặc định archivedAt + 12 tháng
```

Lý do chọn cấu trúc này:
- Một document cho mỗi tài khoản thì đọc danh sách chỉ tốn 1 lượt đọc mỗi tài khoản. `summary` đủ để hiển thị bảng mà không phải mở `snapshot`.
- `snapshot` có thể lớn. Nếu sau này vượt giới hạn 1 MB của một document thì tách thành subcollection `archivedAccounts/{uid}/data/*`.
- Không lưu mật khẩu, kể cả bản trong `userSecrets` (lỗ hổng V1).

Security Rules dự kiến:

```
match /archivedAccounts/{uid} {
  allow read, write: if isAdmin();
}
```

## 5. Luồng xử lý

**Lưu trữ (LT1, LT2)**
1. Quản trị viên bấm "Lưu trữ" ở trang Quản trị → Tài khoản, chọn lý do và nhập ghi chú.
2. Hệ thống đọc `user/{uid}`, `userData/{uid}`, `activities/{uid}` rồi tính `summary`.
3. Ghi `archivedAccounts/{uid}`. Ghi xong mới xóa 3 document gốc và `userSecrets/{uid}`, dùng `writeBatch` để không bị dở dang.
4. Vô hiệu hóa đăng nhập trong Firebase Authentication. Việc này cần Admin SDK (Cloud Function `disableUser`, tuần 3). Trước khi có Cloud Function, Quản trị viên vô hiệu hóa thủ công trong Firebase Console.

**Khôi phục (LT5)**
1. Ghi lại `user/{uid}` từ `account`, `userData/{uid}` từ `profile` và `snapshot`.
2. Xóa `archivedAccounts/{uid}`, rồi bật lại đăng nhập (Cloud Function `enableUser`).
3. Không khôi phục mật khẩu. Người dùng đặt mật khẩu mới qua email đặt lại, hoặc Quản trị viên cấp mật khẩu mới qua Cloud Function.

**Xóa vĩnh viễn (LT7)**
- Chỉ bật được khi đã qua `purgeAfter`, và Quản trị viên phải gõ lại email của tài khoản để xác nhận.
- Giai đoạn sau: dùng Cloud Function chạy định kỳ để nhắc những hồ sơ đã đến hạn xóa.

## 6. Giao diện (phác thảo)

Thêm tab **Lưu trữ** trong trang Quản trị, cạnh tab Tài khoản.

```
┌ Quản trị ─────────────────────────────────────────────────────────────┐
│ [Tài khoản] [Lưu trữ (12)] [Môn học] [Hệ thống]                      │
├───────────────────────────────────────────────────────────────────────┤
│ 🔍 Tìm theo tên, email, MSSV   Vai trò [Tất cả ▾]  Lý do [Tất cả ▾]   │
│                                                     [⤓ Xuất CSV]      │
├──────────────────────┬──────────┬────────────┬────────────┬───────────┤
│ Người dùng           │ Vai trò  │ Lưu trữ    │ Lý do      │ Thao tác  │
├──────────────────────┼──────────┼────────────┼────────────┼───────────┤
│ Trần Minh Khoa       │ SV       │ 17/10/2026 │ Hết hạn    │ 👁  ↺  🗑  │
│ student@studytask.vn │          │ bởi Admin  │            │           │
└──────────────────────┴──────────┴────────────┴────────────┴───────────┘
 👁 Xem chi tiết   ↺ Khôi phục   🗑 Xóa vĩnh viễn (chỉ bật khi đã qua hạn lưu giữ)
```

Cửa sổ chi tiết (LT4) có 3 phần: thông tin tài khoản, hồ sơ cá nhân, bảng kết quả theo môn (điểm trắc nghiệm trung bình, số bài tập đã nộp trên tổng số).

Nút **Xóa** ở tab Tài khoản đổi thành **Lưu trữ**. Nút "Xóa N tài khoản quá hạn" đổi thành "Lưu trữ N tài khoản quá hạn".

## 7. Kế hoạch triển khai đề xuất

| Bước | Nội dung | Tuần |
|---|---|---|
| 1 | Nhóm duyệt bản thiết kế này và chốt các trường trong `summary` | 3 |
| 2 | Cloud Functions `disableUser` / `enableUser` (dùng chung với việc bỏ lưu mật khẩu V1) | 3 |
| 3 | Rules `archivedAccounts` + rules test | 3 |
| 4 | Tab Lưu trữ: danh sách, chi tiết, khôi phục, xuất CSV | 4 |
| 5 | Xóa vĩnh viễn sau thời hạn lưu giữ | 4 |

## 8. Câu hỏi cần GVHD/nhóm quyết định

- Thời hạn lưu giữ mặc định: 12 tháng có phù hợp quy chế của trường không?
- Giáo viên có được xem bản tóm tắt kết quả của sinh viên đã lưu trữ thuộc môn mình dạy không?
