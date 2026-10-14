// pages/Profile.js – Hồ sơ người dùng (role-aware)
import { DEFAULT_PROFILE, DEFAULT_TEACHER_PROFILE, DEFAULT_ADMIN_PROFILE, ROLES } from '../utils/constants.js'
import { isFirebaseReady, changeOwnPassword, sendEmailVerify, isEmailVerified } from '../utils/firebase.js'

const { useState, useEffect, createElement: h } = window.React

// ─── Card xác thực email ─────────────────────────────────────────
function EmailVerifyCard({ uid, email }) {
  const fb = isFirebaseReady()
  const verified = fb && isEmailVerified()
  const [msg,  setMsg]  = useState(null)
  const [busy, setBusy] = useState(false)
  const send = async () => {
    setBusy(true); setMsg(null)
    try { await sendEmailVerify(); setMsg({ type: 'ok', text: 'Đã gửi email xác thực. Kiểm tra hộp thư rồi đăng nhập lại để cập nhật trạng thái.' }) }
    catch (e) { setMsg({ type: 'err', text: e.message }) }
    setBusy(false)
  }
  return h('div', { className: 'card border-0 shadow-sm p-3 mt-3' },
    h('div', { className: 'fw-bold small mb-2', style: { color: 'var(--primary)' } },
      h('i', { className: 'bi bi-patch-check me-1' }), 'Xác thực tài khoản'),
    h('div', { className: 'd-flex align-items-center justify-content-between mb-2' },
      h('span', { className: 'small text-muted text-truncate me-2' }, h('i', { className: 'bi bi-envelope me-1' }), email),
      verified
        ? h('span', { className: 'badge bg-success-subtle text-success flex-shrink-0' }, h('i', { className: 'bi bi-check-circle-fill me-1' }), 'Đã xác thực')
        : h('span', { className: 'badge bg-warning-subtle text-warning flex-shrink-0' }, h('i', { className: 'bi bi-exclamation-circle me-1' }), 'Chưa xác thực')
    ),
    !fb
      ? h('div', { className: 'small text-muted' }, 'Chế độ demo: cần Firebase để xác thực.')
      : !uid
        ? null
        : !verified && h(window.React.Fragment, null,
            h('button', { className: 'btn btn-outline-primary btn-sm w-100', disabled: busy, onClick: send },
              busy ? h('span', { className: 'spinner-border spinner-border-sm' }) : h(window.React.Fragment, null, h('i', { className: 'bi bi-envelope-check me-1' }), 'Gửi email xác thực')),
            h('div', { className: 'form-text mt-1' }, 'Xác thực email để có thể tự đặt lại mật khẩu khi quên.')
          ),
    msg && h('div', { className: `small mt-2 text-${msg.type === 'ok' ? 'success' : 'danger'}` },
      h('i', { className: `bi bi-${msg.type === 'ok' ? 'check-circle' : 'x-circle'} me-1` }), msg.text)
  )
}

