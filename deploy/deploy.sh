#!/bin/bash
# Triển khai StudyTask lên server Ubuntu (nginx + API Python + Cloudflare Tunnel).
# Chạy trong thư mục đã clone repo:   sudo bash deploy/deploy.sh
# Chạy lại nhiều lần được; lần đầu sẽ sao lưu web và cấu hình nginx hiện có.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
WEB=/var/www/studytask
OWNER="${SUDO_USER:-studytask}"
VER="$(date +%Y%m%d%H%M)"            # thư mục phiên bản để trình duyệt/Cloudflare luôn lấy mã mới

echo "== 1. Sao lưu =="
[ -d "$WEB" ] && [ ! -d "$WEB.bak" ] && cp -a "$WEB" "$WEB.bak" || true
[ -f /etc/nginx/sites-available/studytask ] && [ ! -f /etc/nginx/sites-available/studytask.bak ] && \
  cp /etc/nginx/sites-available/studytask /etc/nginx/sites-available/studytask.bak || true

echo "== 2. Thư mục dữ liệu (không nằm trong web root) =="
install -d -o "$OWNER" -g "$OWNER" -m 750 /var/lib/studytask /var/lib/studytask/uploads
chmod 755 /var/lib/studytask          # nginx cần đi qua để phục vụ /uploads
chmod 755 /var/lib/studytask/uploads  # nginx (www-data) phải đọc được thư mục này, nếu để 750 thì mọi tệp /uploads/ trả 403 (12/11/2026); bài nộp vẫn do API kiểm soát

echo "== 3. API =="
install -d -m 755 /opt/studytask
python3 -c "import ast,sys;ast.parse(open(sys.argv[1],encoding='utf-8').read())" "$REPO/server/studytask_api.py"
install -m 644 "$REPO/server/studytask_api.py" /opt/studytask/studytask_api.py
install -m 644 "$REPO/deploy/studytask-api.service" /etc/systemd/system/studytask-api.service
systemctl daemon-reload
systemctl enable studytask-api
systemctl restart studytask-api        # lần chạy đầu tự chuyển cơ sở dữ liệu (nếu còn lược đồ cũ) và sao lưu trước

echo "== 4. Giao diện (chỉ các tệp chạy được trên trình duyệt; docs/, tests/, server/ không công khai) =="
install -d "$WEB"
for p in app.js style.css index.html components pages utils; do cp -a "$REPO/$p" "$WEB/"; done
sed -i "s|href=\"style.css\"|href=\"v$VER/style.css\"|; s|src=\"app.js\"|src=\"v$VER/app.js\"|" "$WEB/index.html"
ln -sfn . "$WEB/v$VER"
chown -R "$OWNER:$OWNER" "$WEB"

echo "== 5. nginx =="
install -m 644 "$REPO/deploy/nginx-studytask.conf" /etc/nginx/sites-available/studytask
ln -sfn /etc/nginx/sites-available/studytask /etc/nginx/sites-enabled/studytask
nginx -t
systemctl reload nginx

sleep 1
echo "API: $(systemctl is-active studytask-api)"
curl -s http://127.0.0.1:8787/api/auth/me; echo
echo "XONG – phiên bản giao diện v$VER"
