#!/usr/bin/env python3
"""Dữ liệu kiểm tải sinh từ khung đào tạo (scripts/seed_curriculum.py): cấu trúc lớp/giáo viên/lịch, mật khẩu mặc định,
phân quyền đọc đúng môn, đề trắc nghiệm không lộ đáp án và chấm được, purge chỉ xóa đúng dữ liệu của script (API tạm, cổng 8796)."""
import csv, http.client, json, os, shutil, sqlite3, subprocess, sys, tempfile, time
HERE = os.path.dirname(os.path.abspath(__file__))
API = os.path.join(HERE, '..', '..', 'server', 'studytask_api.py')
SEED = os.path.join(HERE, '..', '..', 'scripts', 'seed_curriculum.py')
KHUNG = os.path.join(HERE, '..', '..', 'scripts', 'data', 'khung-dao-tao.json')
PORT = 8796
D, D2 = tempfile.mkdtemp(), tempfile.mkdtemp()
ok, srv = True, None


def chk(n, c):
    global ok
    ok &= bool(c)
    print(('PASS ' if c else 'FAIL ') + n)


def seed(data, *args):
    return subprocess.run([sys.executable, SEED, '--data-dir', data, '--workers', '4', *args], capture_output=True, text=True, encoding='utf-8')


class Sess:
    def __init__(self):
        self.ck = ''

    def req(self, m, p, b=None):
        c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=10)
        c.request(m, p, json.dumps(b) if b is not None else None, {'Content-Type': 'application/json', 'Cookie': self.ck})
        r = c.getresponse(); sc = r.getheader('Set-Cookie')
        if sc and 'st_session=' in sc:
            self.ck = sc.split(';')[0]
        return r.status, json.loads(r.read() or b'{}')

    def login(self, u, pw):
        return self.req('POST', '/api/auth/login', {'username': u, 'password': pw})[0]


def start_api(data):
    global srv
    srv = subprocess.Popen([sys.executable, API, 'serve'], env=dict(os.environ, STUDYTASK_DATA=data, STUDYTASK_PORT=str(PORT)),
                           stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
    end = time.time() + 15
    while time.time() < end:
        try:
            c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=1); c.request('GET', '/api/auth/me')
            if c.getresponse().status == 200:
                return
        except OSError:
            time.sleep(0.2)
    print('FAIL API không lên'); sys.exit(1)


def stop_api():
    global srv
    if srv:
        srv.terminate(); srv.wait(5); srv = None


