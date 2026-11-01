// tests/firestore.rules.deep.test.mjs – Kiểm thử chuyên sâu Firestore Security Rules
// Bổ sung cho firestore.rules.test.mjs: ma trận vai trò × thao tác, mặc định từ chối,
// token giả, tài khoản mất hồ sơ, ca biên, và các rủi ro còn tồn tại (ghi lại hiện trạng).
// Mỗi ca "bị chặn" đều đi kèm ca "được phép" cùng đường dẫn để chắc chắn bị chặn là do rules,
// không phải do dữ liệu nền sai.
// Chạy: npm run test:rules:deep
import { test, before, after, beforeEach, describe } from 'node:test'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, deleteDoc, deleteField } from 'firebase/firestore'

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
    await setDoc(doc(db, 'activities', STUDENT.uid),  { log: ['login'] })
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
  test('sửa tên: dài đúng 100 ký tự được, 101 ký tự bị chặn; kiểu không phải chuỗi bị chặn', async () => {
    await assertSucceeds(upd(as(STUDENT), ['user', STUDENT.uid], { name: 'a'.repeat(100) }))
    await assertFails(upd(as(STUDENT), ['user', STUDENT.uid], { name: 'a'.repeat(101) }))
    await assertFails(upd(as(STUDENT), ['user', STUDENT.uid], { name: 12345 }))
    await assertFails(upd(as(STUDENT), ['user', STUDENT.uid], { name: null }))
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
})

// ───────────────────────────────────────────────────────────────
describe('userData / sharedData – ma trận', () => {
  matrix('userData đọc: chủ + admin', (db) => get(db, ['userData', STUDENT.uid]),
    { allow: [STUDENT, ADMIN], deny: [OTHER, TEACHER, TRAINING, FINANCE, ANON] })
  matrix('userData ghi: chủ + admin', (db) => put(db, ['userData', STUDENT.uid], { profile: { name: 'B' } }),
    { allow: [STUDENT, ADMIN], deny: [OTHER, TEACHER, TRAINING, FINANCE, ANON] })
  matrix('userData xóa: chủ + admin', (db) => del(db, ['userData', STUDENT.uid]),
    { allow: [STUDENT, ADMIN], deny: [OTHER, TEACHER, TRAINING, FINANCE, ANON] })
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
    await assertSucceeds(upd(as(STUDENT), ['graduationApps', STUDENT.uid], { status: 'submitted', certs: true }))
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
  matrix('ghi nhật ký của sinh viên 1: chính sinh viên 1 + admin', (db) => put(db, ['activities', STUDENT.uid], { log: ['x'] }),
    { allow: [STUDENT, ADMIN], deny: [OTHER, TEACHER, TRAINING, FINANCE, ANON] })
  matrix('xóa nhật ký của sinh viên 1: chính sinh viên 1 + admin', (db) => del(db, ['activities', STUDENT.uid]),
    { allow: [STUDENT, ADMIN], deny: [OTHER, TEACHER, TRAINING, FINANCE, ANON] })
  matrix('đọc nhật ký: mọi người đã đăng nhập (theo thiết kế hiện tại)', (db) => get(db, ['activities', STUDENT.uid]),
    { allow: EVERYONE, deny: [ANON] })
})

// ───────────────────────────────────────────────────────────────
// Các ca dưới đây GHI LẠI hiện trạng đang có rủi ro (đúng với rules hiện tại, không phải hành vi mong muốn).
// Khi rules được siết lại, ca tương ứng sẽ ĐỎ → cập nhật ca và báo cáo.
describe('Rủi ro còn tồn tại (ghi lại hiện trạng)', () => {
  test('R1: sinh viên đọc được trường password CŨ trong hồ sơ công khai của người khác', async () => {
    const snap = await assertSucceeds(get(as(OTHER), ['user', STUDENT.uid]))
    assert_equal(snap.data().password, 'legacy123')
  })
  test('R2: userSecrets chấp nhận mật khẩu rỗng hoặc rất ngắn (rules không kiểm độ dài)', async () => {
    await assertSucceeds(put(as(STUDENT), ['userSecrets', STUDENT.uid], { password: '', updatedAt: 'x' }))
  })
  test('R3: nhật ký hoạt động của người khác đọc được bởi mọi sinh viên', async () => {
    await assertSucceeds(get(as(OTHER), ['activities', STUDENT.uid]))
  })
  test('R4: trường phone không được kiểm kiểu/độ dài (số, đối tượng, chuỗi rất dài đều lọt)', async () => {
    await assertSucceeds(upd(as(STUDENT), ['user', STUDENT.uid], { phone: 123 }))
    await assertSucceeds(upd(as(STUDENT), ['user', STUDENT.uid], { phone: { a: 1 } }))
    await assertSucceeds(upd(as(STUDENT), ['user', STUDENT.uid], { phone: 'x'.repeat(5000) }))
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
