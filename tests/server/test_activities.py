#!/usr/bin/env python3
"""Kiểm thử V4: giới hạn quyền đọc activities/{uid}, kiểm tra trường và kiểu dữ liệu khi ghi.
Tuần 6 (việc 8) thêm 3 điểm còn mở: sinh viên không ghi/sửa/xóa được điểm quiz, sinh viên không xóa được nhật ký,
giáo viên chỉ nhận sự kiện của môn mình dạy.
Chạy trên API tạm (cổng 8795, dữ liệu tạm): python3 tests/server/test_activities.py"""
import http.client, json, os, shutil, subprocess, sys, tempfile, time

DATA = tempfile.mkdtemp()
ENV = dict(os.environ, STUDYTASK_DATA=DATA, STUDYTASK_PORT='8795')
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
PW = 'pass123456'
USERS = (('ad01', 'admin'), ('gv01', 'teacher'), ('gv02', 'teacher'), ('gv03', 'teacher'), ('gv04', 'teacher'),
         ('sv01', 'student'), ('sv02', 'student'), ('sv03', 'student'), ('sv04', 'student'), ('sv05', 'student'), ('sv06', 'student'),
         ('sv07', 'student'), ('gv05', 'teacher'), ('tr01', 'training'), ('fn01', 'finance'))
for name, role in USERS:
    subprocess.run([sys.executable, API, 'create-user', name, PW, role, name.upper()], env=ENV, check=True, capture_output=True)
LOG = open(os.path.join(DATA, 'srv.log'), 'w')
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=LOG, stdout=LOG)
time.sleep(1.5)
fails = []

MATERIAL = {'type': 'material', 'subjectId': 1, 'refId': 7, 'refTitle': 'Slide 1', 'at': '2026-11-01'}
QUIZ = {'type': 'quiz', 'subjectId': 1, 'refId': 'q1', 'refTitle': 'Quiz', 'score': 8.5, 'total': 4, 'correct': 3, 'at': '2026-11-02'}
SCORED = {**QUIZ, 'type': 'homework'}      # sự kiện có điểm nhưng không phải quiz: sinh viên không được ghi (lỗi 1 V4)
HOMEWORK = {'type': 'homework', 'subjectId': 1, 'refId': 5, 'refTitle': 'Bài 1', 'url': 'https://x.vn/a.pdf', 'fileName': 'a.pdf', 'note': 'Em nộp', 'at': '2026-11-03'}
MAT2 = {**MATERIAL, 'refId': 8, 'refTitle': 'Slide 2'}   # một sự kiện hợp lệ khác MATERIAL, dùng cho các ca ghi đúng/sai hình thức tài liệu


def quiz_def(qid, subject, status):
    """Đề 2 câu, đáp án đúng: câu 1 là b, câu 2 là b và c (giống tests/server/test_quiz_v3.py)."""
    return {'id': qid, 'subjectId': subject, 'title': f'De {qid}', 'description': '', 'dueDate': '2099-12-31', 'status': status,
            'createdAt': '2026-11-09T00:00:00Z', 'questions': [
                {'id': 1, 'text': 'Cau 1', 'type': 'single', 'answers': [{'id': a, 'text': a.upper(), 'correct': a == 'b'} for a in 'abcd']},
                {'id': 2, 'text': 'Cau 2', 'type': 'multiple', 'answers': [{'id': a, 'text': a.upper(), 'correct': a in 'bc'} for a in 'abcd']}]}


def check(name, cond, extra=''):
    print(('PASS ' if cond else 'FAIL ') + name + ((' | ' + str(extra)) if (extra and not cond) else ''))
    if not cond:
        fails.append(name)


