// tests/firestore.rules.test.mjs – Kiểm thử Firestore Security Rules trên Emulator
// Chạy: npm run test:rules   (tự bật Firestore Emulator, chạy xong tự tắt)
import { test, before, after, beforeEach, describe } from 'node:test'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, deleteDoc, deleteField } from 'firebase/firestore'

let env

const ADMIN   = { uid: 'admin1',   email: 'admin@studytask.vn' }
const TEACHER = { uid: 'teacher1', email: 'teacher@studytask.vn' }
const STUDENT = { uid: 'student1', email: 'student@studytask.vn' }
const OTHER   = { uid: 'student2', email: 'student2@studytask.vn' }
const TRAINING = { uid: 'training1', email: 'daotao@studytask.vn' }
const FINANCE  = { uid: 'finance1',  email: 'taichinh@studytask.vn' }
const NEW      = { uid: 'student3',  email: 'student3@studytask.vn' }

const as = (u) => env.authenticatedContext(u.uid, { email: u.email }).firestore()

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-studytask',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  })
})

after(async () => { await env?.cleanup() })

beforeEach(async () => {
  await env.clearFirestore()
  // Dữ liệu nền: ghi bỏ qua rules
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'user', ADMIN.uid),   { email: ADMIN.email,   name: 'Quản trị viên', role: 'admin' })
    await setDoc(doc(db, 'user', TEACHER.uid), { email: TEACHER.email, name: 'Giáo viên',     role: 'teacher', subjectIds: [1, 2] })
    await setDoc(doc(db, 'user', STUDENT.uid), { email: STUDENT.email, name: 'Sinh viên',     role: 'student', subjectIds: [1], phone: '', password: 'legacy123' })
    await setDoc(doc(db, 'userSecrets', STUDENT.uid), { password: 'student123', updatedAt: '2026-10-15' })
    await setDoc(doc(db, 'user', OTHER.uid),    { email: OTHER.email,    name: 'Sinh viên 2',     role: 'student', subjectIds: [2] })
    await setDoc(doc(db, 'user', TRAINING.uid), { email: TRAINING.email, name: 'Phòng Đào tạo',   role: 'training' })
    await setDoc(doc(db, 'user', FINANCE.uid),  { email: FINANCE.email,  name: 'Phòng Tài chính', role: 'finance' })
    await setDoc(doc(db, 'tuition', STUDENT.uid), { payments: [{ amount: 1000000, date: '2026-10-01' }] })
    await setDoc(doc(db, 'graduationApps', OTHER.uid), { status: 'approved', review: 'OK' })
  })
})

describe('V2 – user/{uid}: chặn tự nâng quyền', () => {
  test('sinh viên KHÔNG tự đổi role thành admin', async () => {
    await assertFails(updateDoc(doc(as(STUDENT), 'user', STUDENT.uid), { role: 'admin' }))
  })
  test('sinh viên KHÔNG tự gán thêm môn học (subjectIds)', async () => {
    await assertFails(updateDoc(doc(as(STUDENT), 'user', STUDENT.uid), { subjectIds: [1, 2, 3] }))
  })
  test('sinh viên KHÔNG tự gia hạn tài khoản (expiresAt)', async () => {
    await assertFails(updateDoc(doc(as(STUDENT), 'user', STUDENT.uid), { expiresAt: '2099-01-01' }))
  })
  test('setDoc merge kèm role cũng bị chặn', async () => {
    await assertFails(setDoc(doc(as(STUDENT), 'user', STUDENT.uid), { name: 'X', role: 'admin' }, { merge: true }))
  })
  test('sinh viên ĐƯỢC sửa tên và số điện thoại của mình (luồng Lưu hồ sơ)', async () => {
    await assertSucceeds(setDoc(doc(as(STUDENT), 'user', STUDENT.uid), { name: 'Trần Minh Khoa', phone: '0901234567' }, { merge: true }))
  })
  test('KHÔNG được để trống tên', async () => {
    await assertFails(updateDoc(doc(as(STUDENT), 'user', STUDENT.uid), { name: '' }))
  })
  test('KHÔNG sửa hồ sơ của người khác', async () => {
    await assertFails(updateDoc(doc(as(OTHER), 'user', STUDENT.uid), { name: 'Hacked' }))
  })
  test('đăng nhập lần đầu: tự tạo hồ sơ sinh viên tối thiểu được phép', async () => {
    await assertSucceeds(setDoc(doc(as(NEW), 'user', NEW.uid), { name: 'student3', email: NEW.email, role: 'student' }, { merge: true }))
  })
  test('đăng nhập lần đầu: KHÔNG tự tạo hồ sơ với role admin/teacher/training/finance', async () => {
    for (const role of ['admin', 'teacher', 'training', 'finance'])
      await assertFails(setDoc(doc(as(NEW), 'user', NEW.uid), { name: 'x', email: NEW.email, role }))
  })
  test('đăng nhập lần đầu: KHÔNG tự tạo hồ sơ kèm subjectIds', async () => {
    await assertFails(setDoc(doc(as(NEW), 'user', NEW.uid), { name: 'x', email: NEW.email, role: 'student', subjectIds: [1, 2, 3, 4] }))
  })
  test('giáo viên KHÔNG đổi role của sinh viên', async () => {
    await assertFails(updateDoc(doc(as(TEACHER), 'user', STUDENT.uid), { role: 'teacher' }))
  })
  test('admin ĐƯỢC đổi role, môn học, hạn tài khoản', async () => {
    await assertSucceeds(updateDoc(doc(as(ADMIN), 'user', STUDENT.uid), { role: 'teacher', subjectIds: [1, 2], expiresAt: '2027-06-30' }))
  })
  test('chỉ admin xóa hồ sơ', async () => {
    await assertFails(deleteDoc(doc(as(STUDENT), 'user', STUDENT.uid)))
    await assertSucceeds(deleteDoc(doc(as(ADMIN), 'user', STUDENT.uid)))
  })
})

