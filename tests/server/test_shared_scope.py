#!/usr/bin/env python3
"""Việc 14 – phân quyền đọc sharedData/global theo môn (API tạm, cổng 8797, dữ liệu tạm).
Sinh viên chỉ nhận bài tập, tài liệu, lịch học, lịch thi, deadline, đề trắc nghiệm của môn mình học và điểm nhập tay của chính mình;
giáo viên/Admin nhận đầy đủ; dữ liệu lưu không bị lọc mất khi giáo viên tải rồi ghi ngược."""
import http.client, json, os, shutil, sqlite3, subprocess, sys, tempfile, time
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
D = tempfile.mkdtemp(); ENV = dict(os.environ, STUDYTASK_DATA=D, STUDYTASK_PORT='8797')
subprocess.run([sys.executable, API, 'create-user', 'ad01', 'adminpass1', 'admin', 'AD'], env=ENV, check=True, capture_output=True)
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
ok = True


def req(m, p, b=None, ck=''):
    c = http.client.HTTPConnection('127.0.0.1', 8797, timeout=5)
    c.request(m, p, json.dumps(b) if b is not None else None, {'Content-Type': 'application/json', 'Cookie': ck})
    r = c.getresponse(); sc = r.getheader('Set-Cookie'); raw = r.read().decode()
    try: js = json.loads(raw) if raw else {}
    except ValueError: js = {}
    return r.status, js, (sc.split(';')[0] if sc and 'st_session=' in sc else '')


def wait_ready(seconds=15):
    end = time.time() + seconds
    while time.time() < end:
        if srv.poll() is not None:
            print('FAIL API thoát ngay khi khởi động (mã %s), có thể trùng cổng 8797' % srv.returncode); shutil.rmtree(D, ignore_errors=True); sys.exit(1)
        try:
            if req('GET', '/api/auth/me')[0] == 200: return
        except OSError:
            pass
        time.sleep(0.2)
    srv.terminate(); shutil.rmtree(D, ignore_errors=True); print('FAIL API không sẵn sàng sau %d giây' % seconds); sys.exit(1)


def chk(n, c):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + n)


def login(u, pw='matkhau123'):
    return req('POST', '/api/auth/login', {'username': u, 'password': pw})[2]


def shared(ck):
    return req('GET', '/api/doc/sharedData/global', ck=ck)[1].get('data') or {}


