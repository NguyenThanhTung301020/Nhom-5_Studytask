// pages/Tools.js – Trang Tiện ích hỗ trợ học tập
import { PRESETS, COMPONENT_LABEL } from '../utils/grading.js'
import { todayIso } from '../utils/periods.js'
import { toLetter, neededFinal, TARGETS, POMO_PRESETS, secondsLeft, openDeadlines, pomoStats, upcomingExams, parseTopics, buildStudyPlan, replan, planProgress, dayLabel } from '../utils/studyTools.js'
import { load, save } from '../utils/helpers.js'
import { QUALITY, MAX_SUBMIT_MB, scaleDown, buildPdf, outputName, sizeText, moveItem } from '../utils/fileTools.js'
const { useState, useEffect, useRef, createElement: h } = window.React

// ─────────────────────────────────────────────────────────────────
// Khung dùng chung để các tiện ích trông thống nhất: cùng thẻ, cùng tiêu đề, cùng kiểu tab và nút chính.
// Mỗi tiện ích có một màu nhấn (color) dùng cho biểu tượng, tab đang chọn và nút chính.
// ─────────────────────────────────────────────────────────────────
function ToolCard({ icon, color, title, sub, extra, children }) {
  return h('div', { className: 'tool-card card border-0 shadow-sm h-100' },
    h('div', { className: 'card-body d-flex flex-column' },
      h('div', { className: 'tool-head' },
        h('div', { className: 'tool-icon', style: { backgroundColor: `${color}1f`, color } }, h('i', { className: `bi bi-${icon}` })),
        h('div', { className: 'flex-grow-1' }, h('div', { className: 'fw-bold' }, title), h('small', { className: 'text-muted' }, sub)),
        extra
      ),
      children
    )
  )
}

// Nhóm tab chiếm hết chiều ngang; items: [[khóa, nhãn, biểu tượng?, màu riêng?]]
function ToolTabs({ value, onChange, items, color }) {
  return h('div', { className: 'btn-group btn-group-sm w-100 mb-3', role: 'group' },
    items.map(([k, label, icon, c]) => {
      const on = value === k, col = c || color
      return h('button', { key: k, type: 'button', className: `btn ${on ? 'text-white' : 'btn-outline-secondary'}`,
        style: on ? { backgroundColor: col, borderColor: col } : {}, onClick: () => onChange(k) },
        icon && h('i', { className: `bi bi-${icon} me-1` }), label)
    }))
}

// Kiểu nút chính theo màu nhấn của tiện ích
const accent = (color) => ({ backgroundColor: color, borderColor: color, color: '#fff' })

// Hàng nút cuối khối: nút chính rộng hết (flex-grow-1), nút phụ viền xám bên phải; luôn nằm sát đáy thẻ
const ToolFooter = (...btns) => h('div', { className: 'd-flex gap-2 mt-auto pt-2' }, ...btns)

// Trạng thái trống: biểu tượng mờ và một dòng hướng dẫn, nằm giữa phần còn trống của thẻ
const ToolEmpty = (icon, text) => h('div', { className: 'flex-grow-1 d-flex flex-column align-items-center justify-content-center text-muted small text-center py-3' },
  h('i', { className: `bi bi-${icon} fs-3 mb-1`, style: { opacity: .5 } }), text)

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
// 3. Ghi chú nhanh (lưu localStorage)
// ─────────────────────────────────────────────────────────────────
function Scratchpad() {
  const [note, setNote]   = useState(() => load('st_scratchpad', ''))
  const [saved, setSaved] = useState(false)
  const typed = useRef(false)

  useEffect(() => {
    if (!typed.current) return
    const t = setTimeout(() => { save('st_scratchpad', note); setSaved(true) }, 600)
    return () => clearTimeout(t)
  }, [note])

  useEffect(() => { if (saved) { const t = setTimeout(() => setSaved(false), 1500); return () => clearTimeout(t) } }, [saved])

  return h(ToolCard, { icon: 'pencil-square', color: '#36b9cc', title: 'Ghi chú nhanh', sub: 'Tự động lưu trên thiết bị',
      extra: saved && h('span', { className: 'badge bg-success-subtle text-success' }, h('i', { className: 'bi bi-check2 me-1' }), 'Đã lưu') },
      h('textarea', { className: 'form-control form-control-sm flex-grow-1', rows: 6, placeholder: 'Ghi chú ý tưởng, việc cần làm, công thức cần nhớ...', value: note, onChange: e => { typed.current = true; setNote(e.target.value) }, style: { resize: 'none' } }),
      h('div', { className: 'd-flex justify-content-between align-items-center pt-2' },
        h('small', { className: 'text-muted' }, `${note.length} ký tự`),
        note && h('button', { className: 'btn btn-sm btn-outline-danger', onClick: () => { typed.current = true; setNote('') } }, h('i', { className: 'bi bi-trash me-1' }), 'Xóa')
      )
  )
}

