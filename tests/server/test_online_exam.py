#!/usr/bin/env python3
"""Thi trực tuyến ngay trên trang: lịch thi có `quizId`, mã truy cập do giám thị phát, vào phòng thi, nộp trong giờ
(API tạm, cổng 8804, dữ liệu tạm)."""
import http.client, json, os, shutil, subprocess, sys, tempfile, time
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
API = os.path.join(HERE, '..', '..', 'server', 'studytask_api.py')
PORT = 8804
D = tempfile.mkdtemp(); ENV = dict(os.environ, STUDYTASK_DATA=D, STUDYTASK_PORT=str(PORT))
subprocess.run([sys.executable, API, 'create-user', 'ad01', 'adminpass1', 'admin', 'AD'], env=ENV, check=True, capture_output=True)
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
VN = timezone(timedelta(hours=7))
ok = True


def wait_ready(seconds=15):
    end = time.time() + seconds
    while time.time() < end:
        if srv.poll() is not None:
            print('FAIL API thoát ngay khi khởi động'); shutil.rmtree(D, ignore_errors=True); sys.exit(1)
        try:
            c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=1); c.request('GET', '/api/auth/me')
            if c.getresponse().status == 200:
                return
        except OSError:
            pass
        time.sleep(0.2)
    srv.terminate(); shutil.rmtree(D, ignore_errors=True); print('FAIL API không sẵn sàng'); sys.exit(1)


def req(m, p, b=None, ck=''):
    c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=5)
    c.request(m, p, json.dumps(b) if b is not None else None, {'Content-Type': 'application/json', 'Cookie': ck})
    r = c.getresponse(); sc = r.getheader('Set-Cookie'); raw = r.read().decode()
    try: js = json.loads(raw) if raw else {}
    except ValueError: js = {}
    return r.status, js, raw, (sc.split(';')[0] if sc and 'st_session=' in sc else '')


def chk(n, c):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + n)


def login(u, pw='matkhau123'):
    return req('POST', '/api/auth/login', {'username': u, 'password': pw})[3]


def shared(ck):
    return (req('GET', '/api/doc/sharedData/global', ck=ck)[1].get('data') or {})


def put_shared(ck, data):
    return req('PUT', '/api/doc/sharedData/global', {'data': data}, ck)


def quiz(qid, subject, status='draft'):
    return {'id': qid, 'subjectId': subject, 'title': f'De thi {qid}', 'description': '', 'dueDate': '2099-12-31', 'status': status,
            'createdAt': '2026-11-09T00:00:00Z', 'questions': [
                {'id': 1, 'text': 'Cau 1', 'type': 'single', 'answers': [{'id': a, 'text': a.upper(), 'correct': a == 'b'} for a in 'abcd']},
                {'id': 2, 'text': 'Cau 2', 'type': 'single', 'answers': [{'id': a, 'text': a.upper(), 'correct': a == 'c'} for a in 'abcd']}]}


def exam(eid, subject, start_min, end_min, quiz_id=None, class_id='LOP1'):
    """Lịch thi bắt đầu sau `start_min` phút (âm = đã bắt đầu), kết thúc sau `end_min` phút, theo giờ Việt Nam."""
    now = datetime.now(VN)
    st, en = now + timedelta(minutes=start_min), now + timedelta(minutes=end_min)
    return {'id': eid, 'subjectId': subject, 'date': st.strftime('%Y-%m-%d'), 'start': st.strftime('%H:%M'), 'end': en.strftime('%H:%M'),
            'room': 'A1.101', 'teacher': 'GV', 'format': 'online', 'classId': class_id, 'className': class_id,
            **({'quizId': quiz_id} if quiz_id is not None else {})}


def ec(js):
    return (js.get('error') or {}).get('code')


def start(ck, eid, code=None):
    return req('POST', f'/api/exam/{eid}/start', {'code': code} if code is not None else {}, ck)


