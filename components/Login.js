// components/Login.js
import { DEMO_ACCOUNTS, ROLES } from '../utils/constants.js'
import { isFirebaseReady, fbLogin, getUserProfile, setUserProfile, forgotPassword, resetPassword } from '../utils/firebase.js'

const { useState, createElement: h } = window.React

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState(null)

  // Quên mật khẩu: bước 1 nhập email → bước 2 nhập mã 6 số + mật khẩu mới
  const [forgotOpen,  setForgotOpen]  = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStep,  setForgotStep]  = useState(1)
  const [forgotCode,  setForgotCode]  = useState('')
  const [forgotPw,    setForgotPw]    = useState('')
  const [forgotMsg,   setForgotMsg]   = useState(null)
  const [forgotBusy,  setForgotBusy]  = useState(false)
  const handleForgot = async () => {
    setForgotBusy(true); setForgotMsg(null)
    try {
      if (forgotStep === 1) {
        await forgotPassword(forgotEmail.trim())
        setForgotStep(2)
        setForgotMsg({ type: 'ok', text: 'Nếu tài khoản đã liên kết email cá nhân, một mã 6 số đã được gửi tới đó (hiệu lực 15 phút). Kiểm tra cả thư mục spam.' })
      } else {
        await resetPassword(forgotEmail.trim(), forgotCode.trim(), forgotPw)
        setUsername(forgotEmail.trim().includes('@') ? '' : forgotEmail.trim()); setPassword('')
        setForgotOpen(false); setForgotStep(1); setForgotCode(''); setForgotPw('')
        setError(''); setForgotMsg(null)
        setResetDone(true)
      }
    } catch (e) {
      setForgotMsg({ type: 'err', text: e.message })
    }
    setForgotBusy(false)
  }
  const [resetDone, setResetDone] = useState(false)

  const pickAccount = (acc) => {
    setSelected(acc.role)
    setUsername(acc.username)
    setPassword(acc.password)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)

    // ── Thử Firebase Auth trước ─────────────────────────────────
    if (isFirebaseReady()) {
      try {
        const cred = await fbLogin(username.trim(), password)
        const uid  = cred.user.uid
        let profile = await getUserProfile(uid)

        // Nếu chưa có hồ sơ trong Firestore → tạo mới với role student
        if (!profile) {
          profile = { name: username.trim(), username: cred.user.username, role: 'student' }
          await setUserProfile(uid, profile)
        }

        // Truyền cả subjectIds: thiếu trường này thì app coi như 'xem tất cả môn' cho tới khi tải lại trang
        onLogin({ uid, username: cred.user.username, name: profile.name, role: profile.role, subjectIds: profile.subjectIds !== undefined ? profile.subjectIds : null })
        return
      } catch (err) {
        // auth/wrong-password, auth/user-not-found …
        const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
          ? 'Tên đăng nhập hoặc mật khẩu không đúng.'
          : `Lỗi đăng nhập: ${err.message}`
        setError(msg)
        setLoading(false)
        return
      }
    }

    // ── Fallback: demo accounts cục bộ (khi Firebase chưa config) ──
    const match = DEMO_ACCOUNTS.find((a) => a.username === username.trim() && a.password === password)
    if (match) {
      onLogin(match)
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng.')
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
                    h('i', { className: 'bi bi-fire me-1' }), 'Kết nối máy chủ'
                  )
                : h('span', { className: 'badge bg-secondary-subtle text-secondary', style: { fontSize: '0.7rem' } },
                    h('i', { className: 'bi bi-hdd me-1' }), 'Chế độ cục bộ'
                  )
            )
          ),

          // ── 3 Role tiles (demo) ──
          h('div', { className: 'mb-4' },
            h('p', { className: 'text-muted small fw-semibold mb-2 text-center' },
              usingFirebase ? 'Điền tên đăng nhập và mật khẩu:' : 'Đăng nhập nhanh tài khoản demo:'
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
                  h('span', { className: 'role-tile-email text-muted', style: { fontSize: '0.7rem' } }, acc.username)
                )
              })
            )
          ),

          // ── Form ──
          h('form', { onSubmit: handleSubmit },
            h('div', { className: 'mb-3' },
              h('label', { className: 'form-label fw-semibold' }, 'Tên đăng nhập'),
              h('input', { type: 'text', className: 'form-control form-control-lg', placeholder: 'Nhập tên đăng nhập', value: username, required: true, autoFocus: true,
                autoComplete: 'username', autoCapitalize: 'none', spellCheck: false,
                onChange: (e) => { setUsername(e.target.value); setError(''); setSelected(null) } })
            ),
            h('div', { className: 'mb-3' },
              h('div', { className: 'd-flex justify-content-between align-items-center' },
                h('label', { className: 'form-label fw-semibold mb-1' }, 'Mật khẩu'),
                h('button', { type: 'button', className: 'btn btn-link btn-sm p-0 text-decoration-none', onClick: () => { setForgotOpen(o => !o); setForgotEmail(username); setForgotMsg(null) } }, 'Quên mật khẩu?')
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
            resetDone && h('div', { className: 'alert alert-success py-2 small' }, h('i', { className: 'bi bi-check-circle me-1' }), 'Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới.'),
            forgotOpen && h('div', { className: 'p-3 mb-3 rounded-3', style: { background: 'rgba(78,115,223,.06)', border: '1px solid rgba(78,115,223,.2)' } },
              h('div', { className: 'fw-semibold small mb-2' }, h('i', { className: 'bi bi-shield-lock me-1' }), 'Đặt lại mật khẩu qua email cá nhân'),
              h('input', { type: 'text', className: 'form-control form-control-sm mb-2', placeholder: 'Tên đăng nhập hoặc email cá nhân đã liên kết', autoCapitalize: 'none', value: forgotEmail, disabled: forgotStep === 2, onChange: e => setForgotEmail(e.target.value) }),
              forgotStep === 2 && h(window.React.Fragment, null,
                h('input', { className: 'form-control form-control-sm mb-2 text-center', style: { letterSpacing: '.3em' }, inputMode: 'numeric', maxLength: 6, placeholder: 'Mã 6 số', value: forgotCode, onChange: e => setForgotCode(e.target.value.replace(/\D/g, '')) }),
                h('input', { type: 'password', className: 'form-control form-control-sm mb-2', placeholder: 'Mật khẩu mới (tối thiểu 6 ký tự)', autoComplete: 'new-password', value: forgotPw, onChange: e => setForgotPw(e.target.value) })),
              h('div', { className: 'd-flex gap-2' },
                h('button', { type: 'button', className: 'btn btn-primary btn-sm flex-grow-1', onClick: handleForgot,
                  disabled: forgotBusy || !forgotEmail.trim() || (forgotStep === 2 && (forgotCode.length !== 6 || forgotPw.length < 6)) },
                  forgotBusy ? h('span', { className: 'spinner-border spinner-border-sm' }) : (forgotStep === 1 ? 'Gửi mã' : 'Đặt lại mật khẩu')),
                forgotStep === 2 && h('button', { type: 'button', className: 'btn btn-outline-secondary btn-sm', onClick: () => { setForgotStep(1); setForgotMsg(null) } }, 'Gửi lại')),
              forgotMsg && h('div', { className: `small mt-2 text-${forgotMsg.type === 'ok' ? 'success' : 'danger'}` },
                h('i', { className: `bi bi-${forgotMsg.type === 'ok' ? 'check-circle' : 'exclamation-circle'} me-1` }), forgotMsg.text),
              h('div', { className: 'form-text' }, 'Chỉ dùng được khi bạn đã liên kết email cá nhân trong Hồ sơ. Nếu chưa, hãy nhờ quản trị viên đặt lại mật khẩu.')
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
