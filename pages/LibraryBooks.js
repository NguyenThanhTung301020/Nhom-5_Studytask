// pages/LibraryBooks.js – Kho sách điện tử của Thư viện: sách từ Internet Archive, bìa, tên sách, đọc/tải PDF (cần đăng nhập)
import { fsList } from '../utils/firebase.js'
import { GENRES, genreOf, filterBooks, sortBooks, genreCounts, formatSize, bookFileUrl, sourceLine, safeSourceUrl } from '../utils/library.js'

const { useState, useEffect, useMemo, createElement: h } = window.React

function Cover({ book, className = 'book-cover' }) {
  const g = genreOf(book)
  const [bad, setBad] = useState(false)
  if (book.cover && !bad) {
    return h('div', { className, style: { position: 'relative', overflow: 'hidden', background: g.color + '33' } },
      h('img', { src: book.cover, alt: `Bìa sách ${book.title}`, loading: 'lazy', onError: () => setBad(true), style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }))
  }
  return h('div', { className: `${className} book-cover-gen`, style: { background: `linear-gradient(150deg, ${g.color}, ${g.color}aa)` } },
    h('i', { className: `bi bi-${g.icon} book-cover-icon` }), h('div', { className: 'book-cover-title' }, book.title))
}

function BookDetail({ book, onClose }) {
  const g = genreOf(book), src = safeSourceUrl(book.sourceUrl)
  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' }, onClick: e => e.target === e.currentTarget && onClose() },
    h('div', { className: 'modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' },
          h('h5', { className: 'modal-title fw-bold' }, book.title),
          h('button', { className: 'btn-close', onClick: onClose, 'aria-label': 'Đóng' })),
        h('div', { className: 'modal-body' },
          h('div', { className: 'row g-4' },
            h('div', { className: 'col-12 col-sm-4' }, h(Cover, { book, className: 'book-cover' })),
            h('div', { className: 'col-12 col-sm-8' },
              book.author && h('div', { className: 'mb-1' }, h('i', { className: 'bi bi-person me-2 text-muted' }), h('strong', null, book.author)),
              book.series && h('div', { className: 'small text-muted mb-1' }, h('i', { className: 'bi bi-collection me-2' }), `Bộ sách: ${book.series}`),
              h('div', { className: 'mb-2' }, h('span', { className: 'badge', style: { background: g.color + '22', color: g.color } }, h('i', { className: `bi bi-${g.icon} me-1` }), g.label),
                book.language === 'en' && h('span', { className: 'badge bg-light text-dark border ms-1' }, 'Tiếng Anh')),
              h('div', { className: 'small text-muted d-flex flex-wrap gap-3 mb-3' },
                book.pages > 0 && h('span', null, h('i', { className: 'bi bi-file-earmark-text me-1' }), `${book.pages} trang`),
                h('span', null, h('i', { className: 'bi bi-hdd me-1' }), formatSize(book.size)),
                book.year && h('span', null, h('i', { className: 'bi bi-calendar3 me-1' }), book.year)),
              h('div', { className: 'd-flex flex-wrap gap-2 mb-3' },
                h('a', { href: bookFileUrl(book.id), target: '_blank', rel: 'noopener', className: 'btn btn-primary btn-sm' }, h('i', { className: 'bi bi-book me-1' }), 'Đọc trực tuyến'),
                h('a', { href: bookFileUrl(book.id), download: `${book.title}.pdf`, className: 'btn btn-outline-primary btn-sm' }, h('i', { className: 'bi bi-download me-1' }), 'Tải về (PDF)')),
              h('div', { className: 'card border-0 bg-light' },
                h('div', { className: 'card-body py-2 small' },
                  h('div', { className: 'fw-semibold mb-1' }, h('i', { className: 'bi bi-info-circle me-1' }), 'Nguồn và bản quyền'),
                  h('div', null, 'Nguồn: ', src ? h('a', { href: src, target: '_blank', rel: 'noopener noreferrer' }, sourceLine(book)) : sourceLine(book)),
                  h('div', null, 'Giấy phép trên trang nguồn: ', book.licenseLabel || 'Chưa ghi'),
                  h('div', { className: 'text-muted mt-1' }, 'Sách chỉ dùng để học tập, nghiên cứu trong trường. Quyền tác giả thuộc tác giả và nhà xuất bản; không đăng lại ra ngoài hệ thống.')))))))))
}

