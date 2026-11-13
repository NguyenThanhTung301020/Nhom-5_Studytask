// tests/logic.test.mjs – Kiểm thử phần tính toán (không cần Emulator)
// Chạy: npm run test:logic
// Các ví dụ số lấy từ tài liệu "Tỉ lệ và cách tính trọng số điểm theo loại môn".
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  PRESETS, LIMITS, round1, homeworkScore, attendanceByRatio, attendanceByPenalty, attendanceCombined,
  subjectScore, autoWeights, suggestDropLowest, validatePolicy, defaultPolicy, effectivePolicy, attendanceFromData,
  subjectColumns, countedColumns, evaluateStudentSubject,
} from '../utils/grading.js'
import { tuitionSummary, tuitionReminder, tuitionLines } from '../utils/tuition.js'
import { checkCurriculum, missingCourses, subjectUsage, subjectUsageDetail } from '../utils/curriculum.js'
import { isHttpUrl, csvCell, toCSV } from '../utils/sanitize.js'
import { summarizeSystem } from '../utils/systemStats.js'
import { teacherSections, scopeBySubject, scopeByClass, studentInScope, classCatalog, classOptionsForSubject, classesInItems, semestersOf, visibleTeachers, sortBySemester, scopeSubjects, termLabel, semesterLabel, yearOfStudy, termOfYear, studyYear, khungPosition } from '../utils/scope.js'

const w = (p) => ({ cc: p.cc, bt: p.bt, gk: p.gk, ck: p.ck })
const sum = (o) => o.cc + o.bt + o.gk + o.ck

describe('Quy chế điểm – mục 2: bộ trọng số', () => {
  test('mọi bộ gợi ý có tổng 100%', () => {
    for (const p of Object.values(PRESETS)) assert.equal(sum(p), 100)
  })
  test('mọi bộ gợi ý nằm trong giới hạn nhóm của nó', () => {
    for (const [key, p] of Object.entries(PRESETS)) {
      const errs = validatePolicy({ preset: key, auto: false, weights: w(p) }, { nCounted: 5 })
        .filter(e => e.includes('giới hạn'))
      assert.deepEqual(errs, [], key)
    }
  })
})

describe('Quy chế điểm – mục 7: ví dụ tính tổng hợp', () => {
  test('L1: 9,0 / 7,0 / 6,5 / 7,0 → 7,1', () => {
    const r = subjectScore({ weights: w(PRESETS.L1) }, { cc: 9, bt: 7, gk: 6.5, ck: 7 })
    assert.equal(r.final, 7.1)
  })
  test('H1: 9,0 / 8,0 / – / 7,5 → 7,9 (không có giữa kỳ)', () => {
    const r = subjectScore({ weights: w(PRESETS.H1) }, { cc: 9, bt: 8, gk: null, ck: 7.5 })
    assert.equal(r.final, 7.9)
  })
  test('Môn 3 TC (2 LT + 1 TH): (7,1×2 + 7,9×1)/3 = 7,37 → 7,4', () => {
    const r = subjectScore(
      { weights: w(PRESETS.L1), practice: { enabled: true, theoryCredits: 2, practiceCredits: 1 } },
      { cc: 9, bt: 7, gk: 6.5, ck: 7, th: 7.9 })
    assert.equal(r.final, 7.4)
  })
  test('thiếu điểm cuối kỳ → chưa có điểm môn, có điểm tạm tính', () => {
    const r = subjectScore({ weights: w(PRESETS.L1) }, { cc: 9, bt: 7, gk: 6.5, ck: null })
    assert.equal(r.final, null)
    assert.deepEqual(r.missing, ['ck'])
    assert.equal(r.provisional, round1((10 * 9 + 15 * 7 + 20 * 6.5) / 45))
  })
})

describe('Quy chế điểm – mục 3: tỉ lệ quá trình / cuối kỳ', () => {
  const cases = [  // [quá trình, cuối kỳ, 50/50, 70/30, 30/70]
    [9, 5, 7.0, 7.8, 6.2], [6, 9, 7.5, 6.9, 8.1], [7, 7, 7.0, 7.0, 7.0],
  ]
  for (const [qt, ck, a, b, c] of cases) {
    test(`QT ${qt}, CK ${ck}`, () => {
      const f = (wq) => round1(wq / 100 * qt + (100 - wq) / 100 * ck)
      assert.deepEqual([f(50), f(70), f(30)], [a, b, c])
    })
  }
})

