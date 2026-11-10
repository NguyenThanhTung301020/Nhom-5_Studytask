#!/usr/bin/env python3
"""V3 – Trắc nghiệm: đề không lộ đáp án, khóa đáp án riêng, máy chủ chấm và ghi điểm (API tạm, cổng 8795, dữ liệu tạm).
Các ca chuyển từ docs/thiet-ke/05-trac-nghiem-tach-dap-an-cham-diem-may-chu.md mục 6 (RULE-xx → quyền đọc/ghi, API-xx → nộp bài)."""
import http.client, json, os, shutil, sqlite3, subprocess, sys, tempfile, time
HERE = os.path.dirname(os.path.abspath(__file__))
API = os.path.join(HERE, '..', '..', 'server', 'studytask_api.py')
D = tempfile.mkdtemp(); ENV = dict(os.environ, STUDYTASK_DATA=D, STUDYTASK_PORT='8795')
subprocess.run([sys.executable, API, 'create-user', 'ad01', 'adminpass1', 'admin', 'AD'], env=ENV, check=True, capture_output=True)
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)


def wait_ready(port=8795, seconds=15):
    """Chờ API trả lời thật (GET /api/auth/me = 200) thay vì đoán bằng sleep; thoát với lỗi rõ ràng nếu API không lên."""
    end = time.time() + seconds
    while time.time() < end:
        if srv.poll() is not None:
            print('FAIL API thoát ngay khi khởi động (mã %s), có thể trùng cổng %d' % (srv.returncode, port)); shutil.rmtree(D, ignore_errors=True); sys.exit(1)
        try:
            c = http.client.HTTPConnection('127.0.0.1', port, timeout=1); c.request('GET', '/api/auth/me')
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
    c = http.client.HTTPConnection('127.0.0.1', 8795, timeout=5)
    c.request(m, p, json.dumps(b) if b is not None else None, {'Content-Type': 'application/json', 'Cookie': ck})
    r = c.getresponse(); sc = r.getheader('Set-Cookie'); raw = r.read().decode()
    try: js = json.loads(raw) if raw else {}
    except ValueError: js = {}
    return r.status, js, raw, (sc.split(';')[0] if sc and 'st_session=' in sc else '')


def chk(n, c):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + n)


def login(u, pw):
    return req('POST', '/api/auth/login', {'username': u, 'password': pw})[3]


def shared(ck):
    st, js, raw, _ = req('GET', '/api/doc/sharedData/global', ck=ck)
    return st, (js.get('data') or {}), raw


def put_quizzes(ck, quizzes):
    return req('PUT', '/api/doc/sharedData/global', {'data': {'quizzes': quizzes}}, ck)[0]


def quiz(qid, subject, status='draft', due='2099-12-31', title=None):
    return {'id': qid, 'subjectId': subject, 'title': title or f'De {qid}', 'description': '', 'dueDate': due, 'status': status,
            'createdAt': '2026-11-09T00:00:00Z', 'questions': [
                {'id': 1, 'text': 'Cau 1', 'type': 'single', 'answers': [{'id': a, 'text': a.upper(), 'correct': a == 'b'} for a in 'abcd']},
                {'id': 2, 'text': 'Cau 2', 'type': 'multiple', 'answers': [{'id': a, 'text': a.upper(), 'correct': a in 'bc'} for a in 'abcd']},
                {'id': 3, 'text': 'Cau 3', 'type': 'single', 'answers': [{'id': a, 'text': a.upper(), 'correct': a == 'd'} for a in 'abcd']}]}


def db_rows(sql, *a):
    c = sqlite3.connect(os.path.join(D, 'studytask.db')); c.execute('PRAGMA busy_timeout=3000')
    try: return c.execute(sql, a).fetchall()
    finally: c.close()


def submit(ck, qid, answers, extra=None):
    return req('POST', f'/api/quiz/{qid}/submit', {'answers': answers, **(extra or {})}, ck)


