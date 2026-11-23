#!/usr/bin/env python3
"""Sinh bộ ảnh đại diện minh họa TỰ VẼ bằng mã (không dùng ảnh, phông hay hình của bên thứ ba) để thay kho ảnh tìm trên mạng.

Mỗi ảnh là một chân dung phẳng ghép từ các phần vẽ bằng SVG: nền, màu da, kiểu tóc, màu tóc, áo, cổ áo, mắt, lông mày,
miệng, kính, phụ kiện. Tổ hợp chọn bằng bộ sinh ngẫu nhiên có hạt giống cố định (chạy lại ra đúng bộ ảnh cũ) và không có
hai ảnh trùng tổ hợp. Ảnh là sản phẩm do nhóm tự tạo, không phụ thuộc giấy phép của ai.

  python scripts/generate_avatars.py --out du-lieu-thu/avatars-tu-tao --count 1056         # Windows: cần Microsoft Edge để vẽ ra JPEG
  python scripts/generate_avatars.py --out ... --svg-only                                   # chỉ ghi SVG (không cần Edge)

Kết quả: <out>/avNNNN.jpg (256×256, JPEG chất lượng 88 như ảnh người dùng tự tải lên), <out>/manifest.csv (tổ hợp của từng ảnh).
Sau đó gán cho sinh viên bằng scripts/assign_avatars.py --images <out> (giống trước).
"""
import argparse, csv, os, random, shutil, subprocess, sys, tempfile

SKIN = ['#f9dcc4', '#f3c9a5', '#eab68c', '#e0a878', '#d39a6a', '#c68654', '#a86b42', '#8a5533']
SKIN_W = [4, 5, 5, 4, 3, 2, 1, 1]           # tỉ lệ màu da: nghiêng về các tông phổ biến ở sinh viên Việt Nam
HAIR = ['#1f1a17', '#2b211c', '#3b2a20', '#4a3326', '#5c3d2a', '#6e4a30', '#8a5a36', '#2d2f3a', '#47312a', '#b08350']
BG = ['#cfe8ff', '#d7f2e3', '#ffe3c9', '#f6d6e8', '#e5dcff', '#fff1b8', '#d2f0f4', '#ffd8d2', '#e2ecd0', '#dbe2ef',
      '#f2e6d8', '#c9e4de', '#fde2b3', '#e8d5f0', '#d0e1f9', '#f7d9c4']
SHIRT = ['#3866c4', '#2e8b6e', '#c4453a', '#e0913a', '#7b52c4', '#2f9fb8', '#d0577f', '#4f5d75', '#8aa13a', '#b5654a',
         '#25507a', '#e2b33c', '#5b8def', '#a33f6b']
HAIRSTYLES = ['ngan', 're-ngoi', 'dung', 'xoan', 'cat-sat', 'mai-bang', 'bob', 'dai', 'buoc-cao', 'buoi-toc', 'duoi-ngua', 'dai-mai']
COLLARS = ['tron', 'co-tim', 'so-mi', 'hoodie', 'ao-khoac']
EYES = ['tron', 'cuoi', 'hat', 'mi']
MOUTHS = ['cuoi', 'cuoi-ho-rang', 'mim', 'tron-nho']
EXTRAS = ['', '', '', '', 'kinh-tron', 'kinh-vuong', 'tai-nghe', 'mu-len', 'kep-toc', 'ma-hong']


def shade(hexc, f):
    """Làm tối (f<1) hoặc sáng (f>1) một màu."""
    r, g, b = (int(hexc[i:i + 2], 16) for i in (1, 3, 5))
    if f < 1:
        r, g, b = (int(c * f) for c in (r, g, b))
    else:
        r, g, b = (int(c + (255 - c) * (f - 1)) for c in (r, g, b))
    return f'#{r:02x}{g:02x}{b:02x}'


