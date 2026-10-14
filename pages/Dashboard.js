// pages/Dashboard.js – Trang tổng quan
import { HW_TYPES, PRIORITY_CLASS, PRIORITY_LABEL } from '../utils/constants.js'
import { isOverdue, getDaysUntil, formatDate } from '../utils/helpers.js'

const { createElement: h } = window.React

export default function Dashboard({ subjects, deadlines, homeworks, onNavigate }) {
  const total       = deadlines.length
  const completed   = deadlines.filter((d) => d.status === 'completed').length
  const overdueList = deadlines.filter(isOverdue)
  const inProgress  = deadlines.filter((d) => d.status === 'in_progress').length
  const completePct = total ? Math.round((completed / total) * 100) : 0

  const hwTotal    = homeworks.length
  const hwDone     = homeworks.filter((hw) => hw.status === 'completed').length
  const hwOverdue  = homeworks.filter((hw) => hw.status !== 'completed' && getDaysUntil(hw.dueDate) < 0)
  const hwPct      = hwTotal ? Math.round((hwDone / hwTotal) * 100) : 0

  const upcoming = deadlines
    .filter((d) => d.status !== 'completed' && !isOverdue(d))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5)

  const urgentHw = homeworks
    .filter((hw) => hw.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4)

  const subjectName = (id) => (subjects.find((s) => s.id === id) || {}).name || '—'

  const statsCards = [
    { label: 'Môn học',       value: subjects.length,    color: 'primary', icon: 'book',                 hint: 'Xem môn học',      onClick: () => onNavigate('subjects', {}) },
    { label: 'Tổng deadline', value: total,               color: 'info',    icon: 'list-task',            hint: 'Xem tất cả',        onClick: () => onNavigate('deadlines', {}) },
    { label: 'Hoàn thành',    value: completed,           color: 'success', icon: 'check-circle',         hint: 'Lọc hoàn thành',   onClick: () => onNavigate('deadlines', { status: 'completed' }) },
    { label: 'Quá hạn',       value: overdueList.length, color: 'danger',  icon: 'exclamation-triangle', hint: 'Lọc quá hạn',      onClick: () => onNavigate('deadlines', { overdue: true }) },
  ]

  return (
    h('div', { className: 'container-fluid py-4' },

      // ── Header: chào mừng + nút thêm deadline ──
      h('div', { className: 'row g-3 mb-4' },
        h('div', { className: 'col-12 col-lg-7' },
          h('div', { className: 'dashboard-greeting card border-0 shadow-sm p-4 h-100' },
            h('div', { className: 'd-flex align-items-center justify-content-between flex-wrap gap-3 h-100' },
              h('div', null,
                h('h5', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-hand-thumbs-up-fill me-2', style: { color: 'var(--primary)' } }), 'Tổng quan học tập'),
                h('div', { className: 'text-muted small' },
                  upcoming.length > 0
                    ? h(window.React.Fragment, null, 'Bạn có ', h('strong', { className: 'text-primary' }, upcoming.length), ' deadline sắp tới và ', h('strong', { className: 'text-primary' }, urgentHw.length), ' bài tập cần làm.')
                    : 'Bạn đã hoàn thành mọi deadline sắp tới. Tuyệt vời!'
                )
              ),
              h('button', { className: 'btn btn-primary', onClick: () => onNavigate('deadlines', {}) },
                h('i', { className: 'bi bi-plus-lg me-1' }), 'Thêm deadline'
              )
            )
          )
        ),
        h('div', { className: 'col-12 col-lg-5' },
          h('div', { className: 'card border-0 shadow-sm p-4 h-100' },
            h('div', { className: 'fw-bold mb-3' }, h('i', { className: 'bi bi-journal-check me-2', style: { color: 'var(--primary)' } }), 'Tiến độ bài tập'),
            h('div', { className: 'd-flex justify-content-between align-items-center mb-1' },
              h('small', { className: 'text-muted' }, `${hwDone}/${hwTotal} bài tập`),
              h('small', { className: 'fw-bold', style: { color: 'var(--primary)' } }, `${hwPct}%`)
            ),
            h('div', { className: 'progress mb-3', style: { height: 10 } },
              h('div', { className: 'progress-bar', style: { width: `${hwPct}%`, backgroundColor: 'var(--primary)' } })
            ),
            h('div', { className: 'd-flex gap-3 flex-wrap' },
              Object.entries(HW_TYPES).map(([k, v]) => {
                const cnt = homeworks.filter((hw) => hw.type === k).length
                const dn  = homeworks.filter((hw) => hw.type === k && hw.status === 'completed').length
                return h('div', { key: k, className: 'hw-mini-stat' },
                  h('div', { className: 'hw-mini-icon', style: { backgroundColor: v.bg, color: v.color } },
                    h('i', { className: `bi bi-${v.icon}` })
                  ),
                  h('div', null,
                    h('div', { className: 'small fw-semibold' }, v.label),
                    h('div', { className: 'text-muted', style: { fontSize: '0.75rem' } }, `${dn}/${cnt}`)
                  )
                )
              })
            ),
            hwOverdue.length > 0 && h('div', { className: 'alert alert-danger py-2 px-3 mt-3 mb-0 small d-flex align-items-center gap-2' },
              h('i', { className: 'bi bi-exclamation-triangle-fill flex-shrink-0' }),
              `${hwOverdue.length} bài tập quá hạn!`,
              h('button', { className: 'btn btn-link btn-sm text-danger p-0 ms-auto', onClick: () => onNavigate('subjects', {}) }, 'Xem ngay')
            )
          )
        )
      ),

      // ── Stat cards ──
      h('div', { className: 'row g-3 mb-4' },
        statsCards.map((c) =>
          h('div', { key: c.label, className: 'col-6 col-lg-3' },
            h('div', { className: 'stat-card card border-0 shadow-sm h-100', style: { cursor: 'pointer' }, onClick: c.onClick, title: c.hint },
              h('div', { className: 'card-body' },
                h('div', { className: 'd-flex align-items-center justify-content-between' },
                  h('div', null,
                    h('div', { className: 'stat-label' }, c.label),
                    h('div', { className: `stat-value text-${c.color}` }, c.value)
                  ),
                  h('div', { className: `stat-icon bg-${c.color}-light` }, h('i', { className: `bi bi-${c.icon} text-${c.color}` }))
                ),
                h('div', { className: `stat-nav-hint text-${c.color}` }, h('i', { className: 'bi bi-arrow-right-circle me-1' }), c.hint)
              )
            )
          )
        )
      ),

      // ── Progress bar tổng ──
      total > 0 && h('div', { className: 'card border-0 shadow-sm mb-4' },
        h('div', { className: 'card-body' },
          h('div', { className: 'd-flex justify-content-between align-items-center mb-2' },
            h('span', { className: 'fw-semibold' }, 'Tiến độ deadline'),
            h('span', { className: 'text-muted small' }, `${completed}/${total} (${completePct}%)`)
          ),
          h('div', { className: 'progress', style: { height: 14 } },
            h('div', { className: 'progress-bar bg-success', style: { width: `${completePct}%` } })
          ),
          h('div', { className: 'd-flex flex-wrap gap-3 mt-2' },
            h('span', { className: 'small clickable-badge', style: { cursor: 'pointer' }, onClick: () => onNavigate('deadlines', { status: 'completed' }) },
              h('span', { className: 'badge bg-success me-1' }, completed), 'Hoàn thành'
            ),
            h('span', { className: 'small clickable-badge', style: { cursor: 'pointer' }, onClick: () => onNavigate('deadlines', { status: 'in_progress' }) },
              h('span', { className: 'badge bg-primary me-1' }, inProgress), 'Đang làm'
            ),
            h('span', { className: 'small clickable-badge', style: { cursor: 'pointer' }, onClick: () => onNavigate('deadlines', { overdue: true }) },
              h('span', { className: 'badge bg-danger me-1' }, overdueList.length), 'Quá hạn'
            )
          )
        )
      ),

      // ── 2 cột: deadline sắp tới + bài tập cần làm ──
      h('div', { className: 'row g-4' },
        h('div', { className: 'col-12 col-lg-7' },
          h('div', { className: 'card border-0 shadow-sm' },
            h('div', { className: 'card-header bg-transparent border-0 d-flex justify-content-between align-items-center pt-3 pb-2' },
              h('h6', { className: 'fw-bold mb-0' }, h('i', { className: 'bi bi-clock-history me-2 text-warning' }), 'Deadline sắp tới'),
              h('button', { className: 'btn btn-sm btn-outline-primary', onClick: () => onNavigate('deadlines', {}) }, 'Xem tất cả')
            ),
            h('div', { className: 'card-body p-0' },
              upcoming.length === 0
                ? h('div', { className: 'text-center text-muted py-5' },
                    h('i', { className: 'bi bi-check-all fs-1 d-block mb-2 text-success' }),
                    h('p', { className: 'mb-0' }, 'Không có deadline nào sắp tới!'),
                    h('small', null, 'Hãy thêm deadline mới nếu cần.')
                  )
                : h('div', { className: 'list-group list-group-flush' },
                    upcoming.map((d) => {
                      const days = getDaysUntil(d.dueDate)
                      const uc   = days === 0 ? 'text-danger fw-bold' : days <= 2 ? 'text-warning fw-semibold' : 'text-muted'
                      return h('div', { key: d.id, className: 'list-group-item border-0 py-3 px-4' },
                        h('div', { className: 'd-flex justify-content-between align-items-start gap-3' },
                          h('div', { className: 'flex-grow-1' },
                            h('div', { className: 'fw-semibold' }, d.title),
                            h('small', { className: 'text-muted' }, h('i', { className: 'bi bi-book me-1' }), subjectName(d.subjectId))
                          ),
                          h('div', { className: 'text-end flex-shrink-0' },
                            h('span', { className: `badge bg-${PRIORITY_CLASS[d.priority]} d-block mb-1` }, PRIORITY_LABEL[d.priority]),
                            h('small', { className: uc }, days === 0 ? 'Hôm nay!' : days === 1 ? 'Ngày mai' : `${days} ngày`)
                          )
                        )
                      )
                    })
                  )
            )
          )
        ),

        h('div', { className: 'col-12 col-lg-5' },
          h('div', { className: 'card border-0 shadow-sm' },
            h('div', { className: 'card-header bg-transparent border-0 d-flex justify-content-between align-items-center pt-3 pb-2' },
              h('h6', { className: 'fw-bold mb-0' }, h('i', { className: 'bi bi-journal-text me-2', style: { color: 'var(--primary)' } }), 'Bài tập cần làm'),
              h('button', { className: 'btn btn-sm btn-outline-primary', onClick: () => onNavigate('subjects', {}) }, 'Xem môn học')
            ),
            h('div', { className: 'card-body p-0' },
              urgentHw.length === 0
                ? h('div', { className: 'text-center text-muted py-5' },
                    h('i', { className: 'bi bi-emoji-smile fs-1 d-block mb-2 text-success' }),
                    'Không còn bài tập nào!'
                  )
                : h('div', { className: 'list-group list-group-flush' },
                    urgentHw.map((hw) => {
                      const days = getDaysUntil(hw.dueDate)
                      const ov   = days < 0
                      const typeInfo = HW_TYPES[hw.type]
                      return h('div', { key: hw.id, className: 'list-group-item border-0 py-2 px-4' },
                        h('div', { className: 'd-flex align-items-center gap-3' },
                          h('div', { className: 'hw-mini-icon flex-shrink-0', style: { backgroundColor: typeInfo.bg, color: typeInfo.color, width: 32, height: 32 } },
                            h('i', { className: `bi bi-${typeInfo.icon}` })
                          ),
                          h('div', { className: 'flex-grow-1 overflow-hidden' },
                            h('div', { className: 'fw-semibold small text-truncate' }, hw.title),
                            h('small', { className: 'text-muted' }, subjectName(hw.subjectId))
                          ),
                          h('small', { className: `flex-shrink-0 fw-semibold ${ov ? 'text-danger' : days <= 2 ? 'text-warning' : 'text-muted'}` },
                            ov ? `Quá ${-days}N` : days === 0 ? 'Hôm nay' : `${days}N`
                          )
                        )
                      )
                    })
                  )
            )
          )
        )
      )
    )
  )
}
