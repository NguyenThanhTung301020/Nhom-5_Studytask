// pages/Contact.js – Hỗ trợ trực tuyến: nhắn tin trực tiếp với quản trị viên (realtime) + FAQ
import UserAvatar from '../components/UserAvatar.js'
import { ROLES } from '../utils/constants.js'
import { isFirebaseReady } from '../utils/firebase.js'
import { subscribe, getRealtimeState, chatMessages, chatSend, chatRead, chatThreads,
         desktopPermission, askDesktopPermission, canDesktopNotify } from '../utils/chat.js'

const { useState, useEffect, useRef, useCallback, createElement: h } = window.React

const SUPPORT_INFO = [
  { icon: 'envelope-fill',  label: 'Email hỗ trợ', value: 'support@studytask.io.vn' },
  { icon: 'clock-fill',     label: 'Giờ làm việc', value: 'Thứ 2 – Thứ 6: 8:00 – 17:00' },
  { icon: 'chat-dots-fill', label: 'Nhắn tin',     value: 'Gửi tin ở khung bên cạnh – quản trị viên trả lời ngay khi trực tuyến' },
]

const FAQ_ITEMS = [
  { q: 'Tôi quên mật khẩu thì làm thế nào?', a: 'Nếu đã liên kết email cá nhân trong Hồ sơ, bấm “Quên mật khẩu?” ở màn hình đăng nhập, nhập tên đăng nhập (hoặc email cá nhân) để nhận mã 6 số và đặt mật khẩu mới. Nếu chưa liên kết, hãy nhắn tin cho hỗ trợ để được cấp lại mật khẩu.' },
  { q: 'Dữ liệu và mật khẩu của tôi được lưu thế nào?', a: 'Dữ liệu lưu trên máy chủ của hệ thống. Mật khẩu không bao giờ được lưu dạng văn bản: chỉ lưu bản băm PBKDF2-SHA256 kèm salt riêng cho từng tài khoản.' },
  { q: 'Tôi nộp bài tập bằng file gì?', a: 'Mỗi bài tập do giáo viên quy định các định dạng được nhận (ví dụ PDF, Word). Hệ thống từ chối file sai định dạng hoặc quá 15MB.' },
  { q: 'Tôi muốn đổi ảnh đại diện, số điện thoại?', a: 'Vào Hồ sơ của tôi → chọn “Đổi ảnh” để tải ảnh đại diện, và bấm Chỉnh sửa để cập nhật số điện thoại.' },
  { q: 'Có dùng được trên điện thoại không?', a: 'Có, giao diện responsive. Cần kết nối Internet vì dữ liệu nằm trên máy chủ.' },
]

const pad = (n) => String(n).padStart(2, '0')
const fmtTime = (ts) => { const d = new Date(ts * 1000); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
const fmtDay = (ts) => new Date(ts * 1000).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })
const sameDay = (a, b) => new Date(a * 1000).toDateString() === new Date(b * 1000).toDateString()
const clip = (s, n = 48) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

function FaqItem({ item }) {
  const [open, setOpen] = useState(false)
  return h('div', { className: 'faq-item' },
    h('button', { className: 'faq-question', onClick: () => setOpen(!open) },
      h('span', null, item.q), h('i', { className: `bi bi-chevron-${open ? 'up' : 'down'} flex-shrink-0` })),
    open && h('div', { className: 'faq-answer' }, item.a))
}

