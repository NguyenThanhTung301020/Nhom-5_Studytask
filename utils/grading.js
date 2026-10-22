// utils/grading.js – Quy chế tính điểm môn học (thuần logic, không phụ thuộc giao diện)
// Căn cứ: tài liệu "Tỉ lệ và cách tính trọng số điểm theo loại môn" (docs/thiet-ke/02-quy-che-tinh-diem.md)
//
// Điểm môn = Σ (trọng số thành phần × điểm thành phần), tổng trọng số = 100%
// Thành phần: cc = chuyên cần, bt = bài tập / trắc nghiệm quá trình, gk = giữa kỳ, ck = cuối kỳ / sản phẩm
// Mọi trọng số lưu dạng số nguyên phần trăm (10 = 10%); điểm thang 10.

export const COMPONENTS = ['cc', 'bt', 'gk', 'ck']
export const COMPONENT_LABEL = { cc: 'Chuyên cần', bt: 'Bài tập / TN', gk: 'Giữa kỳ', ck: 'Cuối kỳ / SP' }

// Mục 2 – bộ trọng số gợi ý theo loại môn. cat = nhóm giới hạn ở mục 6.
// Lưu ý: bảng mục 6 không chứa được L2 (CK 45% < 50%) và Q70 (BT 35% < 40%, CK 30% < 50%),
// nên hai bộ này dùng nhóm giới hạn 'qt' (môn nặng quá trình) – xem tài liệu thiết kế.
export const PRESETS = {
  L1:  { label: 'Thuần lý thuyết',                 cat: 'lt', cc: 10, bt: 15, gk: 20, ck: 55 },
  L2:  { label: 'Lý thuyết, giao nhiều bài tập',   cat: 'qt', cc: 10, bt: 30, gk: 15, ck: 45 },
  L3:  { label: 'Lý thuyết, giao ít bài tập',      cat: 'lt', cc: 5,  bt: 10, gk: 25, ck: 60 },
  H1:  { label: 'Thuần thực hành',                 cat: 'th', cc: 10, bt: 50, gk: 0,  ck: 40 },
  Q50: { label: 'Quá trình 50% – cuối kỳ 50%',     cat: 'lt', cc: 10, bt: 25, gk: 15, ck: 50 },
  Q70: { label: 'Quá trình 70% – cuối kỳ 30%',     cat: 'qt', cc: 10, bt: 35, gk: 25, ck: 30 },
}

// Mục 6 – giới hạn [min, max] (%) theo nhóm môn
export const LIMITS = {
  lt: { label: 'Môn lý thuyết',            cc: [0, 10], bt: [10, 35], gk: [10, 30], ck: [50, 70] },
  th: { label: 'Môn thực hành',            cc: [5, 15], bt: [40, 60], gk: [0, 20],  ck: [30, 50] },
  qt: { label: 'Môn nặng quá trình',       cc: [0, 15], bt: [10, 60], gk: [0, 30],  ck: [30, 70] },
}
export const CC_MAX_GLOBAL   = 20   // chuyên cần tối đa chung
export const ITEM_MIN_SHARE  = 2    // mỗi bài tập đơn lẻ ≥ 2% điểm môn
export const ITEM_MAX_SHARE  = 10   // mỗi bài tập đơn lẻ ≤ 10% điểm môn
export const ONLINE_MAX      = 50   // đánh giá trực tuyến ≤ 50% điểm học phần

export const round1 = (x) => x == null || isNaN(x) ? null : Math.round((x + 1e-9) * 10) / 10
const clampNum = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

// ── Mục 4 – trọng số bài tập gợi ý theo số bài được tính điểm (n) ──
// Bảng tài liệu: 2→15, 3→20, 5→30, 8→40, 10→40, 12→45; các mốc giữa nội suy theo bậc.
export function suggestBtWeight(n, cat = 'lt') {
  if (n <= 0) return 0
  if (cat === 'th') return n < 4 ? 40 : n < 8 ? 50 : 60   // thực hành: bài TH từng buổi chiếm 40–60%
  if (n === 1) return 10
  if (n === 2) return 15
  if (n === 3) return 20
  if (n === 4) return 25
  if (n <= 7)  return n === 5 ? 30 : 35
  if (n <= 10) return 40
  return 45
}

// Số bài điểm thấp nhất được bỏ: 1–4 bài không bỏ; 5–11 bài bỏ 1; từ 12 bài bỏ 2
export const suggestDropLowest = (n) => n < 5 ? 0 : n < 12 ? 1 : 2

