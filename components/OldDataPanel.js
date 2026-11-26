// components/OldDataPanel.js – Quản trị › Dữ liệu cũ (chỉ Admin)
// 1. Đặt khoảng hiển thị: các trang chỉ hiện mặc định N năm học gần nhất (settings/retention.displayYears, 2–5, mặc định 3);
//    dữ liệu cũ hơn vẫn xem và trích lục được bằng bộ lọc "Dữ liệu cũ".
// 2. Dọn dữ liệu cũ: xem trước → tải bản trích lục (JSON đầy đủ) → xóa hẳn học phần ĐÃ KẾT THÚC của các năm học cũ hơn
//    khoảng hiển thị cùng lịch học, lịch thi, tài liệu, đề trắc nghiệm (khóa đáp án, kết quả), bài tập, deadline, cột điểm.
//    Máy chủ kiểm tra lại mọi điều kiện và tự lưu thêm một bản trích lục (DATA_DIR/exports/) trước khi xóa.
import { setDocument, errorText } from '../utils/store.js'
import { isFirebaseReady, oldDataPreview, oldDataExport, oldDataPurge } from '../utils/firebase.js'
import { recentFrom, namHocFrom, clampDisplayYears, DISPLAY_YEARS_MIN, DISPLAY_YEARS_MAX, currentTerm } from '../utils/scope.js'
import ConfirmModal from './ConfirmModal.js'

const { useState, useMemo, createElement: h } = window.React

const COUNT_LABELS = [
  ['subjects', 'Học phần'], ['schedule', 'Buổi học (thời khóa biểu)'], ['exams', 'Lịch thi'], ['materials', 'Tài liệu'],
  ['quizzes', 'Đề trắc nghiệm'], ['quizKeys', 'Khóa đáp án'], ['quizArchive', 'Bản lưu đề'], ['quizResults', 'Kết quả trắc nghiệm'],
  ['examKeys', 'Mã phòng thi'], ['examSessions', 'Lượt vào phòng thi'], ['homeworks', 'Bài tập'], ['homeworkSubs', 'Bài nộp'],
  ['deadlines', 'Deadline'], ['grades', 'Cột điểm (sinh viên × môn)'], ['gradingPolicies', 'Quy chế điểm'],
  ['gradingColumns', 'Cột tính điểm'], ['activityEvents', 'Nhật ký hoạt động'],
]
const startOf = (nh) => Number(String(nh || '').slice(0, 4)) || null

