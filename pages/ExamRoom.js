// pages/ExamRoom.js – Phòng thi trực tuyến ngay trên trang
//   - ExamEntryModal (sinh viên): nhập mã truy cập do giám thị phát tại phòng thi → làm bài trắc nghiệm có đồng hồ đếm ngược
//   - ExamRoomPanel (giáo viên/Admin): xem và đổi mã truy cập, theo dõi sinh viên đã vào phòng thi / đã nộp bài
import { startExam, getExamRoom, setExamCode } from '../utils/firebase.js'
import { examWindow, examPhase, examErrorText, validAccessCode } from '../utils/exams.js'
import { weekdayLabel } from '../utils/constants.js'
import { QuizTaker } from './Quiz.js'

const { useState, useEffect, useCallback, createElement: h } = window.React

const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''
const fmtDay = (d) => d ? d.split('-').reverse().join('/') : ''

function Backdrop({ children }) {
  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.55)' } }, children)
}

// ── Sinh viên: vào phòng thi ──
export function ExamEntryModal({ exam, subjectName, onSubmitted, onClose }) {
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [room, setRoom] = useState(null)        // { quiz, endsAt, serverNow } sau khi vào phòng thi

  const enter = useCallback(async (withCode) => {
    setBusy(true); setErr('')
    try { setRoom(await startExam(exam.id, withCode)) }
    catch (e) { setErr(examErrorText(e.code, e.message)) }
    finally { setBusy(false) }
  }, [exam.id])

  // Đã vào phòng thi trước đó (tải lại trang): máy chủ cho vào lại không cần mã; chưa vào thì báo cần mã (lỗi này không hiển thị)
  const [probing, setProbing] = useState(true)
  useEffect(() => {
    let live = true
    startExam(exam.id, '').then(r => { if (live) setRoom(r) }).catch(() => {}).finally(() => { if (live) setProbing(false) })
    return () => { live = false }
  }, [exam.id])

  if (room) {
    return h(QuizTaker, { quiz: room.quiz, subjectName, endsAt: room.endsAt, serverNow: room.serverNow, examLabel: 'Bài thi trực tuyến',
      onSubmit: onSubmitted, onClose })
  }

  const w = examWindow(exam)
  const phase = examPhase(exam)
  const canEnter = phase === 'open' && validAccessCode(code) && !busy
  return h(Backdrop, null,
    h('div', { className: 'modal-dialog modal-dialog-centered' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' },
          h('h5', { className: 'modal-title fw-bold' }, h('i', { className: 'bi bi-shield-lock me-2', style: { color: '#e67e22' } }), 'Vào phòng thi trực tuyến'),
          h('button', { className: 'btn-close', onClick: onClose })),
        h('div', { className: 'modal-body' },
          h('div', { className: 'fw-bold' }, subjectName),
          h('div', { className: 'small text-muted mb-3' },
            `${weekdayLabel(exam.date)}, ${fmtDay(exam.date)} · ${exam.start}${exam.end ? ' – ' + exam.end : ''}${exam.room ? ' · ' + exam.room : ''}`),
          h('div', { className: 'alert alert-warning small py-2' },
            h('i', { className: 'bi bi-info-circle me-1' }),
            'Bài thi chỉ làm được trong đúng giờ thi và cần mã truy cập do giám thị phát tại phòng thi. Hãy có mặt ở phòng thi, nhập mã giám thị đọc, sau đó làm bài. Bài nộp một lần và máy chủ chấm điểm.'),
          phase === 'upcoming' && h('div', { className: 'alert alert-secondary small py-2' }, 'Chưa đến giờ thi. Nút vào phòng thi mở khi đến giờ.'),
          phase === 'ended' && h('div', { className: 'alert alert-secondary small py-2' }, 'Buổi thi đã kết thúc.'),
          phase === 'unknown' && h('div', { className: 'alert alert-secondary small py-2' }, 'Lịch thi chưa có ngày và giờ bắt đầu hợp lệ.'),
          h('label', { className: 'form-label fw-semibold' }, 'Mã truy cập'),
          h('input', { className: 'form-control form-control-lg text-center text-uppercase', style: { letterSpacing: '0.3em' }, maxLength: 12, autoFocus: true,
            placeholder: '••••••', value: code, disabled: phase !== 'open' || probing, autoComplete: 'off',
            onChange: e => { setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '')); setErr('') },
            onKeyDown: e => { if (e.key === 'Enter' && canEnter) enter(code) } }),
          err && h('div', { className: 'text-danger small mt-2' }, h('i', { className: 'bi bi-exclamation-circle me-1' }), err),
          w && h('div', { className: 'form-text' }, `Kết thúc lúc ${new Date(w.end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })}`)),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Đóng'),
          h('button', { className: 'btn btn-primary', disabled: !canEnter, onClick: () => enter(code) },
            h('i', { className: 'bi bi-box-arrow-in-right me-1' }), busy ? 'Đang kiểm tra…' : 'Vào phòng thi')))))
}

