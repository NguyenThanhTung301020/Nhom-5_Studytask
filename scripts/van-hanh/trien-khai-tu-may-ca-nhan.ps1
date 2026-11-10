<#
  Triển khai mã đang có trên MÁY CÁ NHÂN lên máy chủ, không cần chờ gộp PR.
  Dùng khi cần đưa bản của nhánh hiện tại lên máy chủ ngay; sau khi PR được gộp, so hash lại với master.
  Cách dùng (PowerShell, tại thư mục gốc repo, đã commit hết thay đổi):
      .\scripts\van-hanh\trien-khai-tu-may-ca-nhan.ps1
  Việc script làm:
    1. Từ chối chạy nếu còn thay đổi chưa commit (để bản trên máy chủ luôn tương ứng một commit cụ thể).
    2. Đóng gói đúng các thư mục cần triển khai bằng `git archive HEAD` -> scp lên máy chủ.
    3. Giải nén vào ~/studytask-deploy, chạy `sudo bash deploy/deploy.sh` (hỏi mật khẩu sudo).
    4. So SHA256 tệp đang chạy với tệp vừa giải nén (ngay trên máy chủ), ghi một dòng vào ~/deploy-log.txt.
#>
param([string]$Server = 'studytask@192.168.2.187')
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path "$PSScriptRoot\..\..").Path
Set-Location $repo

if (git status --porcelain) { throw 'Còn thay đổi chưa commit. Hãy commit (và nên push) trước khi triển khai.' }
$commit = (git rev-parse --short HEAD).Trim()
$branch = (git branch --show-current).Trim()
Write-Host "Triển khai commit $commit (nhánh $branch) lên $Server" -ForegroundColor Cyan

$tmp = Join-Path $env:TEMP "studytask-deploy-$commit.tar.gz"
git archive --format=tar.gz -o $tmp HEAD app.js style.css index.html components pages utils server deploy
if ($LASTEXITCODE) { throw 'git archive thất bại.' }

scp $tmp "${Server}:~/studytask-deploy.tar.gz"
if ($LASTEXITCODE) { throw 'scp thất bại: kiểm tra mạng LAN và khóa SSH.' }

$remote = @"
set -e
rm -rf ~/studytask-deploy && mkdir ~/studytask-deploy && tar -xzf ~/studytask-deploy.tar.gz -C ~/studytask-deploy && rm ~/studytask-deploy.tar.gz
cd ~/studytask-deploy && find . -type f \( -name '*.py' -o -name '*.js' -o -name '*.sh' -o -name '*.conf' -o -name '*.html' -o -name '*.css' -o -name '*.service' -o -name '*.timer' \) -exec sed -i 's/\r$//' {} + && sudo bash deploy/deploy.sh
echo "`$(date -u '+%Y-%m-%d %H:%M:%S') UTC | commit $commit | nhanh $branch | tu may ca nhan" >> ~/deploy-log.txt
"@
$remote = $remote -replace "`r", ''     # bash trên máy chủ không chấp nhận CRLF
ssh -t $Server $remote
if ($LASTEXITCODE) { throw 'Triển khai trên máy chủ thất bại, xem thông báo ở trên (nginx -t lỗi thì nginx vẫn chạy cấu hình cũ).' }

Write-Host 'So hash tệp đang chạy với tệp vừa giải nén (so trên máy chủ, không lệch CRLF)...' -ForegroundColor Cyan
$check = @'
cd ~/studytask-deploy; bad=0
for p in server/studytask_api.py:/opt/studytask/studytask_api.py app.js:/var/www/studytask/app.js pages/Profile.js:/var/www/studytask/pages/Profile.js pages/Graduation.js:/var/www/studytask/pages/Graduation.js utils/sanitize.js:/var/www/studytask/utils/sanitize.js; do
  src=${p%%:*}; dst=${p##*:}
  a=$(sha256sum "$src" | cut -d' ' -f1); b=$(sha256sum "$dst" 2>/dev/null | cut -d' ' -f1)
  if [ "$a" = "$b" ]; then echo "KHOP  $dst  ${a:0:16}"; else echo "LECH  $dst"; bad=1; fi
done
# Từng dịch vụ phải `active`; một dịch vụ không chạy là lỗi (trước đây `is-active | tr` luôn trả về 0 nên bị bỏ qua)
for s in studytask-api nginx cloudflared; do
  st=$(systemctl is-active "$s" 2>&1); echo "DICH VU  $s: $st"
  [ "$st" = active ] || bad=1
done
# API phải trả lời (đợi tối đa 20 giây sau khi khởi động lại, vì lần đầu có thể di trú dữ liệu)
ready=0
for i in $(seq 1 40); do
  if curl -fsS -m3 -o /dev/null http://127.0.0.1:8787/api/auth/me 2>/dev/null; then ready=1; break; fi
  sleep 0.5
done
if [ "$ready" = 1 ]; then echo "API      san sang (GET /api/auth/me = 200)"; else echo "API      KHONG TRA LOI sau 20 giay"; bad=1; fi
code=$(curl -s -m5 -o /dev/null -w '%{http_code}' http://127.0.0.1/ || true)
if [ "$code" = 200 ]; then echo "NGINX    trang chu = 200"; else echo "NGINX    trang chu = ${code:-khong ket noi} (mong doi 200)"; bad=1; fi
echo "$(date -u '+%Y-%m-%d %H:%M:%S') UTC | commit __COMMIT__ | xac nhan sau trien khai: $([ "$bad" = 0 ] && echo DAT || echo LOI)" >> ~/deploy-log.txt
tail -2 ~/deploy-log.txt
exit $bad
'@
$check = $check.Replace('__COMMIT__', $commit) -replace "`r", ''
ssh $Server $check
if ($LASTEXITCODE) { throw 'KHÔNG ĐẠT: có tệp lệch, dịch vụ không chạy hoặc API/nginx không trả lời. Xem kết quả ở trên; đừng coi là đã triển khai thành công.' }
Write-Host 'Xong: dịch vụ chạy, API sẵn sàng và tệp trên máy chủ khớp commit đã đóng gói.' -ForegroundColor Green
