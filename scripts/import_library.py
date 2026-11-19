#!/usr/bin/env python3
"""Nạp kho sách điện tử (từ Internet Archive) vào máy chủ StudyTask: tệp PDF, ảnh bìa và danh mục hiển thị ở trang Thư viện.

Chạy TRÊN MÁY CHỦ, sau khi đã chép thư mục chuẩn bị (staging) lên máy chủ:
  staging/books/<mã>.pdf          (tên tệp lấy từ trường "file" của danh mục)
  staging/covers/<mã>.jpg         (do scripts/render_library_covers.ps1 vẽ)
  staging/covers/pages.json       ({mã: số trang}, tùy chọn)

Danh mục mặc định là scripts/data/thu-vien-sach.json (do scripts/prepare_library.py tạo; có nguồn Archive.org, giấy phép, SHA-256).

  python3 scripts/import_library.py --data-dir /var/lib/studytask --staging ~/library-staging            # nạp
  python3 scripts/import_library.py --data-dir ... --staging ... --dry-run                                  # chỉ báo kế hoạch
  python3 scripts/import_library.py --data-dir ... --remove                                                  # gỡ đúng sách do script này nạp

Kết quả:
  <data>/library/books/<mã>.pdf        không công khai: chỉ tải qua /api/files/library/<mã>.pdf sau khi đăng nhập (nginx X-Accel-Redirect)
  <data>/uploads/library/<mã>.jpg      ảnh bìa (công khai như ảnh đại diện)
  docs libraryBooks/<mã>               danh mục: tên, tác giả, thể loại, nguồn, giấy phép, số trang, dung lượng (đọc được khi đã đăng nhập)

Chạy lại nhiều lần được (bỏ qua sách đã có đúng SHA-256). Chỉ dùng thư viện chuẩn. Ghi vào SQLite bằng giao dịch ngắn (an toàn khi API đang chạy).
Khuyến nghị chạy ưu tiên I/O thấp:  nice -n 19 ionice -c3 python3 scripts/import_library.py ...
"""
import argparse, hashlib, json, os, shutil, sqlite3, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG = os.path.join(HERE, 'data', 'thu-vien-sach.json')
TAG = 'library-v1'
META_ID = 'seed_library_v1'
FIELDS = ('id', 'title', 'author', 'genre', 'year', 'language', 'series', 'description', 'sourceName', 'sourceId', 'sourceUrl',
          'license', 'licenseLabel', 'file', 'originalName', 'size', 'sha256')