describe('Quy chế điểm – mục 4: bài tập', () => {
  test('bỏ bài thấp nhất: 8,6,9,4,7 → 6,8 (không bỏ) và 7,5 (bỏ 1)', () => {
    const items = [8, 6, 9, 4, 7].map(score => ({ score }))
    assert.equal(round1(homeworkScore(items, 0)), 6.8)
    assert.equal(round1(homeworkScore(items, 1)), 7.5)
  })
  test('trung bình có hệ số', () => {
    assert.equal(homeworkScore([{ score: 6, k: 1 }, { score: 9, k: 2 }], 0), 8)
  })
  test('bài chưa có điểm không tính', () => {
    assert.equal(homeworkScore([{ score: null }, { score: 8 }], 0), 8)
  })
  test('số bài bỏ theo bảng: 3→0, 5→1, 8→1, 12→2', () => {
    assert.deepEqual([3, 5, 8, 12].map(suggestDropLowest), [0, 1, 1, 2])
  })
  test('tự chuyển tỉ lệ theo số bài (L2): luôn tổng 100% và trong giới hạn', () => {
    for (let n = 0; n <= 15; n++) {
      const { weights } = autoWeights('L2', n)
      assert.equal(sum(weights), 100, `n=${n}`)
      for (const k of ['cc', 'bt', 'gk', 'ck']) {
        if (n === 0 && k === 'bt') continue
        assert.ok(weights[k] >= LIMITS.qt[k][0] && weights[k] <= LIMITS.qt[k][1], `n=${n} ${k}=${weights[k]}`)
      }
    }
  })
  test('nhiều bài thì trọng số bài tập tăng (L1: 2 bài < 8 bài)', () => {
    assert.ok(autoWeights('L1', 2).weights.bt < autoWeights('L1', 8).weights.bt)
  })
  test('tự động: L1 với 8 bài hợp lệ, mỗi bài trong 2–10%', () => {
    const errs = validatePolicy({ ...defaultPolicy(), preset: 'L1', auto: true }, { nCounted: 8 })
    assert.deepEqual(errs, [])
  })
})

describe('Quy chế điểm – mục 6: kiểm tra khi lưu', () => {
  test('tổng khác 100% bị từ chối', () => {
    const errs = validatePolicy({ preset: 'L1', auto: false, weights: { cc: 10, bt: 15, gk: 20, ck: 50 } }, { nCounted: 3 })
    assert.ok(errs.some(e => e.includes('100%')))
  })
  test('cuối kỳ lý thuyết dưới 50% bị từ chối', () => {
    const errs = validatePolicy({ preset: 'L1', auto: false, weights: { cc: 10, bt: 30, gk: 20, ck: 40 } }, { nCounted: 5 })
    assert.ok(errs.some(e => e.includes('Cuối kỳ')))
  })
  test('mỗi bài quá 10% bị từ chối (H1 chỉ 2 bài, BT 50%)', () => {
    const errs = validatePolicy({ preset: 'H1', auto: false, weights: w(PRESETS.H1) }, { nCounted: 2 })
    assert.ok(errs.some(e => e.includes('tối đa 10%')))
  })
  test('mỗi bài dưới 2% bị từ chối', () => {
    const errs = validatePolicy({ preset: 'L3', auto: false, weights: w(PRESETS.L3), dropLowest: 0 }, { nCounted: 8 })
    assert.ok(errs.some(e => e.includes('tối thiểu 2%')))
  })
  test('trực tuyến quá 50% bị từ chối', () => {
    const errs = validatePolicy({ preset: 'Q70', auto: false, weights: w(PRESETS.Q70), ckOnline: true }, { nCounted: 6, nOnlineCounted: 6 })
    assert.ok(errs.some(e => e.includes('trực tuyến')))
  })
  test('có trọng số bài tập nhưng chưa chọn cột nào → báo lỗi', () => {
    const errs = validatePolicy({ preset: 'L1', auto: false, weights: w(PRESETS.L1) }, { nCounted: 0 })
    assert.ok(errs.some(e => e.includes('chưa chọn cột')))
  })
  test('chế độ tự động bỏ bài thấp nhất theo số cột', () => {
    assert.equal(effectivePolicy({ preset: 'L1', auto: true, dropLowest: 'auto' }, 12).drop, 2)
  })
})

