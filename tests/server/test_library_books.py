#!/usr/bin/env python3
"""Kho sách điện tử của Thư viện: nạp bằng scripts/import_library.py, danh mục chỉ đọc khi đã đăng nhập, tệp PDF chỉ tải qua API
(API tạm cổng 8805, dữ liệu tạm; dùng PDF giả vài byte, không cần sách thật)."""
import hashlib, http.client, json, os, shutil, sqlite3, stat, subprocess, sys, tempfile, time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
API = os.path.join(ROOT, 'server', 'studytask_api.py')
IMPORT = os.path.join(ROOT, 'scripts', 'import_library.py')
PORT = 8805
D = tempfile.mkdtemp(); STG = tempfile.mkdtemp()
ENV = dict(os.environ, STUDYTASK_DATA=D, STUDYTASK_PORT=str(PORT))
subprocess.run([sys.executable, API, 'create-user', 'ad01', 'adminpass1', 'admin', 'AD'], env=ENV, check=True, capture_output=True)
srv = subprocess.Popen([sys.executable, API, 'serve'], env=ENV, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
ok = True


def chk(n, c):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + n)


def wait_ready(seconds=15):
    end = time.time() + seconds
    while time.time() < end:
        if srv.poll() is not None:
            print('FAIL API thoát ngay khi khởi động'); sys.exit(1)
        try:
            c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=1); c.request('GET', '/api/auth/me')
            if c.getresponse().status == 200:
                return
        except OSError:
            pass
        time.sleep(0.2)
    print('FAIL API không sẵn sàng'); sys.exit(1)


def req(m, p, b=None, ck=''):
    c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=5)
    c.request(m, p, json.dumps(b) if b is not None else None, {'Content-Type': 'application/json', 'Cookie': ck})
    r = c.getresponse(); sc = r.getheader('Set-Cookie'); raw = r.read()
    try: js = json.loads(raw.decode()) if raw else {}
    except ValueError: js = {}
    return r.status, js, dict((k.lower(), v) for k, v in r.getheaders()), raw, (sc.split(';')[0] if sc and 'st_session=' in sc else '')


def login(u, pw='matkhau123'):
    return req('POST', '/api/auth/login', {'username': u, 'password': pw})[4]


def run_import(*args):
    return subprocess.run([sys.executable, IMPORT, '--data-dir', D, *args], capture_output=True, text=True, encoding='utf-8')


def db_rows(sql, *a):
    c = sqlite3.connect(os.path.join(D, 'studytask.db')); c.execute('PRAGMA busy_timeout=3000')
    try: return c.execute(sql, a).fetchall()
    finally: c.close()


