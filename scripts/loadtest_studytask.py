#!/usr/bin/env python3
"""Kiểm tra chịu tải và lưu trữ của máy chủ StudyTask (chỉ thư viện chuẩn).

  run      Giả lập người dùng thật: mỗi "người dùng ảo" đăng nhập, tải dữ liệu như lúc mở web, rồi duyệt/làm trắc nghiệm.
  storage  Báo cáo dung lượng: CSDL, tệp tải lên, từng collection, ổ đĩa còn trống (chạy TRÊN máy chủ).
  disk     Đo tốc độ ghi đĩa và độ trống: ghi N MB tệp tạm rồi xóa (chạy TRÊN máy chủ).

Ví dụ:
  python scripts/loadtest_studytask.py run --base http://127.0.0.1:8787 --accounts du-lieu/seed-accounts.csv --users 50 --duration 60
  python scripts/loadtest_studytask.py run --base http://192.168.1.10:8081 --static-base http://192.168.1.10:8081 --users 200 --ramp 30 --duration 180
  python scripts/loadtest_studytask.py storage --data-dir /var/lib/studytask-loadtest
  python scripts/loadtest_studytask.py disk --data-dir /var/lib/studytask-loadtest --mb 500

Chuỗi gọi API của người dùng ảo bám theo giao diện thật (app.js, utils/firebase.js): đăng nhập → /auth/me → sharedData/global
→ userData/{uid} → /doc/user (toàn bộ người dùng, giao diện tải mỗi lần đăng nhập) → /quiz/mine.
Máy phát tải cũng là Python (GIL): với vài trăm người dùng ảo trở lên, hãy chạy nhiều tiến trình/nhiều máy, đừng kết luận chỉ từ một máy.
Dừng ngay bằng Ctrl+C: vẫn in báo cáo phần đã đo.
"""
import argparse, csv, http.client, json, os, random, shutil, sqlite3, ssl, sys, threading, time
from urllib.parse import urlparse

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass


# ── Máy khách HTTP giữ kết nối (keep-alive) + cookie phiên ─────────────────────────────────────
class Client:
    def __init__(self, base, timeout, rec):
        u = urlparse(base)
        self.https, self.host = u.scheme == 'https', u.hostname
        self.port = u.port or (443 if self.https else 80)
        self.prefix = u.path.rstrip('/')
        self.timeout, self.rec, self.cookie, self.conn = timeout, rec, '', None

    def _open(self):
        if self.https:
            return http.client.HTTPSConnection(self.host, self.port, timeout=self.timeout, context=ssl.create_default_context())
        return http.client.HTTPConnection(self.host, self.port, timeout=self.timeout)

    def request(self, name, method, path, body=None):
        data = json.dumps(body).encode() if body is not None else None
        headers = {'Cookie': self.cookie}
        if data is not None:
            headers['Content-Type'] = 'application/json'
        t0 = time.perf_counter()
        for attempt in (1, 2):
            reused = self.conn is not None
            try:
                if self.conn is None:
                    self.conn = self._open()
                self.conn.request(method, self.prefix + path, data, headers)
                r = self.conn.getresponse()
                raw = r.read()
                sc = r.getheader('Set-Cookie')
                if sc and 'st_session=' in sc:
                    self.cookie = sc.split(';')[0]
                self.rec(name, r.status, (time.perf_counter() - t0) * 1000, len(raw), None)
                if method != 'GET' and (r.status >= 400 or path.endswith('/logout')):
                    # API (HTTP/1.1) không đọc nội dung POST ở một số nhánh (logout, lỗi sớm) nên phần dư làm hỏng yêu cầu kế tiếp
                    # trên cùng kết nối. nginx đóng kết nối ngược sau mỗi yêu cầu nên bản chạy thật không gặp; ta đóng giống vậy.
                    self.close()
                try:
                    return r.status, (json.loads(raw) if raw[:1] in (b'{', b'[') else raw)
                except ValueError:
                    return r.status, raw
            except (ConnectionResetError, BrokenPipeError, http.client.RemoteDisconnected) as e:
                self.close()
                if attempt == 1 and reused:      # kết nối cũ đã bị máy chủ đóng: thử lại một lần trên kết nối mới
                    continue
                self.rec(name, 0, (time.perf_counter() - t0) * 1000, 0, type(e).__name__)
                return 0, None
            except (OSError, http.client.HTTPException) as e:
                self.close()
                self.rec(name, 0, (time.perf_counter() - t0) * 1000, 0, type(e).__name__)
                return 0, None

    def close(self):
        if self.conn is not None:
            try:
                self.conn.close()
            except OSError:
                pass
        self.conn = None


