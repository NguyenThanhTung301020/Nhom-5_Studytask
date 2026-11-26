// utils/studyTools.js – Logic các tiện ích học tập (trang Tiện ích); thuần logic để kiểm thử bằng node --test
import { addDays, tkbDay } from './periods.js'

// ── Quy đổi điểm (thang 10 → điểm chữ, hệ 4) ─────────────────────────────────
export const LETTER_SCALE = [            // [điểm tối thiểu, chữ, hệ 4], từ cao xuống thấp
  [8.5, 'A', 4.0], [8.0, 'B+', 3.5], [7.0, 'B', 3.0], [6.5, 'C+', 2.5],
  [5.5, 'C', 2.0], [5.0, 'D+', 1.5], [4.0, 'D', 1.0], [0, 'F', 0.0],
]
export const PASS_SCORE = 4.0

export function toLetter(v) {
  const x = Number(v)
  if (v === '' || v == null || Number.isNaN(x) || x < 0 || x > 10) return null
  const [, letter, gpa4] = LETTER_SCALE.find(([min]) => x >= min)
  return { letter, gpa4, pass: x >= PASS_SCORE }
}

// ── Tính điểm cuối kỳ cần đạt ───────────────────────────────────────────────
// w: trọng số % { cc, bt, gk, ck }; s: điểm đã có { cc, bt, gk } (thang 10); target: điểm môn muốn đạt.
// Điểm môn làm tròn 1 chữ số (round1 ở utils/grading.js) nên chỉ cần tổng ≥ target − 0,05.
// → { need, status: 'ok' | 'done' | 'impossible' | 'invalid' }; need làm tròn LÊN tới 0,1.
export function neededFinal(w = {}, s = {}, target) {
  const ck = Number(w.ck) || 0
  const parts = ['cc', 'bt', 'gk'].filter(k => Number(w[k]) > 0)
  const sum = parts.reduce((a, k) => a + Number(w[k]), 0) + ck
  if (Math.round(sum) !== 100 || ck <= 0) return { need: null, status: 'invalid' }
  if (parts.some(k => s[k] === '' || s[k] == null || Number.isNaN(Number(s[k])) || s[k] < 0 || s[k] > 10)) return { need: null, status: 'invalid' }
  const qt = parts.reduce((a, k) => a + Number(w[k]) / 100 * Number(s[k]), 0)
  const raw = (Number(target) - 0.05 - qt) / (ck / 100)
  const need = Math.max(0, Math.ceil(Math.round(raw * 1e6) / 1e5) / 10)
  if (need > 10) return { need, status: 'impossible' }
  return { need, status: need === 0 ? 'done' : 'ok' }
}

// Mục tiêu hiển thị sẵn: qua môn và các mốc điểm chữ
export const TARGETS = [['Qua môn (D)', 4.0], ['C', 5.5], ['B', 7.0], ['B+', 8.0], ['A', 8.5]]

// ── Pomodoro ─────────────────────────────────────────────────────────────────
export const POMO_PRESETS = {
  p25: { label: '25 / 5',  work: 25, short: 5,  long: 15 },
  p50: { label: '50 / 10', work: 50, short: 10, long: 20 },
}
// Số giây còn lại của phiên đang chạy (tính theo mốc kết thúc nên không lệch khi chuyển trang)
export const secondsLeft = (endAt, now = Date.now()) => Math.max(0, Math.ceil((endAt - now) / 1000))

// Deadline chưa xong, sắp hạn trước (để chọn việc đang làm)
export const openDeadlines = (deadlines = []) =>
  deadlines.filter(d => d && d.status !== 'completed').sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || '')))

// Tổng kết phiên tập trung: log = [{ date: 'yyyy-mm-dd', mins, deadlineId }]
export function pomoStats(log = [], today, deadlineId = null) {
  const todayLog = log.filter(x => x.date === today)
  return {
    todayCount: todayLog.length,
    todayMins: todayLog.reduce((a, x) => a + (Number(x.mins) || 0), 0),
    taskCount: deadlineId == null ? 0 : log.filter(x => x.deadlineId === deadlineId).length,
  }
}

// ── Lập kế hoạch ôn thi ──────────────────────────────────────────────────────
// Kỳ thi từ hôm nay trở đi, gần nhất trước; kèm tên môn để hiện trong ô chọn
export function upcomingExams(exams = [], subjects = [], today) {
  return exams
    .filter(e => e && e.date && e.date >= today)
    .sort((a, b) => (a.date + (a.start || '')).localeCompare(b.date + (b.start || '')))
    .map(e => ({ ...e, subjectName: subjects.find(s => s.id === e.subjectId)?.name || 'Môn học' }))
}

// Tách nội dung ôn: mỗi dòng một mục, bỏ dòng trống và dòng trùng, tối đa 60 mục
export const parseTopics = (text = '') =>
  [...new Set(String(text).split(/\r?\n/).map(s => s.trim()).filter(Boolean))].slice(0, 60)

// Chia nội dung ôn từ `today` đến hết ngày trước ngày thi.
// Ngày cuối dành để ôn tổng hợp (nếu có từ 2 ngày trở lên); các mục chia đều theo thứ tự cho những ngày còn lại,
// ngày không có mục nào là ngày ôn lại, làm đề. → [{ date, topics: [], kind: 'study' | 'review' }]
export function buildStudyPlan(today, examDate, topics = []) {
  const days = []
  for (let d = today; d < examDate; d = addDays(d, 1)) days.push(d)
  if (!days.length || !topics.length) return []
  const studyDays = days.length >= 2 ? days.slice(0, -1) : days
  const plan = studyDays.map(date => ({ date, topics: [], kind: 'study' }))
  topics.forEach((t, i) => plan[Math.floor(i * studyDays.length / topics.length)].topics.push(t))
  plan.forEach(p => { if (!p.topics.length) p.kind = 'review' })
  if (days.length >= 2) plan.push({ date: days.at(-1), topics: ['Ôn tổng hợp, xem lại phần còn yếu'], kind: 'review' })
  return plan
}

// Lập lại từ hôm nay: giữ những mục đã đánh dấu xong, chia lại phần còn lại
export function replan(plan = [], done = {}, today, examDate) {
  const left = plan.filter(p => p.kind === 'study' && !done[p.date]).flatMap(p => p.topics)
  return buildStudyPlan(today, examDate, left)
}

// Tiến độ: số ngày đã xong / tổng ngày; ngày nào đã qua mà chưa xong
export function planProgress(plan = [], done = {}, today) {
  return {
    done: plan.filter(p => done[p.date]).length,
    total: plan.length,
    behind: plan.filter(p => p.date < today && !done[p.date]).length,
  }
}

export const DAY_SHORT = { 2: 'T2', 3: 'T3', 4: 'T4', 5: 'T5', 6: 'T6', 7: 'T7', 8: 'CN' }
export const dayLabel = (iso) => `${DAY_SHORT[tkbDay(iso)]} ${iso.slice(8, 10)}/${iso.slice(5, 7)}`

