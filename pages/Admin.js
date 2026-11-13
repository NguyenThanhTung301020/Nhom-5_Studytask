// pages/Admin.js – Bảng quản trị (chỉ Admin)
import { DEMO_ACCOUNTS, ROLES, PERMS, SAMPLE_SUBJECTS } from '../utils/constants.js'
import { isFirebaseReady, getAllUsers, adminUpdateUser } from '../utils/firebase.js'
import AccountManager from '../components/AccountManager.js'
import GradeBook      from '../components/GradeBook.js'
import { summarizeSystem } from '../utils/systemStats.js'
import { todayISO } from '../utils/tuition.js'
import { classCatalog, semesterLabel, sortBySemester, termLabel } from '../utils/scope.js'

const { useState, useEffect, useMemo, createElement: h } = window.React

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
// Môn nhóm theo học kỳ. Với giáo viên, mỗi môn đã chọn còn gán được LỚP HỌC PHẦN (lớp + môn) đảm nhận:
// cùng một môn mở ở nhiều lớp, giáo viên chỉ thấy lịch/báo cáo của các lớp được gán (utils/scope.js).
function SubjectAssignPanel({ user, subjects, classes = [], onSave, saving }) {
  const isTeacher = user.role === 'teacher'
  const [ids, setIds] = useState(user.subjectIds || [])
  const [secs, setSecs] = useState(Array.isArray(user.sections) ? user.sections : null)   // null = hồ sơ chưa phân theo lớp
  const toggle = (id) => {
    setIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    if (ids.includes(id)) setSecs(prev => prev && prev.filter(s => s.subjectId !== id))          // bỏ môn thì bỏ luôn các lớp của môn
  }
  const hasSec = (classId, subjectId) => (secs || []).some(s => s.classId === classId && s.subjectId === subjectId)
  const toggleSec = (classId, subjectId) => setSecs(prev => {
    const cur = prev || []
    return cur.some(s => s.classId === classId && s.subjectId === subjectId)
      ? cur.filter(s => !(s.classId === classId && s.subjectId === subjectId)) : [...cur, { classId, subjectId }]
  })
  const sameSecs = JSON.stringify((secs || []).map(s => s.classId + '|' + s.subjectId).sort()) === JSON.stringify((user.sections || []).map(s => s.classId + '|' + s.subjectId).sort())
  const changed = JSON.stringify(ids.slice().sort()) !== JSON.stringify((user.subjectIds || []).slice().sort()) || (isTeacher && !sameSecs)
  const groups = []
  sortBySemester(subjects).forEach(s => {
    let g = groups.find(x => x.k === (s.hocKy || 0))
    if (!g) { g = { k: s.hocKy || 0, items: [] }; groups.push(g) }
    g.items.push(s)
  })
  const classesOf = (subjectId) => classes.filter(c => c.subjectIds.has(subjectId)).sort((a, b) => a.name.localeCompare(b.name))
  const reset = () => { setIds(user.subjectIds || []); setSecs(Array.isArray(user.sections) ? user.sections : null) }

  return h('div', { className: 'mt-3 p-3 rounded-3', style: { background: 'rgba(0,0,0,.02)' } },
    h('div', { className: 'fw-semibold small mb-2', style: { color: 'var(--primary)' } },
      h('i', { className: 'bi bi-journal-check me-1' }),
      isTeacher ? 'Môn đảm nhiệm giảng dạy (theo học kỳ):' : 'Môn học đăng ký (theo học kỳ):'
    ),
    groups.map(g => h('div', { key: g.k, className: 'mb-2' },
      groups.length > 1 && h('div', { className: 'small text-muted fw-semibold mb-1' }, g.k ? termLabel(g.k) : 'Chưa gắn học kỳ'),
      h('div', { className: 'd-flex flex-wrap gap-2' },
        g.items.map(s =>
          h('label', {
            key: s.id,
            className: `subject-assign-chip${ids.includes(s.id) ? ' active' : ''}`,
            style: ids.includes(s.id) ? { borderColor: s.color, backgroundColor: s.color + '18', color: s.color } : {},
            onClick: () => toggle(s.id),
          },
            h('div', { style: { width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 } }),
            s.code ? `${s.name} (${s.code})` : s.name
          )
        )
      )
    )),
    // Giáo viên: chọn lớp học phần cho từng môn đã gán
    isTeacher && ids.length > 0 && h('div', { className: 'mt-3 pt-3 border-top' },
      h('div', { className: 'fw-semibold small mb-1', style: { color: 'var(--primary)' } }, h('i', { className: 'bi bi-people me-1' }), 'Lớp học phần đảm nhiệm:'),
      secs === null && h('div', { className: 'small text-muted mb-2' }, 'Chưa phân theo lớp: giáo viên thấy lịch của mọi lớp học các môn trên. Chọn lớp bên dưới để giới hạn.'),
      sortBySemester(subjects.filter(s => ids.includes(s.id))).map(s => {
        const cl = classesOf(s.id)
        return h('div', { key: s.id, className: 'mb-2' },
          h('div', { className: 'small fw-semibold' }, s.name, s.hocKy ? h('span', { className: 'text-muted fw-normal' }, ` · ${semesterLabel(s)}`) : null,
            h('span', { className: 'text-muted fw-normal' }, cl.length ? ` · ${(secs || []).filter(x => x.subjectId === s.id).length}/${cl.length} lớp` : ' · chưa có lớp nào học môn này')),
          cl.length > 0 && h('div', { className: 'd-flex flex-wrap gap-1 mt-1' },
            cl.map(c => h('button', { key: c.id, type: 'button',
              className: `btn btn-sm ${hasSec(c.id, s.id) ? 'btn-primary' : 'btn-outline-secondary'}`, style: { fontSize: '0.75rem', padding: '1px 8px' },
              onClick: () => toggleSec(c.id, s.id) }, c.name)))
        )
      })
    ),
    changed && h('div', { className: 'd-flex gap-2 mt-3' },
      h('button', { className: 'btn btn-sm btn-primary', disabled: saving,
          onClick: () => onSave(user.uid, ids, isTeacher && secs !== null ? { sections: secs } : {}) },
        saving
          ? h(window.React.Fragment, null, h('span', { className: 'spinner-border spinner-border-sm me-1' }), 'Đang lưu…')
          : h(window.React.Fragment, null, h('i', { className: 'bi bi-cloud-upload me-1' }), 'Lưu phân công')
      ),
      h('button', { className: 'btn btn-sm btn-outline-secondary', onClick: reset }, 'Hủy')
    ),
    !changed && h('small', { className: 'text-muted' },
      ids.length === 0
        ? h(window.React.Fragment, null, h('i', { className: 'bi bi-exclamation-circle me-1 text-warning' }), 'Chưa được phân công môn nào')
        : h(window.React.Fragment, null, h('i', { className: 'bi bi-check-circle me-1 text-success' }),
            `${ids.length} môn đã phân công` + (isTeacher && secs ? `, ${secs.length} lớp học phần` : ''))
    )
  )
}

