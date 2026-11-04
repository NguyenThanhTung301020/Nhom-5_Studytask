// components/AccountCards.js – Ảnh đại diện + email khôi phục (trong trang Hồ sơ)
import UserAvatar from './UserAvatar.js'
import { getAccount, requestEmailLink, verifyEmailLink, unlinkEmail, uploadAvatar, removeAvatar } from '../utils/firebase.js'

const { useState, useEffect, useRef, createElement: h } = window.React

// Cắt vuông ở giữa + thu về 256×256 JPEG trước khi tải lên (nhẹ, đồng nhất)
async function toAvatarBlob(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Không đọc được ảnh.')); i.src = url })
    const S = 256, c = document.createElement('canvas')
    c.width = c.height = S
    const side = Math.min(img.width, img.height)
    c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, S, S)
    return await new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('Không xử lý được ảnh.'))), 'image/jpeg', 0.88))
  } finally { URL.revokeObjectURL(url) }
}

export function AvatarPicker({ name, color, user, canEdit, onChange }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const pick = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setErr('Hãy chọn một file ảnh.'); return }
    if (file.size > 10 * 1024 * 1024) { setErr('Ảnh quá lớn (tối đa 10MB).'); return }
    setBusy(true); setErr('')
    try { const r = await uploadAvatar(await toAvatarBlob(file)); onChange(r.avatar) }
    catch (ex) { setErr(ex.message || 'Tải ảnh thất bại') }
    setBusy(false)
  }
  const remove = async () => {
    setBusy(true); setErr('')
    try { await removeAvatar(); onChange('') } catch (ex) { setErr(ex.message) }
    setBusy(false)
  }
  return h('div', { className: 'text-center mb-3' },
    h('div', { className: 'd-inline-block mb-2' }, h(UserAvatar, { name, src: user?.avatar, size: 96, color })),
    canEdit && h('div', null,
      h('input', { ref: input, type: 'file', accept: 'image/*', className: 'd-none', onChange: pick }),
      h('div', { className: 'd-flex justify-content-center gap-2' },
        h('button', { className: 'btn btn-outline-primary btn-sm', disabled: busy, onClick: () => input.current && input.current.click() },
          busy ? h('span', { className: 'spinner-border spinner-border-sm' }) : h(window.React.Fragment, null, h('i', { className: 'bi bi-camera me-1' }), user?.avatar ? 'Đổi ảnh' : 'Tải ảnh lên')),
        user?.avatar && h('button', { className: 'btn btn-outline-secondary btn-sm', disabled: busy, onClick: remove }, h('i', { className: 'bi bi-trash' }))),
      err && h('div', { className: 'small text-danger mt-1' }, err)))
}

const maskEmail = (e = '') => {
  const [u, d] = e.split('@')
  return u ? `${u.slice(0, 2)}${'•'.repeat(Math.max(1, Math.min(6, u.length - 2)))}@${d}` : e
}

