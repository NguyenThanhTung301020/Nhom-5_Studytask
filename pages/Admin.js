// pages/Admin.js – Bảng quản trị (chỉ Admin)
import { DEMO_ACCOUNTS, ROLES, PERMS, SAMPLE_SUBJECTS } from '../utils/constants.js'
import { isFirebaseReady, getAllUsers, adminUpdateUser } from '../utils/firebase.js'
import AccountManager from '../components/AccountManager.js'
import GradeBook      from '../components/GradeBook.js'

const { useState, useEffect, createElement: h } = window.React

const PERM_ROWS = [
  { key: 'canEdit',          label: 'Thêm / Sửa nội dung',    icon: 'pencil-square'   },
  { key: 'canDelete',        label: 'Xóa dữ liệu',             icon: 'trash'            },
  { key: 'canGrade',         label: 'Chấm điểm bài tập',       icon: 'star-fill'        },
  { key: 'canManageLibrary', label: 'Quản lý Thư viện',        icon: 'journal-bookmark' },
  { key: 'canManageUsers',   label: 'Quản lý người dùng',      icon: 'people-fill'      },
]

function RoleBadge({ role }) {
  const r = ROLES[role]
  if (!r) return null
  return h('span', { className: `role-badge role-badge-${role}` },
    h('i', { className: `bi bi-${r.icon} me-1` }), r.label)
}

function PermIcon({ value }) {
  return value
    ? h('i', { className: 'bi bi-check-circle-fill text-success fs-5' })
    : h('i', { className: 'bi bi-x-circle-fill text-danger fs-5', style: { opacity: 0.35 } })
}

// ── Panel gán môn học cho một user ──────────────────────────────
function SubjectAssignPanel({ user, subjects, onSave, saving }) {
  const [ids, setIds] = useState(user.subjectIds || [])
  const toggle = (id) => setIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const changed = JSON.stringify(ids.sort()) !== JSON.stringify((user.subjectIds || []).slice().sort())

  return h('div', { className: 'mt-3 p-3 rounded-3', style: { background: 'rgba(0,0,0,.02)' } },
    h('div', { className: 'fw-semibold small mb-2', style: { color: 'var(--primary)' } },
      h('i', { className: 'bi bi-journal-check me-1' }),
      user.role === 'teacher' ? 'Môn đảm nhiệm giảng dạy:' : 'Môn học đăng ký:'
    ),
    h('div', { className: 'd-flex flex-wrap gap-2 mb-3' },
      subjects.map(s =>
        h('label', {
          key: s.id,
          className: `subject-assign-chip${ids.includes(s.id) ? ' active' : ''}`,
          style: ids.includes(s.id) ? { borderColor: s.color, backgroundColor: s.color + '18', color: s.color } : {},
          onClick: () => toggle(s.id),
        },
          h('div', { style: { width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 } }),
          s.name
        )
      )
    ),
    changed && h('div', { className: 'd-flex gap-2' },
      h('button', { className: 'btn btn-sm btn-primary', disabled: saving,
          onClick: () => onSave(user.uid, ids) },
        saving
          ? h(window.React.Fragment, null, h('span', { className: 'spinner-border spinner-border-sm me-1' }), 'Đang lưu…')
          : h(window.React.Fragment, null, h('i', { className: 'bi bi-cloud-upload me-1' }), 'Lưu phân công')
      ),
      h('button', { className: 'btn btn-sm btn-outline-secondary', onClick: () => setIds(user.subjectIds || []) }, 'Hủy')
    ),
    !changed && h('small', { className: 'text-muted' },
      ids.length === 0
        ? h(window.React.Fragment, null, h('i', { className: 'bi bi-exclamation-circle me-1 text-warning' }), 'Chưa được phân công môn nào')
        : h(window.React.Fragment, null, h('i', { className: 'bi bi-check-circle me-1 text-success' }), `${ids.length} môn đã phân công`)
    )
  )
}

