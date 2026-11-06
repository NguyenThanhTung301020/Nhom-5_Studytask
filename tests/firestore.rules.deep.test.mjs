// tests/firestore.rules.deep.test.mjs – Kiểm thử chuyên sâu Firestore Security Rules
// Bổ sung cho firestore.rules.test.mjs: ma trận vai trò × thao tác, mặc định từ chối,
// token giả, tài khoản mất hồ sơ, ca biên, và các rủi ro còn tồn tại (ghi lại hiện trạng).
// Mỗi ca "bị chặn" đều đi kèm ca "được phép" cùng đường dẫn để chắc chắn bị chặn là do rules,
// không phải do dữ liệu nền sai.
// Chạy: npm run test:rules:deep
import { test, before, after, beforeEach, describe } from 'node:test'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, deleteField, arrayUnion } from 'firebase/firestore'

let env
// emulators:exec đặt FIRESTORE_EMULATOR_HOST; mặc định cổng 8080 như npm run emulators
const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':')

const ADMIN    = { uid: 'admin1',    email: 'admin@studytask.vn' }
const TEACHER  = { uid: 'teacher1',  email: 'teacher@studytask.vn' }   // dạy môn 1, 2
const TEACHER2 = { uid: 'teacher2',  email: 'teacher2@studytask.vn' }  // giáo viên chưa được phân môn
const STUDENT  = { uid: 'student1',  email: 'student@studytask.vn' }
const OTHER    = { uid: 'student2',  email: 'student2@studytask.vn' }
const TRAINING = { uid: 'training1', email: 'daotao@studytask.vn' }
const FINANCE  = { uid: 'finance1',  email: 'taichinh@studytask.vn' }
const NEW      = { uid: 'student3',  email: 'student3@studytask.vn' }
const GHOST    = { uid: 'ghost1',    email: 'ghost@studytask.vn' }      // đã đăng nhập nhưng không có hồ sơ
const ANON     = null

// Sự kiện nhật ký đúng khuôn, giống dữ liệu do trackActivity trong app.js ghi
const EV_MATERIAL = { type: 'material', subjectId: 1, refId: 11, refTitle: 'Giáo trình', at: '2026-11-01' }
const EV_QUIZ     = { type: 'quiz', subjectId: 1, refId: 'q1', refTitle: 'Quiz', score: 8.5, total: 4, correct: 3, at: '2026-11-02' }
const EV_HOMEWORK = { type: 'homework', subjectId: 1, refId: 5, refTitle: 'Bài 1', url: 'https://x.vn/a.pdf', fileName: 'a.pdf', note: 'Em nộp', at: '2026-11-03' }
const LOG = { uid: STUDENT.uid, name: 'Sinh viên', username: 'student', events: [EV_MATERIAL] }

// Cấp hồ sơ sinh viên cho u (ghi bỏ qua rules) – để ca "bị chặn" thật sự bị chặn bởi rules phiếu, không phải vì thiếu hồ sơ
const giveStudentProfile = (u) => env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), 'user', u.uid), { email: u.email, name: u.uid, role: 'student' })
})

const as = (u, claims = {}) =>
  u ? env.authenticatedContext(u.uid, { email: u.email, ...claims }).firestore()
    : env.unauthenticatedContext().firestore()
const who = (u) => (u ? u.uid : 'chưa đăng nhập')

const get  = (db, path) => getDoc(doc(db, ...path))
const put  = (db, path, data, opts) => setDoc(doc(db, ...path), data, opts)
const upd  = (db, path, data) => updateDoc(doc(db, ...path), data)
const del  = (db, path) => deleteDoc(doc(db, ...path))

async function seedBase() {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'user', ADMIN.uid),    { email: ADMIN.email,    name: 'Quản trị viên', role: 'admin' })
    await setDoc(doc(db, 'user', TEACHER.uid),  { email: TEACHER.email,  name: 'Giáo viên',     role: 'teacher', subjectIds: [1, 2] })
    await setDoc(doc(db, 'user', TEACHER2.uid), { email: TEACHER2.email, name: 'Giáo viên 2',   role: 'teacher' })
    await setDoc(doc(db, 'user', STUDENT.uid),  { email: STUDENT.email,  name: 'Sinh viên',     role: 'student', subjectIds: [1], phone: '', password: 'legacy123', expiresAt: '2027-01-01' })
    await setDoc(doc(db, 'user', OTHER.uid),    { email: OTHER.email,    name: 'Sinh viên 2',   role: 'student', subjectIds: [2] })
    await setDoc(doc(db, 'user', TRAINING.uid), { email: TRAINING.email, name: 'Phòng Đào tạo', role: 'training' })
    await setDoc(doc(db, 'user', FINANCE.uid),  { email: FINANCE.email,  name: 'Phòng Tài chính', role: 'finance' })
    await setDoc(doc(db, 'userSecrets', STUDENT.uid), { password: 'student123', updatedAt: '2026-10-15' })
    await setDoc(doc(db, 'userData', STUDENT.uid),    { profile: { name: 'A' } })
    await setDoc(doc(db, 'sharedData', 'global'),     { subjects: [] })
    await setDoc(doc(db, 'gradingPolicies', '1'),     { preset: 'L2' })
    await setDoc(doc(db, 'gradingColumns', '1'),      { counted: {} })
    await setDoc(doc(db, 'financeConfig', 'current'), { pricePerCredit: 500000 })
    await setDoc(doc(db, 'tuition', STUDENT.uid),     { payments: [{ amount: 1000000, date: '2026-10-01' }] })
    await setDoc(doc(db, 'curriculum', 'ktpm'),       { name: 'KTPM' })
    await setDoc(doc(db, 'theses', 't1'),             { title: 'Khóa luận A' })
    await setDoc(doc(db, 'activities', STUDENT.uid),  LOG)
    await setDoc(doc(db, 'graduationApps', STUDENT.uid), { status: 'submitted', credits: 120 })
    await setDoc(doc(db, 'graduationApps', OTHER.uid),   { status: 'approved', review: 'OK', reviewedBy: 'training1' })
  })
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-studytask',
    firestore: { rules: readFileSync(process.env.RULES_FILE ?? 'firestore.rules', 'utf8'), host, port: Number(port) },
  })
})
after(async () => { await env?.cleanup() })
beforeEach(seedBase)

// Chạy op cho từng người: nhóm `deny` phải bị PERMISSION_DENIED, nhóm `allow` phải thành công.
// Dữ liệu nền được dựng lại trước mỗi người để thao tác xóa/ghi của người trước không ảnh hưởng người sau.
function matrix(name, op, { allow = [], deny = [] }) {
  test(name, async () => {
    for (const u of deny) {
      await seedBase()
      await assertFails(op(as(u))).catch((e) => { throw new Error(`[${who(u)}] phải bị chặn nhưng: ${e.message}`) })
    }
    for (const u of allow) {
      await seedBase()
      await assertSucceeds(op(as(u))).catch((e) => { throw new Error(`[${who(u)}] phải được phép nhưng: ${e.message}`) })
    }
  })
}

