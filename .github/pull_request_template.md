## Mục đích

<!-- Một hai câu: PR làm gì, vì sao. Gắn mã việc của kế hoạch tuần nếu có (ví dụ: "việc 11"). -->

## Phụ thuộc và thứ tự gộp

<!-- Chọn MỘT dòng và điền số PR. Nhóm chỉ gộp PR mới sau khi PR trước đã gộp. -->

- [ ] PR **độc lập**, base là `master`.
- [ ] PR **xếp sau PR #__** (base là nhánh của PR gốc). Chỉ gộp sau PR #__.
  **Khi PR gốc đã gộp: đổi base của PR này về `master` TRƯỚC khi bấm Merge** (nút ✎ cạnh tiêu đề → đổi base). Gộp vào nhánh đã gộp rồi thì mã không lên `master`.

## Trước khi xin review

- [ ] Đã bấm **Update branch** (hoặc gộp `master` mới nhất vào nhánh). Nếu `master` tiến lên sau khi người khác Approve thì GitHub gỡ Approve ("merge-base changed").
- [ ] CI xanh: `test`, `server-tests`, `PR guard`.
- [ ] Đã chạy kiểm thử trên máy, ghi lệnh và kết quả bên dưới.
- [ ] Commit có AI tham gia có nhãn `[AI]`.
- [ ] Không đẩy thêm commit lên nhánh sau khi đã có Approve (nếu cần, báo người review Approve lại).

## Kiểm thử đã chạy

<!-- Ví dụ: python3 tests/server/test_quiz_v3.py → KẾT QUẢ: ĐẠT ; npm run test:logic → 62/62 -->

## Triển khai

- [ ] Không cần triển khai lên máy chủ.
- [ ] Cần triển khai (`deploy/deploy.sh`): ghi biên bản trong `docs/van-hanh/` và so hash `studytask_api.py` với `master` sau khi gộp.

## Cách gộp (dành cho người bấm Merge)

Dùng **Create a merge commit**. **Không dùng Squash hoặc Rebase**: các PR xếp chồng sẽ bị lệch lịch sử và xung đột.
Chi tiết: [docs/quy-uoc/01-quy-uoc-pull-request-va-gop-nhanh.md](../docs/quy-uoc/01-quy-uoc-pull-request-va-gop-nhanh.md).
