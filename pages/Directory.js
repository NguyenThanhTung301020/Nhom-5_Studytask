// pages/Directory.js – Lưu trữ thông tin Sinh viên & Giáo viên (tách theo phân quyền)
import { ROLES } from '../utils/constants.js'

const { useState, useMemo, createElement: h } = window.React

const initials = (name) => (name || '?').trim().split(' ').slice(-1)[0].charAt(0).toUpperCase()
const today = () => new Date().toISOString().split('T')[0]

export default function Directory({ allUsers = [], subjects = [], role = 'admin', user }) {
  const [tab,    setTab]    = useState('student')
  const [search, setSearch] = useState('')

  const subName = (id) => (subjects.find(s => s.id === id) || {}).name
  const subColor = (id) => (subjects.find(s => s.id === id) || {}).color || '#858796'
  const isAdmin = role === 'admin' || role === 'training' || role === 'finance'   // phòng ban xem toàn bộ
  const mySubjectIds = new Set(user?.subjectIds || [])

  // Giáo viên chỉ xem SV trong môn mình phụ trách; admin và phòng ban xem tất cả
  const inScope = (u) => {
    if (isAdmin) return true
    if (!Array.isArray(u.subjectIds)) return false
    return u.subjectIds.some(id => mySubjectIds.has(id))
  }

  const students = useMemo(() => allUsers.filter(u => u.role === 'student' && inScope(u)), [allUsers, role, user])
  const teachers = useMemo(() => allUsers.filter(u => u.role === 'teacher'), [allUsers])

  const list = (tab === 'student' ? students : teachers)
    .filter(u => !search || (u.name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || ''))

  const card = (u) => {
    const r = ROLES[u.role] || ROLES.student
    const expired = u.expiresAt && u.expiresAt < today()
    const subs = (u.subjectIds || []).map(subName).filter(Boolean)
    return h('div', { key: u.uid, className: 'col-12 col-md-6 col-xl-4' },
      h('div', { className: 'card border-0 shadow-sm h-100' },
        h('div', { className: 'card-body' },
          h('div', { className: 'd-flex align-items-center gap-3 mb-3' },
            h('div', { className: 'dir-avatar', style: { background: `linear-gradient(135deg, ${r.color}dd, ${r.color}88)` } }, initials(u.name || u.email)),
            h('div', { className: 'min-w-0 flex-grow-1' },
              h('div', { className: 'fw-bold text-truncate' }, u.name || '(Chưa đặt tên)'),
              h('div', { className: 'small text-muted text-truncate' }, u.email),
              h('span', { className: `role-badge role-badge-${u.role} mt-1` }, h('i', { className: `bi bi-${r.icon} me-1` }), r.label)
            )
          ),
          h('div', { className: 'dir-info small' },
            u.phone && h('div', null, h('i', { className: 'bi bi-telephone me-2 text-muted' }), u.phone),
            h('div', null, h('i', { className: 'bi bi-book me-2 text-muted' }),
              subs.length ? `${subs.length} môn: ${subs.join(', ')}` : 'Chưa gán môn'),
            u.expiresAt && h('div', { className: expired ? 'text-danger' : 'text-muted' },
              h('i', { className: `bi bi-${expired ? 'exclamation-circle' : 'calendar-check'} me-2` }),
              expired ? `Hết hạn ${new Date(u.expiresAt).toLocaleDateString('vi-VN')}` : `Hiệu lực đến ${new Date(u.expiresAt).toLocaleDateString('vi-VN')}`)
          ),
          // Chip màu môn học
          subs.length > 0 && h('div', { className: 'd-flex flex-wrap gap-1 mt-2' },
            (u.subjectIds || []).map(id => subName(id) && h('span', { key: id, className: 'dir-sub-chip', style: { backgroundColor: subColor(id) + '22', color: subColor(id) } }, subName(id)))
          )
        )
      )
    )
  }

  return h('div', { className: 'container-fluid py-4' },
    h('div', { className: 'd-flex flex-wrap justify-content-between align-items-center gap-3 mb-4' },
      h('div', null,
        h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-person-vcard me-2', style: { color: 'var(--primary)' } }), 'Hồ sơ Sinh viên & Giáo viên'),
        h('small', { className: 'text-muted' }, isAdmin ? 'Quản lý và theo dõi toàn bộ tài khoản theo phân quyền' : 'Danh sách sinh viên các môn bạn phụ trách')
      ),
      h('div', { className: 'input-group input-group-sm', style: { width: 220 } },
        h('span', { className: 'input-group-text bg-light border-end-0 text-muted' }, h('i', { className: 'bi bi-search' })),
        h('input', { className: 'form-control border-start-0', placeholder: 'Tìm tên, email...', value: search, onChange: e => setSearch(e.target.value) })
      )
    ),

    // Tabs SV / GV
    h('div', { className: 'd-flex gap-2 mb-4' },
      h('button', { className: `btn btn-sm ${tab === 'student' ? 'btn-success' : 'btn-outline-success'}`, onClick: () => setTab('student') },
        h('i', { className: 'bi bi-mortarboard me-1' }), `Sinh viên (${students.length})`),
      isAdmin && h('button', { className: `btn btn-sm ${tab === 'teacher' ? 'btn-primary' : 'btn-outline-primary'}`, onClick: () => setTab('teacher') },
        h('i', { className: 'bi bi-person-workspace me-1' }), `Giáo viên (${teachers.length})`)
    ),

    list.length === 0
      ? h('div', { className: 'text-center text-muted py-5' },
          h('i', { className: 'bi bi-people fs-1 d-block mb-2 opacity-25' }),
          h('p', null, search ? 'Không tìm thấy.' : 'Chưa có dữ liệu.'))
      : h('div', { className: 'row g-3' }, list.map(card))
  )
}
