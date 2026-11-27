// components/QuickNote.js – Thanh ghi chú nhanh nổi: kéo được, đi theo mọi trang, thu gọn/đóng được, lưu tệp .txt.
// Dữ liệu và phần tính vị trí ở utils/quickNote.js.
import { downloadBlob } from '../utils/helpers.js'
import { ownedKey, NOTE_KEY, PANEL_KEY, readNote, writeNote, readPanel, writePanel, onNoteChange, dropCache,
         noteFileText, noteFileName, clampPos, defaultPos } from '../utils/quickNote.js'

const { useState, useEffect, useLayoutEffect, useRef, createElement: h } = window.React

// Nội dung ghi chú và trạng thái thanh nổi của một tài khoản; mọi nơi dùng hook này cập nhật cùng lúc
export function useQuickNote(owner) {
  const [, setTick] = useState(0)
  const [saved, setSaved] = useState(null)            // true: vừa lưu xong, false: trình duyệt không cho lưu
  useEffect(() => {
    const off = onNoteChange((ok) => { setTick(t => t + 1); if (!ok) setSaved(false) })
    const other = (e) => { if (e.key == null || e.key === ownedKey(NOTE_KEY, owner) || e.key === ownedKey(PANEL_KEY, owner)) dropCache(e.key) }
    window.addEventListener('storage', other)
    return () => { off(); window.removeEventListener('storage', other) }
  }, [owner])
  useEffect(() => { if (saved) { const t = setTimeout(() => setSaved(null), 1500); return () => clearTimeout(t) } }, [saved])
  return {
    note: readNote(owner),
    panel: readPanel(owner),
    saved,
    setNote: (text) => setSaved(writeNote(owner, text)),
    setPanel: (patch) => writePanel(owner, patch),
  }
}

export const saveNoteFile = (text) =>
  downloadBlob(new Blob([noteFileText(text)], { type: 'text/plain;charset=utf-8' }), noteFileName())

export const SaveBadge = ({ saved }) =>
  saved === true ? h('span', { className: 'badge bg-success-subtle text-success' }, h('i', { className: 'bi bi-check2 me-1' }), 'Đã lưu')
  : saved === false ? h('span', { className: 'badge bg-danger-subtle text-danger' }, 'Không lưu được trên máy này')
  : null

function FloatingNote({ owner }) {
  const { note, panel, saved, setNote, setPanel } = useQuickNote(owner)
  const ref = useRef(null)
  const drag = useRef(null)
  const [size, setSize] = useState(null)              // kích thước thật của thanh, đo sau khi vẽ
  const [view, setView] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  const [moving, setMoving] = useState(null)          // vị trí trong lúc kéo

  useEffect(() => {
    const onResize = () => setView({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (!size || size.w !== el.offsetWidth || size.h !== el.offsetHeight) setSize({ w: el.offsetWidth, h: el.offsetHeight })
  })

  // Vị trí đã lưu giữ nguyên; chỉ vị trí HIỂN THỊ bị kéo vào trong khung, để mở rộng cửa sổ lại thì thanh về chỗ cũ
  const wanted = moving || panel.pos
  const pos = !size ? null : wanted ? clampPos(wanted, size, view) : defaultPos(size, view)

  const start = (e) => {
    if (e.button !== 0 || e.target.closest('button') || !pos) return
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, last: null }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }
  const move = (e) => {
    if (!drag.current) return
    drag.current.last = clampPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy }, size, view)
    setMoving(drag.current.last)
  }
  const stop = () => {
    const last = drag.current?.last
    drag.current = null
    if (last) setPanel({ pos: last })
    setMoving(null)
  }
  const keys = (e) => {                               // dời bằng phím mũi tên khi thanh tiêu đề đang được chọn
    const step = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[e.key]
    if (!step || !pos || e.target !== e.currentTarget) return
    e.preventDefault()
    setPanel({ pos: clampPos({ x: pos.x + step[0], y: pos.y + step[1] }, size, view) })
  }

  const btn = (icon, title, onClick, extra = {}) =>
    h('button', { type: 'button', className: 'btn btn-sm qn-btn', title, 'aria-label': title, onClick, ...extra }, h('i', { className: `bi bi-${icon}` }))

  return h('section', { ref, className: `qn-panel${panel.collapsed ? ' qn-collapsed' : ''}`, 'aria-label': 'Thanh ghi chú nhanh',
      style: pos ? { left: pos.x, top: pos.y } : { left: 0, top: 0, visibility: 'hidden' } },
    h('div', { className: 'qn-head', tabIndex: 0, title: 'Kéo để di chuyển (hoặc dùng phím mũi tên)',
        onPointerDown: start, onPointerMove: move, onPointerUp: stop, onPointerCancel: stop, onKeyDown: keys },
      h('i', { className: 'bi bi-grip-vertical text-muted' }),
      h('span', { className: 'fw-semibold small me-auto text-nowrap' }, 'Ghi chú nhanh'),
      !panel.collapsed && h(SaveBadge, { saved }),
      btn('download', 'Lưu thành tệp .txt', () => saveNoteFile(note), { disabled: !note.trim() }),
      btn(panel.collapsed ? 'chevron-up' : 'dash-lg', panel.collapsed ? 'Mở rộng' : 'Thu gọn', () => setPanel({ collapsed: !panel.collapsed })),
      btn('x-lg', 'Đóng (nội dung vẫn được giữ)', () => setPanel({ open: false }))
    ),
    !panel.collapsed && h('div', { className: 'qn-body' },
      h('textarea', { className: 'form-control form-control-sm qn-text', value: note, 'aria-label': 'Nội dung ghi chú nhanh',
        placeholder: 'Ghi chú đi theo bạn qua mọi trang...', onChange: e => setNote(e.target.value) }),
      h('small', { className: 'text-muted' }, `${note.length} ký tự`)
    )
  )
}

export default function QuickNote({ owner }) {
  const { panel } = useQuickNote(owner)
  return panel.open ? h(FloatingNote, { owner }) : null
}