def hair_back(style, c):
    """Phần tóc nằm sau đầu (vẽ trước mặt)."""
    return {
        'bob': f'<path d="M70 120C64 60 100 40 128 40S192 60 186 120L190 168C170 178 86 178 66 168Z" fill="{c}"/>',
        'dai': f'<path d="M68 118C60 56 100 38 128 38S196 56 188 118L196 236C160 248 96 248 60 236Z" fill="{c}"/>',
        'dai-mai': f'<path d="M68 118C60 56 100 38 128 38S196 56 188 118L194 222C164 236 92 236 62 222Z" fill="{c}"/>',
        'duoi-ngua': f'<path d="M168 92C204 100 214 150 196 196C190 170 182 140 168 126Z" fill="{c}"/>',
        'buoi-toc': f'<circle cx="128" cy="44" r="24" fill="{c}"/>',
        'buoc-cao': f'<ellipse cx="128" cy="36" rx="20" ry="16" fill="{c}"/>',
        'xoan': ''.join(f'<circle cx="{x}" cy="{y}" r="15" fill="{c}"/>' for x, y in
                        ((78, 108), (178, 108), (74, 88), (182, 88))),
    }.get(style, '')


def hair_front(style, c, rng):
    """Phần tóc phía trước (vẽ sau mặt)."""
    hl = shade(c, 1.35)
    if style == 'ngan':
        return f'<path d="M76 110C70 58 104 44 130 46C166 48 188 70 180 110C174 90 160 80 142 78C122 86 98 88 76 110Z" fill="{c}"/>'
    if style == 're-ngoi':
        return (f'<path d="M76 112C70 56 108 42 134 46C168 50 190 78 180 112C176 92 168 82 156 78C132 76 100 70 76 112Z" fill="{c}"/>'
                f'<path d="M118 50C112 60 110 70 112 78" stroke="{hl}" stroke-width="3" fill="none" stroke-linecap="round"/>')
    if style == 'dung':
        pts = 'M76 108L74 72L88 80L92 54L106 70L114 44L126 64L138 42L146 66L160 50L164 74L178 66L180 108C168 88 150 82 128 82S88 88 76 108Z'
        return f'<path d="{pts}" fill="{c}"/>'
    if style == 'xoan':
        return ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>' for x, y, r in
                       ((84, 82, 16), (100, 64, 18), (122, 56, 19), (146, 58, 18), (166, 70, 17), (176, 90, 14), (80, 98, 12)))
    if style == 'cat-sat':
        return f'<path d="M80 104C78 66 102 52 128 52S178 66 176 104C168 84 150 76 128 76S88 84 80 104Z" fill="{c}" opacity=".9"/>'
    if style == 'mai-bang':
        return f'<path d="M74 118C66 58 102 42 128 42S190 58 182 118C178 100 172 92 170 90C150 96 108 96 86 90C82 96 76 106 74 118Z" fill="{c}"/>'
    if style in ('bob', 'dai', 'dai-mai'):
        side = rng.choice(('trai', 'phai', 'giua'))
        if side == 'giua':
            d = 'M72 126C66 60 104 44 128 44S190 60 184 126C178 92 160 72 128 66C96 72 78 92 72 126Z'
        elif side == 'trai':
            d = 'M72 126C66 60 104 42 130 44S190 62 184 126C176 96 166 80 150 74C128 90 96 94 72 126Z'
        else:
            d = 'M72 126C66 62 102 44 126 44S190 60 184 126C160 94 128 90 106 74C90 80 80 96 72 126Z'
        return f'<path d="{d}" fill="{c}"/>'
    if style in ('buoi-toc', 'buoc-cao', 'duoi-ngua'):
        return (f'<path d="M76 112C70 60 104 46 128 46S186 60 180 112C172 86 152 72 128 70S84 86 76 112Z" fill="{c}"/>'
                f'<path d="M104 56C116 52 140 52 152 56" stroke="{hl}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>')
    return ''


