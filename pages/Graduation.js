// pages/Graduation.js – Phiếu đăng ký xét tốt nghiệp
//   Sinh viên: điền và nộp phiếu, xem điều kiện tự kiểm tra (GPA, tín chỉ, học phí, chứng chỉ), theo dõi kết quả duyệt
//   Phòng Đào tạo / Admin: xem danh sách phiếu, duyệt / yêu cầu bổ sung / từ chối, xuất CSV
import { getDocument, setDocument, listDocuments, deleteDocument, errorText } from '../utils/store.js'
import { tuitionSummary, DEFAULT_FINANCE_CONFIG } from '../utils/tuition.js'
import { GRAD_STATUS, GRAD_CERTS } from '../utils/constants.js'

const { useState, useEffect, createElement: h } = window.React
const Frag = window.React.Fragment
const MIN_GPA = 2.0   // điều kiện GPA tích lũy tối thiểu (thang 4) – theo quy chế đào tạo tín chỉ

const statusBadge = (st) => {
  const s = GRAD_STATUS[st] || GRAD_STATUS.submitted
  return h('span', { className: 'badge', style: { background: s.color + '22', color: s.color } }, h('i', { className: `bi bi-${s.icon} me-1` }), s.label)
}
const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('vi-VN') : '—'

// Kiểm tra điều kiện (mang tính tự kiểm tra; Phòng Đào tạo xác nhận khi duyệt)
function checks(form, ctx) {
  const gpa = Number(String(form.gpa || '').replace(',', '.'))
  return [
    { label: `GPA tích lũy ≥ ${MIN_GPA.toFixed(2)}`, ok: !isNaN(gpa) && gpa >= MIN_GPA, detail: form.gpa ? `GPA khai: ${form.gpa}` : 'Chưa khai GPA' },
    { label: `Tích lũy đủ ${ctx.requiredCredits || '…'} tín chỉ theo CTĐT`, ok: ctx.requiredCredits ? Number(form.credits) >= ctx.requiredCredits : null,
      detail: ctx.requiredCredits ? `Khai ${form.credits || 0}/${ctx.requiredCredits} TC` : 'Chưa có CTĐT để đối chiếu' },
    { label: 'Không còn nợ học phí', ok: ctx.debt == null ? null : ctx.debt === 0, detail: ctx.debt == null ? 'Chưa có dữ liệu học phí' : ctx.debt === 0 ? 'Đã hoàn thành' : `Còn nợ ${ctx.debt.toLocaleString('vi-VN')} đ` },
    ...GRAD_CERTS.map(c => ({ label: c.label, ok: !!form.certs?.[c.key], detail: form.certs?.[c.key] ? 'Đã có' : 'Chưa có' })),
  ]
}

const checkIcon = (ok) => ok === true ? h('i', { className: 'bi bi-check-circle-fill text-success' })
  : ok === false ? h('i', { className: 'bi bi-x-circle-fill text-danger' }) : h('i', { className: 'bi bi-dash-circle text-muted' })

