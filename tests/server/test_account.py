#!/usr/bin/env python3
"""Kiểm thử email khôi phục / quên mật khẩu / avatar / chat realtime trên API tạm (cổng 8791, dữ liệu tạm)."""
import http.client, json, os, re, subprocess, sys, tempfile, threading, time, shutil

DATA = tempfile.mkdtemp()
ENV = dict(os.environ, STUDYTASK_DATA=DATA, STUDYTASK_PORT='8791', STUDYTASK_MAIL_DEBUG='1')
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
for a in (('gv01', 'tpass12345', 'teacher', 'GV'), ('sv01', 'spass12345', 'student', 'SV'), ('ad01', 'apass12345', 'admin', 'AD')):
    subprocess.run([sys.executable, API, 'create-user', *a], env=ENV, check=True, capture_output=True)
LOG = open(os.path.join(DATA, 'srv.log'), 'w')
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=LOG, stdout=LOG)
time.sleep(1.5)
fails = []


def check(name, cond, extra=''):
    print(('PASS ' if cond else 'FAIL ') + name + ((' | ' + str(extra)) if (extra and not cond) else ''))
    if not cond:
        fails.append(name)


class C:
    def __init__(self):
        self.cookie = ''

    def req(self, method, path, body=None, raw=None):
        c = http.client.HTTPConnection('127.0.0.1', 8791, timeout=10)
        h = {'Cookie': self.cookie}
        data = raw
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

    def login(self, e, p):
        return self.req('POST', '/api/auth/login', {'email': e, 'password': p})


def last_code():
    time.sleep(0.3)
    LOG.flush()
    m = re.findall(r': (\d{6})\b', open(os.path.join(DATA, 'srv.log'), encoding='utf-8').read())
    return m[-1] if m else None


def listen(client, out):
    """Mở luồng SSE và ghi các sự kiện nhận được vào out."""
    def run():
        c = http.client.HTTPConnection('127.0.0.1', 8791, timeout=30)
        c.request('GET', '/api/events', headers={'Cookie': client.cookie})
        r = c.getresponse()
        out.append({'status': r.status, 'ctype': r.getheader('Content-Type')})
        buf = b''
        while True:
            ch = r.fp.readline()
            if not ch:
                break
            if ch.startswith(b'data: '):
                out.append(json.loads(ch[6:].decode()))
    threading.Thread(target=run, daemon=True).start()


