// utils/studyTools.js – Logic các tiện ích học tập (trang Tiện ích); thuần logic để kiểm thử bằng node --test
import { addDays, tkbDay } from './periods.js'
import { COMPONENTS, defaultPolicy, subjectColumns, countedColumns, evaluateStudentSubject, subjectScore } from './grading.js'
import { currentTerm, termKey, offeringTitle } from './scope.js'

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

// ── Ôn thi: điểm hiện tại so với mục tiêu ────────────────────────────────────
// Các mức mục tiêu lấy đúng thang điểm chữ ở trên: qua môn (D) rồi tới từng xếp loại cao hơn
export const GOAL_TARGETS = LETTER_SCALE.filter(([, letter]) => letter !== 'F').reverse()
  .map(([score, letter]) => ({ score, letter, label: score === PASS_SCORE ? `Qua môn (${letter})` : `Xếp loại ${letter}` }))

// Mục tiêu gợi ý: chưa có điểm hoặc chưa qua → qua môn; đã qua → xếp loại kế tiếp; đã ở mức cao nhất → giữ mức đó
export function suggestTarget(current) {
  if (current == null || current < PASS_SCORE) return PASS_SCORE
  return (GOAL_TARGETS.find(t => t.score > current) || GOAL_TARGETS.at(-1)).score
}

// Điểm môn của chính người dùng, đọc dữ liệu giống Bảng điểm (components/GradeBook.js) rồi tính bằng utils/grading.js.
//   cell: phần điểm giáo viên nhập (grades[uid][subjectId]); events: nhật ký hoạt động của người dùng, trong đó
//   sự kiện `quiz` đã được thay bằng kết quả chính thức (utils/quizScores.js)
export function myEvaluation({ subject, policyDoc, columnsDoc, quizzes = [], homeworks = [], cell = {}, events = [] }) {
  const columns = subjectColumns(subject.id, quizzes, homeworks)
  const last = (type, id) => events.filter(e => e.type === type && e.subjectId === subject.id && e.refId === id).at(-1)
  const quizScore = (id) => last('quiz', id)?.score ?? null
  const colScore = (key) => {
    const [t, id] = key.split(':')
    if (t !== 'q') return cell.hw?.[id] ?? null
    return cell.quiz?.[id] !== undefined ? cell.quiz[id] : quizScore(Number(id))
  }
  const colDone = (key) => {
    const [t, id] = key.split(':')
    return t === 'q' ? quizScore(Number(id)) != null : !!last('homework', Number(id)) || cell.hw?.[id] != null
  }
  const policy = { ...defaultPolicy(subject), ...(policyDoc || {}) }
  const ev = evaluateStudentSubject({ policy, columns, counted: countedColumns(columnsDoc, columns), colScore, colDone, cell })
  return { ...ev, gradedColumns: ev.countedCols.filter(c => colScore(c.key) != null).length }
}

// Các thành phần tạo nên điểm môn theo quy chế (bỏ thành phần trọng số 0; 'th' khi môn có phần thực hành)
export const goalParts = (policy) => [...COMPONENTS.filter(k => Number(policy.weights[k]) > 0), ...(policy.practice?.enabled ? ['th'] : [])]

// Điểm người dùng tự nhập cho cột hệ thống chưa có: chỉ nhận số trong thang 10 (chấp nhận dấu phẩy thập phân)
export function manualScore(v) {
  const s = String(v ?? '').trim().replace(',', '.')
  const x = Number(s)
  return s !== '' && x >= 0 && x <= 10 ? x : null
}

// Ghép điểm hệ thống với điểm tự nhập; điểm hệ thống luôn được ưu tiên. typed: các cột đang dùng điểm tự nhập
export function mergeScores(parts, system = {}, manual = {}) {
  const scores = {}, typed = []
  for (const k of parts) {
    scores[k] = system[k] ?? manualScore(manual[k])
    if (system[k] == null && scores[k] != null) typed.push(k)
  }
  return { scores, typed }
}