try:
    ad = login('ad01', 'adminpass1')
    mku = lambda u, role, subs: req('POST', '/api/admin/users', {'username': u, 'password': 'matkhau123', 'profile': {'name': u, 'role': role, 'subjectIds': subs}}, ad)
    for u, role, subs in (('gv01', 'teacher', [1]), ('gv02', 'teacher', [2]), ('sv01', 'student', [1]), ('sv02', 'student', [2]), ('sv03', 'student', [1])):
        mku(u, role, subs)
    gv1, gv2, s1, s2, s3 = (login(u, 'matkhau123') for u in ('gv01', 'gv02', 'sv01', 'sv02', 'sv03'))
    uid1 = req('GET', '/api/auth/me', ck=s1)[1]['user']['uid']

    # ── tạo đề: chỉ bản nháp, đúng môn ──
    chk('RULE-07 giáo viên tạo đề mới ở trạng thái active → 403', put_quizzes(gv1, [quiz(1, 1, 'active')]) == 403)
    chk('RULE-05 giáo viên môn khác tạo đề cho môn không được phân công → 403', put_quizzes(gv2, [quiz(1, 1, 'draft')]) == 403)
    chk('sinh viên ghi sharedData → 403 (RULE-04)', put_quizzes(s1, [quiz(1, 1, 'draft')]) == 403)
    chk('đề không có câu hỏi → 400',
        put_quizzes(gv1, [{**quiz(9, 1), 'questions': []}]) == 400)
    chk('giáo viên đúng môn tạo đề nháp → 200', put_quizzes(gv1, [quiz(1, 1, 'draft')]) == 200)
    st, d, raw = shared(gv1)
    chk('giáo viên dạy môn thấy đáp án đúng khi sửa đề (RULE-02)', '"correct": true' in raw and d['quizzes'][0]['questions'][0]['answers'][1]['correct'] is True)
    chk('khóa đáp án lưu riêng, đề lưu trong sharedData không còn `correct`',
        len(db_rows("SELECT 1 FROM docs WHERE col='quizKeys' AND id='1'")) == 1 and '"correct"' not in db_rows("SELECT data FROM docs WHERE col='sharedData' AND id='global'")[0][0])
    chk('RULE-08 sinh viên không thấy đề nháp', shared(s1)[1].get('quizzes') == [])
    chk('giáo viên môn khác không thấy đề nháp', shared(gv2)[1].get('quizzes') == [])

    # ── mở đề: cần khóa đủ ──
    bad = quiz(1, 1, 'active'); bad['questions'][0]['answers'][1]['correct'] = False
    chk('mở đề khi một câu chưa có đáp án đúng → 400', put_quizzes(gv1, [bad]) == 400)
    chk('RULE-06 đổi môn của đề → 403', put_quizzes(gv1, [quiz(1, 2, 'draft')]) == 403)
    chk('giáo viên mở đề (draft → active) → 200', put_quizzes(gv1, [quiz(1, 1, 'active')]) == 200)

    # ── đọc: không lộ khóa ──
    st, d, raw = shared(s1)
    chk('RULE-01 sinh viên thuộc môn thấy đề đang mở, không có `correct` trong dữ liệu trả về', st == 200 and len(d['quizzes']) == 1 and '"correct"' not in raw)
    chk('sinh viên môn khác không thấy đề', shared(s2)[1].get('quizzes') == [])
    st, d, raw = shared(gv2)
    chk('RULE-03 giáo viên môn khác thấy đề nhưng không có đáp án đúng', len(d['quizzes']) == 1 and '"correct"' not in raw)
    chk('Admin thấy đáp án đúng', '"correct": true' in shared(ad)[2])
    list_raw = req('GET', '/api/doc/sharedData', ck=s1)[2]
    chk('danh sách /api/doc/sharedData cũng không có `correct` với sinh viên', '"correct"' not in list_raw)
    chk('sinh viên đọc trực tiếp quizKeys → 403', req('GET', '/api/doc/quizKeys/1', ck=s1)[0] == 403)
    chk('sinh viên liệt kê quizKeys → rỗng', req('GET', '/api/doc/quizKeys', ck=s1)[1].get('docs') == [])
    chk('giáo viên đọc trực tiếp quizKeys qua /api/doc → 403 (chỉ đi qua đề)', req('GET', '/api/doc/quizKeys/1', ck=gv1)[0] == 403)
    chk('sinh viên ghi quizKeys → 403', req('PUT', '/api/doc/quizKeys/1', {'data': {'correctAnswers': {'1': ['a']}}}, s1)[0] == 403)
    chk('RULE-13 sinh viên tạo quizResults → 403', req('PUT', f'/api/doc/quizResults/1_{uid1}', {'data': {'uid': uid1, 'score': 10}}, s1)[0] == 403)

    # ── đề đã mở bất biến; người không có quyền không sửa được đề của người khác ──
    edited = quiz(1, 1, 'active', title='Doi ten');
    chk('RULE-10 sửa nội dung đề đang mở → 403', put_quizzes(gv1, [edited]) == 403)
    flip = quiz(1, 1, 'active'); flip['questions'][0]['answers'][0]['correct'] = True
    chk('đổi đáp án đúng của đề đang mở → 403', put_quizzes(gv1, [flip]) == 403)
    chk('đề đang mở chuyển về nháp → 403', put_quizzes(gv1, [quiz(1, 1, 'draft')]) == 403)
    chk('RULE-12 xóa đề đang mở → 403', put_quizzes(gv1, []) == 403)
    chk('ghi đè không merge bỏ mất danh sách đề → 403', req('PUT', '/api/doc/sharedData/global', {'data': {'subjects': []}, 'merge': False}, gv1)[0] == 403)
    chk('xóa tài liệu sharedData/global → 403', req('DELETE', '/api/doc/sharedData/global', ck=ad)[0] == 403)
    proj = shared(gv2)[1]['quizzes']
    key_before = db_rows("SELECT data FROM docs WHERE col='quizKeys' AND id='1'")
    chk('giáo viên môn khác gửi lại đúng bản đã thấy (tải rồi ghi ngược như giao diện) → 200, khóa không đổi',
        put_quizzes(gv2, proj) == 200 and db_rows("SELECT data FROM docs WHERE col='quizKeys' AND id='1'") == key_before)
    chk('giáo viên môn khác sửa đề của môn không dạy → 403', put_quizzes(gv2, [{**proj[0], 'title': 'Hack'}]) == 403)
    chk('giáo viên môn khác xóa đề không thuộc môn mình → 403', put_quizzes(gv2, []) == 403)
    chk('giáo viên môn khác thêm lại `correct` giả vào đề môn khác → 403',
        put_quizzes(gv2, [{**proj[0], 'questions': [{**q, 'answers': [{**a, 'correct': True} for a in q['answers']]} for q in proj[0]['questions']]}]) == 403)

    # ── nộp bài: kiểm tra đầu vào ──
    A_OK = {'1': 'b', '2': ['b', 'c'], '3': 'd'}
    chk('API-01 chưa đăng nhập nộp bài → 401', req('POST', '/api/quiz/1/submit', {'answers': A_OK})[0] == 401)
    chk('API-02 giáo viên nộp bài → 403', submit(gv1, 1, A_OK)[0] == 403)
    chk('API-03 sinh viên không học môn nộp đề môn khác → 404', submit(s2, 1, A_OK)[0] == 404)
    chk('nộp đề không tồn tại → 404', submit(s1, 999, A_OK)[0] == 404)
    put_quizzes(gv1, [quiz(1, 1, 'active'), quiz(2, 1, 'draft')])
    chk('nộp đề còn ở bản nháp → 404', submit(s1, 2, A_OK)[0] == 404)
    put_quizzes(gv1, [quiz(1, 1, 'active'), quiz(3, 1, 'draft', due='2020-01-01')])
    put_quizzes(gv1, [quiz(1, 1, 'active'), quiz(3, 1, 'active', due='2020-01-01')])
    chk('API-05 nộp sau dueDate → 400', submit(s1, 3, A_OK)[0] == 400)
    put_quizzes(gv1, [quiz(1, 1, 'active'), quiz(3, 1, 'active', due='2020-01-01'), quiz(4, 1, 'draft')])
    put_quizzes(gv1, [quiz(1, 1, 'active'), quiz(3, 1, 'active', due='2020-01-01'), quiz(4, 1, 'active')])
    chk('đề đang mở chuyển sang đã đóng → 200', put_quizzes(gv1, [quiz(1, 1, 'active'), quiz(3, 1, 'active', due='2020-01-01'), quiz(4, 1, 'closed')]) == 200)
    chk('API-04 nộp đề đã đóng → 400', submit(s1, 4, A_OK)[0] == 400)
    chk('đề đã đóng không mở lại được → 403', put_quizzes(gv1, [quiz(1, 1, 'active'), quiz(3, 1, 'active', due='2020-01-01'), quiz(4, 1, 'active')]) == 403)
    chk('sinh viên môn học vẫn đọc được đề đã đóng (RULE-09), không có đáp án', '"correct"' not in shared(s1)[2] and len(shared(s1)[1]['quizzes']) == 3)
    put_quizzes(gv1, [quiz(1, 1, 'active'), quiz(3, 1, 'active', due='2020-01-01'), quiz(4, 1, 'closed'), quiz(5, 1, 'draft')])
    chk('RULE-18 xóa đề nháp → 200 và khóa của đề đó cũng bị xóa',
        put_quizzes(gv1, [quiz(1, 1, 'active'), quiz(3, 1, 'active', due='2020-01-01'), quiz(4, 1, 'closed')]) == 200
        and db_rows("SELECT 1 FROM docs WHERE col='quizKeys' AND id='5'") == [])
    n0 = len(db_rows("SELECT 1 FROM docs WHERE col='quizResults'"))
    chk('API-08 mã lựa chọn không tồn tại → 400', submit(s1, 1, {'1': 'z'})[0] == 400)
    chk('mã câu hỏi không tồn tại → 400', submit(s1, 1, {'99': 'a'})[0] == 400)
    chk('câu một lựa chọn chọn hai đáp án → 400', submit(s1, 1, {'1': ['a', 'b']})[0] == 400)
    chk('câu trả lời không phải đối tượng → 400', req('POST', '/api/quiz/1/submit', {'answers': 'abc'}, s1)[0] == 400)
    chk('các lần nộp lỗi không ghi kết quả', len(db_rows("SELECT 1 FROM docs WHERE col='quizResults'")) == n0)

    # ── chấm điểm ──
    st, r, raw, _ = submit(s1, 1, {'1': 'b', '3': ['d', ]}, {'score': 10, 'uid': 'ai-do-khac', 'subjectId': 2, 'correct': 3})
    chk('API-06 câu bỏ trống tính sai; bài vẫn được ghi (đúng 2/3 câu → 6.7)', st == 200 and r['correct'] == 2 and r['total'] == 3 and r['score'] == 6.7)
    chk('API-11 trường giả mạo score/uid/subjectId bị bỏ qua', r['score'] == 6.7
        and json.loads(db_rows("SELECT data FROM docs WHERE col='quizResults' AND id=?", f'1_{uid1}')[0][0])['uid'] == uid1
        and json.loads(db_rows("SELECT data FROM docs WHERE col='quizResults' AND id=?", f'1_{uid1}')[0][0])['subjectId'] == 1)
    chk('API-12 phản hồi chỉ có điểm và số câu đúng/tổng, không lộ khóa', set(r) == {'quizId', 'score', 'correct', 'total', 'submittedAt'} and 'answers' not in raw)
    st2, r2, _, _ = submit(s1, 1, A_OK)
    chk('API-10 nộp lần hai → 409', st2 == 409)
    chk('kết quả đầu tiên không bị thay đổi', req('GET', '/api/quiz/mine', ck=s1)[1]['results'][0]['score'] == 6.7)
    st, r, _, _ = submit(s3, 1, A_OK)
    chk('API-07 đáp án câu đơn gửi dạng chuỗi được chuẩn hóa; đúng hết → 10', st == 200 and r['score'] == 10.0 and r['correct'] == 3)
    uid3 = req('GET', '/api/auth/me', ck=s3)[1]['user']['uid']
    s4 = (mku('sv04', 'student', [1]), login('sv04', 'matkhau123'))[1]
    st, r, _, _ = submit(s4, 1, {'1': 'b', '2': ['b'], '3': 'd'})
    chk('câu nhiều lựa chọn thiếu một đáp án → tính sai (2/3 → 6.7)', st == 200 and r['correct'] == 2 and r['score'] == 6.7)
    s5 = (mku('sv05', 'student', [1]), login('sv05', 'matkhau123'))[1]
    st, r, _, _ = submit(s5, 1, {'1': 'b', '2': ['a', 'b', 'c'], '3': 'd'})
    chk('câu nhiều lựa chọn thừa một đáp án → tính sai', st == 200 and r['correct'] == 2)
    s6 = (mku('sv06', 'student', [1]), login('sv06', 'matkhau123'))[1]
    st, r, _, _ = submit(s6, 1, {})
    chk('nộp bài trắng → 0 điểm (câu bỏ trống tính sai kể cả khi có khóa)', st == 200 and r['score'] == 0 and r['correct'] == 0)
    s7 = (mku('sv07', 'student', [1]), login('sv07', 'matkhau123'))[1]
    st, r, _, _ = submit(s7, 1, {'1': 'b', '2': ['c', 'b', 'b'], '3': 'a'})
    chk('API-09 điểm làm tròn 1 chữ số theo công thức cũ (1 sai/3 → 6.7); thứ tự và trùng lặp lựa chọn được chuẩn hóa', st == 200 and r['score'] == 6.7)

    # ── điểm vào Bảng điểm / Báo cáo lớp và quyền xem kết quả ──
    ev = req('GET', f'/api/doc/activities/{uid1}', ck=s1)[1]['data']['events']
    chk('máy chủ ghi sự kiện điểm vào activities cho Bảng điểm (nguồn máy chủ)', any(e['type'] == 'quiz' and e['refId'] == 1 and e['score'] == 6.7 for e in ev))
    chk('giáo viên dạy môn xem kết quả của đề', len(req('GET', '/api/quiz/1/results', ck=gv1)[1].get('results', [])) >= 3)
    chk('RULE-16 giáo viên môn khác xem kết quả của đề → 403', req('GET', '/api/quiz/1/results', ck=gv2)[0] == 403)
    chk('sinh viên xem kết quả của cả đề → 403', req('GET', '/api/quiz/1/results', ck=s1)[0] == 403)
    chk('Admin xem kết quả của đề', req('GET', '/api/quiz/1/results', ck=ad)[0] == 200)
    mine3 = req('GET', '/api/quiz/mine', ck=s3)[1]['results']
    chk('RULE-14 /api/quiz/mine chỉ trả kết quả của chính mình', len(mine3) == 1 and mine3[0]['uid'] == uid3)
    chk('sinh viên đọc kết quả của người khác qua /api/doc → 403', req('GET', f'/api/doc/quizResults/1_{uid3}', ck=s1)[0] == 403)

    # ── xóa tài khoản: dọn kết quả trắc nghiệm của chính tài khoản đó, không đụng người khác ──
    before = {r[0] for r in db_rows("SELECT id FROM docs WHERE col='quizResults'")}
    chk('trước khi xóa: có kết quả của SV-3 và SV-1', f'1_{uid3}' in before and f'1_{uid1}' in before)
    chk('Admin xóa tài khoản SV-3 → 200', req('DELETE', f'/api/admin/users/{uid3}', ck=ad)[0] == 200)
    after = {r[0] for r in db_rows("SELECT id FROM docs WHERE col='quizResults'")}
    chk('xóa tài khoản dọn quizResults của chính tài khoản đó', f'1_{uid3}' not in after)
    chk('kết quả của tài khoản khác giữ nguyên', before - {f'1_{uid3}'} == after)
    chk('khóa đáp án và đề không bị đụng', len(db_rows("SELECT 1 FROM docs WHERE col='quizKeys' AND id='1'")) == 1 and len(shared(ad)[1]['quizzes']) == 3)
