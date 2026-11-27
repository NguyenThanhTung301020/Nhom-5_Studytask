#!/usr/bin/env python3
"""Giả lập số liệu học kỳ (scripts/seed_semester.py) trên CSDL tạm do seed_curriculum tạo:
đủ cột điểm cho mọi sinh viên ở mọi môn đang học, kết quả trắc nghiệm chấm đúng khóa đáp án, học phí, phiếu tốt nghiệp,
đề tài đồ án; không ghi đè dữ liệu đã có; chạy lại ra đúng số liệu cũ; --purge trả CSDL về như trước."""
import json, os, sqlite3, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
CUR = os.path.join(ROOT, 'scripts', 'seed_curriculum.py')
SEM = os.path.join(ROOT, 'scripts', 'seed_semester.py')
ENV = dict(os.environ, PYTHONUTF8='1')
ok = True


def chk(n, c):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + n)


def run(*args):
    return subprocess.run([sys.executable, *args], capture_output=True, text=True, encoding='utf-8', env=ENV)


def snapshot(d):
    con = sqlite3.connect(os.path.join(d, 'studytask.db'))
    rows = {(c, i): json.loads(x) for c, i, x in con.execute('SELECT col, id, data FROM docs')}
    con.close()
    return rows


def put(d, col, id_, data):
    con = sqlite3.connect(os.path.join(d, 'studytask.db'))
    con.execute('INSERT OR REPLACE INTO docs VALUES (?,?,?)', (col, id_, json.dumps(data, ensure_ascii=False)))
    con.commit(); con.close()


d = tempfile.mkdtemp()
r = run(CUR, '--data-dir', d, '--preset', 'small', '--no-files', '--nam-hoc', '2026', '--hoc-ky', '1')
chk('tạo dữ liệu nền bằng seed_curriculum', r.returncode == 0)
put(d, 'financeConfig', 'current', {'semester': 'HK1 2026–2027', 'pricePerCredit': 500000, 'practicePricePerCredit': 650000,
                                    'dueDate': '2026-12-30', 'reminderDays': [14, 7, 3, 1]})
before0 = snapshot(d)
students = {i: x for (c, i), x in before0.items() if c == 'user' and x.get('role') == 'student'}
keep_uid = sorted(students)[0]                        # dữ liệu "thật" đã có: không được ghi đè
put(d, 'tuition', keep_uid, {'payments': [{'amount': 1, 'date': '2026-11-12'}], 'discount': 0})
shared0 = before0[('sharedData', 'global')]
shared0['grades'] = {keep_uid: {'1': {'gk': 9}}}
put(d, 'sharedData', 'global', shared0)
before = snapshot(d)

r = run(SEM, '--data-dir', d, '--as-of', '2026-12-31', '--ck-as-of', '2026-12-31')
chk('nạp được', r.returncode == 0)
print(r.stdout[-600:] if r.returncode == 0 else r.stderr[-2000:])
after = snapshot(d)
sh = after[('sharedData', 'global')]
cur = {s['id']: s for s in sh['subjects'] if s.get('trangThai') == 'dang-hoc'}
hws = [h for h in sh['homeworks'] if h.get('seed') == 'semester-v1']
dls = [x for x in sh['deadlines'] if x.get('seed') == 'semester-v1']
chk('mỗi học phần đang học có bài tập và deadline', all(any(h['subjectId'] == s for h in hws) and any(x['subjectId'] == s for x in dls) for s in cur))
chk('bài tập, deadline nằm trong học kỳ (trước 31/12)', all('2026-09-01' <= x['dueDate'] <= '2026-12-31' for x in hws + dls))
g = sh['grades']
chk('không ghi đè điểm đã có', g[keep_uid] == {'1': {'gk': 9}})
missing = [(u, s) for u, x in students.items() if u != keep_uid for s in x.get('subjectIds', []) if s in cur and str(s) not in g.get(u, {})]
chk('mọi sinh viên có cột điểm ở mọi môn đang học', not missing)
nonguided = [(u, s) for u in g if u != keep_uid for s, c in g[u].items() if cur[int(s)].get('kieuHoc') != 'huong-dan']
chk('môn thường có chuyên cần, giữa kỳ, bài tập', all(('att' in g[u][s] or 'attData' in g[u][s]) and 'gk' in g[u][s] and g[u][s].get('hw') for u, s in nonguided))
chk('đa số có điểm cuối kỳ (thi 21–29/12)', sum('ck' in g[u][s] for u, s in nonguided) / len(nonguided) > 0.95)
chk('mọi điểm trong thang 0–10', all(0 <= v <= 10 for u in g for c in g[u].values() for k, v in c.items() if k in ('att', 'gk', 'ck'))
    and all(0 <= v <= 10 for u in g for c in g[u].values() for v in (c.get('hw') or {}).values()))
guided = [s for s in cur.values() if s.get('kieuHoc') == 'huong-dan']
chk('môn đồ án: điểm tổng kết do giáo viên hướng dẫn nhập (ck), không có giữa kỳ',
    guided and all('gk' not in g[u][str(s['id'])] for s in guided for u in g if str(s['id']) in g[u]))

sys.path.insert(0, os.path.join(ROOT, 'server'))
os.environ['STUDYTASK_DATA'] = d
import studytask_api as api
res = {i: x for (c, i), x in after.items() if c == 'quizResults'}
quizzes = {str(q['id']): q for q in sh['quizzes']}
good = all(api.grade_quiz(quizzes[str(x['quizId'])], after[('quizKeys', str(x['quizId']))], x['answers'])[3] == x['score'] for x in res.values())
chk(f'kết quả trắc nghiệm ({len(res)}) chấm đúng theo khóa đáp án của máy chủ', res and good)
chk('không có trắc nghiệm nộp sau hạn', all(x['submittedAt'][:10] <= quizzes[str(x['quizId'])]['dueDate'] for x in res.values()))

