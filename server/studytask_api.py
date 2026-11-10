#!/usr/bin/env python3
"""StudyTask API – thay thế Firebase Auth + Firestore bằng SQLite trên server.

Chạy:       python3 studytask_api.py serve
Tạo user:   python3 studytask_api.py create-user USERNAME PASSWORD ROLE "Tên"
Đặt mật khẩu: python3 studytask_api.py set-password USERNAME PASSWORD
Cấu hình mail: python3 studytask_api.py mail-config SMTP_HOST PORT USER "StudyTask <mail@domain>"
Thử gửi mail:  python3 studytask_api.py mail-test EMAIL_NHAN
Xóa user:   python3 studytask_api.py delete-user USERNAME

Biến môi trường: STUDYTASK_DATA (mặc định /var/lib/studytask), STUDYTASK_PORT (8787).
Phân quyền được chuyển từ firestore.rules (xem hàm can()).
"""
import hashlib, hmac, json, math, os, queue, re, secrets, smtplib, sqlite3, sys, threading, time
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs, unquote

DATA_DIR   = os.environ.get('STUDYTASK_DATA', '/var/lib/studytask')
UPLOAD_DIR = os.path.join(DATA_DIR, 'uploads')
DB_PATH    = os.path.join(DATA_DIR, 'studytask.db')
PORT       = int(os.environ.get('STUDYTASK_PORT', '8787'))
SESSION_TTL = 30 * 24 * 3600
MAX_JSON    = 5 * 1024 * 1024
MAX_UPLOAD  = 25 * 1024 * 1024
UPLOAD_EXTS = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'ppt', 'pptx',
               'xls', 'xlsx', 'txt', 'zip', 'rar', '7z', 'mp4', 'mp3'}
STAFF = ('admin', 'teacher', 'training')
MAX_SUBMIT = 15 * 1024 * 1024
SUBMIT_DEFAULT = ['pdf', 'doc', 'docx', 'txt', 'zip', 'jpg', 'jpeg', 'png']          # khi giáo viên chưa chọn định dạng
SUBMIT_EXTS = UPLOAD_EXTS - {'mp4', 'mp3'}
MAGIC = {'pdf': (b'%PDF',), 'docx': (b'PK',), 'xlsx': (b'PK',), 'pptx': (b'PK',), 'zip': (b'PK',), 'rar': (b'Rar!',), '7z': (b'7z\xbc\xaf',),
         'png': (b'\x89PNG',), 'jpg': (b'\xff\xd8',), 'jpeg': (b'\xff\xd8',), 'gif': (b'GIF8',), 'webp': (b'RIFF',),
         'doc': (b'\xd0\xcf\x11\xe0',), 'xls': (b'\xd0\xcf\x11\xe0',), 'ppt': (b'\xd0\xcf\x11\xe0',)}

SUBMISSION_NAME = re.compile(r'[0-9a-f]{16}_[A-Za-z0-9._-]{1,70}\.[a-z0-9]{1,5}')
INLINE_TYPES = {'pdf': 'application/pdf', 'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
                'gif': 'image/gif', 'webp': 'image/webp'}

_lock = threading.RLock()
_db = None


def db():
    global _db
    if _db is None:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        _db = sqlite3.connect(DB_PATH, check_same_thread=False, isolation_level=None)
        _db.execute('PRAGMA journal_mode=WAL')
        _db.executescript('''
          CREATE TABLE IF NOT EXISTS accounts (
            uid TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL COLLATE NOCASE,
            salt TEXT NOT NULL, pwhash TEXT NOT NULL, created_at TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY, uid TEXT NOT NULL, expires REAL NOT NULL);
          CREATE TABLE IF NOT EXISTS docs (
            col TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL,
            PRIMARY KEY (col, id));
          CREATE TABLE IF NOT EXISTS contact_email (
            uid TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL COLLATE NOCASE, verified_at REAL NOT NULL);
          CREATE TABLE IF NOT EXISTS codes (
            purpose TEXT NOT NULL, uid TEXT NOT NULL, email TEXT NOT NULL, code_hash TEXT NOT NULL,
            expires REAL NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, created REAL NOT NULL,
            PRIMARY KEY (purpose, uid));
          CREATE TABLE IF NOT EXISTS chat (
            id INTEGER PRIMARY KEY AUTOINCREMENT, thread TEXT NOT NULL, sender TEXT NOT NULL,
            from_staff INTEGER NOT NULL, text TEXT NOT NULL, ts REAL NOT NULL, read INTEGER NOT NULL DEFAULT 0);
          CREATE INDEX IF NOT EXISTS chat_thread ON chat(thread, id);
          CREATE TABLE IF NOT EXISTS submission_files (
            stored TEXT PRIMARY KEY, uid TEXT NOT NULL, hw TEXT NOT NULL, created REAL NOT NULL);
        ''')
        migrate_username(_db)
        try:
            migrate_quizzes(_db)
        except Exception:
            if _db.in_transaction:
                _db.execute('ROLLBACK')
            raise            # không phục vụ khi chưa tách được đáp án; CSDL đã có bản sao lưu .bak-pre-quiz-v3
    return _db


def migrate_username(conn):
    """Bản cũ dùng email làm tên đăng nhập → chuyển sang username (phần trước @), giữ nguyên mật khẩu đã mã hóa."""
    if 'username' in [r[1] for r in conn.execute('PRAGMA table_info(accounts)')]:
        return
    bak = DB_PATH + '.bak-pre-username'
    if not os.path.exists(bak):
        dst = sqlite3.connect(bak)
        conn.backup(dst)
        dst.close()
    used, rows = set(), []
    for uid, email, salt, pw, created in conn.execute('SELECT uid, email, salt, pwhash, created_at FROM accounts').fetchall():
        base = re.sub(r'[^a-z0-9._-]', '', email.split('@')[0].lower()).strip('._-') or 'user'
        if len(base) < 3:
            base = (base + 'user')[:8]
        name, n = base[:32], 1
        while name in used:
            n += 1
            name = f'{base[:28]}{n}'
        used.add(name)
        rows.append((uid, name, salt, pw, created))
    conn.execute('BEGIN')
    conn.execute('ALTER TABLE accounts RENAME TO accounts_old')
    conn.execute('CREATE TABLE accounts (uid TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL COLLATE NOCASE, '
                 'salt TEXT NOT NULL, pwhash TEXT NOT NULL, created_at TEXT NOT NULL)')
    for uid, name, salt, pw, created in rows:
        conn.execute('INSERT INTO accounts VALUES (?,?,?,?,?)', (uid, name, salt, pw, created))
        r = conn.execute("SELECT data FROM docs WHERE col='user' AND id=?", (uid,)).fetchone()
        if r:
            d = json.loads(r[0])
            d.pop('email', None)
            d['username'] = name
            conn.execute("UPDATE docs SET data=? WHERE col='user' AND id=?", (json.dumps(d, ensure_ascii=False), uid))
    conn.execute('DROP TABLE accounts_old')
    conn.execute('COMMIT')
    sys.stderr.write('MIGRATE tài khoản chuyển sang tên đăng nhập: %s\n' % ', '.join(r[1] for r in rows))


# ── Mật khẩu / phiên ─────────────────────────────────────────────
def hash_pw(password, salt):
    return hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 200_000).hex()


def new_uid():
    return secrets.token_hex(14)


USERNAME_RE = re.compile(r'^[a-z0-9][a-z0-9._-]{2,31}$')


def norm_user(s):
    s = str(s).strip().lower()
    return s[:-len('@studytask.vn')] if s.endswith('@studytask.vn') else s     # tương thích cách đăng nhập cũ


def create_account(username, password, profile):
    username = str(username).strip().lower()
    if not USERNAME_RE.match(username):
        raise ApiError(400, 'bad-username', 'Tên đăng nhập gồm 3–32 ký tự: chữ thường không dấu, số, dấu . _ - (bắt đầu bằng chữ hoặc số).')
    if len(password) < 6:
        raise ApiError(400, 'auth/weak-password', 'Mật khẩu tối thiểu 6 ký tự.')
    salt = secrets.token_hex(16)
    uid = new_uid()
    with _lock:
        try:
            db().execute('INSERT INTO accounts VALUES (?,?,?,?,?)',
                         (uid, username, salt, hash_pw(password, salt), time.strftime('%Y-%m-%d')))
        except sqlite3.IntegrityError:
            raise ApiError(409, 'auth/username-already-in-use', 'Tên đăng nhập đã tồn tại.')
        data = dict(profile)
        data.pop('email', None)
        data['username'] = username
        db().execute('INSERT OR REPLACE INTO docs VALUES (?,?,?)', ('user', uid, json.dumps(data, ensure_ascii=False)))
    return uid


def set_password(uid, password):
    if len(password) < 6:
        raise ApiError(400, 'auth/weak-password', 'Mật khẩu tối thiểu 6 ký tự.')
    salt = secrets.token_hex(16)
    with _lock:
        db().execute('UPDATE accounts SET salt=?, pwhash=? WHERE uid=?', (salt, hash_pw(password, salt), uid))
        db().execute('DELETE FROM sessions WHERE uid=?', (uid,))


def check_login(username, password):
    row = db().execute('SELECT uid, salt, pwhash FROM accounts WHERE username=?', (norm_user(username),)).fetchone()
    fake_salt = '00' * 16
    ok = hmac.compare_digest(hash_pw(password, row[1] if row else fake_salt), row[2] if row else 'x' * 64)
    return row[0] if (row and ok) else None


