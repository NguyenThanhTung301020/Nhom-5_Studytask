#!/usr/bin/env python3
"""Kiểm thử chuyển tài khoản từ bản cũ (đăng nhập bằng email) sang tên đăng nhập.

Tạo một cơ sở dữ liệu theo đúng lược đồ cũ (bảng accounts có cột email), khởi động API mới trên đó rồi
kiểm tra: tên đăng nhập sinh ra đúng, mật khẩu đã mã hóa được giữ nguyên, có bản sao lưu, hồ sơ không còn email.
Chạy: python3 tests/server/test_migrate.py   (chỉ dùng thư viện chuẩn của Python)
"""
import http.client, json, os, secrets, shutil, sqlite3, subprocess, sys, tempfile, time

HERE = os.path.dirname(os.path.abspath(__file__))
SERVER = os.path.abspath(os.path.join(HERE, '..', '..', 'server'))
D = tempfile.mkdtemp()
os.environ['STUDYTASK_DATA'] = D
sys.path.insert(0, SERVER)
import studytask_api as api          # chỉ dùng hash_pw / new_uid; chưa mở cơ sở dữ liệu nào

ACCOUNTS = [('admin@studytask.vn', 'adminpass1', 'admin', 'QT'), ('student@studytask.vn', 'studentpass1', 'student', 'SV'),
            ('a@x.vn', 'apass1234', 'student', 'Ngắn'),                      # phần trước @ quá ngắn
            ('minh@gmail.com', 'minhpass12', 'student', 'Minh'), ('minh@yahoo.com', 'minhpass13', 'student', 'Minh2')]   # trùng nhau

legacy = sqlite3.connect(os.path.join(D, 'studytask.db'), isolation_level=None)
legacy.executescript('''
  CREATE TABLE accounts (uid TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL COLLATE NOCASE,
                         salt TEXT NOT NULL, pwhash TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE sessions (token TEXT PRIMARY KEY, uid TEXT NOT NULL, expires REAL NOT NULL);
  CREATE TABLE docs (col TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (col, id));''')
for em, pw, role, name in ACCOUNTS:
    salt, uid = secrets.token_hex(16), api.new_uid()
    legacy.execute('INSERT INTO accounts VALUES (?,?,?,?,?)', (uid, em, salt, api.hash_pw(pw, salt), '2026-11-03'))
    legacy.execute('INSERT INTO docs VALUES (?,?,?)', ('user', uid, json.dumps({'name': name, 'role': role, 'email': em})))
legacy.close()

env = dict(os.environ, STUDYTASK_DATA=D, STUDYTASK_PORT='8792')
log = open(os.path.join(D, 'log'), 'w')
srv = subprocess.Popen([sys.executable, os.path.join(SERVER, 'studytask_api.py'), 'serve'], env=env, stderr=log, stdout=log)
time.sleep(1.5)
ok = True


def login(username, password):
    c = http.client.HTTPConnection('127.0.0.1', 8792, timeout=5)
    c.request('POST', '/api/auth/login', json.dumps({'username': username, 'password': password}), {'Content-Type': 'application/json'})
    return c.getresponse().status


def chk(name, cond):
    global ok
    ok &= bool(cond)
    print(('PASS ' if cond else 'FAIL ') + name)


try:
    db = sqlite3.connect(os.path.join(D, 'studytask.db'))
    names = [r[0] for r in db.execute('SELECT username FROM accounts ORDER BY username')]
    print('tên đăng nhập sau khi chuyển:', names)
    chk('có bản sao lưu trước khi chuyển', os.path.exists(os.path.join(D, 'studytask.db.bak-pre-username')))
    chk('đăng nhập bằng tên đăng nhập + mật khẩu cũ', login('admin', 'adminpass1') == 200)
    chk('vẫn đăng nhập được bằng email cũ @studytask.vn', login('student@studytask.vn', 'studentpass1') == 200)
    chk('không phân biệt hoa thường', login('ADMIN', 'adminpass1') == 200)
    chk('sai mật khẩu bị từ chối', login('admin', 'sai') == 401)
    chk('phần trước @ quá ngắn được bù cho đủ 3 ký tự', 'auser' in names)
    chk('trùng phần trước @ được đánh số (minh, minh2)', {'minh', 'minh2'} <= set(names))
    prof = json.loads(db.execute("SELECT data FROM docs WHERE col='user' AND id=(SELECT uid FROM accounts WHERE username='admin')").fetchone()[0])
    chk('hồ sơ không còn trường email, có trường username', 'email' not in prof and prof.get('username') == 'admin')
finally:
    srv.terminate()
    srv.wait(5)
    shutil.rmtree(D, ignore_errors=True)
print('KẾT QUẢ:', 'ĐẠT' if ok else 'CÓ LỖI')
sys.exit(0 if ok else 1)
