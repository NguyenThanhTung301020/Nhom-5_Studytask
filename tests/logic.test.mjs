// tests/logic.test.mjs – Kiểm thử phần tính toán (không cần Emulator)
// Chạy: npm run test:logic
// Các ví dụ số lấy từ tài liệu "Tỉ lệ và cách tính trọng số điểm theo loại môn".
import { test, describe } from 'node:test'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

import {
  PRESETS, LIMITS, round1, homeworkScore, attendanceByRatio, attendanceByPenalty, attendanceCombined,
  subjectScore, autoWeights, suggestDropLowest, validatePolicy, defaultPolicy, effectivePolicy, attendanceFromData,
  subjectColumns, countedColumns, evaluateStudentSubject, isGuidedSubject,
} from '../utils/grading.js'
import { tuitionSummary, tuitionReminder, tuitionLines } from '../utils/tuition.js'
import { checkCurriculum, missingCourses, subjectUsage, subjectUsageDetail, addCourseToModule } from '../utils/curriculum.js'
import { isHttpUrl, csvCell, toCSV } from '../utils/sanitize.js'
import { summarizeSystem } from '../utils/systemStats.js'
import { applyQuizResults, resultToEvent, loadOfficialActivities, isMissingEndpoint, quizDuePassed, countSubmissionsByQuiz } from '../utils/quizScores.js'
import { TIET, SESSIONS, sessionOfTiet, blockFits, blockTime, blockStarts, tietRangeOf, tietLabel, mondayOf, weekDates, addDays, tkbDay, classOnDate, termWeekNumber, weekRangeLabel, monthEvents, monthGrid } from '../utils/periods.js'
import { scheduleText, navLabel } from '../utils/roleText.js'
import { serverRejected, keysToReload, saveErrorText, echoGuard, recoverFromSaveError, USAGE_KEYS } from '../utils/sharedSync.js'
import { GENRES, genreOf, foldText, filterBooks, sortBooks, genreCounts, formatSize, bookFileUrl, sourceLine, safeSourceUrl } from '../utils/library.js'
import { hasRoomQuiz, canUseRoomQuiz, examWindow, examPhase, quizzesForExam, formatCountdown, validAccessCode, examErrorText } from '../utils/exams.js'
import { teacherSections, scopeBySubject, scopeByClass, studentInScope, classCatalog, classOptionsForSubject, classesInItems, semestersOf, visibleTeachers, sortBySemester, scopeSubjects, termLabel, semesterLabel, yearOfStudy, termOfYear, studyYear, khungPosition, currentTerm, termKey, offeringTitle, inTerm, inKhoa, khoaChoices, termChoices, defaultTermSel, groupOfferings, groupTitle, semesterLabel as semLabel2 } from '../utils/scope.js'
import { parseClassList, validateRow, usernameOf, MAX_ROWS } from '../utils/classImport.js'
import { recentFrom, itemStartYear, isOldItem, splitTermChoices, clampDisplayYears, TERM_RECENT, TERM_OLD, namHocFrom } from '../utils/scope.js'

import { buildPdf, fitToPage, scaleDown, outputName, sizeText as fileSize, moveItem } from '../utils/fileTools.js'
import { toLetter, neededFinal, secondsLeft, openDeadlines, pomoStats, upcomingExams, parseTopics, buildStudyPlan, replan, planProgress, dayLabel } from '../utils/studyTools.js'
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