_attempts = {}   # ip -> [timestamps]


def too_many_attempts(ip):
    now = time.time()
    lst = [t for t in _attempts.get(ip, []) if now - t < 300]
    _attempts[ip] = lst
    return len(lst) >= 10


# ── Tài liệu (thay Firestore) ───────────────────────────────────
def doc_get(col, id_):
    r = db().execute('SELECT data FROM docs WHERE col=? AND id=?', (col, id_)).fetchone()
    return json.loads(r[0]) if r else None


def doc_put(col, id_, data):
    db().execute('INSERT OR REPLACE INTO docs VALUES (?,?,?)', (col, id_, json.dumps(data, ensure_ascii=False)))


def deep_merge(a, b):
    out = dict(a)
    for k, v in b.items():
        out[k] = deep_merge(out[k], v) if isinstance(v, dict) and isinstance(out.get(k), dict) else v
    return out


def role_of(user):
    p = doc_get('user', user['uid']) if user else None
    return (p or {}).get('role')


LOCKED_ROLES = ('student', 'teacher')     # chỉ được tự sửa email và số điện thoại; còn lại do Admin cấp
PROFILE_SELF_KEYS = {'email', 'phone'}
PHONE_RE = re.compile(r'[0-9+ ().-]{0,20}')


def lock_profile(user, old, merged):
    """Sinh viên/giáo viên ghi userData/{uid}: giữ nguyên hồ sơ cũ, chỉ nhận email và số điện thoại mới.
    Họ tên (nếu hồ sơ chưa có) lấy từ tài khoản, không lấy từ client."""
    prof_new = merged.get('profile')
    if not isinstance(prof_new, dict):
        return merged
    fixed = dict((old or {}).get('profile') or {})
    for k in PROFILE_SELF_KEYS:
        if k in prof_new:
            fixed[k] = prof_new[k]
    if not fixed.get('name'):
        fixed['name'] = (doc_get('user', user['uid']) or {}).get('name', '')
    return {**merged, 'profile': fixed}


def profile_ok(user, old, new):
    op_, np_ = (old or {}).get('profile') or {}, (new or {}).get('profile') or {}
    if not isinstance(np_, dict):
        return False
    changed = {k for k in set(op_) | set(np_) if op_.get(k) != np_.get(k)}
    if 'name' in changed and np_.get('name') == (doc_get('user', user['uid']) or {}).get('name'):
        changed.discard('name')           # đồng bộ từ tài khoản, không phải do người dùng sửa
    if not changed <= PROFILE_SELF_KEYS:
        return False
    ph, em = np_.get('phone', ''), np_.get('email', '')
    return (isinstance(ph, str) and PHONE_RE.fullmatch(ph) is not None
            and isinstance(em, str) and (em == '' or EMAIL_RE.fullmatch(em) is not None))


# Nhật ký hoạt động activities/{uid} (V4): chỉ kiểm tra được hình thức, KHÔNG chứng minh được điểm là thật (V3).
ACTIVITY_DOC_KEYS = {'uid', 'name', 'username', 'email', 'events'}
ACTIVITY_EVENT_KEYS = {'type', 'at', 'subjectId', 'refId', 'refTitle', 'score', 'total', 'correct', 'url', 'fileName', 'note'}
ACTIVITY_TYPES = ('quiz', 'homework', 'material')
ACTIVITY_MAX_EVENTS = 2000
ACTIVITY_DATE_RE = re.compile(r'[0-9]{4}-[0-9]{2}-[0-9]{2}')


def is_number(v):
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        return False
    return isinstance(v, int) or math.isfinite(v)     # json.loads của Python nhận cả NaN, Infinity


def short_str(d, key, max_len):
    v = d.get(key, '')
    return isinstance(v, str) and len(v) <= max_len


def is_count(d, key):
    v = d.get(key, 0)
    return isinstance(v, int) and not isinstance(v, bool) and v >= 0


def teaches_student(teacher_uid, student_uid):
    """Giáo viên dạy ít nhất một môn của sinh viên.
    Hồ sơ cũ chưa có subjectIds được coi là học mọi môn, giống app.js và nhánh nộp bài ở /api/upload."""
    mine = (doc_get('user', teacher_uid) or {}).get('subjectIds') or []
    student = doc_get('user', student_uid)
    if not mine or student is None:
        return False
    theirs = student.get('subjectIds')
    return theirs is None or any(s in theirs for s in mine)


def valid_activity_event(e):
    if not isinstance(e, dict) or not set(e) <= ACTIVITY_EVENT_KEYS:
        return False
    at, ref, score = e.get('at'), e.get('refId', 0), e.get('score', 0)
    return (e.get('type') in ACTIVITY_TYPES
            and isinstance(at, str) and ACTIVITY_DATE_RE.fullmatch(at) is not None
            and is_number(e.get('subjectId', 0))
            and (is_number(ref) or isinstance(ref, str))
            and short_str(e, 'refTitle', 500) and short_str(e, 'url', 2048)
            and short_str(e, 'fileName', 255) and short_str(e, 'note', 2000)
            and is_number(score) and 0 <= score <= 10
            and is_count(e, 'total') and is_count(e, 'correct')
            and e.get('correct', 0) <= e.get('total', 0))


def activity_write_ok(uid, old, new):
    """Chủ tài khoản chỉ được thêm MỘT sự kiện hợp lệ (loại material hoặc homework, không phải quiz) vào cuối; phần cũ giữ nguyên, kể cả sự kiện quiz đã có."""
    if not set(new) <= ACTIVITY_DOC_KEYS or new.get('uid', uid) != uid:
        return False
    if not (short_str(new, 'name', 100) and short_str(new, 'username', 254) and short_str(new, 'email', 254)):
        return False
    cur, prev = new.get('events', []), old.get('events', [])
    if not isinstance(cur, list) or not isinstance(prev, list) or len(cur) > ACTIVITY_MAX_EVENTS:
        return False
    # Sự kiện `quiz` do máy chủ ghi khi chấm bài (doc_put, không qua hàm này) nên chủ tài khoản KHÔNG được tự thêm: chặn việc tự ghi điểm (V3, V4)
    return cur == prev or (len(cur) == len(prev) + 1 and cur[:-1] == prev and valid_activity_event(cur[-1]) and cur[-1].get('type') != 'quiz')


def valid_evidence(value):
    """Link minh chứng để trống hoặc là http(s); giao diện đưa giá trị này vào href."""
    return not value or (isinstance(value, str) and re.fullmatch(r'https?://\S+', value.strip(), re.I) is not None)


def can(op, col, id_, user, old=None, new=None):
    """Chuyển từ firestore.rules. op: read | create | update | delete."""
    signed = user is not None
    role = role_of(user) if signed else None
    admin = role == 'admin'
    owner = signed and user['uid'] == id_
    write = op in ('create', 'update', 'delete')

    if col == 'user':
        if op == 'read': return signed
        if op == 'create':
            return admin or (owner and set(new) <= {'name', 'username', 'role'} and new.get('role') == 'student'
                             and new.get('username') == user['username'])
        if op == 'update':
            if admin: return True
            changed = {k for k in set(old) | set(new) if old.get(k) != new.get(k)}
            nm = new.get('name')
            ph = new.get('phone', '')
            allowed = {'phone'} if role in LOCKED_ROLES else {'name', 'phone'}   # họ tên của SV/GV do Admin cấp
            return (owner and changed <= allowed and isinstance(nm, str) and 0 < len(nm) <= 100
                    and isinstance(ph, str) and re.fullmatch(r'[0-9+ ().-]{0,20}', ph) is not None)
        return admin
    if col == 'userData':
        if admin: return True
        if not owner: return False
        if role in LOCKED_ROLES and op in ('create', 'update'):
            return profile_ok(user, old, new)
        return True
    if col == 'activities':
        if op == 'read': return owner or admin or (role == 'teacher' and teaches_student(user['uid'], id_))
        if op == 'delete': return owner or admin
        return admin or (owner and activity_write_ok(id_, old, new))
    if col == 'sharedData':    return signed if op == 'read' else role in STAFF
    if col in ('gradingPolicies', 'curriculum', 'theses'):
        return signed if op == 'read' else role in ('admin', 'training')
    if col == 'financeConfig': return signed if op == 'read' else role in ('admin', 'finance')
    if col == 'tuition':       return (owner or role in ('admin', 'finance')) if op == 'read' else role in ('admin', 'finance')
    if col == 'gradingColumns':
        if op == 'read': return signed
        if admin: return True
        if role != 'teacher': return False
        ids = (doc_get('user', user['uid']) or {}).get('subjectIds') or []
        try: return int(id_) in ids
        except ValueError: return False
    if col == 'graduationApps':
        if op == 'read': return owner or role in ('admin', 'training')
        mgr = role in ('admin', 'training')
        rev = {'review', 'reviewedBy', 'reviewedAt'}
        if op == 'create':
            return role == 'student' and owner and new.get('status') == 'submitted' and not (set(new) & rev) and valid_evidence(new.get('evidence'))
        if op == 'update':
            if mgr: return True
            changed = {k for k in set(old) | set(new) if old.get(k) != new.get(k)}
            return owner and old.get('status') in ('submitted', 'needsFix') and new.get('status') == 'submitted' and not (changed & rev) and valid_evidence(new.get('evidence'))
        return mgr or (owner and old and old.get('status') == 'submitted')
    if col in ('quizKeys', 'quizResults'):
        return False   # V3: khóa đáp án và kết quả chỉ đi qua /api/quiz/*, không đọc/ghi trực tiếp qua /api/doc
    return False   # collection lạ → từ chối (userSecrets không còn dùng)


