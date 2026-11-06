#!/bin/bash
# Sao lưu StudyTask: cơ sở dữ liệu (bản chụp nhất quán), tệp tải lên, cấu hình. Chạy bằng systemd timer mỗi ngày.
# Mỗi lần tạo một thư mục AAAA-MM-DD_GGPPSS (giờ UTC). Tệp tải lên dùng liên kết cứng nên các bản trùng nhau không tốn thêm chỗ.
# Giữ KEEP_DAILY bản mới nhất + KEEP_WEEKLY bản Chủ nhật. Không cần sudo nếu tài khoản chạy đọc được dữ liệu.
#
# Biến môi trường (đều có mặc định):
#   STUDYTASK_DATA  nguồn dữ liệu            (/var/lib/studytask)
#   BACKUP_MOUNT    điểm gắn ổ sao lưu       (/mnt/backup)   → khi thay bằng ổ di động chỉ cần gắn đúng chỗ này
#   BACKUP_ROOT     thư mục chứa các bản     ($BACKUP_MOUNT/studytask)
#   REQUIRE_MOUNT   1 = từ chối chạy nếu ổ chưa gắn (tránh ghi đầy ổ hệ thống); 0 = bỏ kiểm tra (chỉ để thử)
#   KEEP_DAILY / KEEP_WEEKLY / MIN_FREE_GB
set -euo pipefail
umask 077

SRC="${STUDYTASK_DATA:-/var/lib/studytask}"
MNT="${BACKUP_MOUNT:-/mnt/backup}"
DEST="${BACKUP_ROOT:-$MNT/studytask}"
KEEP_DAILY="${KEEP_DAILY:-14}"
KEEP_WEEKLY="${KEEP_WEEKLY:-8}"
MIN_FREE_GB="${MIN_FREE_GB:-5}"
REQUIRE_MOUNT="${REQUIRE_MOUNT:-1}"
STAMP="$(date -u +%Y-%m-%d_%H%M%S)"

log() { echo "[$(date -u '+%F %T') UTC] $*"; }
fail() { log "LỖI: $*" >&2; exit 1; }

# 1. Kiểm tra trước khi làm
if [ "$REQUIRE_MOUNT" = 1 ]; then
  mountpoint -q "$MNT" || fail "ổ sao lưu chưa được gắn tại $MNT (không sao lưu để tránh ghi vào ổ hệ thống)"
fi
[ -r "$SRC/studytask.db" ] || fail "không đọc được $SRC/studytask.db"
mkdir -p "$DEST"
FREE_GB=$(df -P --block-size=1G "$DEST" | awk 'NR==2{print $4}')
[ "$FREE_GB" -ge "$MIN_FREE_GB" ] || fail "ổ sao lưu chỉ còn ${FREE_GB} GB trống (cần ≥ ${MIN_FREE_GB} GB)"
rm -rf "$DEST"/.incomplete-* 2>/dev/null || true       # dọn bản dở dang của lần chạy hỏng trước

TMP="$DEST/.incomplete-$STAMP"
FINAL="$DEST/$STAMP"
mkdir -p "$TMP/config"
trap 'rm -rf "$TMP"' ERR

# 2. Cơ sở dữ liệu: dùng API sao lưu trực tuyến của SQLite (nhất quán kể cả khi đang ghi, đã tính cả tệp WAL)
python3 - "$SRC/studytask.db" "$TMP/studytask.db" <<'PY'
import sqlite3, sys
src = sqlite3.connect('file:%s?mode=ro' % sys.argv[1], uri=True)
dst = sqlite3.connect(sys.argv[2])
src.backup(dst)
ok = dst.execute('pragma integrity_check').fetchone()[0]
if ok != 'ok':
    sys.exit('bản sao CSDL không toàn vẹn: %s' % ok)
rows = {t: dst.execute('select count(*) from %s' % t).fetchone()[0] for t in ('accounts', 'docs', 'chat')}
print('CSDL: integrity_check=ok', rows)
dst.close(); src.close()
PY

# 3. Tệp tải lên (liên kết cứng với bản trước nếu không đổi)
PREV=""
[ -L "$DEST/LATEST" ] && PREV="$(readlink -f "$DEST/LATEST")"
if [ -d "$SRC/uploads" ]; then
  if [ -n "$PREV" ] && [ -d "$PREV/uploads" ]; then
    rsync -a --link-dest="$PREV/uploads" "$SRC/uploads/" "$TMP/uploads/"
  else
    rsync -a "$SRC/uploads/" "$TMP/uploads/"
  fi
fi

# 4. Cấu hình (chỉ chép tệp đọc được; token của cloudflared thuộc root nên KHÔNG sao lưu ở đây)
[ -r "$SRC/mail.json" ] && cp -p "$SRC/mail.json" "$TMP/config/mail.json"
[ -r /etc/nginx/sites-available/studytask ] && cp -p /etc/nginx/sites-available/studytask "$TMP/config/nginx-studytask.conf"
for f in /etc/systemd/system/studytask-api.service /opt/studytask/studytask_api.py; do
  [ -r "$f" ] && cp -p "$f" "$TMP/config/$(basename "$f")"
done

# 5. Xác nhận và công bố
( cd "$TMP" && sha256sum studytask.db > SHA256SUMS )
{
  echo "thoi_diem_utc: $(date -u '+%F %T')"
  echo "may_chu: $(hostname)"
  echo "csdl_bytes: $(stat -c %s "$TMP/studytask.db")"
  echo "so_tep_tai_len: $(find "$TMP/uploads" -type f 2>/dev/null | wc -l)"
  echo "dung_luong_ban_nay: $(du -sh "$TMP" | cut -f1)"
} > "$TMP/MANIFEST.txt"
mv "$TMP" "$FINAL"
trap - ERR
ln -sfn "$FINAL" "$DEST/LATEST"
log "Đã sao lưu: $FINAL ($(du -sh "$FINAL" | cut -f1))"

# 6. Giữ KEEP_DAILY bản mới nhất + KEEP_WEEKLY bản Chủ nhật, xoá phần còn lại
mapfile -t ALL < <(ls -1d "$DEST"/20??-??-??_?????? 2>/dev/null | sort -r || true)
KEEP=()
n=0; for d in "${ALL[@]}"; do n=$((n + 1)); [ "$n" -le "$KEEP_DAILY" ] && KEEP+=("$d"); done
w=0
for d in "${ALL[@]}"; do
  day="$(basename "$d")"; day="${day%%_*}"
  if [ "$(date -d "$day" +%u 2>/dev/null)" = 7 ]; then w=$((w + 1)); [ "$w" -le "$KEEP_WEEKLY" ] && KEEP+=("$d"); fi
done
removed=0
for d in "${ALL[@]}"; do
  if ! printf '%s\n' "${KEEP[@]}" | grep -qxF "$d"; then rm -rf "$d"; removed=$((removed + 1)); fi
done
log "Còn $(( ${#ALL[@]} - removed )) bản (đã xoá $removed bản cũ); ổ sao lưu còn trống $(df -P -h "$DEST" | awk 'NR==2{print $4}')"
echo "$(date -u '+%F %T') OK $STAMP" >> "$DEST/backup.log"