try:
    wait_ready()
    # ── chuẩn bị tệp giả: 2 sách, có bìa; 1 sách thiếu tệp PDF ──
    os.makedirs(os.path.join(STG, 'books')); os.makedirs(os.path.join(STG, 'covers'))
    pdfs = {'sach-mot': b'%PDF-1.4\n' + b'A' * 5000, 'sach-hai': b'%PDF-1.4\n' + b'B' * 7000}
    catalog = []
    for i, (bid, data) in enumerate(pdfs.items()):
        open(os.path.join(STG, 'books', bid + '.pdf'), 'wb').write(data)
        open(os.path.join(STG, 'covers', bid + '.jpg'), 'wb').write(b'\xff\xd8\xff\xe0' + b'J' * 300)
        catalog.append({'id': bid, 'title': f'Sách {i + 1}', 'author': 'Tác giả', 'genre': 'van-hoc-vn', 'year': '', 'language': 'vi', 'series': '', 'description': '',
                        'sourceName': 'Internet Archive', 'sourceId': bid, 'sourceUrl': 'https://archive.org/details/' + bid, 'license': '', 'licenseLabel': 'Chưa ghi giấy phép trên trang nguồn',
                        'file': bid + '.pdf', 'originalName': bid + '.pdf', 'size': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'seed': 'library-v1'})
    catalog.append({**catalog[0], 'id': 'thieu-file', 'file': 'thieu-file.pdf', 'title': 'Thiếu tệp'})
    cat = os.path.join(STG, 'catalog.json'); json.dump(catalog, open(cat, 'w', encoding='utf-8'), ensure_ascii=False)
    json.dump({'sach-mot': 12, 'sach-hai': 34}, open(os.path.join(STG, 'covers', 'pages.json'), 'w'))

    r = run_import('--staging', STG, '--catalog', cat, '--dry-run')
    chk('--dry-run báo kế hoạch, không ghi gì', r.returncode == 0 and not os.path.exists(os.path.join(D, 'library', 'books', 'sach-mot.pdf'))
        and db_rows("SELECT COUNT(*) FROM docs WHERE col='libraryBooks'")[0][0] == 0)
    r = run_import('--staging', STG, '--catalog', cat)
    chk('nạp sách: 2 sách vào danh mục, sách thiếu tệp PDF bị báo cảnh báo và bỏ qua', r.returncode == 0 and '2 sách vào danh mục' in r.stdout and 'thiếu tệp PDF của thieu-file' in r.stdout)
    pdf = os.path.join(D, 'library', 'books', 'sach-mot.pdf')
    chk('PDF nằm ở library/books (không công khai), bìa ở uploads/library; chép đủ byte', os.path.getsize(pdf) == 5009 + 0 and os.path.isfile(os.path.join(D, 'uploads', 'library', 'sach-mot.jpg')))
    chk('tệp đọc được cho nginx (644), thư mục 755 (bỏ qua trên Windows)', os.name == 'nt' or (stat.S_IMODE(os.stat(pdf).st_mode) == 0o644 and stat.S_IMODE(os.stat(os.path.dirname(pdf)).st_mode) == 0o755))
    row = json.loads(db_rows("SELECT data FROM docs WHERE col='libraryBooks' AND id='sach-hai'")[0][0])
    chk('danh mục có nguồn, giấy phép, số trang, bìa, nhãn seed', row['pages'] == 34 and row['cover'] == '/uploads/library/sach-hai.jpg' and row['sourceUrl'].startswith('https://archive.org/details/')
        and row['seed'] == 'library-v1' and row['licenseLabel'] and row['size'] == 7009)
    r = run_import('--staging', STG, '--catalog', cat)
    chk('chạy lại: bỏ qua sách đã có (không chép lại)', r.returncode == 0 and '0 tệp mới, 2 đã có' in r.stdout)
    open(os.path.join(STG, 'books', 'sach-hai.pdf'), 'wb').write(b'%PDF-1.4\n' + b'X' * 7000)
    os.remove(os.path.join(D, 'library', 'books', 'sach-hai.pdf'))
    r = run_import('--staging', STG, '--catalog', cat)
    chk('tệp chép lên sai nội dung (SHA-256 không khớp) → dừng, không nạp', r.returncode != 0 and 'SHA-256' in (r.stdout + r.stderr))
    open(os.path.join(STG, 'books', 'sach-hai.pdf'), 'wb').write(pdfs['sach-hai'])
    chk('sửa lại đúng thì nạp được', run_import('--staging', STG, '--catalog', cat).returncode == 0)

    # ── quyền đọc ──
    ad = login('ad01', 'adminpass1')
    req('POST', '/api/admin/users', {'username': 'sv01', 'password': 'matkhau123', 'profile': {'name': 'SV', 'role': 'student', 'subjectIds': []}}, ad)
    sv = login('sv01')
    st, js, _, _, _ = req('GET', '/api/doc/libraryBooks')
    chk('chưa đăng nhập không xem được danh mục (bị từ chối hoặc danh sách rỗng)', st in (401, 403) or (st == 200 and js.get('docs') == []))
    st, js, _, _, _ = req('GET', '/api/doc/libraryBooks/sach-mot')
    chk('chưa đăng nhập không đọc được từng sách trong danh mục → 403', st == 403)
    st, js, _, _, _ = req('GET', '/api/doc/libraryBooks', ck=sv)
    chk('sinh viên đã đăng nhập xem được danh mục 2 sách', st == 200 and sorted(d['id'] for d in js['docs']) == ['sach-hai', 'sach-mot'])
    chk('sinh viên không sửa/xóa được danh mục → 403', req('PUT', '/api/doc/libraryBooks/sach-mot', {'data': {'title': 'X'}}, sv)[0] == 403
        and req('DELETE', '/api/doc/libraryBooks/sach-mot', ck=sv)[0] == 403)
    chk('ngay cả Admin cũng không ghi qua /api/doc (chỉ script nạp) → 403', req('PUT', '/api/doc/libraryBooks/sach-moi', {'data': {'title': 'X', 'file': 'x.pdf'}}, ad)[0] == 403)

    # ── tải tệp PDF ──
    st, _, _, _, _ = req('GET', '/api/files/library/sach-mot.pdf')
    chk('chưa đăng nhập không tải được PDF → 401', st == 401)
    def browser_get(path, ck=''):
        c = http.client.HTTPConnection('127.0.0.1', PORT, timeout=5)
        c.request('GET', path, headers={'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8', 'Cookie': ck})
        r = c.getresponse(); return r.status, (r.getheader('Content-Type') or ''), r.read().decode('utf-8', 'replace')
    st, ct, body = browser_get('/api/files/library/sach-mot.pdf')
    chk('mở link sách trên trình duyệt khi chưa đăng nhập → 401 kèm trang HTML dễ đọc (không phải JSON thô), có nút Đăng nhập',
        st == 401 and ct.startswith('text/html') and 'Cần đăng nhập để đọc sách' in body and 'Đăng nhập' in body and '"error"' not in body)
    st, ct, body = browser_get('/api/files/library/khong-co.pdf', sv)
    chk('trình duyệt mở sách không có → 404 kèm trang HTML "Không tìm thấy sách"', st == 404 and ct.startswith('text/html') and 'Không tìm thấy sách' in body)
    st, js, _, _, _ = req('GET', '/api/files/library/khong-co.pdf', ck=sv)
    chk('ứng dụng (không xin HTML) vẫn nhận JSON lỗi như cũ', st == 404 and js.get('error', {}).get('code') == 'not-found')
    st, js, hd, raw, _ = req('GET', '/api/files/library/sach-mot.pdf', ck=sv)
    chk('đã đăng nhập: API ủy quyền cho nginx phát tệp (X-Accel-Redirect), không gửi thân tệp', st == 200 and hd.get('x-accel-redirect') == '/_library/sach-mot.pdf'
        and hd.get('content-type') == 'application/pdf' and raw == b'' and 'inline' in hd.get('content-disposition', ''))
    chk('mã không có hoặc sai định dạng → 404', req('GET', '/api/files/library/khong-co.pdf', ck=sv)[0] == 404 and req('GET', '/api/files/library/..%2f..%2fstudytask.db', ck=sv)[0] == 404
        and req('GET', '/api/files/library/Sach_Mot.pdf', ck=sv)[0] == 404)
    c = sqlite3.connect(os.path.join(D, 'studytask.db'))
    c.execute("INSERT OR REPLACE INTO docs VALUES ('libraryBooks','hong',?)", (json.dumps({'id': 'hong', 'file': '../../studytask.db'}),))
    c.execute("INSERT OR REPLACE INTO docs VALUES ('libraryBooks','mat-tep',?)", (json.dumps({'id': 'mat-tep', 'file': 'mat-tep.pdf'}),))
    c.commit(); c.close()
    chk('danh mục bị sửa (đường dẫn thoát thư mục, hoặc tệp đã mất) → 404, không lộ tệp khác',
        req('GET', '/api/files/library/hong.pdf', ck=sv)[0] == 404 and req('GET', '/api/files/library/mat-tep.pdf', ck=sv)[0] == 404)
    chk('không có đường dẫn công khai tới PDF: /uploads/library chỉ chứa bìa', not [f for f in os.listdir(os.path.join(D, 'uploads', 'library')) if f.endswith('.pdf')])

    # ── --prune: sách bị loại khỏi danh mục (vd. không rõ giấy phép) được gỡ, tệp chuyển vào library/removed/ chứ không xóa hẳn ──
    cat1 = os.path.join(STG, 'catalog-1.json'); json.dump(catalog[:1], open(cat1, 'w', encoding='utf-8'), ensure_ascii=False)
    r = run_import('--staging', STG, '--catalog', cat1, '--prune', '--dry-run')
    chk('--prune --dry-run chỉ báo, không gỡ gì', r.returncode == 0 and '1 sách không còn trong danh mục' in r.stdout
        and os.path.isfile(os.path.join(D, 'library', 'books', 'sach-hai.pdf')))
    r = run_import('--staging', STG, '--catalog', cat1, '--prune')
    rm_dirs = os.listdir(os.path.join(D, 'library', 'removed')) if os.path.isdir(os.path.join(D, 'library', 'removed')) else []
    kept = [i for (i,) in db_rows("SELECT id FROM docs WHERE col='libraryBooks'")]
    chk('--prune gỡ sách không còn trong danh mục: mất khỏi CSDL, PDF và bìa chuyển vào library/removed/ (khôi phục được)',
        r.returncode == 0 and 'sach-hai' not in kept and 'sach-mot' in kept and not os.path.exists(os.path.join(D, 'library', 'books', 'sach-hai.pdf'))
        and len(rm_dirs) == 1 and sorted(os.listdir(os.path.join(D, 'library', 'removed', rm_dirs[0]))) == ['danh-muc-da-go.json', 'sach-hai.jpg', 'sach-hai.pdf'])
    chk('--prune không đụng bản ghi không do script nạp (không có nhãn seed)', 'hong' in kept and 'mat-tep' in kept)
    chk('sách đã gỡ thì tải về → 404', req('GET', '/api/files/library/sach-hai.pdf', ck=sv)[0] == 404)

    # ── gỡ ──
    r = run_import('--remove')
    chk('--remove gỡ đúng sách do script nạp (danh mục, PDF, bìa, meta)', r.returncode == 0 and not os.path.exists(pdf)
        and not os.path.exists(os.path.join(D, 'uploads', 'library', 'sach-mot.jpg'))
        and db_rows("SELECT COUNT(*) FROM docs WHERE col='libraryBooks' AND json_extract(data,'$.seed')='library-v1'")[0][0] == 0
        and db_rows("SELECT COUNT(*) FROM docs WHERE col='meta' AND id='seed_library_v1'")[0][0] == 0)
finally:
    srv.terminate(); shutil.rmtree(D, ignore_errors=True); shutil.rmtree(STG, ignore_errors=True)
print('\nKẾT QUẢ: ' + ('ĐẠT' if ok else 'KHÔNG ĐẠT')); sys.exit(0 if ok else 1)
