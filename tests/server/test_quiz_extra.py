#!/usr/bin/env python3
"""Trắc nghiệm mở rộng (API tạm, cổng 8798, dữ liệu tạm):
- câu điền khuyết (không phải chọn A/B/C/D): đáp án chấp nhận không lộ cho sinh viên, máy chủ chấm;
- bản lưu bất biến của đề lúc mở (giáo viên xem lại khi có khiếu nại sai đề) và kết quả kèm tên sinh viên;
- kho đề (quizBank): lưu riêng các bộ câu hỏi kèm đáp án để dùng lại, phân quyền theo môn."""
import http.client, json, os, shutil, sqlite3, subprocess, sys, tempfile, time, unicodedata
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
D = tempfile.mkdtemp(); ENV = dict(os.environ, STUDYTASK_DATA=D, STUDYTASK_PORT='8798')
subprocess.run([sys.executable, API, 'create-user', 'ad01', 'adminpass1', 'admin', 'AD'], env=ENV, check=True, capture_output=True)
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
ok = True


def req(m, p, b=None, ck=''):
    c = http.client.HTTPConnection('127.0.0.1', 8798, timeout=5)
    c.request(m, p, json.dumps(b) if b is not None else None, {'Content-Type': 'application/json', 'Cookie': ck})
    r = c.getresponse(); sc = r.getheader('Set-Cookie'); raw = r.read().decode()
    try: js = json.loads(raw) if raw else {}
    except ValueError: js = {}
    return r.status, js, raw, (sc.split(';')[0] if sc and 'st_session=' in sc else '')


def wait_ready(seconds=15):
    end = time.time() + seconds
    while time.time() < end:
        if srv.poll() is not None:
            print('FAIL API thoát ngay khi khởi động (mã %s), có thể trùng cổng 8798' % srv.returncode); shutil.rmtree(D, ignore_errors=True); sys.exit(1)
        try:
            if req('GET', '/api/auth/me')[0] == 200: return
        except OSError:
            pass
        time.sleep(0.2)
    srv.terminate(); shutil.rmtree(D, ignore_errors=True); print('FAIL API không sẵn sàng sau %d giây' % seconds); sys.exit(1)


def chk(n, c, extra=''):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + n + ('' if c else ' | ' + str(extra)))


def login(u, pw='matkhau123'):
    return req('POST', '/api/auth/login', {'username': u, 'password': pw})[3]


def shared(ck):
    st, js, raw, _ = req('GET', '/api/doc/sharedData/global', ck=ck)
    return st, (js.get('data') or {}), raw


def put_quizzes(ck, quizzes):
    return req('PUT', '/api/doc/sharedData/global', {'data': {'quizzes': quizzes}}, ck)[0]


def choice(i, text, ans, right, typ='single'):
    return {'id': i, 'text': text, 'type': typ, 'answers': [{'id': a, 'text': a.upper(), 'correct': a in right} for a in ans]}


def fill(i, text, accepted):
    return {'id': i, 'text': text, 'type': 'fill', 'blanks': len(accepted), 'answers': [], 'accepted': accepted}


def quiz(qid, subject, questions, status='draft', due='2099-12-31'):
    return {'id': qid, 'subjectId': subject, 'title': f'De {qid}', 'description': '', 'dueDate': due, 'status': status,
            'createdAt': '2026-11-10T00:00:00Z', 'questions': questions}


def db_rows(sql, *a):
    c = sqlite3.connect(os.path.join(D, 'studytask.db')); c.execute('PRAGMA busy_timeout=3000')
    try: return c.execute(sql, a).fetchall()
    finally: c.close()


def submit(ck, qid, answers):
    return req('POST', f'/api/quiz/{qid}/submit', {'answers': answers}, ck)


