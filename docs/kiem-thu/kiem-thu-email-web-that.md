# Kiểm thử email (xác thực email cá nhân, quên mật khẩu) trên website thật

- Người thực hiện: Nguyễn Thanh Tùng. Claude Code (AI) hướng dẫn các bước, kiểm tra kết quả qua API và soạn báo cáo. Người thực hiện tự nhập mật khẩu, mã xác nhận và đọc hộp thư. Cần ghi vào nhật ký sử dụng AI của nhóm.
- Ngày: 18/11/2026, khoảng 14:50–15:47 UTC (21:50–22:47 giờ Việt Nam). Chạy lại bước 2, bước 3 của B10: 19/11/2026, 09:46–10:03 giờ Việt Nam (mục 4a, lần 2).
- Website: https://sutdytask.io.vn (bản đang vận hành, không dùng localhost). Thư gửi thật qua Gmail của nhóm tới Gmail cá nhân của người thực hiện. Trong báo cáo và ảnh, địa chỉ này được che thành `ng***@gmail.com`.
- Đối chiếu: [PR51] (sửa 2 lỗi luồng email cá nhân, gộp `91cf96b` ngày 11/11/2026) và thiết kế [07-xac-thuc-email-ca-nhan.md](../thiet-ke/07-xac-thuc-email-ca-nhan.md).
- Minh chứng: thư mục [`anh/email-web-that/`](anh/email-web-that/) (gồm [nhật ký từng bước](anh/email-web-that/nhat-ky-thu-email.txt)) và [`anh/tu-dong/`](anh/tu-dong/).
- Điều kiện máy chủ đúng `master`: xem [kiem-thu-v4-web-that.md](kiem-thu-v4-web-that.md) mục 1 (53/53 tệp giao diện trùng `master` `56c0bb4`; API trùng theo script kiểm chứng trên máy chủ).

## 1. Lưu ý: hệ thống gửi **mã 6 chữ số**, không gửi liên kết

Các ca B3, B5, B8 trong yêu cầu viết theo kiểu "mở liên kết". StudyTask không gửi liên kết: thư chỉ chứa **mã 6 chữ số, hiệu lực 15 phút**, và người dùng nhập mã vào trang (thiết kế 07, mục 2–3). Vì vậy ba ca này được thử theo cách tương đương:

| Ca trong yêu cầu | Thử tương đương |
|---|---|
| B3 Mở liên kết xác thực từ email thật | Nhập mã lấy từ thư thật vào thẻ Email cá nhân |
| B5 Liên kết hết hạn hoặc đã sử dụng | Dùng lại mã liên kết sau khi đã xác minh |
| B8 Mở liên kết đặt lại mật khẩu | Nhập mã lấy từ thư đặt lại mật khẩu thật vào form Quên mật khẩu |

## 2. Tài khoản và lượt gửi thư

- Tài khoản thử: `sv2610019` (sinh viên, dữ liệu kiểm tải). Sau buổi thử, tài khoản này **có mật khẩu mới** do người thực hiện đặt, và **vẫn liên kết** Gmail cá nhân của người thực hiện (xem mục 6).
- Giới hạn của máy chủ: 6 thư mỗi giờ cho một IP, cách nhau tối thiểu 60 giây cho mỗi tài khoản, mỗi mã nhập sai tối đa 5 lần.
- Buổi thử đã dùng hết hạn mức trong một giờ: liên kết, quên #1, quên với tài khoản không tồn tại (vẫn tính lượt dù không gửi thư), quên #2, quên #3, và ít nhất một lần bấm gửi khác. Lần bấm lúc 22:43 bị 429 (xem B10).

## 3. Kiểm thử tự động và kiểm thử thủ công

| Loại | Chạy ở đâu | Gửi thư thật? | Kết quả |
|---|---|---|---|
| Tự động: `tests/server/test_email_codes.py` ([PR51]) | Máy cá nhân, API tạm cổng 8799, `STUDYTASK_MAIL_DEBUG=1` | Không (in mã ra log) | **37/37 đạt** ([log](anh/tu-dong/test_email_codes-2026-11-18.txt)). Gồm: hai tài khoản tranh một email, mã hết hạn (chỉnh `expires` trong CSDL), mã đã dùng, mã sai, gỡ/đổi email làm hủy mã đặt lại |
| **Thủ công** (báo cáo này) | Trình duyệt trên **web thật** | **Có**, tới Gmail thật | Bảng mục 4 |

