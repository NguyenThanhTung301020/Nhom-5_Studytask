#!/usr/bin/env python3
"""Kiểm thử R1 (review PR9 lần 2): giáo viên ghi sharedData/global không được làm mất hay sửa
môn, lịch học, lịch thi, deadline, bài tập, tài liệu của môn mình không được phân công.
Chạy trên API tạm (cổng 8789, dữ liệu tạm): python3 tests/server/test_teacher_shared.py"""
import http.client, json, os, shutil, subprocess, sys, tempfile, time

PORT = 8789
DATA = tempfile.mkdtemp()
ENV = dict(os.environ, STUDYTASK_DATA=DATA, STUDYTASK_PORT=str(PORT))
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
PW = 'pass123456'
for name, role in (('ad01', 'admin'), ('tr01', 'training'), ('gvcu', 'teacher')):
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
        c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=30)
        h = {'Cookie': self.cookie, 'Origin': f'http://127.0.0.1:{PORT}'}
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

    def put(self, data, merge=True):
        return self.req('PUT', '/api/doc/sharedData/global', {'data': data, 'merge': merge})[0]

    def shared(self):
        return self.req('GET', '/api/doc/sharedData/global')[1]['data']


S1 = {'id': 1, 'code': 'X1', 'name': 'Môn 1', 'credits': 3}
S2 = {'id': 2, 'code': 'X2', 'name': 'Môn 2', 'credits': 3}
S3 = {'id': 3, 'code': 'X3', 'name': 'Môn 3', 'credits': 2}
SEED = {
    'subjects': [S1, S2, S3],
    'deadlines': [{'id': 11, 'subjectId': 1, 'title': 'DL môn 1'}, {'id': 12, 'subjectId': 2, 'title': 'DL môn 2'}, {'id': 13, 'title': 'DL chung'}],
    'schedule': [{'id': 21, 'subjectId': 1}, {'id': 22, 'subjectId': 2}],
    'exams': [{'id': 31, 'subjectId': 2}],
    'homeworks': [{'id': 41, 'subjectId': 2, 'title': 'BT môn 2'}],
    'materials': [{'id': 51, 'subjectId': 1}, {'id': 52, 'subjectId': 3}],
    'news': [],
}

