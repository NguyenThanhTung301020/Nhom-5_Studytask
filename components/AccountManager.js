// components/AccountManager.js – Quản lý tài khoản người dùng (Admin)
import { ROLES, DEMO_ACCOUNTS } from '../utils/constants.js'
import { isFirebaseReady, getAllUsers, createAccountSecondary,
         adminUpdateUser, adminGetProfile, adminSetProfile, deleteUserData, sendResetEmail, adminSetPassword } from '../utils/firebase.js'
import ConfirmModal from './ConfirmModal.js'

const { useState, useEffect, createElement: h } = window.React

const today = () => new Date().toISOString().split('T')[0]
const isExpired = (u) => u.expiresAt && u.expiresAt < today()
// Mật khẩu tạm mặc định = tên đăng nhập + '123' (người dùng nên đổi sau khi nhận)
const defaultPassword = (u) => (u.username || 'user') + '123'

// ── Modal đổi mật khẩu cho một user ──
function PasswordModal({ user, onApply, onResetEmail, onClose, working }) {
  const [mode, setMode] = useState('default')   // 'default' | 'manual'
  const [pw,   setPw]   = useState('')
  const def = defaultPassword(user)
  const newPw = mode === 'default' ? def : pw
  const valid = newPw.length >= 6

  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
    h('div', { className: 'modal-dialog modal-dialog-centered' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' },
          h('h5', { className: 'modal-title fw-bold' }, h('i', { className: 'bi bi-shield-lock me-2', style: { color: 'var(--primary)' } }), 'Đổi mật khẩu'),
          h('button', { className: 'btn-close', onClick: onClose })
        ),
        h('div', { className: 'modal-body' },
          h('div', { className: 'mb-3 small' },
            h('div', null, h('span', { className: 'text-muted' }, 'Tài khoản: '), h('strong', null, user.name || user.username)),
            h('div', null, h('span', { className: 'text-muted' }, 'Tên đăng nhập: '), user.username),
            h('div', { className: 'text-muted' }, 'Máy chủ chỉ lưu mã băm của mật khẩu nên không xem lại được mật khẩu hiện tại.')
          ),
          h('div', { className: 'mb-2' },
            h('label', { className: 'form-check d-flex align-items-center gap-2' },
              h('input', { type: 'radio', className: 'form-check-input mt-0', checked: mode === 'default', onChange: () => setMode('default') }),
              h('span', null, 'Đặt mật khẩu tạm: ', h('code', null, def))
            ),
            h('label', { className: 'form-check d-flex align-items-center gap-2 mt-2' },
              h('input', { type: 'radio', className: 'form-check-input mt-0', checked: mode === 'manual', onChange: () => setMode('manual') }),
              h('span', null, 'Tự nhập mật khẩu mới')
            ),
            mode === 'manual' && h('input', { className: 'form-control form-control-sm mt-2', placeholder: 'Tối thiểu 6 ký tự', value: pw, onChange: e => setPw(e.target.value) })
          ),
          h('div', { className: 'form-text mt-2' }, 'Đổi xong, mọi phiên đăng nhập cũ của tài khoản này bị đăng xuất. Hãy báo mật khẩu tạm cho người dùng và nhắc họ đổi lại.')
        ),
        h('div', { className: 'modal-footer justify-content-between' },
          h('button', { className: 'btn btn-sm btn-outline-secondary', onClick: () => onResetEmail(user.username) },
            h('i', { className: 'bi bi-envelope me-1' }), 'Gửi mã qua email cá nhân'),
          h('div', { className: 'd-flex gap-2' },
            h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
            h('button', { className: 'btn btn-primary', disabled: !valid || working,
              onClick: () => onApply(user, newPw) },
              working ? h(window.React.Fragment, null, h('span', { className: 'spinner-border spinner-border-sm me-1' }), 'Đang đổi…')
                      : h(window.React.Fragment, null, h('i', { className: 'bi bi-check-lg me-1' }), 'Đổi mật khẩu')
            )
          )
        )
      )
    )
  )
}

