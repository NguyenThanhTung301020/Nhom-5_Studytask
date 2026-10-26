// pages/Tuition.js – Học phí & công nợ
//   Sinh viên: xem học phí tự tính theo tín chỉ, lịch sử nộp, thông báo, nhắc đến hạn
//   Phòng Tài chính / Admin: cấu hình đơn giá tín chỉ + hạn nộp, ghi nhận thanh toán, miễn giảm, gửi thông báo công nợ
import { getDocument, setDocument, listDocuments, errorText } from '../utils/store.js'
import { DEFAULT_FINANCE_CONFIG, tuitionSummary, tuitionReminder, formatVND, STATUS_INFO, todayISO } from '../utils/tuition.js'

const { useState, useEffect, useMemo, createElement: h } = window.React
const Frag = window.React.Fragment

const fmtDate = (d) => d ? d.split('-').reverse().join('/') : '—'
const badge = (status) => {
  const s = STATUS_INFO[status] || STATUS_INFO.none
  return h('span', { className: 'badge', style: { background: s.color + '22', color: s.color } }, h('i', { className: `bi bi-${s.icon} me-1` }), s.label)
}

function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

// ── Nội dung thông báo công nợ mặc định ──
const noticeText = (student, sum, cfg) =>
  `Thông báo học phí ${cfg.semester || ''}: ${student.name || student.email} đăng ký ${sum.credits} tín chỉ, ` +
  `học phí ${formatVND(sum.total)}, đã nộp ${formatVND(sum.paid)}, còn nợ ${formatVND(sum.debt)}. ` +
  (cfg.dueDate ? `Hạn nộp: ${fmtDate(cfg.dueDate)}.` : '')