const EVERYONE = [ADMIN, TEACHER, TEACHER2, STUDENT, OTHER, TRAINING, FINANCE]
const except = (...us) => EVERYONE.filter((u) => !us.includes(u))

// ───────────────────────────────────────────────────────────────
describe('Mặc định từ chối', () => {
  test('collection không khai báo: kể cả admin cũng không đọc/ghi được', async () => {
    for (const u of [ADMIN, STUDENT, ANON]) {
      await assertFails(get(as(u), ['khongTonTai', 'x']))
      await assertFails(put(as(u), ['khongTonTai', 'x'], { a: 1 }))
    }
  })
  test('chưa đăng nhập: không ĐỌC được collection nào', async () => {
    const paths = [['user', STUDENT.uid], ['userSecrets', STUDENT.uid], ['userData', STUDENT.uid], ['sharedData', 'global'],
      ['gradingPolicies', '1'], ['gradingColumns', '1'], ['financeConfig', 'current'], ['tuition', STUDENT.uid],
      ['curriculum', 'ktpm'], ['graduationApps', STUDENT.uid], ['theses', 't1'], ['activities', STUDENT.uid]]
    for (const p of paths) await assertFails(get(as(ANON), p)).catch((e) => { throw new Error(`${p.join('/')}: ${e.message}`) })
  })
  test('chưa đăng nhập: không GHI/XÓA collection nào', async () => {
    const paths = [['user', NEW.uid], ['userSecrets', NEW.uid], ['userData', NEW.uid], ['sharedData', 'global'],
      ['gradingPolicies', '1'], ['gradingColumns', '1'], ['financeConfig', 'current'], ['tuition', NEW.uid],
      ['curriculum', 'ktpm'], ['graduationApps', NEW.uid], ['theses', 't1'], ['activities', NEW.uid]]
    for (const p of paths) {
      await assertFails(put(as(ANON), p, { status: 'submitted', role: 'student', name: 'x', email: NEW.email })).catch((e) => { throw new Error(`ghi ${p.join('/')}: ${e.message}`) })
      await assertFails(del(as(ANON), p)).catch((e) => { throw new Error(`xóa ${p.join('/')}: ${e.message}`) })
    }
  })
})

// ───────────────────────────────────────────────────────────────
describe('Vai trò lấy từ hồ sơ, không tin token / không tin tài khoản mất hồ sơ', () => {
  test('token tự khai role=admin nhưng hồ sơ là sinh viên: vẫn không có quyền', async () => {
    const spoof = as(STUDENT, { role: 'admin', admin: true })
    await assertFails(put(spoof, ['theses', 't9'], { title: 'x' }))
    await assertFails(upd(spoof, ['user', OTHER.uid], { name: 'Hacked' }))
    await assertFails(get(spoof, ['userSecrets', STUDENT.uid]))
    await assertFails(put(spoof, ['financeConfig', 'current'], { pricePerCredit: 1 }))
    // đối chứng: admin thật cùng thao tác thì được
    await assertSucceeds(put(as(ADMIN), ['theses', 't9'], { title: 'x' }))
  })
  test('đã đăng nhập nhưng KHÔNG có hồ sơ (GHOST): không ghi được gì có kiểm vai trò', async () => {
    const g = as(GHOST)
    await assertFails(put(g, ['theses', 't9'], { title: 'x' }))
    await assertFails(put(g, ['sharedData', 'global'], { subjects: [] }, { merge: true }))
    await assertFails(put(g, ['gradingPolicies', '1'], { preset: 'x' }))
    await assertFails(put(g, ['financeConfig', 'current'], { pricePerCredit: 1 }))
    await assertFails(get(g, ['userSecrets', STUDENT.uid]))
    await assertFails(put(g, ['graduationApps', GHOST.uid], { status: 'submitted' }))
  })
  test('GHOST vẫn tự tạo được hồ sơ sinh viên tối thiểu (luồng đăng nhập lần đầu)', async () => {
    await assertSucceeds(put(as(GHOST), ['user', GHOST.uid], { name: 'ghost', email: GHOST.email, role: 'student' }))
  })
  test('admin bị xóa hồ sơ thì mất quyền admin ngay', async () => {
    await assertSucceeds(put(as(ADMIN), ['theses', 't9'], { title: 'x' }))
    await env.withSecurityRulesDisabled(async (ctx) => { await deleteDoc(doc(ctx.firestore(), 'user', ADMIN.uid)) })
    await assertFails(put(as(ADMIN), ['theses', 't9'], { title: 'y' }))
    await assertFails(get(as(ADMIN), ['userSecrets', STUDENT.uid]))
  })
  test('đổi role trong hồ sơ có hiệu lực ngay: giáo viên bị hạ xuống sinh viên mất quyền ghi', async () => {
    await assertSucceeds(put(as(TEACHER), ['sharedData', 'global'], { subjects: [1] }, { merge: true }))
    await env.withSecurityRulesDisabled(async (ctx) => { await updateDoc(doc(ctx.firestore(), 'user', TEACHER.uid), { role: 'student' }) })
    await assertFails(put(as(TEACHER), ['sharedData', 'global'], { subjects: [2] }, { merge: true }))
  })
})

