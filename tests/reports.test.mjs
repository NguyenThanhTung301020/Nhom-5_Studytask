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

// ── 23/11: trang mặc định mở môn demo cũ và chỉ thấy 1 sinh viên demo; học phần đã kết thúc không có sinh viên ──
const { offeringRoster, defaultOfferingId, currentTerm } = await import('../utils/scope.js')
const CUR = currentTerm()                                                     // trang dùng ngày hôm nay, nên dữ liệu thử theo học kỳ hiện tại
const SUBJ = [
  { id: 1, name: 'Toán cao cấp' },                                                                    // môn demo ban đầu
  { id: 1100, name: 'Triết', khoa: '2024-2028', namHoc: '2020-2021', ky: 1, trangThai: 'da-ket-thuc' },
  { id: 1200, name: 'CSDL', code: 'IT201', khoa: '2024-2028', namHoc: CUR.namHoc, ky: CUR.ky, trangThai: 'dang-hoc' },
  { id: 1300, name: 'Web', khoa: '2026-2030', namHoc: CUR.namHoc, ky: CUR.ky, trangThai: 'dang-hoc' },
]
const USERS = [
  { uid: 'demo', role: 'student', subjectIds: [1, 2] },
  { uid: 'a1', role: 'student', classId: 'CNTT24-01', cohort: '2024-2028', subjectIds: [1200] },
  { uid: 'a2', role: 'student', classId: 'CNTT24-02', cohort: '2024-2028', subjectIds: [1200] },
  { uid: 'b1', role: 'student', classId: 'CNTT26-01', cohort: '2026-2030', subjectIds: [1300] },
]

test('Học phần mặc định là học phần của học kỳ hiện tại, không phải môn demo đầu danh sách', () => {
  assert.equal(defaultOfferingId(SUBJ, CUR), 1300)                          // khóa mới nhất trước
  assert.equal(defaultOfferingId([SUBJ[0], SUBJ[1]], CUR), 1100)            // không có học kỳ hiện tại: học phần mới nhất đã gắn khóa
  assert.equal(defaultOfferingId([SUBJ[0]], CUR), 1)
})

test('Sinh viên của học phần: đang học theo subjectIds, học phần đã kết thúc theo khóa', () => {
  const ids = (sub, user = { role: 'admin' }) => offeringRoster(user, USERS, SUBJ.find(s => s.id === sub)).map(u => u.uid).sort()
  assert.deepEqual(ids(1200), ['a1', 'a2'])
  assert.deepEqual(ids(1100), ['a1', 'a2'])                                 // trước đây: 0 sinh viên
  assert.deepEqual(ids(1300), ['b1'])
  assert.deepEqual(ids(1), ['demo'])
  const gv = { role: 'teacher', subjectIds: [1100], sections: [{ classId: 'CNTT24-02', subjectId: 1100 }] }
  assert.deepEqual(ids(1100, gv), ['a2'])                                   // giáo viên chỉ thấy lớp mình dạy
})

test('Trang Quản lý lớp học: sĩ số theo lớp thật, có danh sách lớp để lọc', () => {
  acts = []
  firstState = true
  memos.length = 0
  Reports({ subjects: SUBJ, quizzes: [], materials: [], homeworks: [], user: { role: 'admin' }, allUsers: USERS, fetchActivities: null })
  const d = memos.find(x => x && x.students)
  assert.equal(d.N, 1)                                                      // mặc định học phần 1300 (khóa 2026), không phải môn demo
  assert.deepEqual(d.classes, ['CNTT26-01'])
})