def collar_svg(kind, shirt):
    dark, light = shade(shirt, .72), shade(shirt, 1.4)
    body = f'<path d="M30 256C34 206 76 188 128 188S222 206 226 256Z" fill="{shirt}"/>'
    if kind == 'tron':
        return body + f'<path d="M104 190C110 204 146 204 152 190" stroke="{dark}" stroke-width="5" fill="none"/>'
    if kind == 'co-tim':
        return body + f'<path d="M106 190L128 220L150 190" stroke="{dark}" stroke-width="5" fill="none" stroke-linejoin="round"/>'
    if kind == 'so-mi':
        return (body + f'<path d="M104 188L126 214L112 222L96 196Z M152 188L130 214L144 222L160 196Z" fill="#ffffff"/>'
                f'<line x1="128" y1="214" x2="128" y2="256" stroke="{dark}" stroke-width="3"/>'
                f'<circle cx="128" cy="232" r="2.5" fill="{dark}"/><circle cx="128" cy="248" r="2.5" fill="{dark}"/>')
    if kind == 'hoodie':
        return (body + f'<path d="M86 196C96 218 160 218 170 196" stroke="{dark}" stroke-width="10" fill="none" stroke-linecap="round"/>'
                f'<line x1="114" y1="214" x2="112" y2="240" stroke="{light}" stroke-width="4" stroke-linecap="round"/>'
                f'<line x1="142" y1="214" x2="144" y2="240" stroke="{light}" stroke-width="4" stroke-linecap="round"/>')
    # áo khoác mở, áo thun bên trong
    return (f'<path d="M30 256C34 206 76 188 128 188S222 206 226 256Z" fill="{light}"/>'
            f'<path d="M30 256C34 206 76 188 108 190L120 256Z M226 256C222 206 180 188 148 190L136 256Z" fill="{shirt}"/>'
            f'<path d="M108 190L120 256 M148 190L136 256" stroke="{dark}" stroke-width="3" fill="none"/>')


def eyes_svg(kind, y, gap):
    ink = '#2a211c'
    lx, rx = 128 - gap, 128 + gap
    if kind == 'tron':
        return ''.join(f'<circle cx="{x}" cy="{y}" r="6" fill="{ink}"/><circle cx="{x + 2}" cy="{y - 2}" r="2" fill="#fff"/>' for x in (lx, rx))
    if kind == 'cuoi':
        return ''.join(f'<path d="M{x - 7} {y + 2}Q{x} {y - 7} {x + 7} {y + 2}" stroke="{ink}" stroke-width="4" fill="none" stroke-linecap="round"/>'
                       for x in (lx, rx))
    if kind == 'hat':
        return ''.join(f'<ellipse cx="{x}" cy="{y}" rx="4" ry="5.5" fill="{ink}"/>' for x in (lx, rx))
    return ''.join(f'<circle cx="{x}" cy="{y}" r="5.5" fill="{ink}"/>'
                   f'<path d="M{x - 8} {y - 4}L{x - 11} {y - 8}M{x + 8} {y - 4}L{x + 11} {y - 8}" stroke="{ink}" stroke-width="2" stroke-linecap="round"/>'
                   for x in (lx, rx))


def mouth_svg(kind, y, skin):
    lip = shade(skin, .55)
    if kind == 'cuoi':
        return f'<path d="M114 {y}Q128 {y + 12} 142 {y}" stroke="{lip}" stroke-width="4" fill="none" stroke-linecap="round"/>'
    if kind == 'cuoi-ho-rang':
        return f'<path d="M112 {y - 2}Q128 {y + 20} 144 {y - 2}Z" fill="#7a2e2e"/><path d="M115 {y}H141L139 {y + 4}H117Z" fill="#fff"/>'
    if kind == 'mim':
        return f'<path d="M118 {y + 2}Q130 {y + 8} 140 {y}" stroke="{lip}" stroke-width="4" fill="none" stroke-linecap="round"/>'
    return f'<ellipse cx="128" cy="{y + 3}" rx="6" ry="5" fill="#7a2e2e"/>'


def extra_svg(kind, eye_y, gap, hair, shirt):
    if kind == 'kinh-tron':
        return (f'<g stroke="#333" stroke-width="3.5" fill="none"><circle cx="{128 - gap}" cy="{eye_y}" r="15"/>'
                f'<circle cx="{128 + gap}" cy="{eye_y}" r="15"/><path d="M{128 - gap + 15} {eye_y}Q128 {eye_y - 6} {128 + gap - 15} {eye_y}"/></g>')
    if kind == 'kinh-vuong':
        return (f'<g stroke="#2a2a2a" stroke-width="4" fill="rgba(255,255,255,.15)"><rect x="{128 - gap - 16}" y="{eye_y - 11}" width="32" height="22" rx="5"/>'
                f'<rect x="{128 + gap - 16}" y="{eye_y - 11}" width="32" height="22" rx="5"/></g>'
                f'<line x1="{128 - gap + 16}" y1="{eye_y - 2}" x2="{128 + gap - 16}" y2="{eye_y - 2}" stroke="#2a2a2a" stroke-width="4"/>')
    if kind == 'tai-nghe':
        band = shade(shirt, .6)
        return (f'<path d="M70 120C66 50 190 50 186 120" stroke="{band}" stroke-width="9" fill="none"/>'
                f'<rect x="62" y="108" width="18" height="30" rx="8" fill="{band}"/><rect x="176" y="108" width="18" height="30" rx="8" fill="{band}"/>')
    if kind == 'mu-len':
        cap = shade(shirt, 1.15)
        return (f'<path d="M74 92C74 44 182 44 182 92Z" fill="{cap}"/><rect x="70" y="84" width="116" height="16" rx="8" fill="{shade(cap, .8)}"/>'
                f'<circle cx="128" cy="40" r="10" fill="{shade(cap, .8)}"/>')
    if kind == 'kep-toc':
        return f'<g transform="rotate(-20 160 70)"><rect x="146" y="64" width="28" height="9" rx="4" fill="{shade(shirt, 1.3)}"/></g>'
    return ''