// ───────────────────────────────────────────────────────────────
describe('user/{uid} – ca biên', () => {
  test('tạo hồ sơ: email KHÔNG khớp token bị chặn; khớp thì được', async () => {
    await assertFails(put(as(NEW), ['user', NEW.uid], { name: 'x', email: 'khac@x.vn', role: 'student' }))
    await assertSucceeds(put(as(NEW), ['user', NEW.uid], { name: 'x', email: NEW.email, role: 'student' }))
  })
  test('tạo hồ sơ: thiếu role / thừa trường (phone, expiresAt, password) bị chặn', async () => {
    await assertFails(put(as(NEW), ['user', NEW.uid], { name: 'x', email: NEW.email }))
    for (const extra of [{ phone: '0901' }, { expiresAt: '2099-01-01' }, { password: 'abc' }, { createdAt: 1 }])
      await assertFails(put(as(NEW), ['user', NEW.uid], { name: 'x', email: NEW.email, role: 'student', ...extra }))
  })
  test('tạo hồ sơ thay người khác (uid khác) bị chặn', async () => {
    await assertFails(put(as(NEW), ['user', 'someone-else'], { name: 'x', email: NEW.email, role: 'student' }))
  })
  test('admin tạo được hồ sơ giáo viên kèm subjectIds, hạn tài khoản', async () => {
    await assertSucceeds(put(as(ADMIN), ['user', 'tNew'], { name: 'GV mới', email: 'gv@x.vn', role: 'teacher', subjectIds: [3], expiresAt: '2027-01-01' }))
  })
  test('sửa tên: dài 1 hoặc đúng 100 ký tự được; rỗng, 101 ký tự hoặc không phải chuỗi bị chặn', async () => {
    await assertSucceeds(upd(as(STUDENT), ['user', STUDENT.uid], { name: 'a' }))
    await assertFails(upd(as(STUDENT), ['user', STUDENT.uid], { name: '' }))
    await assertSucceeds(upd(as(STUDENT), ['user', STUDENT.uid], { name: 'a'.repeat(100) }))
    await assertFails(upd(as(STUDENT), ['user', STUDENT.uid], { name: 'a'.repeat(101) }))
    await assertFails(upd(as(STUDENT), ['user', STUDENT.uid], { name: 12345 }))
    await assertFails(upd(as(STUDENT), ['user', STUDENT.uid], { name: null }))
  })
  test('tạo hồ sơ: tên thiếu, rỗng, sai kiểu hoặc quá 100 ký tự bị chặn; đúng 100 ký tự được', async () => {
    for (const name of ['', ['x'], 123, 'a'.repeat(101)])
      await assertFails(put(as(NEW), ['user', NEW.uid], { name, email: NEW.email, role: 'student' })).catch((e) => { throw new Error(`${JSON.stringify(name)}: ${e.message}`) })
    await assertFails(put(as(NEW), ['user', NEW.uid], { email: NEW.email, role: 'student' }))
    await assertSucceeds(put(as(NEW), ['user', NEW.uid], { name: 'a'.repeat(100), email: NEW.email, role: 'student' }))
  })
  test('sửa tên: kiểu danh sách bị chặn (size() của danh sách vẫn chạy nên phải kiểm kiểu)', async () => {
    await assertFails(upd(as(STUDENT), ['user', STUDENT.uid], { name: ['x'] }))
  })
  test('phone: chỉ nhận chuỗi số điện thoại tối đa 20 ký tự', async () => {
    for (const phone of [123, { a: 1 }, ['0901'], 'x'.repeat(5000), 'abc', '1'.repeat(21)])
      await assertFails(upd(as(STUDENT), ['user', STUDENT.uid], { phone })).catch((e) => { throw new Error(`${JSON.stringify(phone)}: ${e.message}`) })
    for (const phone of ['', '0901234567', '+84 (90) 123-45.67', '1'.repeat(20)])
      await assertSucceeds(upd(as(STUDENT), ['user', STUDENT.uid], { phone }))
  })
  test('hồ sơ chưa có phone vẫn sửa được tên', async () => {
    await assertSucceeds(upd(as(OTHER), ['user', OTHER.uid], { name: 'Tên mới' }))
  })
  test('chủ tài khoản KHÔNG xóa được trường role / expiresAt / subjectIds, KHÔNG đổi email, KHÔNG sửa createdAt', async () => {
    for (const f of ['role', 'expiresAt', 'subjectIds'])
      await assertFails(upd(as(STUDENT), ['user', STUDENT.uid], { [f]: deleteField() }))
    await assertFails(upd(as(STUDENT), ['user', STUDENT.uid], { email: 'new@x.vn' }))
    await assertFails(upd(as(STUDENT), ['user', STUDENT.uid], { createdAt: 1 }))
  })
  test('sửa kèm phone hợp lệ + 1 trường cấm trong CÙNG lần ghi vẫn bị chặn (không lọt từng phần)', async () => {
    await assertFails(upd(as(STUDENT), ['user', STUDENT.uid], { name: 'Hợp lệ', phone: '0901', role: 'admin' }))
    await assertFails(upd(as(STUDENT), ['user', STUDENT.uid], { name: 'Hợp lệ', subjectIds: [9] }))
  })
  test('vai trò đặc biệt cũng KHÔNG tự nâng quyền / tự thêm môn của chính mình', async () => {
    await assertFails(upd(as(TEACHER),  ['user', TEACHER.uid],  { role: 'admin' }))
    await assertFails(upd(as(TEACHER),  ['user', TEACHER.uid],  { subjectIds: [1, 2, 3, 4] }))
    await assertFails(upd(as(TRAINING), ['user', TRAINING.uid], { role: 'admin' }))
    await assertFails(upd(as(FINANCE),  ['user', FINANCE.uid],  { role: 'admin' }))
  })
  matrix('sửa hồ sơ người khác: chỉ admin được (giáo viên/đào tạo/tài chính/sinh viên khác bị chặn)',
    (db) => upd(db, ['user', STUDENT.uid], { name: 'Đổi tên' }),
    { allow: [ADMIN], deny: [TEACHER, TRAINING, FINANCE, OTHER, ANON] })
  matrix('xóa hồ sơ: chỉ admin được',
    (db) => del(db, ['user', STUDENT.uid]),
    { allow: [ADMIN], deny: [TEACHER, TRAINING, FINANCE, OTHER, STUDENT, ANON] })
  matrix('đọc hồ sơ: mọi người đã đăng nhập đọc được, chưa đăng nhập thì không',
    (db) => get(db, ['user', STUDENT.uid]),
    { allow: EVERYONE, deny: [ANON] })
})

// ───────────────────────────────────────────────────────────────
describe('userSecrets – ma trận', () => {
  matrix('đọc: chỉ admin', (db) => get(db, ['userSecrets', STUDENT.uid]),
    { allow: [ADMIN], deny: [STUDENT, OTHER, TEACHER, TRAINING, FINANCE, ANON] })
  matrix('xóa: chỉ admin (chủ tài khoản không xóa được)', (db) => del(db, ['userSecrets', STUDENT.uid]),
    { allow: [ADMIN], deny: [STUDENT, OTHER, TEACHER, TRAINING, FINANCE, ANON] })
  matrix('ghi vào mật khẩu của sinh viên 1: chỉ admin hoặc chính sinh viên 1',
    (db) => put(db, ['userSecrets', STUDENT.uid], { password: 'moi', updatedAt: 'x' }),
    { allow: [ADMIN, STUDENT], deny: [OTHER, TEACHER, TRAINING, FINANCE, ANON] })
  test('chủ tài khoản: thiếu password / password không phải chuỗi / thừa trường đều bị chặn', async () => {
    const db = as(STUDENT)
    await assertFails(put(db, ['userSecrets', STUDENT.uid], { updatedAt: 'x' }))
    await assertFails(put(db, ['userSecrets', STUDENT.uid], { password: 123456, updatedAt: 'x' }))
    await assertFails(put(db, ['userSecrets', STUDENT.uid], { password: 'a', updatedAt: 'x', role: 'admin' }))
    await assertSucceeds(put(db, ['userSecrets', STUDENT.uid], { password: 'a', updatedAt: 'x' }))
  })
  test('chủ tài khoản: mật khẩu rỗng, danh sách, quá 128 ký tự; updatedAt thiếu hoặc sai kiểu đều bị chặn', async () => {
    const db = as(STUDENT)
    for (const password of ['', ['a'], 'a'.repeat(129)])
      await assertFails(put(db, ['userSecrets', STUDENT.uid], { password, updatedAt: 'x' })).catch((e) => { throw new Error(`${JSON.stringify(password)}: ${e.message}`) })
    await assertFails(put(db, ['userSecrets', STUDENT.uid], { password: 'a' }))
    await assertFails(put(db, ['userSecrets', STUDENT.uid], { password: 'a', updatedAt: 1 }))
    await assertSucceeds(put(db, ['userSecrets', STUDENT.uid], { password: 'a'.repeat(128), updatedAt: 'x' }))
  })
})

