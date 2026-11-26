// pages/Schedule.js – Thời khóa biểu & Lịch thi
import { DAY_LABELS, DAY_ORDER, weekdayLabel, CLASS_FORMATS, EXAM_FORMATS } from '../utils/constants.js'
import ConfirmModal from '../components/ConfirmModal.js'
import { classOptionsForSubject, classesInItems, semesterLabel, teacherSections, FULL_ROLES,
         khoaChoices, termChoices, defaultTermSel, inKhoa, inTerm, termInfoOf, termKey, currentTerm, TERM_RECENT } from '../utils/scope.js'
import { TIET, blockFits, blockTime, tietRangeOf, tietLabel, mondayOf, weekDates, addDays, todayIso, classOnDate, termWeekNumber, weekRangeLabel, fromIso } from '../utils/periods.js'
import { isGuidedSubject } from '../utils/grading.js'
import { scheduleText } from '../utils/roleText.js'
import { hasRoomQuiz, canUseRoomQuiz, examPhase, quizzesForExam } from '../utils/exams.js'
import { ExamEntryModal, ExamRoomPanel } from './ExamRoom.js'
import { TermSelect, ExportButton } from '../components/TermFilter.js'

const { useState, useEffect, createElement: h } = window.React

const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

// Chọn lớp học phần cho tiết học / lịch thi: cùng một môn mở ở nhiều lớp nên mỗi mục phải gắn đúng lớp
function ClassPicker({ opts, value, required, onChange }) {
  return h('div', { className: 'mb-3' },
    h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-people me-1' }), 'Lớp ', required && h('span', { className: 'text-danger' }, '*')),
    h('select', { className: `form-select${required && !value ? ' is-invalid' : ''}`, value: value || '', onChange: e => onChange(e.target.value, opts.find(o => o.id === e.target.value)?.name || '') },
      h('option', { value: '' }, required ? '— Chọn lớp —' : 'Tất cả lớp (mục chung của môn)'),
      opts.map(o => h('option', { key: o.id, value: o.id }, o.name))
    ),
    h('div', { className: 'form-text' }, opts.length === 0
      ? (required ? 'Bạn chưa được phân công lớp nào cho môn này.' : 'Môn này chưa có lớp nào; mục sẽ áp dụng cho mọi lớp.')
      : (required ? 'Chỉ hiện các lớp bạn được phân công dạy môn này.' : 'Chọn lớp để chỉ lớp đó nhìn thấy; để trống nếu áp dụng cho mọi lớp học môn này.'))
  )
}

// Giáo viên chỉ dạy đúng một lớp môn này thì chọn sẵn lớp đó
const defaultClass = (classOptionsFor, requireClass, sid) => {
  const opts = sid ? classOptionsFor(sid) : []
  return requireClass && opts.length === 1 ? { classId: opts[0].id, className: opts[0].name } : { classId: '', className: '' }
}

const subjectLabel = (s) => `${s.name}${s.code ? ` (${s.code}${semesterLabel(s) ? ' · ' + semesterLabel(s) : ''})` : ''}`