// ─── Card đổi mật khẩu đăng nhập của chính mình ──────────────────
function PasswordChangeCard({ uid }) {
  const [open, setOpen]   = useState(false)
  const [cur,  setCur]    = useState('')
  const [pw1,  setPw1]    = useState('')
  const [pw2,  setPw2]    = useState('')
  const [msg,  setMsg]    = useState(null)   // {type, text}
  const [busy, setBusy]   = useState(false)
  const fb = isFirebaseReady()

  const reset = () => { setCur(''); setPw1(''); setPw2(''); setMsg(null) }
  const valid = cur && pw1.length >= 6 && pw1 === pw2

  const submit = async () => {
    if (!valid) return
    setBusy(true); setMsg(null)
    try {
      await changeOwnPassword(cur, pw1)
      setMsg({ type: 'ok', text: 'Đổi mật khẩu thành công!' })
      setCur(''); setPw1(''); setPw2('')
    } catch (e) {
      const t = (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') ? 'Mật khẩu hiện tại không đúng.'
              : e.code === 'auth/weak-password' ? 'Mật khẩu mới quá yếu (tối thiểu 6 ký tự).'
              : e.message
      setMsg({ type: 'error', text: t })
    }
    setBusy(false)
  }

  return h('div', { className: 'card border-0 shadow-sm p-3 mt-3' },
    h('button', { className: 'btn btn-link p-0 text-decoration-none d-flex align-items-center justify-content-between w-100',
        onClick: () => { setOpen(o => !o); reset() } },
      h('span', { className: 'fw-bold small', style: { color: 'var(--primary)' } },
        h('i', { className: 'bi bi-shield-lock me-1' }), 'Đổi mật khẩu đăng nhập'),
      h('i', { className: `bi bi-chevron-${open ? 'up' : 'down'} text-muted` })
    ),
    open && h('div', { className: 'mt-3' },
      !fb
        ? h('div', { className: 'alert alert-secondary small py-2 mb-0' },
            h('i', { className: 'bi bi-info-circle me-1' }), 'Chế độ demo: cần kết nối Firebase để đổi mật khẩu thật.')
        : !uid
          ? h('div', { className: 'alert alert-secondary small py-2 mb-0' }, 'Bạn cần đăng nhập để đổi mật khẩu.')
          : h(window.React.Fragment, null,
              h('input', { type: 'password', className: 'form-control form-control-sm mb-2', placeholder: 'Mật khẩu hiện tại', value: cur, onChange: e => setCur(e.target.value) }),
              h('input', { type: 'password', className: 'form-control form-control-sm mb-2', placeholder: 'Mật khẩu mới (≥ 6 ký tự)', value: pw1, onChange: e => setPw1(e.target.value) }),
              h('input', { type: 'password', className: 'form-control form-control-sm mb-2', placeholder: 'Nhập lại mật khẩu mới', value: pw2, onChange: e => setPw2(e.target.value) }),
              pw2 && pw1 !== pw2 && h('div', { className: 'small text-danger mb-2' }, 'Mật khẩu nhập lại không khớp.'),
              msg && h('div', { className: `small mb-2 text-${msg.type === 'ok' ? 'success' : 'danger'}` },
                h('i', { className: `bi bi-${msg.type === 'ok' ? 'check-circle' : 'x-circle'} me-1` }), msg.text),
              h('button', { className: 'btn btn-primary btn-sm w-100', disabled: !valid || busy, onClick: submit },
                busy ? h(window.React.Fragment, null, h('span', { className: 'spinner-border spinner-border-sm me-1' }), 'Đang đổi…')
                     : 'Cập nhật mật khẩu')
            )
    )
  )
}

// ─── Cấu hình trường theo role ──────────────────────────────────
const STUDENT_FIELDS = [
  { key: 'studentId', label: 'Mã số sinh viên', icon: 'person-badge',  type: 'text',  placeholder: 'VD: 2021001234' },
  { key: 'faculty',   label: 'Khoa / Bộ môn',   icon: 'building',      type: 'text',  placeholder: 'VD: Công nghệ thông tin' },
  { key: 'major',     label: 'Ngành học',         icon: 'mortarboard',   type: 'text',  placeholder: 'VD: Kỹ thuật phần mềm' },
  { key: 'className', label: 'Lớp',               icon: 'people',        type: 'text',  placeholder: 'VD: KTPM2021A' },
  { key: 'semester',  label: 'Học kỳ hiện tại',  icon: 'calendar3',     type: 'text',  placeholder: 'VD: HK2 2025–2026' },
  { key: 'gpa',       label: 'GPA tích lũy',      icon: 'graph-up',      type: 'text',  placeholder: 'VD: 3.20' },
  { key: 'email',     label: 'Email',             icon: 'envelope',      type: 'email', placeholder: 'email@example.com' },
  { key: 'phone',     label: 'Số điện thoại',     icon: 'telephone',     type: 'tel',   placeholder: '09xxxxxxxx' },
]

const TEACHER_FIELDS = [
  { key: 'teacherId',  label: 'Mã giáo viên',   icon: 'person-badge',    type: 'text',  placeholder: 'VD: GV0042' },
  { key: 'faculty',    label: 'Khoa / Trường',   icon: 'building',        type: 'text',  placeholder: 'VD: Khoa CNTT' },
  { key: 'department', label: 'Bộ môn',           icon: 'diagram-3',       type: 'text',  placeholder: 'VD: Bộ môn KTPM' },
  { key: 'position',   label: 'Học hàm / Chức vụ', icon: 'award',         type: 'text',  placeholder: 'VD: Tiến sĩ, Giảng viên chính' },
  { key: 'email',      label: 'Email',            icon: 'envelope',        type: 'email', placeholder: 'email@example.com' },
  { key: 'phone',      label: 'Số điện thoại',    icon: 'telephone',       type: 'tel',   placeholder: '09xxxxxxxx' },
]

const ADMIN_FIELDS = [
  { key: 'department', label: 'Phòng / Ban',     icon: 'building',   type: 'text',  placeholder: 'VD: Phòng Đào tạo' },
  { key: 'email',      label: 'Email',           icon: 'envelope',   type: 'email', placeholder: 'email@example.com' },
  { key: 'phone',      label: 'Số điện thoại',   icon: 'telephone',  type: 'tel',   placeholder: '09xxxxxxxx' },
]

const ROLE_CONFIG = {
  student: { fields: STUDENT_FIELDS, title: 'Hồ sơ sinh viên',   icon: 'person-circle', default: DEFAULT_PROFILE },
  teacher: { fields: TEACHER_FIELDS, title: 'Hồ sơ giáo viên',   icon: 'person-workspace', default: DEFAULT_TEACHER_PROFILE },
  admin:   { fields: ADMIN_FIELDS,   title: 'Hồ sơ quản trị',    icon: 'shield-fill-check', default: DEFAULT_ADMIN_PROFILE },
}

// ─── GPA badge ──────────────────────────────────────────────────
function GpaBadge({ gpa }) {
  const g = parseFloat(gpa)
  if (isNaN(g)) return null
  const color = g >= 3.6 ? '#1cc88a' : g >= 3.2 ? '#4e73df' : g >= 2.5 ? '#f6c23e' : '#e74a3b'
  const label = g >= 3.6 ? 'Xuất sắc' : g >= 3.2 ? 'Giỏi' : g >= 2.5 ? 'Khá' : 'Trung bình'
  return h('span', { className: 'badge ms-2 py-1 px-2',
    style: { backgroundColor: color + '22', color, border: `1px solid ${color}44`, fontSize: '0.7rem' } }, label)
}

// ─── Avatar initials ─────────────────────────────────────────────
function Avatar({ name, role }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
  const color = ROLES[role]?.color || '#4e73df'
  return h('div', { className: 'profile-avatar-circle mx-auto mb-3',
    style: { background: `linear-gradient(135deg, ${color}dd, ${color}88)` } }, initials)
}

// ─── Sync badge ──────────────────────────────────────────────────
function SyncBadge({ uid }) {
  if (!uid) return h('span', { className: 'badge bg-secondary-subtle text-secondary small' },
    h('i', { className: 'bi bi-hdd me-1' }), 'Lưu cục bộ')
  return h('span', { className: 'badge small', style: { backgroundColor: 'rgba(255,160,0,.15)', color: '#f6a623' } },
    h('i', { className: 'bi bi-fire me-1' }), 'Firebase')
}

// ─── Card thống kê sidebar ───────────────────────────────────────
function StatsPanel({ role, subjects, deadlines, homeworks }) {
  const totalDl  = deadlines.length
  const doneDl   = deadlines.filter(d => d.status === 'completed').length
  const overDl   = deadlines.filter(d => d.status !== 'completed' && new Date(d.dueDate) < new Date()).length
  const totalHw  = homeworks.length
  const doneHw   = homeworks.filter(h => h.status === 'completed').length
  const credits  = subjects.reduce((s, m) => s + (Number(m.credits) || 0), 0)
  const scores   = homeworks.filter(h => h.type === 'quiz' && h.score != null).map(h => h.score)
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null

  const studentStats = [
    { label: 'Môn học', value: subjects.length, icon: 'book', color: 'primary' },
    { label: 'Tín chỉ', value: credits, icon: 'award', color: 'info' },
    { label: 'Deadline', value: `${doneDl}/${totalDl}`, icon: 'check-circle', color: 'success' },
    { label: 'Quá hạn', value: overDl, icon: 'exclamation-triangle', color: 'danger' },
    { label: 'Bài tập', value: `${doneHw}/${totalHw}`, icon: 'journal-check', color: 'primary' },
    { label: 'Điểm TN TB', value: avgScore ? `${avgScore}/10` : '—', icon: 'star-fill', color: 'warning' },
  ]
  const teacherStats = [
    { label: 'Môn đảm nhiệm', value: subjects.length, icon: 'book', color: 'primary' },
    { label: 'Tín chỉ', value: credits, icon: 'award', color: 'info' },
    { label: 'Bài đã giao', value: totalHw, icon: 'journal-text', color: 'primary' },
    { label: 'Đã xong', value: doneHw, icon: 'journal-check', color: 'success' },
    { label: 'Deadline', value: `${doneDl}/${totalDl}`, icon: 'clock', color: 'info' },
    { label: 'Quá hạn', value: overDl, icon: 'exclamation-triangle', color: 'danger' },
  ]
  const adminStats = [
    { label: 'Môn học', value: subjects.length, icon: 'book', color: 'primary' },
    { label: 'Deadline', value: totalDl, icon: 'clock', color: 'info' },
    { label: 'Bài tập', value: totalHw, icon: 'journal-text', color: 'primary' },
    { label: 'Đã xong', value: doneDl, icon: 'check-circle', color: 'success' },
  ]
  const stats = role === 'student' ? studentStats : role === 'teacher' ? teacherStats : adminStats

  return h('div', { className: 'card border-0 shadow-sm p-3' },
    h('div', { className: 'fw-bold mb-3 small', style: { color: 'var(--primary)' } },
      h('i', { className: 'bi bi-graph-up me-1' }), 'Thống kê của tôi'),
    h('div', { className: 'd-flex flex-column gap-2' },
      stats.map(s =>
        h('div', { key: s.label, className: 'd-flex justify-content-between align-items-center py-1 border-bottom' },
          h('span', { className: 'small text-muted' }, h('i', { className: `bi bi-${s.icon} me-2 text-${s.color}` }), s.label),
          h('span', { className: `small fw-bold text-${s.color}` }, s.value)
        )
      )
    )
  )
}

// ─── Main Profile component ──────────────────────────────────────
export default function Profile({ profile, setProfile, onSave, subjects, deadlines, homeworks, user }) {
  const role     = user?.role || 'student'
  const cfg      = ROLE_CONFIG[role] || ROLE_CONFIG.student
  const roleInfo = ROLES[role] || ROLES.student

  const [editing, setEditing] = useState(false)
  const [form,    setForm]    = useState({ ...cfg.default, ...profile })
  const [saveMsg, setSaveMsg] = useState(null)

  // Sync form khi profile thay đổi từ Firebase
  useEffect(() => { setForm(prev => ({ ...cfg.default, ...profile })) }, [profile])

  const handleSave = async () => {
    setSaveMsg('saving')
    try {
      if (onSave) await onSave(form)
      else        setProfile(form)
      setEditing(false)
      setSaveMsg('ok')
      setTimeout(() => setSaveMsg(null), 3000)
    } catch (e) {
      setSaveMsg('error')
      setTimeout(() => setSaveMsg(null), 4000)
    }
  }

  const handleCancel = () => { setForm({ ...cfg.default, ...profile }); setEditing(false); setSaveMsg(null) }

  return h('div', { className: 'container-fluid py-4' },

    // ── Header ──
    h('div', { className: 'd-flex justify-content-between align-items-center mb-4' },
      h('h4', { className: 'fw-bold mb-0' },
        h('i', { className: `bi bi-${cfg.icon} me-2`, style: { color: roleInfo.color } }),
        cfg.title
      ),
      !editing && h('button', { className: 'btn btn-primary btn-sm', onClick: () => setEditing(true) },
        h('i', { className: 'bi bi-pencil me-1' }), 'Chỉnh sửa')
    ),

    h('div', { className: 'row g-4' },

      // ── Cột trái: Avatar card ──
      h('div', { className: 'col-12 col-md-4 col-lg-3' },
        h('div', { className: 'card border-0 shadow-sm text-center p-4 mb-4' },
          h(Avatar, { name: profile.name || user?.name, role }),

          // Tên – editable
          editing
            ? h('input', { className: 'form-control text-center fw-bold mb-2',
                value: form.name, placeholder: 'Họ và tên',
                onChange: e => setForm({ ...form, name: e.target.value }) })
            : h('h5', { className: 'fw-bold mb-1' }, profile.name || user?.name),

          // Subtitle theo role
          role === 'student' && h('p', { className: 'text-muted small mb-1' },
            h('i', { className: 'bi bi-mortarboard me-1' }), profile.major || 'Sinh viên'),
          role === 'teacher' && h('p', { className: 'text-muted small mb-1' },
            h('i', { className: 'bi bi-person-workspace me-1' }), profile.position || 'Giáo viên'),
          role === 'admin' && h('p', { className: 'text-muted small mb-1' },
            h('i', { className: 'bi bi-shield-fill-check me-1' }), profile.department || 'Quản trị viên'),

          role === 'student' && profile.semester &&
            h('span', { className: 'badge bg-light text-dark border small mb-2' },
              h('i', { className: 'bi bi-calendar3 me-1' }), profile.semester),

          role === 'student' && profile.gpa && h('div', { className: 'd-flex align-items-center justify-content-center gap-1 mt-1 mb-2' },
            h('span', { className: 'fw-bold fs-5', style: { color: 'var(--primary)' } }, 'GPA ', profile.gpa),
            h(GpaBadge, { gpa: profile.gpa })
          ),

          // Role badge
          h('div', { className: 'mt-2' },
            h('span', { className: `role-badge role-badge-${role}` },
              h('i', { className: `bi bi-${roleInfo.icon} me-1` }), roleInfo.label)
          ),

          h('div', { className: 'mt-3 border-top pt-3' },
            h(SyncBadge, { uid: user?.uid })
          )
        ),

        h(StatsPanel, { role, subjects, deadlines, homeworks }),

        // Xác thực email
        h(EmailVerifyCard, { uid: user?.uid, email: user?.email || profile.email }),

        // Đổi mật khẩu đăng nhập của chính mình
        h(PasswordChangeCard, { uid: user?.uid }),

        // Danh sách môn học phân quyền (cho teacher)
        role === 'teacher' && subjects.length > 0 && h('div', { className: 'card border-0 shadow-sm p-3 mt-3' },
          h('div', { className: 'fw-bold mb-2 small', style: { color: 'var(--primary)' } },
            h('i', { className: 'bi bi-book me-1' }), 'Môn đang phụ trách'),
          subjects.map(s =>
            h('div', { key: s.id, className: 'd-flex align-items-center gap-2 py-1 border-bottom small' },
              h('div', { style: { width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 } }),
              h('span', null, s.name),
              h('span', { className: 'text-muted ms-auto' }, s.code)
            )
          )
        )
      ),

      // ── Cột phải: Thông tin ──
      h('div', { className: 'col-12 col-md-8 col-lg-9' },
        h('div', { className: 'card border-0 shadow-sm p-4' },
          h('h6', { className: 'fw-bold mb-4', style: { color: 'var(--primary)' } },
            h('i', { className: 'bi bi-info-circle me-2' }), 'Thông tin cá nhân'),

          h('div', { className: 'row g-3' },
            cfg.fields.map(f =>
              h('div', { key: f.key, className: 'col-12 col-sm-6' },
                h('div', { className: 'profile-field' },
                  h('label', { className: 'profile-field-label' },
                    h('i', { className: `bi bi-${f.icon} me-1` }), f.label),
                  editing
                    ? (f.key === 'email' && user?.uid)
                      ? h('div', { className: 'd-flex align-items-center gap-2' },
                          h('input', { type: 'email', className: 'form-control', value: form[f.key] || '', disabled: true }),
                          h('span', { className: 'badge flex-shrink-0', style: { backgroundColor: 'rgba(255,160,0,.15)', color: '#f6a623', fontSize: '0.7rem' } },
                            h('i', { className: 'bi bi-lock-fill me-1' }), 'Firebase')
                        )
                      : h('input', { type: f.type, className: 'form-control', value: form[f.key] || '',
                          placeholder: f.placeholder, onChange: e => setForm({ ...form, [f.key]: e.target.value }) })
                    : h('div', { className: 'profile-field-value' },
                        f.key === 'gpa'
                          ? h(window.React.Fragment, null,
                              profile[f.key] || '—',
                              profile[f.key] && h(GpaBadge, { gpa: profile[f.key] }))
                          : (profile[f.key] || h('span', { className: 'text-muted fst-italic small' }, 'Chưa cập nhật'))
                      )
                )
              )
            )
          ),

          editing && h('div', { className: 'd-flex gap-2 mt-4 justify-content-end border-top pt-3 align-items-center flex-wrap' },
            saveMsg === 'ok'    && h('span', { className: 'text-success small me-auto' },
              h('i', { className: 'bi bi-check-circle-fill me-1' }), 'Đã lưu lên Firebase'),
            saveMsg === 'error' && h('span', { className: 'text-danger small me-auto' },
              h('i', { className: 'bi bi-x-circle-fill me-1' }), 'Lưu thất bại – thử lại'),
            h('button', { className: 'btn btn-secondary', onClick: handleCancel }, 'Hủy'),
            h('button', { className: 'btn btn-primary', disabled: saveMsg === 'saving', onClick: handleSave },
              saveMsg === 'saving'
                ? h(window.React.Fragment, null, h('span', { className: 'spinner-border spinner-border-sm me-2' }), 'Đang lưu…')
                : h(window.React.Fragment, null, h('i', { className: 'bi bi-cloud-upload me-1' }), 'Lưu & đồng bộ')
            )
          )
        ),

        // Danh sách môn đang học (chỉ student)
        role === 'student' && subjects.length > 0 && h('div', { className: 'card border-0 shadow-sm p-4 mt-4' },
          h('h6', { className: 'fw-bold mb-3', style: { color: 'var(--primary)' } },
            h('i', { className: 'bi bi-journal-bookmark me-2' }), 'Môn học đang theo học'),
          h('div', { className: 'row g-2' },
            subjects.map(s => {
              const subDl   = deadlines.filter(d => d.subjectId === s.id)
              const subDone = subDl.filter(d => d.status === 'completed').length
              const pct     = subDl.length ? Math.round((subDone / subDl.length) * 100) : 0
              return h('div', { key: s.id, className: 'col-12 col-sm-6' },
                h('div', { className: 'd-flex align-items-center gap-2 p-2 rounded', style: { backgroundColor: 'rgba(0,0,0,.03)' } },
                  h('div', { style: { width: 10, height: 10, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 } }),
                  h('div', { className: 'flex-grow-1 overflow-hidden' },
                    h('div', { className: 'small fw-semibold text-truncate' }, s.name),
                    h('div', { className: 'progress mt-1', style: { height: 4 } },
                      h('div', { className: 'progress-bar', style: { width: `${pct}%`, backgroundColor: s.color } })
                    )
                  ),
                  h('small', { className: 'text-muted flex-shrink-0' }, `${pct}%`)
                )
              )
            })
          )
        )
      )
    )
  )
}
