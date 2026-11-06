#!/bin/bash
# Kiểm tra sức khỏe máy chủ StudyTask: CHỈ ĐỌC, không sửa gì, không cần sudo.
# Dùng:  bash deploy/health-check.sh                 # xem nhanh, cửa sổ 7 ngày
#        bash deploy/health-check.sh "-15 days"      # cửa sổ 15 ngày
#        bash deploy/health-check.sh "-7 days" --save  # ghi thêm vào ~/health-logs/AAAA-MM-DD.txt
# Kết quả là các dòng "chỉ số: giá trị" để điền vào bảng so sánh trong docs/van-hanh/01-bao-cao-suc-khoe-may-chu.md
SINCE="${1:--7 days}"
SAVE=0; [ "${2:-}" = "--save" ] && SAVE=1
DB=/var/lib/studytask/studytask.db
URL="${STUDYTASK_URL:-https://sutdytask.io.vn/}"

run() {
  echo "=== STUDYTASK HEALTH CHECK ==="
  echo "thoi_diem_do_utc: $(date -u '+%Y-%m-%d %H:%M:%S')"
  echo "cua_so_theo_doi: $SINCE (journalctl --since)"
  echo
  echo "--- He thong"
  echo "uptime: $(uptime -p)"
  echo "load_1_5_15: $(cut -d' ' -f1-3 /proc/loadavg)"
  free -m | awk '/Mem/{printf "ram_da_dung_MiB: %d / %d (kha_dung %d)\n",$3,$2,$7} /Swap/{printf "swap_da_dung_MiB: %d / %d\n",$3,$2}'
  df -P / | awk 'NR==2{print "dia_goc_dung: "$5" ("$3" KB / "$2" KB)"}'
  df -Pi / | awk 'NR==2{print "inode_dung: "$5}'
  for z in /sys/class/thermal/thermal_zone*; do [ -r "$z/temp" ] && printf "nhiet_do_C (%s): %s\n" "$(cat $z/type)" "$(awk '{printf "%.1f",$1/1000}' "$z/temp")"; done   # x86_pkg_temp = CPU
  echo "goi_cho_cap_nhat: $(apt list --upgradable 2>/dev/null | tail -n +2 | wc -l)"
  [ -f /var/run/reboot-required ] && echo "can_reboot: CO" || echo "can_reboot: khong"
  echo "dong_bo_gio: $(timedatectl 2>/dev/null | awk -F': ' '/synchronized/{print $2}')"
  echo
  echo "--- Khoi dong lai (journalctl --list-boots)"
  journalctl --list-boots --no-pager 2>/dev/null | tail -6
  echo
  echo "--- Dich vu"
  for s in studytask-api nginx cloudflared; do
    echo "$s: $(systemctl is-active $s) | tu_khoi_dong_lai=$(systemctl show $s -p NRestarts --value) | chay_tu=$(systemctl show $s -p ActiveEnterTimestamp --value)"
  done
  echo "don_vi_loi: $(systemctl --failed --no-legend 2>/dev/null | wc -l)"
  echo "RSS_MB api/cloudflared/nginx: $(ps -o rss= -p "$(systemctl show studytask-api -p MainPID --value)" | awk '{printf "%.0f",$1/1024}') / $(ps -o rss= -C cloudflared | awk '{printf "%.0f",$1/1024}') / $(ps -o rss= -C nginx | awk '{s+=$1} END{printf "%.0f",s/1024}')"
  echo
  echo "--- Loi he thong (lan chay hien tai)"
  echo "journal_err_so_dong: $(journalctl -p err -b --no-pager 2>/dev/null | grep -vc '^-- ')"
  echo "journal_err_nhom_theo_noi_dung (so cac con so thanh N):"
  journalctl -p err -b --no-pager -o cat 2>/dev/null | sed -E 's/[0-9]+/N/g' | sort | uniq -c | sort -rn | head -8 | cut -c1-170 | sed 's/^/   /'
  echo "journal_err_moi_nhat:"; journalctl -p err -b --no-pager 2>/dev/null | grep -v '^-- ' | tail -3 | cut -c1-170 | sed 's/^/   /'
  echo "oom_io_fs_loi: $(journalctl -k --no-pager 2>/dev/null | grep -ciE 'out of memory|oom-killer|I/O error|EXT4-fs error|Call Trace')"
  echo
  echo "--- API ($SINCE)"
  journalctl -u studytask-api --since "$SINCE" --no-pager 2>/dev/null > /tmp/.hc_api.$$
  echo "tong_yeu_cau: $(grep -c 'HTTP/1.1"' /tmp/.hc_api.$$)"
  echo "ma_http:"; grep -oE 'HTTP/1.1" [0-9]{3}' /tmp/.hc_api.$$ | sort | uniq -c | sort -rn | sed 's/^/   /'
  echo "loi_5xx_tong: $(grep -cE 'HTTP/1.1" 5[0-9]{2}' /tmp/.hc_api.$$)  (trong do 501 do HEAD /api/auth/me da biet: $(grep -c 'HEAD /api/auth/me.*501' /tmp/.hc_api.$$); can dieu tra neu so khac)"
  echo "traceback_hoac_MAIL_ERROR: $(grep -cE 'Traceback|MAIL-ERROR' /tmp/.hc_api.$$)"
  echo "bi_gioi_han_429: $(grep -c 'HTTP/1.1" 429' /tmp/.hc_api.$$)"
  echo "403_theo_duong_dan:"; grep -E '" 403 ' /tmp/.hc_api.$$ | grep -oE '"(GET|PUT|POST|DELETE) [^ ?]+' | sed -E 's#[0-9a-zA-Z]{20,}#<id>#g' | sort | uniq -c | sort -rn | head -5 | sed 's/^/   /'
  echo "yeu_cau_theo_ngay:"; journalctl -u studytask-api --since "$SINCE" --no-pager -o short-iso 2>/dev/null | grep -oE '^[0-9]{4}-[0-9]{2}-[0-9]{2}' | sort | uniq -c | sed 's/^/   /'
  rm -f /tmp/.hc_api.$$
  echo
  echo "--- Cloudflare Tunnel ($SINCE)"
  echo "ket_noi_lai: $(journalctl -u cloudflared --since "$SINCE" --no-pager 2>/dev/null | grep -c 'Retrying connection')"
  echo "dang_ky_lai_thanh_cong: $(journalctl -u cloudflared --since "$SINCE" --no-pager 2>/dev/null | grep -c 'Registered tunnel connection')"
  echo "lan_gan_nhat: $(journalctl -u cloudflared --since "$SINCE" --no-pager 2>/dev/null | grep 'Retrying connection' | tail -1 | awk '{print $1,$2,$3}')"
  echo
  echo "--- nginx"
  if [ -r /var/log/nginx/access.log ]; then
    echo "access_log_ma_http:"; awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -6 | sed 's/^/   /'
  else echo "access_log: khong doc duoc (can sudo hoac them user vao nhom adm)"; fi
  [ -r /var/log/nginx/error.log ] && echo "error_log_so_dong: $(wc -l < /var/log/nginx/error.log)" || echo "error_log: khong doc duoc"
  echo
  echo "--- Bao mat"
  echo "ssh_dang_nhap_sai (Failed password): $(journalctl -u ssh --since "$SINCE" --no-pager 2>/dev/null | grep -c 'Failed password')"
  echo "ssh_dang_nhap_sai_theo_nguon: $(journalctl -u ssh --since "$SINCE" --no-pager 2>/dev/null | grep 'Failed password' | grep -oE 'from [0-9.]+' | sort | uniq -c | sort -rn | head -4 | tr '\n' ';')"
  echo "ssh_dang_nhap_thanh_cong_theo_nguon: $(journalctl -u ssh --since "$SINCE" --no-pager 2>/dev/null | grep 'Accepted' | grep -oE 'from [0-9.]+' | sort | uniq -c | sort -rn | head -4 | tr '\n' ';')"
  echo "cong_dang_nghe: $(ss -tlnH 2>/dev/null | awk '{print $4}' | sort -u | tr '\n' ' ')"
  echo
  echo "--- Mang"
  ping -c5 -W2 1.1.1.1 2>/dev/null | tail -2 | sed 's/^/   /'
  IF=$(ip route 2>/dev/null | awk '/default/{print $5; exit}')
  [ -n "$IF" ] && echo "luu_luong_tu_khoi_dong_MB ($IF) nhan/gui: $(awk '{printf "%.1f",$1/1048576}' /sys/class/net/$IF/statistics/rx_bytes) / $(awk '{printf "%.1f",$1/1048576}' /sys/class/net/$IF/statistics/tx_bytes)"
  command -v vnstat >/dev/null && vnstat -d 2>/dev/null | tail -9
  echo "site: $(curl -s -m10 -o /dev/null -w 'HTTP %{http_code} trong %{time_total}s' "$URL")"
  echo
  echo "--- Du lieu"
  if [ -r "$DB" ]; then
    python3 - "$DB" <<'PY'
import sqlite3, sys
c = sqlite3.connect('file:%s?mode=ro' % sys.argv[1], uri=True)
print('integrity_check:', c.execute('pragma integrity_check').fetchone()[0])
for t in ('accounts', 'sessions', 'docs', 'chat', 'contact_email', 'codes'):
    try: print('  %s: %d' % (t, c.execute('select count(*) from %s' % t).fetchone()[0]))
    except Exception as e: print('  %s: loi %s' % (t, e))
PY
    echo "dung_luong_du_lieu: $(du -sh /var/lib/studytask 2>/dev/null | cut -f1) ; db+wal: $(ls -l $DB* 2>/dev/null | awk '{s+=$5} END{printf "%.0f KB",s/1024}')"
  else echo "csdl: khong doc duoc"; fi
  echo
  echo "--- Sao luu"
  LB=$(readlink -f /mnt/backup/studytask/LATEST 2>/dev/null); [ -d "$LB" ] || LB=$(ls -dt ~/backups/* 2>/dev/null | head -1)
  if [ -n "$LB" ]; then echo "ban_sao_luu_moi_nhat: $LB ($(( ( $(date +%s) - $(stat -c %Y "$LB") ) / 3600 )) gio truoc)"; else echo "ban_sao_luu_tu_dong: CHUA CO (chua co /mnt/backup/studytask/LATEST)"; fi
  echo "bao_cao_xong: $(date -u '+%H:%M:%S')"
}

if [ "$SAVE" = 1 ]; then
  mkdir -p ~/health-logs
  F=~/health-logs/$(date -u +%Y-%m-%d).txt
  run | tee "$F"
  echo "(đã lưu: $F)"
else
  run
fi
