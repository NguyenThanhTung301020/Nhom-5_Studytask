// pages/Quiz.js – Hệ thống trắc nghiệm
import { SUBJECT_COLORS } from '../utils/constants.js'
import { submitQuiz, APP_ENV } from '../utils/firebase.js'

const { useState, useMemo, createElement: h } = window.React

const ALPHA = ['A','B','C','D','E']
const STATUS_LABELS = { draft:'Bản nháp', active:'Đang mở', closed:'Đã đóng' }
const STATUS_COLORS = { draft:'secondary', active:'success', closed:'danger' }

// ─────────────────────────────────────────────────────────────────
// Teacher/Admin – Tạo / sửa đề thi
// ─────────────────────────────────────────────────────────────────

function AnswerRow({ ans, onText, onToggle, onRemove, type, canRemove }) {
  const isChecked = ans.correct
  return h('div', { className: 'd-flex align-items-center gap-2 mb-2' },
    type === 'single'
      ? h('input', { type:'radio', className:'form-check-input flex-shrink-0', checked: isChecked, onChange: onToggle, title:'Đáp án đúng' })
      : h('input', { type:'checkbox', className:'form-check-input flex-shrink-0', checked: isChecked, onChange: onToggle, title:'Đánh dấu đúng' }),
    h('span', { className: 'fw-semibold text-muted flex-shrink-0', style:{width:20} }, ans.id.toUpperCase()),
    h('input', { className:'form-control form-control-sm', placeholder:'Nhập nội dung đáp án…', value: ans.text, onChange: e => onText(e.target.value) }),
    canRemove && h('button', { type:'button', className:'btn btn-sm btn-outline-danger flex-shrink-0', onClick: onRemove },
      h('i', { className:'bi bi-x' })
    )
  )
}

function QuestionEditor({ q, idx, onChange, onRemove }) {
  const setField   = (k, v) => onChange({ ...q, [k]: v })
  const setAnswer  = (ai, k, v) => {
    let answers = q.answers.map((a, i) => i === ai ? { ...a, [k]: v } : a)
    // single choice: uncheck others khi check một cái
    if (k === 'correct' && v && q.type === 'single') answers = answers.map((a, i) => ({ ...a, correct: i === ai }))
    onChange({ ...q, answers })
  }
  const addAnswer  = () => {
    if (q.answers.length >= 5) return
    onChange({ ...q, answers: [...q.answers, { id: ALPHA[q.answers.length].toLowerCase(), text:'', correct:false }] })
  }
  const removeAns  = (ai) => onChange({ ...q, answers: q.answers.filter((_,i) => i !== ai) })

  return h('div', { className:'quiz-question-editor card border-0 shadow-sm mb-3' },
    h('div', { className:'card-body' },
      h('div', { className:'d-flex justify-content-between align-items-center mb-3' },
        h('span', { className:'fw-bold', style:{color:'var(--primary)'} }, `Câu ${idx + 1}`),
        h('div', { className:'d-flex gap-2 align-items-center' },
          h('select', { className:'form-select form-select-sm', style:{width:'auto'}, value: q.type,
              onChange: e => setField('type', e.target.value) },
            h('option', { value:'single' }, '1 đáp án đúng'),
            h('option', { value:'multiple' }, 'Nhiều đáp án đúng'),
          ),
          h('button', { type:'button', className:'btn btn-sm btn-outline-danger', onClick: onRemove },
            h('i', { className:'bi bi-trash' })
          )
        )
      ),
      h('textarea', { className:'form-control mb-3', rows:2, placeholder:'Nội dung câu hỏi…', value: q.text,
          onChange: e => setField('text', e.target.value) }),
      h('div', { className:'mb-2' },
        h('small', { className:'text-muted' },
          q.type === 'single' ? '◉ Chọn radio đáp án đúng' : '☑ Chọn tất cả đáp án đúng'
        )
      ),
      q.answers.map((a, ai) =>
        h(AnswerRow, { key:ai, ans:a, type:q.type, canRemove: q.answers.length > 2,
          onText:  v  => setAnswer(ai, 'text', v),
          onToggle: () => setAnswer(ai, 'correct', !a.correct),
          onRemove: () => removeAns(ai) })
      ),
      q.answers.length < 5 && h('button', { type:'button', className:'btn btn-sm btn-outline-secondary', onClick: addAnswer },
        h('i', { className:'bi bi-plus-lg me-1' }), 'Thêm đáp án'
      )
    )
  )
}

