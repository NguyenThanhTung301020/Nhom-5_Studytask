// pages/Schedule.js – Thời khóa biểu & Lịch thi
import { DAY_LABELS, DAY_ORDER, weekdayLabel, CLASS_FORMATS, EXAM_FORMATS } from '../utils/constants.js'
import ConfirmModal from '../components/ConfirmModal.js'

const { useState, createElement: h } = window.React

const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

// ── Modal thêm/sửa tiết học (TKB) ──
function ClassModal({ subjects, item, defaultTeacher, onSave, onClose }) {
  const [form, setForm] = useState(item
    ? { description: '', link: '', ...item }
    : { subjectId: subjects[0]?.id || '', day: 2, start: '07:00', end: '09:00', room: '', teacher: '', format: 'offline', description: '', link: '' })
  const dateErr = form.startDate && form.endDate && form.endDate < form.startDate
  const valid = form.subjectId && form.start && form.end && !dateErr
  const isOnline = form.format === 'online' || form.format === 'hybrid'

  const pickSubject = (sid) => setForm({ ...form, subjectId: Number(sid), teacher: form.teacher || defaultTeacher(Number(sid)) })

  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
    h('div', { className: 'modal-dialog modal-dialog-centered' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' },
          h('h5', { className: 'modal-title fw-bold' }, h('i', { className: 'bi bi-calendar-week me-2', style: { color: 'var(--primary)' } }), item ? 'Sửa tiết học' : 'Thêm tiết học'),
          h('button', { className: 'btn-close', onClick: onClose })
        ),
        h('div', { className: 'modal-body' },
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, 'Môn học ', h('span', { className: 'text-danger' }, '*')),
            h('select', { className: 'form-select', value: form.subjectId, onChange: e => pickSubject(e.target.value) },
              h('option', { value: '' }, '— Chọn môn —'),
              subjects.map(s => h('option', { key: s.id, value: s.id }, s.name))
            )
          ),
          h('div', { className: 'row g-3 mb-3' },
            h('div', { className: 'col-12' },
              h('label', { className: 'form-label fw-semibold' }, 'Thứ trong tuần'),
              h('select', { className: 'form-select', value: form.day, onChange: e => setForm({ ...form, day: Number(e.target.value) }) },
                DAY_ORDER.map(d => h('option', { key: d, value: d }, DAY_LABELS[d]))
              )
            )
          ),
          h('div', { className: 'row g-3 mb-3' },
            h('div', { className: 'col-6' },
              h('label', { className: 'form-label fw-semibold' }, 'Giờ bắt đầu ', h('span', { className: 'text-danger' }, '*')),
              h('input', { type: 'time', className: 'form-control', value: form.start, onChange: e => setForm({ ...form, start: e.target.value }) })
            ),
            h('div', { className: 'col-6' },
              h('label', { className: 'form-label fw-semibold' }, 'Giờ kết thúc ', h('span', { className: 'text-danger' }, '*')),
              h('input', { type: 'time', className: 'form-control', value: form.end, onChange: e => setForm({ ...form, end: e.target.value }) })
            )
          ),
          h('div', { className: 'row g-3 mb-3' },
            h('div', { className: 'col-6' },
              h('label', { className: 'form-label fw-semibold' }, 'Học từ ngày'),
              h('input', { type: 'date', className: 'form-control', value: form.startDate || '', onChange: e => setForm({ ...form, startDate: e.target.value }) })
            ),
            h('div', { className: 'col-6' },
              h('label', { className: 'form-label fw-semibold' }, 'Đến ngày'),
              h('input', { type: 'date', className: `form-control${dateErr ? ' is-invalid' : ''}`, value: form.endDate || '', onChange: e => setForm({ ...form, endDate: e.target.value }) })
            ),
            h('div', { className: 'col-12 form-text mt-1' }, dateErr ? h('span', { className: 'text-danger' }, 'Ngày kết thúc phải sau ngày bắt đầu.')
              : 'Để trống nếu tiết học lặp lại mọi tuần. Lịch theo tháng chỉ hiện tiết học trong khoảng ngày này.')
          ),
          h('div', { className: 'row g-3 mb-3' },
            h('div', { className: 'col-6' },
              h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-geo-alt me-1' }), 'Phòng'),
              h('input', { className: 'form-control', placeholder: 'VD: A1.203', value: form.room, onChange: e => setForm({ ...form, room: e.target.value }) })
            ),
            h('div', { className: 'col-6' },
              h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-mortarboard me-1' }), 'Hình thức'),
              h('select', { className: 'form-select', value: form.format, onChange: e => setForm({ ...form, format: e.target.value }) },
                Object.entries(CLASS_FORMATS).map(([k, v]) => h('option', { key: k, value: k }, v.label))
              )
            )
          ),
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-person-video3 me-1' }), 'Giáo viên đảm nhận'),
            h('input', { className: 'form-control', placeholder: 'VD: TS. Nguyễn Văn An', value: form.teacher, onChange: e => setForm({ ...form, teacher: e.target.value }) })
          ),
          isOnline && h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-camera-video me-1 text-success' }), 'Link học trực tuyến'),
            h('input', { className: 'form-control', placeholder: 'Dán link Zoom / Google Meet / MS Teams...', value: form.link, onChange: e => setForm({ ...form, link: e.target.value }) })
          ),
          h('div', null,
            h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-card-text me-1' }), 'Mô tả / Ghi chú'),
            h('textarea', { className: 'form-control', rows: 2, placeholder: 'Ghi chú thêm về buổi học...', value: form.description, onChange: e => setForm({ ...form, description: e.target.value }) })
          )
        ),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
          h('button', { className: 'btn btn-primary', disabled: !valid, onClick: () => valid && onSave({ ...form, subjectId: Number(form.subjectId) }) }, item ? 'Lưu thay đổi' : 'Thêm')
        )
      )
    )
  )
}