try:
    s, a, t = C(), C(), C()
    s.login('sv01', 'spass12345'); a.login('ad01', 'apass12345'); t.login('gv01', 'tpass12345')

    # ── email khôi phục ──
    check('quên MK, email lạ → vẫn 200 (không lộ)', s.req('POST', '/api/auth/forgot', {'identifier': 'nobody@x.vn'})[0] == 200)
    check('liên kết email: sai mật khẩu → 401', s.req('POST', '/api/account/email', {'email': 'real@gmail.com', 'password': 'sai'})[0] == 401)
    check('liên kết email: email sai định dạng → 400', s.req('POST', '/api/account/email', {'email': 'abc', 'password': 'spass12345'})[0] == 400)
    check('liên kết email: gửi mã', s.req('POST', '/api/account/email', {'email': 'real@gmail.com', 'password': 'spass12345'})[0] == 200)
    check('xác nhận mã sai → 400', s.req('POST', '/api/account/email/verify', {'code': '000000'})[0] == 400)
    code = last_code()
    check('xác nhận mã đúng', s.req('POST', '/api/account/email/verify', {'code': code})[0] == 200, code)
    st, acc = s.req('GET', '/api/account')
    check('GET /account có recoveryEmail', acc.get('recoveryEmail') == 'real@gmail.com', acc)
    check('email đã dùng không liên kết được cho người khác', t.req('POST', '/api/account/email', {'email': 'real@gmail.com', 'password': 'tpass12345'})[0] == 409)
    check('mã chỉ dùng được 1 lần', s.req('POST', '/api/account/email/verify', {'code': code})[0] == 400)

    # ── quên mật khẩu ──
    f = C()
    check('quên MK bằng email khôi phục', f.req('POST', '/api/auth/forgot', {'identifier': 'real@gmail.com'})[0] == 200)
    code = last_code()
    check('đặt lại: mã sai → 400', f.req('POST', '/api/auth/reset', {'identifier': 'real@gmail.com', 'code': '111111', 'newPassword': 'moimatkhau1'})[0] == 400)
    check('đặt lại: MK quá ngắn bị chặn', f.req('POST', '/api/auth/reset', {'identifier': 'real@gmail.com', 'code': code, 'newPassword': '123'})[0] == 400)
    code = last_code()
    time.sleep(0.1)
    r = f.req('POST', '/api/auth/reset', {'identifier': 'sv01', 'code': code, 'newPassword': 'moimatkhau1'})
    check('đặt lại bằng email đăng nhập + mã đúng', r[0] == 200, r)
    check('phiên cũ bị đăng xuất', s.req('GET', '/api/auth/me')[1].get('user') is None)
    check('MK cũ không còn đăng nhập được', C().login('sv01', 'spass12345')[0] == 401)
    check('MK mới đăng nhập được', s.login('sv01', 'moimatkhau1')[0] == 200)
    check('gỡ email: sai MK → 401', s.req('DELETE', '/api/account/email', {'password': 'sai'})[0] == 401)

    # ── avatar ──
    png = b'\x89PNG\r\n\x1a\n' + b'0' * 100
    r = s.req('POST', '/api/account/avatar?filename=a.png', raw=png)
    check('upload avatar PNG', r[0] == 200 and r[1].get('avatar', '').startswith('/uploads/avatars/'), r)
    check('avatar giả (exe đổi tên) → 400', s.req('POST', '/api/account/avatar?filename=a.png', raw=b'MZ\x90fake')[0] == 400)
    check('avatar .gif → 400', s.req('POST', '/api/account/avatar?filename=a.gif', raw=b'GIF89a')[0] == 400)
    uid = s.req('GET', '/api/auth/me')[1]['user']['uid']
    check('avatar có trong hồ sơ user', s.req('GET', f'/api/doc/user/{uid}')[1]['data'].get('avatar') == r[1].get('avatar'))
    files = os.listdir(os.path.join(DATA, 'uploads', 'avatars'))
    s.req('POST', '/api/account/avatar?filename=b.png', raw=png)
    check('avatar cũ được dọn khi đổi', len(os.listdir(os.path.join(DATA, 'uploads', 'avatars'))) == 1)
    check('xóa avatar', s.req('DELETE', '/api/account/avatar')[0] == 200 and not os.listdir(os.path.join(DATA, 'uploads', 'avatars')))

    # ── số điện thoại ──
    check('SĐT hợp lệ', s.req('PUT', f'/api/doc/user/{uid}', {'data': {'phone': '0901 234 567'}})[0] == 200)
    check('SĐT chứa chữ/ký tự lạ bị chặn', s.req('PUT', f'/api/doc/user/{uid}', {'data': {'phone': '<script>'}})[0] == 403)
    check('không tự gán avatar bằng PUT', s.req('PUT', f'/api/doc/user/{uid}', {'data': {'avatar': 'http://evil/x.png'}})[0] == 403)

    # ── chat realtime ──
    ev_a, ev_s = [], []
    listen(a, ev_a); time.sleep(0.4)
    check('SSE admin mở được', ev_a and ev_a[0].get('status') == 200 and 'event-stream' in (ev_a[0].get('ctype') or ''), ev_a[:1])
    listen(s, ev_s); time.sleep(0.5)
    hello = [e for e in ev_s if e.get('type') == 'hello']
    check('SV thấy hỗ trợ đang online', hello and hello[0]['supportOnline'] is True, ev_s)
    check('admin nhận presence SV online', any(e.get('type') == 'presence' and e.get('online') for e in ev_a), ev_a)
    check('tin rỗng bị chặn', s.req('POST', '/api/chat/messages', {'text': '  '})[0] == 400)
    r = s.req('POST', '/api/chat/messages', {'text': 'Em cần hỗ trợ về học phí'})
    check('SV gửi tin', r[0] == 200 and r[1]['message']['fromStaff'] is False, r)
    time.sleep(0.5)
    got = [e for e in ev_a if e.get('type') == 'chat']
    check('admin nhận tin NGAY qua SSE', got and got[0]['msg']['text'].startswith('Em cần') and got[0]['fromName'] == 'SV', ev_a)
    check('admin: unread = 1', a.req('GET', '/api/chat/status')[1]['unread'] == 1)
    th = a.req('GET', '/api/chat/threads')[1]['threads']
    check('admin thấy hội thoại + online', len(th) == 1 and th[0]['unread'] == 1 and th[0]['online'] is True, th)
    check('SV không xem được danh sách hội thoại', s.req('GET', '/api/chat/threads')[0] == 403)
    r = a.req('POST', '/api/chat/messages', {'thread': uid, 'text': 'Chào em, phòng Tài chính sẽ liên hệ'})
    time.sleep(0.5)
    got = [e for e in ev_s if e.get('type') == 'chat' and e['msg']['fromStaff']]
    check('SV nhận trả lời NGAY qua SSE', bool(got), ev_s)
    check('SV: unread = 1', s.req('GET', '/api/chat/status')[1]['unread'] == 1)
    s.req('POST', '/api/chat/read', {})
    check('SV đọc xong → unread = 0', s.req('GET', '/api/chat/status')[1]['unread'] == 0)
    a.req('POST', '/api/chat/read', {'thread': uid})
    check('admin đọc xong → unread = 0', a.req('GET', '/api/chat/status')[1]['unread'] == 0)
    msgs = s.req('GET', '/api/chat/messages')[1]['messages']
    check('lịch sử đủ 2 tin, đúng thứ tự', [m['fromStaff'] for m in msgs] == [False, True], msgs)
    check('SV không đọc được thread người khác', len(s.req('GET', '/api/chat/messages?thread=' + 'x' * 8)[1]['messages']) == 2)
    check('tải tăng dần theo after', len(s.req('GET', f'/api/chat/messages?after={msgs[0]["id"]}')[1]['messages']) == 1)
    check('SV không thể mạo danh admin gửi vào thread người khác', s.req('POST', '/api/chat/messages', {'thread': 'zzz', 'text': 'hi'})[1]['message']['thread'] == uid)
    check('chưa đăng nhập không dùng được chat', C().req('GET', '/api/chat/status')[0] == 401)
    check('chưa đăng nhập không mở được SSE', C().req('GET', '/api/events')[0] == 401)

    # ── API vẫn phục vụ bình thường khi đang có kết nối SSE (không bị khóa chung) ──
    t0 = time.time(); s.req('GET', '/api/auth/me')
    check('API không bị SSE chặn', time.time() - t0 < 1)

finally:
    srv.terminate(); srv.wait(5)
    shutil.rmtree(DATA, ignore_errors=True)
print('\nKẾT QUẢ:', 'TẤT CẢ ĐẠT' if not fails else f'{len(fails)} LỖI: {fails}')
sys.exit(1 if fails else 0)
