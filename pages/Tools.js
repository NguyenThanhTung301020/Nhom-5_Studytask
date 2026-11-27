// pages/Tools.js – Trang Tiện ích hỗ trợ học tập
import { PRESETS, COMPONENT_LABEL } from '../utils/grading.js'
import { todayIso } from '../utils/periods.js'
import { toLetter, neededFinal, TARGETS, POMO_PRESETS, secondsLeft, openDeadlines, pomoStats } from '../utils/studyTools.js'
import { load, save, downloadBlob } from '../utils/helpers.js'
import { QUALITY, MAX_SUBMIT_MB, scaleDown, buildPdf, outputName, sizeText, moveItem } from '../utils/fileTools.js'
import { ownerOf } from '../utils/quickNote.js'
import { ToolCard, ToolTabs, ToolFooter, ToolEmpty, accent } from '../components/ToolCard.js'
import { useQuickNote, saveNoteFile, SaveBadge } from '../components/QuickNote.js'
import StudyPlanner from '../components/StudyPlanner.js'
const { useState, useEffect, createElement: h } = window.React

// ─────────────────────────────────────────────────────────────────
// 1. Đồng hồ Pomodoro
// ─────────────────────────────────────────────────────────────────
// Trạng thái để ở mức module: đồng hồ vẫn chạy khi rời trang Tiện ích, chỉ mất khi tải lại trang.
const pomo = { mode: 'work', preset: 'p25', endAt: null, pausedLeft: null, deadlineId: null, timer: null }
const POMO_LOG = 'st_pomodoro_log'

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const o = ctx.createOscillator(); o.frequency.value = 880; o.connect(ctx.destination)
    o.start(); o.stop(ctx.currentTime + 0.6)
  } catch {}
}
function finishPomo() {
  if (pomo.mode === 'work') {
    const entry = { date: todayIso(), mins: POMO_PRESETS[pomo.preset].work, deadlineId: pomo.deadlineId }
    save(POMO_LOG, [...load(POMO_LOG, []), entry].slice(-500))
  }
  const msg = pomo.mode === 'work' ? 'Hết giờ tập trung, nghỉ một chút nhé!' : 'Hết giờ nghỉ, quay lại học thôi!'
  pomo.endAt = null; pomo.pausedLeft = null
  beep()
  try { if (window.Notification?.permission === 'granted') new Notification('StudyTask – Pomodoro', { body: msg }) } catch {}
  window.dispatchEvent(new Event('pomo-change'))
}
function startPomo(secs) {
  pomo.endAt = Date.now() + secs * 1000; pomo.pausedLeft = null
  clearTimeout(pomo.timer); pomo.timer = setTimeout(finishPomo, secs * 1000)
}
function pausePomo() { pomo.pausedLeft = secondsLeft(pomo.endAt); pomo.endAt = null; clearTimeout(pomo.timer) }
function resetPomo() { pomo.endAt = null; pomo.pausedLeft = null; clearTimeout(pomo.timer) }