export default function LibraryBooks({ search = '' }) {
  const [books, setBooks] = useState(null)       // null = đang tải
  const [error, setError] = useState('')
  const [genre, setGenre] = useState('')
  const [sort, setSort] = useState('title')
  const [open, setOpen] = useState(null)

  useEffect(() => {
    let live = true
    fsList('libraryBooks').then(docs => { if (live) setBooks(docs || []) }).catch(e => { if (live) { setBooks([]); setError(e.message || 'Không tải được danh mục sách.') } })
    return () => { live = false }
  }, [])

  const all = books || []
  const counts = useMemo(() => genreCounts(all), [books])
  const shown = useMemo(() => sortBooks(filterBooks(all, { q: search, genre }), sort), [books, search, genre, sort])

  if (books === null) return h('div', { className: 'text-center text-muted py-5' }, h('div', { className: 'spinner-border spinner-border-sm me-2' }), 'Đang tải kho sách…')
  if (all.length === 0) return h('div', { className: 'text-center text-muted py-5' },
    h('i', { className: 'bi bi-journal-x fs-1 d-block mb-2 opacity-25' }), error || 'Kho sách điện tử chưa có sách nào.')

  return h('div', null,
    h('div', { className: 'alert alert-light border small py-2 mb-3' }, h('i', { className: 'bi bi-info-circle me-1 text-primary' }),
      'Sách lấy từ ', h('a', { href: 'https://archive.org', target: '_blank', rel: 'noopener noreferrer' }, 'Internet Archive'),
      ', chỉ dành cho người đã đăng nhập, dùng học tập. Mở từng sách để xem nguồn và giấy phép.'),
    h('div', { className: 'lib-tabs mb-3' },
      h('button', { className: `lib-tab ${genre === '' ? 'active' : ''}`, onClick: () => setGenre('') }, h('i', { className: 'bi bi-grid-3x3-gap me-1' }), 'Tất cả', h('span', { className: 'lib-tab-count' }, all.length)),
      Object.entries(GENRES).filter(([k]) => counts[k]).map(([k, g]) =>
        h('button', { key: k, className: `lib-tab ${genre === k ? 'active' : ''}`, onClick: () => setGenre(k) }, h('i', { className: `bi bi-${g.icon} me-1` }), g.label, h('span', { className: 'lib-tab-count' }, counts[k])))),
    h('div', { className: 'd-flex flex-wrap align-items-center gap-2 mb-3 small' },
      h('span', { className: 'text-muted' }, search ? 'Kết quả: ' : 'Hiển thị: ', h('strong', null, shown.length), ` / ${all.length} sách`),
      h('select', { className: 'form-select form-select-sm ms-auto', style: { width: 'auto' }, value: sort, onChange: e => setSort(e.target.value), 'aria-label': 'Sắp xếp' },
        h('option', { value: 'title' }, 'Tên A → Z'), h('option', { value: 'pages' }, 'Số trang tăng dần'), h('option', { value: 'size' }, 'Dung lượng tăng dần'))),
    shown.length === 0
      ? h('div', { className: 'text-center text-muted py-5' }, h('i', { className: 'bi bi-search fs-1 d-block mb-2 opacity-25' }), 'Không tìm thấy sách nào.')
      : h('div', { className: 'row g-3' }, shown.map(b => {
          const g = genreOf(b)
          return h('div', { key: b.id, className: 'col-6 col-md-4 col-lg-3 col-xl-2' },
            h('div', { className: 'book-card', role: 'button', tabIndex: 0, onClick: () => setOpen(b), onKeyDown: e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen(b)) },
              h('div', { className: 'book-cover-link' }, h(Cover, { book: b }), h('span', { className: 'book-open-overlay' }, h('i', { className: 'bi bi-eye me-1' }), 'Xem')),
              h('div', { className: 'book-meta' },
                h('div', { className: 'book-title', title: b.title }, b.title),
                b.author && h('div', { className: 'book-author' }, b.author),
                h('div', { className: 'd-flex align-items-center justify-content-between mt-1' },
                  h('span', { className: 'book-cat', style: { color: g.color } }, h('i', { className: `bi bi-${g.icon} me-1` }), g.label),
                  b.pages > 0 && h('span', { className: 'small text-muted' }, `${b.pages} tr.`)))))
        })),
    open && h(BookDetail, { book: open, onClose: () => setOpen(null) }))
}
