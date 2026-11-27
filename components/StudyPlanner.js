// components/StudyPlanner.js – Lập kế hoạch ôn thi (trang Tiện ích), theo từng môn:
//   1. So sánh điểm hiện tại với điểm cần đạt cho mục tiêu (qua môn hoặc xếp loại cao hơn)
//   2. Tổng hợp giáo trình, tài liệu của môn thành các mục ôn, rồi chia lịch ôn theo ngày
// Công thức ở utils/grading.js, phần tính cho trang này ở utils/studyTools.js. Kế hoạch lưu trên thiết bị, riêng từng tài khoản.
import { ToolCard, ToolEmpty, accent } from './ToolCard.js'
import { isFirebaseReady, loadSharedData, loadMyQuizResults } from '../utils/firebase.js'
import { getDocument, listDocuments, errorText } from '../utils/store.js'
import { loadOfficialActivities } from '../utils/quizScores.js'
import { load, save } from '../utils/helpers.js'
import { ownerOf, ownedKey } from '../utils/quickNote.js'
import { COMPONENT_LABEL, round1, isGuidedSubject } from '../utils/grading.js'
import { offeringTitle } from '../utils/scope.js'
import { MATERIAL_TYPES } from '../utils/constants.js'
import { todayIso, addDays } from '../utils/periods.js'
import { toLetter, PASS_SCORE, upcomingExams, buildStudyPlan, replan, planProgress, dayLabel, GOAL_TARGETS, suggestTarget, myEvaluation,
         goalParts, manualScore, mergeScores, goalAnalysis, subjectGroups, studyItems, planTopics, topicDates, migratePlans } from '../utils/studyTools.js'

const { useState, useEffect, createElement: h } = window.React
const Frag = window.React.Fragment

const PLAN_KEY = 'st_examplan'          // { last: mã môn, bySubject: { [mã môn]: { target, manual, excluded, extra, pick, planFor, plan, done, studied } } }
const OLD_PLAN_KEY = 'st_studyplan'     // bản trước, lưu theo mã lịch thi
const C = '#4e73df'

const partLabel = (k, guided) => k === 'th' ? 'Thực hành' : guided && k === 'ck' ? 'Điểm giáo viên hướng dẫn' : COMPONENT_LABEL[k]
const score1 = (x) => x == null ? '—' : round1(x).toFixed(1)
const withLetter = (x) => x == null ? '—' : `${score1(x)} (${toLetter(round1(x)).letter})`
const longDate = (iso) => `${dayLabel(iso)}/${iso.slice(0, 4)}`

// Dữ liệu điểm của người dùng: quy chế, cột tính điểm; sinh viên thêm điểm giáo viên nhập, nhật ký và điểm trắc nghiệm chính thức
async function loadGradeData(user, submissions, quizzes) {
  const [ps, cs] = await Promise.all([listDocuments('gradingPolicies'), listDocuments('gradingColumns')])
  const data = { policies: Object.fromEntries(ps.map(p => [p.id, p])), colDocs: Object.fromEntries(cs.map(c => [c.id, c])), cells: {}, events: [] }
  if (user.role !== 'student') return data
  const uid = user.uid || user.id
  if (isFirebaseReady()) {
    data.cells = (await loadSharedData())?.grades?.[uid] || {}
    const acts = await loadOfficialActivities(
      async () => [{ uid, events: (await getDocument('activities', uid))?.events || [] }],
      async () => (await loadMyQuizResults()).map(r => ({ ...r, uid })))
    data.events = acts.find(a => a.uid === uid)?.events || []
  } else {                                  // chế độ demo: đọc đúng nơi Bảng điểm ghi
    data.cells = load('st_grades', {})[uid] || {}
    data.events = [
      ...(load('st_activities', []).find(a => a.uid === user.uid)?.events || []).filter(e => e.type !== 'quiz'),
      ...submissions.filter(s => s.userId === user.uid)
        .map(s => ({ type: 'quiz', subjectId: quizzes.find(q => q.id === s.quizId)?.subjectId, refId: s.quizId, score: s.score })),
    ]
  }
  return data
}

