// pages/Library.js – Thư viện số: nguồn sách miễn phí VN + kho tài nguyên
import { LIB_CAT, VN_LIBRARIES } from '../utils/constants.js'
import ConfirmModal from '../components/ConfirmModal.js'
import ActionMenu from '../components/ActionMenu.js'

const { useState, createElement: h } = window.React

function LibraryModal({ item, onSave, onClose }) {
  const [form, setForm] = useState(item
    ? { title: '', url: '', category: 'other', note: '', author: '', cover: '', ...item }
    : { title: '', url: 'https://', category: 'other', note: '', author: '', cover: '' })
  const valid = form.title.trim() && form.url.trim()
  return (
    h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
      h('div', { className: 'modal-dialog modal-dialog-centered modal-dialog-scrollable' },
        h('div', { className: 'modal-content' },
          h('div', { className: 'modal-header' },
            h('h5', { className: 'modal-title fw-bold' }, item ? 'Sửa đầu sách / tài nguyên' : 'Thêm đầu sách / tài nguyên'),
            h('button', { className: 'btn-close', onClick: onClose })
          ),
          h('div', { className: 'modal-body' },
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, 'Tên sách / tài nguyên ', h('span', { className: 'text-danger' }, '*')),
              h('input', { className: 'form-control', placeholder: 'VD: Giải tích 1 – NXB ĐHQG', value: form.title, autoFocus: true, onChange: (e) => setForm({ ...form, title: e.target.value }) })
            ),
            h('div', { className: 'row g-3 mb-3' },
              h('div', { className: 'col-md-7' },
                h('label', { className: 'form-label fw-semibold' }, 'Tác giả / Nguồn'),
                h('input', { className: 'form-control', placeholder: 'VD: Nguyễn Đình Trí', value: form.author, onChange: (e) => setForm({ ...form, author: e.target.value }) })
              ),
              h('div', { className: 'col-md-5' },
                h('label', { className: 'form-label fw-semibold' }, 'Danh mục'),
                h('select', { className: 'form-select', value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }) },
                  Object.entries(LIB_CAT).map(([k, v]) => h('option', { key: k, value: k }, v.label))
                )
              )
            ),
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, 'Đường dẫn (đọc / tải) ', h('span', { className: 'text-danger' }, '*')),
              h('input', { className: 'form-control', placeholder: 'https://hoc10.vn/...', value: form.url, onChange: (e) => setForm({ ...form, url: e.target.value }) })
            ),
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-image me-1' }), 'Ảnh bìa (URL)'),
              h('input', { className: 'form-control', placeholder: 'Dán link ảnh bìa sách (tùy chọn)', value: form.cover, onChange: (e) => setForm({ ...form, cover: e.target.value }) }),
              h('div', { className: 'form-text' }, 'Để trống sẽ tự tạo bìa màu theo danh mục.')
            ),
            h('div', null,
              h('label', { className: 'form-label fw-semibold' }, 'Mô tả'),
              h('textarea', { className: 'form-control', rows: 2, placeholder: 'Mô tả ngắn...', value: form.note, onChange: (e) => setForm({ ...form, note: e.target.value }) })
            )
          ),
          h('div', { className: 'modal-footer' },
            h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
            h('button', { className: 'btn btn-primary', disabled: !valid, onClick: () => valid && onSave(form) }, item ? 'Lưu thay đổi' : 'Thêm')
          )
        )
      )
    )
  )
}

