#!/usr/bin/env python3
"""Kiểm thử 2 lỗi luồng email cá nhân (API tạm, cổng 8799, dữ liệu tạm, STUDYTASK_MAIL_DEBUG=1 nên không gửi thư thật).

Lỗi 1 – xác minh email dùng INSERT OR REPLACE: hai tài khoản cùng xin liên kết một email trước khi ai xác minh,
        người xác minh sau lặng lẽ xóa liên kết của người trước (ràng buộc UNIQUE(email) bị REPLACE giải quyết bằng xóa dòng).
Lỗi 2 – mã đặt lại mật khẩu vẫn dùng được sau khi gỡ email (hoặc đổi sang email khác).

Mỗi client dùng một X-Real-IP riêng để không chạm hạn mức 6 thư/giờ/IP và 10 lần sai/5 phút/IP của máy chủ.
"""
import http.client, json, os, re, shutil, sqlite3, subprocess, sys, tempfile, time

PORT = 8799
DATA = tempfile.mkdtemp()
ENV = dict(os.environ, STUDYTASK_DATA=DATA, STUDYTASK_PORT=str(PORT), STUDYTASK_MAIL_DEBUG='1')
API = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'server', 'studytask_api.py')
DB = os.path.join(DATA, 'studytask.db')
USERS = {'sva': 'apass12345', 'svb': 'bpass12345', 'svc': 'cpass12345', 'svd': 'dpass12345'}
for name, pw in USERS.items():
    subprocess.run([sys.executable, API, 'create-user', name, pw, 'student', name.upper()], env=ENV, check=True, capture_output=True)
LOG_PATH = os.path.join(DATA, 'srv.log')
LOG = open(LOG_PATH, 'w')
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=LOG, stdout=LOG)
time.sleep(1.5)
fails = []


def check(name, cond, extra=''):
    print(('PASS ' if cond else 'FAIL ') + name + ((' | ' + str(extra)) if (extra and not cond) else ''))
    if not cond:
        fails.append(name)


class C:
    def __init__(self, ip):
        self.cookie, self.ip = '', ip

    def req(self, method, path, body=None):
        c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=10)
        h = {'Cookie': self.cookie, 'X-Real-IP': self.ip}
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

    def login(self, user, pw=None):
        return self.req('POST', '/api/auth/login', {'username': user, 'password': pw or USERS[user]})[0]


def last_mail():
    """(người nhận, mã 6 số) của thư MAIL-DEBUG gần nhất."""
    time.sleep(0.3)
    LOG.flush()
    m = re.findall(r'\[MAIL-DEBUG\] to=(\S+) .*?\n.*?: (\d{6})\b', open(LOG_PATH, encoding='utf-8').read())
    return m[-1] if m else (None, None)


def mail_count():
    time.sleep(0.3)
    LOG.flush()
    return open(LOG_PATH, encoding='utf-8').read().count('[MAIL-DEBUG]')


def sql(q, args=()):
    con = sqlite3.connect(DB, timeout=5)
    try:
        rows = con.execute(q, args).fetchall()
        con.commit()
        return rows
    finally:
        con.close()


def uid_of(user):
    return sql('SELECT uid FROM accounts WHERE username=?', (user,))[0][0]


def snapshot(user):
    """Dữ liệu tài khoản không được phép bị luồng email thay đổi: mật khẩu băm + hồ sơ."""
    u = uid_of(user)
    return (sql('SELECT username, salt, pwhash, created_at FROM accounts WHERE uid=?', (u,)),
            sql("SELECT data FROM docs WHERE col='user' AND id=?", (u,)))


def link(client, email, pw):
    st = client.req('POST', '/api/account/email', {'email': email, 'password': pw})[0]
    to, code = last_mail()
    return st, (code if to == email else None)


def recovery(client):
    return client.req('GET', '/api/account')[1].get('recoveryEmail')


def forgot_code(client, identifier, expect_to):
    client.req('POST', '/api/auth/forgot', {'identifier': identifier})
    to, code = last_mail()
    return code if to == expect_to else None


