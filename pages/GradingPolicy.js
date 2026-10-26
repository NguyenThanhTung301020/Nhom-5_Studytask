// pages/GradingPolicy.js – Quy chế tính điểm từng môn
//   Phòng Đào tạo / Admin: chọn loại môn, cập nhật tỉ lệ (tự động theo số bài hoặc nhập tay) → gradingPolicies/{subjectId}
//   Giáo viên dạy môn:     quyết định cột bài tập nào tính điểm (hệ số), cột còn lại tính vào chuyên cần → gradingColumns/{subjectId}
//   Sinh viên:             xem công thức tính điểm của các môn mình học
import { getDocument, setDocument, listDocuments, errorText } from '../utils/store.js'
import { PRESETS, LIMITS, COMPONENTS, COMPONENT_LABEL, defaultPolicy, effectivePolicy, validatePolicy,
         subjectColumns, countedColumns, processFinalSplit, suggestBtWeight } from '../utils/grading.js'

const { useState, useEffect, createElement: h } = window.React
const Frag = window.React.Fragment
const COLORS = { cc: '#36b9cc', bt: '#4e73df', gk: '#f6c23e', ck: '#e74a3b' }

function WeightBar({ w }) {
  return h('div', null,
    h('div', { className: 'gp-bar' }, COMPONENTS.filter(k => +w[k] > 0).map(k =>
      h('div', { key: k, className: 'gp-bar-seg', style: { width: `${w[k]}%`, background: COLORS[k] }, title: `${COMPONENT_LABEL[k]} ${w[k]}%` }, `${w[k]}%`))),
    h('div', { className: 'd-flex flex-wrap gap-3 mt-2 small' }, COMPONENTS.map(k =>
      h('span', { key: k }, h('span', { className: 'mcal-dot', style: { background: COLORS[k] } }), `${COMPONENT_LABEL[k]}: `, h('strong', null, `${w[k] || 0}%`))))
  )
}

