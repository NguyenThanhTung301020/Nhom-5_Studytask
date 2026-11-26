#!/usr/bin/env python3
"""Dọn dữ liệu cũ (Quản trị › Dữ liệu cũ): chỉ Admin; chỉ xóa học phần ĐÃ KẾT THÚC cũ hơn khoảng hiển thị (settings/retention);
xem trước = đúng những gì bị xóa; phải gửi đúng tổng số mục (dữ liệu đổi thì từ chối); xóa trọn mọi dữ liệu đi kèm, giữ phần còn lại;
tệp tài liệu dùng chung không bị xóa; máy chủ lưu bản trích lục; trang đang mở ghi ngược bản cũ không làm sống lại học phần đã xóa.
API tạm, cổng 8812, dữ liệu tạm."""
import http.client, json, os, shutil, sqlite3, subprocess, sys, tempfile, time
from datetime import date

PORT = 8812
D = tempfile.mkdtemp(); ENV = dict(os.environ, STUDYTASK_DATA=D, STUDYTASK_PORT=str(PORT), PYTHONUTF8='1')
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
USERS = (('ad01', 'adminpass1', 'admin'), ('gv01', 'gvpass1234', 'teacher'), ('sv01', 'svpass1234', 'student'))
for u, pw, role in USERS:
    subprocess.run([sys.executable, API, 'create-user', u, pw, role, u], env=ENV, check=True, capture_output=True)

# Năm học theo ngày chạy kiểm thử: hiện tại C; khoảng hiển thị mặc định 3 năm → giữ từ C-2; cũ hơn là C-3, C-4
t = date.today(); C = t.year if t.month >= 8 else t.year - 1
nh = lambda y: f'{y}-{y + 1}'
con = sqlite3.connect(os.path.join(D, 'studytask.db')); con.isolation_level = None
uid = {u: con.execute('SELECT uid FROM accounts WHERE username=?', (u,)).fetchone()[0] for u, _, _ in USERS}
SV, GV = uid['sv01'], uid['gv01']


def put(col, id_, data):
    con.execute('INSERT OR REPLACE INTO docs VALUES (?,?,?)', (col, str(id_), json.dumps(data, ensure_ascii=False)))


def get(col, id_):
    r = con.execute('SELECT data FROM docs WHERE col=? AND id=?', (col, str(id_))).fetchone()
    return json.loads(r[0]) if r else None


S = lambda i, y, st: {'id': i, 'code': f'HP{i}', 'name': f'Học phần {i}', 'khoa': nh(y - 1)[:4] + '-' + str(y + 3), 'namHoc': nh(y), 'ky': 1, 'trangThai': st}
shared = {
    'subjects': [S(10, C - 4, 'da-ket-thuc'), S(11, C - 3, 'da-ket-thuc'), S(12, C - 3, 'dang-hoc'),
                 S(20, C - 1, 'da-ket-thuc'), S(30, C, 'dang-hoc')],
    'schedule': [{'id': 1, 'subjectId': 10, 'day': 2}, {'id': 2, 'subjectId': 11, 'day': 3}, {'id': 3, 'subjectId': 20, 'day': 4}],
    'exams': [{'id': 900, 'subjectId': 11, 'date': f'{C - 3}-12-20'}, {'id': 901, 'subjectId': 30, 'date': f'{C}-12-20'}],
    'quizzes': [{'id': 700, 'subjectId': 11, 'title': 'Đề cũ', 'dueDate': f'{C - 3}-11-01', 'status': 'closed',
                 'questions': [{'id': 1, 'text': 'Câu 1', 'type': 'single', 'answers': [{'id': 'a', 'text': 'A'}, {'id': 'b', 'text': 'B'}]}]}],
    'materials': [{'id': 1, 'subjectId': 11, 'title': 'Riêng', 'url': '/uploads/a_only.pdf'},
                  {'id': 2, 'subjectId': 11, 'title': 'Dùng chung', 'url': '/uploads/shared.pdf'},
                  {'id': 3, 'subjectId': 20, 'title': 'Dùng chung', 'url': '/uploads/shared.pdf'}],
    'homeworks': [{'id': 800, 'subjectId': 10, 'title': 'BT cũ', 'dueDate': f'{C - 4}-10-01'},
                  {'id': 801, 'subjectId': 30, 'title': 'BT mới', 'dueDate': f'{C}-10-01'}],
    'deadlines': [{'id': 1, 'subjectId': 10, 'title': 'DL cũ', 'dueDate': f'{C - 4}-10-01'},
                  {'id': 2, 'subjectId': 30, 'title': 'DL mới', 'dueDate': f'{C}-10-01'}],
    'news': [{'id': 1, 'title': 'Tin'}],
    'grades': {SV: {'10': {'gk': 7}, '30': {'gk': 8}}},
}
put('sharedData', 'global', shared)
put('quizKeys', 700, {'correctAnswers': {'1': ['a']}}); put('quizArchive', 700, {'x': 1})
put('quizResults', f'700_{SV}', {'uid': SV, 'quizId': 700, 'subjectId': 11, 'score': 10})
put('examKeys', 900, {'code': 'ABC'}); put('examSessions', f'900_{SV}', {'startedAt': 1}); put('examKeys', 901, {'code': 'XYZ'})
put('gradingPolicies', 11, {'preset': 'L1'}); put('gradingPolicies', 20, {'preset': 'L2'}); put('gradingColumns', 10, {'counted': {}})
put('activities', SV, {'uid': SV, 'events': [{'type': 'material', 'at': f'{C - 3}-10-01', 'subjectId': 11, 'refId': 1},
                                             {'type': 'material', 'at': f'{C}-10-01', 'subjectId': 30, 'refId': 9}]})
