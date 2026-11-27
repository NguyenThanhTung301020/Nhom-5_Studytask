// components/ToolCard.js – Khung dùng chung của trang Tiện ích để các tiện ích trông thống nhất:
// cùng thẻ, cùng tiêu đề, cùng kiểu tab và nút chính. Mỗi tiện ích có một màu nhấn (color).
const { createElement: h } = window.React

export function ToolCard({ icon, color, title, sub, extra, children }) {
  return h('div', { className: 'tool-card card border-0 shadow-sm h-100' },
    h('div', { className: 'card-body d-flex flex-column' },
      h('div', { className: 'tool-head' },
        h('div', { className: 'tool-icon', style: { backgroundColor: `${color}1f`, color } }, h('i', { className: `bi bi-${icon}` })),
        h('div', { className: 'flex-grow-1' }, h('div', { className: 'fw-bold' }, title), h('small', { className: 'text-muted' }, sub)),
        extra
      ),
      children
    )
  )
}

// Nhóm tab chiếm hết chiều ngang; items: [[khóa, nhãn, biểu tượng?, màu riêng?]]
export function ToolTabs({ value, onChange, items, color }) {
  return h('div', { className: 'btn-group btn-group-sm w-100 mb-3', role: 'group' },
    items.map(([k, label, icon, c]) => {
      const on = value === k, col = c || color
      return h('button', { key: k, type: 'button', className: `btn ${on ? 'text-white' : 'btn-outline-secondary'}`,
        style: on ? { backgroundColor: col, borderColor: col } : {}, onClick: () => onChange(k) },
        icon && h('i', { className: `bi bi-${icon} me-1` }), label)
    }))
}

// Kiểu nút chính theo màu nhấn của tiện ích
export const accent = (color) => ({ backgroundColor: color, borderColor: color, color: '#fff' })

// Hàng nút cuối khối: nút chính rộng hết (flex-grow-1), nút phụ viền xám bên phải; luôn nằm sát đáy thẻ
export const ToolFooter = (...btns) => h('div', { className: 'd-flex gap-2 mt-auto pt-2' }, ...btns)

// Trạng thái trống: biểu tượng mờ và một dòng hướng dẫn, nằm giữa phần còn trống của thẻ
export const ToolEmpty = (icon, text) => h('div', { className: 'flex-grow-1 d-flex flex-column align-items-center justify-content-center text-muted small text-center py-3' },
  h('i', { className: `bi bi-${icon} fs-3 mb-1`, style: { opacity: .5 } }), text)
