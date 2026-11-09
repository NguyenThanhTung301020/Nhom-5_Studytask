#!/usr/bin/env python3
"""Kiểm thử Admin đặt lại mật khẩu cho tài khoản khác (API tạm, cổng 8794, dữ liệu tạm).
Việc 4 của kế hoạch tuần 6: ca kiểm thử tự động cho việc Admin đặt lại mật khẩu."""
import http.client, json, os, shutil, subprocess, sys, tempfile, time
D = tempfile.mkdtemp(); ENV = dict(os.environ, STUDYTASK_DATA=D, STUDYTASK_PORT='8794')
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
for u, pw, role, name in (('ad01', 'adminpass1', 'admin', 'AD'), ('sv01', 'svpass1234', 'student', 'SV 1'),
                          ('sv02', 'svpass5678', 'student', 'SV 2'), ('gv01', 'gvpass1234', 'teacher', 'GV 1')):
    subprocess.run([sys.executable, API, 'create-user', u, pw, role, name], env=ENV, check=True, capture_output=True)
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL); time.sleep(1.5)
ok = True


def req(m, p, b=None, ck=''):
    c = http.client.HTTPConnection('127.0.0.1', 8794, timeout=5)
    c.request(m, p, json.dumps(b) if b is not None else None, {'Content-Type': 'application/json', 'Cookie': ck})
    r = c.getresponse(); sc = r.getheader('Set-Cookie'); raw = r.read()
    return r.status, (json.loads(raw) if raw else {}), (sc.split(';')[0] if sc and 'st_session=' in sc else '')


def login(u, pw):
    st, r, ck = req('POST', '/api/auth/login', {'username': u, 'password': pw})
    return st, ck


def chk(n, c):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + n)


def uid_of(ck, username):
    return [d for d in req('GET', '/api/doc/user', ck=ck)[1]['docs'] if d.get('username') == username][0]['id']


try:
    _, ad = login('ad01', 'adminpass1')
    _, sv1 = login('sv01', 'svpass1234')
    _, sv2 = login('sv02', 'svpass5678')
    _, gv = login('gv01', 'gvpass1234')
    uid1, uid2 = uid_of(ad, 'sv01'), uid_of(ad, 'sv02')
    pw_url = lambda uid: f'/api/admin/users/{uid}/password'

    # ── quyền gọi ──
    chk('chưa đăng nhập → 401', req('POST', pw_url(uid1), {'newPassword': 'hacked123'})[0] == 401)
    chk('sinh viên đặt lại mật khẩu người khác → 403', req('POST', pw_url(uid2), {'newPassword': 'hacked123'}, sv1)[0] == 403)
    chk('sinh viên tự đặt lại mật khẩu qua đường Admin → 403', req('POST', pw_url(uid1), {'newPassword': 'hacked123'}, sv1)[0] == 403)
    chk('giáo viên đặt lại mật khẩu sinh viên → 403', req('POST', pw_url(uid1), {'newPassword': 'hacked123'}, gv)[0] == 403)
    chk('các lần bị từ chối không đổi mật khẩu (sv01, sv02 vẫn đăng nhập được bằng mật khẩu cũ)',
        login('sv01', 'svpass1234')[0] == 200 and login('sv02', 'svpass5678')[0] == 200 and login('sv01', 'hacked123')[0] == 401)

    # ── dữ liệu đầu vào ──
    chk('mật khẩu mới quá ngắn → 400', req('POST', pw_url(uid1), {'newPassword': '123'}, ad)[0] == 400)
    chk('thiếu newPassword → 400', req('POST', pw_url(uid1), {}, ad)[0] == 400)
    chk('mật khẩu không phải chuỗi → không đặt được (không phải 200)', req('POST', pw_url(uid1), {'newPassword': None}, ad)[0] != 200)
    chk('uid không tồn tại → 404', req('POST', pw_url('khong-ton-tai'), {'newPassword': 'matkhaumoi1'}, ad)[0] == 404)
    chk('sau các lần lỗi, mật khẩu cũ của sv01 vẫn dùng được', login('sv01', 'svpass1234')[0] == 200)

    # ── Admin đặt lại thành công ──
    _, sv1_old = login('sv01', 'svpass1234')
    chk('phiên cũ của sv01 còn hiệu lực trước khi đặt lại', req('GET', '/api/auth/me', ck=sv1_old)[1]['user'] is not None)
    chk('Admin đặt lại mật khẩu sv01 → 200', req('POST', pw_url(uid1), {'newPassword': 'matkhaumoi1'}, ad)[0] == 200)
    chk('mật khẩu cũ không còn đăng nhập được', login('sv01', 'svpass1234')[0] == 401)
    chk('mật khẩu mới đăng nhập được', login('sv01', 'matkhaumoi1')[0] == 200)
    chk('phiên cũ của sv01 bị thu hồi sau khi đặt lại', req('GET', '/api/auth/me', ck=sv1_old)[1]['user'] is None)
    chk('đặt lại cho sv01 không ảnh hưởng sv02', login('sv02', 'svpass5678')[0] == 200)
    chk('phiên của Admin không bị thu hồi', req('GET', '/api/auth/me', ck=ad)[1]['user'] is not None)
    db = open(os.path.join(D, 'studytask.db'), 'rb').read()
    wal = open(os.path.join(D, 'studytask.db-wal'), 'rb').read() if os.path.exists(os.path.join(D, 'studytask.db-wal')) else b''
    chk('mật khẩu mới không nằm dạng văn bản trong database', b'matkhaumoi1' not in db and b'matkhaumoi1' not in wal)
finally:
    srv.terminate(); srv.wait(5); shutil.rmtree(D, ignore_errors=True)
print('KẾT QUẢ:', 'ĐẠT' if ok else 'CÓ LỖI'); sys.exit(0 if ok else 1)