// Phân phối lại (100 − bt) cho cc/gk/ck theo tỉ lệ của bộ gợi ý, rồi ép vào giới hạn của nhóm môn
export function autoWeights(presetKey, nCounted) {
  const p   = PRESETS[presetKey] || PRESETS.L1
  const lim = LIMITS[p.cat]
  const drop = suggestDropLowest(nCounted)
  const eff  = Math.max(0, nCounted - drop)

  let bt = nCounted === 0 ? 0 : clampNum(suggestBtWeight(nCounted, p.cat), lim.bt[0], lim.bt[1])
  // Mỗi bài không quá 10% điểm môn: hạ bt nếu vẫn còn trong giới hạn của nhóm
  if (eff > 0 && bt / eff > ITEM_MAX_SHARE && eff * ITEM_MAX_SHARE >= lim.bt[0]) bt = eff * ITEM_MAX_SHARE

  const others = ['cc', 'gk', 'ck']
  const baseSum = others.reduce((s, k) => s + p[k], 0) || 1
  const w = { bt }
  others.forEach(k => { w[k] = Math.round((100 - bt) * p[k] / baseSum) })
  // Ép giới hạn, dồn phần chênh vào ck → gk → cc
  others.forEach(k => { w[k] = clampNum(w[k], lim[k][0], Math.min(lim[k][1], k === 'cc' ? CC_MAX_GLOBAL : 100)) })
  let diff = 100 - COMPONENTS.reduce((s, k) => s + w[k], 0)
  for (const k of ['ck', 'gk', 'cc']) {
    if (diff === 0) break
    const [lo, hi] = lim[k]
    const nv = clampNum(w[k] + diff, lo, k === 'cc' ? Math.min(hi, CC_MAX_GLOBAL) : hi)
    diff -= nv - w[k]; w[k] = nv
  }
  return { weights: w, dropLowest: drop }
}

// Chính sách đầy đủ của một môn (giá trị mặc định khi chưa cấu hình)
export function defaultPolicy(subject = {}) {
  const preset = 'L1'
  return {
    preset, auto: true,
    weights: { ...pick(PRESETS[preset], COMPONENTS) },
    dropLowest: 'auto',
    ckOnline: false,
    attendance: { method: 'score', sessions: 15, a: 1, b: 0.25, c: 0.25, participation: 40 },
    practice: { enabled: false, theoryCredits: subject.credits || 0, practiceCredits: 0 },
  }
}
const pick = (o, keys) => Object.fromEntries(keys.map(k => [k, o[k]]))

// Trọng số và số bài bỏ thực tế áp dụng (auto → tính lại theo số cột được tính điểm)
export function effectivePolicy(policy, nCounted) {
  const pol = { ...defaultPolicy(), ...policy }
  if (pol.auto) {
    const a = autoWeights(pol.preset, nCounted)
    return { ...pol, weights: a.weights, drop: pol.dropLowest === 'auto' ? a.dropLowest : Number(pol.dropLowest) || 0 }
  }
  return { ...pol, drop: pol.dropLowest === 'auto' ? suggestDropLowest(nCounted) : Number(pol.dropLowest) || 0 }
}

