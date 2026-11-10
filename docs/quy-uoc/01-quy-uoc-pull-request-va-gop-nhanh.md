# Quy ước Pull Request và gộp nhánh

Rút ra từ các lỗi gặp ngày 10/11/2026 khi gộp PR39–PR43. Áp dụng cho cả nhóm.

## 1. Những lỗi đã gặp và cách tránh

| # | Lỗi | Nguyên nhân | Cách tránh |
|---|---|---|---|
| 1 | PR đã Approve nhưng không gộp được; Approve tự biến mất vài giây sau khi bấm | Sau khi PR trước gộp, `master` tiến lên và **điểm gốc chung** của nhánh với `master` đổi. GitHub gỡ Approve với lý do "The merge-base changed after approval" | Bấm **Update branch** (hoặc gộp `master` vào nhánh) **trước** khi xin Approve; không đẩy thêm commit sau khi đã có Approve |
| 2 | Mã không lên `master` dù PR báo "Merged" (PR43) | PR43 có base là **nhánh của PR42**. PR42 gộp vào `master` trước, rồi PR43 mới gộp, nên vào nhánh PR42 chứ không vào `master` | PR xếp sau PR khác: sau khi PR gốc gộp, **đổi base về `master` trước khi gộp**. Kiểm tra `PR guard` báo lỗi đúng tình huống này |
| 3 | CI đỏ ngẫu nhiên | Test phụ thuộc đồng hồ (`Date.now()` hai lần) | Test không so với giờ hiện tại hai lần; chạy lặp 50–100 lần khi nghi ngờ chập chờn |
| 4 | Hash tệp trên máy chủ lệch với repo | `git archive` trên Windows đổi dòng sang CRLF | `.gitattributes` ép LF; script triển khai vẫn chuẩn hóa LF |
| 5 | PR xếp chồng không chạy CI | CI chỉ chạy cho PR vào `master` | CI nay chạy cho mọi PR |

## 2. Quy trình cho một PR

1. Tạo nhánh từ `master` mới nhất: `feature/…`, `fix/…`, `docs/…`, `test/…`, `chore/…`.
2. Mở PR; điền **mẫu mô tả** (`.github/pull_request_template.md`): mục đích, PR phụ thuộc, kiểm thử đã chạy, có cần triển khai không.
3. Đợi CI xanh: `test`, `server-tests`, `PR guard`.
4. Bấm **Update branch** nếu `PR guard` hoặc GitHub báo nhánh tụt sau `master`. Chờ CI chạy lại rồi mới xin review.
5. Người review chạy lệnh kiểm thử hoặc ghi rõ đã xem phần nào; Approve.
6. Người khác (không phải tác giả khi có thể) bấm **Merge** bằng **Create a merge commit**.
7. Sau khi gộp: nếu PR có triển khai, ghi biên bản trong `docs/van-hanh/` và so hash `studytask_api.py` với `master`.

**Không dùng Squash hoặc Rebase khi gộp.** Với PR xếp chồng, Squash làm `master` chứa bản gộp mới còn nhánh con vẫn giữ commit gốc; mô phỏng ngày 10/11 cho thấy PR43 bị xung đột ở `ci.yml` và `smoke_live.py`.

## 3. PR xếp chồng (PR B xếp sau PR A)

Dùng khi B cần mã của A mà A chưa gộp.

1. Mở A với base `master`.
2. Mở B với base là **nhánh của A** (để tab Files changed chỉ hiện phần riêng của B), ghi "Chỉ gộp sau PR #A" trong mô tả.
3. Không ai đẩy thêm commit lên nhánh A sau khi đã có Approve.
4. A được Approve và gộp vào `master` (Create a merge commit).
5. **Ngay sau đó, đổi base của B về `master`** (nút ✎ cạnh tiêu đề → đổi base). Nếu nhánh A bị xóa sau khi gộp, GitHub tự đổi base của B về `master`; vẫn kiểm tra lại.
6. Bấm **Update branch** nếu có; chờ CI; Approve; gộp B.
7. Kiểm tra: `master` có các tệp của B (xem bảng ở mục 5).

Điểm gốc của B khi base là nhánh A là đầu nhánh A. Sau khi A gộp bằng merge commit và B được đổi base về `master`, điểm gốc vẫn là đầu nhánh A (mô phỏng ngày 10/11), nên Approve không bị gỡ nếu Approve đã có từ trước. Nếu vẫn bị gỡ, Approve lại một lần.

## 4. `PR guard` (`.github/workflows/pr-guard.yml`)

| Tình huống | Kết quả |
|---|---|
| PR có base là nhánh của một PR **đã gộp** | **Lỗi (✗)**: yêu cầu đổi base về `master` |
| PR xếp chồng, PR gốc còn mở | Ghi chú: chỉ gộp sau PR gốc, nhớ đổi base |
| Nhánh PR tụt sau base | **Cảnh báo**: bấm Update branch trước khi xin Approve |
| Một PR gộp xong | Bình luận tự động vào PR con (đổi base) và vào các PR còn mở bị tụt (Update branch) |

`PR guard` chạy lại khi có commit mới hoặc khi sửa PR (đổi base). Nó **không tự chạy lại khi PR gốc gộp xong**; vì vậy sau khi gộp, bot ghi bình luận vào PR con để nhắc.

## 5. Kiểm tra sau khi gộp (trước khi coi là xong)

```bash
git fetch origin
git ls-tree -r --name-only origin/master | grep -E "<đường dẫn tệp mới của PR>"
git log origin/master --oneline -5
```

Mọi tệp mới của PR phải có trên `origin/master`. Nếu không có: PR đã gộp vào nhánh khác (xem lỗi 2); mở PR mới từ nhánh đó vào `master`.

## 6. Cài đặt repo cần chủ repo (Admin) bật

Tôi (tác giả tài liệu) không có quyền đổi cài đặt GitHub; các mục dưới đây cần chủ repo làm tại **Settings**:

| Vị trí | Cài đặt | Tác dụng |
|---|---|---|
| Settings → General → Pull Requests | **Automatically delete head branches** = bật | Gộp xong thì xóa nhánh, và GitHub **tự đổi base** của PR xếp chồng về `master` (chặn lỗi 2) |
| Settings → General → Pull Requests | **Always suggest updating pull request branches** = bật | Hiện nút **Update branch** thường xuyên hơn (giảm lỗi 1) |
| Settings → General → Pull Requests | Tắt **Allow squash merging** và **Allow rebase merging**, giữ **Allow merge commits** | Không ai vô tình Squash/Rebase |
| Settings → Rules (hoặc Branches) → `master` | Require a pull request, **1 approval**, **Require status checks**: `test`, `server-tests`, `pr-guard` | Không gộp khi CI hoặc `PR guard` đỏ |
| Cùng chỗ | Giữ **Dismiss stale pull request approvals when new commits are pushed** = bật | Approve cũ không còn hiệu lực khi có commit mới (an toàn) |
| Cùng chỗ | **Require branches to be up to date before merging** = tùy: bật thì mỗi lần `master` tiến phải Update branch rồi chờ CI; tắt thì nhanh hơn nhưng phải nhớ Update branch (đã có `PR guard` nhắc) | |

Khuyến nghị tối thiểu: bật 2 mục đầu và tắt Squash/Rebase.
