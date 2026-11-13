// utils/quizFile.js – Nhập/xuất bộ câu hỏi trắc nghiệm từ tệp (CSV, dán từ Excel, JSON). Không phụ thuộc trình duyệt để kiểm thử bằng Node.
//
// Định dạng bảng (CSV hoặc dán từ Excel, dòng đầu là tiêu đề):
//   Loại | Câu hỏi | A | B | C | D | E | Đáp án
//   - Loại (không bắt buộc): "một" (một đáp án), "nhiều" (nhiều đáp án), "điền khuyết". Bỏ trống thì tự nhận biết.
//   - Chọn đáp án: cột Đáp án ghi chữ cái, ví dụ `B` hoặc `A;C` (hoặc `AC`).
//   - Điền khuyết: không cần cột A–E; cột Đáp án ghi các đáp án chấp nhận. Nhiều chỗ trống ngăn bằng `;;`,
//     nhiều cách viết đúng của một chỗ trống ngăn bằng `|`. Ví dụ `Hà Nội|Ha Noi` hoặc `2|hai;;3|ba`.
// JSON: mảng câu hỏi, hoặc { "questions": [...] } (cùng định dạng xuất ra bằng questionsToJson).

export const MAX_QUESTIONS = 500
const LETTERS = ['a', 'b', 'c', 'd', 'e']

// Bỏ dấu tiếng Việt để nhận biết tên cột và loại câu hỏi (không dùng để chấm điểm)
export const stripAccents = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim()

// So khớp câu điền khuyết giống máy chủ: bỏ khoảng trắng thừa, không phân biệt hoa thường, giữ nguyên dấu
export const normFill = (s) => String(s ?? '').normalize('NFC').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean).join(' ')

// ── Đọc bảng ───────────────────────────────────────────────────
export function detectDelimiter(text) {
  const firstLine = String(text).split(/\r?\n/).find(l => l.trim()) || ''
  const count = (ch) => (firstLine.match(new RegExp(ch === '\t' ? '\\t' : '\\' + ch, 'g')) || []).length
  const t = count('\t'), c = count(','), s = count(';')
  return t > 0 && t >= c && t >= s ? '\t' : s > c ? ';' : ','
}

// Đọc CSV/TSV có ngoặc kép, dấu ngăn nằm trong ngoặc, xuống dòng trong ô
export function parseDelimited(text, delimiter = detectDelimiter(text)) {
  const rows = []
  let row = [], cell = '', inQ = false
  const src = String(text).replace(/^﻿/, '')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQ) {
      if (ch === '"') { if (src[i + 1] === '"') { cell += '"'; i++ } else inQ = false } else cell += ch
    } else if (ch === '"' && cell === '') inQ = true
    else if (ch === delimiter) { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some(c => c.trim() !== '')) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some(c => c.trim() !== '')) rows.push(row)
  return rows
}

const HEAD_ALIASES = {
  type: ['loai', 'type', 'dang', 'dang cau hoi'],
  text: ['cau hoi', 'cauhoi', 'noi dung', 'question', 'de bai'],
  answer: ['dap an', 'dapan', 'answer', 'dap an dung', 'key'],
}

function mapHeader(row) {
  const norm = row.map(stripAccents)
  const find = (names) => norm.findIndex(n => names.includes(n))
  const text = find(HEAD_ALIASES.text)
  if (text < 0) return null
  const opts = LETTERS.map(l => norm.findIndex(n => n === l || n === 'dap an ' + l || n === 'lua chon ' + l || n === 'phuong an ' + l))
  return { type: find(HEAD_ALIASES.type), text, answer: find(HEAD_ALIASES.answer), opts }
}

const DEFAULT_COLS = { type: 0, text: 1, opts: [2, 3, 4, 5, 6], answer: 7 }

function kindFromWord(w) {
  const n = stripAccents(w)
  if (!n) return ''
  if (/(dien|fill|khuyet|blank)/.test(n)) return 'fill'
  if (/(nhieu|multi|multiple|^n$)/.test(n)) return 'multiple'
  if (/(mot|single|^1$|^m$)/.test(n)) return 'single'
  return ''
}

