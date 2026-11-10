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

FAILED=()
cap() {   # cap <tên tệp> <lệnh...>  : ghi lệnh + thời điểm + kết quả (kể cả lỗi) vào tệp; lệnh lỗi được ghi nhận và tính vào kết quả cuối
  local f="$1" rc; shift
  { echo "# lenh: $*"; echo "# thoi_diem_utc: $(date -u '+%Y-%m-%d %H:%M:%S')"; echo; "$@" 2>&1; rc=$?; echo; echo "# ma_thoat: $rc"; } > "$f"
  if [ "$rc" -ne 0 ]; then FAILED+=("$f (ma thoat $rc)"); printf '  %-34s %s  !! LOI (ma thoat %s)\n' "$f" "$(wc -l < "$f") dong" "$rc"
  else printf '  %-34s %s\n' "$f" "$(wc -l < "$f") dong"; fi
}
smart() {   # smartctl trả về một dãy bit: bit 0-1 là lỗi dùng lệnh/mở ổ (lỗi thật); bit 3-7 là cảnh báo về ổ (không phải lệnh lỗi)
  sudo smartctl "$@"; local r=$?
  echo "# smartctl_ma_bit=$r (bit0-1 = loi lenh; bit3 = ngưỡng SMART, bit4 = chi so truoc nguong, bit5 = co sector hong, bit6 = nhat ky loi co muc, bit7 = tu kiem tra co loi)"
  [ $((r & 3)) -eq 0 ]
}
site_check() {   # chỉ coi là đạt khi HTTP 2xx/3xx
  local out; out=$(curl -s -m10 -o /dev/null -w '%{http_code} %{time_total}' "$1"); echo "HTTP $out giay"
  case "$out" in 2*|3*) return 0;; *) return 1;; esac
}
services_check() {
  local rc=0 s
  for s in studytask-api nginx cloudflared; do echo "$s: $(systemctl is-active "$s")"; systemctl is-active --quiet "$s" || rc=1; done
  return $rc
}
echo "== Thu bang chung ngay $DAY, cua so nhat ky: $SINCE =="
echo "Sudo se hoi mat khau mot lan (can cho SMART)."
sudo -v || { echo "Khong co quyen sudo, dung lai."; exit 1; }


cap 01-health-check.txt        bash "$HC" "$SINCE"
cap 02-smart-tong-quan.txt     smart -H -A /dev/sda
cap 03-smart-loi-ata.txt       smart -l error -l selftest /dev/sda
echo "  Dang chay tu kiem tra SMART (short, vai phut)..."
cap 04-smart-bat-dau-tu-kiem-tra.txt smart -t short /dev/sda
sleep 150
cap 05-smart-ket-qua-tu-kiem-tra.txt smart -l selftest /dev/sda
cap 06-dich-vu.txt             services_check
cap 06b-dich-vu-chi-tiet.txt   systemctl status studytask-api nginx cloudflared --no-pager -n 0
cap 07-systemctl-failed.txt    bash -c 'out=$(systemctl --failed --no-pager --no-legend); echo "${out:-(khong co don vi loi)}"; [ -z "$out" ]'
cap 08-khoi-dong-lai.txt       journalctl --list-boots --no-pager
cap 09-loi-nhan-he-thong.txt   bash -c "journalctl -k --no-pager | grep -iE 'out of memory|oom-killer|I/O error|EXT4-fs error|Call Trace' || echo '(khong co dong nao khop)'"
cap 10-vnstat-theo-ngay.txt    vnstat -d
cap 11-cong-dang-nghe.txt      ss -tlnp
cap 12-nginx-error-log.txt     sudo tail -50 /var/log/nginx/error.log
cap 13-sao-luu-hien-co.txt     bash -c '[ -d /mnt/backup/studytask ] && ls -la /mnt/backup/studytask/ && echo && df -h /mnt/backup && echo && cat "$(readlink -f /mnt/backup/studytask/LATEST)"/MANIFEST* | head -30'
RT=~/setup/studytask-restore-test.sh; [ -f "$RT" ] || RT=$(dirname "$HC")/backup/studytask-restore-test.sh
cap 14-thu-khoi-phuc.txt       sudo bash "$RT"
cap 15-site-tu-may-chu.txt     site_check https://sutdytask.io.vn/
cap 16-api-dang-chay-ban-nao.txt bash -c "sha256sum /opt/studytask/studytask_api.py /var/www/studytask/app.js /var/www/studytask/pages/Profile.js /var/www/studytask/pages/Graduation.js && ls -l /var/www/studytask/utils/sanitize.js && { ls -l ~/migration/install-api.sh 2>&1 || echo '(khong con install-api.sh: dung)'; } && systemctl cat studytask-api --no-pager | grep -E 'ExecStart|WorkingDirectory'"

sha256sum ./*.txt > SHA256SUMS || { echo "Khong tao duoc SHA256SUMS"; FAILED+=("SHA256SUMS"); }
cd .. && tar czf "bang-chung-$DAY.tar.gz" "bang-chung-$DAY" && sha256sum "bang-chung-$DAY.tar.gz" | tee "bang-chung-$DAY.tar.gz.sha256" && [ -s "bang-chung-$DAY.tar.gz.sha256" ] || { echo "Khong dong goi duoc bang chung"; exit 1; }
echo
if [ "${#FAILED[@]}" -gt 0 ]; then
  echo "KET QUA: CO ${#FAILED[@]} MUC LOI (bang chung van duoc luu de xem lai, nhung CHUA DAT):"
  printf '   - %s\n' "${FAILED[@]}"
  echo "Chep ve may ca nhan:  scp studytask@192.168.2.187:~/health-logs/bang-chung-$DAY.tar.gz ."
  exit 1
fi
echo "KET QUA: DAT (tat ca lenh thanh cong)."
echo "XONG. Chep ve may ca nhan:  scp studytask@192.168.2.187:~/health-logs/bang-chung-$DAY.tar.gz ."
echo "Hoac chay scripts/van-hanh/thu-bang-chung.ps1 tren may Windows de tu dong."