class C:
    def __init__(self, user=None):
        self.cookie, self.uid = '', None
        if user:
            s, j = self.req('POST', '/api/auth/login', {'username': user, 'password': PW})
            self.uid = j['user']['uid']

    def req(self, method, path, body=None):
        c = http.client.HTTPConnection('127.0.0.1', 8795, timeout=30)
        h = {'Cookie': self.cookie, 'Origin': 'http://127.0.0.1:8795'}
        data = None
        if body is not None:
            data = json.dumps(body).encode(); h['Content-Type'] = 'application/json'
        c.request(method, path, body=data, headers=h)
        r = c.getresponse()
        sc = r.getheader('Set-Cookie')
        if sc and 'st_session=' in sc:
            self.cookie = sc.split(';')[0]
        txt = r.read().decode()
        try:
            return r.status, json.loads(txt)
        except ValueError:
            return r.status, txt

    def put(self, col, uid, data, merge=True):
        return self.req('PUT', f'/api/doc/{col}/{uid}', {'data': data, 'merge': merge})[0]

    def read(self, uid):
        return self.req('GET', f'/api/doc/activities/{uid}')[0]

    def visible(self):
        s, j = self.req('GET', '/api/doc/activities')
        return {d['id'] for d in j['docs']} if s == 200 else None

    def events(self, uid):
        """Sự kiện của activities/{uid} mà người này nhận được khi đọc một tài liệu (None nếu bị từ chối)."""
        s, j = self.req('GET', f'/api/doc/activities/{uid}')
        return (j['data'] or {}).get('events', []) if s == 200 else None

    def listed_events(self, uid):
        """Sự kiện của uid trong danh sách /api/doc/activities (trang Quản lý lớp học, Bảng điểm đọc qua đây)."""
        s, j = self.req('GET', '/api/doc/activities')
        return next((d.get('events', []) for d in j['docs'] if d['id'] == uid), None) if s == 200 else None

    def append(self, uid, ev, meta=None):
        """Đúng cách utils/firebase.js logActivity gọi API."""
        return self.req('POST', f'/api/doc/activities/{uid}/append',
                        {'field': 'events', 'value': ev, 'set': meta if meta is not None else {'uid': uid, 'name': 'SV', 'username': 'sv'}})[0]