describe('Quy chế điểm – mục 5: chuyên cần', () => {
  test('cách 1: 18/20 buổi → 9,0', () => assert.equal(attendanceByRatio(18, 20), 9))
  test('cách 2: vắng KP 1, CP 2, muộn 3 → 7,75', () =>
    assert.equal(attendanceByPenalty({ unexcused: 1, excused: 2, late: 3 }), 7.75))
  test('cách 2: không âm', () => assert.equal(attendanceByPenalty({ unexcused: 20 }), 0))
  test('cách 3: 60% điểm danh 9,0 + 40% tham gia 8,0 → 8,6', () =>
    assert.equal(round1(attendanceCombined(9, 8, 40)), 8.6))
  test('lấy dữ liệu theo phương pháp của môn', () => {
    assert.equal(attendanceFromData({ method: 'ratio', sessions: 20 }, { present: 18 }), 9)
    assert.equal(attendanceFromData({ method: 'penalty', a: 1, b: 0.25, c: 0.25 }, { unexcused: 1, excused: 2, late: 3 }), 7.75)
    assert.equal(attendanceFromData({ method: 'score' }, { score: 8 }), 8)
    assert.equal(attendanceFromData({ method: 'score' }, {}), null)
  })
})

describe('Học phí và công nợ', () => {
  const subjects = [
    { id: 1, code: 'A', name: 'A', credits: 3 },
    { id: 2, code: 'B', name: 'B', credits: 4, practiceCredits: 1 },
    { id: 3, code: 'C', name: 'C', credits: 2 },
  ]
  const student = { uid: 's', subjectIds: [1, 2] }
  const cfg = { pricePerCredit: 500000, practicePricePerCredit: 700000, dueDate: '2026-11-01', reminderDays: [7, 3] }

  test('tính theo tín chỉ: 3×500k + (3×500k + 1×700k) = 3.700.000', () => {
    const s = tuitionSummary(student, subjects, cfg, {}, '2026-10-17')
    assert.equal(s.credits, 7)
    assert.equal(s.total, 3700000)
    assert.equal(s.status, 'unpaid')
  })
  test('nộp một phần và miễn giảm', () => {
    const s = tuitionSummary(student, subjects, cfg, { discount: 200000, payments: [{ amount: 1000000 }] }, '2026-10-17')
    assert.equal(s.total, 3500000); assert.equal(s.debt, 2500000); assert.equal(s.status, 'partial')
  })
  test('nộp đủ', () => {
    const s = tuitionSummary(student, subjects, cfg, { payments: [{ amount: 3700000 }] }, '2026-10-17')
    assert.equal(s.status, 'paid'); assert.equal(tuitionReminder(s, cfg), null)
  })
  test('quá hạn và nhắc đến hạn', () => {
    assert.equal(tuitionSummary(student, subjects, cfg, {}, '2026-11-05').status, 'overdue')
    const soon = tuitionSummary(student, subjects, cfg, {}, '2026-10-29')
    assert.equal(tuitionReminder(soon, cfg).level, 'soon')
    const far = tuitionSummary(student, subjects, cfg, {}, '2026-10-01')
    assert.equal(tuitionReminder(far, cfg), null)
  })
  test('chưa có đơn giá → trạng thái unset', () => {
    assert.equal(tuitionSummary(student, subjects, {}, {}).status, 'unset')
  })
  test('sinh viên chưa gán môn → 0 đồng', () => {
    assert.deepEqual(tuitionLines({ subjectIds: null }, subjects, cfg), [])
  })
})

describe('Chương trình đào tạo', () => {
  const curriculum = {
    totalCredits: 12,
    modules: [
      { id: 'm1', name: 'Bắt buộc', kind: 'required', courses: [{ code: 'A', name: 'A', credits: 3 }, { code: 'X', name: 'X', credits: 3 }] },
      { id: 'm2', name: 'Tự chọn', kind: 'elective', minCredits: 6, courses: [{ code: 'b', name: 'B', credits: 4 }, { code: 'C', name: 'C', credits: 2 }] },
    ],
  }
  const subjects = [
    { id: 1, code: 'A', credits: 3 }, { id: 2, code: 'B', credits: 4 }, { id: 3, code: 'C', credits: 3 }, { id: 9, code: 'Z', credits: 2 },
  ]
  const r = checkCurriculum(curriculum, subjects)
  test('module bắt buộc thiếu môn X', () => {
    assert.equal(r.modules[0].ok, false)
    assert.deepEqual(r.modules[0].missing.map(c => c.code), ['X'])
  })
  test('module tự chọn đủ tín chỉ (mã không phân biệt hoa thường)', () => {
    assert.equal(r.modules[1].ok, true); assert.equal(r.modules[1].offeredCredits, 7)
  })
  test('lệch số tín chỉ được phát hiện (C: CTĐT 2, đang mở 3)', () => {
    assert.equal(r.modules[1].courses.find(c => c.code === 'C').creditMismatch, true)
  })
  test('môn ngoài CTĐT: Z', () => assert.deepEqual(r.extra.map(s => s.code), ['Z']))
  test('tổng thể chưa đạt', () => assert.equal(r.ok, false))
})