try:
    wait_ready()
    ad = login('ad01', 'adminpass1')
    mku = lambda u, role, subs: req('POST', '/api/admin/users', {'username': u, 'password': 'matkhau123', 'profile': {'name': 'Ten ' + u, 'role': role, 'subjectIds': subs}}, ad)
    for u, role, subs in (('gv01', 'teacher', [1]), ('gv02', 'teacher', [2]), ('gv03', 'teacher', [1]), ('sv01', 'student', [1]), ('sv02', 'student', [1]), ('sv03', 'student', [1])):
        mku(u, role, subs)
    gv1, gv2, gv3, s1, s2, s3 = (login(u) for u in ('gv01', 'gv02', 'gv03', 'sv01', 'sv02', 'sv03'))

    Q = [choice(1, 'Chon b', 'abcd', 'b'),
         fill(2, 'Thu do cua Viet Nam la ____', [['Hà Nội', 'Ha Noi', 'ha noi']]),
         fill(3, '__ cong __ bang bon', [['2', 'hai'], ['2', 'hai']])]

    # ── câu điền khuyết: hình thức và quyền ──
    chk('đề có câu điền khuyết tạo ở bản nháp → 200', put_quizzes(gv1, [quiz(1, 1, Q)]) == 200)
    st, d, raw = shared(gv1)
    q2 = d['quizzes'][0]['questions'][1]
    chk('giáo viên dạy môn nhận lại đáp án chấp nhận khi sửa đề', q2['accepted'] == [['Hà Nội', 'Ha Noi', 'ha noi']] and q2['blanks'] == 1)
    chk('khóa lưu riêng; đề lưu trong sharedData không còn `accepted`',
        'accepted' not in db_rows("SELECT data FROM docs WHERE col='sharedData' AND id='global'")[0][0]
        and 'Hà Nội' in db_rows("SELECT data FROM docs WHERE col='quizKeys' AND id='1'")[0][0])
    bad_blank = fill(9, 'x', [['a']]); bad_blank['blanks'] = 0
    chk('câu điền khuyết có 0 chỗ trống → 400', put_quizzes(gv1, [quiz(1, 1, Q), quiz(2, 1, [bad_blank])]) == 400)
    bad_blank['blanks'] = 11
    chk('câu điền khuyết có 11 chỗ trống → 400', put_quizzes(gv1, [quiz(1, 1, Q), quiz(2, 1, [bad_blank])]) == 400)
    with_answers = fill(9, 'x', [['a']]); with_answers['answers'] = [{'id': 'a', 'text': 'A'}]
    chk('câu điền khuyết kèm lựa chọn A/B/C/D → 400', put_quizzes(gv1, [quiz(1, 1, Q), quiz(2, 1, [with_answers])]) == 400)
    empty_acc = [choice(1, 'c', 'ab', 'a'), fill(2, 'chỗ trống', [['x'], []])]
    put_quizzes(gv1, [quiz(1, 1, Q), quiz(3, 1, empty_acc)])
    chk('mở đề khi một chỗ trống chưa có đáp án chấp nhận → 400', put_quizzes(gv1, [quiz(1, 1, Q), quiz(3, 1, empty_acc, 'active')]) == 400)
    put_quizzes(gv1, [quiz(1, 1, Q), quiz(3, 1, empty_acc)])
    chk('giáo viên xóa đề nháp thử → 200', put_quizzes(gv1, [quiz(1, 1, Q)]) == 200)
    chk('mở đề (nháp → đang mở) → 200', put_quizzes(gv1, [quiz(1, 1, Q, 'active')]) == 200)

    # ── sinh viên không thấy đáp án chấp nhận ──
    st, d, raw = shared(s1)
    chk('sinh viên nhận đề điền khuyết nhưng không có `accepted`, `correct`, hay đáp án', len(d['quizzes']) == 1 and 'accepted' not in raw
        and '"correct"' not in raw and 'Hà Nội' not in raw and 'Ha Noi' not in raw)
    chk('sinh viên vẫn thấy số chỗ trống để hiển thị ô nhập', d['quizzes'][0]['questions'][2]['blanks'] == 2)
    chk('giáo viên môn khác thấy đề nhưng không có đáp án chấp nhận', 'accepted' not in shared(gv2)[2] and 'Hà Nội' not in shared(gv2)[2])

    # ── chấm điểm câu điền khuyết ──
    st, r, raw, _ = submit(s1, 1, {'1': 'b', '2': '  hà   NỘI ', '3': ['hai', '2']})
    chk('điền khuyết: bỏ khoảng trắng thừa, không phân biệt hoa thường; nhiều chỗ trống đều đúng → 10 điểm', st == 200 and r['correct'] == 3 and r['score'] == 10.0)
    st, r, raw, _ = submit(s2, 1, {'1': 'b', '2': unicodedata.normalize('NFD', 'Hà Nội'), '3': ['2', '3']})
    chk('chuỗi có dấu dạng Unicode tổ hợp vẫn khớp; một chỗ trống sai → cả câu sai (2/3 → 6.7)', st == 200 and r['correct'] == 2 and r['score'] == 6.7)
    st, r, raw, _ = submit(s3, 1, {'1': 'b', '2': 'Ha Noi.', '3': ['2']})
    chk('dư dấu câu → sai; thiếu chỗ trống → sai (1/3 → 3.3)', st == 200 and r['correct'] == 1 and r['score'] == 3.3)
    mine = req('GET', '/api/quiz/mine', ck=s1)[1]['results'][0]
    chk('lưu lại chuỗi sinh viên đã gõ để đối chiếu khi khiếu nại', mine['answers']['2'] == ['hà   NỘI'], mine['answers'])
    mku('sv04', 'student', [1]); s4 = login('sv04')
    chk('điền khuyết: dấu tiếng Việt phải đúng (Ha Noi không dấu được giáo viên chấp nhận riêng; "Ha Nôi" sai)',
        submit(s4, 1, {'2': 'Hà Nôi'})[1]['correct'] == 0)
    for i, bad in enumerate((['a', 'b'], [1], ['x' * 201], {'a': 1}), 1):
        mku(f'svb{i}', 'student', [1])
        st = submit(login(f'svb{i}'), 1, {'2': bad})[0]
        chk(f'câu trả lời điền khuyết không hợp lệ #{i} → 400', st == 400)

    # ── bản lưu lúc mở đề (khiếu nại sai đề) ──
    st, a, raw, _ = req('GET', '/api/quiz/1/archive', ck=gv1)
    arc = a.get('archive') or {}
    chk('giáo viên dạy môn xem lại bản đề đã giao kèm đáp án', st == 200 and arc['quiz']['questions'][1]['accepted'] == [['Hà Nội', 'Ha Noi', 'ha noi']]
        and arc['quiz']['questions'][0]['answers'][1]['correct'] is True)
    chk('bản lưu ghi thời điểm mở và người mở', bool(arc.get('activatedAt')) and arc.get('activatedBy') and arc.get('activatedByName') == 'Ten gv01', arc)
    chk('Admin xem được bản lưu', req('GET', '/api/quiz/1/archive', ck=ad)[0] == 200)
    chk('giáo viên môn khác xem bản lưu → 403', req('GET', '/api/quiz/1/archive', ck=gv2)[0] == 403)
    chk('sinh viên xem bản lưu → 403', req('GET', '/api/quiz/1/archive', ck=s1)[0] == 403)
    chk('đọc trực tiếp quizArchive/quizBank qua /api/doc → 403', req('GET', '/api/doc/quizArchive/1', ck=gv1)[0] == 403 and req('GET', '/api/doc/quizBank', ck=gv1)[1].get('docs') == [])
    before = db_rows("SELECT data FROM docs WHERE col='quizArchive' AND id='1'")
    put_quizzes(gv1, [quiz(1, 1, Q, 'closed')])
    chk('đóng đề không làm thay đổi bản lưu', db_rows("SELECT data FROM docs WHERE col='quizArchive' AND id='1'") == before)
    c = sqlite3.connect(os.path.join(D, 'studytask.db')); c.execute("DELETE FROM docs WHERE col='quizArchive' AND id='1'"); c.commit(); c.close()
    st, a, raw, _ = req('GET', '/api/quiz/1/archive', ck=gv1)
    chk('đề mở trước khi có bản lưu: trả bản hiện tại (bất biến) kèm ghi chú', st == 200 and a['archive']['activatedAt'] is None and 'note' in a['archive'] and a['archive']['quiz']['questions'][1]['accepted'])
    put_quizzes(gv1, [quiz(1, 1, Q, 'closed'), quiz(5, 1, [choice(1, 'x', 'ab', 'a')])])
    chk('đề còn là bản nháp chưa có bản lưu → 404', req('GET', '/api/quiz/5/archive', ck=gv1)[0] == 404)
    res = req('GET', '/api/quiz/1/results', ck=gv1)[1]['results']
    chk('kết quả của đề kèm tên và tên đăng nhập sinh viên để đối chiếu', res and all(r.get('name') and r.get('username') for r in res) and any(r['username'] == 'sv01' for r in res))

    # ── kho đề ──
    BQ = [choice(1, 'Cau chon', 'abcd', 'c'), choice(2, 'Nhieu', 'abc', 'ab', 'multiple'), fill(3, 'Dien ____', [['dap an', 'da']])]
    st, r, raw, _ = req('POST', '/api/quizbank', {'title': 'Bo de chuong 1', 'subjectId': 1, 'source': 'file', 'questions': BQ}, gv1)
    bid = r.get('id')
    chk('giáo viên dạy môn lưu bộ câu hỏi vào kho → 200', st == 200 and bid and r['count'] == 3)
    chk('kho đề lưu riêng (collection quizBank), có đáp án đúng cho giáo viên', len(db_rows("SELECT 1 FROM docs WHERE col='quizBank'")) == 1)
    st, r, raw, _ = req('GET', '/api/quizbank', ck=gv1)
    chk('danh sách kho chỉ có thông tin tóm tắt, không có câu hỏi', st == 200 and len(r['items']) == 1 and r['items'][0]['count'] == 3 and 'questions' not in r['items'][0] and r['items'][0]['ownerName'] == 'Ten gv01')
    item = req('GET', f'/api/quizbank/{bid}', ck=gv1)[1]['item']
    chk('mở một mục: có câu hỏi kèm đáp án đúng và đáp án chấp nhận', item['questions'][0]['answers'][2]['correct'] is True and item['questions'][2]['accepted'] == [['dap an', 'da']])
    chk('giáo viên khác cùng môn xem được mục', req('GET', f'/api/quizbank/{bid}', ck=gv3)[0] == 200 and len(req('GET', '/api/quizbank', ck=gv3)[1]['items']) == 1)
    chk('giáo viên môn khác không thấy mục', req('GET', f'/api/quizbank/{bid}', ck=gv2)[0] == 404 and req('GET', '/api/quizbank', ck=gv2)[1]['items'] == [])
    chk('Admin thấy mục', len(req('GET', '/api/quizbank', ck=ad)[1]['items']) == 1)
    chk('sinh viên không dùng được kho đề (đọc, ghi) → 403', req('GET', '/api/quizbank', ck=s1)[0] == 403 and req('POST', '/api/quizbank', {'title': 'x', 'subjectId': 1, 'questions': BQ}, s1)[0] == 403 and req('GET', f'/api/quizbank/{bid}', ck=s1)[0] == 403)
    chk('chưa đăng nhập → 401', req('GET', '/api/quizbank')[0] == 401)
    chk('giáo viên lưu vào kho cho môn mình không dạy → 403', req('POST', '/api/quizbank', {'title': 'x', 'subjectId': 1, 'questions': BQ}, gv2)[0] == 403)
    chk('giáo viên khác cùng môn không sửa/xóa mục của người khác → 403', req('PUT', f'/api/quizbank/{bid}', {'title': 'Hack'}, gv3)[0] == 403 and req('DELETE', f'/api/quizbank/{bid}', ck=gv3)[0] == 403)
    chk('người tạo đổi tiêu đề và câu hỏi → 200', req('PUT', f'/api/quizbank/{bid}', {'title': 'Bo de chuong 1 (sua)', 'questions': BQ[:2]}, gv1)[0] == 200
        and req('GET', f'/api/quizbank/{bid}', ck=gv1)[1]['item']['title'].endswith('(sua)') and len(req('GET', f'/api/quizbank/{bid}', ck=gv1)[1]['item']['questions']) == 2)
    chk('câu hỏi sai hình thức → 400 (không có đáp án / điền khuyết 0 chỗ trống / rỗng / quá 500 câu)',
        req('POST', '/api/quizbank', {'title': 't', 'subjectId': 1, 'questions': [{'id': 1, 'text': 'x', 'type': 'single', 'answers': [{'id': 'a', 'text': 'A'}]}]}, gv1)[0] == 400
        and req('POST', '/api/quizbank', {'title': 't', 'subjectId': 1, 'questions': [{'text': 'x', 'type': 'fill', 'blanks': 0}]}, gv1)[0] == 400
        and req('POST', '/api/quizbank', {'title': 't', 'subjectId': 1, 'questions': []}, gv1)[0] == 400
        and req('POST', '/api/quizbank', {'title': 't', 'subjectId': 1, 'questions': [choice(1, 'x', 'ab', 'a')] * 501}, gv1)[0] == 400)
    chk('thiếu tiêu đề hoặc môn → 400', req('POST', '/api/quizbank', {'subjectId': 1, 'questions': BQ}, gv1)[0] == 400 and req('POST', '/api/quizbank', {'title': 'x', 'questions': BQ}, gv1)[0] == 400)
    st, r, raw, _ = req('POST', '/api/quizbank', {'title': 'Admin', 'subjectId': 7, 'questions': [{'id': 99, 'text': 'x', 'type': 'single', 'answers': [{'id': 'a', 'text': 'A', 'correct': True}, {'id': 'b', 'text': 'B', 'junk': 1}], 'hack': 'x'}]}, ad)
    stored = json.loads(db_rows("SELECT data FROM docs WHERE col='quizBank' AND id=?", r.get('id', ''))[0][0]) if r.get('id') else {}
    chk('Admin lưu cho môn bất kỳ; trường lạ bị bỏ, mã câu được đánh lại', st == 200 and stored['questions'][0]['id'] == 1 and 'hack' not in stored['questions'][0]
        and stored['questions'][0]['answers'][0]['correct'] is True and stored['questions'][0]['answers'][1]['correct'] is False and 'junk' not in stored['questions'][0]['answers'][1])
    chk('người tạo xóa mục → 200 và mục biến mất', req('DELETE', f'/api/quizbank/{bid}', ck=gv1)[0] == 200 and req('GET', f'/api/quizbank/{bid}', ck=gv1)[0] == 404)
    chk('kho đề không bị lộ qua sharedData/global với sinh viên', 'quizBank' not in shared(s1)[2] and 'Bo de' not in shared(s1)[2])
finally:
    srv.terminate(); srv.wait(5); shutil.rmtree(D, ignore_errors=True)
print('KẾT QUẢ:', 'ĐẠT' if ok else 'CÓ LỖI'); sys.exit(0 if ok else 1)