// ── 1. Điểm hiện tại so với mục tiêu ─────────────────────────────────────────
function GoalPanel({ subject, user, data, quizzes, homeworks, rec, update }) {
  const sid = String(subject.id)
  const ev = myEvaluation({ subject, policyDoc: data.policies[sid], columnsDoc: data.colDocs[sid], quizzes, homeworks,
    cell: data.cells[sid] || {}, events: data.events })
  const policy = ev.eff
  const guided = isGuidedSubject(subject)
  const parts = goalParts(policy)
  const system = ev.scores
  const manual = rec.manual || {}
  const { scores, typed } = mergeScores(parts, system, manual)
  // Mục tiêu gợi ý dựa trên điểm hệ thống, không nhảy theo từng ký tự đang tự nhập
  const target = rec.target ?? suggestTarget(goalAnalysis(policy, mergeScores(parts, system).scores, PASS_SCORE).current)
  const goal = GOAL_TARGETS.find(t => t.score === target) || GOAL_TARGETS[0]
  const r = goalAnalysis(policy, scores, goal.score)

  const weightText = (k) => k === 'th' ? `${policy.practice.practiceCredits} TC` : `${policy.weights[k]}%`
  const names = (keys) => keys.map(k => `${partLabel(k, guided)} (${weightText(k)})`).join(', ')
  const covered = parts.filter(k => k !== 'th' && scores[k] != null).reduce((a, k) => a + Number(policy.weights[k]), 0)
  const currentNote = r.current == null ? 'chưa có cột điểm nào'
    : (r.official ? 'đủ mọi cột'
      : policy.practice?.enabled ? 'tạm tính trên các cột đã có' : `tạm tính trên ${covered}% trọng số đã có`)
      + (typed.length ? ', gồm điểm bạn tự nhập' : '')
  const gap = r.current == null ? null : round1(r.current - goal.score)
  const best = r.high == null ? null : [...GOAL_TARGETS].reverse().find(t => t.score <= r.high)

  const verdict = () => {
    const miss = names(r.missing)
    if (r.status === 'ok') return ['primary', 'bullseye', h(Frag, null,
      'Cần đạt tối thiểu ', h('strong', null, r.need.toFixed(1)), r.missing.length > 1 ? ' ở mỗi cột còn thiếu: ' : ' ở cột còn thiếu: ', miss, '.',
      r.missing.length > 1 && ' Nếu bạn dự đoán được điểm một cột, nhập vào bảng trên để tính lại các cột còn lại.')]
    if (r.status === 'done') return ['success', 'check-circle', `Đã chắc chắn đạt: dù được 0 ở ${miss}, điểm môn vẫn là ${withLetter(r.low)}.`]
    if (r.status === 'impossible') return ['danger', 'x-octagon', `Không thể đạt: dù được 10 ở ${miss}, điểm môn cao nhất chỉ là ${withLetter(r.high)}.`
      + (best ? ` Mức cao nhất còn đạt được: ${best.label.toLowerCase()}.` : ' Không còn cách qua môn với các điểm đã có.')]
    if (r.status === 'achieved') return ['success', 'check-circle', `Đã đạt mục tiêu: điểm môn ${withLetter(r.current)}.`]
    if (r.status === 'failed') return ['danger', 'x-octagon', `Không đạt mục tiêu: mọi cột đã đủ điểm, điểm môn ${withLetter(r.current)}, thiếu ${round1(goal.score - r.current).toFixed(1)}.`]
    return ['warning', 'exclamation-triangle', 'Quy chế của môn chưa tính được điểm (kiểm tra số tín chỉ lý thuyết, thực hành ở trang Quy chế điểm).']
  }
  const [tone, icon, message] = verdict()

  const levelText = (t) => {
    const a = goalAnalysis(policy, scores, t.score)
    return a.status === 'ok' ? [`cần ≥ ${a.need.toFixed(1)}`, '']
      : a.status === 'done' || a.status === 'achieved' ? ['đã đạt', 'text-success']
      : a.status === 'invalid' ? ['—', 'text-muted'] : ['không thể đạt', 'text-danger']
  }

  return h('div', null,
    h('h6', { className: 'fw-bold' }, '1. Điểm hiện tại và mục tiêu'),
    h('div', { className: 'small text-muted mb-2' },
      guided ? 'Môn hướng dẫn: điểm môn là điểm giáo viên hướng dẫn đánh giá.'
        : `Quy chế: ${parts.filter(k => k !== 'th').map(k => `${partLabel(k)} ${weightText(k)}`).join(' · ')} (${data.policies[sid] ? 'Phòng Đào tạo đã cấu hình' : 'môn chưa cấu hình, dùng bộ mặc định'}).`
          + (policy.practice?.enabled ? ` Điểm môn gộp phần lý thuyết trên (${policy.practice.theoryCredits} TC) với điểm thực hành (${policy.practice.practiceCredits} TC).` : '')),
    user.role !== 'student' && h('div', { className: 'alert alert-info small py-2' }, 'Tài khoản này không có bảng điểm cá nhân. Nhập điểm vào bảng dưới để tính thử.'),

    h('table', { className: 'table table-sm small align-middle mb-2' },
      h('thead', null, h('tr', null, h('th', null, 'Cột điểm'), h('th', { style: { width: 92 } }, 'Hiện có'), h('th', { className: 'text-end', style: { width: 76 } }, 'Cần đạt'))),
      h('tbody', null, parts.map(k => {
        const has = system[k] != null
        const bad = !has && String(manual[k] ?? '').trim() !== '' && manualScore(manual[k]) == null
        return h('tr', { key: k },
          h('td', null, partLabel(k, guided), ' ', h('span', { className: 'text-muted' }, `(${weightText(k)})`),
            k === 'bt' && has && ev.gradedColumns < ev.countedCols.length &&
              h('div', { className: 'text-muted' }, `Mới có điểm ${ev.gradedColumns}/${ev.countedCols.length} bài, còn thay đổi`)),
          h('td', null, has
            ? h('span', { className: 'fw-semibold' }, score1(system[k]))
            : h('input', { type: 'text', inputMode: 'decimal', className: `form-control form-control-sm${bad ? ' is-invalid' : ''}`,
                placeholder: 'chưa có', 'aria-label': `Điểm ${partLabel(k, guided)} tự nhập`, title: 'Chưa có trên hệ thống; nhập điểm bạn biết hoặc dự đoán (0–10)',
                value: manual[k] ?? '', onChange: e => update({ manual: { ...manual, [k]: e.target.value } }) })),
          h('td', { className: 'text-end fw-semibold' },
            has ? h('span', { className: 'text-muted fw-normal' }, 'đã có')
              : typed.includes(k) ? h('span', { className: 'text-muted fw-normal' }, 'tự nhập')
              : r.status === 'ok' ? `≥ ${r.need.toFixed(1)}` : r.status === 'done' ? '≥ 0' : h('span', { className: 'text-danger' }, '—')))
      }))),
    typed.length > 0 && h('div', { className: 'small text-warning-emphasis mb-2' }, h('i', { className: 'bi bi-pencil me-1' }),
      `Kết quả đang dùng điểm bạn tự nhập cho: ${typed.map(k => partLabel(k, guided)).join(', ')}. Điểm chính thức xem ở giảng viên.`),

    h('label', { className: 'form-label small fw-semibold mb-1', htmlFor: 'plan-target' }, 'Mục tiêu của bạn'),
    h('select', { id: 'plan-target', className: 'form-select form-select-sm mb-2', value: goal.score, onChange: e => update({ target: Number(e.target.value) }) },
      GOAL_TARGETS.map(t => h('option', { key: t.score, value: t.score }, `${t.label} – điểm môn từ ${t.score.toFixed(1)}`))),

    h('div', { className: 'plan-compare mb-2' },
      h('div', null, h('small', { className: 'text-muted d-block' }, 'Điểm hiện tại'), h('div', { className: 'plan-num' }, withLetter(r.current)), h('small', { className: 'text-muted' }, currentNote)),
      h('div', null, h('small', { className: 'text-muted d-block' }, 'Điểm yêu cầu'), h('div', { className: 'plan-num' }, `${goal.score.toFixed(1)} (${goal.letter})`), h('small', { className: 'text-muted' }, goal.label)),
      h('div', null, h('small', { className: 'text-muted d-block' }, 'Chênh lệch'),
        h('div', { className: `plan-num ${gap == null ? '' : gap >= 0 ? 'text-success' : 'text-danger'}` }, gap == null ? '—' : `${gap > 0 ? '+' : ''}${gap.toFixed(1)}`),
        h('small', { className: 'text-muted' }, gap == null ? 'chưa so được' : gap >= 0 ? 'đang đủ' : 'đang thiếu'))),
    h('div', { className: `alert alert-${tone} small py-2`, role: 'status' }, h('i', { className: `bi bi-${icon} me-1` }), message),

    h('details', { className: 'small' },
      h('summary', { className: 'text-muted' }, 'Xem tất cả các mức xếp loại'),
      h('table', { className: 'table table-sm mb-0 mt-1' },
        h('tbody', null, GOAL_TARGETS.map(t => {
          const [text, cls] = levelText(t)
          return h('tr', { key: t.score, className: t.score === goal.score ? 'table-active' : '' },
            h('td', null, h('button', { type: 'button', className: 'btn btn-link btn-sm p-0 text-decoration-none', onClick: () => update({ target: t.score }) }, `${t.label} – ${t.score.toFixed(1)}`)),
            h('td', { className: `text-end fw-semibold ${cls}` }, text))
        }))))
  )
}

