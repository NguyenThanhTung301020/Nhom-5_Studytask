#!/usr/bin/env python3
"""Dữ liệu thử cho kiểm thử giao diện Bảng điểm và Báo cáo lớp đọc điểm từ quizResults (tuần 7).

Chỉ dùng trên máy cục bộ với CSDL tạm, không chạy trên máy chủ thật. API phải đang chạy với cùng STUDYTASK_DATA.
    STUDYTASK_DATA=<thư mục tạm> STUDYTASK_PORT=8796 python server/studytask_api.py serve
    STUDYTASK_DATA=<thư mục tạm> python tests/server/seed_diem_quizresults.py 8796

Tài khoản thử (mật khẩu chỉ dùng cho CSDL tạm): ad01 / adminpass1; các tài khoản khác / matkhau123.
  gv01 – dạy môn 1 ở lớp A1 (sections)       gv02 – dạy môn 2 (hồ sơ chưa phân lớp)
  sv01 (A1) – nộp Q101 đúng 3/3, Q102 đúng 1/3; nhật ký activities bị mất (giả lập nhật ký bị cắt)
  sv02 (A1) – nộp Q101 đúng 2/3; nhật ký cũ có 2 sự kiện quiz giả 10 và 9 điểm (nhiều lần làm bài ở nhật ký)
  sv03 (A1) – chưa làm bài nào
  sv04 (C1) – nộp Q101 sai cả 3 câu; khác lớp học phần của gv01
  sv05 (A1) – môn 2: không có quizResults, chỉ có sự kiện quiz 8 điểm trong nhật ký cũ
"""
import http.client, json, os, sqlite3, subprocess, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8796
D = os.environ['STUDYTASK_DATA']
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
PW = 'matkhau123'


def req(m, p, b=None, ck=''):
    c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=10)
    c.request(m, p, json.dumps(b) if b is not None else None, {'Content-Type': 'application/json', 'Cookie': ck})
    r = c.getresponse(); sc = r.getheader('Set-Cookie'); raw = r.read().decode()
    return r.status, (json.loads(raw) if raw else {}), (sc.split(';')[0] if sc and 'st_session=' in sc else '')


def login(u, pw=PW):
    st, _, ck = req('POST', '/api/auth/login', {'username': u, 'password': pw})
    assert st == 200 and ck, f'đăng nhập {u} lỗi {st}'
    return ck


def quiz(qid, sid, title, status):
    q = lambda i, kind, ok: {'id': i, 'text': f'Câu {i}', 'type': kind,
                             'answers': [{'id': a, 'text': a.upper(), 'correct': a in ok} for a in 'abcd']}
    return {'id': qid, 'subjectId': sid, 'title': title, 'description': '', 'dueDate': '2099-12-31', 'status': status,
            'createdAt': '2026-11-19T00:00:00Z', 'questions': [q(1, 'single', 'b'), q(2, 'multiple', 'bc'), q(3, 'single', 'd')]}


ALL_OK = {'1': 'b', '2': ['b', 'c'], '3': 'd'}
TWO_OK = {'1': 'b', '2': ['b', 'c'], '3': 'a'}
ONE_OK = {'1': 'b', '2': ['a'], '3': 'a'}
NONE_OK = {'1': 'a', '2': ['a'], '3': 'a'}

subprocess.run([sys.executable, API, 'create-user', 'ad01', 'adminpass1', 'admin', 'Quản trị thử'],
               env=dict(os.environ, PYTHONUTF8='1'), check=True, capture_output=True)
ad = login('ad01', 'adminpass1')
people = [('gv01', 'teacher', [1], 'GV Một'), ('gv02', 'teacher', [2], 'GV Hai'),
          ('sv01', 'student', [1], 'Nguyễn Văn Một'), ('sv02', 'student', [1], 'Trần Thị Hai'),
          ('sv03', 'student', [1], 'Lê Văn Ba'), ('sv04', 'student', [1], 'Phạm Thị Bốn'),
          ('sv05', 'student', [2], 'Hoàng Văn Năm')]
