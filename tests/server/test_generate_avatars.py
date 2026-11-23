#!/usr/bin/env python3
"""Bộ ảnh đại diện tự vẽ (scripts/generate_avatars.py): đủ số lượng, không trùng tổ hợp, chạy lại ra đúng bộ cũ, SVG hợp lệ,
không nhúng ảnh hay tài nguyên bên ngoài (chỉ hình vẽ bằng mã)."""
import csv, os, subprocess, sys, tempfile
import xml.etree.ElementTree as ET
HERE = os.path.dirname(os.path.abspath(__file__))
GEN = os.path.join(HERE, '..', '..', 'scripts', 'generate_avatars.py')
ok = True


def chk(n, c):
    global ok; ok &= bool(c); print(('PASS ' if c else 'FAIL ') + n)


def gen(out, count):
    r = subprocess.run([sys.executable, GEN, '--out', out, '--count', str(count), '--svg-only'], capture_output=True, text=True, encoding='utf-8')
    chk(f'chạy được ({count} ảnh)', r.returncode == 0)
    return {f: open(os.path.join(out, f), encoding='utf-8').read() for f in sorted(os.listdir(out)) if f.endswith('.svg')}


a, b = tempfile.mkdtemp(), tempfile.mkdtemp()
A, B = gen(a, 1056), gen(b, 1056)
chk('đủ 1056 tệp SVG', len(A) == 1056)
chk('chạy lại cùng hạt giống ra đúng bộ ảnh cũ', A == B)
chk('không có hai ảnh giống hệt nhau', len(set(A.values())) == len(A))
rows = list(csv.DictReader(open(os.path.join(a, 'manifest.csv'), encoding='utf-8')))
chk('manifest có 1056 dòng', len(rows) == 1056)
chk('không trùng phần nhìn thấy rõ (nền, da, tóc, áo, cổ áo)',
    len({(r['nen'], r['da'], r['kieu_toc'], r['mau_toc'], r['ao'], r['co_ao']) for r in rows}) == 1056)
chk('có đủ các kiểu tóc', len({r['kieu_toc'] for r in rows}) >= 12)
bad = 0
for s in A.values():
    try:
        root = ET.fromstring(s)
        if root.get('viewBox') != '0 0 256 256':
            bad += 1
    except ET.ParseError:
        bad += 1
chk('mọi tệp là SVG hợp lệ 256×256', bad == 0)
chk('không nhúng ảnh hay tài nguyên ngoài (<image>, href, url(), font)',
    not any(k in s for s in A.values() for k in ('<image', 'href', 'url(', '<text', 'font')))
print('ĐẠT' if ok else 'KHÔNG ĐẠT')
sys.exit(0 if ok else 1)