try:
    wait_ready()
    ad = login('ad01', 'adminpass1')
    for u, role, subs, cls in (('gv01', 'teacher', [1], None), ('gv02', 'teacher', [2], None), ('sv01', 'student', [1], 'LOP1'),
                               ('sv02', 'student', [1], 'LOP1'), ('sv03', 'student', [1], 'LOP2'), ('sv04', 'student', [2], 'LOP1')):
        prof = {'name': u, 'role': role, 'subjectIds': subs}
        uid = req('POST', '/api/admin/users', {'username': u, 'password': 'matkhau123', 'profile': prof}, ad)[1].get('uid')
        if cls:       # lớp học phần của sinh viên: ghi vào hồ sơ như script nạp dữ liệu
            req('PUT', f'/api/doc/user/{uid}', {'data': {'classId': cls, 'className': cls}}, ad)
    gv1, gv2, s1, s2, s3, s4 = (login(u) for u in ('gv01', 'gv02', 'sv01', 'sv02', 'sv03', 'sv04'))
    sv_uid = req('GET', '/api/auth/me', ck=s1)[1]['user']['uid']

    # ── tạo đề và lịch thi ──
    chk('giáo viên tạo đề nháp → 200', put_shared(gv1, {'quizzes': [quiz(1, 1)]})[0] == 200)
    chk('lịch thi gắn đề không tồn tại → 400', put_shared(gv1, {'exams': [exam(10, 1, -5, 60, quiz_id=99)]})[0] == 400)
    chk('lịch thi môn 1 gắn đề của môn khác → 400',
        put_shared(ad, {'quizzes': [quiz(1, 1), quiz(2, 2)], 'exams': [exam(10, 1, -5, 60, quiz_id=2)]})[0] == 400)
    chk('lịch thi gắn đúng đề cùng môn → 200', put_shared(gv1, {'exams': [exam(10, 1, -5, 60, quiz_id=1)]})[0] == 200)
    chk('mở đề (nháp → đang mở) → 200', put_shared(gv1, {'quizzes': [quiz(1, 1, 'active')]})[0] == 200)

    # ── đề thi không lộ câu hỏi ngoài phòng thi ──
    q = (shared(s1).get('quizzes') or [{}])[0]
    raw = json.dumps(shared(s1))
    chk('sinh viên chỉ thấy thông tin chung của đề thi, không có câu hỏi', q.get('examLocked') is True and q.get('questions') == [] and q.get('questionCount') == 2)
    chk('dữ liệu dùng chung không lộ đáp án cho sinh viên', '"correct"' not in raw and 'Cau 1' not in raw)
    tq = (shared(gv1).get('quizzes') or [{}])[0]
    chk('giáo viên dạy môn vẫn thấy đủ câu hỏi và đáp án đúng', len(tq.get('questions') or []) == 2 and tq['questions'][0]['answers'][1].get('correct') is True)
    chk('giáo viên sửa lại dữ liệu dùng chung (gửi lại bản mình thấy) không làm mất câu hỏi',
        put_shared(gv1, {'quizzes': shared(gv1)['quizzes']})[0] == 200 and len(shared(gv1)['quizzes'][0]['questions']) == 2)

    # ── nộp thẳng ngoài phòng thi bị chặn ──
    st, js, _, _ = req('POST', '/api/quiz/1/submit', {'answers': {'1': 'b', '2': 'c'}}, s1)
    chk('nộp đề thi khi chưa vào phòng thi → 403 exam-code-required', st == 403 and ec(js) == 'exam-code-required')

    # ── mã truy cập ──
    st, js, _, _ = start(s1, 10, 'ABCDEF')
    chk('chưa có mã mà vào phòng thi → 409 exam-no-code', st == 409 and ec(js) == 'exam-no-code')
    chk('sinh viên không đặt được mã → 403', req('POST', '/api/exam/10/code', {}, s1)[0] == 403)
    chk('giáo viên môn khác không đặt được mã → 403', req('POST', '/api/exam/10/code', {}, gv2)[0] == 403)
    chk('mã tự đặt không hợp lệ → 400', req('POST', '/api/exam/10/code', {'code': 'a b'}, gv1)[0] == 400)
    st, js, _, _ = req('POST', '/api/exam/10/code', {}, gv1)
    auto = js.get('code', '')
    chk('giáo viên phát mã tự sinh (6 ký tự) → 200', st == 200 and len(auto) == 6)
    st, js, _, _ = req('POST', '/api/exam/10/code', {'code': 'Thi2611'}, gv1)
    chk('giáo viên đặt mã riêng → 200', st == 200 and js.get('code') == 'Thi2611')
    chk('sinh viên không đọc được mã qua phòng thi → 403', req('GET', '/api/exam/10/room', ck=s1)[0] == 403)
    chk('mã không nằm trong dữ liệu dùng chung và không đọc được qua /api/doc',
        'Thi2611' not in json.dumps(shared(s1)) and 'Thi2611' not in json.dumps(shared(gv1))
        and req('GET', '/api/doc/examKeys/10', ck=ad)[0] == 403 and req('GET', '/api/doc/examSessions/10_x', ck=s1)[0] == 403)

    # ── vào phòng thi ──
    for _ in range(6):
        st, js, _, _ = start(s2, 10)
    chk('gửi mã trống (giao diện hỏi thử) → 403 exam-code-needed và không tính là nhập sai', st == 403 and ec(js) == 'exam-code-needed')
    st, js, _, _ = start(s1, 10, 'sai-ma')
    chk('mã sai → 403 exam-bad-code', st == 403 and ec(js) == 'exam-bad-code')
    chk('sinh viên khác lớp không vào được phòng thi của lớp này → 404', start(s3, 10, 'Thi2611')[0] == 404)
    chk('sinh viên không học môn này không vào được → 404', start(s4, 10, 'Thi2611')[0] == 404)
    chk('giáo viên không vào phòng thi để làm bài → 403', start(gv1, 10, 'Thi2611')[0] == 403)
    st, js, raw, _ = start(s1, 10, 'thi2611')        # mã không phân biệt hoa thường
    chk('nhập đúng mã (không phân biệt hoa thường) → nhận câu hỏi, không có đáp án đúng',
        st == 200 and len(js['quiz']['questions']) == 2 and '"correct"' not in raw and js.get('endsAt') and js.get('startedAt'))
    chk('tải lại trang: vào lại không cần mã (cùng tài khoản)', start(s1, 10)[0] == 200)
    chk('sinh viên chưa vào phòng thi vẫn không nộp được', req('POST', '/api/quiz/1/submit', {'answers': {'1': 'b'}}, s2)[0] == 403)
    st, js, _, _ = req('GET', '/api/exam/10/room', ck=gv1)
    chk('giáo viên thấy mã và danh sách sinh viên đã vào phòng thi', st == 200 and js.get('code') == 'Thi2611'
        and [x['username'] for x in js['students']] == ['sv01'] and js['students'][0]['submittedAt'] is None)

    # ── nộp bài ──
    st, js, _, _ = req('POST', '/api/quiz/1/submit', {'answers': {'1': 'b', '2': 'c'}}, s1)
    chk('nộp trong giờ thi → 200, máy chủ chấm 10 điểm', st == 200 and js.get('score') == 10 and js.get('correct') == 2)
    chk('nộp lần hai → 409', req('POST', '/api/quiz/1/submit', {'answers': {'1': 'b'}}, s1)[0] == 409)
    chk('vào lại sau khi nộp → 409 already-submitted', start(s1, 10)[0] == 409)
    js = req('GET', '/api/exam/10/room', ck=gv1)[1]
    chk('phòng thi ghi giờ nộp của sinh viên', js['students'][0]['submittedAt'] is not None)

    # ── giới hạn thử mã ──
    for _ in range(5):
        st, js, _, _ = start(s2, 10, 'x1234')
    chk('nhập sai mã 5 lần → 403 rồi khóa', st == 403)
    st, js, _, _ = start(s2, 10, 'Thi2611')
    chk('bị khóa thì mã đúng cũng bị từ chối → 429 exam-locked', st == 429 and ec(js) == 'exam-locked')

    # ── khung giờ thi ──
    put_shared(ad, {'exams': [exam(10, 1, -5, 60, quiz_id=1), exam(11, 1, 30, 90, quiz_id=1), exam(12, 1, -120, -30, quiz_id=1)]})
    req('POST', '/api/exam/11/code', {'code': 'SOM123'}, gv1); req('POST', '/api/exam/12/code', {'code': 'MUON12'}, gv1)
    st, js, _, _ = start(s2, 11, 'SOM123')
    chk('chưa đến giờ thi → 400 exam-not-started', st == 400 and ec(js) == 'exam-not-started')
    st, js, _, _ = start(s2, 12, 'MUON12')
    chk('đã hết giờ thi → 400 exam-ended', st == 400 and ec(js) == 'exam-ended')

    # ── đề thường (không gắn lịch thi) vẫn làm như cũ ──
    put_shared(ad, {'quizzes': [quiz(1, 1, 'active'), quiz(3, 1)]})
    put_shared(gv1, {'quizzes': [quiz(1, 1, 'active'), quiz(3, 1, 'active')]})
    sq = [x for x in shared(s2).get('quizzes') or [] if x['id'] == 3]
    chk('đề trắc nghiệm thường: sinh viên vẫn thấy câu hỏi và nộp bình thường',
        sq and len(sq[0]['questions']) == 2 and 'examLocked' not in sq[0] and req('POST', '/api/quiz/3/submit', {'answers': {'1': 'b'}}, s2)[0] == 200)

    # ── gỡ liên kết thì đề trở lại bình thường ──
    put_shared(ad, {'exams': []})
    chk('gỡ lịch thi: đề lại hiện câu hỏi như đề thường', [len(x['questions']) for x in shared(s3).get('quizzes') or [] if x['id'] == 1] == [2])
finally:
    srv.terminate(); shutil.rmtree(D, ignore_errors=True)
print('\nKẾT QUẢ: ' + ('ĐẠT' if ok else 'KHÔNG ĐẠT')); sys.exit(0 if ok else 1)