function Pomodoro({ deadlines = [] }) {
  const COLORS = { work: '#e74a3b', short: '#1cc88a', long: '#36b9cc' }
  const LABELS = { work: 'Tập trung', short: 'Nghỉ ngắn', long: 'Nghỉ dài' }
  const ICONS  = { work: 'lightning-charge', short: 'cup-hot', long: 'moon-stars' }
  const [, setTick] = useState(0)
  const rerender = () => setTick(t => t + 1)
  useEffect(() => {                                   // vẽ lại mỗi giây và khi hết phiên
    const id = setInterval(rerender, 1000)
    window.addEventListener('pomo-change', rerender)
    return () => { clearInterval(id); window.removeEventListener('pomo-change', rerender) }
  }, [])

  const total = POMO_PRESETS[pomo.preset][pomo.mode] * 60
  const running = pomo.endAt != null
  const left = running ? secondsLeft(pomo.endAt) : (pomo.pausedLeft ?? total)
  const color = COLORS[pomo.mode]
  const open = openDeadlines(deadlines)
  const stats = pomoStats(load(POMO_LOG, []), todayIso(), pomo.deadlineId)
  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0')

  const toggle = () => {
    if (running) pausePomo()
    else {
      try { if (window.Notification?.permission === 'default') Notification.requestPermission() } catch {}
      startPomo(left)
    }
    rerender()
  }
  const setMode   = (m) => { pomo.mode = m; resetPomo(); rerender() }
  const setPreset = (p) => { pomo.preset = p; resetPomo(); rerender() }

  return h(ToolCard, { icon: 'stopwatch', color: COLORS.work, title: 'Đồng hồ Pomodoro', sub: 'Tập trung theo từng việc, ghi lại số phiên' },
    h(ToolTabs, { value: pomo.mode, onChange: setMode, items: Object.keys(LABELS).map(k => [k, LABELS[k], ICONS[k], COLORS[k]]) }),
    h('div', { className: 'd-flex gap-2 mb-2' },
      h('select', { className: 'form-select form-select-sm', value: pomo.deadlineId || '', disabled: running,
        onChange: e => { pomo.deadlineId = e.target.value || null; rerender() } },
        h('option', { value: '' }, '— Việc đang làm —'),
        open.map(d => h('option', { key: d.id, value: String(d.id) },
          d.dueDate ? `${d.title} (hạn ${String(d.dueDate).split('-').reverse().join('/')})` : d.title))),
      h('select', { className: 'form-select form-select-sm w-auto', value: pomo.preset, disabled: running, onChange: e => setPreset(e.target.value) },
        Object.entries(POMO_PRESETS).map(([k, v]) => h('option', { key: k, value: k }, `${v.label} phút`)))
    ),
    h('div', { className: 'pomodoro-display', style: { color } }, `${mm}:${ss}`),
    h('div', { className: 'progress mb-2', style: { height: 6 } },
      h('div', { className: 'progress-bar', style: { width: `${100 - left / total * 100}%`, backgroundColor: color } })),
    h('small', { className: 'text-muted text-center mb-3' },
      `Hôm nay: ${stats.todayCount} phiên · ${stats.todayMins} phút` + (pomo.deadlineId ? ` · việc này: ${stats.taskCount} phiên` : '')),
    ToolFooter(
      h('button', { className: 'btn btn-sm flex-grow-1', style: accent(color), onClick: toggle },
        h('i', { className: `bi bi-${running ? 'pause-fill' : 'play-fill'} me-1` }), running ? 'Tạm dừng' : 'Bắt đầu'),
      h('button', { className: 'btn btn-sm btn-outline-secondary', title: 'Đặt lại', onClick: () => { resetPomo(); rerender() } }, h('i', { className: 'bi bi-arrow-counterclockwise' }))
    )
  )
}