describe('Quy chế điểm – cột do giáo viên chọn', () => {
  const quizzes = [{ id: 1, subjectId: 7, title: 'Q1' }]
  const homeworks = [{ id: 2, subjectId: 7, title: 'H2', type: 'assign' }, { id: 3, subjectId: 7, title: 'H3', type: 'assign' }, { id: 9, subjectId: 8, title: 'khác' }]
  const columns = subjectColumns(7, quizzes, homeworks)
  test('dựng cột của đúng môn, trắc nghiệm là trực tuyến', () => {
    assert.deepEqual(columns.map(c => c.key), ['q:1', 'hw:2', 'hw:3'])
    assert.equal(columns[0].online, true)
  })
  test('chưa cấu hình → mọi cột tính điểm', () => {
    assert.deepEqual(countedColumns(null, columns), { 'q:1': 1, 'hw:2': 1, 'hw:3': 1 })
  })
  test('cột không chọn → tính vào chuyên cần (điểm tham gia)', () => {
    const counted = countedColumns({ counted: { 'hw:2': 1, 'hw:3': 2 } }, columns)
    const scores = { 'hw:2': 6, 'hw:3': 9 }
    const r = evaluateStudentSubject({
      policy: { ...defaultPolicy(), preset: 'L1', auto: false, weights: { cc: 10, bt: 15, gk: 20, ck: 55 }, attendance: { method: 'score', participation: 40 } },
      columns, counted, colScore: k => scores[k] ?? null, colDone: k => k === 'q:1', cell: { att: 9, gk: 6.5, ck: 7 },
    })
    assert.equal(r.scores.bt, 8)                     // (6×1 + 9×2) / 3
    assert.equal(r.participation, 10)                // Q1 đã làm → 1/1 cột
    assert.equal(round1(r.scores.cc), 9.4)           // 0,6×9 + 0,4×10
    assert.equal(r.result.final, round1(0.10 * 9.4 + 0.15 * 8 + 0.20 * 6.5 + 0.55 * 7))
  })
})

describe('Xuất CSV và link an toàn', () => {
  test('isHttpUrl chỉ nhận http(s)', () => {
    for (const ok of ['https://x.vn/a', 'http://x.vn', 'HTTPS://X.VN', '  https://x.vn/a  ']) assert.equal(isHttpUrl(ok), true, ok)
    for (const bad of ['javascript:alert(1)', ' javascript:alert(1)', 'data:text/html,x', 'x.vn/a', 'https://x y', '', null, undefined]) assert.equal(isHttpUrl(bad), false, String(bad))
  })
  test('csvCell vô hiệu hóa công thức ở đầu ô', () => {
    assert.equal(csvCell('=HYPERLINK("http://x/","a")'), `"'=HYPERLINK(""http://x/"",""a"")"`)
    assert.equal(csvCell('@SUM(1)'), `"'@SUM(1)"`)
    assert.equal(csvCell('+1+1'), `"'+1+1"`)
    assert.equal(csvCell('-1+1'), `"'-1+1"`)
    assert.equal(csvCell(' =1+1'), `"' =1+1"`)
    assert.equal(csvCell('\t=1+1'), `"'\t=1+1"`)
  })
  test('csvCell giữ nguyên số và văn bản thường', () => {
    assert.equal(csvCell(-5), '"-5"')
    assert.equal(csvCell('3,20'), '"3,20"')
    assert.equal(csvCell('+84901234567'), '"+84901234567"')
    assert.equal(csvCell('Nguyễn A'), '"Nguyễn A"')
    assert.equal(csvCell(null), '""')
    assert.equal(csvCell(0), '"0"')
  })
  test('toCSV nối hàng bằng CRLF', () => {
    assert.equal(toCSV([['a', 1], ['@b', 2]]), `"a","1"\r\n"'@b","2"`)
  })
})