// ── Modal thêm/sửa tiết học (TKB) ──
function ClassModal({ subjects, item, defaultTeacher, classOptionsFor, requireClass, title, onSave, onClose }) {
  const [form, setForm] = useState(item
    ? { description: '', link: '', ...item }
    : { subjectId: subjects[0]?.id || '', day: 2, start: '07:30', end: '09:45', tietStart: 1, tietEnd: 3, room: '', teacher: '', format: 'offline', description: '', link: '', ...defaultClass(classOptionsFor, requireClass, subjects[0]?.id) })
  const dateErr = form.startDate && form.endDate && form.endDate < form.startDate
  const classOpts = classOptionsFor(Number(form.subjectId))
  const soTiet = form.tietStart && form.tietEnd ? form.tietEnd - form.tietStart + 1 : 3
  const tietValid = !form.tietStart || blockFits(form.tietStart, soTiet)           // khối tiết phải nằm gọn trong một buổi
  const legacyTime = !!item && !item.tietStart && !tietRangeOf(item.start, item.end)   // giờ cũ không theo bảng tiết
  const setBlock = (st, len) => setForm(f => { const b = blockTime(st, len); return { ...f, tietStart: st, tietEnd: st + len - 1, ...(b ? { start: b.start, end: b.end } : {}) } })
  const valid = form.subjectId && form.start && form.end && !dateErr && tietValid && (!requireClass || form.classId)
  const isOnline = form.format === 'online' || form.format === 'hybrid'

  const pickSubject = (sid) => {
    const opts = classOptionsFor(Number(sid)), keep = opts.find(o => o.id === form.classId)
    const only = requireClass && opts.length === 1 ? opts[0] : null                  // giáo viên chỉ dạy một lớp môn này → chọn sẵn
    setForm({ ...form, subjectId: Number(sid), teacher: form.teacher || defaultTeacher(Number(sid)),
              classId: keep ? keep.id : only ? only.id : '', className: keep ? keep.name : only ? only.name : '' })
  }

  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
    h('div', { className: 'modal-dialog modal-dialog-centered' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' },
          h('h5', { className: 'modal-title fw-bold' }, h('i', { className: 'bi bi-calendar-week me-2', style: { color: 'var(--primary)' } }), title),
          h('button', { className: 'btn-close', onClick: onClose })
        ),
        h('div', { className: 'modal-body' },
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, 'Môn học ', h('span', { className: 'text-danger' }, '*')),
            h('select', { className: 'form-select', value: form.subjectId, onChange: e => pickSubject(e.target.value) },
              h('option', { value: '' }, '— Chọn môn —'),
              subjects.map(s => h('option', { key: s.id, value: s.id }, subjectLabel(s)))
            )
          ),
          h(ClassPicker, { opts: classOpts, value: form.classId, required: requireClass, onChange: (id, name) => setForm({ ...form, classId: id, className: name }) }),
          h('div', { className: 'row g-3 mb-3' },
            h('div', { className: 'col-12' },
              h('label', { className: 'form-label fw-semibold' }, 'Thứ trong tuần'),
              h('select', { className: 'form-select', value: form.day, onChange: e => setForm({ ...form, day: Number(e.target.value) }) },
                DAY_ORDER.map(d => h('option', { key: d, value: d }, DAY_LABELS[d]))
              )
            )
          ),
          h('div', { className: 'row g-3 mb-3' },
            h('div', { className: 'col-7' },
              h('label', { className: 'form-label fw-semibold' }, 'Tiết bắt đầu ', h('span', { className: 'text-danger' }, '*')),
              h('select', { className: 'form-select', value: form.tietStart || '', onChange: e => e.target.value && setBlock(Number(e.target.value), soTiet) },
                !form.tietStart && h('option', { value: '' }, '— chọn tiết —'),
                Object.keys(TIET).map(n => h('option', { key: n, value: n }, `Tiết ${n} (${TIET[n][0]})`)))
            ),
            h('div', { className: 'col-5' },
              h('label', { className: 'form-label fw-semibold' }, 'Số tiết'),
              h('select', { className: 'form-select', value: soTiet, onChange: e => setBlock(form.tietStart || 1, Number(e.target.value)) },
                [1, 2, 3, 4, 5, 6].map(n => h('option', { key: n, value: n }, `${n} tiết`)))
            ),
            h('div', { className: 'col-12 form-text mt-1' },
              !tietValid ? h('span', { className: 'text-danger' }, 'Khối tiết phải nằm trong một buổi: sáng tiết 1–6, chiều tiết 7–12, tối tiết 13–16.')
                : legacyTime && !form.tietStart ? h('span', { className: 'text-warning' }, `Giờ cũ ${form.start}–${form.end} không theo bảng tiết; chọn tiết để thay.`)
                : `Tiết ${form.tietStart}–${form.tietEnd} · ${form.start} – ${form.end}`)
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
function ExamModal({ subjects, quizzes, item, defaultTeacher, classOptionsFor, requireClass, onSave, onClose }) {
  const [form, setForm] = useState(item
    ? { description: '', link: '', ...item }
    : { subjectId: subjects[0]?.id || '', date: '', start: '07:30', end: '09:00', tietStart: 1, tietEnd: 2, room: '', teacher: '', format: 'tuLuan', description: '', link: '', ...defaultClass(classOptionsFor, requireClass, subjects[0]?.id) })
  const classOpts = classOptionsFor(Number(form.subjectId))
  const soTiet = form.tietStart && form.tietEnd ? form.tietEnd - form.tietStart + 1 : 2
  const tietValid = !form.tietStart || blockFits(form.tietStart, soTiet)
  const setBlock = (st, len) => setForm(f => { const b = blockTime(st, len); return { ...f, tietStart: st, tietEnd: st + len - 1, ...(b ? { start: b.start, end: b.end } : {}) } })
  const valid = form.subjectId && form.date && form.start && tietValid && (!requireClass || form.classId)
  const isOnline = form.format === 'online'
  const roomQuizOk = canUseRoomQuiz(form.format)
  const quizOpts = quizzesForExam(quizzes, form.subjectId)
  const setFormat = (format) => setForm(f => ({ ...f, format, ...(canUseRoomQuiz(format) ? {} : { quizId: undefined }) }))

  const pickSubject = (sid) => {
    const opts = classOptionsFor(Number(sid)), keep = opts.find(o => o.id === form.classId)
    const only = requireClass && opts.length === 1 ? opts[0] : null
    setForm({ ...form, subjectId: Number(sid), teacher: form.teacher || defaultTeacher(Number(sid)),
              classId: keep ? keep.id : only ? only.id : '', className: keep ? keep.name : only ? only.name : '' })
  }

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
              subjects.map(s => h('option', { key: s.id, value: s.id }, subjectLabel(s)))
            )
          ),
          h(ClassPicker, { opts: classOpts, value: form.classId, required: requireClass, onChange: (id, name) => setForm({ ...form, classId: id, className: name }) }),
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-calendar-event me-1' }), 'Ngày thi ', h('span', { className: 'text-danger' }, '*')),
            h('input', { type: 'date', className: 'form-control', value: form.date, onChange: e => setForm({ ...form, date: e.target.value }) }),
            form.date && h('div', { className: 'form-text' }, weekdayLabel(form.date), ', ', fmtDate(form.date))
          ),
          h('div', { className: 'row g-3 mb-3' },
            h('div', { className: 'col-7' },
              h('label', { className: 'form-label fw-semibold' }, 'Tiết bắt đầu ', h('span', { className: 'text-danger' }, '*')),
              h('select', { className: 'form-select', value: form.tietStart || '', onChange: e => e.target.value && setBlock(Number(e.target.value), soTiet) },
                !form.tietStart && h('option', { value: '' }, '— chọn tiết —'),
                Object.keys(TIET).map(n => h('option', { key: n, value: n }, `Tiết ${n} (${TIET[n][0]})`)))
            ),
            h('div', { className: 'col-5' },
              h('label', { className: 'form-label fw-semibold' }, 'Số tiết'),
              h('select', { className: 'form-select', value: soTiet, onChange: e => setBlock(form.tietStart || 1, Number(e.target.value)) },
                [1, 2, 3, 4, 5, 6].map(n => h('option', { key: n, value: n }, `${n} tiết`)))
            ),
            h('div', { className: 'col-12 form-text mt-1' },
              !tietValid ? h('span', { className: 'text-danger' }, 'Khối tiết phải nằm trong một buổi: sáng tiết 1–6, chiều tiết 7–12, tối tiết 13–16.')
                : `Tiết ${form.tietStart}–${form.tietEnd} · ${form.start} – ${form.end}. Thi trực tuyến nên xếp buổi tối (tiết 13–16) hoặc cuối tuần.`)
          ),
          h('div', { className: 'row g-3 mb-3' },
            h('div', { className: 'col-6' },
              h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-geo-alt me-1' }), 'Phòng thi'),
              h('input', { className: 'form-control', placeholder: 'VD: A1.101', value: form.room, onChange: e => setForm({ ...form, room: e.target.value }) })
            ),
            h('div', { className: 'col-6' },
              h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-card-checklist me-1' }), 'Hình thức thi'),
              h('select', { className: 'form-select', value: form.format, onChange: e => setFormat(e.target.value) },
                Object.entries(EXAM_FORMATS).map(([k, v]) => h('option', { key: k, value: k }, v.label))
              )
            )
          ),
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-person-video3 me-1' }), 'Giáo viên phụ trách / giám thị'),
            h('input', { className: 'form-control', placeholder: 'VD: TS. Nguyễn Văn An', value: form.teacher, onChange: e => setForm({ ...form, teacher: e.target.value }) })
          ),
          roomQuizOk && h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-shield-lock me-1', style: { color: '#e67e22' } }), 'Đề thi làm trực tiếp trên trang'),
            h('select', { className: 'form-select', value: form.quizId ?? '', onChange: e => setForm({ ...form, quizId: e.target.value === '' ? undefined : Number(e.target.value) }) },
              h('option', { value: '' }, '— Không dùng (thi ngoài trang) —'),
              quizOpts.map(q => h('option', { key: q.id, value: q.id }, `${q.title}${q.status === 'draft' ? ' (bản nháp, nhớ mở đề trước giờ thi)' : ''}`))),
            h('div', { className: 'form-text' }, quizOpts.length === 0
              ? 'Môn này chưa có đề trắc nghiệm. Tạo đề ở trang Trắc nghiệm rồi quay lại chọn.'
              : 'Sinh viên vào phòng thi ở trang này đúng giờ, nhập mã truy cập do giám thị phát tại phòng thi, rồi làm bài như trắc nghiệm (máy chủ chấm, nộp một lần). Sau khi lưu lịch thi, mở "Phòng thi" để lấy mã.')),
          isOnline && !form.quizId && h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-camera-video me-1 text-success' }), 'Link thi trực tuyến (hệ thống ngoài)'),
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

