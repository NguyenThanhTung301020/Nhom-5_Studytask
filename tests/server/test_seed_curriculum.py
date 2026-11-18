#!/usr/bin/env python3
"""Dữ liệu kiểm tải sinh từ khung đào tạo (scripts/seed_curriculum.py): cấu trúc lớp/giáo viên/lịch, mật khẩu mặc định,
phân quyền đọc đúng môn, đề trắc nghiệm không lộ đáp án và chấm được, purge chỉ xóa đúng dữ liệu của script (API tạm, cổng 8796)."""
import csv, datetime, http.client, json, os, shutil, sqlite3, subprocess, sys, tempfile, time
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

    # ── nạp dữ liệu nhỏ vào CSDL mới (học kỳ 1 năm học 2026-2027) ──
    r = seed(D, '--preset', 'small', '--staff', '--classes', '3', '--quizzes', '2', '--nam-hoc', '2026', '--hoc-ky', '1')
    chk('nạp dữ liệu thành công', r.returncode == 0)
    if r.returncode:
        print(r.stdout[-800:], r.stderr[-800:])
    con = sqlite3.connect(os.path.join(D, 'studytask.db'))
    docs = lambda col: {i: json.loads(d) for i, d in con.execute('SELECT id, data FROM docs WHERE col=?', (col,))}
    users, classes, shared = docs('user'), docs('classes'), docs('sharedData')['global']
    rows = list(csv.DictReader(open(os.path.join(D, 'seed-accounts.csv'), encoding='utf-8')))
    subj = {s['id']: s for s in shared['subjects']}
    CUR = (2026, 1)
    term_of = lambda x: (int(x['namHoc'][:4]), x['ky'])

    # ── khóa, lớp, sinh viên ──
    cohorts = {c['cohort'] for c in classes.values()}
    chk('12 lớp: 4 khóa 2023-2027 … 2026-2030, mỗi khóa 3 lớp (--classes là số lớp MỖI KHÓA)',
        len(classes) == 12 and cohorts == {'2023-2027', '2024-2028', '2025-2029', '2026-2030'}
        and all(sum(1 for c in classes.values() if c['cohort'] == k) == 3 for k in cohorts))
    chk('lớp lưu năm học + học kỳ 1/2 + năm thứ (không lưu kỳ số mấy)', all(
        c['namHoc'] == '2026-2027' and c['hocKy'] == 1 and c['namThu'] in (1, 2, 3, 4) and 'semester' not in c for c in classes.values())
        and {c['namThu'] for c in classes.values()} == {1, 2, 3, 4})
    chk('mã lớp theo khóa (CNTT23-01 … CNTT26-03)', set(classes) == {f'CNTT{y}-{n:02d}' for y in (23, 24, 25, 26) for n in range(1, 4)})
    chk('mỗi lớp 20–30 sinh viên và đúng số tài khoản', all(20 <= c['size'] <= 30 and len(c['studentUids']) == c['size'] for c in classes.values()))
    chk('có đủ các cỡ lớp khác nhau (ngẫu nhiên, không cố định)', len({c['size'] for c in classes.values()}) > 3)
    chk('mỗi sinh viên thuộc đúng một lớp', sum(len(c['studentUids']) for c in classes.values()) == sum(1 for u in users.values() if u['role'] == 'student'))
    chk('hồ sơ sinh viên có khóa, năm học, học kỳ; không còn semesterNo', all(
        'semesterNo' not in u and u['cohort'] and u['namHoc'] == '2026-2027' and u['hocKy'] == 1 for u in users.values() if u['role'] == 'student'))
    profs = docs('userData')
    chk('hồ sơ sinh viên ghi khóa và học kỳ dạng chữ (Học kỳ 1 – Năm học 2026-2027)', all(
        profs[i]['profile']['semester'] == 'Học kỳ 1 – Năm học 2026-2027' and profs[i]['profile']['cohort'] == u['cohort']
        for i, u in users.items() if u['role'] == 'student'))
    chk('mã sinh viên theo khóa: 7 chữ số, bắt đầu bằng 2 số cuối năm nhập học', all(
        len(u['studentId']) == 7 and u['studentId'][:2] == u['cohort'][2:4] and u['username'] == 'sv' + u['studentId']
        for u in users.values() if u['role'] == 'student'))

    # ── học phần mở theo năm: cùng một môn mở lại ở năm khác là bản ghi mới, có nhãn khóa/năm học/học kỳ ──
    chk('148 học phần mở = 4 khóa × 37 môn của khung (mỗi khóa học đủ 8 học kỳ)', len(shared['subjects']) == 4 * len(courses))
    chk('mỗi học phần có khóa, năm học, học kỳ 1/2, năm thứ, trạng thái', all(
        s['khoa'] in cohorts and s['namHoc'] and s['ky'] in (1, 2) and s['namThu'] == (s['hocKy'] + 1) // 2 and s['trangThai'] in ('da-ket-thuc', 'dang-hoc', 'ke-hoach')
        for s in shared['subjects']))
    chk('năm học/học kỳ của học phần suy ra đúng từ khóa và vị trí trong khung', all(
        int(s['namHoc'][:4]) == int(s['khoa'][:4]) + (s['hocKy'] - 1) // 2 and s['ky'] == (1 if s['hocKy'] % 2 else 2) for s in shared['subjects']))
    chk('trạng thái đúng so với học kỳ hiện tại (2026-2027 HK1): trước = đã kết thúc, bằng = đang học, sau = kế hoạch', all(
        s['trangThai'] == ('da-ket-thuc' if term_of(s) < CUR else 'dang-hoc' if term_of(s) == CUR else 'ke-hoach') for s in shared['subjects']))
    by_code = {}
    for s in shared['subjects']:
        by_code.setdefault(s['code'], []).append(s)
    chk('mỗi mã môn xuất hiện 4 lần ở 4 năm học khác nhau, mỗi lần thuộc một khóa (không dồn vào một bản ghi)', all(
        len(v) == 4 and len({(x['namHoc'], x['ky']) for x in v}) == 4 and len({x['khoa'] for x in v}) == 4 for v in by_code.values()))
    sem_of = {c['code']: c['sem'] for c in courses}
    st_ok = all(len(u['subjectIds']) >= 1 and all(subj[i]['khoa'] == u['cohort'] and term_of(subj[i]) == CUR for i in u['subjectIds'])
                and sorted(subj[i]['code'] for i in u['subjectIds']) == sorted(c for c, s in sem_of.items() if s == (u['namThu'] - 1) * 2 + u['hocKy'])
                for u in users.values() if u['role'] == 'student')
    chk('sinh viên chỉ có các học phần ĐANG HỌC của khóa mình (đúng khóa, đúng học kỳ hiện tại)', st_ok)

    # ── giáo viên: 1 đến 3 người mỗi học phần ──
    teachers = {i: u for i, u in users.items() if u['role'] == 'teacher'}
    per_o = {}
    for c in classes.values():
        for sec in c['sections']:
            per_o.setdefault(sec['subjectId'], set()).add(sec['teacherUid'])
    chk('mỗi học phần mở có từ 1 đến 3 giáo viên', set(per_o) == set(subj) and all(1 <= len(v) <= 3 for v in per_o.values()))
    chk('hồ sơ học phần ghi đúng tên giáo viên được phân công (≤ 3)', all(
        sorted(s['teachers']) == sorted(teachers[u]['name'] for u in per_o[s['id']]) and 1 <= len(s['teachers']) <= 3 for s in shared['subjects']))
    chk('đủ 7 bộ môn đều có giáo viên', len({t['boMon'] for t in teachers.values()}) == 7)
    chk('giáo viên có lớp học phần thì có subjectIds (học phần được phân công)', all(bool(t['subjectIds']) == bool(t['sections']) for t in teachers.values()))
    chk('hồ sơ giáo viên ghi đúng các lớp học phần đang dạy (sections) khớp với các lớp', all(
        sorted((s['classId'], s['subjectId']) for s in t['sections']) ==
        sorted((c['id'], s['subjectId']) for c in classes.values() for s in c['sections'] if s['teacherUid'] == tid)
        and sorted({s['subjectId'] for s in t['sections']}) == sorted(t['subjectIds']) for tid, t in teachers.items()))
    chk('giáo viên chỉ dạy học phần thuộc bộ môn của mình (canTeachCodes) và dạy lại cùng môn ở nhiều năm',
        all({subj[i]['code'] for i in t['subjectIds']} <= set(t['canTeachCodes']) for t in teachers.values())
        and any(len({subj[i]['namHoc'] for i in t['subjectIds'] if subj[i]['code'] == c}) > 1 for t in teachers.values() for c in {subj[i]['code'] for i in t['subjectIds']}))

    # ── thời khóa biểu theo bảng 16 tiết, từng học kỳ ──
    TIET = {1: ('07:30', '08:15'), 2: ('08:15', '09:00'), 3: ('09:00', '09:45'), 4: ('10:00', '10:45'), 5: ('10:45', '11:30'), 6: ('11:30', '12:15'),
            7: ('12:45', '13:30'), 8: ('13:30', '14:15'), 9: ('14:15', '15:00'), 10: ('15:15', '16:00'), 11: ('16:00', '16:45'), 12: ('16:45', '17:30'),
            13: ('18:00', '18:45'), 14: ('18:45', '19:30'), 15: ('19:30', '20:15'), 16: ('20:15', '21:00')}
    shift_of = lambda t: 0 if t <= 6 else 1 if t <= 12 else 2
    guided_codes = {'IT405', 'IT498', 'IT499'}
    sched = {s['id']: s for s in shared['schedule']}
    guided_ids = {s['id'] for s in shared['subjects'] if s['code'] in guided_codes}
    chk('3 môn Đồ án chuyên ngành, Thực tập, Khóa luận được đánh dấu môn hướng dẫn (kieuHoc) ở mọi khóa', guided_ids and all(
        (s.get('kieuHoc') == 'huong-dan') == (s['code'] in guided_codes) for s in shared['subjects']) and len(guided_ids) == 12)
    chk('môn hướng dẫn KHÔNG có buổi học và KHÔNG có lịch thi', not any(x['subjectId'] in guided_ids for x in shared['schedule'] + shared['exams']))
    chk('môn hướng dẫn không có đề trắc nghiệm nhưng có tài liệu hướng dẫn/biểu mẫu', not any(q['subjectId'] in guided_ids for q in shared['quizzes'])
        and {m['subjectId'] for m in shared['materials']} >= {i for i in guided_ids if subj[i]['trangThai'] != 'ke-hoach'})
    chk('lớp học phần của môn hướng dẫn vẫn có giáo viên hướng dẫn (1–3 người) nhưng scheduleIds rỗng', all(
        s['guided'] and s['scheduleIds'] == [] for c in classes.values() for s in c['sections'] if s['subjectId'] in guided_ids)
        and all(1 <= len(per_o[i]) <= 3 for i in guided_ids))
    good, seen_t, seen_c, seen_r = True, set(), set(), set()
    for cl in classes.values():
        for sec in cl['sections']:
            t = teachers[sec['teacherUid']]
            good &= sec['subjectId'] in t['subjectIds'] and (sec['namHoc'], sec['ky']) == (subj[sec['subjectId']]['namHoc'], subj[sec['subjectId']]['ky'])
            for sid in sec['scheduleIds']:
                s = sched[sid]
                for tiet in range(s['tietStart'], s['tietEnd'] + 1):
                    kt, kc = (sec['teacherUid'], s['namHoc'], s['ky'], s['day'], tiet), (cl['id'], s['namHoc'], s['ky'], s['day'], tiet)
                    good &= kt not in seen_t and kc not in seen_c
                    seen_t.add(kt); seen_c.add(kc)
                    if s['room'] != 'Online':
                        kr = (s['namHoc'], s['ky'], s['day'], tiet, s['room'])
                        good &= kr not in seen_r
                        seen_r.add(kr)
    chk('mọi buổi học thuộc đúng học phần/giáo viên; lớp, giáo viên, phòng không trùng TIẾT trong cùng học kỳ', good)
    chk('giờ học khớp bảng 16 tiết: start/end đúng giờ tiết đầu/cuối của khối', all(
        (s['start'], s['end']) == (TIET[s['tietStart']][0], TIET[s['tietEnd']][1]) for s in shared['schedule'] + shared['exams']))
    chk('mỗi buổi học là một khối tiết LIỀN NHAU nằm gọn trong một buổi (sáng 1–6, chiều 7–12, tối 13–16), không bắc qua giờ nghỉ', all(
        1 <= s['tietStart'] <= s['tietEnd'] <= 16 and shift_of(s['tietStart']) == shift_of(s['tietEnd']) for s in shared['schedule'] + shared['exams']))
    credits = {s['id']: s['credits'] for s in shared['subjects']}
    chk('số tiết/tuần của môn = số tín chỉ (2→2, 3→3, 4→4 tiết); môn 3 TC học một khối 3 tiết', all(
        sum(sched[i]['tietEnd'] - sched[i]['tietStart'] + 1 for i in sec['scheduleIds']) == (0 if sec['subjectId'] in guided_ids else min(4, max(2, credits[sec['subjectId']])))
        for cl in classes.values() for sec in cl['sections']))
    chk('các khối của một môn trong tuần rơi vào các ngày khác nhau', all(
        len({sched[i]['day'] for i in sec['scheduleIds']}) == len(sec['scheduleIds']) for cl in classes.values() for sec in cl['sections']))
    # mỗi lớp có ít nhất 1 ngày nghỉ trong tuần (Thứ Hai–Thứ Bảy) ở MỌI học kỳ; Chủ nhật chỉ có lớp trực tuyến
    per_ct = {}
    for s in shared['schedule']:
        per_ct.setdefault((s['classId'], s['namHoc'], s['ky']), set()).add(s['day'])
    chk('mỗi lớp có ít nhất 1 ngày nghỉ trong tuần (Thứ Hai–Thứ Bảy) ở mọi học kỳ', per_ct and all(len({2, 3, 4, 5, 6, 7} - d) >= 1 for d in per_ct.values()))
    chk('Chủ nhật chỉ dùng cho buổi học trực tuyến', all(s['format'] == 'online' for s in shared['schedule'] if s['day'] == 8))
    online = [s for s in shared['schedule'] if s['format'] == 'online']
    offline = [s for s in shared['schedule'] if s['format'] != 'online']
    chk('buổi trực tuyến ưu tiên buổi tối (tiết 13–16) và cuối tuần (≥ 90%)', online and sum(1 for s in online if s['tietStart'] >= 13 or s['day'] >= 7) / len(online) >= 0.9)
    chk('buổi học trực tiếp hầu như không xếp vào buổi tối (≤ 10%) và phòng là phòng thật', sum(1 for s in offline if s['tietStart'] >= 13) / len(offline) <= 0.1
        and all(s['room'] != 'Online' for s in offline))
    chk('mỗi buổi học gắn khóa, năm học, học kỳ của học phần và ngày bắt đầu–kết thúc học kỳ (15 tuần học, bắt đầu Thứ Hai)', all(
        (s['khoa'], s['namHoc'], s['ky']) == (subj[s['subjectId']]['khoa'], subj[s['subjectId']]['namHoc'], subj[s['subjectId']]['ky'])
        and datetime.date.fromisoformat(s['startDate']).weekday() == 0
        and (datetime.date.fromisoformat(s['endDate']) - datetime.date.fromisoformat(s['startDate'])).days == 15 * 7 - 1 for s in shared['schedule']))
    chk('lịch trải đều các học kỳ của mỗi khóa (13/14 học kỳ có lịch; học kỳ cuối của khóa mới nhất chỉ có môn hướng dẫn nên không có lịch), học kỳ hiện tại chỉ chiếm một phần nhỏ', len({(s['namHoc'], s['ky']) for s in shared['schedule']}) == 13
        and 0 < sum(1 for s in shared['schedule'] if term_of(s) == CUR) < len(shared['schedule']) / 4)
    exams = shared['exams']
    end_of = {(s['classId'], s['namHoc'], s['ky']): s['endDate'] for s in shared['schedule']}
    chk('lịch thi nằm trong 3 tuần ngay sau khi kết thúc học kỳ, không thi Chủ nhật, mỗi bài thi 2 tiết', all(
        end_of[(e['classId'], e['namHoc'], e['ky'])] < e['date'] <= (datetime.date.fromisoformat(end_of[(e['classId'], e['namHoc'], e['ky'])]) + datetime.timedelta(days=21)).isoformat()
        and datetime.date.fromisoformat(e['date']).weekday() != 6 and e['tietEnd'] == e['tietStart'] + 1 for e in exams))
    chk('mỗi lớp mỗi ngày chỉ thi một môn trong một học kỳ', len({(e['classId'], e['namHoc'], e['ky'], e['date']) for e in exams}) == len(exams))
    chk('mỗi lớp có lớp học phần cho mọi học phần của khóa mình ở cả 8 học kỳ (37 môn)', all(len(cl['sections']) == len(courses) for cl in classes.values()))

    # ── trắc nghiệm / tài liệu ──
    keys = docs('quizKeys')
    chk('mỗi đề có khóa đáp án', len(keys) == len(shared['quizzes']) and all(str(q['id']) in keys for q in shared['quizzes']))
    chk('đề lưu trong sharedData không chứa đáp án đúng', 'correct' not in json.dumps(shared['quizzes']) and '"accepted"' not in json.dumps(shared['quizzes']))
    with_content = {s['id'] for s in shared['subjects'] if s['trangThai'] != 'ke-hoach'}
    chk('học phần kế hoạch (chưa học) chưa có tài liệu và đề; học phần đã/đang học thì có (trừ đề của môn hướng dẫn)', {m['subjectId'] for m in shared['materials']} == with_content
        and {q['subjectId'] for q in shared['quizzes']} == with_content - guided_ids)
    chk('đề của học phần đã kết thúc đều đã đóng', all(q['status'] == 'closed' for q in shared['quizzes'] if subj[q['subjectId']]['trangThai'] == 'da-ket-thuc'))
    files = [f for f in os.listdir(os.path.join(D, 'uploads')) if f.endswith('.pdf')]
    chk('tài liệu dùng chung tệp giữa các năm: ít tệp PDF hơn số mục tài liệu, mọi mục đều có tệp thật',
        0 < len(files) < len(shared['materials']) and all(m['url'].split('/')[-1] in files for m in shared['materials']))
    pdf = open(os.path.join(D, 'uploads', files[0]), 'rb').read()
    chk('tệp PDF hợp lệ (đầu %PDF, cuối %%EOF)', pdf.startswith(b'%PDF-') and pdf.rstrip().endswith(b'%%EOF'))
    chk('mật khẩu không nằm dạng văn bản trong database', b'student123' not in open(os.path.join(D, 'studytask.db'), 'rb').read())

    # ── đăng nhập bằng mật khẩu mặc định "vai trò + 123" ──
    start_api(D)
    pick = lambda role, **kw: next(r for r in rows if r['role'] == role and all(r[k] == v for k, v in kw.items()))
    sv = next(r for r in rows if r['role'] == 'student' and users[r['uid']]['namThu'] == 1)       # khóa 2026-2030, năm 1 → học HK1
    gv = next(r for r in rows if r['role'] == 'teacher' and len(users[r['uid']]['sections']) > 3)
    s, t, a = Sess(), Sess(), Sess()
    chk('sinh viên đăng nhập student123', s.login(sv['username'], 'student123') == 200)
    chk('giáo viên đăng nhập teacher123', t.login(gv['username'], 'teacher123') == 200)
    chk('admin01 đăng nhập admin123', a.login('admin01', 'admin123') == 200)
    chk('daotao01/taichinh01 dùng training123/finance123', Sess().login('daotao01', 'training123') == 200 and Sess().login('taichinh01', 'finance123') == 200)
    chk('mật khẩu sai bị từ chối', Sess().login(sv['username'], 'student124') == 401)

    # ── phân quyền đọc theo môn và lớp ──
    my_ids = set(users[sv['uid']]['subjectIds'])
    view = s.req('GET', '/api/doc/sharedData/global')[1]['data']
    chk('sinh viên chỉ thấy lịch/tài liệu/đề của các học phần đang học', all(x['subjectId'] in my_ids for k in ('schedule', 'exams', 'materials', 'quizzes') for x in view[k]) and view['schedule'])
    chk('sinh viên chỉ thấy thời khóa biểu và lịch thi của ĐÚNG lớp mình, đúng học kỳ hiện tại', view['schedule'] and all(
        x['classId'] == sv['class'] and term_of(x) == CUR for k in ('schedule', 'exams') for x in view[k]) and len(view['schedule']) == sum(
        len(sec['scheduleIds']) for c in classes.values() if c['id'] == sv['class'] for sec in c['sections'] if (sec['namHoc'], sec['ky']) == ('2026-2027', 1)))
    chk('sinh viên không nhận được đáp án đúng', 'correct' not in json.dumps(view['quizzes']))
    tv = t.req('GET', '/api/doc/sharedData/global')[1]['data']
    chk('giáo viên khi tải dữ liệu chung vẫn nhận đủ (giao diện lọc theo lớp/học kỳ), không bị cắt mất để ghi ngược',
        len(tv['schedule']) == len(shared['schedule']))
    chk('sinh viên thấy 5 học phần đang học của khóa mình', len(my_ids) == 5)

    # ── nộp bài trắc nghiệm: máy chủ chấm bằng khóa đáp án do script tạo ──
    q = next(q for q in view['quizzes'] if q['status'] == 'active')
    ans = {str(qq['id']): ([''] if qq['type'] == 'fill' else [qq['answers'][0]['id']]) for qq in q['questions']}
    st, res = s.req('POST', f"/api/quiz/{q['id']}/submit", {'answers': ans})
    chk('nộp bài trắc nghiệm được chấm điểm 0–10', st == 200 and 0 <= res['score'] <= 10 and res['total'] == len(q['questions']))
    chk('nộp lần hai bị từ chối', s.req('POST', f"/api/quiz/{q['id']}/submit", {'answers': ans})[0] == 409)
    mine_subj = set(teachers[gv['uid']]['subjectIds'])
    own_q = next(x for x in shared['quizzes'] if x['subjectId'] in mine_subj)
    other_q = next(x for x in shared['quizzes'] if x['subjectId'] not in mine_subj)
    chk('giáo viên xem được kết quả đề học phần mình dạy', t.req('GET', f"/api/quiz/{own_q['id']}/results")[0] == 200)
    chk('giáo viên không xem được kết quả đề học phần khác (kể cả cùng môn ở năm/khóa khác)', t.req('GET', f"/api/quiz/{other_q['id']}/results")[0] == 403)
    cur = a.req('GET', '/api/doc/curriculum/khung-cntt-mau')[1]['data']
    chk('chương trình đào tạo đủ tín chỉ theo khung (116)', cur['totalCredits'] == 116 and sum(c['credits'] for m in cur['modules'] for c in m['courses']) == 116)
    stop_api()

    # ── số giáo viên mỗi học phần theo số lớp: 3 lớp → 1, 6 lớp → 2, 10 lớp → 2–3; --max-teachers hạ trần ──
    import re
    def per_offering(*args):
        out = subprocess.run([sys.executable, SEED, '--dry-run', *args], capture_output=True, text=True, encoding='utf-8').stdout
        m = re.search(r'mỗi học phần (\d+)–(\d+) giáo viên', out)
        return (int(m.group(1)), int(m.group(2))) if m else None
    chk('3 lớp mỗi khóa → mỗi học phần 1 giáo viên', per_offering('--preset', 'small') == (1, 1))
    lo6, hi6 = per_offering('--classes', '6')
    chk('6 lớp mỗi khóa → tối đa 2 giáo viên mỗi học phần (có học phần dồn về 1 người khi trùng giờ)', 1 <= lo6 <= hi6 == 2)
    lo, hi = per_offering('--classes', '10')
    chk('10 lớp mỗi khóa → 2–3 giáo viên, không bao giờ quá trần 3', 2 <= lo <= hi == 3)
    chk('--max-teachers 1 hạ trần xuống 1 giáo viên dù 6 lớp', per_offering('--classes', '6', '--max-teachers', '1') == (1, 1))
    chk('quá nhiều lớp so với tải cho phép thì báo lỗi rõ ràng thay vì vượt trần giáo viên',
        subprocess.run([sys.executable, SEED, '--dry-run', '--classes', '30', '--max-teachers', '1'], capture_output=True, text=True, encoding='utf-8').returncode != 0)

    # ── nâng cấp phân công cho dữ liệu nạp bản cũ (chưa có sections) ──
    con = sqlite3.connect(os.path.join(D, 'studytask.db'))
    before = {i: json.loads(d) for i, d in con.execute("SELECT id, data FROM docs WHERE col='user'") if json.loads(d).get('role') == 'teacher'}
    for i, d in before.items():
        old = {k: v for k, v in d.items() if k != 'sections'} | {'subjectIds': []}
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