describe('Mở và bớt môn theo CTĐT', () => {
  const X1 = { code: 'X1', name: 'Môn X', credits: 3 }
  const program = { modules: [
    { id: 'a', kind: 'required', courses: [X1, { code: 'X2', name: 'Môn Y', credits: 2 }] },
    { id: 'b', kind: 'required', courses: [{ ...X1, code: ' x1 ' }] },
  ] }
  test('checkCurriculum giữ môn trùng theo từng module, missingCourses chỉ tính một lần', () => {
    const report = checkCurriculum(program, [])
    assert.equal(report.modules.flatMap(m => m.missing).length, 3)
    assert.deepEqual(missingCourses(report).map(c => c.code), ['X1', 'X2'])
  })
  test('missingCourses không gộp các môn chưa có mã', () => {
    const report = checkCurriculum({ modules: [{ id: 'a', kind: 'required', courses: [{ name: 'A' }, { name: 'B' }] }] }, [])
    assert.equal(missingCourses(report).length, 2)
  })
  test('subjectUsage đếm lịch học, lịch thi, deadline của đúng môn', () => {
    const data = { schedule: [{ subjectId: 1 }, { subjectId: 2 }], exams: [{ subjectId: 1 }], deadlines: [{ subjectId: 1 }] }
    assert.equal(subjectUsage(1, data), 3)
    assert.equal(subjectUsage(2, data), 1)
    assert.equal(subjectUsage(3, data), 0)
    assert.equal(subjectUsage(1), 0)
  })
  test('subjectUsageDetail (R2, R3 review PR9): đếm cả bài tập, tài liệu, đề và tài khoản được phân môn', () => {
    const data = {
      schedule: [{ subjectId: 1 }], exams: [], deadlines: [{ subjectId: 1 }, { subjectId: 2 }],
      homeworks: [{ subjectId: 2 }, { subjectId: 2 }], materials: [{ subjectId: 2 }], quizzes: [{ subjectId: 3 }],
      users: [{ subjectIds: [2, 4] }, { subjectIds: [4] }, { role: 'admin' }, { subjectIds: 'x' }],
    }
    const u2 = subjectUsageDetail(2, data)
    assert.equal(u2.total, 5)
    assert.equal(u2.text, '1 deadline, 2 bài tập, 1 tài liệu, 1 tài khoản được phân môn')
    assert.deepEqual(subjectUsageDetail(1, data).parts.map(p => p.key), ['schedule', 'deadlines'])
    assert.equal(subjectUsageDetail(3, data).text, '1 đề trắc nghiệm')
    assert.equal(subjectUsageDetail(4, data).text, '2 tài khoản được phân môn')
    assert.deepEqual(subjectUsageDetail(5, data), { total: 0, parts: [], text: '' })
    assert.equal(subjectUsage(2, data), 5)
    // môn chỉ còn bài tập, tài liệu: trước đây subjectUsage trả 0 nên trang Chương trình ĐT cho bớt
    assert.equal(subjectUsage(2, { homeworks: data.homeworks, materials: data.materials }), 3)
    // so khớp đúng kiểu như máy chủ: '2' khác 2
    assert.equal(subjectUsage('2', data), 0)
  })
})