// ═════════════ Sinh viên ═════════════
function StudentGraduation({ user, profile, subjects }) {
  const uid = user.uid || user.id
  const [app, setApp]   = useState(undefined)
  const [form, setForm] = useState(null)
  const [ctx, setCtx]   = useState({})
  const [msg, setMsg]   = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const a = await getDocument('graduationApps', uid)
        setApp(a)
        setForm(a ? { ...a, certs: { ...(a.certs || {}) } } : {
          name: profile?.name || user.name || '', studentId: profile?.studentId || '', className: profile?.className || '',
          major: profile?.major || '', faculty: profile?.faculty || '', email: user.email || profile?.email || '', phone: profile?.phone || '',
          gpa: profile?.gpa || '', credits: '', round: '', thesisTitle: '', certs: {}, evidence: '', note: '', pledge: false,
        })
        // Đối chiếu: tổng TC của CTĐT (khớp ngành nếu có) và công nợ học phí
        const programs = await listDocuments('curriculum').catch(() => [])
        const prog = programs.find(p => p.major && profile?.major && p.major.toLowerCase() === profile.major.toLowerCase()) || programs[0]
        const cfg = { ...DEFAULT_FINANCE_CONFIG, ...((await getDocument('financeConfig', 'current').catch(() => null)) || {}) }
        const acc = (await getDocument('tuition', uid).catch(() => null)) || {}
        const sum = tuitionSummary(user, subjects, cfg, acc)
        setCtx({ requiredCredits: Number(prog?.totalCredits) || 0, programName: prog?.name, debt: sum.status === 'unset' ? null : sum.debt })
      } catch (e) { setMsg({ type: 'danger', text: errorText(e) }) }
    })()
  }, [uid])

  if (app === undefined || !form) return h('div', { className: 'text-center py-5' }, h('div', { className: 'spinner-border text-primary' }))

  const locked = app && !['submitted', 'needsFix'].includes(app.status)
  const set = (patch) => setForm(f => ({ ...f, ...patch }))
  const errs = []
  if (!form.name?.trim()) errs.push('Họ tên')
  if (!form.studentId?.trim()) errs.push('Mã số sinh viên')
  if (!form.className?.trim()) errs.push('Lớp')
  if (!form.round?.trim()) errs.push('Đợt xét')
  if (!(Number(form.credits) > 0)) errs.push('Số tín chỉ tích lũy')
  if (form.gpa === '' || isNaN(Number(String(form.gpa).replace(',', '.')))) errs.push('GPA tích lũy')
  if (!form.pledge) errs.push('Cam kết')
  const list = checks(form, ctx)

  const submit = async () => {
    setBusy(true); setMsg(null)
    const { review, reviewedBy, reviewedAt, id, ...rest } = form
    const data = { ...rest, gpa: String(form.gpa).replace(',', '.'), credits: Number(form.credits), status: 'submitted',
      selfCheck: list.map(c => ({ label: c.label, ok: c.ok })), submittedAt: new Date().toISOString(), uid }
    try {
      await setDocument('graduationApps', uid, data, true)
      const a = await getDocument('graduationApps', uid); setApp(a); setForm({ ...a, certs: { ...(a.certs || {}) } })
      setMsg({ type: 'success', text: app ? 'Đã nộp lại phiếu.' : 'Đã nộp phiếu đăng ký xét tốt nghiệp.' })
    } catch (e) { setMsg({ type: 'danger', text: errorText(e) }) }
    setBusy(false)
  }
  const withdraw = async () => {
    if (!confirm('Rút phiếu đăng ký xét tốt nghiệp?')) return
    try { await deleteDocument('graduationApps', uid); setApp(null); setMsg({ type: 'success', text: 'Đã rút phiếu.' }) }
    catch (e) { setMsg({ type: 'danger', text: errorText(e) }) }
  }

  const field = (key, label, props = {}) => h('div', { className: props.col || 'col-12 col-md-6' },
    h('label', { className: 'form-label small fw-semibold', htmlFor: 'grad-' + key }, label),
    h('input', { id: 'grad-' + key, className: 'form-control form-control-sm', value: form[key] ?? '', disabled: locked, onChange: e => set({ [key]: e.target.value }), ...props.input }))

  return h(Frag, null,
    msg && h('div', { className: `alert alert-${msg.type} small py-2` }, msg.text),
    app && h('div', { className: 'card border-0 shadow-sm mb-3' }, h('div', { className: 'card-body d-flex flex-wrap justify-content-between align-items-center gap-2' },
      h('div', null, h('div', { className: 'fw-semibold' }, 'Trạng thái phiếu: ', statusBadge(app.status)),
        h('div', { className: 'small text-muted' }, `Nộp lúc ${fmt(app.submittedAt)}`, app.reviewedAt && ` · Duyệt lúc ${fmt(app.reviewedAt)} bởi ${app.reviewedBy || 'Phòng Đào tạo'}`),
        app.review && h('div', { className: 'small mt-1' }, h('i', { className: 'bi bi-chat-left-text me-1' }), h('strong', null, 'Ý kiến Phòng Đào tạo: '), app.review)),
      h('div', { className: 'd-flex gap-2' },
        h('button', { className: 'btn btn-sm btn-outline-secondary', onClick: () => window.print() }, h('i', { className: 'bi bi-printer me-1' }), 'In phiếu'),
        app.status === 'submitted' && h('button', { className: 'btn btn-sm btn-outline-danger', onClick: withdraw }, 'Rút phiếu')))),

    h('div', { className: 'row g-3' },
      h('div', { className: 'col-12 col-lg-8' },
        h('div', { className: 'card border-0 shadow-sm grad-form' },
          h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 text-center' },
            h('div', { className: 'fw-bold' }, 'PHIẾU ĐĂNG KÝ XÉT TỐT NGHIỆP'),
            locked && h('div', { className: 'small text-muted' }, 'Phiếu đã được xử lý, không sửa được nữa.')),
          h('div', { className: 'card-body px-4' },
            h('div', { className: 'row g-3' },
              field('name', 'Họ và tên *'), field('studentId', 'Mã số sinh viên *', { col: 'col-6 col-md-3' }), field('className', 'Lớp *', { col: 'col-6 col-md-3' }),
              field('major', 'Ngành'), field('faculty', 'Khoa'),
              field('email', 'Email', { input: { type: 'email' } }), field('phone', 'Số điện thoại'),
              field('round', 'Đăng ký xét đợt *', { col: 'col-12 col-md-4', input: { placeholder: 'VD: Đợt 1 năm 2027' } }),
              field('credits', 'Số TC tích lũy *', { col: 'col-6 col-md-4', input: { type: 'number', min: 0 } }),
              field('gpa', 'GPA tích lũy (thang 4) *', { col: 'col-6 col-md-4', input: { placeholder: 'VD: 3.20' } }),
              field('thesisTitle', 'Tên khóa luận / đồ án tốt nghiệp (nếu có)', { col: 'col-12' }),
              h('div', { className: 'col-12' }, h('label', { className: 'form-label small fw-semibold' }, 'Chứng chỉ / chuẩn đầu ra đã có'),
                h('div', { className: 'd-flex flex-wrap gap-3' }, GRAD_CERTS.map(c => h('label', { key: c.key, className: 'form-check small mb-0' },
                  h('input', { type: 'checkbox', className: 'form-check-input', disabled: locked, checked: !!form.certs?.[c.key], onChange: e => set({ certs: { ...form.certs, [c.key]: e.target.checked } }) }),
                  h('span', { className: 'form-check-label' }, c.label))))),
              field('evidence', 'Link minh chứng (thư mục chứng chỉ, bảng điểm)', { col: 'col-12', input: { type: 'url', placeholder: 'https://…' } }),
              h('div', { className: 'col-12' }, h('label', { className: 'form-label small fw-semibold' }, 'Ghi chú'),
                h('textarea', { className: 'form-control form-control-sm', rows: 2, disabled: locked, value: form.note || '', onChange: e => set({ note: e.target.value }) })),
              h('div', { className: 'col-12' }, h('label', { className: 'form-check small' },
                h('input', { type: 'checkbox', className: 'form-check-input', disabled: locked, checked: !!form.pledge, onChange: e => set({ pledge: e.target.checked }) }),
                h('span', { className: 'form-check-label' }, 'Tôi cam đoan các thông tin khai trên là đúng sự thật và chịu trách nhiệm trước nhà trường. *')))
            ),
            !locked && h('div', { className: 'd-flex justify-content-between align-items-center mt-3 flex-wrap gap-2' },
              h('span', { className: 'small text-danger' }, errs.length ? `Còn thiếu: ${errs.join(', ')}` : ''),
              h('button', { className: 'btn btn-primary', disabled: busy || errs.length > 0, onClick: submit },
                h('i', { className: 'bi bi-send me-1' }), app ? 'Nộp lại phiếu' : 'Nộp phiếu'))
          )
        )
      ),
      h('div', { className: 'col-12 col-lg-4' },
        h('div', { className: 'card border-0 shadow-sm' },
          h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 fw-bold' }, h('i', { className: 'bi bi-list-check me-2 text-primary' }), 'Tự kiểm tra điều kiện'),
          h('div', { className: 'card-body pt-0 px-4' },
            list.map(c => h('div', { key: c.label, className: 'd-flex gap-2 py-2 border-bottom small' }, checkIcon(c.ok),
              h('div', null, h('div', { className: 'fw-semibold' }, c.label), h('div', { className: 'text-muted' }, c.detail)))),
            ctx.programName && h('div', { className: 'small text-muted mt-2' }, `Đối chiếu CTĐT: ${ctx.programName}`),
            h('div', { className: 'small text-muted mt-2' }, 'Kết quả chỉ để tham khảo; Phòng Đào tạo xác nhận khi duyệt phiếu.'))
        )
      )
    )
  )
}