// ═════════════════ Sinh viên ═════════════════
function StudentTuition({ user, subjects }) {
  const [cfg, setCfg] = useState(null)
  const [acc, setAcc] = useState({})
  const [err, setErr] = useState('')

  useEffect(() => {
    (async () => {
      try {
        setCfg({ ...DEFAULT_FINANCE_CONFIG, ...((await getDocument('financeConfig', 'current')) || {}) })
        setAcc((await getDocument('tuition', user.uid || user.id)) || {})
      } catch (e) { setErr(errorText(e)); setCfg(DEFAULT_FINANCE_CONFIG) }
    })()
  }, [user])

  if (!cfg) return h('div', { className: 'text-center py-5' }, h('div', { className: 'spinner-border text-primary' }))
  const sum = tuitionSummary(user, subjects, cfg, acc)
  const rem = tuitionReminder(sum, cfg)

  return h(Frag, null,
    err && h('div', { className: 'alert alert-danger small' }, err),
    sum.status === 'unset' && h('div', { className: 'alert alert-secondary small' }, h('i', { className: 'bi bi-hourglass me-1' }),
      'Phòng Tài chính chưa công bố đơn giá tín chỉ cho học kỳ này.'),
    rem && h('div', { className: `alert ${rem.level === 'overdue' ? 'alert-danger' : 'alert-warning'} d-flex align-items-center gap-2`, role: 'alert' },
      h('i', { className: 'bi bi-bell-fill fs-5' }), h('div', null, h('strong', null, rem.text), cfg.note && h('div', { className: 'small mt-1' }, cfg.note))),

    h('div', { className: 'row g-3 mb-3' },
      [
        { label: 'Tổng tín chỉ', value: sum.credits, icon: 'award', color: '#36b9cc' },
        { label: 'Học phí phải nộp', value: formatVND(sum.total), icon: 'receipt', color: '#4e73df' },
        { label: 'Đã nộp', value: formatVND(sum.paid), icon: 'check2-circle', color: '#1cc88a' },
        { label: 'Còn nợ', value: formatVND(sum.debt), icon: 'exclamation-diamond', color: sum.debt > 0 ? '#e74a3b' : '#1cc88a' },
      ].map(c => h('div', { key: c.label, className: 'col-6 col-lg-3' },
        h('div', { className: 'card border-0 shadow-sm p-3 h-100' },
          h('div', { className: 'small text-muted' }, h('i', { className: `bi bi-${c.icon} me-1`, style: { color: c.color } }), c.label),
          h('div', { className: 'fw-bold fs-5 mt-1', style: { color: c.color } }, c.value))))
    ),

    h('div', { className: 'row g-3' },
      h('div', { className: 'col-12 col-lg-7' },
        h('div', { className: 'card border-0 shadow-sm' },
          h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2' },
            h('span', { className: 'fw-bold' }, h('i', { className: 'bi bi-list-check me-2 text-primary' }), `Chi tiết học phí ${cfg.semester || ''}`),
            h('span', null, badge(sum.status), cfg.dueDate && h('span', { className: 'small text-muted ms-2' }, 'Hạn nộp: ', h('strong', null, fmtDate(cfg.dueDate))))),
          h('div', { className: 'table-responsive' },
            h('table', { className: 'table table-sm align-middle mb-0' },
              h('thead', null, h('tr', null, ['Mã', 'Môn học', 'TC LT', 'TC TH', 'Thành tiền'].map((t, i) => h('th', { key: t, className: `small text-muted${i >= 2 ? ' text-end' : ''}` }, t)))),
              h('tbody', null,
                sum.lines.length === 0 && h('tr', null, h('td', { colSpan: 5, className: 'text-muted small text-center py-3' }, 'Bạn chưa được gán môn học nào.')),
                sum.lines.map(l => h('tr', { key: l.subjectId },
                  h('td', { className: 'small' }, l.code), h('td', { className: 'small' }, l.name),
                  h('td', { className: 'small text-end' }, l.theory), h('td', { className: 'small text-end' }, l.practice),
                  h('td', { className: 'small text-end fw-semibold' }, formatVND(l.amount))))
              ),
              h('tfoot', null,
                sum.discount > 0 && h('tr', null, h('td', { colSpan: 4, className: 'small text-end' }, 'Miễn giảm'), h('td', { className: 'small text-end text-success' }, '− ' + formatVND(sum.discount))),
                h('tr', null, h('td', { colSpan: 4, className: 'text-end fw-bold' }, 'Tổng phải nộp'), h('td', { className: 'text-end fw-bold' }, formatVND(sum.total))))
            )
          ),
          h('div', { className: 'card-body small text-muted pt-2' },
            `Đơn giá: ${formatVND(cfg.pricePerCredit)}/tín chỉ lý thuyết`,
            Number(cfg.practicePricePerCredit) > 0 && ` · ${formatVND(cfg.practicePricePerCredit)}/tín chỉ thực hành`,
            '. Học phí tự tính từ các môn bạn đăng ký.')
        )
      ),
      h('div', { className: 'col-12 col-lg-5 d-flex flex-column gap-3' },
        h('div', { className: 'card border-0 shadow-sm' },
          h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 fw-bold' }, h('i', { className: 'bi bi-clock-history me-2 text-success' }), 'Lịch sử nộp'),
          h('div', { className: 'card-body pt-0 px-4' },
            (acc.payments || []).length === 0 ? h('div', { className: 'text-muted small' }, 'Chưa có khoản nộp nào.')
              : (acc.payments || []).slice().reverse().map((p, i) => h('div', { key: i, className: 'd-flex justify-content-between border-bottom py-2 small' },
                  h('span', null, fmtDate(p.date), p.method && h('span', { className: 'text-muted' }, ' · ', p.method), p.note && h('div', { className: 'text-muted' }, p.note)),
                  h('strong', { className: 'text-success' }, formatVND(p.amount))))
          )
        ),
        h('div', { className: 'card border-0 shadow-sm' },
          h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 fw-bold' }, h('i', { className: 'bi bi-envelope-paper me-2 text-warning' }), 'Thông báo từ Phòng Tài chính'),
          h('div', { className: 'card-body pt-0 px-4' },
            (acc.notices || []).length === 0 ? h('div', { className: 'text-muted small' }, 'Chưa có thông báo.')
              : (acc.notices || []).slice().reverse().map((n, i) => h('div', { key: i, className: 'border-bottom py-2 small' },
                  h('div', { className: 'text-muted' }, fmtDate(n.at)), n.message)))
        )
      )
    )
  )
}