// ───────────────────────────────────────────────────────────────
describe('userData / sharedData – ma trận', () => {
  matrix('userData đọc: chủ + admin', (db) => get(db, ['userData', STUDENT.uid]),
    { allow: [STUDENT, ADMIN], deny: [OTHER, TEACHER, TRAINING, FINANCE, ANON] })
  matrix('userData ghi: chủ + admin', (db) => put(db, ['userData', STUDENT.uid], { profile: { name: 'B' } }),
    { allow: [STUDENT, ADMIN], deny: [OTHER, TEACHER, TRAINING, FINANCE, ANON] })
  matrix('userData xóa: chủ + admin', (db) => del(db, ['userData', STUDENT.uid]),
    { allow: [STUDENT, ADMIN], deny: [OTHER, TEACHER, TRAINING, FINANCE, ANON] })
  test('userData chủ tài khoản: đủ 5 trường đúng kiểu thì được', async () => {
    await assertSucceeds(put(as(STUDENT), ['userData', STUDENT.uid],
      { profile: {}, homeworkSubs: {}, submissions: [], library: [], contacts: [] }))
    await assertSucceeds(put(as(NEW), ['userData', NEW.uid], { contacts: [] }))
  })
  test('userData chủ tài khoản: từng trường sai kiểu, hoặc trường lạ, đều bị chặn', async () => {
    const bad = [{ profile: 'x' }, { homeworkSubs: [] }, { submissions: {} }, { library: {} }, { contacts: {} }, { role: 'admin' }]
    for (const data of bad) {
      await assertFails(put(as(STUDENT), ['userData', STUDENT.uid], data, { merge: true })).catch((e) => { throw new Error(`sửa ${JSON.stringify(data)}: ${e.message}`) })
      await assertFails(put(as(NEW), ['userData', NEW.uid], data)).catch((e) => { throw new Error(`tạo ${JSON.stringify(data)}: ${e.message}`) })
    }
  })
  test('userData: admin không bị giới hạn khuôn dữ liệu (ghi để quản lý)', async () => {
    await assertSucceeds(put(as(ADMIN), ['userData', STUDENT.uid], { ghiChuQuanTri: 1 }))
    await assertSucceeds(put(as(ADMIN), ['userData', NEW.uid], { ghiChuQuanTri: 1 }))
  })
  matrix('sharedData ghi: admin, giáo viên, đào tạo', (db) => put(db, ['sharedData', 'global'], { x: 1 }, { merge: true }),
    { allow: [ADMIN, TEACHER, TEACHER2, TRAINING], deny: [STUDENT, OTHER, FINANCE, ANON] })
  matrix('sharedData xóa: admin, giáo viên, đào tạo', (db) => del(db, ['sharedData', 'global']),
    { allow: [ADMIN, TEACHER, TRAINING], deny: [STUDENT, FINANCE, ANON] })
  matrix('sharedData đọc: mọi người đã đăng nhập', (db) => get(db, ['sharedData', 'global']),
    { allow: EVERYONE, deny: [ANON] })
})

// ───────────────────────────────────────────────────────────────
describe('Quy chế điểm – ma trận', () => {
  matrix('gradingPolicies ghi: admin + đào tạo', (db) => put(db, ['gradingPolicies', '1'], { preset: 'L3' }),
    { allow: [ADMIN, TRAINING], deny: [TEACHER, TEACHER2, STUDENT, FINANCE, ANON] })
  matrix('gradingPolicies xóa: admin + đào tạo', (db) => del(db, ['gradingPolicies', '1']),
    { allow: [ADMIN, TRAINING], deny: [TEACHER, STUDENT, FINANCE, ANON] })
  matrix('gradingPolicies đọc: mọi người đã đăng nhập', (db) => get(db, ['gradingPolicies', '1']),
    { allow: EVERYONE, deny: [ANON] })
  matrix('gradingColumns môn 1: admin + giáo viên dạy môn 1', (db) => put(db, ['gradingColumns', '1'], { counted: { a: 1 } }),
    { allow: [ADMIN, TEACHER], deny: [TEACHER2, STUDENT, TRAINING, FINANCE, ANON] })
  matrix('gradingColumns môn 2: giáo viên dạy môn 1,2 được', (db) => put(db, ['gradingColumns', '2'], { counted: {} }),
    { allow: [ADMIN, TEACHER], deny: [TEACHER2, STUDENT, ANON] })
  matrix('gradingColumns môn 3 (không ai dạy): chỉ admin', (db) => put(db, ['gradingColumns', '3'], { counted: {} }),
    { allow: [ADMIN], deny: [TEACHER, TEACHER2, TRAINING, STUDENT, ANON] })
  test('giáo viên chỉ được phân môn 5 ghi được cột môn 5 nhưng KHÔNG ghi được cột môn 3 (không lẫn danh sách môn)', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => { await updateDoc(doc(ctx.firestore(), 'user', TEACHER2.uid), { subjectIds: [5] }) })
    await assertSucceeds(put(as(TEACHER2), ['gradingColumns', '5'], { counted: {} }))
    await assertFails(put(as(TEACHER2), ['gradingColumns', '3'], { counted: {} }))
  })
  matrix('gradingColumns id không phải số: giáo viên bị chặn (không lỗi âm thầm), admin được', (db) => put(db, ['gradingColumns', 'abc'], { counted: {} }),
    { allow: [ADMIN], deny: [TEACHER, TEACHER2] })
  matrix('gradingColumns xóa môn 1: admin + giáo viên dạy môn 1', (db) => del(db, ['gradingColumns', '1']),
    { allow: [ADMIN, TEACHER], deny: [TEACHER2, STUDENT, TRAINING, ANON] })
})

// ───────────────────────────────────────────────────────────────
describe('Học phí – ma trận', () => {
  matrix('financeConfig ghi: admin + tài chính', (db) => put(db, ['financeConfig', 'current'], { pricePerCredit: 1 }),
    { allow: [ADMIN, FINANCE], deny: [TEACHER, STUDENT, TRAINING, ANON] })
  matrix('financeConfig xóa: admin + tài chính', (db) => del(db, ['financeConfig', 'current']),
    { allow: [ADMIN, FINANCE], deny: [TEACHER, STUDENT, TRAINING, ANON] })
  matrix('financeConfig đọc: mọi người đã đăng nhập', (db) => get(db, ['financeConfig', 'current']),
    { allow: EVERYONE, deny: [ANON] })
  matrix('tuition của sinh viên 1 – đọc: chính sinh viên 1, admin, tài chính', (db) => get(db, ['tuition', STUDENT.uid]),
    { allow: [STUDENT, ADMIN, FINANCE], deny: [OTHER, TEACHER, TRAINING, ANON] })
  matrix('tuition – ghi: chỉ admin + tài chính (sinh viên chủ hồ sơ cũng không)', (db) => put(db, ['tuition', STUDENT.uid], { payments: [] }),
    { allow: [ADMIN, FINANCE], deny: [STUDENT, OTHER, TEACHER, TRAINING, ANON] })
  matrix('tuition – xóa: chỉ admin + tài chính', (db) => del(db, ['tuition', STUDENT.uid]),
    { allow: [ADMIN, FINANCE], deny: [STUDENT, OTHER, TEACHER, TRAINING, ANON] })
})

