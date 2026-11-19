// pages/Library.js – Thư viện số: kho sách điện tử (PDF lưu trên máy chủ, từ Internet Archive)
// Mục "Liên kết & nguồn tham khảo" đã gỡ theo yêu cầu 19/11/2026; dữ liệu liên kết cũ trong app.js không còn hiển thị.
import LibraryBooks from './LibraryBooks.js'

const { useState, createElement: h } = window.React

export default function Library() {
  const [search, setSearch] = useState('')
  return (
    h('div', { className: 'container-fluid py-4' },
      h('div', { className: 'd-flex flex-wrap justify-content-between align-items-center gap-3 mb-4' },
        h('div', null,
          h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-journal-bookmark me-2', style: { color: 'var(--primary)' } }), 'Thư viện số'),
          h('small', { className: 'text-muted' }, 'Kho sách điện tử đọc và tải ngay trên hệ thống')
        ),
        h('div', { className: 'input-group input-group-sm', style: { width: 260 } },
          h('span', { className: 'input-group-text bg-light border-end-0 text-muted' }, h('i', { className: 'bi bi-search' })),
          h('input', { className: 'form-control border-start-0', placeholder: 'Tìm tên sách, tác giả (không cần gõ dấu)...', value: search, onChange: (e) => setSearch(e.target.value) })
        )
      ),
      h(LibraryBooks, { search })
    )
  )
}
