// pages/Subjects.js – Quản lý Môn học + Bài tập
import { SUBJECT_COLORS, MATERIAL_TYPES } from '../utils/constants.js'
import { isOverdue, getDaysUntil } from '../utils/helpers.js'
import ConfirmModal from '../components/ConfirmModal.js'
import ActionMenu from '../components/ActionMenu.js'
import Portal from '../components/Portal.js'
import { QuizTaker } from './Quiz.js'

const QUIZ_STATUS_LABELS = { draft: 'Bản nháp', active: 'Đang mở', closed: 'Đã đóng' }
const QUIZ_STATUS_COLORS = { draft: 'secondary', active: 'success', closed: 'danger' }

const { useState, createElement: h } = window.React

// ── Modal thêm/sửa môn học ──
function SubjectModal({ item, onSave, onClose }) {
  // Backward-compat: nếu cũ chỉ có teacher (string) thì chuyển sang teachers (array)
  const initTeachers = item
    ? (item.teachers?.length ? item.teachers : (item.teacher ? [item.teacher] : ['']))
    : ['']

  const [form, setForm] = useState(
    item ? { name: item.name, code: item.code, color: item.color, teachers: initTeachers, credits: item.credits || '', description: item.description || '', note: item.note || '' }
         : { name: '', code: '', color: SUBJECT_COLORS[0], teachers: [''], credits: '', description: '', note: '' }
  )
  const valid = form.name.trim()

  const setTeacher = (i, val) => {
    const arr = [...form.teachers]; arr[i] = val; setForm({ ...form, teachers: arr })
  }
  const addTeacher    = () => form.teachers.length < 4 && setForm({ ...form, teachers: [...form.teachers, ''] })
  const removeTeacher = (i) => setForm({ ...form, teachers: form.teachers.filter((_, j) => j !== i) })

  return (
    h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
      h('div', { className: 'modal-dialog modal-dialog-centered modal-dialog-scrollable' },
        h('div', { className: 'modal-content' },
          h('div', { className: 'modal-header' },
            h('h5', { className: 'modal-title fw-bold' }, item ? 'Sửa môn học' : 'Thêm môn học'),
            h('button', { className: 'btn-close', onClick: onClose })
          ),
          h('div', { className: 'modal-body' },
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, 'Tên môn học ', h('span', { className: 'text-danger' }, '*')),
              h('input', { className: 'form-control', placeholder: 'VD: Toán cao cấp', value: form.name, autoFocus: true, onChange: (e) => setForm({ ...form, name: e.target.value }) })
            ),
            h('div', { className: 'row g-3 mb-3' },
              h('div', { className: 'col-6' },
                h('label', { className: 'form-label fw-semibold' }, 'Mã môn'),
                h('input', { className: 'form-control', placeholder: 'VD: MTH101', value: form.code, onChange: (e) => setForm({ ...form, code: e.target.value }) })
              ),
              h('div', { className: 'col-6' },
                h('label', { className: 'form-label fw-semibold' }, 'Số tín chỉ'),
                h('input', { type: 'number', className: 'form-control', placeholder: 'VD: 3', min: 1, max: 10, value: form.credits, onChange: (e) => setForm({ ...form, credits: e.target.value }) })
              )
            ),

            // ── Nhiều giảng viên ──
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' },
                h('i', { className: 'bi bi-person-video3 me-1' }), 'Giảng viên đảm nhận'
              ),
              h('div', { className: 'small text-muted mb-2' },
                h('i', { className: 'bi bi-info-circle me-1' }),
                'Tên giảng viên được đồng bộ với phân quyền trang Quản trị. Bạn có thể nhập thêm tên nếu chưa có tài khoản.'
              ),
              form.teachers.map((t, i) =>
                h('div', { key: i, className: 'd-flex gap-2 mb-2 align-items-center' },
                  h('div', { className: 'teacher-avatar-sm flex-shrink-0' }, String(i + 1)),
                  h('input', { className: 'form-control form-control-sm', placeholder: 'VD: TS. Nguyễn Văn An', value: t,
                    onChange: e => setTeacher(i, e.target.value) }),
                  form.teachers.length > 1 && h('button', { type: 'button', className: 'btn btn-sm btn-outline-danger flex-shrink-0', onClick: () => removeTeacher(i) },
                    h('i', { className: 'bi bi-x' })
                  )
                )
              ),
              form.teachers.length < 4 && h('button', { type: 'button', className: 'btn btn-sm btn-outline-secondary mt-1', onClick: addTeacher },
                h('i', { className: 'bi bi-person-plus me-1' }), 'Thêm giảng viên'
              )
            ),

            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, 'Màu sắc'),
              h('div', { className: 'd-flex gap-2 flex-wrap mt-1' },
                SUBJECT_COLORS.map((c) =>
                  h('button', { key: c, type: 'button', className: `color-btn ${form.color === c ? 'selected' : ''}`, style: { backgroundColor: c }, onClick: () => setForm({ ...form, color: c }) },
                    form.color === c && h('i', { className: 'bi bi-check text-white', style: { fontSize: 14 } })
                  )
                )
              )
            ),

            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-card-text me-1' }), 'Mô tả học phần'),
              h('textarea', { className: 'form-control', rows: 2, placeholder: 'Giới thiệu ngắn về môn học, mục tiêu, nội dung chính...', value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }) })
            ),
            h('div', null,
              h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-megaphone me-1 text-success' }), 'Ghi chú / Thông báo'),
              h('textarea', { className: 'form-control', rows: 2, placeholder: 'Thông báo tới sinh viên (VD: nghỉ học tuần này, đổi phòng...)', value: form.note, onChange: (e) => setForm({ ...form, note: e.target.value }) }),
              h('div', { className: 'form-text' }, 'Ghi chú sẽ hiển thị nổi bật trên thẻ môn học và gửi thông báo cho sinh viên.')
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
            h('button', { className: 'btn btn-primary', disabled: !valid,
              onClick: () => valid && onSave({
                ...form,
                // Lưu cả teachers (array) và teacher (string) để backward-compat
                teachers: form.teachers.filter(t => t.trim()),
                teacher:  form.teachers.filter(t => t.trim())[0] || '',
              }) },
              item ? 'Lưu thay đổi' : 'Thêm môn học'
            )
          )
        )
      )
    )
  )
}