// ═════════════════ Phòng Tài chính ═════════════════
function PaymentModal({ student, sum, onSave, onClose }) {
  const [f, setF] = useState({ amount: sum.debt || '', date: todayISO(), method: 'Chuyển khoản', note: '', discount: sum.discount || 0 })
  const valid = Number(f.amount) > 0 || Number(f.discount) !== sum.discount
  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
    h('div', { className: 'modal-dialog modal-dialog-centered' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' }, h('h5', { className: 'modal-title fw-bold' }, h('i', { className: 'bi bi-cash-stack me-2 text-success' }), 'Ghi nhận thanh toán'),
          h('button', { className: 'btn-close', onClick: onClose })),
        h('div', { className: 'modal-body' },
          h('div', { className: 'small mb-3' }, h('strong', null, student.name || student.email), ' · còn nợ ', h('strong', { className: 'text-danger' }, formatVND(sum.debt))),
          h('div', { className: 'row g-3' },
            h('div', { className: 'col-6' }, h('label', { className: 'form-label fw-semibold' }, 'Số tiền nộp (đ)'),
              h('input', { type: 'number', min: 0, step: 1000, className: 'form-control', value: f.amount, onChange: e => setF({ ...f, amount: e.target.value }) })),
            h('div', { className: 'col-6' }, h('label', { className: 'form-label fw-semibold' }, 'Ngày nộp'),
              h('input', { type: 'date', className: 'form-control', value: f.date, onChange: e => setF({ ...f, date: e.target.value }) })),
            h('div', { className: 'col-6' }, h('label', { className: 'form-label fw-semibold' }, 'Hình thức'),
              h('select', { className: 'form-select', value: f.method, onChange: e => setF({ ...f, method: e.target.value }) },
                ['Chuyển khoản', 'Tiền mặt', 'Cổng thanh toán', 'Khác'].map(m => h('option', { key: m }, m)))),
            h('div', { className: 'col-6' }, h('label', { className: 'form-label fw-semibold' }, 'Miễn giảm (đ)'),
              h('input', { type: 'number', min: 0, step: 1000, className: 'form-control', value: f.discount, onChange: e => setF({ ...f, discount: e.target.value }) })),
            h('div', { className: 'col-12' }, h('label', { className: 'form-label fw-semibold' }, 'Ghi chú'),
              h('input', { className: 'form-control', placeholder: 'VD: mã giao dịch, diện miễn giảm…', value: f.note, onChange: e => setF({ ...f, note: e.target.value }) }))
          ),
          Number(f.amount) > sum.debt && sum.debt > 0 && h('div', { className: 'alert alert-warning small py-2 mt-3 mb-0' }, 'Số tiền lớn hơn số còn nợ – phần dư sẽ ghi nhận là nộp thừa.')
        ),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
          h('button', { className: 'btn btn-success', disabled: !valid, onClick: () => onSave(f) }, 'Lưu'))
      )
    )
  )
}

function NoticeModal({ targets, makeText, onSend, onClose }) {
  const [msg, setMsg] = useState(targets.length === 1 ? makeText(targets[0]) : '')
  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
    h('div', { className: 'modal-dialog modal-dialog-centered' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' }, h('h5', { className: 'modal-title fw-bold' }, h('i', { className: 'bi bi-megaphone me-2 text-warning' }), `Gửi thông báo công nợ (${targets.length} SV)`),
          h('button', { className: 'btn-close', onClick: onClose })),
        h('div', { className: 'modal-body' },
          h('textarea', { className: 'form-control', rows: 5, value: msg, onChange: e => setMsg(e.target.value),
            placeholder: targets.length > 1 ? 'Để trống: mỗi sinh viên nhận nội dung tự sinh theo số nợ của mình.' : '' }),
          h('div', { className: 'form-text' }, 'Sinh viên thấy thông báo ở trang Học phí và chuông thông báo.')),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
          h('button', { className: 'btn btn-warning', onClick: () => onSend(msg) }, h('i', { className: 'bi bi-send me-1' }), 'Gửi'))
      )
    )
  )
}

