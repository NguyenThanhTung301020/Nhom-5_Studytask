// pages/Curriculum.js – Phòng Đào tạo: kiểm tra các module môn học có đáp ứng chương trình đào tạo (CTĐT)
// rồi thêm môn còn thiếu / bớt môn ngoài chương trình. CTĐT lưu ở curriculum/{programId}.
import { setDocument, listDocuments, deleteDocument, errorText } from '../utils/store.js'
import { checkCurriculum } from '../utils/curriculum.js'
import { SAMPLE_CURRICULUM, SUBJECT_COLORS } from '../utils/constants.js'
import ConfirmModal from '../components/ConfirmModal.js'

const { useState, useEffect, createElement: h } = window.React
const Frag = window.React.Fragment
const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ctdt'

function ModuleModal({ item, onSave, onClose }) {
  const [f, setF] = useState(item ? { ...item, courses: (item.courses || []).map(c => ({ ...c })) }
    : { id: 'm' + Date.now(), name: '', kind: 'required', minCredits: 0, courses: [] })
  const setC = (i, patch) => setF(x => ({ ...x, courses: x.courses.map((c, j) => j === i ? { ...c, ...patch } : c) }))
  const codes = f.courses.map(c => c.code.trim().toUpperCase()).filter(Boolean)
  const dup = codes.find((c, i) => codes.indexOf(c) !== i)
  const valid = f.name.trim() && f.courses.every(c => c.code.trim() && c.name.trim() && Number(c.credits) > 0) && !dup &&
    (f.kind === 'required' || Number(f.minCredits) > 0)
  return h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
    h('div', { className: 'modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' }, h('h5', { className: 'modal-title fw-bold' }, item ? 'Sửa module' : 'Thêm module'), h('button', { className: 'btn-close', onClick: onClose })),
        h('div', { className: 'modal-body' },
          h('div', { className: 'row g-3 mb-3' },
            h('div', { className: 'col-12 col-md-6' }, h('label', { className: 'form-label fw-semibold' }, 'Tên module'),
              h('input', { className: 'form-control', value: f.name, onChange: e => setF({ ...f, name: e.target.value }) })),
            h('div', { className: 'col-6 col-md-3' }, h('label', { className: 'form-label fw-semibold' }, 'Loại'),
              h('select', { className: 'form-select', value: f.kind, onChange: e => setF({ ...f, kind: e.target.value }) },
                h('option', { value: 'required' }, 'Bắt buộc'), h('option', { value: 'elective' }, 'Tự chọn'))),
            f.kind === 'elective' && h('div', { className: 'col-6 col-md-3' }, h('label', { className: 'form-label fw-semibold' }, 'TC tối thiểu'),
              h('input', { type: 'number', min: 1, className: 'form-control', value: f.minCredits, onChange: e => setF({ ...f, minCredits: Number(e.target.value) }) }))
          ),
          h('table', { className: 'table table-sm align-middle' },
            h('thead', null, h('tr', null, ['Mã môn', 'Tên môn', 'Tín chỉ', ''].map(t => h('th', { key: t, className: 'small text-muted' }, t)))),
            h('tbody', null, f.courses.map((c, i) => h('tr', { key: i },
              h('td', { style: { width: 130 } }, h('input', { className: 'form-control form-control-sm', value: c.code, onChange: e => setC(i, { code: e.target.value.toUpperCase() }) })),
              h('td', null, h('input', { className: 'form-control form-control-sm', value: c.name, onChange: e => setC(i, { name: e.target.value }) })),
              h('td', { style: { width: 90 } }, h('input', { type: 'number', min: 1, className: 'form-control form-control-sm', value: c.credits, onChange: e => setC(i, { credits: Number(e.target.value) }) })),
              h('td', { style: { width: 40 } }, h('button', { className: 'btn btn-sm btn-outline-danger', onClick: () => setF(x => ({ ...x, courses: x.courses.filter((_, j) => j !== i) })) }, h('i', { className: 'bi bi-x' })))
            )))
          ),
          h('button', { className: 'btn btn-sm btn-outline-primary', onClick: () => setF(x => ({ ...x, courses: [...x.courses, { code: '', name: '', credits: 3 }] })) },
            h('i', { className: 'bi bi-plus me-1' }), 'Thêm môn vào module'),
          dup && h('div', { className: 'small text-danger mt-2' }, `Mã môn ${dup} bị trùng.`)
        ),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
          h('button', { className: 'btn btn-primary', disabled: !valid, onClick: () => onSave({ ...f, name: f.name.trim(), courses: f.courses.map(c => ({ code: c.code.trim().toUpperCase(), name: c.name.trim(), credits: Number(c.credits) })) }) }, 'Lưu'))
      )
    )
  )
}