export default function Library({ libraryLinks, setLibraryLinks, role = 'student' }) {
  const [filter,    setFilter]    = useState('all')
  const [search,    setSearch]    = useState('')
  const [modal,     setModal]     = useState(null)
  const [editItem,  setEditItem]  = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const isAdmin = role === 'admin'

  const handleSave = (form) => {
    if (modal === 'edit') setLibraryLinks(prev => prev.map((l) => l.id === editItem.id ? { ...l, ...form } : l))
    else setLibraryLinks(prev => [...prev, { id: Date.now(), ...form }])
    setModal(null)
  }

  const filtered = libraryLinks
    .filter((l) => filter === 'all' || l.category === filter)
    .filter((l) => !search || l.title.toLowerCase().includes(search.toLowerCase()) || (l.note || '').toLowerCase().includes(search.toLowerCase()) || (l.author || '').toLowerCase().includes(search.toLowerCase()))

  const catTabs = [
    { key: 'all', label: 'Tất cả', icon: 'grid-3x3-gap', count: libraryLinks.length },
    ...Object.entries(LIB_CAT).map(([k, v]) => ({ key: k, label: v.label, icon: v.icon, count: libraryLinks.filter((l) => l.category === k).length })),
  ]

  // ── Thẻ sách (bìa) ──
  const bookCard = (link) => {
    const cat = LIB_CAT[link.category] || LIB_CAT.other
    return h('div', { key: link.id, className: 'col-6 col-md-4 col-lg-3 col-xl-2' },
      h('div', { className: 'book-card' },
        h('a', { href: link.url, target: '_blank', rel: 'noopener noreferrer', className: 'book-cover-link' },
          link.cover
            ? h('div', { className: 'book-cover', style: { backgroundImage: `url(${link.cover})` } })
            : h('div', { className: 'book-cover book-cover-gen', style: { background: `linear-gradient(150deg, ${cat.color}, ${cat.color}aa)` } },
                h('i', { className: `bi bi-${cat.icon} book-cover-icon` }),
                h('div', { className: 'book-cover-title' }, link.title)
              ),
          h('span', { className: 'book-open-overlay' }, h('i', { className: 'bi bi-box-arrow-up-right me-1' }), 'Mở')
        ),
        h('div', { className: 'book-meta' },
          h('div', { className: 'book-title', title: link.title }, link.title),
          link.author && h('div', { className: 'book-author' }, link.author),
          h('div', { className: 'd-flex align-items-center justify-content-between mt-1' },
            h('span', { className: 'book-cat', style: { color: cat.color } }, h('i', { className: `bi bi-${cat.icon} me-1` }), cat.label),
            isAdmin && h(ActionMenu, { btnClass: 'btn btn-sm btn-link text-muted p-0 border-0', icon: 'three-dots', items: [
              { label: 'Sửa', icon: 'pencil', iconClass: 'text-primary', onClick: () => { setEditItem(link); setModal('edit') } },
              { divider: true },
              { label: 'Xóa', icon: 'trash', danger: true, onClick: () => setConfirmId(link.id) },
            ] })
          )
        )
      )
    )
  }

  return (
    h('div', { className: 'container-fluid py-4' },
      // ── Header ──
      h('div', { className: 'd-flex flex-wrap justify-content-between align-items-center gap-3 mb-4' },
        h('div', null,
          h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-journal-bookmark me-2', style: { color: 'var(--primary)' } }), 'Thư viện số'),
          h('small', { className: 'text-muted' }, `${libraryLinks.length} đầu sách & tài nguyên · ${VN_LIBRARIES.length} thư viện miễn phí`)
        ),
        h('div', { className: 'd-flex gap-2' },
          h('div', { className: 'input-group input-group-sm', style: { width: 220 } },
            h('span', { className: 'input-group-text bg-light border-end-0 text-muted' }, h('i', { className: 'bi bi-search' })),
            h('input', { className: 'form-control border-start-0', placeholder: 'Tìm sách, tài nguyên...', value: search, onChange: (e) => setSearch(e.target.value) })
          ),
          isAdmin && h('button', { className: 'btn btn-primary btn-sm', onClick: () => { setEditItem(null); setModal('add') } },
            h('i', { className: 'bi bi-plus-lg me-1' }), 'Thêm sách'
          )
        )
      ),

      // ── Thư viện số miễn phí Việt Nam ──
      !search && filter === 'all' && h('div', { className: 'mb-4' },
        h('div', { className: 'fw-bold mb-3' }, h('i', { className: 'bi bi-flag-fill me-2 text-danger' }), 'Thư viện số & kho sách miễn phí Việt Nam'),
        h('div', { className: 'row g-2' },
          VN_LIBRARIES.map(lib =>
            h('div', { key: lib.id, className: 'col-12 col-sm-6 col-lg-3' },
              h('a', { href: lib.url, target: '_blank', rel: 'noopener noreferrer', className: 'vnlib-card' },
                h('div', { className: 'vnlib-icon', style: { backgroundColor: lib.color + '22', color: lib.color } }, h('i', { className: `bi bi-${lib.icon}` })),
                h('div', { className: 'min-w-0 flex-grow-1' },
                  h('div', { className: 'fw-semibold text-truncate' }, lib.name),
                  h('div', { className: 'small text-muted text-truncate-2' }, lib.desc)
                ),
                h('i', { className: 'bi bi-box-arrow-up-right text-muted flex-shrink-0' })
              )
            )
          )
        )
      ),

      // ── Category tabs ──
      h('div', { className: 'lib-tabs mb-4' },
        catTabs.map((t) =>
          h('button', { key: t.key, className: `lib-tab ${filter === t.key ? 'active' : ''}`, onClick: () => setFilter(t.key) },
            h('i', { className: `bi bi-${t.icon} me-1` }), t.label, h('span', { className: 'lib-tab-count' }, t.count)
          )
        )
      ),

      search && h('p', { className: 'text-muted small mb-3' }, 'Kết quả: ', h('strong', null, filtered.length), ` tài nguyên`),

      // ── Kệ sách ──
      filtered.length === 0
        ? h('div', { className: 'text-center text-muted py-5' },
            h('i', { className: 'bi bi-journal-x fs-1 d-block mb-2 opacity-25' }),
            h('p', null, search ? 'Không tìm thấy tài nguyên nào.' : 'Chưa có đầu sách nào trong danh mục này.'),
            isAdmin && !search && h('button', { className: 'btn btn-outline-primary btn-sm', onClick: () => { setEditItem(null); setModal('add') } }, h('i', { className: 'bi bi-plus-lg me-1' }), 'Thêm đầu sách')
          )
        : h('div', { className: 'row g-3' }, filtered.map(bookCard)),

      modal     && h(LibraryModal, { item: modal === 'edit' ? editItem : null, onSave: handleSave, onClose: () => setModal(null) }),
      confirmId && h(ConfirmModal, { message: 'Bạn có chắc muốn xóa đầu sách này?', onConfirm: () => { setLibraryLinks(prev => prev.filter((l) => l.id !== confirmId)); setConfirmId(null) }, onClose: () => setConfirmId(null) })
    )
  )
}
