// components/AccountManager.js – Quản lý tài khoản người dùng (Admin)
import { ROLES, DEMO_ACCOUNTS } from '../utils/constants.js'
import { isFirebaseReady, getAllUsers, createAccountSecondary,
         adminUpdateUser, deleteUserData, sendResetEmail, adminSetPassword,
         getAllSecrets, migrateLegacyPasswords } from '../utils/firebase.js'
import ConfirmModal from './ConfirmModal.js'

const { useState, useEffect, createElement: h } = window.React

const today = () => new Date().toISOString().split('T')[0]
const isExpired = (u) => u.expiresAt && u.expiresAt < today()
// Mật khẩu mặc định = phần trước @ của email + '123'
const defaultPassword = (u) => ((u.email || 'user').split('@')[0] || 'user') + '123'

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
            h('div', null, h('span', { className: 'text-muted' }, 'Tài khoản: '), h('strong', null, user.name || user.email)),
            h('div', null, h('span', { className: 'text-muted' }, 'Email: '), user.email),
            h('div', null, h('span', { className: 'text-muted' }, 'Mật khẩu hiện tại: '),
              h('code', null, user.password || '(chưa lưu)'))
          ),
          h('div', { className: 'mb-2' },
            h('label', { className: 'form-check d-flex align-items-center gap-2' },
              h('input', { type: 'radio', className: 'form-check-input mt-0', checked: mode === 'default', onChange: () => setMode('default') }),
              h('span', null, 'Đặt về mặc định: ', h('code', null, def))
            ),
            h('label', { className: 'form-check d-flex align-items-center gap-2 mt-2' },
              h('input', { type: 'radio', className: 'form-check-input mt-0', checked: mode === 'manual', onChange: () => setMode('manual') }),
              h('span', null, 'Tự nhập mật khẩu mới')
            ),
            mode === 'manual' && h('input', { className: 'form-control form-control-sm mt-2', placeholder: 'Tối thiểu 6 ký tự', value: pw, onChange: e => setPw(e.target.value) })
          ),
          !user.password && h('div', { className: 'alert alert-warning small py-2 mt-2 mb-0' },
            h('i', { className: 'bi bi-exclamation-triangle me-1' }),
            'Tài khoản này chưa lưu mật khẩu (tạo từ Console hoặc trước khi có tính năng) nên không thể đổi tự động. Hãy dùng "Gửi email đặt lại".'
          )
        ),
        h('div', { className: 'modal-footer justify-content-between' },
          h('button', { className: 'btn btn-sm btn-outline-secondary', onClick: () => onResetEmail(user.email) },
            h('i', { className: 'bi bi-envelope me-1' }), 'Gửi email đặt lại'),
          h('div', { className: 'd-flex gap-2' },
            h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
            h('button', { className: 'btn btn-primary', disabled: !valid || working || !user.password,
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

// ── Modal Thêm / Sửa tài khoản ──────────────────────────────────
function AccountModal({ item, subjects, onSave, onClose, saving }) {
  const editing = !!item
  const [form, setForm] = useState(item
    ? { email: item.email || '', password: '', name: item.name || '', role: item.role || 'student',
        subjectIds: item.subjectIds || [], expiresAt: item.expiresAt || '', phone: item.phone || '' }
    : { email: '', password: '', name: '', role: 'student', subjectIds: [], expiresAt: '', phone: '' })

  const toggleSub = (id) => setForm(f => ({ ...f, subjectIds: f.subjectIds.includes(id) ? f.subjectIds.filter(x => x !== id) : [...f.subjectIds, id] }))
  const valid = editing
    ? form.name.trim()
    : form.email.trim() && form.password.length >= 6 && form.name.trim()

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
            h('label', { className: 'form-label fw-semibold' }, 'Email ', h('span', { className: 'text-danger' }, '*')),
            h('input', { type: 'email', className: 'form-control', placeholder: 'sinhvien@example.com', value: form.email,
              disabled: editing, onChange: e => setForm({ ...form, email: e.target.value }) }),
            editing && h('div', { className: 'form-text' }, 'Không thể đổi email của tài khoản đã tạo.')
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
            onClick: () => valid && onSave(form) },
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
  const [reveal,   setReveal]   = useState({})     // { uid: true } – hiện mật khẩu
  const [pwUser,   setPwUser]   = useState(null)   // user đang đổi mật khẩu
  const [pwWorking,setPwWorking]= useState(false)
  const [legacyCount, setLegacyCount] = useState(0)   // số hồ sơ còn trường password cũ trong user/{uid}
  const [migrating,   setMigrating]   = useState(false)
  const fb = isFirebaseReady()

  // Mật khẩu lấy từ userSecrets (chỉ admin đọc được); hồ sơ chưa chuyển thì tạm dùng trường password cũ
  const loadUsers = async () => {
    const [list, secrets] = await Promise.all([getAllUsers(), getAllSecrets()])
    setLegacyCount(list.filter(u => typeof u.password === 'string' && u.password).length)
    return list.map(u => ({ ...u, password: secrets[u.uid] ?? u.password }))
  }

  useEffect(() => {
    (async () => {
      setLoading(true)
      if (fb) setUsers(await loadUsers())
      else    setUsers(DEMO_ACCOUNTS.map(u => ({ ...u, uid: u.id })))
      setLoading(false)
    })()
  }, [])

  // V1 (vá tạm tuần 2): chuyển password cũ sang userSecrets rồi xóa khỏi user/{uid}
  const handleMigrate = async () => {
    setMigrating(true)
    try {
      const raw = await getAllUsers()
      const n = await migrateLegacyPasswords(raw)
      setUsers(await loadUsers())
      alert(`Đã chuyển ${n} mật khẩu sang kho riêng (userSecrets). Các tài khoản khác không còn đọc được mật khẩu.`)
    } catch (e) {
      alert('Chuyển mật khẩu lỗi: ' + e.message)
    }
    setMigrating(false)
  }

  const expiredUsers = users.filter(isExpired)

  const handleSave = async (form) => {
    setSaving(true)
    try {
      if (modal === 'edit') {
        const data = { name: form.name, role: form.role, subjectIds: form.subjectIds, expiresAt: form.expiresAt || '', phone: form.phone || '' }
        if (fb) await adminUpdateUser(editItem.uid, data)
        setUsers(prev => prev.map(u => u.uid === editItem.uid ? { ...u, ...data } : u))
      } else {
        if (fb) {
          const uid = await createAccountSecondary(form.email, form.password, { name: form.name, role: form.role, subjectIds: form.subjectIds, expiresAt: form.expiresAt, phone: form.phone })
          setUsers(prev => [...prev, { uid, email: form.email, name: form.name, role: form.role, subjectIds: form.subjectIds, expiresAt: form.expiresAt, phone: form.phone, password: form.password }])
        } else {
          setUsers(prev => [...prev, { uid: 'demo-' + Date.now(), email: form.email, name: form.name, role: form.role, subjectIds: form.subjectIds, expiresAt: form.expiresAt, phone: form.phone, password: form.password }])
        }
      }
      setModal(null)
    } catch (e) {
      alert('Lỗi: ' + (e.code === 'auth/email-already-in-use' ? 'Email đã được sử dụng.' : e.message))
    }
    setSaving(false)
  }

  const doDelete = async (uid) => {
    if (fb) { try { await deleteUserData(uid) } catch (e) { alert('Xóa lỗi: ' + e.message) } }
    setUsers(prev => prev.filter(u => u.uid !== uid))
  }

  const handleConfirm = async () => {
    if (confirm.type === 'migrate') { setConfirm(null); return handleMigrate() }
    if (confirm.type === 'one') await doDelete(confirm.uid)
    else for (const u of expiredUsers) await doDelete(u.uid)
    setConfirm(null)
  }

  const handleReset = async (email) => {
    if (!fb) return alert('Chế độ demo: cần kết nối Firebase để gửi email đặt lại mật khẩu.')
    try { await sendResetEmail(email); alert(`Đã gửi email đặt lại mật khẩu tới:\n${email}`) }
    catch (e) { alert('Gửi lỗi: ' + e.message) }
  }

  const handleSetPassword = async (u, newPw) => {
    setPwWorking(true)
    try {
      if (fb) await adminSetPassword(u.uid, u.email, u.password, newPw)
      setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, password: newPw } : x))
      setReveal(r => ({ ...r, [u.uid]: true }))
      setPwUser(null)
      alert(`Đã đổi mật khẩu cho "${u.name || u.email}" thành:\n${newPw}`)
    } catch (e) {
      const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
        ? 'Mật khẩu hiện tại đã lưu không khớp với tài khoản thật (có thể đã bị đổi nơi khác). Hãy dùng "Gửi email đặt lại".'
        : e.message
      alert('Đổi mật khẩu lỗi: ' + msg)
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
      'Chế độ demo: thao tác chỉ minh họa trên danh sách tạm, không lưu thật. Kết nối Firebase để quản lý tài khoản thực.'
    ),

    // Thanh công cụ
    h('div', { className: 'd-flex justify-content-between align-items-center flex-wrap gap-2 mb-3' },
      h('div', { className: 'text-muted small' },
        h('i', { className: 'bi bi-people me-1' }), `${users.length} tài khoản`,
        expiredUsers.length > 0 && h('span', { className: 'text-danger ms-2' }, h('i', { className: 'bi bi-clock-history me-1' }), `${expiredUsers.length} quá hạn`)
      ),
      h('div', { className: 'd-flex gap-2' },
        fb && legacyCount > 0 && h('button', { className: 'btn btn-sm btn-warning', disabled: migrating,
          title: 'Mật khẩu đang nằm trong hồ sơ công khai user/{uid} – mọi tài khoản đã đăng nhập đều đọc được (V1)',
          onClick: () => setConfirm({ type: 'migrate', message: `Chuyển ${legacyCount} mật khẩu từ hồ sơ công khai sang kho riêng chỉ admin đọc được? Nên export Firestore để sao lưu trước khi chạy.` }) },
          migrating ? h('span', { className: 'spinner-border spinner-border-sm me-1' }) : h('i', { className: 'bi bi-shield-exclamation me-1' }),
          `Chuyển ${legacyCount} mật khẩu sang kho riêng`
        ),
        expiredUsers.length > 0 && h('button', { className: 'btn btn-sm btn-outline-danger',
          onClick: () => setConfirm({ type: 'expired', message: `Xóa ${expiredUsers.length} tài khoản đã quá hạn? Toàn bộ dữ liệu Firestore của các tài khoản này sẽ bị xóa.` }) },
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
          h('th', null, 'Mật khẩu'),
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
                    h('div', { className: 'small text-muted text-truncate' }, u.email)
                  )
                )
              ),
              h('td', null, h('span', { className: `role-badge role-badge-${u.role}` }, h('i', { className: `bi bi-${role.icon} me-1` }), role.label)),
              h('td', null,
                u.password
                  ? h('div', { className: 'd-flex align-items-center gap-2' },
                      h('code', { style: { fontSize: '0.8rem' } }, reveal[u.uid] ? u.password : '••••••'),
                      h('button', { className: 'btn btn-sm btn-link p-0 text-muted', title: reveal[u.uid] ? 'Ẩn' : 'Hiện',
                        onClick: () => setReveal(r => ({ ...r, [u.uid]: !r[u.uid] })) },
                        h('i', { className: `bi bi-${reveal[u.uid] ? 'eye-slash' : 'eye'}` }))
                    )
                  : h('span', { className: 'text-muted small' }, 'chưa lưu')
              ),
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
                  h('button', { className: 'btn btn-outline-danger', title: 'Xóa tài khoản', onClick: () => setConfirm({ type: 'one', uid: u.uid, message: `Xóa tài khoản "${u.name || u.email}"? Toàn bộ dữ liệu Firestore của tài khoản này sẽ bị xóa.` }) }, h('i', { className: 'bi bi-trash' }))
                )
              )
            )
          })
        )
      )
    ),

    h('div', { className: 'alert alert-info small mt-3 mb-0 py-2' },
      h('i', { className: 'bi bi-info-circle me-1' }),
      'Mật khẩu hiển thị/đổi được vì hệ thống còn lưu một bản trong collection userSecrets (chỉ admin đọc được). Đây là bản vá tạm — ',
      h('strong', null, 'sẽ bỏ hẳn khi chuyển sang Cloud Functions'), '. Xóa tài khoản sẽ xóa dữ liệu Firestore; bản ghi trong ',
      h('strong', null, 'Authentication'), ' cần xóa thủ công ở Firebase Console.'
    ),

    modal && h(AccountModal, { item: modal === 'edit' ? editItem : null, subjects, saving, onSave: handleSave, onClose: () => setModal(null) }),
    pwUser && h(PasswordModal, { user: pwUser, working: pwWorking, onApply: handleSetPassword, onResetEmail: handleReset, onClose: () => setPwUser(null) }),
    confirm && h(ConfirmModal, { message: confirm.message, onConfirm: handleConfirm, onClose: () => setConfirm(null),
      ...(confirm.type === 'migrate' ? { confirmLabel: 'Chuyển', confirmClass: 'btn-warning' } : {}) })
  )
}