describe('V1 (vá tạm) – userSecrets/{uid}', () => {
  test('sinh viên KHÔNG đọc được mật khẩu của người khác', async () => {
    await assertFails(getDoc(doc(as(OTHER), 'userSecrets', STUDENT.uid)))
  })
  test('sinh viên KHÔNG đọc được cả mật khẩu của chính mình', async () => {
    await assertFails(getDoc(doc(as(STUDENT), 'userSecrets', STUDENT.uid)))
  })
  test('giáo viên KHÔNG đọc được', async () => {
    await assertFails(getDoc(doc(as(TEACHER), 'userSecrets', STUDENT.uid)))
  })
  test('admin ĐỌC được', async () => {
    await assertSucceeds(getDoc(doc(as(ADMIN), 'userSecrets', STUDENT.uid)))
  })
  test('chủ tài khoản ĐƯỢC ghi khi tự đổi mật khẩu', async () => {
    await assertSucceeds(setDoc(doc(as(STUDENT), 'userSecrets', STUDENT.uid), { password: 'moi123456', updatedAt: '2026-10-17' }))
  })
  test('KHÔNG ghi mật khẩu của người khác', async () => {
    await assertFails(setDoc(doc(as(OTHER), 'userSecrets', STUDENT.uid), { password: 'x', updatedAt: '2026-10-17' }))
  })
  test('KHÔNG nhét trường lạ vào userSecrets', async () => {
    await assertFails(setDoc(doc(as(STUDENT), 'userSecrets', STUDENT.uid), { password: 'x', role: 'admin' }))
  })
  test('admin ĐƯỢC chuyển password cũ: xóa trường password khỏi user/{uid}', async () => {
    await assertSucceeds(updateDoc(doc(as(ADMIN), 'user', STUDENT.uid), { password: deleteField() }))
  })
  test('sinh viên KHÔNG tự ghi lại trường password vào hồ sơ công khai', async () => {
    await assertFails(updateDoc(doc(as(STUDENT), 'user', STUDENT.uid), { password: 'abc123' }))
  })
})