describe('CTĐT – đưa môn ngoài CTĐT vào module (lỗi web thật 23/11: id module dạng số)', () => {
  const prog = { name: 'Khung', modules: [{ id: 1, name: 'Đại cương', kind: 'required', courses: [{ code: 'GEN101', name: 'Triết', credits: 3 }] },
                                          { id: 2, name: 'Cơ sở ngành', kind: 'required', courses: [] }] }
  const phy = { id: 5, code: 'phy101', name: 'Vật lý đại cương', credits: 4 }
  test('ô chọn trả chuỗi "2" vẫn đưa được vào module id số 2, môn ra khỏi danh sách ngoài CTĐT', () => {
    const { next, error, module } = addCourseToModule(prog, '2', phy)
    assert.equal(error, undefined); assert.equal(module.name, 'Cơ sở ngành')
    assert.deepEqual(next.modules[1].courses, [{ code: 'PHY101', name: 'Vật lý đại cương', credits: 4 }])
    assert.equal(prog.modules[1].courses.length, 0)                            // không sửa CTĐT gốc
    assert.deepEqual(checkCurriculum(next, [phy]).extra, [])
  })
  test('id module dạng chuỗi (CTĐT tạo trên giao diện) vẫn chạy', () => {
    const p2 = { modules: [{ id: 'm17', name: 'A', courses: [] }] }
    assert.equal(addCourseToModule(p2, 'm17', phy).next.modules[0].courses.length, 1)
  })
  test('báo lỗi thay vì lặng lẽ không làm gì: module không có, môn không mã, mã đã có trong CTĐT', () => {
    assert.match(addCourseToModule(prog, '9', phy).error, /Không tìm thấy module/)
    assert.match(addCourseToModule(prog, '1', { name: 'X' }).error, /chưa có mã/)
    assert.match(addCourseToModule(prog, '2', { code: 'gen101', name: 'Triết' }).error, /Đại cương/)
  })
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

describe('Điểm trắc nghiệm chính thức cho Bảng điểm và Báo cáo lớp (quizResults)', () => {
  const res = (uid, quizId, score, extra = {}) => ({ uid, name: 'Tên ' + uid, username: uid, quizId, subjectId: 1, score, correct: 2, total: 3, submittedAt: '2026-11-12T08:30:00Z', ...extra })

  test('resultToEvent: chuyển một kết quả thành sự kiện quiz, ngày lấy từ submittedAt', () => {
    assert.deepEqual(resultToEvent(res('u1', 7, 6.7)),
      { type: 'quiz', at: '2026-11-12', subjectId: 1, refId: 7, refTitle: '', score: 6.7, total: 3, correct: 2, official: true })
  })
  test('sự kiện quiz trong nhật ký bị thay bằng kết quả chính thức, không cộng dồn', () => {
    const acts = [{ uid: 'u1', events: [{ type: 'quiz', subjectId: 1, refId: 7, score: 10 }, { type: 'homework', subjectId: 1, refId: 3 }] }]
    const out = applyQuizResults(acts, [res('u1', 7, 6.7)])
    const quiz = out[0].events.filter(e => e.type === 'quiz')
    assert.equal(quiz.length, 1)
    assert.equal(quiz[0].score, 6.7)          // không còn điểm 10 do nhật ký (có thể bị sửa/cắt)
  })
  test('sự kiện loại khác (homework, material) được giữ nguyên', () => {
    const acts = [{ uid: 'u1', events: [{ type: 'homework', refId: 3 }, { type: 'material', refId: 4 }] }]
    const out = applyQuizResults(acts, [res('u1', 7, 8)])
    assert.deepEqual(out[0].events.map(e => e.type).sort(), ['homework', 'material', 'quiz'])
  })
  test('không có kết quả: sự kiện quiz trong nhật ký không còn được tính là điểm', () => {
    const acts = [{ uid: 'u1', events: [{ type: 'quiz', refId: 7, score: 10 }, { type: 'material' }] }]
    assert.deepEqual(applyQuizResults(acts, [])[0].events, [{ type: 'material' }])
  })
  test('sinh viên có kết quả nhưng chưa có bản ghi nhật ký vẫn xuất hiện, kèm tên', () => {
    const out = applyQuizResults([], [res('u9', 7, 9)])
    assert.equal(out.length, 1)
    assert.equal(out[0].uid, 'u9'); assert.equal(out[0].name, 'Tên u9')
    assert.equal(out[0].events[0].score, 9)
  })
  test('nhiều đề của cùng một sinh viên; không sửa dữ liệu đầu vào', () => {
    const acts = [{ uid: 'u1', events: [{ type: 'quiz', refId: 1, score: 1 }] }]
    const copy = JSON.stringify(acts)
    const out = applyQuizResults(acts, [res('u1', 1, 5), res('u1', 2, 7)])
    assert.deepEqual(out[0].events.map(e => [e.refId, e.score]), [[1, 5], [2, 7]])
    assert.equal(JSON.stringify(acts), copy)
  })
  test('đầu vào lạ (null, thiếu uid) không làm hỏng kết quả', () => {
    assert.deepEqual(applyQuizResults(null, null), [])
    assert.deepEqual(applyQuizResults([{ uid: 'u1' }], [null, { quizId: 1 }]), [{ uid: 'u1', events: [] }])
  })
  test('nhiều lần làm bài trong nhật ký (10, 9): mỗi (sinh viên, đề) chỉ còn một điểm, đúng điểm chính thức', () => {
    const acts = [{ uid: 'u2', events: [{ type: 'quiz', subjectId: 1, refId: 101, score: 10 }, { type: 'quiz', subjectId: 1, refId: 101, score: 9 }] }]
    const quiz = applyQuizResults(acts, [res('u2', 101, 6.7)])[0].events.filter(e => e.type === 'quiz')
    // Bảng điểm lấy sự kiện cuối, Báo cáo lớp lấy bản mới nhất theo đề: chỉ còn một sự kiện nên hai màn hình cùng ra 6.7
    assert.deepEqual(quiz.map(e => [e.refId, e.score]), [[101, 6.7]])
  })
  test('sinh viên chưa làm bài: không có sự kiện quiz nào (hai màn hình hiện "Chưa làm" / "—")', () => {
    const acts = [{ uid: 'u3', events: [{ type: 'material', subjectId: 1, refId: 1 }] }]
    const out = applyQuizResults(acts, [res('u1', 101, 10)])
    assert.equal(out.find(a => a.uid === 'u3').events.filter(e => e.type === 'quiz').length, 0)
  })
})

describe('Tải điểm chính thức cho Bảng điểm và Báo cáo lớp (loadOfficialActivities)', () => {
  const acts = [{ uid: 'u1', events: [{ type: 'quiz', subjectId: 1, refId: 101, score: 9 }, { type: 'material', refId: 1 }] }]
  const ok = (v) => () => Promise.resolve(v)
  const fail = (code, message = 'lỗi') => () => Promise.reject(Object.assign(new Error(message), code ? { code } : {}))
  const official = [{ uid: 'u1', quizId: 101, subjectId: 1, score: 6.7, correct: 2, total: 3, submittedAt: '2026-11-19T03:00:00Z' }]

  test('máy chủ trả kết quả: điểm trong nhật ký bị thay bằng điểm chính thức', async () => {
    const out = await loadOfficialActivities(ok(acts), ok(official))
    assert.deepEqual(out[0].events.filter(e => e.type === 'quiz').map(e => e.score), [6.7])
  })
  test('không có quizResults nào (danh sách rỗng): không còn điểm trắc nghiệm, sự kiện khác giữ nguyên', async () => {
    const out = await loadOfficialActivities(ok(acts), ok([]))
    assert.deepEqual(out[0].events, [{ type: 'material', refId: 1 }])
  })
  test('máy chủ bản cũ chưa có endpoint (404): dùng lại nhật ký như trước', async () => {
    assert.equal(await loadOfficialActivities(ok(acts), fail('not-found')), acts)
    assert.equal(await loadOfficialActivities(ok(acts), fail('http-404')), acts)
  })
  test('lỗi máy chủ 500: báo lỗi, không lặng lẽ hiện điểm 9 trong nhật ký', async () => {
    await assert.rejects(loadOfficialActivities(ok(acts), fail('internal', 'Lỗi máy chủ (500)')), /500/)
    await assert.rejects(loadOfficialActivities(ok(acts), fail('http-502')))
  })
  test('mất mạng hoặc hết phiên: báo lỗi', async () => {
    await assert.rejects(loadOfficialActivities(ok(acts), () => Promise.reject(new TypeError('Failed to fetch'))), TypeError)
    await assert.rejects(loadOfficialActivities(ok(acts), fail('unauthenticated')))
  })
  test('isMissingEndpoint chỉ nhận 404', () => {
    assert.equal(isMissingEndpoint({ code: 'not-found' }), true)
    assert.equal(isMissingEndpoint({ code: 'http-404' }), true)
    assert.equal(isMissingEndpoint({ code: 'internal' }), false)
    assert.equal(isMissingEndpoint(new TypeError('x')), false)
    assert.equal(isMissingEndpoint(null), false)
  })
})

describe('Học phần mở theo năm học của từng khóa', () => {
  const mk = (id, code, khoa, namHoc, ky, extra = {}) => ({ id, code, name: 'Môn ' + code, khoa, namHoc, ky, ...extra })
  const subjects = [
    mk(1, 'IT101', '2026-2030', '2026-2027', 1), mk(2, 'IT101', '2025-2029', '2025-2026', 1), mk(3, 'IT101', '2024-2028', '2024-2025', 1),
    mk(4, 'IT103', '2025-2029', '2025-2026', 2), mk(5, 'IT201', '2025-2029', '2026-2027', 1), { id: 6, code: 'OLD1', name: 'Môn cũ' },
  ]
  test('học kỳ hiện tại theo ngày: HK1 từ tháng 8 đến tháng 1, HK2 từ tháng 2 đến tháng 7', () => {
    const t = (y, m, d) => currentTerm(new Date(y, m - 1, d))
    assert.deepEqual(t(2026, 11, 14), { start: 2026, ky: 1, namHoc: '2026-2027' })
    assert.deepEqual(t(2026, 8, 1), { start: 2026, ky: 1, namHoc: '2026-2027' })
    assert.deepEqual(t(2027, 1, 20), { start: 2026, ky: 1, namHoc: '2026-2027' })
    assert.deepEqual(t(2027, 2, 1), { start: 2026, ky: 2, namHoc: '2026-2027' })
    assert.deepEqual(t(2027, 7, 31), { start: 2026, ky: 2, namHoc: '2026-2027' })
  })
  test('cùng mã môn mở ở nhiều năm được phân biệt bằng nhãn năm học', () => {
    assert.equal(offeringTitle(subjects[0]), 'Môn IT101 · HK1 2026-2027')
    assert.equal(offeringTitle(subjects[2]), 'Môn IT101 · HK1 2024-2025')
    assert.equal(offeringTitle({ name: 'Môn cũ' }), 'Môn cũ')
    assert.equal(semLabel2(subjects[1]), 'HK1 · 2025-2026')
    assert.equal(semLabel2({ hocKy: 3 }), 'Năm 2 · HK1')
  })
  test('lọc lịch theo học kỳ: lấy từ chính mục, hoặc từ học phần; dữ liệu cũ chưa gắn năm học luôn hiện', () => {
    const byId = new Map(subjects.map(s => [s.id, s]))
    const of = (id) => byId.get(id)
    const items = [{ id: 'a', subjectId: 1, namHoc: '2026-2027', ky: 1 }, { id: 'b', subjectId: 2 }, { id: 'c', subjectId: 3, namHoc: '2024-2025', ky: 1 }, { id: 'd', subjectId: 6 }]
    const cur = termKey({ namHoc: '2026-2027', ky: 1 })
    assert.deepEqual(items.filter(x => inTerm(x, cur, of)).map(x => x.id), ['a', 'd'])           // b thuộc 2025-2026 theo học phần
    assert.deepEqual(items.filter(x => inTerm(x, '', of)).length, 4)                               // '' = tất cả học kỳ
    assert.deepEqual(items.filter(x => inKhoa(x, '2025-2029', of)).map(x => x.id), ['b', 'd'])     // c (khóa 2024) và a (2026) bị loại; d không rõ khóa
  })
  test('danh sách khóa và học kỳ: mới nhất trước, đánh dấu học kỳ hiện tại, mặc định chỉ học kỳ hiện tại', () => {
    const cur = { start: 2026, ky: 1, namHoc: '2026-2027' }
    assert.deepEqual(khoaChoices(subjects), ['2026-2030', '2025-2029', '2024-2028'])
    const tc = termChoices(subjects, cur)
    assert.deepEqual(tc.map(t => t.key), ['2026-2027|1', '2025-2026|2', '2025-2026|1', '2024-2025|1'])
    assert.deepEqual(tc.filter(t => t.current).map(t => t.label), ['Học kỳ 1 · Năm học 2026-2027 (hiện tại)'])
    assert.equal(defaultTermSel(subjects, cur), '2026-2027|1')
    assert.equal(defaultTermSel([mk(9, 'X', '2020-2024', '2020-2021', 1)], cur), '')            // không có dữ liệu học kỳ hiện tại → hiện tất cả
  })
  test('nhóm học phần theo khóa rồi theo học kỳ; khóa mới trước, học kỳ theo thời gian, dữ liệu cũ ở cuối', () => {
    const g = groupOfferings(subjects, { start: 2026, ky: 1, namHoc: '2026-2027' })
    assert.deepEqual(g.map(x => x.khoa), ['2026-2030', '2025-2029', '2024-2028', ''])
    const k25 = g.find(x => x.khoa === '2025-2029')
    assert.deepEqual(k25.terms.map(t => t.key), ['2025-2026|1', '2025-2026|2', '2026-2027|1'])
    assert.deepEqual(k25.terms.map(t => t.namThu), [1, 1, 2])                                     // khóa 2025: năm học 2025-2026 là năm 1, 2026-2027 là năm 2
    assert.deepEqual(k25.terms.map(t => t.current), [false, false, true])
    assert.equal(groupTitle('2025-2029', k25.terms[2]), 'Khóa 2025-2029 · Năm 2 · Học kỳ 1 (2026-2027)')
    assert.equal(groupTitle('', g[3].terms[0]), 'Chưa gắn khóa / học kỳ')
  })
  test('chương trình đào tạo: nhiều lần mở cùng mã môn đều thuộc CTĐT, không bị tính là môn ngoài chương trình', () => {
    const prog = { totalCredits: 6, modules: [{ id: 1, name: 'Cơ sở', kind: 'required', courses: [{ code: 'IT101', name: 'A', credits: 3 }, { code: 'IT103', name: 'B', credits: 3 }] }] }
    const subs = [{ id: 1, code: 'IT101', credits: 3, namHoc: '2024-2025', ky: 1 }, { id: 2, code: 'IT101', credits: 3, namHoc: '2026-2027', ky: 1 },
                  { id: 3, code: 'it103', credits: 3, namHoc: '2025-2026', ky: 2 }, { id: 4, code: 'ZZZ', credits: 2 }]
    const r = checkCurriculum(prog, subs)
    assert.deepEqual(r.extra.map(s => s.id), [4])                          // chỉ ZZZ là ngoài chương trình
    assert.equal(r.modules[0].courses[0].subject.id, 2)                    // đại diện = lần mở mới nhất
    assert.equal(r.ok, true)
  })
  test('thống kê học phần mở theo năm và theo khóa; cảnh báo học phần chưa có giáo viên hoặc quá 3 giáo viên', () => {
    const subs = [
      { id: 1, khoa: '2026-2030', namHoc: '2026-2027', ky: 1, trangThai: 'dang-hoc' }, { id: 2, khoa: '2026-2030', namHoc: '2026-2027', ky: 1, trangThai: 'dang-hoc' },
      { id: 3, khoa: '2025-2029', namHoc: '2026-2027', ky: 1, trangThai: 'dang-hoc' }, { id: 4, khoa: '2025-2029', namHoc: '2025-2026', ky: 2, trangThai: 'da-ket-thuc' },
      { id: 5, khoa: '2025-2029', namHoc: '2027-2028', ky: 1, trangThai: 'ke-hoach' }, { id: 9 },
    ]
    const users = [
      ...[1, 2, 3, 4].map(i => ({ role: 'teacher', subjectIds: [1] })),                       // học phần 1 có 4 giáo viên (vượt trần)
      { role: 'teacher', subjectIds: [3] },
      { role: 'student', cohort: '2026-2030', classId: 'A', namHoc: '2026-2027' }, { role: 'student', cohort: '2026-2030', classId: 'A', namHoc: '2026-2027' },
      { role: 'student', cohort: '2026-2030', classId: 'B', namHoc: '2026-2027' }, { role: 'student', cohort: '2025-2029', classId: 'C', namHoc: '2026-2027' },
    ]
    const r = summarizeSystem({ subjects: subs, users, today: '2026-11-14' })
    assert.deepEqual(r.offerings, { total: 5, now: 3, ended: 1, planned: 1, nowWithoutTeacher: 1, overLimit: 1 })   // học phần 2 đang học nhưng chưa có giáo viên
    assert.deepEqual(r.cohorts.map(c => [c.khoa, c.students, c.classes, c.namThu, c.offeringsNow]), [['2026-2030', 3, 2, 1, 2], ['2025-2029', 1, 1, 2, 1]])
  })
})

describe('Bảng 16 tiết và tuần thật', () => {
  test('16 tiết đúng mốc giờ nhà trường công bố (tiết 45 phút; nghỉ giữa tiết 3–4, 6–7, 9–10, 12–13)', () => {
    assert.equal(Object.keys(TIET).length, 16)
    assert.deepEqual(TIET[1], ['07:30', '08:15']); assert.deepEqual(TIET[6], ['11:30', '12:15']); assert.deepEqual(TIET[7], ['12:45', '13:30'])
    assert.deepEqual(TIET[12], ['16:45', '17:30']); assert.deepEqual(TIET[13], ['18:00', '18:45']); assert.deepEqual(TIET[16], ['20:15', '21:00'])
    const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    for (let n = 1; n <= 16; n++) assert.equal(mins(TIET[n][1]) - mins(TIET[n][0]), 45, `tiết ${n}`)
    assert.deepEqual(SESSIONS, { sang: [1, 6], chieu: [7, 12], toi: [13, 16] })
    assert.deepEqual([1, 6, 7, 12, 13, 16].map(sessionOfTiet), ['sang', 'sang', 'chieu', 'chieu', 'toi', 'toi'])
  })
  test('khối tiết phải nằm gọn trong một buổi (không bắc qua nghỉ trưa, nghỉ chiều)', () => {
    assert.equal(blockFits(4, 3), true); assert.equal(blockFits(5, 3), false)        // tiết 5–7 bắc qua giờ nghỉ trưa
    assert.equal(blockFits(13, 4), true); assert.equal(blockFits(15, 3), false)      // tiết 15–17 vượt tiết 16
    assert.equal(blockFits(11, 3), false); assert.equal(blockFits(0, 2), false)
    assert.deepEqual(blockTime(4, 3), { start: '10:00', end: '12:15' })
    assert.deepEqual(blockTime(13, 4), { start: '18:00', end: '21:00' })
    assert.equal(blockTime(5, 3), null)
    assert.deepEqual(blockStarts(3), [1, 2, 3, 4, 7, 8, 9, 10, 13, 14])               // khối 3 tiết: sáng 1–4, chiều 7–10, tối 13–14
    assert.deepEqual(blockStarts(4), [1, 2, 3, 7, 8, 9, 13])                          // khối 4 tiết: sáng 1–3, chiều 7–9, tối 13
  })
  test('suy khối tiết từ giờ (dữ liệu cũ) và ghi nhãn "Tiết a–b"', () => {
    assert.deepEqual(tietRangeOf('10:00', '12:15'), { from: 4, to: 6 })
    assert.equal(tietRangeOf('07:00', '09:30'), null)                                  // giờ cũ không khớp bảng
    assert.equal(tietLabel({ start: '07:30', end: '09:45' }), 'Tiết 1–3')
    assert.equal(tietLabel({ tietStart: 13, tietEnd: 16, start: '18:00', end: '21:00' }), 'Tiết 13–16')
    assert.equal(tietLabel({ start: '07:30', end: '08:15' }), 'Tiết 1')
    assert.equal(tietLabel({ start: '07:00', end: '09:30' }), '')
  })
  test('tuần bắt đầu từ Thứ Hai: 17/11/2026 là Thứ Ba → tuần 16/11 – 22/11', () => {
    assert.equal(tkbDay('2026-11-17'), 3); assert.equal(tkbDay('2026-11-22'), 8); assert.equal(tkbDay('2026-11-16'), 2)
    assert.equal(mondayOf('2026-11-17'), '2026-11-16'); assert.equal(mondayOf('2026-11-16'), '2026-11-16'); assert.equal(mondayOf('2026-11-22'), '2026-11-16')
    assert.deepEqual(weekDates('2026-11-16').map(d => d.iso), ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'])
    assert.deepEqual(weekDates('2026-11-16').map(d => d.day), [2, 3, 4, 5, 6, 7, 8])
    assert.equal(addDays('2026-12-30', 3), '2027-01-02'); assert.equal(addDays('2027-03-01', -1), '2027-02-28')   // qua năm, qua tháng
    assert.equal(weekRangeLabel('2026-11-16'), '16/11 – 22/11/2026'); assert.equal(weekRangeLabel('2026-12-28'), '28/12 – 03/01/2027')
  })
  test('buổi học chỉ diễn ra trong khoảng ngày của học kỳ và đúng thứ', () => {
    const c = { day: 3, startDate: '2026-09-07', endDate: '2026-12-20' }
    assert.equal(classOnDate(c, '2026-11-17'), true)         // Thứ Ba trong học kỳ
    assert.equal(classOnDate(c, '2026-11-18'), false)        // Thứ Tư
    assert.equal(classOnDate(c, '2026-12-22'), false)        // Thứ Ba nhưng đã hết học kỳ
    assert.equal(classOnDate(c, '2026-09-01'), false)        // Thứ Ba nhưng chưa bắt đầu
    assert.equal(classOnDate({ day: 3 }, '2027-05-04'), true) // dữ liệu cũ không có ngày: lặp mọi tuần
  })
  test('tuần thứ mấy của học kỳ (tuần chứa ngày bắt đầu là tuần 1)', () => {
    assert.equal(termWeekNumber('2026-09-07', '2026-12-20', '2026-09-07'), 1)
    assert.equal(termWeekNumber('2026-09-07', '2026-12-20', '2026-09-13'), 1)
    assert.equal(termWeekNumber('2026-09-07', '2026-12-20', '2026-09-14'), 2)
    assert.equal(termWeekNumber('2026-09-07', '2026-12-20', '2026-11-17'), 11)
    assert.equal(termWeekNumber('2026-09-07', '2026-12-20', '2026-12-20'), 15)
    assert.equal(termWeekNumber('2026-09-07', '2026-12-20', '2026-12-28'), null)   // đã sang kỳ thi/nghỉ
    assert.equal(termWeekNumber('2026-09-07', '2026-12-20', '2026-08-31'), null)
    assert.equal(termWeekNumber(undefined, undefined, '2026-11-17'), null)
  })
})

describe('Môn hướng dẫn: thực tập, đồ án, khóa luận', () => {
  test('nhận ra theo dấu kieuHoc, hoặc theo tên với dữ liệu cũ chưa có dấu', () => {
    assert.equal(isGuidedSubject({ kieuHoc: 'huong-dan', name: 'Môn gì đó' }), true)
    for (const name of ['Thực tập doanh nghiệp', 'Khóa luận tốt nghiệp / Đồ án tốt nghiệp', 'Đồ án chuyên ngành']) assert.equal(isGuidedSubject({ name }), true, name)
    for (const name of ['Cơ sở dữ liệu', 'Phát triển ứng dụng Web', 'Kỹ năng làm việc nhóm']) assert.equal(isGuidedSubject({ name }), false, name)
    assert.equal(isGuidedSubject({ kieuHoc: 'lop-hoc', name: 'Đồ án nhỏ' }), false)       // dấu rõ ràng thắng tên
    assert.equal(isGuidedSubject(null), false)
  })
  test('quy chế điểm: không có bộ trọng số, điểm môn = điểm do giáo viên hướng dẫn nhập (không phụ thuộc chuyên cần, bài tập, giữa kỳ)', () => {
    const pol = defaultPolicy({ kieuHoc: 'huong-dan', credits: 8 })
    assert.equal(pol.guided, true)
    assert.deepEqual(pol.weights, { cc: 0, bt: 0, gk: 0, ck: 100 })
    assert.deepEqual(validatePolicy(pol, { nCounted: 0 }), [])
    assert.equal(subjectScore(effectivePolicy(pol, 0), { cc: null, bt: null, gk: null, ck: 8.5 }).final, 8.5)
    assert.deepEqual(subjectScore(effectivePolicy(pol, 0), { cc: 10, bt: 10, gk: 10, ck: null }).missing, ['ck'])   // chưa nhập điểm hướng dẫn thì chưa có điểm môn
    assert.equal(subjectScore(effectivePolicy(pol, 0), { cc: 0, bt: 0, gk: 0, ck: 7 }).final, 7)
  })
  test('môn thường không bị ảnh hưởng: vẫn tính theo bộ trọng số L1', () => {
    const pol = defaultPolicy({ name: 'Cơ sở dữ liệu', credits: 4 })
    assert.equal(pol.guided, undefined)
    assert.equal(pol.preset, 'L1')
    assert.deepEqual(validatePolicy(pol, { nCounted: 5 }).filter(e => e.includes('Tổng trọng số')), [])
  })
})

describe('Nhãn lịch theo vai trò', () => {
  test('sinh viên: lịch học và lịch thi; giáo viên: lịch giảng dạy và lịch thi', () => {
    const sv = scheduleText('student'), gv = scheduleText('teacher')
    assert.equal(sv.nav, 'Lịch học & Lịch thi')
    assert.equal(gv.nav, 'Lịch giảng dạy & Lịch thi')
    assert.equal(sv.weekTab, 'Lịch học')
    assert.equal(gv.weekTab, 'Lịch giảng dạy')
    assert.equal(sv.examTab, 'Lịch thi')
    assert.equal(gv.examTab, 'Lịch thi')
    assert.equal(gv.unit, 'buổi dạy')
    assert.equal(sv.unit, 'tiết học')
    assert.match(gv.addClass, /buổi dạy/)
    assert.equal(sv.addClass, '')                         // sinh viên không có nút thêm
  })
  test('Đào tạo và Admin xếp lịch cho các lớp; vai trò lạ rơi về nhãn sinh viên', () => {
    assert.equal(scheduleText('training').nav, 'Xếp lịch học & thi')
    assert.equal(scheduleText('admin').title, 'Xếp lịch học & Lịch thi')
    assert.equal(scheduleText().nav, scheduleText('student').nav)
  })
  test('giáo viên không còn chữ "Lịch học" ở trang lịch; sinh viên không có chữ "giảng dạy"', () => {
    const gv = Object.values(scheduleText('teacher')).join(' | '), sv = Object.values(scheduleText('student')).join(' | ')
    assert.equal(/Lịch học|lớp học trực tuyến/i.test(gv), false)
    assert.equal(/giảng dạy|buổi dạy|dạy/i.test(sv), false)
  })
  test('navLabel chỉ đổi mục lịch; mục khác giữ nhãn gốc', () => {
    assert.equal(navLabel({ key: 'schedule', label: 'x' }, 'teacher'), 'Lịch giảng dạy & Lịch thi')
    assert.equal(navLabel({ key: 'calendar', label: 'x' }, 'student'), 'Lịch học theo tháng')
    assert.equal(navLabel({ key: 'quiz', label: 'Trắc nghiệm' }, 'teacher'), 'Trắc nghiệm')
  })
})

describe('Thi trực tuyến trên trang', () => {
  const exam = (o = {}) => ({ id: 1, subjectId: 5, date: '2026-11-20', start: '18:00', end: '19:30', ...o })
  const at = (hhmm) => Date.parse(`2026-11-20T${hhmm}:00+07:00`)
  test('lịch thi có quizId là thi trên trang; chỉ hình thức trực tuyến/trắc nghiệm được gắn đề', () => {
    assert.equal(hasRoomQuiz(exam({ quizId: 3 })), true)
    assert.equal(hasRoomQuiz(exam()), false)
    assert.equal(hasRoomQuiz(exam({ quizId: '' })), false)
    assert.equal(canUseRoomQuiz('online'), true)
    assert.equal(canUseRoomQuiz('tracNghiem'), true)
    assert.equal(canUseRoomQuiz('tuLuan'), false)
  })
  test('khung giờ thi theo giờ Việt Nam; thiếu hoặc sai giờ kết thúc thì 90 phút', () => {
    assert.deepEqual(examWindow(exam()), { start: at('18:00'), end: at('19:30') })
    assert.equal(examWindow(exam({ end: '' })).end, at('19:30'))
    assert.equal(examWindow(exam({ end: '17:00' })).end, at('19:30'))
    assert.equal(examWindow(exam({ date: '' })), null)
    assert.equal(examWindow(exam({ start: '25:00' })), null)
  })
  test('giai đoạn: chưa đến giờ, đang thi, đã kết thúc, không rõ', () => {
    assert.equal(examPhase(exam(), at('17:59')), 'upcoming')
    assert.equal(examPhase(exam(), at('18:00')), 'open')
    assert.equal(examPhase(exam(), at('19:30')), 'open')
    assert.equal(examPhase(exam(), at('19:31')), 'ended')
    assert.equal(examPhase({ id: 2 }), 'unknown')
  })
  test('đề có thể gắn: cùng môn, chưa đóng, không phải đề bị khóa', () => {
    const qs = [{ id: 1, subjectId: 5, status: 'draft' }, { id: 2, subjectId: 5, status: 'active' }, { id: 3, subjectId: 5, status: 'closed' }, { id: 4, subjectId: 6, status: 'active' }]
    assert.deepEqual(quizzesForExam(qs, 5).map(q => q.id), [1, 2])
  })
  test('đồng hồ đếm ngược và mã truy cập', () => {
    assert.equal(formatCountdown(65000), '01:05')
    assert.equal(formatCountdown(3725000), '1:02:05')
    assert.equal(formatCountdown(-5), '00:00')
    assert.equal(validAccessCode('Thi2611'), true)
    assert.equal(validAccessCode('abc'), false)
    assert.equal(validAccessCode('a b c d'), false)
    assert.equal(validAccessCode('x'.repeat(13)), false)
  })
  test('thông báo lỗi tiếng Việt cho từng mã lỗi của máy chủ', () => {
    for (const c of ['exam-bad-code', 'exam-no-code', 'exam-not-started', 'exam-ended', 'exam-locked', 'already-submitted'])
      assert.notEqual(examErrorText(c), 'Không vào được phòng thi.')
    assert.equal(examErrorText('lạ', 'x'), 'x')
  })
})

// Lỗi L1 (kiểm thử PR56 trên web thật 19/11/2026): máy chủ trả 409 nhưng giao diện không báo, và mọi lần lưu môn
// sau đó trong cùng tab đều bị từ chối theo.
describe('Lưu dữ liệu chung bị máy chủ từ chối (L1)', () => {
  const err = (code, message = 'x') => Object.assign(new Error(message), { code })

  test('serverRejected: 4xx và mã lỗi của máy chủ là bị từ chối; lỗi mạng, 5xx thì không', () => {
    assert.equal(serverRejected(err('subject-in-use')), true)
    assert.equal(serverRejected(err('permission-denied')), true)
    assert.equal(serverRejected(err('http-409')), true)
    assert.equal(serverRejected(err('http-502')), false)
    assert.equal(serverRejected(new TypeError('Failed to fetch')), false)
    assert.equal(serverRejected(null), false)
  })

  test('keysToReload: bị chặn vì môn còn dữ liệu thì tải lại cả các khóa máy chủ đếm', () => {
    assert.deepEqual(keysToReload('subjects', err('subject-in-use')), ['subjects', ...USAGE_KEYS])
    assert.deepEqual(keysToReload('materials', err('permission-denied')), ['materials'])
    assert.equal(new Set(keysToReload('materials', err('subject-in-use'))).size, 1 + USAGE_KEYS.length - 1)
  })

  test('saveErrorText: nêu khóa, câu của máy chủ, và nói rõ đã khôi phục hay cần tải lại', () => {
    const t = saveErrorText('subjects', err('subject-in-use', 'Chưa bớt được môn D: còn 1 tài liệu. Hãy xử lý các mục đó trước.'))
    assert.match(t, /môn học/)
    assert.match(t, /còn 1 tài liệu\. Hãy xử lý các mục đó trước\. Màn hình đã được đưa về/)
    assert.doesNotMatch(t, /\.\./)
    assert.match(saveErrorText('news', new TypeError('Failed to fetch')), /tin tức.*kiểm tra kết nối/)
  })

  test('echoGuard: chỉ bỏ qua đúng giá trị đã đánh dấu, một lần', () => {
    const g = echoGuard(); const v = [1]
    g.mark('subjects', v)
    assert.equal(g.skip('subjects', [1]), false)   // khác tham chiếu
    assert.equal(g.skip('subjects', v), true)
    assert.equal(g.skip('subjects', v), false)
  })

  // Mô phỏng đúng tình huống trên web thật: trang chưa biết tài liệu của môn D (người khác vừa thêm), xóa D, rồi sửa môn A.
  test('L1: sau 409, màn hình về đúng máy chủ và lần sửa tiếp theo được lưu', async () => {
    const server = {
      data: { subjects: [{ id: 'A', credits: 1 }, { id: 'D' }], materials: [{ id: 'm2', subjectId: 'D' }], schedule: [] },
      puts: 0,
      async put(key, value) {   // như check_subject_removal: bỏ môn còn dữ liệu thì 409, không ghi
        this.puts++
        const next = { ...this.data, [key]: value }
        const gone = this.data.subjects.filter(s => !next.subjects.some(x => x.id === s.id))
        if (gone.some(s => next.materials.some(m => m.subjectId === s.id))) throw err('subject-in-use', 'Chưa bớt được môn D: còn 1 tài liệu.')
        this.data = structuredClone(next)
      },
    }
    const state = { subjects: structuredClone(server.data.subjects), materials: [], schedule: [] }   // trang đã cũ
    const echo = echoGuard(); const shown = []; const waits = []
    const persist = (key, value) => {   // giống useEffect + persistShared trong app.js
      if (echo.skip(key, value)) return
      waits.push(server.put(key, value).catch(async e => shown.push(await recoverFromSaveError(key, e, {
        loadShared: async () => structuredClone(server.data), setters, echo,
      }))))
    }
    const setters = Object.fromEntries(Object.keys(state).map(k => [k, v => { state[k] = v; persist(k, v) }]))
    const settle = async () => { while (waits.length) await waits.shift() }

    setters.subjects(state.subjects.filter(s => s.id !== 'D'))   // xóa D trên trang cũ
    await settle()
    assert.equal(shown.length, 1)
    assert.match(shown[0], /còn 1 tài liệu/)
    assert.deepEqual(state.subjects.map(s => s.id), ['A', 'D'])   // D hiện lại
    assert.deepEqual(state.materials.map(m => m.id), ['m2'])       // và hiện dữ liệu đang chặn
    assert.equal(server.puts, 1)                                   // không gửi ngược bản vừa tải

    setters.subjects(state.subjects.map(s => s.id === 'A' ? { ...s, credits: 2 } : s))   // sửa A
    await settle()
    assert.equal(shown.length, 1)
    assert.equal(server.data.subjects.find(s => s.id === 'A').credits, 2)   // trước khi sửa: máy chủ vẫn 1
    assert.ok(server.data.subjects.some(s => s.id === 'D'))
  })

  test('lỗi mạng: không đổi màn hình, chỉ báo', async () => {
    let loaded = false; const set = []
    const t = await recoverFromSaveError('subjects', new TypeError('Failed to fetch'), {
      loadShared: async () => { loaded = true; return {} }, setters: { subjects: v => set.push(v) }, echo: echoGuard(),
    })
    assert.equal(loaded, false); assert.equal(set.length, 0); assert.match(t, /kiểm tra kết nối/)
  })
})

describe('D3 mục 2 – trang Tiện ích (V7)', () => {
  const src = readFileSync(new URL('../pages/Tools.js', import.meta.url), 'utf8')
  test('không còn chạy chuỗi bằng Function() hay eval', () => {
    assert.doesNotMatch(src, /\bFunction\s*\(|\beval\s*\(/)
  })
  test('đã bỏ Máy tính bỏ túi, Dịch thuật, Giải trí', () => {
    for (const name of ['Calculator', 'Translator', 'Entertainment'])
      assert.doesNotMatch(src, new RegExp(`\\b${name}\\b`))
  })
})

describe('Kho sách điện tử (Thư viện)', () => {
  const books = [
    { id: 'dac-nhan-tam', title: 'Đắc nhân tâm', author: 'Dale Carnegie', genre: 'ky-nang', size: 2621440, pages: 120 },
    { id: 'thanh-kiem-2', title: 'Thanh kiếm và lá chắn – Tập 2', author: 'Vađim Kôgiepnhicốp', genre: 'van-hoc-nn', series: 'Thanh kiếm và lá chắn', size: 9000000, pages: 400 },
    { id: 'thanh-kiem-10', title: 'Thanh kiếm và lá chắn – Tập 10', author: 'Vađim Kôgiepnhicốp', genre: 'van-hoc-nn', series: 'Thanh kiếm và lá chắn', size: 9500000, pages: 420 },
    { id: 'hlm', title: 'Hồng Lâu Mộng', author: 'Tào Tuyết Cần', genre: 'van-hoc-nn', size: 18000000, pages: 312 },
    { id: 'la', title: 'Sách lạ', genre: 'the-loai-khong-co', size: 100 },
  ]
  test('tìm không phân biệt dấu và hoa thường, mọi từ khóa đều phải có', () => {
    assert.equal(foldText('Đắc Nhân Tâm'), 'dac nhan tam')
    assert.deepEqual(filterBooks(books, { q: 'dac nhan' }).map(b => b.id), ['dac-nhan-tam'])
    assert.deepEqual(filterBooks(books, { q: 'tuyet can' }).map(b => b.id), ['hlm'])
    assert.deepEqual(filterBooks(books, { q: 'thanh kiem tap' }).map(b => b.id), ['thanh-kiem-2', 'thanh-kiem-10'])
    assert.deepEqual(filterBooks(books, { q: 'dac xyz' }), [])
    assert.equal(filterBooks(books, { q: '  ' }).length, books.length)
  })
  test('lọc theo thể loại; thể loại lạ nằm trong "Khác"', () => {
    assert.deepEqual(filterBooks(books, { genre: 'van-hoc-nn' }).map(b => b.id), ['thanh-kiem-2', 'thanh-kiem-10', 'hlm'])
    assert.deepEqual(filterBooks(books, { genre: 'khac' }).map(b => b.id), ['la'])
    assert.deepEqual(genreCounts(books), { 'ky-nang': 1, 'van-hoc-nn': 3, khac: 1 })
    assert.equal(genreOf({ genre: 'khong-co' }), GENRES.khac)
  })
  test('sắp xếp theo tên (số tự nhiên: Tập 2 trước Tập 10), dung lượng, số trang', () => {
    assert.deepEqual(sortBooks(books, 'title').map(b => b.id).slice(0, 4), ['dac-nhan-tam', 'hlm', 'la', 'thanh-kiem-2'])
    assert.ok(sortBooks(books, 'title').map(b => b.id).indexOf('thanh-kiem-2') < sortBooks(books, 'title').map(b => b.id).indexOf('thanh-kiem-10'))
    assert.equal(sortBooks(books, 'size')[0].id, 'la')
    assert.equal(sortBooks(books, 'pages')[0].id, 'la')
    assert.equal(books[0].id, 'dac-nhan-tam')            // không đổi mảng gốc
  })
  test('dung lượng, đường dẫn tệp, dòng nguồn', () => {
    assert.equal(formatSize(2621440), '3 MB')
    assert.equal(formatSize(1610612736), '1.5 GB')
    assert.equal(formatSize(2048), '2 KB')
    assert.equal(formatSize(0), '0 B')
    assert.equal(bookFileUrl('hong-lau-mong'), '/api/files/library/hong-lau-mong.pdf')
    assert.equal(sourceLine({ sourceName: 'Internet Archive', sourceId: 'HongLauMong_201512' }), 'Internet Archive · HongLauMong_201512')
    assert.equal(sourceLine({ sourceName: 'Internet Archive (tải thủ công, không có mã mục)' }), 'Internet Archive (tải thủ công, không có mã mục)')
  })
  test('chỉ mở liên kết nguồn https tới archive.org', () => {
    assert.equal(safeSourceUrl('https://archive.org/details/HongLauMong_201512'), 'https://archive.org/details/HongLauMong_201512')
    assert.equal(safeSourceUrl('javascript:alert(1)'), '')
    assert.equal(safeSourceUrl('https://evil.example/details/x'), '')
    assert.equal(safeSourceUrl(''), '')
  })
})

describe('[D3] mục 14 – Nhập danh sách lớp từ CSV/Excel', () => {
  test('CSV dấu phẩy, tiêu đề có dấu, có BOM; mã lớp đổi in hoa, ô có dấu phẩy trong ngoặc kép', () => {
    const { rows, errors } = parseClassList('\uFEFFMSSV,Họ tên,Lớp,Khóa\n2401001,Nguyễn Văn A,cntt24-01,2024-2028\n2401002,"Lê, B",CNTT24-01,')
    assert.deepEqual(errors, [])
    assert.deepEqual(rows.map(r => [r.mssv, r.name, r.classId, r.cohort]),
      [['2401001', 'Nguyễn Văn A', 'CNTT24-01', '2024-2028'], ['2401002', 'Lê, B', 'CNTT24-01', '']])
  })
  test('dán từ Excel (tab), tiêu đề không dấu, không có cột khóa', () => {
    const { rows, errors } = parseClassList('mssv\tho_ten\tlop\n2401003\tTrần C\tCNTT24-02')
    assert.deepEqual(errors, [])
    assert.equal(rows[0].classId, 'CNTT24-02')
  })
  test('thiếu cột bắt buộc → báo lỗi dòng 1, không nhận dòng nào', () => {
    const { rows, errors } = parseClassList('mssv,ho_ten\n2401001,A')
    assert.equal(rows.length, 0)
    assert.equal(errors[0].line, 1)
  })
  test('báo lỗi đúng số dòng, các dòng đúng vẫn nhận', () => {
    const { rows, errors } = parseClassList('mssv,ho_ten,lop\n24A01,A,CNTT24-01\n2401004,,CNTT24-01\n2401005,E,CNTT 24\n2401006,F,CNTT24-01')
    assert.deepEqual(errors.map(e => e.line), [2, 3, 4])
    assert.deepEqual(rows.map(r => r.mssv), ['2401006'])
  })
  test('mã SV lặp trong tệp → dòng sau báo lỗi', () => {
    const { rows, errors } = parseClassList('mssv,ho_ten,lop\n2401001,A,CNTT24-01\n2401001,B,CNTT24-01')
    assert.equal(rows.length, 1)
    assert.equal(errors[0].line, 3)
  })
  test(`quá ${MAX_ROWS} dòng → báo lỗi`, () => {
    const body = Array.from({ length: MAX_ROWS + 1 }, (_, i) => `${2400000 + i},SV ${i},CNTT24-01`).join('\n')
    const { errors } = parseClassList('mssv,ho_ten,lop\n' + body)
    assert.ok(errors.some(e => e.line === 0))
  })
  test('tệp trống; validateRow; tên đăng nhập = sv + mã SV', () => {
    assert.equal(parseClassList('').errors[0].message, 'Tệp trống.')
    assert.equal(validateRow({ mssv: '2401001', name: 'A', classId: 'CNTT24-01' }), null)
    assert.equal(usernameOf('2401001'), 'sv2401001')
  })
  test('khóa phải có dạng 2024-2028 như dữ liệu hiện có; để trống thì vẫn nhận', () => {
    const { rows, errors } = parseClassList('mssv,ho_ten,lop,khoa\n2401007,G,CNTT24-01,K24\n2401008,H,CNTT24-01,2024-2028\n2401009,I,CNTT24-01,')
    assert.deepEqual(errors.map(e => e.line), [2])
    assert.deepEqual(rows.map(r => r.cohort), ['2024-2028', ''])
  })
})

test('Hạn đề trắc nghiệm tính hết ngày theo giờ Việt Nam (ca 24)', () => {
  assert.equal(quizDuePassed('2026-11-18', new Date('2026-11-18T00:30:00Z')), false) // 7:30 sáng ngày hạn
  assert.equal(quizDuePassed('2026-11-18', new Date('2026-11-18T16:59:59Z')), false) // 23:59:59 giờ VN
  assert.equal(quizDuePassed('2026-11-18', new Date('2026-11-18T17:00:00Z')), true)  // 0:00 ngày 19/11 giờ VN
  assert.equal(quizDuePassed('', new Date()), false)
  assert.equal(quizDuePassed('abc', new Date()), false)
})

test('Đếm lượt nộp của từng đề từ quizResults (ca 19)', () => {
  const m = countSubmissionsByQuiz([{ quizId: 1 }, { quizId: 1 }, { quizId: '2' }])
  assert.equal(m.get('1'), 2)
  assert.equal(m.get('2'), 1)
  assert.equal(m.get('3'), undefined)
  assert.equal(countSubmissionsByQuiz().size, 0)
})

describe('[D3] mục 16 – Lịch theo tháng (pages/MonthCalendar.js)', () => {
  test('lưới bắt đầu từ Thứ Hai, đủ số tuần chứa tháng, không thừa hàng toàn ngày tháng sau', () => {
    const nov = monthGrid(2026, 10)                       // 01/11/2026 là Chủ nhật → 6 tuần
    assert.equal(nov.length, 42)
    assert.equal(nov[0].date, '2026-10-26'); assert.equal(nov[6].date, '2026-11-01'); assert.equal(nov.at(-1).date, '2026-12-06')
    assert.equal(nov.filter(c => c.inMonth).length, 30)
    const dec = monthGrid(2026, 11)                       // qua năm: ô cuối là 03/01/2027
    assert.equal(dec.length, 35); assert.equal(dec[0].date, '2026-11-30'); assert.equal(dec.at(-1).date, '2027-01-03')
    const feb = monthGrid(2027, 1)                        // 01/02/2027 là Thứ Hai, 28 ngày → đúng 4 hàng
    assert.equal(feb.length, 28); assert.equal(feb.every(c => c.inMonth), true)
    for (const g of [nov, dec, feb]) {
      assert.equal(g.length % 7, 0)
      for (let i = 0; i < g.length; i += 7) assert.equal(tkbDay(g[i].date), 2)          // mỗi hàng mở đầu bằng Thứ Hai
    }
  })
  test('buổi học lặp theo thứ trong khoảng ngày học kỳ, lịch thi đúng ngày, trong ngày xếp theo giờ', () => {
    const schedule = [
      { id: 1, subjectId: 1, day: 3, start: '13:30', startDate: '2026-09-07', endDate: '2026-11-20' },   // Thứ Ba, hết học kỳ 20/11
      { id: 2, subjectId: 2, day: 8, start: '18:00' },                                                  // Chủ nhật, không giới hạn ngày
    ]
    const exams = [
      { id: 9, subjectId: 1, date: '2026-11-17', start: '07:30' },
      { id: 10, subjectId: 2, date: '2026-12-01', start: '07:30' },                                     // tháng sau, không hiện
    ]
    const ev = monthEvents(2026, 10, schedule, exams)
    assert.deepEqual(Object.keys(ev).filter(d => ev[d].some(e => e.kind === 'class' && e.id === 1)), ['2026-11-03', '2026-11-10', '2026-11-17'])
    assert.deepEqual(Object.keys(ev).filter(d => ev[d].some(e => e.id === 2)), ['2026-11-01', '2026-11-08', '2026-11-15', '2026-11-22', '2026-11-29'])
    assert.deepEqual(ev['2026-11-17'].map(e => `${e.kind}:${e.start}`), ['exam:07:30', 'class:13:30'])   // thi buổi sáng đứng trước
    assert.equal(ev['2026-11-24'], undefined)                                   // Thứ Ba sau khi hết học kỳ, ngày trống không có khóa
    assert.equal(Object.values(ev).flat().some(e => e.id === 10), false)
    const keys = Object.values(ev).flat().map(e => e.key)
    assert.equal(new Set(keys).size, keys.length)                              // khóa React không trùng giữa các tuần
  })
  test('cùng một buổi học như thời khóa biểu theo tuần (classOnDate) ở mọi ngày trong tháng', () => {
    const schedule = [2, 3, 4, 5, 6, 7, 8].map((day, i) => ({ id: i + 1, day, start: '07:30', startDate: '2026-11-10', endDate: '2026-11-25' }))
    const ev = monthEvents(2026, 10, schedule, [])
    for (let d = 1; d <= 30; d++) {
      const iso = `2026-11-${String(d).padStart(2, '0')}`
      assert.deepEqual((ev[iso] || []).map(e => e.id), schedule.filter(c => classOnDate(c, iso)).map(c => c.id), iso)
    }
  })
  test('dữ liệu thiếu giờ hoặc danh sách rỗng không làm lỗi trang', () => {
    assert.deepEqual(monthEvents(2026, 10), {})
    const ev = monthEvents(2026, 10, [{ id: 1, day: 2 }], [{ id: 2, date: '2026-11-02', start: '08:00' }])
    assert.deepEqual(ev['2026-11-02'].map(e => e.kind), ['class', 'exam'])
  })
})

describe('Khoảng hiển thị dữ liệu – N năm học gần nhất, dữ liệu cũ xem/trích lục bằng bộ lọc', () => {
  const cur = { start: 2026, ky: 1, namHoc: '2026-2027' }
  const subs = [
    { id: 1, namHoc: '2023-2024', ky: 1 }, { id: 2, namHoc: '2024-2025', ky: 2 },
    { id: 3, namHoc: '2026-2027', ky: 1 }, { id: 4 },
  ]
  const subjectOf = (id) => subs.find(s => s.id === id)
  test('số năm hiển thị: mặc định 3, giới hạn 2–5', () => {
    assert.equal(clampDisplayYears(undefined), 3)
    assert.equal(clampDisplayYears('abc'), 3)
    assert.equal(clampDisplayYears(1), 2)
    assert.equal(clampDisplayYears(9), 5)
    assert.equal(clampDisplayYears(4), 4)
  })
  test('năm học hiện tại 2026-2027, 3 năm → hiển thị từ 2024-2025', () => {
    assert.equal(recentFrom(3, cur), 2024)
    assert.equal(namHocFrom(recentFrom(3, cur)), '2024-2025')
    assert.equal(recentFrom(2, cur), 2025)
  })
  test('năm của mục: theo học kỳ của mục/học phần; không có thì theo ngày (tháng 8 sang năm học mới)', () => {
    assert.equal(itemStartYear({ subjectId: 1 }, subjectOf), 2023)
    assert.equal(itemStartYear({ namHoc: '2025-2026', ky: 2, subjectId: 1 }, subjectOf), 2025)
    assert.equal(itemStartYear({ dueDate: '2024-07-31' }), 2023)
    assert.equal(itemStartYear({ dueDate: '2024-08-01' }), 2024)
    assert.equal(itemStartYear({ subjectId: 4 }, subjectOf), null)
  })
  test('mục cũ: ngoài khoảng hiển thị; mục không rõ năm không bị coi là cũ', () => {
    assert.equal(isOldItem({ subjectId: 1 }, 3, subjectOf, cur), true)
    assert.equal(isOldItem({ subjectId: 2 }, 3, subjectOf, cur), false)
    assert.equal(isOldItem({ subjectId: 2 }, 2, subjectOf, cur), true)
    assert.equal(isOldItem({ subjectId: 4 }, 3, subjectOf, cur), false)
  })
  test('inTerm với TERM_RECENT / TERM_OLD tách đúng hai phần, cộng lại đủ cả danh sách', () => {
    const items = [{ subjectId: 1 }, { subjectId: 2 }, { subjectId: 3 }, { subjectId: 4 }, { dueDate: '2020-01-01' }]
    const recent = items.filter(x => inTerm(x, TERM_RECENT, subjectOf, 3))
    const old = items.filter(x => inTerm(x, TERM_OLD, subjectOf, 3))
    // dùng năm học hiện tại thật nên chỉ kiểm tra phần không phụ thuộc ngày chạy
    assert.equal(recent.length + old.length, items.length)
    assert.ok(old.some(x => x.dueDate === '2020-01-01'))
    assert.ok(recent.some(x => x.subjectId === 4))
    assert.equal(items.filter(x => inTerm(x, '', subjectOf, 3)).length, items.length)
  })
  test('chia danh sách học kỳ thành gần đây và dữ liệu cũ', () => {
    const opts = termChoices(subs, cur)
    const { recent, old, from } = splitTermChoices(opts, 3, cur)
    assert.equal(from, 2024)
    assert.deepEqual(recent.map(t => t.key), ['2026-2027|1', '2024-2025|2'])
    assert.deepEqual(old.map(t => t.key), ['2023-2024|1'])
  })
  test('defaultTermSel giữ nguyên: không có học kỳ hiện tại → chuỗi rỗng (trang có khoảng hiển thị dùng || TERM_RECENT)', () => {
    assert.equal(defaultTermSel([{ namHoc: '2020-2021', ky: 1 }], cur), '')
  })
})

describe('Tiện ích – Điểm cuối kỳ cần đạt và Pomodoro', () => {
  const L1 = { cc: 10, bt: 15, gk: 20, ck: 55 }
  test('ví dụ L1 của quy chế: CC 9, BT 7, GK 6,5 → cuối kỳ 7,0 thì điểm môn 7,1', () => {
    assert.deepEqual(neededFinal(L1, { cc: 9, bt: 7, gk: 6.5 }, 7.1), { need: 7, status: 'ok' })
    assert.deepEqual(neededFinal(L1, { cc: 9, bt: 7, gk: 6.5 }, 4), { need: 1.3, status: 'ok' })
  })
  test('đã chắc chắn đạt, không thể đạt, dữ liệu sai', () => {
    assert.equal(neededFinal(L1, { cc: 10, bt: 10, gk: 10 }, 4).status, 'done')
    assert.equal(neededFinal(L1, { cc: 0, bt: 0, gk: 0 }, 8.5).status, 'impossible')
    assert.equal(neededFinal(L1, { cc: 9, bt: '', gk: 6 }, 4).status, 'invalid')
    assert.equal(neededFinal(L1, { cc: 11, bt: 7, gk: 6 }, 4).status, 'invalid')
    assert.equal(neededFinal({ cc: 10, bt: 10, gk: 10, ck: 60 }, { cc: 9, bt: 7, gk: 6 }, 4).status, 'invalid')
  })
  test('quy đổi điểm chữ', () => {
    assert.equal(toLetter(8.5).letter, 'A')
    assert.equal(toLetter(3.9).pass, false)
    assert.equal(toLetter(''), null)
  })
  test('Pomodoro: giây còn lại, deadline chưa xong, thống kê phiên', () => {
    assert.equal(secondsLeft(10500, 0), 11)
    assert.equal(secondsLeft(0, 5000), 0)
    const dl = [{ id: 1, dueDate: '2026-12-05', status: 'pending' }, { id: 2, dueDate: '2026-12-01', status: 'completed' }, { id: 3, dueDate: '2026-11-30', status: 'in_progress' }]
    assert.deepEqual(openDeadlines(dl).map(d => d.id), [3, 1])
    const log = [{ date: '2026-11-25', mins: 25, deadlineId: '1' }, { date: '2026-11-25', mins: 50, deadlineId: null }, { date: '2026-11-24', mins: 25, deadlineId: '1' }]
    assert.deepEqual(pomoStats(log, '2026-11-25', '1'), { todayCount: 2, todayMins: 75, taskCount: 2 })
  })
})
describe('Tiện ích – Lập kế hoạch ôn thi', () => {
  const T = ['C1', 'C2', 'C3', 'C4', 'C5']
  test('đủ ngày: mỗi ngày một mục, ngày trước hôm thi để ôn tổng hợp, không xếp vào ngày thi', () => {
    const p = buildStudyPlan('2026-11-26', '2026-12-03', T)
    assert.deepEqual(p.map(x => x.date), ['2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02'])
    assert.deepEqual(p.slice(0, 5).map(x => x.topics.join()), T)
    assert.equal(p[5].kind, 'review'); assert.equal(p.at(-1).kind, 'review')
  })
  test('ít ngày: gộp nhiều mục một ngày, không bỏ sót mục nào; thi ngày mai dồn hết vào hôm nay; thi hôm nay thì không lập', () => {
    const p = buildStudyPlan('2026-11-26', '2026-11-29', T)
    assert.deepEqual(p.map(x => x.topics.join()), ['C1,C2,C3', 'C4,C5', 'Ôn tổng hợp, xem lại phần còn yếu'])
    assert.deepEqual(buildStudyPlan('2026-11-26', '2026-11-27', T)[0].topics, T)
    assert.deepEqual(buildStudyPlan('2026-11-26', '2026-11-26', T), [])
  })
  test('lập lại từ hôm nay giữ phần đã xong, chia lại phần còn thiếu; tiến độ đếm ngày chậm', () => {
    const p = buildStudyPlan('2026-11-26', '2026-12-03', T)
    const done = { '2026-11-26': true }
    assert.deepEqual(planProgress(p, done, '2026-11-28'), { done: 1, total: 7, behind: 1 })
    assert.deepEqual(replan(p, done, '2026-11-28', '2026-12-03').flatMap(x => x.kind === 'study' ? x.topics : []), ['C2', 'C3', 'C4', 'C5'])
  })
  test('tách nội dung, chọn kỳ thi sắp tới, nhãn ngày', () => {
    assert.deepEqual(parseTopics('a\n\n b \na\nc'), ['a', 'b', 'c'])
    const ex = upcomingExams([{ id: 1, subjectId: 1, date: '2026-11-20' }, { id: 2, subjectId: 2, date: '2026-12-05' }, { id: 3, subjectId: 1, date: '2026-12-01' }], [{ id: 1, name: 'Toán' }], '2026-11-26')
    assert.deepEqual(ex.map(e => [e.id, e.subjectName]), [[3, 'Toán'], [2, 'Môn học']])
    assert.equal(dayLabel('2026-11-29'), 'CN 29/11')
  })
})

describe('Tiện ích – Chuyển đổi tệp (ảnh → PDF)', () => {
  const pdfText = (u) => new TextDecoder('latin1').decode(u)
  test('PDF có đủ trang, bảng xref trỏ đúng từng đối tượng, ảnh ngang ra trang ngang', () => {
    const t = pdfText(buildPdf([{ bytes: new Uint8Array(100), width: 800, height: 1200 }, { bytes: new Uint8Array(50), width: 1600, height: 900 }]))
    assert.ok(t.startsWith('%PDF-1.4')); assert.ok(t.endsWith('%%EOF\n')); assert.match(t, /\/Count 2/)
    const x = +t.match(/startxref\n(\d+)/)[1]
    assert.equal(t.slice(x, x + 4), 'xref')
    const offs = [...t.slice(x).matchAll(/(\d{10}) 00000 n/g)].map(m => +m[1])
    offs.forEach((o, i) => assert.ok(t.startsWith(`${i + 1} 0 obj`, o)))
    assert.deepEqual(t.match(/MediaBox \[[^\]]+\]/g), ['MediaBox [0 0 595.28 841.89]', 'MediaBox [0 0 841.89 595.28]'])
    assert.throws(() => buildPdf([]))
  })
  test('thu nhỏ, đặt vừa trang, tên tệp, dung lượng, đổi thứ tự', () => {
    assert.deepEqual(scaleDown(4000, 3000, 1800), { w: 1800, h: 1350 })
    assert.deepEqual(scaleDown(800, 600, 1800), { w: 800, h: 600 })
    const b = fitToPage(1000, 1000); assert.ok(b.w <= 595.28 - 48 + 1e-9 && Math.abs(b.w - b.h) < 1e-9)
    assert.equal(outputName('bai lam:1.png', 'pdf'), 'bai lam_1.pdf')
    assert.equal(fileSize(1536), '1,5 KB')
    assert.deepEqual(moveItem([1, 2, 3], 0, 1), [2, 1, 3]); assert.deepEqual(moveItem([1, 2, 3], 0, -1), [1, 2, 3])
  })
})
