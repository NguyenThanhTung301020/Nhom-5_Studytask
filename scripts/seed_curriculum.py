#!/usr/bin/env python3
"""Sinh dữ liệu kiểm tải StudyTask từ khung đào tạo (Khung đào tạo mẫu.docx).

Tạo vào CSDL SQLite của máy chủ (đúng lược đồ hiện có: bảng `accounts` và `docs`), không sửa mã máy chủ:
  - chương trình đào tạo (curriculum/…) và HỌC PHẦN MỞ theo năm: mỗi khóa học đủ 8 học kỳ của khung, mỗi lần mở là một bản ghi
    riêng (khóa, năm học, học kỳ 1/2, trạng thái đã kết thúc/đang học/kế hoạch); cùng một môn mở lại ở năm khác là bản ghi mới
    với thư mục tài liệu, đề trắc nghiệm, giáo viên riêng
  - 4 khóa đang học (ví dụ 2023-2027 … 2026-2030); mỗi khóa chia thành các lớp 20–30 sinh viên (ngẫu nhiên). Sinh viên được
    lưu theo KHÓA, năm học và học kỳ 1/2 của năm; môn của họ là các học phần đang học
  - giáo viên theo bộ môn; mỗi học phần mở có từ 1 đến 3 giáo viên, các lớp của khóa chia cho họ
  - thời khóa biểu và lịch thi theo TỪNG học kỳ của từng khóa (có ngày bắt đầu/kết thúc học kỳ), tài liệu (tệp PDF thật trong
    uploads/, dùng chung giữa các năm), đề trắc nghiệm kèm khóa đáp án
  - mật khẩu mặc định của mọi tài khoản: <vai trò>123  (student123, teacher123, ...)

Ví dụ:
  python scripts/seed_curriculum.py --data-dir ./du-lieu-thu --preset small      # thử nhanh
  python scripts/seed_curriculum.py --data-dir /var/lib/studytask-loadtest --preset medium
  python scripts/seed_curriculum.py --data-dir ./du-lieu-thu --dry-run          # chỉ in kế hoạch, không ghi
  python scripts/seed_curriculum.py --data-dir ./du-lieu-thu --purge            # xóa đúng dữ liệu do script này tạo

Chỉ dùng thư viện chuẩn. Dữ liệu nhận biết bằng nhãn `seed: "curriculum-v1"` nên --purge không đụng tới dữ liệu thật.
CẢNH BÁO: mật khẩu mặc định đoán được. Không nạp vào CSDL đang chạy công khai (xem docs/van-hanh/10-*.md).
"""
import argparse, csv, hashlib, json, math, os, random, secrets, sys, time, unicodedata
from concurrent.futures import ProcessPoolExecutor
from datetime import date, timedelta
from xml.etree import ElementTree as ET
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
SERVER_DIR = os.path.join(HERE, '..', 'server')
DEFAULT_KHUNG = os.path.join(HERE, 'data', 'khung-dao-tao.json')

TAG = 'curriculum-v1'              # nhãn gắn vào mọi bản ghi do script tạo
META_ID = 'seed_curriculum_v1'     # docs('meta', META_ID): ghi lại tham số, tệp đã tạo, mã đề
SUBJECT_BASE, SCHEDULE_BASE, EXAM_BASE, MATERIAL_BASE, QUIZ_BASE = 1000, 100000, 400000, 200000, 300000
SHARED_WARN_BYTES = 4 * 1024 * 1024   # máy chủ chỉ nhận ghi JSON ≤ 5 MB (MAX_JSON); giao diện ghi ngược cả tài liệu sharedData

def term_of(today):
    """(năm bắt đầu của năm học, học kỳ 1|2) theo ngày: HK1 từ tháng 8 đến hết tháng 1, HK2 từ tháng 2 đến tháng 7."""
    if today.month >= 8:
        return today.year, 1
    if today.month == 1:
        return today.year - 1, 1
    return today.year - 1, 2


PRESETS = {   # classes: số lớp MỖI KHÓA (4 khóa đang học); slides: số slide mỗi học phần; quizzes/questions: đề mỗi học phần; file_kb: cỡ tệp tài liệu (KB)
    'small':  dict(classes=3,  slides=1, quizzes=1, questions=5,  file_kb=(10, 30)),
    'medium': dict(classes=10, slides=2, quizzes=2, questions=10, file_kb=(60, 240)),
    'large':  dict(classes=16, slides=3, quizzes=2, questions=15, file_kb=(100, 400)),
}

# ── Bộ môn: giáo viên cùng bộ môn dạy được mọi môn của bộ môn đó ─────────────────────────────
BO_MON = {
    'llct': 'Lý luận chính trị & Pháp luật',
    'toan': 'Toán',
    'nnkn': 'Ngoại ngữ & Kỹ năng',
    'lt':   'Lập trình',
    'mmt':  'Hệ thống & Mạng',
    'pm':   'Công nghệ phần mềm & Cơ sở dữ liệu',
    'ai':   'Trí tuệ nhân tạo & Dữ liệu',
}
IT_GROUP = {}
for _g, _codes in {
    'lt':  'IT102 IT103 IT201 IT202 IT304 IT305 IT404',
    'mmt': 'IT104 IT203 IT205 IT303 IT308',
    'pm':  'IT101 IT204 IT206 IT301 IT306 IT401 IT402 IT405 IT498 IT499',
    'ai':  'IT302 IT307 IT403',
}.items():
    IT_GROUP.update({c: _g for c in _codes.split()})
PREFIX_GROUP = {'GEN': 'llct', 'MTH': 'toan', 'ENG': 'nnkn', 'SKL': 'nnkn'}
LAB_COURSES = set('IT102 IT103 IT201 IT202 IT204 IT304 IT305 IT306 IT307'.split())   # học ở phòng máy


def group_of(code):
    code = code.upper()
    if code in IT_GROUP:
        return IT_GROUP[code]
    prefix = ''.join(ch for ch in code if ch.isalpha())
    g = PREFIX_GROUP.get(prefix)
    if g:
        return g
    g = prefix.lower()[:6] or 'khac'            # khung mới có mã lạ: gom theo tiền tố mã
    BO_MON.setdefault(g, f'Bộ môn {prefix}')
    return g


# ── Tên người Việt (dữ liệu giả) ─────────────────────────────────────────────────────────────
HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý']
HO_W = [30, 12, 10, 8, 5, 4, 4, 4, 4, 4, 4, 3, 2, 2, 2, 2]
MID_M = ['Văn', 'Đức', 'Minh', 'Quang', 'Hữu', 'Thanh', 'Gia', 'Anh', 'Tuấn', 'Công', 'Xuân']
MID_F = ['Thị', 'Ngọc', 'Thu', 'Thanh', 'Phương', 'Mai', 'Khánh', 'Bảo', 'Hồng', 'Kim']
TEN_M = ['An', 'Bảo', 'Cường', 'Dũng', 'Duy', 'Hải', 'Hiếu', 'Hoàng', 'Huy', 'Khoa', 'Khang', 'Long', 'Nam', 'Phát', 'Phong',
         'Quân', 'Sơn', 'Tài', 'Thắng', 'Thịnh', 'Toàn', 'Trung', 'Tú', 'Việt', 'Vinh']