// ── Modal thêm/sửa bài tập (giáo viên) ──
function HomeworkModal({ subjectId, item, onSave, onClose }) {
  const [form, setForm] = useState(
    item ? { title: item.title || '', dueDate: item.dueDate || '', description: item.description || '',
             fileUrl: item.fileUrl || '', fileName: item.fileName || '',
             allowSubmit: item.allowSubmit !== false }
         : { title: '', dueDate: '', description: '', fileUrl: '', fileName: '', allowSubmit: true }
  )
  const valid = form.title.trim() && form.dueDate
  return (
    h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
      h('div', { className: 'modal-dialog modal-dialog-centered' },
        h('div', { className: 'modal-content' },
          h('div', { className: 'modal-header' },
            h('h5', { className: 'modal-title fw-bold' },
              h('i', { className: 'bi bi-journal-plus me-2', style: { color: 'var(--primary)' } }),
              item ? 'Sửa bài tập' : 'Giao bài tập mới'
            ),
            h('button', { className: 'btn-close', onClick: onClose })
          ),
          h('div', { className: 'modal-body' },
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, 'Tiêu đề ', h('span', { className: 'text-danger' }, '*')),
              h('input', { className: 'form-control', placeholder: 'VD: Bài tập Chương 3', value: form.title, autoFocus: true, onChange: (e) => setForm({ ...form, title: e.target.value }) })
            ),
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, 'Hạn nộp ', h('span', { className: 'text-danger' }, '*')),
              h('input', { type: 'date', className: 'form-control', value: form.dueDate, onChange: (e) => setForm({ ...form, dueDate: e.target.value }) })
            ),
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, 'Nội dung / Yêu cầu bài tập'),
              h('textarea', { className: 'form-control', rows: 3, placeholder: 'Mô tả chi tiết yêu cầu, hướng dẫn làm bài...', value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }) })
            ),
            // ── File đề bài đính kèm ──
            h('div', { className: 'p-3 rounded-3 mb-3', style: { background: 'rgba(78,115,223,.05)', border: '1px dashed var(--border-color)' } },
              h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-paperclip me-1' }), 'File đề bài đính kèm'),
              h('input', { className: 'form-control mb-2', placeholder: 'Dán link file đề bài (Google Drive, OneDrive...)', value: form.fileUrl, onChange: (e) => setForm({ ...form, fileUrl: e.target.value }) }),
              h('input', { className: 'form-control', placeholder: 'Tên file hiển thị (VD: De_bai_chuong3.pdf)', value: form.fileName, onChange: (e) => setForm({ ...form, fileName: e.target.value }) }),
              h('div', { className: 'form-text' }, 'Tải file lên Drive/OneDrive rồi dán link chia sẻ vào đây. Để trống nếu không có file.')
            ),
            // ── Tùy chọn nộp bài ──
            h('div', { className: 'form-check form-switch p-3 rounded-3', style: { background: 'rgba(28,200,138,.07)' } },
              h('input', { className: 'form-check-input', type: 'checkbox', role: 'switch', id: 'allowSubmit', checked: form.allowSubmit,
                onChange: (e) => setForm({ ...form, allowSubmit: e.target.checked }) }),
              h('label', { className: 'form-check-label fw-semibold', htmlFor: 'allowSubmit' },
                h('i', { className: 'bi bi-cloud-upload me-1 text-success' }), 'Cho phép sinh viên nộp bài (kèm link)'),
              h('div', { className: 'form-text mt-1' },
                form.allowSubmit
                  ? 'Sinh viên sẽ thấy ô nộp link bài làm và ghi chú.'
                  : 'Bài tập chỉ để xem / thông báo — sinh viên chỉ đánh dấu hoàn thành, không nộp link.')
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
            h('button', { className: 'btn btn-primary', disabled: !valid,
              onClick: () => valid && onSave({ title: form.title.trim(), type: 'assign', allowSubmit: form.allowSubmit, dueDate: form.dueDate, description: form.description, fileUrl: form.fileUrl.trim(), fileName: form.fileName.trim(), subjectId }) },
              item ? 'Lưu thay đổi' : 'Giao bài'
            )
          )
        )
      )
    )
  )
}