function download(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export default function OldDataPanel({ subjects = [], displayYears, onDisplayYears }) {
  const years = clampDisplayYears(displayYears)
  const [draftYears, setDraftYears] = useState(years)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const from = recentFrom(years)
  // Các mốc "xóa học phần đã kết thúc của năm học trước X": từ năm cũ nhất có dữ liệu đến hết phần nằm ngoài khoảng hiển thị
  const choices = useMemo(() => {
    const olds = subjects.filter(s => s.trangThai === 'da-ket-thuc' && startOf(s.namHoc) != null && startOf(s.namHoc) < from).map(s => startOf(s.namHoc))
    if (!olds.length) return []
    const out = []
    for (let y = from; y > Math.min(...olds); y--) out.push(y)
    return out
  }, [subjects, from])
  const [before, setBefore] = useState(null)
  const sel = before && choices.includes(before) ? before : choices[0]
  const [preview, setPreview] = useState(null)     // { before, counts, total, subjects }
  const [exported, setExported] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [done, setDone] = useState(null)
  const server = isFirebaseReady()

  const saveYears = async () => {
    setBusy(true); setMsg(null)
    try {
      await setDocument('settings', 'retention', { displayYears: draftYears, updatedAt: new Date().toISOString() }, false)
      onDisplayYears?.(draftYears); setPreview(null); setExported(false)
      setMsg({ type: 'success', text: `Đã lưu: các trang mặc định hiển thị ${draftYears} năm học gần nhất (từ ${namHocFrom(recentFrom(draftYears))}).` })
    } catch (e) { setMsg({ type: 'danger', text: errorText(e) }) }
    setBusy(false)
  }
  const doPreview = async (y = sel) => {
    setBusy(true); setMsg(null); setExported(false); setDone(null)
    try { setPreview(await oldDataPreview(namHocFrom(y))) } catch (e) { setPreview(null); setMsg({ type: 'danger', text: errorText(e) }) }
    setBusy(false)
  }
  const doExport = async () => {
    setBusy(true); setMsg(null)
    try {
      const data = await oldDataExport(preview.before)
      download(`trich-luc-du-lieu-cu-truoc-${preview.before}.json`, data)
      setExported(true)
    } catch (e) { setMsg({ type: 'danger', text: errorText(e) }) }
    setBusy(false)
  }
  const doPurge = async () => {
    setConfirm(false); setBusy(true); setMsg(null)
    try {
      const r = await oldDataPurge(preview.before, preview.total)
      setDone(r); setPreview(null); setExported(false)
    } catch (e) { setMsg({ type: 'danger', text: errorText(e) }) }
    setBusy(false)
  }

  const yearOpts = []
  for (let n = DISPLAY_YEARS_MIN; n <= DISPLAY_YEARS_MAX; n++) yearOpts.push(n)

  return h('div', { className: 'd-flex flex-column gap-3' },
    msg && h('div', { className: `alert alert-${msg.type} small py-2 mb-0` }, msg.text),

    h('div', { className: 'card border-0 shadow-sm' },
      h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 fw-bold' }, h('i', { className: 'bi bi-eye me-2 text-primary' }), 'Khoảng hiển thị dữ liệu'),
      h('div', { className: 'card-body px-4 pt-0' },
        h('p', { className: 'small text-muted mb-2' },
          'Các trang Môn học, Lịch thi, Deadline mặc định chỉ hiện dữ liệu trong số năm học gần nhất này. Dữ liệu cũ hơn không bị xóa: ',
          'người dùng chọn "Dữ liệu cũ" ở bộ lọc để xem và bấm "Trích lục CSV" để tải về.'),
        h('div', { className: 'd-flex flex-wrap align-items-center gap-2' },
          h('select', { className: 'form-select form-select-sm', style: { width: 'auto' }, value: draftYears, onChange: e => setDraftYears(Number(e.target.value)), 'aria-label': 'Số năm học hiển thị' },
            yearOpts.map(n => h('option', { key: n, value: n }, `${n} năm học gần nhất (từ ${namHocFrom(recentFrom(n))})`))),
          h('button', { className: 'btn btn-sm btn-primary', disabled: busy || draftYears === years, onClick: saveYears }, 'Lưu'),
          h('small', { className: 'text-muted' }, `Năm học hiện tại: ${currentTerm().namHoc}`)))),

    h('div', { className: 'card border-0 shadow-sm' },
      h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 fw-bold' }, h('i', { className: 'bi bi-trash3 me-2 text-danger' }), 'Dọn dữ liệu cũ'),
      h('div', { className: 'card-body px-4 pt-0' },
        h('p', { className: 'small text-muted mb-2' },
          `Xóa hẳn học phần đã kết thúc của các năm học cũ hơn khoảng hiển thị (trước ${namHocFrom(from)}) cùng mọi dữ liệu gắn với chúng. `,
          'Phải tải bản trích lục trước khi xóa; máy chủ cũng tự lưu một bản. Học phần đang học, kế hoạch, tài khoản, học phí, phiếu tốt nghiệp, khóa luận không bị đụng tới. ',
          'Tệp tài liệu còn được học phần khác dùng chung thì giữ lại.'),
        !server && h('div', { className: 'alert alert-secondary small py-2' }, 'Chức năng này cần máy chủ StudyTask (không dùng ở chế độ demo).'),
        done && h('div', { className: 'alert alert-success small py-2' },
          h('div', { className: 'fw-semibold' }, `Đã xóa ${done.counts?.subjects || 0} học phần cùng dữ liệu đi kèm.`),
          h('div', null, `Bản trích lục trên máy chủ: exports/${done.export}`, done.files ? ` · đã xóa ${done.files} tệp tài liệu không còn dùng` : ''),
          h('button', { className: 'btn btn-sm btn-outline-success mt-2', onClick: () => window.location.reload() }, h('i', { className: 'bi bi-arrow-clockwise me-1' }), 'Tải lại trang để cập nhật')),
        server && !choices.length && h('div', { className: 'small text-success' }, h('i', { className: 'bi bi-check-circle me-1' }),
          `Không có học phần đã kết thúc nào cũ hơn ${namHocFrom(from)}.`),
        server && choices.length > 0 && h('div', { className: 'd-flex flex-wrap align-items-center gap-2' },
          h('label', { className: 'small mb-0' }, 'Xóa học phần đã kết thúc của các năm học trước'),
          h('select', { className: 'form-select form-select-sm', style: { width: 'auto' }, value: sel, 'aria-label': 'Mốc năm học',
            onChange: e => { setBefore(Number(e.target.value)); setPreview(null); setExported(false) } },
            choices.map(y => h('option', { key: y, value: y }, namHocFrom(y)))),
          h('button', { className: 'btn btn-sm btn-outline-primary', disabled: busy, onClick: () => doPreview() }, h('i', { className: 'bi bi-search me-1' }), 'Xem trước')),
        preview && h('div', { className: 'mt-3' },
          h('div', { className: 'small fw-semibold mb-2' }, `Sẽ xóa (trước năm học ${preview.before}): ${preview.total} mục`),
          h('div', { className: 'table-responsive' },
            h('table', { className: 'table table-sm small mb-2', style: { maxWidth: 520 } },
              h('tbody', null, COUNT_LABELS.filter(([k]) => preview.counts?.[k]).map(([k, label]) =>
                h('tr', { key: k }, h('td', null, label), h('td', { className: 'text-end fw-semibold' }, preview.counts[k].toLocaleString('vi-VN'))))))),
          preview.counts?.accounts > 0 && h('div', { className: 'small text-muted mb-2' },
            `${preview.counts.accounts} tài khoản (giáo viên) còn được phân các học phần này: chỉ gỡ phân công, không xóa tài khoản.`),
          h('details', { className: 'small mb-3' }, h('summary', null, `Danh sách ${preview.subjects.length} học phần`),
            h('ul', { className: 'mb-0 mt-1' }, preview.subjects.map(s => h('li', { key: s.id }, `${s.code || ''} ${s.name || ''} · HK${s.ky} ${s.namHoc} · khóa ${s.khoa || '—'}`)))),
          h('div', { className: 'd-flex flex-wrap gap-2' },
            h('button', { className: 'btn btn-sm btn-outline-secondary', disabled: busy || !preview.total, onClick: doExport },
              h('i', { className: 'bi bi-download me-1' }), exported ? 'Đã tải bản trích lục (tải lại)' : '1. Tải bản trích lục (JSON)'),
            h('button', { className: 'btn btn-sm btn-danger', disabled: busy || !exported || !preview.subjects.length, onClick: () => setConfirm(true),
              title: exported ? '' : 'Tải bản trích lục trước khi xóa' },
              h('i', { className: 'bi bi-trash3 me-1' }), '2. Xóa vĩnh viễn')))),
      confirm && h(ConfirmModal, { message: `Xóa vĩnh viễn ${preview.subjects.length} học phần đã kết thúc trước năm học ${preview.before} cùng ${preview.total} mục dữ liệu đi kèm? Không hoàn tác được trên trang web.`,
        confirmLabel: 'Xóa vĩnh viễn', onConfirm: doPurge, onClose: () => setConfirm(false) })))
}