# ── Trắc nghiệm (V3) ─────────────────────────────────────────────
# Đề nằm trong sharedData/global.quizzes nhưng KHÔNG có đáp án đúng (answers[].correct).
# Khóa đáp án nằm riêng ở quizKeys/{quizId}; kết quả chính thức ở quizResults/{quizId}_{uid}, chỉ máy chủ ghi.
# Máy chủ lọc khi đọc (sinh viên không thấy khóa) và kiểm tra khi ghi (vòng đời draft → active → closed).
QUIZ_STATUSES = ('draft', 'active', 'closed')
VN_TZ = timezone(timedelta(hours=7))
DATE_RE = re.compile(r'[0-9]{4}-[0-9]{2}-[0-9]{2}')


def quiz_status(q):
    return q.get('status') or 'active'          # đề cũ chưa có trạng thái được coi là đang mở


def quiz_strip(q):
    """Bản công khai của đề: bỏ mọi `correct`."""
    out = {k: v for k, v in q.items() if k != 'questions'}
    out['questions'] = [
        {**{k: v for k, v in qq.items() if k != 'answers'},
         'answers': [{k: v for k, v in a.items() if k != 'correct'} for a in qq.get('answers', []) if isinstance(a, dict)]}
        for qq in q.get('questions', []) if isinstance(qq, dict)]
    return out


def quiz_key_of(q):
    ca = {}
    for qq in q.get('questions', []):
        if isinstance(qq, dict):
            ca[str(qq.get('id'))] = sorted(str(a.get('id')) for a in qq.get('answers', []) if isinstance(a, dict) and a.get('correct') is True)
    return {'quizId': q.get('id'), 'subjectId': q.get('subjectId'), 'correctAnswers': ca}


def quiz_merge(q, key):
    """Bản đầy đủ cho người có quyền sửa đề: ghép `correct` từ khóa đáp án."""
    ca = (key or {}).get('correctAnswers') or {}
    out = quiz_strip(q)
    for qq in out['questions']:
        ids = ca.get(str(qq.get('id')), [])
        for a in qq['answers']:
            a['correct'] = str(a.get('id')) in ids
    return out


def quiz_authorized(user, role, subject_id):
    """Admin, hoặc giáo viên được phân công môn của đề."""
    if role == 'admin':
        return True
    if role == 'teacher':
        return subject_id in ((doc_get('user', user['uid']) or {}).get('subjectIds') or [])
    return False


def quizzes_for(user, role, stored):
    """Danh sách đề mà người này được thấy: có quyền → đầy đủ khóa; còn lại → bản công khai, không có đề nháp,
    sinh viên chỉ thấy đề môn mình học."""
    ids = (doc_get('user', user['uid']) or {}).get('subjectIds') if role == 'student' else None
    out = []
    for q in stored or []:
        if not isinstance(q, dict):
            continue
        if quiz_authorized(user, role, q.get('subjectId')):
            out.append(quiz_merge(q, doc_get('quizKeys', str(q.get('id')))))
        elif quiz_status(q) != 'draft' and (ids is None or q.get('subjectId') in ids):
            out.append(quiz_strip(q))
    return out


SUBJECT_SCOPED = ('deadlines', 'homeworks', 'materials', 'schedule', 'exams')   # các danh sách có `subjectId`


def project_shared(user, doc):
    """Bản của sharedData/global mà người này được đọc (việc 14: phân quyền đọc theo môn).
    - đề trắc nghiệm: không lộ đáp án, không có đề nháp (quizzes_for);
    - sinh viên: chỉ nhận bài tập, tài liệu, lịch học, lịch thi, deadline của môn mình học; mục không có `subjectId` (chung) giữ lại;
      `subjects`, `news`, `forms` là danh mục chung nên giữ nguyên; `grades` (điểm nhập tay) chỉ còn phần của chính mình;
    - sinh viên hồ sơ cũ chưa có subjectIds được coi là học mọi môn (giống giao diện và /api/upload);
    - admin, giáo viên, đào tạo, tài chính nhận đầy đủ vì giao diện tải rồi ghi ngược cả danh sách (không lọc để khỏi mất dữ liệu).
    Dữ liệu lưu trong CSDL không bị lọc; chỉ bản trả về."""
    if not doc or not user:
        return doc
    out, role = dict(doc), role_of(user)
    if 'quizzes' in out:
        out['quizzes'] = quizzes_for(user, role, out.get('quizzes'))
    if role == 'student':
        ids = (doc_get('user', user['uid']) or {}).get('subjectIds')
        if ids is not None:
            for k in SUBJECT_SCOPED:
                if isinstance(out.get(k), list):
                    out[k] = [x for x in out[k] if not isinstance(x, dict) or 'subjectId' not in x or x['subjectId'] in ids]
        if isinstance(out.get('grades'), dict):
            out['grades'] = {k: v for k, v in out['grades'].items() if k == user['uid']}
    return out


def quiz_shape_ok(q):
    if not isinstance(q, dict) or not is_number(q.get('id')) or not is_number(q.get('subjectId')):
        return False
    if not isinstance(q.get('title'), str) or not 0 < len(q['title'].strip()) <= 200 or q.get('status') not in QUIZ_STATUSES:
        return False
    if not isinstance(q.get('dueDate'), str) or not DATE_RE.fullmatch(q['dueDate']):
        return False
    qs = q.get('questions')
    if not isinstance(qs, list) or not 0 < len(qs) <= 200:
        return False
    seen = set()
    for qq in qs:
        if not isinstance(qq, dict) or not is_number(qq.get('id')) or qq['id'] in seen:
            return False
        seen.add(qq['id'])
        ans = qq.get('answers')
        if not isinstance(qq.get('text'), str) or qq.get('type') not in ('single', 'multiple') or not isinstance(ans, list) or not 2 <= len(ans) <= 10:
            return False
        ids = [a.get('id') for a in ans if isinstance(a, dict)]
        if len(ids) != len(ans) or len(set(ids)) != len(ids) or not all(isinstance(i, str) and i for i in ids):
            return False
        if not all(isinstance(a.get('text'), str) for a in ans):
            return False
    return True


def quiz_key_complete(q):
    for qq in q['questions']:
        n = sum(1 for a in qq['answers'] if a.get('correct') is True)
        if n < 1 or (qq['type'] == 'single' and n != 1):
            return False
    return True


def same_json(a, b):
    return json.dumps(a, sort_keys=True, ensure_ascii=False) == json.dumps(b, sort_keys=True, ensure_ascii=False)


def quiz_update(oq, okey, nq, ops):
    """Một đề đã có, người ghi có quyền với môn: áp quy tắc vòng đời. Trả bản lưu (không có `correct`)."""
    ost, nst = quiz_status(oq), quiz_status(nq)
    if nq.get('subjectId') != oq.get('subjectId'):
        raise ApiError(403, 'quiz-locked', 'Không được đổi môn của đề.')
    if ost == 'draft':
        if not quiz_shape_ok({**nq, 'status': nst}):
            raise ApiError(400, 'bad-quiz', 'Đề không hợp lệ (thiếu tiêu đề, hạn làm bài, câu hỏi hoặc đáp án).')
        if nst not in ('draft', 'active'):
            raise ApiError(403, 'quiz-locked', 'Đề nháp chỉ chuyển được sang "đang mở".')
        if nst == 'active' and not quiz_key_complete(nq):
            raise ApiError(400, 'quiz-no-key', 'Mỗi câu cần có đáp án đúng (câu một lựa chọn: đúng một đáp án) trước khi mở đề.')
        ops.append(('put', str(oq['id']), quiz_key_of(nq)))
        return quiz_strip({**nq, 'status': nst})
    view = quiz_merge(oq, okey)
    if not same_json({k: v for k, v in view.items() if k != 'status'}, {k: v for k, v in nq.items() if k != 'status'}):
        raise ApiError(403, 'quiz-locked', 'Đề đã mở không được sửa nội dung; hãy tạo đề mới.')
    if not (nst == ost or (ost == 'active' and nst == 'closed')):
        raise ApiError(403, 'quiz-locked', 'Trạng thái đề chỉ chuyển một chiều: nháp → đang mở → đã đóng.')
    return {**quiz_strip(oq), 'status': nst}


