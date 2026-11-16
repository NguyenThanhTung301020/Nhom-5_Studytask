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