try:
    ad, tr = C('ad01'), C('tr01')
    st, j = ad.req('POST', '/api/admin/users', {'username': 'gv01', 'password': PW, 'profile': {'name': 'GV01', 'role': 'teacher', 'subjectIds': [1]}})
    check('Admin tạo giáo viên gv01 dạy môn 1', st == 200, j)
    gv = C('gv01')
    reset = lambda: ad.put(SEED, merge=False)

    # ── Lỗi R1: giao diện cũ gửi danh sách đã lọc theo môn ──
    reset()
    check('GV sửa môn của mình bằng danh sách đã lọc (làm mất môn 2, 3): bị từ chối',
          gv.put({'subjects': [{**S1, 'name': 'Môn 1 mới'}]}) == 403)
    check('…và danh sách môn trên máy chủ còn đủ 3 môn', [s['id'] for s in ad.shared()['subjects']] == [1, 2, 3])
    check('GV ghi subjects rỗng: bị từ chối', gv.put({'subjects': []}) == 403)
    check('GV ghi đè không merge, bỏ hẳn khóa subjects: bị từ chối',
          gv.put({k: v for k, v in SEED.items() if k != 'subjects'}, merge=False) == 403)
    check('GV xóa deadline của môn 2 (gửi danh sách đã lọc): bị từ chối',
          gv.put({'deadlines': [SEED['deadlines'][0]]}) == 403)

    # ── Giao diện sau khi sửa: gửi danh sách đầy đủ ──
    check('GV sửa tên môn của mình, giữ nguyên môn khác: được',
          gv.put({'subjects': [{**S1, 'name': 'Môn 1 mới'}, S2, S3]}) == 200)
    check('GV sửa tên môn 2 (không được phân công): bị từ chối',
          gv.put({'subjects': [S1, {**S2, 'name': 'Đổi tên'}, S3]}) == 403)
    check('GV thêm môn mới: được (giữ hành vi cũ)',
          gv.put({'subjects': [S1, S2, S3, {'id': 9, 'code': 'X9', 'name': 'Môn 9'}]}) == 200)
    check('GV xóa môn của mình, giữ môn khác: được',
          gv.put({'subjects': [S2, S3, {'id': 9, 'code': 'X9', 'name': 'Môn 9'}]}) == 200)
    reset()
    dl = SEED['deadlines']
    check('GV thêm deadline cho môn mình: được',
          gv.put({'deadlines': dl + [{'id': 14, 'subjectId': 1, 'title': 'mới'}]}) == 200)
    check('GV sửa deadline môn mình, giữ deadline khác: được',
          gv.put({'deadlines': [{**dl[0], 'title': 'sửa'}, dl[1], dl[2]]}) == 200)
    check('GV sửa deadline chung (không có subjectId): được', gv.put({'deadlines': [dl[0], dl[1], {**dl[2], 'title': 'sửa'}]}) == 200)
    check('GV sửa deadline môn 2: bị từ chối', gv.put({'deadlines': [dl[0], {**dl[1], 'title': 'sửa'}, dl[2]]}) == 403)
    check('GV thêm deadline cho môn 2: bị từ chối',
          gv.put({'deadlines': dl + [{'id': 15, 'subjectId': 2, 'title': 'lạ'}]}) == 403)
    check('GV chuyển deadline môn 2 sang môn mình: bị từ chối',
          gv.put({'deadlines': [dl[0], {**dl[1], 'subjectId': 1}, dl[2]]}) == 403)
    check('GV chuyển deadline môn mình sang môn 2: bị từ chối',
          gv.put({'deadlines': [{**dl[0], 'subjectId': 2}, dl[1], dl[2]]}) == 403)
    for k in ('schedule', 'exams', 'homeworks', 'materials'):
        own = [x for x in SEED[k] if x.get('subjectId') == 1]
        check(f'GV bỏ {k} của môn khác (danh sách đã lọc): bị từ chối', gv.put({k: own}) == 403)
    check('GV xóa tài liệu môn mình, giữ tài liệu môn 3: được', gv.put({'materials': [SEED['materials'][1]]}) == 200)
    check('GV gửi lại nguyên dữ liệu (giao diện tự lưu khi tải trang): được', gv.put(ad.shared()) == 200)
    d = ad.shared()
    check('Sau các lần bị từ chối, dữ liệu môn khác còn nguyên',
          [s['id'] for s in d['subjects']] == [1, 2, 3] and any(x['id'] == 12 for x in d['deadlines'])
          and d['homeworks'] == SEED['homeworks'] and d['exams'] == SEED['exams'])

    # ── Vai trò khác không đổi ──
    reset()
    check('Đào tạo bớt môn: vẫn được', tr.put({'subjects': [S1, S2]}) == 200)
    check('Admin ghi subjects rỗng: vẫn được', ad.put({'subjects': []}) == 200)

    # Giáo viên hồ sơ cũ chưa có subjectIds: giao diện coi là dạy mọi môn nên không giới hạn
    reset()
    db = os.path.join(DATA, 'studytask.db')
    gvcu = C('gvcu')
    code = ('import sqlite3,sys,json;c=sqlite3.connect(sys.argv[1]);'
            "r=c.execute('SELECT data FROM docs WHERE col=? AND id=?',('user',sys.argv[2])).fetchone();"
            "d=json.loads(r[0]);d.pop('subjectIds',None);"
            "c.execute('UPDATE docs SET data=? WHERE col=? AND id=?',(json.dumps(d),'user',sys.argv[2]));c.commit()")
    subprocess.run([sys.executable, '-c', code, db, gvcu.uid], check=True)
    check('GV hồ sơ cũ (không có subjectIds) sửa môn 2: được', gvcu.put({'subjects': [S1, {**S2, 'name': 'đổi'}, S3]}) == 200)
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