for u, role, subs, name in people:
    st, js, _ = req('POST', '/api/admin/users', {'username': u, 'password': PW, 'profile': {'name': name, 'role': role, 'subjectIds': subs}}, ad)
    assert st == 200, (u, st, js)

con = sqlite3.connect(os.path.join(D, 'studytask.db')); con.isolation_level = None
uid = {n: con.execute('SELECT uid FROM accounts WHERE username=?', (n,)).fetchone()[0] for n, *_ in people}


def patch(name, **kw):
    d = json.loads(con.execute("SELECT data FROM docs WHERE col='user' AND id=?", (uid[name],)).fetchone()[0]); d.update(kw)
    con.execute("UPDATE docs SET data=? WHERE col='user' AND id=?", (json.dumps(d, ensure_ascii=False), uid[name]))


patch('gv01', sections=[{'classId': 'a1', 'subjectId': 1}])
for n in ('sv01', 'sv02', 'sv03', 'sv05'):
    patch(n, classId='a1', className='A1')
patch('sv04', classId='c1', className='C1')

subjects = [{'id': 1, 'name': 'Lập trình Web', 'code': 'WEB101', 'color': '#4e73df', 'credits': 3},
            {'id': 2, 'name': 'Cơ sở dữ liệu', 'code': 'DB101', 'color': '#1cc88a', 'credits': 3}]
qs = [(101, 1, 'Q101 – Kiểm tra HTML'), (102, 1, 'Q102 – Kiểm tra CSS'), (201, 2, 'Q201 – Kiểm tra SQL')]
for status in ('draft', 'active'):
    st, js, _ = req('PUT', '/api/doc/sharedData/global',
                    {'data': {'subjects': subjects, 'quizzes': [quiz(i, s, t, status) for i, s, t in qs]}, 'merge': True}, ad)
    assert st == 200, (status, st, js)

out = {}
for who, qid, ans in (('sv01', 101, ALL_OK), ('sv01', 102, ONE_OK), ('sv02', 101, TWO_OK), ('sv04', 101, NONE_OK)):
    st, js, _ = req('POST', f'/api/quiz/{qid}/submit', {'answers': ans}, login(who))
    assert st == 200, (who, qid, st, js)
    out[f'{who}/{qid}'] = js['score']
st, js, _ = req('POST', '/api/quiz/101/submit', {'answers': NONE_OK}, login('sv01'))
out['sv01/101 nộp lần 2'] = f'{st} {js.get("error", {}).get("code")}'

# Nhật ký cũ không còn là nguồn điểm: ghi thẳng vào CSDL tạm để giả lập dữ liệu trước V3 và nhật ký bị cắt
def put_act(name, events):
    con.execute("INSERT OR REPLACE INTO docs VALUES ('activities', ?, ?)", (uid[name], json.dumps(
        {'uid': uid[name], 'name': dict((n, x) for n, *_, x in people)[name], 'username': name, 'events': events}, ensure_ascii=False)))


act2 = json.loads(con.execute("SELECT data FROM docs WHERE col='activities' AND id=?", (uid['sv02'],)).fetchone()[0])
put_act('sv02', [{'type': 'quiz', 'at': '2026-11-01', 'subjectId': 1, 'refId': 101, 'refTitle': 'cũ', 'score': 10, 'total': 3, 'correct': 3},
                 {'type': 'quiz', 'at': '2026-11-02', 'subjectId': 1, 'refId': 101, 'refTitle': 'cũ', 'score': 9, 'total': 3, 'correct': 3},
                 {'type': 'material', 'at': '2026-11-03', 'subjectId': 1, 'refId': 1, 'refTitle': 'Slide 1'}]
        + [e for e in act2['events'] if e.get('type') != 'quiz'])
put_act('sv05', [{'type': 'quiz', 'at': '2026-11-05', 'subjectId': 2, 'refId': 201, 'refTitle': 'cũ', 'score': 8, 'total': 3, 'correct': 2}])
con.execute("DELETE FROM docs WHERE col='activities' AND id=?", (uid['sv01'],))

print(json.dumps({'diem_chinh_thuc': out, 'uid': uid}, ensure_ascii=False, indent=1))
