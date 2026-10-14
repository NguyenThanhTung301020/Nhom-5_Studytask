// utils/firebase.js – Firebase Auth + Firestore integration
// ⚠️  Điền 6 giá trị REPLACE_ME bên dưới từ Firebase Console
//     Project Settings → General → Your apps → </> Web → firebaseConfig

import { initializeApp, deleteApp }                               from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js'
import { getAuth, signInWithEmailAndPassword, signOut,
         onAuthStateChanged, createUserWithEmailAndPassword,
         sendPasswordResetEmail, updatePassword, sendEmailVerification,
         EmailAuthProvider, reauthenticateWithCredential }        from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js'
import { getFirestore, doc, getDoc, setDoc, deleteDoc,
         collection, getDocs, arrayUnion }                        from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js'

// ─── Điền config của bạn vào đây ───────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyA_f74MupkKCODRFS38oNQecr5UQkGRgxY",
  authDomain:        "sutdytask.firebaseapp.com",
  projectId:         "sutdytask",
  storageBucket:     "sutdytask.firebasestorage.app",
  messagingSenderId: "447291046399",
  appId:             "1:447291046399:web:46146de59eeef519f54fca",
  measurementId:     "G-QKZ3N8V33F",
}
// ───────────────────────────────────────────────────────────────

let _auth = null
let _db   = null

function isConfigured() {
  return !!FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'REPLACE_ME'
}

// Khởi tạo một lần, gọi từ app.js
export function initFirebase() {
  if (!isConfigured()) {
    console.warn('[Firebase] Config chưa điền – dùng demo account cục bộ')
    return false
  }
  try {
    const app = initializeApp(FIREBASE_CONFIG)
    _auth     = getAuth(app)
    _db       = getFirestore(app)
    console.info('[Firebase] Kết nối thành công ✅')
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
  const secAuth = getAuth(secApp)
  try {
    const cred = await createUserWithEmailAndPassword(secAuth, email, password)
    // Ghi hồ sơ bằng _db (app chính) để admin vẫn là người ghi
    // Lưu ý: lưu password dạng văn bản chỉ phục vụ đồ án/demo (email ảo). Không dùng cho hệ thống thật.
    await setUserProfile(cred.user.uid, {
      email,
      name:       profile.name       || email,
      role:       profile.role       || 'student',
      subjectIds: profile.subjectIds ?? [],
      password:   password,
      phone:      profile.phone || '',
      ...(profile.expiresAt ? { expiresAt: profile.expiresAt } : {}),
      createdAt:  new Date().toISOString().split('T')[0],
    })
    await signOut(secAuth)
    return cred.user.uid
  } finally {
    try { await deleteApp(secApp) } catch {}
  }
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
// Cách làm: đăng nhập ngầm bằng app phụ với mật khẩu hiện tại (lưu trong Firestore),
// rồi updatePassword. Sau đó cập nhật lại bản password trong Firestore.
export const adminSetPassword = async (uid, email, oldPassword, newPassword) => {
  if (!isConfigured()) throw new Error('Chưa kết nối Firebase')
  if (!oldPassword) throw new Error('Không có mật khẩu hiện tại đã lưu — không thể đổi tự động. Hãy dùng "Gửi email đặt lại" hoặc xóa & tạo lại tài khoản.')
  const secApp  = initializeApp(FIREBASE_CONFIG, 'secpw-' + Date.now())
  const secAuth = getAuth(secApp)
  try {
    const cred = await signInWithEmailAndPassword(secAuth, email, oldPassword)
    await updatePassword(cred.user, newPassword)
    await signOut(secAuth)
    await setUserProfile(uid, { password: newPassword })  // cập nhật bản lưu (app chính = admin)
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
  await setUserProfile(u.uid, { password: newPassword })  // đồng bộ bản lưu để admin xem
}

// ── Xóa dữ liệu Firestore của một user (user + userData + activities) ──
// Lưu ý: bản ghi trong Authentication phải xóa ở Firebase Console hoặc Admin SDK.
export const deleteUserData = async (uid) => {
  if (!_db) return
  await Promise.allSettled([
    deleteDoc(doc(_db, 'user', uid)),
    deleteDoc(doc(_db, 'userData', uid)),
    deleteDoc(doc(_db, 'activities', uid)),
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