Có hai việc chỉ thử thủ công mới kiểm chứng được: thư có thật sự đi qua SMTP Gmail tới hộp thư thật không, và giao diện có hiện đúng thông báo không. Ngược lại, các ca tranh chấp hai tài khoản và gỡ/đổi email khi mã đang chờ (lỗi 1, lỗi 2 của [PR51]) **không thử thủ công**: chúng cần hai hộp thư thật và thao tác chen giữa, nên chỉ dựa vào kiểm thử tự động.

## 4. Kết quả

| # | Trường hợp | Cách thử | Kết quả mong đợi | Kết quả thực tế | Đánh giá | Minh chứng |
|---|---|---|---|---|---|---|
| B1 | Gửi email xác thực | Hồ sơ của tôi → Email cá nhân → nhập Gmail + mật khẩu hiện tại → Gửi mã xác nhận | Sai mật khẩu: từ chối, không gửi. Đúng: gửi mã | Lần 1 nhập sai mật khẩu: `401 auth/wrong-password`, báo "Mật khẩu hiện tại không đúng.", không gửi thư. Lần 2 đúng mật khẩu: chuyển sang bước nhập mã | **PASS** | [B1](anh/email-web-that/B1-sai-mat-khau-hien-tai.png) |
| B2 | Email gửi đúng địa chỉ | Người thực hiện mở Gmail | Thư "StudyTask – xác nhận email cá nhân" tới đúng địa chỉ vừa nhập | Thư đến đúng hộp thư `ng***@gmail.com`, có mã 6 số | **PASS** | Người thực hiện xác nhận đã nhận thư; chưa chụp ảnh thư này. Thư cùng người gửi ở B7: [B7](anh/email-web-that/B7-thu-dat-lai.png) |
| B3 | Xác thực bằng mã từ email thật (thay cho liên kết) | Nhập mã trong thư → Xác nhận | Liên kết thành công | "Đã liên kết email cá nhân." | **PASS** | [B4](anh/email-web-that/B4-da-lien-ket-email.png) |
| B4 | Tài khoản sau khi xác thực | Xem thẻ Email cá nhân; `GET /api/account` | Hiện email đã che, nhãn Đã xác minh; máy chủ lưu đúng email | Giao diện: `ng••••••@gmail.com`, "Đã xác minh". API: `recoveryEmail = ng***@gmail.com`. Hai bên khớp | **PASS** | [B4](anh/email-web-that/B4-da-lien-ket-email.png), [nhật ký](anh/email-web-that/nhat-ky-thu-email.txt) |
| B5 | Mã liên kết đã sử dụng / hết hạn | Sau khi xác minh: `POST /api/account/email/verify` | Từ chối | `400 bad-code` "Mã không đúng hoặc đã hết hạn." (mã đã bị xóa khi xác minh) | **PASS** một phần (*) | [nhật ký](anh/email-web-that/nhat-ky-thu-email.txt) |
| B6 | Chức năng quên mật khẩu | Đã đăng xuất → Đăng nhập → Quên mật khẩu? → `sv2610019` → Gửi mã | Báo đã gửi; tài khoản không tồn tại cũng trả lời giống hệt | Hiện bước 2 (mã + mật khẩu mới). `POST /api/auth/forgot` với tài khoản có thật và không tồn tại đều trả `200 {"ok": true}` | **PASS** | [B6](anh/email-web-that/B6-quen-mat-khau-buoc-2.png) |
| B7 | Email đặt lại mật khẩu | Người thực hiện mở Gmail | Thư "StudyTask – mã đặt lại mật khẩu" tới email đã xác minh | Nhận thư "Mã đặt lại mật khẩu StudyTask của bạn là: …", tới đúng email đã xác minh; mã #2 dùng được ở B8 | **PASS** | [B7](anh/email-web-that/B7-thu-dat-lai.png) (thư mã #3, người gửi `StudyTask <tr***@gmail.com>`, đã che địa chỉ và mã) |
| B8 | Đặt lại bằng mã từ email thật (thay cho liên kết) | Nhập mã #2 + mật khẩu mới → Đặt lại mật khẩu | Thành công | "Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới." | **PASS** | [B8](anh/email-web-that/B8-dat-lai-mat-khau-thanh-cong.png) |
| B9 | Đặt mật khẩu mới và đăng nhập lại | Đăng nhập `sv2610019` bằng mật khẩu mới | Vào được | Vào được, vai trò Sinh viên; `/api/auth/me` = `sv2610019`; email vẫn liên kết | **PASS** | [B9](anh/email-web-that/B9-dang-nhap-bang-mat-khau-moi.png) |
| B10 | Mã không hợp lệ và mã hết hạn | Xem mục 4a | Từ chối, mật khẩu không đổi | Mã đã dùng, mã sai, mã hết hạn đều `400` "Mã không đúng hoặc đã hết hạn."; mật khẩu không đổi | **PASS** | Mục 4a |

