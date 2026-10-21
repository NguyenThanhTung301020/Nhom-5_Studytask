// scripts/seed-emulator.mjs – Nạp tài khoản demo (admin, giáo viên, sinh viên, Phòng Đào tạo, Phòng Tài chính) và dữ liệu mẫu vào Firebase Emulator
// Chạy khi emulator đang bật:  npm run emulators   (cửa sổ 1)  →  npm run seed   (cửa sổ 2)
// Chỉ gọi tới 127.0.0.1 với project demo-studytask, không bao giờ chạm production.
import { DEMO_ACCOUNTS, SAMPLE_SUBJECTS, SAMPLE_DEADLINES, SAMPLE_HOMEWORKS, SAMPLE_QUIZZES, SAMPLE_MATERIALS,
         SAMPLE_SCHEDULE, SAMPLE_EXAMS, SAMPLE_NEWS, SAMPLE_FORMS, SAMPLE_CURRICULUM, relDate } from '../utils/constants.js'

const PROJECT   = 'demo-studytask'
const AUTH      = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1'
const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`

// Chuyển giá trị JS sang định dạng field của Firestore REST API
const toValue = (v) =>
  v === null                ? { nullValue: null }
  : Array.isArray(v)        ? { arrayValue: { values: v.map(toValue) } }
  : typeof v === 'number'   ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v })
  : typeof v === 'boolean'  ? { booleanValue: v }
  : typeof v === 'object'   ? { mapValue: { fields: toFields(v) } }
  :                           { stringValue: String(v) }
const toFields = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, toValue(v)]))

async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json()
  return { ok: res.ok, json }
}

// Tạo tài khoản; nếu đã có thì đăng nhập để lấy uid
async function ensureAuthUser(email, password) {
  const r = await post(`${AUTH}/accounts:signUp?key=demo-key`, { email, password, returnSecureToken: true })
  if (r.ok) return r.json.localId
  if (r.json?.error?.message === 'EMAIL_EXISTS') {
    const s = await post(`${AUTH}/accounts:signInWithPassword?key=demo-key`, { email, password, returnSecureToken: true })
    if (s.ok) return s.json.localId
  }
  throw new Error(`${email}: ${JSON.stringify(r.json?.error || r.json)}`)
}

// "Bearer owner" = quyền quản trị của emulator, bỏ qua Security Rules
async function writeDoc(path, data) {
  const res = await fetch(`${FIRESTORE}/${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ fields: toFields(data) }),
  })
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
}

try {
  for (const acc of DEMO_ACCOUNTS) {
    const uid = await ensureAuthUser(acc.email, acc.password)
    await writeDoc(`user/${uid}`, {
      email: acc.email, name: acc.name, role: acc.role,
      ...(acc.subjectIds ? { subjectIds: acc.subjectIds } : {}),
      phone: '', createdAt: new Date().toISOString().split('T')[0],
    })
    await writeDoc(`userSecrets/${uid}`, { password: acc.password, updatedAt: new Date().toISOString() })
    console.log(`✔ ${acc.role.padEnd(8)} ${acc.email} / ${acc.password}  (uid ${uid})`)
  }
  // Dữ liệu dùng chung + dữ liệu mẫu cho các trang mới (chỉ trên Emulator)
  await writeDoc('sharedData/global', {
    subjects: SAMPLE_SUBJECTS, deadlines: SAMPLE_DEADLINES, homeworks: SAMPLE_HOMEWORKS, quizzes: SAMPLE_QUIZZES,
    materials: SAMPLE_MATERIALS, schedule: SAMPLE_SCHEDULE, exams: SAMPLE_EXAMS, news: SAMPLE_NEWS, forms: SAMPLE_FORMS,
  })
  await writeDoc('financeConfig/current', { semester: 'HK1 2026–2027', pricePerCredit: 500000, practicePricePerCredit: 650000,
    dueDate: relDate(5), reminderDays: [14, 7, 3, 1], note: 'Chuyển khoản: STK 0123456789 – Ngân hàng ABC, nội dung: MSSV + Họ tên' })
  await writeDoc('curriculum/ktpm-2024', SAMPLE_CURRICULUM)
  await writeDoc('theses/t-demo-1', { title: 'Xây dựng website quản lý deadline học tập cho sinh viên', studentName: 'Trần Minh Khoa',
    studentId: '2021001234', advisor: 'TS. Nguyễn Văn An', major: 'Kỹ thuật phần mềm', year: 2026, defenseDate: relDate(-30),
    council: 'Hội đồng 1 – Khoa CNTT', score: 8.7, keywords: ['React', 'Firebase', 'quản lý học tập'],
    abstract: 'Khóa luận xây dựng hệ thống giúp sinh viên theo dõi deadline, lịch học, lịch thi và kết quả học tập; phân quyền theo vai trò.',
    fileUrl: 'https://example.com/khoa-luan.pdf', publishedBy: 'Phòng Đào tạo', publishedAt: new Date().toISOString() })
  console.log('✔ dữ liệu chung, học phí, chương trình đào tạo, khóa luận mẫu')
  console.log('\nXong. Mở http://127.0.0.1:5500 để đăng nhập; xem dữ liệu ở http://127.0.0.1:4000')
} catch (e) {
  console.error('Seed lỗi:', e.message)
  console.error('Emulator đã chạy chưa? (npm run emulators)')
  process.exit(1)
}