finally:
    srv.terminate(); srv.wait(5)

# ── di trú dữ liệu cũ (D05 mục 7): tách khóa, chuyển bài cũ, chạy một lần ──
os.environ['STUDYTASK_DATA'] = D2 = tempfile.mkdtemp()
sys.path.insert(0, os.path.join(HERE, '..', '..', 'server'))
try:
    import studytask_api as a
    c = a.db()
    c.execute("DELETE FROM docs WHERE col='meta' AND id='quiz_v3'")
    a.doc_put('sharedData', 'global', {'subjects': [{'id': 1}], 'quizzes': [quiz(7, 1, 'active')]})
    a.doc_put('activities', 'u-old', {'uid': 'u-old', 'events': [
        {'type': 'quiz', 'at': '2026-11-01', 'subjectId': 1, 'refId': 7, 'refTitle': 'x', 'score': 5.0, 'total': 3, 'correct': 1},
        {'type': 'quiz', 'at': '2026-11-02', 'subjectId': 1, 'refId': 7, 'refTitle': 'x', 'score': 8.0, 'total': 3, 'correct': 2}]})
    a.doc_put('userData', 'u-old2', {'submissions': [{'quizId': 7, 'userId': 'u-old2', 'answers': {'1': 'b'}, 'score': 3.3, 'correct': 1, 'total': 3, 'submittedAt': '2026-11-03T00:00:00Z'}]})
    a.migrate_quizzes(c)
    shared_doc = a.doc_get('sharedData', 'global')
    chk('di trú: đề trong sharedData không còn `correct`', '"correct"' not in json.dumps(shared_doc) and shared_doc['subjects'] == [{'id': 1}])
    chk('di trú: khóa đáp án được tách đúng', a.doc_get('quizKeys', '7')['correctAnswers'] == {'1': ['b'], '2': ['b', 'c'], '3': ['d']})
    r_old = a.doc_get('quizResults', '7_u-old'); r_old2 = a.doc_get('quizResults', '7_u-old2')
    chk('di trú: lấy sự kiện mới nhất, đánh dấu migrated, không chấm lại', r_old and r_old['score'] == 8.0 and r_old['migrated'] is True)
    chk('di trú: bài cũ trong userData giữ nguyên điểm và câu trả lời', r_old2 and r_old2['score'] == 3.3 and r_old2['answers'] == {'1': 'b'})
    a.doc_put('sharedData', 'global', {'quizzes': [quiz(8, 1, 'active')]})
    a.migrate_quizzes(c)
    chk('di trú chỉ chạy một lần (đánh dấu meta/quiz_v3)', a.doc_get('quizKeys', '8') is None and os.path.exists(os.path.join(D2, 'studytask.db.bak-pre-quiz-v3')))
except Exception as e:
    import traceback; traceback.print_exc(); chk('di trú chạy không lỗi: %r' % e, False)
finally:
    shutil.rmtree(D, ignore_errors=True)
print('KẾT QUẢ:', 'ĐẠT' if ok else 'CÓ LỖI'); sys.exit(0 if ok else 1)
