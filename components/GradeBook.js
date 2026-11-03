// components/GradeBook.js – Bảng điểm sinh viên (Admin & Giáo viên)
// Nhập điểm trắc nghiệm + bài tập đã nộp + chuyên cần → tính trung bình từng môn. Xuất CSV.
import { isFirebaseReady, loadSharedData, saveSharedKey } from '../utils/firebase.js'
import { load, save } from '../utils/helpers.js'

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

  // Các điểm thành phần của 1 môn (cho 1 SV)
  const subjectComponents = (uid, sub) => {
    const arr = []
    quizzes.filter(q => q.subjectId === sub.id).forEach(q => { const v = effQuiz(uid, sub.id, q.id); if (v != null) arr.push(v) })
    homeworks.filter(hw => hw.subjectId === sub.id).forEach(hw => { const v = hwGrade(uid, sub.id, hw.id); if (v != null) arr.push(v) })
    const att = attendance(uid, sub.id); if (att != null) arr.push(att)
    return arr
  }
  const subjectAvg = (uid, sub) => avgOf(subjectComponents(uid, sub))

  // ── Xuất CSV ──
  const studentRows = (s) => {
    const rows = []
    studentSubjects(s).forEach(sub => {
      quizzes.filter(q => q.subjectId === sub.id).forEach(q => { const v = effQuiz(s.uid, sub.id, q.id); rows.push([s.name, s.email, sub.name, 'Trắc nghiệm', q.title, v == null ? '' : v]) })
      homeworks.filter(hw => hw.subjectId === sub.id).forEach(hw => { const v = hwGrade(s.uid, sub.id, hw.id); rows.push([s.name, s.email, sub.name, 'Bài tập', hw.title, v == null ? '' : v]) })
      const att = attendance(s.uid, sub.id); rows.push([s.name, s.email, sub.name, 'Chuyên cần', '', att == null ? '' : att])
      const a = subjectAvg(s.uid, sub); rows.push([s.name, s.email, sub.name, 'TRUNG BÌNH MÔN', '', a == null ? '' : a.toFixed(2)])
    })
    return rows
  }
  const HEAD = ['Họ tên', 'Email', 'Môn học', 'Hạng mục', 'Tên', 'Điểm (hệ 10)']
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
      const avg = subjectAvg(student.uid, sub)
      const att = attendance(student.uid, sub.id)
      return h('div', { key: sub.id, className: 'card border-0 shadow-sm mb-3' },
        h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 d-flex justify-content-between align-items-center' },
          h('h6', { className: 'fw-bold mb-0' },
            h('span', { style: { display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: sub.color, marginRight: 8 } }), sub.name),
          avg != null && h('span', { className: 'badge', style: { backgroundColor: scoreColor(avg) + '22', color: scoreColor(avg) } }, `TB môn: ${avg.toFixed(1)}`)
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
                        h('td', null, h('span', { className: 'small fw-semibold' }, q.title),
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
                        h('td', null, h('span', { className: 'small fw-semibold' }, hw.title)),
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

          // Chuyên cần
          h('div', { className: 'd-flex align-items-center justify-content-between p-2 rounded-3', style: { background: 'rgba(78,115,223,.05)' } },
            h('span', { className: 'fw-semibold small' }, h('i', { className: 'bi bi-person-check me-1', style: { color: 'var(--primary)' } }), 'Điểm chuyên cần (giáo viên nhập)'),
            scoreInput(att, e => setGrade(student.uid, sub.id, 'att', null, e.target.value))
          )
        )
      )
    })
  )
}