describe('Các collection khác giữ nguyên hành vi', () => {
  test('userData: chủ sở hữu đọc/ghi, người khác thì không', async () => {
    await assertSucceeds(setDoc(doc(as(STUDENT), 'userData', STUDENT.uid), { profile: { name: 'A' } }, { merge: true }))
    await assertSucceeds(getDoc(doc(as(STUDENT), 'userData', STUDENT.uid)))
    await assertFails(getDoc(doc(as(OTHER), 'userData', STUDENT.uid)))
    await assertFails(setDoc(doc(as(OTHER), 'userData', STUDENT.uid), { profile: {} }))
  })
  test('sharedData: sinh viên chỉ đọc, giáo viên/admin được ghi', async () => {
    await assertSucceeds(getDoc(doc(as(STUDENT), 'sharedData', 'global')))
    await assertFails(setDoc(doc(as(STUDENT), 'sharedData', 'global'), { subjects: [] }, { merge: true }))
    await assertSucceeds(setDoc(doc(as(TEACHER), 'sharedData', 'global'), { subjects: [] }, { merge: true }))
    await assertSucceeds(setDoc(doc(as(ADMIN), 'sharedData', 'global'), { news: [] }, { merge: true }))
  })
  test('chưa đăng nhập: không đọc được gì', async () => {
    const anon = env.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(anon, 'user', STUDENT.uid)))
    await assertFails(getDoc(doc(anon, 'sharedData', 'global')))
  })
})

describe('Quy chế điểm: Đào tạo cập nhật tỉ lệ, giáo viên chọn cột', () => {
  const policy = { preset: 'L2', auto: true }
  test('Phòng Đào tạo ĐƯỢC cập nhật tỉ lệ', async () => {
    await assertSucceeds(setDoc(doc(as(TRAINING), 'gradingPolicies', '1'), policy))
  })
  test('giáo viên KHÔNG được sửa tỉ lệ', async () => {
    await assertFails(setDoc(doc(as(TEACHER), 'gradingPolicies', '1'), policy))
  })
  test('sinh viên đọc được tỉ lệ nhưng không sửa được', async () => {
    await assertSucceeds(getDoc(doc(as(STUDENT), 'gradingPolicies', '1')))
    await assertFails(setDoc(doc(as(STUDENT), 'gradingPolicies', '1'), policy))
  })
  test('giáo viên ĐƯỢC chọn cột bài tập cho môn mình dạy (môn 1)', async () => {
    await assertSucceeds(setDoc(doc(as(TEACHER), 'gradingColumns', '1'), { counted: { 'hw:1': 1 } }))
  })
  test('giáo viên KHÔNG chọn cột cho môn không dạy (môn 5)', async () => {
    await assertFails(setDoc(doc(as(TEACHER), 'gradingColumns', '5'), { counted: { 'hw:9': 1 } }))
  })
  test('Phòng Đào tạo và sinh viên KHÔNG chọn cột', async () => {
    await assertFails(setDoc(doc(as(TRAINING), 'gradingColumns', '1'), { counted: {} }))
    await assertFails(setDoc(doc(as(STUDENT), 'gradingColumns', '1'), { counted: {} }))
  })
  test('Phòng Đào tạo ĐƯỢC thêm/bớt môn học (sharedData)', async () => {
    await assertSucceeds(setDoc(doc(as(TRAINING), 'sharedData', 'global'), { subjects: [] }, { merge: true }))
  })
  test('Phòng Tài chính KHÔNG sửa môn học', async () => {
    await assertFails(setDoc(doc(as(FINANCE), 'sharedData', 'global'), { subjects: [] }, { merge: true }))
  })
})

describe('Học phí: Phòng Tài chính', () => {
  test('Tài chính ĐƯỢC đặt đơn giá tín chỉ; sinh viên, Đào tạo chỉ đọc', async () => {
    await assertSucceeds(setDoc(doc(as(FINANCE), 'financeConfig', 'current'), { pricePerCredit: 500000, dueDate: '2026-11-01' }))
    await assertSucceeds(getDoc(doc(as(STUDENT), 'financeConfig', 'current')))
    await assertFails(setDoc(doc(as(STUDENT), 'financeConfig', 'current'), { pricePerCredit: 1 }))
    await assertFails(setDoc(doc(as(TRAINING), 'financeConfig', 'current'), { pricePerCredit: 1 }))
  })
  test('sinh viên XEM được công nợ của mình, KHÔNG xem của người khác', async () => {
    await assertSucceeds(getDoc(doc(as(STUDENT), 'tuition', STUDENT.uid)))
    await assertFails(getDoc(doc(as(OTHER), 'tuition', STUDENT.uid)))
    await assertFails(getDoc(doc(as(TEACHER), 'tuition', STUDENT.uid)))
  })
  test('sinh viên KHÔNG tự ghi đã nộp tiền', async () => {
    await assertFails(setDoc(doc(as(STUDENT), 'tuition', STUDENT.uid), { payments: [{ amount: 99999999 }] }, { merge: true }))
  })
  test('Tài chính ĐƯỢC ghi nhận thanh toán và gửi thông báo', async () => {
    await assertSucceeds(setDoc(doc(as(FINANCE), 'tuition', STUDENT.uid), { notices: [{ at: '2026-10-17', message: 'Nhắc nộp học phí' }] }, { merge: true }))
    await assertSucceeds(getDoc(doc(as(FINANCE), 'tuition', STUDENT.uid)))
  })
})

