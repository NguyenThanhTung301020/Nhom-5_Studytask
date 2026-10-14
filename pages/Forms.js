// pages/Forms.js – Biểu mẫu / văn bản chung của nhà trường
import { FORM_CATEGORIES } from '../utils/constants.js'
import ConfirmModal from '../components/ConfirmModal.js'
import ActionMenu from '../components/ActionMenu.js'
import Portal from '../components/Portal.js'

const { useState, createElement: h } = window.React
const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

function FormModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item
    ? { ...item }
    : { title: '', category: 'donTu', description: '', url: '', uploadedBy: 'Nhà trường' })
  const valid = form.title.trim()
  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
    h('div', { className: 'modal-dialog modal-dialog-centered' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' },
          h('h5', { className: 'modal-title fw-bold' }, h('i', { className: 'bi bi-file-earmark-ruled me-2', style: { color: 'var(--primary)' } }), item ? 'Sửa biểu mẫu' : 'Thêm biểu mẫu'),
          h('button', { className: 'btn-close', onClick: onClose })
        ),
        h('div', { className: 'modal-body' },
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, 'Tên biểu mẫu ', h('span', { className: 'text-danger' }, '*')),
            h('input', { className: 'form-control', placeholder: 'VD: Đơn xin nghỉ học tạm thời', value: form.title, autoFocus: true, onChange: e => setForm({ ...form, title: e.target.value }) })
          ),
          h('div', { className: 'row g-3 mb-3' },
            h('div', { className: 'col-md-6' },
              h('label', { className: 'form-label fw-semibold' }, 'Loại'),
              h('select', { className: 'form-select', value: form.category, onChange: e => setForm({ ...form, category: e.target.value }) },
                Object.entries(FORM_CATEGORIES).map(([k, v]) => h('option', { key: k, value: k }, v.label))
              )
            ),
            h('div', { className: 'col-md-6' },
              h('label', { className: 'form-label fw-semibold' }, 'Đơn vị ban hành'),
              h('input', { className: 'form-control', placeholder: 'VD: Phòng Đào tạo', value: form.uploadedBy, onChange: e => setForm({ ...form, uploadedBy: e.target.value }) })
            )
          ),
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, 'Mô tả'),
            h('textarea', { className: 'form-control', rows: 2, placeholder: 'Mô tả ngắn về biểu mẫu, cách dùng...', value: form.description, onChange: e => setForm({ ...form, description: e.target.value }) })
          ),
          h('div', null,
            h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-link-45deg me-1' }), 'Link tải biểu mẫu'),
            h('input', { className: 'form-control', placeholder: 'Dán link Google Drive / file văn bản...', value: form.url, onChange: e => setForm({ ...form, url: e.target.value }) })
          )
        ),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
          h('button', { className: 'btn btn-primary', disabled: !valid, onClick: () => valid && onSave({ ...form, date: item?.date || new Date().toISOString().split('T')[0] }) }, item ? 'Lưu' : 'Thêm')
        )
      )
    )
  )
}

