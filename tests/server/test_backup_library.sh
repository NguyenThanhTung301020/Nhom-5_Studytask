#!/bin/bash
# Việc 6 tuần 8: bản sao lưu có PDF kho sách (library/books), không có sách đã gỡ (library/removed),
# PDF không đổi dùng liên kết cứng với bản trước, và lần thử khôi phục bắt được bản thiếu hoặc hỏng PDF.
# Chạy trên dữ liệu tạm (không đụng /var/lib/studytask, không cần ổ sao lưu gắn thật).
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"; ROOT="$HERE/../.."
BACKUP="$ROOT/deploy/backup/studytask-backup.sh"; RESTORE="$ROOT/deploy/backup/studytask-restore-test.sh"
command -v rsync >/dev/null || { echo "FAIL cần rsync để chạy kiểm thử này"; exit 1; }
W="$(mktemp -d)"; trap 'rm -rf "$W"' EXIT
export STUDYTASK_DATA="$W/data" BACKUP_ROOT="$W/bk" REQUIRE_MOUNT=0 MIN_FREE_GB=0
mkdir -p "$STUDYTASK_DATA/library/books" "$STUDYTASK_DATA/library/removed" "$STUDYTASK_DATA/uploads/library" "$BACKUP_ROOT"
ok=1
chk() { if eval "$2"; then echo "PASS $1"; else echo "FAIL $1"; ok=0; fi; }

# Dữ liệu tạm: CSDL tạo bằng chính API, 2 sách trong danh mục, 1 sách đã gỡ
python3 "$ROOT/server/studytask_api.py" create-user ad01 adminpass1 admin AD >/dev/null
printf '%%PDF-1.4 sach a\n' > "$STUDYTASK_DATA/library/books/sach-a.pdf"
printf '%%PDF-1.4 sach b dai hon\n' > "$STUDYTASK_DATA/library/books/sach-b.pdf"
printf '%%PDF-1.4 da go\n' > "$STUDYTASK_DATA/library/removed/sach-go.pdf"
printf 'jpg' > "$STUDYTASK_DATA/uploads/library/sach-a.jpg"
python3 - "$ROOT/server" <<'PY'
import os, sys
sys.path.insert(0, sys.argv[1])
import studytask_api as a
for i in ('sach-a', 'sach-b'):
    f = os.path.join(a.LIBRARY_DIR, 'books', i + '.pdf')
    a.doc_put('libraryBooks', i, {'id': i, 'title': i, 'file': i + '.pdf', 'size': os.path.getsize(f)})
a.db().commit()
PY

# Lần 1
bash "$BACKUP" > "$W/b1.log" 2>&1 || { echo "FAIL sao lưu lần 1 lỗi:"; cat "$W/b1.log"; exit 1; }
B1="$(readlink -f "$BACKUP_ROOT/LATEST")"
chk "bản sao lưu có 2 PDF trong library/books" '[ "$(find "$B1/library/books" -name "*.pdf" | wc -l)" = 2 ]'
chk "không chép sách đã gỡ (library/removed)" '[ ! -e "$B1/library/removed" ] && ! grep -rq "da go" "$B1"'
chk "bìa sách có trong uploads/library" '[ -f "$B1/uploads/library/sach-a.jpg" ]'
chk "MANIFEST ghi so_sach_thu_vien: 2" 'grep -qx "so_sach_thu_vien: 2" "$B1/MANIFEST.txt"'
chk "SHA256SUMS có checksum từng PDF" '[ "$(grep -c "library/books/.*\.pdf$" "$B1/SHA256SUMS")" = 2 ]'
bash "$RESTORE" > "$W/r1.log" 2>&1; rc=$?
chk "thử khôi phục bản đủ PDF: thành công" '[ $rc = 0 ] && grep -q "danh mục=2, thiếu hoặc sai kích thước trong bản sao lưu=0" "$W/r1.log"'

# Lần 2 (thêm 1 sách): sách cũ dùng liên kết cứng, sách mới được chép
sleep 1
printf '%%PDF-1.4 sach c\n' > "$STUDYTASK_DATA/library/books/sach-c.pdf"
bash "$BACKUP" > "$W/b2.log" 2>&1 || { echo "FAIL sao lưu lần 2 lỗi:"; cat "$W/b2.log"; exit 1; }
B2="$(readlink -f "$BACKUP_ROOT/LATEST")"
chk "lần 2 là bản mới" '[ "$B1" != "$B2" ]'
chk "PDF không đổi dùng liên kết cứng (cùng inode với bản trước)" '[ "$(stat -c %i "$B1/library/books/sach-a.pdf")" = "$(stat -c %i "$B2/library/books/sach-a.pdf")" ]'
chk "sách mới có trong bản 2" '[ -f "$B2/library/books/sach-c.pdf" ]'

# Bản thiếu PDF trong danh mục: thử khôi phục phải báo lỗi
rm "$B2/library/books/sach-b.pdf"
grep -v "library/books/sach-b.pdf" "$B2/SHA256SUMS" > "$W/s" && cat "$W/s" > "$B2/SHA256SUMS"
bash "$RESTORE" > "$W/r2.log" 2>&1; rc=$?
chk "thử khôi phục bản thiếu PDF: thất bại, nêu tên sách" '[ $rc != 0 ] && grep -q "sach-b.pdf" "$W/r2.log"'

# PDF bị hỏng (thay tệp, không sửa tại chỗ vì đang liên kết cứng với bản 1): sha256sum -c phải bắt được
rm "$B2/library/books/sach-a.pdf"; printf '%%PDF-1.4 hong\n' > "$B2/library/books/sach-a.pdf"
bash "$RESTORE" "$B2" > "$W/r3.log" 2>&1; rc=$?
chk "thử khôi phục bản có PDF hỏng: thất bại" '[ $rc != 0 ] && grep -q "sach-a.pdf: FAILED" "$W/r3.log"'
chk "bản 1 không bị ảnh hưởng khi sửa bản 2" '( cd "$B1" && sha256sum -c --quiet SHA256SUMS )'

[ $ok = 1 ] && echo "TẤT CẢ ĐẠT" || { echo "CÓ CA KHÔNG ĐẠT"; exit 1; }
