// pages/MonthCalendar.js – Thời khóa biểu theo tháng: lịch học (lặp hằng tuần) + lịch thi trong tháng
import { CLASS_FORMATS, EXAM_FORMATS } from '../utils/constants.js'

const { useState, useMemo, createElement: h } = window.React

const WEEK_HEAD = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const pad = (n) => String(n).padStart(2, '0')
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`          // m: 0..11 (giờ địa phương, không lệch múi giờ)
const todayIso = () => { const t = new Date(); return iso(t.getFullYear(), t.getMonth(), t.getDate()) }
// JS getDay(): 0=CN..6=T7 → mã thứ trong TKB: 2=T2..7=T7, 8=CN
const tkbDay = (y, m, d) => { const g = new Date(y, m, d).getDay(); return g === 0 ? 8 : g + 1 }

// Một tiết học có diễn ra vào ngày `date` không (giới hạn bởi ngày bắt đầu/kết thúc học phần nếu có)
const classOn = (c, date, day) => c.day === day && (!c.startDate || date >= c.startDate) && (!c.endDate || date <= c.endDate)

// Danh sách sự kiện của một tháng: { date: [ {kind:'class'|'exam', ...} ] }
export function monthEvents(year, month, schedule, exams) {
  const days = new Date(year, month + 1, 0).getDate()
  const map = {}
  for (let d = 1; d <= days; d++) {
    const date = iso(year, month, d), day = tkbDay(year, month, d)
    const list = []
    schedule.forEach(c => { if (classOn(c, date, day)) list.push({ kind: 'class', key: `c${c.id}-${date}`, ...c }) })
    exams.forEach(e => { if (e.date === date) list.push({ kind: 'exam', key: `e${e.id}`, ...e }) })
    list.sort((a, b) => (a.start || '').localeCompare(b.start || ''))
    if (list.length) map[date] = list
  }
  return map
}

export default function MonthCalendar({ schedule = [], exams = [], subjects = [], onNavigate }) {
  const now = new Date()
  const [ym, setYm]         = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [selected, setSel]  = useState(todayIso())
  const [show, setShow]     = useState({ class: true, exam: true })
  const [subjectId, setSub] = useState('')

  const subjectOf = (id) => subjects.find(s => s.id === id) || {}
  const fSchedule = schedule.filter(c => !subjectId || c.subjectId === Number(subjectId))
  const fExams    = exams.filter(e => !subjectId || e.subjectId === Number(subjectId))
  const events = useMemo(() => monthEvents(ym.y, ym.m, show.class ? fSchedule : [], show.exam ? fExams : []),
    [ym, schedule, exams, show, subjectId])

  // Lưới 6 tuần bắt đầu từ thứ Hai
  const first = new Date(ym.y, ym.m, 1)
  const offset = (first.getDay() + 6) % 7
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(ym.y, ym.m, 1 - offset + i)
    return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate(), date: iso(d.getFullYear(), d.getMonth(), d.getDate()), inMonth: d.getMonth() === ym.m }
  })
  const weeks = cells[35].inMonth ? 6 : 5
  const move = (delta) => setYm(({ y, m }) => { const d = new Date(y, m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  const goToday = () => { setYm({ y: now.getFullYear(), m: now.getMonth() }); setSel(todayIso()) }

  // Thống kê tháng
  const all = Object.values(events).flat()
  const nClass = all.filter(e => e.kind === 'class').length
  const examList = all.filter(e => e.kind === 'exam')
  const today = todayIso()

  const pill = (e) => {
    const sub = subjectOf(e.subjectId)
    const isExam = e.kind === 'exam'
    return h('div', { key: e.key, className: `mcal-pill${isExam ? ' mcal-pill-exam' : ''}`,
      style: { borderLeftColor: sub.color || '#4e73df', background: (isExam ? '#e67e22' : (sub.color || '#4e73df')) + '1a' },
      title: `${isExam ? 'Thi: ' : ''}${sub.name || ''} ${e.start || ''}${e.end ? '–' + e.end : ''}${e.room ? ' · ' + e.room : ''}` },
      isExam && h('i', { className: 'bi bi-clipboard-check me-1', style: { color: '#e67e22' } }),
      h('span', { className: 'mcal-pill-time' }, e.start || ''), ' ', sub.code || sub.name || '')
  }

  const detail = (e) => {
    const sub = subjectOf(e.subjectId)
    const fmt = e.kind === 'exam' ? (EXAM_FORMATS[e.format] || EXAM_FORMATS.tuLuan) : (CLASS_FORMATS[e.format] || CLASS_FORMATS.offline)
    return h('div', { key: e.key, className: 'sched-item', style: { borderLeftColor: e.kind === 'exam' ? '#e67e22' : (sub.color || '#4e73df') } },
      h('div', { className: 'flex-grow-1 min-w-0' },
        h('div', { className: 'fw-semibold' },
          e.kind === 'exam' && h('span', { className: 'badge me-2', style: { background: '#e67e2222', color: '#e67e22' } }, 'Lịch thi'),
          sub.name || 'Môn học'),
        h('div', { className: 'd-flex flex-wrap gap-3 mt-1 small text-muted' },
          h('span', null, h('i', { className: 'bi bi-clock me-1' }), `${e.start || ''}${e.end ? ' – ' + e.end : ''}`),
          e.room && h('span', null, h('i', { className: 'bi bi-geo-alt me-1' }), e.room),
          e.teacher && h('span', null, h('i', { className: 'bi bi-person me-1' }), e.teacher),
          h('span', { style: { color: fmt.color } }, h('i', { className: `bi bi-${fmt.icon} me-1` }), fmt.label)
        ),
        e.description && h('div', { className: 'small text-muted mt-1' }, e.description),
        e.link && h('a', { href: e.link, target: '_blank', rel: 'noopener noreferrer', className: 'btn btn-sm btn-success mt-2' },
          h('i', { className: 'bi bi-camera-video me-1' }), e.kind === 'exam' ? 'Vào phòng thi trực tuyến' : 'Vào lớp trực tuyến')
      )
    )
  }

  const selDate = new Date(selected + 'T00:00:00')
  const selEvents = events[selected] || []
  const monthLabel = `Tháng ${ym.m + 1}/${ym.y}`

  return h('div', { className: 'container-fluid py-4' },
    h('div', { className: 'd-flex flex-wrap justify-content-between align-items-center gap-3 mb-3' },
      h('div', null,
        h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-calendar3 me-2', style: { color: 'var(--primary)' } }), 'Thời khóa biểu theo tháng'),
        h('small', { className: 'text-muted' }, 'Lịch học hằng tuần và lịch thi trong tháng trên cùng một lịch')
      ),
      onNavigate && h('button', { className: 'btn btn-sm btn-outline-primary', onClick: () => onNavigate('schedule') },
        h('i', { className: 'bi bi-calendar-week me-1' }), 'Xem theo tuần / quản lý lịch')
    ),

    // Thanh điều khiển
    h('div', { className: 'card border-0 shadow-sm mb-3' },
      h('div', { className: 'card-body py-2 d-flex flex-wrap align-items-center gap-2' },
        h('div', { className: 'btn-group' },
          h('button', { className: 'btn btn-sm btn-outline-secondary', title: 'Tháng trước', onClick: () => move(-1) }, h('i', { className: 'bi bi-chevron-left' })),
          h('button', { className: 'btn btn-sm btn-outline-secondary fw-semibold', style: { minWidth: 130 }, onClick: goToday, title: 'Về hôm nay' }, monthLabel),
          h('button', { className: 'btn btn-sm btn-outline-secondary', title: 'Tháng sau', onClick: () => move(1) }, h('i', { className: 'bi bi-chevron-right' }))
        ),
        h('button', { className: 'btn btn-sm btn-light', onClick: goToday }, 'Hôm nay'),
        h('div', { className: 'vr mx-1 d-none d-md-block' }),
        h('label', { className: 'form-check form-check-inline mb-0 small' },
          h('input', { type: 'checkbox', className: 'form-check-input', checked: show.class, onChange: () => setShow(s => ({ ...s, class: !s.class })) }),
          h('span', { className: 'form-check-label' }, h('span', { className: 'mcal-dot', style: { background: 'var(--primary)' } }), 'Lịch học')),
        h('label', { className: 'form-check form-check-inline mb-0 small' },
          h('input', { type: 'checkbox', className: 'form-check-input', checked: show.exam, onChange: () => setShow(s => ({ ...s, exam: !s.exam })) }),
          h('span', { className: 'form-check-label' }, h('span', { className: 'mcal-dot', style: { background: '#e67e22' } }), 'Lịch thi')),
        h('select', { className: 'form-select form-select-sm ms-md-auto', style: { width: 'auto', minWidth: 180 }, value: subjectId, onChange: e => setSub(e.target.value) },
          h('option', { value: '' }, 'Tất cả môn'),
          subjects.map(s => h('option', { key: s.id, value: s.id }, s.name)))
      )
    ),

    // Thống kê tháng
    h('div', { className: 'd-flex flex-wrap gap-3 small text-muted mb-3' },
      h('span', null, h('i', { className: 'bi bi-journal-text me-1 text-primary' }), `${nClass} buổi học trong ${monthLabel.toLowerCase()}`),
      h('span', null, h('i', { className: 'bi bi-clipboard-check me-1', style: { color: '#e67e22' } }), `${examList.length} lịch thi`),
      examList.length > 0 && h('span', null, 'Thi gần nhất: ',
        h('strong', null, (() => { const e = examList.find(x => x.date >= today) || examList[0]; return `${subjectOf(e.subjectId).name || ''} – ${e.date.split('-').reverse().join('/')}` })()))
    ),

    h('div', { className: 'row g-3' },
      // Lưới tháng
      h('div', { className: 'col-12 col-xl-8' },
        h('div', { className: 'card border-0 shadow-sm' },
          h('div', { className: 'mcal-grid mcal-head' }, WEEK_HEAD.map(w => h('div', { key: w, className: `mcal-head-cell${w === 'CN' ? ' text-danger' : ''}` }, w))),
          h('div', { className: 'mcal-grid' },
            cells.slice(0, weeks * 7).map(c => {
              const evs = events[c.date] || []
              const isToday = c.date === today, isSel = c.date === selected
              return h('button', { key: c.date, type: 'button',
                className: `mcal-cell${c.inMonth ? '' : ' mcal-out'}${isToday ? ' mcal-today' : ''}${isSel ? ' mcal-sel' : ''}`,
                onClick: () => { setSel(c.date); if (!c.inMonth) setYm({ y: c.y, m: c.m }) },
                'aria-label': `Ngày ${c.d}/${c.m + 1}: ${evs.length} sự kiện` },
                h('div', { className: 'mcal-date' }, c.d, evs.some(e => e.kind === 'exam') && h('i', { className: 'bi bi-circle-fill ms-1', style: { color: '#e67e22', fontSize: '0.45rem', verticalAlign: 'middle' } })),
                h('div', { className: 'mcal-items d-none d-md-block' },
                  evs.slice(0, 3).map(pill),
                  evs.length > 3 && h('div', { className: 'mcal-more' }, `+${evs.length - 3} nữa`)),
                evs.length > 0 && h('div', { className: 'mcal-count d-md-none' }, evs.length)
              )
            })
          )
        )
      ),

      // Chi tiết ngày được chọn
      h('div', { className: 'col-12 col-xl-4' },
        h('div', { className: 'card border-0 shadow-sm h-100' },
          h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 fw-bold' },
            h('i', { className: 'bi bi-calendar-day me-2', style: { color: 'var(--primary)' } }),
            selDate.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })),
          h('div', { className: 'card-body pt-2 px-4 pb-3 d-flex flex-column gap-2' },
            selEvents.length === 0
              ? h('div', { className: 'text-muted small py-3 text-center' }, h('i', { className: 'bi bi-cup-hot d-block fs-3 mb-2 opacity-50' }), 'Không có lịch học hay lịch thi.')
              : selEvents.map(detail)
          )
        )
      )
    )
  )
}
