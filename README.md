# StudyTask

Website quản lý deadline học tập cho sinh viên. Đề tài tiểu luận nhóm 5, GVHD: TS. Huỳnh Xuân Phụng.

- Bản đang vận hành: https://sutdytask.io.vn (máy chủ riêng của nhóm qua Cloudflare Tunnel). **Từ 03/11/2026 không còn dùng Firebase**: xem [docs/thiet-ke/06-chuyen-firebase-sang-may-chu-rieng.md](docs/thiet-ke/06-chuyen-firebase-sang-may-chu-rieng.md)
- Thành viên: Nguyễn Thanh Tùng (24TX810027), Trần Đức Tùng (24TX810026), Trương Thanh Vui (24TX810021)

## Công nghệ

- Front-end: React 18 (bản UMD qua CDN, không có bước build), Bootstrap 5, Chart.js
- Back-end: API Python (`server/studytask_api.py`, chỉ thư viện chuẩn) + SQLite; nginx + Cloudflare Tunnel. Phân quyền trong hàm `can()` (chuyển từ `firestore.rules`, file này vẫn giữ làm đặc tả)
- Công cụ dev/kiểm thử: Python 3 (`tests/server/`), Firebase Emulator Suite + `@firebase/rules-unit-testing` (kiểm thử `firestore.rules`), `http-server`

## Cấu trúc thư mục

```
index.html, app.js, style.css   Trang gốc và component App
components/                     Thành phần dùng chung (Navbar, Login, AccountManager, ...)
pages/                          Các trang (Dashboard, Profile, Quiz, Admin, ...)
utils/                          firebase.js (giữ tên cũ, nay gọi API /api của máy chủ), chat.js (chat realtime),
                                store.js (đọc/ghi dữ liệu), grading.js (quy chế điểm), tuition.js (học phí),
                                curriculum.js (CTĐT), constants.js, helpers.js
server/                         API Python thay Firebase (studytask_api.py) và hướng dẫn chạy
deploy/                         Triển khai: deploy.sh, cấu hình nginx, dịch vụ systemd, server-report.sh
firestore.rules                 Security Rules cũ của Firestore (giữ làm đặc tả cho hàm can() của máy chủ)
firebase.json                   Cấu hình Emulator (chỉ dùng để kiểm thử firestore.rules)
tests/                          Kiểm thử Security Rules (Node) và tests/server/ (kiểm thử máy chủ, Python)
scripts/seed-emulator.mjs       Nạp tài khoản demo vào Emulator
reset-worker/                   Bản thử Cloudflare Worker (đặt lại mật khẩu)
_headers                        Header bảo mật và cache cho Cloudflare
docs/                           Báo cáo tuần, nhật ký AI, phân tích, thiết kế, sửa lỗi
```

## Chạy ứng dụng trên máy local

> **Lưu ý (03/11/2026):** giao diện nay gọi API của máy chủ (`/api`), không còn nối Firebase hay Emulator. Chạy đủ hệ thống cần API Python và nginx như trong [server/README.md](server/README.md). Với `npm run serve`, chỉ chế độ `?offline=1` (tài khoản demo cục bộ) còn dùng được. Phần Emulator dưới đây chỉ còn phục vụ kiểm thử `firestore.rules`; bảng môi trường và tài khoản demo bên dưới là của bản cũ.

Ứng dụng (bản cũ) tự nhận biết môi trường theo địa chỉ đang chạy (xem `utils/firebase.js` và [docs/phan-tich/04-tach-moi-truong.md](docs/phan-tich/04-tach-moi-truong.md)):

| Địa chỉ | Firebase dùng | Ghi chú |
|---|---|---|
| `http://127.0.0.1:5500` hoặc `localhost` | Emulator, project `demo-studytask` | Mặc định khi chạy local; không chạm dữ liệu thật |
| `http://127.0.0.1:5500/?offline=1` | Không dùng | Đăng nhập bằng tài khoản demo cục bộ, không cần Emulator |
| Domain khác (Cloudflare, sutdytask.io.vn) | Production `sutdytask` | Bản đang vận hành |

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

#### Kiểm thử tự động trên GitHub (CI)

Workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) chạy trên GitHub Actions mỗi khi mở hoặc cập nhật Pull Request vào `master` và khi gộp vào `master`:

