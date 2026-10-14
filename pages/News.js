// pages/News.js – Tin tức / Thông báo nhà trường
import { NEWS_CATEGORIES } from '../utils/constants.js'
import ConfirmModal from '../components/ConfirmModal.js'
import ActionMenu from '../components/ActionMenu.js'
import Portal from '../components/Portal.js'

const { useState, createElement: h } = window.React
const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

function NewsModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item
    ? { pinned: false, ...item }
    : { title: '', category: 'thongBao', content: '', author: 'Nhà trường', pinned: false })
  const valid = form.title.trim() && form.content.trim()
  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
    h('div', { className: 'modal-dialog modal-dialog-centered modal-dialog-scrollable' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' },
          h('h5', { className: 'modal-title fw-bold' }, h('i', { className: 'bi bi-newspaper me-2', style: { color: 'var(--primary)' } }), item ? 'Sửa tin' : 'Đăng tin mới'),
          h('button', { className: 'btn-close', onClick: onClose })
        ),
        h('div', { className: 'modal-body' },
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, 'Tiêu đề ', h('span', { className: 'text-danger' }, '*')),
            h('input', { className: 'form-control', value: form.title, autoFocus: true, onChange: e => setForm({ ...form, title: e.target.value }) })
          ),
          h('div', { className: 'row g-3 mb-3' },
            h('div', { className: 'col-md-6' },
              h('label', { className: 'form-label fw-semibold' }, 'Chuyên mục'),
              h('select', { className: 'form-select', value: form.category, onChange: e => setForm({ ...form, category: e.target.value }) },
                Object.entries(NEWS_CATEGORIES).map(([k, v]) => h('option', { key: k, value: k }, v.label))
              )
            ),
            h('div', { className: 'col-md-6' },
              h('label', { className: 'form-label fw-semibold' }, 'Đơn vị đăng'),
              h('input', { className: 'form-control', placeholder: 'VD: Phòng Đào tạo', value: form.author, onChange: e => setForm({ ...form, author: e.target.value }) })
            )
          ),
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, 'Nội dung ', h('span', { className: 'text-danger' }, '*')),
            h('textarea', { className: 'form-control', rows: 5, value: form.content, onChange: e => setForm({ ...form, content: e.target.value }) })
          ),
          h('div', { className: 'form-check form-switch' },
            h('input', { className: 'form-check-input', type: 'checkbox', role: 'switch', id: 'pinNews', checked: form.pinned, onChange: e => setForm({ ...form, pinned: e.target.checked }) }),
            h('label', { className: 'form-check-label fw-semibold', htmlFor: 'pinNews' }, h('i', { className: 'bi bi-pin-angle me-1' }), 'Ghim tin nổi bật lên đầu')
          )
        ),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
          h('button', { className: 'btn btn-primary', disabled: !valid, onClick: () => valid && onSave({ ...form, date: item?.date || new Date().toISOString().split('T')[0] }) }, item ? 'Lưu' : 'Đăng tin')
        )
      )
    )
  )
}