ids = lambda lst: sorted(x['id'] for x in lst)
try:
    wait_ready()
    ad = login('ad01', 'adminpass1')
    mku = lambda u, role, subs: req('POST', '/api/admin/users', {'username': u, 'password': 'matkhau123', 'profile': {'name': u, 'role': role, 'subjectIds': subs}}, ad)[1].get('uid')
    uid = {u: mku(u, role, subs) for u, role, subs in (('gv01', 'teacher', [1]), ('sv1', 'student', [1]), ('sv2', 'student', [2]),
                                                      ('sv12', 'student', [1, 2]), ('sv0', 'student', []), ('svold', 'student', [1]))}
    # svold: hồ sơ cũ chưa có subjectIds (ghi đè không merge để bỏ khóa này)
    old = req('GET', f'/api/doc/user/{uid["svold"]}', ck=ad)[1]['data']; old.pop('subjectIds')
    req('PUT', f'/api/doc/user/{uid["svold"]}', {'data': old, 'merge': False}, ad)
    s1, s2, s12, s0, sold, gv = (login(u) for u in ('sv1', 'sv2', 'sv12', 'sv0', 'svold', 'gv01'))

    full = {'subjects': [{'id': 1, 'name': 'Toan'}, {'id': 2, 'name': 'Ly'}],
            'deadlines': [{'id': 11, 'subjectId': 1}, {'id': 12, 'subjectId': 2}, {'id': 13}],
            'homeworks': [{'id': 21, 'subjectId': 1}, {'id': 22, 'subjectId': 2}],
            'materials': [{'id': 31, 'subjectId': 1}, {'id': 32, 'subjectId': 2}],
            'schedule': [{'id': 41, 'subjectId': 1}, {'id': 42, 'subjectId': 2}],
            'exams': [{'id': 51, 'subjectId': 1}, {'id': 52, 'subjectId': 2}],
            'news': [{'id': 61}], 'forms': [{'id': 71}],
            'grades': {uid['sv1']: {'1': {'att': 9}}, uid['sv2']: {'2': {'att': 5}}}}
    chk('Admin ghi dữ liệu dùng chung nhiều môn → 200', req('PUT', '/api/doc/sharedData/global', {'data': full}, ad)[0] == 200)

    d = shared(s1)
    chk('sinh viên môn 1 chỉ nhận bài tập, tài liệu, lịch học, lịch thi, deadline của môn 1 (mục chung không có subjectId được giữ)',
        ids(d['deadlines']) == [11, 13] and ids(d['homeworks']) == [21] and ids(d['materials']) == [31] and ids(d['schedule']) == [41] and ids(d['exams']) == [51])
    chk('danh mục chung (subjects, news, forms) giữ nguyên', ids(d['subjects']) == [1, 2] and ids(d['news']) == [61] and ids(d['forms']) == [71])
    chk('điểm nhập tay chỉ còn của chính mình, không thấy điểm sinh viên khác', list(d['grades']) == [uid['sv1']] and uid['sv2'] not in json.dumps(d))
    chk('sinh viên môn 2 chỉ nhận dữ liệu môn 2', ids(shared(s2)['homeworks']) == [22] and ids(shared(s2)['deadlines']) == [12, 13])
    chk('sinh viên học môn 1 và 2 nhận cả hai', ids(shared(s12)['homeworks']) == [21, 22] and ids(shared(s12)['exams']) == [51, 52])
    d0 = shared(s0)
    chk('sinh viên chưa được gán môn nào chỉ nhận mục chung', d0['homeworks'] == [] and d0['materials'] == [] and ids(d0['deadlines']) == [13] and d0['grades'] == {})
    dold = shared(sold)
    chk('hồ sơ cũ chưa có subjectIds được coi là học mọi môn (giống app.js), điểm vẫn chỉ của mình',
        ids(dold['homeworks']) == [21, 22] and dold['grades'] == {})
    raw_list = json.dumps(req('GET', '/api/doc/sharedData', ck=s1)[1])
    chk('danh sách /api/doc/sharedData cũng được lọc như đọc từng tài liệu', '"id": 22' not in raw_list and '"id": 21' in raw_list and uid['sv2'] not in raw_list)

    # giáo viên/Admin nhận đầy đủ và ghi ngược không làm mất dữ liệu của môn khác
    dg = shared(gv)
    chk('giáo viên nhận đầy đủ (kể cả môn không dạy) vì giao diện ghi ngược cả danh sách', ids(dg['homeworks']) == [21, 22] and len(dg['grades']) == 2)
    chk('giáo viên tải rồi ghi ngược dữ liệu như giao diện → 200', req('PUT', '/api/doc/sharedData/global', {'data': {'homeworks': dg['homeworks'], 'grades': dg['grades']}}, gv)[0] == 200)
    stored = json.loads(sqlite3.connect(os.path.join(D, 'studytask.db')).execute("SELECT data FROM docs WHERE col='sharedData' AND id='global'").fetchone()[0])
    chk('dữ liệu lưu trong CSDL còn nguyên (chỉ bản trả về bị lọc)', ids(stored['homeworks']) == [21, 22] and len(stored['grades']) == 2 and ids(stored['materials']) == [31, 32])
    chk('Admin thấy đầy đủ', ids(shared(ad)['materials']) == [31, 32])

    # đổi môn có hiệu lực ngay; sinh viên không ghi được
    req('PUT', f'/api/doc/user/{uid["sv1"]}', {'data': {'subjectIds': [1, 2]}}, ad)
    chk('Admin gán thêm môn 2 cho sinh viên → thấy ngay dữ liệu môn 2', ids(shared(s1)['homeworks']) == [21, 22])
    chk('sinh viên ghi sharedData → 403', req('PUT', '/api/doc/sharedData/global', {'data': {'homeworks': []}}, s1)[0] == 403)
    chk('chưa đăng nhập đọc sharedData → bị từ chối', req('GET', '/api/doc/sharedData/global')[0] in (401, 403))
finally:
    srv.terminate(); srv.wait(5); shutil.rmtree(D, ignore_errors=True)
print('KẾT QUẢ:', 'ĐẠT' if ok else 'CÓ LỖI'); sys.exit(0 if ok else 1)