// ── 2. Giáo trình, tài liệu và kế hoạch ──────────────────────────────────────
function PlanPanel({ subject, exams, materials, rec, update }) {
  const today = todayIso()
  const list = upcomingExams(exams.filter(e => e.subjectId === subject.id), [subject], today)
  const exam = list.find(e => e.date === rec.pick) || list[0]
  const date = exam ? exam.date : rec.pick && rec.pick > today ? rec.pick : ''
  const daysLeft = date ? Math.round((new Date(date) - new Date(today)) / 86400000) : 0

  const groups = studyItems(subject.id, materials)
  const count = groups.reduce((a, g) => a + g.items.length, 0)
  const excluded = rec.excluded || []
  const topics = planTopics(groups, excluded, rec.extra)

  const plan = rec.plan?.length ? rec.plan : null
  const done = rec.done || {}
  // Chỉ hiện ngày có nội dung ôn và ngày ôn tổng hợp cuối cùng; ngày trống (ôn lại, làm đề) được ẩn cho gọn
  const shown = plan ? plan.filter((p, i) => p.kind === 'study' || i === plan.length - 1) : []
  const prog = plan ? planProgress(shown, done, today) : null
  const dates = topicDates(plan || [])
  const studied = new Set([...(rec.studied || []), ...shown.filter(p => p.kind === 'study' && done[p.date]).flatMap(p => p.topics)])
  const unfinished = plan ? plan.some(p => p.kind === 'study' && !done[p.date] && p.topics.length) : false
  const planFiles = Object.fromEntries(groups.flatMap(g => g.items).filter(it => it.url).map(it => [it.title, it.url]))

  const create = () => update({ plan: buildStudyPlan(today, date, topics), done: {}, studied: [], planFor: date })
  const redo = () => update({ plan: replan(plan, done, today, date), done: {}, studied: [...studied], planFor: date })
  const toggle = (d) => update({ done: { ...done, [d]: !done[d] } })
  const include = (key) => update({ excluded: excluded.includes(key) ? excluded.filter(k => k !== key) : [...excluded, key] })
  const link = (url, title) => h('a', { href: url, target: '_blank', rel: 'noopener noreferrer', className: 'ms-1', title: `Mở ${title}`, 'aria-label': `Mở ${title}` }, h('i', { className: 'bi bi-box-arrow-up-right' }))

  const status = (it) => studied.has(it.title) ? h('span', { className: 'badge bg-success-subtle text-success' }, 'đã ôn')
    : dates[it.title] ? h('span', { className: 'badge bg-primary-subtle text-primary' }, dayLabel(dates[it.title]))
    : h('span', { className: 'badge bg-secondary-subtle text-secondary' }, 'chưa xếp')
  const row = (it) => h('li', { key: it.key, className: 'list-group-item d-flex gap-2 align-items-start px-0 py-1' },
    !plan && h('input', { type: 'checkbox', className: 'form-check-input mt-1 flex-shrink-0', id: `plan-item-${it.key}`, checked: !excluded.includes(it.key), onChange: () => include(it.key) }),
    h('div', { className: 'flex-grow-1 min-w-0 text-break' },
      h(plan ? 'span' : 'label', plan ? null : { htmlFor: `plan-item-${it.key}` }, it.title), it.url && link(it.url, it.title),
      it.description && h('div', { className: 'text-muted' }, it.description)),
    plan && status(it))

  const typedItems = [...new Set(shown.filter(p => p.kind === 'study').flatMap(p => p.topics).concat(rec.studied || []))]
    .filter(t => !groups.some(g => g.items.some(it => it.title === t)))

  return h('div', null,
    h('h6', { className: 'fw-bold' }, '2. Giáo trình, tài liệu và kế hoạch ôn'),

    list.length > 1 && h('select', { className: 'form-select form-select-sm mb-1', 'aria-label': 'Chọn kỳ thi', value: exam.date, onChange: e => update({ pick: e.target.value }) },
      [...new Map(list.map(e => [e.date, e])).values()].map(e => h('option', { key: e.id, value: e.date }, `Thi ${longDate(e.date)}${e.start ? ` lúc ${e.start}` : ''}`))),
    exam ? h('div', { className: 'small mb-2' }, h('i', { className: 'bi bi-calendar-event me-1' }),
        `Thi ${longDate(exam.date)}${exam.start ? ` lúc ${exam.start}` : ''}${exam.room ? ` · ${exam.room}` : ''} · ${daysLeft ? `còn ${daysLeft} ngày` : 'hôm nay'}`)
      : h('div', { className: 'mb-2' },
          h('label', { className: 'small text-muted d-block mb-1', htmlFor: 'plan-date' }, 'Môn chưa có lịch thi sắp tới. Chọn ngày thi hoặc hạn ôn xong:'),
          h('input', { id: 'plan-date', type: 'date', className: 'form-control form-control-sm', min: addDays(today, 1), value: date, onChange: e => update({ pick: e.target.value }) })),

    h('div', { className: 'small fw-semibold' }, `Mục giáo trình, tài liệu của môn (${count})`),
    count === 0
      ? h('div', { className: 'alert alert-warning small py-2 my-1' }, h('i', { className: 'bi bi-folder-x me-1' }),
          'Môn này chưa có giáo trình hay tài liệu nào trên hệ thống nên không có mục để tổng hợp. Tài liệu do giảng viên đăng ở trang Môn học. Bạn vẫn có thể tự thêm mục cần ôn bên dưới.')
      : h(Frag, null,
          !groups.some(g => g.type === 'giaoTrinh') && h('div', { className: 'small text-warning-emphasis' }, 'Môn chưa có mục loại Giáo trình; dưới đây là các tài liệu khác của môn.'),
          h('div', { className: 'plan-items small mb-1' }, groups.map(g => {
            const t = MATERIAL_TYPES[g.type]
            return h('div', { key: g.type, className: 'mb-1' },
              h('div', { className: 'fw-semibold mt-1', style: { color: t.color } }, h('i', { className: `bi bi-${t.icon} me-1` }), `${t.label} (${g.items.length})`),
              h('ul', { className: 'list-group list-group-flush' }, g.items.map(row)))
          })),
          h('div', { className: 'small text-muted mb-2' }, 'Hệ thống chỉ lưu tên và mô tả tài liệu, không có mục lục chương.')),

    !plan && h(Frag, null,
      h('label', { className: 'small text-muted d-block mb-1', htmlFor: 'plan-extra' }, 'Mục tự thêm, mỗi dòng một mục (vd. chương trong giáo trình):'),
      h('textarea', { id: 'plan-extra', className: 'form-control form-control-sm mb-2', rows: 2, value: rec.extra || '', onChange: e => update({ extra: e.target.value }) }),
      date && daysLeft < 1 && h('div', { className: 'alert alert-warning small py-2' }, 'Kỳ thi diễn ra hôm nay, không còn ngày để lập kế hoạch.'),
      h('button', { type: 'button', className: 'btn btn-sm w-100', style: accent(C), disabled: !topics.length || daysLeft < 1, onClick: create },
        h('i', { className: 'bi bi-magic me-1' }), `Lập kế hoạch ôn ${topics.length} mục`),
      !date && h('div', { className: 'small text-muted mt-1' }, 'Chọn ngày để lập kế hoạch.')),

    plan && h(Frag, null,
      typedItems.length > 0 && h('div', { className: 'small mb-2' }, h('span', { className: 'fw-semibold' }, 'Mục tự thêm: '),
        h('ul', { className: 'list-group list-group-flush' }, typedItems.map(t => row({ key: t, title: t, description: '', url: '' })))),
      date && rec.planFor && date !== rec.planFor && h('div', { className: 'alert alert-warning small py-2' },
        `Kế hoạch lập cho ngày ${longDate(rec.planFor)}, khác ngày thi đang chọn. Bấm "Lập lại từ hôm nay" để chia lại.`),
      h('div', { className: 'd-flex flex-wrap align-items-center gap-2 mb-2 border-top pt-2' },
        h('small', { className: 'text-muted me-auto' }, `Lịch ôn · đã xong ${prog.done}/${prog.total} ngày` + (prog.behind ? ` · chậm ${prog.behind} ngày` : '')),
        unfinished && daysLeft >= 1 && (prog.behind > 0 || date !== rec.planFor) && h('button', { type: 'button', className: 'btn btn-sm btn-outline-primary', onClick: redo, title: 'Chia lại phần chưa ôn từ hôm nay' },
          h('i', { className: 'bi bi-arrow-repeat me-1' }), 'Lập lại từ hôm nay'),
        h('button', { type: 'button', className: 'btn btn-sm btn-outline-danger', onClick: () => update({ plan: null, done: {}, studied: [], planFor: null }) },
          h('i', { className: 'bi bi-trash me-1' }), 'Xóa kế hoạch')),
      h('div', { className: 'progress mb-2', style: { height: 6 } },
        h('div', { className: 'progress-bar', style: { width: `${prog.total ? prog.done / prog.total * 100 : 0}%`, backgroundColor: C } })),
      plan.length > shown.length && h('small', { className: 'text-muted d-block mb-1' }, `Các ngày còn lại (${plan.length - shown.length} ngày) dùng để ôn lại phần đã học, làm đề.`),
      h('ul', { className: 'list-group list-group-flush small' }, shown.map(p =>
        h('li', { key: p.date, className: `list-group-item d-flex gap-2 align-items-start px-1${p.date === today ? ' bg-primary-subtle' : ''}` },
          h('input', { type: 'checkbox', className: 'form-check-input mt-1 flex-shrink-0', 'aria-label': `Đã ôn xong ngày ${dayLabel(p.date)}`, checked: !!done[p.date], onChange: () => toggle(p.date) }),
          h('span', { className: `fw-semibold text-nowrap${p.date < today && !done[p.date] ? ' text-danger' : ''}`, style: { minWidth: 70 } }, dayLabel(p.date)),
          h('div', { className: `min-w-0 text-break${done[p.date] ? ' text-decoration-line-through text-muted' : ''}` },
            p.topics.length ? p.topics.map(t => h('div', { key: t }, t, planFiles[t] && link(planFiles[t], t))) : 'Ôn lại phần đã học, làm đề')))))
  )
}

