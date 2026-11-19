#!/bin/bash
# Kiểm chứng máy chủ StudyTask đang chạy ĐÚNG mã của GitHub (việc 1 tuần 7).
# CHỈ ĐỌC: không sửa tệp, không khởi động lại dịch vụ, không cần sudo.
#
# Cách chạy trên máy chủ (tài khoản studytask):
#   bash kiem-chung-master.sh                 # so với đỉnh master hiện tại trên GitHub
#   bash kiem-chung-master.sh 56c0bb4         # so với một commit cụ thể (phải nằm trên master)
#
# Script tải mã của commit từ GitHub vào thư mục tạm, rồi so từng tệp với bản đang cài:
#   1. Commit đích và vị trí của nó trên master
#   2. API: /opt/studytask/studytask_api.py, tiến trình đang chạy có nạp đúng tệp đó không
#   3. Cấu hình: studytask-api.service, nginx
#   4. Giao diện: mọi tệp app.js, style.css, index.html, components/, pages/, utils/
#   5. Tệp thừa: có trên máy chủ mà không có trong repo
#   6. Dịch vụ và web
# Kết quả in ra màn hình và lưu ~/health-logs/kiem-chung-master-<thời điểm>.txt (+ .sha256).
# Mã thoát 0 = ĐẠT, 1 = CHƯA ĐẠT, 2 = không lấy được mã từ GitHub.

REPO_URL="https://github.com/NguyenThanhTung301020/Nhom-5_Studytask.git"
TARBALL_URL="https://codeload.github.com/NguyenThanhTung301020/Nhom-5_Studytask/tar.gz"
API=/opt/studytask/studytask_api.py
WEB=/var/www/studytask
UNIT=/etc/systemd/system/studytask-api.service
NGINX=/etc/nginx/sites-available/studytask
WEB_PATHS="app.js style.css index.html components pages utils"   # đúng danh sách deploy/deploy.sh chép

STAMP="$(date -u +%Y%m%d-%H%M%S)"
LOGDIR="$HOME/health-logs"; mkdir -p "$LOGDIR"
REPORT="$LOGDIR/kiem-chung-master-$STAMP.txt"
TMPD="$(mktemp -d)"; trap 'rm -rf "$TMPD"' EXIT
exec > >(tee "$REPORT") 2>&1
TEE_PID=$!

FAIL=()
hr()   { printf '\n==== %s ====\n' "$1"; }
ok()   { printf '  [KHOP]  %s\n' "$*"; }
bad()  { printf '  [KHAC]  %s\n' "$*"; FAIL+=("$*"); }
info() { printf '  %s\n' "$*"; }
h()    { sha256sum < "$1" | cut -c1-64; }

hr "THỜI ĐIỂM / MÁY"
echo "  Thời điểm (UTC)   : $(date -u '+%F %T')"
echo "  Máy / người chạy  : $(hostname) / $(whoami)"
echo "  IP                : $(hostname -I 2>/dev/null)"

# ---------------------------------------------------------------- 1. Commit đích
hr "1. COMMIT ĐÍCH TRÊN GITHUB"
MASTER_TIP="$(git ls-remote "$REPO_URL" refs/heads/master 2>/dev/null | cut -f1)"
echo "  Đỉnh master trên GitHub: ${MASTER_TIP:-(không đọc được)}"
WANT="${1:-$MASTER_TIP}"
[ -n "$WANT" ] || { echo "  LỖI: không xác định được commit đích (máy chủ có ra Internet được không?)"; exit 2; }

SRC="$TMPD/repo"
if command -v git >/dev/null 2>&1 && git clone -q --branch master --single-branch "$REPO_URL" "$SRC" 2>/dev/null; then
  git -C "$SRC" -c advice.detachedHead=false checkout -q "$WANT" 2>/dev/null \
    || { echo "  LỖI: commit '$WANT' không có trên nhánh master"; exit 2; }
  COMMIT="$(git -C "$SRC" rev-parse HEAD)"
  echo "  Commit đem so     : $COMMIT"
  echo "  Tiêu đề           : $(git -C "$SRC" log -1 --format='%s (%ad)' --date=iso)"
  if git -C "$SRC" merge-base --is-ancestor "$COMMIT" origin/master; then
    info "Commit nằm trên master: có"
  else
    bad "Commit $COMMIT không nằm trên master"
  fi
  [ -n "$MASTER_TIP" ] && [ "$COMMIT" != "$MASTER_TIP" ] && \
    info "LƯU Ý: đang so với commit cũ hơn đỉnh master ($MASTER_TIP)"