// ───────────────────────────────────────────────────────────────
describe('Chương trình đào tạo / Khóa luận – ma trận', () => {
  matrix('curriculum ghi: admin + đào tạo', (db) => put(db, ['curriculum', 'ktpm'], { name: 'B' }),
    { allow: [ADMIN, TRAINING], deny: [TEACHER, STUDENT, FINANCE, ANON] })
  matrix('curriculum xóa: admin + đào tạo', (db) => del(db, ['curriculum', 'ktpm']),
    { allow: [ADMIN, TRAINING], deny: [TEACHER, STUDENT, FINANCE, ANON] })
  matrix('curriculum đọc: mọi người đã đăng nhập', (db) => get(db, ['curriculum', 'ktpm']),
    { allow: EVERYONE, deny: [ANON] })
  matrix('theses ghi: admin + đào tạo', (db) => put(db, ['theses', 't1'], { title: 'B' }),
    { allow: [ADMIN, TRAINING], deny: [TEACHER, STUDENT, FINANCE, ANON] })
  matrix('theses xóa: admin + đào tạo', (db) => del(db, ['theses', 't1']),
    { allow: [ADMIN, TRAINING], deny: [TEACHER, STUDENT, FINANCE, ANON] })
  matrix('theses đọc: mọi người đã đăng nhập', (db) => get(db, ['theses', 't1']),
    { allow: EVERYONE, deny: [ANON] })
})

// ───────────────────────────────────────────────────────────────
describe('graduationApps – ca biên', () => {
  matrix('đọc phiếu của sinh viên 1: chính sinh viên 1, admin, đào tạo', (db) => get(db, ['graduationApps', STUDENT.uid]),
    { allow: [STUDENT, ADMIN, TRAINING], deny: [OTHER, TEACHER, FINANCE, ANON] })
  test('nộp mới: status khác "submitted" hoặc thiếu status hoặc kèm reviewedBy/reviewedAt đều bị chặn', async () => {
    await giveStudentProfile(NEW)
    const db = as(NEW)
    for (const bad of [{ status: 'needsFix' }, { status: 'approved' }, { status: 'rejected' }, {}, { credits: 1 },
      { status: 'submitted', review: 'x' }, { status: 'submitted', reviewedBy: 'x' }, { status: 'submitted', reviewedAt: 1 }])
      await assertFails(put(db, ['graduationApps', NEW.uid], bad)).catch((e) => { throw new Error(JSON.stringify(bad) + ': ' + e.message) })
    await assertSucceeds(put(db, ['graduationApps', NEW.uid], { status: 'submitted', credits: 100 }))
  })
  test('chỉ role "student" mới được nộp mới: giáo viên/đào tạo/tài chính/admin tự nộp phiếu của mình bị chặn', async () => {
    for (const u of [TEACHER, TRAINING, FINANCE, ADMIN])
      await assertFails(put(as(u), ['graduationApps', u.uid], { status: 'submitted' })).catch((e) => { throw new Error(`${u.uid}: ${e.message}`) })
  })
  test('sinh viên đang "submitted": đổi sang approved / đổi reviewedBy / thêm reviewedAt đều bị chặn, sửa nội dung thường thì được', async () => {
    const db = as(STUDENT)
    await assertFails(upd(db, ['graduationApps', STUDENT.uid], { status: 'approved' }))
    await assertFails(upd(db, ['graduationApps', STUDENT.uid], { status: 'needsFix' }))
    await assertFails(upd(db, ['graduationApps', STUDENT.uid], { reviewedBy: 'tao-tu-duyet' }))
    await assertFails(upd(db, ['graduationApps', STUDENT.uid], { reviewedAt: 1 }))
    await assertFails(upd(db, ['graduationApps', STUDENT.uid], { review: 'ok' }))
    await assertSucceeds(upd(db, ['graduationApps', STUDENT.uid], { credits: 125 }))
  })
  test('phiếu đã bị từ chối / đã duyệt: sinh viên không sửa, không xóa; sinh viên khác không đụng vào', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), 'graduationApps', STUDENT.uid), { status: 'rejected', review: 'Không đủ' }) })
    await assertFails(upd(as(STUDENT), ['graduationApps', STUDENT.uid], { status: 'submitted' }))
    await assertFails(del(as(STUDENT), ['graduationApps', STUDENT.uid]))
    await assertFails(del(as(OTHER), ['graduationApps', OTHER.uid]))              // đã approved
    await assertFails(upd(as(STUDENT), ['graduationApps', OTHER.uid], { status: 'submitted' }))
  })
  test('sinh viên xóa phiếu: chỉ khi đang "submitted"; đang "needsFix" thì không', async () => {
    await giveStudentProfile(NEW)
    await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), 'graduationApps', NEW.uid), { status: 'needsFix' }) })
    await assertFails(del(as(NEW), ['graduationApps', NEW.uid]))
    await assertSucceeds(del(as(STUDENT), ['graduationApps', STUDENT.uid]))
  })
  test('sinh viên khi "needsFix" nộp lại: xóa trường review bị chặn, giữ nguyên thì được', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), 'graduationApps', STUDENT.uid), { status: 'needsFix', review: 'Thiếu' }) })
    await assertFails(upd(as(STUDENT), ['graduationApps', STUDENT.uid], { status: 'submitted', review: deleteField() }))
    await assertSucceeds(upd(as(STUDENT), ['graduationApps', STUDENT.uid], { status: 'submitted', certs: { english: true } }))
  })
  describe('kiểm tra trường và kiểu dữ liệu khi sinh viên ghi', () => {
    const FULL = { uid: NEW.uid, status: 'submitted', name: 'A', studentId: '24TX1', className: 'K24', major: 'KTPM', faculty: 'CNTT',
      email: 'a@x.vn', phone: '0901', gpa: '3.2', credits: 120, round: 'Đợt 1', thesisTitle: 'Đề tài', certs: { english: true },
      evidence: 'https://x.vn', note: 'Ghi chú', pledge: true, selfCheck: [{ label: 'x', ok: true }], submittedAt: '2026-11-05T00:00:00.000Z' }
    const LIMITS = { name: 100, studentId: 32, className: 64, major: 100, faculty: 100, email: 254, phone: 20, gpa: 8, round: 64, thesisTitle: 500, evidence: 2000, note: 2000, submittedAt: 40 }
    test('phiếu đầy đủ như trang Tốt nghiệp gửi lên: được', async () => {
      await giveStudentProfile(NEW)
      await assertSucceeds(put(as(NEW), ['graduationApps', NEW.uid], FULL))
    })
    for (const [field, max] of Object.entries(LIMITS)) {
      test(`trường ${field}: danh sách hoặc dài hơn ${max} bị chặn, đúng ${max} ký tự được`, async () => {
        await giveStudentProfile(NEW)
        await assertFails(put(as(NEW), ['graduationApps', NEW.uid], { ...FULL, [field]: ['x'] }))
        await assertFails(put(as(NEW), ['graduationApps', NEW.uid], { ...FULL, [field]: 'a'.repeat(max + 1) }))
        await assertSucceeds(put(as(NEW), ['graduationApps', NEW.uid], { ...FULL, [field]: 'a'.repeat(max) }))
      })
    }
    test('credits, certs, pledge, selfCheck sai kiểu; credits ngoài 0–999 bị chặn; biên 0 và 999 được', async () => {
      await giveStudentProfile(NEW)
      for (const bad of [{ credits: '120' }, { credits: -1 }, { credits: 1000 }, { certs: true }, { pledge: 'có' }, { selfCheck: {} }])
        await assertFails(put(as(NEW), ['graduationApps', NEW.uid], { ...FULL, ...bad })).catch((e) => { throw new Error(`${JSON.stringify(bad)}: ${e.message}`) })
      await assertSucceeds(put(as(NEW), ['graduationApps', NEW.uid], { ...FULL, credits: 0 }))
      await assertSucceeds(put(as(NEW), ['graduationApps', NEW.uid], { ...FULL, credits: 999 }))
    })
    test('trường lạ hoặc uid của người khác bị chặn (khi nộp mới và khi sửa)', async () => {
      await giveStudentProfile(NEW)
      for (const bad of [{ role: 'admin' }, { uid: STUDENT.uid }])
        await assertFails(put(as(NEW), ['graduationApps', NEW.uid], { ...FULL, ...bad })).catch((e) => { throw new Error(`${JSON.stringify(bad)}: ${e.message}`) })
      await assertFails(upd(as(STUDENT), ['graduationApps', STUDENT.uid], { role: 'admin' }))
      await assertFails(upd(as(STUDENT), ['graduationApps', STUDENT.uid], { credits: 'nhiều' }))
      await assertFails(upd(as(STUDENT), ['graduationApps', STUDENT.uid], { uid: OTHER.uid }))
    })
    test('sinh viên nộp lại phiếu đã có lời duyệt, giữ nguyên lời duyệt: được', async () => {
      await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), 'graduationApps', STUDENT.uid), { status: 'needsFix', review: 'Thiếu', reviewedBy: 'Đào tạo', reviewedAt: '2026-11-04' })
      })
      await assertSucceeds(put(as(STUDENT), ['graduationApps', STUDENT.uid], { status: 'submitted', note: 'Đã bổ sung' }, { merge: true }))
    })
    test('Đào tạo ghi lời duyệt không bị giới hạn khuôn dữ liệu của sinh viên', async () => {
      await assertSucceeds(upd(as(TRAINING), ['graduationApps', STUDENT.uid], { ghiChuDuyet: 'x' }))
    })
  })
  test('sinh viên KHÁC không sửa / không xóa được phiếu "submitted" của người khác (không chỉ chặn nhờ trạng thái)', async () => {
    await assertFails(upd(as(OTHER), ['graduationApps', STUDENT.uid], { credits: 1 }))
    await assertFails(del(as(OTHER), ['graduationApps', STUDENT.uid]))
    // đối chứng: chính chủ cùng thao tác thì được
    await assertSucceeds(upd(as(STUDENT), ['graduationApps', STUDENT.uid], { credits: 121 }))
    await assertSucceeds(del(as(STUDENT), ['graduationApps', STUDENT.uid]))
  })
  matrix('đào tạo + admin sửa/duyệt phiếu bất kỳ; giáo viên/tài chính không', (db) => upd(db, ['graduationApps', STUDENT.uid], { status: 'approved', review: 'OK', reviewedBy: 'x' }),
    { allow: [ADMIN, TRAINING], deny: [TEACHER, FINANCE, OTHER, ANON] })
  matrix('xóa phiếu của sinh viên 1 (đang approved): chỉ admin + đào tạo', (db) => del(db, ['graduationApps', OTHER.uid]),
    { allow: [ADMIN, TRAINING], deny: [OTHER, STUDENT, TEACHER, FINANCE, ANON] })
})