// ── Modal xem chi tiết bài tập + nộp bài (sinh viên) ──
function HomeworkDetailModal({ hw, role, onSubmit, onUndo, onClose }) {
  const sub      = hw.submission
  const isStudent = role === 'student'
  const allowSubmit = hw.allowSubmit !== false   // mặc định cho nộp
  const [url,  setUrl]  = useState(sub?.url  || '')
  const [note, setNote] = useState(sub?.note || '')
  const days = getDaysUntil(hw.dueDate)
  const overdue = hw.status !== 'completed' && days < 0

  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
    h('div', { className: 'modal-dialog modal-dialog-centered modal-dialog-scrollable' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' },
          h('h5', { className: 'modal-title fw-bold' },
            h('i', { className: 'bi bi-journal-text me-2', style: { color: 'var(--primary)' } }), hw.title),
          h('button', { className: 'btn-close', onClick: onClose })
        ),
        h('div', { className: 'modal-body' },
          // Thông tin chung
          h('div', { className: 'd-flex flex-wrap gap-2 mb-3' },
            allowSubmit
              ? h('span', { className: 'badge bg-success-subtle text-success' }, h('i', { className: 'bi bi-cloud-upload me-1' }), 'Có nộp bài')
              : h('span', { className: 'badge bg-secondary-subtle text-secondary' }, h('i', { className: 'bi bi-eye me-1' }), 'Chỉ xem'),
            h('span', { className: `badge ${overdue ? 'bg-danger' : hw.status === 'completed' ? 'bg-success' : 'bg-secondary'}` },
              h('i', { className: 'bi bi-calendar3 me-1' }),
              new Date(hw.dueDate).toLocaleDateString('vi-VN'),
              overdue ? ` (quá ${-days}N)` : hw.status === 'completed' ? '' : days === 0 ? ' (hôm nay)' : ` (còn ${days}N)`
            ),
            hw.status === 'completed' && h('span', { className: 'badge bg-success' }, h('i', { className: 'bi bi-check-circle me-1' }), allowSubmit ? 'Đã nộp' : 'Đã hoàn thành')
          ),

          // Nội dung yêu cầu
          h('div', { className: 'mb-3' },
            h('div', { className: 'fw-semibold mb-1' }, h('i', { className: 'bi bi-card-text me-1 text-muted' }), 'Nội dung yêu cầu'),
            h('div', { className: 'text-muted', style: { whiteSpace: 'pre-wrap' } }, hw.description || 'Không có mô tả chi tiết.')
          ),

          // File đề bài
          hw.fileUrl && h('div', { className: 'mb-3' },
            h('div', { className: 'fw-semibold mb-1' }, h('i', { className: 'bi bi-paperclip me-1 text-muted' }), 'File đề bài'),
            h('a', { href: hw.fileUrl, target: '_blank', rel: 'noopener noreferrer', className: 'btn btn-outline-primary btn-sm' },
              h('i', { className: 'bi bi-download me-1' }), hw.fileName || 'Tải file đề bài'
            )
          ),

          // Khu vực nộp bài (sinh viên) – chỉ khi giáo viên cho phép nộp
          isStudent && allowSubmit && h('div', { className: 'p-3 rounded-3 mt-2', style: { background: 'rgba(28,200,138,.06)', border: '1px solid rgba(28,200,138,.25)' } },
            h('div', { className: 'fw-semibold mb-2' }, h('i', { className: 'bi bi-cloud-upload me-1 text-success' }), sub ? 'Bài nộp của bạn' : 'Nộp bài'),
            sub && sub.at && h('div', { className: 'small text-success mb-2' }, h('i', { className: 'bi bi-check-circle-fill me-1' }), `Đã nộp ngày ${new Date(sub.at).toLocaleDateString('vi-VN')}`),
            h('label', { className: 'form-label small fw-semibold mb-1' }, 'Link bài làm (Google Drive, OneDrive, GitHub...)'),
            h('input', { className: 'form-control form-control-sm mb-2', placeholder: 'https://drive.google.com/...', value: url, onChange: e => setUrl(e.target.value) }),
            h('label', { className: 'form-label small fw-semibold mb-1' }, 'Ghi chú cho giảng viên'),
            h('textarea', { className: 'form-control form-control-sm', rows: 2, placeholder: 'Ghi chú thêm (nếu có)...', value: note, onChange: e => setNote(e.target.value) })
          ),
          // Bài chỉ xem (không nộp)
          isStudent && !allowSubmit && h('div', { className: 'alert alert-secondary small mt-2 mb-0 py-2' },
            h('i', { className: 'bi bi-info-circle me-1' }), 'Bài tập này không yêu cầu nộp bài qua hệ thống. Bạn có thể đánh dấu đã hoàn thành.')
        ),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Đóng'),
          isStudent && sub && h('button', { className: 'btn btn-outline-danger', onClick: () => { onUndo(hw.id); onClose() } },
            h('i', { className: 'bi bi-arrow-counterclockwise me-1' }), allowSubmit ? 'Hủy nộp' : 'Bỏ đánh dấu'),
          isStudent && allowSubmit && h('button', { className: 'btn btn-success', onClick: () => { onSubmit(hw, { status: 'completed', url, note }); onClose() } },
            h('i', { className: 'bi bi-send-fill me-1' }), sub ? 'Cập nhật bài nộp' : 'Nộp bài'
          ),
          isStudent && !allowSubmit && !sub && h('button', { className: 'btn btn-success', onClick: () => { onSubmit(hw, { status: 'completed' }); onClose() } },
            h('i', { className: 'bi bi-check-lg me-1' }), 'Đánh dấu hoàn thành'
          )
        )
      )
    )
  )
}