def reset(client, identifier, code, new_pw):
    return client.req('POST', '/api/auth/reset', {'identifier': identifier, 'code': code, 'newPassword': new_pw})


try:
    A, B, Cc, D = C('10.0.0.1'), C('10.0.0.2'), C('10.0.0.3'), C('10.0.0.4')
    for cl, name in ((A, 'sva'), (B, 'svb'), (Cc, 'svc'), (D, 'svd')):
        assert cl.login(name) == 200, name

    # ══ LỖI 1: xác minh email không được ghi đè liên kết của tài khoản khác ══
    before_a, before_b = snapshot('sva'), snapshot('svb')
    st_a, code_a = link(A, 'chung@gmail.com', USERS['sva'])
    st_b, code_b = link(B, 'chung@gmail.com', USERS['svb'])
    check('L1: hai tài khoản cùng xin mã cho 1 email khi chưa ai xác minh (hợp lệ ở bước xin mã)',
          st_a == 200 and st_b == 200 and code_a and code_b, (st_a, st_b))
    check('L1: A xác minh trước → 200', A.req('POST', '/api/account/email/verify', {'code': code_a})[0] == 200)
    r = B.req('POST', '/api/account/email/verify', {'code': code_b})
    check('L1: B xác minh sau cùng email → 409 email-in-use', r[0] == 409 and r[1].get('error', {}).get('code') == 'email-in-use', r)
    check('L1: liên kết của A KHÔNG bị xóa', recovery(A) == 'chung@gmail.com', recovery(A))
    check('L1: B không chiếm được email của A', recovery(B) is None, recovery(B))
    rows = sql('SELECT uid FROM contact_email WHERE email=?', ('chung@gmail.com',))
    check('L1: email chỉ thuộc đúng 1 tài khoản là A', rows == [(uid_of('sva'),)], rows)
    check('L1: mật khẩu và hồ sơ của A, B không đổi', snapshot('sva') == before_a and snapshot('svb') == before_b)
    check('L1: A vẫn đăng nhập bằng mật khẩu cũ', C('10.0.0.9').login('sva') == 200)
    check('L1: mã của B đã dùng thì không dùng lại được', B.req('POST', '/api/account/email/verify', {'code': code_b})[0] == 400)

    # Đổi email (đã có liên kết → cập nhật đúng dòng của mình, không chèn dòng thứ 2)
    st, code = link(A, 'moi@gmail.com', USERS['sva'])
    check('L1: A đổi sang email mới → 200', st == 200 and A.req('POST', '/api/account/email/verify', {'code': code})[0] == 200)
    rows = sql('SELECT email FROM contact_email WHERE uid=?', (uid_of('sva'),))
    check('L1: A chỉ còn đúng 1 liên kết là email mới', rows == [('moi@gmail.com',)], rows)
    check('L1: hồ sơ và mật khẩu A vẫn không đổi sau khi đổi email', snapshot('sva') == before_a)
    st, code = link(B, 'chung@gmail.com', USERS['svb'])
    check('L1: email cũ của A được giải phóng, B liên kết được', st == 200 and B.req('POST', '/api/account/email/verify', {'code': code})[0] == 200
          and recovery(B) == 'chung@gmail.com' and recovery(A) == 'moi@gmail.com')

    # ══ LỖI 2: vòng đời mã đặt lại mật khẩu ══
    st, code = link(Cc, 'c@gmail.com', USERS['svc'])
    assert st == 200 and Cc.req('POST', '/api/account/email/verify', {'code': code})[0] == 200
    F = C('10.0.1.1')        # người dùng chưa đăng nhập, ở trang "Quên mật khẩu"

    code = forgot_code(F, 'svc', 'c@gmail.com')
    check('L2: quên MK gửi mã tới email đã xác minh', bool(code))
    r = reset(F, 'svc', code, 'cmoi12345')
    check('L2 hợp lệ: mã đúng còn hạn → đặt lại được', r[0] == 200, r)
    check('L2 hợp lệ: đăng nhập bằng MK mới', C('10.0.1.9').login('svc', 'cmoi12345') == 200)
    check('L2 đã dùng: mã vừa dùng không dùng lại được', reset(F, 'svc', code, 'cmoi99999')[0] == 400)
    USERS['svc'] = 'cmoi12345'
    assert Cc.login('svc') == 200      # đặt lại MK đã hủy mọi phiên cũ của C

    code = forgot_code(F, 'c@gmail.com', 'c@gmail.com')
    wrong = '%06d' % ((int(code) + 1) % 10 ** 6)
    check('L2 không hợp lệ: mã sai → 400', reset(F, 'svc', wrong, 'csai12345')[0] == 400)
    check('L2 không hợp lệ: mã đúng nhưng định danh lạ → 400', reset(F, 'khongco', code, 'csai12345')[0] == 400)
    sql("UPDATE codes SET expires=?, created=? WHERE purpose='reset' AND uid=?", (time.time() - 1, time.time() - 1000, uid_of('svc')))
    check('L2 hết hạn: mã đúng nhưng quá 15 phút → 400', reset(F, 'svc', code, 'chethan123')[0] == 400)
    check('L2 hết hạn: mật khẩu không đổi', C('10.0.1.9').login('svc') == 200)

    # Gỡ email trong khi mã đặt lại còn hiệu lực
    code = forgot_code(F, 'svc', 'c@gmail.com')
    check('L2 gỡ email: có mã đặt lại còn hạn', bool(code))
    check('L2 gỡ email: gỡ thành công', Cc.req('DELETE', '/api/account/email', {'password': USERS['svc']})[0] == 200)
    rows = sql("SELECT 1 FROM codes WHERE purpose='reset' AND uid=?", (uid_of('svc'),))
    check('L2 gỡ email: mã đặt lại bị xóa khỏi CSDL', rows == [], rows)
    r = reset(F, 'svc', code, 'cdanhcap1')
    check('L2 gỡ email: mã cũ KHÔNG còn đặt lại được mật khẩu', r[0] == 400, r)
    check('L2 gỡ email: mật khẩu không bị đổi', C('10.0.1.9').login('svc') == 200 and C('10.0.1.9').login('svc', 'cdanhcap1') == 401)

    # Đổi sang email khác trong khi mã gửi tới email cũ còn hiệu lực
    st, code = link(D, 'd1@gmail.com', USERS['svd'])
    assert st == 200 and D.req('POST', '/api/account/email/verify', {'code': code})[0] == 200
    G = C('10.0.2.1')
    old = forgot_code(G, 'svd', 'd1@gmail.com')
    st, code = link(D, 'd2@gmail.com', USERS['svd'])
    check('L2 đổi email: liên kết email mới', st == 200 and D.req('POST', '/api/account/email/verify', {'code': code})[0] == 200)
    r = reset(G, 'svd', old, 'ddanhcap1')
    check('L2 đổi email: mã gửi tới email cũ KHÔNG còn dùng được', r[0] == 400, r)
    check('L2 đổi email: mật khẩu không bị đổi', C('10.0.2.9').login('svd') == 200)

    # Phòng thủ nhiều lớp: dù liên kết bị gỡ bằng đường khác (không qua API), mã cũ vẫn bị từ chối
    code = forgot_code(G, 'd2@gmail.com', 'd2@gmail.com')
    sql('DELETE FROM contact_email WHERE uid=?', (uid_of('svd'),))
    r = reset(G, 'svd', code, 'ddanhcap2')
    check('L2 phòng thủ: mã của email không còn liên kết bị từ chối khi đặt lại', r[0] == 400, r)
    check('L2 phòng thủ: mật khẩu không bị đổi', C('10.0.2.9').login('svd') == 200)
    n = mail_count()
    C('10.0.3.1').req('POST', '/api/auth/forgot', {'identifier': 'svd'})
    check('L2: tài khoản không còn email liên kết thì quên MK không gửi thư nào', mail_count() == n)

finally:
    srv.terminate(); srv.wait(5)
    LOG.close()
    shutil.rmtree(DATA, ignore_errors=True)
print('\nKẾT QUẢ:', 'TẤT CẢ ĐẠT' if not fails else f'{len(fails)} LỖI: {fails}')
sys.exit(1 if fails else 0)