(*) B5: lần này chỉ thử "không còn mã chờ thì mã nào cũng bị từ chối". Hai trường hợp chưa thử thủ công:
- Nhập lại **đúng** mã liên kết vừa dùng: người thực hiện không lưu lại mã đó.
- Mã liên kết **hết hạn**: phải xin thêm thư rồi chờ 15 phút. Ca hết hạn đã được thử thủ công với mã đặt lại mật khẩu (B10), và cả hai loại mã cùng đi qua hàm `check_code`. Ca mã liên kết hết hạn có trong kiểm thử tự động, đã đạt.

### 4a. Chi tiết B10

| Ca | Thời điểm (giờ VN) | Cách thử | Kết quả | Đánh giá | Minh chứng |
|---|---|---|---|---|---|
| Mã **đã sử dụng** | 22:23 | Giao diện, bước 2: nhập mã #2 `667858` (đã dùng ở B8) + mật khẩu bất kỳ | "Mã không đúng hoặc đã hết hạn." | **PASS** | [ảnh](anh/email-web-that/B10-ma-da-dung-667858.png) |
| Mã **không hợp lệ** | 22:24 | Giao diện, bước 2: nhập `000000` | "Mã không đúng hoặc đã hết hạn." | **PASS** | [ảnh](anh/email-web-that/B10-ma-sai-000000.png) |
| Mã **hết hạn** | 22:47 | `POST /api/auth/reset` với mã #3 (tạo 22:22, hạn 22:37) và mật khẩu ngẫu nhiên không lưu | `400 bad-code`. Mã #3 mới bị nhập sai 2 lần (dưới giới hạn 5) và không bị thay (lần Gửi mã 22:43 bị 429), nên lý do từ chối chỉ có thể là hết hạn. Mật khẩu không đổi: máy chủ trả 400 trước bước đặt mật khẩu (chưa đăng nhập lại để xác nhận bằng tay) | **PASS** | [nhật ký](anh/email-web-that/nhat-ky-thu-email.txt) |
| Giới hạn gửi thư (thêm) | 22:43 | Giao diện, bước 1: Gửi mã | "Bạn yêu cầu quá nhiều lần. Thử lại sau ít phút." (429, 6 thư/giờ/IP) | **PASS** (đúng thiết kế 07 mục 3) | [ảnh](anh/email-web-that/B10-gioi-han-gui-thu-429.png) |

Ở lần 1, ca mã hết hạn phải thử qua API thay vì giao diện. Lý do: form Quên mật khẩu chỉ hiện ô nhập mã sau khi **Gửi mã** thành công. Sau khi tải lại trang, muốn nhập lại một mã cũ thì phải gửi mã mới, và mã mới **thay** mã cũ (mỗi tài khoản chỉ có một mã đặt lại). Đây là hành vi an toàn. Vì vậy lần 2 giữ nguyên trang ở bước 2 suốt hơn 15 phút.

#### Lần 2 (chạy lại bước 2 và bước 3, 19/11/2026, hoàn toàn trên giao diện)

Claude Code thao tác trên giao diện theo yêu cầu người thực hiện. Người thực hiện tự gõ mật khẩu thử vào ô "Mật khẩu mới" và đọc mã trong Gmail. Trang giữ nguyên ở bước 2 từ lúc gửi mã tới lúc thử mã hết hạn, không tải lại.

| Ca | Thời điểm (giờ VN) | Cách thử | Kết quả | Đánh giá | Minh chứng |
|---|---|---|---|---|---|
| Gửi mã #4 | 09:46:24 | Trang đăng nhập (chưa ai đăng nhập) → `sv2610019` → Quên mật khẩu? → Gửi mã | `POST /api/auth/forgot` 200, hiện bước 2; mã #4 hạn 10:01:24 | — | [ảnh](anh/email-web-that/lan2-B10-buoc2-da-gui-ma-4.jpg) |
| Mã **đã sử dụng** | 09:48:04 | Nhập `667858` (đã dùng ở B8) | `400`, "Mã không đúng hoặc đã hết hạn." | **PASS** | [ảnh](anh/email-web-that/lan2-B10-ma-da-dung-667858.jpg) |
| Mã **không hợp lệ** | 09:48:15 | Nhập `000000` | `400`, cùng thông báo | **PASS** | [ảnh](anh/email-web-that/lan2-B10-ma-sai-000000.jpg) |
| Mã **hết hạn** | 10:03:33 | Cùng trang, nhập mã #4 sau khi quá hạn 10:01:24 | `400`, cùng thông báo. Mã #4 mới sai 2 lần (dưới 5) và không bị thay, nên lý do từ chối chỉ có thể là hết hạn. Mật khẩu không đổi | **PASS** | [ảnh](anh/email-web-that/lan2-B10-ma-het-han.jpg), [nhật ký](anh/email-web-that/nhat-ky-thu-email.txt) |

