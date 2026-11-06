#!/usr/bin/env python3
"""Kiểm thử link minh chứng của phiếu xét tốt nghiệp: máy chủ chỉ nhận http(s).
Chạy trên API tạm (cổng 8797, dữ liệu tạm): python3 tests/server/test_graduation.py"""
import http.client, json, os, shutil, subprocess, sys, tempfile, time

DATA = tempfile.mkdtemp()
ENV = dict(os.environ, STUDYTASK_DATA=DATA, STUDYTASK_PORT='8797')
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
PW = 'pass123456'
for name, role in (('sv01', 'student'), ('sv02', 'student'), ('tr01', 'training')):
    subprocess.run([sys.executable, API, 'create-user', name, PW, role, name.upper()], env=ENV, check=True, capture_output=True)
LOG = open(os.path.join(DATA, 'srv.log'), 'w')
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=LOG, stdout=LOG)
time.sleep(1.5)
fails = []


def check(name, cond, extra=''):
    print(('PASS ' if cond else 'FAIL ') + name + ((' | ' + str(extra)) if (extra and not cond) else ''))
    if not cond:
        fails.append(name)


class C:
    def __init__(self, user):
        self.cookie = ''
        _, j = self.req('POST', '/api/auth/login', {'username': user, 'password': PW})
        self.uid = j['user']['uid']

    def req(self, method, path, body=None):
        c = http.client.HTTPConnection('127.0.0.1', 8797, timeout=30)
        h = {'Cookie': self.cookie, 'Origin': 'http://127.0.0.1:8797'}
        data = None
        if body is not None:
            data = json.dumps(body).encode(); h['Content-Type'] = 'application/json'
        c.request(method, path, body=data, headers=h)
        r = c.getresponse()
        sc = r.getheader('Set-Cookie')
        if sc and 'st_session=' in sc:
            self.cookie = sc.split(';')[0]
        txt = r.read().decode()
        try:
            return r.status, json.loads(txt)
        except ValueError:
            return r.status, txt

    def put(self, uid, data):
        return self.req('PUT', f'/api/doc/graduationApps/{uid}', {'data': data, 'merge': True})[0]


try:
    sv, sv2, tr = C('sv01'), C('sv02'), C('tr01')

    for bad in ('javascript:alert(1)', 'JaVaScRiPt:alert(1)', '  javascript:alert(1)', 'data:text/html,x', 'x.vn/a', 'https://x.vn/a b', 123):
        check(f'Tạo phiếu với evidence {bad!r}: bị từ chối', sv.put(sv.uid, {'status': 'submitted', 'evidence': bad}) == 403)

    check('Tạo phiếu không có link: được', sv2.put(sv2.uid, {'status': 'submitted'}) == 200)
    check('Sửa phiếu với link https: được', sv2.put(sv2.uid, {'status': 'submitted', 'evidence': 'https://x.vn/a.pdf'}) == 200)
    check('Sửa phiếu với link http: được', sv2.put(sv2.uid, {'status': 'submitted', 'evidence': 'http://x.vn/a.pdf'}) == 200)
    check('Sửa phiếu đang có sang javascript: bị từ chối', sv2.put(sv2.uid, {'status': 'submitted', 'evidence': 'javascript:alert(1)'}) == 403)
    check('Xóa link khỏi phiếu: được', sv2.put(sv2.uid, {'status': 'submitted', 'evidence': ''}) == 200)

    # Phiếu cũ đã lưu link sai không được làm kẹt việc duyệt
    db = os.path.join(DATA, 'studytask.db')
    code = ('import sqlite3,sys,json;c=sqlite3.connect(sys.argv[1]);'
            "c.execute('INSERT OR REPLACE INTO docs VALUES (?,?,?)',('graduationApps',sys.argv[2],"
            "json.dumps({'status':'submitted','evidence':'javascript:alert(1)'})));c.commit()")
    subprocess.run([sys.executable, '-c', code, db, sv.uid], check=True)
    check('Đào tạo vẫn duyệt được phiếu cũ có link sai', tr.put(sv.uid, {'status': 'needsFix', 'review': 'Sửa link'}) == 200)
    check('Sinh viên nộp lại mà giữ link sai: bị từ chối', sv.put(sv.uid, {'status': 'submitted'}) == 403)
    check('Sinh viên sửa link rồi nộp lại: được', sv.put(sv.uid, {'status': 'submitted', 'evidence': 'https://x.vn/moi.pdf'}) == 200)
finally:
    srv.terminate()
    try:
        srv.wait(5)
    except Exception:
        srv.kill()
    LOG.close()
    shutil.rmtree(DATA, ignore_errors=True)

print('KẾT QUẢ:', 'ĐẠT' if not fails else 'CÓ LỖI: ' + '; '.join(fails))
sys.exit(1 if fails else 0)
