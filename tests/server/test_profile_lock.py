#!/usr/bin/env python3
"""Kiểm thử: sinh viên/giáo viên chỉ được tự sửa email và số điện thoại; các trường còn lại do Admin cấp.
Chạy trên API tạm (cổng 8794, dữ liệu tạm): python3 tests/server/test_profile_lock.py"""
import http.client, json, os, shutil, subprocess, sys, tempfile, time

DATA = tempfile.mkdtemp()
ENV = dict(os.environ, STUDYTASK_DATA=DATA, STUDYTASK_PORT='8794')
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
USERS = (('gv01', 'tpass12345', 'teacher', 'Giao Vien'), ('sv01', 'spass12345', 'student', 'Sinh Vien'),
         ('sv02', 'spass12346', 'student', 'Sinh Vien Hai'), ('ad01', 'apass12345', 'admin', 'Quan Tri'),
         ('tr01', 'tpass12346', 'training', 'Dao Tao'))
for a in USERS:
    subprocess.run([sys.executable, API, 'create-user', *a], env=ENV, check=True, capture_output=True)
LOG = open(os.path.join(DATA, 'srv.log'), 'w')
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=LOG, stdout=LOG)
for _ in range(75):      # chờ API trả lời thật thay vì sleep cố định; API chết thì báo lỗi ngay
    if srv.poll() is not None:
        print('FAIL API thoát ngay khi khởi động (mã %s), có thể trùng cổng 8794' % srv.returncode); shutil.rmtree(DATA, ignore_errors=True); sys.exit(1)
    try:
        _c = http.client.HTTPConnection('127.0.0.1', 8794, timeout=1); _c.request('GET', '/api/auth/me')
        if _c.getresponse().status == 200:
            break
    except OSError:
        pass
    time.sleep(0.2)
else:
    srv.terminate(); print('FAIL API không sẵn sàng sau 15 giây'); shutil.rmtree(DATA, ignore_errors=True); sys.exit(1)
fails = []


def check(name, cond, extra=''):
    print(('PASS ' if cond else 'FAIL ') + name + ((' | ' + str(extra)) if (extra and not cond) else ''))
    if not cond:
        fails.append(name)


class C:
    def __init__(self, user, pw):
        self.cookie = ''
        s, j = self.req('POST', '/api/auth/login', {'username': user, 'password': pw})
        self.uid = j['user']['uid']

    def req(self, method, path, body=None):
        c = http.client.HTTPConnection('127.0.0.1', 8794, timeout=10)
        h = {'Cookie': self.cookie, 'Origin': 'http://127.0.0.1:8794'}
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

    def put(self, col, uid, data):
        return self.req('PUT', f'/api/doc/{col}/{uid}', {'data': data, 'merge': True})

    def get(self, col, uid):
        s, j = self.req('GET', f'/api/doc/{col}/{uid}')
        return (j or {}).get('data') or {}


