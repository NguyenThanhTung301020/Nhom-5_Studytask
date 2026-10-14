// components/Login.js
import { DEMO_ACCOUNTS, ROLES } from '../utils/constants.js'
import { isFirebaseReady, fbLogin, getUserProfile, setUserProfile, sendResetEmail } from '../utils/firebase.js'

const { useState, createElement: h } = window.React

export default function Login({ onLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState(null)

  // Quên mật khẩu
  const [forgotOpen,  setForgotOpen]  = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg,   setForgotMsg]   = useState(null)
  const [forgotBusy,  setForgotBusy]  = useState(false)
  const handleForgot = async () => {
    if (!forgotEmail.trim()) return
    setForgotBusy(true); setForgotMsg(null)
    try {
      if (isFirebaseReady()) {
        await sendResetEmail(forgotEmail.trim())
        setForgotMsg({ type: 'ok', text: 'Đã gửi email đặt lại mật khẩu (nếu tài khoản tồn tại). Vui lòng kiểm tra hộp thư & thư mục spam.' })
      } else {
        setForgotMsg({ type: 'err', text: 'Chế độ demo: cần kết nối Firebase để gửi email đặt lại.' })
      }
    } catch (e) {
      setForgotMsg({ type: 'err', text: e.code === 'auth/invalid-email' ? 'Email không hợp lệ.' : e.message })
    }
    setForgotBusy(false)
  }

  const pickAccount = (acc) => {
    setSelected(acc.role)
    setEmail(acc.email)
    setPassword(acc.password)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)

    // ── Thử Firebase Auth trước ─────────────────────────────────
    if (isFirebaseReady()) {
      try {
        const cred = await fbLogin(email.trim(), password)
        const uid  = cred.user.uid
        let profile = await getUserProfile(uid)

        // Nếu chưa có hồ sơ trong Firestore → tạo mới với role student
        if (!profile) {
          profile = { name: cred.user.displayName || email.split('@')[0], email: cred.user.email, role: 'student' }
          await setUserProfile(uid, profile)
        }

        onLogin({ uid, email: cred.user.email, name: profile.name, role: profile.role })
        return
      } catch (err) {
        // auth/wrong-password, auth/user-not-found …
        const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
          ? 'Email hoặc mật khẩu không đúng.'
          : `Lỗi Firebase: ${err.message}`
        setError(msg)
        setLoading(false)
        return
      }
    }

    // ── Fallback: demo accounts cục bộ (khi Firebase chưa config) ──
    const match = DEMO_ACCOUNTS.find((a) => a.email === email.trim() && a.password === password)
    if (match) {
      onLogin(match)
    } else {
      setError('Email hoặc mật khẩu không đúng.')
    }
    setLoading(false)
  }

  const usingFirebase = isFirebaseReady()

  return (
    h('div', { className: 'login-page' },
      h('div', { className: 'login-card card shadow-lg' },
        h('div', { className: 'card-body p-5' },
          h('div', { className: 'text-center mb-4' },
            h('div', { className: 'app-logo mx-auto mb-3' }, h('i', { className: 'bi bi-calendar-check-fill' })),
            h('h2', { className: 'fw-bold mb-1', style: { color: 'var(--primary)' } }, 'StudyTask'),
            h('p', { className: 'text-muted mb-0' }, 'Hệ thống quản lý học tập sinh viên'),
            h('div', { className: 'mt-2' },
              usingFirebase
                ? h('span', { className: 'badge', style: { backgroundColor: 'rgba(255,160,0,.15)', color: '#f6a623', fontSize: '0.7rem' } },
                    h('i', { className: 'bi bi-fire me-1' }), 'Kết nối Firebase'
                  )
                : h('span', { className: 'badge bg-secondary-subtle text-secondary', style: { fontSize: '0.7rem' } },
                    h('i', { className: 'bi bi-hdd me-1' }), 'Chế độ cục bộ'
                  )
            )
          ),

          // ── 3 Role tiles (demo) ──
          h('div', { className: 'mb-4' },
            h('p', { className: 'text-muted small fw-semibold mb-2 text-center' },
              usingFirebase ? 'Điền email và mật khẩu Firebase:' : 'Đăng nhập nhanh tài khoản demo:'
            ),
            !usingFirebase && h('div', { className: 'role-tiles' },
              DEMO_ACCOUNTS.map((acc) => {
                const role     = ROLES[acc.role]
                const isActive = selected === acc.role
                return h('button', {
                  key: acc.role, type: 'button',
                  className: `role-tile${isActive ? ' active' : ''}`,
                  style: isActive ? { borderColor: role.color, backgroundColor: role.color + '14' } : {},
                  onClick: () => pickAccount(acc),
                },
                  h('span', { className: 'role-tile-icon', style: { color: role.color } },
                    h('i', { className: `bi bi-${role.icon}` })
                  ),
                  h('span', { className: 'role-tile-label fw-semibold small', style: isActive ? { color: role.color } : {} },
                    role.label
                  ),
                  h('span', { className: 'role-tile-email text-muted', style: { fontSize: '0.7rem' } }, acc.email)
                )
              })
            )
          ),

          // ── Form ──
          h('form', { onSubmit: handleSubmit },
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, 'Email'),
              h('input', { type: 'email', className: 'form-control form-control-lg', placeholder: 'Nhập email', value: email, required: true, autoFocus: true,
                onChange: (e) => { setEmail(e.target.value); setError(''); setSelected(null) } })
            ),
            h('div', { className: 'mb-3' },
              h('div', { className: 'd-flex justify-content-between align-items-center' },
                h('label', { className: 'form-label fw-semibold mb-1' }, 'Mật khẩu'),
                h('button', { type: 'button', className: 'btn btn-link btn-sm p-0 text-decoration-none', onClick: () => { setForgotOpen(o => !o); setForgotEmail(email); setForgotMsg(null) } }, 'Quên mật khẩu?')
              ),
              h('div', { className: 'input-group' },
                h('input', { type: showPass ? 'text' : 'password', className: 'form-control form-control-lg', placeholder: 'Nhập mật khẩu', value: password, required: true,
                  onChange: (e) => { setPassword(e.target.value); setError('') } }),
                h('button', { type: 'button', className: 'btn btn-outline-secondary', onClick: () => setShowPass(!showPass) },
                  h('i', { className: `bi bi-eye${showPass ? '-slash' : ''}` })
                )
              )
            ),

            // ── Panel quên mật khẩu ──
            forgotOpen && h('div', { className: 'p-3 mb-3 rounded-3', style: { background: 'rgba(78,115,223,.06)', border: '1px solid rgba(78,115,223,.2)' } },
              h('div', { className: 'fw-semibold small mb-2' }, h('i', { className: 'bi bi-shield-lock me-1' }), 'Đặt lại mật khẩu qua email xác thực'),
              h('div', { className: 'input-group input-group-sm mb-2' },
                h('input', { type: 'email', className: 'form-control', placeholder: 'Nhập email tài khoản', value: forgotEmail, onChange: e => setForgotEmail(e.target.value) }),
                h('button', { type: 'button', className: 'btn btn-primary', disabled: forgotBusy || !forgotEmail.trim(), onClick: handleForgot },
                  forgotBusy ? h('span', { className: 'spinner-border spinner-border-sm' }) : 'Gửi')
              ),
              forgotMsg && h('div', { className: `small text-${forgotMsg.type === 'ok' ? 'success' : 'danger'}` },
                h('i', { className: `bi bi-${forgotMsg.type === 'ok' ? 'check-circle' : 'exclamation-circle'} me-1` }), forgotMsg.text),
              h('div', { className: 'form-text' }, 'Hệ thống gửi liên kết đặt lại tới email đã xác thực của bạn.')
            ),
            error && h('div', { className: 'alert alert-danger py-2 small d-flex align-items-center gap-2' },
              h('i', { className: 'bi bi-exclamation-circle-fill flex-shrink-0' }), error
            ),
            h('button', { type: 'submit', className: 'btn btn-primary btn-lg w-100 mt-1', disabled: loading },
              loading
                ? h(window.React.Fragment, null, h('span', { className: 'spinner-border spinner-border-sm me-2' }), 'Đang đăng nhập…')
                : h(window.React.Fragment, null, h('i', { className: 'bi bi-box-arrow-in-right me-2' }), 'Đăng nhập')
            )
          ),

          h('div', { className: 'text-center mt-4 pt-3 border-top' },
            h('small', { className: 'text-muted' }, 'StudyTask v3.0 – Phân quyền 3 vai trò')
          )
        )
      )
    )
  )
}
