// utils/firebase.js – Firebase Auth + Firestore integration
// Môi trường (xem docs/phan-tich/04-tach-moi-truong.md):
//   - Chạy trên localhost/127.0.0.1        → Firebase Emulator (project demo-studytask), KHÔNG chạm production
//   - Chạy trên localhost với ?offline=1   → không dùng Firebase, đăng nhập bằng tài khoản demo cục bộ
//   - Các domain khác (Netlify, sutdytask.io.vn) → project production sutdytask

import { initializeApp, deleteApp }                               from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js'
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut,
         onAuthStateChanged, createUserWithEmailAndPassword,
         sendPasswordResetEmail, updatePassword, sendEmailVerification,
         EmailAuthProvider, reauthenticateWithCredential }        from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js'
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc,
         deleteDoc, deleteField, collection, getDocs, arrayUnion } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js'

// ─── Config production (project sutdytask) ─────────────────────
const PROD_CONFIG = {
  apiKey:            "AIzaSyA_f74MupkKCODRFS38oNQecr5UQkGRgxY",
  authDomain:        "sutdytask.firebaseapp.com",
  projectId:         "sutdytask",
  storageBucket:     "sutdytask.firebasestorage.app",
  messagingSenderId: "447291046399",
  appId:             "1:447291046399:web:46146de59eeef519f54fca",
  measurementId:     "G-QKZ3N8V33F",
}

// ─── Config emulator (máy local) ───────────────────────────────
// Project id bắt đầu bằng "demo-" → Firebase CLI không bao giờ gọi tới tài nguyên thật.
const EMULATOR_CONFIG = {
  apiKey:     'demo-key',
  authDomain: 'demo-studytask.firebaseapp.com',
  projectId:  'demo-studytask',
}
const EMULATOR_HOST  = '127.0.0.1'
const EMULATOR_PORTS = { auth: 9099, firestore: 8080 }   // khớp với firebase.json

const IS_LOCAL = typeof location !== 'undefined' && ['localhost', '127.0.0.1'].includes(location.hostname)
const OFFLINE  = IS_LOCAL && new URLSearchParams(location.search).has('offline')

export const APP_ENV = !IS_LOCAL ? 'production' : OFFLINE ? 'offline' : 'emulator'
const FIREBASE_CONFIG = APP_ENV === 'emulator' ? EMULATOR_CONFIG : PROD_CONFIG
// ───────────────────────────────────────────────────────────────

// Tạo Auth cho một app (app chính hoặc app phụ); ở local luôn nối vào emulator
function makeAuth(app) {
  const a = getAuth(app)
  if (APP_ENV === 'emulator') connectAuthEmulator(a, `http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`, { disableWarnings: true })
  return a
}

let _auth = null
let _db   = null

function isConfigured() {
  return APP_ENV !== 'offline' && !!FIREBASE_CONFIG.apiKey
}

// Khởi tạo một lần, gọi từ app.js
export function initFirebase() {
  if (!isConfigured()) {
    console.warn('[Firebase] Chế độ offline – dùng demo account cục bộ')
    return false
  }
  try {
    const app = initializeApp(FIREBASE_CONFIG)
    _auth     = makeAuth(app)
    _db       = getFirestore(app)
    if (APP_ENV === 'emulator') connectFirestoreEmulator(_db, EMULATOR_HOST, EMULATOR_PORTS.firestore)
    console.info(`[Firebase] Kết nối thành công ✅ (môi trường: ${APP_ENV}, project: ${FIREBASE_CONFIG.projectId})`)
    return true
  } catch (e) {
    console.error('[Firebase] Lỗi khởi tạo:', e.message)
    return false
  }
}

export const isFirebaseReady = () => !!_auth

// ── Đăng nhập / Đăng xuất ──────────────────────────────────────
export const fbLogin  = (email, pw) => signInWithEmailAndPassword(_auth, email, pw)
export const fbLogout = ()          => signOut(_auth)

// Lắng nghe trạng thái auth liên tục (persistent login)
export const onAuth = (callback) => {
  if (!_auth) return () => {}
  return onAuthStateChanged(_auth, callback)
}

// ── Hồ sơ người dùng (role) trong Firestore ────────────────────
// Collection: users/{uid}  →  { name, email, role }
export const getUserProfile = async (uid) => {
  if (!_db) return null
  const snap = await getDoc(doc(_db, 'user', uid))
  return snap.exists() ? snap.data() : null
}

export const setUserProfile = (uid, data) =>
  _db ? setDoc(doc(_db, 'user', uid), data, { merge: true }) : Promise.resolve()