1. Cài Node.js 24 và Java 21 (Firestore Emulator cần Java).
2. `npm ci`
3. `npm run test:logic`
4. `npm run test:rules` (tự bật Firestore Emulator project `demo-studytask`, không cần tài khoản Firebase hay secret)

Xem kết quả: tab **Checks** của PR, hoặc tab **Actions** của repo. Dấu tích xanh là đạt. Nếu có dấu X đỏ, bấm vào bước bị lỗi để xem log, sửa trên máy, chạy lại đúng lệnh đó rồi push. CI sẽ tự chạy lại.

### Lỗi thường gặp

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Could not start Firestore Emulator, port taken` | Trên Windows, sau mỗi lần `npm run test:rules` / `test:rules:deep` (`emulators:exec`), tiến trình `java.exe` của Firestore Emulator đôi khi còn sót và giữ cổng 8080, nên lần chạy sau báo lỗi | Chạy lệnh tắt tiến trình ở mục "Lưu ý khi chạy trên Windows" bên dưới, rồi chạy lại |
| Đăng nhập báo `auth/network-request-failed` | Chưa bật Emulator | Chạy `npm run emulators`, hoặc dùng `?offline=1` |
| Mở trực tiếp `index.html` (file://) bị trắng trang | Trình duyệt chặn ES module khi mở bằng file:// | Luôn chạy qua `npm run serve` |
| `java` không nhận | Chưa cài Java hoặc chưa có trong PATH | Cài JDK 11+ rồi mở lại terminal |
| `npm run serve` báo `EADDRINUSE` cổng 5500 | Còn một `http-server` cũ chạy nền | Cổng 5500 thuộc `http-server`, không phải Emulator. Nhấn Ctrl+C ở cửa sổ đang chạy `npm run serve`; nếu không còn cửa sổ đó, dùng bước 1 ở mục "Lưu ý khi chạy trên Windows" với cổng 5500 rồi `Stop-Process -Id <Id>` |
| Đang mở `npm run emulators` mà chạy `npm run test:rules` thì báo port taken, hoặc dữ liệu seed bị mất | Hai lệnh dùng chung cổng 8080; file kiểm thử gọi `clearFirestore()` sẽ xóa dữ liệu đang dùng | Tắt `npm run emulators` (Ctrl+C) trước khi chạy test, chạy xong bật lại và `npm run seed` |
| Emulator tự tắt, terminal báo mã `0xC000013A` | Thường do đã nhấn Ctrl+C; cũng có thể do đóng cửa sổ terminal đang chạy Emulator | Bật lại `npm run emulators` rồi chạy `npm run seed` (dữ liệu Emulator mất khi tắt) |
| `npm run test:rules` hoặc `npm run emulators` thoát mã 1, log có `FileNotFoundException` khi mở `firestore.rules` | Có thể do repo nằm ở đường dẫn có dấu tiếng Việt khiến Java không đọc được tên thư mục | Clone repo vào đường dẫn không dấu, ví dụ `C:\dev\studytask` |
| Thoát mã 1, log có `Unable to establish loopback connection` hoặc `Invalid argument: connect` | Có thể do thư mục tạm của Java 21 dùng đường dẫn rút gọn có dấu `~`, khiến Java không tạo được kênh nội bộ | Đặt `jdk.net.unixdomain.tmpdir` theo mục "Lưu ý khi chạy trên Windows" bên dưới |

#### Lưu ý khi chạy trên Windows

**Bước 1: xem tiến trình nào đang giữ cổng** (thay `8080` bằng cổng báo lỗi), chạy trong PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Get-Process -Id $_ } | Select-Object Id, ProcessName
```

Lệnh không in gì nghĩa là không có tiến trình nào giữ cổng.

