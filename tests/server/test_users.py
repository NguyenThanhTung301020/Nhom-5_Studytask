#!/usr/bin/env python3
"""Kiểm thử tạo / đăng nhập tài khoản theo tên đăng nhập (API tạm, cổng 8793)."""
import http.client, json, os, shutil, subprocess, sys, tempfile, time
D = tempfile.mkdtemp(); ENV = dict(os.environ, STUDYTASK_DATA=D, STUDYTASK_PORT='8793')
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
subprocess.run([sys.executable, API, 'create-user', 'ad01', 'adminpass1', 'admin', 'AD'], env=ENV, check=True, capture_output=True)
bad = subprocess.run([sys.executable, API, 'create-user', 'Có Dấu', 'adminpass1', 'student', 'X'], env=ENV, capture_output=True)
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL); time.sleep(1.5)
ok = True; ck = ''
def req(m, p, b=None):
    global ck
    c = http.client.HTTPConnection('127.0.0.1', 8793, timeout=5)
    c.request(m, p, json.dumps(b) if b is not None else None, {'Content-Type': 'application/json', 'Cookie': ck})
    r = c.getresponse(); sc = r.getheader('Set-Cookie')
    if sc and 'st_session=' in sc: ck = sc.split(';')[0]
    return r.status, json.loads(r.read() or b'{}')
def chk(n, c):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + n)
try:
    chk('CLI từ chối tên đăng nhập có dấu/khoảng trắng', bad.returncode != 0)
    st, r = req('POST', '/api/auth/login', {'username': 'AD01', 'password': 'adminpass1'})
    chk('đăng nhập (không phân biệt hoa thường) trả về username', st == 200 and r['user'].get('username') == 'ad01' and 'email' not in r['user'])
    chk('/auth/me trả username', req('GET', '/api/auth/me')[1]['user']['username'] == 'ad01')
    mk = lambda u, pw='matkhau123': req('POST', '/api/admin/users', {'username': u, 'password': pw, 'profile': {'name': 'SV', 'role': 'student'}})
    chk('admin tạo user hợp lệ', mk('sv.nguyen-01')[0] == 200)
    chk('trùng tên đăng nhập (khác hoa thường) → 409', mk('SV.Nguyen-01')[0] == 409)
    chk('tên có khoảng trắng → 400', mk('sv nguyen')[0] == 400)
    chk('tên có @ (email) → 400', mk('a@b.com')[0] == 400)
    chk('tên quá ngắn → 400', mk('ab')[0] == 400)
    chk('mật khẩu ngắn → 400', mk('svshort', '123')[0] == 400)
    uid = [d for d in req('GET', '/api/doc/user')[1]['docs'] if d.get('username') == 'sv.nguyen-01'][0]['id']
    chk('hồ sơ lưu username, không lưu email', 'email' not in req('GET', f'/api/doc/user/{uid}')[1]['data'])
    ck = ''
    chk('user mới đăng nhập được', req('POST', '/api/auth/login', {'username': 'sv.nguyen-01', 'password': 'matkhau123'})[0] == 200)
    chk('đăng nhập bằng email lạ bị từ chối', req('POST', '/api/auth/login', {'username': 'x@gmail.com', 'password': 'matkhau123'})[0] == 401)
    db = open(os.path.join(D, 'studytask.db'), 'rb').read()
    chk('mật khẩu không nằm dạng văn bản trong database', b'matkhau123' not in db and b'adminpass1' not in db)
finally:
    srv.terminate(); srv.wait(5); shutil.rmtree(D, ignore_errors=True)
print('KẾT QUẢ:', 'ĐẠT' if ok else 'CÓ LỖI'); sys.exit(0 if ok else 1)