// Dựng một câu hỏi từ dữ liệu thô; trả { question } hoặc { error }
export function buildQuestion({ type = '', text = '', options = [], answer = '', accepted = null, correctLetters = null }) {
  const qText = String(text ?? '').trim()
  if (!qText) return { error: 'thiếu nội dung câu hỏi' }
  const opts = options.map(o => String(o ?? '').trim())
  const nonEmpty = opts.filter(Boolean)
  let kind = kindFromWord(type)
  const ans = String(answer ?? '').trim()

  if (!kind) kind = nonEmpty.length === 0 && (ans || accepted) ? 'fill' : 'single'

  if (kind === 'fill') {
    let acc = accepted
    if (!acc) acc = ans.split(';;').map(seg => seg.split('|').map(x => x.trim()).filter(Boolean))
    acc = (acc || []).map(a => (Array.isArray(a) ? a : [a]).map(x => String(x).trim()).filter(Boolean))
    if (acc.length === 0 || acc.some(a => a.length === 0)) return { error: 'câu điền khuyết cần ít nhất một đáp án chấp nhận cho mỗi chỗ trống' }
    if (acc.length > 10) return { error: 'tối đa 10 chỗ trống' }
    return { question: { text: qText, type: 'fill', blanks: acc.length, answers: [], accepted: acc } }
  }

  const present = []        // chỉ số cột có nội dung (giữ chữ cái gốc A..E)
  opts.forEach((o, i) => { if (o) present.push(i) })
  if (present.length < 2) return { error: 'câu chọn đáp án cần ít nhất 2 lựa chọn' }
  let letters = correctLetters
  if (!letters) letters = [...new Set((ans.toLowerCase().match(/[a-e]/g) || []))]
  if (letters.length === 0) return { error: 'thiếu đáp án đúng' }
  const bad = letters.filter(l => !present.includes(LETTERS.indexOf(l)))
  if (bad.length) return { error: `đáp án ${bad.join(', ').toUpperCase()} không có trong các lựa chọn` }
  if (kindFromWord(type) === 'single' && letters.length > 1) return { error: 'câu một đáp án nhưng ghi nhiều đáp án đúng' }
  const finalKind = letters.length > 1 || kind === 'multiple' ? 'multiple' : 'single'
  // Đánh lại mã A, B, C... theo thứ tự các lựa chọn có nội dung
  const answers = present.map((idx, n) => ({ id: LETTERS[n], text: opts[idx], correct: letters.includes(LETTERS[idx]) }))
  return { question: { text: qText, type: finalKind, answers } }
}

// Đọc từ văn bản (JSON, CSV, hoặc dán từ Excel). Trả { questions, errors, skipped }
export function questionsFromText(text) {
  const src = String(text ?? '').replace(/^﻿/, '').trim()
  const result = { questions: [], errors: [], skipped: 0 }
  if (!src) { result.errors.push('Không có nội dung.'); return result }

  if (src[0] === '[' || src[0] === '{') {
    let data
    try { data = JSON.parse(src) } catch (e) { result.errors.push('JSON không hợp lệ: ' + e.message); return result }
    const list = Array.isArray(data) ? data : Array.isArray(data?.questions) ? data.questions : null
    if (!list) { result.errors.push('JSON cần là một mảng câu hỏi hoặc { "questions": [...] }.'); return result }
    list.forEach((it, i) => {
      if (!it || typeof it !== 'object') { result.errors.push(`Câu ${i + 1}: không hợp lệ`); result.skipped++; return }
      const ansList = Array.isArray(it.answers) ? it.answers : []
      const options = ansList.map(a => (typeof a === 'string' ? a : a?.text ?? ''))
      const hasFlags = ansList.some(a => a && typeof a === 'object' && 'correct' in a)
      const correctLetters = hasFlags ? ansList.map((a, n) => (a?.correct === true ? LETTERS[n] : null)).filter(Boolean) : null
      const accepted = it.type === 'fill' || Array.isArray(it.accepted) ? (it.accepted || null) : null
      const r = buildQuestion({
        type: it.type ?? '', text: it.text ?? it.question ?? it.cauHoi ?? '', options,
        answer: it.correct ?? it.answer ?? it.dapAn ?? '', accepted, correctLetters: hasFlags ? correctLetters : null,
      })
      if (r.error) { result.errors.push(`Câu ${i + 1}: ${r.error}`); result.skipped++ } else result.questions.push(r.question)
    })
  } else {
    const rows = parseDelimited(src)
    let cols = mapHeader(rows[0] || [])
    let start = 1
    if (!cols) { cols = DEFAULT_COLS; start = 0 }
    for (let r = start; r < rows.length; r++) {
      const row = rows[r]
      const get = (i) => (i >= 0 && i < row.length ? unFormula(row[i]) : '')   // bỏ dấu ' do questionsToCsv thêm trước công thức
      const res = buildQuestion({
        type: get(cols.type), text: get(cols.text), options: cols.opts.map(get), answer: get(cols.answer),
      })
      if (res.error) { result.errors.push(`Dòng ${r + 1}: ${res.error}`); result.skipped++ } else result.questions.push(res.question)
    }
  }
  if (result.questions.length > MAX_QUESTIONS) {
    result.errors.push(`Chỉ nhận tối đa ${MAX_QUESTIONS} câu; đã bỏ ${result.questions.length - MAX_QUESTIONS} câu cuối.`)
    result.questions = result.questions.slice(0, MAX_QUESTIONS)
  }
  return result
}

