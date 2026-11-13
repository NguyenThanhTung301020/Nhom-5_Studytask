#!/usr/bin/env python3
"""Lọc theo lớp học phần (lớp + môn): cùng một môn mở ở nhiều lớp, nhiều giáo viên (API tạm, cổng 8801, dữ liệu tạm).
- Sinh viên chỉ thấy lịch học/lịch thi của lớp mình; hồ sơ cũ (chưa có classId) thấy theo môn như trước.
- Giáo viên đã phân theo lớp (`sections`) chỉ đọc nhật ký hoạt động và kết quả trắc nghiệm của sinh viên thuộc lớp học phần mình dạy,
  và không sửa/thêm được lịch của lớp khác dù cùng môn; giáo viên hồ sơ cũ (không có sections) giữ hành vi theo môn."""
import http.client, json, os, shutil, sqlite3, subprocess, sys, tempfile, time
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
PORT = 8801
D = tempfile.mkdtemp(); ENV = dict(os.environ, STUDYTASK_DATA=D, STUDYTASK_PORT=str(PORT))
ok, srv = True, None


def chk(n, c):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + n)


def mk(username, role):
    subprocess.run([sys.executable, API, 'create-user', username, 'matkhau123', role, username], env=ENV, check=True, capture_output=True)


def req(m, p, b=None, ck=''):
    c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=8)
    c.request(m, p, json.dumps(b) if b is not None else None, {'Content-Type': 'application/json', 'Cookie': ck})
    r = c.getresponse(); sc = r.getheader('Set-Cookie'); raw = r.read().decode()
    try: js = json.loads(raw) if raw else {}
    except ValueError: js = {}
    return r.status, js, (sc.split(';')[0] if sc and 'st_session=' in sc else '')


def login(u):
    return req('POST', '/api/auth/login', {'username': u, 'password': 'matkhau123'})[2]