describe('Thống kê hệ thống (trang Quản trị)', () => {
  const users = [
    { role: 'admin' }, { role: 'training' }, { role: 'finance' },
    { role: 'teacher', subjectIds: [1, 2] }, { role: 'teacher', subjectIds: [] }, { role: 'teacher' },
    { role: 'student', subjectIds: [1] }, { role: 'student', subjectIds: [] }, { role: 'student', subjectIds: [1], expiresAt: '2026-01-01' },
    { role: 'khac' },
  ]
  const s = summarizeSystem({ users, today: '2026-11-12' })
  test('đếm tài khoản theo vai trò từ danh sách thật, không dùng số tài khoản demo', () => {
    assert.equal(s.accounts.total, 10)
    assert.deepEqual(s.accounts.byRole, { admin: 1, training: 1, finance: 1, teacher: 3, student: 3 })
    assert.equal(s.accounts.staff, 3)
  })
  test('giáo viên/sinh viên chưa phân công môn (thiếu hoặc rỗng subjectIds) và tài khoản hết hạn', () => {
    assert.equal(s.accounts.teachersWithoutSubjects, 2)
    assert.equal(s.accounts.studentsWithoutSubjects, 1)
    assert.equal(s.accounts.expired, 1)
  })
  test('danh mục: môn, lịch học, lịch thi, tài liệu, bài tập', () => {
    const c = summarizeSystem({ subjects: [1, 2, 3], schedule: [1, 2], exams: [1], materials: [1, 2, 3, 4], homeworks: [1] }).catalog
    assert.deepEqual([c.subjects, c.schedule, c.exams, c.materials, c.homeworks], [3, 2, 1, 4, 1])
  })
  test('đề trắc nghiệm theo trạng thái; đề cũ chưa có trạng thái coi là đang mở', () => {
    const q = summarizeSystem({ quizzes: [{ status: 'active' }, {}, { status: 'closed' }, { status: 'draft' }, { status: 'draft' }] }).catalog.quizzes
    assert.deepEqual(q, { total: 5, active: 2, closed: 1, draft: 2 })
  })
  test('deadline xong / quá hạn so với ngày hôm nay', () => {
    const d = summarizeSystem({ today: '2026-11-12', deadlines: [
      { status: 'completed', dueDate: '2026-01-01' }, { status: 'pending', dueDate: '2026-11-11' },
      { status: 'pending', dueDate: '2026-11-12' }, { status: 'in_progress', dueDate: '2026-12-01' }, { status: 'pending' },
    ] }).catalog.deadlines
    assert.deepEqual(d, { total: 5, done: 1, overdue: 1 })
  })
  test('lượt làm và điểm TB trắc nghiệm lấy từ nhật ký hoạt động; bỏ qua sự kiện khác', () => {
    const q = summarizeSystem({ activities: [
      { events: [{ type: 'quiz', score: 8 }, { type: 'material' }, { type: 'quiz', score: 7 }] },
      { events: [{ type: 'quiz', score: 6.5 }, { type: 'homework', score: 10 }] }, {},
    ] }).quiz
    assert.equal(q.attempts, 3)
    assert.equal(q.avgScore, 7.2)
  })
  test('không có dữ liệu → 0 và điểm TB là null (không phải NaN)', () => {
    const e = summarizeSystem()
    assert.equal(e.accounts.total, 0)
    assert.equal(e.quiz.avgScore, null)
    assert.equal(e.catalog.deadlines.overdue, 0)
  })
})

