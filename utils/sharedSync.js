// utils/sharedSync.js – Xử lý khi máy chủ từ chối một lần lưu dữ liệu chung (sharedData/global).
// Lỗi L1 (kiểm thử PR56 trên web thật, 19/11/2026): app.js lưu bằng useEffect và không bắt lỗi. Máy chủ trả 409
// (bớt môn còn dữ liệu) nhưng giao diện vẫn giữ trạng thái đã bị từ chối, nên môn biến mất trên màn hình, không có
// thông báo, và mọi lần lưu `subjects` sau đó trong cùng tab đều gửi lại danh sách thiếu môn → đều bị 409, người dùng
// tưởng đã lưu. Các hàm ở đây không phụ thuộc React để kiểm thử được bằng node --test.

// Tên tiếng Việt của từng khóa, dùng trong câu báo lỗi
export const SHARED_LABEL = {
  subjects: 'môn học', deadlines: 'deadline', quizzes: 'đề trắc nghiệm', materials: 'tài liệu', homeworks: 'bài tập',
  schedule: 'lịch học', exams: 'lịch thi', news: 'tin tức', forms: 'biểu mẫu',
}

// Các khóa máy chủ đếm khi chặn bớt môn (subject_usage trong server/studytask_api.py, subjectUsageDetail ở utils/curriculum.js)
export const USAGE_KEYS = ['schedule', 'exams', 'deadlines', 'homeworks', 'materials', 'quizzes']

// Máy chủ đã trả lời và từ chối lần ghi (403, 409, 400…): bản trên máy chủ vẫn nguyên, giao diện phải đưa về theo máy chủ.
// Lỗi mạng (fetch ném TypeError, không có code) hoặc lỗi 5xx thì không biết máy chủ đã ghi hay chưa: không tự đổi màn hình.
export function serverRejected(e) {
  const code = e?.code
  if (typeof code !== 'string' || !code) return false
  const m = /^http-(\d{3})$/.exec(code)
  return m ? m[1][0] === '4' : true
}

// Khóa cần tải lại từ máy chủ. Bị chặn vì môn còn dữ liệu thì tải lại cả các khóa máy chủ đã đếm, để màn hình hiện
// đúng dữ liệu đang chặn (thường là dữ liệu người khác vừa thêm sau khi trang đã tải).
export function keysToReload(key, e) {
  return e?.code === 'subject-in-use' ? [key, ...USAGE_KEYS.filter(k => k !== key)] : [key]
}

export function saveErrorText(key, e) {
  const what = SHARED_LABEL[key] || key
  const msg = String(e?.message || '').trim()
  if (serverRejected(e)) {
    return `Chưa lưu được thay đổi ${what}: ${msg || 'máy chủ từ chối.'}${/[.!?]$/.test(msg) ? '' : '.'} Màn hình đã được đưa về đúng dữ liệu trên máy chủ.`
  }
  return `Chưa lưu được thay đổi ${what} lên máy chủ${msg ? ` (${msg})` : ''}. Hãy kiểm tra kết nối rồi tải lại trang trước khi sửa tiếp.`
}

// Xử lý một lần lưu `key` bị lỗi. Máy chủ từ chối thì tải lại các khóa liên quan, đánh dấu echo rồi đặt lại state.
// deps: { loadShared: () => Promise<object>, setters: { key: fn }, echo: echoGuard(), store?: (key, value) => void }
// Trả câu báo lỗi để hiện cho người dùng.
export async function recoverFromSaveError(key, e, { loadShared, setters, echo, store } = {}) {
  if (serverRejected(e)) {
    try {
      const fresh = (await loadShared()) || {}
      for (const k of keysToReload(key, e)) {
        if (!(k in fresh) || !setters?.[k]) continue
        echo.mark(k, fresh[k])
        store?.(k, fresh[k])
        setters[k](fresh[k])
      }
    } catch (e2) { console.warn('[Server] tải lại dữ liệu chung:', e2?.message) }
  }
  return saveErrorText(key, e)
}

// Giá trị vừa nạp lại từ máy chủ không được gửi ngược lên (useEffect lưu sẽ chạy lại khi đặt state).
// So theo tham chiếu: chỉ đúng giá trị đã đánh dấu mới được bỏ qua, và chỉ một lần.
export function echoGuard() {
  const pending = new Map()
  return {
    mark(key, value) { pending.set(key, value) },
    skip(key, value) {
      if (pending.has(key) && pending.get(key) === value) { pending.delete(key); return true }
      return false
    },
  }
}