describe('Chương trình đào tạo', () => {
  test('Đào tạo ĐƯỢC sửa; giáo viên, sinh viên chỉ đọc', async () => {
    await assertSucceeds(setDoc(doc(as(TRAINING), 'curriculum', 'ktpm-2024'), { name: 'KTPM', modules: [] }))
    await assertSucceeds(getDoc(doc(as(STUDENT), 'curriculum', 'ktpm-2024')))
    await assertFails(setDoc(doc(as(TEACHER), 'curriculum', 'ktpm-2024'), { name: 'x' }))
  })
})

describe('Phiếu đăng ký xét tốt nghiệp', () => {
  const app = { status: 'submitted', studentId: '24TX810021', credits: 120 }
  test('sinh viên ĐƯỢC nộp phiếu của mình', async () => {
    await assertSucceeds(setDoc(doc(as(STUDENT), 'graduationApps', STUDENT.uid), app))
  })
  test('sinh viên KHÔNG tự nộp với trạng thái "approved" hoặc kèm kết quả duyệt', async () => {
    await assertFails(setDoc(doc(as(STUDENT), 'graduationApps', STUDENT.uid), { ...app, status: 'approved' }))
    await assertFails(setDoc(doc(as(STUDENT), 'graduationApps', STUDENT.uid), { ...app, review: 'ok' }))
  })
  test('KHÔNG nộp thay người khác; giáo viên không nộp được', async () => {
    await assertFails(setDoc(doc(as(STUDENT), 'graduationApps', NEW.uid), app))
    await assertFails(setDoc(doc(as(TEACHER), 'graduationApps', TEACHER.uid), app))
  })
  test('sinh viên KHÔNG xem phiếu của người khác', async () => {
    await assertFails(getDoc(doc(as(STUDENT), 'graduationApps', OTHER.uid)))
  })
  test('phiếu đã duyệt thì sinh viên KHÔNG sửa được', async () => {
    await assertFails(setDoc(doc(as(OTHER), 'graduationApps', OTHER.uid), { status: 'submitted', note: 'sửa' }, { merge: true }))
  })
  test('Đào tạo ĐƯỢC duyệt; sinh viên nộp lại khi "cần bổ sung"', async () => {
    await assertSucceeds(setDoc(doc(as(STUDENT), 'graduationApps', STUDENT.uid), app))
    await assertSucceeds(setDoc(doc(as(TRAINING), 'graduationApps', STUDENT.uid), { status: 'needsFix', review: 'Thiếu chứng chỉ' }, { merge: true }))
    await assertSucceeds(setDoc(doc(as(STUDENT), 'graduationApps', STUDENT.uid), { status: 'submitted', certs: { english: true } }, { merge: true }))
  })
  test('sinh viên KHÔNG sửa lời duyệt khi nộp lại', async () => {
    await assertSucceeds(setDoc(doc(as(STUDENT), 'graduationApps', STUDENT.uid), app))
    await assertSucceeds(setDoc(doc(as(TRAINING), 'graduationApps', STUDENT.uid), { status: 'needsFix', review: 'Thiếu chứng chỉ' }, { merge: true }))
    await assertFails(setDoc(doc(as(STUDENT), 'graduationApps', STUDENT.uid), { status: 'submitted', review: '' }, { merge: true }))
  })
})

describe('Công bố khóa luận', () => {
  test('mọi người đọc; chỉ Đào tạo / Admin đăng', async () => {
    await assertSucceeds(setDoc(doc(as(TRAINING), 'theses', 't1'), { title: 'Khóa luận A', year: 2026 }))
    await assertSucceeds(getDoc(doc(as(STUDENT), 'theses', 't1')))
    await assertFails(setDoc(doc(as(STUDENT), 'theses', 't2'), { title: 'x' }))
    await assertFails(setDoc(doc(as(TEACHER), 'theses', 't2'), { title: 'x' }))
  })
})
