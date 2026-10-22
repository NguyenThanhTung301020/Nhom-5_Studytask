// pages/Theses.js – Trang công bố khóa luận tốt nghiệp
//   Mọi người: tra cứu khóa luận đã công bố (tìm kiếm, lọc theo năm / ngành), xem tóm tắt, mở toàn văn
//   Phòng Đào tạo / Admin: công bố, sửa, gỡ khóa luận (theses/{id})
import { setDocument, listDocuments, deleteDocument, errorText } from '../utils/store.js'
import ConfirmModal from '../components/ConfirmModal.js'

const { useState, useEffect, createElement: h } = window.React
const EMPTY = { title: '', studentName: '', studentId: '', advisor: '', major: '', year: new Date().getFullYear(), defenseDate: '',
                council: '', score: '', abstract: '', keywords: '', fileUrl: '' }

function ThesisModal({ item, onSave, onClose }) {
  const [f, setF] = useState(item ? { ...EMPTY, ...item, keywords: (item.keywords || []).join(', ') } : EMPTY)
  const urlOk = !f.fileUrl || /^https?:\/\//i.test(f.fileUrl)
  const scoreOk = f.score === '' || (Number(f.score) >= 0 && Number(f.score) <= 10)
  const valid = f.title.trim() && f.studentName.trim() && f.advisor.trim() && Number(f.year) > 2000 && urlOk && scoreOk
  const inp = (k, label, col = 'col-12 col-md-6', props = {}) => h('div', { className: col },
    h('label', { className: 'form-label small fw-semibold' }, label),
    h('input', { className: 'form-control form-control-sm', value: f[k], onChange: e => setF({ ...f, [k]: e.target.value }), ...props }))
  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
    h('div', { className: 'modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' }, h('h5', { className: 'modal-title fw-bold' }, item ? 'Sửa khóa luận' : 'Công bố khóa luận'), h('button', { className: 'btn-close', onClick: onClose })),
        h('div', { className: 'modal-body' }, h('div', { className: 'row g-3' },
          inp('title', 'Tên khóa luận *', 'col-12'),
          inp('studentName', 'Sinh viên thực hiện *'), inp('studentId', 'MSSV', 'col-6 col-md-3'), inp('year', 'Năm *', 'col-6 col-md-3', { type: 'number' }),
          inp('advisor', 'Giảng viên hướng dẫn *'), inp('major', 'Ngành'),
          inp('defenseDate', 'Ngày bảo vệ', 'col-6 col-md-4', { type: 'date' }), inp('score', 'Điểm bảo vệ (tùy chọn)', 'col-6 col-md-4', { type: 'number', min: 0, max: 10, step: 0.1 }),
          inp('council', 'Hội đồng', 'col-12 col-md-4'),
          h('div', { className: 'col-12' }, h('label', { className: 'form-label small fw-semibold' }, 'Tóm tắt'),
            h('textarea', { className: 'form-control form-control-sm', rows: 4, value: f.abstract, onChange: e => setF({ ...f, abstract: e.target.value }) })),
          inp('keywords', 'Từ khóa (cách nhau dấu phẩy)'), inp('fileUrl', 'Link toàn văn (PDF)', 'col-12 col-md-6', { type: 'url', placeholder: 'https://…' })
        ),
          !urlOk && h('div', { className: 'small text-danger mt-2' }, 'Link phải bắt đầu bằng http:// hoặc https://'),
          !scoreOk && h('div', { className: 'small text-danger mt-2' }, 'Điểm phải từ 0 đến 10.')),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
          h('button', { className: 'btn btn-primary', disabled: !valid, onClick: () => onSave({
            ...f, title: f.title.trim(), year: Number(f.year), score: f.score === '' ? null : Number(f.score),
            keywords: f.keywords.split(',').map(s => s.trim()).filter(Boolean) }) }, 'Lưu'))
      )
    )
  )
}

