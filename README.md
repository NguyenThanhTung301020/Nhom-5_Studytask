# StudyTask

Website quản lý deadline học tập cho sinh viên. Đề tài tiểu luận nhóm 5, GVHD: TS. Huỳnh Xuân Phụng.

- Bản đang vận hành: tên miền sutdytask.io.vn (Netlify, Firebase project `sutdytask`)
- Thành viên: Nguyễn Thanh Tùng (24TX810027), Trần Đức Tùng (24TX810026), Trương Thanh Vui (24TX810021)

## Công nghệ

- Front-end: React 18 (bản UMD qua CDN, không có bước build), Bootstrap 5, Chart.js
- Back-end: Firebase Authentication, Cloud Firestore (phân quyền bằng `firestore.rules`)
- Công cụ dev: Firebase Emulator Suite, `@firebase/rules-unit-testing`, `http-server`

## Cấu trúc thư mục

```
index.html, app.js, style.css   Trang gốc và component App
components/                     Thành phần dùng chung (Navbar, Login, AccountManager, ...)
pages/                          Các trang (Dashboard, Profile, Quiz, Admin, ...)
utils/                          firebase.js (kết nối Firebase), store.js (đọc/ghi Firestore hoặc localStorage),
                                grading.js (quy chế điểm), tuition.js (học phí), curriculum.js (CTĐT), constants.js, helpers.js
firestore.rules                 Security Rules của Firestore
firebase.json                   Cấu hình Emulator (cổng 9099, 8080, 4000)
tests/                          Kiểm thử Security Rules
scripts/seed-emulator.mjs       Nạp tài khoản demo vào Emulator
docs/                           Báo cáo tuần, nhật ký AI, phân tích, thiết kế, sửa lỗi
```

## Chạy ứng dụng trên máy local

Ứng dụng tự nhận biết môi trường theo địa chỉ đang chạy (xem `utils/firebase.js` và [docs/phan-tich/04-tach-moi-truong.md](docs/phan-tich/04-tach-moi-truong.md)):

| Địa chỉ | Firebase dùng | Ghi chú |
|---|---|---|
| `http://127.0.0.1:5500` hoặc `localhost` | Emulator, project `demo-studytask` | Mặc định khi chạy local; không chạm dữ liệu thật |
| `http://127.0.0.1:5500/?offline=1` | Không dùng | Đăng nhập bằng tài khoản demo cục bộ, không cần Emulator |
| Domain khác (Netlify, sutdytask.io.vn) | Production `sutdytask` | Bản đang vận hành |

### Yêu cầu

- Node.js 18 trở lên (nhóm thử với Node 24)
- Java 11 trở lên (Firestore Emulator cần Java; nhóm thử với JDK 21)
- Không cần đăng nhập Firebase CLI: project `demo-...` chạy hoàn toàn trên máy

### Các bước

```bash
npm install                 # lần đầu: cài Firebase CLI, http-server, thư viện test
npm run emulators           # cửa sổ 1: bật Auth (9099) + Firestore (8080) + UI (4000)
npm run seed                # cửa sổ 2: tạo 3 tài khoản demo trong Emulator
npm run serve               # cửa sổ 3: mở web tại http://127.0.0.1:5500
```

Tài khoản demo sau khi seed:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị viên | `admin@studytask.vn` | `admin123` |
| Giáo viên | `teacher@studytask.vn` | `teacher123` |
| Sinh viên | `student@studytask.vn` | `student123` |
| Phòng Đào tạo | `daotao@studytask.vn` | `daotao123` |
| Phòng Tài chính | `taichinh@studytask.vn` | `taichinh123` |

Seed còn nạp dữ liệu môn học, lịch, đơn giá học phí, một chương trình đào tạo và một khóa luận mẫu.
Xem và sửa dữ liệu Emulator tại http://127.0.0.1:4000. Dữ liệu Emulator mất khi tắt (chạy lại `npm run seed`).