// ─────────────────────────────────────────────────────────────────
// 4. Lập kế hoạch ôn thi (lưu trên thiết bị: { [mã lịch thi]: { plan, done } })
// ─────────────────────────────────────────────────────────────────
const PLAN_KEY = 'st_studyplan'

function StudyPlanner({ exams = [], subjects = [] }) {
  const today = todayIso()
  const list = upcomingExams(exams, subjects, today)
  const [plans, setPlans]   = useState(() => load(PLAN_KEY, {}))
  const [examId, setExamId] = useState('')
  const [text, setText]     = useState('')
  useEffect(() => { save(PLAN_KEY, plans) }, [plans])

  const exam = list.find(e => String(e.id) === examId)
  const cur = exam ? plans[examId] : null
  const daysLeft = exam ? Math.round((new Date(exam.date) - new Date(today)) / 86400000) : 0
  // Chỉ hiện ngày có nội dung ôn và ngày ôn tổng hợp cuối cùng; ngày trống (ôn lại, làm đề) được ẩn cho gọn
  const shown = cur ? cur.plan.filter((p, i) => p.kind === 'study' || i === cur.plan.length - 1) : []
  const hidden = cur ? cur.plan.length - shown.length : 0
  const prog = cur ? planProgress(shown, cur.done, today) : null

  const setCur = (v) => setPlans(p => { const n = { ...p }; if (v) n[examId] = v; else delete n[examId]; return n })
  const create = () => setCur({ plan: buildStudyPlan(today, exam.date, parseTopics(text)), done: {} })
  const toggle = (date) => setCur({ ...cur, done: { ...cur.done, [date]: !cur.done[date] } })
  const redo   = () => setCur({ plan: replan(cur.plan, cur.done, today, exam.date), done: {} })

  const C = '#4e73df'
  return h(ToolCard, { icon: 'calendar2-check', color: C, title: 'Lập kế hoạch ôn thi', sub: 'Chia nội dung ôn theo số ngày còn lại đến kỳ thi' },
      list.length === 0 ? ToolEmpty('calendar-x', 'Chưa có lịch thi sắp tới')
      : h('select', { className: 'form-select form-select-sm mb-2', value: examId, onChange: e => setExamId(e.target.value) },
          h('option', { value: '' }, '— Chọn kỳ thi —'),
          list.map(e => h('option', { key: e.id, value: String(e.id) },
            `${e.subjectName} – ${dayLabel(e.date)}/${e.date.slice(0, 4)}${e.start ? ` lúc ${e.start}` : ''}${plans[e.id] ? ' ✓' : ''}`))),

      list.length > 0 && !exam && ToolEmpty('calendar2-week', 'Chọn kỳ thi, nhập các chương cần ôn để chia lịch ôn theo từng ngày'),

      exam && !cur && h('div', { className: 'd-flex flex-column flex-grow-1' },
        h('small', { className: 'text-muted d-block mb-1' }, `Còn ${daysLeft} ngày đến ngày thi. Nhập nội dung cần ôn, mỗi dòng một mục (chương, chủ đề, dạng bài):`),
        h('textarea', { className: 'form-control form-control-sm mb-2', rows: 5, value: text, placeholder: 'Chương 1: Giới hạn\nChương 2: Đạo hàm\nChương 3: Tích phân',
          onChange: e => setText(e.target.value) }),
        daysLeft < 1 ? h('div', { className: 'alert alert-warning small py-2 mb-0' }, 'Kỳ thi diễn ra hôm nay, không còn ngày để lập kế hoạch')
        : ToolFooter(h('button', { className: 'btn btn-sm flex-grow-1', style: accent(C), disabled: !parseTopics(text).length, onClick: create },
            h('i', { className: 'bi bi-magic me-1' }), 'Lập kế hoạch'))
      ),

      cur && h('div', null,
        h('div', { className: 'd-flex flex-wrap align-items-center gap-2 mb-2' },
          h('small', { className: 'text-muted me-auto' }, `Còn ${daysLeft} ngày · đã xong ${prog.done}/${prog.total} ngày`
            + (prog.behind ? ` · chậm ${prog.behind} ngày` : '')),
          prog.behind > 0 && h('button', { className: 'btn btn-sm btn-outline-primary', onClick: redo, title: 'Chia lại phần chưa ôn từ hôm nay' }, h('i', { className: 'bi bi-arrow-repeat me-1' }), 'Lập lại từ hôm nay'),
          h('button', { className: 'btn btn-sm btn-outline-danger', onClick: () => setCur(null) }, h('i', { className: 'bi bi-trash me-1' }), 'Xóa kế hoạch')
        ),
        h('div', { className: 'progress mb-2', style: { height: 6 } },
          h('div', { className: 'progress-bar', style: { width: `${prog.total ? prog.done / prog.total * 100 : 0}%`, backgroundColor: C } })),
        hidden > 0 && h('small', { className: 'text-muted d-block mb-1' }, `Các ngày còn lại (${hidden} ngày) dùng để ôn lại phần đã học, làm đề.`),
        h('ul', { className: 'list-group list-group-flush small' }, shown.map(p =>
          h('li', { key: p.date, className: `list-group-item d-flex gap-2 align-items-start${p.date === today ? ' bg-primary-subtle' : ''}` },
            h('input', { type: 'checkbox', className: 'form-check-input mt-1', checked: !!cur.done[p.date], onChange: () => toggle(p.date) }),
            h('span', { className: `fw-semibold text-nowrap${p.date < today && !cur.done[p.date] ? ' text-danger' : ''}`, style: { minWidth: 70 } }, dayLabel(p.date)),
            h('span', { className: cur.done[p.date] ? 'text-decoration-line-through text-muted' : '' },
              p.topics.length ? p.topics.join(' · ') : 'Ôn lại phần đã học, làm đề')
          )))
      )
  )
}