// ───────────────────────────────────────────────────────────────
describe('activities', () => {
  const LOG_REF = ['activities', STUDENT.uid]
  const append = (ev) => ({ events: arrayUnion(ev) })
  const setEvents = (events) => env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), ...LOG_REF), { ...LOG, events })
  })
  const setProfile = (u, data) => env.withSecurityRulesDisabled(async (ctx) => { await updateDoc(doc(ctx.firestore(), 'user', u.uid), data) })
  // Thêm một sự kiện sai khuôn vào nhật ký của sinh viên 1 phải bị chặn
  const denyEvent = async (ev) => {
    await assertFails(put(as(STUDENT), LOG_REF, append(ev), { merge: true })).catch((e) => { throw new Error(`${JSON.stringify(ev)}: ${e.message}`) })
  }

  describe('V4 – quyền đọc', () => {
    matrix('đọc nhật ký sinh viên 1 (môn 1): chính chủ, admin, giáo viên dạy môn 1', (db) => get(db, LOG_REF),
      { allow: [STUDENT, ADMIN, TEACHER], deny: [OTHER, TEACHER2, TRAINING, FINANCE, GHOST, ANON] })
    test('giáo viên chỉ đọc khi có môn trùng; bỏ môn của sinh viên hoặc giáo viên là mất quyền ngay', async () => {
      await assertSucceeds(get(as(TEACHER), LOG_REF))
      await setProfile(STUDENT, { subjectIds: [5] })
      await assertFails(get(as(TEACHER), LOG_REF))
      await setProfile(TEACHER2, { subjectIds: [5] })
      await assertSucceeds(get(as(TEACHER2), LOG_REF))
      await setProfile(TEACHER2, { subjectIds: [] })
      await assertFails(get(as(TEACHER2), LOG_REF))
    })
    test('sinh viên chưa có môn nào, hoặc không có hồ sơ: giáo viên không đọc được', async () => {
      await setProfile(STUDENT, { subjectIds: deleteField() })
      await assertFails(get(as(TEACHER), LOG_REF))
      await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), 'activities', GHOST.uid), { uid: GHOST.uid, events: [] }) })
      await assertFails(get(as(TEACHER), ['activities', GHOST.uid]))
    })
    test('học cùng môn không cho quyền đọc: sinh viên khác, Đào tạo, Tài chính cùng môn 1 vẫn bị chặn', async () => {
      for (const u of [OTHER, TRAINING, FINANCE]) {
        await setProfile(u, { subjectIds: [1] })
        await assertFails(get(as(u), LOG_REF)).catch((e) => { throw new Error(`${u.uid}: ${e.message}`) })
      }
    })
    test('token tự khai role=teacher không có tác dụng', async () => {
      await setProfile(OTHER, { subjectIds: [1] })
      await assertFails(get(as(OTHER, { role: 'teacher' }), LOG_REF))
    })
    test('truy vấn cả collection: chỉ admin được; giáo viên, sinh viên bị chặn', async () => {
      await assertSucceeds(getDocs(collection(as(ADMIN), 'activities')))
      await assertFails(getDocs(collection(as(TEACHER), 'activities')))
      await assertFails(getDocs(collection(as(STUDENT), 'activities')))
    })
  })

  describe('ghi – quyền', () => {
    matrix('thêm sự kiện vào nhật ký sinh viên 1: chính chủ + admin', (db) => put(db, LOG_REF, append(EV_QUIZ), { merge: true }),
      { allow: [STUDENT, ADMIN], deny: [OTHER, TEACHER, TRAINING, FINANCE, ANON] })
    matrix('tạo nhật ký mới của sinh viên 3: chính chủ + admin', (db) => put(db, ['activities', NEW.uid], { uid: NEW.uid, name: 'x', events: [EV_QUIZ] }),
      { allow: [NEW, ADMIN], deny: [STUDENT, OTHER, TEACHER, TRAINING, FINANCE, ANON] })
    matrix('xóa nhật ký của sinh viên 1: chính sinh viên 1 + admin', (db) => del(db, LOG_REF),
      { allow: [STUDENT, ADMIN], deny: [OTHER, TEACHER, TRAINING, FINANCE, ANON] })
    test('admin không bị giới hạn khuôn dữ liệu (ghi để quản lý, sửa dữ liệu lỗi)', async () => {
      await assertSucceeds(put(as(ADMIN), LOG_REF, { ghiChu: 'x', events: [] }))
      await assertSucceeds(put(as(ADMIN), ['activities', NEW.uid], { ghiChu: 'x' }))
    })
  })

  describe('ghi – đúng khuôn thì được', () => {
    test('đủ 3 loại sự kiện, đúng dữ liệu app ghi, kể cả lần ghi đầu tiên', async () => {
      await assertSucceeds(put(as(NEW), ['activities', NEW.uid], { uid: NEW.uid, name: 'A', username: 'a', events: arrayUnion(EV_MATERIAL) }, { merge: true }))
      await assertSucceeds(put(as(NEW), ['activities', NEW.uid], { uid: NEW.uid, name: 'A', username: 'a', events: arrayUnion(EV_QUIZ) }, { merge: true }))
      await assertSucceeds(put(as(NEW), ['activities', NEW.uid], { uid: NEW.uid, name: 'A', username: 'a', events: arrayUnion(EV_HOMEWORK) }, { merge: true }))
    })
    test('ghi lại đúng sự kiện đã có (arrayUnion không đổi mảng) và đổi tên hiển thị: được', async () => {
      await assertSucceeds(put(as(STUDENT), LOG_REF, { name: 'Tên mới', events: arrayUnion(EV_MATERIAL) }, { merge: true }))
    })
    test('tài liệu chưa có sự kiện nào, hoặc thiếu mảng events: được', async () => {
      await assertSucceeds(put(as(NEW), ['activities', NEW.uid], { uid: NEW.uid, name: 'A', events: [] }))
      await assertSucceeds(put(as(OTHER), ['activities', OTHER.uid], { uid: OTHER.uid, name: 'A' }))
      await assertSucceeds(upd(as(OTHER), ['activities', OTHER.uid], { name: 'B' }))
      await assertSucceeds(upd(as(OTHER), ['activities', OTHER.uid], append(EV_MATERIAL)))
    })
    test('dữ liệu bản Firebase cũ có trường email: được', async () => {
      await assertSucceeds(put(as(NEW), ['activities', NEW.uid], { uid: NEW.uid, name: 'A', email: NEW.email, events: [EV_MATERIAL] }))
    })
    test('sự kiện chỉ có type và at (subjectId, refId... không bắt buộc): được', async () => {
      await assertSucceeds(put(as(STUDENT), LOG_REF, append({ type: 'material', at: '2026-11-04' }), { merge: true }))
    })
    test('refId kiểu số và kiểu chuỗi đều được', async () => {
      await assertSucceeds(put(as(STUDENT), LOG_REF, append({ ...EV_MATERIAL, refId: 99 }), { merge: true }))
      await assertSucceeds(put(as(STUDENT), LOG_REF, append({ ...EV_MATERIAL, refId: 'q99' }), { merge: true }))
    })
    test('biên điểm: 0 và 10 được; total = correct = 0 được; correct = total được', async () => {
      for (const ev of [{ ...EV_QUIZ, score: 0 }, { ...EV_QUIZ, score: 10 }, { ...EV_QUIZ, total: 0, correct: 0 }, { ...EV_QUIZ, total: 3, correct: 3 }])
        await assertSucceeds(put(as(STUDENT), LOG_REF, append(ev), { merge: true }))
    })
    test('biên độ dài chuỗi của sự kiện và của tài liệu: đúng giới hạn thì được', async () => {
      for (const [k, max] of [['refTitle', 500], ['url', 2048], ['fileName', 255], ['note', 2000]])
        await assertSucceeds(put(as(STUDENT), LOG_REF, append({ ...EV_HOMEWORK, [k]: 'a'.repeat(max) }), { merge: true }))
      for (const [k, max] of [['name', 100], ['username', 254], ['email', 254]])
        await assertSucceeds(put(as(STUDENT), LOG_REF, { [k]: 'a'.repeat(max) }, { merge: true }))
    })
    test('nhật ký có đúng 1999 sự kiện: thêm được sự kiện thứ 2000', async () => {
      await setEvents(Array.from({ length: 1999 }, (_, i) => ({ ...EV_MATERIAL, refId: i })))
      await assertSucceeds(put(as(STUDENT), LOG_REF, append(EV_QUIZ), { merge: true }))
    })
  })

  describe('ghi – sai khuôn bị chặn', () => {
    test('trường lạ ở tài liệu, hoặc mạo danh uid của sinh viên khác', async () => {
      for (const bad of [{ role: 'admin' }, { log: ['x'] }, { uid: OTHER.uid }])
        await assertFails(put(as(STUDENT), LOG_REF, bad, { merge: true })).catch((e) => { throw new Error(`${JSON.stringify(bad)}: ${e.message}`) })
      await assertFails(put(as(NEW), ['activities', NEW.uid], { uid: OTHER.uid, events: [] }))
    })
    test('name, username, email: danh sách hoặc quá dài', async () => {
      for (const [k, max] of [['name', 100], ['username', 254], ['email', 254]]) {
        await assertFails(put(as(STUDENT), LOG_REF, { [k]: ['x'] }, { merge: true })).catch((e) => { throw new Error(`${k} danh sách: ${e.message}`) })
        await assertFails(put(as(STUDENT), LOG_REF, { [k]: 'a'.repeat(max + 1) }, { merge: true })).catch((e) => { throw new Error(`${k} quá dài: ${e.message}`) })
      }
    })
    test('events không phải danh sách', async () => {
      for (const events of ['x', 5, { a: 1 }, null]) {
        await assertFails(put(as(STUDENT), LOG_REF, { events }, { merge: true })).catch((e) => { throw new Error(`${JSON.stringify(events)}: ${e.message}`) })
        await assertFails(put(as(NEW), ['activities', NEW.uid], { uid: NEW.uid, events })).catch((e) => { throw new Error(`tạo ${JSON.stringify(events)}: ${e.message}`) })
      }
    })
    test('nhật ký đã có 2000 sự kiện: không thêm được nữa', async () => {
      await setEvents(Array.from({ length: 2000 }, (_, i) => ({ ...EV_MATERIAL, refId: i })))
      await assertFails(put(as(STUDENT), LOG_REF, append(EV_QUIZ), { merge: true }))
    })
    test('chỉ được thêm vào cuối: sửa, xóa bớt, đổi thứ tự, chèn đầu, xóa cả mảng đều bị chặn', async () => {
      await setEvents([EV_MATERIAL, EV_QUIZ])
      for (const events of [[], [EV_MATERIAL], [EV_QUIZ], [EV_QUIZ, EV_MATERIAL], [EV_HOMEWORK, EV_MATERIAL, EV_QUIZ], [{ ...EV_MATERIAL, refId: 1 }, EV_QUIZ], [EV_MATERIAL, { ...EV_QUIZ, score: 10 }]])
        await assertFails(upd(as(STUDENT), LOG_REF, { events })).catch((e) => { throw new Error(`${JSON.stringify(events)}: ${e.message}`) })
      await assertFails(upd(as(STUDENT), LOG_REF, { events: deleteField() }))
    })
    test('mỗi lần ghi chỉ thêm một sự kiện, kể cả khi tạo mới', async () => {
      await assertFails(put(as(STUDENT), LOG_REF, { events: arrayUnion(EV_QUIZ, EV_HOMEWORK) }, { merge: true }))
      await assertFails(put(as(NEW), ['activities', NEW.uid], { uid: NEW.uid, events: [EV_MATERIAL, EV_QUIZ] }))
    })
    test('sự kiện mới được kiểm tra đúng phần tử vừa thêm, không phải phần tử cũ', async () => {
      await setEvents([EV_MATERIAL])
      await denyEvent({ ...EV_MATERIAL, type: 'hacked' })
    })
    test('khi tạo mới, sự kiện đầu tiên cũng phải đúng khuôn', async () => {
      await assertFails(put(as(NEW), ['activities', NEW.uid], { uid: NEW.uid, events: [{ ...EV_QUIZ, score: 11 }] }))
    })
    test('sự kiện có trường lạ', async () => { await denyEvent({ ...EV_QUIZ, role: 'admin' }) })
    test('sự kiện không phải đối tượng', async () => {
      for (const ev of ['x', 5, null]) await denyEvent(ev)
    })
    test('type: thiếu, sai giá trị, sai kiểu', async () => {
      for (const type of ['hacked', 'Quiz', 1]) await denyEvent({ ...EV_QUIZ, type })
      const { type, ...noType } = EV_QUIZ
      await denyEvent(noType)
    })
    test('at: thiếu, sai định dạng, sai kiểu', async () => {
      for (const at of ['05/11/2026', '2026-11-5', '2026-11-05T00:00:00Z', '', 20261105]) await denyEvent({ ...EV_QUIZ, at })
      const { at, ...noAt } = EV_QUIZ
      await denyEvent(noAt)
    })
    test('subjectId không phải số', async () => {
      for (const subjectId of ['1', [1], true]) await denyEvent({ ...EV_QUIZ, subjectId })
    })
    test('refId không phải số hay chuỗi', async () => {
      for (const refId of [[1], { a: 1 }, true]) await denyEvent({ ...EV_QUIZ, refId })
    })
    test('refTitle, url, fileName, note: danh sách hoặc quá dài', async () => {
      for (const [k, max] of [['refTitle', 500], ['url', 2048], ['fileName', 255], ['note', 2000]]) {
        await denyEvent({ ...EV_HOMEWORK, [k]: ['x'] })
        await denyEvent({ ...EV_HOMEWORK, [k]: 'a'.repeat(max + 1) })
      }
    })
    test('score: sai kiểu hoặc ngoài 0–10', async () => {
      for (const score of ['9', -1, 11, 10.5, true, null]) await denyEvent({ ...EV_QUIZ, score })
    })
    test('total, correct: không phải số nguyên không âm, hoặc correct lớn hơn total', async () => {
      for (const v of ['3', 1.5, -1]) {
        await denyEvent({ ...EV_QUIZ, total: v })
        await denyEvent({ ...EV_QUIZ, correct: v })
      }
      await denyEvent({ ...EV_QUIZ, total: 3, correct: 4 })
      // total lẻ nhưng vẫn lớn hơn correct: chỉ kiểm tra số nguyên mới chặn được
      await denyEvent({ ...EV_QUIZ, total: 4.5, correct: 3 })
    })
  })
})

