// components/Sidebar.js – Thanh điều hướng dọc, nhóm mục mở/thu độc lập
import { NAV_ITEMS, NAV_GROUPS } from '../utils/constants.js'

const { useState, createElement: h } = window.React

export default function Sidebar({ user, currentPage, onNavigate, open, onClose }) {
  const role = user.role || 'student'
  // Mặc định mở tất cả nhóm; có thể mở nhiều nhóm cùng lúc
  const [openGroups, setOpenGroups] = useState(() => NAV_GROUPS.map(g => g.id))

  const toggleGroup = (id) =>
    setOpenGroups(gs => gs.includes(id) ? gs.filter(g => g !== id) : [...gs, id])

  const itemByKey = Object.fromEntries(NAV_ITEMS.map(i => [i.key, i]))

  const go = (key) => { onNavigate(key); onClose && onClose() }

  return h(window.React.Fragment, null,
    // Backdrop trên mobile khi mở sidebar
    open && h('div', { className: 'sidebar-backdrop d-lg-none', onClick: onClose }),

    h('aside', { className: `app-sidebar${open ? ' open' : ''}` },
      NAV_GROUPS.map(group => {
        const items = group.keys
          .map(k => itemByKey[k])
          .filter(it => it && it.roles.includes(role))
        if (items.length === 0) return null
        const isOpen = openGroups.includes(group.id)

        return h('div', { key: group.id, className: 'sidebar-group' },
          h('button', { className: 'sidebar-group-head', onClick: () => toggleGroup(group.id) },
            h('span', { className: 'd-flex align-items-center gap-2' },
              h('i', { className: `bi bi-${group.icon}` }),
              h('span', { className: 'sidebar-group-title' }, group.title)
            ),
            h('i', { className: `bi bi-chevron-${isOpen ? 'down' : 'right'} sidebar-chevron` })
          ),
          isOpen && h('ul', { className: 'sidebar-list' },
            items.map(item =>
              h('li', { key: item.key },
                h('button', {
                  className: `sidebar-link${currentPage === item.key ? ' active' : ''}`,
                  onClick: () => go(item.key),
                },
                  h('i', { className: `bi bi-${item.icon}` }),
                  h('span', null, item.label),
                  item.key === 'admin' && h('span', { className: 'sidebar-badge' }, 'Admin')
                )
              )
            )
          )
        )
      })
    )
  )
}