ud = get('userData', SV) or {}
put('userData', SV, {**ud, 'homeworkSubs': {'800': {'status': 'completed'}, '801': {'status': 'completed'}}})
gv = get('user', GV)
put('user', GV, {**gv, 'subjectIds': [11, 30], 'sections': [{'classId': 'A', 'subjectId': 11}, {'classId': 'A', 'subjectId': 30}]})
put('classes', 'A', {'id': 'A', 'sections': [{'subjectId': 11}, {'subjectId': 30}]})
put('tuition', SV, {'payments': []}); put('theses', 't1', {'title': 'KL'})
os.makedirs(os.path.join(D, 'uploads'), exist_ok=True)
for f in ('a_only.pdf', 'shared.pdf'):
    open(os.path.join(D, 'uploads', f), 'wb').write(b'%PDF-1.4')

srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)


def wait_ready(seconds=15):
    end = time.time() + seconds
    while time.time() < end:
        if srv.poll() is not None:
            print('FAIL API thoát ngay khi khởi động (mã %s), có thể trùng cổng %d' % (srv.returncode, PORT)); sys.exit(1)
        try:
            c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=1); c.request('GET', '/api/auth/me')
            if c.getresponse().status == 200:
                return
        except OSError:
            pass
        time.sleep(0.2)
    srv.terminate(); print('FAIL API không sẵn sàng sau %d giây' % seconds); sys.exit(1)


def req(m, p, b=None, ck=''):
    c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=10)
    c.request(m, p, json.dumps(b) if b is not None else None, {'Content-Type': 'application/json', 'Cookie': ck})
    r = c.getresponse(); sc = r.getheader('Set-Cookie'); raw = r.read()
    return r.status, (json.loads(raw) if raw else {}), (sc.split(';')[0] if sc and 'st_session=' in sc else '')


ok = True


def chk(n, c):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + n)


