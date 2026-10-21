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
import { checkCurriculum } from '../utils/curriculum.js'

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
