// components/ActionMenu.js – Menu ba chấm điều khiển bằng React (không dùng Bootstrap JS)
// Tránh xung đột data-bs-toggle="dropdown" với React gây giật/đóng modal.
const { useState, useRef, useEffect, createElement: h } = window.React

export default function ActionMenu({ items = [], icon = 'three-dots-vertical', btnClass = 'btn btn-sm btn-light rounded-circle border-0' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return h('div', { className: 'dropdown', ref, style: { position: 'relative' } },
    h('button', { className: btnClass, type: 'button', onClick: (e) => { e.stopPropagation(); setOpen(o => !o) } },
      h('i', { className: `bi bi-${icon}` })
    ),
    open && h('ul', { className: 'dropdown-menu dropdown-menu-end shadow-sm border-0 show', style: { position: 'absolute', right: 0, top: '100%' } },
      items.map((it, i) =>
        it.divider
          ? h('li', { key: i }, h('hr', { className: 'dropdown-divider my-1' }))
          : h('li', { key: i },
              h('button', { className: `dropdown-item ${it.danger ? 'text-danger' : ''}`, type: 'button',
                onClick: () => { setOpen(false); it.onClick && it.onClick() } },
                it.icon && h('i', { className: `bi bi-${it.icon} me-2 ${it.iconClass || ''}` }), it.label
              )
            )
      )
    )
  )
}
