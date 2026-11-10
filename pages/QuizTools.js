// pages/QuizTools.js – Công cụ cho giáo viên: xem lại đề và đáp án, nhập đề từ tệp, kho đề lưu trên máy chủ
import { apiCall, APP_ENV } from '../utils/firebase.js'
import { questionsFromText, questionsToCsv, questionsToJson, CSV_TEMPLATE, assignIds, judgeAnswer } from '../utils/quizFile.js'

const { useState, useEffect, useMemo, createElement: h } = window.React

const overlay = { backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1070 }      // cao hơn cửa sổ soạn đề bên dưới
const TYPE_LABEL = { single: 'Một đáp án', multiple: 'Nhiều đáp án', fill: 'Điền khuyết' }
const fmtTime = (iso) => { try { return new Date(iso).toLocaleString('vi-VN') } catch { return iso || '' } }

export function download(name, text, mime = 'text/csv;charset=utf-8') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: mime }))
  a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
const safeName = (s) => String(s || 'de').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'de'

// Câu hỏi có đáp án đúng để xem không (người không có quyền chỉ nhận bản công khai)
export const hasKey = (quiz) => (quiz.questions || []).every(q => (q.type === 'fill' ? Array.isArray(q.accepted) : (q.answers || []).some(a => 'correct' in a)))

// ─────────────────────────────────────────────────────────────────
// Nhập câu hỏi từ tệp CSV / JSON hoặc dán từ Excel
// ─────────────────────────────────────────────────────────────────
export function ImportQuizModal({ onImport, onClose, usedIds = [] }) {
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const parsed = useMemo(() => (text.trim() ? questionsFromText(text) : null), [text])

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 4 * 1024 * 1024) { alert('Tệp quá lớn (tối đa 4 MB).'); return }
    const r = new FileReader()
    r.onload = () => { setText(String(r.result || '')); setFileName(f.name) }
    r.readAsText(f, 'utf-8')
  }

  return h('div', { className: 'modal show d-block', style: overlay },
    h('div', { className: 'modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' },
          h('h5', { className: 'modal-title fw-bold' }, h('i', { className: 'bi bi-file-earmark-arrow-up me-2' }), 'Nhập câu hỏi từ tệp'),
          h('button', { className: 'btn-close', onClick: onClose })
        ),
        h('div', { className: 'modal-body' },
          h('div', { className: 'alert alert-light border small' },
            h('div', { className: 'fw-semibold mb-1' }, 'Cách làm'),
            h('ol', { className: 'mb-1 ps-3' },
              h('li', null, 'Tải mẫu CSV, điền câu hỏi trong Excel (cột: Loại, Câu hỏi, A–E, Đáp án), lưu dạng ', h('b', null, 'CSV UTF-8'), '.'),
              h('li', null, 'Hoặc chọn vùng ô trong Excel, nhấn Ctrl+C rồi ', h('b', null, 'dán thẳng'), ' vào ô bên dưới (không cần lưu tệp).'),
              h('li', null, 'Cũng nhận tệp JSON (xuất từ "Xem đề").')
            ),
            h('div', null, 'Đáp án: ', h('code', null, 'B'), ' hoặc ', h('code', null, 'A;C'), '. Câu điền khuyết: ghi các đáp án chấp nhận, cách nhau bằng ', h('code', null, '|'), '; nhiều chỗ trống cách nhau bằng ', h('code', null, ';;'), '.')
          ),
          h('div', { className: 'd-flex flex-wrap gap-2 mb-3 align-items-center' },
            h('input', { type: 'file', accept: '.csv,.tsv,.txt,.json', className: 'form-control form-control-sm', style: { maxWidth: 320 }, onChange: onFile }),
            h('button', { type: 'button', className: 'btn btn-sm btn-outline-secondary', onClick: () => download('mau-nhap-cau-hoi.csv', CSV_TEMPLATE) },
              h('i', { className: 'bi bi-download me-1' }), 'Tải mẫu CSV'),
            fileName && h('small', { className: 'text-muted' }, fileName)
          ),
          h('textarea', { className: 'form-control mb-3', rows: 7, placeholder: 'Hoặc dán nội dung từ Excel / CSV / JSON vào đây…', value: text, onChange: e => { setText(e.target.value); setFileName('') } }),
          parsed && h('div', null,
            h('div', { className: 'mb-2 fw-semibold' },
              parsed.questions.length > 0 ? h('span', { className: 'text-success' }, `Nhận được ${parsed.questions.length} câu hợp lệ`) : h('span', { className: 'text-danger' }, 'Chưa nhận được câu nào'),
              parsed.skipped > 0 && h('span', { className: 'text-warning ms-2' }, `· bỏ qua ${parsed.skipped} dòng lỗi`)
            ),
            parsed.errors.length > 0 && h('ul', { className: 'small text-danger mb-2' }, parsed.errors.slice(0, 8).map((er, i) => h('li', { key: i }, er)),
              parsed.errors.length > 8 && h('li', null, `… và ${parsed.errors.length - 8} lỗi khác`)),
            parsed.questions.slice(0, 4).map((q, i) => h('div', { key: i, className: 'small border rounded p-2 mb-1' },
              h('span', { className: 'badge bg-light text-dark border me-2' }, TYPE_LABEL[q.type]), q.text.slice(0, 120)))
          )
        ),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
          h('button', { className: 'btn btn-success', disabled: !parsed || parsed.questions.length === 0,
              onClick: () => { onImport(assignIds(parsed.questions, usedIds)); onClose() } },
            h('i', { className: 'bi bi-plus-circle me-1' }), parsed?.questions.length ? `Thêm ${parsed.questions.length} câu vào đề` : 'Thêm vào đề')
        )
      )
    )
  )
}

