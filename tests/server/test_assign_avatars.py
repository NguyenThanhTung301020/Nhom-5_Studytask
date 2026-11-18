#!/usr/bin/env python3
"""Gán ảnh đại diện hàng loạt (scripts/assign_avatars.py): mỗi sinh viên một tệp riêng, chia đều bộ ảnh, không đè ảnh người dùng
tự đặt, API trả đúng ảnh, gỡ và purge dọn sạch tệp (API tạm, cổng 8802, dữ liệu tạm)."""
import collections, hashlib, http.client, json, os, shutil, sqlite3, subprocess, sys, tempfile, time
HERE = os.path.dirname(os.path.abspath(__file__))
API = os.path.join(HERE, '..', '..', 'server', 'studytask_api.py')
SEED = os.path.join(HERE, '..', '..', 'scripts', 'seed_curriculum.py')
ASSIGN = os.path.join(HERE, '..', '..', 'scripts', 'assign_avatars.py')
PORT = 8802
D, IMG = tempfile.mkdtemp(), tempfile.mkdtemp()
ok, srv = True, None


def chk(n, c):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + n)


def run(*a):
    return subprocess.run([sys.executable, *a], capture_output=True, text=True, encoding='utf-8')


def users(con):
    return {uid: json.loads(d) for uid, d in con.execute("SELECT id, data FROM docs WHERE col='user'")}