def avatar_svg(t, rng):
    """t: tổ hợp (nền, da, kiểu tóc, màu tóc, áo, cổ áo, mắt, miệng, phụ kiện)."""
    bg, skin, style, hair, shirt, collar, eye, mouth, extra = t
    face_rx = rng.choice((46, 48, 50, 52))
    eye_y, gap, mouth_y = rng.choice((116, 120)), rng.choice((18, 20, 22)), rng.choice((146, 150))
    sk2 = shade(skin, .86)
    parts = [f'<rect width="256" height="256" fill="{bg}"/>',
             f'<circle cx="{rng.choice((40, 216))}" cy="{rng.choice((40, 60))}" r="{rng.choice((26, 36, 46))}" fill="{shade(bg, 1.35)}"/>',
             hair_back(style, hair),
             f'<rect x="112" y="160" width="32" height="34" rx="10" fill="{sk2}"/>',
             collar_svg(collar, shirt),
             f'<ellipse cx="{128 - face_rx}" cy="122" rx="9" ry="12" fill="{sk2}"/><ellipse cx="{128 + face_rx}" cy="122" rx="9" ry="12" fill="{sk2}"/>',
             f'<ellipse cx="128" cy="116" rx="{face_rx}" ry="56" fill="{skin}"/>',
             hair_front(style, hair, rng),
             f'<path d="M{128 - gap - 9} {eye_y - 14}Q{128 - gap} {eye_y - 19} {128 - gap + 9} {eye_y - 14}'
             f'M{128 + gap - 9} {eye_y - 14}Q{128 + gap} {eye_y - 19} {128 + gap + 9} {eye_y - 14}" '
             f'stroke="{shade(hair, .9)}" stroke-width="4" fill="none" stroke-linecap="round"/>',
             eyes_svg(eye, eye_y, gap),
             f'<path d="M126 {eye_y + 10}Q122 {eye_y + 22} 129 {eye_y + 22}" stroke="{shade(skin, .7)}" stroke-width="3" fill="none" stroke-linecap="round"/>',
             mouth_svg(mouth, mouth_y, skin)]
    if extra == 'ma-hong' or rng.random() < .3:
        parts.append(f'<ellipse cx="{128 - gap - 10}" cy="{eye_y + 22}" rx="9" ry="5" fill="#ff8a8a" opacity=".35"/>'
                     f'<ellipse cx="{128 + gap + 10}" cy="{eye_y + 22}" rx="9" ry="5" fill="#ff8a8a" opacity=".35"/>')
    parts.append(extra_svg(extra, eye_y, gap, hair, shirt))
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">' + ''.join(parts) + '</svg>'


def combos(count, seed):
    rng = random.Random(seed)
    seen, out = set(), []
    while len(out) < count:
        t = (rng.choice(BG), rng.choices(SKIN, SKIN_W)[0], rng.choice(HAIRSTYLES), rng.choice(HAIR), rng.choice(SHIRT),
             rng.choice(COLLARS), rng.choice(EYES), rng.choice(MOUTHS), rng.choice(EXTRAS))
        if t[8] == 'mu-len' and t[2] in ('buoi-toc', 'buoc-cao', 'dung', 'xoan'):
            continue                            # mũ len che mất kiểu tóc buộc cao
        key = t[:3] + t[4:6]                    # khác nhau ở phần nhìn thấy rõ: nền, da, tóc, áo, cổ áo
        if key in seen:
            continue
        seen.add(key)
        out.append(t)
    return out


