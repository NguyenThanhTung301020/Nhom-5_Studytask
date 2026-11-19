#!/usr/bin/env python3
"""GET /api/quiz/results là nguồn điểm chính thức của Bảng điểm và Báo cáo lớp (kiểm thử bổ sung tuần 7, sau PR58).
Các ca chưa có ở test_quiz_v3 / test_class_scope: chưa có quizResults nào, sinh viên chưa làm bài, nộp lại nhiều lần,
nhật ký activities bị sửa hoặc mất, và điểm trả cho giáo viên khớp với điểm sinh viên nhận (API tạm, cổng 8789, dữ liệu tạm)."""
import http.client, json, os, shutil, sqlite3, subprocess, sys, tempfile, time
HERE = os.path.dirname(os.path.abspath(__file__))
API = os.path.join(HERE, '..', '..', 'server', 'studytask_api.py')
D = tempfile.mkdtemp(); ENV = dict(os.environ, STUDYTASK_DATA=D, STUDYTASK_PORT='8789', PYTHONUTF8='1')
subprocess.run([sys.executable, API, 'create-user', 'ad01', 'adminpass1', 'admin', 'AD'], env=ENV, check=True, capture_output=True)
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)


def wait_ready(seconds=15):
    end = time.time() + seconds
    while time.time() < end:
        if srv.poll() is not None:
            print('FAIL API thoát ngay khi khởi động (mã %s), có thể trùng cổng 8789' % srv.returncode); shutil.rmtree(D, ignore_errors=True); sys.exit(1)
        try:
            c = http.client.HTTPConnection('127.0.0.1', 8789, timeout=1); c.request('GET', '/api/auth/me')
            if c.getresponse().status == 200:
                return
        except OSError:
            pass
        time.sleep(0.2)
    srv.terminate(); shutil.rmtree(D, ignore_errors=True)
    print('FAIL API không sẵn sàng sau %d giây' % seconds); sys.exit(1)


wait_ready()
ok = True


def req(m, p, b=None, ck=''):
    c = http.client.HTTPConnection('127.0.0.1', 8789, timeout=5)
    c.request(m, p, json.dumps(b) if b is not None else None, {'Content-Type': 'application/json', 'Cookie': ck})
    r = c.getresponse(); sc = r.getheader('Set-Cookie'); raw = r.read().decode()
    try: js = json.loads(raw) if raw else {}
    except ValueError: js = {}
    return r.status, js, (sc.split(';')[0] if sc and 'st_session=' in sc else '')


def chk(n, c):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + n)


def login(u, pw='matkhau123'):
    return req('POST', '/api/auth/login', {'username': u, 'password': pw})[2]


def db(sql, a=()):
    c = sqlite3.connect(os.path.join(D, 'studytask.db')); c.execute('PRAGMA busy_timeout=3000')
    try:
        r = c.execute(sql, a).fetchall(); c.commit(); return r
    finally: c.close()


def quiz(qid, subject, status):
    return {'id': qid, 'subjectId': subject, 'title': f'De {qid}', 'description': '', 'dueDate': '2099-12-31', 'status': status,
            'createdAt': '2026-11-19T00:00:00Z', 'questions': [
                {'id': 1, 'text': 'Cau 1', 'type': 'single', 'answers': [{'id': a, 'text': a.upper(), 'correct': a == 'b'} for a in 'abcd']},
                {'id': 2, 'text': 'Cau 2', 'type': 'single', 'answers': [{'id': a, 'text': a.upper(), 'correct': a == 'c'} for a in 'abcd']}]}


def results(ck):
    st, js, _ = req('GET', '/api/quiz/results', ck=ck)
    return st, js.get('results')