export default function Forms({ forms = [], setForms, role = 'student' }) {
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')
  const [modal,   setModal]   = useState(null)
  const [editItem,setEditItem]= useState(null)
  const [confirm, setConfirm] = useState(null)
  const canManage = role === 'admin' || role === 'teacher'

  const handleSave = (form) => {
    if (modal === 'edit') setForms(prev => prev.map(f => f.id === editItem.id ? { ...f, ...form } : f))
    else setForms(prev => [{ id: Date.now(), ...form }, ...prev])
    setModal(null)
  }

  const filtered = forms
    .filter(f => filter === 'all' || f.category === filter)
    .filter(f => !search || f.title.toLowerCase().includes(search.toLowerCase()) || (f.description || '').toLowerCase().includes(search.toLowerCase()))

  const cats = [{ key: 'all', label: 'Tất cả', icon: 'grid-3x3-gap' },
    ...Object.entries(FORM_CATEGORIES).map(([k, v]) => ({ key: k, label: v.label, icon: v.icon }))]

  return h('div', { className: 'container-fluid py-4' },
    h('div', { className: 'd-flex flex-wrap justify-content-between align-items-center gap-3 mb-4' },
      h('div', null,
        h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-file-earmark-ruled me-2', style: { color: 'var(--primary)' } }), 'Biểu mẫu chung'),
        h('small', { className: 'text-muted' }, `${forms.length} biểu mẫu, văn bản của nhà trường`)
      ),
      h('div', { className: 'd-flex gap-2' },
        h('div', { className: 'input-group input-group-sm', style: { width: 200 } },
          h('span', { className: 'input-group-text bg-light border-end-0 text-muted' }, h('i', { className: 'bi bi-search' })),
          h('input', { className: 'form-control border-start-0', placeholder: 'Tìm biểu mẫu...', value: search, onChange: e => setSearch(e.target.value) })
        ),
        canManage && h('button', { className: 'btn btn-primary btn-sm', onClick: () => { setEditItem(null); setModal('add') } },
          h('i', { className: 'bi bi-plus-lg me-1' }), 'Thêm')
      )
    ),

    h('div', { className: 'lib-tabs mb-4' },
      cats.map(c => h('button', { key: c.key, className: `lib-tab ${filter === c.key ? 'active' : ''}`, onClick: () => setFilter(c.key) },
        h('i', { className: `bi bi-${c.icon} me-1` }), c.label))
    ),

    filtered.length === 0
      ? h('div', { className: 'text-center text-muted py-5' }, h('i', { className: 'bi bi-file-earmark-x fs-1 d-block mb-2 opacity-25' }), h('p', null, 'Chưa có biểu mẫu nào.'))
      : h('div', { className: 'row g-3' },
          filtered.map(f => {
            const cat = FORM_CATEGORIES[f.category] || FORM_CATEGORIES.khac
            return h('div', { key: f.id, className: 'col-12 col-md-6 col-xl-4' },
              h('div', { className: 'card border-0 shadow-sm h-100' },
                h('div', { className: 'card-body d-flex flex-column' },
                  h('div', { className: 'd-flex align-items-start justify-content-between gap-2 mb-2' },
                    h('div', { className: 'form-file-icon', style: { backgroundColor: cat.color + '22', color: cat.color } }, h('i', { className: `bi bi-${cat.icon}` })),
                    canManage && h(ActionMenu, { icon: 'three-dots', btnClass: 'btn btn-sm btn-light rounded-circle border-0', items: [
                      { label: 'Sửa', icon: 'pencil', iconClass: 'text-primary', onClick: () => { setEditItem(f); setModal('edit') } },
                      { divider: true },
                      { label: 'Xóa', icon: 'trash', danger: true, onClick: () => setConfirm(f.id) },
                    ] })
                  ),
                  h('div', { className: 'fw-bold mb-1' }, f.title),
                  h('span', { className: 'badge mb-2 align-self-start', style: { backgroundColor: cat.color + '22', color: cat.color } }, cat.label),
                  f.description && h('p', { className: 'text-muted small flex-grow-1 mb-2' }, f.description),
                  h('div', { className: 'small text-muted mb-3' }, h('i', { className: 'bi bi-building me-1' }), f.uploadedBy || 'Nhà trường', ' · ', fmtDate(f.date)),
                  f.url
                    ? h('a', { href: f.url, target: '_blank', rel: 'noopener noreferrer', className: 'btn btn-outline-primary btn-sm mt-auto' }, h('i', { className: 'bi bi-download me-1' }), 'Tải biểu mẫu')
                    : h('span', { className: 'btn btn-outline-secondary btn-sm mt-auto disabled' }, 'Chưa có file')
                )
              )
            )
          })
        ),

    (modal || confirm) && h(Portal, null,
      modal && h(FormModal, { item: modal === 'edit' ? editItem : null, onSave: handleSave, onClose: () => setModal(null) }),
      confirm && h(ConfirmModal, { message: 'Xóa biểu mẫu này?', onConfirm: () => { setForms(prev => prev.filter(f => f.id !== confirm)); setConfirm(null) }, onClose: () => setConfirm(null) })
    )
  )
}