def guard_quizzes(user, role, old_doc, merged):
    """Kiểm tra thay đổi `quizzes` trong sharedData/global. Trả (merged đã lọc đáp án, danh sách thao tác khóa).
    Người không có quyền với một đề chỉ được gửi lại đúng bản họ đã được thấy."""
    new_list = merged.get('quizzes')
    old_list = (old_doc or {}).get('quizzes') or []
    if new_list is None and old_list:      # ghi đè không merge mà bỏ mất danh sách đề: coi như xóa hết
        new_list = []
    if new_list is None or new_list == old_list:
        return merged, []
    if not isinstance(new_list, list):
        raise ApiError(400, 'bad-quizzes', 'Danh sách đề không hợp lệ.')
    deny = ApiError(403, 'permission-denied', 'Bạn không có quyền thực hiện thao tác này.')
    new_by_id = {}
    for q in new_list:
        if not isinstance(q, dict) or 'id' not in q or str(q['id']) in new_by_id:
            raise ApiError(400, 'bad-quizzes', 'Danh sách đề không hợp lệ (thiếu hoặc trùng id).')
        new_by_id[str(q['id'])] = q
    out, ops, seen = [], [], set()
    for oq in old_list:
        if not isinstance(oq, dict):
            out.append(oq)
            continue
        k = str(oq.get('id'))
        seen.add(k)
        nq = new_by_id.get(k)
        if quiz_authorized(user, role, oq.get('subjectId')):
            if nq is None:
                if quiz_status(oq) != 'draft':
                    raise ApiError(403, 'quiz-locked', 'Chỉ được xóa đề ở trạng thái bản nháp.')
                ops.append(('del', k))
                continue
            out.append(quiz_update(oq, doc_get('quizKeys', k), nq, ops))
        else:
            proj = quizzes_for(user, role, [oq])
            if (proj and (nq is None or not same_json(nq, proj[0]))) or (not proj and nq is not None):
                raise deny
            out.append(oq)
    for k, nq in new_by_id.items():
        if k in seen:
            continue
        if not quiz_authorized(user, role, nq.get('subjectId')):
            raise deny
        if quiz_status(nq) != 'draft':
            raise ApiError(403, 'quiz-locked', 'Đề mới phải tạo ở trạng thái bản nháp; mở đề sau khi đã lưu khóa đáp án.')
        if not quiz_shape_ok({**nq, 'status': 'draft'}):
            raise ApiError(400, 'bad-quiz', 'Đề không hợp lệ (thiếu tiêu đề, hạn làm bài, câu hỏi hoặc đáp án).')
        ops.append(('put', k, quiz_key_of(nq)))
        out.append(quiz_strip({**nq, 'status': 'draft'}))
    return {**merged, 'quizzes': out}, ops


def apply_quiz_ops(ops):
    for op in ops:
        if op[0] == 'put':
            doc_put('quizKeys', op[1], op[2])
        else:
            db().execute("DELETE FROM docs WHERE col='quizKeys' AND id=?", (op[1],))


def quiz_due_passed(q):
    """Hạn làm bài là hết ngày `dueDate` theo giờ Việt Nam (UTC+7). Đề không có hạn hợp lệ thì không giới hạn."""
    d = q.get('dueDate')
    if not isinstance(d, str) or not DATE_RE.fullmatch(d):
        return False
    try:
        end = datetime.strptime(d, '%Y-%m-%d').replace(tzinfo=VN_TZ) + timedelta(days=1)
    except ValueError:
        return False
    return datetime.now(VN_TZ) >= end


def grade_quiz(quiz, key, answers):
    """Chấm bài: trả (đã chuẩn hóa câu trả lời, số câu đúng, tổng, điểm thang 10).
    Câu bỏ trống tính sai; mã câu hỏi hoặc mã lựa chọn không tồn tại → 400."""
    if not isinstance(answers, dict):
        raise ApiError(400, 'bad-answers', 'Thiếu câu trả lời.')
    ca = (key or {}).get('correctAnswers') or {}
    questions = [qq for qq in quiz.get('questions', []) if isinstance(qq, dict)]
    qids = {str(qq.get('id')) for qq in questions}
    if any(str(k) not in qids for k in answers):
        raise ApiError(400, 'bad-answers', 'Có câu trả lời cho câu hỏi không tồn tại.')
    norm, correct = {}, 0
    for qq in questions:
        qid = str(qq.get('id'))
        given = answers.get(qid)
        given = [] if given is None else [given] if isinstance(given, str) else given
        valid = {str(a.get('id')) for a in qq.get('answers', []) if isinstance(a, dict)}
        if not isinstance(given, list) or any(not isinstance(g, str) or g not in valid for g in given):
            raise ApiError(400, 'bad-answers', 'Có đáp án không hợp lệ.')
        given = sorted(set(given))
        if qq.get('type') == 'single' and len(given) > 1:
            raise ApiError(400, 'bad-answers', 'Câu một lựa chọn chỉ được chọn một đáp án.')
        norm[qid] = given
        want = sorted(ca.get(qid, []))
        if given and given == want:
            correct += 1
    total = len(questions)
    score = math.floor((correct / total) * 10 * 10 + 0.5) / 10 if total else 0
    return norm, correct, total, score


def migrate_quizzes(conn):
    """Chạy một lần: tách đáp án đúng khỏi sharedData/global.quizzes sang quizKeys; chuyển bài cũ sang quizResults
    (đánh dấu migrated, không chấm lại). Có sao lưu CSDL trước khi sửa."""
    if conn.execute("SELECT 1 FROM docs WHERE col='meta' AND id='quiz_v3'").fetchone():
        return
    r = conn.execute("SELECT data FROM docs WHERE col='sharedData' AND id='global'").fetchone()
    doc = json.loads(r[0]) if r else {}
    qs = doc.get('quizzes') if isinstance(doc.get('quizzes'), list) else []
    has_old = bool(qs) or conn.execute("SELECT 1 FROM docs WHERE col IN ('activities','userData') LIMIT 1").fetchone()
    if has_old:
        bak = DB_PATH + '.bak-pre-quiz-v3'
        if not os.path.exists(bak):
            dst = sqlite3.connect(bak)
            conn.backup(dst)
            dst.close()
    conn.execute('BEGIN')
    info = {}
    for q in qs:
        if isinstance(q, dict) and 'id' in q:
            info[str(q['id'])] = q
            conn.execute('INSERT OR IGNORE INTO docs VALUES (?,?,?)',
                         ('quizKeys', str(q['id']), json.dumps(quiz_key_of(q), ensure_ascii=False)))
    if qs:
        doc['quizzes'] = [quiz_strip(q) if isinstance(q, dict) else q for q in qs]
        conn.execute("UPDATE docs SET data=? WHERE col='sharedData' AND id='global'", (json.dumps(doc, ensure_ascii=False),))
    moved = 0

    def add(uid, qid, subject_id, score, correct, total, answers, at):
        nonlocal moved
        cur = conn.execute('INSERT OR IGNORE INTO docs VALUES (?,?,?)', ('quizResults', f'{qid}_{uid}', json.dumps(
            {'uid': uid, 'quizId': qid, 'subjectId': subject_id, 'answers': answers, 'score': score, 'correct': correct,
             'total': total, 'submittedAt': at, 'migrated': True}, ensure_ascii=False)))
        moved += cur.rowcount
    for uid, data in conn.execute("SELECT id, data FROM docs WHERE col='userData'").fetchall():
        for s in (json.loads(data).get('submissions') or []):
            if isinstance(s, dict) and is_number(s.get('quizId')) and is_number(s.get('score')):
                q = info.get(str(s['quizId']), {})
                add(uid, s['quizId'], q.get('subjectId'), s['score'], s.get('correct', 0), s.get('total', 0),
                    s.get('answers') if isinstance(s.get('answers'), dict) else {}, str(s.get('submittedAt', '')))
    for uid, data in conn.execute("SELECT id, data FROM docs WHERE col='activities'").fetchall():
        latest = {}
        for e in (json.loads(data).get('events') or []):
            if isinstance(e, dict) and e.get('type') == 'quiz' and is_number(e.get('refId')) and is_number(e.get('score')):
                latest[e['refId']] = e
        for qid, e in latest.items():
            add(uid, qid, e.get('subjectId'), e['score'], e.get('correct', 0), e.get('total', 0), {}, str(e.get('at', '')))
    conn.execute("INSERT INTO docs VALUES ('meta','quiz_v3',?)", (json.dumps({'at': time.time(), 'keys': len(info), 'results': moved}),))
    conn.execute('COMMIT')
    if info or moved:
        sys.stderr.write('MIGRATE quiz V3: %d khóa đáp án, %d kết quả cũ\n' % (len(info), moved))


# ── HTTP ────────────────────────────────────────────────────────
class ApiError(Exception):
    def __init__(self, status, code, message):
        super().__init__(message)
        self.status, self.code, self.message = status, code, message


# ── Email khôi phục + mã xác nhận ────────────────────────────────
MAIL_CFG = os.path.join(DATA_DIR, 'mail.json')
EMAIL_RE = re.compile(r'^[^@\s]{1,64}@[^@\s]{1,200}\.[^@\s.]{2,}$')
CODE_TTL = 15 * 60
_sendlog = {}   # ip -> [timestamps] giới hạn số lần yêu cầu gửi mail


def mail_ready():
    return os.environ.get('STUDYTASK_MAIL_DEBUG') == '1' or os.path.exists(MAIL_CFG)


def mail_send(to, subject, body):
    """Gửi email nền (không chặn API). Chưa cấu hình SMTP → báo lỗi rõ ràng cho người dùng."""
    if os.environ.get('STUDYTASK_MAIL_DEBUG') == '1':
        sys.stderr.write('[MAIL-DEBUG] to=%s subject=%s\n%s\n' % (to, subject, body))
        return
    try:
        cfg = json.load(open(MAIL_CFG, encoding='utf-8'))
    except (OSError, ValueError):
        raise ApiError(503, 'mail-not-configured', 'Máy chủ chưa cấu hình gửi email. Hãy liên hệ quản trị viên.')

    def run():
        try:
            msg = EmailMessage()
            msg['Subject'], msg['From'], msg['To'] = subject, cfg['from'], to
            msg.set_content(body)
            port = int(cfg.get('port', 587))
            srv = smtplib.SMTP_SSL(cfg['host'], port, timeout=20) if port == 465 else smtplib.SMTP(cfg['host'], port, timeout=20)
            if port != 465:
                srv.starttls()
            if cfg.get('user'):
                srv.login(cfg['user'], cfg.get('password', ''))
            srv.send_message(msg)
            srv.quit()
        except Exception as e:
            sys.stderr.write('MAIL-ERROR %r\n' % (e,))
    threading.Thread(target=run, daemon=True).start()


