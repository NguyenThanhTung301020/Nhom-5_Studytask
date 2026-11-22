#!/usr/bin/env python3
"""Dựng sách PDF chữ in rõ ràng cho trang Thư viện từ Wikisource tiếng Việt (vi.wikisource.org).

Vì sao: sách quét từ Archive.org phần lớn là chữ Hán/Nôm hoặc bản quét mờ, lệch, người dùng không đọc được (Trương Thanh Vui
phản hồi 21/11/2026). Wikisource có văn bản quốc ngữ đã số hóa của các tác phẩm hết thời hạn bảo hộ và văn bản pháp luật.

Danh sách sách ở scripts/data/thu-vien-wikisource.json: mỗi mục có id, tên, tác giả, các trang Wikisource ghép thành sách
("members"; trang có trang con như "Tắt đèn/I" thì lấy cả trang con theo thứ tự mục lục).

Cách lấy văn bản:
  * ưu tiên bản dump HTML công khai của Wikimedia (--dump <tệp .ndjson>, tải tại
    https://dumps.wikimedia.org/other/enterprise_html/runs/<ngày>/viwikisource-NS0-<ngày>-ENTERPRISE-HTML.json.tar.gz),
    không phải gọi API từng trang;
  * trang không có trong dump thì gọi API, tuần tự, ≥ 1 giây/lần, lùi lại khi bị giới hạn (HTTP 429).
In PDF khổ A5 bằng Microsoft Edge (chế độ headless, có sẵn trên Windows 10). Kết quả: <out>/<id>.pdf.
Sau đó chạy scripts/prepare_library.py như thường (thư mục <src>/wikisource-vi).

Dùng:
  python scripts/build_wikisource_books.py --out E:\\sach\\wikisource-vi --dump viwikisource_namespace_0_0.ndjson
"""
import argparse, hashlib, html as H, json, os, re, subprocess, sys, time, urllib.error, urllib.parse, urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import library_cover_design as lcd  # noqa: E402  bìa dùng chung với ảnh bìa trên trang Thư viện

HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG = os.path.join(HERE, 'data', 'thu-vien-wikisource.json')
API = 'https://vi.wikisource.org/w/api.php'
UA = {'User-Agent': 'studytask-library-import/1.0 (non-commercial student project)'}
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
_last = [0.0]


def api(**p):
    p.update(format='json', formatversion=2, maxlag=5)
    data = urllib.parse.urlencode(p).encode()
    for k in range(8):
        wait = 1.0 - (time.time() - _last[0])
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.time()
        try:
            r = json.load(urllib.request.urlopen(urllib.request.Request(API, data=data, headers=UA), timeout=120))
            if r.get('error', {}).get('code') == 'maxlag':
                time.sleep(10); continue
            return r
        except urllib.error.HTTPError as e:
            time.sleep(60 if e.code == 429 else 5 * (k + 1))
        except Exception:
            time.sleep(5 * (k + 1))
    raise RuntimeError('API Wikisource không trả lời: %s' % p.get('page'))


class Pages:
    """Lấy HTML từng trang: bộ nhớ đệm trên đĩa → dump → API."""

    def __init__(self, cache, dump=None, need=()):
        self.cache = cache; os.makedirs(cache, exist_ok=True)
        if dump:
            self._load_dump(dump, set(need))

    def _file(self, t):
        return os.path.join(self.cache, hashlib.sha1(t.encode()).hexdigest() + '.json')

    def _load_dump(self, dump, need):
        with open(dump, encoding='utf-8') as f:
            for line in f:
                d = json.loads(line)
                if d['name'] in need and not os.path.exists(self._file(d['name'])):
                    json.dump({'title': d['name'], 'html': d.get('article_body', {}).get('html', ''), 'revid': d['version']['identifier']},
                              open(self._file(d['name']), 'w', encoding='utf-8'), ensure_ascii=False)

    def get(self, t):
        f = self._file(t)
        if os.path.exists(f):
            return json.load(open(f, encoding='utf-8'))
        r = api(action='parse', page=t, prop='text|revid', disableeditsection=1, disabletoc=1)['parse']
        d = {'title': r['title'], 'html': r['text'], 'revid': r.get('revid')}
        json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False)
        return d