// ── Danh sách tin + ô nhập (dùng chung cho người dùng và admin) ──
function Conversation({ messages, meIsStaff, peer, text, setText, onSend, sending, error, disabled, placeholder }) {
  const box = useRef(null)
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight }, [messages.length])
  const lastMine = [...messages].reverse().find(m => m.fromStaff === meIsStaff)
  return h('div', { className: 'chat-pane' },
    h('div', { className: 'chat-msgs', ref: box },
      messages.length === 0 && h('div', { className: 'text-center text-muted small my-auto py-5' },
        h('i', { className: 'bi bi-chat-heart fs-2 d-block mb-2' }), placeholder),
      messages.map((m, i) => {
        const mine = m.fromStaff === meIsStaff
        const newDay = i === 0 || !sameDay(messages[i - 1].ts, m.ts)
        return h(window.React.Fragment, { key: m.id },
          newDay && h('div', { className: 'chat-day' }, fmtDay(m.ts)),
          h('div', { className: `chat-row${mine ? ' mine' : ''}` },
            !mine && h(UserAvatar, { name: peer.name, src: peer.avatar, size: 28, color: peer.color }),
            h('div', { className: 'chat-bubble' },
              h('div', { style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }, m.text),
              h('div', { className: 'chat-meta' }, fmtTime(m.ts),
                mine && lastMine && lastMine.id === m.id && h('span', { className: 'ms-1' }, m.read ? '· Đã xem' : '· Đã gửi')))))
      })),
    error && h('div', { className: 'small text-danger px-3 pb-1' }, error),
    h('form', { className: 'chat-input', onSubmit: (e) => { e.preventDefault(); onSend() } },
      h('textarea', { className: 'form-control', rows: 1, maxLength: 2000, value: text, disabled, placeholder: 'Nhập tin nhắn… (Enter để gửi, Shift+Enter xuống dòng)',
        onChange: (e) => setText(e.target.value),
        onKeyDown: (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() } } }),
      h('button', { className: 'btn btn-primary', type: 'submit', disabled: disabled || sending || !text.trim() },
        sending ? h('span', { className: 'spinner-border spinner-border-sm' }) : h('i', { className: 'bi bi-send-fill' }))))
}

// Nối thêm tin vào danh sách, bỏ trùng theo id
const mergeMsgs = (prev, add) => {
  const ids = new Set(prev.map(m => m.id))
  const fresh = add.filter(m => !ids.has(m.id))
  return fresh.length ? [...prev, ...fresh].sort((a, b) => a.id - b.id) : prev
}

// ── Người dùng thường: một cuộc hội thoại với bộ phận hỗ trợ ──
function UserChat({ user }) {
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [online, setOnline] = useState(getRealtimeState().supportOnline)
  const [loaded, setLoaded] = useState(false)
  const lastId = useRef(0)
  lastId.current = msgs.length ? msgs[msgs.length - 1].id : 0

  const pull = useCallback(async () => {
    try {
      const r = await chatMessages(null, lastId.current)
      setOnline(r.supportOnline)
      if (r.messages.length) setMsgs(p => mergeMsgs(p, r.messages))
      if (r.messages.some(m => m.fromStaff)) chatRead().catch(() => {})
      setLoaded(true)
    } catch (e) { setError(e.message); setLoaded(true) }
  }, [])

  useEffect(() => {
    pull()
    chatRead().catch(() => {})
    return subscribe((ev) => {
      if (ev.type === 'chat' && ev.thread === user.uid) {
        setMsgs(p => mergeMsgs(p, [ev.msg]))
        if (ev.msg.fromStaff && !document.hidden) chatRead().catch(() => {})
      } else if (ev.type === 'support') setOnline(ev.online)
      else if (ev.type === 'hello') setOnline(ev.supportOnline)
      else if (ev.type === 'read' && ev.by === 'staff') setMsgs(p => p.map(m => (m.fromStaff ? m : { ...m, read: true })))
      else if (ev.type === 'conn' && ev.connected) pull()    // rớt mạng rồi nối lại → lấy phần còn thiếu
    })
  }, [])

  const send = async () => {
    const t = text.trim()
    if (!t || sending) return
    setSending(true); setError('')
    try {
      const r = await chatSend(t)
      setMsgs(p => mergeMsgs(p, [r.message])); setText('')
    } catch (e) { setError(e.message) }
    setSending(false)
  }

  return h('div', { className: 'card border-0 shadow-sm chat-card' },
    h('div', { className: 'chat-head' },
      h(UserAvatar, { name: 'Hỗ trợ', size: 40, color: '#1cc88a', online }),
      h('div', { className: 'flex-grow-1' },
        h('div', { className: 'fw-bold' }, 'Bộ phận hỗ trợ StudyTask'),
        h('div', { className: `small ${online ? 'text-success' : 'text-muted'}` },
          online ? 'Đang trực tuyến – sẽ trả lời ngay' : 'Đang ngoại tuyến – hãy để lại tin nhắn, chúng tôi sẽ phản hồi sớm'))),
    !loaded ? h('div', { className: 'p-5 text-center' }, h('div', { className: 'spinner-border text-primary' }))
      : h(Conversation, { messages: msgs, meIsStaff: false, peer: { name: 'Hỗ trợ', color: '#1cc88a' }, text, setText, onSend: send, sending, error,
          placeholder: 'Chưa có tin nhắn. Hãy mô tả vấn đề bạn gặp phải.' }))
}