def throttle_mail(ip, limit=6):
    now = time.time()
    lst = [t for t in _sendlog.get(ip, []) if now - t < 3600]
    if len(lst) >= limit:
        raise ApiError(429, 'too-many-requests', 'Bạn yêu cầu quá nhiều lần. Thử lại sau ít phút.')
    lst.append(now)
    _sendlog[ip] = lst


def make_code(purpose, uid, email):
    now = time.time()
    row = db().execute('SELECT created FROM codes WHERE purpose=? AND uid=?', (purpose, uid)).fetchone()
    if row and now - row[0] < 60:
        raise ApiError(429, 'too-soon', 'Vui lòng đợi 1 phút trước khi gửi lại mã.')
    code = '%06d' % secrets.randbelow(10 ** 6)
    db().execute('INSERT OR REPLACE INTO codes VALUES (?,?,?,?,?,0,?)',
                 (purpose, uid, email.lower(), hashlib.sha256((code + uid).encode()).hexdigest(), now + CODE_TTL, now))
    return code


def check_code(purpose, uid, code):
    row = db().execute('SELECT email, code_hash, expires, attempts FROM codes WHERE purpose=? AND uid=?', (purpose, uid)).fetchone()
    bad = ApiError(400, 'bad-code', 'Mã không đúng hoặc đã hết hạn.')
    if not row or row[2] < time.time() or row[3] >= 5:
        raise bad
    if not hmac.compare_digest(row[1], hashlib.sha256((str(code).strip() + uid).encode()).hexdigest()):
        db().execute('UPDATE codes SET attempts=attempts+1 WHERE purpose=? AND uid=?', (purpose, uid))
        raise bad
    db().execute('DELETE FROM codes WHERE purpose=? AND uid=?', (purpose, uid))
    return row[0]


def find_uid(identifier):
    """Tìm tài khoản theo tên đăng nhập HOẶC email cá nhân đã xác minh."""
    raw = str(identifier).strip().lower()
    r = db().execute('SELECT uid FROM accounts WHERE username=?', (norm_user(raw),)).fetchone() or \
        db().execute('SELECT uid FROM contact_email WHERE email=?', (raw,)).fetchone()
    return r[0] if r else None


# ── Sự kiện thời gian thực (SSE) + hiện diện online ──────────────
_subs, _sub_roles = {}, {}      # uid -> [Queue]; uid -> role
_sub_lock = threading.Lock()


def publish(uids, ev):
    """uids=None → gửi cho mọi người đang online."""
    with _sub_lock:
        targets = [q for uid, lst in _subs.items() if uids is None or uid in uids for q in lst]
    for q in targets:
        try:
            q.put_nowait(ev)
        except queue.Full:
            pass


def online_admins():
    with _sub_lock:
        return {u for u, r in _sub_roles.items() if r == 'admin' and u in _subs}


def support_online():
    return bool(online_admins())


def sub_add(uid, role, q):
    with _sub_lock:
        first = uid not in _subs
        _subs.setdefault(uid, []).append(q)
        _sub_roles[uid] = role
    if first:
        presence(uid, role, True)


def sub_remove(uid, role, q):
    with _sub_lock:
        lst = _subs.get(uid, [])
        if q in lst:
            lst.remove(q)
        gone = not lst
        if gone:
            _subs.pop(uid, None)
    if gone:
        presence(uid, role, False)


def presence(uid, role, online):
    if role == 'admin':
        publish(None, {'type': 'support', 'online': support_online()})
    else:
        publish(online_admins(), {'type': 'presence', 'uid': uid, 'online': online})


def sse(ev):
    return ('data: %s\n\n' % json.dumps(ev, ensure_ascii=False)).encode()


def chat_msg(r):
    return {'id': r[0], 'thread': r[1], 'sender': r[2], 'fromStaff': bool(r[3]), 'text': r[4], 'ts': r[5], 'read': bool(r[6])}


_chat_rate = {}   # uid -> [timestamps]


def avatar_dir():
    d = os.path.join(UPLOAD_DIR, 'avatars')
    os.makedirs(d, mode=0o755, exist_ok=True)
    return d


def drop_avatar_file(url):
    if url and url.startswith('/uploads/avatars/'):
        try:
            os.remove(os.path.join(avatar_dir(), os.path.basename(url)))
        except OSError:
            pass


def drop_quiz_results(uid):
    """Xóa kết quả trắc nghiệm (quizResults/{quizId}_{uid}) của một tài khoản bị xóa; khóa đáp án và đề không bị đụng."""
    db().execute("DELETE FROM docs WHERE col='quizResults' AND id LIKE ? ESCAPE '\\'",
                 ('%\\_' + uid.replace('\\', '\\\\').replace('%', '\\%').replace('_', '\\_'),))