function QuizModal({ item, subjects, onSave, onClose }) {
  // V3: đề mới luôn ở dạng bản nháp; mở đề (nháp → đang mở) chỉ sau khi đã lưu đề và đáp án đúng; đề đã mở bị khóa nội dung
  const blank = { title:'', subjectId: subjects[0]?.id || '', description:'', dueDate:'', status:'draft', questions:[
    { id:1, text:'', type:'single', answers:[
      {id:'a',text:'',correct:false},{id:'b',text:'',correct:false},
      {id:'c',text:'',correct:false},{id:'d',text:'',correct:false},
    ]}
  ]}
  const [form, setForm] = useState(item ? { ...item, questions: item.questions.map(q=>({...q,answers:[...q.answers]})) } : blank)
  const [step, setStep] = useState(1)
  const locked = !!item && item.status !== 'draft'      // đề đã mở/đóng: chỉ đổi được trạng thái
  const statusOptions = !item || item.status === 'draft' ? (item ? ['draft','active'] : ['draft'])
                      : item.status === 'active' ? ['active','closed'] : ['closed']

  const setQ = (qi, newQ) => setForm({ ...form, questions: form.questions.map((q,i) => i===qi ? newQ : q) })
  const addQ  = () => setForm({ ...form, questions: [...form.questions, {
    id: Date.now(), text:'', type:'single',
    answers:[{id:'a',text:'',correct:false},{id:'b',text:'',correct:false},{id:'c',text:'',correct:false},{id:'d',text:'',correct:false}]
  }]})
  const delQ  = (qi) => form.questions.length > 1 && setForm({ ...form, questions: form.questions.filter((_,i)=>i!==qi) })

  const step1Valid = form.title.trim() && form.subjectId && form.dueDate
  // Chỉ cần ≥2 đáp án có nội dung và ít nhất 1 đáp án đúng
  const step2Valid = form.questions.every(q => {
    const filled = q.answers.filter(a => a.text.trim())
    return q.text.trim() && filled.length >= 2 && filled.some(a => a.correct)
  })

  return h('div', { className:'modal show d-block', style:{ backgroundColor:'rgba(0,0,0,0.55)' } },
    h('div', { className:'modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable' },
      h('div', { className:'modal-content' },
        h('div', { className:'modal-header' },
          h('h5', { className:'modal-title fw-bold' }, item ? 'Sửa đề thi' : 'Tạo đề thi mới'),
          h('button', { className:'btn-close', onClick:onClose })
        ),

        // Step indicator
        h('div', { className:'px-4 pt-3' },
          h('div', { className:'d-flex gap-3 align-items-center mb-3' },
            ['Thông tin cơ bản', 'Câu hỏi & đáp án'].map((lbl,i) =>
              h('div', { key:i, className:`step-pill${step===i+1?' active':''}`, onClick:()=>step===2&&i===0&&setStep(1) },
                h('span', { className:'step-num' }, i+1), lbl
              )
            )
          )
        ),

        h('div', { className:'modal-body' },
          step === 1
            ? h('div', { className:'row g-3' },
                h('div', { className:'col-12' },
                  h('label', { className:'form-label fw-semibold' }, 'Tiêu đề đề thi ', h('span', {className:'text-danger'},'*')),
                  h('input', { className:'form-control', placeholder:'VD: Quiz Chương 1 – Giới hạn hàm số', value:form.title, autoFocus:true, disabled:locked,
                    onChange:e=>setForm({...form,title:e.target.value}) })
                ),
                h('div', { className:'col-md-6' },
                  h('label', { className:'form-label fw-semibold' }, 'Môn học ', h('span',{className:'text-danger'},'*')),
                  h('select', { className:'form-select', value:form.subjectId, disabled: !!item, onChange:e=>setForm({...form,subjectId:Number(e.target.value)}) },
                    h('option', { value:'' }, '— Chọn môn —'),
                    subjects.map(s => h('option',{key:s.id,value:s.id},s.name))
                  )
                ),
                h('div', { className:'col-md-6' },
                  h('label', { className:'form-label fw-semibold' }, 'Hạn làm bài ', h('span',{className:'text-danger'},'*')),
                  h('input', { type:'date', className:'form-control', value:form.dueDate, disabled:locked, onChange:e=>setForm({...form,dueDate:e.target.value}) })
                ),
                h('div', { className:'col-md-6' },
                  h('label', { className:'form-label fw-semibold' }, 'Trạng thái'),
                  h('select', { className:'form-select', value:form.status, disabled: statusOptions.length === 1, onChange:e=>setForm({...form,status:e.target.value}) },
                    statusOptions.map(s => h('option', { key:s, value:s }, { draft:'Bản nháp', active:'Đang mở – Sinh viên có thể làm', closed:'Đã đóng' }[s]))
                  ),
                  h('small', { className:'text-muted' }, !item ? 'Đề mới luôn là bản nháp. Lưu đề, sau đó mở đề khi đã sẵn sàng.'
                    : item.status === 'draft' ? 'Khi mở đề, câu hỏi và đáp án bị khóa, không sửa được nữa.'
                    : item.status === 'active' ? 'Chỉ có thể đóng đề. Muốn đổi nội dung hãy tạo đề mới.' : 'Đề đã đóng không mở lại được.')
                ),
                h('div', { className:'col-12' },
                  h('label', { className:'form-label fw-semibold' }, 'Mô tả'),
                  h('textarea', { className:'form-control', rows:2, placeholder:'Hướng dẫn hoặc mô tả bài thi…', value:form.description, disabled:locked,
                    onChange:e=>setForm({...form,description:e.target.value}) })
                )
              )
            : h('div', null,
                form.questions.map((q,qi) =>
                  h(QuestionEditor, { key:q.id, q, idx:qi, onChange:nq=>setQ(qi,nq), onRemove:()=>delQ(qi) })
                ),
                h('button', { type:'button', className:'btn btn-outline-primary w-100', onClick:addQ },
                  h('i', { className:'bi bi-plus-circle me-2' }), 'Thêm câu hỏi'
                ),
                !step2Valid && h('div', { className:'alert alert-warning mt-3 small py-2' },
                  h('i', { className:'bi bi-exclamation-triangle me-1' }),
                  'Mỗi câu cần: nội dung câu hỏi, ít nhất 2 đáp án có nội dung và 1 đáp án được đánh dấu đúng.'
                )
              )
        ),

        h('div', { className:'modal-footer' },
          h('button', { className:'btn btn-secondary', onClick:onClose }, 'Hủy'),
          locked
            ? h('button', { className:'btn btn-success', disabled: form.status === item.status, onClick:()=>onSave({ ...item, status: form.status }) },
                h('i', { className:'bi bi-check2 me-1' }), 'Lưu trạng thái')
          : step === 1
            ? h('button', { className:'btn btn-primary', disabled:!step1Valid, onClick:()=>setStep(2) },
                'Tiếp theo: Câu hỏi ', h('i', { className:'bi bi-arrow-right ms-1' })
              )
            : h(window.React.Fragment, null,
                h('button', { className:'btn btn-outline-secondary', onClick:()=>setStep(1) },
                  h('i', { className:'bi bi-arrow-left me-1' }), 'Quay lại'
                ),
                h('button', { className:'btn btn-success', disabled:!step2Valid,
                    onClick:()=>{
                      if (!step2Valid) return
                      // Lọc bỏ đáp án rỗng khi lưu
                      const cleaned = {
                        ...form,
                        questions: form.questions.map(q => ({
                          ...q, answers: q.answers.filter(a => a.text.trim())
                        })),
                        id: item?.id || Date.now(),
                        createdAt: item?.createdAt || new Date().toISOString(),
                      }
                      onSave(cleaned)
                    }},
                  h('i', { className:'bi bi-cloud-upload me-1' }), item ? 'Lưu thay đổi' : 'Tạo đề thi'
                )
              )
        )
      )
    )
  )
}

