#!/usr/bin/env python3
"""Kiểm thử R2, R4 (review PR9 lần 2): bớt/xóa môn khi môn còn dữ liệu bị chặn hẳn ở máy chủ (409 subject-in-use).
Trước đây máy chủ nhận mọi lần ghi `subjects` của Đào tạo/Admin, nên gọi thẳng API (hoặc trang Môn học) bớt được môn
còn lịch học, lịch thi, deadline, bài tập, tài liệu, đề và để lại dữ liệu mồ côi (ca S03 trong review).
Chạy trên API tạm (cổng 8803, dữ liệu tạm): python3 tests/server/test_subject_removal.py"""
import http.client, json, os, shutil, sqlite3, subprocess, sys, tempfile, time

PORT = 8803
DATA = tempfile.mkdtemp()
ENV = dict(os.environ, STUDYTASK_DATA=DATA, STUDYTASK_PORT=str(PORT))
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
PW = 'pass123456'
for name, role in (('ad01', 'admin'), ('tr01', 'training')):
    subprocess.run([sys.executable, API, 'create-user', name, PW, role, name.upper()], env=ENV, check=True, capture_output=True)
LOG = open(os.path.join(DATA, 'srv.log'), 'w')
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=LOG, stdout=LOG)
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

    def put(self, data):
        return self.req('PUT', '/api/doc/sharedData/global', {'data': data, 'merge': True})

    def subject_ids(self):
        return [s['id'] for s in self.req('GET', '/api/doc/sharedData/global')[1]['data']['subjects']]


def wait_api():
    for _ in range(100):
        try:
            c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=2)
            c.request('GET', '/api/auth/me')
            c.getresponse().read()
            return
        except OSError:
            time.sleep(0.1)


S = {i: {'id': i, 'code': f'X{i}', 'name': f'Môn {i}', 'credits': 3} for i in range(1, 9)}
SEED = {
    'subjects': [S[i] for i in range(1, 9)],
    'schedule': [{'id': 101, 'subjectId': 1}],
    'exams': [{'id': 201, 'subjectId': 1}],
    'deadlines': [{'id': 301, 'subjectId': 1, 'title': 'DL'}, {'id': 399, 'subjectId': 99, 'title': 'mồ côi từ trước'}],
    'homeworks': [{'id': 401, 'subjectId': 2, 'title': 'BT'}],
    'materials': [{'id': 501, 'subjectId': 2, 'title': 'TL'}],
    'quizzes': [{'id': 601, 'subjectId': 3, 'title': 'Đề', 'status': 'draft', 'questions': []}],
    'news': [],
}


def reset():
    """Ghi thẳng vào CSDL (đề trắc nghiệm đi qua API thì bị guard_quizzes tách đáp án; ở đây chỉ cần dữ liệu có subjectId)."""
    c = sqlite3.connect(os.path.join(DATA, 'studytask.db'))
    c.execute('INSERT OR REPLACE INTO docs VALUES (?,?,?)', ('sharedData', 'global', json.dumps(SEED, ensure_ascii=False)))
    c.commit()
    c.close()


def without(*ids):
    return [S[i] for i in range(1, 9) if i not in ids]