class Handler(BaseHTTPRequestHandler):
    server_version = 'StudyTaskAPI'
    protocol_version = 'HTTP/1.1'

    def log_message(self, fmt, *a):
        sys.stderr.write('%s %s\n' % (self.address_string(), fmt % a))

    # tiện ích
    def ip(self):
        return self.headers.get('CF-Connecting-IP') or self.headers.get('X-Real-IP') or self.client_address[0]

    def body(self, limit):
        n = int(self.headers.get('Content-Length') or 0)
        if n > limit:
            raise ApiError(413, 'too-large', 'Dữ liệu quá lớn.')
        return self.rfile.read(n)

    def json_body(self):
        try:
            v = json.loads(self.body(MAX_JSON) or b'{}')
        except ValueError:
            raise ApiError(400, 'bad-json', 'JSON không hợp lệ.')
        if not isinstance(v, dict):
            raise ApiError(400, 'bad-json', 'Cần một đối tượng JSON.')
        return v

    def send(self, status, obj, headers=None):
        raw = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('Cache-Control', 'no-store')
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(raw)

    def current_user(self):
        c = cookies.SimpleCookie(self.headers.get('Cookie') or '')
        if 'st_session' not in c:
            return None
        r = db().execute('SELECT s.uid, a.username, s.expires FROM sessions s JOIN accounts a ON a.uid=s.uid WHERE s.token=?',
                         (c['st_session'].value,)).fetchone()
        if not r or r[2] < time.time():
            return None
        return {'uid': r[0], 'username': r[1]}

    def cookie(self, token, max_age):
        secure = '; Secure' if self.headers.get('X-Forwarded-Proto') == 'https' or self.headers.get('CF-Visitor') else ''
        return {'Set-Cookie': f'st_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={max_age}{secure}'}

    def same_origin_ok(self):
        o = self.headers.get('Origin')
        return not o or urlparse(o).netloc == self.headers.get('Host')

    def need_user(self):
        u = self.current_user()
        if not u:
            raise ApiError(401, 'unauthenticated', 'Chưa đăng nhập.')
        return u

    def dispatch(self, method):
        try:
            if method != 'GET' and not self.same_origin_ok():
                raise ApiError(403, 'bad-origin', 'Origin không hợp lệ.')
            path = urlparse(self.path)
            parts = [unquote(p) for p in path.path.strip('/').split('/')]
            if parts[:1] != ['api']:
                raise ApiError(404, 'not-found', 'Không tìm thấy.')
            parts = parts[1:]
            if method == 'GET' and parts == ['events']:
                return self.stream_events()
            with _lock:
                return self.route(method, parts, parse_qs(path.query))
        except ApiError as e:
            self.send(e.status, {'error': {'code': e.code, 'message': e.message}})
        except Exception as e:   # lỗi không lường trước
            sys.stderr.write('ERROR %r\n' % (e,))
            self.send(500, {'error': {'code': 'internal', 'message': 'Lỗi máy chủ.'}})

    do_GET = lambda self: self.dispatch('GET')
    do_POST = lambda self: self.dispatch('POST')
    do_PUT = lambda self: self.dispatch('PUT')
    do_DELETE = lambda self: self.dispatch('DELETE')

    def stream_events(self):
        with _lock:
            u = self.need_user()
            role = role_of(u)
        q = queue.Queue(maxsize=200)
        sub_add(u['uid'], role, q)
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream; charset=utf-8')
            self.send_header('Cache-Control', 'no-cache, no-transform')
            self.send_header('X-Accel-Buffering', 'no')
            self.send_header('Connection', 'close')
            self.end_headers()
            self.close_connection = True
            self.wfile.write(sse({'type': 'hello', 'supportOnline': support_online()}))
            self.wfile.flush()
            while True:
                try:
                    chunk = sse(q.get(timeout=20))
                except queue.Empty:
                    chunk = b': ping\n\n'
                self.wfile.write(chunk)
                self.wfile.flush()
        except OSError:
            pass
        finally:
            sub_remove(u['uid'], role, q)

    def route(self, method, p, q):
        # ── xác thực ──
        if p == ['auth', 'login'] and method == 'POST':
            ip = self.ip()
            if too_many_attempts(ip):
                raise ApiError(429, 'auth/too-many-requests', 'Đăng nhập sai quá nhiều lần. Thử lại sau vài phút.')
            b = self.json_body()
            uid = check_login(str(b.get('username', b.get('email', ''))), str(b.get('password', '')))
            if not uid:
                _attempts.setdefault(ip, []).append(time.time())
                raise ApiError(401, 'auth/invalid-credential', 'Tên đăng nhập hoặc mật khẩu không đúng.')
            token = secrets.token_urlsafe(32)
            db().execute('INSERT INTO sessions VALUES (?,?,?)', (token, uid, time.time() + SESSION_TTL))
            username = db().execute('SELECT username FROM accounts WHERE uid=?', (uid,)).fetchone()[0]
            return self.send(200, {'user': {'uid': uid, 'username': username}}, self.cookie(token, SESSION_TTL))
        if p == ['auth', 'logout'] and method == 'POST':
            c = cookies.SimpleCookie(self.headers.get('Cookie') or '')
            if 'st_session' in c:
                db().execute('DELETE FROM sessions WHERE token=?', (c['st_session'].value,))
            return self.send(200, {'ok': True}, self.cookie('', 0))
        if p == ['auth', 'me'] and method == 'GET':
            return self.send(200, {'user': self.current_user()})
        if p == ['auth', 'forgot'] and method == 'POST':
            throttle_mail(self.ip())
            if not mail_ready():
                raise ApiError(503, 'mail-not-configured', 'Máy chủ chưa cấu hình gửi email. Hãy liên hệ quản trị viên.')
            uid = find_uid(str(self.json_body().get('identifier', '')))
            row = db().execute('SELECT email FROM contact_email WHERE uid=?', (uid,)).fetchone() if uid else None
            if row:
                try:
                    code = make_code('reset', uid, row[0])
                    mail_send(row[0], 'StudyTask – mã đặt lại mật khẩu',
                              f'Mã đặt lại mật khẩu StudyTask của bạn là: {code}\n\nMã có hiệu lực 15 phút. '
                              'Nếu bạn không yêu cầu, hãy bỏ qua email này – mật khẩu của bạn không thay đổi.')
                except ApiError as e:
                    if e.code != 'too-soon':
                        raise
            return self.send(200, {'ok': True})     # luôn trả lời giống nhau để không lộ tài khoản nào tồn tại
        if p == ['auth', 'reset'] and method == 'POST':
            ip = self.ip()
            if too_many_attempts(ip):
                raise ApiError(429, 'auth/too-many-requests', 'Thử sai quá nhiều lần. Thử lại sau vài phút.')
            b = self.json_body()
            uid = find_uid(str(b.get('identifier', '')))
            if len(str(b.get('newPassword', ''))) < 6:     # kiểm tra trước để không tiêu hao mã
                raise ApiError(400, 'auth/weak-password', 'Mật khẩu tối thiểu 6 ký tự.')
            try:
                if not uid:
                    raise ApiError(400, 'bad-code', 'Mã không đúng hoặc đã hết hạn.')
                check_code('reset', uid, b.get('code', ''))
            except ApiError:
                _attempts.setdefault(ip, []).append(time.time())
                raise
            set_password(uid, str(b.get('newPassword', '')))     # đồng thời đăng xuất mọi phiên cũ
            return self.send(200, {'ok': True})
        if p == ['auth', 'change-password'] and method == 'POST':
            u = self.need_user()
            b = self.json_body()
            if not check_login(u['username'], str(b.get('currentPassword', ''))):
                raise ApiError(401, 'auth/wrong-password', 'Mật khẩu hiện tại không đúng.')
            set_password(u['uid'], str(b.get('newPassword', '')))
            token = secrets.token_urlsafe(32)   # set_password đã xóa phiên cũ → cấp phiên mới
            db().execute('INSERT INTO sessions VALUES (?,?,?)', (token, u['uid'], time.time() + SESSION_TTL))
            return self.send(200, {'ok': True}, self.cookie(token, SESSION_TTL))

        # ── email khôi phục + ảnh đại diện ──
        if p[:1] == ['account']:
            u = self.need_user()
            prof = doc_get('user', u['uid']) or {}
            if p == ['account'] and method == 'GET':
                row = db().execute('SELECT email FROM contact_email WHERE uid=?', (u['uid'],)).fetchone()
                return self.send(200, {'username': u['username'], 'recoveryEmail': row[0] if row else None,
                                       'avatar': prof.get('avatar', ''), 'mailReady': mail_ready()})
            if p == ['account', 'email'] and method == 'POST':
                b = self.json_body()
                email = str(b.get('email', '')).strip().lower()
                if not EMAIL_RE.match(email) or len(email) > 254:
                    raise ApiError(400, 'bad-email', 'Email không hợp lệ.')
                if not check_login(u['username'], str(b.get('password', ''))):
                    raise ApiError(401, 'auth/wrong-password', 'Mật khẩu hiện tại không đúng.')
                if db().execute('SELECT 1 FROM contact_email WHERE email=? AND uid<>?', (email, u['uid'])).fetchone():
                    raise ApiError(409, 'email-in-use', 'Email này đã được dùng cho tài khoản khác.')
                throttle_mail(self.ip())
                if not mail_ready():
                    raise ApiError(503, 'mail-not-configured', 'Máy chủ chưa cấu hình gửi email. Hãy liên hệ quản trị viên.')
                code = make_code('link', u['uid'], email)
                mail_send(email, 'StudyTask – xác nhận email cá nhân',
                          f'Mã xác nhận liên kết email cá nhân với tài khoản StudyTask "{u["username"]}": {code}\n\nMã có hiệu lực 15 phút. '
                          'Nếu không phải bạn thực hiện, hãy bỏ qua email này.')
                return self.send(200, {'ok': True})
            if p == ['account', 'email', 'verify'] and method == 'POST':
                email = check_code('link', u['uid'], self.json_body().get('code', ''))
                db().execute('INSERT OR REPLACE INTO contact_email VALUES (?,?,?)', (u['uid'], email, time.time()))
                return self.send(200, {'ok': True, 'recoveryEmail': email})
            if p == ['account', 'email'] and method == 'DELETE':
                if not check_login(u['username'], str(self.json_body().get('password', ''))):
                    raise ApiError(401, 'auth/wrong-password', 'Mật khẩu hiện tại không đúng.')
                db().execute('DELETE FROM contact_email WHERE uid=?', (u['uid'],))
                return self.send(200, {'ok': True})
            if p == ['account', 'avatar'] and method == 'POST':
                name = (q.get('filename') or ['a.jpg'])[0]
                ext = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
                if ext not in ('jpg', 'jpeg', 'png', 'webp'):
                    raise ApiError(400, 'bad-file-type', 'Ảnh đại diện chỉ nhận JPG, PNG hoặc WebP.')
                data = self.body(1024 * 1024)
                if not data or not data.startswith(MAGIC[ext][0]):
                    raise ApiError(400, 'bad-file-content', 'File không phải ảnh hợp lệ.')
                stored = f'{u["uid"][:8]}_{secrets.token_hex(6)}.{ext}'
                path = os.path.join(avatar_dir(), stored)
                with open(path, 'wb') as f:
                    f.write(data)
                os.chmod(path, 0o644)
                drop_avatar_file(prof.get('avatar'))
                prof['avatar'] = f'/uploads/avatars/{stored}'
                doc_put('user', u['uid'], prof)
                return self.send(200, {'avatar': prof['avatar']})
            if p == ['account', 'avatar'] and method == 'DELETE':
                drop_avatar_file(prof.pop('avatar', ''))
                doc_put('user', u['uid'], prof)
                return self.send(200, {'ok': True})

        # ── hỗ trợ trực tuyến (chat) ──
        if p[:1] == ['chat']:
            u = self.need_user()
            uid = u['uid']
            admin = role_of(u) == 'admin'
            if p == ['chat', 'status'] and method == 'GET':
                unread = db().execute('SELECT COUNT(*) FROM chat WHERE from_staff=0 AND read=0' if admin else
                                      'SELECT COUNT(*) FROM chat WHERE thread=? AND from_staff=1 AND read=0',
                                      () if admin else (uid,)).fetchone()[0]
                return self.send(200, {'unread': unread, 'supportOnline': support_online()})
            if p == ['chat', 'threads'] and method == 'GET':
                if not admin:
                    raise ApiError(403, 'permission-denied', 'Chỉ quản trị viên xem danh sách hội thoại.')
                rows = db().execute('''SELECT c.thread, MAX(c.id),
                      SUM(CASE WHEN c.from_staff=0 AND c.read=0 THEN 1 ELSE 0 END) FROM chat c GROUP BY c.thread ORDER BY MAX(c.id) DESC LIMIT 200''').fetchall()
                online = online_admins() | {x for x in _subs}
                out = []
                for th, last_id, unread in rows:
                    m = db().execute('SELECT id,thread,sender,from_staff,text,ts,read FROM chat WHERE id=?', (last_id,)).fetchone()
                    pr = doc_get('user', th) or {}
                    out.append({'thread': th, 'name': pr.get('name', '(đã xóa)'), 'role': pr.get('role', ''), 'avatar': pr.get('avatar', ''),
                                'username': pr.get('username', ''), 'unread': unread or 0, 'last': chat_msg(m), 'online': th in online})
                return self.send(200, {'threads': out})
            if p == ['chat', 'messages'] and method == 'GET':
                thread = (q.get('thread') or [''])[0] if admin else uid
                if not thread:
                    raise ApiError(400, 'bad-request', 'Thiếu thread.')
                after = int((q.get('after') or ['0'])[0] or 0)
                rows = db().execute('SELECT id,thread,sender,from_staff,text,ts,read FROM chat WHERE thread=? AND id>? ORDER BY id LIMIT 300',
                                    (thread, after)).fetchall()
                return self.send(200, {'messages': [chat_msg(r) for r in rows], 'supportOnline': support_online()})
            if p == ['chat', 'messages'] and method == 'POST':
                b = self.json_body()
                text = str(b.get('text', '')).strip()
                if not text or len(text) > 2000:
                    raise ApiError(400, 'bad-message', 'Tin nhắn phải từ 1 đến 2000 ký tự.')
                now = time.time()
                lst = [t for t in _chat_rate.get(uid, []) if now - t < 60]
                if len(lst) >= 20:
                    raise ApiError(429, 'too-many-requests', 'Bạn gửi quá nhanh, vui lòng chậm lại.')
                _chat_rate[uid] = lst + [now]
                thread = str(b.get('thread', '')) if admin else uid
                if admin and not doc_get('user', thread):
                    raise ApiError(404, 'not-found', 'Không tìm thấy người dùng.')
                cur = db().execute('INSERT INTO chat (thread,sender,from_staff,text,ts,read) VALUES (?,?,?,?,?,0)',
                                   (thread, uid, 1 if admin else 0, text, now))
                msg = chat_msg((cur.lastrowid, thread, uid, 1 if admin else 0, text, now, 0))
                sender = doc_get('user', uid) or {}
                publish(online_admins() | {thread}, {'type': 'chat', 'thread': thread, 'msg': msg,
                                                      'fromName': sender.get('name', ''), 'fromRole': sender.get('role', '')})
                return self.send(200, {'message': msg})
            if p == ['chat', 'read'] and method == 'POST':
                thread = str(self.json_body().get('thread', '')) if admin else uid
                db().execute('UPDATE chat SET read=1 WHERE thread=? AND from_staff=?', (thread, 0 if admin else 1))
                publish(online_admins() | {thread}, {'type': 'read', 'thread': thread, 'by': 'staff' if admin else 'user'})
                return self.send(200, {'ok': True})

        # ── quản trị tài khoản ──
        if p[:2] == ['admin', 'users']:
            u = self.need_user()
            if role_of(u) != 'admin':
                raise ApiError(403, 'permission-denied', 'Chỉ quản trị viên được thực hiện.')
            if len(p) == 2 and method == 'POST':
                b = self.json_body()
                prof = b.get('profile') or {}
                allowed = {k: prof[k] for k in ('name', 'role', 'subjectIds', 'phone', 'expiresAt') if k in prof}
                allowed.setdefault('name', b.get('username', b.get('email')))
                allowed.setdefault('role', 'student')
                allowed.setdefault('subjectIds', [])
                allowed['createdAt'] = time.strftime('%Y-%m-%d')
                uid = create_account(str(b.get('username', b.get('email', ''))), str(b.get('password', '')), allowed)
                return self.send(200, {'uid': uid})
            if len(p) == 4 and p[3] == 'password' and method == 'POST':
                if not db().execute('SELECT 1 FROM accounts WHERE uid=?', (p[2],)).fetchone():
                    raise ApiError(404, 'not-found', 'Không tìm thấy tài khoản.')
                npw = self.json_body().get('newPassword', '')
                set_password(p[2], npw if isinstance(npw, str) else '')
                return self.send(200, {'ok': True})
            if len(p) == 3 and method == 'DELETE':
                drop_avatar_file((doc_get('user', p[2]) or {}).get('avatar'))
                for t in ('accounts', 'sessions', 'contact_email', 'codes'):
                    db().execute(f'DELETE FROM {t} WHERE uid=?', (p[2],))
                db().execute('DELETE FROM chat WHERE thread=?', (p[2],))
                for col in ('user', 'userData', 'activities'):
                    db().execute('DELETE FROM docs WHERE col=? AND id=?', (col, p[2]))
                drop_quiz_results(p[2])
                return self.send(200, {'ok': True})

        # ── tài liệu ──
        if p[:1] == ['doc'] and len(p) in (2, 3, 4):
            u = self.current_user()
            col = p[1]
            if len(p) == 2 and method == 'GET':
                rows = db().execute('SELECT id, data FROM docs WHERE col=?', (p[1],)).fetchall()
                out = []
                for id_, data in rows:   # lọc theo quyền đọc từng tài liệu
                    if can('read', col, id_, u):
                        d = json.loads(data)
                        out.append({'id': id_, **(project_shared(u, d) if col == 'sharedData' and id_ == 'global' else d)})
                return self.send(200, {'docs': out})
            id_ = p[2]
            old = doc_get(col, id_)
            if len(p) == 3 and method == 'GET':
                if not can('read', col, id_, u):
                    raise ApiError(403, 'permission-denied', 'Bạn không có quyền thực hiện thao tác này.')
                return self.send(200, {'exists': old is not None,
                                       'data': project_shared(u, old) if col == 'sharedData' and id_ == 'global' else old})
            quiz_ops = []
            if len(p) == 3 and method == 'PUT':
                b = self.json_body()
                new = b.get('data')
                if not isinstance(new, dict):
                    raise ApiError(400, 'bad-json', 'Thiếu data.')
                merged = deep_merge(old or {}, new) if b.get('merge', True) else new
                sync_phone = None
                if col == 'userData' and u and u['uid'] == id_ and role_of(u) in LOCKED_ROLES:
                    merged = lock_profile(u, old, merged)
                    # Chỉ đồng bộ khi CHÍNH yêu cầu này gửi profile.phone (người dùng đang đổi số). `merged` còn chứa số cũ đã lưu, nên
                    # kiểm tra trên merged sẽ ghi đè user.phone mỗi khi sửa email hay dữ liệu khác. Giá trị ghi lấy từ `merged`: bản đã qua kiểm tra.
                    if isinstance(new.get('profile'), dict) and 'phone' in new['profile'] and 'phone' in (merged.get('profile') or {}):
                        sync_phone = merged['profile']['phone']
                if col == 'sharedData' and id_ == 'global' and u and role_of(u) in STAFF:
                    merged, quiz_ops = guard_quizzes(u, role_of(u), old, merged)
                if not can('update' if old is not None else 'create', col, id_, u, old or {}, merged):
                    raise ApiError(403, 'permission-denied', 'Bạn không có quyền thực hiện thao tác này.')
                apply_quiz_ops(quiz_ops)
                if sync_phone is None:
                    doc_put(col, id_, merged)
                else:
                    # Số điện thoại nằm ở userData.profile và user/{uid} (Danh bạ, Admin đọc ở đây): ghi cả hai trong MỘT
                    # giao dịch ở máy chủ, để giao diện báo lỗi/quá hạn giữa chừng cũng không để hai nơi lệch nhau (lỗi PR35 mục 4.1)
                    db().execute('BEGIN')
                    try:
                        doc_put(col, id_, merged)
                        acct = doc_get('user', id_)
                        if acct is not None and acct.get('phone', '') != sync_phone:
                            doc_put('user', id_, {**acct, 'phone': sync_phone})
                        db().execute('COMMIT')
                    except Exception:
                        db().execute('ROLLBACK')
                        raise
                return self.send(200, {'ok': True})
            if len(p) == 3 and method == 'DELETE':
                if col == 'sharedData' and id_ == 'global':
                    raise ApiError(403, 'permission-denied', 'Không được xóa toàn bộ dữ liệu dùng chung.')
                if old is None:
                    return self.send(200, {'ok': True})
                if not can('delete', col, id_, u, old):
                    raise ApiError(403, 'permission-denied', 'Bạn không có quyền thực hiện thao tác này.')
                db().execute('DELETE FROM docs WHERE col=? AND id=?', (col, id_))
                return self.send(200, {'ok': True})
            if len(p) == 4 and p[3] == 'append' and method == 'POST':   # thay arrayUnion
                b = self.json_body()
                field, value = b.get('field'), b.get('value')
                merged = dict(old or {})
                for k, v in (b.get('set') or {}).items():
                    merged[k] = v
                arr = list(merged.get(field) or [])
                if value not in arr:
                    arr.append(value)
                merged[field] = arr
                if col == 'sharedData' and id_ == 'global' and u and role_of(u) in STAFF:
                    merged, quiz_ops = guard_quizzes(u, role_of(u), old, merged)
                if not can('update' if old is not None else 'create', col, id_, u, old or {}, merged):
                    raise ApiError(403, 'permission-denied', 'Bạn không có quyền thực hiện thao tác này.')
                apply_quiz_ops(quiz_ops)
                doc_put(col, id_, merged)
                return self.send(200, {'ok': True})

        # ── trắc nghiệm (V3): máy chủ chấm và ghi điểm ──
        if p[:1] == ['quiz']:
            u = self.need_user()
            role = role_of(u)
            if p == ['quiz', 'mine'] and method == 'GET':       # kết quả chính thức của chính mình
                rows = db().execute("SELECT data FROM docs WHERE col='quizResults'").fetchall()
                mine = [d for d in (json.loads(r[0]) for r in rows) if d.get('uid') == u['uid']]
                return self.send(200, {'results': mine})
            if len(p) == 3 and p[2] == 'results' and method == 'GET':   # giáo viên dạy môn / Admin xem kết quả của đề
                shared = doc_get('sharedData', 'global') or {}
                quiz = next((x for x in shared.get('quizzes') or [] if isinstance(x, dict) and str(x.get('id')) == p[1]), None)
                if not quiz or not quiz_authorized(u, role, quiz.get('subjectId')):
                    raise ApiError(403, 'permission-denied', 'Bạn không có quyền xem kết quả của đề này.')
                rows = db().execute("SELECT data FROM docs WHERE col='quizResults'").fetchall()
                return self.send(200, {'results': [d for d in (json.loads(r[0]) for r in rows) if str(d.get('quizId')) == p[1]]})
            if len(p) == 3 and p[2] == 'submit' and method == 'POST':
                if role != 'student':
                    raise ApiError(403, 'permission-denied', 'Chỉ sinh viên nộp bài trắc nghiệm.')
                b = self.json_body()                    # chỉ lấy `answers`; score, uid, subjectId do client gửi bị bỏ qua
                shared = doc_get('sharedData', 'global') or {}
                quiz = next((x for x in shared.get('quizzes') or [] if isinstance(x, dict) and str(x.get('id')) == p[1]), None)
                prof = doc_get('user', u['uid']) or {}
                if (not quiz or quiz_status(quiz) == 'draft'
                        or (prof.get('subjectIds') is not None and quiz.get('subjectId') not in prof['subjectIds'])):
                    raise ApiError(404, 'not-found', 'Không tìm thấy đề hoặc bạn không học môn này.')
                if quiz_status(quiz) != 'active':
                    raise ApiError(400, 'quiz-closed', 'Đề đã đóng.')
                if quiz_due_passed(quiz):
                    raise ApiError(400, 'quiz-expired', 'Đã quá hạn làm bài.')
                key = doc_get('quizKeys', p[1])
                if not key:
                    raise ApiError(409, 'quiz-no-key', 'Đề chưa có khóa đáp án.')
                norm, correct, total, score = grade_quiz(quiz, key, b.get('answers'))
                now = time.time()
                result = {'uid': u['uid'], 'quizId': quiz['id'], 'subjectId': quiz.get('subjectId'), 'answers': norm,
                          'score': score, 'correct': correct, 'total': total,
                          'submittedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(now))}
                try:     # khóa chính (col, id) bảo đảm mỗi sinh viên chỉ nộp một lần
                    db().execute('INSERT INTO docs VALUES (?,?,?)', ('quizResults', f'{p[1]}_{u["uid"]}', json.dumps(result, ensure_ascii=False)))
                except sqlite3.IntegrityError:
                    raise ApiError(409, 'already-submitted', 'Bạn đã nộp bài này rồi.')
                act = doc_get('activities', u['uid']) or {}       # bản sao cho Bảng điểm / Báo cáo lớp (V4 sẽ chặn client tự ghi)
                events = list(act.get('events') or [])
                events.append({'type': 'quiz', 'at': time.strftime('%Y-%m-%d', time.gmtime(now)), 'subjectId': quiz.get('subjectId'),
                               'refId': quiz['id'], 'refTitle': str(quiz.get('title', ''))[:500], 'score': score, 'total': total, 'correct': correct})
                doc_put('activities', u['uid'], {**act, 'uid': u['uid'], 'name': prof.get('name', ''), 'username': u['username'],
                                                 'events': events[-ACTIVITY_MAX_EVENTS:]})
                return self.send(200, {'quizId': quiz['id'], 'score': score, 'correct': correct, 'total': total,
                                       'submittedAt': result['submittedAt']})
            raise ApiError(404, 'not-found', 'Không tìm thấy.')

        # ── tải bài nộp về: chỉ người nộp và nhân viên (nginx chuyển /uploads/submissions/* về đây) ──
        if len(p) == 3 and p[:2] == ['files', 'submissions'] and method == 'GET':
            u = self.need_user()
            stored = p[2]
            if not SUBMISSION_NAME.fullmatch(stored):
                raise ApiError(404, 'not-found', 'Không tìm thấy.')
            owner = db().execute('SELECT uid FROM submission_files WHERE stored=?', (stored,)).fetchone()
            if role_of(u) not in STAFF and not (owner and owner[0] == u['uid']):
                raise ApiError(403, 'permission-denied', 'Bạn không có quyền xem bài nộp này.')
            path = os.path.join(UPLOAD_DIR, 'submissions', stored)
            if not os.path.isfile(path):
                raise ApiError(404, 'not-found', 'Không tìm thấy.')
            with open(path, 'rb') as f:
                data = f.read()
            ext = stored.rsplit('.', 1)[-1].lower()
            inline = ext in ('pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp')
            self.send_response(200)
            self.send_header('Content-Type', INLINE_TYPES.get(ext, 'application/octet-stream'))
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Content-Disposition', ('inline' if inline else 'attachment') + f'; filename="{stored}"')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Cache-Control', 'private, no-store')
            self.end_headers()
            self.wfile.write(data)
            return

        # ── tải file lên ──
        if p == ['upload'] and method == 'POST':
            u = self.need_user()
            role = role_of(u)
            name = (q.get('filename') or ['file'])[0]
            ext = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
            hw_id = (q.get('hw') or [''])[0]
            sub_dir, limit = '', MAX_UPLOAD
            if hw_id:      # sinh viên nộp bài: chỉ nhận đúng định dạng giáo viên đã chọn
                if role != 'student':
                    raise ApiError(403, 'permission-denied', 'Chỉ sinh viên nộp bài bằng cách này.')
                hw = next((h for h in (doc_get('sharedData', 'global') or {}).get('homeworks', []) if str(h.get('id')) == hw_id), None)
                if not hw or hw.get('allowSubmit') is False:
                    raise ApiError(400, 'no-submit', 'Bài tập này không nhận bài nộp.')
                prof = doc_get('user', u['uid']) or {}
                if prof.get('subjectIds') is not None and hw.get('subjectId') not in prof['subjectIds']:
                    raise ApiError(403, 'permission-denied', 'Bạn không học môn này.')
                allowed = [x.lower().lstrip('.') for x in (hw.get('allowedExts') or SUBMIT_DEFAULT)]
                allowed = [x for x in allowed if x in SUBMIT_EXTS]
                if ext not in allowed:
                    raise ApiError(400, 'bad-file-type', 'Bài tập này chỉ nhận file: ' + ', '.join('.' + x for x in allowed))
                sub_dir, limit = 'submissions', MAX_SUBMIT
            elif role not in STAFF:
                raise ApiError(403, 'permission-denied', 'Chỉ quản trị viên / giáo viên được tải file lên.')
            elif ext not in UPLOAD_EXTS:
                raise ApiError(400, 'bad-file-type', 'Định dạng file không được hỗ trợ.')
            data = self.body(limit)
            if not data:
                raise ApiError(400, 'empty', 'File rỗng.')
            sig = MAGIC.get(ext)
            if hw_id and sig and not data.startswith(sig):
                raise ApiError(400, 'bad-file-content', f'Nội dung file không đúng định dạng .{ext}.')
            stem = re.sub(r'[^A-Za-z0-9._-]+', '_', name.rsplit('.', 1)[0])[:60] or 'file'
            stored = f'{secrets.token_hex(8)}_{stem}.{ext}'
            folder = os.path.join(UPLOAD_DIR, sub_dir)
            os.makedirs(folder, mode=0o755, exist_ok=True)
            with open(os.path.join(folder, stored), 'wb') as f:
                f.write(data)
            os.chmod(os.path.join(folder, stored), 0o644)
            if sub_dir:    # ghi người nộp để chỉ họ và nhân viên mới tải lại được
                db().execute('INSERT INTO submission_files VALUES (?,?,?,?)', (stored, u['uid'], hw_id, time.time()))
            rel = f'{sub_dir}/{stored}' if sub_dir else stored
            return self.send(200, {'url': f'/uploads/{rel}', 'name': name, 'size': len(data)})

        raise ApiError(404, 'not-found', 'Không tìm thấy.')