def human(n):
    for u in ('B', 'KB', 'MB', 'GB'):
        if n < 1024 or u == 'GB':
            return f'{n:.1f} {u}' if u != 'B' else f'{n} B'
        n /= 1024


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def put_file(src, dst, move=False):
    """Chép (hoặc chuyển) src → dst nguyên tử: ghi tệp .part rồi đổi tên; tệp đọc được cho nginx (644), thư mục 755."""
    os.makedirs(os.path.dirname(dst), mode=0o755, exist_ok=True)
    os.chmod(os.path.dirname(dst), 0o755)
    if move:                       # cùng ổ đĩa: đổi tên (không ghi lại 2 GB); khác ổ thì rơi xuống nhánh chép bên dưới
        try:
            os.chmod(src, 0o644)
            os.replace(src, dst)
            return
        except OSError:
            pass
    part = dst + '.part'
    shutil.copyfile(src, part)
    os.chmod(part, 0o644)
    os.replace(part, dst)
    if move:
        os.remove(src)


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--data-dir', required=True, help='thư mục dữ liệu của máy chủ (chứa studytask.db và uploads/)')
    ap.add_argument('--staging', help='thư mục đã chuẩn bị: books/ và covers/')
    ap.add_argument('--catalog', default=CATALOG)
    ap.add_argument('--move', action='store_true', help='chuyển tệp từ staging thay vì chép (đỡ tốn chỗ)')
    ap.add_argument('--no-verify', action='store_true', help='bỏ kiểm tra SHA-256 của tệp trong staging (chỉ để thử nhanh)')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--remove', action='store_true', help='gỡ sách do script này nạp (xóa tệp, bìa và danh mục)')
    a = ap.parse_args(argv)

    data = os.path.abspath(a.data_dir)
    db_path = os.path.join(data, 'studytask.db')
    if not os.path.exists(db_path):
        sys.exit(f'Không thấy {db_path}')
    books_dir = os.path.join(data, 'library', 'books')
    cover_dir = os.path.join(data, 'uploads', 'library')
    con = sqlite3.connect(db_path, timeout=30, isolation_level=None)
    con.execute('PRAGMA journal_mode=WAL')

    if a.remove:
        rows = [(i, json.loads(d)) for i, d in con.execute("SELECT id, data FROM docs WHERE col='libraryBooks'")]
        mine = [(i, d) for i, d in rows if d.get('seed') == TAG]
        removed = 0
        for i, d in mine:
            for path in (os.path.join(books_dir, d.get('file', '')), os.path.join(cover_dir, i + '.jpg')):
                if d.get('file') and os.path.isfile(path):
                    os.remove(path)
                    removed += 1
        con.execute('BEGIN IMMEDIATE')
        con.executemany("DELETE FROM docs WHERE col='libraryBooks' AND id=?", [(i,) for i, _ in mine])
        con.execute("DELETE FROM docs WHERE col='meta' AND id=?", (META_ID,))
        con.execute('COMMIT')
        print(f'Đã gỡ {len(mine)} sách và {removed} tệp.')
        return 0

    if not a.staging:
        sys.exit('Thiếu --staging')
    stg = os.path.abspath(os.path.expanduser(a.staging))
    catalog = json.load(open(a.catalog, encoding='utf-8'))
    pages = {}
    pj = os.path.join(stg, 'covers', 'pages.json')
    if os.path.exists(pj):
        pages = json.load(open(pj, encoding='utf-8-sig'))

    plan, problems = [], []
    for b in catalog:
        src = os.path.join(stg, 'books', b['file'])
        cov = os.path.join(stg, 'covers', b['id'] + '.jpg')
        dst = os.path.join(books_dir, b['file'])
        if not os.path.isfile(src) and not os.path.isfile(dst):
            problems.append(f'thiếu tệp PDF của {b["id"]}')
            continue
        have = os.path.isfile(dst) and os.path.getsize(dst) == b['size']
        plan.append((b, src, cov, dst, have))
    need = sum(b['size'] for b, _, _, dst, have in plan if not have)
    free = shutil.disk_usage(data).free
    print(f'{len(plan)}/{len(catalog)} sách; cần chép {human(need)}, còn trống {human(free)}')
    if problems:
        print('Cảnh báo:\n  ' + '\n  '.join(problems[:20]))
    if need * 1.2 > free:
        sys.exit('Không đủ chỗ trống (cần thêm 20% dự phòng). Dừng.')
    if a.dry_run:
        print('--dry-run: không ghi gì.')
        return 0

    now = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    done = skipped = 0
    docs = []
    for b, src, cov, dst, have in plan:
        if not have:
            if not a.no_verify and sha256(src) != b['sha256']:
                sys.exit(f'SHA-256 của {b["file"]} không khớp danh mục: tệp chép lên bị lỗi hoặc sai. Dừng.')
            put_file(src, dst, a.move)
            done += 1
        else:
            skipped += 1
        cover = ''
        if os.path.isfile(cov):
            put_file(cov, os.path.join(cover_dir, b['id'] + '.jpg'))
            cover = f'/uploads/library/{b["id"]}.jpg'
        d = {k: b.get(k, '') for k in FIELDS}
        d.update({'cover': cover, 'pages': int(pages.get(b['id'], 0) or 0), 'addedAt': now, 'seed': TAG})
        docs.append((b['id'], json.dumps(d, ensure_ascii=False)))
    con.execute('BEGIN IMMEDIATE')
    con.executemany("INSERT OR REPLACE INTO docs VALUES ('libraryBooks',?,?)", docs)
    con.execute("INSERT OR REPLACE INTO docs VALUES ('meta',?,?)", (META_ID, json.dumps(
        {'at': time.time(), 'books': len(docs), 'bytes': sum(b['size'] for b, *_ in plan)}, ensure_ascii=False)))
    con.execute('COMMIT')
    print(f'Xong: {len(docs)} sách vào danh mục ({done} tệp mới, {skipped} đã có). Tệp: {books_dir}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
