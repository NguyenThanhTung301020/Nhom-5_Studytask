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
sleep 1.5
B=http://127.0.0.1:8790
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
kill $PID; rm -rf $STUDYTASK_DATA /tmp/ck_* /tmp/ok.pdf /tmp/fake.pdf /tmp/a.txt /tmp/a.exe /tmp/resp
[ $fail = 0 ] && echo "KẾT QUẢ: ĐẠT" || echo "KẾT QUẢ: CÓ LỖI"
exit $fail
