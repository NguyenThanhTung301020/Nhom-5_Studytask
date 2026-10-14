// pages/Statistics.js – Thống kê
import { HW_TYPES } from '../utils/constants.js'
import { isOverdue } from '../utils/helpers.js'

const { useEffect, useRef, createElement: h } = window.React

export default function Statistics({ subjects, deadlines, homeworks }) {
  const doughnutRef  = useRef(null), barRef      = useRef(null)
  const hwBarRef     = useRef(null)
  const doughnutInst = useRef(null), barInst     = useRef(null)
  const hwBarInst    = useRef(null)

  const total     = deadlines.length
  const completed = deadlines.filter((d) => d.status === 'completed').length
  const overdue   = deadlines.filter(isOverdue).length
  const rate      = total ? Math.round((completed / total) * 100) : 0

  const hwTotal   = homeworks.length
  const hwDone    = homeworks.filter((hw) => hw.status === 'completed').length
  const hwRate    = hwTotal ? Math.round((hwDone / hwTotal) * 100) : 0

  useEffect(() => {
    [doughnutInst, barInst, hwBarInst].forEach((ref) => { if (ref.current) { ref.current.destroy(); ref.current = null } })

    if (doughnutRef.current) {
      doughnutInst.current = new window.Chart(doughnutRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Chưa làm','Đang làm','Hoàn thành','Quá hạn'],
          datasets: [{ data: [deadlines.filter((d) => d.status==='pending'&&!isOverdue(d)).length, deadlines.filter((d) => d.status==='in_progress').length, completed, overdue], backgroundColor: ['#858796','#4e73df','#1cc88a','#e74a3b'], borderWidth: 2, borderColor: '#fff' }],
        },
        options: { responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom' } } },
      })
    }
    if (barRef.current && subjects.length > 0) {
      barInst.current = new window.Chart(barRef.current, {
        type: 'bar',
        data: {
          labels: subjects.map((s) => s.name),
          datasets: [
            { label: 'Chưa làm',   backgroundColor: '#858796', data: subjects.map((s) => deadlines.filter((d) => d.subjectId===s.id&&d.status==='pending').length),     borderRadius: 4 },
            { label: 'Đang làm',   backgroundColor: '#4e73df', data: subjects.map((s) => deadlines.filter((d) => d.subjectId===s.id&&d.status==='in_progress').length), borderRadius: 4 },
            { label: 'Hoàn thành', backgroundColor: '#1cc88a', data: subjects.map((s) => deadlines.filter((d) => d.subjectId===s.id&&d.status==='completed').length),   borderRadius: 4 },
          ],
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } } },
      })
    }
    if (hwBarRef.current && homeworks.length > 0) {
      const types = Object.entries(HW_TYPES)
      hwBarInst.current = new window.Chart(hwBarRef.current, {
        type: 'bar',
        data: {
          labels: subjects.map((s) => s.name),
          datasets: types.map(([k, v]) => ({
            label: v.label,
            backgroundColor: v.color + 'cc',
            borderColor: v.color,
            borderWidth: 1,
            data: subjects.map((s) => homeworks.filter((hw) => hw.subjectId === s.id && hw.type === k).length),
            borderRadius: 4,
          })),
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
      })
    }

    return () => { [doughnutInst, barInst, hwBarInst].forEach((ref) => { if (ref.current) { ref.current.destroy(); ref.current = null } }) }
  }, [subjects, deadlines, homeworks])

  // Điểm trung bình quiz per subject
  const quizAvgs = subjects.map((s) => {
    const scores = homeworks.filter((hw) => hw.subjectId === s.id && hw.type === 'quiz' && hw.score != null).map((hw) => hw.score)
    return { name: s.name, color: s.color, avg: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null, count: scores.length }
  }).filter((x) => x.avg)

  return (
    h('div', { className: 'container-fluid py-4' },
      h('h4', { className: 'fw-bold mb-4' }, h('i', { className: 'bi bi-bar-chart me-2', style: { color: 'var(--primary)' } }), 'Thống kê học tập'),

      // ── Tổng quan ──
      h('div', { className: 'row g-3 mb-4' },
        [
          { label: 'Tổng deadline', value: total,      color: 'primary' },
          { label: 'Hoàn thành',    value: completed,  color: 'success' },
          { label: 'Quá hạn',       value: overdue,    color: 'danger' },
          { label: 'Tỉ lệ ĐL',      value: `${rate}%`, color: 'info' },
          { label: 'Tổng bài tập',  value: hwTotal,    color: 'primary' },
          { label: 'BT hoàn thành', value: hwDone,     color: 'success' },
          { label: 'Tỉ lệ BT',      value: `${hwRate}%`, color: 'info' },
          { label: 'Môn học',       value: subjects.length, color: 'secondary' },
        ].map((c) =>
          h('div', { key: c.label, className: 'col-6 col-md-3' },
            h('div', { className: 'card border-0 shadow-sm text-center py-3 px-2' },
              h('div', { className: `display-6 fw-bold text-${c.color}` }, c.value),
              h('small', { className: 'text-muted' }, c.label)
            )
          )
        )
      ),

      // ── Biểu đồ Deadline ──
      h('div', { className: 'row g-4 mb-4' },
        h('div', { className: 'col-12 col-lg-5' },
          h('div', { className: 'card border-0 shadow-sm h-100' },
            h('div', { className: 'card-header bg-transparent border-0 pt-3 pb-2' }, h('h6', { className: 'fw-bold mb-0' }, h('i', { className: 'bi bi-pie-chart me-2', style: { color: 'var(--primary)' } }), 'Trạng thái Deadline')),
            h('div', { className: 'card-body d-flex align-items-center justify-content-center' }, h('div', { style: { maxWidth: 280, width: '100%' } }, h('canvas', { ref: doughnutRef })))
          )
        ),
        h('div', { className: 'col-12 col-lg-7' },
          h('div', { className: 'card border-0 shadow-sm h-100' },
            h('div', { className: 'card-header bg-transparent border-0 pt-3 pb-2' }, h('h6', { className: 'fw-bold mb-0' }, h('i', { className: 'bi bi-bar-chart-line me-2', style: { color: 'var(--primary)' } }), 'Deadline theo Môn học')),
            h('div', { className: 'card-body' }, subjects.length > 0 ? h('canvas', { ref: barRef }) : h('p', { className: 'text-muted text-center' }, 'Chưa có dữ liệu'))
          )
        )
      ),

      // ── Bài tập theo môn ──
      h('div', { className: 'card border-0 shadow-sm mb-4' },
        h('div', { className: 'card-header bg-transparent border-0 pt-3 pb-2' }, h('h6', { className: 'fw-bold mb-0' }, h('i', { className: 'bi bi-journal-text me-2', style: { color: 'var(--primary)' } }), 'Bài tập theo Môn học & Loại')),
        h('div', { className: 'card-body' }, homeworks.length > 0 && subjects.length > 0 ? h('canvas', { ref: hwBarRef }) : h('p', { className: 'text-muted text-center py-3' }, 'Chưa có dữ liệu bài tập'))
      ),

      // ── Bài tập theo loại ──
      h('div', { className: 'card border-0 shadow-sm mb-4' },
        h('div', { className: 'card-header bg-transparent border-0 pt-3 pb-2' }, h('h6', { className: 'fw-bold mb-0' }, h('i', { className: 'bi bi-journals me-2', style: { color: 'var(--primary)' } }), 'Tiến độ Bài tập theo Loại')),
        h('div', { className: 'card-body' },
          h('div', { className: 'row g-3' },
            Object.entries(HW_TYPES).map(([k, v]) => {
              const cnt  = homeworks.filter((hw) => hw.type === k).length
              const done = homeworks.filter((hw) => hw.type === k && hw.status === 'completed').length
              const pct  = cnt ? Math.round((done / cnt) * 100) : 0
              return h('div', { key: k, className: 'col-12 col-md-4' },
                h('div', { className: 'd-flex align-items-center gap-3 mb-2' },
                  h('div', { className: 'hw-mini-icon', style: { backgroundColor: v.bg, color: v.color } }, h('i', { className: `bi bi-${v.icon}` })),
                  h('div', null,
                    h('div', { className: 'fw-semibold small' }, v.label),
                    h('div', { className: 'text-muted', style: { fontSize: '0.75rem' } }, `${done}/${cnt} hoàn thành (${pct}%)`)
                  )
                ),
                h('div', { className: 'progress', style: { height: 8 } },
                  h('div', { className: 'progress-bar', style: { width: `${pct}%`, backgroundColor: v.color } })
                )
              )
            })
          )
        )
      ),

      // ── Điểm quiz theo môn ──
      quizAvgs.length > 0 && h('div', { className: 'card border-0 shadow-sm mb-4' },
        h('div', { className: 'card-header bg-transparent border-0 pt-3 pb-2' }, h('h6', { className: 'fw-bold mb-0' }, h('i', { className: 'bi bi-star-fill me-2 text-warning' }), 'Điểm Trắc nghiệm Trung bình')),
        h('div', { className: 'card-body' },
          h('div', { className: 'row g-3' },
            quizAvgs.map((q) =>
              h('div', { key: q.name, className: 'col-12 col-sm-6 col-md-4' },
                h('div', { className: 'd-flex align-items-center gap-3' },
                  h('div', { className: 'subject-color-dot flex-shrink-0', style: { backgroundColor: q.color, width: 36, height: 36 } },
                    h('i', { className: 'bi bi-star-fill text-white', style: { fontSize: 14 } })
                  ),
                  h('div', null,
                    h('div', { className: 'fw-semibold small' }, q.name),
                    h('div', null,
                      h('span', { className: 'fw-bold fs-5', style: { color: q.avg >= 8 ? '#1cc88a' : q.avg >= 5 ? '#f6c23e' : '#e74a3b' } }, q.avg),
                      h('small', { className: 'text-muted ms-1' }, `/ 10 (${q.count} bài)`)
                    )
                  )
                )
              )
            )
          )
        )
      ),

      // ── Phân bổ ưu tiên ──
      h('div', { className: 'card border-0 shadow-sm' },
        h('div', { className: 'card-header bg-transparent border-0 pt-3 pb-2' }, h('h6', { className: 'fw-bold mb-0' }, h('i', { className: 'bi bi-flag me-2', style: { color: 'var(--primary)' } }), 'Phân bổ Mức ưu tiên Deadline')),
        h('div', { className: 'card-body' },
          h('div', { className: 'row g-3' },
            [{ key: 'high', label: 'Cao', color: 'danger' }, { key: 'medium', label: 'Trung bình', color: 'warning' }, { key: 'low', label: 'Thấp', color: 'success' }].map((p) => {
              const count = deadlines.filter((d) => d.priority === p.key).length
              const pct   = total ? Math.round((count / total) * 100) : 0
              return h('div', { key: p.key, className: 'col-12 col-md-4' },
                h('div', { className: 'd-flex justify-content-between align-items-center mb-2' },
                  h('span', { className: `badge bg-${p.color} px-3 py-2` }, p.label),
                  h('span', { className: 'text-muted small fw-semibold' }, `${count} (${pct}%)`)
                ),
                h('div', { className: 'progress', style: { height: 10 } }, h('div', { className: `progress-bar bg-${p.color}`, style: { width: `${pct}%` } }))
              )
            })
          )
        )
      )
    )
  )
}
