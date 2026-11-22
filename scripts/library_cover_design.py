"""Thiết kế bìa sách cho thư viện StudyTask: mỗi sách một tổ hợp riêng (bố cục, bảng màu, hoa văn, phông chữ) để không nhìn nhầm.

Dùng chung cho:
  - ảnh bìa nhỏ (JPEG 360 px) trên trang Thư viện: python scripts/library_cover_design.py --catalog ... --out <thư mục ảnh>
  - trang bìa trong PDF dựng từ Wikisource (scripts/build_wikisource_books.py gọi cover_html()).

Tổ hợp chọn theo mã băm của id sách (cố định giữa các lần chạy), rồi chỉnh để hai sách cùng tác giả / cùng bộ đứng gần nhau
không trùng bố cục hay bảng màu. Không dùng ảnh, logo hay quốc huy của bên thứ ba: chỉ chữ và hoa văn hình học tự vẽ.
"""
import argparse, hashlib, html as H, json, os, re, subprocess, sys

EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

# (nền, nhấn, chữ trên nền, giấy) – giấy dùng cho bố cục có vùng sáng
PALETTES = [
    ('#7a1f1f', '#e8b04b', '#fff6e5', '#f6ecd9'), ('#13294b', '#f2c14e', '#f4f1e8', '#f1ead8'), ('#1f4d3a', '#e9a23b', '#f3efe2', '#eef0e2'),
    ('#0f5257', '#ff8c61', '#f7f3ea', '#e9f1ef'), ('#4a1942', '#f29ca3', '#fbeff1', '#f5e8ee'), ('#8a5a19', '#2b1d0e', '#fff4dc', '#f7ead0'),
    ('#2e3a46', '#f28f3b', '#f5f2ec', '#eceae4'), ('#151515', '#d4af37', '#f2ead3', '#efe9dc'), ('#55602a', '#f6e7b4', '#fbf7e6', '#f1efdd'),
    ('#2d3a8c', '#9fd3ff', '#eef4ff', '#e7ecfa'), ('#a2472b', '#f6d7a7', '#fff4e6', '#f8eadc'), ('#0b6e4f', '#c9e265', '#f1f8e9', '#e4f2e8'),
    ('#6b0f2a', '#f7c5cc', '#fff0f2', '#f6e4e7'), ('#263238', '#4dd0c4', '#ecf7f6', '#e3ecec'), ('#c99a06', '#1d2b53', '#1d2b53', '#fbf3d5'),
    ('#9bc4e2', '#1b3a5c', '#10243a', '#eaf3fa'), ('#e7b8a8', '#6d1a1a', '#3b0d0d', '#f8e9e3'), ('#b5d8c3', '#1f4d36', '#173826', '#e8f4ec'),
    ('#3d2c5e', '#ffd166', '#f6f0ff', '#ece6f6'), ('#5c3d2e', '#e0c097', '#fbf1e3', '#f2e6d6'), ('#00467f', '#ff6f59', '#f2f7fb', '#e6eef5'),
    ('#f2e3c6', '#8b2e16', '#3a1a0d', '#fbf5e8'), ('#1b4332', '#ffb4a2', '#fdf2ee', '#e9f1ec'), ('#7f4f24', '#a7c957', '#fbf6ea', '#f1ead9'),
]
# tên phông dùng nháy đơn vì được chèn vào thuộc tính style="..."
FONTS = ["'Times New Roman',serif", 'Cambria,serif', 'Constantia,serif', "'Palatino Linotype',serif", "'Segoe UI',sans-serif",
         "'Sitka Heading','Times New Roman',serif", 'Arial,sans-serif', "'Segoe UI Black','Segoe UI',sans-serif"]