export function RecoveryEmailCard() {
  const [acc, setAcc] = useState(null)
  const [step, setStep] = useState('idle')       // idle | code | unlink
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  const reload = () => getAccount().then(setAcc).catch(e => setMsg({ type: 'err', text: e.message }))
  useEffect(() => { reload() }, [])

  const run = async (fn, okText) => {
    setBusy(true); setMsg(null)
    try { await fn(); if (okText) setMsg({ type: 'ok', text: okText }) }
    catch (e) { setMsg({ type: 'err', text: e.message }) }
    setBusy(false)
  }
  const sendCode = () => run(async () => { await requestEmailLink(email.trim(), pw); setStep('code'); setPw('') },
    'Đã gửi mã 6 số tới email của bạn (hiệu lực 15 phút). Kiểm tra cả thư mục spam.')
  const verify = () => run(async () => { await verifyEmailLink(code.trim()); setStep('idle'); setCode(''); setEmail(''); await reload() }, 'Đã liên kết email cá nhân.')
  const unlink = () => run(async () => { await unlinkEmail(pw); setStep('idle'); setPw(''); await reload() }, 'Đã gỡ email cá nhân.')

  const linked = acc && acc.recoveryEmail
  return h('div', { className: 'card border-0 shadow-sm p-3 mt-3' },
    h('div', { className: 'fw-bold small mb-2', style: { color: 'var(--primary)' } }, h('i', { className: 'bi bi-envelope-check me-1' }), 'Email cá nhân'),
    !acc ? h('div', { className: 'small text-muted' }, msg ? msg.text : 'Đang tải…')
      : h(window.React.Fragment, null,
          h('div', { className: 'small text-muted mb-2' }, h('i', { className: 'bi bi-person me-1' }), 'Tên đăng nhập: ', h('strong', null, acc.username)),
          linked && h('div', { className: 'd-flex align-items-center justify-content-between mb-2' },
            h('span', { className: 'small text-truncate me-2' }, h('i', { className: 'bi bi-envelope me-1' }), maskEmail(acc.recoveryEmail)),
            h('span', { className: 'badge bg-success-subtle text-success flex-shrink-0' }, h('i', { className: 'bi bi-check-circle-fill me-1' }), 'Đã xác minh')),
          !linked && step === 'idle' && h('div', { className: 'small text-muted mb-2' }, 'Liên kết email cá nhân để đặt lại mật khẩu khi quên hoặc mất tài khoản. Email chỉ dùng để khôi phục, không dùng để đăng nhập và không hiển thị cho người khác.'),
          !acc.mailReady && h('div', { className: 'alert alert-warning py-2 small mb-2' }, 'Máy chủ chưa cấu hình gửi email nên chưa liên kết được. Hãy báo quản trị viên.'),

          step === 'idle' && h('div', null,
            !linked && h(window.React.Fragment, null,
              h('input', { type: 'email', className: 'form-control form-control-sm mb-2', placeholder: 'Email cá nhân (VD: ten@gmail.com)', value: email, onChange: e => setEmail(e.target.value) }),
              h('input', { type: 'password', className: 'form-control form-control-sm mb-2', placeholder: 'Mật khẩu hiện tại (để xác nhận)', autoComplete: 'current-password', value: pw, onChange: e => setPw(e.target.value) }),
              h('button', { className: 'btn btn-outline-primary btn-sm w-100', disabled: busy || !acc.mailReady || !email.trim() || !pw, onClick: sendCode },
                busy ? h('span', { className: 'spinner-border spinner-border-sm' }) : 'Gửi mã xác nhận')),
            linked && h('button', { className: 'btn btn-outline-secondary btn-sm w-100', onClick: () => { setStep('unlink'); setMsg(null) } }, 'Đổi / gỡ email cá nhân')),

          step === 'code' && h('div', null,
            h('input', { className: 'form-control form-control-sm mb-2 text-center', style: { letterSpacing: '.35em', fontSize: '1.1rem' }, inputMode: 'numeric', maxLength: 6, placeholder: '------', value: code, onChange: e => setCode(e.target.value.replace(/\D/g, '')) }),
            h('div', { className: 'd-flex gap-2' },
              h('button', { className: 'btn btn-primary btn-sm flex-grow-1', disabled: busy || code.length !== 6, onClick: verify }, busy ? h('span', { className: 'spinner-border spinner-border-sm' }) : 'Xác nhận'),
              h('button', { className: 'btn btn-outline-secondary btn-sm', disabled: busy, onClick: () => { setStep('idle'); setMsg(null) } }, 'Hủy'))),

          step === 'unlink' && h('div', null,
            h('input', { type: 'password', className: 'form-control form-control-sm mb-2', placeholder: 'Nhập mật khẩu hiện tại để gỡ', autoComplete: 'current-password', value: pw, onChange: e => setPw(e.target.value) }),
            h('div', { className: 'd-flex gap-2' },
              h('button', { className: 'btn btn-danger btn-sm flex-grow-1', disabled: busy || !pw, onClick: unlink }, 'Gỡ liên kết'),
              h('button', { className: 'btn btn-outline-secondary btn-sm', onClick: () => { setStep('idle'); setPw('') } }, 'Hủy')),
            h('div', { className: 'form-text' }, 'Muốn đổi sang email khác: gỡ liên kết rồi liên kết lại.')),

          msg && h('div', { className: `small mt-2 text-${msg.type === 'ok' ? 'success' : 'danger'}` },
            h('i', { className: `bi bi-${msg.type === 'ok' ? 'check-circle' : 'x-circle'} me-1` }), msg.text)))
}