// ─────────────────────────────────────────────────────────────────
// 2. Quy đổi điểm và điểm cuối kỳ cần đạt
// ─────────────────────────────────────────────────────────────────
function GradeConverter() {
  const [tab, setTab]          = useState('convert')
  const [score, setScore]      = useState('')
  const [presetKey, setPreset] = useState('L1')
  const [s, setS]              = useState({ cc: '', bt: '', gk: '' })
  const res = toLetter(score)
  const w = PRESETS[presetKey]
  const parts = ['cc', 'bt', 'gk'].filter(k => w[k] > 0)
  const ready = parts.every(k => s[k] !== '')

  return h(ToolCard, { icon: 'award', color: '#e67e22', title: 'Điểm số', sub: 'Quy đổi điểm và điểm cuối kỳ cần đạt' },
      h(ToolTabs, { value: tab, onChange: setTab, color: '#e67e22', items: [['convert', 'Quy đổi', 'arrow-left-right'], ['need', 'Cuối kỳ cần đạt', 'bullseye']] }),

      tab === 'convert' && h('div', { className: 'd-flex flex-column flex-grow-1' },
        h('small', { className: 'text-muted d-block mb-1' }, 'Nhập điểm hệ 10'),
        h('input', { type: 'number', className: 'form-control form-control-sm mb-3', placeholder: 'VD: 8.5', min: 0, max: 10, step: 0.1, value: score, onChange: e => setScore(e.target.value) }),
        res
          ? h('div', { className: 'grade-result mt-auto' },
              h('div', { className: 'd-flex justify-content-around text-center' },
                h('div', null, h('div', { className: 'grade-big', style: { color: res.pass ? '#1cc88a' : '#e74a3b' } }, res.letter), h('small', { className: 'text-muted' }, 'Điểm chữ')),
                h('div', null, h('div', { className: 'grade-big', style: { color: '#4e73df' } }, res.gpa4.toFixed(1)), h('small', { className: 'text-muted' }, 'Hệ 4')),
                h('div', null, h('div', { className: 'grade-big', style: { color: res.pass ? '#1cc88a' : '#e74a3b' } }, h('i', { className: `bi bi-${res.pass ? 'check-circle-fill' : 'x-circle-fill'}` })), h('small', { className: 'text-muted' }, res.pass ? 'Đạt' : 'Không đạt'))
              ))
          : score && h('div', { className: 'alert alert-warning small py-2 mt-auto mb-0' }, h('i', { className: 'bi bi-exclamation-triangle me-1' }), 'Điểm phải trong khoảng 0–10')
      ),

      tab === 'need' && h('div', null,
        h('select', { className: 'form-select form-select-sm mb-2', value: presetKey, onChange: e => setPreset(e.target.value) },
          Object.entries(PRESETS).map(([k, p]) => h('option', { key: k, value: k }, `${p.label} (CC ${p.cc} – BT ${p.bt} – GK ${p.gk} – CK ${p.ck})`))),
        h('div', { className: 'row g-2 mb-2' },
          parts.map(k => h('div', { key: k, className: 'col' },
            h('small', { className: 'text-muted' }, `${COMPONENT_LABEL[k]} (${w[k]}%)`),
            h('input', { type: 'number', className: 'form-control form-control-sm', min: 0, max: 10, step: 0.1, value: s[k], onChange: e => setS({ ...s, [k]: e.target.value }) })))),
        !ready ? h('small', { className: 'text-muted d-block mb-2' }, 'Nhập điểm đã có để xem điểm cuối kỳ cần đạt')
        : h('table', { className: 'table table-sm small mb-1' },
            h('tbody', null, TARGETS.map(([label, t]) => {
              const r = neededFinal(w, s, t)
              const text = r.status === 'invalid' ? 'Điểm phải trong khoảng 0–10'
                : r.status === 'done' ? 'Đã chắc chắn đạt'
                : r.status === 'impossible' ? 'Không thể đạt'
                : `Cuối kỳ cần ${r.need.toFixed(1)}`
              const cls = r.status === 'impossible' || r.status === 'invalid' ? 'text-danger' : r.status === 'done' ? 'text-success' : ''
              return h('tr', { key: label }, h('td', null, `${label} – ${t.toFixed(1)}`), h('td', { className: `text-end fw-semibold ${cls}` }, text))
            }))),
        h('small', { className: 'text-muted d-block' }, 'Trọng số theo bộ gợi ý của quy chế; môn của bạn có thể khác, xem trang Quy chế điểm.')
      )
  )
}

// ─────────────────────────────────────────────────────────────────
// 3. Ghi chú nhanh (lưu trên thiết bị, riêng từng tài khoản). Thanh nổi đi theo mọi trang: components/QuickNote.js
// ─────────────────────────────────────────────────────────────────
function Scratchpad({ owner }) {
  const { note, panel, saved, setNote, setPanel } = useQuickNote(owner)
  const C = '#36b9cc'

  return h(ToolCard, { icon: 'pencil-square', color: C, title: 'Ghi chú nhanh', sub: 'Tự động lưu trên thiết bị, riêng từng tài khoản',
      extra: h(SaveBadge, { saved }) },
      h('textarea', { className: 'form-control form-control-sm flex-grow-1', rows: 6, 'aria-label': 'Nội dung ghi chú nhanh', placeholder: 'Ghi chú ý tưởng, việc cần làm, công thức cần nhớ...', value: note, onChange: e => setNote(e.target.value), style: { resize: 'none' } }),
      h('div', { className: 'd-flex justify-content-between align-items-center pt-2' },
        h('small', { className: 'text-muted' }, `${note.length} ký tự`),
        note && h('button', { className: 'btn btn-sm btn-outline-danger', onClick: () => { if (window.confirm('Xóa toàn bộ nội dung ghi chú?')) setNote('') } }, h('i', { className: 'bi bi-trash me-1' }), 'Xóa')
      ),
      h('div', { className: 'd-flex flex-wrap gap-2 pt-2' },
        h('button', { className: 'btn btn-sm flex-grow-1', style: accent(C), onClick: () => setPanel(panel.open ? { open: false } : { open: true, collapsed: false }) },
          h('i', { className: `bi bi-${panel.open ? 'x-lg' : 'pin-angle'} me-1` }), panel.open ? 'Đóng thanh nổi' : 'Ghim thanh ghi chú'),
        h('button', { className: 'btn btn-sm btn-outline-secondary', disabled: !note.trim(), onClick: () => saveNoteFile(note) },
          h('i', { className: 'bi bi-download me-1' }), 'Lưu .txt')),
      h('small', { className: 'text-muted pt-1' }, 'Thanh ghim kéo được và vẫn hiện khi bạn chuyển sang trang khác.')
  )
}

