// pages/Tools.js – Trang Tiện ích hỗ trợ học tập
import { load, save } from '../utils/helpers.js'

const { useState, useEffect, useRef, createElement: h } = window.React

// ─────────────────────────────────────────────────────────────────
// 1. Máy tính bỏ túi
// ─────────────────────────────────────────────────────────────────
function Calculator() {
  const [expr,   setExpr]   = useState('')
  const [result, setResult] = useState('')

  const append = (v) => { setExpr(e => e + v); setResult('') }
  const clear  = ()  => { setExpr(''); setResult('') }
  const back   = ()  => setExpr(e => e.slice(0, -1))

  const calc = () => {
    if (!expr.trim()) return
    // Chỉ cho phép số, toán tử, ngoặc → an toàn
    if (/[^0-9+\-*/().%\s]/.test(expr)) { setResult('Lỗi'); return }
    try {
      // eslint-disable-next-line no-new-func
      const r = Function(`"use strict"; return (${expr.replace(/%/g, '/100')})`)()
      setResult(r === undefined || r === null || Number.isNaN(r) ? 'Lỗi' : String(Math.round(r * 1e8) / 1e8))
    } catch { setResult('Lỗi') }
  }

  const keys = [
    ['C', 'back', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '(', ')'],
  ]

  const onKey = (k) => {
    if (k === 'C') return clear()
    if (k === 'back') return back()
    append(k)
  }

  return h('div', { className: 'tool-card card border-0 shadow-sm h-100' },
    h('div', { className: 'card-body' },
      h('div', { className: 'tool-head' },
        h('div', { className: 'tool-icon', style: { backgroundColor: 'rgba(78,115,223,.12)', color: '#4e73df' } }, h('i', { className: 'bi bi-calculator' })),
        h('div', null, h('div', { className: 'fw-bold' }, 'Máy tính bỏ túi'), h('small', { className: 'text-muted' }, 'Tính toán nhanh'))
      ),
      h('div', { className: 'calc-display' },
        h('div', { className: 'calc-expr' }, expr || '0'),
        result !== '' && h('div', { className: 'calc-result' }, '= ', result)
      ),
      h('div', { className: 'calc-keys' },
        keys.flat().map((k, i) =>
          h('button', {
            key: i,
            className: `calc-key ${['+','-','*','/','%'].includes(k) ? 'op' : ''} ${k === 'C' ? 'clear' : ''}`,
            onClick: () => onKey(k),
          }, k === 'back' ? h('i', { className: 'bi bi-backspace' }) : k === '*' ? '×' : k === '/' ? '÷' : k)
        ),
        h('button', { className: 'calc-key equal', onClick: calc }, '=')
      )
    )
  )
}

// ─────────────────────────────────────────────────────────────────
// 2. Dịch thuật (mở Google Translate)
// ─────────────────────────────────────────────────────────────────
const LANGS = [
  { code: 'auto', name: 'Tự động' }, { code: 'vi', name: 'Tiếng Việt' },
  { code: 'en', name: 'Tiếng Anh' }, { code: 'zh-CN', name: 'Tiếng Trung' },
  { code: 'ja', name: 'Tiếng Nhật' }, { code: 'ko', name: 'Tiếng Hàn' },
  { code: 'fr', name: 'Tiếng Pháp' }, { code: 'de', name: 'Tiếng Đức' },
]