try:
    ad, gv1, gv2, gv3, gv4, gv5 = C('ad01'), C('gv01'), C('gv02'), C('gv03'), C('gv04'), C('gv05')
    sv1, sv2, sv3, sv4, sv5, sv6, sv7 = C('sv01'), C('sv02'), C('sv03'), C('sv04'), C('sv05'), C('sv06'), C('sv07')
    tr, fn, anon = C('tr01'), C('fn01'), C()

    # Phân công môn: gv1 dạy môn 1, gv2 dạy môn 2; gv3 chưa có môn; gv4 là hồ sơ cũ không có subjectIds
    ad.put('user', gv1.uid, {'subjectIds': [1]})
    ad.put('user', gv2.uid, {'subjectIds': [2]})
    ad.put('user', gv4.uid, {'name': 'GV04', 'role': 'teacher', 'username': 'gv04'}, merge=False)
    ad.put('user', sv1.uid, {'subjectIds': [1, 3]})
    ad.put('user', sv2.uid, {'subjectIds': [2]})
    ad.put('user', sv3.uid, {'name': 'SV03', 'role': 'student', 'username': 'sv03'}, merge=False)    # hồ sơ cũ: học mọi môn
    ad.put('user', sv6.uid, {'subjectIds': [1]})
    ad.put('user', sv7.uid, {'subjectIds': [1]})
    ad.put('user', gv5.uid, {'subjectIds': [1, 3]})      # gv5 dạy cả môn 1 và môn 3
    for sv in (sv1, sv2, sv3, sv4, sv6):
        sv.append(sv.uid, MATERIAL)

    # ── Đọc từng tài liệu ──
    check('Chủ tài khoản đọc nhật ký của mình: được', sv1.read(sv1.uid) == 200)
    check('Admin đọc nhật ký của sinh viên: được', ad.read(sv1.uid) == 200)
    check('Giáo viên dạy chung môn đọc: được', gv1.read(sv1.uid) == 200)
    check('Giáo viên không dạy chung môn đọc: bị từ chối', gv2.read(sv1.uid) == 403)
    check('Giáo viên chưa được phân môn đọc: bị từ chối', gv3.read(sv1.uid) == 403)
    check('Giáo viên hồ sơ cũ không có subjectIds đọc: bị từ chối', gv4.read(sv1.uid) == 403)
    check('Sinh viên khác đọc: bị từ chối', sv2.read(sv1.uid) == 403)
    check('Phòng Đào tạo đọc: bị từ chối', tr.read(sv1.uid) == 403)
    check('Phòng Tài chính đọc: bị từ chối', fn.read(sv1.uid) == 403)
    check('Chưa đăng nhập đọc: bị từ chối', anon.read(sv1.uid) == 403)
    check('Sinh viên hồ sơ cũ (học mọi môn): giáo viên có môn đọc được', gv1.read(sv3.uid) == 200 and gv2.read(sv3.uid) == 200)
    check('Sinh viên hồ sơ cũ: giáo viên chưa có môn vẫn bị từ chối', gv3.read(sv3.uid) == 403)
    check('Sinh viên có danh sách môn rỗng: giáo viên bị từ chối', gv1.read(sv4.uid) == 403)

    # ── Danh sách (trang Quản lý lớp học, Bảng điểm) lọc theo từng tài liệu ──
    all_ids = {sv1.uid, sv2.uid, sv3.uid, sv4.uid, sv6.uid}
    check('Admin thấy nhật ký của mọi sinh viên', ad.visible() == all_ids, ad.visible())
    check('Giáo viên chỉ thấy sinh viên chung môn và hồ sơ cũ', gv1.visible() == {sv1.uid, sv3.uid, sv6.uid}, gv1.visible())
    check('Giáo viên môn khác chỉ thấy lớp của mình và hồ sơ cũ', gv2.visible() == {sv2.uid, sv3.uid}, gv2.visible())
    check('Giáo viên chưa có môn không thấy ai', gv3.visible() == set(), gv3.visible())
    check('Sinh viên chỉ thấy nhật ký của mình', sv1.visible() == {sv1.uid}, sv1.visible())
    check('Đào tạo, Tài chính, người chưa đăng nhập không thấy ai', tr.visible() == set() and fn.visible() == set() and anon.visible() == set())

    # ── Quyền đọc đổi theo phân công ──
    ad.put('user', gv1.uid, {'subjectIds': [9]})
    check('Giáo viên thôi dạy môn chung: mất quyền đọc', gv1.read(sv1.uid) == 403)
    ad.put('user', gv1.uid, {'subjectIds': [1]})
    check('Giáo viên được phân lại môn: có lại quyền đọc', gv1.read(sv1.uid) == 200)
    s, _ = ad.req('DELETE', f'/api/doc/user/{sv6.uid}')
    check('Sinh viên đã xóa hồ sơ: giáo viên bị từ chối, Admin vẫn đọc được', s == 200 and gv1.read(sv6.uid) == 403 and ad.read(sv6.uid) == 200)

    # ── Lỗi 3 V4: giáo viên chỉ nhận sự kiện của môn mình dạy ──
    # sv1 học môn 1 và 3: có sự kiện môn 1, môn 3 và một sự kiện không ghi môn; sv3 hồ sơ cũ có sự kiện môn 1 và môn 2
    EV_M3 = {**MATERIAL, 'subjectId': 3, 'refId': 31, 'refTitle': 'Slide môn 3'}
    EV_NOSUB = {'type': 'material', 'refId': 'chung', 'at': '2026-11-05'}
    EV_M2 = {**MATERIAL, 'subjectId': 2, 'refId': 21, 'refTitle': 'Slide môn 2'}
    sv1.append(sv1.uid, EV_M3); sv1.append(sv1.uid, EV_NOSUB); sv3.append(sv3.uid, EV_M2)
    full_sv1 = ad.events(sv1.uid)
    check('Chuẩn bị: nhật ký sv1 có đủ sự kiện môn 1, môn 3, không ghi môn', full_sv1 == [MATERIAL, EV_M3, EV_NOSUB], full_sv1)
    check('Giáo viên môn 1 đọc nhật ký sv1: chỉ nhận sự kiện môn 1', gv1.events(sv1.uid) == [MATERIAL], gv1.events(sv1.uid))
    check('Giáo viên môn 1 xem danh sách: sv1 chỉ còn sự kiện môn 1', gv1.listed_events(sv1.uid) == [MATERIAL], gv1.listed_events(sv1.uid))
    check('Giáo viên môn 1 không nhận sự kiện môn 3 qua bất kỳ đường đọc nào',
          all(e.get('subjectId') == 1 for d in gv1.req('GET', '/api/doc/activities')[1]['docs'] for e in d.get('events', [])))
    check('Giáo viên dạy môn 1 và 3: nhận cả sự kiện môn 1 và môn 3, không nhận sự kiện không ghi môn',
          gv5.events(sv1.uid) == [MATERIAL, EV_M3], gv5.events(sv1.uid))
    check('Giáo viên môn 2 đọc sinh viên hồ sơ cũ: chỉ nhận sự kiện môn 2', gv2.events(sv3.uid) == [EV_M2], gv2.events(sv3.uid))
    check('Giáo viên môn 2 đổi uid sang sinh viên lớp khác: vẫn bị từ chối', gv2.read(sv1.uid) == 403 and gv2.events(sv1.uid) is None)
    check('Giáo viên môn 2 xem danh sách: không có sv1, sv3 chỉ còn sự kiện môn 2',
          gv2.listed_events(sv1.uid) is None and gv2.listed_events(sv3.uid) == [EV_M2])
    check('Admin vẫn nhận đầy đủ sự kiện (đọc một tài liệu và danh sách)',
          ad.events(sv1.uid) == full_sv1 and ad.listed_events(sv1.uid) == full_sv1 and ad.events(sv3.uid) == [MATERIAL, EV_M2])
    check('Chủ tài khoản vẫn nhận đầy đủ sự kiện của mình', sv1.events(sv1.uid) == full_sv1 and sv1.listed_events(sv1.uid) == full_sv1)
    check('Lọc chỉ ở bản trả về: dữ liệu lưu không bị mất sau khi giáo viên đọc', ad.events(sv1.uid) == full_sv1)
    ad.put('activities', sv4.uid, {'events': [{**MATERIAL, 'subjectId': True}, {**MATERIAL, 'subjectId': '1'}]})
    ad.put('user', sv4.uid, {'subjectIds': [1]})
    check('Sự kiện cũ có subjectId sai kiểu (true, "1"): giáo viên môn 1 không nhận', gv1.events(sv4.uid) == [], gv1.events(sv4.uid))
    ad.put('user', sv4.uid, {'subjectIds': []})
    ad.put('activities', sv4.uid, {'events': [MATERIAL]})

    # ── Ghi: đúng cách ứng dụng ghi ──
    check('Sinh viên ghi sự kiện xem tài liệu: được', sv5.append(sv5.uid, MATERIAL) == 200)
    check('Sinh viên tự ghi sự kiện quiz: bị từ chối (điểm quiz do máy chủ ghi khi chấm, V3)', sv5.append(sv5.uid, QUIZ) == 403)
    check('Sinh viên tự ghi sự kiện có điểm giả danh quiz kiểu khác (homework + score): bị từ chối (lỗi 1 V4)', sv5.append(sv5.uid, SCORED) == 403)
    for k in ('score', 'total', 'correct'):
        check(f'Sinh viên ghi sự kiện xem tài liệu kèm `{k}`: bị từ chối', sv5.append(sv5.uid, {**MATERIAL, 'refId': f'k-{k}', k: 0}) == 403)
    check('Sinh viên ghi sự kiện nộp bài: được', sv5.append(sv5.uid, HOMEWORK) == 200)
    check('Ghi lại sự kiện đã có: được và không tạo bản trùng',
          sv5.append(sv5.uid, MATERIAL) == 200 and ad.req('GET', f'/api/doc/activities/{sv5.uid}')[1]['data']['events'] == [MATERIAL, HOMEWORK])
    check('Chỉ có các trường bắt buộc: được', sv5.append(sv5.uid, {'type': 'material', 'at': '2026-11-04'}) == 200)
    for name, ev in (('note đúng 2000 ký tự', {**HOMEWORK, 'refId': 'b4', 'note': 'a' * 2000}),
                     ('refTitle đúng 500 ký tự', {**MATERIAL, 'refId': 'b5', 'refTitle': 'a' * 500}),
                     ('url đúng 2048 ký tự', {**HOMEWORK, 'refId': 'b6', 'url': 'a' * 2048}),
                     ('fileName đúng 255 ký tự', {**HOMEWORK, 'refId': 'b7', 'fileName': 'a' * 255})):
        check(f'Biên hợp lệ – {name}: được', sv5.append(sv5.uid, ev) == 200)

    # ── Ghi: sai người ──
    before = ad.req('GET', f'/api/doc/activities/{sv1.uid}')[1]['data']
    for name, who in (('sinh viên khác', sv2), ('giáo viên', gv1), ('Đào tạo', tr), ('Tài chính', fn), ('người chưa đăng nhập', anon)):
        check(f'Ghi vào nhật ký người khác – {name}: bị từ chối', who.append(sv1.uid, MAT2) == 403)
        check(f'Ghi sự kiện quiz vào nhật ký người khác – {name}: bị từ chối', who.append(sv1.uid, QUIZ) == 403)

    # ── Ghi: sự kiện sai hình thức ──
    BAD = (('loại lạ', {**MATERIAL, 'type': 'hacked'}), ('thiếu loại', {'at': '2026-11-01'}), ('loại sai kiểu', {**MATERIAL, 'type': ['quiz']}),
           ('thiếu ngày', {'type': 'material'}), ('ngày sai định dạng', {**MATERIAL, 'at': '01/11/2026'}), ('ngày thừa ký tự', {**MATERIAL, 'at': '2026-11-01x'}),
           ('ngày sai kiểu', {**MATERIAL, 'at': 20261101}), ('trường lạ', {**MATERIAL, 'role': 'admin'}),
           ('sự kiện không phải đối tượng', 'abc'), ('sự kiện rỗng', None),
           ('subjectId là chuỗi', {**MATERIAL, 'subjectId': '1'}), ('subjectId là true', {**MATERIAL, 'refId': 99, 'subjectId': True}),
           ('refId là danh sách', {**MATERIAL, 'refId': [1]}), ('refId là true', {**MATERIAL, 'refId': True}),
           ('refTitle sai kiểu', {**MATERIAL, 'refTitle': 5}), ('refTitle 501 ký tự', {**MATERIAL, 'refTitle': 'a' * 501}),
           ('url 2049 ký tự', {**HOMEWORK, 'url': 'a' * 2049}), ('fileName 256 ký tự', {**HOMEWORK, 'fileName': 'a' * 256}),
           ('note 2001 ký tự', {**HOMEWORK, 'note': 'a' * 2001}), ('note sai kiểu', {**HOMEWORK, 'note': ['a']}),
           ('điểm là chuỗi', {**SCORED, 'score': '9'}), ('điểm âm', {**SCORED, 'score': -1}), ('điểm trên 10', {**SCORED, 'score': 10.5}),
           ('điểm là true', {**SCORED, 'score': True}), ('điểm null', {**SCORED, 'score': None}), ('điểm NaN', {**SCORED, 'score': float('nan')}),
           ('điểm Infinity', {**SCORED, 'score': float('inf')}), ('subjectId NaN', {**MATERIAL, 'subjectId': float('nan')}),
           ('total là chuỗi', {**SCORED, 'total': '4'}), ('total âm', {**SCORED, 'total': -1, 'correct': -2}), ('total lẻ', {**SCORED, 'total': 4.5}),
           ('total là true', {**SCORED, 'total': True, 'correct': 0}), ('correct là chuỗi', {**SCORED, 'correct': '3'}), ('correct âm', {**SCORED, 'correct': -1}),
           ('correct lẻ', {**SCORED, 'correct': 1.5}), ('correct là true', {**SCORED, 'correct': True}), ('correct lớn hơn total', {**SCORED, 'total': 3, 'correct': 4}))
    for name, ev in BAD:
        check(f'Sự kiện sai – {name}: bị từ chối', sv1.append(sv1.uid, ev) == 403)
    check('Sau mọi lần ghi sai, nhật ký không đổi', ad.req('GET', f'/api/doc/activities/{sv1.uid}')[1]['data'] == before)

    # ── Ghi: sai tài liệu ──
    check('Thêm trường lạ vào tài liệu: bị từ chối', sv1.append(sv1.uid, MAT2, {'role': 'admin'}) == 403)
    check('Đặt uid của người khác: bị từ chối', sv1.append(sv1.uid, MAT2, {'uid': sv2.uid}) == 403)
    check('Tên sai kiểu: bị từ chối', sv1.append(sv1.uid, MAT2, {'name': 5}) == 403)
    check('Tên 101 ký tự: bị từ chối', sv1.append(sv1.uid, MAT2, {'name': 'a' * 101}) == 403)
    s, _ = sv1.req('POST', f'/api/doc/activities/{sv1.uid}/append', {'field': 'other', 'value': MATERIAL})
    check('Thêm vào trường khác events: bị từ chối', s == 403, s)

    # ── Ghi qua PUT: không được sửa, xóa, thêm nhiều sự kiện cùng lúc ──
    cur = before['events']
    check('Xóa sạch sự kiện cũ: bị từ chối', sv1.put('activities', sv1.uid, {'events': []}) == 403)
    check('Sửa sự kiện cũ: bị từ chối', sv1.put('activities', sv1.uid, {'events': [{**cur[0], 'refId': 12}]}) == 403)
    check('Thêm 2 sự kiện một lần: bị từ chối', sv1.put('activities', sv1.uid, {'events': cur + [MAT2, HOMEWORK]}) == 403)
    check('Sửa sự kiện cũ và thêm sự kiện mới: bị từ chối', sv1.put('activities', sv1.uid, {'events': [{**cur[0], 'refId': 12}, MAT2]}) == 403)
    check('Chèn sự kiện lên đầu: bị từ chối', sv1.put('activities', sv1.uid, {'events': [MAT2] + cur}) == 403)
    check('events không phải danh sách: bị từ chối', sv1.put('activities', sv1.uid, {'events': 'abc'}) == 403)
    check('events null: bị từ chối', sv1.put('activities', sv1.uid, {'events': None}) == 403)
    check('Ghi đè cả tài liệu bằng trường lạ: bị từ chối', sv1.put('activities', sv1.uid, {'hack': 1}, merge=False) == 403)
    check('Thêm một sự kiện có điểm qua PUT: bị từ chối', sv1.put('activities', sv1.uid, {'events': cur + [SCORED]}) == 403)
    check('Thêm đúng một sự kiện qua PUT: được', sv1.put('activities', sv1.uid, {'events': cur + [MAT2]}) == 200)
    check('Đổi tên hiển thị, giữ nguyên sự kiện: được', sv1.put('activities', sv1.uid, {'name': 'Tên mới'}) == 200)

    # ── Dữ liệu cũ, giới hạn số sự kiện ──
    legacy = {'type': 'old-format', 'extra': True}
    ad.put('activities', sv4.uid, {'events': [legacy]})
    check('Nhật ký có sự kiện kiểu cũ: vẫn thêm được sự kiện mới', sv4.append(sv4.uid, MAT2) == 200)
    ad.put('activities', sv4.uid, {'events': [{**MATERIAL, 'refId': i} for i in range(1999)]})
    check('Sự kiện thứ 2000: được', sv4.append(sv4.uid, MAT2) == 200)
    check('Sự kiện thứ 2001: bị từ chối', sv4.append(sv4.uid, HOMEWORK) == 403)

    # ── Lỗi 2 V4: chỉ Admin xóa nhật ký ──
    check('Admin sửa thẳng nhật ký: được', ad.put('activities', sv2.uid, {'events': [legacy]}) == 200)
    own = ad.events(sv1.uid)
    s, j = sv1.req('DELETE', f'/api/doc/activities/{sv1.uid}')
    check('Sinh viên xóa nhật ký của chính mình: bị từ chối (403 permission-denied)',
          s == 403 and isinstance(j, dict) and j.get('error', {}).get('code') == 'permission-denied', (s, j))
    check('Sau khi sinh viên thử xóa, nhật ký còn nguyên', ad.events(sv1.uid) == own)
    check('Sinh viên xóa nhật ký của sinh viên khác: bị từ chối', sv2.req('DELETE', f'/api/doc/activities/{sv1.uid}')[0] == 403)
    check('Sinh viên hồ sơ cũ xóa nhật ký của mình: bị từ chối', sv3.req('DELETE', f'/api/doc/activities/{sv3.uid}')[0] == 403)
    check('Giáo viên dạy môn xóa nhật ký sinh viên: bị từ chối', gv1.req('DELETE', f'/api/doc/activities/{sv1.uid}')[0] == 403)
    check('Đào tạo, Tài chính, người chưa đăng nhập xóa nhật ký: bị từ chối',
          all(x.req('DELETE', f'/api/doc/activities/{sv1.uid}')[0] == 403 for x in (tr, fn, anon)))
    check('Sinh viên xóa sạch nhật ký bằng PUT ghi đè: bị từ chối', sv1.put('activities', sv1.uid, {}, merge=False) == 403)
    check('Admin xóa nhật ký: được', ad.req('DELETE', f'/api/doc/activities/{sv2.uid}')[0] == 200 and ad.read(sv2.uid) == 200
          and ad.req('GET', f'/api/doc/activities/{sv2.uid}')[1]['exists'] is False)
    s, _ = ad.req('DELETE', f'/api/admin/users/{sv4.uid}')
    check('Admin xóa tài khoản: nhật ký của tài khoản đó bị xóa theo', s == 200 and ad.req('GET', f'/api/doc/activities/{sv4.uid}')[1]['exists'] is False)

    # ── V3/V4: điểm quiz chỉ do máy chủ ghi khi chấm; sinh viên không tự ghi được ──
    check('Sinh viên không tự ghi được điểm quiz đúng định dạng (V3 đã chặn)', sv5.append(sv5.uid, {**QUIZ, 'refId': 'tu-ghi', 'score': 10, 'correct': 4}) == 403)

    # ── Lỗi 1 V4: luồng chấm thật; sinh viên không ghi, sửa, xóa được điểm quiz máy chủ đã ghi ──
    ad.put('user', gv1.uid, {'subjectIds': [1]})
    s1 = gv1.put('sharedData', 'global', {'quizzes': [quiz_def(1, 1, 'draft')]})
    s2 = gv1.put('sharedData', 'global', {'quizzes': [quiz_def(1, 1, 'active')]})
    check('Chuẩn bị: giáo viên môn 1 tạo và mở đề', s1 == 200 and s2 == 200, (s1, s2))
    s, j = sv7.req('POST', '/api/quiz/1/submit', {'answers': {'1': 'a', '2': ['a']}, 'score': 10, 'correct': 2, 'total': 2})
    check('Sinh viên nộp bài kèm score=10 tự đặt: máy chủ bỏ qua, chấm 0 điểm', s == 200 and j.get('score') == 0 and j.get('correct') == 0, (s, j))
    graded = [e for e in (ad.events(sv7.uid) or []) if e.get('type') == 'quiz']
    check('Máy chủ ghi một sự kiện quiz 0 điểm vào nhật ký', len(graded) == 1 and graded[0]['score'] == 0 and graded[0]['refId'] == 1, graded)
    log7 = ad.events(sv7.uid)
    forged = {**graded[0], 'score': 10, 'correct': 2}
    check('Sinh viên thêm sự kiện quiz 10 điểm cho cùng đề (bản mới nhất được Bảng điểm lấy): bị từ chối', sv7.append(sv7.uid, forged) == 403)
    check('Sinh viên sửa điểm sự kiện quiz qua PUT: bị từ chối', sv7.put('activities', sv7.uid, {'events': [forged]}) == 403)
    check('Sinh viên xóa sự kiện quiz qua PUT: bị từ chối', sv7.put('activities', sv7.uid, {'events': []}) == 403)
    check('Sinh viên ghi đè cả nhật ký bằng sự kiện quiz 10 điểm: bị từ chối',
          sv7.put('activities', sv7.uid, {'uid': sv7.uid, 'events': [forged]}, merge=False) == 403)
    check('Sinh viên xóa nhật ký để mất điểm kém: bị từ chối', sv7.req('DELETE', f'/api/doc/activities/{sv7.uid}')[0] == 403)
    check('Sinh viên nộp lại để lấy điểm khác: bị từ chối (409)', sv7.req('POST', '/api/quiz/1/submit', {'answers': {'1': 'b', '2': ['b', 'c']}})[0] == 409)
    check('Sinh viên ghi trực tiếp quizResults: bị từ chối',
          sv7.put('quizResults', f'1_{sv7.uid}', {'uid': sv7.uid, 'quizId': 1, 'score': 10}) == 403
          and sv7.req('DELETE', f'/api/doc/quizResults/1_{sv7.uid}')[0] == 403)
    check('Sau mọi lần thử, nhật ký và điểm 0 còn nguyên', ad.events(sv7.uid) == log7)
    s, j = sv7.req('GET', '/api/quiz/mine')
    check('Kết quả chính thức (quizResults) vẫn là 0 điểm', s == 200 and [r['score'] for r in j['results']] == [0], (s, j))
    check('Giáo viên dạy môn thấy đúng điểm 0 trong nhật ký (Bảng điểm, Quản lý lớp học)',
          [e['score'] for e in gv1.listed_events(sv7.uid) if e.get('type') == 'quiz'] == [0])
    s, j = gv1.req('GET', '/api/quiz/1/results')
    check('Giáo viên dạy môn xem kết quả đề: 0 điểm', s == 200 and [r['score'] for r in j['results']] == [0], (s, j))
    check('Giáo viên không dạy môn xem kết quả đề: bị từ chối', gv2.req('GET', '/api/quiz/1/results')[0] == 403)
    check('Sinh viên xem kết quả cả lớp: bị từ chối', sv7.req('GET', '/api/quiz/1/results')[0] == 403)
    s, j = sv1.req('POST', '/api/quiz/1/submit', {'answers': {'1': 'b', '2': ['b', 'c']}})
    check('Sinh viên khác nộp đúng hết: máy chủ chấm 10 điểm (luồng hợp lệ không bị ảnh hưởng)', s == 200 and j.get('score') == 10, (s, j))
    check('Sự kiện quiz của máy chủ thêm được vào nhật ký đã có sự kiện khác',
          [e['score'] for e in ad.events(sv1.uid) if e.get('type') == 'quiz'] == [10])
    check('Admin vẫn sửa được nhật ký (quyền quản trị giữ nguyên)', ad.put('activities', sv7.uid, {'events': log7 + [MAT2]}) == 200
          and ad.events(sv7.uid) == log7 + [MAT2])
finally:
    srv.terminate()
    try:
        srv.wait(5)
    except Exception:
        srv.kill()
    LOG.close()
    shutil.rmtree(DATA, ignore_errors=True)

print('KẾT QUẢ:', 'ĐẠT' if not fails else 'CÓ LỖI: ' + '; '.join(fails))
sys.exit(1 if fails else 0)