Kết quả lần 2 trùng lần 1. Riêng ca mã hết hạn nay đã được xác nhận cả trên giao diện, không chỉ qua API.

## 5. Phát hiện

**Không phát hiện lỗi** trong phạm vi đã thử: 9 ca PASS, 1 ca PASS một phần (B5); B3, B5, B8 thử theo cách tương đương ở mục 1. Không có gì cần sửa mã. Ba ghi nhận để nhóm cân nhắc, không bắt buộc:

| # | Ghi nhận | Đề xuất (tùy chọn) |
|---|---|---|
| G1 | Sau khi tải lại trang, form Quên mật khẩu không có cách nhập một mã đã nhận mà không gửi mã mới (và gửi mã mới làm mã cũ mất hiệu lực). Người dùng lỡ tải lại trang phải chờ thư mới | Thêm nút "Tôi đã có mã" ở bước 1, chuyển thẳng sang bước 2 |
| G2 | Gọi "quên mật khẩu" với tài khoản không tồn tại vẫn tính vào hạn mức 6 thư/giờ/IP. Hành vi này đúng, vì nhờ vậy không dò được tài khoản. Nhưng người dùng gõ nhầm tên vài lần sẽ hết lượt | Giữ nguyên; có thể ghi vào hướng dẫn sử dụng |
| G3 | Thư gửi từ `StudyTask <tr***@gmail.com>`, một địa chỉ Gmail đứng tên thành viên. Thiết kế 07 ghi "tài khoản Gmail chung của nhóm" | Nhóm xác nhận đây có phải tài khoản chung không; nếu không, cân nhắc chuyển sang tài khoản riêng của nhóm |

## 6. Trạng thái sau khi thử

| Mục | Trạng thái |
|---|---|
| Mật khẩu `sv2610019` | Đã đổi sang mật khẩu mới do người thực hiện đặt (không ghi ở đây). Các thành viên khác dùng tài khoản này cần hỏi người thực hiện |
| Email cá nhân của `sv2610019` | **Vẫn liên kết** Gmail cá nhân của người thực hiện. Nên gỡ (Hồ sơ → Đổi / gỡ email cá nhân, cần mật khẩu) nếu tài khoản thử dùng chung, để thư đặt lại mật khẩu không tiếp tục gửi tới hộp thư cá nhân |
| Bảng `codes` | Không còn mã đặt lại nào dùng được: mã #2 đã dùng (máy chủ xóa khi dùng); mã #3 hết hạn lúc 22:37 (dòng còn trong bảng nhưng bị từ chối, sẽ bị thay ở lần quên mật khẩu sau) |

## 7. Đối chiếu với [PR51]

| Nội dung [PR51] | Tự động | Thủ công trên web thật |
|---|---|---|
| Lỗi 1: xác minh khi email đã thuộc tài khoản khác → 409, không cướp email | Đạt | Không thử (cần 2 hộp thư thật) |
| Lỗi 2: gỡ/đổi email thì hủy mã đặt lại đang chờ | Đạt | Không thử (cần gỡ email giữa luồng; nên làm ở lần sau nếu nhóm cần) |
| Mã đúng còn hạn → đặt lại được, đăng nhập bằng mật khẩu mới | Đạt | **Đạt** (B8, B9) |
| Mã đã dùng, mã sai, mã hết hạn → 400, mật khẩu không đổi | Đạt | **Đạt** (B10) |
| Quên mật khẩu không lộ tài khoản tồn tại | Đạt (`test_account.py`) | **Đạt** (B6) |
| Gửi thư thật qua SMTP Gmail | Không (chế độ debug) | **Đạt** (B2, B7) |

Báo cáo tuần 6 và thiết kế 07 mục 5 ghi "Luồng liên kết email và quên mật khẩu trên giao diện web với thư thật: **chưa ghi nhận kết quả**". Lần này đã thử trên web thật với thư thật.

[PR51]: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/pull/51
