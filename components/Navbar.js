// components/Navbar.js – Top bar (điều hướng chính nằm ở Sidebar dọc)
import { ROLES, QUOTES } from '../utils/constants.js'

const { useState, useEffect, useRef, createElement: h } = window.React

const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

export default function Navbar({ user, profile, currentPage, onNavigate, onLogout, onOpenSettings, onToggleSidebar, notifications = [], unreadNotif = 0, onOpenNotifications }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen])
  const go = (fn) => () => { setMenuOpen(false); fn() }

  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)
  useEffect(() => {
    if (!notifOpen) return
    const onDoc = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [notifOpen])
  const toggleNotif = () => {
    setNotifOpen(o => { const nv = !o; if (nv && onOpenNotifications) onOpenNotifications(); return nv })
  }

  const initials  = (profile.name || user.name).split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()
  const role      = user.role || 'student'
  const roleInfo  = ROLES[role] || ROLES.student

  const timeStr  = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const dateStr  = `${WEEKDAYS[now.getDay()]}, ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`
  const quote    = QUOTES[now.getDay() % QUOTES.length]

  return (
    h('nav', { className: 'navbar sticky-top app-topbar', style: { backgroundColor: 'var(--primary)' } },
      h('div', { className: 'container-fluid' },
        h('div', { className: 'd-flex align-items-center gap-2' },
          // Nút mở sidebar (chỉ hiện trên mobile/tablet)
          h('button', { className: 'btn btn-link text-white p-1 border-0 d-lg-none', title: 'Menu', onClick: onToggleSidebar },
            h('i', { className: 'bi bi-list fs-3' })
          ),
          h('button', { className: 'navbar-brand fw-bold fs-5 btn btn-link text-white text-decoration-none p-0 border-0 m-0', onClick: () => onNavigate('dashboard') },
            h('i', { className: 'bi bi-calendar-check-fill me-2' }), 'StudyTask'
          ),
          // Đồng hồ live + ngày (cạnh logo)
          h('span', { className: 'topbar-divider d-none d-md-inline' }),
          h('div', { className: 'topbar-clock d-none d-md-flex flex-column align-items-start' },
            h('span', { className: 'topbar-time' }, timeStr),
            h('span', { className: 'topbar-date' }, dateStr)
          )
        ),

        // Giữa: châm ngôn (chiếm phần lớn diện tích)
        h('div', { className: 'topbar-quote d-none d-lg-flex align-items-center gap-2' },
          h('i', { className: 'bi bi-quote flex-shrink-0' }),
          h('span', { className: 'text-truncate fst-italic' }, quote)
        ),

        h('div', { className: 'd-flex align-items-center gap-2' },
          // ── Chuông thông báo ──
          h('div', { className: 'dropdown', ref: notifRef, style: { position: 'relative' } },
            h('button', { className: 'btn btn-link text-white p-2 border-0 position-relative', type: 'button', title: 'Thông báo', onClick: toggleNotif },
              h('i', { className: 'bi bi-bell fs-5' }),
              unreadNotif > 0 && h('span', { className: 'notif-badge' }, unreadNotif > 9 ? '9+' : unreadNotif)
            ),
            notifOpen && h('div', { className: 'dropdown-menu dropdown-menu-end shadow border-0 show notif-panel', style: { position: 'absolute', right: 0, top: '100%' } },
              h('div', { className: 'notif-head d-flex align-items-center justify-content-between' },
                h('span', { className: 'fw-bold' }, h('i', { className: 'bi bi-bell me-2' }), 'Thông báo'),
                h('span', { className: 'badge bg-primary rounded-pill' }, notifications.length)
              ),
              notifications.length === 0
                ? h('div', { className: 'text-center text-muted py-4 small' },
                    h('i', { className: 'bi bi-check2-circle d-block fs-3 mb-2 text-success opacity-50' }), 'Không có thông báo mới')
                : h('div', { className: 'notif-list' },
                    notifications.map(n =>
                      h('button', { key: n.id, className: 'notif-item', onClick: () => { setNotifOpen(false); onNavigate(n.page) } },
                        h('span', { className: 'notif-icon', style: { backgroundColor: n.color + '22', color: n.color } }, h('i', { className: `bi bi-${n.icon}` })),
                        h('span', { className: 'flex-grow-1 min-w-0 text-start' },
                          h('span', { className: 'd-block fw-semibold small text-truncate' }, n.title),
                          h('span', { className: 'd-block text-muted', style: { fontSize: '0.76rem' } }, n.desc)
                        )
                      )
                    )
                  )
            )
          ),
          h('button', { className: 'btn btn-link text-white-50 p-2 border-0', title: 'Tùy chỉnh giao diện', onClick: onOpenSettings },
            h('i', { className: 'bi bi-palette fs-5' })
          ),
          h('div', { className: 'dropdown', ref: menuRef, style: { position: 'relative' } },
            h('button', { className: 'btn btn-link p-1 d-flex align-items-center gap-2 text-decoration-none border-0', type: 'button', onClick: () => setMenuOpen(o => !o) },
              h('div', { className: 'nav-avatar', style: { borderColor: roleInfo.color } },
                h('div', { className: 'nav-avatar-initials' }, initials)
              ),
              h('div', { className: 'd-none d-md-flex flex-column align-items-start' },
                h('span', { className: 'text-white small fw-semibold lh-1 mb-1' }, profile.name || user.name),
                h('span', { className: `role-badge role-badge-${role}` },
                  h('i', { className: `bi bi-${roleInfo.icon} me-1` }), roleInfo.label
                )
              ),
              h('i', { className: 'bi bi-chevron-down text-white-50 small ms-1' })
            ),
            menuOpen && h('ul', { className: 'dropdown-menu dropdown-menu-end shadow border-0 show', style: { position: 'absolute', right: 0, top: '100%' } },
              h('li', null,
                h('div', { className: 'dropdown-header d-flex flex-column gap-1' },
                  h('span', null, user.email),
                  h('span', { className: `role-badge role-badge-${role} align-self-start mt-1` },
                    h('i', { className: `bi bi-${roleInfo.icon} me-1` }), roleInfo.label
                  )
                )
              ),
              h('li', null, h('hr', { className: 'dropdown-divider my-1' })),
              h('li', null, h('button', { className: 'dropdown-item', onClick: go(() => onNavigate('profile')) }, h('i', { className: 'bi bi-person me-2 text-primary' }), 'Hồ sơ của tôi')),
              role === 'admin' && h('li', null, h('button', { className: 'dropdown-item', onClick: go(() => onNavigate('admin')) }, h('i', { className: 'bi bi-gear-wide-connected me-2 text-danger' }), 'Bảng quản trị')),
              h('li', null, h('button', { className: 'dropdown-item', onClick: go(onOpenSettings) }, h('i', { className: 'bi bi-palette me-2 text-warning' }), 'Tùy chỉnh giao diện')),
              h('li', null, h('hr', { className: 'dropdown-divider my-1' })),
              h('li', null, h('button', { className: 'dropdown-item text-danger', onClick: go(onLogout) }, h('i', { className: 'bi bi-box-arrow-right me-2' }), 'Đăng xuất'))
            )
          )
        )
      )
    )
  )
}
