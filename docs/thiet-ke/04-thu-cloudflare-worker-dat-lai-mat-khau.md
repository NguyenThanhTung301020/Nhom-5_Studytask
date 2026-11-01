# Thiết kế 04 – Bản thử Cloudflare Worker gửi email đặt lại mật khẩu

Việc 4 của kế hoạch tuần 4. Thực hiện ngày 01/11/2026 trên project Firebase thử `studytask-test` (không đụng project `sutdytask` đang vận hành).

## 1. Mục tiêu

Kiểm tra một Cloudflare Worker có gọi được Identity Toolkit để Firebase gửi email đặt lại mật khẩu hay không, rồi đề xuất phương án máy chủ cho tuần 5.

## 2. Bản thử

Mã nằm trong `reset-worker/`.

- `src/index.js`: nhận `POST { email }`, kiểm tra định dạng email, gọi `accounts:sendOobCode` với `requestType: PASSWORD_RESET`, trả `{ ok: true | false }`. Không trả mã lỗi của Firebase cho người gọi; mã lỗi chỉ ghi vào log.
- Khóa API của Firebase lưu ở secret `FIREBASE_API_KEY` (Cloudflare) và `.dev.vars` (máy cục bộ, đã nằm trong `.gitignore`). Không có khóa nào trong mã.
- `test/index.spec.js`: 5 ca kiểm thử không cần mạng (gọi `fetch` được giả lập). Chạy bằng `npx vitest run` trong `reset-worker/`.

Cách chạy lại:

```bash
cd reset-worker
npm install
# tạo .dev.vars gồm một dòng: FIREBASE_API_KEY=<Web API Key của project thử>
npx wrangler dev
```

## 3. Kết quả

| Hạng mục | Kết quả |
|---|---|
| Công cụ | Node.js 26.13.0, Wrangler 4.156.0, gói Cloudflare Free |
| Chạy cục bộ (`wrangler dev`) | Identity Toolkit trả 200 (`GetOobConfirmationCodeResponse`); Worker trả `{"ok":true}` sau khoảng 1,2–1,4 giây (1385 ms và 1244 ms ở hai lần gọi) |
| Email về hộp thư | Có, tiêu đề "Reset your password for studytask-test", người gửi `noreply@studytask-test.firebaseapp.com`, chứa liên kết đặt lại mật khẩu |
| Đã deploy lên Cloudflare (`wrangler deploy`) | Thành công; gọi lại từ máy cá nhân trả `{"ok":true}` và email đến hộp thư, Gmail hiển thị "1 phút trước" tại thời điểm kiểm tra |
| Email không có tài khoản | Identity Toolkit vẫn trả 200 và Worker trả `{"ok":true}`; không có thư nào được gửi (hộp thư không có thật). Phù hợp với cơ chế chống dò email của Firebase |
| Kiểm thử tự động | 5/5 đạt (`npx vitest run`) |

Các lỗi gặp phải khi làm, để người sau khỏi mất thời gian:

- `npx`/`node` báo không nhận ra trong terminal mở trước khi cài Node: mở terminal mới hoặc nạp lại PATH.
- PowerShell chặn `npm.ps1`: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.
- `wrangler login` báo hết thời gian chờ nếu duyệt quá chậm: chạy lại và bấm Authorize ngay.
- Windows PowerShell 5.1 làm hỏng dấu nháy kép khi truyền JSON cho `curl.exe`: dùng `Invoke-RestMethod`.
- Subdomain `workers.dev` mới đăng ký chưa dùng được ngay: gọi HTTPS báo lỗi TLS trong vài phút đầu, sau đó bình thường.

## 4. Chưa kiểm chứng

- Chưa gọi Worker từ trình duyệt thật của ứng dụng (CORS hiện để `*`; biến `ALLOWED_ORIGIN` chưa được đặt).
- Chưa thử giới hạn tần suất hay chống lạm dụng. Worker hiện công khai, ai biết địa chỉ cũng có thể yêu cầu gửi email đặt lại mật khẩu tới một email bất kỳ.
- Chưa đo thời gian email đến chính xác (chỉ biết trong khoảng một phút).
- Hạn mức gói Free chưa được đối chiếu lại với tài liệu hiện hành của Cloudflare.
- Chưa thử trên project `sutdytask` (đang vận hành).

Vì Worker chưa có giới hạn tần suất, địa chỉ đã deploy không ghi trong tài liệu này. Sau khi chốt phương án, nên xóa Worker thử trên Cloudflare nếu không dùng tiếp.

## 5. Phương án máy chủ cho tuần 5 (đề xuất, cần nhóm xác nhận)

1. **Quên mật khẩu: giữ nguyên `sendPasswordResetEmail` ở máy khách** ([utils/firebase.js](../../utils/firebase.js)). Bản thử cho thấy Worker chỉ gọi lại đúng điểm cuối mà SDK đã gọi, không thêm được tính năng nào. Khóa Web API của Firebase vốn công khai nên "giấu khóa" không phải lý do để thêm Worker. Firebase đã chống dò email, và một Worker công khai còn tạo thêm bề mặt bị lạm dụng.
2. **Chỉ thêm Worker khi có việc máy khách không làm được**, ví dụ thao tác cần quyền quản trị hoặc bí mật (liên quan việc chuyển mật khẩu sang `userSecrets` ở việc 3 của kế hoạch), hoặc cần giới hạn tần suất theo địa chỉ IP. Lúc đó phải làm thêm: đặt `ALLOWED_ORIGIN`, giới hạn tần suất, xác thực người gọi.
3. **Hạ tầng**: Cloudflare Workers dùng được, thao tác triển khai ổn (deploy khoảng 2 giây). Điều kiện: nhóm chấp nhận phụ thuộc thêm một nền tảng ngoài Netlify và Firebase.

Việc cần nhóm quyết định: có thật sự có việc ở mục 2 trong tuần 5 hay không. Nếu không, bỏ Worker và không phải bảo trì thêm gì.
