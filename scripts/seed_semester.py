#!/usr/bin/env python3
"""Giả lập số liệu trọn HỌC KỲ ĐANG HỌC cho các sinh viên đang có (chạy sau scripts/seed_curriculum.py).

Ghi thẳng vào CSDL SQLite của máy chủ (bảng `docs`), không sửa mã máy chủ, không tạo hay đổi tài khoản:
  - bài tập (sharedData.homeworks) và deadline (sharedData.deadlines) cho từng học phần đang học, rải từ đầu học kỳ đến hết
    tháng 12: bài tập/bài thực hành hằng tuần, kiểm tra giữa kỳ, nộp bài lớn, thi cuối kỳ (theo lịch thi đã có);
  - quy chế điểm (gradingPolicies) theo loại môn: lý luận chính trị L3, toán L1, môn lập trình thực hành Q50, môn IT khác L2,
    đồ án là môn hướng dẫn (giáo viên hướng dẫn nhập thẳng điểm tổng kết);
  - CỘT ĐIỂM của mọi sinh viên ở mọi môn đang học (sharedData.grades): chuyên cần, bài tập, giữa kỳ, cuối kỳ; điểm trắc nghiệm
    là kết quả chính thức (quizResults) chấm đúng theo khóa đáp án; bài nộp (userData.homeworkSubs) và nhật ký nộp bài, xem tài
    liệu (activities) để Báo cáo lớp có số liệu;
  - học phí (tuition): đa số đã nộp đủ, một phần nộp thiếu, một số quá hạn có thông báo công nợ, vài trường hợp miễn giảm;
  - sinh viên sắp tốt nghiệp (khóa đang ở năm cuối): phiếu xét tốt nghiệp (graduationApps) có GPA, tín chỉ tích lũy, chứng chỉ,
    trạng thái duyệt; GPA tích lũy ghi vào hồ sơ (userData.profile.gpa) của mọi sinh viên chưa có GPA;
  - danh sách đề tài Đồ án chuyên ngành của khóa năm cuối: đề tài, giáo viên hướng dẫn, mốc nộp, ngày bảo vệ, điểm; xuất thêm
    một tệp CSV gắn vào tài liệu của học phần đồ án.

Mọi mục chỉ tính đến ngày --as-of (mặc định 31/12 của học kỳ 1): mục có hạn sau ngày đó để trống điểm, chưa nộp.
Không ghi đè dữ liệu thật: sinh viên đã có điểm, học phí, phiếu tốt nghiệp, kết quả trắc nghiệm thì giữ nguyên phần đó.
Mọi bản ghi do script tạo được ghi lại trong docs('meta', 'seed_semester_v1') nên --purge gỡ đúng phần đã thêm.

Ví dụ:
  python scripts/seed_semester.py --data-dir ./du-lieu-thu --dry-run      # chỉ in thống kê, không ghi
  python scripts/seed_semester.py --data-dir ./du-lieu-thu                # nạp
  python scripts/seed_semester.py --data-dir ./du-lieu-thu --replace      # gỡ bản cũ rồi nạp lại
  python scripts/seed_semester.py --data-dir ./du-lieu-thu --purge        # gỡ

Chỉ dùng thư viện chuẩn. Nên sao lưu studytask.db trước khi chạy trên máy chủ thật.
"""
import argparse, csv, hashlib, io, json, math, os, random, secrets, sys, time
from datetime import date, datetime, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
SERVER_DIR = os.path.join(HERE, '..', 'server')

TAG = 'semester-v1'
META_ID = 'seed_semester_v1'
CURRICULUM_META = 'seed_curriculum_v1'
HW_BASE, DL_BASE, MAT_BASE = 500000, 600000, 700000
SHARED_LIMIT = int(4.5 * 1024 * 1024)       # máy chủ nhận ghi JSON ≤ 5 MB; chừa chỗ cho giáo viên sửa thêm

LAB_CODES = set('IT102 IT103 IT201 IT202 IT204 IT304 IT305 IT306 IT307'.split())   # giống seed_curriculum.LAB_COURSES
PRESET_WEIGHTS = {
    'L1':  dict(cc=10, bt=15, gk=20, ck=55),
    'L2':  dict(cc=10, bt=30, gk=15, ck=45),
    'L3':  dict(cc=5,  bt=10, gk=25, ck=60),
    'Q50': dict(cc=10, bt=25, gk=15, ck=50),
}

# ── Đề tài đồ án (ghép ngẫu nhiên, không trùng) ────────────────────────────────────────────────
DA_ACTIONS = ['Xây dựng', 'Thiết kế và xây dựng', 'Phát triển', 'Xây dựng và triển khai']
DA_PRODUCTS = ['website', 'ứng dụng di động', 'hệ thống', 'ứng dụng web']
DA_DOMAINS = [
    'quản lý thư viện trường học', 'đặt lịch khám bệnh', 'quản lý ký túc xá', 'bán hàng trực tuyến cho cửa hàng thời trang',
    'quản lý quán cà phê', 'đặt vé xe khách liên tỉnh', 'quản lý phòng trọ', 'theo dõi chi tiêu cá nhân',
    'quản lý nhân sự và chấm công', 'học từ vựng tiếng Anh', 'quản lý điểm rèn luyện sinh viên', 'đặt sân thể thao',
    'quản lý kho hàng', 'tìm việc làm bán thời gian cho sinh viên', 'quản lý phòng khám thú y', 'gọi món tại nhà hàng',
    'quản lý câu lạc bộ sinh viên', 'ôn thi trắc nghiệm', 'quản lý tiệm sửa xe máy', 'chia sẻ tài liệu học tập',
    'quản lý lịch giảng dạy', 'mua bán sách cũ', 'quản lý trung tâm ngoại ngữ', 'tra cứu tuyến xe buýt',
    'quản lý sự kiện của khoa', 'theo dõi sức khỏe cá nhân', 'quản lý thiết bị phòng máy', 'đặt phòng homestay',
    'quản lý đoàn viên', 'đăng ký học phần trực tuyến', 'quản lý tiệm thuốc', 'quản lý giải bóng đá phong trào',
]
DA_TECHS = ['ReactJS và Node.js', 'Flutter và Firebase', 'Laravel và MySQL', 'Spring Boot và PostgreSQL', 'ASP.NET Core và SQL Server',
            'Django và PostgreSQL', 'Vue.js và Express', 'React Native và Supabase', 'Kotlin và Room', 'Next.js và MongoDB']
