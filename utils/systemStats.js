// utils/systemStats.js – Số liệu "Thống kê hệ thống" của trang Quản trị (thuần logic)
// Mọi số lấy từ dữ liệu thật của máy chủ (danh sách người dùng, sharedData, nhật ký hoạt động);
// không dùng tài khoản demo hay dữ liệu cá nhân của người đang xem.

import { currentTerm, termKey, studyYear } from './scope.js'

const ROLE_KEYS = ['admin', 'training', 'finance', 'teacher', 'student']

export function summarizeSystem({ users = [], subjects = [], schedule = [], exams = [], materials = [], quizzes = [],
                                  deadlines = [], homeworks = [], activities = [], today = '' } = {}) {
  const byRole = Object.fromEntries(ROLE_KEYS.map(r => [r, 0]))
  let expired = 0
  for (const u of users) {
    if (u.role in byRole) byRole[u.role]++
    if (u.expiresAt && today && u.expiresAt < today) expired++
  }
  const noSubjects = (role) => users.filter(u => u.role === role && (!Array.isArray(u.subjectIds) || u.subjectIds.length === 0)).length

  // Đề trắc nghiệm cũ chưa có trạng thái được coi là đang mở (giống máy chủ: quiz_status)
  const quizStatus = (q) => q.status || 'active'
  const quizCount = (s) => quizzes.filter(q => quizStatus(q) === s).length

  // Lượt làm trắc nghiệm: sự kiện `quiz` trong nhật ký hoạt động do máy chủ ghi khi chấm bài
  const scores = activities.flatMap(a => (a.events || []).filter(e => e.type === 'quiz' && Number.isFinite(Number(e.score))).map(e => Number(e.score)))
  const avgScore = scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length * 10) / 10 : null

  // Học phần mở theo năm học: học kỳ hiện tại tính theo ngày; số giáo viên mỗi học phần lấy từ hồ sơ giáo viên (tối đa 3)
  const cur = termKey(currentTerm(today ? new Date(today + 'T12:00:00') : new Date()))
  const tCount = new Map()
  users.filter(u => u.role === 'teacher').forEach(u => (u.subjectIds || []).forEach(id => tCount.set(id, (tCount.get(id) || 0) + 1)))
  const open = subjects.filter(sb => sb.namHoc && sb.ky)
  const now = open.filter(sb => termKey(sb) === cur)
  const cohortMap = new Map()
  for (const u of users) {
    if (u.role !== 'student' || !u.cohort) continue
    if (!cohortMap.has(u.cohort)) cohortMap.set(u.cohort, { khoa: u.cohort, students: 0, classes: new Set(), namThu: 0 })
    const c = cohortMap.get(u.cohort)
    c.students++
    if (u.classId) c.classes.add(u.classId)
    c.namThu = c.namThu || studyYear(u.cohort, u.namHoc) || (u.namThu ?? 0)
  }
  const cohorts = [...cohortMap.values()].map(c => ({ khoa: c.khoa, students: c.students, classes: c.classes.size, namThu: c.namThu,
    offeringsNow: now.filter(sb => sb.khoa === c.khoa).length })).sort((a, b) => String(b.khoa).localeCompare(String(a.khoa)))

  return {
    offerings: {
      total: open.length, now: now.length,
      ended: open.filter(sb => sb.trangThai === 'da-ket-thuc').length, planned: open.filter(sb => sb.trangThai === 'ke-hoach').length,
      nowWithoutTeacher: now.filter(sb => !tCount.get(sb.id)).length,
      overLimit: open.filter(sb => (tCount.get(sb.id) || 0) > 3).length,          // mỗi học phần chỉ nên có 1–3 giáo viên
    },
    cohorts,
    accounts: {
      total: users.length,
      byRole,
      staff: byRole.admin + byRole.training + byRole.finance,
      teachersWithoutSubjects: noSubjects('teacher'),
      studentsWithoutSubjects: noSubjects('student'),
      expired,
    },
    catalog: {
      subjects: subjects.length,
      schedule: schedule.length,
      exams: exams.length,
      materials: materials.length,
      quizzes: { total: quizzes.length, active: quizCount('active'), closed: quizCount('closed'), draft: quizCount('draft') },
      homeworks: homeworks.length,
      deadlines: {
        total: deadlines.length,
        done: deadlines.filter(d => d.status === 'completed').length,
        overdue: deadlines.filter(d => d.status !== 'completed' && d.dueDate && today && d.dueDate < today).length,
      },
    },
    quiz: { attempts: scores.length, avgScore },
  }
}
