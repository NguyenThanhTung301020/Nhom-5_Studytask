// components/GradeBook.js – Bảng điểm sinh viên (Admin & Giáo viên)
// Nhập điểm trắc nghiệm, bài tập, chuyên cần, giữa kỳ, cuối kỳ → tính điểm môn theo quy chế của từng môn
// (tỉ lệ do Phòng Đào tạo quy định, cột tính điểm do giáo viên chọn – xem pages/GradingPolicy.js). Xuất CSV.
import { isFirebaseReady, loadSharedData, saveSharedKey } from '../utils/firebase.js'
import { load, save } from '../utils/helpers.js'
import { listDocuments } from '../utils/store.js'
import { COMPONENT_LABEL, defaultPolicy, subjectColumns, countedColumns, evaluateStudentSubject, round1 } from '../utils/grading.js'

const { useState, useEffect, useMemo, createElement: h } = window.React

const clamp = (v) => Math.max(0, Math.min(10, Number(v)))
const scoreColor = (s) => s == null ? '#858796' : s >= 8 ? '#1cc88a' : s >= 6.5 ? '#e67e22' : s >= 5 ? '#f6c23e' : '#e74a3b'
const avgOf = (nums) => nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length) : null

function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export default function GradeBook({ subjects = [], allUsers = [], quizzes = [], homeworks = [], fetchActivities }) {
  const [activities, setActivities] = useState(null)
  const [grades,     setGrades]     = useState({})   // { uid: { sid: { quiz:{qid:s}, hw:{hwId:s}, att:n } } }
  const [studentUid, setStudentUid] = useState(null)
  const [dirty,      setDirty]      = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [policies,   setPolicies]   = useState({})   // { sid: policy }   – gradingPolicies
  const [colDocs,    setColDocs]    = useState({})   // { sid: {counted} } – gradingColumns
  const fb = isFirebaseReady()

  // Sinh viên có đăng ký ít nhất 1 môn trong phạm vi đang xem
  const subjectIds = useMemo(() => new Set(subjects.map(s => s.id)), [subjects])
  const students = useMemo(() =>
    allUsers.filter(u => u.role === 'student' &&
      (!Array.isArray(u.subjectIds) || u.subjectIds.length === 0 || u.subjectIds.some(id => subjectIds.has(id)))),
    [allUsers, subjectIds])

  useEffect(() => {
    let alive = true
    Promise.resolve(fetchActivities ? fetchActivities() : []).then(list => { if (alive) setActivities(list || []) })
    ;(async () => {
      const g = fb ? ((await loadSharedData())?.grades || {}) : load('st_grades', {})
      if (alive) setGrades(g)
      try {
        const [ps, cs] = await Promise.all([listDocuments('gradingPolicies'), listDocuments('gradingColumns')])
        if (alive) { setPolicies(Object.fromEntries(ps.map(p => [p.id, p]))); setColDocs(Object.fromEntries(cs.map(c => [c.id, c]))) }
      } catch (e) { console.warn('[GradeBook] quy chế điểm:', e.message) }
    })()
    return () => { alive = false }
  }, [fetchActivities])

  useEffect(() => {
    if (students.length && !students.find(s => s.uid === studentUid)) setStudentUid(students[0].uid)
  }, [students, studentUid])

  const student = students.find(s => s.uid === studentUid) || null

  // ── Truy cập điểm ──
  const cell = (uid, sid) => grades?.[uid]?.[sid] || {}
  const actQuiz = (uid, sid, qid) => {
    const evs = (activities?.find(a => a.uid === uid)?.events || [])
      .filter(e => e.type === 'quiz' && e.subjectId === sid && e.refId === qid)
    return evs.length ? evs.slice(-1)[0].score : null
  }
  const effQuiz = (uid, sid, qid) => { const o = cell(uid, sid).quiz?.[qid]; return o !== undefined ? o : actQuiz(uid, sid, qid) }
  const hwGrade = (uid, sid, hwId) => cell(uid, sid).hw?.[hwId]
  const attendance = (uid, sid) => cell(uid, sid).att
  const hwSubOf = (uid, sid, hwId) => {
    const evs = (activities?.find(a => a.uid === uid)?.events || [])
      .filter(e => e.type === 'homework' && e.subjectId === sid && e.refId === hwId)
    return evs.length ? evs.slice(-1)[0] : null
  }

  const setGrade = (uid, sid, kind, key, value) => {
    setGrades(g => {
      const ng = { ...g }
      ng[uid] = { ...(ng[uid] || {}) }
      const c = { ...(ng[uid][sid] || {}) }
      if (kind === 'att') {
        if (value === '' || value == null) delete c.att; else c.att = clamp(value)
      } else if (kind === 'gk' || kind === 'ck' || kind === 'th') {
        if (value === '' || value == null) delete c[kind]; else c[kind] = clamp(value)
      } else if (kind === 'attData') {          // dữ liệu điểm danh theo phương pháp của môn (số buổi, số lần vắng…)
        c.attData = { ...(c.attData || {}) }
        if (key === 'score') { if (value === '' || value == null) delete c.att; else c.att = clamp(value) }   // giữ trường att cũ đồng bộ
        if (value === '' || value == null) delete c.attData[key]; else c.attData[key] = key === 'score' ? clamp(value) : Math.max(0, Number(value))
      } else {
        c[kind] = { ...(c[kind] || {}) }
        if (value === '' || value == null) delete c[kind][key]; else c[kind][key] = clamp(value)
      }
      ng[uid][sid] = c
      return ng
    })
    setDirty(true)
  }

  const persist = async () => {
    setSaving(true)
    try {
      if (fb) await saveSharedKey('grades', grades)
      else save('st_grades', grades)
      setDirty(false)
    } catch (e) { alert('Lưu điểm lỗi: ' + e.message) }
    setSaving(false)
  }

  const studentSubjects = (s) => {
    if (!s) return []
    const ids = Array.isArray(s.subjectIds) && s.subjectIds.length ? s.subjectIds : subjects.map(x => x.id)
    return subjects.filter(x => ids.includes(x.id))
  }

  // ── Tính điểm môn theo quy chế ──
  const policyOf = (sub) => ({ ...defaultPolicy(sub), ...(policies[String(sub.id)] || {}) })
  const evalOf = (uid, sub) => {
    const columns = subjectColumns(sub.id, quizzes, homeworks)
    const colScore = (key) => { const [t, id] = key.split(':'); return t === 'q' ? effQuiz(uid, sub.id, Number(id)) : hwGrade(uid, sub.id, Number(id)) ?? null }
    const colDone  = (key) => { const [t, id] = key.split(':'); return t === 'q' ? actQuiz(uid, sub.id, Number(id)) != null : !!hwSubOf(uid, sub.id, Number(id)) || hwGrade(uid, sub.id, Number(id)) != null }
    return evaluateStudentSubject({ policy: policyOf(sub), columns, counted: countedColumns(colDocs[String(sub.id)], columns), colScore, colDone, cell: cell(uid, sub.id) })
  }
  // Điểm môn: chính thức nếu đủ thành phần, nếu chưa đủ thì tạm tính
  const subjectAvg = (uid, sub) => { const r = evalOf(uid, sub).result; return r.final ?? r.provisional }

  // ── Xuất CSV ──
  const fmt = (v) => v == null ? '' : round1(v)
  const studentRows = (s) => {
    const rows = []
    studentSubjects(s).forEach(sub => {
      const ev = evalOf(s.uid, sub)
      const w = ev.eff.weights
      quizzes.filter(q => q.subjectId === sub.id).forEach(q => { const v = effQuiz(s.uid, sub.id, q.id); rows.push([s.name, s.email, sub.name, 'Trắc nghiệm', q.title, v == null ? '' : v, '']) })
      homeworks.filter(hw => hw.subjectId === sub.id).forEach(hw => { const v = hwGrade(s.uid, sub.id, hw.id); rows.push([s.name, s.email, sub.name, 'Bài tập', hw.title, v == null ? '' : v, '']) })
      ;['cc', 'bt', 'gk', 'ck'].filter(k => +w[k] > 0).forEach(k => rows.push([s.name, s.email, sub.name, COMPONENT_LABEL[k], '', fmt(ev.scores[k]), `${w[k]}%`]))
      if (ev.eff.practice?.enabled) rows.push([s.name, s.email, sub.name, 'Điểm thực hành', '', fmt(ev.scores.th), `${ev.eff.practice.practiceCredits} TC`])
      rows.push([s.name, s.email, sub.name, ev.result.final != null ? 'ĐIỂM MÔN' : 'ĐIỂM MÔN (tạm tính)', '', fmt(ev.result.final ?? ev.result.provisional), ''])
    })
    return rows
  }
  const HEAD = ['Họ tên', 'Email', 'Môn học', 'Hạng mục', 'Tên', 'Điểm (hệ 10)', 'Trọng số']
  const exportStudent = (s) => downloadCSV(`bang-diem-${(s.name || s.email).replace(/\s+/g, '-')}.csv`, [HEAD, ...studentRows(s)])
  const exportAll = () => { const body = []; students.forEach(s => body.push(...studentRows(s))); downloadCSV('bang-diem-tat-ca-sinh-vien.csv', [HEAD, ...body]) }

  if (activities === null) return h('div', { className: 'text-center py-4' },
    h('div', { className: 'spinner-border spinner-border-sm text-primary me-2' }),
    h('span', { className: 'text-muted small' }, 'Đang tải bảng điểm…')
  )
  if (students.length === 0) return h('div', { className: 'text-center text-muted py-5' },
    h('i', { className: 'bi bi-people fs-1 d-block mb-2 opacity-25' }), 'Chưa có sinh viên nào trong phạm vi quản lý.'
  )

  const overall = student ? avgOf(studentSubjects(student).map(sub => subjectAvg(student.uid, sub)).filter(v => v != null)) : null

  // ── Ô nhập điểm tái dùng ──
  const scoreInput = (value, onChange, placeholder = '—') =>
    h('input', { type: 'number', className: 'form-control form-control-sm text-center mx-auto', style: { width: 84 },
      min: 0, max: 10, step: 0.1, placeholder, value: value == null ? '' : value, onChange })

  return h('div', null,
    h('div', { className: 'd-flex justify-content-between align-items-center flex-wrap gap-2 mb-3' },
      h('div', { className: 'd-flex align-items-center gap-2' },
        h('span', { className: 'fw-semibold small text-muted' }, 'Sinh viên:'),
        h('select', { className: 'form-select form-select-sm', style: { width: 'auto', minWidth: 220 }, value: studentUid ?? '', onChange: e => setStudentUid(e.target.value) },
          students.map(s => h('option', { key: s.uid, value: s.uid }, `${s.name || s.email}`))
        )
      ),
      h('div', { className: 'd-flex gap-2' },
        dirty && h('button', { className: 'btn btn-sm btn-success', disabled: saving, onClick: persist },
          saving ? h(window.React.Fragment, null, h('span', { className: 'spinner-border spinner-border-sm me-1' }), 'Đang lưu…')
                 : h(window.React.Fragment, null, h('i', { className: 'bi bi-cloud-upload me-1' }), 'Lưu điểm')
        ),
        student && h('button', { className: 'btn btn-sm btn-outline-primary', onClick: () => exportStudent(student) },
          h('i', { className: 'bi bi-download me-1' }), 'Xuất bảng điểm SV này'
        ),
        h('button', { className: 'btn btn-sm btn-outline-secondary', onClick: exportAll },
          h('i', { className: 'bi bi-file-earmark-spreadsheet me-1' }), 'Xuất tất cả'
        )
      )
    ),

    !fb && h('div', { className: 'alert alert-warning small py-2' },
      h('i', { className: 'bi bi-exclamation-triangle me-1' }), 'Chế độ demo: điểm chỉnh sửa lưu tạm trên trình duyệt này. Kết nối Firebase để đồng bộ thật.'
    ),

    student && h('div', { className: 'card border-0 shadow-sm mb-3' },
      h('div', { className: 'card-body d-flex align-items-center justify-content-between flex-wrap gap-2' },
        h('div', null,
          h('div', { className: 'fw-bold fs-5' }, student.name || student.email),
          h('div', { className: 'small text-muted' }, student.email)
        ),
        h('div', { className: 'text-center' },
          h('div', { className: 'fw-bold', style: { fontSize: '1.8rem', color: scoreColor(overall) } }, overall == null ? '—' : overall.toFixed(2)),
          h('div', { className: 'small text-muted' }, 'Điểm TB tất cả môn')
        )
      )
    ),

    // ── Bảng điểm theo từng môn ──
    studentSubjects(student).map(sub => {
      const qs  = quizzes.filter(q => q.subjectId === sub.id)
      const hws = homeworks.filter(hw => hw.subjectId === sub.id)
      const ev  = evalOf(student.uid, sub)
      const avg = ev.result.final ?? ev.result.provisional
      const w   = ev.eff.weights
      const am  = ev.eff.attendance || {}
      const ad  = cell(student.uid, sub.id).attData || {}
      const counted = countedColumns(colDocs[String(sub.id)], subjectColumns(sub.id, quizzes, homeworks))
      const useBadge = (key) => counted[key] != null
        ? h('span', { className: 'badge bg-primary-subtle text-primary ms-2', style: { fontSize: '0.6rem' } }, `Điểm BT${counted[key] > 1 ? ' ×' + counted[key] : ''}`)
        : h('span', { className: 'badge bg-info-subtle text-info ms-2', style: { fontSize: '0.6rem' } }, 'Chuyên cần')
      const comp = (k, label) => h('div', { className: 'col-6 col-md-3' },
        h('div', { className: 'small text-muted' }, label || COMPONENT_LABEL[k], ` (${w[k]}%)`),
        h('div', { className: 'fw-bold', style: { color: scoreColor(ev.scores[k]) } }, ev.scores[k] == null ? '—' : round1(ev.scores[k])))
      return h('div', { key: sub.id, className: 'card border-0 shadow-sm mb-3' },
        h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 d-flex justify-content-between align-items-center' },
          h('h6', { className: 'fw-bold mb-0' },
            h('span', { style: { display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: sub.color, marginRight: 8 } }), sub.name),
          avg != null && h('span', { className: 'badge', style: { backgroundColor: scoreColor(avg) + '22', color: scoreColor(avg) } },
            ev.result.final != null ? `Điểm môn: ${avg.toFixed(1)}` : `Tạm tính: ${avg.toFixed(1)}`)
        ),
        h('div', { className: 'card-body pt-2 px-4 pb-3' },

          // Trắc nghiệm
          h('div', { className: 'gradebook-section-title' }, h('i', { className: 'bi bi-patch-question me-1 text-warning' }), 'Trắc nghiệm'),
          qs.length === 0
            ? h('div', { className: 'text-muted small mb-2' }, 'Chưa có bài trắc nghiệm.')
            : h('div', { className: 'table-responsive mb-3' },
                h('table', { className: 'table table-sm align-middle mb-0' },
                  h('thead', null, h('tr', null,
                    h('th', { className: 'small text-muted' }, 'Bài'),
                    h('th', { className: 'small text-muted text-center', style: { width: 110 } }, 'Điểm gốc'),
                    h('th', { className: 'small text-muted text-center', style: { width: 110 } }, 'Điểm')
                  )),
                  h('tbody', null,
                    qs.map(q => {
                      const orig = actQuiz(student.uid, sub.id, q.id)
                      const eff  = effQuiz(student.uid, sub.id, q.id)
                      const overridden = cell(student.uid, sub.id).quiz?.[q.id] !== undefined
                      return h('tr', { key: q.id },
                        h('td', null, h('span', { className: 'small fw-semibold' }, q.title), useBadge(`q:${q.id}`),
                          overridden && h('span', { className: 'badge bg-warning-subtle text-warning ms-2', style: { fontSize: '0.6rem' } }, 'Đã sửa')),
                        h('td', { className: 'text-center' }, orig == null ? h('span', { className: 'text-muted small' }, 'Chưa làm') : h('span', { className: 'fw-semibold', style: { color: scoreColor(orig) } }, orig)),
                        h('td', { className: 'text-center' }, scoreInput(eff, e => setGrade(student.uid, sub.id, 'quiz', q.id, e.target.value)))
                      )
                    })
                  )
                )
              ),

          // Bài tập đã nộp
          h('div', { className: 'gradebook-section-title' }, h('i', { className: 'bi bi-journal-check me-1 text-success' }), 'Bài tập'),
          hws.length === 0
            ? h('div', { className: 'text-muted small mb-2' }, 'Chưa có bài tập.')
            : h('div', { className: 'table-responsive mb-3' },
                h('table', { className: 'table table-sm align-middle mb-0' },
                  h('thead', null, h('tr', null,
                    h('th', { className: 'small text-muted' }, 'Bài tập'),
                    h('th', { className: 'small text-muted text-center', style: { width: 150 } }, 'Bài nộp'),
                    h('th', { className: 'small text-muted text-center', style: { width: 110 } }, 'Điểm')
                  )),
                  h('tbody', null,
                    hws.map(hw => {
                      const subInfo = hwSubOf(student.uid, sub.id, hw.id)
                      return h('tr', { key: hw.id },
                        h('td', null, h('span', { className: 'small fw-semibold' }, hw.title), useBadge(`hw:${hw.id}`)),
                        h('td', { className: 'text-center' },
                          subInfo
                            ? (subInfo.url
                                ? h('a', { href: subInfo.url, target: '_blank', rel: 'noopener noreferrer', className: 'btn btn-sm btn-outline-primary py-0' }, h('i', { className: 'bi bi-box-arrow-up-right me-1' }), 'Xem bài')
                                : h('span', { className: 'badge bg-success-subtle text-success' }, 'Đã nộp'))
                            : h('span', { className: 'text-muted small' }, 'Chưa nộp')
                        ),
                        h('td', { className: 'text-center' }, scoreInput(hwGrade(student.uid, sub.id, hw.id), e => setGrade(student.uid, sub.id, 'hw', hw.id, e.target.value)))
                      )
                    })
                  )
                )
              ),

          // Chuyên cần, giữa kỳ, cuối kỳ, thực hành (giáo viên nhập)
          h('div', { className: 'gradebook-section-title' }, h('i', { className: 'bi bi-person-check me-1', style: { color: 'var(--primary)' } }), 'Điểm danh & điểm thi'),
          h('div', { className: 'd-flex flex-wrap gap-3 align-items-end p-2 rounded-3 mb-3', style: { background: 'rgba(78,115,223,.05)' } },
            am.method === 'ratio'
              ? h('div', null, h('div', { className: 'small text-muted' }, `Số buổi có mặt / ${am.sessions || 0}`),
                  h('input', { type: 'number', min: 0, max: am.sessions || 99, className: 'form-control form-control-sm text-center', style: { width: 84 },
                    value: ad.present ?? '', onChange: e => setGrade(student.uid, sub.id, 'attData', 'present', e.target.value) }))
              : am.method === 'penalty'
                ? [['unexcused', 'Vắng KP'], ['excused', 'Vắng CP'], ['late', 'Đi muộn']].map(([k, l]) => h('div', { key: k },
                    h('div', { className: 'small text-muted' }, l),
                    h('input', { type: 'number', min: 0, className: 'form-control form-control-sm text-center', style: { width: 72 },
                      value: ad[k] ?? '', onChange: e => setGrade(student.uid, sub.id, 'attData', k, e.target.value) })))
                : h('div', null, h('div', { className: 'small text-muted' }, 'Điểm danh'),
                    scoreInput(ad.score ?? attendance(student.uid, sub.id), e => setGrade(student.uid, sub.id, 'attData', 'score', e.target.value))),
            +w.gk > 0 && h('div', null, h('div', { className: 'small text-muted' }, `Giữa kỳ (${w.gk}%)`), scoreInput(cell(student.uid, sub.id).gk, e => setGrade(student.uid, sub.id, 'gk', null, e.target.value))),
            h('div', null, h('div', { className: 'small text-muted' }, `Cuối kỳ (${w.ck}%)`), scoreInput(cell(student.uid, sub.id).ck, e => setGrade(student.uid, sub.id, 'ck', null, e.target.value))),
            ev.eff.practice?.enabled && h('div', null, h('div', { className: 'small text-muted' }, `Thực hành (${ev.eff.practice.practiceCredits} TC)`),
              scoreInput(cell(student.uid, sub.id).th, e => setGrade(student.uid, sub.id, 'th', null, e.target.value)))
          ),

          // Tổng hợp theo quy chế
          h('div', { className: 'row g-2 p-2 rounded-3 align-items-center', style: { background: 'rgba(0,0,0,.03)' } },
            comp('cc'), comp('bt'), +w.gk > 0 ? comp('gk') : null, comp('ck'),
            h('div', { className: 'col-12 small text-muted' },
              ev.participation != null && `Chuyên cần gồm ${am.participation || 0}% điểm tham gia (${round1(ev.participation)}) từ ${ev.uncountedCols.length} cột không tính điểm. `,
              ev.eff.drop > 0 && `Bỏ ${ev.eff.drop} bài tập thấp nhất. `,
              ev.result.final == null && ev.result.missing.length > 0 && h('span', { className: 'text-warning' },
                'Chưa đủ điểm: ', ev.result.missing.map(k => k === 'th' ? 'Thực hành' : COMPONENT_LABEL[k]).join(', '), ' – đang hiển thị điểm tạm tính.'))
          )
        )
      )
    })
  )
}