TEN_F = ['Anh', 'Chi', 'Dung', 'Giang', 'Hà', 'Hạnh', 'Hiền', 'Hoa', 'Hương', 'Lan', 'Linh', 'Loan', 'Ly', 'Mai', 'My', 'Ngân',
         'Nhung', 'Oanh', 'Phương', 'Thảo', 'Thủy', 'Trang', 'Trinh', 'Uyên', 'Vy', 'Yến']
TITLES = ['ThS.', 'ThS.', 'ThS.', 'TS.', 'TS.', 'PGS.TS.']


def person_name(rng):
    male = rng.random() < 0.5
    return ' '.join([rng.choices(HO, HO_W)[0], rng.choice(MID_M if male else MID_F), rng.choice(TEN_M if male else TEN_F)])


def fold(s):
    s = unicodedata.normalize('NFKD', s.replace('đ', 'd').replace('Đ', 'D'))
    return ''.join(ch for ch in s if not unicodedata.combining(ch))


def slug(s, n=40):
    return ''.join(ch if ch.isalnum() else '_' for ch in fold(s)).strip('_')[:n] or 'file'


# ── Khung đào tạo ────────────────────────────────────────────────────────────────────────────
def parse_docx(path):
    """Đọc bảng khung đào tạo: Học kỳ | Mã HP | Tên học phần | Số TC | Khối kiến thức (ô học kỳ chỉ ghi ở dòng đầu)."""
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    W = '{%s}' % ns['w']
    root = ET.fromstring(zipfile.ZipFile(path).read('word/document.xml'))
    courses, sem = [], 0
    for tr in root.iter(W + 'tr'):
        cells = [''.join(t.text or '' for t in tc.iter(W + 't')).strip() for tc in tr.findall('w:tc', ns)]
        if len(cells) < 5 or not cells[1] or not cells[3].isdigit():
            continue                                  # dòng tiêu đề hoặc dòng trống
        digits = ''.join(ch for ch in cells[0] if ch.isdigit())
        if digits:
            sem = int(digits)
        courses.append({'sem': sem, 'code': cells[1].upper(), 'name': cells[2], 'credits': int(cells[3]), 'block': cells[4]})
    return courses


def load_khung(path):
    if path.lower().endswith('.docx'):
        return parse_docx(path)
    with open(path, encoding='utf-8') as f:
        return json.load(f)['courses']