def cli(argv):
    if argv[1:2] == ['serve'] or len(argv) == 1:
        db()
        srv = ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
        print(f'StudyTask API tại 127.0.0.1:{PORT}, dữ liệu: {DATA_DIR}', flush=True)
        srv.serve_forever()
    elif argv[1] == 'create-user':
        _, _, username, pw, role, name = argv
        print(create_account(username, pw, {'name': name, 'role': role, 'subjectIds': [], 'phone': '',
                                         'createdAt': time.strftime('%Y-%m-%d')}))
    elif argv[1] == 'set-password':
        r = db().execute('SELECT uid FROM accounts WHERE username=?', (norm_user(argv[2]),)).fetchone()
        set_password(r[0], argv[3]); print('OK')
    elif argv[1] == 'delete-user':
        r = db().execute('SELECT uid FROM accounts WHERE username=?', (norm_user(argv[2]),)).fetchone()
        for t in ('accounts', 'sessions'):
            db().execute(f'DELETE FROM {t} WHERE uid=?', (r[0],))
        for col in ('user', 'userData', 'activities'):
            db().execute('DELETE FROM docs WHERE col=? AND id=?', (col, r[0]))
        drop_quiz_results(r[0])
        print('OK')
    elif argv[1:2] == ['mail-config']:
        import getpass
        host, port, user, sender = argv[2:6]
        pw = getpass.getpass('Mật khẩu SMTP (ẩn khi gõ; với Gmail dùng "mật khẩu ứng dụng"): ')
        with open(MAIL_CFG, 'w', encoding='utf-8') as f:
            json.dump({'host': host, 'port': int(port), 'user': user, 'password': pw, 'from': sender}, f)
        os.chmod(MAIL_CFG, 0o600)
        print('Đã lưu', MAIL_CFG)
    elif argv[1:2] == ['mail-test']:
        os.environ.pop('STUDYTASK_MAIL_DEBUG', None)
        mail_send(argv[2], 'StudyTask – thử gửi email', 'Nếu bạn nhận được thư này, cấu hình gửi email đã hoạt động.')
        time.sleep(6)
        print('Đã gửi (xem lỗi, nếu có, ở dòng MAIL-ERROR phía trên).')
    else:
        print(__doc__)


if __name__ == '__main__':
    cli(sys.argv)