// ── Dữ liệu dùng chung (subjects, deadlines, quizzes, materials) ─
// Document: sharedData/global  →  đọc bởi tất cả, ghi bởi admin/teacher
export const loadSharedData = async () => {
  if (!_db) return null
  const snap = await getDoc(doc(_db, 'sharedData', 'global'))
  return snap.exists() ? snap.data() : null
}

export const saveSharedKey = (key, value) =>
  _db ? setDoc(doc(_db, 'sharedData', 'global'), { [key]: value }, { merge: true }) : Promise.resolve()

// ── Dữ liệu cá nhân theo user ────────────────────────────────────
// Collection: userData/{uid}  →  { profile, homeworks, submissions, library, contacts }
export const loadUserData = async (uid) => {
  if (!_db) return null
  const snap = await getDoc(doc(_db, 'userData', uid))
  return snap.exists() ? snap.data() : null
}

// Ghi một khóa cụ thể (gọi sau mỗi lần state thay đổi)
export const saveUserKey = (uid, key, value) =>
  _db ? setDoc(doc(_db, 'userData', uid), { [key]: value }, { merge: true }) : Promise.resolve()

// ── Tạo tài khoản mới (Admin dùng) ─────────────────────────────
// Dùng app phụ để KHÔNG đăng xuất admin hiện tại khi tạo tài khoản mới.
export const createAccountSecondary = async (email, password, profile = {}) => {
  if (!isConfigured()) throw new Error('Chưa kết nối Firebase')
  const secApp  = initializeApp(FIREBASE_CONFIG, 'sec-' + Date.now())
  const secAuth = makeAuth(secApp)
  try {
    const cred = await createUserWithEmailAndPassword(secAuth, email, password)
    // Ghi hồ sơ bằng _db (app chính) để admin vẫn là người ghi
    await setUserProfile(cred.user.uid, {
      email,
      name:       profile.name       || email,
      role:       profile.role       || 'student',
      subjectIds: profile.subjectIds ?? [],
      phone:      profile.phone || '',
      ...(profile.expiresAt ? { expiresAt: profile.expiresAt } : {}),
      createdAt:  new Date().toISOString().split('T')[0],
    })
    await saveSecret(cred.user.uid, password)
    await signOut(secAuth)
    return cred.user.uid
  } finally {
    try { await deleteApp(secApp) } catch {}
  }
}

// ── Bản mật khẩu lưu tạm (vá tạm V1, tuần 2) ───────────────────
// Trước đây password nằm trong user/{uid} → MỌI tài khoản đăng nhập đều đọc được.
// Nay chuyển sang userSecrets/{uid}: chỉ admin đọc; chủ tài khoản chỉ được ghi (không đọc).
// Vẫn là văn bản thuần → sẽ bỏ hẳn ở tuần 3 khi có Cloud Functions + Admin SDK.
const saveSecret = (uid, password) =>
  _db ? setDoc(doc(_db, 'userSecrets', uid), { password, updatedAt: new Date().toISOString() }) : Promise.resolve()

// Admin: đọc toàn bộ bản mật khẩu → { uid: password }
export const getAllSecrets = async () => {
  if (!_db) return {}
  try {
    const snap = await getDocs(collection(_db, 'userSecrets'))
    return Object.fromEntries(snap.docs.map(d => [d.id, d.data().password]))
  } catch (e) {
    console.warn('[Firebase] getAllSecrets:', e.message)
    return {}
  }
}

// Admin: chuyển password cũ từ user/{uid} sang userSecrets/{uid} rồi xóa trường password khỏi user/{uid}.
// users: danh sách từ getAllUsers(). Trả về số tài khoản đã chuyển.
export const migrateLegacyPasswords = async (users) => {
  if (!_db) return 0
  let n = 0
  for (const u of users.filter(x => typeof x.password === 'string' && x.password)) {
    await saveSecret(u.uid, u.password)
    await updateDoc(doc(_db, 'user', u.uid), { password: deleteField() })
    n++
  }
  return n
}

// ── Gửi email đặt lại mật khẩu cho một tài khoản ───────────────
export const sendResetEmail = (email) =>
  _auth ? sendPasswordResetEmail(_auth, email) : Promise.reject(new Error('Chưa kết nối Firebase'))

// ── Gửi email xác thực cho người dùng hiện tại ─────────────────
export const sendEmailVerify = () =>
  _auth?.currentUser ? sendEmailVerification(_auth.currentUser) : Promise.reject(new Error('Chưa đăng nhập'))