function FinanceTuition({ allUsers, subjects }) {
  const [cfg, setCfg]       = useState(null)
  const [form, setForm]     = useState(null)
  const [accounts, setAcc]  = useState({})
  const [filter, setFilter] = useState('all')
  const [q, setQ]           = useState('')
  const [payFor, setPayFor] = useState(null)
  const [noticeFor, setNoticeFor] = useState(null)
  const [msg, setMsg]       = useState(null)

  const reload = async () => {
    try {
      const c = { ...DEFAULT_FINANCE_CONFIG, ...((await getDocument('financeConfig', 'current')) || {}) }
      setCfg(c); setForm({ ...c, reminderDays: (c.reminderDays || []).join(', ') })
      setAcc(Object.fromEntries((await listDocuments('tuition')).map(d => [d.id, d])))
    } catch (e) { setMsg({ type: 'danger', text: errorText(e) }); setCfg(DEFAULT_FINANCE_CONFIG); setForm({ ...DEFAULT_FINANCE_CONFIG, reminderDays: '' }) }
  }
  useEffect(() => { reload() }, [])

  const students = allUsers.filter(u => u.role === 'student')
  const rows = useMemo(() => !cfg ? [] : students.map(s => ({ s, sum: tuitionSummary(s, subjects, cfg, accounts[s.uid] || {}) })), [students, subjects, cfg, accounts])
  const shown = rows.filter(r => (filter === 'all' || r.sum.status === filter || (filter === 'debt' && r.sum.debt > 0)) &&
    (!q || `${r.s.name} ${r.s.email}`.toLowerCase().includes(q.toLowerCase())))
  const totals = rows.reduce((t, r) => ({ total: t.total + r.sum.total, paid: t.paid + Math.min(r.sum.paid, r.sum.total), debt: t.debt + r.sum.debt }), { total: 0, paid: 0, debt: 0 })

  const cfgErr = !form ? '' : Number(form.pricePerCredit) <= 0 ? 'Đơn giá tín chỉ phải lớn hơn 0.'
    : !form.dueDate ? 'Chưa chọn hạn nộp.' : ''
  const saveCfg = async () => {
    const days = String(form.reminderDays).split(/[,\s]+/).map(Number).filter(n => n > 0).sort((a, b) => b - a)
    const data = { semester: form.semester, pricePerCredit: Number(form.pricePerCredit), practicePricePerCredit: Number(form.practicePricePerCredit) || 0,
      dueDate: form.dueDate, reminderDays: days, note: form.note || '', updatedAt: new Date().toISOString() }
    try { await setDocument('financeConfig', 'current', data, false); setMsg({ type: 'success', text: 'Đã lưu cấu hình học phí. Học phí của sinh viên được tính lại ngay.' }); reload() }
    catch (e) { setMsg({ type: 'danger', text: errorText(e) }) }
  }

  const savePayment = async (f) => {
    const { s } = payFor
    const cur = accounts[s.uid] || {}
    const payments = [...(cur.payments || [])]
    if (Number(f.amount) > 0) payments.push({ amount: Number(f.amount), date: f.date, method: f.method, note: f.note, at: new Date().toISOString() })
    try {
      await setDocument('tuition', s.uid, { payments, discount: Number(f.discount) || 0, studentName: s.name || '', email: s.email || '' })
      setPayFor(null); setMsg({ type: 'success', text: `Đã ghi nhận cho ${s.name || s.email}.` }); reload()
    } catch (e) { setMsg({ type: 'danger', text: errorText(e) }) }
  }

  const sendNotices = async (text) => {
    try {
      for (const { s, sum } of noticeFor) {
        const cur = accounts[s.uid] || {}
        const message = text.trim() || noticeText(s, sum, cfg)
        await setDocument('tuition', s.uid, { notices: [...(cur.notices || []), { at: todayISO(), message }], studentName: s.name || '', email: s.email || '' })
      }
      setMsg({ type: 'success', text: `Đã gửi thông báo cho ${noticeFor.length} sinh viên.` }); setNoticeFor(null); reload()
    } catch (e) { setMsg({ type: 'danger', text: errorText(e) }) }
  }

  const exportCSV = () => downloadCSV(`hoc-phi-${(cfg.semester || '').replace(/\s+/g, '-')}.csv`, [
    ['Họ tên', 'Email', 'Tín chỉ', 'Học phí', 'Miễn giảm', 'Phải nộp', 'Đã nộp', 'Còn nợ', 'Trạng thái'],
    ...rows.map(({ s, sum }) => [s.name, s.email, sum.credits, sum.gross, sum.discount, sum.total, sum.paid, sum.debt, STATUS_INFO[sum.status].label]),
  ])

  if (!cfg || !form) return h('div', { className: 'text-center py-5' }, h('div', { className: 'spinner-border text-primary' }))
  const debtors = rows.filter(r => r.sum.debt > 0)

  return h(Frag, null,
    msg && h('div', { className: `alert alert-${msg.type} alert-dismissible small py-2` }, msg.text,
      h('button', { className: 'btn-close', onClick: () => setMsg(null) })),

    // Cấu hình
    h('div', { className: 'card border-0 shadow-sm mb-3' },
      h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 fw-bold' }, h('i', { className: 'bi bi-sliders me-2 text-primary' }), 'Cấu hình học phí học kỳ'),
      h('div', { className: 'card-body pt-0 px-4' },
        h('div', { className: 'row g-3' },
          h('div', { className: 'col-12 col-md-3' }, h('label', { className: 'form-label small fw-semibold' }, 'Học kỳ'),
            h('input', { className: 'form-control form-control-sm', value: form.semester, onChange: e => setForm({ ...form, semester: e.target.value }) })),
          h('div', { className: 'col-6 col-md-2' }, h('label', { className: 'form-label small fw-semibold' }, 'Đơn giá TC lý thuyết (đ)'),
            h('input', { type: 'number', min: 0, step: 1000, className: 'form-control form-control-sm', value: form.pricePerCredit, onChange: e => setForm({ ...form, pricePerCredit: e.target.value }) })),
          h('div', { className: 'col-6 col-md-2' }, h('label', { className: 'form-label small fw-semibold' }, 'Đơn giá TC thực hành (đ)'),
            h('input', { type: 'number', min: 0, step: 1000, className: 'form-control form-control-sm', placeholder: 'Bằng lý thuyết', value: form.practicePricePerCredit || '', onChange: e => setForm({ ...form, practicePricePerCredit: e.target.value }) })),
          h('div', { className: 'col-6 col-md-2' }, h('label', { className: 'form-label small fw-semibold' }, 'Hạn nộp'),
            h('input', { type: 'date', className: 'form-control form-control-sm', value: form.dueDate, onChange: e => setForm({ ...form, dueDate: e.target.value }) })),
          h('div', { className: 'col-6 col-md-3' }, h('label', { className: 'form-label small fw-semibold' }, 'Nhắc trước hạn (ngày)'),
            h('input', { className: 'form-control form-control-sm', placeholder: 'VD: 14, 7, 3, 1', value: form.reminderDays, onChange: e => setForm({ ...form, reminderDays: e.target.value }) })),
          h('div', { className: 'col-12 col-md-9' }, h('label', { className: 'form-label small fw-semibold' }, 'Ghi chú hiển thị cho sinh viên'),
            h('input', { className: 'form-control form-control-sm', placeholder: 'VD: số tài khoản, nội dung chuyển khoản…', value: form.note, onChange: e => setForm({ ...form, note: e.target.value }) })),
          h('div', { className: 'col-12 col-md-3 d-flex align-items-end' },
            h('button', { className: 'btn btn-primary btn-sm w-100', disabled: !!cfgErr, onClick: saveCfg }, h('i', { className: 'bi bi-save me-1' }), 'Lưu cấu hình'))
        ),
        cfgErr && h('div', { className: 'small text-danger mt-2' }, cfgErr)
      )
    ),

    // Tổng quan
    h('div', { className: 'row g-3 mb-3' },
      [['Phải thu', totals.total, '#4e73df'], ['Đã thu', totals.paid, '#1cc88a'], ['Còn nợ', totals.debt, '#e74a3b']].map(([l, v, c]) =>
        h('div', { key: l, className: 'col-12 col-md-4' }, h('div', { className: 'card border-0 shadow-sm p-3' },
          h('div', { className: 'small text-muted' }, l), h('div', { className: 'fw-bold fs-5', style: { color: c } }, formatVND(v)))))
    ),

    // Danh sách sinh viên
    h('div', { className: 'card border-0 shadow-sm' },
      h('div', { className: 'card-body d-flex flex-wrap gap-2 align-items-center' },
        h('input', { className: 'form-control form-control-sm', style: { maxWidth: 240 }, placeholder: 'Tìm tên, email…', value: q, onChange: e => setQ(e.target.value) }),
        h('select', { className: 'form-select form-select-sm', style: { width: 'auto' }, value: filter, onChange: e => setFilter(e.target.value) },
          h('option', { value: 'all' }, 'Tất cả'), h('option', { value: 'debt' }, 'Còn nợ'),
          ['overdue', 'unpaid', 'partial', 'paid'].map(k => h('option', { key: k, value: k }, STATUS_INFO[k].label))),
        h('div', { className: 'ms-auto d-flex gap-2' },
          h('button', { className: 'btn btn-sm btn-warning', disabled: debtors.length === 0, onClick: () => setNoticeFor(debtors) },
            h('i', { className: 'bi bi-megaphone me-1' }), `Nhắc nợ ${debtors.length} SV`),
          h('button', { className: 'btn btn-sm btn-outline-secondary', onClick: exportCSV }, h('i', { className: 'bi bi-download me-1' }), 'Xuất CSV'))
      ),
      h('div', { className: 'table-responsive' },
        h('table', { className: 'table table-hover align-middle mb-0 report-table' },
          h('thead', null, h('tr', null, ['Sinh viên', 'TC', 'Phải nộp', 'Đã nộp', 'Còn nợ', 'Trạng thái', ''].map((t, i) => h('th', { key: i, className: i >= 1 && i <= 4 ? 'text-end' : '' }, t)))),
          h('tbody', null,
            shown.length === 0 && h('tr', null, h('td', { colSpan: 7, className: 'text-center text-muted py-4' }, 'Không có sinh viên phù hợp.')),
            shown.map(({ s, sum }) => h('tr', { key: s.uid },
              h('td', null, h('div', { className: 'fw-semibold' }, s.name || s.email), h('div', { className: 'small text-muted' }, s.email)),
              h('td', { className: 'text-end' }, sum.credits),
              h('td', { className: 'text-end' }, formatVND(sum.total)),
              h('td', { className: 'text-end text-success' }, formatVND(sum.paid)),
              h('td', { className: `text-end fw-semibold${sum.debt ? ' text-danger' : ''}` }, formatVND(sum.debt)),
              h('td', null, badge(sum.status)),
              h('td', { className: 'text-end' }, h('div', { className: 'btn-group btn-group-sm' },
                h('button', { className: 'btn btn-outline-success', title: 'Ghi nhận thanh toán', onClick: () => setPayFor({ s, sum }) }, h('i', { className: 'bi bi-cash-stack' })),
                h('button', { className: 'btn btn-outline-warning', title: 'Gửi thông báo', onClick: () => setNoticeFor([{ s, sum }]) }, h('i', { className: 'bi bi-envelope' }))))
            ))
          )
        )
      )
    ),

    payFor && h(PaymentModal, { student: payFor.s, sum: payFor.sum, onSave: savePayment, onClose: () => setPayFor(null) }),
    noticeFor && h(NoticeModal, { targets: noticeFor, makeText: ({ s, sum }) => noticeText(s, sum, cfg), onSend: sendNotices, onClose: () => setNoticeFor(null) })
  )
}

export default function Tuition({ user, allUsers = [], subjects = [] }) {
  const isFinance = user.role === 'finance' || user.role === 'admin'
  return h('div', { className: 'container-fluid py-4' },
    h('div', { className: 'mb-4' },
      h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-cash-coin me-2', style: { color: '#e67e22' } }), isFinance ? 'Quản lý học phí & công nợ' : 'Học phí của tôi'),
      h('small', { className: 'text-muted' }, isFinance
        ? 'Học phí tự tính = số tín chỉ sinh viên đăng ký × đơn giá tín chỉ. Sinh viên được nhắc khi đến hạn.'
        : 'Học phí tự tính theo số tín chỉ bạn đăng ký và đơn giá do Phòng Tài chính công bố.')
    ),
    isFinance ? h(FinanceTuition, { allUsers, subjects }) : h(StudentTuition, { user, subjects })
  )
}