export default function GradingPolicy({ user, subjects = [], quizzes = [], homeworks = [] }) {
  const role = user.role
  const canPolicy = role === 'training' || role === 'admin'
  const canColumnsFor = (sid) => role === 'admin' || (role === 'teacher' && (user.subjectIds || []).includes(sid))

  const [sid, setSid]           = useState(subjects[0]?.id ?? null)
  const [policies, setPolicies] = useState(null)   // { sid: policy }
  const [columnsDocs, setCols]  = useState({})     // { sid: { counted } }
  const [draft, setDraft]       = useState(null)   // chính sách đang sửa
  const [colDraft, setColDraft] = useState(null)   // { key: k } đang sửa
  const [msg, setMsg]           = useState(null)
  const [busy, setBusy]         = useState(false)

  const load = async () => {
    try {
      const [ps, cs] = await Promise.all([listDocuments('gradingPolicies'), listDocuments('gradingColumns')])
      setPolicies(Object.fromEntries(ps.map(p => [p.id, p])))
      setCols(Object.fromEntries(cs.map(c => [c.id, c])))
    } catch (e) { setMsg({ type: 'danger', text: errorText(e) }); setPolicies({}) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => { if (sid == null && subjects.length) setSid(subjects[0].id) }, [subjects])

  const subject = subjects.find(s => s.id === sid)
  const columns = subject ? subjectColumns(subject.id, quizzes, homeworks) : []
  const savedPolicy = (id) => ({ ...defaultPolicy(subjects.find(s => s.id === id)), ...(policies?.[String(id)] || {}) })
  const savedCounted = (id) => countedColumns(columnsDocs[String(id)], subjectColumns(id, quizzes, homeworks))

  // Khi đổi môn → nạp bản nháp
  useEffect(() => {
    if (!subject || !policies) return
    const p = savedPolicy(subject.id)
    setDraft({ ...p, weights: { ...p.weights }, attendance: { ...p.attendance }, practice: { ...p.practice } })
    setColDraft(savedCounted(subject.id))
  }, [sid, policies, columnsDocs])
  useEffect(() => { setMsg(null) }, [sid])   // chỉ xóa thông báo khi đổi môn (không xóa sau khi lưu)

  if (!subjects.length) return h('div', { className: 'container-fluid py-4 text-muted' }, 'Chưa có môn học.')
  if (!policies || !draft || !colDraft) return h('div', { className: 'text-center py-5' }, h('div', { className: 'spinner-border text-primary' }))

  const nCounted = Object.keys(colDraft).length
  const nOnline  = columns.filter(c => colDraft[c.key] != null && c.online).length
  const eff  = effectivePolicy(draft, nCounted)
  const errs = validatePolicy(draft, { nCounted, nOnlineCounted: nOnline, credits: subject.credits })
  const split = processFinalSplit(eff.weights)
  const preset = PRESETS[draft.preset] || PRESETS.L1
  const lim = LIMITS[preset.cat]
  const effN = Math.max(0, nCounted - eff.drop)

  const setD = (patch) => setDraft(d => ({ ...d, ...patch }))
  const setW = (k, v) => setDraft(d => ({ ...d, weights: { ...d.weights, [k]: v === '' ? '' : Number(v) } }))
  const setAtt = (patch) => setDraft(d => ({ ...d, attendance: { ...d.attendance, ...patch } }))
  const setPr = (patch) => setDraft(d => ({ ...d, practice: { ...d.practice, ...patch } }))

  const savePolicy = async () => {
    setBusy(true)
    try {
      const data = { preset: draft.preset, auto: !!draft.auto, weights: draft.auto ? eff.weights : draft.weights, dropLowest: draft.dropLowest,
        ckOnline: !!draft.ckOnline, attendance: draft.attendance, practice: draft.practice,
        updatedBy: user.name || user.email || '', updatedAt: new Date().toISOString() }
      await setDocument('gradingPolicies', subject.id, data, false)
      setMsg({ type: 'success', text: `Đã lưu quy chế điểm môn ${subject.name}.` }); await load()
    } catch (e) { setMsg({ type: 'danger', text: errorText(e) }) }
    setBusy(false)
  }
  const saveColumns = async () => {
    setBusy(true)
    try {
      await setDocument('gradingColumns', subject.id, { counted: colDraft, updatedBy: user.name || user.email || '', updatedAt: new Date().toISOString() }, false)
      setMsg({ type: 'success', text: 'Đã lưu các cột tính điểm bài tập.' }); await load()
    } catch (e) { setMsg({ type: 'danger', text: errorText(e) }) }
    setBusy(false)
  }
  const toggleCol = (key) => setColDraft(c => { const n = { ...c }; if (n[key] != null) delete n[key]; else n[key] = 1; return n })
  const setK = (key, k) => setColDraft(c => ({ ...c, [key]: Math.max(1, Math.min(5, Number(k) || 1)) }))
  const colsChanged = JSON.stringify(colDraft) !== JSON.stringify(savedCounted(subject.id))

  // Trạng thái hợp lệ từng môn (cho danh sách bên trái)
  const statusOf = (s) => {
    const cols = subjectColumns(s.id, quizzes, homeworks)
    const cnt = savedCounted(s.id)
    const e = validatePolicy(savedPolicy(s.id), { nCounted: Object.keys(cnt).length, nOnlineCounted: cols.filter(c => cnt[c.key] != null && c.online).length, credits: s.credits })
    return { ok: e.length === 0, configured: !!policies[String(s.id)] }
  }

  const numInput = (value, onChange, disabled, extra = {}) => h('input', { type: 'number', className: 'form-control form-control-sm', value, onChange: e => onChange(e.target.value), disabled, ...extra })

  return h('div', { className: 'container-fluid py-4' },
    h('div', { className: 'mb-3' },
      h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-percent me-2', style: { color: 'var(--primary)' } }), 'Quy chế tính điểm môn học'),
      h('small', { className: 'text-muted' },
        canPolicy ? 'Phòng Đào tạo cập nhật tỉ lệ; giáo viên quyết định cột bài tập nào tính điểm, các cột còn lại tính vào chuyên cần.'
        : role === 'teacher' ? 'Chọn cột bài tập tính điểm cho môn bạn dạy. Tỉ lệ do Phòng Đào tạo quy định và tự chuyển theo số bài.'
        : 'Công thức tính điểm các môn bạn đang học.')
    ),

    h('div', { className: 'row g-3' },
      // Danh sách môn
      h('div', { className: 'col-12 col-lg-3' },
        h('div', { className: 'list-group shadow-sm' }, subjects.map(s => {
          const st = statusOf(s)
          return h('button', { key: s.id, className: `list-group-item list-group-item-action d-flex align-items-center gap-2${s.id === sid ? ' active' : ''}`, onClick: () => setSid(s.id) },
            h('span', { className: 'mcal-dot', style: { background: s.color } }),
            h('span', { className: 'flex-grow-1 text-start small' }, s.name, h('div', { className: s.id === sid ? 'small' : 'small text-muted' }, `${s.code || ''} · ${s.credits || 0} TC`)),
            h('i', { className: `bi bi-${st.ok ? 'check-circle-fill' : 'exclamation-triangle-fill'}`, title: st.ok ? 'Hợp lệ' : 'Cấu hình chưa hợp lệ',
              style: { color: s.id === sid ? '#fff' : st.ok ? '#1cc88a' : '#f6c23e' } }))
        }))
      ),

      h('div', { className: 'col-12 col-lg-9 d-flex flex-column gap-3' },
        msg && h('div', { className: `alert alert-${msg.type} small py-2 mb-0` }, msg.text),

        // Tổng quan tỉ lệ đang áp dụng
        h('div', { className: 'card border-0 shadow-sm' },
          h('div', { className: 'card-body' },
            h('div', { className: 'd-flex flex-wrap justify-content-between gap-2 mb-3' },
              h('div', null, h('div', { className: 'fw-bold' }, subject.name),
                h('div', { className: 'small text-muted' }, `${preset.label} (${draft.preset}) · nhóm giới hạn: ${lim.label}`, draft.auto && ' · tỉ lệ tự động theo số bài')),
              h('div', { className: 'small text-end' }, 'Quá trình ', h('strong', null, `${split.qt}%`), ' – Cuối kỳ ', h('strong', null, `${split.ck}%`))),
            h(WeightBar, { w: eff.weights }),
            h('div', { className: 'small text-muted mt-3' },
              `Bài tập tính điểm: ${nCounted} cột`, eff.drop > 0 && ` (bỏ ${eff.drop} bài thấp nhất)`,
              effN > 0 && Number(eff.weights.bt) > 0 && ` · mỗi bài ≈ ${(eff.weights.bt / effN).toFixed(1)}% điểm môn`,
              ` · ${columns.length - nCounted} cột tính vào chuyên cần`),
            h('div', { className: 'small mt-2 font-monospace' },
              `Điểm môn = ${COMPONENTS.filter(k => +eff.weights[k] > 0).map(k => `${(eff.weights[k] / 100).toFixed(2)}×${k.toUpperCase()}`).join(' + ')}`,
              eff.practice?.enabled && ` ; gộp TH: (LT×${eff.practice.theoryCredits} + TH×${eff.practice.practiceCredits}) / ${(+eff.practice.theoryCredits) + (+eff.practice.practiceCredits)}`),
            errs.length > 0
              ? h('div', { className: 'alert alert-warning small py-2 mt-3 mb-0' }, h('strong', null, 'Cấu hình chưa hợp lệ:'), h('ul', { className: 'mb-0 ps-3' }, errs.map((e, i) => h('li', { key: i }, e))))
              : h('div', { className: 'small text-success mt-3' }, h('i', { className: 'bi bi-check-circle-fill me-1' }), 'Cấu hình hợp lệ theo quy chế.')
          )
        ),

        // Phòng Đào tạo: chỉnh tỉ lệ
        canPolicy && h('div', { className: 'card border-0 shadow-sm' },
          h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 fw-bold' }, h('i', { className: 'bi bi-sliders me-2 text-primary' }), 'Tỉ lệ điểm (Phòng Đào tạo)'),
          h('div', { className: 'card-body pt-0 px-4' },
            h('div', { className: 'row g-3' },
              h('div', { className: 'col-12 col-md-6' }, h('label', { className: 'form-label small fw-semibold' }, 'Loại môn'),
                h('select', { className: 'form-select form-select-sm', value: draft.preset, onChange: e => {
                  const p = PRESETS[e.target.value]; setD({ preset: e.target.value, weights: { cc: p.cc, bt: p.bt, gk: p.gk, ck: p.ck } }) } },
                  Object.entries(PRESETS).map(([k, p]) => h('option', { key: k, value: k }, `${k} – ${p.label} (${p.cc}/${p.bt}/${p.gk}/${p.ck})`)))),
              h('div', { className: 'col-12 col-md-6 d-flex align-items-end' },
                h('div', { className: 'form-check form-switch' },
                  h('input', { className: 'form-check-input', type: 'checkbox', id: 'gp-auto', checked: !!draft.auto, onChange: e => setD({ auto: e.target.checked }) }),
                  h('label', { className: 'form-check-label small', htmlFor: 'gp-auto' }, 'Tự động chuyển tỉ lệ theo số bài tập được giao'))),
              COMPONENTS.map(k => h('div', { key: k, className: 'col-6 col-md-3' },
                h('label', { className: 'form-label small fw-semibold' }, `${COMPONENT_LABEL[k]} (%)`),
                numInput(draft.auto ? eff.weights[k] : draft.weights[k], v => setW(k, v), !!draft.auto, { min: 0, max: 100 }),
                h('div', { className: 'form-text' }, `Giới hạn ${lim[k][0]}–${lim[k][1]}%`))),
              h('div', { className: 'col-6 col-md-3' }, h('label', { className: 'form-label small fw-semibold' }, 'Bỏ bài thấp nhất'),
                h('select', { className: 'form-select form-select-sm', value: String(draft.dropLowest), onChange: e => setD({ dropLowest: e.target.value === 'auto' ? 'auto' : Number(e.target.value) }) },
                  h('option', { value: 'auto' }, 'Tự động theo số bài'), [0, 1, 2].map(n => h('option', { key: n, value: n }, `${n} bài`)))),
              h('div', { className: 'col-6 col-md-3 d-flex align-items-end' },
                h('div', { className: 'form-check' },
                  h('input', { className: 'form-check-input', type: 'checkbox', id: 'gp-ckon', checked: !!draft.ckOnline, onChange: e => setD({ ckOnline: e.target.checked }) }),
                  h('label', { className: 'form-check-label small', htmlFor: 'gp-ckon' }, 'Thi cuối kỳ trực tuyến'))),
              draft.auto && h('div', { className: 'col-12 small text-muted' },
                `Gợi ý theo số bài (mục 4): ${nCounted} bài → bài tập ${suggestBtWeight(nCounted, preset.cat)}%`, eff.weights.bt !== suggestBtWeight(nCounted, preset.cat) && ` (đã ép vào giới hạn còn ${eff.weights.bt}%)`, '; phần còn lại chia cho chuyên cần, giữa kỳ, cuối kỳ theo tỉ lệ của loại môn.')
            ),

            h('hr'),
            h('div', { className: 'fw-semibold small mb-2' }, 'Cách tính chuyên cần (mục 5)'),
            h('div', { className: 'row g-3' },
              h('div', { className: 'col-12 col-md-4' }, h('select', { className: 'form-select form-select-sm', value: draft.attendance.method, onChange: e => setAtt({ method: e.target.value }) },
                h('option', { value: 'score' }, 'Giáo viên nhập điểm điểm danh'),
                h('option', { value: 'ratio' }, 'Cách 1 – theo tỉ lệ buổi có mặt'),
                h('option', { value: 'penalty' }, 'Cách 2 – trừ điểm theo vi phạm'))),
              draft.attendance.method === 'ratio' && h('div', { className: 'col-6 col-md-2' }, h('label', { className: 'form-label small' }, 'Tổng số buổi'),
                numInput(draft.attendance.sessions, v => setAtt({ sessions: Number(v) }), false, { min: 1 })),
              draft.attendance.method === 'penalty' && ['a', 'b', 'c'].map((k, i) => h('div', { key: k, className: 'col-4 col-md-2' },
                h('label', { className: 'form-label small' }, ['Vắng không phép', 'Vắng có phép', 'Đi muộn'][i]),
                numInput(draft.attendance[k], v => setAtt({ [k]: Number(v) }), false, { step: 0.25, min: 0 }))),
              h('div', { className: 'col-6 col-md-2' }, h('label', { className: 'form-label small' }, 'Điểm tham gia (%)'),
                numInput(draft.attendance.participation, v => setAtt({ participation: Number(v) }), false, { min: 0, max: 100 })),
              h('div', { className: 'col-12 form-text mt-0' }, 'Điểm tham gia = tỉ lệ cột bài tập không tính điểm mà sinh viên đã làm × 10; ĐCC = (100% − tham gia) × điểm danh + tham gia × điểm tham gia (cách 3).')
            ),

            h('hr'),
            h('div', { className: 'form-check form-switch mb-2' },
              h('input', { className: 'form-check-input', type: 'checkbox', id: 'gp-pr', checked: !!draft.practice.enabled, onChange: e => setPr({ enabled: e.target.checked }) }),
              h('label', { className: 'form-check-label small fw-semibold', htmlFor: 'gp-pr' }, 'Môn có cả lý thuyết và thực hành (mục 2.3: gộp theo số tín chỉ)')),
            draft.practice.enabled && h('div', { className: 'row g-3' },
              h('div', { className: 'col-6 col-md-3' }, h('label', { className: 'form-label small' }, 'TC lý thuyết'), numInput(draft.practice.theoryCredits, v => setPr({ theoryCredits: Number(v) }), false, { min: 0 })),
              h('div', { className: 'col-6 col-md-3' }, h('label', { className: 'form-label small' }, 'TC thực hành'), numInput(draft.practice.practiceCredits, v => setPr({ practiceCredits: Number(v) }), false, { min: 0 }))),

            h('div', { className: 'd-flex justify-content-end mt-3' },
              h('button', { className: 'btn btn-primary btn-sm', disabled: busy || errs.length > 0, onClick: savePolicy,
                title: errs.length ? 'Cấu hình vi phạm quy chế – không lưu được' : '' }, h('i', { className: 'bi bi-save me-1' }), 'Lưu tỉ lệ'))
          )
        ),

        // Giáo viên: chọn cột tính điểm
        h('div', { className: 'card border-0 shadow-sm' },
          h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 d-flex justify-content-between align-items-center' },
            h('span', { className: 'fw-bold' }, h('i', { className: 'bi bi-table me-2 text-success' }), 'Cột bài tập tính điểm'),
            !canColumnsFor(subject.id) && h('span', { className: 'small text-muted' }, 'Giáo viên dạy môn quyết định')),
          h('div', { className: 'table-responsive' },
            h('table', { className: 'table table-sm align-middle mb-0' },
              h('thead', null, h('tr', null, ['Cột', 'Loại', 'Tính vào', 'Hệ số'].map(t => h('th', { key: t, className: 'small text-muted' }, t)))),
              h('tbody', null,
                columns.length === 0 && h('tr', null, h('td', { colSpan: 4, className: 'text-center text-muted small py-3' }, 'Môn này chưa có bài tập / trắc nghiệm nào.')),
                columns.map(c => {
                  const on = colDraft[c.key] != null, editable = canColumnsFor(subject.id)
                  return h('tr', { key: c.key },
                    h('td', { className: 'small fw-semibold' }, c.title),
                    h('td', { className: 'small' }, c.kind === 'quiz' ? 'Trắc nghiệm' : 'Bài tập', c.online && h('span', { className: 'badge bg-info-subtle text-info ms-1' }, 'trực tuyến')),
                    h('td', null, h('div', { className: 'btn-group btn-group-sm' },
                      h('button', { className: `btn ${on ? 'btn-primary' : 'btn-outline-primary'}`, disabled: !editable, onClick: () => !on && toggleCol(c.key) }, 'Điểm BT'),
                      h('button', { className: `btn ${!on ? 'btn-info text-white' : 'btn-outline-info'}`, disabled: !editable, onClick: () => on && toggleCol(c.key) }, 'Chuyên cần'))),
                    h('td', { style: { width: 90 } }, on ? numInput(colDraft[c.key], v => setK(c.key, v), !editable, { min: 1, max: 5 }) : h('span', { className: 'text-muted small' }, '—'))
                  )
                })
              )
            )
          ),
          canColumnsFor(subject.id) && h('div', { className: 'card-body d-flex justify-content-between align-items-center flex-wrap gap-2' },
            h('span', { className: 'small text-muted' }, !columnsDocs[String(subject.id)] && 'Chưa chọn: hiện đang tính tất cả các cột. ', 'Tỉ lệ tự chuyển ngay khi đổi số cột.'),
            h('button', { className: 'btn btn-success btn-sm', disabled: busy || !colsChanged && !!columnsDocs[String(subject.id)] || errs.length > 0, onClick: saveColumns,
              title: errs.length ? 'Lựa chọn này làm cấu hình vi phạm quy chế' : '' }, h('i', { className: 'bi bi-save me-1' }), 'Lưu cột tính điểm'))
        )
      )
    )
  )
}