// ── Modal thêm/sửa tài liệu học phần ──
function MaterialModal({ subjectId, item, user, onSave, onClose }) {
  const [form, setForm] = useState(
    item ? { ...item }
         : { title: '', type: 'giaoTrinh', description: '', url: '' }
  )
  const valid    = form.title.trim()
  const typeInfo = MATERIAL_TYPES[form.type] || MATERIAL_TYPES.giaoTrinh

  return (
    h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
      h('div', { className: 'modal-dialog modal-dialog-centered' },
        h('div', { className: 'modal-content' },
          h('div', { className: 'modal-header' },
            h('h5', { className: 'modal-title fw-bold' },
              h('i', { className: `bi bi-${typeInfo.icon} me-2`, style: { color: typeInfo.color } }),
              item ? 'Sửa tài liệu' : 'Thêm tài liệu học phần'
            ),
            h('button', { className: 'btn-close', onClick: onClose })
          ),
          h('div', { className: 'modal-body' },
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, 'Loại tài liệu'),
              h('div', { className: 'd-flex gap-2 flex-wrap' },
                Object.entries(MATERIAL_TYPES).map(([k, v]) =>
                  h('button', { key: k, type: 'button',
                    className: `btn btn-sm ${form.type === k ? 'text-white border-0' : 'btn-outline-secondary'}`,
                    style: form.type === k ? { backgroundColor: v.color } : {},
                    onClick: () => setForm({ ...form, type: k }) },
                    h('i', { className: `bi bi-${v.icon} me-1` }), v.label
                  )
                )
              )
            ),
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, 'Tên tài liệu ', h('span', { className: 'text-danger' }, '*')),
              h('input', { className: 'form-control', placeholder: 'VD: Giáo trình Toán cao cấp A1', value: form.title, autoFocus: true,
                onChange: e => setForm({ ...form, title: e.target.value }) })
            ),
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, 'Mô tả'),
              h('textarea', { className: 'form-control', rows: 2, placeholder: 'Ghi chú về nội dung tài liệu...', value: form.description,
                onChange: e => setForm({ ...form, description: e.target.value }) })
            ),
            h('div', { className: 'mb-1' },
              h('label', { className: 'form-label fw-semibold' },
                h('i', { className: 'bi bi-link-45deg me-1' }), 'Đường dẫn tải về / xem trực tuyến'
              ),
              h('input', { className: 'form-control', placeholder: 'https://drive.google.com/...', value: form.url,
                onChange: e => setForm({ ...form, url: e.target.value }) }),
              h('div', { className: 'form-text' }, 'Dán link Google Drive, OneDrive, GitHub... Để trống nếu chưa có.')
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
            h('button', { className: 'btn btn-primary', disabled: !valid,
              onClick: () => valid && onSave({
                ...form,
                subjectId,
                uploadedBy: user?.name || 'Giảng viên',
                uploadedAt: new Date().toISOString().split('T')[0],
              }) },
              item ? 'Lưu thay đổi' : 'Thêm tài liệu'
            )
          )
        )
      )
    )
  )
}

