// utils/tuition.js – Tính học phí và công nợ (thuần logic)
// Học phí = Σ (tín chỉ môn × đơn giá); đơn giá do Phòng Tài chính cấu hình (financeConfig/current).

export const DEFAULT_FINANCE_CONFIG = {
  semester: 'HK1 2026–2027',
  pricePerCredit: 0,          // đồng / tín chỉ lý thuyết
  practicePricePerCredit: 0,  // đồng / tín chỉ thực hành (0 = dùng đơn giá lý thuyết)
  dueDate: '',                // hạn nộp (YYYY-MM-DD)
  reminderDays: [14, 7, 3, 1],// nhắc trước hạn bao nhiêu ngày
  note: '',
}

export const formatVND = (n) => (Math.round(Number(n) || 0)).toLocaleString('vi-VN') + ' đ'

const daysBetween = (fromISO, toISO) => {
  const a = new Date(fromISO + 'T00:00:00'), b = new Date(toISO + 'T00:00:00')
  return Math.round((b - a) / 86400000)
}
export const todayISO = () => {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().split('T')[0]
}

// Các môn sinh viên đăng ký (subjectIds trên hồ sơ do Admin/Đào tạo gán)
export const studentSubjects = (student, subjects) =>
  Array.isArray(student?.subjectIds) ? subjects.filter(s => student.subjectIds.includes(s.id)) : []

// Chi tiết học phí từng môn. Môn có practiceCredits (tín chỉ thực hành) tính theo đơn giá thực hành.
export function tuitionLines(student, subjects, cfg) {
  const p  = Number(cfg?.pricePerCredit) || 0
  const pp = Number(cfg?.practicePricePerCredit) || p
  return studentSubjects(student, subjects).map(s => {
    const credits  = Number(s.credits) || 0
    const practice = Math.min(credits, Number(s.practiceCredits) || 0)
    const theory   = credits - practice
    return { subjectId: s.id, code: s.code, name: s.name, credits, theory, practice, amount: theory * p + practice * pp }
  })
}

// account: tuition/{uid} = { payments:[{amount,date,note}], discount, notices:[{at,message}] }
export function tuitionSummary(student, subjects, cfg, account = {}, today = todayISO()) {
  const lines    = tuitionLines(student, subjects, cfg)
  const credits  = lines.reduce((s, l) => s + l.credits, 0)
  const gross    = lines.reduce((s, l) => s + l.amount, 0)
  const discount = Math.max(0, Number(account.discount) || 0)
  const total    = Math.max(0, gross - discount)
  const paid     = (account.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const debt     = Math.max(0, total - paid)
  const daysLeft = cfg?.dueDate ? daysBetween(today, cfg.dueDate) : null
  const status   = !cfg?.pricePerCredit ? 'unset'
                 : total === 0           ? 'none'
                 : debt === 0            ? 'paid'
                 : daysLeft != null && daysLeft < 0 ? 'overdue'
                 : paid > 0              ? 'partial'
                 :                         'unpaid'
  return { lines, credits, gross, discount, total, paid, debt, daysLeft, status, overpaid: Math.max(0, paid - total) }
}

export const STATUS_INFO = {
  unset:   { label: 'Chưa có đơn giá', color: '#858796', icon: 'hourglass' },
  none:    { label: 'Không phát sinh', color: '#858796', icon: 'dash-circle' },
  paid:    { label: 'Đã nộp đủ',       color: '#1cc88a', icon: 'check-circle-fill' },
  partial: { label: 'Nộp một phần',    color: '#f6c23e', icon: 'pie-chart-fill' },
  unpaid:  { label: 'Chưa nộp',        color: '#4e73df', icon: 'wallet2' },
  overdue: { label: 'Quá hạn',         color: '#e74a3b', icon: 'exclamation-triangle-fill' },
}

// Nhắc công nợ "đến hạn": còn nợ và (quá hạn, hoặc còn ≤ mốc nhắc lớn nhất)
export function tuitionReminder(summary, cfg) {
  if (!summary || summary.debt <= 0 || summary.daysLeft == null) return null
  const maxDays = Math.max(0, ...((cfg?.reminderDays || []).map(Number)))
  const d = summary.daysLeft
  if (d < 0)       return { level: 'overdue', text: `Học phí quá hạn ${-d} ngày – còn nợ ${formatVND(summary.debt)}` }
  if (d === 0)     return { level: 'due',     text: `Hôm nay là hạn nộp học phí – còn nợ ${formatVND(summary.debt)}` }
  if (d <= maxDays) return { level: 'soon',   text: `Còn ${d} ngày đến hạn nộp học phí – còn nợ ${formatVND(summary.debt)}` }
  return null
}