function Translator() {
  const [text, setText] = useState('')
  const [sl,   setSl]   = useState('auto')
  const [tl,   setTl]   = useState('vi')

  const translate = () => {
    if (!text.trim()) return
    const url = `https://translate.google.com/?sl=${sl}&tl=${tl}&text=${encodeURIComponent(text)}&op=translate`
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  const swap = () => { if (sl !== 'auto') { setSl(tl); setTl(sl) } }

  return h('div', { className: 'tool-card card border-0 shadow-sm h-100' },
    h('div', { className: 'card-body d-flex flex-column' },
      h('div', { className: 'tool-head' },
        h('div', { className: 'tool-icon', style: { backgroundColor: 'rgba(28,200,138,.12)', color: '#1cc88a' } }, h('i', { className: 'bi bi-translate' })),
        h('div', null, h('div', { className: 'fw-bold' }, 'Dịch thuật'), h('small', { className: 'text-muted' }, 'Dịch nhanh qua Google Translate'))
      ),
      h('div', { className: 'd-flex align-items-center gap-2 mb-2' },
        h('select', { className: 'form-select form-select-sm', value: sl, onChange: e => setSl(e.target.value) },
          LANGS.map(l => h('option', { key: l.code, value: l.code }, l.name))
        ),
        h('button', { className: 'btn btn-sm btn-light flex-shrink-0', onClick: swap, title: 'Đảo chiều', disabled: sl === 'auto' }, h('i', { className: 'bi bi-arrow-left-right' })),
        h('select', { className: 'form-select form-select-sm', value: tl, onChange: e => setTl(e.target.value) },
          LANGS.filter(l => l.code !== 'auto').map(l => h('option', { key: l.code, value: l.code }, l.name))
        )
      ),
      h('textarea', { className: 'form-control mb-2 flex-grow-1', rows: 4, placeholder: 'Nhập văn bản cần dịch...', value: text, onChange: e => setText(e.target.value), style: { resize: 'none' } }),
      h('button', { className: 'btn btn-success w-100', disabled: !text.trim(), onClick: translate },
        h('i', { className: 'bi bi-box-arrow-up-right me-1' }), 'Dịch với Google Translate'
      )
    )
  )
}

// ─────────────────────────────────────────────────────────────────
// 3. Đồng hồ Pomodoro
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
// 4. Quy đổi điểm (thang 10 → thang 4 + điểm chữ)
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
// 5. Ghi chú nhanh (lưu localStorage)
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
// 6. Giải trí & thư giãn
// ─────────────────────────────────────────────────────────────────
const FUN_LINKS = [
  { title: 'Nhạc tập trung Lofi', desc: 'Nhạc nền giúp tập trung học tập', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', icon: 'music-note-beamed', color: '#6f42c1' },
  { title: 'Tiếng mưa thư giãn',   desc: 'Âm thanh thiên nhiên giảm căng thẳng', url: 'https://www.rainymood.com', icon: 'cloud-rain', color: '#36b9cc' },
  { title: 'GeoGuessr',            desc: 'Game đoán địa điểm trên bản đồ', url: 'https://www.geoguessr.com', icon: 'geo-alt', color: '#1cc88a' },
  { title: 'Sudoku online',        desc: 'Rèn luyện tư duy logic', url: 'https://sudoku.com', icon: 'grid-3x3', color: '#4e73df' },
  { title: '2048',                 desc: 'Game giải đố kinh điển', url: 'https://play2048.co', icon: 'controller', color: '#e67e22' },
  { title: 'Cờ vua Chess.com',    desc: 'Chơi cờ vua, rèn chiến thuật', url: 'https://www.chess.com', icon: 'trophy', color: '#858796' },
]

function Entertainment() {
  return h('div', { className: 'tool-card card border-0 shadow-sm h-100' },
    h('div', { className: 'card-body' },
      h('div', { className: 'tool-head' },
        h('div', { className: 'tool-icon', style: { backgroundColor: 'rgba(111,66,193,.12)', color: '#6f42c1' } }, h('i', { className: 'bi bi-controller' })),
        h('div', null, h('div', { className: 'fw-bold' }, 'Giải trí & thư giãn'), h('small', { className: 'text-muted' }, 'Nghỉ ngơi giữa giờ học'))
      ),
      h('div', { className: 'fun-grid' },
        FUN_LINKS.map((f, i) =>
          h('a', { key: i, href: f.url, target: '_blank', rel: 'noopener noreferrer', className: 'fun-item' },
            h('div', { className: 'fun-icon', style: { backgroundColor: f.color + '22', color: f.color } }, h('i', { className: `bi bi-${f.icon}` })),
            h('div', { className: 'min-w-0' },
              h('div', { className: 'fw-semibold small text-truncate' }, f.title),
              h('small', { className: 'text-muted d-block text-truncate' }, f.desc)
            ),
            h('i', { className: 'bi bi-box-arrow-up-right text-muted ms-auto flex-shrink-0' })
          )
        )
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
      h('div', { className: 'col-12 col-md-6 col-xl-4' }, h(Calculator)),
      h('div', { className: 'col-12 col-md-6 col-xl-4' }, h(Translator)),
      h('div', { className: 'col-12 col-md-6 col-xl-4' }, h(Pomodoro)),
      h('div', { className: 'col-12 col-md-6 col-xl-4' }, h(GradeConverter)),
      h('div', { className: 'col-12 col-md-6 col-xl-4' }, h(Scratchpad)),
      h('div', { className: 'col-12 col-md-6 col-xl-4' }, h(Entertainment))
    )
  )
}
