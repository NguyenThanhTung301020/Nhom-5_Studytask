#!/usr/bin/env python3
"""Kiểm thử gỡ email cá nhân (unlink_email) là MỘT giao dịch: thành công thì gỡ trọn, lỗi ở bất kỳ bước nào thì hoàn tác trọn.

Phần A – qua HTTP trên API tạm (cổng 8806, dữ liệu tạm, STUDYTASK_MAIL_DEBUG=1 nên không gửi thư thật):
  quyền (chưa đăng nhập, sai mật khẩu, khác nguồn gốc, tài khoản khác), email chưa liên kết / đã gỡ,
  lỗi CSDL ở bước 1 và bước 2 (trigger SQLite chỉ tạo trên CSDL tạm), mã lỗi và log không lộ thông tin, gỡ thành công.
Phần B – gọi thẳng hàm trên CSDL tạm khác: lỗi tại COMMIT (khóa ngoại trì hoãn), CSDL bị khóa ở BEGIN,
  và ROLLBACK cũng hỏng (kết nối giả lập) thì kết nối dùng chung được bỏ đi để không treo giao dịch.

Không dùng dữ liệu người dùng thật: mọi tài khoản/email đều tạo mới trong thư mục tạm và bị xóa khi kết thúc.
"""
import http.client, io, json, os, re, shutil, sqlite3, subprocess, sys, tempfile, time
from contextlib import redirect_stderr

PORT = 8806
HERE = os.path.dirname(os.path.abspath(__file__))
API = os.path.join(HERE, '..', '..', 'server', 'studytask_api.py')
fails = []


def check(name, cond, extra=''):
    print(('PASS ' if cond else 'FAIL ') + name + ((' | ' + str(extra)) if (extra and not cond) else ''))
    if not cond:
        fails.append(name)


# ═════════════════════════════ PHẦN A – qua HTTP ═════════════════════════════
DATA = tempfile.mkdtemp()
ENV = dict(os.environ, STUDYTASK_DATA=DATA, STUDYTASK_PORT=str(PORT), STUDYTASK_MAIL_DEBUG='1')
DB = os.path.join(DATA, 'studytask.db')
USERS = {'ulka': 'kpass12345', 'ulkb': 'bpass12345', 'ulkc': 'cpass12345'}
EMAIL_A, EMAIL_C = 'ulka.test@example.com', 'ulkc.test@example.com'
for name, pw in USERS.items():
    subprocess.run([sys.executable, API, 'create-user', name, pw, 'student', name.upper()], env=ENV, check=True, capture_output=True)
LOG_PATH = os.path.join(DATA, 'srv.log')
LOG = open(LOG_PATH, 'w', encoding='utf-8')
srv = subprocess.Popen([sys.executable, API, 'serve'], env=dict(ENV, PYTHONIOENCODING='utf-8'), stderr=LOG, stdout=LOG)
time.sleep(1.5)


class C:
    def __init__(self, ip):
        self.cookie, self.ip = '', ip

    def req(self, method, path, body=None, headers=None):
        c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=15)
        h = {'Cookie': self.cookie, 'X-Real-IP': self.ip, **(headers or {})}
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

    def login(self, user):
        return self.req('POST', '/api/auth/login', {'username': user, 'password': USERS[user]})[0]

    def unlink(self, pw, headers=None):
        return self.req('DELETE', '/api/account/email', {'password': pw}, headers)


def log_text():
    time.sleep(0.3)
    LOG.flush()
    return open(LOG_PATH, encoding='utf-8', errors='replace').read()


def last_code(to):
    m = re.findall(r'\[MAIL-DEBUG\] to=(\S+) .*?\n.*?: (\d{6})\b', log_text())
    return m[-1][1] if m and m[-1][0] == to else None


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