// ── Quản trị viên: hộp thư nhiều hội thoại ──
function AdminInbox() {
  const [threads, setThreads] = useState([])
  const [sel, setSel] = useState(null)             // thread uid đang mở
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [perm, setPerm] = useState(desktopPermission())
  const selRef = useRef(null); selRef.current = sel
  const timer = useRef(null)

  const loadThreads = useCallback(async () => {
    try { const r = await chatThreads(); setThreads(r.threads) } catch (e) { setError(e.message) }
  }, [])
  const refreshSoon = useCallback(() => { clearTimeout(timer.current); timer.current = setTimeout(loadThreads, 250) }, [loadThreads])

  const open = useCallback(async (uid) => {
    setSel(uid); setMsgs([]); setError('')
    try {
      const r = await chatMessages(uid, 0)
      setMsgs(r.messages)
      await chatRead(uid)
      setThreads(ts => ts.map(t => (t.thread === uid ? { ...t, unread: 0 } : t)))
    } catch (e) { setError(e.message) }
  }, [])

  useEffect(() => {
    loadThreads()
    return subscribe((ev) => {
      if (ev.type === 'chat') {
        if (ev.thread === selRef.current) {
          setMsgs(p => mergeMsgs(p, [ev.msg]))
          if (!ev.msg.fromStaff && !document.hidden) chatRead(ev.thread).catch(() => {})
        }
        refreshSoon()
      } else if (ev.type === 'presence') {
        setThreads(ts => ts.map(t => (t.thread === ev.uid ? { ...t, online: ev.online } : t)))
      } else if (ev.type === 'read') refreshSoon()
      else if (ev.type === 'conn' && ev.connected) { loadThreads(); if (selRef.current) chatMessages(selRef.current, 0).then(r => setMsgs(r.messages)).catch(() => {}) }
    })
  }, [])

  const send = async () => {
    const t = text.trim()
    if (!t || sending || !sel) return
    setSending(true); setError('')
    try { const r = await chatSend(t, sel); setMsgs(p => mergeMsgs(p, [r.message])); setText(''); refreshSoon() }
    catch (e) { setError(e.message) }
    setSending(false)
  }

  const cur = threads.find(t => t.thread === sel)
  const totalUnread = threads.reduce((s, t) => s + t.unread, 0)
  const roleColor = (r) => ROLES[r]?.color || '#4e73df'

  return h('div', { className: 'card border-0 shadow-sm chat-card' },
    h('div', { className: 'row g-0 chat-admin' },
      // danh sách hội thoại
      h('div', { className: `col-md-4 chat-list${sel ? ' d-none d-md-block' : ''}` },
        h('div', { className: 'chat-head' },
          h('div', { className: 'flex-grow-1 fw-bold' }, h('i', { className: 'bi bi-inbox me-2' }), 'Hộp thư hỗ trợ',
            totalUnread > 0 && h('span', { className: 'badge bg-danger ms-2' }, totalUnread)),
          canDesktopNotify() && perm !== 'granted' && h('button', { className: 'btn btn-outline-primary btn-sm', title: 'Nhận thông báo khi có tin mới, kể cả khi đang ở tab khác',
            onClick: async () => setPerm(await askDesktopPermission()), disabled: perm === 'denied' },
            h('i', { className: 'bi bi-bell me-1' }), perm === 'denied' ? 'Bị chặn' : 'Bật thông báo')),
        threads.length === 0
          ? h('div', { className: 'p-4 text-center text-muted small' }, h('i', { className: 'bi bi-chat-square-text fs-2 d-block mb-2' }), 'Chưa có tin nhắn nào từ người dùng.')
          : threads.map(t => h('button', { key: t.thread, className: `chat-thread${t.thread === sel ? ' active' : ''}`, onClick: () => open(t.thread) },
              h(UserAvatar, { name: t.name, src: t.avatar, size: 40, color: roleColor(t.role), online: t.online }),
              h('div', { className: 'flex-grow-1 min-w-0 text-start' },
                h('div', { className: 'd-flex justify-content-between gap-2' },
                  h('span', { className: `text-truncate ${t.unread ? 'fw-bold' : 'fw-semibold'}` }, t.name),
                  h('small', { className: 'text-muted flex-shrink-0' }, fmtTime(t.last.ts))),
                h('div', { className: 'd-flex justify-content-between gap-2' },
                  h('small', { className: `text-truncate ${t.unread ? 'text-body fw-semibold' : 'text-muted'}` }, (t.last.fromStaff ? 'Bạn: ' : '') + clip(t.last.text)),
                  t.unread > 0 && h('span', { className: 'badge bg-danger rounded-pill flex-shrink-0' }, t.unread)))))),
      // khung hội thoại
      h('div', { className: `col-md-8 d-flex flex-column${sel ? '' : ' d-none d-md-flex'}` },
        !cur ? h('div', { className: 'm-auto text-center text-muted p-5' }, h('i', { className: 'bi bi-chat-dots fs-1 d-block mb-2' }), 'Chọn một hội thoại để xem và trả lời')
          : h(window.React.Fragment, null,
              h('div', { className: 'chat-head' },
                h('button', { className: 'btn btn-sm btn-light d-md-none', onClick: () => setSel(null) }, h('i', { className: 'bi bi-arrow-left' })),
                h(UserAvatar, { name: cur.name, src: cur.avatar, size: 40, color: roleColor(cur.role), online: cur.online }),
                h('div', { className: 'flex-grow-1 min-w-0' },
                  h('div', { className: 'fw-bold text-truncate' }, cur.name),
                  h('div', { className: 'small text-muted text-truncate' }, `${ROLES[cur.role]?.label || cur.role} · ${cur.username} · `,
                    h('span', { className: cur.online ? 'text-success' : '' }, cur.online ? 'đang online' : 'ngoại tuyến')))),
              h(Conversation, { messages: msgs, meIsStaff: true, peer: { name: cur.name, avatar: cur.avatar, color: roleColor(cur.role) }, text, setText, onSend: send, sending, error,
                placeholder: 'Chưa có tin nhắn.' })))))
}

