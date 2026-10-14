// pages/Reports.js – Quản lý lớp học (Admin & Giáo viên)
// Admin xem tất cả môn; Giáo viên xem các môn được phân công (subjects đã được lọc sẵn ở app.js)
import { formatDate } from '../utils/helpers.js'
import GradeBook from '../components/GradeBook.js'

const { useState, useEffect, useMemo, createElement: h } = window.React

const initials = (name) => (name || '?').trim().split(' ').slice(-1)[0].charAt(0).toUpperCase()
const scoreColor = (s) => s >= 8 ? '#1cc88a' : s >= 6.5 ? '#e67e22' : s >= 5 ? '#f6c23e' : '#e74a3b'

// Vòng tròn tỉ lệ %
function PctRing({ pct, color, label, sub }) {
  return h('div', { className: 'report-metric card border-0 shadow-sm' },
    h('div', { className: 'card-body d-flex align-items-center gap-3' },
      h('div', { className: 'report-ring', style: { background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(0,0,0,.06) 0deg)` } },
        h('div', { className: 'report-ring-inner' }, h('span', { style: { color } }, `${pct}%`))
      ),
      h('div', { className: 'min-w-0' },
        h('div', { className: 'fw-bold' }, label),
        h('div', { className: 'small text-muted' }, sub)
      )
    )
  )
}

export default function Reports({ subjects = [], quizzes = [], materials = [], homeworks = [], allUsers = [], user, fetchActivities }) {
  const [activities, setActivities] = useState(null)   // null = đang tải
  const [subId,  setSubId]  = useState(subjects[0]?.id ?? null)
  const [tab,    setTab]    = useState('students')
  const [view,   setView]   = useState('theodoi')   // 'theodoi' | 'bangdiem'

  useEffect(() => {
    let alive = true
    Promise.resolve(fetchActivities ? fetchActivities() : []).then(list => { if (alive) setActivities(list || []) })
    return () => { alive = false }
  }, [fetchActivities])

  // Đảm bảo subId hợp lệ
  useEffect(() => {
    if (subjects.length && !subjects.find(s => s.id === subId)) setSubId(subjects[0].id)
  }, [subjects, subId])

  const subject = subjects.find(s => s.id === subId) || null

  // ── Tính toán dữ liệu cho môn đang chọn ──
  const data = useMemo(() => {
    if (!subject || !activities) return null
    const sid = subject.id

    // Roster: SV được phân công môn + SV có hoạt động trong môn
    const map = new Map()
    allUsers.filter(u => u.role === 'student' && Array.isArray(u.subjectIds) && u.subjectIds.includes(sid))
      .forEach(u => map.set(u.uid, { uid: u.uid, name: u.name || u.email, email: u.email || '' }))
    activities.forEach(a => {
      if ((a.events || []).some(e => e.subjectId === sid) && !map.has(a.uid))
        map.set(a.uid, { uid: a.uid, name: a.name || a.email || a.uid, email: a.email || '' })
    })
    const roster = Array.from(map.values())

    const eventsOf = (uid) => (activities.find(a => a.uid === uid)?.events || []).filter(e => e.subjectId === sid)

    // Thống kê theo từng sinh viên
    const students = roster.map(s => {
      const evs = eventsOf(s.uid)
      const matViewed = [...new Set(evs.filter(e => e.type === 'material').map(e => e.refId))]
      const hwDone    = [...new Set(evs.filter(e => e.type === 'homework').map(e => e.refId))]
      const hwSubMap = {}
      evs.filter(e => e.type === 'homework').forEach(e => { hwSubMap[e.refId] = e }) // bài nộp mới nhất
      const quizMap = {}
      evs.filter(e => e.type === 'quiz').forEach(e => { quizMap[e.refId] = e }) // bản nộp mới nhất
      const quizList = Object.values(quizMap)
      const avg = quizList.length ? quizList.reduce((a, e) => a + (e.score || 0), 0) / quizList.length : null
      const lastAt = evs.length ? evs.map(e => e.at).sort().slice(-1)[0] : null
      return { ...s, matViewed, hwDone, hwSubMap, quizList, quizMap, avg, lastAt, active: evs.length > 0 }
    })

    const N = roster.length
    const pct = (n) => N ? Math.round((n / N) * 100) : 0
    const cViewed = students.filter(s => s.matViewed.length).length
    const cHw     = students.filter(s => s.hwDone.length).length
    const cQuiz   = students.filter(s => s.quizList.length).length

    const subMaterials = materials.filter(m => m.subjectId === sid)
    const subQuizzes   = quizzes.filter(q => q.subjectId === sid)

    // Bài tập xuất hiện trong nhật ký (refId → title)
    const hwSeen = new Map()
    activities.forEach(a => (a.events || []).forEach(e => {
      if (e.subjectId === sid && e.type === 'homework') hwSeen.set(e.refId, e.refTitle)
    }))

    return { roster, students, N, pct, cViewed, cHw, cQuiz, subMaterials, subQuizzes, hwSeen, eventsOf }
  }, [subject, activities, allUsers, materials, quizzes])

  // ── Render ──
  return h('div', { className: 'container-fluid py-4' },

    h('div', { className: 'd-flex align-items-center gap-3 mb-3 flex-wrap' },
      h('div', { className: 'report-header-icon' }, h('i', { className: 'bi bi-clipboard-data' })),
      h('div', { className: 'flex-grow-1' },
        h('h4', { className: 'fw-bold mb-0' }, 'Quản lý lớp học'),
        h('small', { className: 'text-muted' },
          user?.role === 'admin' ? 'Theo dõi hoạt động & chấm điểm toàn bộ môn học' : 'Theo dõi hoạt động & chấm điểm các môn bạn phụ trách'
        )
      ),
      view === 'theodoi' && subjects.length > 0 && h('select', { className: 'form-select', style: { width: 'auto', minWidth: 220 }, value: subId ?? '', onChange: e => setSubId(Number(e.target.value)) },
        subjects.map(s => h('option', { key: s.id, value: s.id }, s.name))
      )
    ),

    // ── Chuyển chế độ: Theo dõi hoạt động | Bảng điểm ──
    h('div', { className: 'd-flex gap-2 mb-4' },
      h('button', { className: `btn btn-sm ${view === 'theodoi' ? 'btn-primary' : 'btn-outline-primary'}`, onClick: () => setView('theodoi') },
        h('i', { className: 'bi bi-graph-up-arrow me-1' }), 'Theo dõi hoạt động'),
      h('button', { className: `btn btn-sm ${view === 'bangdiem' ? 'btn-primary' : 'btn-outline-primary'}`, onClick: () => setView('bangdiem') },
        h('i', { className: 'bi bi-card-checklist me-1' }), 'Bảng điểm & Chấm điểm')
    ),

    view === 'bangdiem'
      ? h(GradeBook, { subjects, allUsers, quizzes, homeworks, fetchActivities })
      : null,

    view === 'theodoi' && (
    subjects.length === 0
      ? h('div', { className: 'text-center text-muted py-5' },
          h('i', { className: 'bi bi-folder-x fs-1 d-block mb-3 opacity-25' }),
          h('p', null, 'Bạn chưa được phân công môn học nào để theo dõi.')
        )
      : activities === null
        ? h('div', { className: 'text-center py-5' },
            h('div', { className: 'spinner-border text-primary mb-2' }),
            h('p', { className: 'text-muted' }, 'Đang tải dữ liệu hoạt động…')
          )
        : !data
          ? null
          : h(window.React.Fragment, null,

            // ── Thẻ tỉ lệ tổng quan ──
            h('div', { className: 'row g-3 mb-4' },
              h('div', { className: 'col-6 col-xl-3' },
                h('div', { className: 'report-metric card border-0 shadow-sm' },
                  h('div', { className: 'card-body d-flex align-items-center gap-3' },
                    h('div', { className: 'report-ring', style: { background: 'rgba(78,115,223,.12)' } },
                      h('div', { className: 'report-ring-inner' }, h('span', { style: { color: 'var(--primary)' } }, data.N))
                    ),
                    h('div', null, h('div', { className: 'fw-bold' }, 'Sĩ số'), h('div', { className: 'small text-muted' }, 'sinh viên trong môn'))
                  )
                )
              ),
              h('div', { className: 'col-6 col-xl-3' }, h(PctRing, { pct: data.pct(data.cViewed), color: '#36b9cc', label: 'Đã xem tài liệu', sub: `${data.cViewed}/${data.N} sinh viên` })),
              h('div', { className: 'col-6 col-xl-3' }, h(PctRing, { pct: data.pct(data.cHw),     color: '#1cc88a', label: 'Đã làm bài tập', sub: `${data.cHw}/${data.N} sinh viên` })),
              h('div', { className: 'col-6 col-xl-3' }, h(PctRing, { pct: data.pct(data.cQuiz),   color: '#e67e22', label: 'Đã làm trắc nghiệm', sub: `${data.cQuiz}/${data.N} sinh viên` }))
            ),

            // ── Tabs ──
            h('div', { className: 'd-flex gap-2 mb-3 flex-wrap' },
              [
                { key: 'students',  label: 'Theo sinh viên', icon: 'people-fill' },
                { key: 'quizzes',   label: 'Điểm trắc nghiệm', icon: 'patch-question-fill' },
                { key: 'materials', label: 'Lượt xem tài liệu', icon: 'folder-fill' },
                { key: 'homework',  label: 'Bài tập', icon: 'journal-check' },
              ].map(t =>
                h('button', { key: t.key, className: `btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-outline-secondary'}`, onClick: () => setTab(t.key) },
                  h('i', { className: `bi bi-${t.icon} me-1` }), t.label
                )
              )
            ),

            data.N === 0
              ? h('div', { className: 'card border-0 shadow-sm' }, h('div', { className: 'card-body text-center text-muted py-5' },
                  h('i', { className: 'bi bi-inbox fs-1 d-block mb-2 opacity-25' }),
                  'Chưa có sinh viên nào được phân công hoặc có hoạt động trong môn này.'
                ))

              // ── TAB: Theo sinh viên ──
              : tab === 'students' ? h('div', { className: 'card border-0 shadow-sm' },
                  h('div', { className: 'table-responsive' },
                    h('table', { className: 'table table-hover align-middle mb-0 report-table' },
                      h('thead', null, h('tr', null,
                        h('th', null, 'Sinh viên'),
                        h('th', { className: 'text-center' }, 'Tài liệu đã xem'),
                        h('th', { className: 'text-center' }, 'Bài tập đã làm'),
                        h('th', { className: 'text-center' }, 'Trắc nghiệm'),
                        h('th', { className: 'text-center' }, 'Điểm TB'),
                        h('th', { className: 'text-center' }, 'Hoạt động gần nhất')
                      )),
                      h('tbody', null,
                        data.students.slice().sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1)).map(s =>
                          h('tr', { key: s.uid, className: s.active ? '' : 'text-muted' },
                            h('td', null,
                              h('div', { className: 'd-flex align-items-center gap-2' },
                                h('div', { className: 'report-avatar' }, initials(s.name)),
                                h('div', { className: 'min-w-0' },
                                  h('div', { className: 'fw-semibold text-truncate' }, s.name),
                                  s.email && h('div', { className: 'small text-muted text-truncate' }, s.email)
                                )
                              )
                            ),
                            h('td', { className: 'text-center' }, h('span', { className: `badge ${s.matViewed.length ? 'bg-info-subtle text-info' : 'bg-light text-muted border'}` }, `${s.matViewed.length}`)),
                            h('td', { className: 'text-center' }, h('span', { className: `badge ${s.hwDone.length ? 'bg-success-subtle text-success' : 'bg-light text-muted border'}` }, `${s.hwDone.length}`)),
                            h('td', { className: 'text-center' }, h('span', { className: `badge ${s.quizList.length ? 'bg-warning-subtle text-warning' : 'bg-light text-muted border'}` }, `${s.quizList.length}`)),
                            h('td', { className: 'text-center fw-bold', style: { color: s.avg != null ? scoreColor(s.avg) : 'inherit' } }, s.avg != null ? s.avg.toFixed(1) : '—'),
                            h('td', { className: 'text-center small text-muted' }, s.lastAt ? formatDate(s.lastAt) : 'Chưa hoạt động')
                          )
                        )
                      )
                    )
                  )
                )

              // ── TAB: Điểm trắc nghiệm ──
              : tab === 'quizzes' ? (
                  data.subQuizzes.length === 0
                    ? h('div', { className: 'card border-0 shadow-sm' }, h('div', { className: 'card-body text-center text-muted py-5' }, h('i', { className: 'bi bi-patch-question fs-1 d-block mb-2 opacity-25' }), 'Môn này chưa có đề trắc nghiệm.'))
                    : h('div', { className: 'd-flex flex-column gap-3' },
                        data.subQuizzes.map(q => {
                          const rows = data.students.map(s => ({ s, ev: s.quizMap[q.id] })).filter(r => r.ev)
                          const avg  = rows.length ? rows.reduce((a, r) => a + (r.ev.score || 0), 0) / rows.length : null
                          return h('div', { key: q.id, className: 'card border-0 shadow-sm' },
                            h('div', { className: 'card-header bg-transparent border-0 pt-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2' },
                              h('h6', { className: 'fw-bold mb-0' }, h('i', { className: 'bi bi-patch-question me-2 text-warning' }), q.title),
                              h('div', { className: 'd-flex gap-2' },
                                h('span', { className: 'badge bg-primary-subtle text-primary' }, `${rows.length}/${data.N} đã làm (${data.pct(rows.length)}%)`),
                                avg != null && h('span', { className: 'badge', style: { backgroundColor: scoreColor(avg) + '22', color: scoreColor(avg) } }, `Điểm TB: ${avg.toFixed(1)}`)
                              )
                            ),
                            h('div', { className: 'card-body pt-2 px-4 pb-3' },
                              rows.length === 0
                                ? h('div', { className: 'text-muted small text-center py-2' }, 'Chưa có sinh viên nào làm bài này.')
                                : h('div', { className: 'd-flex flex-column gap-2' },
                                    rows.slice().sort((a, b) => (b.ev.score || 0) - (a.ev.score || 0)).map(({ s, ev }) =>
                                      h('div', { key: s.uid, className: 'd-flex align-items-center gap-2 report-quiz-row' },
                                        h('div', { className: 'report-avatar sm' }, initials(s.name)),
                                        h('span', { className: 'flex-grow-1 text-truncate small fw-semibold' }, s.name),
                                        ev.correct != null && ev.total != null && h('span', { className: 'small text-muted' }, `${ev.correct}/${ev.total} câu`),
                                        h('span', { className: 'small text-muted d-none d-sm-inline' }, formatDate(ev.at)),
                                        h('span', { className: 'report-score-badge', style: { backgroundColor: scoreColor(ev.score) } }, `${ev.score}`)
                                      )
                                    )
                                  )
                            )
                          )
                        })
                      )
                )

              // ── TAB: Lượt xem tài liệu ──
              : tab === 'materials' ? (
                  data.subMaterials.length === 0
                    ? h('div', { className: 'card border-0 shadow-sm' }, h('div', { className: 'card-body text-center text-muted py-5' }, h('i', { className: 'bi bi-folder-x fs-1 d-block mb-2 opacity-25' }), 'Môn này chưa có tài liệu.'))
                    : h('div', { className: 'card border-0 shadow-sm' },
                        h('div', { className: 'list-group list-group-flush' },
                          data.subMaterials.map(m => {
                            const viewers = data.students.filter(s => s.matViewed.includes(m.id))
                            return h('div', { key: m.id, className: 'list-group-item border-0 px-4 py-3' },
                              h('div', { className: 'd-flex justify-content-between align-items-center flex-wrap gap-2 mb-2' },
                                h('div', { className: 'fw-semibold' }, h('i', { className: 'bi bi-file-earmark-text me-2 text-info' }), m.title),
                                h('span', { className: 'badge bg-info-subtle text-info' }, `${viewers.length}/${data.N} đã xem (${data.pct(viewers.length)}%)`)
                              ),
                              h('div', { className: 'progress mb-2', style: { height: 6 } },
                                h('div', { className: 'progress-bar bg-info', style: { width: `${data.pct(viewers.length)}%` } })
                              ),
                              viewers.length > 0
                                ? h('div', { className: 'd-flex flex-wrap gap-1' },
                                    viewers.map(s => h('span', { key: s.uid, className: 'report-chip' }, h('span', { className: 'report-avatar xs' }, initials(s.name)), s.name))
                                  )
                                : h('small', { className: 'text-muted' }, 'Chưa có sinh viên nào xem.')
                            )
                          })
                        )
                      )
                )

              // ── TAB: Bài tập ──
              : (
                  data.hwSeen.size === 0
                    ? h('div', { className: 'card border-0 shadow-sm' }, h('div', { className: 'card-body text-center text-muted py-5' }, h('i', { className: 'bi bi-journal-x fs-1 d-block mb-2 opacity-25' }), 'Chưa có sinh viên nào hoàn thành bài tập trong môn này.'))
                    : h('div', { className: 'card border-0 shadow-sm' },
                        h('div', { className: 'list-group list-group-flush' },
                          [...data.hwSeen.entries()].map(([refId, title]) => {
                            const doers = data.students.filter(s => s.hwDone.includes(refId))
                            return h('div', { key: refId, className: 'list-group-item border-0 px-4 py-3' },
                              h('div', { className: 'd-flex justify-content-between align-items-center flex-wrap gap-2 mb-2' },
                                h('div', { className: 'fw-semibold' }, h('i', { className: 'bi bi-journal-check me-2 text-success' }), title || 'Bài tập'),
                                h('span', { className: 'badge bg-success-subtle text-success' }, `${doers.length}/${data.N} đã nộp (${data.pct(doers.length)}%)`)
                              ),
                              h('div', { className: 'progress mb-3', style: { height: 6 } },
                                h('div', { className: 'progress-bar bg-success', style: { width: `${data.pct(doers.length)}%` } })
                              ),
                              doers.length === 0
                                ? h('small', { className: 'text-muted' }, 'Chưa có sinh viên nào nộp.')
                                : h('div', { className: 'd-flex flex-column gap-2' },
                                    doers.map(s => {
                                      const sub = s.hwSubMap[refId] || {}
                                      return h('div', { key: s.uid, className: 'report-sub-row d-flex align-items-start gap-2' },
                                        h('div', { className: 'report-avatar sm flex-shrink-0' }, initials(s.name)),
                                        h('div', { className: 'flex-grow-1 min-w-0' },
                                          h('div', { className: 'd-flex align-items-center gap-2 flex-wrap' },
                                            h('span', { className: 'fw-semibold small' }, s.name),
                                            sub.at && h('small', { className: 'text-muted' }, h('i', { className: 'bi bi-calendar3 me-1' }), new Date(sub.at).toLocaleDateString('vi-VN'))
                                          ),
                                          sub.note && h('div', { className: 'small text-muted fst-italic' }, '“', sub.note, '”')
                                        ),
                                        sub.url
                                          ? h('a', { href: sub.url, target: '_blank', rel: 'noopener noreferrer', className: 'btn btn-sm btn-outline-primary flex-shrink-0', title: 'Mở bài nộp' },
                                              h('i', { className: 'bi bi-box-arrow-up-right me-1' }), 'Xem bài')
                                          : h('span', { className: 'badge bg-secondary-subtle text-secondary flex-shrink-0 align-self-center' }, 'Không có link')
                                      )
                                    })
                                  )
                            )
                          })
                        )
                      )
                )
          )
    )
  )
}