Chỉ muốn xem giao diện, không cần Emulator: `npm run serve` rồi mở `http://127.0.0.1:5500/?offline=1`.

### Kiểm thử

```bash
npm run test:logic          # tính điểm, học phí, chương trình đào tạo (không cần Emulator)
npm run test:rules          # Security Rules: tự bật Firestore Emulator, chạy, rồi tắt
```

### Lỗi thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Could not start Firestore Emulator, port taken` | Còn tiến trình Java của Emulator lần trước (trên Windows `emulators:exec` đôi khi không tắt hẳn) | Tắt tiến trình `java.exe` đang giữ cổng 8080 (Task Manager hoặc `Get-NetTCPConnection -LocalPort 8080`) |
| Đăng nhập báo `auth/network-request-failed` | Chưa bật Emulator | Chạy `npm run emulators`, hoặc dùng `?offline=1` |
| Mở trực tiếp `index.html` (file://) bị trắng trang | Trình duyệt chặn ES module khi mở bằng file:// | Luôn chạy qua `npm run serve` |
| `java` không nhận | Chưa cài Java hoặc chưa có trong PATH | Cài JDK 11+ rồi mở lại terminal |

## Quy ước làm việc với Git

- Nhánh: `master` là bản ổn định. Mỗi việc làm trên nhánh riêng: `feature/<ten-viec>`, `fix/<ten-loi>`, `docs/<noi-dung>`.
- Gộp vào `master` qua Pull Request, có ít nhất một thành viên khác review.
- Mỗi thành viên commit bằng tài khoản GitHub của mình (`git config user.name` / `user.email` đúng tên, đúng email).
- Thông điệp commit: `<loai>: <mo ta ngan>`, loại gồm `feat`, `fix`, `docs`, `test`, `chore`, `refactor`. Ví dụ: `fix: luu ho so khong bao loi khi mat mang`.
- Mã hoặc tài liệu do AI sinh: thêm nhãn `[AI]` ở đầu thông điệp, ghi lần dùng AI vào `docs/ai-log/tuan-XX.md` kèm mã commit.
- Thay đổi `firestore.rules` phải chạy `npm run test:rules` đạt trước khi tạo Pull Request.
- Không commit `node_modules/`, tệp log của Emulator, tệp `.env`.

## Triển khai Security Rules lên production

Rules trong repo **không tự động** lên production. Sau khi đã kiểm thử, người có quyền trên project `sutdytask` chạy:

```bash
npx firebase login
npx firebase deploy --only firestore:rules --project sutdytask
```

Thứ tự bắt buộc cho bản tuần 2:

1. Export Firestore để sao lưu (Firebase Console → Firestore → Import/Export, hoặc `gcloud firestore export`).
2. Deploy **rules trước**. Mã mới ghi mật khẩu vào `userSecrets`, mà rules cũ không có quy tắc nào cho collection này, nên nếu mã mới lên Netlify trước thì tạo tài khoản và đổi mật khẩu sẽ bị từ chối.
3. Đưa mã lên Netlify (gộp vào `master` hoặc deploy thủ công).
4. Quản trị viên đăng nhập, vào **Quản trị → Tài khoản**, bấm **"Chuyển N mật khẩu sang kho riêng"** để chuyển mật khẩu cũ ra khỏi hồ sơ công khai.
5. Thử đăng nhập và lưu hồ sơ với cả 3 vai trò.

## Tài liệu

- Báo cáo tuần: [docs/bao-cao-tuan/](docs/bao-cao-tuan/)
- Nhật ký sử dụng AI: [docs/ai-log/](docs/ai-log/)
- Phân tích (nhận xét GVHD/GVPB, tiêu chí, Giữ/Bỏ/Sửa/Thêm, tách môi trường): [docs/phan-tich/](docs/phan-tich/)
- Thiết kế: [docs/thiet-ke/](docs/thiet-ke/)
- Sửa lỗi: [docs/sua-loi/](docs/sua-loi/)
