#!/bin/bash
# Kiểm thử luồng nộp bài trên một bản API tạm (cổng 8790, dữ liệu tạm) – không đụng dữ liệu thật
set -u
export STUDYTASK_DATA=$(mktemp -d) STUDYTASK_PORT=8790
cd "$(dirname "$0")/../../server"
python3 studytask_api.py create-user gv01 tpass12345 teacher "GV Test" >/dev/null
python3 studytask_api.py create-user sv01 spass12345 student "SV Test" >/dev/null
python3 studytask_api.py create-user sv02 opass12345 student "SV Khac" >/dev/null
python3 - <<PY
import sys; sys.path.insert(0, '.')
import studytask_api as a
a.doc_put('sharedData', 'global', {'homeworks': [
  {'id': 7, 'subjectId': 1, 'allowSubmit': True, 'allowedExts': ['pdf', 'docx']},
  {'id': 8, 'subjectId': 1, 'allowSubmit': False}], 'materials': []})
for em in ('sv01', 'sv02'):
    r = a.db().execute('select uid from accounts where username=?', (em,)).fetchone()
    p = a.doc_get('user', r[0]); p['subjectIds'] = [1] if em == 'sv01' else [2]; a.doc_put('user', r[0], p)
PY
python3 studytask_api.py serve >/tmp/api_test.log 2>&1 &
PID=$!
B=http://127.0.0.1:8790
# Chờ API trả lời thật thay vì sleep cố định; API chết hoặc không lên thì dừng ngay với lỗi rõ ràng
for i in $(seq 1 75); do
  curl -sf -o /dev/null "$B/api/auth/me" && break
  kill -0 $PID 2>/dev/null || { echo "FAIL API thoát ngay khi khởi động:"; tail -5 /tmp/api_test.log; rm -rf $STUDYTASK_DATA; exit 1; }
  sleep 0.2
done
curl -sf -o /dev/null "$B/api/auth/me" || { echo "FAIL API không sẵn sàng sau 15 giây"; kill $PID 2>/dev/null; rm -rf $STUDYTASK_DATA; exit 1; }
login() { curl -s -c /tmp/ck_$1 -H 'Content-Type: application/json' -d "{\"username\":\"$2\",\"password\":\"$3\"}" $B/api/auth/login >/dev/null; }
login s sv01 spass12345; login o sv02 opass12345; login t gv01 tpass12345
printf '%%PDF-1.4 test' > /tmp/ok.pdf
printf 'not a pdf' > /tmp/fake.pdf
printf 'hello' > /tmp/a.txt
printf 'MZ binary' > /tmp/a.exe
fail=0
# check "mô tả" MÃ_MONG_ĐỢI MÃ_THỰC_TẾ
check() { if [ "$2" = "$3" ]; then echo "PASS $1 ($3)"; else echo "FAIL $1: mong đợi $2, nhận $3 -> $(head -c 160 /tmp/resp)"; fail=1; fi; }
up() { code=$(curl -s -o /tmp/resp -w "%{http_code}" -b /tmp/ck_$1 -X POST --data-binary @$2 "$B/api/upload?filename=$3&hw=$4"); check "$6" "$5" "$code"; }
up s /tmp/ok.pdf bai.pdf 7 200 "SV nộp PDF hợp lệ"
up s /tmp/a.txt bai.txt 7 400 "SV nộp .txt khi bài chỉ nhận PDF/Word"
up s /tmp/a.exe bai.exe 7 400 "SV nộp .exe"
up s /tmp/fake.pdf gia.pdf 7 400 "SV nộp file đổi đuôi .pdf nhưng nội dung không phải PDF"
up s /tmp/ok.pdf bai.pdf 8 400 "bài tập không nhận bài nộp"
up o /tmp/ok.pdf bai.pdf 7 403 "SV môn khác nộp vào bài này"
up s /tmp/ok.pdf bai.pdf 999 400 "bài tập không tồn tại"
up t /tmp/ok.pdf bai.pdf 7 403 "giáo viên đi đường nộp bài của sinh viên"
code=$(curl -s -o /tmp/resp -w "%{http_code}" -b /tmp/ck_s -X POST --data-binary @/tmp/ok.pdf "$B/api/upload?filename=x.pdf"); check "SV tải file lên bằng đường thường" 403 "$code"
code=$(curl -s -o /tmp/resp -w "%{http_code}" -b /tmp/ck_t -X POST --data-binary @/tmp/ok.pdf "$B/api/upload?filename=x.pdf"); check "GV tải file lên bằng đường thường" 200 "$code"
# ── tải bài nộp về: chỉ người nộp và nhân viên (việc 11 tuần 6) ──
URL=$(curl -s -b /tmp/ck_s -X POST --data-binary @/tmp/ok.pdf "$B/api/upload?filename=rieng.pdf&hw=7" | python3 -c 'import sys,json; print(json.load(sys.stdin)["url"])')
case "$URL" in /uploads/submissions/*) ;; *) echo "FAIL không lấy được đường dẫn bài nộp: $URL"; fail=1;; esac
API_URL="$B/api/files/submissions/${URL##*/}"
get() { curl -s -D /tmp/hdr -o /tmp/resp -w "%{http_code}" ${2:+-b /tmp/ck_$2} "$API_URL"; }
check "người ngoài (chưa đăng nhập) mở bài nộp" 401 "$(get x '')"
check "SV khác (môn khác) mở bài nộp" 403 "$(get x o)"
check "chủ bài nộp mở lại bài của mình" 200 "$(get x s)"
grep -qi '^cache-control: private, no-store' /tmp/hdr && echo "PASS bài nộp trả Cache-Control private, no-store" || { echo "FAIL bài nộp thiếu Cache-Control private, no-store"; fail=1; }
grep -qi '^x-content-type-options: nosniff' /tmp/hdr && echo "PASS bài nộp trả nosniff" || { echo "FAIL bài nộp thiếu nosniff"; fail=1; }
check "giáo viên mở bài nộp" 200 "$(get x t)"
code=$(curl -s -o /tmp/resp -w "%{http_code}" -b /tmp/ck_s "$B/api/files/submissions/..%2F..%2Fstudytask.db"); check "đường dẫn thoát thư mục (../) bị từ chối" 404 "$code"
code=$(curl -s -o /tmp/resp -w "%{http_code}" -b /tmp/ck_t "$B/api/files/submissions/0000000000000000_khong_co.pdf"); check "tên hợp lệ nhưng không có tệp" 404 "$code"
kill $PID; rm -rf /tmp/hdr $STUDYTASK_DATA /tmp/ck_* /tmp/ok.pdf /tmp/fake.pdf /tmp/a.txt /tmp/a.exe /tmp/resp
[ $fail = 0 ] && echo "KẾT QUẢ: ĐẠT" || echo "KẾT QUẢ: CÓ LỖI"
exit $fail