else
  echo "  (không dùng được git, tải gói tar của commit)"
  mkdir -p "$SRC"
  curl -fsSL "$TARBALL_URL/$WANT" | tar xz -C "$SRC" --strip-components=1 \
    || { echo "  LỖI: không tải được mã của commit '$WANT'"; exit 2; }
  COMMIT="$WANT"
  echo "  Commit đem so     : $COMMIT (không kiểm được vị trí trên master khi không có git)"
fi

# ---------------------------------------------------------------- 2. API
hr "2. API ($API)"
if [ -f "$API" ]; then
  R="$(h "$SRC/server/studytask_api.py")"; S="$(h "$API")"
  echo "  repo    : $R"
  echo "  máy chủ : $S"
  [ "$R" = "$S" ] && ok "studytask_api.py" || bad "studytask_api.py khác repo"
else
  bad "Không có $API"
fi

PID="$(systemctl show -p MainPID --value studytask-api 2>/dev/null)"
if [ -n "$PID" ] && [ "$PID" != 0 ] && [ -r "/proc/$PID/cmdline" ]; then
  CMD="$(tr '\0' ' ' < /proc/$PID/cmdline)"
  START=$(( $(date +%s) - $(ps -o etimes= -p "$PID" | tr -d ' ') ))
  MT="$(stat -c %Y "$API" 2>/dev/null || echo 0)"
  echo "  Tiến trình        : PID $PID: $CMD"
  echo "  Khởi động lúc     : $(date -u -d @"$START" '+%F %T') UTC"
  echo "  Tệp API ghi lúc   : $(date -u -d @"$MT" '+%F %T') UTC"
  case "$CMD" in *"$API"*) ok "Tiến trình chạy đúng tệp $API" ;; *) bad "Tiến trình không chạy $API" ;; esac
  # Python nạp mã lúc khởi động: tệp sửa SAU khi khởi động thì mã đang chạy có thể là bản cũ.
  if [ "$MT" -le $(( START + 2 )) ]; then ok "Tệp API không bị sửa sau khi tiến trình khởi động"
  else bad "Tệp API được ghi SAU khi tiến trình khởi động (cần restart để chạy đúng bản trên đĩa)"; fi
else
  bad "Không tìm thấy tiến trình studytask-api"
fi

# ---------------------------------------------------------------- 3. Cấu hình
hr "3. CẤU HÌNH"
cmp -s "$SRC/deploy/studytask-api.service" "$UNIT" && ok "studytask-api.service" || bad "studytask-api.service khác deploy/studytask-api.service"
if [ -r "$NGINX" ]; then
  cmp -s "$SRC/deploy/nginx-studytask.conf" "$NGINX" && ok "nginx studytask" || bad "nginx studytask khác deploy/nginx-studytask.conf"
else
  info "Không đọc được $NGINX (bỏ qua)"
fi
if [ "$(readlink -f /etc/nginx/sites-enabled/studytask 2>/dev/null)" = "$NGINX" ]; then
  ok "sites-enabled/studytask trỏ tới $NGINX"
else
  bad "sites-enabled/studytask không trỏ tới $NGINX"
fi

# ---------------------------------------------------------------- 4. Giao diện
hr "4. GIAO DIỆN ($WEB)"
VER="$(grep -o 'src="v[0-9]*/app.js"' "$WEB/index.html" 2>/dev/null | sed 's|src="||; s|/app.js"||')"
echo "  Phiên bản giao diện: ${VER:-(không thấy)}"
if [ -n "$VER" ] && [ "$(readlink "$WEB/$VER")" = "." ]; then ok "$VER -> . (đúng cách deploy.sh tạo)"
else bad "Liên kết phiên bản $VER không đúng"; fi

N=0; NBAD=0
cd "$SRC" || exit 2
while IFS= read -r f; do
  N=$((N+1))
  if [ "$f" = index.html ]; then
    # deploy.sh chỉ đổi đường dẫn style.css/app.js sang v<VER>/, bỏ phần đó trước khi so
    R="$(h index.html)"; S="$(sed "s|$VER/||g" "$WEB/index.html" 2>/dev/null | sha256sum | cut -c1-64)"
  else
    R="$(h "$f")"; S="$( [ -f "$WEB/$f" ] && h "$WEB/$f" || echo THIEU)"
  fi
  if [ "$R" = "$S" ]; then printf '  [KHOP]  %s  %s\n' "${R:0:16}" "$f"
  else NBAD=$((NBAD+1)); bad "$f (repo ${R:0:16}, máy chủ ${S:0:16})"; fi