// Trạng thái xác thực email của người dùng hiện tại
export const isEmailVerified = () => !!_auth?.currentUser?.emailVerified

// ── Admin đổi mật khẩu cho user khác (không cần server) ─────────
// Cách làm: đăng nhập ngầm bằng app phụ với mật khẩu hiện tại (lưu trong userSecrets),
// rồi updatePassword. Sau đó cập nhật lại bản password trong userSecrets.
export const adminSetPassword = async (uid, email, oldPassword, newPassword) => {
  if (!isConfigured()) throw new Error('Chưa kết nối Firebase')
  if (!oldPassword) throw new Error('Không có mật khẩu hiện tại đã lưu — không thể đổi tự động. Hãy dùng "Gửi email đặt lại" hoặc xóa & tạo lại tài khoản.')
  const secApp  = initializeApp(FIREBASE_CONFIG, 'secpw-' + Date.now())
  const secAuth = makeAuth(secApp)
  try {
    const cred = await signInWithEmailAndPassword(secAuth, email, oldPassword)
    await updatePassword(cred.user, newPassword)
    await signOut(secAuth)
    await saveSecret(uid, newPassword)  // cập nhật bản lưu (app chính = admin)
  } finally {
    try { await deleteApp(secApp) } catch {}
  }
}

// ── Người dùng tự đổi mật khẩu đăng nhập của chính mình ────────
export const changeOwnPassword = async (currentPassword, newPassword) => {
  const u = _auth?.currentUser
  if (!u) throw new Error('Chưa đăng nhập')
  const cred = EmailAuthProvider.credential(u.email, currentPassword)
  await reauthenticateWithCredential(u, cred)   // xác thực lại để được phép đổi
  await updatePassword(u, newPassword)
  await saveSecret(u.uid, newPassword)  // đồng bộ bản lưu để admin xem (chủ tài khoản ghi được, không đọc được)
}

// ── Xóa dữ liệu Firestore của một user (user + userData + activities + userSecrets) ──
// Lưu ý: bản ghi trong Authentication phải xóa ở Firebase Console hoặc Admin SDK.
export const deleteUserData = async (uid) => {
  if (!_db) return
  await Promise.allSettled([
    deleteDoc(doc(_db, 'user', uid)),
    deleteDoc(doc(_db, 'userData', uid)),
    deleteDoc(doc(_db, 'activities', uid)),
    deleteDoc(doc(_db, 'userSecrets', uid)),
  ])
}

// ── Đọc tất cả người dùng (Admin dùng) ─────────────────────────
export const getAllUsers = async () => {
  if (!_db) return []
  try {
    const snap = await getDocs(collection(_db, 'user'))
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }))
  } catch (e) {
    console.warn('[Firebase] getAllUsers:', e.message)
    return []
  }
}

// ── Admin cập nhật profile của user bất kỳ (gán môn học, đổi role)
export const adminUpdateUser = (targetUid, data) =>
  _db ? setDoc(doc(_db, 'user', targetUid), data, { merge: true }) : Promise.resolve()

// ── Nhật ký hoạt động (cho trang Quản lý lớp học) ───────────────
// Collection: activities/{uid} → { uid, name, email, events: [{type, subjectId, refId, refTitle, score, total, at}] }
// Sinh viên ghi nhật ký của chính mình; admin/giáo viên đọc tất cả để tổng hợp.
export const logActivity = (uid, meta, event) =>
  _db ? setDoc(doc(_db, 'activities', uid),
    { uid, name: meta.name || '', email: meta.email || '', events: arrayUnion(event) },
    { merge: true }) : Promise.resolve()

export const loadAllActivities = async () => {
  if (!_db) return []
  try {
    const snap = await getDocs(collection(_db, 'activities'))
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }))
  } catch (e) {
    console.warn('[Firebase] loadAllActivities:', e.message)
    return []
  }
}

// ── Truy cập document chung (dùng cho các collection mới: học phí, quy chế điểm, CTĐT, xét tốt nghiệp, khóa luận) ──
export const fsGet = async (col, id) => {
  if (!_db) return null
  const snap = await getDoc(doc(_db, col, String(id)))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
export const fsSet = (col, id, data, merge = true) =>
  _db ? setDoc(doc(_db, col, String(id)), data, { merge }) : Promise.resolve()
export const fsList = async (col) => {
  if (!_db) return []
  const snap = await getDocs(collection(_db, col))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
export const fsDelete = (col, id) => _db ? deleteDoc(doc(_db, col, String(id))) : Promise.resolve()