// ── Danh sách người dùng ─────────────────────────────────────────
function UserList({ subjects, onUpdateSubjects }) {
  const [users,    setUsers]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [saving,   setSaving]   = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      if (isFirebaseReady()) {
        const list = await getAllUsers()
        setUsers(list.filter(u => u.role !== 'admin'))
      } else {
        // Demo mode: dùng DEMO_ACCOUNTS (không có admin)
        setUsers(DEMO_ACCOUNTS.filter(u => u.role !== 'admin').map(u => ({ ...u, uid: u.id })))
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (targetUid, newSubjectIds) => {
    setSaving(targetUid)
    try {
      if (isFirebaseReady()) {
        await adminUpdateUser(targetUid, { subjectIds: newSubjectIds })
      }
      setUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, subjectIds: newSubjectIds } : u))
    } catch (e) {
      alert('Lưu thất bại: ' + e.message)
    }
    setSaving(null)
    if (onUpdateSubjects) onUpdateSubjects(targetUid, newSubjectIds)
  }

  if (loading) return h('div', { className: 'text-center py-4' },
    h('div', { className: 'spinner-border spinner-border-sm text-primary me-2' }),
    h('span', { className: 'text-muted small' }, 'Đang tải danh sách người dùng…')
  )

  if (users.length === 0) return h('div', { className: 'text-center text-muted py-4 small' },
    h('i', { className: 'bi bi-people fs-2 d-block mb-2 opacity-25' }),
    isFirebaseReady()
      ? 'Chưa có người dùng nào trong hệ thống'
      : 'Chế độ demo – kết nối Firebase để quản lý người dùng thực'
  )

  return h('div', { className: 'd-flex flex-column gap-3' },
    !isFirebaseReady() && h('div', { className: 'alert alert-info small py-2 mb-0' },
      h('i', { className: 'bi bi-info-circle me-1' }),
      'Đang xem tài khoản demo. Kết nối Firebase để quản lý người dùng thực.'
    ),
    users.map(user => {
      const role    = ROLES[user.role]
      const isOpen  = expanded === user.uid
      const isSaving = saving === user.uid

      return h('div', { key: user.uid, className: 'card border-0 shadow-sm overflow-hidden' },
        h('div', { className: 'admin-user-row d-flex align-items-center gap-3 p-3 cursor-pointer',
            onClick: () => setExpanded(isOpen ? null : user.uid) },
          h('div', { className: 'admin-user-avatar flex-shrink-0', style: { backgroundColor: (role?.color || '#aaa') + '22', color: role?.color || '#aaa' } },
            h('i', { className: `bi bi-${role?.icon || 'person'} fs-5` })
          ),
          h('div', { className: 'flex-grow-1 min-w-0' },
            h('div', { className: 'fw-semibold' }, user.name || '(Chưa đặt tên)'),
            h('div', { className: 'small text-muted text-truncate' }, user.email),
            h('div', { className: 'd-flex gap-2 align-items-center mt-1 flex-wrap' },
              h(RoleBadge, { role: user.role }),
              (user.subjectIds || []).length > 0
                ? h('span', { className: 'badge bg-light text-dark border small' },
                    h('i', { className: 'bi bi-book me-1' }), `${(user.subjectIds || []).length} môn`)
                : h('span', { className: 'badge bg-warning-subtle text-warning border-warning border small' },
                    h('i', { className: 'bi bi-exclamation me-1' }), 'Chưa phân công')
            )
          ),
          h('i', { className: `bi bi-chevron-${isOpen ? 'up' : 'down'} text-muted flex-shrink-0` })
        ),
        isOpen && h('div', { className: 'border-top px-3 pb-3' },
          h(SubjectAssignPanel, { user, subjects, onSave: handleSave, saving: isSaving })
        )
      )
    })
  )
}

