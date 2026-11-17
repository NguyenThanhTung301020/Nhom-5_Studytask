#!/usr/bin/env python3
"""Mỗi học phần mở chỉ có từ 1 đến 3 giáo viên được cấp quyền: Admin không gán được người thứ 4 (API tạm, cổng 8803, dữ liệu tạm).
Chỉ xét học phần MỚI thêm vào hồ sơ; dữ liệu cũ đã vượt trần vẫn sửa được các trường khác; sinh viên không bị giới hạn."""
import http.client, json, os, shutil, sqlite3, subprocess, sys, tempfile, time
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
PORT = 8803
D = tempfile.mkdtemp(); ENV = dict(os.environ, STUDYTASK_DATA=D, STUDYTASK_PORT=str(PORT))
ok, srv = True, None


def chk(n, c):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + n)


def mk(u, role):
    subprocess.run([sys.executable, API, 'create-user', u, 'matkhau123', role, u], env=ENV, check=True, capture_output=True)


def req(m, p, b=None, ck=''):
    c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=8)
    c.request(m, p, json.dumps(b) if b is not None else None, {'Content-Type': 'application/json', 'Cookie': ck})
    r = c.getresponse(); sc = r.getheader('Set-Cookie'); raw = r.read().decode()
    try: js = json.loads(raw) if raw else {}
    except ValueError: js = {}
    return r.status, js, (sc.split(';')[0] if sc and 'st_session=' in sc else '')


try:
    names = ['ad01', 'gv1', 'gv2', 'gv3', 'gv4', 'gv5', 'old1', 'old2', 'old3', 'old4', 'sv1', 'sv2', 'sv3', 'sv4', 'sv5']
    for n in names:
        mk(n, 'admin' if n == 'ad01' else 'student' if n.startswith('sv') else 'teacher')
    con = sqlite3.connect(os.path.join(D, 'studytask.db'))
    uid = {n: con.execute('SELECT uid FROM accounts WHERE username=?', (n,)).fetchone()[0] for n in names}
    for n in ('old1', 'old2', 'old3', 'old4'):        # dữ liệu cũ đã vượt trần: 4 giáo viên cùng một học phần 500
        d = json.loads(con.execute("SELECT data FROM docs WHERE col='user' AND id=?", (uid[n],)).fetchone()[0]); d['subjectIds'] = [500]
        con.execute("UPDATE docs SET data=? WHERE col='user' AND id=?", (json.dumps(d), uid[n]))
    con.commit(); con.close()
    srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
    for _ in range(60):
        try:
            if req('GET', '/api/auth/me')[0] == 200: break
        except OSError: time.sleep(0.2)
    ck = req('POST', '/api/auth/login', {'username': 'ad01', 'password': 'matkhau123'})[2]
    put = lambda n, ids, **extra: req('PUT', f'/api/doc/user/{uid[n]}', {'data': {'subjectIds': ids, **extra}, 'merge': True}, ck)
    holders = lambda sid: sorted(n for n in names if n.startswith('g') and sid in json.loads(sqlite3.connect(os.path.join(D, 'studytask.db')).execute(
        "SELECT data FROM docs WHERE col='user' AND id=?", (uid[n],)).fetchone()[0]).get('subjectIds', []))

    chk('gán học phần 10 cho giáo viên thứ 1, 2, 3 → được', all(put(n, [10])[0] == 200 for n in ('gv1', 'gv2', 'gv3')))
    st, js, _ = put('gv4', [10])
    chk('gán cho giáo viên thứ 4 → bị từ chối 409 teacher-limit, thông báo rõ', st == 409 and js['error']['code'] == 'teacher-limit' and 'đủ 3 giáo viên' in js['error']['message'])
    chk('giáo viên thứ 4 không bị ghi gì (vẫn chưa có học phần)', holders(10) == ['gv1', 'gv2', 'gv3'])
    chk('giáo viên thứ 4 vẫn gán được học phần khác (11)', put('gv4', [11])[0] == 200)
    chk('giáo viên đã có học phần 10 sửa lại hồ sơ (cùng danh sách) → được, không tính trùng chính mình', put('gv1', [10])[0] == 200)
    chk('giáo viên đã có học phần 10 thêm học phần 12 → được', put('gv1', [10, 12])[0] == 200)
    chk('gỡ một giáo viên khỏi học phần 10 rồi gán người khác → được', put('gv3', [])[0] == 200 and put('gv5', [10])[0] == 200 and holders(10) == ['gv1', 'gv2', 'gv5'])
    chk('thêm cả học phần đầy (10) lẫn trống (13) cùng lúc cho người thứ 4 → từ chối, không ghi một nửa', put('gv4', [11, 10, 13])[0] == 409
        and 13 not in json.loads(sqlite3.connect(os.path.join(D, 'studytask.db')).execute("SELECT data FROM docs WHERE col='user' AND id=?", (uid['gv4'],)).fetchone()[0])['subjectIds'])
    # tạo tài khoản giáo viên mới kèm học phần đã đầy
    st, js, _ = req('POST', '/api/admin/users', {'username': 'gnew', 'password': 'matkhau123', 'profile': {'name': 'GV mới', 'role': 'teacher', 'subjectIds': [10]}}, ck)
    chk('tạo giáo viên mới kèm học phần đã đủ 3 giáo viên → từ chối và không tạo tài khoản', st == 409
        and not sqlite3.connect(os.path.join(D, 'studytask.db')).execute("SELECT 1 FROM accounts WHERE username='gnew'").fetchone())
    chk('tạo giáo viên mới kèm học phần còn chỗ → được', req('POST', '/api/admin/users', {'username': 'gnew2', 'password': 'matkhau123',
        'profile': {'name': 'GV mới', 'role': 'teacher', 'subjectIds': [20]}}, ck)[0] == 200)
    # dữ liệu cũ đã vượt trần
    chk('học phần 500 đã có 4 giáo viên từ trước: sửa tên/trường khác của họ vẫn được (không chặn dữ liệu cũ)', req('PUT', f'/api/doc/user/{uid["old1"]}',
        {'data': {'phone': '0901234567'}, 'merge': True}, ck)[0] == 200 and put('old2', [500])[0] == 200)
    chk('nhưng gán thêm người thứ 5 vào học phần 500 → từ chối', put('gv2', [10, 500])[0] == 409)
    # sinh viên không bị giới hạn
    chk('sinh viên: 5 người cùng học một học phần đều được gán (giới hạn chỉ áp cho giáo viên)', all(put(f'sv{i}', [10, 11])[0] == 200 for i in range(1, 6)))
finally:
    if srv: srv.terminate(); srv.wait(5)
    shutil.rmtree(D, ignore_errors=True)
print('KẾT QUẢ:', 'ĐẠT' if ok else 'CÓ LỖI'); sys.exit(0 if ok else 1)