def subpages(titles, cache_dir):
    """Danh sách mọi trang con của các trang gốc (một lần gọi allpages cho mỗi gốc), lưu đệm ở <cache>/subpages.json
    để lần dựng sau không gọi lại API (và nội dung sách không đổi theo các trang con mới thêm trên Wikisource)."""
    f = os.path.join(cache_dir, 'subpages.json')
    known = json.load(open(f, encoding='utf-8')) if os.path.exists(f) else {}
    out = {}
    for t in titles:
        if t in known:
            out[t] = known[t]
            continue
        kids, cont = [], {}
        while True:
            r = api(action='query', list='allpages', apnamespace=0, apprefix=t + '/', aplimit=500, apfilterredir='nonredirects', **cont)
            kids += [x['title'] for x in r['query']['allpages']]
            if 'continue' not in r:
                break
            cont = r['continue']
        out[t] = known[t] = kids
        json.dump(known, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    return out


DROPCLS = re.compile(r'<(div|table|span|p|ul|center)\b[^>]*class="[^"]*\b(ws-noexport|noprint|navbox|ambox|metadata|licenseContainer|licence|wst-header|ws-header|'
                     r'headertemplate|header_|mw-editsection|catlinks|ws-pagenum|pagenum|mw-kartographer|dablink|hatnote|similar|'
                     r'plainlinks ws-|mbox)[^"]*"', re.I)


def strip_blocks(s):
    while True:
        m = DROPCLS.search(s)
        if not m:
            return s
        tag, depth = m.group(1), 0
        for t in re.finditer(r'<(/?)%s\b[^>]*>' % tag, s[m.start():], re.I):
            depth += -1 if t.group(1) else 1
            if depth == 0:
                s = s[:m.start()] + s[m.start() + t.end():]
                break
        else:
            s = s[:m.start()] + s[m.end():]


def clean(s):
    m = re.search(r'<body[^>]*>(.*)</body>', s, re.S)
    s = m.group(1) if m else s
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    # thuộc tính máy của Parsoid (data-mw, data-parsoid...) có thể chứa '>' và mã wiki: bỏ trước mọi bước khác
    s = re.sub(r"""\s(?:data-[\w-]+|typeof|about|resource|property|prefix)=(?:"[^"]*"|'[^']*')""", '', s)
    s = re.sub(r'<(style|script)\b.*?</\1>|<link[^>]*>|<meta[^>]*>', '', s, flags=re.S)
    s = strip_blocks(s)
    s = s.replace('↑', '')                                  # mũi tên quay lại chỗ chú thích: vô nghĩa trên giấy
    s = re.sub(r'<a\b[^>]*>(.*?)</a>', r'\1', s, flags=re.S)
    s = re.sub(r'<img[^>]*>', '', s)
    s = re.sub(r'\s(class|style|id|data-[\w-]+|title|lang|dir|typeof|about|rel|width|height|align)="[^"]*"', '', s)
    return re.sub(r'<(div|span)>\s*</\1>', '', s)


def text_len(h):
    return len(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', h)).strip())


ORD = {'nhất': 1, 'nhứt': 1, 'một': 1, 'nhì': 2, 'hai': 2, 'ba': 3, 'tư': 4, 'bốn': 4, 'năm': 5, 'sáu': 6, 'bảy': 7, 'tám': 8, 'chín': 9, 'mười': 10}
ROMAN = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100}


def roman(t):
    if not t or any(c not in ROMAN for c in t) or len(t) > 8:
        return None
    v = 0
    for a, b in zip(t, t[1:] + ' '):
        v += -ROMAN[a] if b in ROMAN and ROMAN[b] > ROMAN[a] else ROMAN[a]
    return v


def natkey(s):
    out = []
    for tok in re.split(r'(\d+|[\s()\-–.,"]+)', s.split('/')[-1]):
        if not tok or re.fullmatch(r'[\s()\-–.,"]+', tok):
            continue
        if tok.isdigit():
            out.append((0, int(tok), ''))
        elif roman(tok) is not None:
            out.append((0, roman(tok), ''))
        elif tok.lower() in ORD:
            out.append((0, ORD[tok.lower()], ''))
        else:
            out.append((1, 0, tok.lower()))
    return out


def ordered_parts(pages, m, kids):
    """Trang gốc + mọi trang con (nhiều cấp, ví dụ "Quyển thứ nhứt/(1)"): con của mỗi trang theo thứ tự liên kết trên trang đó,
    phần còn lại theo số thứ tự (số Ả Rập, số La Mã, "thứ nhất/nhì/ba"...)."""
    out = []

    def walk(node, html):
        # con trực tiếp; cấp trung gian không có trang riêng (vd "Phần 1" của "Phần 1/Chương I") vẫn được duyệt
        direct = list(dict.fromkeys(node + '/' + k[len(node) + 1:].split('/')[0] for k in kids if k.startswith(node + '/')))
        linked = []
        for l in re.findall(r'href="(?:/wiki/|\./)([^"#?]+)"', html):
            n = urllib.parse.unquote(l).replace('_', ' ')
            if n in direct and n not in linked:
                linked.append(n)
        for k in linked + sorted((k for k in direct if k not in linked), key=natkey):
            if k in kids:
                d = pages.get(k); out.append(d); walk(k, d['html'])
            else:
                walk(k, '')

    root = pages.get(m); out.append(root); walk(m, root['html'])
    return out


def compose(b, pages, kids, style):
    secs = []
    poetry = b['kind'] == 'poetry'
    for m in b['members']:
        ps = [pages.get(m)] if poetry else ordered_parts(pages, m, kids.get(m, []))
        for i, p in enumerate(ps):
            c = clean(p['html'])
            if len(ps) > 1 and ((i == 0 and text_len(c) < 1500) or (i > 0 and text_len(c) < 300 and re.search(r'<li>', c))):
                continue                                   # trang gốc chỉ là mục lục
            if poetry:
                head = '<h3 class="poem">%s</h3>' % H.escape(p['title'].split('/')[-1])
            elif len(b['members']) > 1 and i == 0:
                head = '<h2 class="ch">%s</h2>' % H.escape(re.sub(r'\s*\(.*\)$', '', p['title']))
            elif i > 0:
                head = '<h2 class="ch">%s</h2>' % H.escape(p['title'].split('/', 1)[1].replace('/', ' – '))
            else:
                head = ''
            secs.append('<section>%s%s</section>' % (head, c))
    body = ''.join(secs)
    src = ('Văn bản quy phạm pháp luật / văn kiện chính thức – không thuộc đối tượng bảo hộ quyền tác giả.' if b['kind'] == 'law'
           else 'Tác phẩm thuộc phạm vi công cộng (tác giả, dịch giả mất trước năm 1976).')
    foot = (H.escape(src) + '<br>Văn bản lấy từ Wikisource tiếng Việt (vi.wikisource.org), giấy phép CC BY-SA 4.0.'
            '<br>Thư viện StudyTask – dùng cho học tập, phi thương mại.')
    cover = lcd.cover_html(b, style, '148mm', '209mm', footer=foot)   # 209 mm: tránh tràn sang trang 2
    cover_css = lcd.CSS
    doc = f'''<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>{H.escape(b['title'])}</title><style>
@page{{size:A5;margin:15mm 13mm 16mm}} @page:first{{margin:0}}
html{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
body{{margin:0;font-family:"Times New Roman",Times,serif;font-size:11.5pt;line-height:1.45;color:#111;text-align:justify}}
{cover_css}
h2.ch{{page-break-before:always;font-size:15pt;text-align:center;margin:2mm 0 6mm}} section:first-of-type h2.ch{{page-break-before:auto}}
h3.poem{{font-size:12.5pt;text-align:center;margin:9mm 0 3mm;page-break-after:avoid}}
h1,h2,h3,h4{{text-align:center;page-break-after:avoid}} section h2{{font-size:14pt}} section h3{{font-size:12.5pt}} section h4{{font-size:11.5pt}}
p{{margin:0 0 .45em}} table{{margin:auto;border-collapse:collapse}} td{{vertical-align:top;padding:1px 4px}}
dl,dd{{margin:0}} .poem,dd{{text-align:left}} ul,ol{{padding-left:1.4em}}
</style></head><body><div style="page-break-after:always">{cover}</div>
{body}</body></html>'''
    return doc, text_len(body)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--out', required=True, help='thư mục ghi PDF (thường là <thư mục sách>/wikisource-vi)')
    ap.add_argument('--dump', help='tệp .ndjson trong bản dump HTML Wikimedia Enterprise của viwikisource (không bắt buộc)')
    ap.add_argument('--cache', default=os.path.join(os.environ.get('TEMP', '/tmp'), 'ws-cache'))
    ap.add_argument('--only', help='chỉ dựng các id này (phân cách bằng dấu phẩy)')
    ap.add_argument('--force', action='store_true', help='dựng lại cả sách đã có PDF')
    a = ap.parse_args()
    cat = json.load(open(CATALOG, encoding='utf-8'))
    ids = a.only.split(',') if a.only else list(cat)
    roots = sorted({m for i in ids for m in cat[i]['members'] if cat[i]['kind'] != 'poetry'})
    kids = subpages(roots, a.cache)
    need = {m for i in ids for m in cat[i]['members']} | {k for v in kids.values() for k in v}
    pages = Pages(a.cache, a.dump, need)
    styles = lcd.assign(lcd.all_books(os.path.join(lcd.DATA, 'thu-vien-sach.json')))
    missing = [b for b in lcd.all_books(CATALOG) if b['id'] not in styles]     # sách mới chưa có trong danh mục chung
    styles.update(lcd.assign(missing))
    os.makedirs(a.out, exist_ok=True)
    tmp = os.path.join(a.cache, 'html'); os.makedirs(tmp, exist_ok=True)
    for n, i in enumerate(ids, 1):
        pdf = os.path.join(a.out, i + '.pdf')
        if os.path.exists(pdf) and not a.force:
            continue
        doc, chars = compose(dict(cat[i], id=i), pages, kids, styles[i])
        hp = os.path.join(tmp, i + '.html')
        open(hp, 'w', encoding='utf-8').write(doc)
        subprocess.run([EDGE, '--headless=new', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer',
                        '--user-data-dir=' + os.path.join(a.cache, 'edge'), '--print-to-pdf=' + pdf, 'file:///' + hp.replace('\\', '/')],
                       capture_output=True, timeout=900)
        ok = os.path.exists(pdf) and os.path.getsize(pdf) > 5000
        print(f'[{n}/{len(ids)}] {i}: {chars} ký tự, {"ok" if ok else "LỖI PDF"}', flush=True)


if __name__ == '__main__':
    main()