LAYOUTS = ['khung', 'dai', 'soc', 'chu', 'tron', 'cheo', 'nui']
MOTIFS = ['song', 'tre', 'sen', 'cham', 'vong', 'tia', 'tamgiac', 'mua', 'hoavan', 'soc']
LABEL = {'van-hoc-vn': 'VĂN HỌC', 'chinh-tri-lich-su': 'LỊCH SỬ – XÃ HỘI', 'triet-hoc': 'TRIẾT HỌC', 'ngon-ngu': 'NGÔN NGỮ',
         'ton-giao': 'TÔN GIÁO', 'khoa-hoc': 'KHOA HỌC', 'nghe-thuat': 'NGHỆ THUẬT'}


def h(s, salt=''):
    return int(hashlib.sha1((salt + s).encode()).hexdigest(), 16)


# ---------- hoa văn (SVG phủ toàn khung 300 × 420) ----------
def motif_svg(kind, c, op, seed):
    r = lambda k, m: (h(str(seed), k) % m)
    g = []
    if kind == 'song':
        for i in range(14):
            y = 20 + i * 30
            g.append(f'<path d="M-20 {y} ' + ' '.join(f'q 15 {-12 if j % 2 else 12} 30 0' for j in range(13)) + f'" fill="none" stroke="{c}" stroke-width="3"/>')
    elif kind == 'tre':
        for i in range(9):
            x = 10 + i * 36 + r('x%d' % i, 12)
            g.append(f'<rect x="{x}" y="-5" width="7" height="440" fill="{c}"/>')
            for j in range(6):
                y = 30 + j * 70 + r('y%d%d' % (i, j), 30)
                g.append(f'<rect x="{x - 2}" y="{y}" width="11" height="4" fill="{c}"/>'
                         f'<path d="M{x + 7} {y} q 22 -14 34 -4 q -18 2 -34 4z" fill="{c}"/>')
    elif kind == 'sen':
        for i in range(12):
            cx, cy = 25 + (i % 4) * 85 + (42 if (i // 4) % 2 else 0), 50 + (i // 4) * 140
            for a in range(0, 360, 45):
                g.append(f'<ellipse cx="{cx}" cy="{cy - 22}" rx="9" ry="22" fill="{c}" transform="rotate({a} {cx} {cy})"/>')
    elif kind == 'cham':
        for i in range(0, 320, 20):
            for j in range(0, 440, 20):
                g.append(f'<circle cx="{i + (10 if (j // 20) % 2 else 0)}" cy="{j}" r="{3 + r("%d-%d" % (i, j), 3)}" fill="{c}"/>')
    elif kind == 'vong':
        cx, cy = r('cx', 300), r('cy', 420)
        for k in range(1, 26):
            g.append(f'<circle cx="{cx}" cy="{cy}" r="{k * 22}" fill="none" stroke="{c}" stroke-width="5"/>')
    elif kind == 'tia':
        cx, cy = 150, r('cy', 2) * 420
        for a in range(0, 360, 10):
            g.append(f'<path d="M{cx} {cy} l {600} {0} l 0 {60} z" fill="{c}" transform="rotate({a} {cx} {cy})"/>')
    elif kind == 'tamgiac':
        for i in range(0, 330, 30):
            for j in range(0, 450, 30):
                if r('%d,%d' % (i, j), 3):
                    d = f'M{i} {j} l30 0 l-15 26z' if (i + j) // 30 % 2 else f'M{i} {j + 26} l30 0 l-15 -26z'
                    g.append(f'<path d="{d}" fill="{c}"/>')
    elif kind == 'mua':
        for i in range(70):
            x, y, l = r('x%d' % i, 320), r('y%d' % i, 440), 20 + r('l%d' % i, 50)
            g.append(f'<line x1="{x}" y1="{y}" x2="{x - l * .35}" y2="{y + l}" stroke="{c}" stroke-width="3" stroke-linecap="round"/>')
    elif kind == 'hoavan':   # hoa văn chữ "vạn" vuông lặp
        for i in range(0, 320, 40):
            for j in range(0, 440, 40):
                g.append(f'<path d="M{i + 5} {j + 5} h30 v30 h-22 v-14 h14" fill="none" stroke="{c}" stroke-width="4"/>')
    elif kind == 'soc':
        for i in range(-20, 330, 26):
            g.append(f'<path d="M{i} -10 l 140 460" stroke="{c}" stroke-width="{6 + r("w%d" % i, 8)}"/>')
    return (f'<svg class="m" viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" style="opacity:{op}">'
            + ''.join(g) + '</svg>')


def lum(c):
    r, g, b = (int(c[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return .299 * r + .587 * g + .114 * b


def title_size(t):
    n = len(t)
    longest = max((len(w) for w in t.split()), default=1)
    s = 3.6 if n <= 10 else 3.0 if n <= 20 else 2.5 if n <= 34 else 2.1 if n <= 52 else 1.75 if n <= 80 else 1.45
    return min(s, 26 / max(longest, 1) * 1.05)


LAW_RE = re.compile(r'^(Bộ luật|Luật|Hiến pháp|Hiệp định|Hiệp ước|Công ước|Nghị định|Pháp lệnh|Tuyên bố|Hiến chương|Nghị quyết|Quyết định|Chỉ thị|Thông tư)\s*(.*)$', re.I)


def split_title(b):
    """(dòng nhỏ phía trên, tên chính, số lớn: năm hoặc số tập)"""
    t = b['title']
    m = re.search(r'\b(1[89]\d\d|20\d\d)\b', t)
    if b.get('kind') == 'law':
        lm = LAW_RE.match(t)
        kicker, main = (lm.group(1).upper(), lm.group(2)) if lm else ('VĂN BẢN', t)
        main = re.sub(r'\s*(nước )?(Cộng hòa xã hội chủ nghĩa )?Việt Nam\s*', ' ', main).strip()
        main = re.sub(r'\b(năm )?(1[89]\d\d|20\d\d)\b', '', main).strip(' ,–-')
        if not main:                                   # "Hiến pháp Việt Nam 1980" → tên chính "Hiến pháp", số lớn 1980
            kicker, main = '', lm.group(1) if lm else t
        return kicker, main[:1].upper() + main[1:], (m.group(1) if m else '')
    v = re.search(r'(?:Quyển|Tập|Phần|Lớp|Cuốn)\s+([\w\d]+)', t)
    if v and len(v.group(1)) <= 4:
        return '', t, v.group(1)
    return '', t, b.get('_big', '')                    # sách trùng tên (các số tạp chí): in năm thật lớn


def assign(books):
    """Gán tổ hợp cho từng sách; sách cùng tác giả/bộ/kind không trùng bố cục và bảng màu với các sách cùng nhóm gần nhất."""
    out, recent = {}, {}
    for b in sorted(books, key=lambda b: (b.get('author') or '', b['title'])):
        grp = (b.get('author') or '').split('(')[0].strip() or b.get('series') or b.get('kind') or ''
        seen = recent.setdefault(grp, [])
        x = h(b['id'])
        lay = LAYOUTS[x % len(LAYOUTS)]
        pal = x // 7 % len(PALETTES)
        for k in range(len(LAYOUTS) * len(PALETTES)):
            lay2 = LAYOUTS[(x + k) % len(LAYOUTS)]
            pal2 = (x // 7 + k * 5) % len(PALETTES)
            if all(lay2 != s[0] or pal2 != s[1] for s in seen[-12:]) and all(pal2 != s[1] for s in seen[-5:]) \
                    and all(lay2 != s[0] for s in seen[-3:]):
                lay, pal = lay2, pal2
                break
        mot = MOTIFS[(x // 211 + len(seen) * 3) % len(MOTIFS)]
        font = FONTS[(x // 997 + len(seen)) % len(FONTS)]
        seen.append((lay, pal))
        out[b['id']] = {'layout': lay, 'palette': pal, 'motif': mot, 'font': font}
    return out


CSS = '''
.cv{position:relative;overflow:hidden;box-sizing:border-box;width:var(--w);height:var(--h);font-size:calc(var(--w) / 30);
    -webkit-print-color-adjust:exact;print-color-adjust:exact;line-height:1.18;text-align:center}
.cv *{box-sizing:border-box}
.cv .m{position:absolute;inset:0;width:100%;height:100%}
.cv .lab{font:600 .78em/1 "Segoe UI",Arial,sans-serif;letter-spacing:.22em}
.cv .t{font-weight:700;margin:0;overflow-wrap:break-word;hyphens:none}
.cv .a{font-size:1.15em;margin-top:.8em}
.cv .y{font-size:.95em;opacity:.85;margin-top:.35em}
.cv .k{font:700 .95em/1.1 "Segoe UI",Arial,sans-serif;letter-spacing:.18em;margin-bottom:.45em}
.cv .big{font:900 5.2em/1 "Segoe UI Black","Arial Black",sans-serif;letter-spacing:-.02em}
.cv .src{position:absolute;left:1.6em;right:1.6em;bottom:1.1em;font:.62em/1.35 "Segoe UI",Arial,sans-serif;opacity:.8}
'''


def cover_html(b, style, w='360px', hgt='504px', footer=''):
    bg, ac, ink, paper = PALETTES[style['palette']]
    dark = bg if lum(bg) < .5 else ink        # màu chữ trên nền giấy sáng
    font = style['font']
    kicker, main, big = split_title(b)
    label = {'law': 'VĂN BẢN PHÁP LUẬT', 'poetry': 'TUYỂN THƠ', 'bible': 'KINH THÁNH'}.get(b.get('kind'), LABEL.get(b.get('genre'), 'SÁCH'))
    who = b.get('author') or ''
    year = b.get('year') or ''
    ts = title_size(main)
    E = H.escape
    tt = f'<div class="t" style="font-family:{font};font-size:{ts}em">{E(main)}</div>'
    kk = f'<div class="k">{E(kicker)}</div>' if kicker else ''
    aa = f'<div class="a" style="font-family:{font}">{E(who)}</div>' if who else ''
    yy = f'<div class="y">{E(year)}</div>' if year and year != big else ''
    bg_big = f'<div class="big">{E(big)}</div>' if big else ''
    foot = f'<div class="src">{footer}</div>' if footer else ''
    lay, seed = style['layout'], b['id']
    mot = lambda c, op: motif_svg(style['motif'], c, op, seed)
    box = 'position:absolute;'
    if lay == 'khung':
        inner = (f'{mot(ac, .10)}<div style="{box}inset:1.2em;border:.22em solid {ac}"></div><div style="{box}inset:1.75em;border:.08em solid {ac}"></div>'
                 f'<div style="{box}inset:3em 2.6em;display:flex;flex-direction:column;justify-content:center;color:{ink}">'
                 f'<div class="lab" style="color:{ac};margin-bottom:2em">❖ {label} ❖</div>{kk}{tt}<div style="width:6em;height:.15em;background:{ac};margin:1.3em auto .3em"></div>'
                 f'{aa}{yy}<div style="color:{ac};margin-top:1.4em">{bg_big}</div></div>')
        foot = foot.replace('class="src"', 'class="src" style="bottom:2.4em;left:2.6em;right:2.6em"')   # nằm trong khung
        return f'<div class="cv" style="--w:{w};--h:{hgt};background:{bg}">{inner}{foot}</div>'
    if lay == 'dai':
        inner = (f'<div style="{box}left:0;right:0;top:0;height:56%;background:{bg};overflow:hidden">{mot(ac, .35)}'
                 f'<div style="{box}left:1.8em;top:1.6em;text-align:left;color:{ink}" class="lab">{label}</div>'
                 f'<div style="{box}right:1.4em;bottom:.8em;color:{ac}">{bg_big}</div></div>'
                 f'<div style="{box}left:0;right:0;top:56%;height:.45em;background:{ac}"></div>'
                 f'<div style="{box}left:2em;right:2em;top:60%;bottom:3em;text-align:left;color:{dark};display:flex;flex-direction:column;justify-content:center">'
                 f'{kk}{tt}{aa}{yy}</div>')
        return f'<div class="cv" style="--w:{w};--h:{hgt};background:{paper}">{inner}{foot.replace("opacity:.8", "")}</div>'
    if lay == 'soc':
        inner = (f'<div style="{box}left:0;top:0;bottom:0;width:7.5em;background:{ac};overflow:hidden">{mot(bg, .18)}'
                 f'<div style="{box}left:0;right:0;top:2em;bottom:2em;writing-mode:vertical-rl;transform:rotate(180deg);display:flex;align-items:center;'
                 f'justify-content:flex-start;font:700 1.15em/1 {font};color:{bg};letter-spacing:.08em">{E(who.upper()[:40])}</div></div>'
                 f'<div style="{box}left:9.5em;right:1.8em;top:2.2em;text-align:left;color:{ac}" class="lab">{label}</div>'
                 f'<div style="{box}left:9.5em;right:1.8em;bottom:4em;text-align:left;color:{ink}">{kk}{tt}{yy}'
                 f'<div style="color:{ac};margin-top:.4em">{bg_big}</div></div>')
        return f'<div class="cv" style="--w:{w};--h:{hgt};background:{bg}">{inner}{foot}</div>'
    if lay == 'chu':
        first = (main.strip('“"«( ') or '?')[0].upper()
        inner = (f'{mot(ac, .07)}<div style="{box}left:-.05em;top:-.12em;font:900 26em/1 {font};color:{ac};opacity:.28">{E(first)}</div>'
                 f'<div style="{box}left:2em;right:2em;top:2em;text-align:right;color:{ac}" class="lab">{label}</div>'
                 f'<div style="{box}left:2em;right:2em;bottom:4em;text-align:right;color:{ink}">{kk}{tt}'
                 f'<div style="width:100%;height:.12em;background:{ac};margin:.9em 0 .2em"></div>{aa}{yy}{bg_big}</div>')
        return f'<div class="cv" style="--w:{w};--h:{hgt};background:{bg}">{inner}{foot}</div>'
    if lay == 'tron':
        inner = (f'<div style="{box}left:50%;top:5.5em;width:17em;height:17em;margin-left:-8.5em;border-radius:50%;background:{ac};overflow:hidden">'
                 f'{mot(bg, .28)}<div style="{box}inset:0;display:flex;align-items:center;justify-content:center;color:{bg}">{bg_big or ""}</div></div>'
                 f'<div style="{box}left:0;right:0;top:2.2em;color:{ac}" class="lab">{label}</div>'
                 f'<div style="{box}left:1.8em;right:1.8em;top:24em;bottom:3em;color:{ink};display:flex;flex-direction:column;justify-content:center">{kk}{tt}{aa}{yy}</div>')
        return f'<div class="cv" style="--w:{w};--h:{hgt};background:{bg}">{inner}{foot}</div>'
    if lay == 'cheo':
        inner = (f'<svg class="m" viewBox="0 0 300 420" preserveAspectRatio="none"><path d="M0 0H300V125L0 220Z" fill="{ac}"/></svg>'
                 f'<div style="{box}inset:0;clip-path:polygon(0 0,100% 0,100% 29.8%,0 52.4%)">{mot(bg, .22)}</div>'
                 f'<div style="{box}left:2em;right:2em;top:2em;text-align:left;color:{bg}">'
                 f'<div class="lab">{label}</div><div style="margin-top:.6em">{bg_big}</div></div>'
                 f'<div style="{box}left:2em;right:2em;top:24.5em;bottom:3.2em;text-align:left;color:{ink};display:flex;flex-direction:column;justify-content:flex-start">{kk}{tt}{aa}{yy}</div>')
        return f'<div class="cv" style="--w:{w};--h:{hgt};background:{bg}">{inner}{foot}</div>'
    # 'nui': chữ trên nền giấy, dải núi/sóng nhiều lớp phía dưới
    s = h(seed)
    layers = []
    for i, (col, op) in enumerate(((ac, .55), (bg, .8), (bg, 1))):
        y0 = 290 + i * 35
        pts = ' '.join(f'{x},{y0 - ((s >> (x // 25 + i * 7)) % 60)}' for x in range(0, 325, 25))
        layers.append(f'<polygon points="0,420 {pts} 300,420" fill="{col}" opacity="{op}"/>')
    inner = (f'<svg class="m" viewBox="0 0 300 420" preserveAspectRatio="none">{"".join(layers)}</svg>'
             f'<div style="{box}left:0;right:0;top:0;height:2.2em;background:{dark}"></div>'
             f'<div style="{box}left:2em;right:2em;top:3.4em;color:{dark}" class="lab">{label}</div>'
             f'<div style="{box}left:2em;right:2em;top:6em;color:{dark}">{kk}{tt}{aa}{yy}</div>'
             f'<div style="{box}right:1.6em;bottom:3em;color:{paper}">{bg_big}</div>')
    return f'<div class="cv" style="--w:{w};--h:{hgt};background:{paper};color:{dark}">{inner}{foot.replace("opacity:.8", "color:" + paper)}</div>'


def page(fragment, w, hgt):
    return (f'<!doctype html><html lang="vi"><head><meta charset="utf-8"><style>html,body{{margin:0;width:{w};height:{hgt};overflow:hidden}}{CSS}</style>'
            f'</head><body>{fragment}</body></html>')


UA = 'StudyTaskLibraryCovers/1.0 (educational, non-commercial)'


def commons_page(file, page_no, width, cache):
    """Ảnh thu nhỏ một trang của tệp PDF/DjVu trên Wikimedia Commons (có bộ nhớ đệm)."""
    import time, urllib.parse, urllib.request
    os.makedirs(cache, exist_ok=True)
    dst = os.path.join(cache, hashlib.sha1(f'{file}|{page_no}|{width}'.encode()).hexdigest() + '.jpg')
    if os.path.exists(dst) and os.path.getsize(dst) > 1000:
        return dst

    def get(url):
        for i in range(5):
            time.sleep(1.2)
            try:
                return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60).read()
            except urllib.error.HTTPError as e:
                if e.code not in (429, 503):
                    raise
                time.sleep(30 * (i + 1))
        raise RuntimeError('Commons trả 429 liên tục')
    q = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'formatversion': 2, 'titles': 'File:' + file, 'prop': 'imageinfo',
                                'iiprop': 'url', 'iiurlwidth': width})
    thumb = json.loads(get('https://commons.wikimedia.org/w/api.php?' + q))['query']['pages'][0]['imageinfo'][0]['thumburl']
    data = get(re.sub(r'/page1-', f'/page{page_no}-', thumb))
    if len(data) < 1000 or data[:2] != b'\xff\xd8':
        raise RuntimeError(f'Commons trả ảnh hỏng cho {file} trang {page_no}')
    open(dst, 'wb').write(data)
    return dst


def render_jpgs(books, styles, sources, out, tmp, width=360):
    """Vẽ từng bìa bằng Edge (ảnh PNG) rồi đổi sang JPEG bằng System.Drawing.
    sources[id] = {'nguon': 'commons', 'tep': ..., 'trang': n} → dùng ảnh trang bìa bản in gốc; còn lại → bìa thiết kế."""
    os.makedirs(out, exist_ok=True); os.makedirs(tmp, exist_ok=True)
    w, hh = width, round(width * 1.4)
    pngs = []
    for n, b in enumerate(books, 1):
        src = sources.get(b['id']) or {}
        if src.get('nguon') == 'commons':
            img = commons_page(src['tep'], src.get('trang', 1), w, os.path.join(tmp, 'commons'))
            frag = (f'<img src="file:///{img.replace(os.sep, "/")}" style="display:block;width:{w}px;height:{hh}px;object-fit:cover;'
                    f'object-position:{src.get("canh", "center")}">')
        else:
            frag = cover_html(b, styles[b['id']], f'{w}px', f'{hh}px')
        hp = os.path.join(tmp, b['id'] + '.html')
        open(hp, 'w', encoding='utf-8').write(page(frag, f'{w}px', f'{hh}px'))
        png = os.path.join(tmp, b['id'] + '.png')
        subprocess.run([EDGE, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--allow-file-access-from-files',
                        '--user-data-dir=' + os.path.join(tmp, 'edge'), f'--window-size={w},{hh}', '--screenshot=' + png,
                        'file:///' + hp.replace(os.sep, '/')], capture_output=True, timeout=120)
        pngs.append((png, os.path.join(out, b['id'] + '.jpg')))
        print(f'[{n}/{len(books)}] {b["id"]} ({src.get("nguon", "thiet-ke")})', flush=True)
    lst = os.path.join(tmp, 'png-jpg.txt')
    open(lst, 'w', encoding='utf-8').write('\n'.join(f'{a}|{b}' for a, b in pngs))
    ps = ('Add-Type -AssemblyName System.Drawing; $e=[Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|?{$_.MimeType -eq "image/jpeg"};'
          '$p=New-Object Drawing.Imaging.EncoderParameters 1;$p.Param[0]=New-Object Drawing.Imaging.EncoderParameter([Drawing.Imaging.Encoder]::Quality,[long]86);'
          f'Get-Content -Encoding UTF8 "{lst}"|%{{$a,$b=$_ -split "\\|";$i=[Drawing.Image]::FromFile($a);$i.Save($b,$e,$p);$i.Dispose()}}')
    subprocess.run(['powershell', '-NoProfile', '-Command', ps], check=True)


DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')


def load_sources(path=os.path.join(DATA, 'thu-vien-bia.json')):
    return {k: v for k, v in json.load(open(path, encoding='utf-8')).items() if not k.startswith('_')} if os.path.exists(path) else {}


def wants_cover(b, sources):
    """Sách Wikisource luôn có bìa vẽ; sách quét (Archive) giữ trang bìa thật, trừ khi thu-vien-bia.json chỉ định khác."""
    return b['id'].startswith('ws-') or b['id'] in sources


def all_books(catalog, wikisource=os.path.join(DATA, 'thu-vien-wikisource.json')):
    ws = json.load(open(wikisource, encoding='utf-8'))
    raw = json.load(open(catalog, encoding='utf-8'))
    if isinstance(raw, dict):                                # thu-vien-wikisource.json: {id: {...}}
        raw = [dict(v, id=k) for k, v in raw.items()]
    titles = {}
    for b in raw:
        titles.setdefault(b['title'], []).append(b)
    books = []
    for b in raw:
        b = dict(b)
        b['kind'] = (ws.get(b['id']) or {}).get('kind') or b.get('kind') or ''
        if len(titles[b['title']]) > 1 and b.get('year'):
            b['_big'] = str(b['year'])
        books.append(b)
    return books


def styles_for(catalog=os.path.join(DATA, 'thu-vien-sach.json')):
    return assign(all_books(catalog))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--catalog', default=os.path.join(DATA, 'thu-vien-sach.json'))
    ap.add_argument('--out', required=True, help='thư mục ghi <id>.jpg (thường là <staging>/covers)')
    ap.add_argument('--only', help='chỉ vẽ các id này (phân cách bằng dấu phẩy)')
    ap.add_argument('--tmp', default=os.path.join(os.environ.get('TEMP', '/tmp'), 'library-covers'))
    a = ap.parse_args()
    books = all_books(a.catalog)
    styles = assign(books)
    sources = load_sources()
    pick = [b for b in books if wants_cover(b, sources) and (not a.only or b['id'] in a.only.split(','))]
    render_jpgs(pick, styles, sources, a.out, a.tmp)
    print(f'Đã vẽ {len(pick)} bìa vào {a.out}')


if __name__ == '__main__':
    main()
