#!/bin/bash
# Báo cáo tổng thể thông số server: hệ thống, CPU, RAM, ổ cứng, mạng/băng thông, dịch vụ StudyTask
# Chạy:  bash ~/server-report.sh        (lưu file:  bash ~/server-report.sh | tee ~/bao-cao-server.txt)
IF=$(ip route show default 2>/dev/null | awk '/default/ {print $5; exit}')
hr() { printf '\n==== %s ====\n' "$1"; }

hr "THỜI ĐIỂM / HỆ THỐNG"
date '+Thời điểm báo cáo : %F %T %Z'
echo "Tên máy           : $(hostname)"
echo "Hệ điều hành      : $(. /etc/os-release && echo "$PRETTY_NAME")  (kernel $(uname -r))"
echo "Thời gian chạy    : $(uptime -p)"
echo "Địa chỉ IP        : $(hostname -I)"

hr "CPU"
echo "Bộ xử lý          : $(lscpu | awk -F: '/Model name/ {gsub(/^ +/,"",$2); print $2; exit}')"
echo "Số nhân / luồng   : $(nproc) luồng ($(lscpu | awk -F: '/^Core\(s\) per socket/ {gsub(/ /,"",$2); print $2}') nhân x $(lscpu | awk -F: '/^Socket\(s\)/ {gsub(/ /,"",$2); print $2}') socket)"
read -r _ a1 b1 c1 d1 e1 f1 g1 _ < /proc/stat; sleep 2; read -r _ a2 b2 c2 d2 e2 f2 g2 _ < /proc/stat
t1=$((a1+b1+c1+d1+e1+f1+g1)); t2=$((a2+b2+c2+d2+e2+f2+g2)); i1=$((d1+e1)); i2=$((d2+e2))
echo "Tải CPU (đo 2 giây): $(( 100 * ( (t2-t1) - (i2-i1) ) / (t2-t1) ))%"
echo "Load average 1/5/15 phút: $(cut -d' ' -f1-3 /proc/loadavg)   (so với $(nproc) luồng; >$(nproc) là quá tải)"
(command -v sensors >/dev/null && sensors 2>/dev/null | grep -iE 'core|temp' | head -4) || echo "Nhiệt độ          : (cài lm-sensors để xem: sudo apt install lm-sensors)"
echo "Top 5 tiến trình dùng CPU:"; ps -eo pcpu,pmem,comm --sort=-pcpu | head -6 | sed 's/^/   /'

hr "RAM"
free -h
echo "Top 5 tiến trình dùng RAM:"; ps -eo pmem,rss,comm --sort=-pmem | head -6 | sed 's/^/   /'

hr "Ổ CỨNG"
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT | grep -v loop
echo; df -hT -x tmpfs -x devtmpfs -x squashfs -x overlay
echo; echo "Thư mục lớn của StudyTask:"
du -sh /var/lib/studytask /var/lib/studytask/uploads /var/www/studytask 2>/dev/null | sed 's/^/   /'
echo "Inode đã dùng      : $(df -i / | awk 'NR==2 {print $5}')"
(command -v smartctl >/dev/null && sudo -n smartctl -H /dev/sda 2>/dev/null | grep -i 'overall') || echo "Sức khỏe ổ (SMART) : (xem bằng: sudo apt install smartmontools; sudo smartctl -H /dev/sda)"

hr "MẠNG / BĂNG THÔNG (giao diện: ${IF:-?})"
if [ -n "$IF" ]; then
  rx1=$(cat /sys/class/net/$IF/statistics/rx_bytes); tx1=$(cat /sys/class/net/$IF/statistics/tx_bytes); sleep 5
  rx2=$(cat /sys/class/net/$IF/statistics/rx_bytes); tx2=$(cat /sys/class/net/$IF/statistics/tx_bytes)
  echo "Tốc độ hiện tại (đo 5 giây): tải xuống $(( (rx2-rx1)/5/1024 )) KB/s · tải lên $(( (tx2-tx1)/5/1024 )) KB/s"
  echo "Tổng từ lúc khởi động ($(uptime -s)): nhận $(numfmt --to=iec $rx2) · gửi $(numfmt --to=iec $tx2)"
  echo "Tốc độ cổng mạng   : $(cat /sys/class/net/$IF/speed 2>/dev/null || echo '?') Mb/s"
  if command -v vnstat >/dev/null; then echo; vnstat -i "$IF" 2>/dev/null | head -20
  else echo "Thống kê theo ngày/tháng: cài vnstat (sudo apt install vnstat) rồi xem bằng  vnstat -d  /  vnstat -m"; fi
fi
echo "Kết nối đang mở    : $(ss -tn state established 2>/dev/null | tail -n +2 | wc -l)"

hr "DỊCH VỤ STUDYTASK"
for s in studytask-api nginx cloudflared; do printf '%-16s: %s\n' "$s" "$(systemctl is-active $s 2>&1)"; done
echo "Số yêu cầu web hôm nay (nginx): $(grep -c "$(date +%d/%b/%Y)" /var/log/nginx/access.log 2>/dev/null || echo 'cần sudo để đọc log')"
python3 - <<'PY' 2>/dev/null
import sqlite3
c = sqlite3.connect('file:/var/lib/studytask/studytask.db?mode=ro', uri=True)
print('Tài khoản          :', c.execute('select count(*) from accounts').fetchone()[0])
print('Tin nhắn hỗ trợ    :', c.execute("select count(*) from chat").fetchone()[0] if c.execute("select 1 from sqlite_master where name='chat'").fetchone() else 'chưa có bảng chat (API cũ)')
PY
echo; echo "Hết báo cáo."