tu = {i: x for (c, i), x in after.items() if c == 'tuition'}
chk('không ghi đè học phí đã có', tu[keep_uid] == {'payments': [{'amount': 1, 'date': '2026-11-12'}], 'discount': 0})
seeded_tu = [x for x in tu.values() if x.get('seed') == 'semester-v1']
chk('học phí cho các sinh viên còn lại', len(seeded_tu) == len(students) - 1)
paid_none = sum(1 for x in seeded_tu if not x['payments'])
chk('có cả người nộp đủ, nộp thiếu và chưa nộp', 0 < paid_none < len(seeded_tu) * 0.3 and any(x.get('notices') and x['payments'] for x in seeded_tu))
chk('ngày nộp không sau ngày chốt và hạn nộp', all(p['date'] <= '2026-12-30' for x in seeded_tu for p in x['payments']))

ga = [x for (c, i), x in after.items() if c == 'graduationApps']
final = min({s['khoa'] for s in cur.values()})
chk('phiếu xét tốt nghiệp chỉ của khóa năm cuối', ga and all(students[x['uid']].get('cohort') == final for x in ga))
chk('phiếu có đề tài đồ án, GPA, tín chỉ', all(x['thesisTitle'] and 0 <= float(x['gpa']) <= 4 and x['credits'] > 0 for x in ga))
chk('đủ các trạng thái duyệt', {x['status'] for x in ga} >= {'submitted', 'approved', 'needsFix'})
titles = [x['thesisTitle'] for x in ga]
chk('đề tài không trùng', len(set(titles)) == len(titles))
mat = [m for m in sh['materials'] if m.get('seed') == 'semester-v1']
chk('danh sách đề tài gắn vào tài liệu môn đồ án', mat and all(m['subjectId'] in {s['id'] for s in guided} for m in mat))

ud = {i: x for (c, i), x in after.items() if c == 'userData'}
chk('GPA ghi vào hồ sơ sinh viên', all(ud[u]['profile'].get('gpa') for u in students if ('userData', u) in after))
act = {i: x for (c, i), x in after.items() if c == 'activities'}
chk('nhật ký nộp bài/xem tài liệu hợp lệ với máy chủ', act and all(api.valid_activity_event(e) and e['type'] != 'quiz' for x in act.values() for e in x['events']))
chk('sharedData dưới giới hạn ghi 5 MB', len(json.dumps(sh, ensure_ascii=False).encode()) < 5 * 1024 * 1024)

r = run(SEM, '--data-dir', d)
chk('chạy lần hai bị từ chối (đã có dữ liệu)', r.returncode != 0)
r = run(SEM, '--data-dir', d, '--replace', '--as-of', '2026-12-31', '--ck-as-of', '2026-12-31')
again = snapshot(d)
same = all(again.get(k) == v for k, v in after.items() if k[0] in ('quizResults', 'tuition', 'graduationApps', 'activities')) \
    and again[('sharedData', 'global')]['grades'] == sh['grades']
chk('--replace ra đúng số liệu cũ (cùng hạt giống)', r.returncode == 0 and same)

r = run(SEM, '--data-dir', d, '--replace', '--as-of', '2026-12-31', '--ck-as-of', '2026-12-22')
pa = snapshot(d)[('sharedData', 'global')]
cells = [(cur[int(s)], c) for u, x in pa['grades'].items() if u != keep_uid for s, c in x.items()]
exam = {}
for e in pa['exams']:
    if e.get('subjectId') in cur:
        exam[e['subjectId']] = min(exam.get(e['subjectId'], e['date']), e['date'])
chk('--ck-as-of 22/12: chỉ môn đã thi có điểm cuối kỳ, điểm quá trình vẫn đủ',
    r.returncode == 0 and all(('ck' in c) <= (exam.get(s['id'], '9') <= '2026-12-22') for s, c in cells if s.get('kieuHoc') != 'huong-dan')
    and any('ck' in c for s, c in cells) and all('gk' in c and c.get('hw') for s, c in cells if s.get('kieuHoc') != 'huong-dan')
    and pa['grades'] != sh['grades']
    and all(x['status'] == ('completed' if x['dueDate'] <= '2026-12-22' else 'pending')
            for x in pa['deadlines'] if x.get('seed') == 'semester-v1' and x['title'].startswith(('Thi cuối kỳ', 'Bảo vệ'))))

r = run(SEM, '--data-dir', d, '--as-of', '2026-11-26', '--replace')
mid = snapshot(d)[('sharedData', 'global')]
mg = [c for u, x in mid['grades'].items() if u != keep_uid for c in x.values() if 'hw' in c]
chk('--as-of 26/11: chưa có điểm cuối kỳ, deadline tháng 12 còn mở',
    r.returncode == 0 and not any('ck' in c for u, x in mid['grades'].items() if u != keep_uid for c in x.values())
    and all(x['status'] == 'pending' for x in mid['deadlines'] if x.get('seed') == 'semester-v1' and x['dueDate'] > '2026-11-26'))

r = run(SEM, '--data-dir', d, '--purge')
chk('--purge trả CSDL về đúng như trước khi nạp', r.returncode == 0 and snapshot(d) == before)
print('ĐẠT' if ok else 'KHÔNG ĐẠT')
sys.exit(0 if ok else 1)
