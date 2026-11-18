// utils/exams.js – Thi trực tuyến ngay trên trang (thuần, kiểm thử bằng node --test)
// Lịch thi có `quizId` là bài thi trắc nghiệm làm trên web: vào đúng giờ, nhập mã truy cập do giám thị phát tại phòng thi.
// Giờ thi tính theo giờ Việt Nam (UTC+7) giống máy chủ; máy chủ là bên quyết định cuối cùng (giờ, mã, nộp bài).

export const EXAM_DEFAULT_MINUTES = 90

// Lịch thi nào làm trên trang: có gắn đề trắc nghiệm
export const hasRoomQuiz = (e) => !!e && e.quizId != null && e.quizId !== ''

// Hình thức cho phép gắn đề trên trang: thi trực tuyến, hoặc trắc nghiệm làm trên máy ở phòng thi
export const ROOM_QUIZ_FORMATS = ['online', 'tracNghiem']
export const canUseRoomQuiz = (format) => ROOM_QUIZ_FORMATS.includes(format)

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

// { start, end } (ms) của buổi thi; thiếu hoặc sai giờ kết thúc thì 90 phút; null nếu không có ngày hoặc giờ bắt đầu hợp lệ
export function examWindow(e) {
  if (!e || !DATE.test(e.date || '') || !TIME.test(e.start || '')) return null
  const start = Date.parse(`${e.date}T${e.start}:00+07:00`)
  if (Number.isNaN(start)) return null
  let end = TIME.test(e.end || '') ? Date.parse(`${e.date}T${e.end}:00+07:00`) : NaN
  if (Number.isNaN(end) || end <= start) end = start + EXAM_DEFAULT_MINUTES * 60000
  return { start, end }
}

// 'upcoming' (chưa đến giờ) | 'open' (đang trong giờ thi) | 'ended' | 'unknown' (chưa có giờ hợp lệ)
export function examPhase(e, now = Date.now()) {
  const w = examWindow(e)
  if (!w) return 'unknown'
  return now < w.start ? 'upcoming' : now <= w.end ? 'open' : 'ended'
}

// Đề có thể gắn vào lịch thi: cùng môn, chưa đóng (đề nháp được gắn trước, mở đề trước giờ thi)
export const quizzesForExam = (quizzes = [], subjectId) =>
  quizzes.filter(q => q.subjectId === Number(subjectId) && q.status !== 'closed' && !q.examLocked)

// "mm:ss" hoặc "h:mm:ss"; không âm
export function formatCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  const p = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`
}

// Mã truy cập: 4–12 chữ cái hoặc chữ số (khớp máy chủ)
export const validAccessCode = (c) => /^[A-Za-z0-9]{4,12}$/.test(String(c || '').trim())

const ERRORS = {
  'exam-bad-code': 'Mã truy cập không đúng. Hãy hỏi giám thị tại phòng thi.',
  'exam-no-code': 'Giám thị chưa phát mã truy cập. Hãy chờ giám thị thông báo mã tại phòng thi.',
  'exam-not-started': 'Chưa đến giờ thi.',
  'exam-ended': 'Đã hết giờ làm bài thi.',
  'exam-locked': 'Bạn nhập sai mã quá nhiều lần. Hãy chờ một lúc rồi thử lại hoặc hỏi giám thị.',
  'exam-no-time': 'Lịch thi chưa có ngày và giờ hợp lệ, hãy liên hệ giáo viên.',
  'exam-code-required': 'Đây là bài thi trực tuyến: hãy vào phòng thi ở trang Lịch thi và nhập mã truy cập.',
  'already-submitted': 'Bạn đã nộp bài thi này rồi.',
  'quiz-closed': 'Bài thi đã đóng.',
  'not-found': 'Không tìm thấy bài thi trực tuyến của bạn (kiểm tra lớp và môn học).',
}
export const examErrorText = (code, fallback = 'Không vào được phòng thi.') => ERRORS[code] || fallback