// So sánh với mục tiêu. policy: quy chế đã áp dụng (evaluateStudentSubject().eff).
// Thử lần lượt 0,0 → 10,0 cho MỌI cột còn thiếu và tính bằng đúng subjectScore (kể cả cách làm tròn).
// → { status, need, missing, current, official, low, high }
//    achieved / failed : đã đủ điểm, đạt / không đạt mục tiêu
//    done              : còn thiếu cột nhưng 0 điểm vẫn đạt
//    ok                : cần tối thiểu `need` ở mỗi cột còn thiếu
//    impossible        : 10 điểm mọi cột còn thiếu vẫn không đạt
//    invalid           : quy chế không tính được điểm (vd. môn có thực hành nhưng số tín chỉ bằng 0)
export function goalAnalysis(policy, scores, target) {
  const missing = goalParts(policy).filter(k => scores[k] == null)
  const now = subjectScore(policy, scores)
  const at = (x) => subjectScore(policy, { ...scores, ...Object.fromEntries(missing.map(k => [k, x])) }).final
  const low = at(0), high = at(10)
  const reach = (v) => v >= target - 1e-9
  const base = { need: null, missing, current: now.final ?? now.provisional, official: now.final != null, low, high }
  if (high == null || Number.isNaN(high)) return { ...base, status: 'invalid' }
  if (!missing.length) return { ...base, status: reach(high) ? 'achieved' : 'failed' }
  if (reach(low)) return { ...base, status: 'done', need: 0 }
  if (!reach(high)) return { ...base, status: 'impossible' }
  let i = 1
  while (!reach(at(i / 10))) i++
  return { ...base, status: 'ok', need: i / 10 }
}

// ── Ôn thi: môn học và mục giáo trình ────────────────────────────────────────
// Chia môn cho ô chọn: có lịch thi sắp tới (gần nhất trước) → học kỳ hiện tại → còn lại (mới nhất trước)
export function subjectGroups(subjects = [], exams = [], today, term = currentTerm(new Date(today))) {
  const next = new Map()
  for (const e of upcomingExams(exams, subjects, today)) if (!next.has(e.subjectId)) next.set(e.subjectId, e.date)
  const title = (s) => offeringTitle(s) || 'Môn học'
  const byTitle = (a, b) => title(a).localeCompare(title(b), 'vi')
  const rest = subjects.filter(s => !next.has(s.id))
  const now = `${term.namHoc}|${term.ky}`
  return [
    { label: 'Có lịch thi sắp tới', items: subjects.filter(s => next.has(s.id)).sort((a, b) => next.get(a.id).localeCompare(next.get(b.id)) || byTitle(a, b)) },
    { label: 'Học kỳ hiện tại', items: rest.filter(s => termKey(s) === now).sort(byTitle) },
    { label: 'Học phần khác', items: rest.filter(s => termKey(s) !== now).sort((a, b) => termKey(b).localeCompare(termKey(a)) || byTitle(a, b)) },
  ].filter(g => g.items.length)
}

// Thứ tự nhóm tài liệu khi ôn (khóa trùng MATERIAL_TYPES ở utils/constants.js)
export const MATERIAL_ORDER = ['giaoTrinh', 'slide', 'baiTap', 'thamKhao', 'khac']

// Tài liệu của một môn, nhóm theo loại, trong nhóm xếp theo tên (Chương 2 trước Chương 10). Chỉ lấy dữ liệu có thật.
export function studyItems(subjectId, materials = []) {
  const mine = materials.filter(m => m && m.subjectId === subjectId && String(m.title || '').trim())
  const typeOf = (m) => MATERIAL_ORDER.includes(m.type) ? m.type : 'khac'
  return MATERIAL_ORDER.map(type => ({
    type,
    items: mine.filter(m => typeOf(m) === type)
      .sort((a, b) => a.title.localeCompare(b.title, 'vi', { numeric: true }))
      .map(m => ({ key: String(m.id), title: m.title.trim(), description: m.description || '', url: m.url || '' })),
  })).filter(g => g.items.length)
}

// Nội dung đưa vào kế hoạch: các mục tài liệu đang được chọn (theo thứ tự nhóm) rồi tới mục người dùng tự thêm
export const planTopics = (groups = [], excluded = [], extra = '') =>
  parseTopics([...groups.flatMap(g => g.items).filter(it => !excluded.includes(it.key)).map(it => it.title), extra].join('\n'))

// Ngày được xếp cho từng mục trong kế hoạch: { tên mục: 'yyyy-mm-dd' }
export const topicDates = (plan = []) =>
  Object.fromEntries(plan.filter(p => p.kind === 'study').flatMap(p => p.topics.map(t => [t, p.date])))

// Kế hoạch bản trước lưu theo mã lịch thi; bản này lưu theo môn
export function migratePlans(legacy = {}, exams = []) {
  const out = {}
  for (const [examId, v] of Object.entries(legacy || {})) {
    const e = exams.find(x => String(x.id) === examId)
    if (e && v?.plan?.length) out[e.subjectId] = { plan: v.plan, done: v.done || {}, planFor: e.date }
  }
  return out
}