// ── Subject Card (bao gồm bài tập 3 tab) ──
function SubjectCard({ subject, deadlines, homeworks, setHomeworks, onEdit, onDelete, role, assignedTeachers, materials, setMaterials, user, quizzes, submissions, setSubmissions, onNavigateQuiz, onActivity, onSubmitHomework, onUndoHomework }) {
  const [expanded,        setExpanded]        = useState(false)   // bài tập
  const [matExpanded,     setMatExpanded]     = useState(false)   // tài liệu
  const [quizExpanded,    setQuizExpanded]    = useState(false)   // trắc nghiệm
  const [taking,          setTaking]          = useState(null)    // quiz đang làm
  const [detailHw,        setDetailHw]        = useState(null)    // bài tập đang xem chi tiết
  const [hwModal,         setHwModal]         = useState(null)
  const [editHw,          setEditHw]          = useState(null)
  const [confirmHw,       setConfirmHw]       = useState(null)
  const [matModal,        setMatModal]        = useState(null)    // null | 'add' | 'edit'
  const [editMat,         setEditMat]         = useState(null)
  const [confirmMatId,    setConfirmMatId]    = useState(null)

  const subMats     = (materials || []).filter(m => m.subjectId === subject.id)

  // ── Trắc nghiệm của môn này ──
  const isTeacher     = role === 'admin' || role === 'teacher'
  const subQuizzes    = (quizzes || []).filter(q => q.subjectId === subject.id)
  const visibleQuizzes = subQuizzes.filter(q => isTeacher ? true : q.status === 'active')
  const mySubmissions = (submissions || []).filter(s => s.userId === user?.uid)
  const submittedMap  = new Map(mySubmissions.map(s => [s.quizId, s]))

  const handleSubmitQuiz = (result) => {
    if (setSubmissions) {
      setSubmissions([...(submissions || []).filter(s => !(s.quizId === result.quizId && s.userId === user?.uid)),
                      { ...result, userId: user?.uid }])
    }
    if (onActivity && taking) onActivity({ type: 'quiz', subjectId: subject.id, refId: taking.id, refTitle: taking.title, score: result.score, total: result.total, correct: result.correct })
  }

  const toggleHw = () => { setExpanded(v => !v); setMatExpanded(false); setQuizExpanded(false) }
  const toggleMat = () => { setMatExpanded(v => !v); setExpanded(false); setQuizExpanded(false) }
  const toggleQuiz = () => { setQuizExpanded(v => !v); setExpanded(false); setMatExpanded(false) }

  const handleMatSave = (form) => {
    if (matModal === 'edit') setMaterials(prev => prev.map(m => m.id === editMat.id ? { ...m, ...form } : m))
    else setMaterials(prev => [...prev, { id: Date.now(), ...form }])
    setMatModal(null)
  }

  const dlCount  = deadlines.filter((d) => d.subjectId === subject.id).length
  const subHws   = homeworks.filter((hw) => hw.subjectId === subject.id)
  const sortedHws = subHws.slice().sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  const doneCount = subHws.filter((hw) => hw.status === 'completed').length
  const pendingCount = subHws.filter((hw) => hw.status !== 'completed').length

  const handleHwSave = (form) => {
    if (hwModal === 'edit') setHomeworks(prev => prev.map((hw) => hw.id === editHw.id ? { ...hw, ...form } : hw))
    else setHomeworks(prev => [...prev, { id: Date.now(), ...form }])
    setHwModal(null)
  }
  const markDone = (hw) => { if (onSubmitHomework) onSubmitHomework(hw, { status: 'completed' }) }

  return (
    h('div', { className: 'subject-card card border-0 shadow-sm' },
      // ── Thanh màu trên cùng ──
      h('div', { style: { height: 5, backgroundColor: subject.color, borderRadius: '12px 12px 0 0' } }),
      h('div', { className: 'card-body' },
        // ── Header ──
        h('div', { className: 'd-flex align-items-start justify-content-between mb-3' },
          h('div', { className: 'd-flex align-items-center gap-3' },
            h('div', { className: 'subject-color-dot', style: { backgroundColor: subject.color } },
              h('i', { className: 'bi bi-book text-white', style: { fontSize: 18 } })
            ),
            h('div', null,
              h('div', { className: 'fw-bold fs-6 mb-1' }, subject.name),
              h('div', { className: 'd-flex flex-wrap gap-1' },
                subject.code && h('span', { className: 'badge bg-light text-dark border' }, subject.code),
                subject.credits && h('span', { className: 'badge', style: { backgroundColor: 'rgba(78,115,223,.1)', color: 'var(--primary)' } }, `${subject.credits} TC`)
              )
            )
          ),
          role !== 'student' && h(ActionMenu, { items: [
            { label: 'Sửa môn học', icon: 'pencil', iconClass: 'text-primary', onClick: onEdit },
            { divider: true },
            { label: 'Xóa môn học', icon: 'trash', danger: true, onClick: onDelete },
          ] })
        ),

        // ── Giảng viên: ưu tiên từ phân quyền, fallback teachers[] hoặc teacher string ──
        (() => {
          const fromPermissions = assignedTeachers?.length > 0
          const names = fromPermissions
            ? assignedTeachers.map(t => t.name)
            : (subject.teachers?.length ? subject.teachers : (subject.teacher ? [subject.teacher] : []))
          if (!names.length) return null
          return h('div', { className: 'mb-3' },
            names.map((n, i) =>
              h('div', { key: i, className: 'd-flex align-items-center gap-2 mb-1' },
                h('div', { className: 'teacher-avatar-sm', style: { backgroundColor: subject.color } },
                  n.charAt(n.lastIndexOf(' ') + 1) || n.charAt(0)
                ),
                h('span', { className: 'small text-muted' }, n),
                fromPermissions && i === 0 && h('span', { className: 'badge rounded-pill ms-1', style: { backgroundColor: 'rgba(78,115,223,.12)', color: 'var(--primary)', fontSize: '0.65rem' } }, 'Phân công')
              )
            )
          )
        })(),

        // ── Mô tả học phần ──
        subject.description && h('p', { className: 'small text-muted mb-2' }, subject.description),

        // ── Ghi chú / Thông báo của giáo viên ──
        subject.note && h('div', { className: 'subject-note mb-3' },
          h('i', { className: 'bi bi-megaphone-fill flex-shrink-0' }),
          h('span', null, subject.note)
        ),

        // ── Mini stats ──
        h('div', { className: 'd-flex gap-3 flex-wrap mb-3' },
          h('span', { className: 'subj-stat-badge' }, h('i', { className: 'bi bi-list-task me-1' }), `${dlCount} deadline`),
          subHws.length > 0 && h('span', { className: 'subj-stat-badge' }, h('i', { className: 'bi bi-journal-check me-1' }), `${doneCount}/${subHws.length} bài`),
          pendingCount > 0 && h('span', { className: 'subj-stat-badge text-warning' }, h('i', { className: 'bi bi-hourglass-split me-1' }), `${pendingCount} chờ`),
          subMats.length > 0 && h('span', { className: 'subj-stat-badge', style: { color: '#4e73df' } }, h('i', { className: 'bi bi-file-earmark-text me-1' }), `${subMats.length} tài liệu`),
          visibleQuizzes.length > 0 && h('span', { className: 'subj-stat-badge', style: { color: '#e67e22' } }, h('i', { className: 'bi bi-patch-question me-1' }), `${visibleQuizzes.length} trắc nghiệm`)
        ),

        // ── Toggle buttons: Bài tập | Tài liệu | Trắc nghiệm ──
        h('div', { className: 'd-flex gap-2 mb-0 flex-wrap' },
          h('button', {
            className: `btn btn-sm flex-fill ${expanded ? 'btn-primary' : 'btn-outline-primary'}`,
            onClick: toggleHw,
          }, h('i', { className: `bi bi-${expanded ? 'chevron-up' : 'journal-text'} me-1` }), expanded ? 'Ẩn bài tập' : 'Bài tập'),

          h('button', {
            className: `btn btn-sm flex-fill ${matExpanded ? 'btn-info text-white' : 'btn-outline-info'}`,
            onClick: toggleMat,
          }, h('i', { className: `bi bi-${matExpanded ? 'chevron-up' : 'folder2-open'} me-1` }),
            matExpanded ? 'Ẩn tài liệu' : `Tài liệu${subMats.length ? ` (${subMats.length})` : ''}`),

          h('button', {
            className: `btn btn-sm flex-fill ${quizExpanded ? 'text-white' : ''}`,
            style: quizExpanded
              ? { backgroundColor: '#e67e22', borderColor: '#e67e22' }
              : { borderColor: '#e67e22', color: '#e67e22' },
            onClick: toggleQuiz,
          }, h('i', { className: `bi bi-${quizExpanded ? 'chevron-up' : 'patch-question'} me-1` }),
            quizExpanded ? 'Ẩn trắc nghiệm' : `Trắc nghiệm${visibleQuizzes.length ? ` (${visibleQuizzes.length})` : ''}`)
        ),

        // ── Trắc nghiệm học phần ──
        quizExpanded && h('div', { className: 'hw-section mt-3' },
          visibleQuizzes.length === 0
            ? h('div', { className: 'text-center text-muted py-3 small' },
                h('i', { className: 'bi bi-patch-question d-block mb-1 opacity-25', style: { fontSize: '1.8rem' } }),
                isTeacher ? 'Chưa có đề trắc nghiệm nào cho môn này.' : 'Chưa có đề trắc nghiệm nào đang mở.'
              )
            : h('div', { className: 'mat-list' },
                visibleQuizzes.map(quiz => {
                  const sub     = submittedMap.get(quiz.id)
                  const expired = new Date(quiz.dueDate) < new Date()
                  return h('div', { key: quiz.id, className: 'mat-item' },
                    h('div', { className: 'd-flex align-items-start gap-2' },
                      h('div', { className: 'mat-type-icon flex-shrink-0', style: { backgroundColor: 'rgba(230,126,34,.13)', color: '#e67e22' } },
                        h('i', { className: 'bi bi-patch-question' })
                      ),
                      h('div', { className: 'flex-grow-1 min-w-0' },
                        h('div', { className: 'd-flex align-items-center gap-2 flex-wrap' },
                          h('span', { className: 'fw-semibold small' }, quiz.title),
                          h('span', { className: `badge bg-${QUIZ_STATUS_COLORS[quiz.status]}`, style: { fontSize: '0.62rem' } }, QUIZ_STATUS_LABELS[quiz.status])
                        ),
                        quiz.description && h('div', { className: 'small text-muted mt-1' }, quiz.description),
                        h('div', { className: 'd-flex align-items-center gap-3 mt-1 flex-wrap' },
                          h('small', { className: 'text-muted' }, h('i', { className: 'bi bi-list-ol me-1' }), `${quiz.questions.length} câu`),
                          h('small', { className: expired ? 'text-danger' : 'text-muted' }, h('i', { className: 'bi bi-calendar3 me-1' }),
                            new Date(quiz.dueDate).toLocaleDateString('vi-VN'), expired && ' (hết hạn)'),
                          sub && h('small', { className: 'fw-bold', style: { color: sub.score >= 8 ? '#1cc88a' : sub.score >= 6 ? '#e67e22' : '#e74a3b' } },
                            h('i', { className: 'bi bi-trophy-fill me-1' }), `${sub.score}/10`)
                        )
                      ),
                      h('div', { className: 'd-flex gap-1 flex-shrink-0 align-items-center' },
                        // Sinh viên: làm bài / xem kết quả
                        !isTeacher && !sub && quiz.status === 'active' && !expired &&
                          h('button', { className: 'btn btn-sm hw-action-btn text-white', style: { backgroundColor: '#e67e22' }, title: 'Làm bài',
                            onClick: () => setTaking(quiz) }, h('i', { className: 'bi bi-pencil-square' })),
                        !isTeacher && sub &&
                          h('button', { className: 'btn btn-sm btn-outline-secondary hw-action-btn', title: 'Xem kết quả',
                            onClick: () => setTaking(quiz) }, h('i', { className: 'bi bi-eye' })),
                        // Giáo viên/Admin: chỉnh sửa ở trang Trắc nghiệm
                        isTeacher && onNavigateQuiz &&
                          h('button', { className: 'btn btn-sm btn-outline-secondary hw-action-btn', title: 'Quản lý ở trang Trắc nghiệm',
                            onClick: () => onNavigateQuiz() }, h('i', { className: 'bi bi-box-arrow-up-right' }))
                      )
                    )
                  )
                })
              ),
          isTeacher && onNavigateQuiz && h('button', { className: 'btn btn-sm btn-outline-warning w-100 mt-2', onClick: () => onNavigateQuiz() },
            h('i', { className: 'bi bi-plus-lg me-1' }), 'Tạo / quản lý đề trắc nghiệm'
          )
        ),

        // ── Tài liệu học phần ──
        matExpanded && h('div', { className: 'hw-section mt-3' },
          subMats.length === 0
            ? h('div', { className: 'text-center text-muted py-3 small' },
                h('i', { className: 'bi bi-folder-x d-block mb-1 opacity-25', style: { fontSize: '1.8rem' } }),
                'Chưa có tài liệu nào.'
              )
            : h('div', { className: 'mat-list' },
                subMats.map(m => {
                  const mt = MATERIAL_TYPES[m.type] || MATERIAL_TYPES.khac
                  return h('div', { key: m.id, className: 'mat-item' },
                    h('div', { className: 'd-flex align-items-start gap-2' },
                      h('div', { className: 'mat-type-icon flex-shrink-0', style: { backgroundColor: mt.color + '22', color: mt.color } },
                        h('i', { className: `bi bi-${mt.icon}` })
                      ),
                      h('div', { className: 'flex-grow-1 min-w-0' },
                        h('div', { className: 'd-flex align-items-center gap-2 flex-wrap' },
                          h('span', { className: 'fw-semibold small' }, m.title),
                          h('span', { className: 'badge rounded-pill', style: { backgroundColor: mt.color + '22', color: mt.color, fontSize: '0.65rem' } }, mt.label)
                        ),
                        m.description && h('div', { className: 'small text-muted mt-1' }, m.description),
                        h('div', { className: 'd-flex align-items-center gap-3 mt-1 flex-wrap' },
                          h('small', { className: 'text-muted' },
                            h('i', { className: 'bi bi-person me-1' }), m.uploadedBy
                          ),
                          h('small', { className: 'text-muted' },
                            h('i', { className: 'bi bi-calendar3 me-1' }),
                            new Date(m.uploadedAt).toLocaleDateString('vi-VN')
                          )
                        )
                      ),
                      h('div', { className: 'd-flex gap-1 flex-shrink-0 align-items-center' },
                        m.url && h('a', { href: m.url, target: '_blank', rel: 'noopener noreferrer',
                          className: 'btn btn-sm btn-primary hw-action-btn', title: 'Xem / Tải về',
                          onClick: () => onActivity && onActivity({ type: 'material', subjectId: subject.id, refId: m.id, refTitle: m.title }) },
                          h('i', { className: 'bi bi-download' })
                        ),
                        role !== 'student' && h('button', { className: 'btn btn-sm btn-outline-secondary hw-action-btn', title: 'Sửa',
                          onClick: () => { setEditMat(m); setMatModal('edit') } },
                          h('i', { className: 'bi bi-pencil' })
                        ),
                        role !== 'student' && h('button', { className: 'btn btn-sm btn-outline-danger hw-action-btn', title: 'Xóa',
                          onClick: () => setConfirmMatId(m.id) },
                          h('i', { className: 'bi bi-trash' })
                        )
                      )
                    )
                  )
                })
              ),
          role !== 'student' && h('button', { className: 'btn btn-sm btn-outline-info w-100 mt-2',
            onClick: () => { setEditMat(null); setMatModal('add') } },
            h('i', { className: 'bi bi-plus-lg me-1' }), 'Thêm tài liệu'
          )
        ),

        // ── Bài tập (danh sách duy nhất) ──
        expanded && h('div', { className: 'hw-section mt-3' },
          sortedHws.length === 0
            ? h('div', { className: 'text-center text-muted py-3 small' },
                h('i', { className: 'bi bi-journal-text d-block mb-1 opacity-25', style: { fontSize: '1.8rem' } }),
                'Chưa có bài tập nào'
              )
            : h('div', { className: 'hw-list' },
                sortedHws.map((hw) => {
                  const days = getDaysUntil(hw.dueDate)
                  const ov   = hw.status !== 'completed' && days < 0
                  const canSubmit = hw.allowSubmit !== false
                  return h('div', { key: hw.id, className: `hw-item${hw.status === 'completed' ? ' hw-done' : ''}${ov ? ' hw-overdue' : ''}` },
                    h('div', { className: 'd-flex align-items-start gap-2' },
                      h('div', { className: 'flex-grow-1 min-w-0' },
                        h('div', { className: `fw-semibold small${hw.status === 'completed' ? ' text-decoration-line-through text-muted' : ''}` }, hw.title),
                        h('div', { className: 'd-flex gap-2 flex-wrap mt-1' },
                          h('small', { className: ov ? 'text-danger' : hw.status === 'completed' ? 'text-success' : 'text-muted' },
                            h('i', { className: 'bi bi-calendar3 me-1' }),
                            new Date(hw.dueDate).toLocaleDateString('vi-VN'),
                            ov && h('span', { className: 'ms-1 fw-bold' }, `(Quá ${-days}N)`)
                          ),
                          canSubmit
                            ? h('small', { className: 'text-success' }, h('i', { className: 'bi bi-cloud-upload me-1' }), 'Có nộp bài')
                            : h('small', { className: 'text-muted' }, h('i', { className: 'bi bi-eye me-1' }), 'Chỉ xem'),
                          hw.fileUrl && h('small', { className: 'text-primary' }, h('i', { className: 'bi bi-paperclip me-1' }), 'File đề bài'),
                          hw.status === 'completed' && h('small', { className: 'text-success fw-semibold' }, h('i', { className: 'bi bi-check-circle me-1' }), canSubmit && hw.submission?.url ? 'Đã nộp bài' : 'Đã hoàn thành')
                        ),
                        hw.description && h('small', { className: 'text-muted d-block text-truncate' }, hw.description)
                      ),
                      h('div', { className: 'd-flex gap-1 flex-shrink-0' },
                        h('button', { className: 'btn btn-sm btn-outline-primary hw-action-btn', title: canSubmit ? 'Xem chi tiết / Nộp bài' : 'Xem chi tiết', onClick: () => setDetailHw(hw) }, h('i', { className: 'bi bi-eye' })),
                        role === 'student' && hw.status !== 'completed' && !canSubmit && h('button', { className: 'btn btn-sm btn-success hw-action-btn', title: 'Đánh dấu hoàn thành', onClick: () => markDone(hw) }, h('i', { className: 'bi bi-check' })),
                        role !== 'student' && h('button', { className: 'btn btn-sm btn-outline-secondary hw-action-btn', title: 'Sửa', onClick: () => { setEditHw(hw); setHwModal('edit') } }, h('i', { className: 'bi bi-pencil' })),
                        role !== 'student' && h('button', { className: 'btn btn-sm btn-outline-danger hw-action-btn', title: 'Xóa', onClick: () => setConfirmHw(hw.id) }, h('i', { className: 'bi bi-trash' }))
                      )
                    )
                  )
                })
              ),

          role !== 'student' && h('button', { className: 'btn btn-sm btn-outline-secondary w-100 mt-2', onClick: () => { setEditHw(null); setHwModal('add') } },
            h('i', { className: 'bi bi-plus-lg me-1' }), 'Giao bài tập mới'
          )
        )
      ),

      // Modal render qua Portal (vào body) để thoát khỏi thẻ có transform → không nhấp nháy
      (hwModal || detailHw || confirmHw || matModal || confirmMatId || taking) && h(Portal, null,
        hwModal && h(HomeworkModal, { subjectId: subject.id, item: hwModal === 'edit' ? editHw : null, onSave: handleHwSave, onClose: () => setHwModal(null) }),
        detailHw && h(HomeworkDetailModal, { hw: detailHw, role, onSubmit: onSubmitHomework, onUndo: onUndoHomework, onClose: () => setDetailHw(null) }),
        confirmHw && h(ConfirmModal, { message: 'Xóa bài tập này?', onConfirm: () => { setHomeworks(prev => prev.filter((hw) => hw.id !== confirmHw)); setConfirmHw(null) }, onClose: () => setConfirmHw(null) }),
        matModal && h(MaterialModal, { subjectId: subject.id, item: matModal === 'edit' ? editMat : null, user, onSave: handleMatSave, onClose: () => setMatModal(null) }),
        confirmMatId && h(ConfirmModal, { message: 'Xóa tài liệu này?', onConfirm: () => { setMaterials(prev => prev.filter(m => m.id !== confirmMatId)); setConfirmMatId(null) }, onClose: () => setConfirmMatId(null) }),
        taking && h(QuizTaker, { quiz: taking, subjectName: subject.name, onSubmit: handleSubmitQuiz, onClose: () => setTaking(null) })
      )
    )
  )
}

