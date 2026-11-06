#!/bin/bash
# Thử khôi phục (KHÔNG đụng dữ liệu thật): lấy bản sao lưu mới nhất, kiểm tra checksum, mở thử CSDL ở thư mục tạm
# và so sánh số bản ghi với CSDL đang chạy. Dùng:  bash studytask-restore-test.sh [thư_mục_bản_sao_lưu]
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
n_bk=$(find "$BK/uploads" -type f 2>/dev/null | wc -l); n_src=$(find "$SRC/uploads" -type f | wc -l)
echo "tệp tải lên: bản sao lưu=$n_bk đang chạy=$n_src"
echo "KẾT QUẢ: khôi phục thử THÀNH CÔNG (dữ liệu thật không bị thay đổi)"