# ── Tệp PDF giả (hợp lệ, nội dung ngẫu nhiên để không bị nén/khử trùng khi đo dung lượng) ───────
def make_pdf(title, size, rng):
    text = fold(title)[:80].replace('\\', ' ').replace('(', '[').replace(')', ']')
    content = f'BT /F1 18 Tf 72 760 Td ({text}) Tj ET'.encode()
    base = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
        b'<< /Length %d >>\nstream\n' % len(content) + content + b'\nendstream',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ]
    pad = max(0, size - sum(len(b) for b in base) - 400)
    objs = base + [b'<< /Length %d >>\nstream\n' % pad + rng.randbytes(pad) + b'\nendstream']
    out, offsets = bytearray(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'), []
    for i, body in enumerate(objs, 1):
        offsets.append(len(out))
        out += b'%d 0 obj\n' % i + body + b'\nendobj\n'
    xref = len(out)
    out += b'xref\n0 %d\n0000000000 65535 f \n' % (len(objs) + 1) + b''.join(b'%010d 00000 n \n' % o for o in offsets)
    out += b'trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n' % (len(objs) + 1, xref)
    return bytes(out)


# ── Lập kế hoạch (thuần, không ghi gì) ───────────────────────────────────────────────────────
# 16 tiết học do nhà trường công bố (áp dụng từ học kỳ 1 năm học 2025-2026); mỗi tiết 45 phút
TIET = {1: ('07:30', '08:15'), 2: ('08:15', '09:00'), 3: ('09:00', '09:45'), 4: ('10:00', '10:45'), 5: ('10:45', '11:30'), 6: ('11:30', '12:15'),
        7: ('12:45', '13:30'), 8: ('13:30', '14:15'), 9: ('14:15', '15:00'), 10: ('15:15', '16:00'), 11: ('16:00', '16:45'), 12: ('16:45', '17:30'),
        13: ('18:00', '18:45'), 14: ('18:45', '19:30'), 15: ('19:30', '20:15'), 16: ('20:15', '21:00')}
SESSIONS = [(1, 6), (7, 12), (13, 16)]          # sáng, chiều, tối: một buổi học là một khối tiết liền nhau trong cùng một buổi
GUIDED_CODES = {'IT405', 'IT498', 'IT499'}      # đồ án chuyên ngành, thực tập, khóa luận: không có thời khóa biểu cụ thể


def block_starts(length):
    """Mọi tiết bắt đầu hợp lệ của một khối `length` tiết (nằm gọn trong một buổi)."""
    return [s for a, b in SESSIONS for s in range(a, b - length + 2)]


def is_guided(c):
    """Môn hướng dẫn (thực tập, đồ án, khóa luận): không xếp lịch/lịch thi, điểm do giáo viên hướng dẫn đánh giá."""
    return c['code'].upper() in GUIDED_CODES or any(k in fold(c['name']).lower() for k in ('thuc tap', 'khoa luan', 'do an'))


def weekly_blocks(c):
    """Các khối tiết mỗi tuần của một môn: số tiết/tuần = số tín chỉ (2–4). Môn 4 tín chỉ thực hành học một khối 4 tiết,
    môn lý thuyết 4 tín chỉ tách 2 khối 2 tiết ở hai ngày khác nhau. Môn hướng dẫn: không có khối nào."""
    if is_guided(c):
        return []
    n = max(2, min(c['credits'], 4))
    return [4] if n == 4 and c['code'] in LAB_COURSES else [2, 2] if n == 4 else [n]


def room_name(i):
    return f"{'ABCDEFGHJK'[(i // 20) % 10]}{(i % 20) // 5 + 1}.{(i % 20) // 5 + 1}{i % 5 + 1:02d}" + (f'-{i // 200}' if i >= 200 else '')


def term_dates(start_year, ky):
    """(bắt đầu học, kết thúc học, bắt đầu thi, kết thúc thi) của học kỳ `ky` trong năm học start_year-(start_year+1):
    15 tuần học bắt đầu từ một ngày Thứ Hai, tiếp đó 3 tuần thi."""
    first = date(start_year, 9, 7) if ky == 1 else date(start_year + 1, 2, 8)
    start = first + timedelta(days=(7 - first.weekday()) % 7)
    end = start + timedelta(days=15 * 7 - 1)
    return start, end, end + timedelta(days=1), end + timedelta(days=21)


def build_plan(cfg, courses, rng, today):
    """Mô hình: KHÓA (nhập học 2023 … 2026, mỗi khóa 4 năm = 8 học kỳ) → lớp → sinh viên;
    HỌC PHẦN MỞ = (môn, khóa, năm học, học kỳ): cùng một môn mở lại ở năm khác là một bản ghi mới (thư mục tài liệu, đề, giáo viên
    riêng) có nhãn năm học. Mỗi học phần mở có từ 1 đến `max_teachers` (3) giáo viên, các lớp của khóa được chia cho họ.
    Thời khóa biểu và lịch thi sinh cho đủ 8 học kỳ của mỗi khóa (đã kết thúc, đang học, kế hoạch), mỗi mục gắn khóa/năm học/học kỳ
    và ngày bắt đầu–kết thúc của học kỳ đó."""
    import studytask_api as api          # dùng đúng hàm kiểm tra đề của máy chủ để đề sinh ra luôn hợp lệ
    colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796', '#6610f2', '#fd7e14']
    courses = [dict(c) for c in courses]
    for c in courses:
        c['group'] = group_of(c['code'])
    by_sem = {}
    for c in courses:
        by_sem.setdefault(c['sem'], []).append(c)
    sems = sorted(by_sem)
    iso = lambda d: d.isoformat()
    years = max(sems) // 2
    nam_hoc, hoc_ky = cfg['nam_hoc'], cfg['hoc_ky']
    cur = (nam_hoc, hoc_ky)

    # ── khóa → lớp → sinh viên: khóa nhập học nam_hoc-k đang ở năm thứ k+1 (vị trí khung 2k+hoc_ky) ──
    cohorts = []
    for k in range(years):
        intake = nam_hoc - k
        cohorts.append({'intake': intake, 'khoa': f'{intake}-{intake + years}', 'yy': intake % 100, 'pos': 2 * k + hoc_ky, 'classes': []})

    # ── học phần mở: mỗi khóa học đủ các học kỳ của khung, mỗi lần là một bản ghi riêng ──
    offerings = []
    for co in cohorts:
        for p in sems:
            sy, ky = co['intake'] + (p - 1) // 2, 1 if p % 2 else 2
            status = 'da-ket-thuc' if (sy, ky) < cur else 'dang-hoc' if (sy, ky) == cur else 'ke-hoach'
            for c in by_sem[p]:
                offerings.append({**c, 'id': SUBJECT_BASE + len(offerings), 'cohort': co, 'khoa': co['khoa'], 'startYear': sy,
                                  'namHoc': f'{sy}-{sy + 1}', 'ky': ky, 'status': status, 'teacherNames': set()})
    term_of_o = lambda o: (o['startYear'], o['ky'])
    terms = sorted({term_of_o(o) for o in offerings})

    classes, students = [], []
    for co in cohorts:
        now_ids = [o['id'] for o in offerings if o['cohort'] is co and o['sem'] == co['pos']]
        for n in range(1, cfg['classes'] + 1):
            size = rng.randint(cfg['min_students'], cfg['max_students'])
            cl = {'id': f'CNTT{co["yy"]:02d}-{n:02d}', 'sem': co['pos'], 'cohort': co['khoa'], 'namThu': (co['pos'] + 1) // 2,
                  'namHoc': f'{nam_hoc}-{nam_hoc + 1}', 'hocKy': hoc_ky, 'size': size, 'students': [], 'sections': []}
            for j in range(1, size + 1):
                sid = f'{co["yy"]:02d}{n:02d}{j:03d}'
                st = {'username': f'sv{sid}', 'studentId': sid, 'name': person_name(rng), 'role': 'student', 'class': cl, 'subjectIds': now_ids}
                cl['students'].append(st)
                students.append(st)
            co['classes'].append(cl)
            classes.append(cl)

    # ── giáo viên theo bộ môn (dùng chung giữa các năm); khởi điểm đủ tải ở học kỳ đông nhất và ≥ max_teachers để chọn 1–3 người ──
    teachers, pool = [], {}

    def new_teacher(g):
        lst = pool.setdefault(g, [])
        idx = len(lst) + 1
        t = {'username': f'gv{g}{idx:02d}', 'teacherId': f'GV{g.upper()}{idx:03d}', 'role': 'teacher', 'group': g,
             'name': f'{rng.choice(TITLES)} {person_name(rng)}', 'sections': [],
             'canTeachCodes': sorted({c['code'] for c in courses if c['group'] == g})}
        lst.append(t)
        teachers.append(t)
        return t
    wt_of = lambda o: sum(weekly_blocks(o)) or 1                       # tiết/tuần; môn hướng dẫn tính 1 (khối lượng hướng dẫn)
    cap = cfg['max_load'] * 3             # trần TIẾT/tuần của một giáo viên trong một học kỳ (mặc định 24)
    for g in BO_MON:
        worst = max((sum(len(o['cohort']['classes']) * wt_of(o) for o in offerings if o['group'] == g and term_of_o(o) == t)
                     for t in terms), default=0)
        for _ in range(max(cfg['max_teachers'], math.ceil(worst / cap))):
            new_teacher(g)

    # ── thời khóa biểu theo từng học kỳ, xếp theo TIẾT: lớp, giáo viên và phòng không trùng tiết TRONG CÙNG học kỳ ──
    #   - mỗi buổi là một khối tiết liền nhau trong một buổi (sáng/chiều/tối); môn lý thuyết 3 TC = 1 khối 3 tiết mỗi tuần
    #   - lớp học trực tuyến ưu tiên buổi tối (tiết 13–16) và cuối tuần; lớp trực tiếp ưu tiên sáng/chiều các ngày trong tuần
    #   - mỗi lớp có ít nhất 1 ngày nghỉ trong tuần (Thứ Hai–Thứ Bảy); Chủ nhật chỉ dùng cho lớp trực tuyến
    #   - ưu tiên dồn lịch vào những ngày lớp đã học và các khối liền nhau để chừa ngày nghỉ, ít tiết trống xen kẽ
    rooms, labs = [room_name(i) for i in range(30)], [f'PM{i + 1:02d}' for i in range(6)]
    room_busy, busy_c, busy_t, class_off, load, schedule, exams = set(), {}, {}, {}, {}, [], []

    def pick_block(cb, tb, off, used_days, class_days, length, online):
        best, best_score = None, 1e9
        for day in [d for d in range(2, 8) if d not in off] + ([8] if online else []):
            if day in used_days:
                continue
            for st in block_starts(length):
                if any((day, t) in cb or (day, t) in tb for t in range(st, st + length)):
                    continue
                score = rng.random() * 0.9
                if online:
                    score += 0 if (st >= 13 or day >= 7) else 6          # tối hoặc cuối tuần
                else:
                    score += (5 if st >= 13 else 0) + (1 if day == 7 else 0)
                if day not in class_days:
                    score += 2                                            # dồn vào ngày đã học để chừa ngày nghỉ
                if (day, st - 1) in cb or (day, st + length) in cb:
                    score -= 1                                            # liền kề khối đã có, ít tiết trống
                if score < best_score:
                    best, best_score = (day, st), score
        return best

    def take_room(term, day, st, length, lab):
        lst = labs if lab else rooms
        start = rng.randrange(len(lst))
        for i in range(len(lst)):
            r = lst[(start + i) % len(lst)]
            if all((term, day, t, r) not in room_busy for t in range(st, st + length)):
                break
        else:
            r = f'PM{len(lst) + 1:02d}' if lab else room_name(len(lst))
            lst.append(r)
        for t in range(st, st + length):
            room_busy.add((term, day, t, r))
        return r

    def try_place(cl_key, t_key, term, blocks, fmt):
        """Xếp các khối của một lớp học phần cho giáo viên t; thất bại thì trả None và không để lại dấu vết."""
        cb, tb = busy_c.setdefault(cl_key, set()), busy_t.setdefault(t_key, set())
        off, class_days = class_off[cl_key], {d for d, _ in cb}
        got, used = [], set()
        for i, length in enumerate(blocks):
            online = fmt == 'online' or (fmt == 'hybrid' and i > 0)
            pos = pick_block(cb, tb, off, used, class_days | used, length, online)
            if pos is None:
                for (d, st, ln, _) in got:
                    for t in range(st, st + ln):
                        cb.discard((d, t)); tb.discard((d, t))
                return None
            used.add(pos[0])
            for t in range(pos[1], pos[1] + length):
                cb.add((pos[0], t)); tb.add((pos[0], t))
            got.append((pos[0], pos[1], length, online))
        return got

    exam_busy = set()
    for term in terms:
        t_start, t_end, ex_start, ex_end = term_dates(*term)
        offs = [o for o in offerings if term_of_o(o) == term]
        rng.shuffle(offs)
        for o in offs:
            co, blocks = o['cohort'], weekly_blocks(o)
            wt = wt_of(o)
            k = max(1, min(cfg['max_teachers'], math.ceil(len(co['classes']) / cfg['classes_per_teacher'])))
            share = math.ceil(len(co['classes']) / k) * wt                  # tiết/tuần mỗi giáo viên nhận ở học phần này
            ld = lambda t: load.get((t['username'], term), 0)
            ranked = sorted(pool[o['group']], key=lambda t: (ld(t), rng.random()))
            chosen = [t for t in ranked if ld(t) + share <= cap][:k]        # chỉ chọn người còn đủ chỗ; thiếu thì thêm giáo viên mới
            while len(chosen) < k:
                chosen.append(new_teacher(o['group']))
            for cl in co['classes']:
                cl_key = (cl['id'], term)
                class_off.setdefault(cl_key, set(rng.sample(range(2, 8), rng.choice([1, 1, 2]))))     # 1–2 ngày nghỉ trong tuần
                fmt = rng.choices(['offline', 'online', 'hybrid'], [80, 12, 8])[0] if blocks else 'huong-dan'
                placed = None
                for t in sorted(chosen, key=lambda t: (ld(t), rng.random())):
                    if ld(t) + wt > cap:
                        continue
                    got = try_place(cl_key, (t['username'], term), term, blocks, fmt) if blocks else []
                    if got is not None:
                        placed = (t, got)
                        break
                if not placed:           # các giáo viên đã chọn kín tải/tiết: thay người đầy nhất bằng giáo viên mới, vẫn giữ tối đa k người
                    fresh = new_teacher(o['group'])
                    chosen[chosen.index(max(chosen, key=ld))] = fresh
                    got = try_place(cl_key, (fresh['username'], term), term, blocks, fmt) if blocks else []
                    placed = (fresh, got)
                t, got = placed
                load[(t['username'], term)] = ld(t) + wt
                t['sections'].append({'classId': cl['id'], 'subjectId': o['id']})
                o['teacherNames'].add(t['name'])
                ids = []
                for (day, st, length, online) in got:
                    en = st + length - 1
                    schedule.append({'id': SCHEDULE_BASE + len(schedule) + 1, 'subjectId': o['id'], 'day': day,
                                     'start': TIET[st][0], 'end': TIET[en][1], 'tietStart': st, 'tietEnd': en,
                                     'room': 'Online' if online else take_room(term, day, st, length, o['code'] in LAB_COURSES),
                                     'teacher': t['name'], 'format': 'online' if online else 'hybrid' if fmt == 'hybrid' else 'offline',
                                     'classId': cl['id'], 'className': cl['id'], 'khoa': o['khoa'], 'namHoc': o['namHoc'], 'ky': o['ky'],
                                     'startDate': iso(t_start), 'endDate': iso(t_end), 'seed': TAG})
                    ids.append(schedule[-1]['id'])
                cl['sections'].append({'subjectId': o['id'], 'code': o['code'], 'namHoc': o['namHoc'], 'ky': o['ky'],
                                       'teacherUsername': t['username'], 'teacherName': t['name'], 'scheduleIds': ids, '_teacher': t,
                                       '_term': term, 'guided': not blocks})
        # lịch thi của học kỳ: sau 15 tuần học, mỗi lớp thi các môn cách nhau 2 ngày, không rơi vào Chủ nhật, mỗi bài thi 2 tiết (90 phút)
        # (môn hướng dẫn không có lịch thi: kết quả theo yêu cầu của giáo viên hướng dẫn)
        for co in cohorts:
            for cl in co['classes']:
                for i, sec in enumerate(s for s in cl['sections'] if s['_term'] == term and not s['guided']):
                    d = ex_start + timedelta(days=2 * i)
                    d += timedelta(days=1) if d.weekday() == 6 else timedelta(0)
                    st = rng.choice([1, 4, 7, 10])
                    o = next(x for x in offerings if x['id'] == sec['subjectId'])
                    r = next((r for r in rooms + labs if ((term, d, st), r) not in exam_busy), room_name(len(rooms) + len(exam_busy)))
                    exam_busy.add(((term, d, st), r))
                    fmt = 'thucHanh' if o['code'] in LAB_COURSES else rng.choice(['tuLuan', 'tracNghiem', 'tuLuan'])
                    exams.append({'id': EXAM_BASE + len(exams) + 1, 'subjectId': o['id'], 'date': iso(d), 'start': TIET[st][0], 'end': TIET[st + 1][1],
                                  'tietStart': st, 'tietEnd': st + 1, 'room': r, 'teacher': sec['teacherName'], 'format': fmt,
                                  'classId': cl['id'], 'className': cl['id'], 'khoa': o['khoa'], 'namHoc': o['namHoc'], 'ky': o['ky'], 'seed': TAG})

    for t in teachers:           # subjectIds = các học phần mở ĐƯỢC PHÂN CÔNG (mọi năm); môn thuộc bộ môn nhưng chưa giao nằm ở canTeachCodes
        t['subjectIds'] = sorted({sec['subjectId'] for sec in t['sections']})
    over = [o for o in offerings if len(o['teacherNames']) > cfg['max_teachers']]
    assert not over, (f'{len(over)} học phần mở có hơn {cfg["max_teachers"]} giáo viên vì số lớp mỗi khóa ({cfg["classes"]}) quá nhiều so với tải '
                      f'cho phép; giảm --classes hoặc tăng --max-teachers/--max-load')

    # ── tài liệu và trắc nghiệm: học phần đã kết thúc hoặc đang học có nội dung; học phần kế hoạch chỉ có thời khóa biểu ──
    files = {}                       # (mã môn, tiêu đề) → tệp dùng chung giữa các năm (giáo trình/slide dùng lại), nên ít tệp hơn học phần
    materials, quizzes, keys = [], [], []
    for o in offerings:
        if o['status'] == 'ke-hoach':
            continue
        t_start, t_end, _, _ = term_dates(o['startYear'], o['ky'])
        if is_guided(o):         # thực tập/đồ án/khóa luận: chỉ có hướng dẫn và biểu mẫu, không có slide, đề thi, trắc nghiệm
            kinds = [('giaoTrinh', f'Hướng dẫn thực hiện {o["name"]}', 'Yêu cầu, tiến độ và biểu mẫu do giáo viên hướng dẫn quy định'),
                     ('thamKhao', f'Mẫu báo cáo {o["name"]}', 'Biểu mẫu báo cáo')]
        else:
            kinds = [('giaoTrinh', f'Giáo trình {o["name"]}', 'Tài liệu chính của học phần')]
            kinds += [('slide', f'Slide {o["name"]} – Chương {k}', f'Bài giảng điện tử chương {k}') for k in range(1, cfg['slides'] + 1)]
            kinds += [('baiTap', f'Bài tập {o["name"]} – Phần 1', 'Bài tập có đáp án'), ('baiTap', f'Đề thi mẫu {o["name"]}', 'Đề thi các năm trước')]
        names = sorted(o['teacherNames'])
        for typ, title, desc in kinds:
            m = {'id': MATERIAL_BASE + len(materials) + 1, 'subjectId': o['id'], 'title': title, 'type': typ, 'description': desc,
                 'url': '', 'uploadedBy': rng.choice(names) if names else '',
                 'uploadedAt': iso(min(today, t_start + timedelta(days=rng.randint(0, 40)))), 'seed': TAG}
            if cfg['files']:
                key = (o['code'], title)
                if key not in files:
                    files[key] = {'stored': f'{rng.getrandbits(64):016x}_{slug(title)}.pdf', 'size': rng.randint(cfg['file_kb'][0], cfg['file_kb'][1]) * 1024}
                m.update(fileName=f'{slug(title)}.pdf', size=files[key]['size'], stored=files[key]['stored'], url='/uploads/' + files[key]['stored'])
            materials.append(m)
        past = o['status'] == 'da-ket-thuc'
        for qi in range(1, 1 if is_guided(o) else cfg['quizzes'] + 1):
            qs = []
            for k in range(1, cfg['questions'] + 1):
                topic, r = f'chủ đề {qi}.{k}', rng.random()
                head = f'[{o["code"]}] '
                if r < 0.9:
                    ans = [{'id': ch, 'text': f'Nhận định {ch.upper()} về {topic} của {o["name"]}'} for ch in 'abcd']
                if r < 0.7:
                    ans[rng.randrange(4)]['correct'] = True
                    qs.append({'id': k, 'type': 'single', 'text': head + f'Phát biểu nào sau đây đúng về {topic}?', 'answers': ans})
                elif r < 0.9:
                    for a in rng.sample(ans, 2):
                        a['correct'] = True
                    qs.append({'id': k, 'type': 'multiple', 'text': head + f'Chọn tất cả nhận định đúng về {topic}:', 'answers': ans})
                else:
                    qs.append({'id': k, 'type': 'fill', 'blanks': 1, 'text': head + f'Điền khuyết: khái niệm chính của {topic} là ____.',
                               'accepted': [[f'khái niệm {qi}.{k}', f'khai niem {qi}.{k}']], 'answers': []})
            if past:
                due, status = t_end - timedelta(days=7 * (cfg['quizzes'] - qi)), 'closed'
            else:
                due, status = (today - timedelta(days=14), 'closed') if qi == 1 else (today + timedelta(days=10 * (qi - 1)), 'active')
            q = {'id': QUIZ_BASE + len(quizzes) + 1, 'subjectId': o['id'], 'title': f'Trắc nghiệm {o["name"]} – Đề {qi}',
                 'description': 'Dữ liệu kiểm tải (nội dung câu hỏi được sinh tự động)', 'dueDate': iso(due), 'status': status,
                 'createdAt': f'{iso(due - timedelta(days=30))}T00:00:00.000Z', 'questions': qs}
            assert api.quiz_shape_ok(q) and api.quiz_key_complete(q), f'đề sinh ra không hợp lệ: {q["title"]}'
            keys.append((str(q['id']), api.quiz_key_of(q)))
            pub = api.quiz_strip(q)
            pub['seed'] = TAG
            quizzes.append(pub)

    subjects = [{'id': o['id'], 'code': o['code'], 'name': o['name'], 'credits': o['credits'], 'color': colors[o['sem'] % len(colors)],
                 'teachers': sorted(o['teacherNames']), 'khoiKienThuc': o['block'], 'hocKy': o['sem'], 'boMon': BO_MON[o['group']],
                 'khoa': o['khoa'], 'namHoc': o['namHoc'], 'ky': o['ky'], 'namThu': (o['sem'] + 1) // 2, 'trangThai': o['status'],
                 **({'kieuHoc': 'huong-dan'} if is_guided(o) else {}), 'seed': TAG} for o in offerings]

    blocks = []
    for c in courses:
        if c['block'] not in [b['name'] for b in blocks]:
            blocks.append({'name': c['block'], 'courses': []})
        next(b for b in blocks if b['name'] == c['block'])['courses'].append({'code': c['code'], 'name': c['name'], 'credits': c['credits']})
    oldest = nam_hoc - (years - 1)                                  # khóa nhập học sớm nhất còn đang học
    curriculum = {'name': f'Khung đào tạo Công nghệ thông tin (áp dụng từ khóa {oldest})', 'major': 'Công nghệ thông tin', 'cohort': str(oldest),
                  'totalCredits': sum(c['credits'] for c in courses), 'seed': TAG,
                  'modules': [{'id': i + 1, 'name': b['name'], 'kind': 'elective' if 'chọn' in b['name'].lower() else 'required',
                               'minCredits': sum(x['credits'] for x in b['courses']), 'courses': b['courses']}
                              for i, b in enumerate(blocks)]}
    return dict(courses=courses, cohorts=cohorts, offerings=offerings, terms=terms, classes=classes, students=students, teachers=teachers,
                schedule=schedule, exams=exams, materials=materials, files=list(files.values()), quizzes=quizzes, quiz_keys=keys,
                subjects=subjects, curriculum=curriculum, rooms=len(rooms) + len(labs), load=load)


# ── Ghi vào CSDL ─────────────────────────────────────────────────────────────────────────────
def _pbkdf2(args):
    pw, salt = args
    return hashlib.pbkdf2_hmac('sha256', pw.encode(), bytes.fromhex(salt), 200_000).hex()


def accounts_of(plan, staff):
    out = [dict(t) for t in plan['teachers']] + [dict(s) for s in plan['students']]
    if staff:
        out += [{'username': 'admin01', 'role': 'admin', 'name': 'Quản trị viên (kiểm tải)', 'subjectIds': []},
                {'username': 'daotao01', 'role': 'training', 'name': 'Phòng Đào tạo (kiểm tải)', 'subjectIds': []},
                {'username': 'taichinh01', 'role': 'finance', 'name': 'Phòng Tài chính (kiểm tải)', 'subjectIds': []}]
    return out


def user_docs(a, uid, today_s):
    d = {'name': a['name'], 'role': a['role'], 'subjectIds': a['subjectIds'], 'phone': '', 'createdAt': today_s,
         'username': a['username'], 'seed': TAG}
    prof = {'name': a['name'], 'email': '', 'phone': ''}
    if a['role'] == 'student':
        cl = a['class']
        # Lưu theo KHÓA + năm học + học kỳ 1/2 của năm; "năm thứ" suy ra từ khóa, không lưu "kỳ số mấy" của khung
        d.update(studentId=a['studentId'], classId=cl['id'], className=cl['id'], cohort=cl['cohort'], namHoc=cl['namHoc'],
                 hocKy=cl['hocKy'], namThu=cl['namThu'])
        prof.update(studentId=a['studentId'], faculty='Công nghệ thông tin', major='Công nghệ thông tin', className=cl['id'],
                    cohort=cl['cohort'], semester=f'Học kỳ {cl["hocKy"]} – Năm học {cl["namHoc"]}', gpa='')
    elif a['role'] == 'teacher':
        d.update(teacherId=a['teacherId'], boMon=BO_MON[a['group']], sections=a['sections'], canTeachCodes=a['canTeachCodes'])
        prof.update(teacherId=a['teacherId'], faculty='Công nghệ thông tin', department=BO_MON[a['group']], position='Giảng viên')
    else:
        prof.update(department=a['name'])
    return d, {'profile': prof, 'seed': TAG}


def purge(api, data_dir, vacuum=False):
    con = api.db()
    uids, avatars = [], []
    for uid, data in con.execute("SELECT id, data FROM docs WHERE col='user'"):
        d = json.loads(data)
        if d.get('seed') == TAG:
            uids.append(uid)
            if str(d.get('avatar', '')).startswith('/uploads/avatars/'):      # ảnh đại diện (scripts/assign_avatars.py hoặc tự tải lên)
                avatars.append(os.path.basename(d['avatar']))
    meta = api.doc_get('meta', META_ID) or {}
    con.execute('BEGIN')
    for i in range(0, len(uids), 500):
        part = uids[i:i + 500]
        ph = ','.join('?' * len(part))
        for sql in (f'DELETE FROM accounts WHERE uid IN ({ph})', f'DELETE FROM sessions WHERE uid IN ({ph})',
                    f'DELETE FROM contact_email WHERE uid IN ({ph})', f'DELETE FROM chat WHERE thread IN ({ph})',
                    f'DELETE FROM submission_files WHERE uid IN ({ph})',
                    f"DELETE FROM docs WHERE col IN ('user','userData','activities') AND id IN ({ph})"):
            con.execute(sql, part)
    gone, quiz_ids = set(uids), [str(x) for x in meta.get('quizIds', [])]
    for rid, data in con.execute("SELECT id, data FROM docs WHERE col='quizResults'").fetchall():
        d = json.loads(data)
        if d.get('uid') in gone or str(d.get('quizId')) in quiz_ids:
            con.execute("DELETE FROM docs WHERE col='quizResults' AND id=?", (rid,))
    for col in ('quizKeys', 'quizArchive'):
        con.executemany('DELETE FROM docs WHERE col=? AND id=?', [(col, q) for q in quiz_ids])
    for col in ('classes', 'curriculum'):
        for rid, data in con.execute('SELECT id, data FROM docs WHERE col=?', (col,)).fetchall():
            if json.loads(data).get('seed') == TAG:
                con.execute('DELETE FROM docs WHERE col=? AND id=?', (col, rid))
    shared = api.doc_get('sharedData', 'global')
    if shared:
        for k, v in list(shared.items()):
            if isinstance(v, list):
                shared[k] = [x for x in v if not (isinstance(x, dict) and x.get('seed') == TAG)]
        api.doc_put('sharedData', 'global', shared)
    con.execute("DELETE FROM docs WHERE col='meta' AND id=?", (META_ID,))
    con.execute('COMMIT')
    removed = 0
    for name in avatars:
        try:
            os.remove(os.path.join(api.UPLOAD_DIR, 'avatars', name))
        except OSError:
            pass
    con.execute("DELETE FROM docs WHERE col='meta' AND id='seed_avatars_v1'")
    for name in meta.get('files', []):
        try:
            os.remove(os.path.join(api.UPLOAD_DIR, name))
            removed += 1
        except OSError:
            pass
    try:
        os.remove(os.path.join(data_dir, 'seed-accounts.csv'))
    except OSError:
        pass
    if vacuum:
        con.execute('VACUUM')
    con.execute('PRAGMA wal_checkpoint(TRUNCATE)')
    print(f'Đã xóa {len(uids)} tài khoản, {len(quiz_ids)} đề trắc nghiệm, {removed} tệp tài liệu (chỉ dữ liệu có nhãn {TAG}).')


def upgrade_assignments(api):
    """Nâng cấp dữ liệu đã nạp bản cũ: ghi `sections` (lớp học phần đang dạy) vào hồ sơ giáo viên từ các tài liệu classes/…,
    đặt subjectIds = các môn được phân công và giữ môn thuộc bộ môn ở canTeachSubjectIds. Chạy lại nhiều lần không đổi kết quả."""
    con = api.db()
    per = {}
    for _, data in con.execute("SELECT id, data FROM docs WHERE col='classes'").fetchall():
        cl = json.loads(data)
        if cl.get('seed') == TAG:
            for sec in cl.get('sections', []):
                per.setdefault(sec['teacherUid'], []).append({'classId': cl['id'], 'subjectId': sec['subjectId']})
    n = total = 0
    con.execute('BEGIN')
    for uid, data in con.execute("SELECT id, data FROM docs WHERE col='user'").fetchall():
        d = json.loads(data)
        if d.get('seed') != TAG or d.get('role') != 'teacher':
            continue
        total += 1
        secs = sorted(per.get(uid, []), key=lambda s: (s['classId'], s['subjectId']))
        new = dict(d, sections=secs, subjectIds=sorted({s['subjectId'] for s in secs}))
        if 'canTeachCodes' not in d and 'canTeachSubjectIds' not in d:        # hồ sơ rất cũ: giữ danh sách môn cũ làm "môn có thể dạy"
            new['canTeachSubjectIds'] = d.get('subjectIds') or []
        if new != d:
            con.execute("UPDATE docs SET data=? WHERE col='user' AND id=?", (json.dumps(new, ensure_ascii=False), uid))
            n += 1
    con.execute('COMMIT')
    con.execute('PRAGMA wal_checkpoint(TRUNCATE)')
    print(f'Đã cập nhật phân công lớp học phần cho {n}/{total} giáo viên.')


def write_all(api, plan, cfg, data_dir, workers):
    con = api.db()
    today_s = time.strftime('%Y-%m-%d')
    accts = accounts_of(plan, cfg['staff'])
    salts = [secrets.token_hex(16) for _ in accts]
    pws = [f"{a['role']}123" for a in accts]                      # mật khẩu mặc định: vai trò + 123
    assert api.hash_pw(pws[0], salts[0]) == _pbkdf2((pws[0], salts[0])), 'thuật toán băm của máy chủ đã đổi, cập nhật _pbkdf2'
    t0 = time.time()
    print(f'Băm mật khẩu cho {len(accts)} tài khoản (PBKDF2 200.000 vòng, {workers} tiến trình)...', flush=True)
    with ProcessPoolExecutor(workers) as ex:
        hashes = list(ex.map(_pbkdf2, zip(pws, salts), chunksize=64))
    print(f'  xong sau {time.time() - t0:.0f}s', flush=True)

    rows_acc, rows_docs = [], []
    csv_rows = []
    uid_of = {}
    for a, salt, h, pw in zip(accts, salts, hashes, pws):
        uid = api.new_uid()
        uid_of[a['username']] = uid
        rows_acc.append((uid, a['username'], salt, h, today_s))
        ud, up = user_docs(a, uid, today_s)
        rows_docs += [('user', uid, json.dumps(ud, ensure_ascii=False)), ('userData', uid, json.dumps(up, ensure_ascii=False))]
        csv_rows.append((a['username'], pw, a['role'], uid, a['class']['id'] if a['role'] == 'student' else '',
                         a['class']['cohort'] if a['role'] == 'student' else ''))

    class_docs = []
    for cl in plan['classes']:
        class_docs.append(('classes', cl['id'], json.dumps({
            'id': cl['id'], 'name': cl['id'], 'cohort': cl['cohort'], 'namHoc': cl['namHoc'], 'hocKy': cl['hocKy'],
            'namThu': cl['namThu'], 'size': cl['size'],
            'studentUids': [uid_of[s['username']] for s in cl['students']],
            'sections': [{k: v for k, v in sec.items() if k not in ('_teacher', '_term')} | {'teacherUid': uid_of[sec['teacherUsername']]}
                         for sec in cl['sections']],
            'seed': TAG}, ensure_ascii=False)))

    files = []
    if cfg['files']:
        os.makedirs(api.UPLOAD_DIR, exist_ok=True)
        frng = random.Random(cfg['seed'] + 1)
        t0 = time.time()
        total = 0
        for fl in plan['files']:             # mỗi tệp một lần: giáo trình, slide dùng lại giữa các năm nên nhiều học phần trỏ về cùng một tệp
            with open(os.path.join(api.UPLOAD_DIR, fl['stored']), 'wb') as f:
                f.write(make_pdf(fl['stored'].split('_', 1)[1].rsplit('.', 1)[0].replace('_', ' '), fl['size'], frng))
            os.chmod(os.path.join(api.UPLOAD_DIR, fl['stored']), 0o644)
            files.append(fl['stored'])
            total += fl['size']
        print(f'Đã ghi {len(files)} tệp tài liệu ({total / 1e6:.1f} MB) sau {time.time() - t0:.0f}s', flush=True)
    materials = [{k: v for k, v in m.items() if k != 'stored'} for m in plan['materials']]

    con.execute('BEGIN')
    con.executemany('INSERT INTO accounts VALUES (?,?,?,?,?)', rows_acc)
    con.executemany('INSERT OR REPLACE INTO docs VALUES (?,?,?)', rows_docs + class_docs)
    shared = api.doc_get('sharedData', 'global') or {}
    for key, items in (('subjects', plan['subjects']), ('schedule', plan['schedule']), ('exams', plan['exams']),
                       ('materials', materials), ('quizzes', plan['quizzes'])):
        shared[key] = [x for x in shared.get(key, []) if not (isinstance(x, dict) and x.get('seed') == TAG)] + items
    shared_json = json.dumps(shared, ensure_ascii=False)
    con.execute("INSERT OR REPLACE INTO docs VALUES ('sharedData','global',?)", (shared_json,))
    con.executemany("INSERT OR REPLACE INTO docs VALUES ('quizKeys',?,?)", [(qid, json.dumps(k, ensure_ascii=False)) for qid, k in plan['quiz_keys']])
    con.execute("INSERT OR REPLACE INTO docs VALUES ('curriculum','khung-cntt-mau',?)", (json.dumps(plan['curriculum'], ensure_ascii=False),))
    con.execute("INSERT OR REPLACE INTO docs VALUES ('meta',?,?)", (META_ID, json.dumps({
        'at': time.time(), 'params': {k: (list(v) if isinstance(v, tuple) else v) for k, v in cfg.items()},
        'quizIds': [qid for qid, _ in plan['quiz_keys']], 'files': files}, ensure_ascii=False)))
    con.execute('COMMIT')
    with open(os.path.join(data_dir, 'seed-accounts.csv'), 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(['username', 'password', 'role', 'uid', 'class', 'cohort'])
        w.writerows(csv_rows)
    con.execute('PRAGMA wal_checkpoint(TRUNCATE)')
    return len(shared_json.encode()), len(files)


def summarize(plan, cfg, shared_bytes=None):
    st, tc = plan['students'], plan['teachers']
    cur = (cfg['nam_hoc'], cfg['hoc_ky'])
    print('\n=== KẾ HOẠCH / KẾT QUẢ ===')
    print(f"Khung: {len(plan['courses'])} môn, {len({c['sem'] for c in plan['courses']})} học kỳ, {plan['curriculum']['totalCredits']} tín chỉ")
    print(f"Thời điểm: học kỳ {cfg['hoc_ky']}, năm học {cfg['nam_hoc']}-{cfg['nam_hoc'] + 1} | {len({(x['namHoc'], x['ky']) for x in plan['schedule']})}/{len(plan['terms'])} học kỳ có thời khóa biểu (học kỳ toàn môn hướng dẫn không có)")
    print(f"Lớp: {len(plan['classes'])} (mỗi lớp {cfg['min_students']}–{cfg['max_students']} SV, thực tế "
          f"{min(c['size'] for c in plan['classes'])}–{max(c['size'] for c in plan['classes'])})")
    for co in plan['cohorts']:
        n = sum(c['size'] for c in co['classes'])
        print(f"  Khóa {co['khoa']} (năm thứ {(co['pos'] + 1) // 2}): {len(co['classes'])} lớp, {n} sinh viên, đang học HK{co['pos']} của khung")
    offs = plan['offerings']
    by = {s: sum(1 for o in offs if o['status'] == s) for s in ('da-ket-thuc', 'dang-hoc', 'ke-hoach')}
    per_o = [len(o['teacherNames']) for o in offs]
    print(f"Học phần mở: {len(offs)} (đã kết thúc {by['da-ket-thuc']}, đang học {by['dang-hoc']}, kế hoạch {by['ke-hoach']}); "
          f"mỗi học phần {min(per_o)}–{max(per_o)} giáo viên (tối đa {cfg['max_teachers']})")
    print(f"Sinh viên: {len(st)} | giáo viên: {len(tc)}" + (' | + 3 tài khoản phòng ban' if cfg['staff'] else ''))
    by_g = {}
    for t in tc:
        by_g.setdefault(t['group'], []).append(max([v for (u, _), v in plan['load'].items() if u == t['username']] or [0]))
    for g, loads in by_g.items():
        print(f"  {BO_MON[g]}: {len(loads)} GV, tải tối đa mỗi học kỳ {min(loads)}–{max(loads)} tiết/tuần")
    now = [x for x in plan['schedule'] if (int(x['namHoc'][:4]), x['ky']) == cur]
    print(f"Thời khóa biểu: {len(plan['schedule'])} buổi/tuần trên toàn bộ 8 học kỳ của 4 khóa; học kỳ hiện tại chỉ {len(now)} buổi/tuần; "
          f"{len(plan['exams'])} lịch thi (cả 8 học kỳ); {plan['rooms']} phòng")
    mb = sum(f['size'] for f in plan['files']) / 1e6
    print(f"Tài liệu: {len(plan['materials'])} mục" + (f" dùng chung {len(plan['files'])} tệp PDF, khoảng {mb:.0f} MB" if cfg['files'] else ' (không tạo tệp)'))
    print(f"Trắc nghiệm: {len(plan['quizzes'])} đề × {cfg['questions']} câu (học phần đã kết thúc và đang học)")
    if shared_bytes:
        print(f"sharedData/global: {shared_bytes / 1e6:.2f} MB" + ('  ⚠ gần giới hạn ghi 5 MB của máy chủ' if shared_bytes > SHARED_WARN_BYTES else ''))


def parse_args(argv):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--data-dir', help='thư mục dữ liệu của máy chủ (STUDYTASK_DATA), chứa studytask.db và uploads/')
    p.add_argument('--khung', default=DEFAULT_KHUNG, help='khung đào tạo: .json hoặc .docx (mặc định scripts/data/khung-dao-tao.json)')
    p.add_argument('--export-khung', metavar='JSON', help='đọc --khung rồi ghi ra JSON và thoát')
    p.add_argument('--preset', choices=PRESETS, default='medium')
    p.add_argument('--classes', type=int, help='số lớp MỖI KHÓA (4 khóa đang học); mỗi học phần mở có tối đa --max-teachers giáo viên nên nhiều lớp thì mỗi giáo viên dạy nhiều lớp')
    p.add_argument('--min-students', type=int, default=20)
    p.add_argument('--max-students', type=int, default=30)
    p.add_argument('--slides', type=int, help='số slide mỗi môn')
    p.add_argument('--quizzes', type=int, help='số đề trắc nghiệm mỗi môn')
    p.add_argument('--questions', type=int, help='số câu mỗi đề')
    p.add_argument('--file-kb', help='cỡ tệp tài liệu, dạng MIN,MAX (KB)')
    p.add_argument('--no-files', action='store_true', help='không tạo tệp PDF (tài liệu chỉ là bản ghi)')
    p.add_argument('--max-teachers', type=int, default=3, help='số giáo viên tối đa cho một học phần mở (mặc định 3; mỗi học phần có từ 1 đến số này)')
    p.add_argument('--classes-per-teacher', type=int, default=4, help='mỗi giáo viên của một học phần nhận khoảng bao nhiêu lớp (mặc định 4 → 10 lớp cần 3 giáo viên)')
    p.add_argument('--max-load', type=int, default=8, help='số lớp học phần tối đa mỗi giáo viên trong MỘT học kỳ; trần thật tính theo tiết: --max-load × 3 tiết/tuần (mặc định 8 → 24 tiết)')
    p.add_argument('--nam-hoc', type=int, help='năm bắt đầu của năm học hiện tại (2026 = năm học 2026-2027); mặc định theo ngày hôm nay')
    p.add_argument('--hoc-ky', type=int, choices=(1, 2), help='học kỳ hiện tại của năm (1 hoặc 2); mặc định theo ngày hôm nay')
    p.add_argument('--staff', action='store_true', help='tạo thêm admin01/daotao01/taichinh01 (mật khẩu admin123/training123/finance123)')
    p.add_argument('--seed', type=int, default=20261112, help='hạt giống ngẫu nhiên (cùng hạt giống → cùng danh sách, cùng lớp)')
    p.add_argument('--workers', type=int, default=min(os.cpu_count() or 2, 16), help='số tiến trình băm mật khẩu')
    p.add_argument('--dry-run', action='store_true', help='chỉ in kế hoạch, không ghi gì')
    p.add_argument('--purge', action='store_true', help='chỉ xóa dữ liệu do script này tạo (theo nhãn) rồi thoát')
    p.add_argument('--upgrade-assignments', action='store_true',
                   help='nâng cấp dữ liệu đã nạp: ghi phân công lớp học phần (sections) vào hồ sơ giáo viên, không đổi tài khoản hay mật khẩu')
    p.add_argument('--replace', action='store_true', help='xóa dữ liệu cũ của script rồi nạp lại')
    p.add_argument('--force-merge', action='store_true', help='cho phép nạp vào CSDL đã có tài khoản thật (không khuyến nghị)')
    p.add_argument('--vacuum', action='store_true', help='sau --purge/--replace: VACUUM để trả lại dung lượng')
    return p.parse_args(argv)


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
    a = parse_args(argv)
    if a.export_khung:
        courses = load_khung(a.khung)
        os.makedirs(os.path.dirname(os.path.abspath(a.export_khung)), exist_ok=True)
        with open(a.export_khung, 'w', encoding='utf-8') as f:
            json.dump({'nguon': os.path.basename(a.khung), 'courses': courses}, f, ensure_ascii=False, indent=1)
        print(f'Đã ghi {len(courses)} học phần vào {a.export_khung}')
        return 0
    if not a.dry_run and not a.data_dir:
        sys.exit('Thiếu --data-dir (hoặc dùng --dry-run). Không tự ghi vào /var/lib/studytask để tránh nạp nhầm vào dữ liệu thật.')
    if not 1 <= a.min_students <= a.max_students <= 999:
        sys.exit('--min-students/--max-students không hợp lệ (1 ≤ min ≤ max ≤ 999).')
    pre = PRESETS[a.preset]
    file_kb = tuple(int(x) for x in a.file_kb.split(',')) if a.file_kb else pre['file_kb']
    nh0, hk0 = term_of(date.today())
    cfg = dict(preset=a.preset, classes=a.classes or pre['classes'], min_students=a.min_students, max_students=a.max_students,
               slides=a.slides if a.slides is not None else pre['slides'], quizzes=a.quizzes or pre['quizzes'],
               questions=a.questions or pre['questions'], file_kb=file_kb, files=not a.no_files, max_load=a.max_load,
               max_teachers=a.max_teachers, classes_per_teacher=a.classes_per_teacher,
               nam_hoc=a.nam_hoc or nh0, hoc_ky=a.hoc_ky or hk0, staff=a.staff, seed=a.seed)
    if not 1 <= cfg['classes'] <= 99:
        sys.exit('--classes phải từ 1 đến 99.')

    data_dir = os.path.abspath(a.data_dir) if a.data_dir else None
    if data_dir:
        os.environ['STUDYTASK_DATA'] = data_dir          # phải đặt trước khi nạp studytask_api
    sys.path.insert(0, SERVER_DIR)
    import studytask_api as api

    if a.upgrade_assignments:
        if not data_dir:
            sys.exit('--upgrade-assignments cần --data-dir.')
        upgrade_assignments(api)
        return 0
    if a.purge or a.replace:
        if not data_dir:
            sys.exit('--purge/--replace cần --data-dir.')
        purge(api, data_dir, a.vacuum)
        if a.purge:
            return 0
    courses = load_khung(a.khung)
    rng = random.Random(a.seed)
    plan = build_plan(cfg, courses, rng, date.today())
    if a.dry_run:
        est = {k: plan[k] for k in ('subjects', 'schedule', 'exams', 'quizzes')}
        est['materials'] = [{k: v for k, v in m.items() if k != 'stored'} for m in plan['materials']]
        summarize(plan, cfg, len(json.dumps(est, ensure_ascii=False).encode()))
        print('\n(--dry-run: chưa ghi gì)')
        return 0

    con = api.db()
    if api.doc_get('meta', META_ID):
        sys.exit('CSDL này đã có dữ liệu do script tạo. Dùng --replace để nạp lại hoặc --purge để xóa.')
    seeded = sum(1 for _, d in con.execute("SELECT id, data FROM docs WHERE col='user'") if json.loads(d).get('seed') == TAG)
    others = con.execute('SELECT COUNT(*) FROM accounts').fetchone()[0] - seeded
    if others and not a.force_merge:
        sys.exit(f'CSDL đã có {others} tài khoản không phải do script tạo. Mật khẩu mặc định đoán được, nên script từ chối nạp lẫn vào '
                 'dữ liệu thật. Dùng một --data-dir mới (khuyến nghị), hoặc --force-merge nếu chắc chắn.')
    t0 = time.time()
    shared_bytes, nfiles = write_all(api, plan, cfg, data_dir, a.workers)
    summarize(plan, cfg, shared_bytes)
    db_mb = os.path.getsize(os.path.join(data_dir, 'studytask.db')) / 1e6
    print(f'\nXong sau {time.time() - t0:.0f}s. studytask.db = {db_mb:.1f} MB; danh sách tài khoản: {os.path.join(data_dir, "seed-accounts.csv")}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
