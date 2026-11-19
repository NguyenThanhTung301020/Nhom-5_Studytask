#!/usr/bin/env python3
"""Chuẩn bị kho sách điện tử cho trang Thư viện từ thư mục sách đã tải về từ Internet Archive (archive.org).

Mỗi thư mục con là MỘT mục trên Archive.org; tên thư mục chính là mã mục (identifier), ví dụ
https://archive.org/details/HongLauMong_201512. Script:
  1. đọc thông tin mục (tên, tác giả, năm, giấy phép) từ API công khai https://archive.org/metadata/<identifier>
     (lưu bản sao ở scripts/data/thu-vien-archive-meta.json để chạy lại không cần mạng);
  2. gộp với thông tin chỉnh tay ở scripts/data/thu-vien-overrides.json (tên có dấu, thể loại, tác giả khi Archive ghi thiếu);
  3. tính SHA-256, dung lượng từng tệp PDF, đặt mã sách ASCII an toàn;
  4. ghi danh mục scripts/data/thu-vien-sach.json (đưa vào git, KHÔNG gồm PDF) và <staging>/manifest.json (có đường dẫn tệp nguồn)
     để scripts/render_library_covers.ps1 vẽ bìa và scripts/import_library.py nạp lên máy chủ.

Thư mục "sách tự down" (không có mã Archive.org tương ứng) được ghi nguồn là "người dùng cung cấp", không gắn đường dẫn Archive.

Dùng:
  python scripts/prepare_library.py --src E:\\sach --staging du-lieu-thu/library-staging            # có mạng: tải thông tin mục
  python scripts/prepare_library.py --src E:\\sach --staging du-lieu-thu/library-staging --offline  # dùng bản sao thông tin đã lưu
"""
import argparse, hashlib, json, os, re, sys, time, unicodedata, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'data')
META_CACHE = os.path.join(DATA, 'thu-vien-archive-meta.json')
OVERRIDES = os.path.join(DATA, 'thu-vien-overrides.json')
CATALOG = os.path.join(DATA, 'thu-vien-sach.json')
TAG = 'library-v1'
USER_PROVIDED_DIR = 'sách tự down'          # thư mục người dùng tự tải, không có mã Archive.org
META_KEYS = ('title', 'creator', 'date', 'language', 'licenseurl', 'rights', 'publisher')

LICENSES = {
    'by-nc-nd': 'CC BY-NC-ND 4.0 (ghi nguồn, phi thương mại, không phái sinh)',
    'by-nc': 'CC BY-NC 4.0 (ghi nguồn, phi thương mại)',
    'by-sa': 'CC BY-SA 4.0 (ghi nguồn, chia sẻ tương tự)',
    'publicdomain/mark': 'Phạm vi công cộng (Public Domain Mark 1.0)',
}


def slug(s, limit=60):
    s = unicodedata.normalize('NFKD', s.replace('đ', 'd').replace('Đ', 'D'))
    s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:limit].strip('-') or 'sach'


def clean(s):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFC', str(s or ''))).strip(' -–—_.')


def license_label(url):
    for k, v in LICENSES.items():
        if url and f'/{k}/' in url:
            return v
    return ''


