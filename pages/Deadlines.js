// pages/Deadlines.js – Quản lý Deadline
import { PRIORITY_LABEL, STATUS_LABEL, PRIORITY_CLASS, STATUS_CLASS } from '../utils/constants.js'
import { isOverdue, getDaysUntil } from '../utils/helpers.js'
import ConfirmModal from '../components/ConfirmModal.js'

const { useState, useEffect, createElement: h } = window.React

function DeadlineModal({ item, subjects, onSave, onClose }) {
  const [form, setForm] = useState(
    item ? { ...item, subjectId: String(item.subjectId) }
         : { title: '', subjectId: subjects[0] ? String(subjects[0].id) : '', dueDate: '', priority: 'medium', status: 'pending', description: '' }
  )
  const valid = form.title.trim() && form.dueDate && form.subjectId
  return (
    h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
      h('div', { className: 'modal-dialog modal-dialog-centered modal-dialog-scrollable' },
        h('div', { className: 'modal-content' },
          h('div', { className: 'modal-header' },
            h('h5', { className: 'modal-title fw-bold' }, item ? 'Sửa deadline' : 'Thêm deadline mới'),
            h('button', { className: 'btn-close', onClick: onClose })
          ),
          h('div', { className: 'modal-body' },
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, 'Tên deadline ', h('span', { className: 'text-danger' }, '*')),
              h('input', { className: 'form-control', placeholder: 'VD: Bài tập Chương 3', value: form.title, autoFocus: true, onChange: (e) => setForm({ ...form, title: e.target.value }) })
            ),
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, 'Môn học ', h('span', { className: 'text-danger' }, '*')),
              h('select', { className: 'form-select', value: form.subjectId, onChange: (e) => setForm({ ...form, subjectId: e.target.value }) },
                h('option', { value: '' }, '— Chọn môn học —'),
                subjects.map((s) => h('option', { key: s.id, value: String(s.id) }, s.name))
              )
            ),
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, 'Ngày hết hạn ', h('span', { className: 'text-danger' }, '*')),
              h('input', { type: 'date', className: 'form-control', value: form.dueDate, onChange: (e) => setForm({ ...form, dueDate: e.target.value }) })
            ),
            h('div', { className: 'row g-3 mb-3' },
              h('div', { className: 'col-6' },
                h('label', { className: 'form-label fw-semibold' }, 'Mức ưu tiên'),
                h('select', { className: 'form-select', value: form.priority, onChange: (e) => setForm({ ...form, priority: e.target.value }) },
                  h('option', { value: 'low' }, 'Thấp'), h('option', { value: 'medium' }, 'Trung bình'), h('option', { value: 'high' }, 'Cao')
                )
              ),
              h('div', { className: 'col-6' },
                h('label', { className: 'form-label fw-semibold' }, 'Trạng thái'),
                h('select', { className: 'form-select', value: form.status, onChange: (e) => setForm({ ...form, status: e.target.value }) },
                  h('option', { value: 'pending' }, 'Chưa làm'), h('option', { value: 'in_progress' }, 'Đang làm'), h('option', { value: 'completed' }, 'Hoàn thành')
                )
              )
            ),
            h('div', { className: 'mb-1' },
              h('label', { className: 'form-label fw-semibold' }, 'Ghi chú'),
              h('textarea', { className: 'form-control', rows: 3, placeholder: 'Thêm ghi chú...', value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }) })
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
            h('button', { className: 'btn btn-primary', disabled: !valid, onClick: () => valid && onSave({ ...form, subjectId: Number(form.subjectId) }) },
              item ? 'Lưu thay đổi' : 'Thêm deadline'
            )
          )
        )
      )
    )
  )
}