def state():
    """Toàn bộ dữ liệu mà luồng gỡ email có thể chạm tới: liên kết email, mã (mọi mục đích), tài khoản, hồ sơ."""
    return (sql('SELECT uid, email, verified_at FROM contact_email ORDER BY uid'),
            sql('SELECT purpose, uid, email, code_hash, expires, attempts, created FROM codes ORDER BY purpose, uid'),
            sql('SELECT uid, username, salt, pwhash FROM accounts ORDER BY uid'),
            sql("SELECT id, data FROM docs WHERE col='user' ORDER BY id"))


def err_code(r):
    return r[1].get('error', {}).get('code') if isinstance(r[1], dict) else None


def leaks(r):
    """Thông báo lỗi trả cho người dùng không được lộ chi tiết SQL / tên bảng / email."""
    t = json.dumps(r[1], ensure_ascii=False).lower()
    return any(w in t for w in ('sqlite', 'contact_email', 'codes', 'trigger', 'boom', 'select', 'delete', '@'))


try:
    A, B, Cc = C('10.9.0.1'), C('10.9.0.2'), C('10.9.0.3')
    for cl, name in ((A, 'ulka'), (B, 'ulkb'), (Cc, 'ulkc')):
        assert cl.login(name) == 200, name
    # A và C liên kết email (đi đúng luồng xác minh bằng mã), A có thêm một mã đặt lại mật khẩu đang chờ
    for cl, name, email in ((A, 'ulka', EMAIL_A), (Cc, 'ulkc', EMAIL_C)):
        assert cl.req('POST', '/api/account/email', {'email': email, 'password': USERS[name]})[0] == 200
        assert cl.req('POST', '/api/account/email/verify', {'code': last_code(email)})[0] == 200
    C('10.9.1.1').req('POST', '/api/auth/forgot', {'identifier': 'ulka'})
    assert last_code(EMAIL_A)
    ua = uid_of('ulka')
    check('Chuẩn bị: A có email liên kết và mã đặt lại đang chờ',
          sql('SELECT email FROM contact_email WHERE uid=?', (ua,)) == [(EMAIL_A,)]
          and sql("SELECT COUNT(*) FROM codes WHERE purpose='reset' AND uid=?", (ua,)) == [(1,)])
    s0 = state()

    # ── Quyền ──
    r = C('10.9.2.1').unlink(USERS['ulka'])
    check('Quyền: chưa đăng nhập → 401 unauthenticated', r[0] == 401 and err_code(r) == 'unauthenticated', r)
    check('Quyền: chưa đăng nhập → dữ liệu không đổi', state() == s0)
    r = A.unlink('sai-mat-khau')
    check('Quyền: sai mật khẩu → 401 auth/wrong-password', r[0] == 401 and err_code(r) == 'auth/wrong-password', r)
    check('Quyền: sai mật khẩu → email và mã đặt lại của A còn nguyên', state() == s0)
    r = A.unlink(USERS['ulka'], {'Origin': 'http://trang-la.example'})
    check('Quyền: yêu cầu từ trang khác nguồn gốc → 403 bad-origin', r[0] == 403 and err_code(r) == 'bad-origin', r)
    check('Quyền: khác nguồn gốc → dữ liệu không đổi', state() == s0)
    r = B.unlink(USERS['ulka'])
    check('Quyền: B dùng mật khẩu của A trên phiên của B → 401', r[0] == 401, r)
    check('Quyền: B không gỡ được email của A (dữ liệu không đổi)', state() == s0)

    # ── Email chưa được liên kết ──
    r = B.unlink(USERS['ulkb'])
    check('Chưa liên kết: B chưa có email → 409 email-not-linked', r[0] == 409 and err_code(r) == 'email-not-linked', r)
    check('Chưa liên kết: thông báo không lộ thông tin nội bộ', not leaks(r), r)
    check('Chưa liên kết: không phát sinh thay đổi nào', state() == s0)

    # ── Lỗi CSDL ở bước 2 (xóa mã đặt lại) sau khi bước 1 (xóa email) đã chạy ──
    sql("CREATE TRIGGER boom_codes BEFORE DELETE ON codes BEGIN SELECT RAISE(ABORT, 'boom'); END")
    r = A.unlink(USERS['ulka'])
    check('Lỗi bước 2: trả 500 email-unlink-failed', r[0] == 500 and err_code(r) == 'email-unlink-failed', r)
    check('Lỗi bước 2: thông báo không lộ SQL, tên bảng, email', not leaks(r), r)
    check('Lỗi bước 2: hoàn tác trọn – email và mã đặt lại của A còn nguyên, không thay đổi một phần', state() == s0)
    check('Lỗi bước 2: GET /api/account vẫn thấy email của A', A.req('GET', '/api/account')[1].get('recoveryEmail') == EMAIL_A)
    lg = log_text()
    check('Lỗi bước 2: log có dòng UNLINK-EMAIL-ROLLBACK ghi bước lỗi và kết quả hoàn tác',
          re.search(r'UNLINK-EMAIL-ROLLBACK uid=\w{8} buoc=xoa-ma-dat-lai loi=IntegrityError hoan-tac=ok', lg) is not None,
          [l for l in lg.splitlines() if 'UNLINK' in l])
    lines = [l for l in lg.splitlines() if 'UNLINK-EMAIL' in l]
    check('Lỗi bước 2: dòng log gỡ email không chứa email hay uid đầy đủ',
          lines and all(EMAIL_A not in l and ua not in l for l in lines), lines)
    sql('DROP TRIGGER boom_codes')
    # Không còn giao dịch treo: thao tác ghi khác cần BEGIN vẫn chạy (đổi email của C bằng luồng link_email)
    st = Cc.req('POST', '/api/account/email', {'email': 'ulkc.moi@example.com', 'password': USERS['ulkc']})[0]
    r = Cc.req('POST', '/api/account/email/verify', {'code': last_code('ulkc.moi@example.com')})
    check('Lỗi bước 2: sau lỗi không còn giao dịch treo, link_email (BEGIN) của C vẫn chạy', st == 200 and r[0] == 200, r)
    s0 = state()

    # ── Lỗi CSDL ngay bước 1 (xóa email) ──
    sql("CREATE TRIGGER boom_email BEFORE DELETE ON contact_email BEGIN SELECT RAISE(ABORT, 'boom'); END")
    r = A.unlink(USERS['ulka'])
    check('Lỗi bước 1: trả 500 email-unlink-failed', r[0] == 500 and err_code(r) == 'email-unlink-failed', r)
    check('Lỗi bước 1: dữ liệu không đổi', state() == s0)
    check('Lỗi bước 1: log ghi đúng bước xoa-email', 'buoc=xoa-email' in log_text())
    sql('DROP TRIGGER boom_email')

    # ── Gỡ thành công ──
    uc = uid_of('ulkc')
    others_before = [row for row in s0[0] if row[0] != ua], [row for row in s0[1] if row[1] != ua]
    r = A.unlink(USERS['ulka'])
    check('Thành công: gỡ email → 200', r[0] == 200 and r[1].get('ok') is True, r)
    check('Thành công: dòng contact_email của A đã bị xóa', sql('SELECT 1 FROM contact_email WHERE uid=?', (ua,)) == [])
    check('Thành công: mã đặt lại đang chờ của A bị hủy cùng giao dịch', sql("SELECT 1 FROM codes WHERE purpose='reset' AND uid=?", (ua,)) == [])
    check('Thành công: GET /api/account không còn email', A.req('GET', '/api/account')[1].get('recoveryEmail') is None)
    s1 = state()
    check('Thành công: liên kết và mã của tài khoản khác (C) không bị đụng tới',
          ([row for row in s1[0] if row[0] != ua], [row for row in s1[1] if row[1] != ua]) == others_before
          and sql('SELECT email FROM contact_email WHERE uid=?', (uc,)) == [('ulkc.moi@example.com',)])
    check('Thành công: tài khoản, mật khẩu, hồ sơ không đổi', s1[2:] == s0[2:])
    check('Thành công: A vẫn đăng nhập được bằng mật khẩu cũ', C('10.9.2.2').login('ulka') == 200)

    # ── Email đã được hủy liên kết (gỡ lần 2, ví dụ ở tab khác) ──
    r = A.unlink(USERS['ulka'])
    check('Đã gỡ: gỡ lần hai → 409 email-not-linked', r[0] == 409 and err_code(r) == 'email-not-linked', r)
    check('Đã gỡ: gỡ lần hai không phát sinh thay đổi', state() == s1)
    check('Đã gỡ: liên kết lại được sau khi gỡ (luồng xác minh email không bị ảnh hưởng)',
          A.req('POST', '/api/account/email', {'email': EMAIL_A, 'password': USERS['ulka']})[0] == 200
          and A.req('POST', '/api/account/email/verify', {'code': last_code(EMAIL_A)})[0] == 200
          and A.req('GET', '/api/account')[1].get('recoveryEmail') == EMAIL_A)
