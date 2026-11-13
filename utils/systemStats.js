// utils/systemStats.js – Số liệu "Thống kê hệ thống" của trang Quản trị (thuần logic)
// Mọi số lấy từ dữ liệu thật của máy chủ (danh sách người dùng, sharedData, nhật ký hoạt động);
// không dùng tài khoản demo hay dữ liệu cá nhân của người đang xem.

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

  return {
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