done < <(find $WEB_PATHS -type f | LC_ALL=C sort)
echo "  Tổng: $N tệp, khác hoặc thiếu: $NBAD"

# ---------------------------------------------------------------- 5. Tệp thừa
hr "5. TỆP CHẠY KHÔNG CÓ TRÊN GITHUB"
find $WEB_PATHS -type f | LC_ALL=C sort > "$TMPD/repo.txt"
(cd "$WEB" && find . -type f | sed 's|^\./||' | LC_ALL=C sort) > "$TMPD/web.txt"
EXTRA="$(LC_ALL=C comm -13 "$TMPD/repo.txt" "$TMPD/web.txt")"
if [ -z "$EXTRA" ]; then ok "Không có tệp thừa trong $WEB"
else while IFS= read -r f; do bad "Tệp thừa $WEB/$f"; done <<< "$EXTRA"; fi
(cd "$WEB" && find . -mindepth 1 -maxdepth 1 -type l ! -name 'v[0-9]*' -printf '%p -> %l\n') | while IFS= read -r l; do info "Liên kết lạ trong web root: $l"; done

OPT_EXTRA="$(cd /opt/studytask && find . -type f ! -name studytask_api.py ! -path '*/__pycache__/*' | sed 's|^\./||')"
[ -z "$OPT_EXTRA" ] && ok "/opt/studytask chỉ có studytask_api.py" || while IFS= read -r f; do bad "Tệp thừa /opt/studytask/$f"; done <<< "$OPT_EXTRA"

[ -e "$HOME/migration/install-api.sh" ] && bad "Còn script cài đặt cũ ~/migration/install-api.sh" || ok "Không còn ~/migration/install-api.sh"
info "Thư mục triển khai tạm còn trong ~ (chỉ để biết, không tính lỗi):"
ls -d "$HOME"/deploy-* "$HOME"/studytask-deploy* 2>/dev/null | sed 's/^/    /' || true

# ---------------------------------------------------------------- 6. Dịch vụ, web
hr "6. DỊCH VỤ VÀ WEB"
for s in studytask-api nginx cloudflared; do
  st="$(systemctl is-active "$s" 2>&1)"
  [ "$st" = active ] && ok "$s: active (từ $(systemctl show -p ActiveEnterTimestamp --value "$s"))" || bad "$s: $st"
done
ME="$(curl -s -m 5 http://127.0.0.1:8787/api/auth/me)"
[ "$ME" = '{"user": null}' ] && ok "API nội bộ /api/auth/me: $ME" || bad "API nội bộ /api/auth/me trả: ${ME:-(không trả lời)}"
for u in "https://sutdytask.io.vn/" "https://sutdytask.io.vn/$VER/app.js"; do
  c="$(curl -s -o "$TMPD/pub" -m 10 -w '%{http_code}' "$u")"
  [ "$c" = 200 ] && ok "$u: 200" || bad "$u: $c"
done
[ "$(h "$TMPD/pub")" = "$(h "$SRC/app.js")" ] && ok "app.js tải qua Internet (Cloudflare) trùng repo" || bad "app.js tải qua Internet khác repo"
info "3 dòng cuối ~/deploy-log.txt:"; tail -3 "$HOME/deploy-log.txt" 2>/dev/null | sed 's/^/    /'

# ---------------------------------------------------------------- Kết luận
hr "KẾT LUẬN"
echo "  Commit so sánh: $COMMIT"
if [ ${#FAIL[@]} -eq 0 ]; then
  echo "  ĐẠT: máy chủ chạy đúng mã của commit trên, không có tệp chạy ngoài GitHub."
  RC=0
else
  echo "  CHƯA ĐẠT: ${#FAIL[@]} mục"; printf '   - %s\n' "${FAIL[@]}"
  RC=1
fi
echo "  Báo cáo: $REPORT"
echo "  SHA256 của báo cáo: $REPORT.sha256 (tính sau dòng này)"
exec 1>&- 2>&-; wait "$TEE_PID" 2>/dev/null   # chờ tee ghi xong rồi mới băm
( cd "$LOGDIR" && sha256sum "$(basename "$REPORT")" > "$(basename "$REPORT").sha256" )
exit $RC