except Exception as e:
    import traceback; traceback.print_exc(); check('Phần A chạy không lỗi: %r' % e, False)
finally:
    srv.terminate(); srv.wait(5)
    LOG.close()
    shutil.rmtree(DATA, ignore_errors=True)


# ═════════════════════════ PHẦN B – gọi thẳng hàm ═════════════════════════
D2 = tempfile.mkdtemp()
os.environ['STUDYTASK_DATA'] = D2
sys.path.insert(0, os.path.join(HERE, '..', '..', 'server'))
try:
    import studytask_api as a
    c = a.db()

    def seed():
        for uid in ('u1', 'u2'):
            c.execute('INSERT OR REPLACE INTO contact_email (uid, email, verified_at) VALUES (?,?,1)', (uid, uid + '@example.com'))
            c.execute("INSERT OR REPLACE INTO codes VALUES ('reset', ?, ?, 'h', ?, 0, 1)", (uid, uid + '@example.com', time.time() + 600))
        c.execute("INSERT OR REPLACE INTO codes VALUES ('link', 'u1', 'u1moi@example.com', 'h', ?, 0, 1)", (time.time() + 600,))

    def snap(conn=None):
        conn = conn or a.db()
        return (conn.execute('SELECT * FROM contact_email ORDER BY uid').fetchall(),
                conn.execute('SELECT * FROM codes ORDER BY purpose, uid').fetchall())

    def call(uid):
        """Gọi unlink_email, bắt lỗi và phần log ghi ra stderr."""
        buf = io.StringIO()
        try:
            with redirect_stderr(buf):
                a.unlink_email(uid)
            return None, buf.getvalue()
        except Exception as e:
            return e, buf.getvalue()

    seed()
    before = snap()

    # ── Lỗi tại bước COMMIT: khóa ngoại trì hoãn (chỉ có trên CSDL tạm) chỉ được kiểm tra khi COMMIT ──
    c.execute('PRAGMA foreign_keys=ON')
    c.execute('CREATE TABLE fk_guard (uid TEXT REFERENCES contact_email(uid) DEFERRABLE INITIALLY DEFERRED)')
    c.execute("INSERT INTO fk_guard VALUES ('u1')")
    e, log = call('u1')
    check('Lỗi COMMIT: ném ApiError email-unlink-failed (500)',
          isinstance(e, a.ApiError) and e.code == 'email-unlink-failed' and e.status == 500, repr(e))
    check('Lỗi COMMIT: dữ liệu giữ nguyên, không thay đổi một phần', snap() == before)
    check('Lỗi COMMIT: không còn giao dịch treo', not c.in_transaction)
    check('Lỗi COMMIT: log ghi buoc=commit, hoàn tác ok', 'buoc=commit' in log and 'hoan-tac=ok' in log, log)
    c.execute('DROP TABLE fk_guard')
    c.execute('PRAGMA foreign_keys=OFF')

    # ── CSDL đang bị khóa (kết nối khác giữ khóa ghi) ngay ở BEGIN IMMEDIATE ──
    other = sqlite3.connect(a.DB_PATH, isolation_level=None)
    other.execute('BEGIN IMMEDIATE')
    c.execute('PRAGMA busy_timeout=200')
    e, log = call('u1')
    check('CSDL bị khóa: trả 503 email-unlink-failed (lỗi tạm thời, thử lại được)',
          isinstance(e, a.ApiError) and e.code == 'email-unlink-failed' and e.status == 503, repr(e))
    check('CSDL bị khóa: log ghi buoc=bat-dau, không cần hoàn tác', 'buoc=bat-dau' in log and 'hoan-tac=khong-can' in log, log)
    other.execute('ROLLBACK'); other.close()
    c.execute('PRAGMA busy_timeout=5000')
    check('CSDL bị khóa: dữ liệu giữ nguyên', snap() == before)

    # ── COMMIT lỗi và ROLLBACK cũng lỗi: kết nối dùng chung bị bỏ đi (đóng kết nối = SQLite tự hoàn tác) ──
    class BrokenConn:
        """Bọc kết nối thật, làm hỏng COMMIT và ROLLBACK để giả lập kết nối hỏng giữa chừng."""
        def __init__(self, real):
            self.real, self.closed = real, False

        def execute(self, q, *args):
            if q.strip().upper() in ('COMMIT', 'ROLLBACK'):
                raise sqlite3.OperationalError('disk I/O error')
            return self.real.execute(q, *args)

        @property
        def in_transaction(self):
            return self.real.in_transaction

        def close(self):
            self.closed = True
            self.real.close()

    broken = BrokenConn(c)
    a._db = broken
    e, log = call('u1')
    check('ROLLBACK hỏng: vẫn ném ApiError email-unlink-failed', isinstance(e, a.ApiError) and e.code == 'email-unlink-failed', repr(e))
    check('ROLLBACK hỏng: log ghi hoàn tác lỗi và việc bỏ kết nối', 'hoan-tac=loi' in log and 'UNLINK-EMAIL-DONG-KET-NOI' in log, log)
    check('ROLLBACK hỏng: kết nối hỏng bị đóng và bỏ khỏi bộ nhớ', broken.closed and a._db is None)
    c = a.db()           # kết nối mới
    check('ROLLBACK hỏng: kết nối mới thấy dữ liệu giữ nguyên (đóng kết nối đã hoàn tác)', snap(c) == before)
    check('ROLLBACK hỏng: kết nối mới không treo giao dịch', not c.in_transaction)

    # ── Thành công sau khi hết lỗi ──
    e, log = call('u1')
    after = snap()
    check('Thành công: không lỗi, không ghi log lỗi', e is None and 'UNLINK-EMAIL-ROLLBACK' not in log, (e, log))
    check('Thành công: chỉ xóa email và mã đặt lại của u1',
          after[0] == [r for r in before[0] if r[0] != 'u1']
          and after[1] == [r for r in before[1] if not (r[0] == 'reset' and r[1] == 'u1')], after)
    check('Thành công: mã liên kết email mới (purpose=link) của u1 vẫn giữ', any(r[0] == 'link' and r[1] == 'u1' for r in after[1]))
    e, _ = call('u1')
    check('Đã gỡ: gọi lại → ApiError 409 email-not-linked', isinstance(e, a.ApiError) and e.status == 409 and e.code == 'email-not-linked', repr(e))
    check('Đã gỡ: gọi lại không thay đổi gì, không treo giao dịch', snap() == after and not a.db().in_transaction)
    e, _ = call('khong-ton-tai')
    check('Chưa liên kết: uid chưa từng có email → 409 email-not-linked', isinstance(e, a.ApiError) and e.code == 'email-not-linked', repr(e))
except Exception as e:
    import traceback; traceback.print_exc(); check('Phần B chạy không lỗi: %r' % e, False)
finally:
    try:
        if a._db is not None:
            a._db.close()
    except Exception:
        pass
    shutil.rmtree(D2, ignore_errors=True)

print('\nKẾT QUẢ:', 'TẤT CẢ ĐẠT' if not fails else f'{len(fails)} LỖI: {fails}')
sys.exit(1 if fails else 0)