// ── Danh sách người dùng ─────────────────────────────────────────
function UserList({ subjects, onUpdateSubjects }) {
  const [users,    setUsers]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [saving,   setSaving]   = useState(null)
  // Hàng nghìn tài khoản: lọc theo vai trò (mặc định giáo viên vì đây là nơi phân công), tìm kiếm và phân trang
  const [roleF,    setRoleF]    = useState('teacher')
  const [q,        setQ]        = useState('')
  const [limit,    setLimit]    = useState(30)

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

  const classList = useMemo(() => [...classCatalog(users).values()], [users])
  const roleMatch = (k) => (u) => k === 'all' || (k === 'staff' ? ['training', 'finance'].includes(u.role) : u.role === k)
  const needle = q.trim().toLowerCase()
  const shown = users.filter(roleMatch(roleF)).filter(u => !needle || (u.name || '').toLowerCase().includes(needle) || (u.username || '').toLowerCase().includes(needle))

  const handleSave = async (targetUid, newSubjectIds, extra = {}) => {
    setSaving(targetUid)
    try {
      if (isFirebaseReady()) {
        await adminUpdateUser(targetUid, { subjectIds: newSubjectIds, ...extra })     // extra: { sections } với giáo viên phân theo lớp
      }
      setUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, subjectIds: newSubjectIds, ...extra } : u))
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
      : 'Chế độ demo – kết nối máy chủ để quản lý người dùng thực'
  )

  return h('div', { className: 'd-flex flex-column gap-3' },
    !isFirebaseReady() && h('div', { className: 'alert alert-info small py-2 mb-0' },
      h('i', { className: 'bi bi-info-circle me-1' }),
      'Đang xem tài khoản demo. Kết nối máy chủ để quản lý người dùng thực.'
    ),
    h('div', { className: 'd-flex flex-wrap align-items-center gap-2' },
      [['teacher', 'Giáo viên'], ['student', 'Sinh viên'], ['staff', 'Phòng ban'], ['all', 'Tất cả']].map(([k, label]) =>
        h('button', { key: k, className: `btn btn-sm ${roleF === k ? 'btn-primary' : 'btn-outline-secondary'}`, onClick: () => { setRoleF(k); setLimit(30) } },
          `${label} (${users.filter(roleMatch(k)).length.toLocaleString('vi-VN')})`)),
      h('input', { className: 'form-control form-control-sm', style: { maxWidth: 240 }, placeholder: 'Tìm theo tên hoặc tên đăng nhập…', value: q,
        onChange: e => { setQ(e.target.value); setLimit(30) } })
    ),
    shown.length === 0 && h('div', { className: 'text-center text-muted py-3 small' }, 'Không có tài khoản phù hợp.'),
    shown.slice(0, limit).map(user => {
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
            h('div', { className: 'small text-muted text-truncate' }, user.username),
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
          h(SubjectAssignPanel, { user, subjects, classes: classList, onSave: handleSave, saving: isSaving })
        )
      )
    }),
    shown.length > limit && h('button', { className: 'btn btn-outline-primary btn-sm align-self-center', onClick: () => setLimit(l => l + 50) },
      `Hiện thêm (còn ${(shown.length - limit).toLocaleString('vi-VN')} tài khoản)`)
  )
}