def find_edge():
    for p in (r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', r'C:\Program Files\Microsoft\Edge\Application\msedge.exe'):
        if os.path.isfile(p):
            return p
    return shutil.which('msedge') or shutil.which('chromium') or shutil.which('google-chrome')


CROP_PS = r'''
param([string]$Sheet, [string]$Out, [int]$Start, [int]$N, [int]$Cols, [int]$Quality)
Add-Type -AssemblyName System.Drawing
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
$img = [System.Drawing.Image]::FromFile($Sheet)
for ($i = 0; $i -lt $N; $i++) {
  $bmp = New-Object System.Drawing.Bitmap 256, 256
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $src = New-Object System.Drawing.Rectangle ((($i % $Cols)) * 256), ([Math]::Floor($i / $Cols) * 256), 256, 256
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, 256, 256), $src, [System.Drawing.GraphicsUnit]::Pixel)
  $bmp.Save((Join-Path $Out ('av{0:D4}.jpg' -f ($Start + $i))), $codec, $ep)
  $g.Dispose(); $bmp.Dispose()
}
$img.Dispose()
'''


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--out', required=True)
    ap.add_argument('--count', type=int, default=1056)
    ap.add_argument('--seed', type=int, default=20261123)
    ap.add_argument('--quality', type=int, default=88)
    ap.add_argument('--svg-only', action='store_true', help='chỉ ghi tệp SVG, không vẽ JPEG')
    a = ap.parse_args(argv)
    os.makedirs(a.out, exist_ok=True)
    rng = random.Random(a.seed + 1)
    items = [(f'av{i + 1:04d}', t, avatar_svg(t, rng)) for i, t in enumerate(combos(a.count, a.seed))]
    with open(os.path.join(a.out, 'manifest.csv'), 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['file', 'nen', 'da', 'kieu_toc', 'mau_toc', 'ao', 'co_ao', 'mat', 'mieng', 'phu_kien'])
        for name, t, _ in items:
            w.writerow([name + ('.svg' if a.svg_only else '.jpg'), *t])
    if a.svg_only:
        for name, _, svg in items:
            open(os.path.join(a.out, name + '.svg'), 'w', encoding='utf-8').write(svg)
        print(f'Đã ghi {len(items)} SVG vào {a.out}')
        return 0
    edge = find_edge()
    if not edge:
        sys.exit('Không thấy Microsoft Edge/Chromium để vẽ JPEG; dùng --svg-only.')
    cols, per = 8, 64
    tmp = tempfile.mkdtemp(prefix='avatars-')
    ps1 = os.path.join(tmp, 'crop.ps1')
    open(ps1, 'w', encoding='utf-8-sig').write(CROP_PS)
    for s in range(0, len(items), per):
        chunk = items[s:s + per]
        html = os.path.join(tmp, f'sheet{s // per}.html')
        png = os.path.join(tmp, f'sheet{s // per}.png')
        body = ''.join(f'<div>{svg}</div>' for _, _, svg in chunk)
        open(html, 'w', encoding='utf-8').write(
            '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#fff}'
            f'body{{display:grid;grid-template-columns:repeat({cols},256px);width:{cols * 256}px}}div{{width:256px;height:256px}}'
            'svg{display:block}</style>' + body)
        subprocess.run([edge, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                        f'--screenshot={png}', f'--window-size={cols * 256},{cols * 256}', 'file:///' + html.replace(os.sep, '/')],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
        subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, '-Sheet', png, '-Out', os.path.abspath(a.out),
                        '-Start', str(s + 1), '-N', str(len(chunk)), '-Cols', str(cols), '-Quality', str(a.quality)], check=True)
        print(f'  {s + len(chunk)}/{len(items)}', flush=True)
    shutil.rmtree(tmp, ignore_errors=True)
    total = sum(os.path.getsize(os.path.join(a.out, n + '.jpg')) for n, _, _ in items)
    print(f'Đã vẽ {len(items)} ảnh 256×256 vào {a.out} ({total / 1048576:.1f} MB, TB {total / len(items) / 1024:.1f} KB/ảnh)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