// Hồ sơ học vụ: chỉ Admin sửa; sinh viên/giáo viên chỉ tự sửa email và số điện thoại
const ACADEMIC_FIELDS = {
  student: [['studentId', 'Mã số sinh viên'], ['faculty', 'Khoa / Bộ môn'], ['major', 'Ngành học'], ['className', 'Lớp'],
            ['semester', 'Học kỳ hiện tại'], ['gpa', 'GPA tích lũy (0–4)']],
  teacher: [['teacherId', 'Mã giáo viên'], ['faculty', 'Khoa / Trường'], ['department', 'Bộ môn'], ['position', 'Học hàm / Chức vụ']],
  other:   [['department', 'Phòng / Ban']],
}
const academicFor = (role) => ACADEMIC_FIELDS[role] || ACADEMIC_FIELDS.other
const gpaError = (v) => { const s = String(v ?? '').trim(); if (!s) return ''; const g = Number(s.replace(',', '.')); return isNaN(g) || g < 0 || g > 4 ? 'GPA phải là số từ 0 đến 4.' : '' }

// ── Modal Thêm / Sửa tài khoản ──────────────────────────────────
function AccountModal({ item, subjects, onSave, onClose, saving }) {
  const editing = !!item
  const [prof, setProf] = useState({})          // hồ sơ học vụ của tài khoản đang sửa
  const [profReady, setProfReady] = useState(!item)
  useEffect(() => {
    if (!item || !item.uid || String(item.uid).startsWith('demo-')) { setProfReady(true); return }
    adminGetProfile(item.uid).then(p => setProf(p || {})).catch(() => {}).finally(() => setProfReady(true))
  }, [])
  const [form, setForm] = useState(item
    ? { username: item.username || '', password: '', name: item.name || '', role: item.role || 'student',
        subjectIds: item.subjectIds || [], expiresAt: item.expiresAt || '', phone: item.phone || '' }
    : { username: '', password: '', name: '', role: 'student', subjectIds: [], expiresAt: '', phone: '' })

  const toggleSub = (id) => setForm(f => ({ ...f, subjectIds: f.subjectIds.includes(id) ? f.subjectIds.filter(x => x !== id) : [...f.subjectIds, id] }))
  const valid = editing
    ? form.name.trim() && !(form.role === 'student' && gpaError(prof.gpa)) && profReady
    : /^[a-z0-9][a-z0-9._-]{2,31}$/.test(form.username.trim().toLowerCase()) && form.password.length >= 6 && form.name.trim()

  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
    h('div', { className: 'modal-dialog modal-dialog-centered modal-dialog-scrollable' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' },
          h('h5', { className: 'modal-title fw-bold' },
            h('i', { className: `bi bi-${editing ? 'pencil-square' : 'person-plus-fill'} me-2`, style: { color: 'var(--primary)' } }),
            editing ? 'Sửa tài khoản' : 'Thêm tài khoản mới'),
          h('button', { className: 'btn-close', onClick: onClose })
        ),
        h('div', { className: 'modal-body' },
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, 'Tên đăng nhập ', h('span', { className: 'text-danger' }, '*')),
            h('input', { type: 'text', className: 'form-control', placeholder: 'vd: nguyenvana hoặc sv2021001', value: form.username, autoCapitalize: 'none', spellCheck: false,
              disabled: editing, onChange: e => setForm({ ...form, username: e.target.value.toLowerCase() }) }),
            h('div', { className: 'form-text' }, editing ? 'Không thể đổi tên đăng nhập của tài khoản đã tạo.' : '3–32 ký tự: chữ thường không dấu, số, dấu . _ - ; không có khoảng trắng.')
          ),
          !editing && h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, 'Mật khẩu ', h('span', { className: 'text-danger' }, '*')),
            h('input', { type: 'text', className: 'form-control', placeholder: 'Tối thiểu 6 ký tự', value: form.password,
              onChange: e => setForm({ ...form, password: e.target.value }) }),
            form.password && form.password.length < 6 && h('div', { className: 'form-text text-danger' }, 'Mật khẩu phải từ 6 ký tự.')
          ),
          h('div', { className: 'row g-3 mb-3' },
            h('div', { className: 'col-md-7' },
              h('label', { className: 'form-label fw-semibold' }, 'Họ tên ', h('span', { className: 'text-danger' }, '*')),
              h('input', { className: 'form-control', placeholder: 'VD: Trần Minh Khoa', value: form.name, onChange: e => setForm({ ...form, name: e.target.value }) })
            ),
            h('div', { className: 'col-md-5' },
              h('label', { className: 'form-label fw-semibold' }, 'Vai trò'),
              h('select', { className: 'form-select', value: form.role, onChange: e => setForm({ ...form, role: e.target.value }) },
                Object.entries(ROLES).map(([k, v]) => h('option', { key: k, value: k }, v.label))
              )
            )
          ),
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-telephone me-1' }), 'Số điện thoại'),
            h('input', { className: 'form-control', placeholder: 'VD: 0901234567', value: form.phone, onChange: e => setForm({ ...form, phone: e.target.value }) })
          ),
          editing && h('div', { className: 'mb-3 p-3 rounded border' },
            h('div', { className: 'fw-semibold mb-1' }, h('i', { className: 'bi bi-person-vcard me-1' }), 'Hồ sơ học vụ'),
            h('div', { className: 'form-text mb-2' }, 'Do quản trị viên cấp. Người dùng chỉ tự sửa được email và số điện thoại.'),
            !profReady ? h('div', { className: 'small text-muted' }, 'Đang tải hồ sơ…')
              : h('div', { className: 'row g-2' },
                  academicFor(form.role).map(([key, label]) =>
                    h('div', { key, className: 'col-sm-6' },
                      h('label', { className: 'form-label small mb-1' }, label),
                      h('input', { className: `form-control form-control-sm${key === 'gpa' && gpaError(prof.gpa) ? ' is-invalid' : ''}`,
                        value: prof[key] || '', onChange: e => setProf({ ...prof, [key]: e.target.value }) }),
                      key === 'gpa' && gpaError(prof.gpa) && h('div', { className: 'invalid-feedback' }, gpaError(prof.gpa))
                    )
                  )
                )
          ),
          h('div', { className: 'mb-3' },
            h('label', { className: 'form-label fw-semibold' }, h('i', { className: 'bi bi-calendar-x me-1' }), 'Ngày hết hạn tài khoản'),
            h('input', { type: 'date', className: 'form-control', value: form.expiresAt, onChange: e => setForm({ ...form, expiresAt: e.target.value }) }),
            h('div', { className: 'form-text' }, 'Để trống nếu tài khoản không giới hạn thời gian. Tài khoản quá hạn có thể xóa hàng loạt.')
          ),
          !['admin', 'training', 'finance'].includes(form.role) && h('div', null,
            h('label', { className: 'form-label fw-semibold' },
              h('i', { className: 'bi bi-journal-check me-1' }),
              form.role === 'teacher' ? 'Môn đảm nhiệm' : 'Môn học đăng ký'
            ),
            h('div', { className: 'd-flex flex-wrap gap-2' },
              subjects.map(s =>
                h('label', { key: s.id,
                  className: `subject-assign-chip${form.subjectIds.includes(s.id) ? ' active' : ''}`,
                  style: form.subjectIds.includes(s.id) ? { borderColor: s.color, backgroundColor: s.color + '18', color: s.color } : {},
                  onClick: () => toggleSub(s.id) },
                  h('div', { style: { width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 } }), s.name
                )
              )
            )
          )
        ),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
          h('button', { className: 'btn btn-primary', disabled: !valid || saving,
            onClick: () => valid && onSave({ ...form, profile: editing ? prof : null }) },
            saving ? h(window.React.Fragment, null, h('span', { className: 'spinner-border spinner-border-sm me-1' }), 'Đang lưu…')
                   : (editing ? 'Lưu thay đổi' : 'Tạo tài khoản')
          )
        )
      )
    )
  )
}