describe('Phạm vi theo lớp học phần (cùng môn, nhiều lớp, nhiều giáo viên)', () => {
  // Môn 1 mở ở 3 lớp; GV A dạy lớp a1 và b1 (môn 1) + môn 2 ở lớp a1; GV B dạy lớp c1 (môn 1)
  const sched = [
    { id: 1, subjectId: 1, classId: 'a1' }, { id: 2, subjectId: 1, classId: 'b1' }, { id: 3, subjectId: 1, classId: 'c1' },
    { id: 4, subjectId: 2, classId: 'a1' }, { id: 5, subjectId: 2, classId: 'b1' }, { id: 6, subjectId: 3, classId: 'a1' },
    { id: 7, subjectId: 1 },                                   // mục chung của môn, không thuộc lớp nào
  ]
  const gvA = { role: 'teacher', subjectIds: [1, 2], sections: [{ classId: 'a1', subjectId: 1 }, { classId: 'b1', subjectId: 1 }, { classId: 'a1', subjectId: 2 }] }
  const ids = (xs) => xs.map(x => x.id)

  test('giáo viên chỉ thấy lịch của lớp học phần mình dạy, không thấy lớp khác cùng môn', () => {
    assert.deepEqual(ids(scopeByClass(gvA, sched)), [1, 2, 4, 7])        // không có 3 (lớp c1), 5 (môn 2 lớp b1), 6 (môn 3)
  })
  test('hai giáo viên cùng môn thấy hai tập lịch khác nhau', () => {
    const gvB = { role: 'teacher', subjectIds: [1], sections: [{ classId: 'c1', subjectId: 1 }] }
    assert.deepEqual(ids(scopeByClass(gvB, sched)), [3, 7])
  })
  test('giáo viên chưa được phân công môn trong kỳ thì không thấy gì (trừ mục chung của môn khác không có)', () => {
    const gvC = { role: 'teacher', subjectIds: [], sections: [] }
    assert.deepEqual(scopeByClass(gvC, sched), [])
  })
  test('Admin bỏ một môn khỏi hồ sơ thì các lớp của môn đó cũng biến mất', () => {
    const t = { ...gvA, subjectIds: [2] }
    assert.deepEqual(teacherSections(t).map(s => s.subjectId), [2])
    assert.deepEqual(ids(scopeByClass(t, sched)), [4])
  })
  test('hồ sơ giáo viên cũ (không có sections) vẫn lọc theo môn như trước', () => {
    const old = { role: 'teacher', subjectIds: [1] }
    assert.equal(teacherSections(old), null)
    assert.deepEqual(ids(scopeByClass(old, sched)), [1, 2, 3, 7])
  })
  test('sinh viên chỉ thấy lịch lớp mình (và mục chung của môn)', () => {
    const sv = { role: 'student', subjectIds: [1, 2], classId: 'b1' }
    assert.deepEqual(ids(scopeByClass(sv, sched)), [2, 5, 7])
  })
  test('sinh viên hồ sơ cũ (không có classId) thấy theo môn', () => {
    assert.deepEqual(ids(scopeByClass({ role: 'student', subjectIds: [1] }, sched)), [1, 2, 3, 7])
  })
  test('admin, đào tạo, tài chính thấy tất cả; subjectIds null = tất cả', () => {
    for (const role of ['admin', 'training', 'finance']) assert.equal(scopeByClass({ role, subjectIds: [9] }, sched).length, 7)
    assert.equal(scopeBySubject({ role: 'teacher', subjectIds: null }, sched).length, 7)
    assert.equal(scopeBySubject(null, sched).length, 7)
  })
  test('studentInScope: giáo viên chỉ có sinh viên của lớp học phần mình dạy', () => {
    const svA = { role: 'student', classId: 'a1', subjectIds: [1, 2] }
    const svC = { role: 'student', classId: 'c1', subjectIds: [1] }     // cùng môn 1 nhưng lớp khác
    const svA3 = { role: 'student', classId: 'a1', subjectIds: [3] }    // cùng lớp nhưng môn GV không dạy
    assert.equal(studentInScope(gvA, svA), true)
    assert.equal(studentInScope(gvA, svC), false)
    assert.equal(studentInScope(gvA, svA3), false)
    assert.equal(studentInScope({ role: 'admin' }, svC), true)
    assert.equal(studentInScope(gvA, { role: 'teacher' }), false)
  })
  test('studentInScope: hồ sơ cũ dùng giao môn như trước', () => {
    assert.equal(studentInScope({ role: 'teacher', subjectIds: [1] }, { role: 'student', subjectIds: [1, 5] }), true)
    assert.equal(studentInScope({ role: 'teacher', subjectIds: [1] }, { role: 'student', subjectIds: [5] }), false)
    assert.equal(studentInScope({ role: 'teacher', subjectIds: [1] }, { role: 'student' }), false)
  })
  test('danh mục lớp và các lớp được chọn khi xếp lịch', () => {
    const users = [
      { role: 'student', classId: 'a1', className: 'A1', semesterNo: 1, subjectIds: [1, 2] },
      { role: 'student', classId: 'a1', className: 'A1', semesterNo: 1, subjectIds: [1, 2] },
      { role: 'student', classId: 'c1', className: 'C1', semesterNo: 2, subjectIds: [1] },
      { role: 'teacher' },
    ]
    assert.equal(classCatalog(users).size, 2)
    assert.deepEqual(classOptionsForSubject(gvA, users, 1).map(c => c.id), ['a1', 'b1'])        // lớp GV dạy môn 1
    assert.deepEqual(classOptionsForSubject({ role: 'admin' }, users, 1).map(c => c.id), ['a1', 'c1'])
    assert.deepEqual(classOptionsForSubject({ role: 'admin' }, users, 2).map(c => c.id), ['a1'])
  })
  test('các lớp trong danh sách lịch và các học kỳ của môn', () => {
    assert.deepEqual(classesInItems(sched).map(c => c.id), ['a1', 'b1', 'c1'])
    assert.deepEqual(semestersOf([{ hocKy: 3 }, { hocKy: 1 }, { hocKy: 3 }, {}]), [1, 3])
  })
  test('thẻ môn học: sinh viên chỉ thấy giáo viên dạy lớp mình; giáo viên thấy mình và người dạy chung lớp; Admin thấy tất cả', () => {
    const entries = [{ uid: 'A', name: 'A', classIds: ['a1', 'b1'] }, { uid: 'B', name: 'B', classIds: ['c1'] }, { uid: 'O', name: 'Cũ', classIds: [] }]
    const names = (xs) => xs.map(t => t.uid).sort().join('')
    assert.equal(names(visibleTeachers({ role: 'student', classId: 'c1' }, 1, entries)), 'BO')
    assert.equal(names(visibleTeachers({ role: 'student', classId: 'a1' }, 1, entries)), 'AO')
    assert.equal(names(visibleTeachers({ role: 'student' }, 1, entries)), 'ABO')                  // hồ sơ cũ: không biết lớp
    assert.equal(names(visibleTeachers({ ...gvA, uid: 'A' }, 1, entries)), 'AO')                  // B dạy lớp khác nên không hiện
    assert.equal(names(visibleTeachers({ role: 'admin' }, 1, entries)), 'ABO')
  })
  test('sắp xếp môn theo học kỳ, rồi mã môn; môn chưa có học kỳ xếp cuối', () => {
    const out = sortBySemester([{ code: 'B', hocKy: 2 }, { code: 'X' }, { code: 'A', hocKy: 2 }, { code: 'Z', hocKy: 1 }])
    assert.deepEqual(out.map(s => s.code), ['Z', 'A', 'B', 'X'])
  })
  test('học kỳ theo năm học: vị trí 1..8 của khung → "Năm N – Học kỳ 1/2"', () => {
    assert.deepEqual([1, 2, 3, 4, 7, 8].map(termLabel), ['Năm 1 – Học kỳ 1', 'Năm 1 – Học kỳ 2', 'Năm 2 – Học kỳ 1', 'Năm 2 – Học kỳ 2', 'Năm 4 – Học kỳ 1', 'Năm 4 – Học kỳ 2'])
    assert.equal(termLabel(0), '')
    assert.equal(termLabel(undefined), '')
    assert.deepEqual([1, 2, 5, 8].map(yearOfStudy), [1, 1, 3, 4])
    assert.deepEqual([1, 2, 5, 8].map(termOfYear), [1, 2, 1, 2])
    assert.equal(semesterLabel({ hocKy: 3 }), 'Năm 2 · HK1')
    assert.equal(semesterLabel({}), '')
  })
  test('sinh viên lưu theo khóa + năm học: năm thứ và vị trí trong khung suy ra, không lưu "kỳ số mấy"', () => {
    assert.equal(studyYear('2023-2027', '2026-2027'), 4)
    assert.equal(studyYear('2026-2030', '2026-2027'), 1)
    assert.equal(studyYear('2024–2028', '2026–2027'), 3)         // chấp nhận gạch ngang dài
    assert.equal(studyYear('2023-2027', '2022-2023'), 0)         // năm học trước khi nhập học
    assert.equal(studyYear('2023-2027', '2031-2032'), 0)         // quá 8 năm
    assert.equal(studyYear(undefined, '2026-2027'), 0)
    assert.equal(studyYear('2023-2027', null), 0)
    assert.equal(khungPosition(4, 1), 7)                         // năm 4, học kỳ 1 → HK7 của khung
    assert.equal(khungPosition(1, 1), 1)
    assert.equal(khungPosition(2, 2), 4)
    assert.equal(khungPosition(0, 1), 0)
    assert.equal(khungPosition(3, 3), 0)
  })
  test('danh mục lớp: lớp theo khóa, năm thứ suy ra từ khóa và năm học', () => {
    const cat = classCatalog([
      { role: 'student', classId: 'CNTT23-01', className: 'CNTT23-01', cohort: '2023-2027', namHoc: '2026-2027', hocKy: 1, subjectIds: [1] },
      { role: 'student', classId: 'CNTT26-01', className: 'CNTT26-01', cohort: '2026-2030', namHoc: '2026-2027', hocKy: 1, subjectIds: [2] },
    ])
    assert.equal(cat.get('CNTT23-01').cohort, '2023-2027')
    assert.equal(cat.get('CNTT23-01').namThu, 4)
    assert.equal(cat.get('CNTT26-01').namThu, 1)
    assert.equal(classOptionsForSubject({ role: 'admin' }, [{ role: 'student', classId: 'x', cohort: '2024-2028', subjectIds: [9] }], 9)[0].cohort, '2024-2028')
  })
  test('danh sách môn học lọc theo `id` (không phải `subjectId`): giáo viên thấy đúng các môn được phân công', () => {
    const subjects = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }]
    assert.deepEqual(scopeSubjects({ role: 'teacher', subjectIds: [1, 3] }, subjects).map(s => s.id), [1, 3])
    assert.deepEqual(scopeSubjects({ role: 'teacher', subjectIds: [] }, subjects), [])
    assert.equal(scopeSubjects({ role: 'teacher', subjectIds: null }, subjects).length, 3)
    assert.equal(scopeSubjects({ role: 'admin', subjectIds: [1] }, subjects).length, 3)
    assert.equal(scopeSubjects(null, subjects).length, 3)
  })
})
