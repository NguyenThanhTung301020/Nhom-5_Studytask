#!/bin/bash
# Thu bằng chứng kiểm tra sức khỏe máy chủ cho mốc T+7 / T+15 (báo cáo vận hành mục 8).
# Chạy TRÊN MÁY CHỦ, cần quyền sudo cho phần SMART và thử khôi phục. Không sửa dữ liệu của hệ thống.
#   bash ~/evidence-check.sh "-7 days"      # mốc T+7
#   bash ~/evidence-check.sh "-15 days"     # mốc T+15
# Kết quả: ~/health-logs/bang-chung-AAAA-MM-DD/  và  ~/health-logs/bang-chung-AAAA-MM-DD.tar.gz
# Mỗi tệp có dòng đầu ghi lệnh đã chạy và thời điểm; SHA256SUMS dùng để chứng minh tệp không bị sửa sau này.
SINCE="${1:--7 days}"
DAY=$(date -u +%Y-%m-%d)
OUT=~/health-logs/bang-chung-$DAY
HC="$(dirname "$(readlink -f "$0")")/health-check.sh"
[ -f "$HC" ] || HC=~/health-check.sh
mkdir -p "$OUT"; cd "$OUT" || exit 1

cap() {   # cap <tên tệp> <lệnh...>  : ghi lệnh + thời điểm + kết quả (kể cả lỗi) vào tệp
  local f="$1"; shift
  { echo "# lenh: $*"; echo "# thoi_diem_utc: $(date -u '+%Y-%m-%d %H:%M:%S')"; echo; "$@" 2>&1; echo; echo "# ma_thoat: $?"; } > "$f"
  printf '  %-34s %s\n' "$f" "$(wc -l < "$f") dong"
}
echo "== Thu bang chung ngay $DAY, cua so nhat ky: $SINCE =="
echo "Sudo se hoi mat khau mot lan (can cho SMART)."
sudo -v || { echo "Khong co quyen sudo, dung lai."; exit 1; }

cap 01-health-check.txt        bash "$HC" "$SINCE"
cap 02-smart-tong-quan.txt     sudo smartctl -H -A /dev/sda
cap 03-smart-loi-ata.txt       sudo smartctl -l error -l selftest /dev/sda
echo "  Dang chay tu kiem tra SMART (short, vai phut)..."
sudo smartctl -t short /dev/sda > 04-smart-bat-dau-tu-kiem-tra.txt 2>&1
sleep 150
cap 05-smart-ket-qua-tu-kiem-tra.txt sudo smartctl -l selftest /dev/sda
cap 06-dich-vu.txt             systemctl status studytask-api nginx cloudflared --no-pager -n 0
cap 07-systemctl-failed.txt    systemctl --failed --no-pager
cap 08-khoi-dong-lai.txt       journalctl --list-boots --no-pager
cap 09-loi-nhan-he-thong.txt   bash -c "journalctl -k --no-pager | grep -iE 'out of memory|oom-killer|I/O error|EXT4-fs error|Call Trace' || echo '(khong co dong nao khop)'"
cap 10-vnstat-theo-ngay.txt    vnstat -d
cap 11-cong-dang-nghe.txt      ss -tlnp
cap 12-nginx-error-log.txt     sudo tail -50 /var/log/nginx/error.log
cap 13-sao-luu-hien-co.txt     bash -c "ls -la /mnt/backup/studytask/ 2>/dev/null; echo; df -h /mnt/backup; echo; cat \$(readlink -f /mnt/backup/studytask/LATEST)/MANIFEST* 2>/dev/null | head -30"
RT=~/setup/studytask-restore-test.sh; [ -f "$RT" ] || RT=$(dirname "$HC")/backup/studytask-restore-test.sh
cap 14-thu-khoi-phuc.txt       sudo bash "$RT"
cap 15-site-tu-may-chu.txt     curl -s -m10 -o /dev/null -w 'HTTP %{http_code} trong %{time_total}s\n' https://sutdytask.io.vn/
cap 16-api-dang-chay-ban-nao.txt bash -c "sha256sum /opt/studytask/studytask_api.py /var/www/studytask/app.js /var/www/studytask/pages/Profile.js /var/www/studytask/pages/Graduation.js 2>&1; ls -l /var/www/studytask/utils/sanitize.js 2>&1; ls -l ~/migration/install-api.sh 2>&1; systemctl cat studytask-api --no-pager | grep -E 'ExecStart|WorkingDirectory'"

sha256sum ./*.txt > SHA256SUMS
cd .. && tar czf "bang-chung-$DAY.tar.gz" "bang-chung-$DAY" && sha256sum "bang-chung-$DAY.tar.gz" | tee "bang-chung-$DAY.tar.gz.sha256"
echo
echo "XONG. Chep ve may ca nhan:  scp studytask@192.168.2.187:~/health-logs/bang-chung-$DAY.tar.gz ."
echo "Hoac chay scripts/van-hanh/thu-bang-chung.ps1 tren may Windows de tu dong."
