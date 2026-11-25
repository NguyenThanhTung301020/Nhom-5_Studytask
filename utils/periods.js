// utils/periods.js – Bảng 16 tiết học và các hàm theo tuần/ngày thật (thuần logic)
//
// Mốc giờ các tiết do nhà trường công bố (áp dụng từ học kỳ 1 năm học 2025-2026). Mỗi tiết 45 phút; sáng tiết 1–6,
// chiều tiết 7–12, tối tiết 13–16. Một buổi học là một KHỐI tiết liền nhau trong cùng buổi (sáng/chiều/tối), vd "Tiết 4–6".
// Lịch học lặp hằng tuần trong khoảng [startDate, endDate] của học kỳ; thời khóa biểu theo tuần hiển thị đúng tuần thật.

export const TIET = {
  1: ['07:30', '08:15'], 2: ['08:15', '09:00'], 3: ['09:00', '09:45'], 4: ['10:00', '10:45'], 5: ['10:45', '11:30'], 6: ['11:30', '12:15'],
  7: ['12:45', '13:30'], 8: ['13:30', '14:15'], 9: ['14:15', '15:00'], 10: ['15:15', '16:00'], 11: ['16:00', '16:45'], 12: ['16:45', '17:30'],
  13: ['18:00', '18:45'], 14: ['18:45', '19:30'], 15: ['19:30', '20:15'], 16: ['20:15', '21:00'],
}

// Ba buổi trong ngày: [tiết đầu, tiết cuối]
export const SESSIONS = { sang: [1, 6], chieu: [7, 12], toi: [13, 16] }
export const SESSION_LABEL = { sang: 'Sáng', chieu: 'Chiều', toi: 'Tối' }

export const sessionOfTiet = (n) => (n <= 6 ? 'sang' : n <= 12 ? 'chieu' : 'toi')

// Khối `len` tiết bắt đầu ở tiết `start` có nằm gọn trong một buổi không (không bắc qua giờ nghỉ trưa/chiều)
export const blockFits = (start, len) => start >= 1 && len >= 1 && start + len - 1 <= 16 && sessionOfTiet(start) === sessionOfTiet(start + len - 1)

// Giờ bắt đầu – kết thúc của khối tiết: blockTime(4, 3) → { start: '10:00', end: '12:15' }
export function blockTime(start, len) {
  if (!blockFits(start, len)) return null
  return { start: TIET[start][0], end: TIET[start + len - 1][1] }
}

// Mọi vị trí bắt đầu hợp lệ của một khối `len` tiết
export const blockStarts = (len) => Object.values(SESSIONS).flatMap(([a, b]) => Array.from({ length: Math.max(0, b - a + 2 - len) }, (_, i) => a + i))

// Từ giờ bắt đầu/kết thúc suy ra khối tiết (dữ liệu cũ chỉ có giờ): ('10:00', '12:15') → { from: 4, to: 6 }; không khớp bảng → null
export function tietRangeOf(start, end) {
  const from = Object.keys(TIET).map(Number).find(n => TIET[n][0] === start)
  const to = Object.keys(TIET).map(Number).find(n => TIET[n][1] === end)
  return from && to && to >= from && blockFits(from, to - from + 1) ? { from, to } : null
}

// Nhãn tiết của một buổi học/lịch thi: "Tiết 4–6" (ưu tiên tietStart/tietEnd đã lưu, nếu không thì suy ra từ giờ); '' nếu không khớp bảng
export function tietLabel(item) {
  const r = item?.tietStart && item?.tietEnd ? { from: item.tietStart, to: item.tietEnd } : tietRangeOf(item?.start, item?.end)
  return r ? (r.from === r.to ? `Tiết ${r.from}` : `Tiết ${r.from}–${r.to}`) : ''
}

// ── Ngày/tuần thật ─────────────────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0')
export const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`          // giờ địa phương, không lệch múi giờ
export const fromIso = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d) }
export const todayIso = () => toIso(new Date())
export const addDays = (iso, n) => { const d = fromIso(iso); d.setDate(d.getDate() + n); return toIso(d) }

// Mã thứ trong thời khóa biểu: 2 = Thứ Hai … 7 = Thứ Bảy, 8 = Chủ nhật (khớp DAY_LABELS)
export const tkbDay = (iso) => { const g = fromIso(iso).getDay(); return g === 0 ? 8 : g + 1 }

// Thứ Hai của tuần chứa ngày iso (tuần bắt đầu từ Thứ Hai)
export const mondayOf = (iso) => addDays(iso, -(tkbDay(iso) - 2))

// 7 ngày của tuần bắt đầu từ Thứ Hai `monday`: [{ iso, day (2..8) }]
export const weekDates = (monday) => Array.from({ length: 7 }, (_, i) => ({ iso: addDays(monday, i), day: i + 2 }))

// Buổi học có diễn ra vào ngày iso không: đúng thứ và nằm trong khoảng ngày của học kỳ (nếu có)
export const classOnDate = (c, iso) => c.day === tkbDay(iso) && (!c.startDate || iso >= c.startDate) && (!c.endDate || iso <= c.endDate)

// Tuần thứ mấy của học kỳ (tuần chứa ngày bắt đầu = tuần 1); null nếu ngoài khoảng
export function termWeekNumber(startDate, endDate, iso) {
  if (!startDate || iso < mondayOf(startDate) || (endDate && iso > endDate)) return null
  return Math.floor((fromIso(mondayOf(iso)) - fromIso(mondayOf(startDate))) / (7 * 86400000)) + 1
}

// "16/11 – 22/11/2026"
export function weekRangeLabel(monday) {
  const a = fromIso(monday), b = fromIso(addDays(monday, 6))
  const dm = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
  return `${dm(a)} – ${dm(b)}/${b.getFullYear()}`
}

// ── Lịch theo tháng ([D3] mục 16, trang MonthCalendar) ─────────────────────────────────────────
// Dùng chung classOnDate/tkbDay với thời khóa biểu theo tuần để hai chế độ xem luôn ra cùng một buổi học.

// Sự kiện từng ngày của tháng `month` (0..11): { 'yyyy-mm-dd': [ { kind: 'class' | 'exam', key, ...mục } ] }
// Buổi học lặp theo thứ trong khoảng ngày học kỳ; lịch thi đúng ngày; trong ngày xếp theo giờ bắt đầu. Ngày trống không có khóa.
export function monthEvents(year, month, schedule = [], exams = []) {
  const days = new Date(year, month + 1, 0).getDate()
  const map = {}
  for (let d = 1; d <= days; d++) {
    const date = toIso(new Date(year, month, d))
    const list = []
    schedule.forEach(c => { if (classOnDate(c, date)) list.push({ kind: 'class', key: `c${c.id}-${date}`, ...c }) })
    exams.forEach(e => { if (e.date === date) list.push({ kind: 'exam', key: `e${e.id}`, ...e }) })
    list.sort((a, b) => String(a.start || '').localeCompare(String(b.start || '')))
    if (list.length) map[date] = list
  }
  return map
}

// Lưới tháng bắt đầu từ Thứ Hai: đủ số tuần chứa tháng (4–6 tuần) × 7 ô { y, m, d, date, inMonth };
// ô ngoài tháng là ngày của tháng trước/sau. Không thêm hàng toàn ngày tháng sau (vd tháng 2/2027 chỉ 4 hàng).
export function monthGrid(year, month) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const weeks = Math.ceil((offset + new Date(year, month + 1, 0).getDate()) / 7)
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const d = new Date(year, month, 1 - offset + i)
    return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate(), date: toIso(d), inMonth: d.getMonth() === month }
  })
}
