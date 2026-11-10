#!/usr/bin/env python3
"""Kiểm thử V4: giới hạn quyền đọc activities/{uid}, kiểm tra trường và kiểu dữ liệu khi ghi.
Chạy trên API tạm (cổng 8795, dữ liệu tạm): python3 tests/server/test_activities.py"""
import http.client, json, os, shutil, subprocess, sys, tempfile, time

DATA = tempfile.mkdtemp()
ENV = dict(os.environ, STUDYTASK_DATA=DATA, STUDYTASK_PORT='8795')
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
PW = 'pass123456'
USERS = (('ad01', 'admin'), ('gv01', 'teacher'), ('gv02', 'teacher'), ('gv03', 'teacher'), ('gv04', 'teacher'),
         ('sv01', 'student'), ('sv02', 'student'), ('sv03', 'student'), ('sv04', 'student'), ('sv05', 'student'), ('sv06', 'student'),
         ('tr01', 'training'), ('fn01', 'finance'))
for name, role in USERS:
    subprocess.run([sys.executable, API, 'create-user', name, PW, role, name.upper()], env=ENV, check=True, capture_output=True)
LOG = open(os.path.join(DATA, 'srv.log'), 'w')
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=LOG, stdout=LOG)
time.sleep(1.5)
fails = []

MATERIAL = {'type': 'material', 'subjectId': 1, 'refId': 7, 'refTitle': 'Slide 1', 'at': '2026-11-01'}
QUIZ = {'type': 'quiz', 'subjectId': 1, 'refId': 'q1', 'refTitle': 'Quiz', 'score': 8.5, 'total': 4, 'correct': 3, 'at': '2026-11-02'}
SCORED = {**QUIZ, 'type': 'homework'}      # sự kiện có điểm nhưng không phải quiz: dùng thử kiểm tra hình thức (điểm, total, correct)
HOMEWORK = {'type': 'homework', 'subjectId': 1, 'refId': 5, 'refTitle': 'Bài 1', 'url': 'https://x.vn/a.pdf', 'fileName': 'a.pdf', 'note': 'Em nộp', 'at': '2026-11-03'}


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

    def append(self, uid, ev, meta=None):
        """Đúng cách utils/firebase.js logActivity gọi API."""
        return self.req('POST', f'/api/doc/activities/{uid}/append',
                        {'field': 'events', 'value': ev, 'set': meta if meta is not None else {'uid': uid, 'name': 'SV', 'username': 'sv'}})[0]


