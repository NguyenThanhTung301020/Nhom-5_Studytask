// utils/curriculum.js – Kiểm tra các module môn học so với chương trình đào tạo (thuần logic)
//
// curriculum/{id} = { name, major, cohort, totalCredits,
//   modules: [{ id, name, kind: 'required' | 'elective', minCredits,
//               courses: [{ code, name, credits }] }] }
// subjects (sharedData/global.subjects) = [{ id, code, name, credits, ... }]

const norm = (c) => String(c || '').trim().toUpperCase()

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
