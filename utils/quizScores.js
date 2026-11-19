// utils/quizScores.js – Điểm trắc nghiệm chính thức cho Bảng điểm và Báo cáo lớp
//
// Từ V3, điểm do máy chủ chấm và ghi vào `quizResults` (mỗi sinh viên một dòng cho mỗi đề). Nhật ký `activities` chỉ còn
// là bản sao tiện lợi và có thể bị cắt khi đầy (xem trim_activity_events ở máy chủ), nên hai màn hình điểm không đọc
// sự kiện `quiz` trong nhật ký nữa mà thay chúng bằng kết quả chính thức. Hàm này giữ nguyên hình dạng dữ liệu
// (`[{ uid, name, username, events: [...] }]`) để GradeBook và Reports không phải đổi cách đọc.

/** Chuyển một dòng quizResults thành sự kiện `quiz` giống dạng nhật ký. */
export function resultToEvent(r) {
  return {
    type: 'quiz',
    at: String(r.submittedAt || '').slice(0, 10),
    subjectId: r.subjectId,
    refId: r.quizId,
    refTitle: '',                       // tên đề lấy từ danh sách đề khi cần; kết quả không lưu tên
    score: r.score,
    total: r.total,
    correct: r.correct,
    official: true,
  }
}

/**
 * Thay mọi sự kiện `quiz` trong nhật ký bằng kết quả chính thức.
 * - Sự kiện loại khác (homework, material) giữ nguyên.
 * - Sinh viên có kết quả mà chưa có bản ghi nhật ký vẫn xuất hiện (tên lấy từ kết quả).
 * - `results` rỗng nghĩa là chưa ai nộp: mọi sự kiện `quiz` trong nhật ký bị bỏ (không còn là nguồn điểm).
 */
export function applyQuizResults(activities, results) {
  const byUid = new Map()
  for (const r of Array.isArray(results) ? results : []) {
    if (!r || r.uid == null) continue
    if (!byUid.has(r.uid)) byUid.set(r.uid, { name: r.name || '', username: r.username || '', events: [] })
    byUid.get(r.uid).events.push(resultToEvent(r))
  }
  const seen = new Set()
  const out = (Array.isArray(activities) ? activities : []).map(a => {
    seen.add(a.uid)
    const official = byUid.get(a.uid)?.events || []
    return { ...a, events: [...(a.events || []).filter(e => e?.type !== 'quiz'), ...official] }
  })
  for (const [uid, v] of byUid) {
    if (!seen.has(uid)) out.push({ uid, name: v.name, username: v.username, events: v.events })
  }
  return out
}

/** Máy chủ bản cũ (trước tuần 7) chưa có GET /api/quiz/results nên trả 404 `not-found`. */
export const isMissingEndpoint = (e) => e?.code === 'not-found' || e?.code === 'http-404'

/** Thông báo chung của Bảng điểm và Báo cáo lớp khi không tải được điểm chính thức. */
export const quizScoresErrorText = (message) =>
  `Không tải được điểm trắc nghiệm chính thức (quizResults) từ máy chủ${message ? ': ' + message : ''}. ` +
  'Điểm không được hiển thị để tránh dùng số liệu từ nhật ký hoạt động. Hãy tải lại trang sau ít phút.'

/**
 * Nhật ký hoạt động kèm điểm trắc nghiệm chính thức: nguồn dữ liệu chung của Bảng điểm và Báo cáo lớp.
 * - Máy chủ bản cũ chưa có endpoint (404): dùng lại sự kiện `quiz` trong nhật ký như trước, để không mất điểm hiển thị.
 * - Lỗi khác (500, mất mạng, hết phiên…): ném lỗi để màn hình báo lỗi. Trước đây mọi lỗi đều quay về nhật ký nên
 *   màn hình lặng lẽ hiện điểm cũ trong nhật ký (sai với điểm chính thức) mà người xem không biết.
 */
export async function loadOfficialActivities(loadActivities, loadResults) {
  const acts = await loadActivities()
  let results
  try { results = await loadResults() }
  catch (e) {
    if (!isMissingEndpoint(e)) throw e
    console.warn('[Server] chưa có GET /api/quiz/results – dùng nhật ký hoạt động:', e.message)
    return acts
  }
  return applyQuizResults(acts, results)
}