// ─────────────────────────────────────────────────────────────────
// 4. Chuyển đổi tệp: ghép ảnh thành PDF, nén ảnh. Xử lý ngay trên trình duyệt, tệp không gửi lên máy chủ.
// ─────────────────────────────────────────────────────────────────
// Vẽ lại ảnh lên canvas (nền trắng cho ảnh PNG trong suốt), thu nhỏ theo mức chất lượng, xuất JPEG
async function toJpeg(file, { q, max }) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((ok, fail) => {
      const i = new Image(); i.onload = () => ok(i); i.onerror = () => fail(new Error(`Không đọc được ảnh "${file.name}"`)); i.src = url
    })
    const { w, h: hh } = scaleDown(img.naturalWidth, img.naturalHeight, max)
    const c = document.createElement('canvas'); c.width = w; c.height = hh
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, hh); g.drawImage(img, 0, 0, w, hh)
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', q))
    return { blob, bytes: new Uint8Array(await blob.arrayBuffer()), width: w, height: hh }
  } finally { URL.revokeObjectURL(url) }
}

function FileConverter() {
  const C = '#6f42c1'
  const [tab, setTab]     = useState('pdf')
  const [files, setFiles] = useState([])            // [{ id, file }] theo thứ tự trang
  const [level, setLevel] = useState('medium')
  const [name, setName]   = useState('bai-lam')
  const [busy, setBusy]   = useState(false)
  const [msg, setMsg]     = useState(null)          // { ok, text }
  const total = files.reduce((a, x) => a + x.file.size, 0)

  const pick = (e) => {
    const list = [...e.target.files].filter(f => /^image\/(jpeg|png|webp)$/.test(f.type))
    setFiles(prev => [...prev, ...list.map(f => ({ id: `${f.name}-${f.size}-${f.lastModified}`, file: f }))].slice(0, 50))
    setMsg(list.length < e.target.files.length ? { ok: false, text: 'Chỉ nhận ảnh JPG, PNG, WEBP; tệp khác đã bỏ qua' } : null)
    e.target.value = ''
  }
  const run = async () => {
    setBusy(true); setMsg(null)
    try {
      const imgs = []
      for (const x of files) imgs.push(await toJpeg(x.file, QUALITY[level]))      // lần lượt từng ảnh cho đỡ tốn bộ nhớ
      if (tab === 'pdf') {
        const pdf = new Blob([buildPdf(imgs)], { type: 'application/pdf' })
        const fname = outputName(name, 'pdf'), over = pdf.size > MAX_SUBMIT_MB * 1024 * 1024
        downloadBlob(pdf, fname)
        setMsg({ ok: !over, text: `Đã tạo ${fname}: ${files.length} trang, ${sizeText(pdf.size)}`
          + (over ? `. Vượt ${MAX_SUBMIT_MB} MB nên không nộp bài được, hãy chọn mức Nhẹ` : '') })
      } else {
        imgs.forEach((im, i) => downloadBlob(im.blob, outputName(files[i].file.name, 'jpg')))
        setMsg({ ok: true, text: `Đã nén ${files.length} ảnh: ${sizeText(total)} → ${sizeText(imgs.reduce((a, im) => a + im.blob.size, 0))}` })
      }
    } catch (e) { setMsg({ ok: false, text: e.message }) }
    setBusy(false)
  }

  return h(ToolCard, { icon: 'file-earmark-arrow-down', color: C, title: 'Chuyển đổi tệp', sub: 'Xử lý ngay trên máy, tệp không gửi lên máy chủ' },
    h(ToolTabs, { value: tab, onChange: (k) => { setTab(k); setMsg(null) }, color: C,
      items: [['pdf', 'Ảnh → PDF', 'file-earmark-pdf'], ['zip', 'Nén ảnh', 'arrows-angle-contract']] }),
    h('label', { className: 'btn btn-sm btn-outline-secondary w-100 mb-2' },
      h('i', { className: 'bi bi-images me-1' }), tab === 'pdf' ? 'Chọn ảnh bài làm (JPG, PNG, WEBP)…' : 'Chọn ảnh cần nén…',
      h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', multiple: true, hidden: true, onChange: pick })),
    files.length > 0 && h('ul', { className: 'list-group list-group-flush small mb-2', style: { maxHeight: 180, overflowY: 'auto' } },
      files.map((x, i) => h('li', { key: x.id, className: 'list-group-item d-flex align-items-center gap-2 px-1 py-1' },
        h('span', { className: 'text-muted', style: { minWidth: 22 } }, `${i + 1}.`),
        h('span', { className: 'text-truncate flex-grow-1' }, x.file.name),
        h('span', { className: 'text-muted text-nowrap' }, sizeText(x.file.size)),
        tab === 'pdf' && h('button', { className: 'btn btn-sm btn-link p-0', title: 'Lên', disabled: i === 0, onClick: () => setFiles(moveItem(files, i, -1)) }, h('i', { className: 'bi bi-arrow-up' })),
        tab === 'pdf' && h('button', { className: 'btn btn-sm btn-link p-0', title: 'Xuống', disabled: i === files.length - 1, onClick: () => setFiles(moveItem(files, i, 1)) }, h('i', { className: 'bi bi-arrow-down' })),
        h('button', { className: 'btn btn-sm btn-link text-danger p-0', title: 'Bỏ ảnh này', onClick: () => setFiles(files.filter(y => y.id !== x.id)) }, h('i', { className: 'bi bi-x-lg' }))))),
    h('div', { className: 'd-flex gap-2 mb-2' },
      h('select', { className: 'form-select form-select-sm', value: level, onChange: e => setLevel(e.target.value) },
        Object.entries(QUALITY).map(([k, v]) => h('option', { key: k, value: k }, v.label))),
      tab === 'pdf' && h('input', { className: 'form-control form-control-sm', placeholder: 'Tên tệp PDF', value: name, onChange: e => setName(e.target.value) })),
    files.length ? h('small', { className: 'text-muted d-block mb-2' }, `${files.length} ảnh · ${sizeText(total)}`)
      : ToolEmpty('images', tab === 'pdf' ? 'Chọn ảnh bài làm, sắp thứ tự trang rồi tạo PDF' : 'Chọn ảnh để giảm dung lượng trước khi nộp hoặc gửi'),
    ToolFooter(
      h('button', { className: 'btn btn-sm flex-grow-1', style: accent(C), disabled: busy || !files.length, onClick: run },
        busy ? h('span', { className: 'spinner-border spinner-border-sm me-1' }) : h('i', { className: `bi bi-${tab === 'pdf' ? 'file-earmark-pdf' : 'download'} me-1` }),
        busy ? 'Đang xử lý…' : tab === 'pdf' ? 'Tạo PDF và tải về' : 'Nén và tải về'),
      files.length > 0 && h('button', { className: 'btn btn-sm btn-outline-secondary', disabled: busy, onClick: () => { setFiles([]); setMsg(null) } }, 'Xóa hết')),
    msg && h('div', { className: `alert ${msg.ok ? 'alert-success' : 'alert-warning'} small py-2 mt-2 mb-0` }, msg.text)
  )
}

// ─────────────────────────────────────────────────────────────────
// Main Tools Page
// ─────────────────────────────────────────────────────────────────
export default function Tools({ user, deadlines = [], exams = [], subjects = [], materials = [], quizzes = [], homeworks = [], submissions = [] }) {
  const third = 'col-12 col-md-6 col-xl-4'
  return h('div', { className: 'container-fluid py-4' },
    h('div', { className: 'mb-4' },
      h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-tools me-2', style: { color: 'var(--primary)' } }), 'Tiện ích'),
      h('small', { className: 'text-muted' }, 'Các công cụ mở rộng hỗ trợ học tập hiệu quả')
    ),
    h('div', { className: 'row g-3' },
      h('div', { className: third }, h(Pomodoro, { deadlines })),
      h('div', { className: third }, h(GradeConverter)),
      h('div', { className: third }, h(Scratchpad, { owner: ownerOf(user) })),
      h('div', { className: 'col-12' }, h(StudyPlanner, { user, subjects, exams, materials, quizzes, homeworks, submissions })),
      h('div', { className: 'col-12 col-md-6' }, h(FileConverter))
    )
  )
}