export default function StudyPlanner({ user, subjects = [], exams = [], materials = [], quizzes = [], homeworks = [], submissions = [] }) {
  const owner = ownerOf(user)
  const key = ownedKey(PLAN_KEY, owner)
  const [store, setStore] = useState(() => load(key, null) || { last: null, bySubject: migratePlans(load(ownedKey(OLD_PLAN_KEY, owner), {}), exams) })
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => { save(key, store) }, [store])
  useEffect(() => {
    let alive = true
    setData(null); setError(null)
    loadGradeData(user, submissions, quizzes).then(d => { if (alive) setData(d) }, e => { if (alive) setError(errorText(e)) })
    return () => { alive = false }
  }, [owner, attempt])

  const groups = subjectGroups(subjects, exams, todayIso())
  const next = new Map()
  for (const e of upcomingExams(exams, subjects, todayIso())) if (!next.has(e.subjectId)) next.set(e.subjectId, e.date)
  const subject = subjects.find(s => s.id === store.last)
  const rec = subject ? store.bySubject[subject.id] || {} : {}
  const update = (patch) => setStore(s => ({ ...s, bySubject: { ...s.bySubject, [subject.id]: { ...s.bySubject[subject.id], ...patch } } }))

  return h(ToolCard, { icon: 'calendar2-check', color: C, title: 'Lập kế hoạch ôn thi', sub: 'So điểm hiện tại với mục tiêu và chia lịch ôn theo từng mục tài liệu của môn' },
    subjects.length === 0 ? ToolEmpty('book', 'Chưa có môn học nào')
    : h('select', { className: 'form-select form-select-sm mb-3', 'aria-label': 'Chọn môn cần ôn', value: subject ? String(subject.id) : '',
        onChange: e => setStore(s => ({ ...s, last: subjects.find(x => String(x.id) === e.target.value)?.id ?? null })) },
        h('option', { value: '' }, '— Chọn môn cần ôn —'),
        groups.map(g => h('optgroup', { key: g.label, label: g.label }, g.items.map(s => h('option', { key: s.id, value: String(s.id) },
          `${offeringTitle(s)}${next.has(s.id) ? ` – thi ${dayLabel(next.get(s.id))}` : ''}${store.bySubject[s.id]?.plan?.length ? ' ✓' : ''}`))))),

    subjects.length > 0 && !subject && ToolEmpty('calendar2-week', 'Chọn môn để xem điểm cần đạt, các mục giáo trình và lập lịch ôn'),

    subject && h('div', { className: 'row g-4', key: subject.id },
      h('div', { className: 'col-12 col-xl-6' },
        error ? h('div', { className: 'alert alert-danger small' }, `Không tải được điểm từ máy chủ nên chưa so sánh được: ${error} `,
            h('button', { type: 'button', className: 'btn btn-sm btn-outline-danger ms-1', onClick: () => setAttempt(a => a + 1) }, 'Thử lại'))
        : !data ? h('div', { className: 'text-muted small py-3' }, h('span', { className: 'spinner-border spinner-border-sm me-2' }), 'Đang tải điểm…')
        : h(GoalPanel, { subject, user, data, quizzes, homeworks, rec, update })),
      h('div', { className: 'col-12 col-xl-6' }, h(PlanPanel, { subject, exams, materials, rec, update })))
  )
}