// ── Main Admin page ──────────────────────────────────────────────
export default function Admin({ subjects, deadlines, homeworks, onUpdateUserSubjects, allUsers = [], quizzes = [], fetchActivities }) {
  const [activeTab, setActiveTab] = useState('accounts')

  const totalDone    = deadlines.filter(d => d.status === 'completed').length
  const totalOverdue = deadlines.filter(d => d.status !== 'completed' && new Date(d.dueDate) < new Date()).length
  const totalHwDone  = homeworks.filter(hw => hw.status === 'completed').length
  const quizScores   = homeworks.filter(hw => hw.type === 'quiz' && hw.score != null).map(hw => hw.score)
  const avgQuiz      = quizScores.length ? (quizScores.reduce((a, b) => a + b, 0) / quizScores.length).toFixed(1) : '—'

  const SYSTEM_STATS = [
    { label: 'Môn học',          value: subjects.length,   icon: 'book',              color: 'primary' },
    { label: 'Tổng deadline',    value: deadlines.length,  icon: 'clock',             color: 'info'    },
    { label: 'Deadline xong',    value: totalDone,         icon: 'check-circle',      color: 'success' },
    { label: 'Deadline quá hạn', value: totalOverdue,      icon: 'exclamation-circle',color: 'danger'  },
    { label: 'Bài tập',          value: homeworks.length,  icon: 'journal-text',      color: 'primary' },
    { label: 'Bài tập xong',     value: totalHwDone,       icon: 'journal-check',     color: 'success' },
    { label: 'Tài khoản',        value: DEMO_ACCOUNTS.length, icon: 'people',         color: 'warning' },
    { label: 'Điểm quiz TB',     value: avgQuiz === '—' ? avgQuiz : `${avgQuiz}/10`, icon: 'star-fill', color: 'warning' },
  ]

  const TABS = [
    { key: 'accounts', label: 'Quản lý tài khoản',       icon: 'person-badge'   },
    { key: 'grades',   label: 'Bảng điểm',               icon: 'card-checklist' },
    { key: 'users',    label: 'Phân công môn học',       icon: 'people-fill'    },
    { key: 'perms',    label: 'Ma trận phân quyền',       icon: 'table'          },
    { key: 'stats',    label: 'Thống kê hệ thống',        icon: 'bar-chart-fill' },
  ]

  return h('div', { className: 'container-fluid py-4' },

    // ── Header ──
    h('div', { className: 'd-flex align-items-center gap-3 mb-4' },
      h('div', { className: 'admin-header-icon' }, h('i', { className: 'bi bi-shield-fill-check' })),
      h('div', null,
        h('h4', { className: 'fw-bold mb-0' }, 'Bảng quản trị'),
        h('small', { className: 'text-muted' }, 'Phân công môn học, quản lý người dùng và thống kê hệ thống')
      )
    ),

    // ── Tabs ──
    h('div', { className: 'd-flex gap-2 mb-4 flex-wrap' },
      TABS.map(t =>
        h('button', { key: t.key,
            className: `btn btn-sm ${activeTab === t.key ? 'btn-primary' : 'btn-outline-secondary'}`,
            onClick: () => setActiveTab(t.key) },
          h('i', { className: `bi bi-${t.icon} me-1` }), t.label
        )
      )
    ),

    // ── Tab: Quản lý tài khoản ──
    activeTab === 'accounts' && h('div', { className: 'card border-0 shadow-sm' },
      h('div', { className: 'card-header bg-transparent border-0 pt-4 pb-2 px-4' },
        h('h6', { className: 'fw-bold mb-0' },
          h('i', { className: 'bi bi-person-badge me-2', style: { color: 'var(--primary)' } }),
          'Quản lý tài khoản người dùng'
        ),
        h('small', { className: 'text-muted' }, 'Thêm, sửa, đặt lại mật khẩu, xóa tài khoản & tài khoản quá hạn')
      ),
      h('div', { className: 'card-body px-4 pb-4 pt-2' },
        h(AccountManager, { subjects })
      )
    ),

    // ── Tab: Bảng điểm ──
    activeTab === 'grades' && h('div', { className: 'card border-0 shadow-sm' },
      h('div', { className: 'card-header bg-transparent border-0 pt-4 pb-2 px-4' },
        h('h6', { className: 'fw-bold mb-0' },
          h('i', { className: 'bi bi-card-checklist me-2', style: { color: 'var(--primary)' } }),
          'Bảng điểm sinh viên'
        ),
        h('small', { className: 'text-muted' }, 'Xem & xuất bảng điểm tất cả các môn, cập nhật điểm nếu có sai sót')
      ),
      h('div', { className: 'card-body px-4 pb-4 pt-2' },
        h(GradeBook, { subjects, allUsers, quizzes, homeworks, fetchActivities })
      )
    ),

    // ── Tab: Phân công môn học ──
    activeTab === 'users' && h('div', null,
      h('div', { className: 'card border-0 shadow-sm' },
        h('div', { className: 'card-header bg-transparent border-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center' },
          h('h6', { className: 'fw-bold mb-0' },
            h('i', { className: 'bi bi-people-fill me-2', style: { color: 'var(--primary)' } }),
            'Quản lý phân công môn học'
          ),
          h('small', { className: 'text-muted' }, 'Nhấn vào người dùng để gán / hủy môn')
        ),
        h('div', { className: 'card-body px-4 pb-4 pt-2' },
          h(UserList, { subjects, onUpdateSubjects: onUpdateUserSubjects })
        )
      )
    ),

    // ── Tab: Phân quyền ──
    activeTab === 'perms' && h('div', { className: 'card border-0 shadow-sm' },
      h('div', { className: 'card-header bg-transparent border-0 pt-4 pb-2 px-4' },
        h('h6', { className: 'fw-bold mb-0' },
          h('i', { className: 'bi bi-table me-2', style: { color: 'var(--primary)' } }), 'Ma trận phân quyền')
      ),
      h('div', { className: 'card-body px-4 pb-4 pt-2' },
        h('div', { className: 'table-responsive' },
          h('table', { className: 'table table-borderless align-middle mb-0' },
            h('thead', null,
              h('tr', { className: 'border-bottom' },
                h('th', { className: 'text-muted small fw-semibold pb-3' }, 'Quyền hạn'),
                ...Object.keys(ROLES).map(r =>
                  h('th', { key: r, className: 'text-center pb-3' },
                    h('div', { className: 'd-flex flex-column align-items-center gap-1' },
                      h('i', { className: `bi bi-${ROLES[r].icon} fs-5`, style: { color: ROLES[r].color } }),
                      h('span', { className: 'small fw-semibold', style: { color: ROLES[r].color } }, ROLES[r].label)
                    )
                  )
                )
              )
            ),
            h('tbody', null,
              PERM_ROWS.map(row =>
                h('tr', { key: row.key, className: 'border-bottom' },
                  h('td', { className: 'py-3' },
                    h('span', { className: 'small' },
                      h('i', { className: `bi bi-${row.icon} me-2 text-muted` }), row.label)
                  ),
                  ...Object.keys(ROLES).map(r =>
                    h('td', { key: r, className: 'text-center py-3' },
                      h(PermIcon, { value: PERMS[r][row.key] })
                    )
                  )
                )
              )
            )
          )
        ),
        h('div', { className: 'alert alert-info mt-4 mb-0 small py-2' },
          h('i', { className: 'bi bi-info-circle me-1' }),
          'Ngoài phân quyền theo vai trò, giáo viên và sinh viên chỉ thấy dữ liệu của môn học được phân công.'
        )
      )
    ),

    // ── Tab: Thống kê ──
    activeTab === 'stats' && h('div', null,
      h('div', { className: 'row g-3 mb-4' },
        SYSTEM_STATS.map(s =>
          h('div', { key: s.label, className: 'col-6 col-md-3' },
            h('div', { className: 'card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-3' },
              h('div', { className: `admin-stat-icon text-${s.color}`,
                  style: { backgroundColor: `rgba(0,0,0,.04)` } },
                h('i', { className: `bi bi-${s.icon}` })
              ),
              h('div', null,
                h('div', { className: 'fw-bold fs-5 lh-1' }, s.value),
                h('div', { className: 'text-muted small' }, s.label)
              )
            )
          )
        )
      ),
      h('div', { className: 'card border-0 shadow-sm', style: {
          background: 'linear-gradient(135deg, rgba(255,168,0,.06) 0%, rgba(255,87,34,.06) 100%)',
          borderLeft: '4px solid #f6c23e' } },
        h('div', { className: 'card-body py-3 px-4' },
          h('div', { className: 'd-flex align-items-center gap-3' },
            h('i', { className: 'bi bi-fire fs-2', style: { color: '#f6a623' } }),
            h('div', null,
              h('div', { className: 'fw-bold mb-1' }, 'Firestore Rules được quản lý trong mã nguồn'),
              h('p', { className: 'text-muted small mb-0' },
                'Rules nằm ở tệp firestore.rules trong repo và có kiểm thử tự động (npm run test:rules). ',
                'Người dùng chỉ tự sửa được tên và số điện thoại; vai trò, môn học, hạn tài khoản chỉ admin sửa.'
              )
            )
          )
        )
      )
    )
  )
}