export default function AccountManager({ subjects = [] }) {
  const [users,    setUsers]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)   // null | 'add' | 'edit'
  const [editItem, setEditItem] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [confirm,  setConfirm]  = useState(null)   // { type:'one'|'expired', uid?, message }
  const [pwUser,   setPwUser]   = useState(null)   // user đang đổi mật khẩu
  const [pwWorking,setPwWorking]= useState(false)
  const fb = isFirebaseReady()

  useEffect(() => {
    (async () => {
      setLoading(true)
      if (fb) setUsers(await getAllUsers())
      else    setUsers(DEMO_ACCOUNTS.map(u => ({ ...u, uid: u.id })))
      setLoading(false)
    })()
  }, [])

  const expiredUsers = users.filter(isExpired)

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (modal === 'edit') {
        const data = { name: form.name, role: form.role, subjectIds: form.subjectIds, expiresAt: form.expiresAt || '', phone: form.phone || '' }
        if (fb) {
          await adminUpdateUser(editItem.uid, data)
          if (form.profile) {
            // Giữ họ tên trong hồ sơ khớp với tài khoản (trang Hồ sơ hiển thị từ đây)
            const keep = academicFor(form.role).map(([k]) => k)
            const fields = Object.fromEntries(keep.map(k => [k, String(form.profile[k] ?? '').trim()]))
            await adminSetProfile(editItem.uid, { ...fields, name: form.name.trim() })
          }
        }
        setUsers(prev => prev.map(u => u.uid === editItem.uid ? { ...u, ...data } : u))
      } else {
        if (fb) {
          const uid = await createAccountSecondary(form.username.trim(), form.password, { name: form.name, role: form.role, subjectIds: form.subjectIds, expiresAt: form.expiresAt, phone: form.phone })
          setUsers(prev => [...prev, { uid, username: form.username.trim().toLowerCase(), name: form.name, role: form.role, subjectIds: form.subjectIds, expiresAt: form.expiresAt, phone: form.phone }])
        } else {
          setUsers(prev => [...prev, { uid: 'demo-' + Date.now(), username: form.username.trim().toLowerCase(), name: form.name, role: form.role, subjectIds: form.subjectIds, expiresAt: form.expiresAt, phone: form.phone }])
        }
      }
      setModal(null)
    } catch (e) {
      alert('Lỗi: ' + (e.code === 'auth/username-already-in-use' ? 'Tên đăng nhập đã tồn tại.' : e.message))
    }
    setSaving(false)
  }

  const doDelete = async (uid) => {
    if (fb) { try { await deleteUserData(uid) } catch (e) { alert('Xóa lỗi: ' + e.message) } }
    setUsers(prev => prev.filter(u => u.uid !== uid))
  }

  const handleConfirm = async () => {
    if (confirm.type === 'one') await doDelete(confirm.uid)
    else for (const u of expiredUsers) await doDelete(u.uid)
    setConfirm(null)
  }

  const handleReset = async (email) => {
    if (!fb) return alert('Chế độ demo: cần kết nối máy chủ để gửi mã đặt lại mật khẩu.')
    try { await sendResetEmail(email); alert(`Đã gửi mã đặt lại mật khẩu cho "${email}" (chỉ gửi được khi người dùng đã liên kết email cá nhân).`) }
    catch (e) { alert('Gửi lỗi: ' + e.message) }
  }

  const handleSetPassword = async (u, newPw) => {
    setPwWorking(true)
    try {
      if (!fb) throw new Error('Chế độ demo: cần kết nối máy chủ để đổi mật khẩu thật.')
      await adminSetPassword(u.uid, u.username, '', newPw)
      setPwUser(null)
      alert(`Đã đặt mật khẩu tạm cho "${u.name || u.username}":\n${newPw}\nHãy báo cho người dùng và nhắc họ đổi lại.`)
    } catch (e) {
      alert('Đổi mật khẩu lỗi: ' + e.message)
    }
    setPwWorking(false)
  }

  if (loading) return h('div', { className: 'text-center py-4' },
    h('div', { className: 'spinner-border spinner-border-sm text-primary me-2' }),
    h('span', { className: 'text-muted small' }, 'Đang tải danh sách tài khoản…')
  )

  return h('div', null,
    !fb && h('div', { className: 'alert alert-warning small py-2' },
      h('i', { className: 'bi bi-exclamation-triangle me-1' }),
      'Chế độ demo: thao tác chỉ minh họa trên danh sách tạm, không lưu thật. Kết nối máy chủ để quản lý tài khoản thực.'
    ),

    // Thanh công cụ
    h('div', { className: 'd-flex justify-content-between align-items-center flex-wrap gap-2 mb-3' },
      h('div', { className: 'text-muted small' },
        h('i', { className: 'bi bi-people me-1' }), `${users.length} tài khoản`,
        expiredUsers.length > 0 && h('span', { className: 'text-danger ms-2' }, h('i', { className: 'bi bi-clock-history me-1' }), `${expiredUsers.length} quá hạn`)
      ),
      h('div', { className: 'd-flex gap-2' },
        expiredUsers.length > 0 && h('button', { className: 'btn btn-sm btn-outline-danger',
          onClick: () => setConfirm({ type: 'expired', message: `Xóa ${expiredUsers.length} tài khoản đã quá hạn? Toàn bộ dữ liệu của các tài khoản này trên máy chủ sẽ bị xóa.` }) },
          h('i', { className: 'bi bi-trash me-1' }), `Xóa ${expiredUsers.length} tài khoản quá hạn`
        ),
        h('button', { className: 'btn btn-sm btn-primary', onClick: () => { setEditItem(null); setModal('add') } },
          h('i', { className: 'bi bi-person-plus-fill me-1' }), 'Thêm tài khoản'
        )
      )
    ),

    // Danh sách
    h('div', { className: 'table-responsive' },
      h('table', { className: 'table table-hover align-middle mb-0 report-table' },
        h('thead', null, h('tr', null,
          h('th', null, 'Người dùng'),
          h('th', null, 'Vai trò'),
          h('th', { className: 'text-center' }, 'Số môn'),
          h('th', null, 'Hết hạn'),
          h('th', { className: 'text-end' }, 'Thao tác')
        )),
        h('tbody', null,
          users.map(u => {
            const role = ROLES[u.role] || ROLES.student
            const exp  = isExpired(u)
            return h('tr', { key: u.uid, className: exp ? 'table-danger-subtle' : '' },
              h('td', null,
                h('div', { className: 'd-flex align-items-center gap-2' },
                  h('div', { className: 'report-avatar', style: { background: role.color + '22', color: role.color } },
                    h('i', { className: `bi bi-${role.icon}` })
                  ),
                  h('div', { className: 'min-w-0' },
                    h('div', { className: 'fw-semibold text-truncate' }, u.name || '(Chưa đặt tên)'),
                    h('div', { className: 'small text-muted text-truncate' }, u.username)
                  )
                )
              ),
              h('td', null, h('span', { className: `role-badge role-badge-${u.role}` }, h('i', { className: `bi bi-${role.icon} me-1` }), role.label)),
              h('td', { className: 'text-center' }, (u.subjectIds || []).length || '—'),
              h('td', null, u.expiresAt
                ? h('span', { className: exp ? 'text-danger fw-semibold' : 'text-muted' },
                    h('i', { className: `bi bi-${exp ? 'exclamation-circle' : 'calendar3'} me-1` }),
                    new Date(u.expiresAt).toLocaleDateString('vi-VN'), exp && ' (quá hạn)')
                : h('span', { className: 'text-muted small' }, 'Không giới hạn')
              ),
              h('td', { className: 'text-end' },
                h('div', { className: 'btn-group btn-group-sm' },
                  h('button', { className: 'btn btn-outline-secondary', title: 'Sửa thông tin', onClick: () => { setEditItem(u); setModal('edit') } }, h('i', { className: 'bi bi-pencil' })),
                  h('button', { className: 'btn btn-outline-primary', title: 'Đổi mật khẩu', onClick: () => setPwUser(u) }, h('i', { className: 'bi bi-shield-lock' })),
                  h('button', { className: 'btn btn-outline-danger', title: 'Xóa tài khoản', onClick: () => setConfirm({ type: 'one', uid: u.uid, message: `Xóa tài khoản "${u.name || u.username}"? Toàn bộ dữ liệu của tài khoản này trên máy chủ sẽ bị xóa.` }) }, h('i', { className: 'bi bi-trash' }))
                )
              )
            )
          })
        )
      )
    ),

    h('div', { className: 'alert alert-info small mt-3 mb-0 py-2' },
      h('i', { className: 'bi bi-info-circle me-1' }),
      'Mật khẩu được băm trên máy chủ nên không ai xem lại được, kể cả Quản trị viên. Khi cần, dùng nút ',
      h('i', { className: 'bi bi-shield-lock' }), ' để đặt mật khẩu tạm cho người dùng (mọi phiên cũ bị đăng xuất). Xóa tài khoản sẽ xóa luôn dữ liệu và ảnh đại diện của tài khoản đó.'
    ),

    modal && h(AccountModal, { item: modal === 'edit' ? editItem : null, subjects, saving, onSave: handleSave, onClose: () => setModal(null) }),
    pwUser && h(PasswordModal, { user: pwUser, working: pwWorking, onApply: handleSetPassword, onResetEmail: handleReset, onClose: () => setPwUser(null) }),
    confirm && h(ConfirmModal, { message: confirm.message, onConfirm: handleConfirm, onClose: () => setConfirm(null) })
  )
}
