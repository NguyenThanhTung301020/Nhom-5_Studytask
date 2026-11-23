#!/bin/bash
# Thử khôi phục (KHÔNG đụng dữ liệu thật): lấy bản sao lưu mới nhất, kiểm tra checksum, mở thử CSDL ở thư mục tạm
# và so sánh số bản ghi với CSDL đang chạy; kiểm tra mỗi sách trong danh mục libraryBooks có PDF trong bản sao lưu. Dùng:  bash studytask-restore-test.sh [thư_mục_bản_sao_lưu]
set -euo pipefail
BK="${1:-${BACKUP_ROOT:-/mnt/backup/studytask}/LATEST}"
SRC="${STUDYTASK_DATA:-/var/lib/studytask}"
[ -d "$BK" ] || { echo "Không thấy bản sao lưu: $BK"; exit 1; }
BK="$(readlink -f "$BK")"
echo "Bản sao lưu: $BK"; cat "$BK/MANIFEST.txt"
( cd "$BK" && sha256sum -c SHA256SUMS )
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
cp "$BK/studytask.db" "$T/studytask.db"
python3 - "$T/studytask.db" "$SRC/studytask.db" <<'PY'
import sqlite3, sys
a = sqlite3.connect('file:%s?mode=ro' % sys.argv[1], uri=True)
b = sqlite3.connect('file:%s?mode=ro' % sys.argv[2], uri=True)
assert a.execute('pragma integrity_check').fetchone()[0] == 'ok', 'bản khôi phục không toàn vẹn'
print('integrity_check: ok')
for t in ('accounts', 'docs', 'chat', 'contact_email'):
    x, y = a.execute('select count(*) from %s' % t).fetchone()[0], b.execute('select count(*) from %s' % t).fetchone()[0]
    print('%-14s bản sao lưu=%-5d đang chạy=%-5d %s' % (t, x, y, 'khớp' if x == y else '(khác: dữ liệu đã đổi sau lần sao lưu?)'))
PY
# Kho sách: mỗi sách trong danh mục (CSDL của bản sao lưu) phải có PDF đúng kích thước trong bản sao lưu; nội dung đã kiểm ở sha256sum -c
python3 - "$T/studytask.db" "$BK/library/books" <<'PY'
import json, os, sqlite3, sys
a = sqlite3.connect('file:%s?mode=ro' % sys.argv[1], uri=True)
books = [json.loads(r[0]) for r in a.execute("select data from docs where col='libraryBooks'")]
def bad(b):
    f = os.path.join(sys.argv[2], os.path.basename(b.get('file') or ''))
    return not os.path.isfile(f) or (b.get('size') is not None and os.path.getsize(f) != b['size'])
missing = [b.get('file') for b in books if bad(b)]
print('kho sách: danh mục=%d, thiếu hoặc sai kích thước trong bản sao lưu=%d' % (len(books), len(missing)))
if missing:
    sys.exit('LỖI: bản sao lưu thiếu PDF kho sách, ví dụ: %s' % ', '.join(map(str, missing[:5])))
PY
n_bk=$(find "$BK/uploads" -type f 2>/dev/null | wc -l); n_src=$(find "$SRC/uploads" -type f | wc -l)
echo "tệp tải lên: bản sao lưu=$n_bk đang chạy=$n_src"
n_lbk=$(find "$BK/library/books" -type f -name '*.pdf' 2>/dev/null | wc -l); n_lsrc=$(find "$SRC/library/books" -type f -name '*.pdf' 2>/dev/null | wc -l)
echo "PDF kho sách: bản sao lưu=$n_lbk đang chạy=$n_lsrc"
echo "KẾT QUẢ: khôi phục thử THÀNH CÔNG (dữ liệu thật không bị thay đổi)"