wait_ready()
try:
    ck = {u: req('POST', '/api/auth/login', {'username': u, 'password': pw})[2] for u, pw, _ in USERS}
    OLD = f'/api/admin/old-data?before={nh(C - 2)}'
    chk('chưa đăng nhập → 401', req('GET', OLD)[0] == 401)
    chk('giáo viên không xem/xóa được → 403', req('GET', OLD, ck=ck['gv01'])[0] == 403
        and req('POST', '/api/admin/old-data/purge', {'before': nh(C - 2), 'expect': 1}, ck['gv01'])[0] == 403)
    st, r, _ = req('GET', f'/api/admin/old-data?before={nh(C - 1)}', ck=ck['ad01'])
    chk('không cho xóa dữ liệu còn trong khoảng hiển thị 3 năm → 400', st == 400 and r['error']['code'] == 'too-recent')
    chk('năm học sai dạng → 400', req('GET', '/api/admin/old-data?before=abc', ck=ck['ad01'])[0] == 400)

    st, pv, _ = req('GET', OLD, ck=ck['ad01'])
    c = pv.get('counts', {})
    chk('xem trước: chỉ học phần ĐÃ KẾT THÚC cũ hơn khoảng hiển thị (10, 11; không 12 đang học, không 20)',
        st == 200 and sorted(s['id'] for s in pv['subjects']) == [10, 11])
    want = {'subjects': 2, 'schedule': 2, 'exams': 1, 'quizzes': 1, 'materials': 2, 'homeworks': 1, 'deadlines': 1, 'grades': 1,
            'quizKeys': 1, 'quizArchive': 1, 'quizResults': 1, 'examKeys': 1, 'examSessions': 1, 'gradingPolicies': 1,
            'gradingColumns': 1, 'activityEvents': 1, 'homeworkSubs': 1, 'accounts': 1}
    chk('xem trước đếm đúng từng loại dữ liệu đi kèm', c == want)
    st, ex, _ = req('GET', OLD + '&export=1', ck=ck['ad01'])
    chk('bản trích lục có đủ nội dung (học phần, đề, khóa đáp án, kết quả, điểm)',
        st == 200 and len(ex['subjects']) == 2 and ex['quizKeys'].get('700') and ex['quizResults'] and ex['grades'][SV] == {'10': {'gk': 7}})

    st, r, _ = req('POST', '/api/admin/old-data/purge', {'before': nh(C - 2), 'expect': pv['total'] - 1}, ck['ad01'])
    chk('tổng số mục không khớp (dữ liệu đã đổi) → 409, không xóa gì', st == 409 and get('quizKeys', 700) is not None)

    st, r, _ = req('POST', '/api/admin/old-data/purge', {'before': nh(C - 2), 'expect': pv['total']}, ck['ad01'])
    chk('xóa thành công', st == 200 and r.get('ok'))
    sh = get('sharedData', 'global')
    chk('học phần 10, 11 bị xóa; 12 (đang học), 20, 30 còn', sorted(s['id'] for s in sh['subjects']) == [12, 20, 30])
    chk('lịch học, lịch thi, đề, tài liệu, bài tập, deadline của học phần cũ bị xóa; phần còn lại giữ nguyên',
        [x['id'] for x in sh['schedule']] == [3] and [x['id'] for x in sh['exams']] == [901] and sh['quizzes'] == []
        and [x['id'] for x in sh['materials']] == [3] and [x['id'] for x in sh['homeworks']] == [801] and [x['id'] for x in sh['deadlines']] == [2]
        and sh['news'] == [{'id': 1, 'title': 'Tin'}])
    chk('cột điểm môn cũ bị xóa, môn đang học giữ', sh['grades'] == {SV: {'30': {'gk': 8}}})
    chk('khóa đáp án, bản lưu đề, kết quả, mã phòng thi, lượt vào phòng thi bị xóa',
        all(get(col, i) is None for col, i in (('quizKeys', 700), ('quizArchive', 700), ('quizResults', f'700_{SV}'),
                                                ('examKeys', 900), ('examSessions', f'900_{SV}'))) and get('examKeys', 901))
    chk('quy chế điểm / cột tính điểm của môn cũ bị xóa, môn khác giữ',
        get('gradingPolicies', 11) is None and get('gradingColumns', 10) is None and get('gradingPolicies', 20))
    chk('nhật ký và bài nộp của môn cũ bị xóa', [e['subjectId'] for e in get('activities', SV)['events']] == [30]
        and list(get('userData', SV)['homeworkSubs']) == ['801'])
    g = get('user', GV)
    chk('giáo viên chỉ bị gỡ phân công môn cũ, tài khoản còn', g['subjectIds'] == [30] and g['sections'] == [{'classId': 'A', 'subjectId': 30}]
        and con.execute('SELECT 1 FROM accounts WHERE uid=?', (GV,)).fetchone())
    chk('lớp chỉ bị gỡ học phần cũ', get('classes', 'A')['sections'] == [{'subjectId': 30}])
    chk('học phí, khóa luận không bị đụng tới', get('tuition', SV) == {'payments': []} and get('theses', 't1'))
    chk('tệp chỉ môn cũ dùng bị xóa, tệp dùng chung còn',
        not os.path.exists(os.path.join(D, 'uploads', 'a_only.pdf')) and os.path.exists(os.path.join(D, 'uploads', 'shared.pdf')))
    exp = os.path.join(D, 'exports', r.get('export', '-'))
    chk('máy chủ lưu bản trích lục trước khi xóa', os.path.isfile(exp) and len(json.load(open(exp, encoding='utf-8'))['subjects']) == 2)
    chk('có nhật ký dọn dữ liệu', (get('meta', 'purgeLog') or {}).get('items', [{}])[-1].get('by') == uid['ad01'])

    stale = dict(shared); stale.pop('grades')
    st, _, _ = req('PUT', '/api/doc/sharedData/global', {'data': {k: v for k, v in stale.items() if k != 'quizzes'}, 'merge': False}, ck['ad01'])
    sh = get('sharedData', 'global')
    chk('trang đang mở ghi ngược bản cũ: không làm sống lại học phần và dữ liệu đã xóa',
        st == 200 and 10 not in [s['id'] for s in sh['subjects']] and 11 not in [s['id'] for s in sh['subjects']]
        and all(x.get('subjectId') not in (10, 11) for k in ('schedule', 'exams', 'materials', 'homeworks', 'deadlines') for x in sh[k]))

    chk('giáo viên không đổi được khoảng hiển thị', req('PUT', '/api/doc/settings/retention', {'data': {'displayYears': 2}}, ck['gv01'])[0] == 403)
    chk('ai đăng nhập cũng đọc được khoảng hiển thị', req('PUT', '/api/doc/settings/retention', {'data': {'displayYears': 2}}, ck['ad01'])[0] == 200
        and req('GET', '/api/doc/settings/retention', ck=ck['sv01'])[1].get('data', {}).get('displayYears') == 2)
    st, pv2, _ = req('GET', f'/api/admin/old-data?before={nh(C - 1)}', ck=ck['ad01'])
    chk('khoảng hiển thị 2 năm → mốc giữ lại lùi được tới năm học C-1 (trước đó bị chặn); học phần C-1 vẫn còn hiển thị nên không bị xóa',
        st == 200 and pv2['subjects'] == [] and req('GET', f'/api/admin/old-data?before={nh(C)}', ck=ck['ad01'])[0] == 400)
finally:
    srv.terminate(); srv.wait(5); con.close(); shutil.rmtree(D, ignore_errors=True)
print('KẾT QUẢ: ' + ('ĐẠT' if ok else 'KHÔNG ĐẠT'))
sys.exit(0 if ok else 1)
