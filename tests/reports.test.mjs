// Kiểm thử P2 (kiểm thử web thật 18/11/2026): trang Quản lý lớp học chỉ đếm tài liệu và bài tập CÓ THẬT của môn.
// Sinh viên tự ghi được sự kiện material/homework với refId bất kỳ (máy chủ chỉ kiểm tra hình thức), nên trước đây
// 1 bài tập giả được tính "Bài tập đã làm = 1" và 1996 tài liệu giả được tính "1996 tài liệu đã xem".
// Gọi Reports() với React giả và lấy kết quả useMemo (không cần trình duyệt). Chạy: node --test tests/reports.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'

let acts = []
let firstState = true
const memos = []
globalThis.window = { React: {
  useState: (init) => { if (firstState) { firstState = false; return [acts, () => {}] } return [init, () => {}] },
  useEffect: () => {}, useMemo: (fn) => { const v = fn(); memos.push(v); return v },
  useRef: (v) => ({ current: v }), useCallback: (f) => f, createElement: () => null, Fragment: 'F' } }
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} }
const { default: Reports } = await import('../pages/Reports.js')

function report(events, { materials, homeworks }) {
  acts = [{ uid: 'sv', name: 'SV', events }]
  firstState = true
  memos.length = 0
  Reports({ subjects: [{ id: 1000, name: 'Triết' }], quizzes: [], user: { role: 'admin' }, materials, homeworks,
    allUsers: [{ uid: 'sv', role: 'student', subjectIds: [1000], name: 'SV', username: 'sv' }], fetchActivities: null })
  return memos.find(x => x && x.students)
}

const MATERIALS = [{ id: 200001, subjectId: 1000, title: 'Giáo trình' }, { id: 200002, subjectId: 1000, title: 'Slide' },
  { id: 300001, subjectId: 1001, title: 'Tài liệu môn khác' }]
const HOMEWORKS = [{ id: 501, subjectId: 1000, title: 'Bài 1' }, { id: 502, subjectId: 1001, title: 'Bài môn khác' }]

test('P2: tài liệu giả không được tính là đã xem', () => {
  const d = report([
    { type: 'material', subjectId: 1000, refId: 200001 },
    { type: 'material', subjectId: 1000, refId: 'kt-a8-1' },
    { type: 'material', subjectId: 1000, refId: 'kt-a8-2' },
    { type: 'material', subjectId: 1000, refId: 300001 },          // tài liệu thật nhưng của môn khác
  ], { materials: MATERIALS, homeworks: HOMEWORKS })
  assert.deepEqual(d.students[0].matViewed, [200001])
  assert.equal(d.cViewed, 1)
})

test('P2: bài tập giả không được tính là đã làm; tên lấy từ bài tập thật', () => {
  const d = report([
    { type: 'homework', subjectId: 1000, refId: 'kt-a6-hw', refTitle: 'Giả' },
    { type: 'homework', subjectId: 1000, refId: 502, refTitle: 'Bài môn khác gắn sai môn' },
    { type: 'homework', subjectId: 1000, refId: '501', refTitle: 'Tên sinh viên tự đặt' },   // id số, refId chuỗi
  ], { materials: MATERIALS, homeworks: HOMEWORKS })
  assert.deepEqual(d.students[0].hwDone, ['501'])
  assert.equal(d.cHw, 1)
  assert.deepEqual([...d.hwSeen], [['501', 'Bài 1']])
})

test('P2: chỉ có sự kiện giả thì 0 tài liệu, 0 bài tập, không ai được tính', () => {
  const d = report([
    { type: 'material', subjectId: 1000, refId: 'gia' },
    { type: 'homework', subjectId: 1000, refId: 'gia' },
  ], { materials: MATERIALS, homeworks: HOMEWORKS })
  assert.equal(d.students[0].matViewed.length, 0)
  assert.equal(d.students[0].hwDone.length, 0)
  assert.equal(d.cViewed + d.cHw, 0)
  assert.equal(d.hwSeen.size, 0)
})

test('P2: trắc nghiệm không bị ảnh hưởng (điểm vẫn tính như cũ)', () => {
  const d = report([{ type: 'quiz', subjectId: 1000, refId: 9, score: 5 }, { type: 'quiz', subjectId: 1000, refId: 10, score: 0 }],
    { materials: MATERIALS, homeworks: HOMEWORKS })
  assert.equal(d.students[0].quizList.length, 2)
  assert.equal(d.students[0].avg, 2.5)
  assert.equal(d.cQuiz, 1)
})