// ── Giáo viên / Admin: phát mã và theo dõi phòng thi ──
export function ExamRoomPanel({ exam, subjectName, onClose }) {
  const [info, setInfo] = useState(null)      // { code, students, start, end }
  const [err, setErr] = useState('')
  const [custom, setCustom] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try { setInfo(await getExamRoom(exam.id)); setErr('') } catch (e) { setErr(e.message) }
  }, [exam.id])
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t) }, [load])

  const issue = async (c) => {
    setBusy(true); setErr('')
    try { await setExamCode(exam.id, c); setCustom(''); await load() } catch (e) { setErr(examErrorText(e.code, e.message)) } finally { setBusy(false) }
  }
  const students = info?.students || []
  const done = students.filter(s => s.submittedAt).length
  const phase = examPhase(exam)

  return h(Backdrop, null,
    h('div', { className: 'modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' },
          h('div', null,
            h('h5', { className: 'modal-title fw-bold mb-0' }, h('i', { className: 'bi bi-door-open me-2', style: { color: '#e67e22' } }), 'Phòng thi trực tuyến'),
            h('small', { className: 'text-muted' }, `${subjectName} · ${exam.className || exam.classId || ''} · ${fmtDay(exam.date)} ${exam.start}${exam.end ? '–' + exam.end : ''}${exam.room ? ' · ' + exam.room : ''}`)),
          h('button', { className: 'btn-close', onClick: onClose })),
        h('div', { className: 'modal-body' },
          err && h('div', { className: 'alert alert-danger small py-2' }, err),
          h('div', { className: 'card border-0 bg-light mb-3' },
            h('div', { className: 'card-body' },
              h('div', { className: 'small text-muted mb-1' }, 'Mã truy cập (đọc cho sinh viên tại phòng thi, không đăng lên nhóm hay trang chung)'),
              h('div', { className: 'd-flex flex-wrap align-items-center gap-3' },
                h('div', { className: 'fw-bold', style: { fontSize: '2rem', letterSpacing: '0.25em', fontFamily: 'monospace' } }, info ? (info.code || '— chưa có —') : '…'),
                h('button', { className: 'btn btn-sm btn-primary', disabled: busy, onClick: () => issue('') },
                  h('i', { className: 'bi bi-arrow-repeat me-1' }), info?.code ? 'Tạo mã mới' : 'Tạo mã')),
              h('div', { className: 'd-flex gap-2 mt-3', style: { maxWidth: 360 } },
                h('input', { className: 'form-control form-control-sm', placeholder: 'Hoặc tự đặt mã (4–12 chữ/số)', maxLength: 12, value: custom,
                  onChange: e => setCustom(e.target.value.replace(/[^A-Za-z0-9]/g, '')) }),
                h('button', { className: 'btn btn-sm btn-outline-primary', disabled: busy || !validAccessCode(custom), onClick: () => issue(custom) }, 'Đặt mã')),
              h('div', { className: 'small text-muted mt-2' },
                'Đổi mã không ảnh hưởng sinh viên đã vào phòng thi. Máy chủ khóa 5 phút nếu một sinh viên nhập sai mã 5 lần.'))),
          h('div', { className: 'd-flex flex-wrap gap-3 mb-2 small' },
            h('span', { className: `badge ${phase === 'open' ? 'bg-success' : phase === 'upcoming' ? 'bg-secondary' : 'bg-dark'}` },
              phase === 'open' ? 'Đang trong giờ thi' : phase === 'upcoming' ? 'Chưa đến giờ thi' : phase === 'ended' ? 'Đã kết thúc' : 'Chưa có giờ hợp lệ'),
            h('span', null, h('i', { className: 'bi bi-people me-1' }), `Đã vào phòng thi: ${students.length}`),
            h('span', null, h('i', { className: 'bi bi-check2-all me-1 text-success' }), `Đã nộp bài: ${done}`),
            h('span', { className: 'text-muted ms-auto' }, 'Tự cập nhật mỗi 10 giây')),
          students.length === 0
            ? h('div', { className: 'text-center text-muted py-4 small' }, 'Chưa có sinh viên nào vào phòng thi.')
            : h('div', { className: 'table-responsive' },
                h('table', { className: 'table table-sm align-middle mb-0' },
                  h('thead', null, h('tr', null, ['#', 'Sinh viên', 'Mã SV', 'Vào lúc', 'Trạng thái'].map(c => h('th', { key: c }, c)))),
                  h('tbody', null, students.map((s, i) => h('tr', { key: s.uid },
                    h('td', null, i + 1), h('td', null, s.name), h('td', { className: 'text-muted' }, s.username), h('td', null, fmtTime(s.startedAt)),
                    h('td', null, s.submittedAt
                      ? h('span', { className: 'badge bg-success' }, `Đã nộp ${fmtTime(s.submittedAt)}`)
                      : h('span', { className: 'badge bg-warning text-dark' }, 'Đang làm bài')))))))),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Đóng')))))
}