// ─────────────────────────────────────────────────────────────────
// Student – Làm bài thi
// ─────────────────────────────────────────────────────────────────

export function QuizTaker({ quiz, subjectName, onSubmit, onClose, existing }) {
  const [selected, setSelected] = useState({}) // { [questionId]: string | string[] }
  const [result,   setResult]   = useState(existing || null)   // existing: kết quả chính thức đã có (xem lại)
  const [sending,  setSending]  = useState(false)
  const [error,    setError]    = useState('')
  const offline = APP_ENV === 'offline'                         // chế độ demo không có máy chủ chấm → không nộp bài

  const toggle = (qid, aid, type) => {
    if (type === 'single') {
      setSelected(s => ({ ...s, [qid]: aid }))
    } else {
      const cur = selected[qid] || []
      setSelected(s => ({ ...s, [qid]: cur.includes(aid) ? cur.filter(x=>x!==aid) : [...cur, aid] }))
    }
  }

  const answered = quiz.questions.filter(q => {
    const s = selected[q.id]
    return s && (Array.isArray(s) ? s.length > 0 : true)
  }).length

  // V3: trình duyệt không có đáp án đúng; máy chủ chấm, ghi điểm một lần và chỉ trả điểm + số câu đúng
  const handleSubmit = async () => {
    setSending(true); setError('')
    try {
      const r = await submitQuiz(quiz.id, selected)
      const res = { quizId: quiz.id, answers: selected, score: r.score, correct: r.correct, total: r.total, submittedAt: r.submittedAt }
      setResult(res)
      onSubmit(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  // ── Kết quả ──
  if (result) {
    const pct  = Math.round((result.correct / result.total) * 100)
    const color = pct >= 80 ? '#1cc88a' : pct >= 60 ? '#f6c23e' : '#e74a3b'
    const label = pct >= 80 ? 'Xuất sắc' : pct >= 60 ? 'Đạt' : 'Chưa đạt'
    return h('div', { className:'modal show d-block', style:{ backgroundColor:'rgba(0,0,0,0.55)' } },
      h('div', { className:'modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable' },
        h('div', { className:'modal-content' },
          h('div', { className:'modal-header border-0' },
            h('h5', { className:'modal-title fw-bold' }, h('i', { className:'bi bi-patch-check-fill me-2 text-success' }), 'Kết quả bài thi'),
            h('button', { className:'btn-close', onClick:onClose })
          ),
          h('div', { className:'modal-body' },
            // Score card
            h('div', { className:'text-center py-4' },
              h('div', { className:'quiz-score-circle mx-auto mb-3', style:{ borderColor:color } },
                h('div', { className:'fw-bold', style:{ fontSize:'2rem', color } }, `${result.score}`),
                h('div', { className:'small text-muted' }, '/ 10')
              ),
              h('h5', { className:'fw-bold mb-1', style:{ color } }, label),
              h('p', { className:'text-muted mb-0' }, `Đúng ${result.correct}/${result.total} câu (${pct}%)`),
              h('small', { className:'text-muted' }, new Date(result.submittedAt).toLocaleString('vi-VN'))
            ),
            h('hr'),
            // Bài đã chọn (không hiển thị đáp án đúng: chỉ trả điểm và số câu đúng)
            h('div', { className:'alert alert-info small py-2' },
              h('i', { className:'bi bi-info-circle me-1' }), 'Đáp án đúng không được hiển thị. Bạn chỉ nhận điểm và số câu đúng.'),
            quiz.questions.map((q, qi) => {
              const givenIds = Array.isArray(result.answers?.[q.id]) ? result.answers[q.id] : result.answers?.[q.id] ? [result.answers[q.id]] : []
              return h('div', { key:q.id, className:'quiz-review-item mb-3 p-3 rounded-3 bg-light' },
                h('div', { className:'fw-semibold small mb-2' }, `Câu ${qi+1}: ${q.text}`),
                q.answers.map(a => h('div', { key:a.id, className:`quiz-ans-row small ${givenIds.includes(a.id) ? 'fw-semibold' : 'text-muted'}` },
                  h('i', { className:`bi bi-${givenIds.includes(a.id) ? 'check-square-fill' : 'square'} me-2` }),
                  a.id.toUpperCase(), '. ', a.text))
              )
            })
          ),
          h('div', { className:'modal-footer' },
            h('button', { className:'btn btn-primary', onClick:onClose },
              h('i', { className:'bi bi-arrow-left me-1' }), 'Về danh sách'
            )
          )
        )
      )
    )
  }

  // ── Làm bài ──
  return h('div', { className:'modal show d-block', style:{ backgroundColor:'rgba(0,0,0,0.55)' } },
    h('div', { className:'modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable' },
      h('div', { className:'modal-content' },
        h('div', { className:'modal-header' },
          h('div', null,
            h('h5', { className:'modal-title fw-bold mb-0' }, quiz.title),
            h('small', { className:'text-muted' }, h('i',{className:'bi bi-book me-1'}), subjectName,
              h('span', { className:'mx-2' }, '·'),
              h('i',{className:'bi bi-calendar3 me-1'}), new Date(quiz.dueDate).toLocaleDateString('vi-VN')
            )
          ),
          h('button', { className:'btn-close', onClick:onClose })
        ),
        h('div', { className:'card-body px-4 py-2 border-bottom bg-light' },
          h('div', { className:'d-flex justify-content-between align-items-center small' },
            h('span', { className:'text-muted' }, `${quiz.questions.length} câu hỏi`),
            h('span', { className:`fw-semibold ${answered===quiz.questions.length?'text-success':'text-warning'}` },
              `Đã trả lời: ${answered}/${quiz.questions.length}`
            )
          )
        ),
        h('div', { className:'modal-body' },
          quiz.questions.map((q, qi) => {
            const sel = selected[q.id]
            return h('div', { key:q.id, className:'quiz-question-item mb-4' },
              h('div', { className:'fw-semibold mb-1 d-flex gap-2' },
                h('span', { className:'quiz-q-num flex-shrink-0' }, qi+1),
                h('span', null, q.text)
              ),
              h('small', { className:'text-muted d-block mb-2 ms-4' },
                q.type === 'single' ? 'Chọn 1 đáp án đúng' : 'Chọn tất cả đáp án đúng'
              ),
              h('div', { className:'ms-4' },
                q.answers.map(a => {
                  const checked = q.type==='single' ? sel===a.id : (sel||[]).includes(a.id)
                  return h('label', { key:a.id, className:`quiz-ans-option${checked?' selected':''}` },
                    h('input', { type: q.type==='single'?'radio':'checkbox', name:`q${q.id}`, value:a.id, checked,
                        onChange:()=>toggle(q.id, a.id, q.type), className:'form-check-input me-2 flex-shrink-0' }),
                    h('span', { className:'fw-semibold text-muted me-2' }, a.id.toUpperCase()),
                    a.text
                  )
                })
              )
            )
          })
        ),
        h('div', { className:'modal-footer d-flex justify-content-between' },
          h('span', { className:`small fw-semibold ${answered===quiz.questions.length?'text-success':'text-muted'}` },
            answered === quiz.questions.length
              ? h(window.React.Fragment, null, h('i',{className:'bi bi-check-all me-1'}), 'Đã trả lời tất cả câu')
              : `Còn ${quiz.questions.length - answered} câu chưa trả lời`
          ),
          h('div', { className:'text-end' },
            error && h('div', { className:'text-danger small mb-1' }, error),
            offline && h('div', { className:'text-muted small mb-1' }, 'Chế độ demo (offline) không chấm điểm trắc nghiệm.'),
            h('button', { className:'btn btn-success', disabled: answered===0 || sending || offline, onClick: handleSubmit },
              h('i', { className:'bi bi-send-fill me-2' }), sending ? 'Đang gửi…' : 'Nộp bài'
            )
          )
        )
      )
    )
  )
}

// ─────────────────────────────────────────────────────────────────
// Main Quiz Page
// ─────────────────────────────────────────────────────────────────

export default function Quiz({ quizzes, setQuizzes, submissions, setSubmissions, subjects, user, role, onActivity }) {
  const [modal,       setModal]       = useState(null)  // null | 'add' | 'edit'
  const [editItem,    setEditItem]    = useState(null)
  const [taking,      setTaking]      = useState(null)  // quiz đang làm
  const [filterSub,   setFilterSub]   = useState('')

  const subjectName = (id) => (subjects.find(s=>s.id===id)||{}).name || '—'
  const subjectColor= (id) => (subjects.find(s=>s.id===id)||{}).color || '#ccc'

  const mySubmissions = submissions.filter(s => s.userId === user?.uid)
  const submittedIds  = new Set(mySubmissions.map(s => s.quizId))

  const handleSave = (form) => {
    if (modal === 'edit') setQuizzes(quizzes.map(q => q.id===editItem.id ? form : q))
    else                  setQuizzes([...quizzes, form])
    setModal(null)
  }

  const handleDelete = (id) => {
    if (confirm('Xóa đề thi này?')) setQuizzes(quizzes.filter(q => q.id !== id))
  }

  // Điểm do máy chủ ghi (quizResults) và máy chủ tự ghi sự kiện vào Bảng điểm; trình duyệt chỉ cập nhật hiển thị
  const handleSubmitQuiz = (result) => {
    setSubmissions([...submissions.filter(s => !(s.quizId===result.quizId && s.userId===user?.uid)),
                    { ...result, userId: user?.uid }])
  }

  const visible = quizzes
    .filter(q => !filterSub || q.subjectId === Number(filterSub))
    .filter(q => role === 'student' ? q.status === 'active' : true)

  const isTeacher = role === 'admin' || role === 'teacher'

  return h('div', { className:'container-fluid py-4' },

    // ── Header ──
    h('div', { className:'d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4' },
      h('div', null,
        h('h4', { className:'fw-bold mb-1' }, h('i',{className:'bi bi-patch-question me-2', style:{color:'var(--primary)'}}), 'Trắc nghiệm'),
        h('small', { className:'text-muted' },
          isTeacher ? `${quizzes.length} đề thi · ${submissions.length} lượt nộp` : `${quizzes.filter(q=>q.status==='active').length} đề đang mở`
        )
      ),
      h('div', { className:'d-flex gap-2 align-items-center' },
        h('select', { className:'form-select form-select-sm', style:{width:180}, value:filterSub, onChange:e=>setFilterSub(e.target.value) },
          h('option',{value:''},'Tất cả môn học'),
          subjects.map(s=>h('option',{key:s.id,value:s.id},s.name))
        ),
        isTeacher && h('button', { className:'btn btn-primary btn-sm', onClick:()=>{ setEditItem(null); setModal('add') } },
          h('i',{className:'bi bi-plus-lg me-1'}), 'Tạo đề mới'
        )
      )
    ),

    // ── Tabs student ──
    role === 'student' && h('div', { className:'d-flex gap-2 mb-3' },
      h('span', { className:'badge rounded-pill', style:{backgroundColor:'rgba(28,200,138,.12)',color:'#1cc88a',padding:'6px 14px'} },
        h('i',{className:'bi bi-ui-checks me-1'}), `Chưa làm: ${quizzes.filter(q=>q.status==='active'&&!submittedIds.has(q.id)).length}`
      ),
      h('span', { className:'badge rounded-pill', style:{backgroundColor:'rgba(78,115,223,.12)',color:'var(--primary)',padding:'6px 14px'} },
        h('i',{className:'bi bi-check-all me-1'}), `Đã nộp: ${mySubmissions.length}`
      )
    ),

    // ── Empty state ──
    visible.length === 0 && h('div', { className:'text-center text-muted py-5' },
      h('i', { className:'bi bi-journal-x fs-1 d-block mb-3 opacity-25' }),
      h('p', null, role==='student' ? 'Chưa có đề thi nào đang mở.' : 'Chưa có đề thi nào. Nhấn "Tạo đề mới" để bắt đầu.')
    ),

    // ── Quiz cards ──
    visible.length > 0 && h('div', { className:'row g-3' },
      visible.map(quiz => {
        const sub     = mySubmissions.find(s=>s.quizId===quiz.id)
        const color   = subjectColor(quiz.subjectId)
        const expired = new Date(quiz.dueDate) < new Date()

        return h('div', { key:quiz.id, className:'col-12 col-md-6 col-xl-4' },
          h('div', { className:'card border-0 shadow-sm h-100' },
            h('div', { style:{ height:4, backgroundColor:color, borderRadius:'12px 12px 0 0' } }),
            h('div', { className:'card-body d-flex flex-column' },

              h('div', { className:'d-flex justify-content-between align-items-start mb-3' },
                h('div', null,
                  h('h6', { className:'fw-bold mb-1' }, quiz.title),
                  h('small', { className:'text-muted' }, h('i',{className:'bi bi-book me-1'}), subjectName(quiz.subjectId))
                ),
                h('span', { className:`badge bg-${STATUS_COLORS[quiz.status]}` }, STATUS_LABELS[quiz.status])
              ),

              quiz.description && h('p', { className:'text-muted small mb-3' }, quiz.description),

              h('div', { className:'d-flex flex-wrap gap-2 mb-3' },
                h('span', { className:'quiz-info-badge' }, h('i',{className:'bi bi-list-ol me-1'}), `${quiz.questions.length} câu`),
                h('span', { className:'quiz-info-badge' }, h('i',{className:'bi bi-calendar3 me-1'}),
                  new Date(quiz.dueDate).toLocaleDateString('vi-VN'),
                  expired && h('span', {className:'ms-1 text-danger'},'(Hết hạn)')
                ),
                isTeacher && h('span', { className:'quiz-info-badge' },
                  h('i',{className:'bi bi-people me-1'}),
                  `${submissions.filter(s=>s.quizId===quiz.id).length} lượt nộp`
                )
              ),

              // Score badge if student submitted
              sub && h('div', { className:'quiz-score-badge mb-3',
                  style:{ backgroundColor: sub.score>=8?'rgba(28,200,138,.1)': sub.score>=6?'rgba(246,194,62,.1)':'rgba(231,74,59,.1)',
                           color: sub.score>=8?'#1cc88a': sub.score>=6?'#e67e22':'#e74a3b' } },
                h('i', {className:'bi bi-trophy-fill me-1'}),
                `Điểm của bạn: ${sub.score}/10 (${sub.correct}/${sub.total} câu)`
              ),

              h('div', { className:'mt-auto d-flex gap-2' },
                // Student actions
                role === 'student' && !sub && quiz.status==='active' && !expired &&
                  h('button', { className:'btn btn-primary flex-grow-1', onClick:()=>setTaking(quiz) },
                    h('i',{className:'bi bi-pencil-square me-1'}), 'Làm bài'
                  ),
                role === 'student' && sub &&
                  h('button', { className:'btn btn-outline-secondary flex-grow-1', onClick:()=>setTaking(quiz) },
                    h('i',{className:'bi bi-eye me-1'}), 'Xem kết quả'
                  ),
                role === 'student' && quiz.status==='closed' && !sub &&
                  h('span', { className:'btn btn-secondary flex-grow-1 disabled' }, 'Đã đóng'),

                // Teacher/Admin actions
                isTeacher && h(window.React.Fragment, null,
                  h('button', { className:'btn btn-outline-primary btn-sm flex-grow-1', onClick:()=>{ setEditItem(quiz); setModal('edit') } },
                    h('i',{className:`bi bi-${quiz.status==='draft'?'pencil':'toggles'} me-1`}), quiz.status==='draft' ? 'Sửa' : quiz.status==='active' ? 'Đóng đề' : 'Xem'
                  ),
                  quiz.status === 'draft' && h('button', { className:'btn btn-outline-danger btn-sm', title:'Chỉ xóa được đề ở dạng bản nháp', onClick:()=>handleDelete(quiz.id) },
                    h('i',{className:'bi bi-trash'})
                  )
                )
              )
            )
          )
        )
      })
    ),

    // ── Modals ──
    modal && h(QuizModal, { item: modal==='edit'?editItem:null, subjects, onSave:handleSave, onClose:()=>setModal(null) }),
    taking && h(QuizTaker, {
      quiz:taking,
      existing: mySubmissions.find(s => s.quizId === taking.id),
      subjectName: subjectName(taking.subjectId),
      onSubmit: handleSubmitQuiz,
      onClose: () => setTaking(null),
    })
  )
}
