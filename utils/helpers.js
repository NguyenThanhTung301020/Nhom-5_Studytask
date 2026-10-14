// utils/helpers.js – Hàm tiện ích dùng chung

export const isOverdue = (d) => {
  if (d.status === 'completed') return false
  const t = new Date(); t.setHours(0,0,0,0)
  return new Date(d.dueDate) < t
}

export const getDaysUntil = (s) => {
  const t = new Date(); t.setHours(0,0,0,0)
  return Math.round((new Date(s) - t) / 86400000)
}

export const load = (key, fb) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb } catch { return fb }
}

export const save = (key, d) => {
  try { localStorage.setItem(key, JSON.stringify(d)) } catch {}
}

export const applySettings = (s) => {
  const root = document.documentElement
  const hex = s.accentColor || '#4e73df'
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  root.style.setProperty('--primary', hex)
  root.style.setProperty('--bs-primary', hex)
  root.style.setProperty('--bs-primary-rgb', `${r},${g},${b}`)
  root.style.setProperty('--font-base', s.fontSize === 'large' ? '17px' : '15px')
  root.setAttribute('data-theme', s.darkMode ? 'dark' : 'light')
}

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

export const getDayLabel = (days) => {
  if (days < 0)  return `Quá ${-days} ngày`
  if (days === 0) return 'Hôm nay!'
  if (days === 1) return 'Ngày mai'
  return `Còn ${days} ngày`
}

// Kiểm tra quyền theo role
import { PERMS } from './constants.js'
export const can = (role, action) => !!(PERMS[role] && PERMS[role][action])
