// utils/firebase.js – Lớp truy cập dữ liệu + đăng nhập qua API riêng trên server (/api).
// Trước đây file này dùng Firebase Auth + Firestore; nay dữ liệu lưu ở SQLite trên server
// (server/studytask_api.py). Giữ nguyên tên các hàm xuất ra để các trang không phải sửa.
//   - Chạy với ?offline=1 trên localhost → không gọi server, dùng tài khoản demo cục bộ.
//   - Mọi trường hợp khác → gọi API cùng domain (/api/...).

const IS_LOCAL = typeof location !== 'undefined' && ['localhost', '127.0.0.1'].includes(location.hostname)
const OFFLINE  = IS_LOCAL && new URLSearchParams(location.search).has('offline')

export const APP_ENV = OFFLINE ? 'offline' : 'server'

let _ready = false
let _user  = null            // { uid, username } của phiên hiện tại
const _listeners = new Set()

let _resolved = false        // đã biết trạng thái đăng nhập ban đầu chưa
const emitAuth = () => {
  _resolved = true
  _listeners.forEach(cb => { try { cb(_user) } catch (e) { console.error(e) } })
}

// Gọi API; lỗi ném ra có .code giống Firebase để giữ nguyên các chỗ xử lý lỗi cũ
async function api(method, path, body) {
  const res = await fetch('/api' + path, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body:    body !== undefined ? JSON.stringify(body) : undefined,
  })
  let data = null
  try { data = await res.json() } catch {}
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Lỗi máy chủ (${res.status})`)
    err.code = data?.error?.code || `http-${res.status}`
    throw err
  }
  return data
}

const enc = encodeURIComponent
const docPath = (col, id) => `/doc/${enc(col)}/${enc(String(id))}`

// Khởi tạo một lần, gọi từ app.js
export function initFirebase() {
  if (OFFLINE) {
    console.warn('[Server] Chế độ offline – dùng demo account cục bộ')
    return false
  }
  _ready = true
  // Khôi phục phiên đăng nhập (cookie) rồi báo cho các onAuth đang chờ
  api('GET', '/auth/me')
    .then(r => { _user = r.user })
    .catch(e => { console.warn('[Server] auth/me:', e.message); _user = null })
    .finally(emitAuth)
  console.info('[Server] Kết nối API ✅')
  return true
}

export const isFirebaseReady = () => _ready

// ── Đăng nhập / Đăng xuất ──────────────────────────────────────
export const fbLogin = async (username, pw) => {
  const r = await api('POST', '/auth/login', { username, password: pw })
  _user = r.user
  emitAuth()   // như onAuthStateChanged: app.js tải dữ liệu khi nhận được sự kiện này
  return { user: { uid: _user.uid, username: _user.username, displayName: null } }
}

export const fbLogout = async () => {
  try { await api('POST', '/auth/logout', {}) } finally { _user = null; emitAuth() }
}

// Lắng nghe trạng thái đăng nhập (giữ đăng nhập qua cookie phiên)
export const onAuth = (callback) => {
  _listeners.add(callback)
  // Nếu /auth/me đã trả lời trước khi đăng ký thì báo ngay; chưa thì emitAuth sẽ gọi sau.
  if (_resolved) callback(_user)
  return () => _listeners.delete(callback)
}

// ── Hồ sơ người dùng (role) ────────────────────────────────────
// Collection: user/{uid}  →  { name, email, role, subjectIds, phone, expiresAt, createdAt }
const fsGetData = async (col, id) => (await api('GET', docPath(col, id))).data

export const getUserProfile = async (uid) => _ready ? fsGetData('user', uid) : null
export const setUserProfile = (uid, data) => _ready ? api('PUT', docPath('user', uid), { data, merge: true }) : Promise.resolve()

// ── Dữ liệu dùng chung (subjects, deadlines, quizzes, materials) ─
// Document: sharedData/global  →  đọc bởi tất cả, ghi bởi admin/teacher/training
export const loadSharedData = async () => _ready ? fsGetData('sharedData', 'global') : null
export const saveSharedKey  = (key, value) =>
  _ready ? api('PUT', docPath('sharedData', 'global'), { data: { [key]: value }, merge: true }) : Promise.resolve()

// ── Dữ liệu cá nhân theo user ────────────────────────────────────
export const loadUserData = async (uid) => _ready ? fsGetData('userData', uid) : null
export const saveUserKey  = (uid, key, value) =>
  _ready ? api('PUT', docPath('userData', uid), { data: { [key]: value }, merge: true }) : Promise.resolve()

// ── Tạo tài khoản mới (Admin dùng) ─────────────────────────────
export const createAccountSecondary = async (username, password, profile = {}) => {
  if (!_ready) throw new Error('Chưa kết nối máy chủ')
  const r = await api('POST', '/admin/users', {
    username, password,
    profile: {
      name:       profile.name       || username,
      role:       profile.role       || 'student',
      subjectIds: profile.subjectIds ?? [],
      phone:      profile.phone || '',
      ...(profile.expiresAt ? { expiresAt: profile.expiresAt } : {}),
    },
  })
  return r.uid
}

// ── Mật khẩu ───────────────────────────────────────────────────
// Máy chủ chỉ lưu mã băm (PBKDF2) nên không còn "bản mật khẩu" để admin xem.
export const getAllSecrets = async () => ({})
export const migrateLegacyPasswords = async () => 0

// ── Email khôi phục, quên mật khẩu, ảnh đại diện ──
export const apiCall = api
export const sendResetEmail = (email) => api("POST", "/auth/forgot", { identifier: email })   // admin: gửi mã tới email khôi phục của người dùng (nếu có)
export const getAccount = () => api('GET', '/account')
export const requestEmailLink = (email, password) => api('POST', '/account/email', { email, password })
export const verifyEmailLink = (code) => api('POST', '/account/email/verify', { code })
export const unlinkEmail = (password) => api('DELETE', '/account/email', { password })
export const forgotPassword = (identifier) => api('POST', '/auth/forgot', { identifier })
export const resetPassword = (identifier, code, newPassword) => api('POST', '/auth/reset', { identifier, code, newPassword })
export const removeAvatar = () => api('DELETE', '/account/avatar', {})
export const uploadAvatar = async (blob) => {
  const res = await fetch('/api/account/avatar?filename=avatar.jpg', { method: 'POST', credentials: 'same-origin', body: blob })
  let data = null
  try { data = await res.json() } catch {}
  if (!res.ok) throw new Error(data?.error?.message || `Tải ảnh lỗi (${res.status})`)
  return data
}

// Admin đổi mật khẩu cho user khác (không cần biết mật khẩu cũ)
export const adminSetPassword = async (uid, _email, _oldPassword, newPassword) => {
  if (!_ready) throw new Error('Chưa kết nối máy chủ')
  await api('POST', `/admin/users/${enc(uid)}/password`, { newPassword })
}

// Người dùng tự đổi mật khẩu của chính mình
export const changeOwnPassword = async (currentPassword, newPassword) => {
  if (!_user) throw new Error('Chưa đăng nhập')
  await api('POST', '/auth/change-password', { currentPassword, newPassword })
}

// ── Xóa tài khoản + dữ liệu của một user ───────────────────────
export const deleteUserData = async (uid) => { if (_ready) await api('DELETE', `/admin/users/${enc(uid)}`) }

// ── Đọc tất cả người dùng (Admin dùng) ─────────────────────────
export const getAllUsers = async () => {
  if (!_ready) return []
  try {
    return (await api('GET', '/doc/user')).docs.map(({ id, ...d }) => ({ uid: id, ...d }))
  } catch (e) {
    console.warn('[Server] getAllUsers:', e.message)
    return []
  }
}

// Hồ sơ học vụ (mã số, khoa, lớp, học kỳ, GPA…) do Admin cấp; sinh viên/giáo viên chỉ tự sửa email và số điện thoại
export const adminGetProfile = async (targetUid) => {
  if (!_ready) return {}
  const d = await fsGetData('userData', targetUid).catch(() => null)
  return (d && d.profile) || {}
}
export const adminSetProfile = (targetUid, profile) =>
  _ready ? api('PUT', docPath('userData', targetUid), { data: { profile }, merge: true }) : Promise.resolve()
export const adminUpdateUser = (targetUid, data) =>
  _ready ? api('PUT', docPath('user', targetUid), { data, merge: true }) : Promise.resolve()

// ── Nhật ký hoạt động (cho trang Quản lý lớp học) ───────────────
export const logActivity = (uid, meta, event) =>
  _ready ? api('POST', docPath('activities', uid) + '/append',
    { field: 'events', value: event, set: { uid, name: meta.name || '', username: meta.username || '' } }) : Promise.resolve()

export const loadAllActivities = async () => {
  if (!_ready) return []
  try {
    return (await api('GET', '/doc/activities')).docs.map(({ id, ...d }) => ({ uid: id, ...d }))
  } catch (e) {
    console.warn('[Server] loadAllActivities:', e.message)
    return []
  }
}

// ── Truy cập document chung (học phí, quy chế điểm, CTĐT, xét tốt nghiệp, khóa luận) ──
export const fsGet = async (col, id) => {
  if (!_ready) return null
  const r = await api('GET', docPath(col, id))
  return r.exists ? { id: String(id), ...r.data } : null
}
export const fsSet = (col, id, data, merge = true) =>
  _ready ? api('PUT', docPath(col, id), { data, merge }) : Promise.resolve()
export const fsList = async (col) => {
  if (!_ready) return []
  return (await api('GET', `/doc/${enc(col)}`)).docs
}
export const fsDelete = (col, id) => _ready ? api('DELETE', docPath(col, id)) : Promise.resolve()

// ── Tải file lên server (giáo viên / admin) → { url, name, size } ──
export const uploadFile = async (file, hwId) => {
  const res = await fetch('/api/upload?filename=' + enc(file.name) + (hwId != null ? '&hw=' + enc(String(hwId)) : ''), {
    method: 'POST', credentials: 'same-origin', body: file,
  })
  let data = null
  try { data = await res.json() } catch {}
  if (!res.ok) throw new Error(data?.error?.message || `Tải file lỗi (${res.status})`)
  return data
}