export default function Theses({ user }) {
  const canEdit = user.role === 'training' || user.role === 'admin'
  const [items, setItems]   = useState(null)
  const [q, setQ]           = useState('')
  const [year, setYear]     = useState('')
  const [major, setMajor]   = useState('')
  const [view, setView]     = useState(null)
  const [modal, setModal]   = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [msg, setMsg]       = useState(null)

  const load = async () => { try { setItems(await listDocuments('theses')) } catch (e) { setMsg(errorText(e)); setItems([]) } }
  useEffect(() => { load() }, [])

  const save = async (data) => {
    const { id, ...rest } = data
    try {
      await setDocument('theses', modal.item?.id || `t${Date.now()}`, { ...rest, publishedBy: user.name || user.email || '', publishedAt: modal.item?.publishedAt || new Date().toISOString() }, false)
      setModal(null); load()
    } catch (e) { setMsg(errorText(e)) }
  }
  const remove = async (t) => { try { await deleteDocument('theses', t.id); setView(null); load() } catch (e) { setMsg(errorText(e)) } }

  if (!items) return h('div', { className: 'text-center py-5' }, h('div', { className: 'spinner-border text-primary' }))
  const years  = [...new Set(items.map(t => t.year))].sort((a, b) => b - a)
  const majors = [...new Set(items.map(t => t.major).filter(Boolean))].sort()
  const ql = q.trim().toLowerCase()
  const shown = items
    .filter(t => (!year || String(t.year) === year) && (!major || t.major === major) &&
      (!ql || [t.title, t.studentName, t.studentId, t.advisor, ...(t.keywords || [])].join(' ').toLowerCase().includes(ql)))
    .sort((a, b) => (b.year - a.year) || (b.defenseDate || '').localeCompare(a.defenseDate || ''))

  return h('div', { className: 'container-fluid py-4' },
    h('div', { className: 'd-flex flex-wrap justify-content-between align-items-center gap-2 mb-3' },
      h('div', null,
        h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-journal-richtext me-2', style: { color: '#6f42c1' } }), 'Công bố khóa luận tốt nghiệp'),
        h('small', { className: 'text-muted' }, `${items.length} khóa luận đã công bố`)),
      canEdit && h('button', { className: 'btn btn-primary btn-sm', onClick: () => setModal({ item: null }) }, h('i', { className: 'bi bi-plus-lg me-1' }), 'Công bố khóa luận')),
    msg && h('div', { className: 'alert alert-danger small py-2' }, msg),

    h('div', { className: 'card border-0 shadow-sm mb-3' }, h('div', { className: 'card-body py-2 d-flex flex-wrap gap-2' },
      h('div', { className: 'input-group input-group-sm', style: { maxWidth: 360 } },
        h('span', { className: 'input-group-text' }, h('i', { className: 'bi bi-search' })),
        h('input', { className: 'form-control', placeholder: 'Tên đề tài, sinh viên, GVHD, từ khóa…', value: q, onChange: e => setQ(e.target.value) })),
      h('select', { className: 'form-select form-select-sm', style: { width: 'auto' }, value: year, onChange: e => setYear(e.target.value) },
        h('option', { value: '' }, 'Mọi năm'), years.map(y => h('option', { key: y, value: y }, y))),
      h('select', { className: 'form-select form-select-sm', style: { width: 'auto' }, value: major, onChange: e => setMajor(e.target.value) },
        h('option', { value: '' }, 'Mọi ngành'), majors.map(m => h('option', { key: m, value: m }, m))))),

    shown.length === 0
      ? h('div', { className: 'text-center text-muted py-5' }, h('i', { className: 'bi bi-journal-x fs-1 d-block mb-2 opacity-25' }), items.length ? 'Không tìm thấy khóa luận phù hợp.' : 'Chưa có khóa luận nào được công bố.')
      : h('div', { className: 'row g-3' }, shown.map(t => h('div', { key: t.id, className: 'col-12 col-md-6 col-xl-4' },
          h('div', { className: 'card border-0 shadow-sm h-100 thesis-card', role: 'button', tabIndex: 0, onClick: () => setView(t), onKeyDown: e => e.key === 'Enter' && setView(t) },
            h('div', { className: 'card-body d-flex flex-column' },
              h('div', { className: 'd-flex justify-content-between small text-muted mb-1' }, h('span', null, t.major || 'Khóa luận'), h('span', { className: 'badge bg-light text-dark border' }, t.year)),
              h('div', { className: 'fw-bold mb-2 thesis-title' }, t.title),
              h('div', { className: 'small' }, h('i', { className: 'bi bi-person me-1 text-muted' }), t.studentName, t.studentId && ` (${t.studentId})`),
              h('div', { className: 'small' }, h('i', { className: 'bi bi-person-workspace me-1 text-muted' }), 'GVHD: ', t.advisor),
              t.abstract && h('div', { className: 'small text-muted mt-2 thesis-abstract' }, t.abstract),
              h('div', { className: 'mt-auto pt-2 d-flex flex-wrap gap-1' }, (t.keywords || []).slice(0, 4).map(k => h('span', { key: k, className: 'badge bg-primary-subtle text-primary' }, k))))
          )))),

    view && h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' }, onClick: () => setView(null) },
      h('div', { className: 'modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable', onClick: e => e.stopPropagation() },
        h('div', { className: 'modal-content' },
          h('div', { className: 'modal-header' }, h('h5', { className: 'modal-title fw-bold' }, view.title), h('button', { className: 'btn-close', onClick: () => setView(null) })),
          h('div', { className: 'modal-body' },
            h('div', { className: 'row g-2 small mb-3' }, [
              ['Sinh viên', `${view.studentName}${view.studentId ? ' – ' + view.studentId : ''}`], ['GVHD', view.advisor], ['Ngành', view.major],
              ['Năm', view.year], ['Ngày bảo vệ', view.defenseDate ? view.defenseDate.split('-').reverse().join('/') : ''], ['Hội đồng', view.council],
              ['Điểm', view.score != null ? view.score : ''],
            ].filter(([, v]) => v !== '' && v != null).map(([k, v]) => h('div', { key: k, className: 'col-12 col-md-6' }, h('span', { className: 'text-muted' }, k + ': '), h('strong', null, v)))),
            view.abstract && h('div', null, h('div', { className: 'fw-semibold mb-1' }, 'Tóm tắt'), h('p', { className: 'small', style: { whiteSpace: 'pre-line' } }, view.abstract)),
            (view.keywords || []).length > 0 && h('div', { className: 'd-flex flex-wrap gap-1' }, view.keywords.map(k => h('span', { key: k, className: 'badge bg-primary-subtle text-primary' }, k)))),
          h('div', { className: 'modal-footer' },
            canEdit && h('button', { className: 'btn btn-outline-danger me-auto', onClick: () => setConfirm(view) }, h('i', { className: 'bi bi-trash me-1' }), 'Gỡ'),
            canEdit && h('button', { className: 'btn btn-outline-secondary', onClick: () => { setModal({ item: view }); setView(null) } }, h('i', { className: 'bi bi-pencil me-1' }), 'Sửa'),
            view.fileUrl && h('a', { className: 'btn btn-primary', href: view.fileUrl, target: '_blank', rel: 'noopener noreferrer' }, h('i', { className: 'bi bi-file-earmark-pdf me-1' }), 'Xem toàn văn'))
        ))),

    modal && h(ThesisModal, { item: modal.item, onSave: save, onClose: () => setModal(null) }),
    confirm && h(ConfirmModal, { message: `Gỡ khóa luận "${confirm.title}" khỏi trang công bố?`, confirmLabel: 'Gỡ', onConfirm: () => { remove(confirm); setConfirm(null) }, onClose: () => setConfirm(null) })
  )
}