// ─────────────────────────────────────────────────────────────────
// Kho đề: lưu riêng trên máy chủ, dùng lại cho đề mới
// ─────────────────────────────────────────────────────────────────
export function BankModal({ subjects, subjectId, currentQuestions, currentTitle, onPick, onClose, user, role }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [title, setTitle] = useState(currentTitle || '')
  const offline = APP_ENV === 'offline'
  const subjectName = (id) => (subjects.find(s => s.id === id) || {}).name || '—'

  const load = () => apiCall('GET', '/quizbank').then(r => setItems(r.items)).catch(e => { setItems([]); setError(e.message) })
  useEffect(() => { if (!offline) load(); else setItems([]) }, [])

  const pick = async (it) => {
    setBusy(true); setError('')
    try { const r = await apiCall('GET', `/quizbank/${it.id}`); onPick(r.item.questions, r.item); onClose() }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const remove = async (it) => {
    if (!confirm(`Xóa "${it.title}" khỏi kho? Các đề đã tạo từ bộ này không bị ảnh hưởng.`)) return
    try { await apiCall('DELETE', `/quizbank/${it.id}`); load() } catch (e) { setError(e.message) }
  }
  const cleaned = (currentQuestions || []).filter(q => q.text?.trim()).map(q => (q.type === 'fill'
    ? { type: 'fill', text: q.text, blanks: q.blanks || 1, answers: [], accepted: (q.accepted || []).map(a => (a || []).map(x => x.trim()).filter(Boolean)) }
    : { type: q.type, text: q.text, answers: (q.answers || []).filter(a => a.text.trim()).map(a => ({ id: a.id, text: a.text, correct: !!a.correct })) }))
  const saveCurrent = async () => {
    setBusy(true); setError(''); setMsg('')
    try {
      const r = await apiCall('POST', '/quizbank', { title: title.trim(), subjectId, source: 'quiz', questions: cleaned })
      setMsg(`Đã lưu ${r.count} câu vào kho.`); load()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return h('div', { className: 'modal show d-block', style: overlay },
    h('div', { className: 'modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' },
          h('h5', { className: 'modal-title fw-bold' }, h('i', { className: 'bi bi-archive me-2' }), 'Kho đề trên máy chủ'),
          h('button', { className: 'btn-close', onClick: onClose })
        ),
        h('div', { className: 'modal-body' },
          offline && h('div', { className: 'alert alert-warning small' }, 'Chế độ demo (offline) không có kho đề trên máy chủ.'),
          error && h('div', { className: 'alert alert-danger small py-2' }, error),
          msg && h('div', { className: 'alert alert-success small py-2' }, msg),
          !offline && cleaned.length > 0 && h('div', { className: 'border rounded p-3 mb-3 bg-light' },
            h('div', { className: 'fw-semibold small mb-2' }, `Lưu ${cleaned.length} câu đang soạn vào kho (kèm đáp án đúng)`),
            h('div', { className: 'd-flex gap-2' },
              h('input', { className: 'form-control form-control-sm', placeholder: 'Tên bộ câu hỏi, ví dụ: Chương 1 – Giới hạn', value: title, onChange: e => setTitle(e.target.value) }),
              h('button', { className: 'btn btn-sm btn-primary flex-shrink-0', disabled: busy || !title.trim() || !subjectId, onClick: saveCurrent }, 'Lưu vào kho')
            ),
            !subjectId && h('small', { className: 'text-danger' }, 'Chọn môn học ở bước 1 trước khi lưu.')
          ),
          h('div', { className: 'fw-semibold small mb-2' }, 'Bộ câu hỏi đã lưu'),
          items === null ? h('div', { className: 'text-muted small' }, 'Đang tải…')
            : items.length === 0 ? h('div', { className: 'text-muted small' }, 'Kho còn trống. Lưu bộ câu hỏi đầu tiên ở trên, hoặc dùng "Xem đề" → "Lưu vào kho" ở một đề đã có.')
            : h('div', { className: 'list-group' }, items.map(it => h('div', { key: it.id, className: 'list-group-item d-flex align-items-center gap-2' },
                h('div', { className: 'flex-grow-1' },
                  h('div', { className: 'fw-semibold' }, it.title),
                  h('small', { className: 'text-muted' }, `${subjectName(it.subjectId)} · ${it.count} câu · ${it.ownerName || '—'} · ${fmtTime(it.updatedAt)}`)),
                h('button', { className: 'btn btn-sm btn-outline-primary', disabled: busy, onClick: () => pick(it) }, h('i', { className: 'bi bi-plus-circle me-1' }), 'Thêm vào đề'),
                (role === 'admin' || it.ownerUid === user?.uid) &&h('button', { className: 'btn btn-sm btn-outline-danger', title: 'Xóa khỏi kho (chỉ người tạo hoặc Admin)', onClick: () => remove(it) }, h('i', { className: 'bi bi-trash' }))
              )))
        ),
        h('div', { className: 'modal-footer' }, h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Đóng'))
      )
    )
  )
}

// ─────────────────────────────────────────────────────────────────
// Xem lại đề và đáp án (giáo viên dạy môn, Admin), bản đã giao cho sinh viên và bài làm khi có khiếu nại
// ─────────────────────────────────────────────────────────────────
function QuestionView({ q, i }) {
  return h('div', { className: 'border rounded p-3 mb-2' },
    h('div', { className: 'd-flex justify-content-between mb-2' },
      h('span', { className: 'fw-semibold' }, `Câu ${i + 1}: `, q.text),
      h('span', { className: 'badge bg-light text-dark border flex-shrink-0 ms-2' }, TYPE_LABEL[q.type])),
    q.type === 'fill'
      ? (q.accepted || []).map((a, bi) => h('div', { key: bi, className: 'small' },
          h('span', { className: 'text-muted' }, `Chỗ trống ${bi + 1}: `), a.map((x, k) => h('span', { key: k, className: 'badge bg-success-subtle text-success me-1' }, x))))
      : (q.answers || []).map(a => h('div', { key: a.id, className: `small ${a.correct ? 'text-success fw-semibold' : 'text-muted'}` },
          h('i', { className: `bi bi-${a.correct ? 'check-circle-fill' : 'circle'} me-2` }), a.id.toUpperCase(), '. ', a.text, a.correct && h('span', { className: 'badge bg-success-subtle text-success ms-2' }, 'Đáp án đúng')))
  )
}

function ResultsTab({ quiz }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(null)
  useEffect(() => { apiCall('GET', `/quiz/${quiz.id}/results`).then(r => setRows(r.results)).catch(e => { setRows([]); setError(e.message) }) }, [quiz.id])
  const csv = () => download(`${safeName(quiz.title)}-ket-qua.csv`, '﻿' + ['Họ tên,Tên đăng nhập,Điểm,Số câu đúng,Tổng số câu,Nộp lúc,Điểm di trú']
    .concat((rows || []).map(r => [r.name, r.username, r.score, r.correct, r.total, r.submittedAt, r.migrated ? 'có' : ''].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))).join('\r\n'))
  if (rows === null) return h('div', { className: 'text-muted small' }, 'Đang tải…')
  return h('div', null,
    error && h('div', { className: 'alert alert-danger small py-2' }, error),
    h('div', { className: 'd-flex justify-content-between align-items-center mb-2' },
      h('small', { className: 'text-muted' }, `${rows.length} bài nộp. Bấm một dòng để đối chiếu từng câu khi có khiếu nại.`),
      rows.length > 0 && h('button', { className: 'btn btn-sm btn-outline-secondary', onClick: csv }, h('i', { className: 'bi bi-filetype-csv me-1' }), 'Xuất CSV')),
    rows.length === 0 ? h('div', { className: 'text-muted small' }, 'Chưa có bài nộp.') :
      h('div', { className: 'table-responsive' }, h('table', { className: 'table table-sm align-middle' },
        h('thead', null, h('tr', null, ['Họ tên', 'Tài khoản', 'Điểm', 'Đúng', 'Nộp lúc'].map(c => h('th', { key: c }, c)))),
        h('tbody', null, rows.map(r => h(window.React.Fragment, { key: r.uid },
          h('tr', { style: { cursor: 'pointer' }, onClick: () => setOpen(open === r.uid ? null : r.uid) },
            h('td', null, r.name || '—'), h('td', null, r.username || '—'), h('td', { className: 'fw-semibold' }, r.score),
            h('td', null, `${r.correct}/${r.total}`), h('td', { className: 'small' }, fmtTime(r.submittedAt), r.migrated && h('span', { className: 'badge bg-secondary ms-1' }, 'điểm cũ'))),
          open === r.uid && h('tr', null, h('td', { colSpan: 5, className: 'bg-light' },
            r.migrated && !Object.keys(r.answers || {}).length
              ? h('small', { className: 'text-muted' }, 'Điểm di trú từ hệ thống cũ, không có chi tiết câu trả lời.')
              : quiz.questions.map((q, i) => {
                  const given = r.answers?.[q.id]
                  const ok = judgeAnswer(q, given)
                  const shown = q.type === 'fill' ? (given || []).map(x => (x ? `"${x}"` : '(bỏ trống)')).join(' | ') || '(bỏ trống)'
                    : (Array.isArray(given) ? given : given ? [given] : []).map(x => x.toUpperCase()).join(', ') || '(bỏ trống)'
                  return h('div', { key: q.id, className: 'small py-1 border-bottom' },
                    h('i', { className: `bi bi-${ok === null ? 'dash' : ok ? 'check-circle-fill text-success' : 'x-circle-fill text-danger'} me-2` }),
                    `Câu ${i + 1}: `, h('b', null, shown))
                }))))))))
  )
}

export function QuizViewer({ quiz, subjectName, onClose, onDuplicate }) {
  const [tab, setTab] = useState('content')
  const [arc, setArc] = useState(null)
  const [msg, setMsg] = useState('')
  const allowed = hasKey(quiz)
  useEffect(() => { if (quiz.status !== 'draft') apiCall('GET', `/quiz/${quiz.id}/archive`).then(r => setArc(r.archive)).catch(() => {}) }, [quiz.id])
  const toBank = async () => {
    setMsg('')
    try { const r = await apiCall('POST', '/quizbank', { title: quiz.title, subjectId: quiz.subjectId, source: 'quiz', questions: quiz.questions }); setMsg(`Đã lưu ${r.count} câu vào kho đề.`) }
    catch (e) { setMsg(e.message) }
  }
  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.55)' } },
    h('div', { className: 'modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' },
          h('div', null, h('h5', { className: 'modal-title fw-bold mb-0' }, quiz.title),
            h('small', { className: 'text-muted' }, `${subjectName} · ${quiz.questions.length} câu · hạn ${new Date(quiz.dueDate).toLocaleDateString('vi-VN')}`)),
          h('button', { className: 'btn-close', onClick: onClose })),
        h('div', { className: 'px-3 pt-2' },
          h('ul', { className: 'nav nav-tabs' }, [['content', 'Đề & đáp án'], ['results', 'Bài làm & khiếu nại']].map(([k, l]) =>
            h('li', { key: k, className: 'nav-item' }, h('button', { className: `nav-link${tab === k ? ' active' : ''}`, onClick: () => setTab(k) }, l))))),
        h('div', { className: 'modal-body' },
          tab === 'content' ? h('div', null,
            arc && h('div', { className: 'alert alert-info small py-2' }, h('i', { className: 'bi bi-shield-check me-1' }),
              arc.activatedAt ? `Bản đã giao cho sinh viên lúc ${fmtTime(arc.activatedAt)}${arc.activatedByName ? ' bởi ' + arc.activatedByName : ''}; nội dung không còn sửa được nên dùng làm căn cứ khi có khiếu nại.` : (arc.note || '')),
            !allowed && h('div', { className: 'alert alert-warning small' }, 'Bạn không có quyền xem đáp án của đề này (chỉ Admin và giáo viên dạy môn).'),
            allowed && h('div', { className: 'd-flex flex-wrap gap-2 mb-3' },
              h('button', { className: 'btn btn-sm btn-outline-secondary', onClick: () => download(`${safeName(quiz.title)}-de-va-dap-an.csv`, questionsToCsv(quiz.questions)) }, h('i', { className: 'bi bi-filetype-csv me-1' }), 'Xuất CSV'),
              h('button', { className: 'btn btn-sm btn-outline-secondary', onClick: () => download(`${safeName(quiz.title)}-de-va-dap-an.json`, questionsToJson(quiz.questions), 'application/json;charset=utf-8') }, h('i', { className: 'bi bi-filetype-json me-1' }), 'Xuất JSON'),
              APP_ENV !== 'offline' && h('button', { className: 'btn btn-sm btn-outline-secondary', onClick: toBank }, h('i', { className: 'bi bi-archive me-1' }), 'Lưu vào kho đề'),
              h('button', { className: 'btn btn-sm btn-outline-primary', onClick: () => onDuplicate(quiz) }, h('i', { className: 'bi bi-files me-1' }), 'Nhân bản thành đề mới')),
            msg && h('div', { className: 'small text-success mb-2' }, msg),
            quiz.questions.map((q, i) => h(QuestionView, { key: q.id, q, i })))
          : h(ResultsTab, { quiz })
        ),
        h('div', { className: 'modal-footer' }, h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Đóng'))
      )
    )
  )
}