try:
    sv, sv2, gv, ad, tr = (C(u[0], u[1]) for u in (USERS[1], USERS[2], USERS[0], USERS[3], USERS[4]))

    # Admin cấp hồ sơ học vụ cho sinh viên
    s, _ = ad.put('userData', sv.uid, {'profile': {'name': 'Sinh Vien', 'studentId': '24TX810001', 'major': 'KTPM', 'gpa': '3.20'}})
    check('Admin cấp được hồ sơ học vụ (mã số, ngành, GPA)', s == 200, s)

    # Sinh viên sửa email + sđt: được
    s, _ = sv.put('userData', sv.uid, {'profile': {'email': 'sv01@gmail.com', 'phone': '0901234567'}})
    p = sv.get('userData', sv.uid).get('profile', {})
    check('Sinh viên sửa email và số điện thoại: được', s == 200 and p.get('email') == 'sv01@gmail.com' and p.get('phone') == '0901234567', (s, p))
    check('Hồ sơ học vụ do Admin cấp vẫn còn nguyên', p.get('studentId') == '24TX810001' and p.get('major') == 'KTPM' and p.get('gpa') == '3.20', p)

    # Sinh viên cố sửa GPA, ngành, mã số, họ tên qua userData: bị bỏ qua
    sv.put('userData', sv.uid, {'profile': {'gpa': '4.00', 'major': 'Khác', 'studentId': 'HACK', 'name': 'Tên giả', 'phone': '0907654321'}})
    p = sv.get('userData', sv.uid).get('profile', {})
    check('Sinh viên không sửa được GPA/ngành/mã số/họ tên (bị bỏ qua)',
          p.get('gpa') == '3.20' and p.get('major') == 'KTPM' and p.get('studentId') == '24TX810001' and p.get('name') == 'Sinh Vien', p)
    check('Cùng lần đó, số điện thoại hợp lệ vẫn được lưu', p.get('phone') == '0907654321', p)

    # Lỗi PR35 mục 4.1: chỉ cần MỘT yêu cầu ghi userData là cả userData.profile.phone và user.phone cùng đổi
    # (giao diện báo quá hạn sau khi yêu cầu đầu đã tới máy chủ thì hai nơi không còn lệch nhau)
    sv.put('userData', sv.uid, {'profile': {'email': 'sv01@gmail.com', 'phone': '0912345678'}})
    check('Một lần ghi userData cũng cập nhật user.phone (không còn lệch hai nơi)',
          sv.get('user', sv.uid).get('phone') == '0912345678' and sv.get('userData', sv.uid)['profile'].get('phone') == '0912345678',
          (sv.get('user', sv.uid).get('phone'), sv.get('userData', sv.uid)['profile'].get('phone')))
    sv.put('userData', sv.uid, {'profile': {'email': 'moi@gmail.com'}})
    check('Chỉ đổi email thì số điện thoại ở user giữ nguyên', sv.get('user', sv.uid).get('phone') == '0912345678', sv.get('user', sv.uid))
    # Chỉ đồng bộ khi chính yêu cầu có gửi profile.phone: Admin đổi user.phone riêng, rồi sinh viên sửa email/thư viện thì không bị ghi đè bằng số cũ
    ad.put('user', sv.uid, {'phone': '0988888888'})
    sv.put('userData', sv.uid, {'profile': {'email': 'khac@gmail.com'}})
    sv.put('userData', sv.uid, {'library': [{'id': 2}]})
    check('Sửa email hoặc dữ liệu khác (không gửi phone) không ghi đè user.phone do nơi khác đã đổi',
          sv.get('user', sv.uid).get('phone') == '0988888888' and sv.get('userData', sv.uid)['profile'].get('phone') == '0912345678',
          (sv.get('user', sv.uid).get('phone'), sv.get('userData', sv.uid)['profile'].get('phone')))
    sv.put('userData', sv.uid, {'profile': {'phone': '0912345678'}})
    check('Gửi lại profile.phone thì đồng bộ (kể cả khi bằng số đang lưu ở userData)', sv.get('user', sv.uid).get('phone') == '0912345678', sv.get('user', sv.uid))
    sv.req('PUT', f'/api/doc/userData/{sv.uid}', {'data': {'profile': {'phone': '0911111111', 'email': 'a@gmail.com'}}, 'merge': False})
    check('Ghi không merge có profile.phone: đồng bộ theo giá trị đã qua kiểm tra', sv.get('user', sv.uid).get('phone') == '0911111111', sv.get('user', sv.uid))
    sv.put('userData', sv.uid, {'profile': {'phone': '0912345678'}})
    sv.put('userData', sv.uid, {'profile': {'phone': 'abc'}})
    check('Số điện thoại sai định dạng không làm đổi user.phone', sv.get('user', sv.uid).get('phone') == '0912345678', sv.get('user', sv.uid))
    check('Đồng bộ không đụng vai trò và họ tên trong user', sv.get('user', sv.uid).get('role') == 'student' and sv.get('user', sv.uid).get('name'), sv.get('user', sv.uid))

    # Sửa họ tên qua user/{uid}: bị chặn với SV/GV
    s, _ = sv.put('user', sv.uid, {'name': 'Tên giả'})
    check('Sinh viên đổi họ tên qua tài khoản: bị từ chối', s == 403, s)
    s, _ = sv.put('user', sv.uid, {'phone': '0911111111'})
    check('Sinh viên đổi số điện thoại qua tài khoản: được', s == 200, s)
    s, _ = sv.put('user', sv.uid, {'role': 'admin'})
    check('Sinh viên tự nâng quyền: bị từ chối', s == 403, s)

    # Dữ liệu sai định dạng
    s, _ = sv.put('userData', sv.uid, {'profile': {'phone': 'abc'}})
    check('Số điện thoại sai định dạng: bị từ chối', s == 403, s)
    s, _ = sv.put('userData', sv.uid, {'profile': {'email': 'khong-phai-email'}})
    check('Email sai định dạng: bị từ chối', s == 403, s)

    # Dữ liệu cá nhân khác vẫn ghi tự do (bài nộp, thư viện…)
    s, _ = sv.put('userData', sv.uid, {'library': [{'id': 1}], 'contacts': []})
    check('Dữ liệu cá nhân khác (thư viện, danh bạ) vẫn ghi được', s == 200, s)

    # Người khác không ghi được vào hồ sơ của sinh viên
    s, _ = sv2.put('userData', sv.uid, {'profile': {'phone': '0900000000'}})
    check('Sinh viên khác sửa hồ sơ của bạn: bị từ chối', s == 403, s)
    s, _ = tr.put('userData', sv.uid, {'profile': {'gpa': '1.0'}})
    check('Phòng Đào tạo chưa được ghi hồ sơ người khác (chỉ Admin): bị từ chối', s == 403, s)

    # Lần đồng bộ đầu của một sinh viên mới (client gửi cả hồ sơ mặc định): chỉ giữ email/sđt + họ tên từ tài khoản
    s, _ = sv2.put('userData', sv2.uid, {'profile': {'name': 'Tự đặt', 'studentId': 'X', 'gpa': '4.0', 'email': '', 'phone': ''}})
    p = sv2.get('userData', sv2.uid).get('profile', {})
    check('Hồ sơ mới của sinh viên: họ tên lấy từ tài khoản, không nhận mã số/GPA tự khai',
          s == 200 and p.get('name') == 'Sinh Vien Hai' and 'studentId' not in p and 'gpa' not in p, (s, p))

    # Giáo viên: cùng quy tắc
    ad.put('userData', gv.uid, {'profile': {'name': 'Giao Vien', 'teacherId': 'GV0042', 'position': 'Tiến sĩ'}})
    gv.put('userData', gv.uid, {'profile': {'position': 'Giáo sư', 'teacherId': 'HACK', 'email': 'gv01@gmail.com'}})
    p = gv.get('userData', gv.uid).get('profile', {})
    check('Giáo viên không sửa được chức vụ/mã GV; sửa được email',
          p.get('position') == 'Tiến sĩ' and p.get('teacherId') == 'GV0042' and p.get('email') == 'gv01@gmail.com', p)
    s, _ = gv.put('user', gv.uid, {'name': 'Tên giả'})
    check('Giáo viên đổi họ tên qua tài khoản: bị từ chối', s == 403, s)

    # Admin / phòng ban vẫn tự sửa hồ sơ của mình
    s, _ = ad.put('user', ad.uid, {'name': 'Quan Tri Moi', 'phone': '0922222222'})
    check('Admin tự đổi họ tên và số điện thoại: được', s == 200, s)
    s, _ = ad.put('user', sv.uid, {'name': 'Sinh Vien Doi Ten'})
    check('Admin đổi họ tên của sinh viên: được', s == 200 and ad.get('user', sv.uid).get('name') == 'Sinh Vien Doi Ten', s)
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
