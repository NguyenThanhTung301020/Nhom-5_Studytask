#!/usr/bin/env python3
"""Kiểm thử động trên hệ thống ĐANG CHẠY (thay cho thử tay): chỉ gửi yêu cầu an toàn, không tạo hay sửa dữ liệu.
    python3 tests/server/smoke_live.py                         # https://sutdytask.io.vn
    python3 tests/server/smoke_live.py https://host            # hoặc địa chỉ khác (http://127.0.0.1:8787 khi chạy trên máy chủ)
Tùy chọn: đặt SMOKE_USER và SMOKE_PASS (một tài khoản sinh viên THỬ) để kiểm tra thêm khi đã đăng nhập; không đặt thì chỉ kiểm tra người ngoài.
Thoát 0 nếu mọi ca đạt, 1 nếu có ca lỗi (dùng được trong script triển khai)."""
import http.client, json, os, ssl, sys, time
from urllib.parse import urlparse

BASE = urlparse(sys.argv[1] if len(sys.argv) > 1 else 'https://sutdytask.io.vn')
ok = True


def req(method, path, body=None, cookie=''):
    c = (http.client.HTTPSConnection(BASE.netloc, timeout=20, context=ssl.create_default_context()) if BASE.scheme == 'https'
         else http.client.HTTPConnection(BASE.netloc, timeout=20))
    h = {'User-Agent': 'StudyTask-smoke/1.0', 'Cookie': cookie}
    if body is not None:
        h['Content-Type'] = 'application/json'
    c.request(method, path, json.dumps(body) if body is not None else None, h)
    r = c.getresponse(); raw = r.read().decode('utf-8', 'replace'); sc = r.getheader('Set-Cookie') or ''
    try: js = json.loads(raw)
    except ValueError: js = {}
    return r.status, js, raw, dict((k.lower(), v) for k, v in r.getheaders()), sc.split(';')[0]


def chk(name, cond, extra=''):
    global ok; ok &= bool(cond); print(('PASS ' if cond else 'FAIL ') + name + ('' if cond else ' | ' + str(extra)))


print('# smoke_live %s lúc %s' % (BASE.geturl(), time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())))
FAKE = '0000000000000000_khong_ton_tai.pdf'
st, js, raw, h, _ = req('GET', '/')
chk('trang chủ trả 200 và là HTML', st == 200 and '<html' in raw.lower(), st)
st, js, raw, h, _ = req('GET', '/utils/sanitize.js')
chk('giao diện mới có utils/sanitize.js (PR37 đã triển khai)', st == 200, st)
st, js, raw, h, _ = req('GET', '/api/auth/me')
chk('/api/auth/me khi chưa đăng nhập: 200, user = null', st == 200 and js.get('user') is None, (st, raw[:80]))
st, js, raw, h, _ = req('GET', '/api/doc/sharedData/global')
chk('chưa đăng nhập không đọc được dữ liệu dùng chung', st in (401, 403) and 'quizzes' not in raw, st)
st, js, raw, h, _ = req('GET', '/uploads/submissions/' + FAKE)
chk('bài nộp qua đường /uploads/submissions/ khi chưa đăng nhập → 401', st == 401, st)
chk('bài nộp không bị nginx phục vụ trực tiếp (không có cache công khai)', 'public' not in h.get('cache-control', ''), h.get('cache-control'))
st, js, raw, h, _ = req('GET', '/api/files/submissions/' + FAKE)
chk('bài nộp qua API khi chưa đăng nhập → 401', st == 401, st)
st, js, raw, h, _ = req('GET', '/api/files/submissions/..%2F..%2Fstudytask.db')
chk('đường dẫn thoát thư mục không đọc được CSDL', st in (401, 404) and 'SQLite' not in raw, st)
st, js, raw, h, _ = req('POST', '/api/quiz/1/submit', {'answers': {}})
chk('nộp trắc nghiệm khi chưa đăng nhập → 401', st == 401, st)
st, js, raw, h, _ = req('GET', '/api/quiz/mine')
chk('/api/quiz/mine khi chưa đăng nhập → 401', st == 401, st)
st, js, raw, h, _ = req('GET', '/api/quizbank')
chk('kho đề khi chưa đăng nhập → 401', st == 401, st)
st, js, raw, h, _ = req('GET', '/api/quiz/1/archive')
chk('bản lưu đề (đáp án) khi chưa đăng nhập → 401', st == 401, st)
st, js, raw, h, _ = req('POST', '/api/admin/users/khong-ton-tai/password', {'newPassword': 'khongduoc123'})
chk('đặt lại mật khẩu bằng đường Admin khi chưa đăng nhập → 401', st == 401, st)
for col in ('quizKeys', 'quizResults'):
    st, js, raw, h, _ = req('GET', '/api/doc/' + col)
    chk('collection %s không đọc được từ ngoài' % col, st in (401, 403) or js.get('docs') == [], (st, raw[:80]))
st, js, raw, h, _ = req('POST', '/api/auth/login', {'username': 'khong-ton-tai-smoke', 'password': 'sai-mat-khau'})
chk('đăng nhập sai trả 401 (không phải 5xx)', st == 401, st)
st, js, raw, h, _ = req('GET', '/.git/config')
chk('không lộ thư mục .git', st in (403, 404) or 'repositoryformatversion' not in raw, st)
st, js, raw, h, _ = req('GET', '/server/studytask_api.py')
chk('không phục vụ mã nguồn máy chủ', 'def can(' not in raw, st)

user, pw = os.environ.get('SMOKE_USER'), os.environ.get('SMOKE_PASS')
if user and pw:
    print('# có tài khoản thử: kiểm tra thêm khi đã đăng nhập (chỉ đọc)')
    st, js, raw, h, ck = req('POST', '/api/auth/login', {'username': user, 'password': pw})
    chk('đăng nhập tài khoản thử', st == 200 and ck, st)
    if ck:
        st, js, raw, h, _ = req('GET', '/api/doc/sharedData/global', cookie=ck)
        chk('dữ liệu đề trả cho tài khoản thử không có `correct`', st == 200 and '"correct"' not in raw, st)
        role = (req('GET', '/api/auth/me', cookie=ck)[1].get('user') or {})
        st, js, raw, h, _ = req('GET', '/api/quiz/mine', cookie=ck)
        chk('/api/quiz/mine trả danh sách kết quả của chính mình', st == 200 and isinstance(js.get('results'), list), st)
        st, js, raw, h, _ = req('GET', '/api/doc/quizKeys/1', cookie=ck)
        chk('tài khoản thử không đọc được khóa đáp án', st == 403, st)
        req('POST', '/api/auth/logout', {}, ck)
print('KẾT QUẢ:', 'ĐẠT' if ok else 'CÓ LỖI'); sys.exit(0 if ok else 1)
