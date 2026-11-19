// pages/Tools.js – Trang Tiện ích hỗ trợ học tập
import { load, save } from '../utils/helpers.js'

const { useState, useEffect, useRef, createElement: h } = window.React

// ─────────────────────────────────────────────────────────────────
// 1. Đồng hồ Pomodoro
// ─────────────────────────────────────────────────────────────────
function Pomodoro() {
  const MODES = {
    work:  { label: 'Tập trung', mins: 25, color: '#e74a3b' },
    short: { label: 'Nghỉ ngắn', mins: 5,  color: '#1cc88a' },
    long:  { label: 'Nghỉ dài',  mins: 15, color: '#36b9cc' },
  }
  const [mode,    setMode]    = useState('work')
  const [left,    setLeft]    = useState(MODES.work.mins * 60)
  const [running, setRunning] = useState(false)
  const tick = useRef(null)

  useEffect(() => {
    if (running) {
      tick.current = setInterval(() => setLeft(l => l > 0 ? l - 1 : 0), 1000)
      return () => clearInterval(tick.current)
    }
  }, [running])

  useEffect(() => {
    if (left === 0 && running) {
      setRunning(false)
      try { new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==').play() } catch {}
    }
  }, [left, running])

  const switchMode = (m) => { setMode(m); setLeft(MODES[m].mins * 60); setRunning(false) }
  const reset      = ()  => { setLeft(MODES[mode].mins * 60); setRunning(false) }

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const pct = 100 - (left / (MODES[mode].mins * 60)) * 100

  return h('div', { className: 'tool-card card border-0 shadow-sm h-100' },
    h('div', { className: 'card-body d-flex flex-column' },
      h('div', { className: 'tool-head' },
        h('div', { className: 'tool-icon', style: { backgroundColor: 'rgba(231,74,59,.12)', color: '#e74a3b' } }, h('i', { className: 'bi bi-stopwatch' })),
        h('div', null, h('div', { className: 'fw-bold' }, 'Đồng hồ Pomodoro'), h('small', { className: 'text-muted' }, 'Học tập theo phương pháp Pomodoro'))
      ),
      h('div', { className: 'd-flex gap-1 mb-3 justify-content-center' },
        Object.entries(MODES).map(([k, v]) =>
          h('button', { key: k, className: `btn btn-sm ${mode === k ? 'text-white' : 'btn-outline-secondary'}`,
            style: mode === k ? { backgroundColor: v.color, borderColor: v.color } : {}, onClick: () => switchMode(k) }, v.label)
        )
      ),
      h('div', { className: 'pomodoro-display', style: { color: MODES[mode].color } }, `${mm}:${ss}`),
      h('div', { className: 'progress mb-3', style: { height: 6 } },
        h('div', { className: 'progress-bar', style: { width: `${pct}%`, backgroundColor: MODES[mode].color } })
      ),
      h('div', { className: 'd-flex gap-2 mt-auto' },
        h('button', { className: 'btn flex-grow-1 text-white', style: { backgroundColor: MODES[mode].color }, onClick: () => setRunning(r => !r) },
          h('i', { className: `bi bi-${running ? 'pause-fill' : 'play-fill'} me-1` }), running ? 'Tạm dừng' : 'Bắt đầu'
        ),
        h('button', { className: 'btn btn-light', onClick: reset, title: 'Đặt lại' }, h('i', { className: 'bi bi-arrow-counterclockwise' }))
      )
    )
  )
}

// ─────────────────────────────────────────────────────────────────
// 2. Quy đổi điểm (thang 10 → thang 4 + điểm chữ)
// ─────────────────────────────────────────────────────────────────
function GradeConverter() {
  const [score, setScore] = useState('')

  const convert = (s) => {
    const v = parseFloat(s)
    if (Number.isNaN(v) || v < 0 || v > 10) return null
    let letter, gpa4
    if (v >= 8.5)      { letter = 'A';  gpa4 = 4.0 }
    else if (v >= 8.0) { letter = 'B+'; gpa4 = 3.5 }
    else if (v >= 7.0) { letter = 'B';  gpa4 = 3.0 }
    else if (v >= 6.5) { letter = 'C+'; gpa4 = 2.5 }
    else if (v >= 5.5) { letter = 'C';  gpa4 = 2.0 }
    else if (v >= 5.0) { letter = 'D+'; gpa4 = 1.5 }
    else if (v >= 4.0) { letter = 'D';  gpa4 = 1.0 }
    else               { letter = 'F';  gpa4 = 0.0 }
    return { letter, gpa4, pass: v >= 4.0 }
  }
  const res = convert(score)

  return h('div', { className: 'tool-card card border-0 shadow-sm h-100' },
    h('div', { className: 'card-body d-flex flex-column' },
      h('div', { className: 'tool-head' },
        h('div', { className: 'tool-icon', style: { backgroundColor: 'rgba(246,194,62,.15)', color: '#e67e22' } }, h('i', { className: 'bi bi-award' })),
        h('div', null, h('div', { className: 'fw-bold' }, 'Quy đổi điểm'), h('small', { className: 'text-muted' }, 'Thang 10 → thang 4 & điểm chữ'))
      ),
      h('label', { className: 'form-label fw-semibold small' }, 'Nhập điểm hệ 10'),
      h('input', { type: 'number', className: 'form-control mb-3', placeholder: 'VD: 8.5', min: 0, max: 10, step: 0.1, value: score, onChange: e => setScore(e.target.value) }),
      res
        ? h('div', { className: 'grade-result mt-auto' },
            h('div', { className: 'd-flex justify-content-around text-center' },
              h('div', null, h('div', { className: 'grade-big', style: { color: res.pass ? '#1cc88a' : '#e74a3b' } }, res.letter), h('small', { className: 'text-muted' }, 'Điểm chữ')),
              h('div', null, h('div', { className: 'grade-big', style: { color: '#4e73df' } }, res.gpa4.toFixed(1)), h('small', { className: 'text-muted' }, 'Hệ 4')),
              h('div', null, h('div', { className: 'grade-big', style: { color: res.pass ? '#1cc88a' : '#e74a3b' } }, h('i', { className: `bi bi-${res.pass ? 'check-circle-fill' : 'x-circle-fill'}` })), h('small', { className: 'text-muted' }, res.pass ? 'Đạt' : 'Không đạt'))
            )
          )
        : score && h('div', { className: 'alert alert-warning small py-2 mt-auto mb-0' }, h('i', { className: 'bi bi-exclamation-triangle me-1' }), 'Điểm phải trong khoảng 0–10')
    )
  )
}

// ─────────────────────────────────────────────────────────────────
// 3. Ghi chú nhanh (lưu localStorage)
// ─────────────────────────────────────────────────────────────────
function Scratchpad() {
  const [note, setNote]   = useState(() => load('st_scratchpad', ''))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => { save('st_scratchpad', note); setSaved(true) }, 600)
    return () => clearTimeout(t)
  }, [note])

  useEffect(() => { if (saved) { const t = setTimeout(() => setSaved(false), 1500); return () => clearTimeout(t) } }, [saved])

  return h('div', { className: 'tool-card card border-0 shadow-sm h-100' },
    h('div', { className: 'card-body d-flex flex-column' },
      h('div', { className: 'tool-head' },
        h('div', { className: 'tool-icon', style: { backgroundColor: 'rgba(54,185,204,.12)', color: '#36b9cc' } }, h('i', { className: 'bi bi-pencil-square' })),
        h('div', { className: 'flex-grow-1' }, h('div', { className: 'fw-bold' }, 'Ghi chú nhanh'), h('small', { className: 'text-muted' }, 'Tự động lưu trên thiết bị')),
        saved && h('span', { className: 'badge bg-success-subtle text-success' }, h('i', { className: 'bi bi-check2 me-1' }), 'Đã lưu')
      ),
      h('textarea', { className: 'form-control flex-grow-1', rows: 6, placeholder: 'Ghi chú ý tưởng, việc cần làm, công thức cần nhớ...', value: note, onChange: e => setNote(e.target.value), style: { resize: 'none' } }),
      h('div', { className: 'd-flex justify-content-between align-items-center mt-2' },
        h('small', { className: 'text-muted' }, `${note.length} ký tự`),
        note && h('button', { className: 'btn btn-sm btn-outline-danger', onClick: () => setNote('') }, h('i', { className: 'bi bi-trash me-1' }), 'Xóa')
      )
    )
  )
}

// ─────────────────────────────────────────────────────────────────
// Main Tools Page
// ─────────────────────────────────────────────────────────────────
export default function Tools() {
  return h('div', { className: 'container-fluid py-4' },
    h('div', { className: 'mb-4' },
      h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-tools me-2', style: { color: 'var(--primary)' } }), 'Tiện ích'),
      h('small', { className: 'text-muted' }, 'Các công cụ mở rộng hỗ trợ học tập hiệu quả')
    ),
    h('div', { className: 'row g-3' },
      h('div', { className: 'col-12 col-md-6 col-xl-4' }, h(Pomodoro)),
      h('div', { className: 'col-12 col-md-6 col-xl-4' }, h(GradeConverter)),
      h('div', { className: 'col-12 col-md-6 col-xl-4' }, h(Scratchpad))
    )
  )
}