// ═════════════ Phòng Đào tạo ═════════════
function ReviewModal({ app, onSave, onClose }) {
  const [status, setStatus] = useState(app.status === 'submitted' ? 'approved' : app.status)
  const [review, setReview] = useState(app.review || '')
  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
    h('div', { className: 'modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' }, h('h5', { className: 'modal-title fw-bold' }, `Phiếu xét tốt nghiệp – ${app.name}`), h('button', { className: 'btn-close', onClick: onClose })),
        h('div', { className: 'modal-body' },
          h('div', { className: 'row g-2 small mb-3' }, [
            ['MSSV', app.studentId], ['Lớp', app.className], ['Ngành', app.major], ['Khoa', app.faculty], ['Email', app.email], ['SĐT', app.phone],
            ['Đợt xét', app.round], ['TC tích lũy', app.credits], ['GPA', app.gpa], ['Khóa luận', app.thesisTitle || '—'],
          ].map(([k, v]) => h('div', { key: k, className: 'col-6 col-md-4' }, h('span', { className: 'text-muted' }, k + ': '), h('strong', null, v || '—')))),
          app.evidence && h('a', { href: app.evidence, target: '_blank', rel: 'noopener noreferrer', className: 'btn btn-sm btn-outline-primary mb-3' }, h('i', { className: 'bi bi-box-arrow-up-right me-1' }), 'Xem minh chứng'),
          h('div', { className: 'fw-semibold small mb-1' }, 'Sinh viên tự kiểm tra'),
          (app.selfCheck || []).map(c => h('div', { key: c.label, className: 'small' }, checkIcon(c.ok), ' ', c.label)),
          app.note && h('div', { className: 'small mt-2' }, h('strong', null, 'Ghi chú SV: '), app.note),
          h('hr'),
          h('label', { className: 'form-label fw-semibold small' }, 'Kết quả'),
          h('select', { className: 'form-select form-select-sm mb-2', value: status, onChange: e => setStatus(e.target.value) },
            ['approved', 'needsFix', 'rejected', 'submitted'].map(k => h('option', { key: k, value: k }, GRAD_STATUS[k].label))),
          h('textarea', { className: 'form-control form-control-sm', rows: 3, placeholder: 'Ý kiến gửi sinh viên (bắt buộc khi yêu cầu bổ sung hoặc từ chối)', value: review, onChange: e => setReview(e.target.value) })
        ),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Đóng'),
          h('button', { className: 'btn btn-primary', disabled: ['needsFix', 'rejected'].includes(status) && !review.trim(), onClick: () => onSave(status, review.trim()) }, 'Lưu kết quả'))
      )
    )
  )
}