// ───────────────────────────────────────────────────────────────
// Các ca dưới đây GHI LẠI hiện trạng đang có rủi ro (đúng với rules hiện tại, không phải hành vi mong muốn).
// Khi rules được siết lại, ca tương ứng sẽ ĐỎ → cập nhật ca và báo cáo.
describe('Rủi ro còn tồn tại (ghi lại hiện trạng)', () => {
  test('R1: sinh viên đọc được trường password CŨ trong hồ sơ công khai của người khác', async () => {
    const snap = await assertSucceeds(get(as(OTHER), ['user', STUDENT.uid]))
    assert_equal(snap.data().password, 'legacy123')
  })
  test('R2 (đã siết một phần): mật khẩu rỗng bị chặn nhưng rất ngắn vẫn lọt', async () => {
    await assertSucceeds(put(as(STUDENT), ['userSecrets', STUDENT.uid], { password: 'a', updatedAt: 'x' }))
  })
  test('V4 còn lại: sinh viên vẫn tự ghi được điểm trắc nghiệm đúng khuôn; chỉ hết khi chấm ở máy chủ (V3)', async () => {
    await assertSucceeds(put(as(STUDENT), ['activities', STUDENT.uid], { events: arrayUnion({ ...EV_QUIZ, score: 10, total: 4, correct: 4 }) }, { merge: true }))
  })
  test('V4 còn lại: sinh viên vẫn tự xóa được nhật ký của mình', async () => {
    await assertSucceeds(del(as(STUDENT), ['activities', STUDENT.uid]))
  })
  test('R5: giáo viên (không chỉ admin) xóa/ghi đè được toàn bộ sharedData', async () => {
    await assertSucceeds(del(as(TEACHER2), ['sharedData', 'global']))
  })
  test('R6: admin không tự tạo được phiếu tốt nghiệp (create chỉ cho role student)', async () => {
    await assertFails(put(as(ADMIN), ['graduationApps', NEW.uid], { status: 'submitted' }))
    await assertFails(put(as(TRAINING), ['graduationApps', NEW.uid], { status: 'submitted' }))
  })
})

function assert_equal(a, b) {
  if (a !== b) throw new Error(`Kỳ vọng ${JSON.stringify(b)} nhưng nhận ${JSON.stringify(a)}`)
}
