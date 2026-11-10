// Kiểm thử nhập/xuất bộ câu hỏi từ tệp (utils/quizFile.js): chạy bằng `npm run test:logic`
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseDelimited, detectDelimiter, questionsFromText, questionsToCsv, questionsToJson, CSV_TEMPLATE, assignIds, judgeAnswer, normFill, stripAccents } from '../utils/quizFile.js'

test('parseDelimited: ngoặc kép, dấu ngăn và xuống dòng trong ô, BOM', () => {
  const rows = parseDelimited('﻿a,"b,c","d ""x""\nrow2"\r\ne,f,g\r\n\r\n', ',')
  assert.deepEqual(rows, [['a', 'b,c', 'd "x"\nrow2'], ['e', 'f', 'g']])
})

test('detectDelimiter: nhận ra tab (dán từ Excel), chấm phẩy và phẩy', () => {
  assert.equal(detectDelimiter('Loại\tCâu hỏi\tA'), '\t')
  assert.equal(detectDelimiter('Loại;Câu hỏi;A'), ';')
  assert.equal(detectDelimiter('Loại,Câu hỏi,A'), ',')
})

test('mẫu CSV nhập được hết: một đáp án, nhiều đáp án, hai câu điền khuyết', () => {
  const r = questionsFromText(CSV_TEMPLATE)
  assert.deepEqual(r.errors, [])
  assert.equal(r.questions.length, 4)
  assert.equal(r.questions[0].type, 'single')
  assert.deepEqual(r.questions[0].answers.map(a => a.correct), [false, true, false, false])
  assert.equal(r.questions[1].type, 'multiple')
  assert.deepEqual(r.questions[1].answers.map(a => a.correct), [true, false, true, false])
  assert.deepEqual(r.questions[2], { text: 'Thủ đô của Việt Nam là ____', type: 'fill', blanks: 1, answers: [], accepted: [['Hà Nội', 'Ha Noi']] })
  assert.equal(r.questions[3].blanks, 2)
  assert.deepEqual(r.questions[3].accepted, [['2', 'hai'], ['2', 'hai']])
})

test('dán từ Excel (tab), tiêu đề không dấu và không có cột Loại', () => {
  const r = questionsFromText('cau hoi\tA\tB\tC\tdap an\n2+2 bang?\t3\t4\t5\tB\nChon so le\t1\t2\t3\tA;C')
  assert.deepEqual(r.errors, [])
  assert.equal(r.questions[0].type, 'single')
  assert.equal(r.questions[1].type, 'multiple', 'nhiều đáp án đúng tự nhận là câu nhiều lựa chọn')
  assert.deepEqual(r.questions[1].answers.map(a => a.correct), [true, false, true])
})

test('không có dòng tiêu đề: dùng thứ tự cột mặc định', () => {
  const r = questionsFromText('một,Câu 1,x,y,,,,B')
  assert.deepEqual(r.errors, [])
  assert.deepEqual(r.questions[0].answers.map(a => [a.id, a.text, a.correct]), [['a', 'x', false], ['b', 'y', true]])
})

test('lựa chọn bỏ trống ở giữa: mã đáp án được đánh lại liên tục và đáp án đúng đi theo nội dung', () => {
  const r = questionsFromText('Loại,Câu hỏi,A,B,C,D,E,Đáp án\nmột,Câu,a1,,c1,d1,,C')
  assert.deepEqual(r.questions[0].answers.map(a => [a.id, a.text, a.correct]), [['a', 'a1', false], ['b', 'c1', true], ['c', 'd1', false]])
})

test('báo lỗi từng dòng, bỏ dòng lỗi và vẫn nhập các dòng đúng', () => {
  const r = questionsFromText([
    'Loại,Câu hỏi,A,B,C,D,E,Đáp án',
    'một,,A,B,,,,A',                    // thiếu câu hỏi
    'một,Chỉ một lựa chọn,A,,,,,A',      // 1 lựa chọn
    'một,Không có đáp án,A,B,,,,',       // thiếu đáp án
    'một,Đáp án ngoài lựa chọn,A,B,,,,D',
    'một,Một đáp án nhưng ghi hai,A,B,C,,,A;B',
    'điền khuyết,Điền,,,,,,',           // điền khuyết thiếu đáp án
    'một,Đúng,A,B,,,,B',
  ].join('\n'))
  assert.equal(r.questions.length, 1)
  assert.equal(r.skipped, 6)
  assert.equal(r.errors.length, 6)
  assert.match(r.errors[0], /^Dòng 2:/)
  assert.match(r.errors[3], /không có trong các lựa chọn/)
})

