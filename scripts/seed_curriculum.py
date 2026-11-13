#!/usr/bin/env python3
"""Sinh dữ liệu kiểm tải StudyTask từ khung đào tạo (Khung đào tạo mẫu.docx).

Tạo vào CSDL SQLite của máy chủ (đúng lược đồ hiện có: bảng `accounts` và `docs`), không sửa mã máy chủ:
  - môn học (mỗi dòng của khung) + chương trình đào tạo (curriculum/…)
  - 4 khóa đang học (ví dụ 2023-2027 … 2026-2030); mỗi khóa chia thành các lớp 20–30 sinh viên (ngẫu nhiên). Sinh viên được
    lưu theo KHÓA, năm học và học kỳ 1/2 của năm (năm thứ tính từ khóa), không lưu "kỳ số mấy"; môn của họ là các môn của
    học kỳ đang diễn ra theo khung (khóa năm 1 học HK1, năm 2 học HK3, …)
  - giáo viên theo bộ môn: một giáo viên dạy được mọi môn cùng bộ môn (chung cấu trúc), ở nhiều học kỳ
  - thời khóa biểu theo lớp, lịch thi, tài liệu (kèm tệp PDF thật trong uploads/), đề trắc nghiệm kèm khóa đáp án
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


PRESETS = {   # classes: số lớp mỗi học kỳ của khung (tổng số lớp = classes × số học kỳ); slides: số slide mỗi môn; quizzes/questions; file_kb: cỡ tệp tài liệu (KB)
    'small':  dict(classes=2,  slides=2, quizzes=2, questions=5,  file_kb=(10, 30)),
    'medium': dict(classes=10, slides=4, quizzes=3, questions=15, file_kb=(100, 600)),
    'large':  dict(classes=40, slides=6, quizzes=4, questions=20, file_kb=(500, 3000)),
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
SHIFTS = [('07:00', '09:30'), ('09:45', '12:15'), ('13:00', '15:30'), ('15:45', '18:15')]
DAYS = [2, 3, 4, 5, 6, 7]                       # Thứ Hai … Thứ Bảy (cùng quy ước DAY_LABELS của giao diện)
ALL_SLOTS = [(d, s) for d in DAYS for s in range(len(SHIFTS))]


def room_name(i):
    return f"{'ABCDEFGHJK'[(i // 20) % 10]}{(i % 20) // 5 + 1}.{(i % 20) // 5 + 1}{i % 5 + 1:02d}" + (f'-{i // 200}' if i >= 200 else '')


def sessions_per_week(c):
    return 2 if 3 <= c['credits'] <= 4 else 1


def build_plan(cfg, courses, rng, today):
    import studytask_api as api          # dùng đúng hàm kiểm tra đề của máy chủ để đề sinh ra luôn hợp lệ
    colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796', '#6610f2', '#fd7e14']
    courses = [dict(c) for c in courses]
    for i, c in enumerate(courses):
        c['id'], c['group'], c['teacherNames'] = SUBJECT_BASE + i, group_of(c['code']), set()
    by_sem = {}
    for c in courses:
        by_sem.setdefault(c['sem'], []).append(c)
    sems = sorted(by_sem)
    iso = lambda d: d.isoformat()

    # lớp + sinh viên: mỗi KHÓA một nhóm lớp. Cùng một thời điểm (học kỳ hk của năm học nh) khóa năm thứ k học học kỳ thứ
    # 2(k-1)+hk của khung, nên chỉ các học kỳ cùng tính chẵn/lẻ với hk có sinh viên (HK1 → HK1, HK3, HK5, HK7).
    nam_hoc, hoc_ky, years = cfg['nam_hoc'], cfg['hoc_ky'], max(sems) // 2
    active = [s for s in sems if s % 2 == (1 if hoc_ky == 1 else 0)]
    per_cohort = cfg['classes'] * len(sems) // len(active)           # giữ nguyên tổng số lớp so với khi chia theo từng học kỳ
    classes, students = [], []
    for s in active:
        nam_thu = (s + 1) // 2
        intake = nam_hoc - (nam_thu - 1)                              # năm nhập học của khóa này
        cohort, yy = f'{intake}-{intake + years}', intake % 100       # khóa "2023-2027"
        for n in range(1, per_cohort + 1):
            size = rng.randint(cfg['min_students'], cfg['max_students'])
            cl = {'id': f'CNTT{yy:02d}-{n:02d}', 'sem': s, 'cohort': cohort, 'namThu': nam_thu, 'namHoc': f'{nam_hoc}-{nam_hoc + 1}',
                  'hocKy': hoc_ky, 'size': size, 'students': [], 'busy': set(), 'sections': []}
            for j in range(1, size + 1):
                sid = f'{yy:02d}{n:02d}{j:03d}'
                st = {'username': f'sv{sid}', 'studentId': sid, 'name': person_name(rng), 'role': 'student', 'class': cl,
                      'subjectIds': [c['id'] for c in by_sem[s]]}
                cl['students'].append(st)
                students.append(st)
            classes.append(cl)

    # giáo viên theo bộ môn
    sections = [(cl, c) for cl in classes for c in by_sem[cl['sem']]]
    per_group = {}
    for _, c in sections:
        per_group[c['group']] = per_group.get(c['group'], 0) + 1
    teachers, pool = [], {}

    def new_teacher(g):
        lst = pool.setdefault(g, [])
        idx = len(lst) + 1
        t = {'username': f'gv{g}{idx:02d}', 'teacherId': f'GV{g.upper()}{idx:03d}', 'role': 'teacher', 'group': g, 'load': 0, 'busy': set(),
             'name': f'{rng.choice(TITLES)} {person_name(rng)}', 'sections': [],
             'canTeachSubjectIds': [c['id'] for c in courses if c['group'] == g]}
        lst.append(t)
        teachers.append(t)
        return t
    for g in BO_MON:    # đủ mọi bộ môn; bộ môn không có lớp học phần ở học kỳ này (vd. Ngoại ngữ ở học kỳ 2) vẫn có giáo viên, chưa được phân công
        for _ in range(max(2, math.ceil(per_group.get(g, 0) / cfg['max_load']))):
            new_teacher(g)

    # thời khóa biểu: lớp, giáo viên và phòng đều không trùng giờ
    rooms, labs = [room_name(i) for i in range(30)], [f'PM{i + 1:02d}' for i in range(6)]
    room_busy, schedule = set(), []

    def pick_slots(busy_a, busy_b, n):
        cand, days, picked = ALL_SLOTS[:], set(), []
        rng.shuffle(cand)
        for d, sh in cand:
            if d in days or (d, sh) in busy_a or (d, sh) in busy_b:
                continue
            picked.append((d, sh))
            days.add(d)
            if len(picked) == n:
                return picked
        return None

    def take_room(slot, lab):
        lst, prefix = (labs, 'PM') if lab else (rooms, '')
        start = rng.randrange(len(lst))
        for i in range(len(lst)):
            r = lst[(start + i) % len(lst)]
            if (slot, r) not in room_busy:
                room_busy.add((slot, r))
                return r
        r = f'PM{len(lst) + 1:02d}' if lab else room_name(len(lst))
        lst.append(r)
        room_busy.add((slot, r))
        return r

    rng.shuffle(sections)
    for cl, c in sections:
        n = sessions_per_week(c)
        chosen = None
        cands = sorted((t for t in pool[c['group']] if t['load'] < cfg['max_load']), key=lambda t: (t['load'], rng.random()))
        for t in cands:
            slots = pick_slots(cl['busy'], t['busy'], n)
            if slots:
                chosen = (t, slots)
                break
        if not chosen:
            t = new_teacher(c['group'])
            chosen = (t, pick_slots(cl['busy'], t['busy'], n))
        t, slots = chosen
        t['load'] += 1
        t['sections'].append({'classId': cl['id'], 'subjectId': c['id']})
        c['teacherNames'].add(t['name'])
        ids = []
        for slot in slots:
            cl['busy'].add(slot)
            t['busy'].add(slot)
            fmt = rng.choices(['offline', 'online', 'hybrid'], [80, 12, 8])[0]
            schedule.append({'id': SCHEDULE_BASE + len(schedule) + 1, 'subjectId': c['id'], 'day': slot[0],
                             'start': SHIFTS[slot[1]][0], 'end': SHIFTS[slot[1]][1],
                             'room': 'Online' if fmt == 'online' else take_room(slot, c['code'] in LAB_COURSES),
                             'teacher': t['name'], 'format': fmt, 'classId': cl['id'], 'className': cl['id'], 'seed': TAG})
            ids.append(schedule[-1]['id'])
        cl['sections'].append({'subjectId': c['id'], 'code': c['code'], 'teacherUsername': t['username'], 'teacherName': t['name'],
                               'scheduleIds': ids, '_teacher': t})

    # subjectIds của giáo viên = các môn ĐƯỢC PHÂN CÔNG (có lớp học phần); môn thuộc bộ môn nhưng chưa được giao nằm ở canTeachSubjectIds
    for t in teachers:
        t['subjectIds'] = sorted({sec['subjectId'] for sec in t['sections']})

    # lịch thi: mỗi lớp thi các môn của kỳ cách nhau 2 ngày, không rơi vào Chủ nhật
    exams, exam_busy = [], set()
    exam_start = today + timedelta(days=cfg['exam_in_days'])
    for cl in classes:
        for i, sec in enumerate(cl['sections']):
            d = exam_start + timedelta(days=2 * i)
            d += timedelta(days=1) if d.weekday() == 6 else timedelta(0)
            sh = rng.randrange(len(SHIFTS))
            course = next(c for c in courses if c['id'] == sec['subjectId'])
            r = next((r for r in rooms + labs if ((d, sh), r) not in exam_busy), room_name(len(rooms) + len(exam_busy)))
            exam_busy.add(((d, sh), r))
            fmt = 'thucHanh' if course['code'] in LAB_COURSES else rng.choice(['tuLuan', 'tracNghiem', 'tuLuan'])
            h, m = int(SHIFTS[sh][0][:2]), int(SHIFTS[sh][0][3:])
            end = f'{(h * 60 + m + 90) // 60:02d}:{(h * 60 + m + 90) % 60:02d}'        # bài thi 90 phút
            exams.append({'id': EXAM_BASE + len(exams) + 1, 'subjectId': sec['subjectId'], 'date': iso(d), 'start': SHIFTS[sh][0],
                          'end': end, 'room': r, 'teacher': sec['teacherName'], 'format': fmt,
                          'classId': cl['id'], 'className': cl['id'], 'seed': TAG})

    # tài liệu
    materials, mat_specs = [], []
    for c in courses:
        kinds = [('giaoTrinh', f'Giáo trình {c["name"]}', 'Tài liệu chính của học phần')]
        kinds += [('slide', f'Slide {c["name"]} – Chương {k}', f'Bài giảng điện tử chương {k}') for k in range(1, cfg['slides'] + 1)]
        kinds += [('baiTap', f'Bài tập {c["name"]} – Phần {k}', 'Bài tập có đáp án') for k in (1, 2)]
        kinds += [('baiTap', f'Đề thi mẫu {c["name"]}', 'Đề thi các năm trước'), ('thamKhao', f'Tài liệu tham khảo {c["name"]}', 'Đọc thêm')]
        for typ, title, desc in kinds:
            names = sorted(c['teacherNames'])
            m = {'id': MATERIAL_BASE + len(materials) + 1, 'subjectId': c['id'], 'title': title, 'type': typ, 'description': desc,
                 'url': '', 'uploadedBy': rng.choice(names) if names else '', 'uploadedAt': iso(today - timedelta(days=rng.randint(5, 80))),
                 'seed': TAG}
            if cfg['files']:
                size = rng.randint(cfg['file_kb'][0], cfg['file_kb'][1]) * 1024
                m['fileName'] = f'{slug(title)}.pdf'
                m['size'] = size
                m['stored'] = f'{rng.getrandbits(64):016x}_{slug(title)}.pdf'
                m['url'] = '/uploads/' + m['stored']
            materials.append(m)

    # trắc nghiệm: mỗi môn n đề, đề 1 đã đóng, các đề sau đang mở với hạn xa dần
    quizzes, keys = [], []
    for c in courses:
        for qi in range(1, cfg['quizzes'] + 1):
            qs = []
            for k in range(1, cfg['questions'] + 1):
                topic, r = f'chủ đề {qi}.{k}', rng.random()
                head = f'[{c["code"]}] '
                if r < 0.9:
                    ans = [{'id': ch, 'text': f'Nhận định {ch.upper()} về {topic} của {c["name"]}'} for ch in 'abcd']
                if r < 0.7:
                    ans[rng.randrange(4)]['correct'] = True
                    qs.append({'id': k, 'type': 'single', 'text': head + f'Phát biểu nào sau đây đúng về {topic}?', 'answers': ans})
                elif r < 0.9:
                    for a in rng.sample(ans, 2):
                        a['correct'] = True
                    qs.append({'id': k, 'type': 'multiple', 'text': head + f'Chọn tất cả nhận định đúng về {topic}:', 'answers': ans})
                else:
                    qs.append({'id': k, 'type': 'fill', 'blanks': 1, 'text': head + f'Điền khuyết: khái niệm chính của {topic} là ____.',
                               'accepted': [[f'khái niệm {qi}.{k}', f'khai niem {qi}.{k}']]})
            due = today - timedelta(days=14) if qi == 1 else today + timedelta(days=10 * (qi - 1))
            q = {'id': QUIZ_BASE + len(quizzes) + 1, 'subjectId': c['id'], 'title': f'Trắc nghiệm {c["name"]} – Đề {qi}',
                 'description': 'Dữ liệu kiểm tải (nội dung câu hỏi được sinh tự động)', 'dueDate': iso(due),
                 'status': 'closed' if qi == 1 else 'active', 'createdAt': f'{iso(today - timedelta(days=30))}T00:00:00.000Z',
                 'questions': qs}
            for qq in qs:
                if qq['type'] == 'fill':
                    qq.setdefault('answers', [])
            assert api.quiz_shape_ok(q) and api.quiz_key_complete(q), f'đề sinh ra không hợp lệ: {q["title"]}'
            keys.append((str(q['id']), api.quiz_key_of(q)))
            pub = api.quiz_strip(q)
            pub['seed'] = TAG
            quizzes.append(pub)

    subjects = [{'id': c['id'], 'code': c['code'], 'name': c['name'], 'credits': c['credits'], 'color': colors[i % len(colors)],
                 'teachers': sorted(c['teacherNames']), 'khoiKienThuc': c['block'], 'hocKy': c['sem'], 'boMon': BO_MON[c['group']],
                 'seed': TAG} for i, c in enumerate(courses)]

    blocks = []
    for c in courses:
        if c['block'] not in [b['name'] for b in blocks]:
            blocks.append({'name': c['block'], 'courses': []})
        next(b for b in blocks if b['name'] == c['block'])['courses'].append({'code': c['code'], 'name': c['name'], 'credits': c['credits']})
    oldest = cfg['nam_hoc'] - (years - 1)                           # khóa nhập học sớm nhất còn đang học
    curriculum = {'name': f'Khung đào tạo Công nghệ thông tin (áp dụng từ khóa {oldest})', 'major': 'Công nghệ thông tin', 'cohort': str(oldest),
                  'totalCredits': sum(c['credits'] for c in courses), 'seed': TAG,
                  'modules': [{'id': i + 1, 'name': b['name'], 'kind': 'elective' if 'chọn' in b['name'].lower() else 'required',
                               'minCredits': sum(x['credits'] for x in b['courses']), 'courses': b['courses']}
                              for i, b in enumerate(blocks)]}
    return dict(courses=courses, classes=classes, students=students, teachers=teachers, schedule=schedule, exams=exams,
                materials=materials, quizzes=quizzes, quiz_keys=keys, subjects=subjects, curriculum=curriculum,
                rooms=len(rooms) + len(labs))


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
        d.update(teacherId=a['teacherId'], boMon=BO_MON[a['group']], sections=a['sections'], canTeachSubjectIds=a['canTeachSubjectIds'])
        prof.update(teacherId=a['teacherId'], faculty='Công nghệ thông tin', department=BO_MON[a['group']], position='Giảng viên')
    else:
        prof.update(department=a['name'])
    return d, {'profile': prof, 'seed': TAG}


def purge(api, data_dir, vacuum=False):
    con = api.db()
    uids = [uid for uid, data in con.execute("SELECT id, data FROM docs WHERE col='user'") if json.loads(data).get('seed') == TAG]
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
        new = dict(d, sections=secs, subjectIds=sorted({s['subjectId'] for s in secs}),
                   canTeachSubjectIds=d.get('canTeachSubjectIds') or d.get('subjectIds') or [])
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
            'sections': [{k: v for k, v in sec.items() if k != '_teacher'} | {'teacherUid': uid_of[sec['teacherUsername']]}
                         for sec in cl['sections']],
            'seed': TAG}, ensure_ascii=False)))

    files = []
    if cfg['files']:
        os.makedirs(api.UPLOAD_DIR, exist_ok=True)
        frng = random.Random(cfg['seed'] + 1)
        t0 = time.time()
        total = 0
        for m in plan['materials']:
            with open(os.path.join(api.UPLOAD_DIR, m['stored']), 'wb') as f:
                f.write(make_pdf(m['title'], m['size'], frng))
            os.chmod(os.path.join(api.UPLOAD_DIR, m['stored']), 0o644)
            files.append(m['stored'])
            total += m['size']
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
    print('\n=== KẾ HOẠCH / KẾT QUẢ ===')
    print(f"Môn học: {len(plan['courses'])} | học kỳ trong khung: {len({c['sem'] for c in plan['courses']})} | tổng tín chỉ: {plan['curriculum']['totalCredits']}")
    print(f"Thời điểm: học kỳ {cfg['hoc_ky']}, năm học {cfg['nam_hoc']}-{cfg['nam_hoc'] + 1}")
    print(f"Lớp: {len(plan['classes'])} (mỗi lớp {cfg['min_students']}–{cfg['max_students']} SV, thực tế "
          f"{min(c['size'] for c in plan['classes'])}–{max(c['size'] for c in plan['classes'])})")
    for s in sorted({c['sem'] for c in plan['classes']}, reverse=True):
        cls = [c for c in plan['classes'] if c['sem'] == s]
        print(f"  Khóa {cls[0]['cohort']} (năm thứ {cls[0]['namThu']}): {len(cls)} lớp, {sum(c['size'] for c in cls)} sinh viên, "
              f"đang học {len([x for x in plan['courses'] if x['sem'] == s])} môn (HK{s} của khung)")
    print(f"Sinh viên: {len(st)} | giáo viên: {len(tc)}" + (' | + 3 tài khoản phòng ban' if cfg['staff'] else ''))
    by_g = {}
    for t in tc:
        by_g.setdefault(t['group'], []).append(t['load'])
    for g, loads in by_g.items():
        print(f"  {BO_MON[g]}: {len(loads)} GV, mỗi GV dạy {min(loads)}–{max(loads)} lớp học phần")
    print(f"Thời khóa biểu: {len(plan['schedule'])} buổi/tuần, {len(plan['exams'])} lịch thi, {plan['rooms']} phòng")
    mb = sum(m.get('size', 0) for m in plan['materials']) / 1e6
    print(f"Tài liệu: {len(plan['materials'])} mục" + (f", khoảng {mb:.0f} MB tệp PDF" if cfg['files'] else ' (không tạo tệp)'))
    print(f"Trắc nghiệm: {len(plan['quizzes'])} đề × {cfg['questions']} câu")
    if shared_bytes:
        print(f"sharedData/global: {shared_bytes / 1e6:.2f} MB" + ('  ⚠ gần giới hạn ghi 5 MB của máy chủ' if shared_bytes > SHARED_WARN_BYTES else ''))


def parse_args(argv):
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--data-dir', help='thư mục dữ liệu của máy chủ (STUDYTASK_DATA), chứa studytask.db và uploads/')
    p.add_argument('--khung', default=DEFAULT_KHUNG, help='khung đào tạo: .json hoặc .docx (mặc định scripts/data/khung-dao-tao.json)')
    p.add_argument('--export-khung', metavar='JSON', help='đọc --khung rồi ghi ra JSON và thoát')
    p.add_argument('--preset', choices=PRESETS, default='medium')
    p.add_argument('--classes', type=int, help='số lớp mỗi học kỳ của khung (tổng số lớp = số này × số học kỳ, chia đều cho các khóa đang học)')
    p.add_argument('--min-students', type=int, default=20)
    p.add_argument('--max-students', type=int, default=30)
    p.add_argument('--slides', type=int, help='số slide mỗi môn')
    p.add_argument('--quizzes', type=int, help='số đề trắc nghiệm mỗi môn')
    p.add_argument('--questions', type=int, help='số câu mỗi đề')
    p.add_argument('--file-kb', help='cỡ tệp tài liệu, dạng MIN,MAX (KB)')
    p.add_argument('--no-files', action='store_true', help='không tạo tệp PDF (tài liệu chỉ là bản ghi)')
    p.add_argument('--max-load', type=int, default=6, help='số lớp học phần tối đa mỗi giáo viên (mặc định 6)')
    p.add_argument('--nam-hoc', type=int, help='năm bắt đầu của năm học hiện tại (2026 = năm học 2026-2027); mặc định theo ngày hôm nay')
    p.add_argument('--hoc-ky', type=int, choices=(1, 2), help='học kỳ hiện tại của năm (1 hoặc 2); mặc định theo ngày hôm nay')
    p.add_argument('--exam-in-days', type=int, default=40, help='kỳ thi bắt đầu sau bao nhiêu ngày kể từ hôm nay')
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
               nam_hoc=a.nam_hoc or nh0, hoc_ky=a.hoc_ky or hk0, exam_in_days=a.exam_in_days, staff=a.staff, seed=a.seed)
    if not 1 <= cfg['classes'] <= 99:
        sys.exit('--classes phải từ 1 đến 99.')
    if cfg['classes'] * 2 > 99:
        sys.exit('--classes quá lớn: mỗi khóa sẽ có hơn 99 lớp (mỗi khóa có số lớp = classes × 2).')

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