// ── Main Subjects Page ──
export default function Subjects({ subjects, setSubjects, deadlines, homeworks, setHomeworks, materials = [], setMaterials, role = 'student', subjectTeacherMap = {}, user, quizzes = [], submissions = [], setSubmissions, onNavigate, onActivity, onSubmitHomework, onUndoHomework }) {
  const [modal,     setModal]     = useState(null)
  const [editItem,  setEditItem]  = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [search,    setSearch]    = useState('')

  const filtered = subjects.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || (s.code || '').toLowerCase().includes(search.toLowerCase()))

  const handleSave = (form) => {
    const data = { ...form, credits: form.credits ? parseInt(form.credits) : null }
    if (modal === 'edit') setSubjects(subjects.map((s) => s.id === editItem.id ? { ...s, ...data } : s))
    else setSubjects([...subjects, { id: Date.now(), ...data }])
    setModal(null)
  }

  const totalCredits  = subjects.reduce((sum, s) => sum + (s.credits || 0), 0)
  const totalHws      = homeworks.length
  const doneHws       = homeworks.filter((hw) => hw.status === 'completed').length
  const totalMaterials = materials.length

  return (
    h('div', { className: 'container-fluid py-4' },
      // ── Header ──
      h('div', { className: 'd-flex flex-wrap justify-content-between align-items-center gap-3 mb-4' },
        h('div', null,
          h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-book me-2', style: { color: 'var(--primary)' } }), 'Quản lý Môn học'),
          h('div', { className: 'd-flex gap-3' },
            h('small', { className: 'text-muted' }, h('i', { className: 'bi bi-layers me-1' }), `${subjects.length} môn học`),
            totalCredits > 0 && h('small', { className: 'text-muted' }, h('i', { className: 'bi bi-award me-1' }), `${totalCredits} tín chỉ`),
            totalHws > 0 && h('small', { className: 'text-muted' }, h('i', { className: 'bi bi-journal-check me-1' }), `${doneHws}/${totalHws} bài tập`),
            totalMaterials > 0 && h('small', { className: 'text-muted' }, h('i', { className: 'bi bi-file-earmark-text me-1' }), `${totalMaterials} tài liệu`)
          )
        ),
        h('div', { className: 'd-flex gap-2' },
          h('div', { className: 'input-group input-group-sm', style: { width: 200 } },
            h('span', { className: 'input-group-text bg-light border-end-0 text-muted' }, h('i', { className: 'bi bi-search' })),
            h('input', { className: 'form-control border-start-0', placeholder: 'Tìm môn học...', value: search, onChange: (e) => setSearch(e.target.value) })
          ),
          role !== 'student' && h('button', { className: 'btn btn-primary btn-sm', onClick: () => { setEditItem(null); setModal('add') } },
            h('i', { className: 'bi bi-plus-lg me-1' }), 'Thêm môn học'
          )
        )
      ),

      filtered.length === 0
        ? h('div', { className: 'text-center text-muted py-5' },
            h('i', { className: 'bi bi-book fs-1 d-block mb-3 opacity-25' }),
            h('p', null, search ? 'Không tìm thấy môn học nào.' : h(window.React.Fragment, null, 'Chưa có môn học nào. Nhấn ', h('strong', null, 'Thêm môn học'), ' để bắt đầu!'))
          )
        : h('div', { className: 'row g-3' },
            filtered.map((s) =>
              h('div', { key: s.id, className: 'col-12 col-md-6 col-xl-4' },
                h(SubjectCard, { subject: s, deadlines, homeworks, setHomeworks, materials, setMaterials, role, user, quizzes, submissions, setSubmissions, onActivity, onSubmitHomework, onUndoHomework, onNavigateQuiz: onNavigate ? () => onNavigate('quiz') : null, assignedTeachers: subjectTeacherMap[s.id] || [], onEdit: () => { setEditItem(s); setModal('edit') }, onDelete: () => setConfirmId(s.id) })
              )
            )
          ),

      (modal || confirmId) && h(Portal, null,
        modal && h(SubjectModal, { item: modal === 'edit' ? editItem : null, onSave: handleSave, onClose: () => setModal(null) }),
        confirmId && h(ConfirmModal, {
          message: 'Xóa môn học này? Toàn bộ bài tập liên quan cũng bị xóa.',
          onConfirm: () => { setSubjects(subjects.filter((s) => s.id !== confirmId)); setHomeworks(prev => prev.filter((hw) => hw.subjectId !== confirmId)); setConfirmId(null) },
          onClose: () => setConfirmId(null),
        })
      )
    )
  )
}