class Stats:
    """Thu số đo theo từng điểm cuối; mỗi luồng ghi vào danh sách riêng nên không cần khóa khi ghi."""
    def __init__(self):
        self.parts, self.local = [], threading.local()
        self.lock = threading.Lock()

    def rec(self, name, status, ms, nbytes, err):
        lst = getattr(self.local, 'lst', None)
        if lst is None:
            lst = self.local.lst = []
            with self.lock:
                self.parts.append(lst)
        lst.append((name, status, ms, nbytes, err, time.time()))

    def all(self):
        with self.lock:
            return [x for p in self.parts for x in list(p)]


def pct(sorted_ms, p):
    return sorted_ms[min(len(sorted_ms) - 1, int(len(sorted_ms) * p / 100))] if sorted_ms else 0.0


# Mã trạng thái KHÔNG tính là lỗi vì là hành vi đúng của máy chủ (nộp bài lần 2, đã hết hạn)
EXPECTED = {('quiz-submit', 409), ('quiz-submit', 400)}


# ── Người dùng ảo ──────────────────────────────────────────────────────────────────────────────
def answers_for(quiz, rng):
    out = {}
    for q in quiz.get('questions', []):
        ids = [a['id'] for a in q.get('answers', [])]
        if q.get('type') == 'fill':
            out[str(q['id'])] = ['']
        elif q.get('type') == 'multiple' and len(ids) >= 2:
            out[str(q['id'])] = rng.sample(ids, 2)
        elif ids:
            out[str(q['id'])] = [rng.choice(ids)]
    return out


def virtual_user(idx, acct, a, stats, stop_at, rng):
    c = Client(a.base, a.timeout, stats.rec)
    sc = Client(a.static_base, a.timeout, stats.rec) if a.static_base else None
    submitted = set()
    think = lambda: time.sleep(min(10, rng.expovariate(1000.0 / a.think_ms))) if a.think_ms > 0 else None
    while time.time() < stop_at:
        st, r = c.request('login', 'POST', '/api/auth/login', {'username': acct['username'], 'password': acct['password']})
        if st != 200:
            time.sleep(1)
            continue
        uid = r['user']['uid']
        c.request('auth-me', 'GET', '/api/auth/me')
        _, sh = c.request('shared-global', 'GET', '/api/doc/sharedData/global')
        shared = (sh or {}).get('data') or {} if isinstance(sh, dict) else {}
        c.request('user-data', 'GET', f'/api/doc/userData/{uid}')
        c.request('all-users', 'GET', '/api/doc/user')                 # giao diện tải mọi hồ sơ mỗi lần đăng nhập (app.js)
        if acct['role'] == 'student':
            c.request('quiz-mine', 'GET', '/api/quiz/mine')
        else:
            c.request('activities', 'GET', '/api/doc/activities')
        quizzes = [q for q in shared.get('quizzes', []) if q.get('status') == 'active']
        result_quizzes = []
        if acct['role'] == 'teacher':                      # giáo viên chỉ xem kết quả đề thuộc môn mình dạy
            _, ud = c.request('user-doc', 'GET', f'/api/doc/user/{uid}')
            mine = ((ud or {}).get('data') or {}).get('subjectIds') or [] if isinstance(ud, dict) else []
            result_quizzes = [q for q in shared.get('quizzes', []) if q.get('subjectId') in mine]
        mats = [m['url'] for m in shared.get('materials', []) if m.get('url')]
        for _ in range(rng.randint(3, 8)):
            if time.time() >= stop_at:
                break
            think()
            roll = rng.random()
            if acct['role'] != 'student':
                if result_quizzes and roll < 0.6:
                    c.request('quiz-results', 'GET', f"/api/quiz/{rng.choice(result_quizzes)['id']}/results")
                else:
                    c.request('shared-global', 'GET', '/api/doc/sharedData/global')
            elif roll < 0.30:
                c.request('shared-global', 'GET', '/api/doc/sharedData/global')
            elif roll < 0.45:
                c.request('quiz-mine', 'GET', '/api/quiz/mine')
            elif roll < 0.70 and sc and mats:
                sc.request('material-file', 'GET', rng.choice(mats))
            elif roll < 0.70:
                c.request('user-data', 'GET', f'/api/doc/userData/{uid}')
            elif roll < 0.85 and quizzes and not a.no_submit:
                q = rng.choice(quizzes)
                if q['id'] not in submitted:
                    submitted.add(q['id'])
                    c.request('quiz-submit', 'POST', f"/api/quiz/{q['id']}/submit", {'answers': answers_for(q, rng)})
            else:
                c.request('auth-me', 'GET', '/api/auth/me')
        think()
        c.request('logout', 'POST', '/api/auth/logout', {})
        if a.once:
            break
    c.close()
    if sc:
        sc.close()