// ── Modal thêm/sửa lịch thi ──
function ExamModal({ subjects, item, defaultTeacher, onSave, onClose }) {
  const [form, setForm] = useState(item
    ? { description: '', link: '', ...item }
    : { subjectId: subjects[0]?.id || '', date: '', start: '07:30', end: '09:00', room: '', teacher: '', format: 'tuLuan', description: '', link: '' })
  const valid = form.subjectId && form.date && form.start
  const isOnline = form.format === 'online'

  const pickSubject = (sid) => setForm({ ...form, subjectId: Number(sid), teacher: form.teacher || defaultTeacher(Number(sid)) })

  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
    h('div', { className: 'modal-dialog modal-dialog-centered' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' },
          h('h5', { className: 'modal-title fw-bold' }, h('i', { className: 'bi bi-clipboard-check me-2', style: { color: '#e67e22' } }), item ? 'Sửa lịch thi' : 'Thêm lịch thi'),
          h('button', { className: 'btn-close', onClick: onClose })
        ),
        h('div', { className: 'modal-body' },
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, 'Môn thi ', h('span', { className: 'text-danger' }, '*')),
            h('select', { className: 'form-select', value: form.subjectId, onChange: e => pickSubject(e.target.value) },
              h('option', { value: '' }, '— Chọn môn —'),
              subjects.map(s => h('option', { key: s.id, value: s.id }, s.name))
            )
          ),
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-calendar-event me-1' }), 'Ngày thi ', h('span', { className: 'text-danger' }, '*')),
            h('input', { type: 'date', className: 'form-control', value: form.date, onChange: e => setForm({ ...form, date: e.target.value }) }),
            form.date && h('div', { className: 'form-text' }, weekdayLabel(form.date), ', ', fmtDate(form.date))
          ),
          h('div', { className: 'row g-3 mb-3' },
            h('div', { className: 'col-6' },
              h('label', { className: 'form-label fw-semibold' }, 'Giờ bắt đầu ', h('span', { className: 'text-danger' }, '*')),
              h('input', { type: 'time', className: 'form-control', value: form.start, onChange: e => setForm({ ...form, start: e.target.value }) })
            ),
            h('div', { className: 'col-6' },
              h('label', { className: 'form-label fw-semibold' }, 'Giờ kết thúc'),
              h('input', { type: 'time', className: 'form-control', value: form.end, onChange: e => setForm({ ...form, end: e.target.value }) })
            )
          ),
          h('div', { className: 'row g-3 mb-3' },
            h('div', { className: 'col-6' },
              h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-geo-alt me-1' }), 'Phòng thi'),
              h('input', { className: 'form-control', placeholder: 'VD: A1.101', value: form.room, onChange: e => setForm({ ...form, room: e.target.value }) })
            ),
            h('div', { className: 'col-6' },
              h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-card-checklist me-1' }), 'Hình thức thi'),
              h('select', { className: 'form-select', value: form.format, onChange: e => setForm({ ...form, format: e.target.value }) },
                Object.entries(EXAM_FORMATS).map(([k, v]) => h('option', { key: k, value: k }, v.label))
              )
            )
          ),
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-person-video3 me-1' }), 'Giáo viên phụ trách / giám thị'),
            h('input', { className: 'form-control', placeholder: 'VD: TS. Nguyễn Văn An', value: form.teacher, onChange: e => setForm({ ...form, teacher: e.target.value }) })
          ),
          isOnline && h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-camera-video me-1 text-success' }), 'Link thi trực tuyến'),
            h('input', { className: 'form-control', placeholder: 'Dán link phòng thi online / hệ thống thi...', value: form.link, onChange: e => setForm({ ...form, link: e.target.value }) })
          ),
          h('div', null,
            h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-card-text me-1' }), 'Mô tả / Ghi chú'),
            h('textarea', { className: 'form-control', rows: 2, placeholder: 'VD: Mang theo CMND, máy tính cầm tay...', value: form.description, onChange: e => setForm({ ...form, description: e.target.value }) })
          )
        ),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
          h('button', { className: 'btn btn-primary', disabled: !valid, onClick: () => valid && onSave({ ...form, subjectId: Number(form.subjectId) }) }, item ? 'Lưu thay đổi' : 'Thêm')
        )
      )
    )
  )
}