DA_SPECIAL = [   # đề tài nghiên cứu/ứng dụng (dùng một lần mỗi đề)
    'Nhận diện biển số xe máy bằng YOLOv8', 'Chatbot tư vấn tuyển sinh dùng mô hình ngôn ngữ và truy hồi tài liệu (RAG)',
    'Phân loại cảm xúc bình luận sản phẩm tiếng Việt bằng PhoBERT', 'Hệ thống gợi ý sản phẩm bằng lọc cộng tác',
    'Điểm danh sinh viên bằng nhận diện khuôn mặt', 'Phát hiện thư rác tiếng Việt bằng học máy',
    'Dự đoán kết quả học tập của sinh viên từ dữ liệu điểm quá trình', 'Giám sát mạng nội bộ và cảnh báo xâm nhập với Snort',
    'Xây dựng hệ thống CI/CD cho ứng dụng web bằng GitHub Actions và Docker', 'Triển khai cụm Kubernetes cho ứng dụng nhiều dịch vụ',
    'Nhận dạng chữ viết tay tiếng Việt bằng mạng nơ-ron tích chập', 'Tóm tắt văn bản tin tức tiếng Việt tự động',
    'Phân tích log máy chủ web bằng ELK Stack', 'Ứng dụng blockchain lưu vết văn bằng chứng chỉ',
    'Phát hiện gian lận giao dịch thẻ bằng học máy', 'Đếm và phân loại phương tiện giao thông từ camera',
]


# ── Tiện ích ───────────────────────────────────────────────────────────────────────────────────
def iso(d):
    return d.isoformat()


def pdate(s):
    return date.fromisoformat(s)


def clamp(x, lo=0.0, hi=10.0):
    return max(lo, min(hi, x))


def half(x):
    """Làm tròn đến 0,5 (điểm bài tập, chuyên cần)."""
    return round(clamp(x) * 2) / 2


def tenth(x):
    return round(clamp(x), 1)


def stable_rng(*parts):
    """Bộ sinh số ngẫu nhiên riêng theo (hạt giống, sinh viên, môn…) nên chạy lại ra đúng số liệu cũ."""
    h = hashlib.sha256('|'.join(map(str, parts)).encode()).hexdigest()
    return random.Random(int(h[:16], 16))


def ev_hash(uid, e):
    return hashlib.sha1((uid + json.dumps(e, sort_keys=True, ensure_ascii=False)).encode()).hexdigest()[:12]


def to_gpa4(avg10):
    """Đổi điểm trung bình thang 10 sang thang 4 (gần đúng theo quy chế tín chỉ)."""
    return clamp(0.62 * avg10 - 1.75, 0.0, 4.0)