export default function News({ news = [], setNews, role = 'student' }) {
  const [filter,  setFilter]  = useState('all')
  const [modal,   setModal]   = useState(null)
  const [editItem,setEditItem]= useState(null)
  const [confirm, setConfirm] = useState(null)
  const [expanded,setExpanded]= useState({})
  const canManage = role === 'admin' || role === 'teacher'

  const handleSave = (form) => {
    if (modal === 'edit') setNews(prev => prev.map(n => n.id === editItem.id ? { ...n, ...form } : n))
    else setNews(prev => [{ id: Date.now(), ...form }, ...prev])
    setModal(null)
  }

  const sorted = news.slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.date) - new Date(a.date))
  const filtered = filter === 'all' ? sorted : sorted.filter(n => n.category === filter)

  const cats = [{ key: 'all', label: 'Tất cả', icon: 'grid-3x3-gap' },
    ...Object.entries(NEWS_CATEGORIES).map(([k, v]) => ({ key: k, label: v.label, icon: v.icon }))]

  return h('div', { className: 'container-fluid py-4' },
    h('div', { className: 'd-flex flex-wrap justify-content-between align-items-center gap-3 mb-4' },
      h('div', null,
        h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-newspaper me-2', style: { color: 'var(--primary)' } }), 'Tin tức nhà trường'),
        h('small', { className: 'text-muted' }, `${news.length} tin · thông báo, học vụ, sự kiện`)
      ),
      canManage && h('button', { className: 'btn btn-primary btn-sm', onClick: () => { setEditItem(null); setModal('add') } },
        h('i', { className: 'bi bi-plus-lg me-1' }), 'Đăng tin')
    ),

    h('div', { className: 'lib-tabs mb-4' },
      cats.map(c => h('button', { key: c.key, className: `lib-tab ${filter === c.key ? 'active' : ''}`, onClick: () => setFilter(c.key) },
        h('i', { className: `bi bi-${c.icon} me-1` }), c.label))
    ),

    filtered.length === 0
      ? h('div', { className: 'text-center text-muted py-5' }, h('i', { className: 'bi bi-newspaper fs-1 d-block mb-2 opacity-25' }), h('p', null, 'Chưa có tin nào.'))
      : h('div', { className: 'd-flex flex-column gap-3' },
          filtered.map(n => {
            const cat = NEWS_CATEGORIES[n.category] || NEWS_CATEGORIES.khac
            const isOpen = expanded[n.id]
            const long = (n.content || '').length > 220
            return h('div', { key: n.id, className: `card border-0 shadow-sm news-card${n.pinned ? ' news-pinned' : ''}` },
              h('div', { className: 'card-body' },
                h('div', { className: 'd-flex justify-content-between align-items-start gap-2 mb-2' },
                  h('div', { className: 'd-flex align-items-center gap-2 flex-wrap' },
                    h('span', { className: 'badge', style: { backgroundColor: cat.color + '22', color: cat.color } }, h('i', { className: `bi bi-${cat.icon} me-1` }), cat.label),
                    n.pinned && h('span', { className: 'badge bg-warning-subtle text-warning' }, h('i', { className: 'bi bi-pin-angle-fill me-1' }), 'Ghim')
                  ),
                  canManage && h(ActionMenu, { icon: 'three-dots', btnClass: 'btn btn-sm btn-light rounded-circle border-0', items: [
                    { label: 'Sửa', icon: 'pencil', iconClass: 'text-primary', onClick: () => { setEditItem(n); setModal('edit') } },
                    { divider: true },
                    { label: 'Xóa', icon: 'trash', danger: true, onClick: () => setConfirm(n.id) },
                  ] })
                ),
                h('h5', { className: 'fw-bold mb-2' }, n.title),
                h('p', { className: 'text-muted mb-2', style: { whiteSpace: 'pre-wrap' } },
                  long && !isOpen ? n.content.slice(0, 220) + '…' : n.content),
                long && h('button', { className: 'btn btn-link btn-sm p-0 mb-2', onClick: () => setExpanded(e => ({ ...e, [n.id]: !isOpen })) }, isOpen ? 'Thu gọn' : 'Xem thêm'),
                h('div', { className: 'd-flex gap-3 small text-muted border-top pt-2' },
                  h('span', null, h('i', { className: 'bi bi-building me-1' }), n.author || 'Nhà trường'),
                  h('span', null, h('i', { className: 'bi bi-calendar3 me-1' }), fmtDate(n.date))
                )
              )
            )
          })
        ),

    (modal || confirm) && h(Portal, null,
      modal && h(NewsModal, { item: modal === 'edit' ? editItem : null, onSave: handleSave, onClose: () => setModal(null) }),
      confirm && h(ConfirmModal, { message: 'Xóa tin này?', onConfirm: () => { setNews(prev => prev.filter(n => n.id !== confirm)); setConfirm(null) }, onClose: () => setConfirm(null) })
    )
  )
}