try:
    ad, gv1, gv2, gv3, gv4 = C('ad01'), C('gv01'), C('gv02'), C('gv03'), C('gv04')
    sv1, sv2, sv3, sv4, sv5, sv6 = C('sv01'), C('sv02'), C('sv03'), C('sv04'), C('sv05'), C('sv06')
    tr, fn, anon = C('tr01'), C('fn01'), C()

    # Phân công môn: gv1 dạy môn 1, gv2 dạy môn 2; gv3 chưa có môn; gv4 là hồ sơ cũ không có subjectIds
    ad.put('user', gv1.uid, {'subjectIds': [1]})
    ad.put('user', gv2.uid, {'subjectIds': [2]})
    ad.put('user', gv4.uid, {'name': 'GV04', 'role': 'teacher', 'username': 'gv04'}, merge=False)
    ad.put('user', sv1.uid, {'subjectIds': [1, 3]})
    ad.put('user', sv2.uid, {'subjectIds': [2]})
    ad.put('user', sv3.uid, {'name': 'SV03', 'role': 'student', 'username': 'sv03'}, merge=False)    # hồ sơ cũ: học mọi môn
    ad.put('user', sv6.uid, {'subjectIds': [1]})
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

    # ── Ghi: đúng cách ứng dụng ghi ──
    check('Sinh viên ghi sự kiện xem tài liệu: được', sv5.append(sv5.uid, MATERIAL) == 200)
    check('Sinh viên tự ghi sự kiện quiz: bị từ chối (điểm quiz do máy chủ ghi khi chấm, V3)', sv5.append(sv5.uid, QUIZ) == 403)
    check('Sinh viên tự ghi sự kiện có điểm giả danh quiz kiểu khác vẫn được phép (chỉ loại quiz bị chặn)', sv5.append(sv5.uid, SCORED) == 200)
    check('Sinh viên ghi sự kiện nộp bài: được', sv5.append(sv5.uid, HOMEWORK) == 200)
    check('Ghi lại sự kiện đã có: được và không tạo bản trùng',
          sv5.append(sv5.uid, MATERIAL) == 200 and ad.req('GET', f'/api/doc/activities/{sv5.uid}')[1]['data']['events'] == [MATERIAL, SCORED, HOMEWORK])
    check('Chỉ có các trường bắt buộc: được', sv5.append(sv5.uid, {'type': 'material', 'at': '2026-11-04'}) == 200)
    for name, ev in (('điểm 0', {**SCORED, 'refId': 'b0', 'score': 0}), ('điểm 10', {**SCORED, 'refId': 'b1', 'score': 10}),
                     ('total = correct = 0', {**SCORED, 'refId': 'b2', 'total': 0, 'correct': 0}),
                     ('correct = total', {**SCORED, 'refId': 'b3', 'total': 3, 'correct': 3}),
                     ('note đúng 2000 ký tự', {**HOMEWORK, 'refId': 'b4', 'note': 'a' * 2000})):
        check(f'Biên hợp lệ – {name}: được', sv5.append(sv5.uid, ev) == 200)

    # ── Ghi: sai người ──
    before = ad.req('GET', f'/api/doc/activities/{sv1.uid}')[1]['data']
    for name, who in (('sinh viên khác', sv2), ('giáo viên', gv1), ('Đào tạo', tr), ('Tài chính', fn), ('người chưa đăng nhập', anon)):
        check(f'Ghi vào nhật ký người khác – {name}: bị từ chối', who.append(sv1.uid, SCORED) == 403)

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
    check('Thêm trường lạ vào tài liệu: bị từ chối', sv1.append(sv1.uid, SCORED, {'role': 'admin'}) == 403)
    check('Đặt uid của người khác: bị từ chối', sv1.append(sv1.uid, SCORED, {'uid': sv2.uid}) == 403)
    check('Tên sai kiểu: bị từ chối', sv1.append(sv1.uid, SCORED, {'name': 5}) == 403)
    check('Tên 101 ký tự: bị từ chối', sv1.append(sv1.uid, SCORED, {'name': 'a' * 101}) == 403)
    s, _ = sv1.req('POST', f'/api/doc/activities/{sv1.uid}/append', {'field': 'other', 'value': MATERIAL})
    check('Thêm vào trường khác events: bị từ chối', s == 403, s)

    # ── Ghi qua PUT: không được sửa, xóa, thêm nhiều sự kiện cùng lúc ──
    cur = before['events']
    check('Xóa sạch sự kiện cũ: bị từ chối', sv1.put('activities', sv1.uid, {'events': []}) == 403)
    check('Sửa sự kiện cũ: bị từ chối', sv1.put('activities', sv1.uid, {'events': [{**cur[0], 'refId': 12}]}) == 403)
    check('Thêm 2 sự kiện một lần: bị từ chối', sv1.put('activities', sv1.uid, {'events': cur + [SCORED, HOMEWORK]}) == 403)
    check('Sửa sự kiện cũ và thêm sự kiện mới: bị từ chối', sv1.put('activities', sv1.uid, {'events': [{**cur[0], 'refId': 12}, SCORED]}) == 403)
    check('Chèn sự kiện lên đầu: bị từ chối', sv1.put('activities', sv1.uid, {'events': [SCORED] + cur}) == 403)
    check('events không phải danh sách: bị từ chối', sv1.put('activities', sv1.uid, {'events': 'abc'}) == 403)
    check('events null: bị từ chối', sv1.put('activities', sv1.uid, {'events': None}) == 403)
    check('Ghi đè cả tài liệu bằng trường lạ: bị từ chối', sv1.put('activities', sv1.uid, {'hack': 1}, merge=False) == 403)
    check('Thêm đúng một sự kiện qua PUT: được', sv1.put('activities', sv1.uid, {'events': cur + [SCORED]}) == 200)
    check('Đổi tên hiển thị, giữ nguyên sự kiện: được', sv1.put('activities', sv1.uid, {'name': 'Tên mới'}) == 200)

    # ── Dữ liệu cũ, giới hạn số sự kiện ──
    legacy = {'type': 'old-format', 'extra': True}
    ad.put('activities', sv4.uid, {'events': [legacy]})
    check('Nhật ký có sự kiện kiểu cũ: vẫn thêm được sự kiện mới', sv4.append(sv4.uid, SCORED) == 200)
    ad.put('activities', sv4.uid, {'events': [{**MATERIAL, 'refId': i} for i in range(1999)]})
    check('Sự kiện thứ 2000: được', sv4.append(sv4.uid, SCORED) == 200)
    check('Sự kiện thứ 2001: bị từ chối', sv4.append(sv4.uid, HOMEWORK) == 403)

    # ── Admin, xóa ──
    check('Admin sửa thẳng nhật ký: được', ad.put('activities', sv2.uid, {'events': [legacy]}) == 200)
    check('Sinh viên khác xóa nhật ký: bị từ chối', sv2.req('DELETE', f'/api/doc/activities/{sv1.uid}')[0] == 403)
    check('Giáo viên xóa nhật ký: bị từ chối', gv1.req('DELETE', f'/api/doc/activities/{sv1.uid}')[0] == 403)
    check('Chủ tài khoản xóa nhật ký: được (còn mở, xem docs/thiet-ke/06 mục 8)', sv1.req('DELETE', f'/api/doc/activities/{sv1.uid}')[0] == 200)
    check('Admin xóa nhật ký: được', ad.req('DELETE', f'/api/doc/activities/{sv2.uid}')[0] == 200)

    # ── V3/V4: điểm quiz chỉ do máy chủ ghi khi chấm; sinh viên không tự ghi được ──
    check('Sinh viên không tự ghi được điểm quiz đúng định dạng (V3 đã chặn)', sv5.append(sv5.uid, {**QUIZ, 'refId': 'tu-ghi', 'score': 10, 'correct': 4}) == 403)
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
