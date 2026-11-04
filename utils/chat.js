// utils/chat.js – Hỗ trợ trực tuyến: kết nối thời gian thực (SSE /api/events) + API tin nhắn
import { apiCall } from './firebase.js'

const listeners = new Set()
let es = null
let state = { connected: false, supportOnline: false }

export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }
export const getRealtimeState = () => state
const emit = (ev) => listeners.forEach(fn => { try { fn(ev) } catch (e) { console.error(e) } })

// Mở một luồng sự kiện duy nhất cho cả ứng dụng; trình duyệt tự kết nối lại khi rớt mạng
export function startRealtime() {
  if (es || typeof EventSource === 'undefined') return
  es = new EventSource('/api/events')
  es.onopen = () => { state = { ...state, connected: true }; emit({ type: 'conn', connected: true }) }
  es.onerror = () => { state = { ...state, connected: false }; emit({ type: 'conn', connected: false }) }
  es.onmessage = (m) => {
    let ev
    try { ev = JSON.parse(m.data) } catch { return }
    if (ev.type === 'hello') state = { ...state, supportOnline: !!ev.supportOnline }
    if (ev.type === 'support') state = { ...state, supportOnline: !!ev.online }
    emit(ev)
  }
}

export function stopRealtime() {
  if (es) { es.close(); es = null }
  state = { connected: false, supportOnline: false }
}

export const chatStatus   = () => apiCall('GET', '/chat/status')
export const chatThreads  = () => apiCall('GET', '/chat/threads')
export const chatMessages = (thread, after = 0) =>
  apiCall('GET', `/chat/messages?after=${after}` + (thread ? '&thread=' + encodeURIComponent(thread) : ''))
export const chatSend     = (text, thread) => apiCall('POST', '/chat/messages', { text, thread })
export const chatRead     = (thread) => apiCall('POST', '/chat/read', { thread })

// ── Thông báo: trình duyệt + âm "ting" ──
export const canDesktopNotify = () => typeof Notification !== 'undefined'
export const desktopPermission = () => (canDesktopNotify() ? Notification.permission : 'unsupported')
export const askDesktopPermission = () => (canDesktopNotify() ? Notification.requestPermission() : Promise.resolve('unsupported'))

export function desktopNotify(title, body, tag, onClick) {
  if (!canDesktopNotify() || Notification.permission !== 'granted') return
  try {
    const n = new Notification(title, { body, tag })
    n.onclick = () => { window.focus(); onClick && onClick(); n.close() }
  } catch { /* một số trình duyệt di động chỉ cho phép qua service worker */ }
}

let audioCtx = null
export function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    const o = audioCtx.createOscillator(), g = audioCtx.createGain()
    o.type = 'sine'; o.frequency.value = 880
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35)
    o.connect(g); g.connect(audioCtx.destination)
    o.start(); o.stop(audioCtx.currentTime + 0.4)
  } catch { /* trình duyệt chưa cho phát âm thanh trước khi người dùng tương tác */ }
}