**Bước 2: tắt tiến trình.** Với cổng 8080, nếu bước 1 hiện `java`, chỉ tắt tiến trình `java` đang giữ cổng:

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Get-Process -Id $_ } | Where-Object ProcessName -eq 'java' | Stop-Process -Force -PassThru
```

Lệnh in ra tiến trình vừa tắt. Nếu không in gì thì chưa có tiến trình nào bị tắt, hãy xem lại kết quả bước 1. Với cổng khác, hoặc tiến trình không phải `java`, chỉ tắt khi chắc đó là tiến trình của mình: `Stop-Process -Id <Id>`.

- Cổng của Emulator: 8080, 9099, 4000, 4400, 4500.
- Nên kiểm tra cổng 8080 sau mỗi lần chạy `npm run test:rules` hoặc `test:rules:deep` nếu định chạy tiếp.
- CI trên GitHub chạy Ubuntu, đến nay chưa ghi nhận lỗi này.

Nếu thư mục tạm có dạng rút gọn (ví dụ `C:\Users\TENNGU~1\AppData\Local\Temp`) và Java 21 báo lỗi kênh nội bộ, chạy trong PowerShell:

```powershell
New-Item -ItemType Directory -Force C:\dev\tmp
$env:JAVA_TOOL_OPTIONS = "-Djdk.net.unixdomain.tmpdir=C:\dev\tmp"
npm run test:rules
```

Đường dẫn `C:\dev\tmp` có thể thay bằng thư mục khác, nhưng không nên có dấu hoặc khoảng trắng. Biến này chỉ có tác dụng trong cửa sổ PowerShell hiện tại. Theo báo cáo kiểm thử của nhóm, các tùy chọn `-Djava.net.preferIPv4Stack=true` và `-Djava.io.tmpdir` không xử lý được lỗi này.

## Quy ước làm việc với Git

- Nhánh: `master` là bản ổn định. Mỗi việc làm trên nhánh riêng: `feature/<ten-viec>`, `fix/<ten-loi>`, `docs/<noi-dung>`.
- Gộp vào `master` qua Pull Request, có ít nhất một thành viên khác review.
- Mỗi thành viên commit bằng tài khoản GitHub của mình (`git config user.name` / `user.email` đúng tên, đúng email).
- Thông điệp commit: `<loai>: <mo ta ngan>`, loại gồm `feat`, `fix`, `docs`, `test`, `chore`, `refactor`. Ví dụ: `fix: luu ho so khong bao loi khi mat mang`.
- Mã hoặc tài liệu do AI sinh: thêm nhãn `[AI]` ở đầu thông điệp, ghi lần dùng AI vào `docs/ai-log/tuan-XX.md` kèm mã commit.
- Thay đổi `firestore.rules` phải chạy `npm run test:rules` đạt trước khi tạo Pull Request. Mỗi PR phải có CI xanh mới gộp.
- Không commit `node_modules/`, tệp log của Emulator, tệp `.env`.

## Triển khai Security Rules lên production

Rules trong repo **không tự động** lên production. Sau khi đã kiểm thử, người có quyền trên project `sutdytask` chạy:

```bash
npx firebase login
npx firebase deploy --only firestore:rules --project sutdytask
```

Thứ tự bắt buộc cho bản tuần 2:

1. Export Firestore để sao lưu (Firebase Console → Firestore → Import/Export, hoặc `gcloud firestore export`).
2. Deploy **rules trước**. Mã mới ghi mật khẩu vào `userSecrets`, mà rules cũ không có quy tắc nào cho collection này, nên nếu mã mới lên Cloudflare trước thì tạo tài khoản và đổi mật khẩu sẽ bị từ chối.
3. Upload mã lên Cloudflare (upload thủ công; gộp vào `master` không tự deploy).
4. Quản trị viên đăng nhập, vào **Quản trị → Tài khoản**, bấm **"Chuyển N mật khẩu sang kho riêng"** để chuyển mật khẩu cũ ra khỏi hồ sơ công khai.
5. Thử đăng nhập và lưu hồ sơ với cả 3 vai trò.

## Tài liệu

- Báo cáo tuần: [docs/bao-cao-tuan/](docs/bao-cao-tuan/)
- Nhật ký sử dụng AI: [docs/ai-log/](docs/ai-log/)
- Phân tích (nhận xét GVHD/GVPB, tiêu chí, Giữ/Bỏ/Sửa/Thêm, tách môi trường): [docs/phan-tich/](docs/phan-tich/)
- Thiết kế: [docs/thiet-ke/](docs/thiet-ke/)
- Sửa lỗi: [docs/sua-loi/](docs/sua-loi/)