function TrainingGraduation({ user }) {
  const [apps, setApps]     = useState(null)
  const [filter, setFilter] = useState('all')
  const [open, setOpen]     = useState(null)
  const [msg, setMsg]       = useState(null)
  const load = async () => { try { setApps(await listDocuments('graduationApps')) } catch (e) { setMsg({ type: 'danger', text: errorText(e) }); setApps([]) } }
  useEffect(() => { load() }, [])

  const save = async (status, review) => {
    try {
      await setDocument('graduationApps', open.id, { status, review, reviewedBy: user.name || user.email || '', reviewedAt: new Date().toISOString() })
      setOpen(null); setMsg({ type: 'success', text: 'Đã lưu kết quả xét.' }); load()
    } catch (e) { setMsg({ type: 'danger', text: errorText(e) }) }
  }
  const exportCSV = () => {
    const rows = [['MSSV', 'Họ tên', 'Lớp', 'Ngành', 'Đợt', 'TC', 'GPA', 'Trạng thái', 'Ý kiến'],
      ...apps.map(a => [a.studentId, a.name, a.className, a.major, a.round, a.credits, a.gpa, GRAD_STATUS[a.status]?.label, a.review || ''])]
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const el = document.createElement('a'); el.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })); el.download = 'xet-tot-nghiep.csv'; el.click()
  }

  if (!apps) return h('div', { className: 'text-center py-5' }, h('div', { className: 'spinner-border text-primary' }))
  const shown = apps.filter(a => filter === 'all' || a.status === filter).sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''))
  const count = (k) => apps.filter(a => a.status === k).length

  return h(Frag, null,
    msg && h('div', { className: `alert alert-${msg.type} small py-2` }, msg.text),
    h('div', { className: 'd-flex flex-wrap gap-2 mb-3' },
      h('button', { className: `btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`, onClick: () => setFilter('all') }, `Tất cả (${apps.length})`),
      Object.entries(GRAD_STATUS).map(([k, s]) => h('button', { key: k, className: `btn btn-sm ${filter === k ? 'btn-primary' : 'btn-outline-primary'}`, onClick: () => setFilter(k) }, `${s.label} (${count(k)})`)),
      h('button', { className: 'btn btn-sm btn-outline-secondary ms-auto', disabled: !apps.length, onClick: exportCSV }, h('i', { className: 'bi bi-download me-1' }), 'Xuất CSV')),
    h('div', { className: 'card border-0 shadow-sm' }, h('div', { className: 'table-responsive' },
      h('table', { className: 'table table-hover align-middle mb-0 report-table' },
        h('thead', null, h('tr', null, ['Sinh viên', 'Lớp', 'Đợt', 'TC', 'GPA', 'Tự kiểm tra', 'Trạng thái', ''].map(t => h('th', { key: t }, t)))),
        h('tbody', null,
          shown.length === 0 && h('tr', null, h('td', { colSpan: 8, className: 'text-center text-muted py-4' }, 'Chưa có phiếu nào.')),
          shown.map(a => {
            const fails = (a.selfCheck || []).filter(c => c.ok === false).length
            return h('tr', { key: a.id },
              h('td', null, h('div', { className: 'fw-semibold' }, a.name), h('div', { className: 'small text-muted' }, a.studentId)),
              h('td', null, a.className), h('td', null, a.round), h('td', null, a.credits), h('td', null, a.gpa),
              h('td', null, fails ? h('span', { className: 'text-danger small' }, `${fails} điều kiện chưa đạt`) : h('span', { className: 'text-success small' }, 'Đạt')),
              h('td', null, statusBadge(a.status)),
              h('td', { className: 'text-end' }, h('button', { className: 'btn btn-sm btn-outline-primary', onClick: () => setOpen(a) }, 'Xem & duyệt')))
          }))
      ))),
    open && h(ReviewModal, { app: open, onSave: save, onClose: () => setOpen(null) })
  )
}

export default function Graduation({ user, profile, subjects = [] }) {
  const staff = user.role === 'training' || user.role === 'admin'
  return h('div', { className: 'container-fluid py-4' },
    h('div', { className: 'mb-4' },
      h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-mortarboard me-2', style: { color: '#6f42c1' } }), staff ? 'Duyệt phiếu xét tốt nghiệp' : 'Đăng ký xét tốt nghiệp'),
      h('small', { className: 'text-muted' }, staff ? 'Phiếu sinh viên nộp, kèm kết quả tự kiểm tra điều kiện.' : 'Điền phiếu, tự kiểm tra điều kiện và theo dõi kết quả xét của Phòng Đào tạo.')),
    staff ? h(TrainingGraduation, { user }) : h(StudentGraduation, { user, profile, subjects })
  )
}