export default function Curriculum({ subjects = [], setSubjects, schedule = [], exams = [], deadlines = [] }) {
  const [programs, setPrograms] = useState(null)
  const [pid, setPid]           = useState(null)
  const [prog, setProg]         = useState(null)
  const [modal, setModal]       = useState(null)   // { item } | { item: null }
  const [confirm, setConfirm]   = useState(null)
  const [msg, setMsg]           = useState(null)

  const loadPrograms = async (select) => {
    try {
      const list = await listDocuments('curriculum')
      setPrograms(list)
      const id = select || pid || list[0]?.id || null
      setPid(id); setProg(list.find(p => p.id === id) || null)
    } catch (e) { setMsg({ type: 'danger', text: errorText(e) }); setPrograms([]) }
  }
  useEffect(() => { loadPrograms() }, [])

  const saveProg = async (next) => {
    try { await setDocument('curriculum', pid, { ...next, updatedAt: new Date().toISOString() }, false); setProg({ ...next, id: pid }); setMsg(null) }
    catch (e) { setMsg({ type: 'danger', text: errorText(e) }) }
  }
  const createFromSample = async () => {
    const id = slug(SAMPLE_CURRICULUM.name)
    try { await setDocument('curriculum', id, SAMPLE_CURRICULUM, false); await loadPrograms(id) } catch (e) { setMsg({ type: 'danger', text: errorText(e) }) }
  }
  const createEmpty = async () => {
    const name = prompt('Tên chương trình đào tạo (VD: Công nghệ thông tin – khóa 2025):')
    if (!name) return
    const id = slug(name)
    try { await setDocument('curriculum', id, { name, major: '', cohort: '', totalCredits: 0, modules: [] }, false); await loadPrograms(id) } catch (e) { setMsg({ type: 'danger', text: errorText(e) }) }
  }

  if (programs === null) return h('div', { className: 'text-center py-5' }, h('div', { className: 'spinner-border text-primary' }))

  const header = h('div', { className: 'd-flex flex-wrap justify-content-between align-items-center gap-2 mb-3' },
    h('div', null,
      h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-diagram-3 me-2', style: { color: '#6f42c1' } }), 'Chương trình đào tạo'),
      h('small', { className: 'text-muted' }, 'Đối chiếu các module môn học đang mở với chương trình đào tạo; thêm môn còn thiếu, bớt môn ngoài chương trình.')),
    h('div', { className: 'd-flex gap-2' },
      programs.length > 0 && h('select', { className: 'form-select form-select-sm', style: { width: 'auto' }, value: pid || '', onChange: e => { setPid(e.target.value); setProg(programs.find(p => p.id === e.target.value)) } },
        programs.map(p => h('option', { key: p.id, value: p.id }, p.name))),
      h('button', { className: 'btn btn-sm btn-outline-primary', onClick: createEmpty }, h('i', { className: 'bi bi-plus-lg me-1' }), 'CTĐT mới'))
  )

  if (!prog) return h('div', { className: 'container-fluid py-4' }, header,
    msg && h('div', { className: `alert alert-${msg.type} small` }, msg.text),
    h('div', { className: 'card border-0 shadow-sm p-5 text-center text-muted' },
      h('i', { className: 'bi bi-diagram-3 fs-1 d-block mb-3 opacity-25' }), 'Chưa có chương trình đào tạo nào.',
      h('div', { className: 'mt-3' }, h('button', { className: 'btn btn-primary btn-sm', onClick: createFromSample }, 'Tạo từ CTĐT mẫu (Kỹ thuật phần mềm)'))))

  const r = checkCurriculum(prog, subjects)

  // ── Hành động thêm / bớt môn ──
  // Mở (tạo) các môn trong danh sách môn học dùng chung; id = thời điểm tạo + thứ tự để không trùng
  const openSubjects = (courses) => {
    setSubjects(prev => {
      const used = new Set(prev.map(s => s.color))
      const base = Date.now()
      return [...prev, ...courses.map((c, i) => {
        const color = SUBJECT_COLORS.find(x => !used.has(x)) || SUBJECT_COLORS[(prev.length + i) % SUBJECT_COLORS.length]
        used.add(color)
        return { id: base + i, name: c.name, code: c.code, credits: c.credits, color, teachers: [] }
      })]
    })
    setMsg({ type: 'success', text: courses.length === 1
      ? `Đã mở môn ${courses[0].code} – ${courses[0].name}. Giáo viên và lịch học gán ở trang Môn học / Lịch học.`
      : `Đã mở ${courses.length} môn còn thiếu.` })
  }
  const addSubject = (course) => openSubjects([course])
  const addAllMissing = () => openSubjects(r.modules.flatMap(m => m.missing))
  const syncCredits = (course) => {
    setSubjects(prev => prev.map(s => s.id === course.subject.id ? { ...s, credits: course.credits } : s))
    setMsg({ type: 'success', text: `Đã cập nhật ${course.code} thành ${course.credits} tín chỉ theo CTĐT.` })
  }
  const usage = (sid) => schedule.filter(c => c.subjectId === sid).length + exams.filter(e => e.subjectId === sid).length + deadlines.filter(d => d.subjectId === sid).length
  const removeSubject = (s) => setConfirm({
    message: `Bớt môn ${s.code || ''} – ${s.name} khỏi danh sách môn đang mở?` + (usage(s.id) ? ` Môn này còn ${usage(s.id)} lịch học/lịch thi/deadline liên quan.` : ''),
    run: () => { setSubjects(prev => prev.filter(x => x.id !== s.id)); setMsg({ type: 'success', text: `Đã bớt môn ${s.name}.` }) },
    label: 'Bớt môn',
  })
  const putInModule = (s, moduleId) => {
    const next = { ...prog, modules: prog.modules.map(m => m.id === moduleId ? { ...m, courses: [...m.courses, { code: s.code, name: s.name, credits: Number(s.credits) || 0 }] } : m) }
    saveProg(next)
  }

  const saveModule = (mod) => {
    const exists = prog.modules.some(m => m.id === mod.id)
    saveProg({ ...prog, modules: exists ? prog.modules.map(m => m.id === mod.id ? mod : m) : [...prog.modules, mod] }); setModal(null)
  }
  const deleteModule = (m) => setConfirm({ message: `Xóa module "${m.name}" khỏi CTĐT? (không xóa môn đang mở)`, label: 'Xóa',
    run: () => saveProg({ ...prog, modules: prog.modules.filter(x => x.id !== m.id) }) })
  const deleteProgram = () => setConfirm({ message: `Xóa chương trình "${prog.name}"?`, label: 'Xóa',
    run: async () => { try { await deleteDocument('curriculum', pid); setPid(null); setProg(null); loadPrograms('') } catch (e) { setMsg({ type: 'danger', text: errorText(e) }) } } })

  const totalMissing = r.modules.reduce((s, m) => s + m.missing.length, 0)

  return h('div', { className: 'container-fluid py-4' }, header,
    msg && h('div', { className: `alert alert-${msg.type} alert-dismissible small py-2` }, msg.text, h('button', { className: 'btn-close', onClick: () => setMsg(null) })),

    // Thông tin chung + kết quả kiểm tra
    h('div', { className: 'card border-0 shadow-sm mb-3' },
      h('div', { className: 'card-body' },
        h('div', { className: 'row g-3 align-items-end' },
          h('div', { className: 'col-12 col-md-4' }, h('label', { className: 'form-label small fw-semibold' }, 'Tên CTĐT'),
            h('input', { className: 'form-control form-control-sm', defaultValue: prog.name, key: pid + 'n', onBlur: e => e.target.value.trim() && e.target.value !== prog.name && saveProg({ ...prog, name: e.target.value.trim() }) })),
          h('div', { className: 'col-6 col-md-3' }, h('label', { className: 'form-label small fw-semibold' }, 'Ngành'),
            h('input', { className: 'form-control form-control-sm', defaultValue: prog.major, key: pid + 'm', onBlur: e => e.target.value !== prog.major && saveProg({ ...prog, major: e.target.value }) })),
          h('div', { className: 'col-6 col-md-2' }, h('label', { className: 'form-label small fw-semibold' }, 'Tổng TC yêu cầu'),
            h('input', { type: 'number', min: 0, className: 'form-control form-control-sm', defaultValue: prog.totalCredits, key: pid + 't', onBlur: e => Number(e.target.value) !== prog.totalCredits && saveProg({ ...prog, totalCredits: Number(e.target.value) }) })),
          h('div', { className: 'col-12 col-md-3 text-md-end' },
            h('button', { className: 'btn btn-sm btn-outline-danger', onClick: deleteProgram }, h('i', { className: 'bi bi-trash me-1' }), 'Xóa CTĐT'))
        ),
        h('div', { className: `alert ${r.ok ? 'alert-success' : 'alert-warning'} small mt-3 mb-0 d-flex flex-wrap justify-content-between align-items-center gap-2` },
          h('div', null,
            h('i', { className: `bi bi-${r.ok ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-1` }),
            r.ok ? 'Các module môn học đang mở đáp ứng đủ chương trình đào tạo.' : `Chưa đáp ứng: ${r.modules.filter(m => !m.ok).length} module thiếu, ${totalMissing} môn bắt buộc chưa mở.`,
            ` Tổng TC theo module: ${r.programCredits}/${r.totalCredits}.`,
            r.totalMismatch && h('span', { className: 'text-danger' }, ' Tổng tín chỉ các module khác tổng TC yêu cầu.'),
            r.extra.length > 0 && ` ${r.extra.length} môn đang mở nằm ngoài CTĐT.`),
          totalMissing > 0 && h('button', { className: 'btn btn-sm btn-primary', onClick: addAllMissing }, h('i', { className: 'bi bi-plus-circle me-1' }), `Mở ${totalMissing} môn còn thiếu`))
      )
    ),

    // Module
    h('div', { className: 'd-flex justify-content-between align-items-center mb-2' },
      h('h6', { className: 'fw-bold mb-0' }, `Module (${r.modules.length})`),
      h('button', { className: 'btn btn-sm btn-primary', onClick: () => setModal({ item: null }) }, h('i', { className: 'bi bi-plus-lg me-1' }), 'Thêm module')),
    h('div', { className: 'row g-3 mb-4' }, r.modules.map(m => h('div', { key: m.id, className: 'col-12 col-xl-6' },
      h('div', { className: 'card border-0 shadow-sm h-100', style: { borderTop: `3px solid ${m.ok ? '#1cc88a' : '#f6c23e'}` } },
        h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 d-flex justify-content-between align-items-start gap-2' },
          h('div', null,
            h('div', { className: 'fw-bold' }, m.name),
            h('div', { className: 'small text-muted' }, m.kind === 'required' ? 'Bắt buộc' : `Tự chọn – tối thiểu ${m.requiredCredits} TC`, ` · đang mở ${m.offeredCredits}/${m.requiredCredits} TC`)),
          h('div', { className: 'd-flex gap-1' },
            h('span', { className: `badge ${m.ok ? 'bg-success' : 'bg-warning text-dark'}` }, m.ok ? 'Đạt' : m.kind === 'required' ? `Thiếu ${m.missing.length} môn` : `Thiếu ${m.shortage} TC`),
            h('button', { className: 'btn btn-sm btn-outline-secondary py-0', title: 'Sửa module', onClick: () => setModal({ item: prog.modules.find(x => x.id === m.id) }) }, h('i', { className: 'bi bi-pencil' })),
            h('button', { className: 'btn btn-sm btn-outline-danger py-0', title: 'Xóa module', onClick: () => deleteModule(m) }, h('i', { className: 'bi bi-trash' })))),
        h('div', { className: 'card-body pt-0 px-4' },
          h('div', { className: 'progress mb-2', style: { height: 5 } }, h('div', { className: `progress-bar ${m.ok ? 'bg-success' : 'bg-warning'}`, style: { width: `${Math.min(100, m.requiredCredits ? m.offeredCredits / m.requiredCredits * 100 : 100)}%` } })),
          m.courses.map(c => h('div', { key: c.code, className: 'd-flex align-items-center gap-2 py-1 border-bottom small' },
            h('i', { className: `bi bi-${c.offered ? 'check-circle-fill text-success' : 'circle text-muted'}` }),
            h('span', { className: 'fw-semibold', style: { width: 70 } }, c.code),
            h('span', { className: 'flex-grow-1' }, c.name, c.creditMismatch && h('span', { className: 'badge bg-warning-subtle text-warning ms-2' }, `đang mở ${c.subject.credits} TC`)),
            h('span', { className: 'text-muted' }, `${c.credits} TC`),
            !c.offered && h('button', { className: 'btn btn-sm btn-outline-primary py-0', onClick: () => addSubject(c) }, h('i', { className: 'bi bi-plus' }), ' Mở môn'),
            c.creditMismatch && h('button', { className: 'btn btn-sm btn-outline-warning py-0', onClick: () => syncCredits(c) }, 'Sửa TC')))
        )
      )))),

    // Môn ngoài CTĐT
    h('div', { className: 'card border-0 shadow-sm' },
      h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 fw-bold' }, h('i', { className: 'bi bi-box-arrow-up-right me-2 text-danger' }), `Môn đang mở nhưng ngoài CTĐT (${r.extra.length})`),
      h('div', { className: 'card-body pt-0 px-4' },
        r.extra.length === 0 ? h('div', { className: 'text-muted small' }, 'Không có.') :
        r.extra.map(s => h('div', { key: s.id, className: 'd-flex flex-wrap align-items-center gap-2 py-2 border-bottom small' },
          h('span', { className: 'mcal-dot', style: { background: s.color } }),
          h('span', { className: 'fw-semibold', style: { width: 70 } }, s.code || '—'),
          h('span', { className: 'flex-grow-1' }, s.name, ` · ${s.credits || 0} TC`, usage(s.id) > 0 && h('span', { className: 'text-muted' }, ` · ${usage(s.id)} lịch/deadline`)),
          s.code && prog.modules.length > 0 && h('select', { className: 'form-select form-select-sm', style: { width: 'auto' }, value: '', onChange: e => e.target.value && putInModule(s, e.target.value) },
            h('option', { value: '' }, 'Đưa vào module…'), prog.modules.map(m => h('option', { key: m.id, value: m.id }, m.name))),
          h('button', { className: 'btn btn-sm btn-outline-danger py-0', onClick: () => removeSubject(s) }, h('i', { className: 'bi bi-dash-circle me-1' }), 'Bớt môn')))
      )
    ),

    modal && h(ModuleModal, { item: modal.item, onSave: saveModule, onClose: () => setModal(null) }),
    confirm && h(ConfirmModal, { message: confirm.message, confirmLabel: confirm.label, onConfirm: () => { confirm.run(); setConfirm(null) }, onClose: () => setConfirm(null) })
  )
}