// ── Mục 6 – kiểm tra cấu hình trước khi lưu ──
// ctx: { nCounted, nOnlineCounted, credits }  → trả về mảng thông báo lỗi (rỗng = hợp lệ)
export function validatePolicy(policy, ctx = {}) {
  const { nCounted = 0, nOnlineCounted = 0, credits = 3 } = ctx
  const eff = effectivePolicy(policy, nCounted)
  const w = eff.weights
  const p = PRESETS[eff.preset] || PRESETS.L1
  const lim = LIMITS[p.cat]
  const errs = []
  const total = COMPONENTS.reduce((s, k) => s + (Number(w[k]) || 0), 0)
  if (total !== 100) errs.push(`Tổng trọng số phải bằng 100% (hiện ${total}%).`)
  COMPONENTS.forEach(k => {
    const v = Number(w[k]) || 0
    if (v < lim[k][0] || v > lim[k][1]) errs.push(`${COMPONENT_LABEL[k]} ${v}% nằm ngoài giới hạn ${lim[k][0]}–${lim[k][1]}% của nhóm "${lim.label}".`)
  })
  if ((Number(w.cc) || 0) > CC_MAX_GLOBAL) errs.push(`Chuyên cần không quá ${CC_MAX_GLOBAL}%.`)
  if (!(Number(w.ck) > 0)) errs.push('Bắt buộc có điểm cuối kỳ / sản phẩm.')
  const nonZero = COMPONENTS.filter(k => Number(w[k]) > 0).length
  if (nonZero < 2 && credits >= 2) errs.push('Học phần từ 2 tín chỉ phải có ít nhất 2 điểm thành phần.')
  const effN = Math.max(0, nCounted - eff.drop)
  if (Number(w.bt) > 0 && effN === 0) errs.push('Có trọng số bài tập nhưng giáo viên chưa chọn cột bài tập nào để tính điểm.')
  if (effN > 0) {
    const share = Number(w.bt) / effN
    if (share > ITEM_MAX_SHARE) errs.push(`Mỗi bài tập đang chiếm ${share.toFixed(1)}% điểm môn (tối đa ${ITEM_MAX_SHARE}%). Cần thêm cột bài tập hoặc giảm trọng số bài tập.`)
    if (share < ITEM_MIN_SHARE) errs.push(`Mỗi bài tập chỉ chiếm ${share.toFixed(1)}% điểm môn (tối thiểu ${ITEM_MIN_SHARE}%). Bớt cột tính điểm hoặc tăng trọng số bài tập.`)
  }
  const online = (nCounted > 0 ? Number(w.bt) * nOnlineCounted / nCounted : 0) + (eff.ckOnline ? Number(w.ck) : 0)
  if (online > ONLINE_MAX) errs.push(`Đánh giá trực tuyến chiếm ${round1(online)}% (tối đa ${ONLINE_MAX}%).`)
  if (eff.practice?.enabled) {
    const t = Number(eff.practice.theoryCredits) || 0, pr = Number(eff.practice.practiceCredits) || 0
    if (t <= 0 || pr <= 0) errs.push('Môn có cả lý thuyết và thực hành cần nhập số tín chỉ lý thuyết và thực hành (> 0).')
  }
  return errs
}

// ── Mục 4 – điểm bài tập: trung bình có hệ số, bỏ `drop` bài thấp nhất ──
// items: [{ score, k }] (score null = chưa có điểm → không tính)
export function homeworkScore(items, drop = 0) {
  const graded = items.filter(i => i.score != null && !isNaN(i.score)).map(i => ({ score: Number(i.score), k: Number(i.k) || 1 }))
  if (!graded.length) return null
  const kept = graded.slice().sort((a, b) => a.score - b.score).slice(Math.min(drop, graded.length - 1))
  const sk = kept.reduce((s, i) => s + i.k, 0)
  return kept.reduce((s, i) => s + i.k * i.score, 0) / sk
}

// ── Mục 5 – điểm chuyên cần ──
export const attendanceByRatio   = (present, total) => total > 0 ? Math.max(0, Math.min(10, present / total * 10)) : null
export const attendanceByPenalty = ({ unexcused = 0, excused = 0, late = 0 }, { a = 1, b = 0.25, c = 0.25 } = {}) =>
  Math.max(0, 10 - (a * unexcused + b * excused + c * late))
// Cách 3: kết hợp điểm danh và tham gia (wP = % tham gia)
export function attendanceCombined(attScore, participationScore, wP = 40) {
  if (attScore == null && participationScore == null) return null
  if (participationScore == null || !wP) return attScore
  if (attScore == null) return participationScore
  return (1 - wP / 100) * attScore + (wP / 100) * participationScore
}

// Điểm danh từ dữ liệu giáo viên nhập theo phương pháp của môn
export function attendanceFromData(policyAtt = {}, data = {}) {
  if (policyAtt.method === 'ratio')   return data.present == null ? null : attendanceByRatio(Number(data.present), Number(policyAtt.sessions) || 0)
  if (policyAtt.method === 'penalty') return data.unexcused == null && data.excused == null && data.late == null ? null
    : attendanceByPenalty({ unexcused: +data.unexcused || 0, excused: +data.excused || 0, late: +data.late || 0 }, policyAtt)
  return data.score == null ? null : Number(data.score)
}

