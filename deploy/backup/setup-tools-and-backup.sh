#!/bin/bash
# Cài công cụ giám sát + dựng ổ sao lưu + bật sao lưu tự động cho StudyTask.
# Chạy bằng:   sudo bash ~/setup/setup-tools-and-backup.sh [--size 100] [--yes] [--upgrade]
#   --size N   dung lượng ổ sao lưu (GB) cắt từ phần LVM còn trống, mặc định 100
#   --yes      không hỏi xác nhận
#   --upgrade  chạy luôn `apt upgrade` (10 gói đang chờ); nếu bỏ qua thì tự chạy sau bằng tay
# Chạy lại nhiều lần được (bước nào xong rồi sẽ bỏ qua). Không động tới dữ liệu StudyTask hiện có.
set -euo pipefail

SIZE_GB=100; ASSUME_YES=0; DO_UPGRADE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --size) SIZE_GB="$2"; shift 2 ;;
    --yes) ASSUME_YES=1; shift ;;
    --upgrade) DO_UPGRADE=1; shift ;;
    *) echo "Tham số lạ: $1"; exit 2 ;;
  esac
done
[ "$(id -u)" -eq 0 ] || { echo "Cần chạy bằng sudo."; exit 1; }
HERE="$(cd "$(dirname "$0")" && pwd)"
MNT=/mnt/backup
VG=ubuntu-vg
LV=backup
OWNER=studytask

echo "== 1. Công cụ giám sát và sao lưu =="
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y smartmontools vnstat rsync lm-sensors
systemctl enable --now vnstat >/dev/null 2>&1 || true
systemctl enable --now smartmontools >/dev/null 2>&1 || systemctl enable --now smartd >/dev/null 2>&1 || true
if [ "$DO_UPGRADE" = 1 ]; then
  echo "-- Cập nhật các gói chờ (nginx/cloudflared có thể ngắt trong vài giây)"
  apt-get upgrade -y
fi
[ -f /var/run/reboot-required ] && echo "!! Có cập nhật cần khởi động lại máy (làm lúc ít người dùng: sudo reboot)"

echo; echo "== 2. Ổ sao lưu (LVM → $MNT) =="
if mountpoint -q "$MNT"; then
  echo "$MNT đã được gắn, bỏ qua bước tạo ổ."
else
  command -v vgs >/dev/null || { echo "Không có công cụ LVM (vgs)"; exit 1; }
  FREE_GB=$(vgs --noheadings --units g --nosuffix -o vg_free "$VG" | awk '{printf "%d", $1}')
  echo "Nhóm ổ $VG còn trống: ${FREE_GB} GB. Sẽ tạo ổ '$LV' dài ${SIZE_GB} GB (ext4), gắn tại $MNT."
  [ "$FREE_GB" -ge "$SIZE_GB" ] || { echo "Không đủ chỗ trống (cần ≥ ${SIZE_GB} GB). Dùng --size nhỏ hơn."; exit 1; }
  if [ "$ASSUME_YES" != 1 ]; then read -r -p "Tiếp tục? [y/N] " a; [ "$a" = y ] || [ "$a" = Y ] || { echo "Đã huỷ."; exit 0; }; fi
  if [ ! -e "/dev/$VG/$LV" ]; then
    lvcreate -y -L "${SIZE_GB}G" -n "$LV" "$VG"
    mkfs.ext4 -q -L stbackup -m 1 "/dev/$VG/$LV"
  else
    echo "Ổ /dev/$VG/$LV đã tồn tại, dùng lại (không format)."
  fi
  mkdir -p "$MNT"
  UUID=$(blkid -s UUID -o value "/dev/$VG/$LV")
  grep -q "$UUID" /etc/fstab || echo "UUID=$UUID $MNT ext4 defaults,nofail,noatime 0 2" >> /etc/fstab   # nofail: thiếu ổ vẫn khởi động được
  systemctl daemon-reload
  mount "$MNT"
fi
mkdir -p "$MNT/studytask"
chown "$OWNER:$OWNER" "$MNT/studytask"; chmod 700 "$MNT/studytask"
df -h "$MNT" | tail -1

echo; echo "== 3. Script và lịch sao lưu =="
install -m 755 "$HERE/studytask-backup.sh" /usr/local/bin/studytask-backup.sh
install -m 644 "$HERE/studytask-backup.service" /etc/systemd/system/studytask-backup.service
install -m 644 "$HERE/studytask-backup.timer" /etc/systemd/system/studytask-backup.timer
systemctl daemon-reload
systemctl enable --now studytask-backup.timer
systemctl list-timers studytask-backup.timer --no-pager | head -3

echo; echo "== 4. Chạy thử sao lưu một lần =="
systemctl start studytask-backup.service
journalctl -u studytask-backup.service -n 6 --no-pager | cut -c1-170
ls -l "$MNT/studytask/" | tail -4

echo; echo "== 5. Sức khỏe ổ cứng (SMART) =="
DEV=$(lsblk -ndo PKNAME "$(pvs --noheadings -o pv_name 2>/dev/null | head -1 | xargs)" 2>/dev/null || true)
DEV="/dev/${DEV:-sda}"
smartctl -H "$DEV" | grep -E "overall-health|result" || smartctl -H "$DEV" || true
smartctl -A "$DEV" | grep -E "Reallocated_Sector|Current_Pending|Power_On_Hours|Temperature" || true

echo; echo "XONG. Xem log sao lưu:  journalctl -u studytask-backup.service"