# ── Kế hoạch ───────────────────────────────────────────────────────────────────────────────────
def build(api, seed, as_of):
    con = api.db()
    shared = api.doc_get('sharedData', 'global') or {}
    subjects = shared.get('subjects') or []
    cur = [s for s in subjects if isinstance(s, dict) and s.get('trangThai') == 'dang-hoc']
    if not cur:
        sys.exit('Không có học phần nào đang học (trangThai = dang-hoc). Chạy scripts/seed_curriculum.py trước.')
    cur_ids = {s['id'] for s in cur}
    by_id = {s['id']: s for s in subjects if isinstance(s, dict)}

    users = {uid: json.loads(d) for uid, d in con.execute("SELECT id, data FROM docs WHERE col='user'")}
    students = sorted((uid, u) for uid, u in users.items()
                      if u.get('role') == 'student' and u.get('cohort') and any(i in cur_ids for i in (u.get('subjectIds') or [])))
    teachers = [u for u in users.values() if u.get('role') == 'teacher']
    advisor_of = {}          # (classId, subjectId) → tên giáo viên
    for t in teachers:
        for sec in t.get('sections') or []:
            advisor_of[(sec.get('classId'), sec.get('subjectId'))] = t.get('name') or t.get('username')

    sched = [x for x in shared.get('schedule') or [] if isinstance(x, dict) and x.get('subjectId') in cur_ids]
    starts = [pdate(x['startDate']) for x in sched if x.get('startDate')]
    ends = [pdate(x['endDate']) for x in sched if x.get('endDate')]
    t_start = min(starts) if starts else date(as_of.year if as_of.month >= 8 else as_of.year - 1, 9, 7)
    t_end = max(ends) if ends else t_start + timedelta(weeks=15)
    exams = {}               # (classId, subjectId) → ngày thi cuối kỳ
    exam_quiz = set()
    for e in shared.get('exams') or []:
        if not isinstance(e, dict):
            continue
        if e.get('quizId') is not None:
            exam_quiz.add(str(e['quizId']))
        if e.get('subjectId') in cur_ids and e.get('date'):
            k = (e.get('classId'), e['subjectId'])
            exams[k] = min(exams.get(k, e['date']), e['date'])
    exam_by_subject = {}
    for (_, sid), d in exams.items():
        exam_by_subject[sid] = min(exam_by_subject.get(sid, d), d)

    fin = api.doc_get('financeConfig', 'current') or {}
    curricula = {cid: json.loads(d) for cid, d in con.execute("SELECT id, data FROM docs WHERE col='curriculum'")}
    prog = next((c for c in curricula.values() if c.get('seed') == 'curriculum-v1'), None) or next(iter(curricula.values()), {})
    required = int(prog.get('totalCredits') or 0)
    final_cohort = min((s.get('khoa') for s in cur if s.get('khoa')), key=lambda k: int(k[:4]), default=None)   # khóa vào sớm nhất = năm cuối

    rng = random.Random(seed)
    P = dict(shared=shared, cur=cur, cur_ids=cur_ids, by_id=by_id, students=students, users=users, advisor_of=advisor_of,
             t_start=t_start, t_end=t_end, exams=exams, exam_by_subject=exam_by_subject, exam_quiz=exam_quiz, fin=fin,
             required=required, final_cohort=final_cohort, as_of=as_of, seed=seed)

    # 1. Bài tập và deadline theo từng học phần đang học
    homeworks, deadlines, policies = [], [], {}
    hw_id, dl_id = HW_BASE, DL_BASE
    used_ids = {str(x.get('id')) for k in ('homeworks', 'deadlines') for x in shared.get(k) or [] if isinstance(x, dict)}
    while any(str(i) in used_ids for i in range(HW_BASE, HW_BASE + 2000)) or any(str(i) in used_ids for i in range(DL_BASE, DL_BASE + 2000)):
        hw_id += 10000; dl_id += 10000      # tránh trùng id đã có (không xảy ra với dữ liệu hiện tại)
    mid_week = t_start + timedelta(weeks=7)              # tuần 8: kiểm tra giữa kỳ
    for idx, s in enumerate(sorted(cur, key=lambda x: x['id'])):
        code, sid = s.get('code', ''), s['id']
        guided = s.get('kieuHoc') == 'huong-dan'
        lab = code in LAB_CODES
        items = []
        if guided:
            items = [('Đăng ký đề tài đồ án', 'submit', 2, 'Nộp tên đề tài, mục tiêu và kế hoạch thực hiện đã thống nhất với giáo viên hướng dẫn.'),
                     ('Báo cáo tiến độ lần 1', 'submit', 6, 'Nộp bản phân tích yêu cầu và thiết kế (đặc tả, sơ đồ use case, cơ sở dữ liệu).'),
                     ('Báo cáo tiến độ lần 2', 'submit', 11, 'Nộp bản demo chức năng chính và nhật ký làm việc.'),
                     ('Nộp báo cáo và sản phẩm đồ án', 'submit', 14, 'Nộp quyển báo cáo (PDF), mã nguồn và video demo trước khi bảo vệ.')]
        else:
            n = 6 if lab else 4
            weeks = [2 + round(i * 11 / (n - 1)) for i in range(n)]
            for i, w in enumerate(weeks):
                if w == 7:
                    w = 6
                if lab:
                    title = f'Bài thực hành số {i + 1}' if i < n - 1 else 'Bài tập lớn (sản phẩm nhóm)'
                    desc = ('Làm tại phòng máy, nộp mã nguồn nén .zip.' if i < n - 1
                            else 'Nộp mã nguồn, báo cáo ngắn và video demo của nhóm 2–3 sinh viên.')
                else:
                    title = f'Bài tập chương {i + 1}' if i < n - 1 else 'Tiểu luận cuối học phần'
                    desc = ('Làm các bài tập cuối chương trong giáo trình, nộp bản PDF.' if i < n - 1
                            else 'Viết tiểu luận 8–12 trang theo đề tài giáo viên giao, nộp bản PDF.')
                items.append((title, 'assign' if i < n - 1 else 'submit', w, desc))
        for title, typ, w, desc in items:
            due = t_start + timedelta(weeks=w - 1, days=4 + (idx % 3))
            homeworks.append({'id': hw_id, 'subjectId': sid, 'title': title, 'type': typ, 'dueDate': iso(due), 'status': 'pending',
                              'description': desc, 'fileUrl': '', 'fileName': '', 'score': None, 'seed': TAG})
            hw_id += 1
        dls = []
        if guided:
            defense = date(t_end.year, 12, 22) + timedelta(days=idx % 4)
            dls.append(('Bảo vệ Đồ án chuyên ngành trước hội đồng', defense, 'high',
                        'Mỗi sinh viên trình bày 10 phút, hội đồng hỏi 10 phút. Mang theo quyển báo cáo và bản demo.'))
            P.setdefault('defense', {})[sid] = defense
        else:
            dls.append(('Kiểm tra giữa kỳ', mid_week + timedelta(days=idx % 5), 'high', 'Kiểm tra tại lớp 45–60 phút, nội dung từ đầu học phần đến hết tuần 7.'))
            last = next(h for h in reversed(homeworks) if h['subjectId'] == sid)
            dls.append((f'Hoàn thành {last["title"].lower()}', pdate(last['dueDate']), 'medium', last['description']))
            ex = exam_by_subject.get(sid)
            if ex:
                dls.append(('Thi cuối kỳ', pdate(ex), 'high', 'Xem phòng thi, giờ thi của lớp mình ở trang Lịch thi.'))
        for title, due, prio, desc in dls:
            deadlines.append({'id': dl_id, 'title': title, 'subjectId': sid, 'dueDate': iso(due), 'priority': prio,
                              'status': 'completed' if due <= as_of else 'pending', 'description': desc, 'seed': TAG})
            dl_id += 1
        P.setdefault('midterm', {})[sid] = mid_week + timedelta(days=idx % 5)
        # Quy chế điểm của môn
        if guided:
            pol = {'preset': 'HD', 'guided': True, 'auto': False, 'weights': dict(cc=0, bt=0, gk=0, ck=100), 'dropLowest': 0, 'ckOnline': False,
                   'attendance': {'method': 'score', 'sessions': 0, 'a': 1, 'b': 0.25, 'c': 0.25, 'participation': 0}}
        else:
            preset = 'L3' if code.startswith('GEN') else 'L1' if code.startswith('MTH') else 'Q50' if lab else 'L2'
            att = ({'method': 'ratio', 'sessions': 15, 'a': 1, 'b': 0.25, 'c': 0.25, 'participation': 0} if lab
                   else {'method': 'score', 'sessions': 15, 'a': 1, 'b': 0.25, 'c': 0.25, 'participation': 40})
            pol = {'preset': preset, 'auto': True, 'weights': dict(PRESET_WEIGHTS[preset]), 'dropLowest': 'auto', 'ckOnline': False, 'attendance': att}
        pol.update({'practice': {'enabled': False, 'theoryCredits': s.get('credits') or 0, 'practiceCredits': 0},
                    'updatedBy': (s.get('teachers') or ['Phòng Đào tạo'])[0], 'updatedAt': f'{iso(t_start + timedelta(days=5))}T08:00:00Z', 'seed': TAG})
        policies[str(sid)] = pol
    P.update(homeworks=homeworks, deadlines=deadlines, policies=policies)

    # 2. Đề trắc nghiệm đã có của học phần đang học (do seed_curriculum tạo) → kết quả chính thức
    cm = api.doc_get('meta', CURRICULUM_META) or {}
    seeded_quiz = {str(q) for q in cm.get('quizIds', [])}
    quizzes = [q for q in shared.get('quizzes') or [] if isinstance(q, dict) and q.get('subjectId') in cur_ids
               and str(q.get('id')) in seeded_quiz and str(q.get('id')) not in exam_quiz and q.get('status') != 'draft'
               and q.get('dueDate') and pdate(q['dueDate']) <= as_of]
    keys = {}
    for q in quizzes:
        k = api.doc_get('quizKeys', str(q['id']))
        if k:
            keys[str(q['id'])] = k
    P['quizzes'] = [q for q in quizzes if str(q['id']) in keys]
    P['keys'] = keys
    P['materials'] = [m for m in shared.get('materials') or [] if isinstance(m, dict) and m.get('subjectId') in cur_ids]
    return P