// ─────────────────────────────────────────────────────────────────
// 5. Chuyển đổi tệp: ghép ảnh thành PDF, nén ảnh. Xử lý ngay trên trình duyệt, tệp không gửi lên máy chủ.
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

function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000)
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
        download(pdf, fname)
        setMsg({ ok: !over, text: `Đã tạo ${fname}: ${files.length} trang, ${sizeText(pdf.size)}`
          + (over ? `. Vượt ${MAX_SUBMIT_MB} MB nên không nộp bài được, hãy chọn mức Nhẹ` : '') })
      } else {
        imgs.forEach((im, i) => download(im.blob, outputName(files[i].file.name, 'jpg')))
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
export default function Tools({ deadlines = [], exams = [], subjects = [] }) {
  const bottom = 'col-12 col-md-6'      // hàng dưới: 2 khối
  return h('div', { className: 'container-fluid py-4' },
    h('div', { className: 'mb-4' },
      h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-tools me-2', style: { color: 'var(--primary)' } }), 'Tiện ích'),
      h('small', { className: 'text-muted' }, 'Các công cụ mở rộng hỗ trợ học tập hiệu quả')
    ),
    h('div', { className: 'row g-3' },
      h('div', { className: 'col-12 col-md-6 col-xl-4' }, h(Pomodoro, { deadlines })),
      h('div', { className: 'col-12 col-md-6 col-xl-4' }, h(GradeConverter)),
      h('div', { className: 'col-12 col-md-6 col-xl-4' }, h(Scratchpad)),
      h('div', { className: bottom }, h(StudyPlanner, { exams, subjects })),
      h('div', { className: bottom }, h(FileConverter))
    )
  )
}
