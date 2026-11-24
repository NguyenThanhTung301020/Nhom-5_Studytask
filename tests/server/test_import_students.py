#!/usr/bin/env python3
"""Kiểm thử nhập danh sách lớp ([D3] mục 14): chỉ Admin và Phòng Đào tạo nhập, giáo viên chỉ xem.
API tạm, cổng 8811, dữ liệu tạm. Việc 7 của kế hoạch tuần 8."""
import http.client, json, os, shutil, subprocess, sys, tempfile, time
PORT = 8811
D = tempfile.mkdtemp(); ENV = dict(os.environ, STUDYTASK_DATA=D, STUDYTASK_PORT=str(PORT), PYTHONUTF8='1')
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
USERS = (('ad01', 'adminpass1', 'admin'), ('dt01', 'dtpass1234', 'training'),
         ('gv01', 'gvpass1234', 'teacher'), ('sv01', 'svpass1234', 'student'))
for u, pw, role in USERS:
    subprocess.run([sys.executable, API, 'create-user', u, pw, role, u], env=ENV, check=True, capture_output=True)
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)


def wait_ready(seconds=15):
    """Chờ API trả lời thật (GET /api/auth/me = 200); thoát với lỗi rõ ràng nếu API không lên."""
    end = time.time() + seconds
    while time.time() < end:
        if srv.poll() is not None:
            print('FAIL API thoát ngay khi khởi động (mã %s), có thể trùng cổng %d' % (srv.returncode, PORT)); shutil.rmtree(D, ignore_errors=True); sys.exit(1)
        try:
            c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=1); c.request('GET', '/api/auth/me')
            if c.getresponse().status == 200:
                return
        except OSError:
            pass
        time.sleep(0.2)
    srv.terminate(); shutil.rmtree(D, ignore_errors=True)
    print('FAIL API không sẵn sàng sau %d giây' % seconds); sys.exit(1)


def req(m, p, b=None, ck=''):
    c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=5)
    c.request(m, p, json.dumps(b) if b is not None else None, {'Content-Type': 'application/json', 'Cookie': ck})
    r = c.getresponse(); sc = r.getheader('Set-Cookie'); raw = r.read()
    return r.status, (json.loads(raw) if raw else {}), (sc.split(';')[0] if sc and 'st_session=' in sc else '')


ok = True


def chk(n, c):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + n)


def users(ck):
    return {d.get('username'): d for d in req('GET', '/api/doc/user', ck=ck)[1]['docs']}


wait_ready()
URL = '/api/admin/import-students'
try:
    ck = {u: req('POST', '/api/auth/login', {'username': u, 'password': pw})[2] for u, pw, _ in USERS}
    rows = [{'mssv': '2401001', 'name': 'Nguyễn Văn A', 'classId': 'CNTT24-01', 'cohort': '2024-2028'},
            {'mssv': '2401002', 'name': 'Trần Thị B', 'classId': 'cntt24-01'},
            {'mssv': '2401003', 'name': 'Lê C', 'classId': 'CNTT24-01', 'role': 'admin'}]

    st, r, _ = req('POST', URL, {'rows': rows}, ck['ad01'])
    chk('Admin nhập 3 dòng → cả 3 được tạo', st == 200 and [x['status'] for x in r['results']] == ['created'] * 3)
    res = r.get('results', [])
    us = users(ck['ad01']); a = us.get('sv2401001', {})
    chk('Hồ sơ có mã SV, mã lớp, khóa, vai trò sinh viên',
        a.get('studentId') == '2401001' and a.get('classId') == 'CNTT24-01' and a.get('cohort') == '2024-2028' and a.get('role') == 'student')
    chk('Gửi kèm role admin → tài khoản vẫn là sinh viên', us.get('sv2401003', {}).get('role') == 'student')
    chk('Mã lớp chữ thường được đổi in hoa', us.get('sv2401002', {}).get('classId') == 'CNTT24-01')
    st, _, ck1 = req('POST', '/api/auth/login', {'username': 'sv2401001', 'password': res[0]['password'] if res else ''})
    chk('Đăng nhập được bằng sv<mã SV> và mật khẩu ban đầu', st == 200 and ck1)

    st, r, _ = req('POST', URL, {'rows': [{'mssv': '2401001', 'name': 'Tên Khác', 'classId': 'XYZ-99'},
                                          {'mssv': '24A01', 'name': 'X', 'classId': 'CNTT24-01'}, 'abc']}, ck['dt01'])
    chk('Phòng Đào tạo nhập được; trùng → exists, sai → invalid, dòng không phải đối tượng → invalid',
        st == 200 and [x['status'] for x in r['results']] == ['exists', 'invalid', 'invalid'])
    a2 = users(ck['ad01'])['sv2401001']
    chk('Nhập lại mã SV đã có → hồ sơ cũ không bị ghi đè', a2.get('name') == 'Nguyễn Văn A' and a2.get('classId') == 'CNTT24-01')
    st, r, _ = req('POST', URL, {'rows': [{'mssv': '2401010', 'name': 'K', 'classId': 'CNTT24-01', 'cohort': 'K24'}]}, ck['ad01'])
    chk('Khóa sai định dạng (K24) → invalid, không tạo tài khoản',
        st == 200 and r['results'][0]['status'] == 'invalid' and 'sv2401010' not in users(ck['ad01']))

    chk('Giáo viên gọi API → 403', req('POST', URL, {'rows': rows}, ck['gv01'])[0] == 403)
    chk('Sinh viên gọi API → 403', req('POST', URL, {'rows': rows}, ck['sv01'])[0] == 403)
    chk('Chưa đăng nhập → 401', req('POST', URL, {'rows': rows})[0] == 401)
    chk('Quá 500 dòng → 400', req('POST', URL, {'rows': [rows[0]] * 501}, ck['ad01'])[0] == 400)
    chk('Danh sách rỗng → 400', req('POST', URL, {'rows': []}, ck['ad01'])[0] == 400)
finally:
    srv.terminate(); srv.wait(); shutil.rmtree(D, ignore_errors=True)

print('OK' if ok else 'CÓ CA LỖI')
sys.exit(0 if ok else 1)