def student_ability(seed, uid):
    r = stable_rng(seed, 'ability', uid)
    return clamp(r.gauss(7.4, 1.05), 3.5, 9.7)


def simulate(api, P):
    """Sinh điểm, bài nộp, kết quả trắc nghiệm, học phí, phiếu tốt nghiệp. Trả về các thay đổi (chưa ghi)."""
    seed, as_of = P['seed'], P['as_of']
    shared = P['shared']
    old_grades = shared.get('grades') if isinstance(shared.get('grades'), dict) else {}
    hw_by_sub, q_by_sub, mat_by_sub = {}, {}, {}
    for h in P['homeworks']:
        hw_by_sub.setdefault(h['subjectId'], []).append(h)
    for q in P['quizzes']:
        q_by_sub.setdefault(q['subjectId'], []).append(q)
    for m in P['materials']:
        mat_by_sub.setdefault(m['subjectId'], []).append(m)

    grades, results, subs, events, tuition, grad, gpa, finals = {}, {}, {}, {}, {}, {}, {}, {}
    topics = {}
    fin = P['fin']
    price, pprice = int(fin.get('pricePerCredit') or 0), int(fin.get('practicePricePerCredit') or 0) or int(fin.get('pricePerCredit') or 0)
    due = pdate(fin['dueDate']) if fin.get('dueDate') else None
    topic_pool = make_topics(seed, sum(1 for _, u in P['students'] if u.get('cohort') == P['final_cohort']))

    for uid, u in P['students']:
        ab = student_ability(seed, uid)
        cls = u.get('classId')
        mine = [P['by_id'][i] for i in (u.get('subjectIds') or []) if i in P['cur_ids'] and i in P['by_id']]
        has_old = uid in old_grades
        cells, fin_scores = {}, {}
        for s in mine:
            sid = s['id']
            r = stable_rng(seed, 'mon', uid, sid)
            a = clamp(ab + r.gauss(0, 0.6), 1.5, 10)
            diligence = clamp((a - 3) / 6, 0.35, 0.99)       # khả năng nộp bài đúng hạn
            pol = P['policies'][str(sid)]
            cell = {}
            hw_scores = []
            for h in hw_by_sub.get(sid, []):
                d = pdate(h['dueDate'])
                if d > as_of:
                    continue
                if r.random() < diligence:
                    sc = half(r.gauss(a + 0.3, 1.0))
                    at = d - timedelta(days=r.randint(0, 4))
                    note = ''
                    if s.get('kieuHoc') == 'huong-dan' and h['title'].startswith('Đăng ký đề tài'):
                        topics[uid] = topics.get(uid) or topic_pool.pop()
                        note = f'Đề tài: {topics[uid]}'
                    subs.setdefault(uid, {})[str(h['id'])] = {'status': 'completed', 'url': '', 'fileName': '', 'note': note, 'at': iso(at)}
                    events.setdefault(uid, []).append({'type': 'homework', 'at': iso(at), 'subjectId': sid, 'refId': h['id'],
                                                       'refTitle': h['title'], 'url': '', 'fileName': '', 'note': note})
                else:
                    sc = 0.0                                      # không nộp → giáo viên cho 0
                cell.setdefault('hw', {})[str(h['id'])] = sc
                hw_scores.append(sc)
            for q in q_by_sub.get(sid, []):
                if r.random() < min(0.97, diligence + 0.1):
                    res = quiz_result(api, q, P['keys'][str(q['id'])], uid, a, r)
                    results[f"{q['id']}_{uid}"] = res
                    hw_scores.append(res['score'])
            for m in mat_by_sub.get(sid, []):
                if r.random() < 0.55 + diligence * 0.4:
                    at = clamp_date(pdate(m.get('uploadedAt') or iso(P['t_start'])) + timedelta(days=r.randint(0, 40)), P['t_start'], as_of)
                    events.setdefault(uid, []).append({'type': 'material', 'at': iso(at), 'subjectId': sid, 'refId': m['id'], 'refTitle': m.get('title', '')})
            if s.get('kieuHoc') == 'huong-dan':
                dfd = P.get('defense', {}).get(sid)
                if dfd and dfd <= as_of and uid in topics:
                    cell['ck'] = tenth(r.gauss(a + 0.4, 0.8))
                fin_scores[sid] = cell.get('ck')
            else:
                if pol['attendance']['method'] == 'ratio':
                    absent = min(15, int(abs(r.gauss(0, 1.8 * (1.2 - diligence)))))
                    weeks_done = 15 if as_of >= P['t_end'] else max(0, min(15, (as_of - P['t_start']).days // 7 + 1))
                    if weeks_done:
                        cell['attData'] = {'present': max(0, weeks_done - absent)}
                    att = (cell['attData']['present'] / 15 * 10) if weeks_done else None
                else:
                    att = half(r.gauss(8.3 + (a - 7) * 0.4, 0.9))
                    cell['att'] = att
                    cell['attData'] = {'score': att}
                if P['midterm'][sid] <= as_of:
                    cell['gk'] = tenth(r.gauss(a - 0.2, 1.2))
                ex = P['exams'].get((cls, sid)) or P['exam_by_subject'].get(sid)
                if ex and pdate(ex) <= as_of and r.random() > 0.02:       # ~2% vắng thi cuối kỳ
                    cell['ck'] = tenth(r.gauss(a - 0.1, 1.2))
                w = pol['weights']
                bt = sum(hw_scores) / len(hw_scores) if hw_scores else None
                parts = {'cc': att, 'bt': bt, 'gk': cell.get('gk'), 'ck': cell.get('ck')}
                fin_scores[sid] = (None if any(parts[k] is None for k in parts if w[k] > 0)
                                   else round(sum(w[k] / 100 * parts[k] for k in parts if w[k] > 0), 1))
            cells[str(sid)] = cell
        if not has_old and cells:
            grades[uid] = cells
        finals[uid] = fin_scores

        # Học phí học kỳ
        total = 0
        for s in mine:
            cr = int(s.get('credits') or 0)
            pr = min(cr, int(s.get('practiceCredits') or 0))
            total += (cr - pr) * price + pr * pprice
        if price and total and due:
            tuition[uid] = tuition_doc(seed, uid, u, total, due, as_of, P['fin'].get('semester', ''))

        # GPA tích lũy (thang 4): theo năng lực và kết quả học kỳ này
        done = [v for v in fin_scores.values() if v is not None]
        avg10 = (ab * 2 + (sum(done) / len(done) if done else ab)) / 3
        gpa[uid] = f'{clamp(to_gpa4(avg10) + stable_rng(seed, "gpa", uid).gauss(0, 0.08), 1.2, 3.98):.2f}'

    # Phiếu xét tốt nghiệp + đề tài đồ án của khóa năm cuối
    advisors = {}
    for uid, u in P['students']:
        if u.get('cohort') != P['final_cohort']:
            continue
        guided = next((P['by_id'][i] for i in (u.get('subjectIds') or []) if P['by_id'].get(i, {}).get('kieuHoc') == 'huong-dan'), None)
        if guided:
            topics[uid] = topics.get(uid) or topic_pool.pop()
            advisors[uid] = P['advisor_of'].get((u.get('classId'), guided['id'])) or (guided.get('teachers') or [''])[0]
        app = grad_doc(api, P, uid, u, gpa[uid], finals.get(uid, {}), tuition.get(uid), topics.get(uid, ''))
        if app:
            grad[uid] = app
    return dict(grades=grades, results=results, subs=subs, events=events, tuition=tuition, grad=grad, gpa=gpa,
                topics=topics, advisors=advisors, finals=finals)


def clamp_date(d, lo, hi):
    return max(lo, min(hi, d))


def make_topics(seed, n):
    r = random.Random(seed * 7 + 1)
    pool = list(DA_SPECIAL)
    combos = [(a, p, d, t) for a in DA_ACTIONS for p in DA_PRODUCTS for d in DA_DOMAINS for t in DA_TECHS]
    r.shuffle(combos)
    seen_dom = {}
    for a, p, d, t in combos:
        if len(pool) >= n + 20:
            break
        if seen_dom.get(d, 0) >= max(2, n // len(DA_DOMAINS) + 1):
            continue           # mỗi lĩnh vực chỉ vài đề để danh sách đa dạng
        seen_dom[d] = seen_dom.get(d, 0) + 1
        pool.append(f'{a} {p} {d} sử dụng {t}')
    r.shuffle(pool)
    return pool


def quiz_result(api, quiz, key, uid, ability, r):
    """Câu trả lời giả lập: mỗi câu đúng với xác suất theo năng lực; chấm bằng đúng hàm của máy chủ."""
    ca = key.get('correctAnswers') or {}
    p_ok = clamp(0.18 + ability * 0.08, 0.15, 0.97)
    answers = {}
    for qq in quiz.get('questions') or []:
        qid = str(qq.get('id'))
        if qq.get('type') == 'fill':
            acc = ca.get(qid) or []
            answers[qid] = [(a[0] if r.random() < p_ok and a else 'không biết') for a in acc]
            continue
        opts = [str(a.get('id')) for a in qq.get('answers') or [] if isinstance(a, dict)]
        want = [str(x) for x in ca.get(qid, [])]
        if r.random() < p_ok and want:
            answers[qid] = want if qq.get('type') != 'single' else want[:1]
        else:
            wrong = [o for o in opts if [o] != want] or opts
            answers[qid] = [r.choice(wrong)] if wrong else []
    norm, correct, total, score = api.grade_quiz(quiz, key, answers)
    sub = pdate(quiz['dueDate']) - timedelta(days=r.randint(0, 6))
    return {'uid': uid, 'quizId': quiz['id'], 'subjectId': quiz.get('subjectId'), 'answers': norm, 'score': score,
            'correct': correct, 'total': total,
            'submittedAt': f'{iso(sub)}T{r.randint(1, 14):02d}:{r.randint(0, 59):02d}:{r.randint(0, 59):02d}Z'}


def tuition_doc(seed, uid, u, total, due, as_of, semester):
    r = stable_rng(seed, 'hocphi', uid)
    x = r.random()
    discount = 0
    note_disc = ''
    if r.random() < 0.06:
        pct = r.choice([25, 50, 50, 100])
        discount = total * pct // 100
        note_disc = {25: 'Miễn giảm 25% – sinh viên có hoàn cảnh khó khăn', 50: 'Miễn giảm 50% – con thương binh / hộ cận nghèo',
                     100: 'Miễn 100% – sinh viên thuộc hộ nghèo'}[pct]
    need = max(0, total - discount)
    win_start, win_end = date(due.year, 10, 15), min(due, as_of)
    span = max(1, (win_end - win_start).days)

    def pay(amount, d):
        method = 'Chuyển khoản' if r.random() < 0.82 else 'Tiền mặt'
        return {'amount': int(amount), 'date': iso(d), 'method': method, 'note': '' if method == 'Chuyển khoản' else 'Nộp tại Phòng Tài chính',
                'at': f'{iso(d)}T{r.randint(1, 9):02d}:{r.randint(0, 59):02d}:00.000Z'}

    payments, notices = [], []
    if need == 0:
        pass
    elif x < 0.74:                                           # nộp đủ (một hoặc hai lần)
        if r.random() < 0.25 and span > 20:
            d1 = win_start + timedelta(days=r.randint(0, span // 2))
            first = round(need * r.choice([0.4, 0.5, 0.6]) / 100000) * 100000
            payments = [pay(first, d1), pay(need - first, d1 + timedelta(days=r.randint(7, max(8, (win_end - d1).days))))]
            payments[-1]['date'] = iso(min(pdate(payments[-1]['date']), win_end))
        else:
            payments = [pay(need, win_start + timedelta(days=r.randint(0, span)))]
    elif x < 0.88:                                           # nộp một phần
        part = round(need * r.choice([0.3, 0.5, 0.6, 0.7]) / 100000) * 100000
        payments = [pay(part, win_start + timedelta(days=r.randint(0, span)))]
    # còn lại: chưa nộp
    paid = sum(p['amount'] for p in payments)
    if paid < need:
        for d, txt in ((due - timedelta(days=14), 'Nhắc nộp học phí'), (due + timedelta(days=1), 'Thông báo quá hạn học phí')):
            if d <= as_of:
                notices.append({'at': iso(d), 'message': f'{txt} {semester}: {u.get("name", "")} còn nợ {need - paid:,} đ. Hạn nộp: {due.strftime("%d/%m/%Y")}.'.replace(',', '.')})
    doc = {'payments': payments, 'discount': int(discount), 'studentName': u.get('name', ''), 'username': u.get('username', ''), 'seed': TAG}
    if note_disc:
        doc['discountNote'] = note_disc
    if notices:
        doc['notices'] = notices
    return doc


def grad_doc(api, P, uid, u, gpa, finals, tdoc, topic):
    seed, as_of = P['seed'], P['as_of']
    r = stable_rng(seed, 'totnghiep', uid)
    if r.random() > 0.86:
        return None                                          # ~14% chưa nộp phiếu
    past = [s for s in P['by_id'].values() if s.get('khoa') == u.get('cohort') and s.get('trangThai') == 'da-ket-thuc']
    credits = sum(int(s.get('credits') or 0) for s in past)
    g = float(gpa)
    if g < 2.6:
        credits -= 3 * r.choice([0, 1, 1, 2] if g < 2.2 else [0, 0, 1])     # môn chưa đạt phải học lại
    credits += sum(int(P['by_id'][sid].get('credits') or 0) for sid, v in finals.items() if v is not None and v >= 4.0)
    certs = {'english': r.random() < 0.72, 'it': r.random() < 0.88, 'gdqp': r.random() < 0.98, 'gdtc': r.random() < 0.98}
    certs = {k: v for k, v in certs.items() if v}
    debt = None
    if tdoc is not None:
        total = 0
        for s in (P['by_id'][i] for i in (u.get('subjectIds') or []) if i in P['cur_ids']):
            total += int(s.get('credits') or 0) * int(P['fin'].get('pricePerCredit') or 0)
        debt = max(0, total - tdoc.get('discount', 0) - sum(p['amount'] for p in tdoc['payments']))
    req = P['required']
    self_check = [{'label': 'GPA tích lũy ≥ 2.00', 'ok': g >= 2.0},
                  {'label': f'Tích lũy đủ {req} tín chỉ theo CTĐT', 'ok': credits >= req if req else None},
                  {'label': 'Không còn nợ học phí', 'ok': None if debt is None else debt == 0},
                  {'label': 'Chuẩn đầu ra ngoại ngữ', 'ok': 'english' in certs},
                  {'label': 'Chuẩn đầu ra tin học', 'ok': 'it' in certs},
                  {'label': 'Chứng chỉ Giáo dục quốc phòng – an ninh', 'ok': 'gdqp' in certs},
                  {'label': 'Chứng chỉ Giáo dục thể chất', 'ok': 'gdtc' in certs}]
    sub_day = date(as_of.year, 12, 1) + timedelta(days=r.randint(0, 18))
    if sub_day > as_of:
        sub_day = as_of
    sub_at = f'{iso(sub_day)}T{r.randint(1, 10):02d}:{r.randint(0, 59):02d}:00.000Z'
    status, review = 'submitted', ''
    missing = [lbl for k, lbl in (('english', 'chuẩn đầu ra ngoại ngữ'), ('it', 'chuẩn đầu ra tin học'),
                                   ('gdqp', 'chứng chỉ GDQP–AN'), ('gdtc', 'chứng chỉ GDTC')) if k not in certs]
    reviewed = r.random() < 0.7
    if reviewed:
        if g < 2.0:
            status, review = 'rejected', f'GPA tích lũy {gpa} dưới 2.00 nên chưa đủ điều kiện xét đợt này. Đăng ký học cải thiện ở học kỳ 2.'
        elif missing:
            status, review = 'needsFix', 'Bổ sung ' + ', '.join(missing) + ' trước ngày 15/5/2027 để được xét trong đợt.'
        elif debt:
            status, review = 'needsFix', f'Hoàn thành học phí học kỳ 1 (còn nợ {debt:,} đ) trước khi xét.'.replace(',', '.')
        else:
            status, review = 'approved', ('Đủ điều kiện dự xét. Kết quả chính thức sau khi có điểm học kỳ 2 '
                                          f'(thực tập và khóa luận, còn {max(0, req - credits)} tín chỉ).')
    doc = {'name': u.get('name', ''), 'studentId': u.get('studentId', ''), 'className': u.get('className') or u.get('classId', ''),
           'major': 'Công nghệ thông tin', 'faculty': 'Công nghệ thông tin', 'email': '', 'phone': u.get('phone', ''),
           'gpa': gpa, 'credits': credits, 'round': 'Đợt 1 năm 2027 (tháng 7/2027)', 'thesisTitle': topic,
           'certs': certs, 'evidence': '', 'note': '', 'pledge': True, 'status': status, 'selfCheck': self_check,
           'submittedAt': sub_at, 'uid': uid, 'seed': TAG}
    if reviewed:
        rv = min(as_of, sub_day + timedelta(days=r.randint(2, 9)))
        doc.update({'review': review, 'reviewedBy': 'Phòng Đào tạo', 'reviewedAt': f'{iso(rv)}T09:{r.randint(0, 59):02d}:00.000Z'})
    return doc


def topics_csv(P, S):
    """Danh sách đề tài đồ án (CSV, UTF-8 có BOM để Excel đọc đúng tiếng Việt)."""
    rows = []
    defense = next(iter(P.get('defense', {}).values()), None)
    for uid, u in sorted(P['students'], key=lambda x: (x[1].get('classId', ''), x[1].get('studentId', ''))):
        if uid not in S['topics'] or u.get('cohort') != P['final_cohort']:
            continue
        sc = next((v for sid, v in S['finals'].get(uid, {}).items() if P['by_id'][sid].get('kieuHoc') == 'huong-dan'), None)
        rows.append([u.get('studentId', ''), u.get('name', ''), u.get('classId', ''), S['topics'][uid], S['advisors'].get(uid, ''),
                     defense.strftime('%d/%m/%Y') if defense else '', '' if sc is None else f'{sc:.1f}'.replace('.', ',')])
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(['STT', 'MSSV', 'Họ và tên', 'Lớp', 'Tên đề tài', 'Giáo viên hướng dẫn', 'Ngày bảo vệ', 'Điểm'])
    for i, row in enumerate(rows, 1):
        w.writerow([i] + row)
    return '﻿' + buf.getvalue(), len(rows)


# ── Ghi / gỡ ───────────────────────────────────────────────────────────────────────────────────
def write_all(api, P, S, data_dir):
    con = api.db()
    meta = {'at': time.time(), 'asOf': iso(P['as_of']), 'seed': P['seed'], 'grades': [], 'results': [], 'tuition': [], 'grad': [],
            'policies': [], 'subs': {}, 'events': {}, 'gpa': {}, 'files': []}
    shared = api.doc_get('sharedData', 'global') or {}
    # Tệp danh sách đề tài cho học phần đồ án
    csv_text, n_topics = topics_csv(P, S)
    guided = [s for s in P['cur'] if s.get('kieuHoc') == 'huong-dan']
    mats = []
    if guided and n_topics:
        os.makedirs(api.UPLOAD_DIR, exist_ok=True)
        cohort = P['final_cohort'] or ''
        name = f'{secrets.token_hex(8)}_Danh_sach_de_tai_Do_an_chuyen_nganh_K{cohort[2:4]}.csv'
        with open(os.path.join(api.UPLOAD_DIR, name), 'w', encoding='utf-8', newline='') as f:
            f.write(csv_text)
        meta['files'].append(name)
        for i, s in enumerate(guided):
            mats.append({'id': MAT_BASE + i, 'subjectId': s['id'], 'title': f'Danh sách đề tài Đồ án chuyên ngành – khóa {cohort}',
                         'type': 'khac', 'description': f'{n_topics} đề tài, giáo viên hướng dẫn, ngày bảo vệ và điểm (tệp CSV, mở bằng Excel)',
                         'url': f'/uploads/{name}', 'uploadedBy': 'Phòng Đào tạo', 'uploadedAt': iso(min(P['as_of'], P['t_start'] + timedelta(weeks=3))),
                         'fileName': name.split('_', 1)[1], 'size': len(csv_text.encode('utf-8')), 'seed': TAG})
    meta['sharedKeysNew'] = [k for k in ('homeworks', 'deadlines', 'materials', 'grades') if k not in shared]
    shared['homeworks'] = list(shared.get('homeworks') or []) + P['homeworks']
    shared['deadlines'] = list(shared.get('deadlines') or []) + P['deadlines']
    shared['materials'] = list(shared.get('materials') or []) + mats
    grades = dict(shared.get('grades') or {})
    for uid, cells in S['grades'].items():
        grades[uid] = cells
        meta['grades'].append(uid)
    shared['grades'] = grades
    size = len(json.dumps(shared, ensure_ascii=False).encode())
    if size > SHARED_LIMIT:
        sys.exit(f'sharedData/global sẽ thành {size / 1e6:.2f} MB, vượt ngưỡng an toàn {SHARED_LIMIT / 1e6:.1f} MB. Không ghi gì.')

    con.execute('BEGIN')
    try:
        api.doc_put('sharedData', 'global', shared)
        for sid, pol in P['policies'].items():
            if not api.doc_get('gradingPolicies', sid):
                api.doc_put('gradingPolicies', sid, pol)
                meta['policies'].append(sid)
        for rid, res in S['results'].items():
            cur = con.execute('INSERT OR IGNORE INTO docs VALUES (?,?,?)', ('quizResults', rid, json.dumps(res, ensure_ascii=False)))
            if cur.rowcount:
                meta['results'].append(rid)
        for uid, doc in S['tuition'].items():
            if not api.doc_get('tuition', uid):
                api.doc_put('tuition', uid, doc)
                meta['tuition'].append(uid)
        for uid, doc in S['grad'].items():
            if not api.doc_get('graduationApps', uid):
                api.doc_put('graduationApps', uid, doc)
                meta['grad'].append(uid)
        names = {uid: u for uid, u in P['students']}
        touched = set(S['subs']) | set(S['gpa'])
        for uid in touched:
            ud = api.doc_get('userData', uid) or {}
            changed = False
            hs = dict(ud.get('homeworkSubs') or {})
            added = [k for k, v in S['subs'].get(uid, {}).items() if k not in hs]
            for k in added:
                hs[k] = S['subs'][uid][k]
            if added:
                if 'homeworkSubs' not in ud:
                    meta.setdefault('subsKeyNew', []).append(uid)
                ud['homeworkSubs'] = hs
                meta['subs'][uid] = added
                changed = True
            prof = dict(ud.get('profile') or {})
            if uid in S['gpa'] and not str(prof.get('gpa') or '').strip():
                prof['gpa'] = S['gpa'][uid]
                ud['profile'] = prof
                meta['gpa'][uid] = S['gpa'][uid]
                changed = True
            if changed:
                api.doc_put('userData', uid, ud)
        for uid, evs in S['events'].items():
            act = api.doc_get('activities', uid) or {'uid': uid, 'name': names[uid].get('name', ''), 'username': names[uid].get('username', ''), 'events': []}
            merged = list(act.get('events') or []) + sorted(evs, key=lambda e: e.get('at', ''))
            if len(merged) > api.ACTIVITY_MAX_EVENTS:
                continue
            act['events'] = merged
            api.doc_put('activities', uid, act)
            meta['events'][uid] = [ev_hash(uid, e) for e in evs]
        meta['homeworks'] = [h['id'] for h in P['homeworks']]
        meta['deadlines'] = [d['id'] for d in P['deadlines']]
        meta['materials'] = [m['id'] for m in mats]
        api.doc_put('meta', META_ID, meta)
        con.execute('COMMIT')
    except BaseException:
        con.execute('ROLLBACK')
        for name in meta['files']:
            try:
                os.remove(os.path.join(api.UPLOAD_DIR, name))
            except OSError:
                pass
        raise
    return size, meta


def purge(api):
    con = api.db()
    meta = api.doc_get('meta', META_ID)
    if not meta:
        print('Không có dữ liệu do seed_semester tạo (thiếu meta).')
        return
    con.execute('BEGIN')
    shared = api.doc_get('sharedData', 'global') or {}
    for k in ('homeworks', 'deadlines', 'materials'):
        if isinstance(shared.get(k), list):
            shared[k] = [x for x in shared[k] if not (isinstance(x, dict) and x.get('seed') == TAG)]
            if not shared[k] and k in meta.get('sharedKeysNew', []):
                shared.pop(k)
    g = shared.get('grades')
    if isinstance(g, dict):
        for uid in meta.get('grades', []):
            g.pop(uid, None)
        if not g and 'grades' in meta.get('sharedKeysNew', []):
            shared.pop('grades', None)
    api.doc_put('sharedData', 'global', shared)
    for sid in meta.get('policies', []):
        d = api.doc_get('gradingPolicies', sid)
        if d and d.get('seed') == TAG:
            con.execute("DELETE FROM docs WHERE col='gradingPolicies' AND id=?", (sid,))
    con.executemany("DELETE FROM docs WHERE col='quizResults' AND id=?", [(r,) for r in meta.get('results', [])])
    for col, key in (('tuition', 'tuition'), ('graduationApps', 'grad')):
        for uid in meta.get(key, []):
            d = api.doc_get(col, uid)
            if d and d.get('seed') == TAG:
                con.execute('DELETE FROM docs WHERE col=? AND id=?', (col, uid))
    for uid in set(meta.get('subs', {})) | set(meta.get('gpa', {})):
        ud = api.doc_get('userData', uid)
        if not ud:
            continue
        hs = ud.get('homeworkSubs') or {}
        for k in meta.get('subs', {}).get(uid, []):
            hs.pop(k, None)
        if uid in meta.get('subsKeyNew', []) and not hs:
            ud.pop('homeworkSubs', None)
        prof = ud.get('profile') or {}
        if uid in meta.get('gpa', {}) and prof.get('gpa') == meta['gpa'][uid]:
            prof['gpa'] = ''
        api.doc_put('userData', uid, ud)
    for uid, hashes in meta.get('events', {}).items():
        act = api.doc_get('activities', uid)
        if not act:
            continue
        want = set(hashes)
        act['events'] = [e for e in act.get('events') or [] if ev_hash(uid, e) not in want]
        if act['events']:
            api.doc_put('activities', uid, act)
        else:
            con.execute("DELETE FROM docs WHERE col='activities' AND id=?", (uid,))
    con.execute("DELETE FROM docs WHERE col='meta' AND id=?", (META_ID,))
    con.execute('COMMIT')
    for name in meta.get('files', []):
        try:
            os.remove(os.path.join(api.UPLOAD_DIR, name))
        except OSError:
            pass
    print(f"Đã gỡ: {len(meta.get('grades', []))} bảng điểm, {len(meta.get('results', []))} kết quả trắc nghiệm, "
          f"{len(meta.get('tuition', []))} học phí, {len(meta.get('grad', []))} phiếu tốt nghiệp, "
          f"{len(meta.get('homeworks', []))} bài tập, {len(meta.get('deadlines', []))} deadline.")


def summarize(P, S, size=None):
    from collections import Counter
    print(f"Học kỳ: {P['t_start']:%d/%m/%Y} – {P['t_end']:%d/%m/%Y}; số liệu tính đến {P['as_of']:%d/%m/%Y}")
    print(f"Học phần đang học: {len(P['cur'])}; sinh viên: {len(P['students'])} (khóa năm cuối {P['final_cohort']})")
    print(f"Bài tập: {len(P['homeworks'])}; deadline: {len(P['deadlines'])}; quy chế điểm: {len(P['policies'])}")
    print(f"Bảng điểm mới: {len(S['grades'])} sinh viên, {sum(len(c) for c in S['grades'].values())} môn; "
          f"kết quả trắc nghiệm: {len(S['results'])} lượt / {len(P['quizzes'])} đề đã đến hạn")
    allf = [v for f in S['finals'].values() for v in f.values() if v is not None]
    if allf:
        bands = Counter('A (≥8,5)' if v >= 8.5 else 'B (7–8,4)' if v >= 7 else 'C (5,5–6,9)' if v >= 5.5 else 'D (4–5,4)' if v >= 4 else 'F (<4)' for v in allf)
        print(f"Điểm tổng kết môn: {len(allf)} kết quả, trung bình {sum(allf) / len(allf):.2f}; " + ', '.join(f'{k}: {bands[k]}' for k in sorted(bands)))
    st = Counter()
    for uid, d in S['tuition'].items():
        paid = sum(p['amount'] for p in d['payments'])
        st['nộp đủ' if not d.get('notices') else 'nộp một phần' if paid else 'chưa nộp'] += 1
    print('Học phí: ' + ', '.join(f'{k} {v}' for k, v in st.items() if v) + f"; miễn giảm {sum(1 for d in S['tuition'].values() if d['discount'])}")
    gs = Counter(d['status'] for d in S['grad'].values())
    print(f"Phiếu xét tốt nghiệp: {len(S['grad'])} – " + ', '.join(f'{k} {v}' for k, v in gs.items()))
    print(f"Đề tài đồ án: {len(S['topics'])}")
    if size:
        print(f'sharedData/global sau khi nạp: {size / 1e6:.2f} MB')


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--data-dir', required=True, help='thư mục dữ liệu của máy chủ (STUDYTASK_DATA), chứa studytask.db')
    p.add_argument('--as-of', help='ngày chốt số liệu YYYY-MM-DD (mặc định 31/12 của năm học hiện tại)')
    p.add_argument('--seed', type=int, default=20261126, help='hạt giống ngẫu nhiên (cùng hạt giống → cùng số liệu)')
    p.add_argument('--dry-run', action='store_true', help='chỉ in thống kê, không ghi gì')
    p.add_argument('--purge', action='store_true', help='gỡ đúng dữ liệu script đã thêm rồi thoát')
    p.add_argument('--replace', action='store_true', help='gỡ bản cũ rồi nạp lại')
    a = p.parse_args(argv)
    data_dir = os.path.abspath(a.data_dir)
    if not os.path.isfile(os.path.join(data_dir, 'studytask.db')):
        sys.exit(f'Không thấy {os.path.join(data_dir, "studytask.db")}.')
    os.environ['STUDYTASK_DATA'] = data_dir
    sys.path.insert(0, SERVER_DIR)
    import studytask_api as api

    if a.purge or a.replace:
        purge(api)
        if a.purge:
            return 0
    if api.doc_get('meta', META_ID) and not a.dry_run:
        sys.exit('CSDL đã có dữ liệu do seed_semester tạo. Dùng --replace để nạp lại hoặc --purge để gỡ.')
    today = date.today()
    as_of = pdate(a.as_of) if a.as_of else date(today.year if today.month >= 8 else today.year - 1, 12, 31)
    P = build(api, a.seed, as_of)
    S = simulate(api, P)
    if a.dry_run:
        summarize(P, S)
        print('\n(--dry-run: chưa ghi gì)')
        return 0
    size, _ = write_all(api, P, S, data_dir)
    summarize(P, S, size)
    print('\nXong. Gỡ bằng: --purge')
    return 0


if __name__ == '__main__':
    sys.exit(main())