// ── Tính điểm môn ──
// input: { policy, scores: { cc, bt, gk, ck, th } }  (đã quy về thang 10; null = chưa có)
// → { final, provisional, missing[], parts }
export function subjectScore(policy, scores) {
  const w = policy.weights
  const used = COMPONENTS.filter(k => Number(w[k]) > 0)
  const missing = used.filter(k => scores[k] == null)
  const present = used.filter(k => scores[k] != null)
  const wsum = present.reduce((s, k) => s + Number(w[k]), 0)
  const lt = missing.length ? null : used.reduce((s, k) => s + Number(w[k]) / 100 * scores[k], 0)
  const ltProv = wsum ? present.reduce((s, k) => s + Number(w[k]) * scores[k], 0) / wsum : null

  const pr = policy.practice
  if (pr?.enabled) {
    const t = Number(pr.theoryCredits) || 0, p = Number(pr.practiceCredits) || 0
    const combine = (a, b) => (a == null || b == null) ? null : (a * t + b * p) / (t + p)
    const ltR = round1(lt), ltPR = round1(ltProv)
    return {
      final: round1(combine(ltR, scores.th)),
      provisional: round1(scores.th == null ? ltPR : ltPR == null ? scores.th : combine(ltPR, scores.th)),
      missing: scores.th == null ? [...missing, 'th'] : missing,
      parts: { lt: ltR },
    }
  }
  return { final: round1(lt), provisional: round1(ltProv), missing, parts: {} }
}

// Gộp nhóm quá trình (mục 3): wQT = cc + bt + gk; wCK = ck
export const processFinalSplit = (w) => ({ qt: (+w.cc || 0) + (+w.bt || 0) + (+w.gk || 0), ck: +w.ck || 0 })

// ── Cột điểm quá trình của một môn ─────────────────────────────────
// Cột = bài trắc nghiệm (q:<id>) hoặc bài tập (hw:<id>). Trắc nghiệm là đánh giá trực tuyến.
export function subjectColumns(subjectId, quizzes = [], homeworks = []) {
  return [
    ...quizzes.filter(q => q.subjectId === subjectId).map(q => ({ key: `q:${q.id}`, kind: 'quiz', id: q.id, title: q.title, online: true })),
    ...homeworks.filter(hw => hw.subjectId === subjectId).map(hw => ({ key: `hw:${hw.id}`, kind: 'hw', id: hw.id, title: hw.title, online: hw.type === 'quiz' })),
  ]
}

// Cột nào giáo viên chọn tính điểm bài tập → { key: hệ số k }.
// Chưa cấu hình (columnsDoc rỗng) → mọi cột đều tính điểm, hệ số 1 (giữ cách tính cũ).
export function countedColumns(columnsDoc, columns) {
  if (!columnsDoc || !columnsDoc.counted) return Object.fromEntries(columns.map(c => [c.key, 1]))
  return Object.fromEntries(columns.filter(c => columnsDoc.counted[c.key] != null).map(c => [c.key, Number(columnsDoc.counted[c.key]) || 1]))
}

// Tính toàn bộ điểm một môn cho một sinh viên.
//   colScore(key) → điểm cột (null nếu chưa có); colDone(key) → đã làm/nộp chưa
//   cell = { attData | att, gk, ck, th }  (dữ liệu giáo viên nhập)
export function evaluateStudentSubject({ policy, columns, counted, colScore, colDone, cell = {} }) {
  const countedCols   = columns.filter(c => counted[c.key] != null)
  const uncountedCols = columns.filter(c => counted[c.key] == null)
  const eff = effectivePolicy(policy, countedCols.length)

  const bt = homeworkScore(countedCols.map(c => ({ score: colScore(c.key), k: counted[c.key] })), eff.drop)
  // Cột không tính điểm → tính vào chuyên cần dưới dạng "điểm tham gia" (tỉ lệ cột đã làm × 10)
  const participation = uncountedCols.length ? uncountedCols.filter(c => colDone(c.key)).length / uncountedCols.length * 10 : null
  const attData = cell.attData || (cell.att != null ? { score: cell.att } : {})
  const attScore = attendanceFromData(eff.attendance, attData)
  // Chưa nhập điểm danh → chuyên cần chưa có điểm (không để riêng điểm tham gia thay cho cả cột)
  const cc = attScore == null ? null : attendanceCombined(attScore, participation, Number(eff.attendance?.participation) || 0)

  const scores = { cc, bt, gk: cell.gk ?? null, ck: cell.ck ?? null, th: cell.th ?? null }
  return { eff, scores, attScore, participation, countedCols, uncountedCols, result: subjectScore(eff, scores) }
}