export default function Schedule({ schedule = [], setSchedule, exams = [], setExams, subjects = [], subjectTeacherMap = {}, role = 'student', user = null, allUsers = [], quizzes = [], submissions = [], setSubmissions, displayYears }) {
  const [tab,      setTab]      = useState('tkb')   // 'tkb' | 'thi'
  const [clsModal, setClsModal] = useState(null)    // null | 'add' | 'edit'
  const [editCls,  setEditCls]  = useState(null)
  const [examModal,setExamModal]= useState(null)
  const [editExam, setEditExam] = useState(null)
  const [confirm,  setConfirm]  = useState(null)    // { kind:'cls'|'exam', id }
  const [fClass,   setFClass]   = useState('')      // bộ lọc lớp ('' = tất cả lớp trong phạm vi của tôi)
  const [week,     setWeek]     = useState(() => mondayOf(todayIso()))   // Thứ Hai của tuần đang xem
  const [fKhoa,    setFKhoa]    = useState('')      // bộ lọc khóa ('' = tất cả khóa trong phạm vi của tôi)
  const [fTerm,    setFTerm]    = useState(null)    // bộ lọc học kỳ: null = mặc định học kỳ hiện tại, '' = tất cả học kỳ
  const [room,     setRoom]     = useState(null)    // { kind: 'enter' | 'panel', exam } phòng thi trực tuyến đang mở
  const [, tick] = useState(0)                      // làm mới mỗi 30 giây để nút "Vào phòng thi" hiện đúng giờ
  useEffect(() => { const t = setInterval(() => tick(n => n + 1), 30000); return () => clearInterval(t) }, [])
  const T = scheduleText(role)                      // chữ theo vai trò: sinh viên = lịch học; giáo viên = lịch giảng dạy

  const isTeacher = role === 'admin' || role === 'teacher' || role === 'training'   // Phòng Đào tạo xếp lịch
  const subjectOf = (id) => subjects.find(s => s.id === id) || {}
  const defaultTeacher = (sid) => (subjectTeacherMap[sid]?.[0]?.name) || subjectOf(sid).teacher || ''
  // Giáo viên đã phân theo lớp: bắt buộc chọn lớp mình dạy khi thêm lịch (tránh tạo mục "chung" làm mọi lớp thấy)
  const requireClass = role === 'teacher' && teacherSections(user) !== null
  const classOptionsFor = (sid) => classOptionsForSubject(user, allUsers, sid)
  const fullView = FULL_ROLES.includes(role)

  // ── Lưu (functional update để không mất dữ liệu môn khác) ──
  const termFields = (sid) => { const t = subjectOf(sid); return t.namHoc && t.ky ? { khoa: t.khoa || '', namHoc: t.namHoc, ky: t.ky } : {} }
  const saveCls = (form) => {
    form = { ...termFields(form.subjectId), ...form }
    if (clsModal === 'edit') setSchedule(prev => prev.map(c => c.id === editCls.id ? { ...c, ...form } : c))
    else setSchedule(prev => [...prev, { id: Date.now(), ...form }])
    setClsModal(null)
  }
  const saveExam = (form) => {
    form = { ...termFields(form.subjectId), ...form }
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
  // Lịch được tách theo KHÓA và theo HỌC KỲ của năm học (mỗi mục gắn khoa/namHoc/ky; mục cũ lấy từ học phần). Mặc định chỉ học kỳ hiện tại
  // để không dồn thời khóa biểu của cả 4 năm của mọi khóa vào một danh sách.
  const allItems = [...schedule, ...exams]
  const termItems = allItems.map(x => termInfoOf(x, subjectOf)).filter(Boolean)
  const khoaOpts = khoaChoices(allItems.map(x => ({ khoa: x.khoa || subjectOf(x.subjectId).khoa })))
  const termOpts = termChoices(termItems)
  const termSel = fTerm === null ? (defaultTermSel(termItems) || TERM_RECENT) : fTerm
  const inScopeTK = (x) => inKhoa(x, fKhoa, subjectOf) && inTerm(x, termSel, subjectOf, displayYears)
  const classChoices = classesInItems(allItems.filter(inScopeTK))
  const visible = (x) => inScopeTK(x) && (!fClass || x.classId === fClass)
  const shownSchedule = schedule.filter(visible), shownExams = exams.filter(visible)
  const showFilters = role !== 'student' && (khoaOpts.length > 1 || termOpts.length > 1 || classChoices.length > 1)
  // Ô chọn môn trong form chỉ liệt kê học phần của học kỳ đang lọc (kèm môn của mục đang sửa) để không dài theo số năm
  const modalSubjects = (extraId) => subjects.filter(sb => !isGuidedSubject(sb) && (sb.id === extraId || inTerm(sb, termSel, undefined, displayYears) && inKhoa(sb, fKhoa)))   // môn hướng dẫn không xếp lịch
  const resetFilters = () => { setFKhoa(''); setFTerm(null); setFClass('') }
  const isDefault = !fKhoa && fTerm === null && !fClass
  const classBadge = (c) => c.classId && h('span', { className: 'badge bg-light text-dark border ms-2', style: { fontSize: '0.7rem' } }, h('i', { className: 'bi bi-people me-1' }), c.className || c.classId)
  const semBadge = (sub) => semesterLabel(sub) && h('span', { className: 'badge bg-primary-subtle text-primary ms-1', style: { fontSize: '0.7rem' } }, semesterLabel(sub))

  // ── Thời khóa biểu theo TUẦN thật: mỗi tuần một danh sách, chuyển tuần theo mốc thời gian thật ──
  // Buổi học lặp hằng tuần trong khoảng ngày [startDate, endDate] của học kỳ nên chỉ hiện ở các tuần thuộc học kỳ đó.
  const today = todayIso()
  const weekDays = weekDates(week)
  const activeThisWeek = schedule.filter(c => weekDays.some(d => classOnDate(c, d.iso)))        // mọi buổi học diễn ra trong tuần này
  const weekKhoaOpts = [...new Set([...khoaChoices(activeThisWeek.map(c => ({ khoa: c.khoa || subjectOf(c.subjectId).khoa }))), ...(fKhoa ? [fKhoa] : [])])].sort().reverse()
  const weekClassChoices = classesInItems(activeThisWeek.filter(c => inKhoa(c, fKhoa, subjectOf)))
  const weekOk = (x) => inKhoa(x, fKhoa, subjectOf) && (!fClass || x.classId === fClass)
  const byTime = (a, b) => (a.tietStart || 99) - (b.tietStart || 99) || String(a.start || '').localeCompare(String(b.start || ''))
  const dayItems = (d) => schedule.filter(c => weekOk(c) && classOnDate(c, d.iso)).sort(byTime)
  const dayExams = (d) => exams.filter(e => weekOk(e) && e.date === d.iso).sort(byTime)
  const weekCount = weekDays.reduce((n, d) => n + dayItems(d).length, 0)
  const weekExamCount = weekDays.reduce((n, d) => n + dayExams(d).length, 0)
  const weekTerms = [...new Map(weekDays.flatMap(d => dayItems(d)).map(c => [termKey(termInfoOf(c, subjectOf) || {}), termInfoOf(c, subjectOf) || c])).entries()]
  const oneTerm = weekTerms.length === 1 && weekTerms[0][0] ? weekTerms[0][1] : null
  const termStart = oneTerm && schedule.find(c => termKey(termInfoOf(c, subjectOf) || {}) === weekTerms[0][0] && c.startDate)
  const weekNo = termStart ? termWeekNumber(termStart.startDate, termStart.endDate, week) : null
  const isThisWeek = week === mondayOf(today)
  // Môn hướng dẫn (thực tập, đồ án, khóa luận) của học kỳ hiện tại: không có thời khóa biểu cụ thể
  const curKey = termKey(currentTerm())
  const guidedNow = subjects.filter(sb => isGuidedSubject(sb) && (!termKey(sb) || termKey(sb) === curKey))
  const sortedExams = shownExams.slice().sort((a, b) => new Date(a.date) - new Date(b.date) || a.start.localeCompare(b.start))
  const now = new Date(); now.setHours(0, 0, 0, 0)

  // ── Thi trực tuyến trên trang: sinh viên vào phòng thi bằng mã; giáo viên/Admin phát mã và theo dõi ──
  const staffRoom = role === 'teacher' || role === 'admin'
  const submitted = (e) => submissions.some(x => x.quizId === e.quizId && (!user || x.userId === user.uid))
  const roomAction = (e, block) => {
    if (!hasRoomQuiz(e)) return null
    const phase = examPhase(e)
    const cls = block ? 'w-100 mt-3' : 'mt-2'
    if (staffRoom) return h('button', { className: `btn btn-sm btn-warning ${cls}`, onClick: () => setRoom({ kind: 'panel', exam: e }) },
      h('i', { className: 'bi bi-door-open me-1' }), 'Phòng thi: mã truy cập & theo dõi')
    if (role !== 'student') return h('div', { className: 'small text-muted mt-2' }, h('i', { className: 'bi bi-shield-lock me-1' }), 'Thi trực tuyến trên trang')
    if (submitted(e)) return h('div', { className: `badge bg-success ${block ? 'mt-3' : 'mt-2'}` }, h('i', { className: 'bi bi-check2-all me-1' }), 'Đã nộp bài thi')
    if (phase === 'open') return h('button', { className: `btn btn-sm btn-warning ${cls}`, onClick: () => setRoom({ kind: 'enter', exam: e }) },
      h('i', { className: 'bi bi-shield-lock me-1' }), 'Vào phòng thi (nhập mã truy cập)')
    return h('div', { className: `small text-muted ${block ? 'mt-3' : 'mt-2'}` }, h('i', { className: 'bi bi-shield-lock me-1' }),
      phase === 'upcoming' ? 'Thi trực tuyến trên trang: đến giờ thi, vào phòng thi và nhập mã do giám thị phát' : phase === 'ended' ? 'Buổi thi đã kết thúc' : 'Thi trực tuyến trên trang (chưa có giờ thi hợp lệ)')
  }

  // ── Card 1 tiết học ──
  const classCard = (c) => {
    const sub = subjectOf(c.subjectId)
    const cf  = CLASS_FORMATS[c.format] || CLASS_FORMATS.offline
    return h('div', { key: c.id, className: 'sched-item', style: { borderLeftColor: sub.color || '#4e73df' } },
      h('div', { className: 'flex-grow-1 min-w-0' },
        h('div', { className: 'fw-semibold' }, sub.name || 'Môn học', classBadge(c), semBadge(sub)),
        h('div', { className: 'd-flex flex-wrap gap-3 mt-1 small text-muted' },
          h('span', null, h('i', { className: 'bi bi-clock me-1' }), tietLabel(c) ? `${tietLabel(c)} · ${c.start} – ${c.end}` : `${c.start} – ${c.end}`),
          c.room && h('span', null, h('i', { className: 'bi bi-geo-alt me-1' }), c.room),
          c.teacher && h('span', null, h('i', { className: 'bi bi-person me-1' }), c.teacher),
          h('span', { style: { color: cf.color } }, h('i', { className: `bi bi-${cf.icon} me-1` }), cf.label),
          (c.startDate || c.endDate) && h('span', { title: 'Khoảng ngày diễn ra của học kỳ' }, h('i', { className: 'bi bi-calendar-range me-1' }),
            `${c.startDate ? fmtDate(c.startDate) : '…'} – ${c.endDate ? fmtDate(c.endDate) : '…'}`)
        ),
        c.description && h('div', { className: 'small text-muted mt-1' }, h('i', { className: 'bi bi-card-text me-1' }), c.description),
        c.link && h('a', { href: c.link, target: '_blank', rel: 'noopener noreferrer', className: 'btn btn-sm btn-success mt-2' },
          h('i', { className: 'bi bi-camera-video me-1' }), T.joinClass)
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
        h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-calendar-week me-2', style: { color: 'var(--primary)' } }), T.title),
        h('small', { className: 'text-muted' }, T.subtitle, role === 'student' && user?.className ? ` · lớp ${user.className}` : '')
      ),
      isTeacher && h('button', { className: 'btn btn-primary btn-sm',
        onClick: () => tab === 'tkb' ? (setEditCls(null), setClsModal('add')) : (setEditExam(null), setExamModal('add')) },
        h('i', { className: 'bi bi-plus-lg me-1' }), tab === 'tkb' ? T.addClass : T.addExam
      )
    ),

    // Tabs
    h('div', { className: 'd-flex gap-2 mb-4' },
      h('button', { className: `btn btn-sm ${tab === 'tkb' ? 'btn-primary' : 'btn-outline-primary'}`, onClick: () => setTab('tkb') },
        h('i', { className: 'bi bi-calendar-week me-1' }), T.weekTab),
      h('button', { className: `btn btn-sm ${tab === 'thi' ? 'btn-primary' : 'btn-outline-primary'}`, onClick: () => setTab('thi') },
        h('i', { className: 'bi bi-clipboard-check me-1' }), `${T.examTab}${shownExams.length ? ` (${shownExams.length})` : ''}`)
    ),

    // Tab thời khóa biểu: chuyển tuần theo mốc thời gian thật
    tab === 'tkb' && h('div', { className: 'card border-0 shadow-sm mb-3' },
      h('div', { className: 'card-body py-2 px-3 d-flex flex-wrap align-items-center gap-2' },
        h('button', { className: 'btn btn-sm btn-outline-secondary', title: 'Tuần trước', onClick: () => setWeek(addDays(week, -7)) }, h('i', { className: 'bi bi-chevron-left' }), ' Tuần trước'),
        h('button', { className: `btn btn-sm ${isThisWeek ? 'btn-primary' : 'btn-outline-primary'}`, onClick: () => setWeek(mondayOf(today)) }, 'Tuần này'),
        h('button', { className: 'btn btn-sm btn-outline-secondary', title: 'Tuần sau', onClick: () => setWeek(addDays(week, 7)) }, 'Tuần sau ', h('i', { className: 'bi bi-chevron-right' })),
        h('div', { className: 'ms-2' },
          h('div', { className: 'fw-bold' }, weekRangeLabel(week), isThisWeek && h('span', { className: 'badge bg-success ms-2' }, 'Tuần hiện tại'),
            weekNo && h('span', { className: 'badge bg-primary-subtle text-primary ms-2' }, `Tuần ${weekNo} của học kỳ ${oneTerm.ky} · ${oneTerm.namHoc}`)),
          h('small', { className: 'text-muted' }, `${weekCount} ${T.unit}${weekExamCount ? ` · ${weekExamCount} lịch thi` : ''} trong tuần`)),
        h('div', { className: 'ms-auto d-flex align-items-center gap-2' },
          h('label', { className: 'small text-muted mb-0' }, 'Đến ngày'),
          h('input', { type: 'date', className: 'form-control form-control-sm', style: { width: 'auto' }, value: today === week ? today : '', 'aria-label': 'Chọn ngày để chuyển tới tuần chứa ngày đó',
            onChange: e => e.target.value && setWeek(mondayOf(e.target.value)) }))
      ),
      (weekKhoaOpts.length > 1 || weekClassChoices.length > 1) && h('div', { className: 'card-body border-top py-2 px-3 d-flex flex-wrap align-items-center gap-2' },
        h('i', { className: 'bi bi-funnel text-muted' }),
        weekKhoaOpts.length > 1 && h('select', { className: 'form-select form-select-sm', style: { width: 'auto' }, value: fKhoa, onChange: e => { setFKhoa(e.target.value); setFClass('') }, 'aria-label': 'Lọc theo khóa' },
          h('option', { value: '' }, 'Tất cả khóa'), weekKhoaOpts.map(k => h('option', { key: k, value: k }, `Khóa ${k}`))),
        weekClassChoices.length > 1 && h('select', { className: 'form-select form-select-sm', style: { width: 'auto' }, value: fClass, onChange: e => setFClass(e.target.value), 'aria-label': 'Lọc theo lớp' },
          h('option', { value: '' }, `Tất cả lớp (${weekClassChoices.length})`), weekClassChoices.map(c => h('option', { key: c.id, value: c.id }, c.name))),
        (fKhoa || fClass) && h('button', { className: 'btn btn-sm btn-link', onClick: () => { setFKhoa(''); setFClass('') } }, 'Bỏ lọc'))
    ),

    // Tab lịch thi: lọc theo khóa, học kỳ, lớp (mặc định học kỳ hiện tại)
    tab === 'thi' && showFilters && h('div', { className: 'd-flex flex-wrap align-items-center gap-2 mb-4' },
      h('i', { className: 'bi bi-funnel text-muted' }),
      khoaOpts.length > 1 && h('select', { className: 'form-select form-select-sm', style: { width: 'auto' }, value: fKhoa, onChange: e => { setFKhoa(e.target.value); setFClass('') }, 'aria-label': 'Lọc theo khóa' },
        h('option', { value: '' }, 'Tất cả khóa'),
        khoaOpts.map(k => h('option', { key: k, value: k }, `Khóa ${k}`))
      ),
      termOpts.length > 1 && h(TermSelect, { termOpts, value: termSel, onChange: v => { setFTerm(v); setFClass('') }, years: displayYears }),
      classChoices.length > 1 && h('select', { className: 'form-select form-select-sm', style: { width: 'auto' }, value: fClass, onChange: e => setFClass(e.target.value), 'aria-label': 'Lọc theo lớp' },
        h('option', { value: '' }, `Tất cả lớp (${classChoices.length})`),
        classChoices.map(c => h('option', { key: c.id, value: c.id }, c.name))
      ),
      !isDefault && h('button', { className: 'btn btn-sm btn-link', onClick: resetFilters }, 'Về học kỳ hiện tại'),
      h('small', { className: 'text-muted ms-1' }, `${shownExams.length} lịch thi`, termSel && termOpts.find(t => t.key === termSel)?.current ? ' · học kỳ hiện tại' : ''),
      h('div', { className: 'ms-auto d-flex flex-wrap gap-2' },
        h(ExportButton, { filename: 'lich-thi.csv', count: shownExams.length, label: 'Trích lục lịch thi',
          header: ['Mã HP', 'Học phần', 'Khóa', 'Năm học', 'Học kỳ', 'Lớp', 'Ngày thi', 'Bắt đầu', 'Kết thúc', 'Phòng', 'Hình thức', 'Giám thị'],
          rows: () => shownExams.map(e => { const sb = subjectOf(e.subjectId), t = termInfoOf(e, subjectOf) || {}
            return [sb.code || '', sb.name || '', e.khoa || sb.khoa || '', t.namHoc || '', t.ky || '', e.className || e.classId || '', e.date || '',
              e.start || '', e.end || '', e.room || '', EXAM_FORMATS[e.format]?.label || e.format || '', e.teacher || ''] }) }),
        h(ExportButton, { filename: 'thoi-khoa-bieu.csv', count: shownSchedule.length, label: 'Trích lục lịch học',
          header: ['Mã HP', 'Học phần', 'Khóa', 'Năm học', 'Học kỳ', 'Lớp', 'Thứ', 'Bắt đầu', 'Kết thúc', 'Phòng', 'Giáo viên', 'Từ ngày', 'Đến ngày'],
          rows: () => shownSchedule.map(c => { const sb = subjectOf(c.subjectId), t = termInfoOf(c, subjectOf) || {}
            return [sb.code || '', sb.name || '', c.khoa || sb.khoa || '', t.namHoc || '', t.ky || '', c.className || c.classId || '',
              DAY_LABELS[c.day] || c.day || '', c.start || '', c.end || '', c.room || '', c.teacher || '', c.startDate || '', c.endDate || ''] }) }))
    ),

    // ── TAB: Thời khóa biểu theo tuần ──
    tab === 'tkb' && h('div', { className: 'd-flex flex-column gap-3' },
      weekDays.filter(d => d.day !== 8 || dayItems(d).length || dayExams(d).length).map(d => {
        const items = dayItems(d), exs = dayExams(d), isToday = d.iso === today
        const [yy, mm, dd] = d.iso.split('-')
        return h('div', { key: d.iso, className: `card border-0 shadow-sm${isToday ? ' border border-primary' : ''}`, style: isToday ? { boxShadow: '0 0 0 2px var(--primary)' } : undefined },
          h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 fw-bold d-flex align-items-center gap-2' },
            h('i', { className: 'bi bi-calendar3', style: { color: 'var(--primary)' } }), DAY_LABELS[d.day], h('span', { className: 'fw-normal text-muted' }, `${dd}/${mm}/${yy}`),
            isToday && h('span', { className: 'badge bg-primary' }, 'Hôm nay'),
            !items.length && !exs.length && h('span', { className: 'badge bg-light text-muted border ms-1' }, 'Nghỉ')),
          (items.length > 0 || exs.length > 0) && h('div', { className: 'card-body pt-2 px-4 pb-3 d-flex flex-column gap-2' },
            items.map(classCard),
            exs.map(e => {
              const sub = subjectOf(e.subjectId), ef = EXAM_FORMATS[e.format] || EXAM_FORMATS.tuLuan
              return h('div', { key: 'e' + e.id, className: 'sched-item', style: { borderLeftColor: '#e74a3b' } },
                h('div', { className: 'flex-grow-1 min-w-0' },
                  h('div', { className: 'fw-semibold' }, h('span', { className: 'badge bg-danger me-2' }, T.examBadge), sub.name || 'Môn thi', classBadge(e), semBadge(sub)),
                  h('div', { className: 'd-flex flex-wrap gap-3 mt-1 small text-muted' },
                    h('span', null, h('i', { className: 'bi bi-clock me-1' }), tietLabel(e) ? `${tietLabel(e)} · ${e.start} – ${e.end}` : `${e.start}${e.end ? ' – ' + e.end : ''}`),
                    e.room && h('span', null, h('i', { className: 'bi bi-geo-alt me-1' }), e.room),
                    e.teacher && role !== 'student' && h('span', null, h('i', { className: 'bi bi-person-badge me-1' }), `${T.examPerson}: ${e.teacher}`),
                    h('span', { style: { color: ef.color } }, h('i', { className: `bi bi-${ef.icon} me-1` }), ef.label)),
                  roomAction(e, false)))
            })
          )
        )
      }),
      weekCount === 0 && weekExamCount === 0 && h('div', { className: 'text-center text-muted py-4' },
        h('i', { className: 'bi bi-calendar-x fs-1 d-block mb-2 opacity-25' }),
        h('p', { className: 'mb-1' }, T.noClassWeek),
        h('small', null, 'Có thể tuần này nằm ngoài thời gian học kỳ (nghỉ hoặc kỳ thi). Dùng "Tuần trước", "Tuần sau" hoặc chọn ngày để chuyển tuần.')),
      guidedNow.length > 0 && h('div', { className: 'card border-0 shadow-sm' },
        h('div', { className: 'card-body py-3 px-4' },
          h('div', { className: 'fw-bold small mb-1' }, h('i', { className: 'bi bi-person-check me-2', style: { color: 'var(--primary)' } }), 'Môn hướng dẫn: không có thời khóa biểu cố định'),
          h('div', { className: 'small text-muted mb-2' }, 'Thực tập, đồ án và khóa luận làm việc theo lịch hẹn với giáo viên hướng dẫn; kết quả phụ thuộc việc đáp ứng yêu cầu của người hướng dẫn.'),
          h('div', { className: 'd-flex flex-wrap gap-2' }, guidedNow.map(sb => h('span', { key: sb.id, className: 'badge bg-info-subtle text-info' }, sb.name, sb.khoa ? ` · Khóa ${sb.khoa}` : '')))))
    ),

    // ── TAB: Lịch thi ──
    tab === 'thi' && (
      sortedExams.length === 0
        ? h('div', { className: 'text-center text-muted py-5' },
            h('i', { className: 'bi bi-clipboard-x fs-1 d-block mb-3 opacity-25' }),
            h('p', null, isTeacher ? T.examNoItems : 'Chưa có lịch thi.')
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
                        h('div', { className: 'fw-bold' }, sub.name || 'Môn thi', classBadge(e), semBadge(sub)),
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
                      h('div', null, h('i', { className: 'bi bi-clock me-2 text-muted' }), tietLabel(e) ? `${tietLabel(e)} · ` : '', `${e.start}${e.end ? ' – ' + e.end : ''}`),
                      e.room && h('div', null, h('i', { className: 'bi bi-geo-alt me-2 text-muted' }), e.room),
                      e.teacher && h('div', null, h('i', { className: 'bi bi-person me-2 text-muted' }), role === 'student' ? e.teacher : `${T.examPerson}: ${e.teacher}`),
                      e.description && h('div', { className: 'text-muted' }, h('i', { className: 'bi bi-card-text me-2' }), e.description)
                    ),
                    roomAction(e, true),
                    e.link && !hasRoomQuiz(e) && h('a', { href: e.link, target: '_blank', rel: 'noopener noreferrer', className: 'btn btn-sm btn-success w-100 mt-3' },
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

    clsModal  && h(ClassModal, { subjects: modalSubjects(editCls?.subjectId), item: clsModal === 'edit' ? editCls : null, defaultTeacher, classOptionsFor, requireClass, title: clsModal === 'edit' ? T.editClass : T.addClass, onSave: saveCls, onClose: () => setClsModal(null) }),
    examModal && h(ExamModal,  { subjects: modalSubjects(editExam?.subjectId), quizzes, item: examModal === 'edit' ? editExam : null, defaultTeacher, classOptionsFor, requireClass, onSave: saveExam, onClose: () => setExamModal(null) }),
    confirm   && h(ConfirmModal, { message: confirm.kind === 'cls' ? T.delClass : 'Xóa lịch thi này?', onConfirm: doConfirm, onClose: () => setConfirm(null) }),
    room && room.kind === 'enter' && h(ExamEntryModal, { exam: room.exam, subjectName: subjectOf(room.exam.subjectId).name || 'Môn thi', onClose: () => setRoom(null),
      onSubmitted: (res) => setSubmissions && setSubmissions(prev => [...prev.filter(x => !(x.quizId === res.quizId && x.userId === user?.uid)), { ...res, userId: user?.uid }]) }),
    room && room.kind === 'panel' && h(ExamRoomPanel, { exam: room.exam, subjectName: subjectOf(room.exam.subjectId).name || 'Môn thi', onClose: () => setRoom(null) })
  )
}