def load_accounts(path, users, teacher_ratio, rng):
    with open(path, encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    st = [r for r in rows if r['role'] == 'student']
    te = [r for r in rows if r['role'] == 'teacher']
    if not st:
        sys.exit('Không có tài khoản sinh viên trong ' + path)
    n_te = min(len(te), round(users * teacher_ratio))
    n_st = users - n_te
    pick = rng.sample(st, n_st) if n_st <= len(st) else [rng.choice(st) for _ in range(n_st)]
    if n_st > len(st):
        print(f'⚠ Chỉ có {len(st)} sinh viên cho {n_st} người dùng ảo: một tài khoản sẽ được dùng bởi nhiều luồng cùng lúc.')
    return pick + (rng.sample(te, n_te) if n_te else [])


def report(stats, started, wall, a):
    rows = stats.all()
    by = {}
    for name, status, ms, nbytes, err, _ in rows:
        by.setdefault(name, []).append((status, ms, nbytes, err))
    print(f'\n{"Điểm cuối":<14}{"Số gọi":>8}{"Lỗi":>7}{"p50 ms":>9}{"p95 ms":>9}{"p99 ms":>9}{"Max ms":>9}{"KB/lần":>9}')
    total = bad = 0
    for name in sorted(by):
        lst = by[name]
        errs = sum(1 for s, _, _, e in lst if e or not (200 <= s < 300) and (name, s) not in EXPECTED)
        ms = sorted(x[1] for x in lst)
        kb = sum(x[2] for x in lst) / len(lst) / 1024
        print(f'{name:<14}{len(lst):>8}{errs:>7}{pct(ms, 50):>9.0f}{pct(ms, 95):>9.0f}{pct(ms, 99):>9.0f}{ms[-1]:>9.0f}{kb:>9.1f}')
        total, bad = total + len(lst), bad + errs
    errtypes = {}
    for name, status, _, _, err, _ in rows:
        if err or not (200 <= status < 300) and (name, status) not in EXPECTED:
            key = f'{name}: {err or status}'
            errtypes[key] = errtypes.get(key, 0) + 1
    all_ms = sorted(x[2] for x in rows)
    mb = sum(x[3] for x in rows) / 1e6
    rate = bad / total if total else 1.0
    print(f'\nTổng {total} lần gọi trong {wall:.0f}s = {total / wall:.1f} yêu cầu/s, {mb / wall:.2f} MB/s tải xuống | '
          f'lỗi {bad} ({rate * 100:.2f}%) | p95 chung {pct(all_ms, 95):.0f} ms')
    if errtypes:
        print('Lỗi theo loại:', ', '.join(f'{k} ×{v}' for k, v in sorted(errtypes.items(), key=lambda x: -x[1])[:8]))
    # nhịp theo thời gian: thấy được lúc máy chủ bắt đầu nghẽn
    buckets = {}
    for _, status, ms, _, err, ts in rows:
        b = buckets.setdefault(int((ts - started) // max(5, wall // 10)), [0, 0, []])
        b[0] += 1
        b[1] += 1 if err or status >= 500 or status == 0 else 0
        b[2].append(ms)
    step = max(5, int(wall // 10))
    print(f'Theo thời gian (mỗi {step}s):  giây | yêu cầu/s | lỗi | p95 ms')
    for k in sorted(buckets):
        n, e, ms = buckets[k]
        print(f'   {k * step:>4}s | {n / step:>9.1f} | {e:>3} | {pct(sorted(ms), 95):>6.0f}')
    p95 = pct(all_ms, 95)
    ok = rate <= a.max_error_rate and (not a.max_p95_ms or p95 <= a.max_p95_ms)
    why = [f'lỗi {rate * 100:.2f}% > {a.max_error_rate * 100:.1f}%'] if rate > a.max_error_rate else []
    why += [f'p95 {p95:.0f} ms > {a.max_p95_ms:.0f} ms'] if a.max_p95_ms and p95 > a.max_p95_ms else []
    print('KẾT LUẬN:', 'ĐẠT' if ok else 'KHÔNG ĐẠT (' + '; '.join(why) + ')')
    if a.json:
        with open(a.json, 'w', encoding='utf-8') as f:
            json.dump({'users': a.users, 'duration': wall, 'requests': total, 'errors': bad, 'rps': total / wall,
                       'p95_ms': pct(all_ms, 95), 'endpoints': {n: {'n': len(v), 'p50': pct(sorted(x[1] for x in v), 50),
                                                                   'p95': pct(sorted(x[1] for x in v), 95)} for n, v in by.items()}},
                      f, ensure_ascii=False, indent=1)
    return ok


def cmd_run(a):
    rng = random.Random(a.seed)
    accts = load_accounts(a.accounts, a.users, a.teacher_ratio, rng)
    st, _ = Client(a.base, a.timeout, lambda *x: None).request('probe', 'GET', '/api/auth/me')
    if st == 0:
        sys.exit(f'Không kết nối được {a.base}')
    stats, threads = Stats(), []
    started = time.time()
    stop_at = started + a.ramp + a.duration
    print(f'Bắt đầu: {len(accts)} người dùng ảo, tăng dần trong {a.ramp}s, chạy tổng {a.ramp + a.duration}s, '
          f'think trung bình {a.think_ms} ms → {a.base}')
    for i, acct in enumerate(accts):
        t = threading.Thread(target=virtual_user, args=(i, acct, a, stats, stop_at, random.Random(a.seed * 7919 + i)), daemon=True)
        threads.append(t)
    try:
        for i, t in enumerate(threads):
            if a.ramp and len(threads) > 1:
                time.sleep(a.ramp / len(threads))
            t.start()
            if i and i % max(1, len(threads) // 10) == 0:
                rows = stats.all()
                print(f'  [{time.time() - started:>4.0f}s] {i} người dùng đã vào, {len(rows)} lần gọi, '
                      f'{sum(1 for r in rows if r[4] or r[1] >= 500 or r[1] == 0)} lỗi', flush=True)
        for t in threads:
            t.join(max(0, stop_at - time.time()) + a.timeout + 5)
    except KeyboardInterrupt:
        print('\nĐã dừng theo yêu cầu, tổng hợp phần đã đo...')
    return 0 if report(stats, started, time.time() - started, a) else 1


# ── storage ────────────────────────────────────────────────────────────────────────────────────
def dir_size(path):
    n = b = 0
    for root, _, files in os.walk(path):
        for f in files:
            try:
                b += os.path.getsize(os.path.join(root, f))
                n += 1
            except OSError:
                pass
    return n, b


def human(b):
    for u in ('B', 'KB', 'MB', 'GB', 'TB'):
        if b < 1024 or u == 'TB':
            return f'{b:.1f} {u}' if u != 'B' else f'{b} B'
        b /= 1024


def cmd_storage(a):
    db = os.path.join(a.data_dir, 'studytask.db')
    if not os.path.exists(db):
        sys.exit('Không thấy ' + db)
    print(f'== Dung lượng dữ liệu: {a.data_dir} ==')
    for suffix in ('', '-wal', '-shm'):
        if os.path.exists(db + suffix):
            print(f'  studytask.db{suffix:<5} {human(os.path.getsize(db + suffix))}')
    up = os.path.join(a.data_dir, 'uploads')
    n, b = dir_size(up) if os.path.isdir(up) else (0, 0)
    sn, sb = dir_size(os.path.join(up, 'submissions')) if os.path.isdir(os.path.join(up, 'submissions')) else (0, 0)
    print(f'  uploads/        {n} tệp, {human(b)}  (trong đó bài nộp sinh viên: {sn} tệp, {human(sb)})')
    du = shutil.disk_usage(a.data_dir)
    print(f'  Ổ đĩa:          tổng {human(du.total)}, đã dùng {human(du.used)} ({du.used / du.total * 100:.0f}%), còn trống {human(du.free)}')
    try:
        con = sqlite3.connect(f'file:{db}?mode=ro', uri=True, timeout=10)
        con.execute('SELECT 1 FROM docs LIMIT 1')
    except sqlite3.Error:
        con = sqlite3.connect(db, timeout=10)
    q = lambda sql: con.execute(sql).fetchall()
    pages, psize, free = q('PRAGMA page_count')[0][0], q('PRAGMA page_size')[0][0], q('PRAGMA freelist_count')[0][0]
    print(f'  SQLite:         {pages} trang × {psize} B, {free} trang trống có thể thu hồi bằng VACUUM ({human(free * psize)})')
    print('\n== Bảng ==')
    for t in ('accounts', 'sessions', 'chat', 'contact_email', 'submission_files', 'codes'):
        try:
            print(f'  {t:<18}{q(f"SELECT COUNT(*) FROM {t}")[0][0]:>9} dòng')
        except sqlite3.Error:
            pass
    try:
        print(f'  {"phiên còn hạn":<18}{q(f"SELECT COUNT(*) FROM sessions WHERE expires > {time.time()}")[0][0]:>9}')
    except sqlite3.Error:
        pass
    print('\n== docs theo collection ==')
    print(f'  {"collection":<16}{"số bản ghi":>11}{"tổng":>12}{"lớn nhất":>12}')
    for col, n, tot, mx in q('SELECT col, COUNT(*), SUM(LENGTH(data)), MAX(LENGTH(data)) FROM docs GROUP BY col ORDER BY 3 DESC'):
        print(f'  {col:<16}{n:>11}{human(tot):>12}{human(mx):>12}')
    shared = q("SELECT LENGTH(data) FROM docs WHERE col='sharedData' AND id='global'")
    if shared:
        pc = shared[0][0] / (5 * 1024 * 1024) * 100
        print(f'\n  sharedData/global = {human(shared[0][0])} ({pc:.0f}% giới hạn ghi 5 MB của máy chủ'
              + ('  ⚠ giáo viên/admin sẽ không lưu được khi vượt)' if pc > 80 else ')'))
    if a.check:
        print('\nPRAGMA quick_check:', q('PRAGMA quick_check')[0][0])
    if a.json:
        with open(a.json, 'w', encoding='utf-8') as f:
            json.dump({'db_bytes': os.path.getsize(db), 'uploads_files': n, 'uploads_bytes': b, 'disk_free': du.free}, f)
    return 0


def cmd_disk(a):
    d = os.path.join(a.data_dir, 'uploads', '_loadtest_disk')
    free = shutil.disk_usage(a.data_dir).free
    need = a.mb * 1024 * 1024
    if free - need < max(1 << 30, shutil.disk_usage(a.data_dir).total // 10):
        sys.exit(f'Từ chối: ghi {a.mb} MB sẽ để ổ đĩa còn dưới 1 GB/10%. Còn trống {human(free)}.')
    os.makedirs(d, exist_ok=True)
    chunk, blk = os.urandom(1 << 20), 10
    t0, written, files = time.perf_counter(), 0, []
    try:
        while written < need:
            p = os.path.join(d, f'f{len(files):05d}.bin')
            with open(p, 'wb') as f:
                for _ in range(blk):
                    f.write(chunk)
                f.flush()
                os.fsync(f.fileno())
            files.append(p)
            written += blk << 20
        dt = time.perf_counter() - t0
        print(f'Ghi {human(written)} ({len(files)} tệp, fsync từng tệp) trong {dt:.1f}s = {written / dt / 1e6:.0f} MB/s')
        t0 = time.perf_counter()
        read = 0
        for p in files:
            with open(p, 'rb') as f:
                while f.read(1 << 20):
                    read += 1 << 20
        dt = time.perf_counter() - t0
        print(f'Đọc lại {human(read)} trong {dt:.1f}s = {read / dt / 1e6:.0f} MB/s (có thể do bộ nhớ đệm hệ điều hành)')
    finally:
        if not a.keep:
            shutil.rmtree(d, ignore_errors=True)
            print('Đã xóa tệp tạm.')
    return 0


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest='cmd', required=True)
    r = sub.add_parser('run', help='kiểm tải API bằng người dùng ảo')
    r.add_argument('--base', default='http://127.0.0.1:8787', help='địa chỉ API (cổng 8787) hoặc nginx')
    r.add_argument('--static-base', help='địa chỉ nginx phục vụ /uploads/ (bật tải tệp tài liệu); bỏ trống = không tải tệp')
    r.add_argument('--accounts', required=True, help='seed-accounts.csv do seed_curriculum.py tạo')
    r.add_argument('--users', type=int, default=20, help='số người dùng ảo đồng thời')
    r.add_argument('--duration', type=int, default=60, help='giây chạy sau khi đã đủ người dùng')
    r.add_argument('--ramp', type=int, default=10, help='giây tăng dần số người dùng')
    r.add_argument('--think-ms', type=int, default=1500, help='thời gian nghĩ trung bình giữa hai thao tác')
    r.add_argument('--teacher-ratio', type=float, default=0.05, help='tỉ lệ giáo viên trong số người dùng ảo')
    r.add_argument('--no-submit', action='store_true', help='không nộp bài trắc nghiệm (không ghi kết quả vào CSDL)')
    r.add_argument('--once', action='store_true', help='mỗi người dùng chỉ chạy một phiên rồi thôi')
    r.add_argument('--timeout', type=float, default=30)
    r.add_argument('--max-error-rate', type=float, default=0.01)
    r.add_argument('--max-p95-ms', type=float, default=2000, help='ngưỡng p95 chung (ms); 0 = không xét. Mặc định 2000')
    r.add_argument('--seed', type=int, default=1)
    r.add_argument('--json', help='ghi tóm tắt ra tệp JSON')
    s = sub.add_parser('storage', help='báo cáo dung lượng (chạy trên máy chủ)')
    s.add_argument('--data-dir', required=True)
    s.add_argument('--check', action='store_true', help='chạy PRAGMA quick_check (chậm với CSDL lớn)')
    s.add_argument('--json')
    d = sub.add_parser('disk', help='đo tốc độ ghi đĩa (chạy trên máy chủ)')
    d.add_argument('--data-dir', required=True)
    d.add_argument('--mb', type=int, default=500)
    d.add_argument('--keep', action='store_true')
    a = p.parse_args()
    sys.exit({'run': cmd_run, 'storage': cmd_storage, 'disk': cmd_disk}[a.cmd](a))


if __name__ == '__main__':
    main()