def fetch_meta(identifier):
    url = 'https://archive.org/metadata/' + urllib.parse.quote(identifier)
    req = urllib.request.Request(url, headers={'User-Agent': 'studytask-library-import/1.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        m = (json.load(r).get('metadata')) or {}
    out = {}
    for k in META_KEYS:
        v = m.get(k)
        if v:
            out[k] = v if isinstance(v, str) else ', '.join(str(x) for x in v)
    return out


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def title_from_file(stem):
    t = clean(stem.replace('_', ' '))
    return t


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', required=True, help='thư mục sách (mỗi thư mục con = một mục Archive.org)')
    ap.add_argument('--staging', required=True, help='thư mục ghi manifest.json (và nơi đặt bìa, tệp để chép lên máy chủ)')
    ap.add_argument('--offline', action='store_true', help='không gọi Archive.org, chỉ dùng scripts/data/thu-vien-archive-meta.json')
    ap.add_argument('--no-hash', action='store_true', help='bỏ qua SHA-256 (chỉ để thử nhanh)')
    a = ap.parse_args()

    cache = json.load(open(META_CACHE, encoding='utf-8')) if os.path.exists(META_CACHE) else {}
    overrides = json.load(open(OVERRIDES, encoding='utf-8')) if os.path.exists(OVERRIDES) else {}
    folders = sorted(d for d in os.listdir(a.src) if os.path.isdir(os.path.join(a.src, d)))
    books, used = [], set()
    for folder in folders:
        pdfs = sorted(f for f in os.listdir(os.path.join(a.src, folder)) if f.lower().endswith('.pdf'))
        if not pdfs:
            continue
        user_provided = folder == USER_PROVIDED_DIR
        meta = {}
        if not user_provided:
            if folder in cache:
                meta = cache[folder]
            elif not a.offline:
                try:
                    meta = cache[folder] = fetch_meta(folder)
                    time.sleep(0.4)
                except Exception as e:
                    sys.stderr.write(f'Không đọc được thông tin {folder}: {e}\n')
            else:
                sys.stderr.write(f'Thiếu thông tin đã lưu của {folder} (chạy lại không có --offline)\n')
        ov_folder = overrides.get(folder, {})
        for fn in pdfs:
            stem = fn[:-4]
            base = slug(folder if not user_provided else 'tu-down', 40)
            bid = base if len(pdfs) == 1 else f'{base}-{slug(stem, 40)}'
            n = 2
            while bid in used:
                bid, n = f'{bid}-{n}', n + 1
            used.add(bid)
            ov = {**{k: v for k, v in ov_folder.items() if k != 'files'}, **(ov_folder.get('files', {}).get(fn, {}))}
            title = clean(ov.get('title') or (meta.get('title') if len(pdfs) == 1 else None) or title_from_file(stem))
            author = clean(ov.get('author') if 'author' in ov else (meta.get('creator') if len(pdfs) == 1 else ''))
            path = os.path.join(a.src, folder, fn)
            lic = meta.get('licenseurl', '') if not user_provided else ''
            books.append({
                'id': bid, 'title': title, 'author': author,
                'genre': ov.get('genre', 'khac'), 'year': ov.get('year', ''),      # không lấy năm từ Archive: trường date ở đó nhiều khi là ngày tải lên
                'language': ov.get('language') or ('vi' if (meta.get('language', 'vie') in ('vie', 'vi') or user_provided) else meta.get('language', '')),
                'series': clean(ov.get('series') or (meta.get('title') if len(pdfs) > 1 and not user_provided else '')),
                'description': ov.get('description', ''),
                'sourceName': 'Người dùng cung cấp (nguồn gốc chưa xác định)' if user_provided else 'Internet Archive',
                'sourceId': '' if user_provided else folder,
                'sourceUrl': '' if user_provided else 'https://archive.org/details/' + urllib.parse.quote(folder),
                'license': lic, 'licenseLabel': license_label(lic) if lic else 'Chưa ghi giấy phép trên trang nguồn',
                'file': bid + '.pdf', 'originalName': fn, 'size': os.path.getsize(path),
                'sha256': '' if a.no_hash else sha256(path), 'seed': TAG,
                'source': os.path.abspath(path),
            })
    os.makedirs(a.staging, exist_ok=True)
    if cache:
        json.dump(cache, open(META_CACHE, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, sort_keys=True)
    json.dump(books, open(os.path.join(a.staging, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    public = [{k: v for k, v in b.items() if k != 'source'} for b in books]
    json.dump(public, open(CATALOG, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    total = sum(b['size'] for b in books)
    print(f'{len(books)} sách từ {len(folders)} thư mục, tổng {total / 1048576:.0f} MB → {CATALOG}')
    missing = [b['id'] for b in books if b['genre'] == 'khac']
    if missing:
        print(f'{len(missing)} sách chưa có thể loại (thêm vào {os.path.relpath(OVERRIDES)}): ' + ', '.join(missing[:12]))


if __name__ == '__main__':
    main()
