// utils/store.js – Đọc/ghi document theo collection.
// Có Firebase → Firestore (phân quyền bằng firestore.rules); chế độ offline/demo → localStorage.
import { isFirebaseReady, fsGet, fsSet, fsList, fsDelete } from './firebase.js'
import { load, save } from './helpers.js'

const key = (col) => `st_db_${col}`
const local = (col) => load(key(col), {})

export async function getDocument(col, id) {
  if (isFirebaseReady()) return fsGet(col, id)
  const d = local(col)[String(id)]
  return d ? { id: String(id), ...d } : null
}

export async function setDocument(col, id, data, merge = true) {
  if (isFirebaseReady()) return fsSet(col, id, data, merge)
  const all = local(col)
  all[String(id)] = merge ? { ...(all[String(id)] || {}), ...data } : data
  save(key(col), all)
}

export async function listDocuments(col) {
  if (isFirebaseReady()) return fsList(col)
  return Object.entries(local(col)).map(([id, d]) => ({ id, ...d }))
}

export async function deleteDocument(col, id) {
  if (isFirebaseReady()) return fsDelete(col, id)
  const all = local(col); delete all[String(id)]; save(key(col), all)
}

// Mã lỗi Firestore → câu báo lỗi dễ hiểu
export const errorText = (e) => e?.code === 'permission-denied'
  ? 'Bạn không có quyền thực hiện thao tác này.'
  : (e?.message || String(e))