try:
    with open(KHUNG, encoding='utf-8') as f:
        courses = json.load(f)['courses']
    sem_of = {c['code']: c['sem'] for c in courses}

    # ── nạp dữ liệu nhỏ vào CSDL mới ──
    r = seed(D, '--preset', 'small', '--staff', '--classes', '3', '--nam-hoc', '2026', '--hoc-ky', '1')
    chk('nạp dữ liệu thành công', r.returncode == 0)
    if r.returncode:
        print(r.stdout[-800:], r.stderr[-800:])
    con = sqlite3.connect(os.path.join(D, 'studytask.db'))
    docs = lambda col: {i: json.loads(d) for i, d in con.execute('SELECT id, data FROM docs WHERE col=?', (col,))}
    users, classes, shared = docs('user'), docs('classes'), docs('sharedData')['global']
    rows = list(csv.DictReader(open(os.path.join(D, 'seed-accounts.csv'), encoding='utf-8')))

    # ── cấu trúc lớp ──
    # --classes 3 × 8 học kỳ của khung = 24 lớp, chia cho 4 khóa đang học (mỗi khóa 6 lớp)
    cohorts = {c['cohort'] for c in classes.values()}
    chk('24 lớp chia cho 4 khóa 2023-2027 … 2026-2030, mỗi khóa 6 lớp',
        len(classes) == 24 and cohorts == {'2023-2027', '2024-2028', '2025-2029', '2026-2030'}
        and all(sum(1 for c in classes.values() if c['cohort'] == k) == 6 for k in cohorts))
    chk('lớp lưu năm học + học kỳ 1/2 + năm thứ (không lưu kỳ số mấy)', all(
        c['namHoc'] == '2026-2027' and c['hocKy'] == 1 and c['namThu'] in (1, 2, 3, 4) and 'semester' not in c for c in classes.values())
        and {c['namThu'] for c in classes.values()} == {1, 2, 3, 4})
    chk('mã lớp theo khóa (CNTT23-01 … CNTT26-06)', {c for c in classes} == {f'CNTT{y}-{n:02d}' for y in (23, 24, 25, 26) for n in range(1, 7)})
    chk('mỗi lớp 20–30 sinh viên và đúng số tài khoản', all(20 <= c['size'] <= 30 and len(c['studentUids']) == c['size'] for c in classes.values()))
    chk('có đủ các cỡ lớp khác nhau (ngẫu nhiên, không cố định)', len({c['size'] for c in classes.values()}) > 3)
    chk('mỗi sinh viên thuộc đúng một lớp', sum(len(c['studentUids']) for c in classes.values()) == sum(1 for u in users.values() if u['role'] == 'student'))
    codes_of = {s['id']: s['code'] for s in shared['subjects']}
    cur_sem = lambda o: (o['namThu'] - 1) * 2 + o['hocKy']        # học kỳ của khung đang học = suy ra từ năm thứ và học kỳ 1/2
    st_ok = all(sorted(codes_of[i] for i in u['subjectIds']) == sorted(c for c, s in sem_of.items() if s == cur_sem(u))
                for u in users.values() if u['role'] == 'student')
    chk('sinh viên học đúng các môn của học kỳ đang diễn ra theo khóa của mình', st_ok)
    chk('hồ sơ sinh viên không còn semesterNo; có khóa, năm học, học kỳ', all(
        'semesterNo' not in u and u['cohort'] and u['namHoc'] == '2026-2027' and u['hocKy'] == 1 for u in users.values() if u['role'] == 'student'))
    profs = docs('userData')
    chk('hồ sơ sinh viên ghi khóa và học kỳ dạng chữ (Học kỳ 1 – Năm học 2026-2027)', all(
        profs[i]['profile']['semester'] == 'Học kỳ 1 – Năm học 2026-2027' and profs[i]['profile']['cohort'] == u['cohort']
        for i, u in users.items() if u['role'] == 'student'))
    chk('mã sinh viên theo khóa: 7 chữ số, bắt đầu bằng 2 số cuối năm nhập học', all(
        len(u['studentId']) == 7 and u['studentId'][:2] == u['cohort'][2:4] and u['username'] == 'sv' + u['studentId']
        for u in users.values() if u['role'] == 'student'))
    chk('37 môn học trong sharedData', len(shared['subjects']) == len(courses))

    # ── giáo viên: dạy được mọi môn cùng bộ môn, mọi lớp học phần đều có giáo viên đúng bộ môn ──
    teachers = {i: u for i, u in users.items() if u['role'] == 'teacher'}
    chk('giáo viên có lớp học phần thì có subjectIds (môn được phân công); chưa được phân công thì để trống', all(bool(t['subjectIds']) == bool(t['sections']) for t in teachers.values()))
    chk('đủ 7 bộ môn đều có giáo viên (kể cả bộ môn chưa có lớp học phần ở học kỳ này)', len({t['boMon'] for t in teachers.values()}) == 7)
    chk('hồ sơ giáo viên ghi đúng các lớp học phần đang dạy (sections) khớp với các lớp', all(
        sorted((s['classId'], s['subjectId']) for s in t['sections']) ==
        sorted((c['id'], s['subjectId']) for c in classes.values() for s in c['sections'] if s['teacherUid'] == tid)
        and sorted({s['subjectId'] for s in t['sections']}) == sorted(t['subjectIds']) for tid, t in teachers.items()))
    chk('môn được phân công ⊆ môn thuộc bộ môn (canTeachSubjectIds) và có nhiều môn hơn mức đã phân công',
        all(set(t['subjectIds']) <= set(t['canTeachSubjectIds']) for t in teachers.values())
        and any(len(t['canTeachSubjectIds']) > len(t['subjectIds']) for t in teachers.values()))
    sched = {s['id']: s for s in shared['schedule']}
    good, seen_t, seen_c, seen_r = True, set(), set(), set()
    for cl in classes.values():
        for sec in cl['sections']:
            t = teachers[sec['teacherUid']]
            good &= sec['subjectId'] in t['subjectIds']
            for sid in sec['scheduleIds']:
                s = sched[sid]
                kt, kc = (sec['teacherUid'], s['day'], s['start']), (cl['id'], s['day'], s['start'])
                good &= kt not in seen_t and kc not in seen_c
                seen_t.add(kt); seen_c.add(kc)
                if s['room'] != 'Online':
                    kr = (s['day'], s['start'], s['room'])
                    good &= kr not in seen_r
                    seen_r.add(kr)
    chk('giáo viên được xếp đúng môn thuộc bộ môn; lớp, giáo viên, phòng không trùng giờ', good)
    credits = {s['id']: s['credits'] for s in shared['subjects']}
    chk('môn 3–4 tín chỉ học 2 buổi/tuần, các môn còn lại 1 buổi', all(
        len(sec['scheduleIds']) == (2 if 3 <= credits[sec['subjectId']] <= 4 else 1) for cl in classes.values() for sec in cl['sections']))
    chk('mỗi lớp có đủ lớp học phần cho mọi môn của học kỳ', all(
        len(cl['sections']) == sum(1 for s in sem_of.values() if s == cur_sem(cl)) for cl in classes.values()))
    chk('giáo viên dạy nhiều khóa khác nhau (chung cấu trúc)', any(len({classes[c]['cohort'] for c in classes
                                                                          for s in classes[c]['sections'] if s['teacherUid'] == tid}) > 1 for tid in teachers))

    # ── trắc nghiệm / tài liệu ──
    keys = docs('quizKeys')
    chk('mỗi đề có khóa đáp án', len(keys) == len(shared['quizzes']) and all(str(q['id']) in keys for q in shared['quizzes']))
    chk('đề lưu trong sharedData không chứa đáp án đúng', 'correct' not in json.dumps(shared['quizzes']) and '"accepted"' not in json.dumps(shared['quizzes']))
    files = os.listdir(os.path.join(D, 'uploads'))
    chk('mỗi tài liệu có tệp PDF thật trong uploads/', len(files) == len(shared['materials']) and all(m['url'].split('/')[-1] in files for m in shared['materials']))
    pdf = open(os.path.join(D, 'uploads', files[0]), 'rb').read()
    chk('tệp PDF hợp lệ (đầu %PDF, cuối %%EOF)', pdf.startswith(b'%PDF-') and pdf.rstrip().endswith(b'%%EOF'))
    chk('mật khẩu không nằm dạng văn bản trong database', b'student123' not in open(os.path.join(D, 'studytask.db'), 'rb').read())

    # ── đăng nhập bằng mật khẩu mặc định "vai trò + 123" ──
    start_api(D)
    pick = lambda role, **kw: next(r for r in rows if r['role'] == role and all(r[k] == v for k, v in kw.items()))
    sv = next(r for r in rows if r['role'] == 'student' and users[r['uid']]['namThu'] == 1)       # khóa 2026-2030, năm 1 → học HK1
    gv = pick('teacher')
    s, t, a = Sess(), Sess(), Sess()
    chk('sinh viên đăng nhập student123', s.login(sv['username'], 'student123') == 200)
    chk('giáo viên đăng nhập teacher123', t.login(gv['username'], 'teacher123') == 200)
    chk('admin01 đăng nhập admin123', a.login('admin01', 'admin123') == 200)
    chk('daotao01/taichinh01 dùng training123/finance123', Sess().login('daotao01', 'training123') == 200 and Sess().login('taichinh01', 'finance123') == 200)
    chk('mật khẩu sai bị từ chối', Sess().login(sv['username'], 'student124') == 401)

    # ── phân quyền đọc theo môn ──
    my_ids = set(users[sv['uid']]['subjectIds'])
    view = s.req('GET', '/api/doc/sharedData/global')[1]['data']
    chk('sinh viên chỉ thấy lịch/tài liệu/đề của các môn mình học', all(x['subjectId'] in my_ids for k in ('schedule', 'exams', 'materials', 'quizzes') for x in view[k]) and view['schedule'])
    chk('sinh viên chỉ thấy thời khóa biểu và lịch thi của ĐÚNG lớp mình', view['schedule'] and all(
        x['classId'] == sv['class'] for k in ('schedule', 'exams') for x in view[k]) and len(view['schedule']) == sum(
        len(sec['scheduleIds']) for c in classes.values() if c['id'] == sv['class'] for sec in c['sections']))
    chk('sinh viên không nhận được đáp án đúng', 'correct' not in json.dumps(view['quizzes']))
    tv = t.req('GET', '/api/doc/sharedData/global')[1]['data']
    my_classes = {s['classId'] for s in users[gv['uid']]['sections']}
    chk('giáo viên khi tải dữ liệu chung vẫn nhận đủ (giao diện lọc theo lớp), không bị cắt mất để ghi ngược',
        len(tv['schedule']) == len(shared['schedule']))
    chk('sinh viên thấy đủ 5 môn của học kỳ 1', len(view['subjects']) == len(courses) and len(my_ids) == 5)

    # ── nộp bài trắc nghiệm: máy chủ chấm bằng khóa đáp án do script tạo ──
    q = next(q for q in view['quizzes'] if q['status'] == 'active')
    ans = {str(qq['id']): ([''] if qq['type'] == 'fill' else [qq['answers'][0]['id']]) for qq in q['questions']}
    st, res = s.req('POST', f"/api/quiz/{q['id']}/submit", {'answers': ans})
    chk('nộp bài trắc nghiệm được chấm điểm 0–10', st == 200 and 0 <= res['score'] <= 10 and res['total'] == len(q['questions']))
    chk('nộp lần hai bị từ chối', s.req('POST', f"/api/quiz/{q['id']}/submit", {'answers': ans})[0] == 409)
    mine_subj = set(teachers[gv['uid']]['subjectIds'])
    own_q = next(x for x in shared['quizzes'] if x['subjectId'] in mine_subj)
    other_q = next(x for x in shared['quizzes'] if x['subjectId'] not in mine_subj)
    chk('giáo viên xem được kết quả đề môn mình dạy', t.req('GET', f"/api/quiz/{own_q['id']}/results")[0] == 200)
    chk('giáo viên không xem được kết quả đề môn khác bộ môn', t.req('GET', f"/api/quiz/{other_q['id']}/results")[0] == 403)
    cur = a.req('GET', '/api/doc/curriculum/khung-cntt-mau')[1]['data']
    chk('chương trình đào tạo đủ tín chỉ theo khung (116)', cur['totalCredits'] == 116 and sum(c['credits'] for m in cur['modules'] for c in m['courses']) == 116)
    stop_api()

    # ── nâng cấp phân công cho dữ liệu nạp bản cũ (chưa có sections) ──
    con = sqlite3.connect(os.path.join(D, 'studytask.db'))
    before = {i: json.loads(d) for i, d in con.execute("SELECT id, data FROM docs WHERE col='user'") if json.loads(d).get('role') == 'teacher'}
    for i, d in before.items():
        old = {k: v for k, v in d.items() if k not in ('sections', 'canTeachSubjectIds')} | {'subjectIds': d['canTeachSubjectIds']}
        con.execute("UPDATE docs SET data=? WHERE col='user' AND id=?", (json.dumps(old), i))
    con.commit(); con.close()
    r = seed(D, '--upgrade-assignments')
    con = sqlite3.connect(os.path.join(D, 'studytask.db'))
    after = {i: json.loads(d) for i, d in con.execute("SELECT id, data FROM docs WHERE col='user'") if json.loads(d).get('role') == 'teacher'}
    norm = lambda d: {**d, 'sections': sorted(d['sections'], key=lambda s: (s['classId'], s['subjectId']))}
    chk('--upgrade-assignments khôi phục đúng phân công cho dữ liệu cũ', r.returncode == 0 and all(norm(before[i]) == norm(after[i]) for i in before))
    r2 = seed(D, '--upgrade-assignments')
    chk('chạy nâng cấp lần hai không đổi gì (idempotent)', '0/' in r2.stdout)
    con.close()

    # ── nạp lại / purge ──
    chk('nạp lần hai không --replace bị từ chối', seed(D, '--preset', 'small').returncode != 0)
    chk('--dry-run không cần --data-dir và không ghi gì', subprocess.run([sys.executable, SEED, '--dry-run', '--preset', 'small'], capture_output=True).returncode == 0)
    r = seed(D, '--purge')
    con = sqlite3.connect(os.path.join(D, 'studytask.db'))
    # meta/quiz_v3 là dấu di trú của chính máy chủ, không phải của script nên được giữ
    left = con.execute("SELECT COUNT(*) FROM docs WHERE col IN ('user','userData','classes','quizKeys','curriculum','quizResults','activities') "
                       "OR (col='meta' AND id='seed_curriculum_v1')").fetchone()[0]
    sh = json.loads(con.execute("SELECT data FROM docs WHERE col='sharedData' AND id='global'").fetchone()[0])
    chk('--purge xóa hết tài khoản, lớp, đề, khóa đáp án, kết quả', r.returncode == 0 and left == 0 and con.execute('SELECT COUNT(*) FROM accounts').fetchone()[0] == 0)
    chk('--purge xóa hết mục dùng chung và tệp PDF', not any(sh.get(k) for k in ('subjects', 'schedule', 'exams', 'materials', 'quizzes')) and not os.listdir(os.path.join(D, 'uploads')))

    # ── không trộn vào dữ liệu thật ──
    subprocess.run([sys.executable, API, 'create-user', 'that01', 'matkhauthat1', 'student', 'Người thật'], env=dict(os.environ, STUDYTASK_DATA=D2), check=True, capture_output=True)
    r = seed(D2, '--preset', 'small')
    chk('từ chối nạp vào CSDL đã có tài khoản thật', r.returncode != 0 and 'tài khoản không phải do script tạo' in (r.stdout + r.stderr))
    chk('--force-merge nạp được', seed(D2, '--preset', 'small', '--force-merge').returncode == 0)
    chk('--purge giữ nguyên tài khoản thật', seed(D2, '--purge').returncode == 0)
    con2 = sqlite3.connect(os.path.join(D2, 'studytask.db'))
    chk('tài khoản thật vẫn còn sau purge', con2.execute("SELECT COUNT(*) FROM accounts WHERE username='that01'").fetchone()[0] == 1
        and con2.execute('SELECT COUNT(*) FROM accounts').fetchone()[0] == 1)
finally:
    stop_api()
    for d in (D, D2):
        shutil.rmtree(d, ignore_errors=True)
print('KẾT QUẢ:', 'ĐẠT' if ok else 'CÓ LỖI'); sys.exit(0 if ok else 1)