test('điền khuyết: nhiều chỗ trống ngăn bằng ;; và nhiều cách viết ngăn bằng |', () => {
  const r = questionsFromText('điền khuyết,Hai ____ và ____,,,,,,a|b;;c')
  assert.deepEqual(r.questions[0].accepted, [['a', 'b'], ['c']])
  assert.equal(r.questions[0].blanks, 2)
  assert.match(questionsFromText('điền khuyết,x,,,,,,a;;').errors[0], /ít nhất một đáp án/)
})

test('JSON: mảng câu hỏi, {questions}, đáp án dạng chuỗi hoặc đối tượng, điền khuyết', () => {
  const r = questionsFromText(JSON.stringify({ questions: [
    { type: 'single', text: 'Q1', answers: [{ text: 'a', correct: false }, { text: 'b', correct: true }] },
    { text: 'Q2', answers: ['x', 'y', 'z'], correct: 'B' },
    { type: 'fill', text: 'Q3', accepted: [['hà nội']] },
  ] }))
  assert.deepEqual(r.errors, [])
  assert.equal(r.questions.length, 3)
  assert.deepEqual(r.questions[1].answers.map(a => a.correct), [false, true, false])
  assert.equal(r.questions[2].type, 'fill')
  assert.match(questionsFromText('[{"text":"x"').errors[0], /JSON không hợp lệ/)
})

test('xuất rồi nhập lại (CSV và JSON) cho đúng bộ câu hỏi ban đầu', () => {
  const original = [
    { text: 'Có "ngoặc kép", dấu phẩy; và\nxuống dòng', type: 'multiple', answers: [{ id: 'a', text: 'A, một', correct: true }, { id: 'b', text: 'B', correct: false }, { id: 'c', text: 'C', correct: true }] },
    { text: 'Điền ____', type: 'fill', blanks: 2, answers: [], accepted: [['x', 'y'], ['z']] },
    { text: 'Một', type: 'single', answers: [{ id: 'a', text: '1', correct: false }, { id: 'b', text: '2', correct: true }] },
  ]
  for (const text of [questionsToCsv(original), questionsToJson(original)]) {
    const r = questionsFromText(text)
    assert.deepEqual(r.errors, [])
    assert.deepEqual(r.questions, original)
  }
  assert.ok(questionsToCsv(original).startsWith('﻿'), 'CSV có BOM để Excel mở đúng tiếng Việt')
})

test('assignIds: mã mới liên tục, không trùng mã đã dùng', () => {
  const used = Date.now() + 50        // cố định một mốc: so với Date.now() lần hai sẽ sai khi đồng hồ nhích 1 ms (CI chập chờn)
  const ids = assignIds([{}, {}, {}], [used]).map(q => q.id)
  assert.equal(new Set(ids).size, 3)
  assert.ok(ids[0] > used, 'mã mới lớn hơn mọi mã đã dùng')
  assert.deepEqual(ids, [ids[0], ids[0] + 1, ids[0] + 2], 'mã liên tục')
  assert.ok(assignIds([{}], []).every(q => Number.isFinite(q.id)), 'không có mã đã dùng vẫn cấp được mã')
})

test('normFill giống máy chủ: bỏ khoảng trắng thừa, không phân biệt hoa thường, giữ dấu', () => {
  assert.equal(normFill('  Hà   NỘI '), 'hà nội')
  assert.equal(normFill('Hà Nội'.normalize('NFD')), 'hà nội', 'Unicode tổ hợp được chuẩn hóa')
  assert.notEqual(normFill('Ha Noi'), normFill('Hà Nội'))
  assert.equal(stripAccents('Điền khuyết'), 'dien khuyet')
})

test('judgeAnswer: đối chiếu bài làm của sinh viên khi giáo viên xem lại (null nếu không có khóa)', () => {
  const single = { type: 'single', answers: [{ id: 'a', correct: false }, { id: 'b', correct: true }] }
  assert.equal(judgeAnswer(single, 'b'), true)
  assert.equal(judgeAnswer(single, 'a'), false)
  assert.equal(judgeAnswer(single, undefined), false)
  const multi = { type: 'multiple', answers: [{ id: 'a', correct: true }, { id: 'b', correct: true }, { id: 'c', correct: false }] }
  assert.equal(judgeAnswer(multi, ['b', 'a']), true)
  assert.equal(judgeAnswer(multi, ['a']), false)
  const fill = { type: 'fill', blanks: 2, accepted: [['Hà Nội', 'Ha Noi'], ['2']] }
  assert.equal(judgeAnswer(fill, [' ha  noi ', '2']), true)
  assert.equal(judgeAnswer(fill, ['ha noi']), false, 'thiếu chỗ trống')
  assert.equal(judgeAnswer({ type: 'single', answers: [{ id: 'a' }, { id: 'b' }] }, 'a'), null, 'không có khóa đáp án')
})