ids = lambda lst: sorted(x['id'] for x in lst)
try:
    # ── dữ liệu: môn 1 mở ở 3 lớp (a1, b1, c1); môn 2 ở a1, b1 ──
    for u, r in (('ad01', 'admin'), ('gva', 'teacher'), ('gvb', 'teacher'), ('gvold', 'teacher'),
                 ('sva', 'student'), ('svb', 'student'), ('svc', 'student'), ('svold', 'student')):
        mk(u, r)
    con = sqlite3.connect(os.path.join(D, 'studytask.db'))
    uid = {n: con.execute('SELECT uid FROM accounts WHERE username=?', (n,)).fetchone()[0] for n in
           ('ad01', 'gva', 'gvb', 'gvold', 'sva', 'svb', 'svc', 'svold')}

    def patch(name, **kw):
        d = json.loads(con.execute("SELECT data FROM docs WHERE col='user' AND id=?", (uid[name],)).fetchone()[0]); d.update(kw)
        con.execute("UPDATE docs SET data=? WHERE col='user' AND id=?", (json.dumps(d), uid[name]))
    patch('gva', subjectIds=[1, 2], sections=[{'classId': 'a1', 'subjectId': 1}, {'classId': 'b1', 'subjectId': 1}, {'classId': 'a1', 'subjectId': 2}])
    patch('gvb', subjectIds=[1], sections=[{'classId': 'c1', 'subjectId': 1}])
    patch('gvold', subjectIds=[1])                                            # hồ sơ cũ: không có sections
    patch('sva', subjectIds=[1, 2], classId='a1', className='A1')
    patch('svb', subjectIds=[1, 2], classId='b1', className='B1')
    patch('svc', subjectIds=[1], classId='c1', className='C1')
    patch('svold', subjectIds=[1])                                            # hồ sơ cũ: không có classId
    sched = [{'id': 1, 'subjectId': 1, 'classId': 'a1', 'day': 2, 'start': '07:00', 'end': '09:00', 'room': 'R1'},
             {'id': 2, 'subjectId': 1, 'classId': 'b1', 'day': 3, 'start': '07:00', 'end': '09:00', 'room': 'R2'},
             {'id': 3, 'subjectId': 1, 'classId': 'c1', 'day': 4, 'start': '07:00', 'end': '09:00', 'room': 'R3'},
             {'id': 4, 'subjectId': 2, 'classId': 'a1', 'day': 5, 'start': '07:00', 'end': '09:00', 'room': 'R4'},
             {'id': 5, 'subjectId': 2, 'classId': 'b1', 'day': 6, 'start': '07:00', 'end': '09:00', 'room': 'R5'},
             {'id': 6, 'subjectId': 1, 'day': 7, 'start': '07:00', 'end': '09:00', 'room': 'CHUNG'}]       # mục chung của môn, không gắn lớp
    quiz = {'id': 900, 'subjectId': 1, 'title': 'Q', 'status': 'active', 'dueDate': '2099-01-01',
            'questions': [{'id': 1, 'type': 'single', 'text': 't', 'answers': [{'id': 'a', 'text': 'x'}, {'id': 'b', 'text': 'y'}]}]}
    shared = {'subjects': [{'id': 1, 'name': 'M1'}, {'id': 2, 'name': 'M2'}], 'schedule': sched,
              'exams': [{'id': 11, 'subjectId': 1, 'classId': 'a1', 'date': '2099-02-01', 'start': '07:00'},
                        {'id': 12, 'subjectId': 1, 'classId': 'c1', 'date': '2099-02-02', 'start': '07:00'}],
              'quizzes': [quiz]}
    con.execute("INSERT OR REPLACE INTO docs VALUES ('sharedData','global',?)", (json.dumps(shared),))
    con.execute("INSERT OR REPLACE INTO docs VALUES ('quizKeys','900',?)", (json.dumps({'quizId': 900, 'subjectId': 1, 'correctAnswers': {'1': ['a']}}),))
    for n in ('sva', 'svb', 'svc'):
        con.execute("INSERT INTO docs VALUES ('quizResults',?,?)", (f'900_{uid[n]}', json.dumps(
            {'uid': uid[n], 'quizId': 900, 'subjectId': 1, 'answers': {'1': ['a']}, 'score': 10, 'correct': 1, 'total': 1, 'submittedAt': '2026-11-12T00:00:00Z'})))
    con.commit(); con.close()

    srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
    for _ in range(60):
        try:
            if req('GET', '/api/auth/me')[0] == 200: break
        except OSError: time.sleep(0.2)
    ck = {n: login(n) for n in uid}
    view = lambda who: req('GET', '/api/doc/sharedData/global', ck=ck[who])[1]['data']

    # ── sinh viên ──
    chk('SV lớp a1 chỉ thấy lịch lớp a1 + mục chung', ids(view('sva')['schedule']) == [1, 4, 6])
    chk('SV lớp b1 chỉ thấy lịch lớp b1 + mục chung', ids(view('svb')['schedule']) == [2, 5, 6])
    chk('SV lớp c1 (chỉ học môn 1) chỉ thấy lịch lớp c1 + mục chung', ids(view('svc')['schedule']) == [3, 6])
    chk('lịch thi cũng lọc theo lớp', ids(view('sva')['exams']) == [11] and ids(view('svc')['exams']) == [12] and ids(view('svb')['exams']) == [])
    chk('SV hồ sơ cũ (không classId) thấy theo môn như trước', ids(view('svold')['schedule']) == [1, 2, 3, 6])
    chk('SV không nhận đáp án đúng', 'correct' not in json.dumps(view('sva')['quizzes']))

    # ── giáo viên: đọc nhật ký hoạt động theo lớp học phần ──
    act = lambda who, st: req('GET', f'/api/doc/activities/{uid[st]}', ck=ck[who])[0]
    chk('GV A đọc được nhật ký SV lớp a1 và b1 (môn 1 do GV A dạy ở cả hai lớp)', act('gva', 'sva') == 200 and act('gva', 'svb') == 200)
    chk('GV A KHÔNG đọc được nhật ký SV lớp c1 (cùng môn 1 nhưng lớp do GV B dạy)', act('gva', 'svc') == 403)
    chk('GV B chỉ đọc được SV lớp c1', act('gvb', 'svc') == 200 and act('gvb', 'sva') == 403 and act('gvb', 'svb') == 403)
    chk('GV hồ sơ cũ vẫn đọc theo môn (cả ba lớp)', all(act('gvold', s) == 200 for s in ('sva', 'svb', 'svc')))

    # ── giáo viên: kết quả trắc nghiệm theo lớp ──
    res = lambda who: req('GET', '/api/quiz/900/results', ck=ck[who])
    names = lambda who: sorted(d['username'] for d in res(who)[1].get('results', []))
    chk('GV A thấy kết quả của lớp a1 và b1', names('gva') == ['sva', 'svb'])
    chk('GV B chỉ thấy kết quả lớp c1', names('gvb') == ['svc'])
    chk('GV hồ sơ cũ và Admin thấy cả ba lớp', names('gvold') == ['sva', 'svb', 'svc'] and names('ad01') == ['sva', 'svb', 'svc'])

    # ── giáo viên: ghi lịch chỉ ở lớp mình dạy ──
    def put(who, schedule):
        return req('PUT', '/api/doc/sharedData/global', {'data': {'schedule': schedule}}, ck=ck[who])[0]
    cur = lambda: json.loads(sqlite3.connect(os.path.join(D, 'studytask.db')).execute("SELECT data FROM docs WHERE col='sharedData' AND id='global'").fetchone()[0])['schedule']
    mod = lambda lst, i, **kw: [{**x, **kw} if x['id'] == i else x for x in lst]
    chk('GV A sửa lịch lớp a1 của mình → được', put('gva', mod(cur(), 1, room='R1-moi')) == 200 and [x for x in cur() if x['id'] == 1][0]['room'] == 'R1-moi')
    chk('GV A sửa lịch lớp c1 (cùng môn, lớp GV B) → bị từ chối', put('gva', mod(cur(), 3, room='HACK')) == 403 and [x for x in cur() if x['id'] == 3][0]['room'] == 'R3')
    chk('GV A thêm lịch cho lớp c1 → bị từ chối', put('gva', cur() + [{'id': 77, 'subjectId': 1, 'classId': 'c1', 'day': 2, 'start': '10:00', 'end': '11:00'}]) == 403)
    chk('GV A xóa lịch lớp c1 → bị từ chối', put('gva', [x for x in cur() if x['id'] != 3]) == 403 and len(cur()) == 6)
    chk('GV A thêm lịch cho lớp a1 của mình → được', put('gva', cur() + [{'id': 78, 'subjectId': 1, 'classId': 'a1', 'day': 2, 'start': '10:00', 'end': '11:00'}]) == 200)
    chk('GV A thêm lịch cho môn không dạy (môn 3) vẫn bị từ chối như trước', put('gva', cur() + [{'id': 79, 'subjectId': 3, 'day': 2, 'start': '10:00', 'end': '11:00'}]) == 403)
    chk('Admin sửa lịch lớp bất kỳ → được', put('ad01', mod(cur(), 3, room='R3-admin')) == 200)
finally:
    if srv: srv.terminate(); srv.wait(5)
    shutil.rmtree(D, ignore_errors=True)
print('KẾT QUẢ:', 'ĐẠT' if ok else 'CÓ LỖI'); sys.exit(0 if ok else 1)
