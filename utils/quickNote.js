// utils/quickNote.js – Ghi chú nhanh: nội dung và vị trí thanh nổi, lưu trên trình duyệt, RIÊNG TỪNG TÀI KHOẢN.
// Thẻ ở trang Tiện ích và thanh ghi chú nổi (components/QuickNote.js) cùng đọc/ghi qua đây nên luôn khớp nhau.

export const NOTE_KEY = 'st_scratchpad'
export const PANEL_KEY = 'st_scratchpad_panel'

// Khóa chủ sở hữu, trùng cách app.js ghi st_owner
export const ownerOf = (user) => user?.uid || user?.username || user?.email || 'guest'
export const ownedKey = (key, owner) => `${key}:${owner}`

const store = () => globalThis.localStorage
const cache = new Map()                    // giữ nội dung trong bộ nhớ để vẫn gõ được khi trình duyệt không cho lưu
const listeners = new Set()
const notify = (ok) => listeners.forEach(fn => fn(ok))

function read(key, fallback) {
  if (cache.has(key)) return cache.get(key)
  try { const v = store().getItem(key); return v == null ? fallback : JSON.parse(v) } catch { return fallback }
}
// → false khi trình duyệt không cho lưu (đầy bộ nhớ, chặn lưu trữ)
function write(key, value) {
  cache.set(key, value)
  let ok = true
  try { store().setItem(key, JSON.stringify(value)) } catch { ok = false }
  notify(ok)
  return ok
}

export const readNote = (owner) => String(read(ownedKey(NOTE_KEY, owner), '') ?? '')
export const writeNote = (owner, text) => write(ownedKey(NOTE_KEY, owner), text)
export const readPanel = (owner) => ({ open: false, collapsed: false, pos: null, ...read(ownedKey(PANEL_KEY, owner), {}) })
export const writePanel = (owner, patch) => write(ownedKey(PANEL_KEY, owner), { ...readPanel(owner), ...patch })
export const onNoteChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }
// Tab khác vừa ghi (key = null khi xóa cả bộ nhớ): bỏ bản trong bộ nhớ để đọc lại
export const dropCache = (key) => { if (key == null) cache.clear(); else cache.delete(key); notify(true) }

// Dữ liệu bản trước dùng chung một khóa cho cả máy: chuyển cho tài khoản dùng máy gần nhất (người đã viết nó),
// không đưa cho tài khoản đăng nhập sau. Không ghi đè dữ liệu riêng đã có.
export function adoptLegacy(storage, key, prevOwner, owner) {
  try {
    const old = storage.getItem(key)
    if (old == null) return
    const dest = ownedKey(key, prevOwner || owner)
    if (storage.getItem(dest) == null) storage.setItem(dest, old)
    storage.removeItem(key)
  } catch {}
}

// ── Lưu thành tệp .txt ───────────────────────────────────────────────────────
// UTF-8 có BOM và xuống dòng CRLF để Notepad (cả bản cũ trên Windows) đọc đúng tiếng Việt
export const noteFileText = (text = '') => '﻿' + String(text).replace(/\r?\n/g, '\r\n')

export function noteFileName(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `ghi-chu-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}.txt`
}

// ── Vị trí thanh nổi ─────────────────────────────────────────────────────────
// Giữ cả thanh trong khung nhìn, không đè lên thanh trên cùng (cao `top`); thanh lớn hơn khung thì nằm sát mép trái/trên
export function clampPos(pos, size, view, top = 58, gap = 8) {
  const clamp = (v, lo, hi) => Math.round(Math.max(lo, Math.min(v, hi)))
  return { x: clamp(pos.x, gap, view.w - size.w - gap), y: clamp(pos.y, top + gap, view.h - size.h - gap) }
}
// Vị trí lần đầu: góc dưới bên phải, chừa chỗ cho nút bảng màu nổi
export const defaultPos = (size, view) => clampPos({ x: view.w - size.w - 16, y: view.h - size.h - 84 }, size, view)