export default function Deadlines({ subjects, deadlines, setDeadlines, filterPreset = {}, role = 'student' }) {
  const [modal,     setModal]     = useState(null)
  const [editItem,  setEditItem]  = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [search,    setSearch]    = useState('')
  const [fSubject,  setFSubject]  = useState('')
  const [fStatus,   setFStatus]   = useState(filterPreset.status || '')
  const [fPriority, setFPriority] = useState('')
  const [fOverdue,  setFOverdue]  = useState(filterPreset.overdue || false)
  const [sortBy,    setSortBy]    = useState('dueDate')

  useEffect(() => {
    setFStatus(filterPreset.status || '')
    setFOverdue(filterPreset.overdue || false)
    setSearch(''); setFSubject(''); setFPriority('')
  }, [JSON.stringify(filterPreset)])

  const handleSave = (form) => {
    if (modal === 'edit') setDeadlines(deadlines.map((d) => d.id === editItem.id ? { ...d, ...form } : d))
    else setDeadlines([...deadlines, { id: Date.now(), ...form }])
    setModal(null)
  }
  const markDone     = (id) => setDeadlines(deadlines.map((d) => d.id === id ? { ...d, status: 'completed' } : d))
  const subjectName  = (id) => (subjects.find((s) => s.id === id) || {}).name  || '—'
  const subjectColor = (id) => (subjects.find((s) => s.id === id) || {}).color || '#ccc'

  const hasFilter  = search || fSubject || fStatus || fPriority || fOverdue
  const clearAll   = () => { setSearch(''); setFSubject(''); setFStatus(''); setFPriority(''); setFOverdue(false) }

  const SORT_FNS = {
    dueDate:  (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
    priority: (a, b) => { const O = { high: 0, medium: 1, low: 2 }; return O[a.priority] - O[b.priority] },
    subject:  (a, b) => subjectName(a.subjectId).localeCompare(subjectName(b.subjectId)),
  }

  const filtered = deadlines
    .filter((d) => {
      if (search    && !d.title.toLowerCase().includes(search.toLowerCase())) return false
      if (fSubject  && d.subjectId !== Number(fSubject)) return false
      if (fStatus   && d.status !== fStatus) return false
      if (fPriority && d.priority !== fPriority) return false
      if (fOverdue  && !isOverdue(d)) return false
      return true
    })
    .sort(SORT_FNS[sortBy] || SORT_FNS.dueDate)

  const CHIPS = [
    { label: 'Tất cả',      active: !hasFilter,                         color: 'primary',   onClick: clearAll },
    { label: 'Quá hạn',     active: !!fOverdue,                         color: 'danger',    onClick: () => { clearAll(); setFOverdue(true) } },
    { label: 'Chưa làm',    active: fStatus === 'pending' && !fOverdue,  color: 'secondary', onClick: () => { clearAll(); setFStatus('pending') } },
    { label: 'Đang làm',    active: fStatus === 'in_progress',           color: 'primary',   onClick: () => { clearAll(); setFStatus('in_progress') } },
    { label: 'Hoàn thành',  active: fStatus === 'completed',             color: 'success',   onClick: () => { clearAll(); setFStatus('completed') } },
    { label: 'Ưu tiên cao', active: fPriority === 'high',                color: 'danger',    onClick: () => { clearAll(); setFPriority('high') } },
  ]

  // Thống kê nhanh
  const stats = {
    total:     deadlines.length,
    pending:   deadlines.filter((d) => d.status === 'pending').length,
    progress:  deadlines.filter((d) => d.status === 'in_progress').length,
    done:      deadlines.filter((d) => d.status === 'completed').length,
    overdue:   deadlines.filter(isOverdue).length,
  }

  return (
    h('div', { className: 'container-fluid py-4' },
      // ── Header ──
      h('div', { className: 'd-flex flex-wrap justify-content-between align-items-start gap-3 mb-3' },
        h('div', null,
          h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-clock me-2', style: { color: 'var(--primary)' } }), 'Quản lý Deadline'),
          h('div', { className: 'd-flex gap-3 flex-wrap' },
            h('small', { className: 'text-muted' }, h('i', { className: 'bi bi-list-task me-1' }), `${stats.total} tổng cộng`),
            h('small', { className: 'text-success' }, h('i', { className: 'bi bi-check-circle me-1' }), `${stats.done} xong`),
            stats.overdue > 0 && h('small', { className: 'text-danger fw-semibold' }, h('i', { className: 'bi bi-exclamation-triangle me-1' }), `${stats.overdue} quá hạn`)
          )
        ),
        role !== 'student' && h('button', { className: 'btn btn-primary btn-sm', onClick: () => { setEditItem(null); setModal('add') } },
          h('i', { className: 'bi bi-plus-lg me-1' }), 'Thêm deadline'
        )
      ),

      // ── Quick chips ──
      h('div', { className: 'quick-chips mb-3' },
        CHIPS.map((c) =>
          h('button', { key: c.label, className: `quick-chip ${c.active ? `qc-${c.color}` : ''}`, onClick: c.onClick }, c.label)
        )
      ),

      // ── Filter bar ──
      h('div', { className: 'card border-0 shadow-sm mb-3' },
        h('div', { className: 'card-body py-3' },
          h('div', { className: 'row g-2 align-items-center' },
            h('div', { className: 'col-12 col-md-4' },
              h('div', { className: 'input-group' },
                h('span', { className: 'input-group-text bg-light border-end-0 text-muted' }, h('i', { className: 'bi bi-search' })),
                h('input', { className: 'form-control border-start-0', placeholder: 'Tìm tên deadline...', value: search, onChange: (e) => setSearch(e.target.value) })
              )
            ),
            h('div', { className: 'col-6 col-md-2' },
              h('select', { className: 'form-select', value: fSubject, onChange: (e) => setFSubject(e.target.value) },
                h('option', { value: '' }, 'Tất cả môn'),
                subjects.map((s) => h('option', { key: s.id, value: s.id }, s.name))
              )
            ),
            h('div', { className: 'col-6 col-md-2' },
              h('select', { className: 'form-select', value: fStatus, onChange: (e) => setFStatus(e.target.value) },
                h('option', { value: '' }, 'Tất cả trạng thái'),
                h('option', { value: 'pending' }, 'Chưa làm'),
                h('option', { value: 'in_progress' }, 'Đang làm'),
                h('option', { value: 'completed' }, 'Hoàn thành')
              )
            ),
            h('div', { className: 'col-6 col-md-2' },
              h('select', { className: 'form-select', value: fPriority, onChange: (e) => setFPriority(e.target.value) },
                h('option', { value: '' }, 'Tất cả ưu tiên'),
                h('option', { value: 'high' }, 'Cao'),
                h('option', { value: 'medium' }, 'Trung bình'),
                h('option', { value: 'low' }, 'Thấp')
              )
            ),
            h('div', { className: 'col-6 col-md-2' },
              h('select', { className: 'form-select', value: sortBy, onChange: (e) => setSortBy(e.target.value) },
                h('option', { value: 'dueDate' },  'Sắp xếp: Ngày'),
                h('option', { value: 'priority' }, 'Sắp xếp: Ưu tiên'),
                h('option', { value: 'subject' },  'Sắp xếp: Môn học')
              )
            )
          ),
          hasFilter && h('div', { className: 'mt-2' },
            h('button', { className: 'btn btn-sm btn-warning', onClick: clearAll },
              h('i', { className: 'bi bi-x-circle me-1' }), 'Xóa tất cả bộ lọc'
            )
          )
        )
      ),

      h('p', { className: 'text-muted small mb-3' },
        'Hiển thị ', h('strong', null, filtered.length), ` / ${deadlines.length} deadline`,
        hasFilter && h('span', { className: 'badge bg-warning text-dark ms-2' }, 'Đang lọc')
      ),

      filtered.length === 0
        ? h('div', { className: 'text-center text-muted py-5' },
            h('i', { className: 'bi bi-search fs-1 d-block mb-3 opacity-25' }),
            h('p', { className: 'mb-0' }, 'Không tìm thấy deadline nào phù hợp.'),
            hasFilter && h('button', { className: 'btn btn-link btn-sm mt-2', onClick: clearAll }, 'Xóa bộ lọc')
          )
        : filtered.map((d) => {
            const overdue  = isOverdue(d)
            const days     = getDaysUntil(d.dueDate)
            const daysText = d.status === 'completed' ? null
              : days < 0 ? `Quá ${-days} ngày` : days === 0 ? 'Hôm nay!' : days === 1 ? 'Ngày mai' : `Còn ${days} ngày`
            const daysCls  = days < 0 ? 'text-danger fw-bold' : days <= 2 ? 'text-warning fw-semibold' : 'text-muted'

            return h('div', { key: d.id, className: `deadline-item card border-0 shadow-sm mb-3${overdue ? ' border-start border-danger border-3' : ''}` },
              h('div', { className: 'card-body' },
                h('div', { className: 'd-flex align-items-start gap-3' },
                  h('div', { className: 'subject-dot flex-shrink-0', style: { backgroundColor: subjectColor(d.subjectId) } }),
                  h('div', { className: 'flex-grow-1' },
                    h('div', { className: 'd-flex flex-wrap align-items-center gap-2 mb-1' },
                      h('span', { className: `fw-bold${d.status === 'completed' ? ' text-decoration-line-through text-muted' : ''}` }, d.title),
                      overdue && h('span', { className: 'badge bg-danger' }, 'Quá hạn')
                    ),
                    h('div', { className: 'd-flex flex-wrap gap-3' },
                      h('small', { className: 'text-muted' }, h('i', { className: 'bi bi-book me-1' }), subjectName(d.subjectId)),
                      h('small', { className: d.status !== 'completed' ? daysCls : 'text-muted' },
                        h('i', { className: 'bi bi-calendar3 me-1' }),
                        new Date(d.dueDate).toLocaleDateString('vi-VN'),
                        daysText && h('span', { className: 'ms-1' }, `(${daysText})`)
                      )
                    ),
                    d.description && h('p', { className: 'text-muted small mb-0 mt-1' }, d.description)
                  ),
                  h('div', { className: 'flex-shrink-0 text-end' },
                    h('div', { className: 'd-flex gap-1 mb-2 justify-content-end' },
                      h('span', { className: `badge bg-${PRIORITY_CLASS[d.priority]}` }, PRIORITY_LABEL[d.priority]),
                      h('span', { className: `badge bg-${STATUS_CLASS[d.status]}` }, STATUS_LABEL[d.status])
                    ),
                    h('div', { className: 'd-flex gap-1 justify-content-end' },
                      d.status !== 'completed' && h('button', { className: 'btn btn-sm btn-success', title: 'Hoàn thành', onClick: () => markDone(d.id) }, h('i', { className: 'bi bi-check-lg' })),
                      role !== 'student' && h('button', { className: 'btn btn-sm btn-outline-primary', title: 'Sửa', onClick: () => { setEditItem(d); setModal('edit') } }, h('i', { className: 'bi bi-pencil' })),
                      role !== 'student' && h('button', { className: 'btn btn-sm btn-outline-danger', title: 'Xóa', onClick: () => setConfirmId(d.id) }, h('i', { className: 'bi bi-trash' }))
                    )
                  )
                )
              )
            )
          }),

      modal     && h(DeadlineModal, { item: modal === 'edit' ? editItem : null, subjects, onSave: handleSave, onClose: () => setModal(null) }),
      confirmId && h(ConfirmModal, {
        message: 'Bạn có chắc muốn xóa deadline này?',
        onConfirm: () => { setDeadlines(deadlines.filter((d) => d.id !== confirmId)); setConfirmId(null) },
        onClose: () => setConfirmId(null),
      })
    )
  )
}
