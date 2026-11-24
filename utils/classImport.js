// utils/classImport.js – Nhập danh sách lớp từ CSV/Excel ([D3] mục 14). Chỉ Admin và Phòng Đào tạo dùng.
import { parseDelimited } from './quizFile.js'

export const MAX_ROWS = 500
const strip = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]/g, '')
const ALIASES = { mssv: ['mssv', 'masv', 'masinhvien', 'studentid'], name: ['hoten', 'hovaten', 'ten', 'name'],
                  classId: ['lop', 'malop', 'class', 'classid'], cohort: ['khoa', 'khoahoc', 'cohort'] }

/** Đọc văn bản CSV/dán từ Excel → { rows: [{line, mssv, name, classId, cohort}], errors: [{line, message}] } */
export function parseClassList(text) {
  const table = parseDelimited(text)   // parseDelimited đã bỏ BOM, tự nhận tab/phẩy/chấm phẩy và bỏ dòng trống
  if (!table.length) return { rows: [], errors: [{ line: 0, message: 'Tệp trống.' }] }
  const head = table[0].map(strip)
  const col = Object.fromEntries(Object.entries(ALIASES).map(([k, names]) => [k, head.findIndex(h => names.includes(h))]))
  if (col.mssv < 0 || col.name < 0 || col.classId < 0)
    return { rows: [], errors: [{ line: 1, message: 'Thiếu cột bắt buộc: mssv, ho_ten, lop.' }] }
  const rows = [], errors = [], seen = new Set()
  table.slice(1).forEach((r, i) => {
    const line = i + 2, get = (k) => col[k] >= 0 ? String(r[col[k]] ?? '').trim() : ''
    const row = { line, mssv: get('mssv'), name: get('name'), classId: get('classId').toUpperCase(), cohort: get('cohort') }
    const err = validateRow(row)
    if (err) errors.push({ line, message: err })
    else if (seen.has(row.mssv)) errors.push({ line, message: `Mã SV ${row.mssv} lặp lại trong tệp.` })
    else { seen.add(row.mssv); rows.push(row) }
  })
  if (rows.length > MAX_ROWS) errors.push({ line: 0, message: `Tối đa ${MAX_ROWS} dòng mỗi lần nhập.` })
  return { rows, errors }
}

export function validateRow({ mssv, name, classId, cohort }) {
  if (!/^\d{6,12}$/.test(mssv)) return 'Mã SV phải gồm 6–12 chữ số.'
  if (!name || name.length > 100) return 'Họ tên trống hoặc dài quá 100 ký tự.'
  if (!/^[A-Z0-9-]{2,20}$/.test(classId)) return 'Mã lớp chỉ gồm chữ in hoa, số và dấu -.'
  if (cohort && !/^\d{4}-\d{4}$/.test(cohort)) return 'Khóa phải có dạng năm vào-năm ra, ví dụ 2024-2028.'
  return null
}

export const usernameOf = (mssv) => 'sv' + mssv