try:
    wait_api()
    ad, tr = C('ad01'), C('tr01')
    st, j = ad.req('POST', '/api/admin/users', {'username': 'sv01', 'password': PW, 'profile': {'name': 'SV01', 'role': 'student', 'subjectIds': [4]}})
    check('Admin tạo sinh viên sv01 học môn 4', st == 200, j)
    sv_uid = j.get('uid')
    st, j = ad.req('POST', '/api/admin/users', {'username': 'gv01', 'password': PW, 'profile': {'name': 'GV01', 'role': 'teacher', 'subjectIds': [6]}})
    check('Admin tạo giáo viên gv01 dạy môn 6', st == 200, j)
    gv = C('gv01')

    # ── Môn còn dữ liệu: bị chặn, dữ liệu giữ nguyên ──
    reset()
    st, j = tr.put({'subjects': without(1)})
    check('Đào tạo bớt môn 1 còn lịch học, lịch thi, deadline (ca S03): 409', st == 409, (st, j))
    check('…mã lỗi subject-in-use', isinstance(j, dict) and j.get('error', {}).get('code') == 'subject-in-use', j)
    msg = j.get('error', {}).get('message', '') if isinstance(j, dict) else ''
    check('…thông báo nêu đủ 1 lịch học, 1 lịch thi, 1 deadline', all(x in msg for x in ('1 lịch học', '1 lịch thi', '1 deadline')), msg)
    check('…danh sách môn vẫn còn môn 1', 1 in tr.subject_ids())

    reset()
    st, j = tr.put({'subjects': without(2)})
    check('Đào tạo bớt môn 2 chỉ còn bài tập, tài liệu (R2): 409', st == 409, (st, j))
    msg = j.get('error', {}).get('message', '') if isinstance(j, dict) else ''
    check('…thông báo nêu 1 bài tập, 1 tài liệu', '1 bài tập' in msg and '1 tài liệu' in msg, msg)

    reset()
    st, j = tr.put({'subjects': without(3)})
    check('Đào tạo bớt môn 3 chỉ còn đề trắc nghiệm: 409', st == 409, (st, j))

    reset()
    st, j = ad.put({'subjects': without(4)})
    check('Admin bớt môn 4 còn sinh viên được phân môn: 409', st == 409, (st, j))
    msg = j.get('error', {}).get('message', '') if isinstance(j, dict) else ''
    check('…thông báo nêu 1 tài khoản được phân môn', '1 tài khoản được phân môn' in msg, msg)
    st, j = ad.req('PUT', f'/api/doc/user/{sv_uid}', {'data': {'subjectIds': []}, 'merge': True})
    check('Admin bỏ phân môn 4 của sv01', st == 200, (st, j))
    check('…rồi bớt môn 4: được', ad.put({'subjects': without(4)})[0] == 200)

    reset()
    st, j = tr.put({'subjects': without(8)})
    check('Đào tạo bớt nhiều môn trong một lần, chỉ môn 8 không còn dữ liệu: được', st == 200, (st, j))
    reset()
    st, j = tr.put({'subjects': without(1, 8)})
    check('Bớt cùng lúc môn 8 (trống) và môn 1 (còn dữ liệu): 409, không bớt môn nào', st == 409 and tr.subject_ids() == list(range(1, 9)), (st, j))

    # ── Bỏ môn cùng toàn bộ dữ liệu của môn trong cùng một lần ghi: được ──
    reset()
    st, j = tr.put({'subjects': without(2), 'homeworks': [], 'materials': []})
    check('Bớt môn 2 cùng lúc bỏ bài tập, tài liệu của môn: được', st == 200, (st, j))
    check('…môn 2 không còn', 2 not in tr.subject_ids())

    # ── Không bớt môn: không bị ảnh hưởng ──
    reset()
    check('Đổi tên môn 1 (còn dữ liệu): được', tr.put({'subjects': [{**S[1], 'name': 'Môn 1 mới'}] + without(1)})[0] == 200)
    reset()
    check('Thêm môn mới: được', tr.put({'subjects': [S[i] for i in range(1, 9)] + [{'id': 9, 'code': 'X9', 'name': 'Môn 9'}]})[0] == 200)
    reset()
    check('Dữ liệu mồ côi có từ trước (môn 99) không chặn việc sửa khác', tr.put({'deadlines': SEED['deadlines'] + [{'id': 302, 'subjectId': 1}]})[0] == 200)
    reset()
    check('Bớt môn 5 không còn dữ liệu, không ai được phân: được', tr.put({'subjects': without(5)})[0] == 200)

    # ── Giáo viên: vẫn chịu cả R1 (teacher_shared_ok) lẫn kiểm tra này ──
    reset()
    st, j = gv.put({'subjects': without(6)})
    check('Giáo viên xóa môn 6 mình đang được phân: 409 (còn chính tài khoản giáo viên)', st == 409, (st, j))
    reset()
    st, j = gv.put({'subjects': without(2)})
    check('Giáo viên xóa môn 2 không được phân: 403 (R1), không phải 409', st == 403, (st, j))
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