try:
    ad = login('ad01', 'adminpass1')
    for u, role, subs in (('gv01', 'teacher', [1]), ('gv02', 'teacher', [2]), ('sv01', 'student', [1]), ('sv02', 'student', [1])):
        req('POST', '/api/admin/users', {'username': u, 'password': 'matkhau123', 'profile': {'name': u, 'role': role, 'subjectIds': subs}}, ad)
    gv1, gv2, s1, s2 = (login(u) for u in ('gv01', 'gv02', 'sv01', 'sv02'))
    uid1 = req('GET', '/api/auth/me', ck=s1)[1]['user']['uid']
    uid2 = req('GET', '/api/auth/me', ck=s2)[1]['user']['uid']
    for status in ('draft', 'active'):
        req('PUT', '/api/doc/sharedData/global', {'data': {'quizzes': [quiz(1, 1, status)]}}, gv1)

    # ── chưa có quizResults nào ──
    chk('chưa ai nộp: Admin nhận 200 và danh sách rỗng', results(ad) == (200, []))
    chk('chưa ai nộp: giáo viên dạy môn nhận 200 và danh sách rỗng', results(gv1) == (200, []))

    # ── sinh viên đã nộp và sinh viên chưa làm ──
    st, sub, _ = req('POST', '/api/quiz/1/submit', {'answers': {'1': 'b', '2': 'a'}}, s1)
    chk('sv01 nộp bài đúng 1/2 → 200, 5 điểm', st == 200 and sub.get('score') == 5.0 and sub.get('correct') == 1)
    st, rs = results(gv1)
    chk('giáo viên thấy đúng một dòng của sv01', st == 200 and [(r['uid'], r['quizId']) for r in rs] == [(uid1, 1)])
    chk('sv02 chưa làm bài: không có dòng nào của sv02', all(r['uid'] != uid2 for r in rs))
    mine = req('GET', '/api/quiz/mine', ck=s1)[1]['results'][0]
    row = rs[0]
    chk('điểm giáo viên thấy khớp điểm sinh viên nhận (score, correct, total, submittedAt)',
        all(row[k] == mine[k] == (sub[k] if k in sub else mine[k]) for k in ('score', 'correct', 'total', 'submittedAt')))

    # ── nhiều lần làm bài ──
    st2 = req('POST', '/api/quiz/1/submit', {'answers': {'1': 'b', '2': 'c'}}, s1)[0]
    chk('sv01 nộp lại (lần 2, đúng hết) → 409', st2 == 409)
    rs2 = results(gv1)[1]
    chk('sau lần nộp 2 vẫn chỉ một dòng, điểm giữ nguyên 5 của lần đầu', len(rs2) == 1 and rs2[0]['score'] == 5.0 and rs2[0]['submittedAt'] == row['submittedAt'])

    # ── nhật ký activities không ảnh hưởng điểm chính thức ──
    db("UPDATE docs SET data=? WHERE col='activities' AND id=?", (json.dumps({'uid': uid1, 'events': [
        {'type': 'quiz', 'subjectId': 1, 'refId': 1, 'score': 10, 'total': 2, 'correct': 2},
        {'type': 'quiz', 'subjectId': 1, 'refId': 1, 'score': 9, 'total': 2, 'correct': 2}]}), uid1))
    db("INSERT OR REPLACE INTO docs VALUES ('activities', ?, ?)", (uid2, json.dumps({'uid': uid2, 'events': [
        {'type': 'quiz', 'subjectId': 1, 'refId': 1, 'score': 8, 'total': 2, 'correct': 2}]})))
    chk('nhật ký có sự kiện quiz 10, 9 (sv01) và 8 (sv02 chưa nộp): /quiz/results không đổi', results(gv1)[1] == rs2)
    db("DELETE FROM docs WHERE col='activities'")
    chk('nhật ký bị xóa hết: /quiz/results vẫn còn điểm sv01', results(gv1)[1] == rs2)

    # ── quyền xem điểm ──
    chk('giáo viên môn khác: 200, danh sách rỗng', results(gv2) == (200, []))
    chk('sinh viên xem điểm cả lớp → 403', results(s1)[0] == 403)
    chk('Admin thấy cùng dữ liệu với giáo viên dạy môn', results(ad)[1] == rs2)
finally:
    srv.terminate(); srv.wait(); shutil.rmtree(D, ignore_errors=True)

print('ĐẠT' if ok else 'CÓ CA KHÔNG ĐẠT')
sys.exit(0 if ok else 1)