export default function Contact({ user }) {
  const server = isFirebaseReady() && user?.uid
  const isAdmin = user?.role === 'admin'
  return h('div', { className: 'container-fluid py-4' },
    h('div', { className: 'mb-4' },
      h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-headset me-2', style: { color: 'var(--primary)' } }), 'Liên hệ hỗ trợ'),
      h('small', { className: 'text-muted' }, isAdmin ? 'Nhận và trả lời tin nhắn của người dùng theo thời gian thực' : 'Nhắn tin trực tiếp với bộ phận hỗ trợ')),
    !server
      ? h('div', { className: 'alert alert-warning' }, h('i', { className: 'bi bi-wifi-off me-2' }), 'Chức năng nhắn tin cần kết nối máy chủ. Bạn đang ở chế độ cục bộ.')
      : isAdmin
        ? h(AdminInbox)
        : h('div', { className: 'row g-4' },
            h('div', { className: 'col-lg-8' }, h(UserChat, { user })),
            h('div', { className: 'col-lg-4' },
              h('div', { className: 'card border-0 shadow-sm p-3 mb-3' },
                h('div', { className: 'fw-bold mb-3', style: { color: 'var(--primary)' } }, 'Thông tin liên hệ'),
                SUPPORT_INFO.map(s => h('div', { key: s.label, className: 'd-flex gap-2 mb-2' },
                  h('i', { className: `bi bi-${s.icon} text-primary mt-1` }),
                  h('div', null, h('div', { className: 'small text-muted' }, s.label), h('div', { className: 'small fw-semibold' }, s.value))))),
              h('div', { className: 'card border-0 shadow-sm p-3' },
                h('div', { className: 'fw-bold mb-2', style: { color: 'var(--primary)' } }, 'Câu hỏi thường gặp'),
                FAQ_ITEMS.map((f, i) => h(FaqItem, { key: i, item: f }))))))
}