try:
    # bộ ảnh giả 7 tệp .jpg (đầu FFD8 như JPEG thật, nội dung khác nhau)
    for i in range(7):
        with open(os.path.join(IMG, f'av{i:04d}.jpg'), 'wb') as f:
            f.write(b'\xff\xd8\xff\xe0' + bytes([i]) * (500 + i * 37) + b'\xff\xd9')
    pool = {hashlib.md5(open(os.path.join(IMG, f), 'rb').read()).hexdigest(): f for f in os.listdir(IMG)}

    r = run(SEED, '--data-dir', D, '--preset', 'small', '--classes', '1', '--no-files', '--workers', '4')
    chk('nạp dữ liệu sinh viên', r.returncode == 0)
    subprocess.run([sys.executable, API, 'create-user', 'that01', 'matkhauthat1', 'student', 'Người thật'], env=dict(os.environ, STUDYTASK_DATA=D), check=True, capture_output=True)
    con = sqlite3.connect(os.path.join(D, 'studytask.db'))
    real_uid = [u for u, d in users(con).items() if d['username'] == 'that01'][0]
    d = users(con)[real_uid]; d['avatar'] = '/uploads/avatars/real_own.jpg'            # sinh viên thật đã tự tải ảnh lên
    con.execute("UPDATE docs SET data=? WHERE col='user' AND id=?", (json.dumps(d), real_uid)); con.commit()
    os.makedirs(os.path.join(D, 'uploads', 'avatars'), exist_ok=True)
    open(os.path.join(D, 'uploads', 'avatars', 'real_own.jpg'), 'wb').write(b'\xff\xd8REAL')
    seeded = [u for u, d in users(con).items() if d.get('seed') == 'curriculum-v1' and d['role'] == 'student']
    n = len(seeded)

    # ── dry-run không ghi gì ──
    r = run(ASSIGN, '--data-dir', D, '--images', IMG, '--dry-run')
    chk('--dry-run báo kế hoạch và không ghi gì', r.returncode == 0 and f'Sinh viên được gán: {n}' in r.stdout
        and len(os.listdir(os.path.join(D, 'uploads', 'avatars'))) == 1)

    # ── gán ──
    r = run(ASSIGN, '--data-dir', D, '--images', IMG)
    chk('gán thành công', r.returncode == 0 and f'cho {n} sinh viên' in r.stdout)
    con = sqlite3.connect(os.path.join(D, 'studytask.db')); us = users(con)
    files = os.listdir(os.path.join(D, 'uploads', 'avatars'))
    chk('mỗi sinh viên của seed có ảnh và tệp riêng (n + 1 tệp ảnh thật)', all(us[u].get('avatar', '').startswith('/uploads/avatars/') for u in seeded) and len(files) == n + 1
        and len({us[u]['avatar'] for u in seeded}) == n)
    chk('tên tệp theo quy ước của API: <8 ký tự uid>_<12 hex>.jpg', all(
        os.path.basename(us[u]['avatar']).startswith(u[:8] + '_') and len(os.path.basename(us[u]['avatar'])) == 8 + 1 + 12 + 4 for u in seeded))
    chk('mọi tệp tồn tại và là JPEG', all(open(os.path.join(D, 'uploads', 'avatars', os.path.basename(us[u]['avatar'])), 'rb').read(2) == b'\xff\xd8' for u in seeded))
    cnt = collections.Counter(pool[hashlib.md5(open(os.path.join(D, 'uploads', 'avatars', os.path.basename(us[u]['avatar'])), 'rb').read()).hexdigest()] for u in seeded)
    chk('chia đều bộ ảnh: mọi ảnh được dùng, số lần dùng chênh nhau không quá 1', len(cnt) == 7 and max(cnt.values()) - min(cnt.values()) <= 1)
    chk('ngẫu nhiên: sinh viên liền kề (theo uid) không nhận ảnh theo thứ tự cố định', len({pool[hashlib.md5(open(os.path.join(D, "uploads", "avatars", os.path.basename(us[u]["avatar"])), "rb").read()).hexdigest()] for u in sorted(seeded)[:7]}) > 1)
    chk('ảnh người dùng tự đặt không bị đụng tới', us[real_uid]['avatar'] == '/uploads/avatars/real_own.jpg' and 'avatarSeed' not in us[real_uid]
        and open(os.path.join(D, 'uploads', 'avatars', 'real_own.jpg'), 'rb').read() == b'\xff\xd8REAL')
    chk('giáo viên không bị gán ảnh', all('avatar' not in d for d in us.values() if d['role'] == 'teacher'))

    # ── API trả đúng ảnh ──
    srv = subprocess.Popen([sys.executable, API, 'serve'], env=dict(os.environ, STUDYTASK_DATA=D, STUDYTASK_PORT=str(PORT)), stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
    def req(m, p, b=None, ck=''):
        c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=10)
        c.request(m, p, json.dumps(b) if b is not None else None, {'Content-Type': 'application/json', 'Cookie': ck})
        r = c.getresponse(); sc = r.getheader('Set-Cookie'); raw = r.read()
        return r.status, (json.loads(raw) if raw[:1] == b'{' else {}), (sc.split(';')[0] if sc and 'st_session=' in sc else '')
    for _ in range(60):
        try:
            if req('GET', '/api/auth/me')[0] == 200: break
        except OSError: time.sleep(0.2)
    sv = us[sorted(seeded)[0]]
    ck = req('POST', '/api/auth/login', {'username': sv['username'], 'password': 'student123'})[2]
    chk('/api/account trả đúng ảnh của sinh viên', req('GET', '/api/account', ck=ck)[1].get('avatar') == sv['avatar'])
    lst = req('GET', '/api/doc/user', ck=ck)[1]['docs']
    chk('/api/doc/user (danh bạ) có ảnh của mọi sinh viên', sum(1 for d in lst if d.get('avatar')) == n + 1)
    srv.terminate(); srv.wait(5); srv = None

    # ── chạy lại: thay ảnh cũ, không để mồ côi ──
    r = run(ASSIGN, '--data-dir', D, '--images', IMG, '--seed', '7')
    chk('chạy lại thay ảnh cũ của script, không sinh tệp mồ côi', r.returncode == 0 and len(os.listdir(os.path.join(D, 'uploads', 'avatars'))) == n + 1)

    # ── gỡ ──
    r = run(ASSIGN, '--data-dir', D, '--remove')
    con = sqlite3.connect(os.path.join(D, 'studytask.db')); us = users(con)
    chk('--remove gỡ ảnh của script, giữ ảnh người dùng tự đặt', r.returncode == 0 and all('avatar' not in us[u] for u in seeded)
        and os.listdir(os.path.join(D, 'uploads', 'avatars')) == ['real_own.jpg'] and us[real_uid]['avatar'] == '/uploads/avatars/real_own.jpg')

    # ── purge của seed dọn cả tệp ảnh ──
    run(ASSIGN, '--data-dir', D, '--images', IMG)
    r = run(SEED, '--data-dir', D, '--purge')
    chk('seed --purge xóa luôn tệp ảnh đại diện của sinh viên seed, giữ ảnh thật', r.returncode == 0 and os.listdir(os.path.join(D, 'uploads', 'avatars')) == ['real_own.jpg'])
finally:
    if srv: srv.terminate(); srv.wait(5)
    for d in (D, IMG): shutil.rmtree(d, ignore_errors=True)
print('KẾT QUẢ:', 'ĐẠT' if ok else 'CÓ LỖI'); sys.exit(0 if ok else 1)