// Gán mã câu hỏi mới (tránh trùng với câu đã có trong đề)
export function assignIds(questions, usedIds = []) {
  let next = Math.max(Date.now(), ...usedIds.filter(Number.isFinite).map(n => n + 1))
  return questions.map(q => ({ ...q, id: next++ }))
}

// ── Xuất ────────────────────────────────────────────────────────
// Ô bắt đầu bằng = + - @ (kể cả sau khoảng trắng) bị Excel, LibreOffice coi là công thức (R6 review PR9 lần 2: câu hỏi
// `=1+1` hiện thành 2). Thêm dấu ' như utils/sanitize.js; số thật như -5 giữ nguyên. Khi nhập lại, unFormula bỏ dấu này.
const NUMBER = /^[+-]?\d+([.,]\d+)?$/
const FORMULA = /^\s*[=+\-@]/
const csvCell = (v) => {
  let s = String(v ?? '')
  if (FORMULA.test(s) && !NUMBER.test(s.trim())) s = `'${s}`
  return /[",\n\r;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}
export const unFormula = (s) => {
  const t = String(s ?? '')
  return t[0] === "'" && FORMULA.test(t.slice(1)) && !NUMBER.test(t.slice(1).trim()) ? t.slice(1) : t
}
const TYPE_WORD = { single: 'một', multiple: 'nhiều', fill: 'điền khuyết' }

export function questionsToCsv(questions) {
  const head = ['Loại', 'Câu hỏi', 'A', 'B', 'C', 'D', 'E', 'Đáp án']
  const lines = [head.map(csvCell).join(',')]
  for (const q of questions) {
    if (q.type === 'fill') {
      const ans = (q.accepted || []).map(a => (a || []).join('|')).join(';;')
      lines.push([TYPE_WORD.fill, q.text, '', '', '', '', '', ans].map(csvCell).join(','))
    } else {
      const opts = LETTERS.map((_, i) => q.answers?.[i]?.text ?? '')
      const right = (q.answers || []).map((a, i) => (a.correct ? LETTERS[i].toUpperCase() : null)).filter(Boolean).join(';')
      lines.push([TYPE_WORD[q.type] || '', q.text, ...opts, right].map(csvCell).join(','))
    }
  }
  return '﻿' + lines.join('\r\n')      // BOM để Excel mở đúng tiếng Việt
}

export function questionsToJson(questions) {
  return JSON.stringify(questions.map(q => (q.type === 'fill'
    ? { type: 'fill', text: q.text, blanks: q.blanks, accepted: q.accepted }
    : { type: q.type, text: q.text, answers: q.answers.map(a => ({ text: a.text, correct: !!a.correct })) })), null, 2)
}

export const CSV_TEMPLATE = '﻿' + [
  'Loại,Câu hỏi,A,B,C,D,E,Đáp án',
  'một,Thủ đô của Việt Nam là gì?,Huế,Hà Nội,Đà Nẵng,Cần Thơ,,B',
  'nhiều,Chọn các số nguyên tố,2,4,5,9,,A;C',
  'điền khuyết,Thủ đô của Việt Nam là ____,,,,,,Hà Nội|Ha Noi',
  'điền khuyết,____ cộng ____ bằng bốn,,,,,,2|hai;;2|hai',
].join('\r\n')

// ── Chấm đối chiếu ở phía giao diện (chỉ để giáo viên xem lại bài làm; điểm chính thức do máy chủ chấm) ──
export function judgeAnswer(question, given) {
  if (question.type === 'fill') {
    const vals = Array.isArray(given) ? given : given == null ? [] : [given]
    const acc = question.accepted || []
    if (!acc.length) return null
    return acc.every((a, i) => !!vals[i] && a.some(x => normFill(x) === normFill(vals[i])))
  }
  if (!(question.answers || []).some(a => 'correct' in a)) return null     // không có khóa (không đủ quyền)
  const g = (Array.isArray(given) ? given : given ? [given] : []).slice().sort()
  const w = question.answers.filter(a => a.correct).map(a => a.id).sort()
  return g.length > 0 && JSON.stringify(g) === JSON.stringify(w)
}