// ── Main Admin page ──────────────────────────────────────────────
export default function Admin({ subjects, deadlines, homeworks, onUpdateUserSubjects, allUsers = [], quizzes = [], fetchActivities,
                                schedule = [], exams = [], materials = [] }) {
  const [activeTab, setActiveTab] = useState('accounts')

  // Thống kê hệ thống: tải lại danh sách người dùng và nhật ký hoạt động từ máy chủ mỗi lần mở tab (không dùng bản nhớ tạm 5 phút của app)
  const [live, setLive] = useState({ users: null, activities: null, at: null, loading: false })
  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    if (activeTab !== 'stats') return
    let off = false
    setLive(p => ({ ...p, loading: true }))
    ;(async () => {
      let users = null, activities = []
      try { users = isFirebaseReady() ? await getAllUsers() : allUsers } catch (e) { console.warn('[Admin] getAllUsers:', e.message) }
      try { activities = (await fetchActivities?.()) || [] } catch (e) { console.warn('[Admin] fetchActivities:', e.message) }
      if (!off) setLive({ users: users && users.length ? users : null, activities, at: new Date(), loading: false })
    })()
    return () => { off = true }
  }, [activeTab, reloadKey])

  const stats = summarizeSystem({
    users: live.users || allUsers, subjects, schedule, exams, materials, quizzes, deadlines, homeworks,
    activities: live.activities || [], today: todayISO(),
  })
  const { accounts: acc, catalog: cat, quiz: qz } = stats
  const STAT_GROUPS = [
    { title: 'Tài khoản', items: [
      { label: 'Tổng tài khoản',        value: acc.total,             icon: 'people',          color: 'primary' },
      { label: 'Sinh viên',             value: acc.byRole.student,    icon: 'person-circle',   color: 'success' },
      { label: 'Giáo viên',             value: acc.byRole.teacher,    icon: 'person-workspace',color: 'primary' },
      { label: 'Quản trị & phòng ban',  value: acc.staff,             icon: 'shield-fill-check', color: 'danger' },
      { label: 'Giáo viên chưa phân công môn', value: acc.teachersWithoutSubjects, icon: 'exclamation-circle', color: acc.teachersWithoutSubjects ? 'warning' : 'success' },
      { label: 'Sinh viên chưa có môn', value: acc.studentsWithoutSubjects, icon: 'exclamation-circle', color: acc.studentsWithoutSubjects ? 'warning' : 'success' },
      { label: 'Tài khoản hết hạn',     value: acc.expired,           icon: 'clock-history',   color: acc.expired ? 'danger' : 'success' },
    ] },
    { title: 'Học vụ', items: [
      { label: 'Môn học',      value: cat.subjects,  icon: 'book',            color: 'primary' },
      { label: 'Buổi học (thời khóa biểu)', value: cat.schedule, icon: 'calendar-week', color: 'info' },
      { label: 'Lịch thi',     value: cat.exams,     icon: 'calendar-check',  color: 'info' },
      { label: 'Tài liệu',     value: cat.materials, icon: 'journal-bookmark',color: 'primary' },
      { label: 'Đề trắc nghiệm', value: `${cat.quizzes.active} mở / ${cat.quizzes.total}`, icon: 'patch-question', color: 'warning' },
      { label: 'Bài tập',      value: cat.homeworks, icon: 'journal-text',    color: 'primary' },
      { label: 'Deadline (xong / quá hạn)', value: `${cat.deadlines.done} / ${cat.deadlines.overdue} trên ${cat.deadlines.total}`, icon: 'clock', color: cat.deadlines.overdue ? 'danger' : 'success' },
    ] },
    { title: 'Trắc nghiệm toàn hệ thống', items: [
      { label: 'Lượt làm bài', value: qz.attempts, icon: 'check2-square', color: 'success' },
      { label: 'Điểm trung bình', value: qz.avgScore == null ? '—' : `${qz.avgScore}/10`, icon: 'star-fill', color: 'warning' },
    ] },
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
      h('div', { className: 'd-flex align-items-center gap-2 mb-3 flex-wrap' },
        h('button', { className: 'btn btn-sm btn-outline-primary', disabled: live.loading, onClick: () => setReloadKey(k => k + 1) },
          h('i', { className: 'bi bi-arrow-clockwise me-1' }), live.loading ? 'Đang tải…' : 'Làm mới'),
        h('small', { className: 'text-muted' },
          live.at ? `Số liệu từ máy chủ, cập nhật lúc ${live.at.toLocaleTimeString('vi-VN')}` : 'Đang tải số liệu từ máy chủ…')
      ),
      STAT_GROUPS.map(g =>
        h('div', { key: g.title, className: 'mb-4' },
          h('h6', { className: 'fw-bold text-muted small text-uppercase mb-2' }, g.title),
          h('div', { className: 'row g-3' },
            g.items.map(s =>
              h('div', { key: s.label, className: 'col-6 col-md-3' },
                h('div', { className: 'card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-3 h-100' },
                  h('div', { className: `admin-stat-icon text-${s.color}`,
                      style: { backgroundColor: `rgba(0,0,0,.04)` } },
                    h('i', { className: `bi bi-${s.icon}` })
                  ),
                  h('div', null,
                    h('div', { className: 'fw-bold fs-5 lh-1' }, typeof s.value === 'number' ? s.value.toLocaleString('vi-VN') : s.value),
                    h('div', { className: 'text-muted small' }, s.label)
                  )
                )
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
              h('div', { className: 'fw-bold mb-1' }, 'Phân quyền do máy chủ kiểm soát'),
              h('p', { className: 'text-muted small mb-0' },
                'Quyền đọc/ghi được kiểm tra ở máy chủ (hàm can() trong server/studytask_api.py, theo đặc tả firestore.rules) và có kiểm thử tự động. ',
                'Sinh viên và giáo viên chỉ tự sửa được email và số điện thoại; họ tên, vai trò, môn học, hạn tài khoản do Admin cấp.'
              )
            )
          )
        )
      )
    )
  )
}