export default function Schedule({ schedule = [], setSchedule, exams = [], setExams, subjects = [], subjectTeacherMap = {}, role = 'student' }) {
  const [tab,      setTab]      = useState('tkb')   // 'tkb' | 'thi'
  const [clsModal, setClsModal] = useState(null)    // null | 'add' | 'edit'
  const [editCls,  setEditCls]  = useState(null)
  const [examModal,setExamModal]= useState(null)
  const [editExam, setEditExam] = useState(null)
  const [confirm,  setConfirm]  = useState(null)    // { kind:'cls'|'exam', id }

  const isTeacher = role === 'admin' || role === 'teacher' || role === 'training'   // Phòng Đào tạo xếp lịch
  const subjectOf = (id) => subjects.find(s => s.id === id) || {}
  const defaultTeacher = (sid) => (subjectTeacherMap[sid]?.[0]?.name) || subjectOf(sid).teacher || ''

  // ── Lưu (functional update để không mất dữ liệu môn khác) ──
  const saveCls = (form) => {
    if (clsModal === 'edit') setSchedule(prev => prev.map(c => c.id === editCls.id ? { ...c, ...form } : c))
    else setSchedule(prev => [...prev, { id: Date.now(), ...form }])
    setClsModal(null)
  }
  const saveExam = (form) => {
    if (examModal === 'edit') setExams(prev => prev.map(c => c.id === editExam.id ? { ...c, ...form } : c))
    else setExams(prev => [...prev, { id: Date.now(), ...form }])
    setExamModal(null)
  }
  const doConfirm = () => {
    if (confirm.kind === 'cls')  setSchedule(prev => prev.filter(c => c.id !== confirm.id))
    else                          setExams(prev => prev.filter(c => c.id !== confirm.id))
    setConfirm(null)
  }

  // ── Dữ liệu hiển thị ──
  const byDay = DAY_ORDER.map(d => ({ day: d, items: schedule.filter(c => c.day === d).sort((a, b) => a.start.localeCompare(b.start)) }))
                         .filter(g => g.items.length > 0)
  const sortedExams = exams.slice().sort((a, b) => new Date(a.date) - new Date(b.date) || a.start.localeCompare(b.start))
  const now = new Date(); now.setHours(0, 0, 0, 0)

  // ── Card 1 tiết học ──
  const classCard = (c) => {
    const sub = subjectOf(c.subjectId)
    const cf  = CLASS_FORMATS[c.format] || CLASS_FORMATS.offline
    return h('div', { key: c.id, className: 'sched-item', style: { borderLeftColor: sub.color || '#4e73df' } },
      h('div', { className: 'flex-grow-1 min-w-0' },
        h('div', { className: 'fw-semibold' }, sub.name || 'Môn học'),
        h('div', { className: 'd-flex flex-wrap gap-3 mt-1 small text-muted' },
          h('span', null, h('i', { className: 'bi bi-clock me-1' }), `${c.start} – ${c.end}`),
          c.room && h('span', null, h('i', { className: 'bi bi-geo-alt me-1' }), c.room),
          c.teacher && h('span', null, h('i', { className: 'bi bi-person me-1' }), c.teacher),
          h('span', { style: { color: cf.color } }, h('i', { className: `bi bi-${cf.icon} me-1` }), cf.label),
          (c.startDate || c.endDate) && h('span', null, h('i', { className: 'bi bi-calendar-range me-1' }),
            `${c.startDate ? fmtDate(c.startDate) : '…'} – ${c.endDate ? fmtDate(c.endDate) : '…'}`)
        ),
        c.description && h('div', { className: 'small text-muted mt-1' }, h('i', { className: 'bi bi-card-text me-1' }), c.description),
        c.link && h('a', { href: c.link, target: '_blank', rel: 'noopener noreferrer', className: 'btn btn-sm btn-success mt-2' },
          h('i', { className: 'bi bi-camera-video me-1' }), 'Vào lớp trực tuyến')
      ),
      isTeacher && h('div', { className: 'd-flex gap-1 flex-shrink-0' },
        h('button', { className: 'btn btn-sm btn-outline-secondary hw-action-btn', title: 'Sửa', onClick: () => { setEditCls(c); setClsModal('edit') } }, h('i', { className: 'bi bi-pencil' })),
        h('button', { className: 'btn btn-sm btn-outline-danger hw-action-btn', title: 'Xóa', onClick: () => setConfirm({ kind: 'cls', id: c.id }) }, h('i', { className: 'bi bi-trash' }))
      )
    )
  }

  return h('div', { className: 'container-fluid py-4' },

    // Header
    h('div', { className: 'd-flex flex-wrap justify-content-between align-items-center gap-3 mb-4' },
      h('div', null,
        h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-calendar-week me-2', style: { color: 'var(--primary)' } }), 'Lịch học & Lịch thi'),
        h('small', { className: 'text-muted' }, isTeacher ? 'Tạo và quản lý thời khóa biểu, lịch thi cho sinh viên' : 'Thời khóa biểu và lịch thi của bạn')
      ),
      isTeacher && h('button', { className: 'btn btn-primary btn-sm',
        onClick: () => tab === 'tkb' ? (setEditCls(null), setClsModal('add')) : (setEditExam(null), setExamModal('add')) },
        h('i', { className: 'bi bi-plus-lg me-1' }), tab === 'tkb' ? 'Thêm tiết học' : 'Thêm lịch thi'
      )
    ),

    // Tabs
    h('div', { className: 'd-flex gap-2 mb-4' },
      h('button', { className: `btn btn-sm ${tab === 'tkb' ? 'btn-primary' : 'btn-outline-primary'}`, onClick: () => setTab('tkb') },
        h('i', { className: 'bi bi-calendar-week me-1' }), 'Thời khóa biểu'),
      h('button', { className: `btn btn-sm ${tab === 'thi' ? 'btn-primary' : 'btn-outline-primary'}`, onClick: () => setTab('thi') },
        h('i', { className: 'bi bi-clipboard-check me-1' }), `Lịch thi${exams.length ? ` (${exams.length})` : ''}`)
    ),

    // ── TAB: Thời khóa biểu ──
    tab === 'tkb' && (
      byDay.length === 0
        ? h('div', { className: 'text-center text-muted py-5' },
            h('i', { className: 'bi bi-calendar-x fs-1 d-block mb-3 opacity-25' }),
            h('p', null, isTeacher ? 'Chưa có tiết học nào. Nhấn "Thêm tiết học" để bắt đầu.' : 'Chưa có thời khóa biểu.')
          )
        : h('div', { className: 'd-flex flex-column gap-3' },
            byDay.map(g =>
              h('div', { key: g.day, className: 'card border-0 shadow-sm' },
                h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 fw-bold' },
                  h('i', { className: 'bi bi-calendar3 me-2', style: { color: 'var(--primary)' } }), DAY_LABELS[g.day]),
                h('div', { className: 'card-body pt-2 px-4 pb-3 d-flex flex-column gap-2' },
                  g.items.map(classCard)
                )
              )
            )
          )
    ),

    // ── TAB: Lịch thi ──
    tab === 'thi' && (
      sortedExams.length === 0
        ? h('div', { className: 'text-center text-muted py-5' },
            h('i', { className: 'bi bi-clipboard-x fs-1 d-block mb-3 opacity-25' }),
            h('p', null, isTeacher ? 'Chưa có lịch thi nào. Nhấn "Thêm lịch thi" để bắt đầu.' : 'Chưa có lịch thi.')
          )
        : h('div', { className: 'row g-3' },
            sortedExams.map(e => {
              const sub = subjectOf(e.subjectId)
              const ef  = EXAM_FORMATS[e.format] || EXAM_FORMATS.tuLuan
              const past = new Date(e.date) < now
              const days = Math.round((new Date(e.date).setHours(0,0,0,0) - now) / 86400000)
              return h('div', { key: e.id, className: 'col-12 col-md-6 col-xl-4' },
                h('div', { className: `card border-0 shadow-sm h-100${past ? ' opacity-75' : ''}` },
                  h('div', { style: { height: 4, backgroundColor: sub.color || '#e67e22', borderRadius: '12px 12px 0 0' } }),
                  h('div', { className: 'card-body' },
                    h('div', { className: 'd-flex justify-content-between align-items-start mb-2' },
                      h('div', null,
                        h('div', { className: 'fw-bold' }, sub.name || 'Môn thi'),
                        h('span', { className: 'badge', style: { backgroundColor: ef.color + '22', color: ef.color, fontSize: '0.7rem' } },
                          h('i', { className: `bi bi-${ef.icon} me-1` }), ef.label)
                      ),
                      past
                        ? h('span', { className: 'badge bg-secondary' }, 'Đã thi')
                        : h('span', { className: `badge ${days <= 3 ? 'bg-danger' : days <= 7 ? 'bg-warning text-dark' : 'bg-success'}` },
                            days === 0 ? 'Hôm nay' : days === 1 ? 'Ngày mai' : `Còn ${days} ngày`)
                    ),
                    h('div', { className: 'sched-exam-info' },
                      h('div', null, h('i', { className: 'bi bi-calendar-event me-2 text-muted' }), h('strong', null, weekdayLabel(e.date)), ', ', fmtDate(e.date)),
                      h('div', null, h('i', { className: 'bi bi-clock me-2 text-muted' }), `${e.start}${e.end ? ' – ' + e.end : ''}`),
                      e.room && h('div', null, h('i', { className: 'bi bi-geo-alt me-2 text-muted' }), e.room),
                      e.teacher && h('div', null, h('i', { className: 'bi bi-person me-2 text-muted' }), e.teacher),
                      e.description && h('div', { className: 'text-muted' }, h('i', { className: 'bi bi-card-text me-2' }), e.description)
                    ),
                    e.link && h('a', { href: e.link, target: '_blank', rel: 'noopener noreferrer', className: 'btn btn-sm btn-success w-100 mt-3' },
                      h('i', { className: 'bi bi-camera-video me-1' }), 'Vào phòng thi trực tuyến'),
                    isTeacher && h('div', { className: 'd-flex gap-2 mt-3' },
                      h('button', { className: 'btn btn-sm btn-outline-secondary flex-fill', onClick: () => { setEditExam(e); setExamModal('edit') } }, h('i', { className: 'bi bi-pencil me-1' }), 'Sửa'),
                      h('button', { className: 'btn btn-sm btn-outline-danger', onClick: () => setConfirm({ kind: 'exam', id: e.id }) }, h('i', { className: 'bi bi-trash' }))
                    )
                  )
                )
              )
            })
          )
    ),

    clsModal  && h(ClassModal, { subjects, item: clsModal === 'edit' ? editCls : null, defaultTeacher, onSave: saveCls, onClose: () => setClsModal(null) }),
    examModal && h(ExamModal,  { subjects, item: examModal === 'edit' ? editExam : null, defaultTeacher, onSave: saveExam, onClose: () => setExamModal(null) }),
    confirm   && h(ConfirmModal, { message: confirm.kind === 'cls' ? 'Xóa tiết học này?' : 'Xóa lịch thi này?', onConfirm: doConfirm, onClose: () => setConfirm(null) })
  )
}
