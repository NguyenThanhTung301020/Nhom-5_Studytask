// utils/curriculum.js – Kiểm tra các module môn học so với chương trình đào tạo (thuần logic)
//
// curriculum/{id} = { name, major, cohort, totalCredits,
//   modules: [{ id, name, kind: 'required' | 'elective', minCredits,
//               courses: [{ code, name, credits }] }] }
// subjects (sharedData/global.subjects) = [{ id, code, name, credits, ... }]

const norm = (c) => String(c || '').trim().toUpperCase()

// Các môn còn thiếu của mọi module; một mã môn nằm ở nhiều module chỉ tính một lần
export function missingCourses(report) {
  const seen = new Set()
  return (report?.modules || []).flatMap(m => m.missing || []).filter(c => {
    const code = norm(c.code)
    if (!code) return true
    if (seen.has(code)) return false
    seen.add(code)
    return true
  })
}

// Dữ liệu còn gắn với một môn. Bớt/xóa môn khi còn dữ liệu thì bị chặn hẳn (R2, R3 review PR9 lần 2):
// trước đây chỉ đếm lịch học, lịch thi, deadline nên bớt môn còn bài tập, tài liệu, đề thì để lại dữ liệu mồ côi.
// Máy chủ kiểm tra lại đúng các mục này (subject_usage trong server/studytask_api.py). Cột điểm (gradingColumns) là các bài tập
// được tính điểm nên đã được chặn qua bài tập.
const USAGE_PARTS = [
  ['schedule', 'lịch học'], ['exams', 'lịch thi'], ['deadlines', 'deadline'],
  ['homeworks', 'bài tập'], ['materials', 'tài liệu'], ['quizzes', 'đề trắc nghiệm'],
]

// { total, parts: [{ key, label, count }] (chỉ mục có count > 0), text: '2 bài tập, 1 tài liệu' }
// data.users: danh sách tài khoản; tài khoản có subjectId trong subjectIds được tính là đang được phân môn.
export function subjectUsageDetail(subjectId, data = {}) {
  const count = (list) => (Array.isArray(list) ? list : []).filter(x => x && x.subjectId === subjectId).length
  const parts = USAGE_PARTS.map(([key, label]) => ({ key, label, count: count(data[key]) }))
  const users = (Array.isArray(data.users) ? data.users : []).filter(u => Array.isArray(u?.subjectIds) && u.subjectIds.includes(subjectId)).length
  parts.push({ key: 'users', label: 'tài khoản được phân môn', count: users })
  const used = parts.filter(p => p.count > 0)
  return { total: used.reduce((n, p) => n + p.count, 0), parts: used, text: used.map(p => `${p.count} ${p.label}`).join(', ') }
}

// Tổng số mục còn gắn với một môn
export const subjectUsage = (subjectId, data) => subjectUsageDetail(subjectId, data).total

export function checkCurriculum(curriculum, subjects) {
  const byCode = new Map(subjects.filter(s => s.code).map(s => [norm(s.code), s]))
  const inProgram = new Set()

  const modules = (curriculum?.modules || []).map(m => {
    const courses = (m.courses || []).map(c => {
      const s = byCode.get(norm(c.code))
      if (s) inProgram.add(s.id)
      const creditMismatch = s && Number(s.credits) !== Number(c.credits)
      return { ...c, subject: s || null, offered: !!s, creditMismatch }
    })
    const offered = courses.filter(c => c.offered)
    const offeredCredits = offered.reduce((s, c) => s + (Number(c.subject.credits) || 0), 0)
    const requiredCredits = m.kind === 'required'
      ? courses.reduce((s, c) => s + (Number(c.credits) || 0), 0)
      : Number(m.minCredits) || 0
    const missing = m.kind === 'required' ? courses.filter(c => !c.offered) : []
    const ok = m.kind === 'required' ? missing.length === 0 : offeredCredits >= requiredCredits
    return { ...m, courses, offeredCredits, requiredCredits, missing, ok,
             shortage: Math.max(0, requiredCredits - offeredCredits) }
  })

  const extra = subjects.filter(s => !inProgram.has(s.id))   // môn đang mở nhưng không thuộc CTĐT
  const programCredits = modules.reduce((s, m) => s + m.requiredCredits, 0)
  const offeredCredits = modules.reduce((s, m) => s + Math.min(m.offeredCredits, m.kind === 'required' ? Infinity : m.requiredCredits), 0)
  const totalCredits = Number(curriculum?.totalCredits) || programCredits
  return {
    modules, extra, programCredits, offeredCredits, totalCredits,
    ok: modules.every(m => m.ok) && programCredits >= totalCredits,
    totalMismatch: programCredits !== totalCredits,
  }
}
