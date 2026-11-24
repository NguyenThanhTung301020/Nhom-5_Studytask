// utils/scope.js – Phạm vi dữ liệu theo vai trò, môn được phân công và lớp học phần (thuần logic)
//
// Một "lớp học phần" = (lớp, môn). Cùng một môn có thể mở ở nhiều lớp và do nhiều giáo viên đảm nhận,
// nên lọc chỉ theo môn làm giáo viên thấy lịch của mọi lớp. Quy ước dữ liệu:
//   - lịch học / lịch thi: có `subjectId` và (nếu thuộc một lớp) `classId`
//   - hồ sơ sinh viên: `classId` (lớp sinh hoạt), `subjectIds` (các môn của học kỳ)
//   - hồ sơ giáo viên: `subjectIds` (môn được phân công ở kỳ này), `sections: [{ classId, subjectId }]` (lớp đang dạy),
//                      `canTeachSubjectIds` (môn thuộc bộ môn, có thể được phân công; không dùng để hiển thị)
// Hồ sơ cũ không có `sections` / `classId` vẫn chạy như trước (lọc theo môn).
// Admin và các phòng ban thấy tất cả; máy chủ (studytask_api.py) áp cùng quy tắc cho sinh viên và cho kết quả của giáo viên.

export const FULL_ROLES = ['admin', 'training', 'finance']

export const sectionKey = (classId, subjectId) => `${classId}|${subjectId}`

const seesAll = (user) => !user || FULL_ROLES.includes(user.role)

// Các lớp học phần giáo viên đang dạy: `sections` ∩ `subjectIds`
// (Admin bỏ một môn khỏi hồ sơ thì các lớp của môn đó cũng không còn hiện). null = hồ sơ chưa phân theo lớp.
export function teacherSections(user) {
  if (!user || user.role !== 'teacher' || !Array.isArray(user.sections)) return null
  const ids = Array.isArray(user.subjectIds) ? new Set(user.subjectIds) : null
  return user.sections.filter(s => s && (!ids || ids.has(s.subjectId)))
}

// Lọc danh sách có `subjectId` theo các môn được phân công (subjectIds null/thiếu = xem tất cả, giống app.js cũ)
export function scopeBySubject(user, items = []) {
  if (seesAll(user) || !Array.isArray(user.subjectIds)) return items
  const ids = new Set(user.subjectIds)
  return items.filter(x => ids.has(x.subjectId))
}

// Lọc danh sách MÔN HỌC (khóa là `id`, không phải `subjectId` như các danh sách còn lại)
export function scopeSubjects(user, subjects = []) {
  if (seesAll(user) || !Array.isArray(user.subjectIds)) return subjects
  const ids = new Set(user.subjectIds)
  return subjects.filter(s => ids.has(s.id))
}

// Lọc lịch học / lịch thi: theo môn, rồi theo lớp.
//   - sinh viên: chỉ lớp của mình (mục không gắn lớp là mục chung của môn, vẫn hiện)
//   - giáo viên đã phân theo lớp: chỉ các lớp học phần mình dạy
export function scopeByClass(user, items = []) {
  const bySubject = scopeBySubject(user, items)
  if (seesAll(user)) return bySubject
  if (user.role === 'student' && user.classId)
    return bySubject.filter(x => !x.classId || x.classId === user.classId)
  const secs = teacherSections(user)
  if (secs) {
    const keys = new Set(secs.map(s => sectionKey(s.classId, s.subjectId)))
    return bySubject.filter(x => !x.classId || keys.has(sectionKey(x.classId, x.subjectId)))
  }
  return bySubject
}

// Giáo viên có dạy sinh viên này không (dùng cho danh sách lớp, báo cáo, bảng điểm, danh bạ)
export function studentInScope(user, student) {
  if (seesAll(user)) return true
  if (!student || student.role !== 'student') return false
  const mine = Array.isArray(user.subjectIds) ? user.subjectIds : []
  const theirs = Array.isArray(student.subjectIds) ? student.subjectIds : null
  const secs = teacherSections(user)
  if (secs && student.classId)
    return secs.some(s => s.classId === student.classId && (theirs === null || theirs.includes(s.subjectId)))
  return theirs !== null && theirs.some(id => mine.includes(id))
}

// Danh mục lớp suy ra từ danh sách sinh viên: classId → { id, name, cohort, namThu, subjectIds }
// Sinh viên được lưu theo KHÓA ("2023-2027"), năm học ("2026-2027") và học kỳ 1/2 của năm; năm thứ suy ra từ khóa.
export function classCatalog(users = []) {
  const map = new Map()
  for (const u of users) {
    if (u.role !== 'student' || !u.classId) continue
    if (!map.has(u.classId)) map.set(u.classId, { id: u.classId, name: u.className || u.classId, cohort: u.cohort ?? null,
                                                  namThu: studyYear(u.cohort, u.namHoc) || (u.namThu ?? null), subjectIds: new Set() })
    const c = map.get(u.classId)
    ;(u.subjectIds || []).forEach(id => c.subjectIds.add(id))
  }
  return map
}

// Các lớp được chọn khi xếp lịch cho một môn: giáo viên → lớp mình dạy môn đó; admin/đào tạo → mọi lớp học môn đó
export function classOptionsForSubject(user, users, subjectId) {
  const cat = classCatalog(users)
  const secs = teacherSections(user)
  const ids = secs ? secs.filter(s => s.subjectId === subjectId).map(s => s.classId)
                   : [...cat.values()].filter(c => c.subjectIds.has(subjectId)).map(c => c.id)
  return [...new Set(ids)].sort().map(id => ({ id, name: cat.get(id)?.name || id, cohort: cat.get(id)?.cohort ?? null }))
}

// Các lớp xuất hiện trong một danh sách lịch (để làm bộ lọc trên trang): [{ id, name }]
export function classesInItems(items = []) {
  const map = new Map()
  for (const x of items) if (x.classId && !map.has(x.classId)) map.set(x.classId, { id: x.classId, name: x.className || x.classId })
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

// ── Quy ước học kỳ ──────────────────────────────────────────────────────────────────────────
// Mỗi năm học có 2 học kỳ (HK1, HK2). Thứ tự `hocKy` 1..8 của một môn chỉ là VỊ TRÍ trong khung đào tạo, hiển thị là
// "Năm 2 – Học kỳ 1". Sinh viên không lưu "kỳ số mấy" mà lưu KHÓA ("2023-2027"), năm học và học kỳ 1/2 hiện tại;
// năm thứ và học kỳ của khung suy ra từ các giá trị đó.
export const yearOfStudy = (hocKy) => (hocKy ? Math.ceil(hocKy / 2) : 0)          // vị trí 1..8 → năm 1..4
export const termOfYear = (hocKy) => (hocKy ? (hocKy % 2 ? 1 : 2) : 0)             // vị trí 1..8 → học kỳ 1 hoặc 2 của năm
export const termLabel = (hocKy) => (hocKy ? `Năm ${yearOfStudy(hocKy)} – Học kỳ ${termOfYear(hocKy)}` : '')

// Năm học bắt đầu từ năm nào: "2026-2027" → 2026 (chấp nhận gạch nối thường, gạch ngang dài, hoặc số)
const startYear = (s) => { const m = String(s ?? '').match(/(\d{4})/); return m ? Number(m[1]) : null }

// Năm thứ của sinh viên: khóa "2023-2027", năm học "2026-2027" → năm thứ 4. Trả 0 nếu thiếu dữ liệu hoặc ngoài khóa
export function studyYear(cohort, namHoc) {
  const from = startYear(cohort), at = startYear(namHoc)
  if (from === null || at === null) return 0
  const y = at - from + 1
  return y >= 1 && y <= 8 ? y : 0
}

// Vị trí trong khung (1..8) mà sinh viên đang học: năm thứ và học kỳ 1/2 → 2(năm-1)+học kỳ
export const khungPosition = (namThu, hocKy) => (namThu >= 1 && (hocKy === 1 || hocKy === 2) ? (namThu - 1) * 2 + hocKy : 0)

// Nhãn học kỳ của học phần: có năm học → "HK1 · 2025-2026" (học phần mở theo năm); dữ liệu cũ → "Năm 2 · HK1"; chưa gắn → rỗng
export const semesterLabel = (subject) => (subject?.namHoc && subject?.ky ? `HK${subject.ky} · ${subject.namHoc}`
  : subject?.hocKy ? `Năm ${yearOfStudy(subject.hocKy)} · HK${termOfYear(subject.hocKy)}` : '')

// Các học kỳ có trong danh sách môn, tăng dần
export const semestersOf = (subjects = []) => [...new Set(subjects.map(s => s.hocKy).filter(Boolean))].sort((a, b) => a - b)

// Giáo viên hiển thị trên thẻ môn học. `entries` = [{ uid, name, classIds }] (các giáo viên được phân công môn đó; classIds = lớp họ dạy môn này).
//   - sinh viên: chỉ giáo viên dạy lớp của mình
//   - giáo viên đã phân theo lớp: bản thân và những người dạy chung lớp với mình
//   - admin/phòng ban: tất cả
// Giáo viên chưa phân theo lớp (hồ sơ cũ, classIds rỗng) luôn hiện vì không biết họ dạy lớp nào.
export function visibleTeachers(user, subjectId, entries = []) {
  if (seesAll(user)) return entries
  if (user.role === 'student' && user.classId)
    return entries.filter(t => !(t.classIds || []).length || t.classIds.includes(user.classId))
  const secs = teacherSections(user)
  if (secs) {
    const mine = new Set(secs.filter(s => s.subjectId === subjectId).map(s => s.classId))
    return entries.filter(t => t.uid === user.uid || !(t.classIds || []).length || t.classIds.some(c => mine.has(c)))
  }
  return entries
}

// Sắp xếp môn theo học kỳ rồi theo mã môn; môn chưa gắn học kỳ xếp cuối
export const sortBySemester = (subjects = []) =>
  subjects.slice().sort((a, b) => (a.hocKy || 99) - (b.hocKy || 99) || String(a.code || '').localeCompare(String(b.code || '')) || String(a.name || '').localeCompare(String(b.name || '')))

// ── Học phần mở theo NĂM HỌC của từng KHÓA ─────────────────────────────────────────────────────
// Cùng một môn mở lại ở năm khác là một bản ghi mới (thư mục tài liệu, đề, giáo viên riêng). Mỗi học phần/lịch học/lịch thi có
//   khoa ("2024-2028"), namHoc ("2025-2026"), ky (1|2) và (học phần) trangThai: da-ket-thuc | dang-hoc | ke-hoach.
// Hiển thị nhóm theo khóa rồi theo học kỳ của năm học đó (vd. khóa 2024-2028: Năm 2 · Học kỳ 1 năm học 2025-2026), mặc định chỉ học kỳ hiện tại.

// Học kỳ hiện tại theo ngày: học kỳ 1 từ tháng 8 đến hết tháng 1, học kỳ 2 từ tháng 2 đến tháng 7 (giống scripts/seed_curriculum.py term_of)
export function currentTerm(date = new Date()) {
  const y = date.getFullYear(), m = date.getMonth() + 1
  const start = m >= 8 ? y : y - 1
  return { start, ky: (m >= 8 || m === 1) ? 1 : 2, namHoc: `${start}-${start + 1}` }
}

export const termKey = (x) => (x && x.namHoc && x.ky ? `${x.namHoc}|${x.ky}` : '')
export const termName = (namHoc, ky) => `Học kỳ ${ky} · Năm học ${namHoc}`
export const termKeyName = (key) => { const [nh, ky] = String(key).split('|'); return nh && ky ? termName(nh, ky) : '' }

// Tên hiển thị của học phần: thêm nhãn năm học để phân biệt các lần mở của cùng một môn ("Cơ sở dữ liệu · HK1 2025-2026")
export const offeringTitle = (s) => (s ? `${s.name || ''}${s.namHoc && s.ky ? ` · HK${s.ky} ${s.namHoc}` : ''}` : '')

// Học kỳ của một mục lịch học/lịch thi: ưu tiên chính mục, sau đó học phần của nó; null với dữ liệu cũ chưa gắn năm học
export function termInfoOf(item, subjectOf) {
  if (termKey(item)) return item
  const s = subjectOf ? subjectOf(item?.subjectId) : null
  return termKey(s) ? s : null
}

// Mục có thuộc học kỳ đã chọn không (sel = termKey, '' = tất cả). Mục chưa gắn năm học (dữ liệu cũ) luôn hiện để không bị mất
export const inTerm = (item, sel, subjectOf) => {
  if (!sel) return true
  const t = termInfoOf(item, subjectOf)
  return !t || termKey(t) === sel
}

// Mục có thuộc khóa đã chọn không ('' = tất cả khóa). Mục không rõ khóa luôn hiện
export const inKhoa = (item, khoa, subjectOf) => {
  if (!khoa) return true
  const k = item?.khoa || subjectOf?.(item?.subjectId)?.khoa
  return !k || k === khoa
}

const termSortValue = (namHoc, ky) => startYear(namHoc) * 10 + Number(ky)

// Các khóa có trong danh sách học phần/lịch, mới nhất trước
export const khoaChoices = (items = []) => [...new Set(items.map(x => x.khoa).filter(Boolean))].sort((a, b) => startYear(b) - startYear(a))

// Các học kỳ (năm học + kỳ) có trong danh sách, mới nhất trước; đánh dấu học kỳ hiện tại
export function termChoices(items = [], cur = currentTerm()) {
  const curKey = termKey(cur)
  const map = new Map()
  for (const x of items) if (termKey(x) && !map.has(termKey(x))) map.set(termKey(x), { key: termKey(x), namHoc: x.namHoc, ky: x.ky })
  return [...map.values()].sort((a, b) => termSortValue(b.namHoc, b.ky) - termSortValue(a.namHoc, a.ky))
    .map(t => ({ ...t, current: t.key === curKey, label: termName(t.namHoc, t.ky) + (t.key === curKey ? ' (hiện tại)' : '') }))
}

// Mặc định lọc theo học kỳ hiện tại nếu có dữ liệu của học kỳ đó, ngược lại hiện tất cả ('')
export const defaultTermSel = (items = [], cur = currentTerm()) => (items.some(x => termKey(x) === termKey(cur)) ? termKey(cur) : '')

// Nhóm học phần theo KHÓA rồi theo học kỳ: [{ khoa, terms: [{ key, namHoc, ky, namThu, current, items }] }]
// Khóa mới nhất trước; trong khóa, học kỳ theo thứ tự thời gian; học phần chưa gắn khóa/năm học nằm ở nhóm cuối (khoa '').
export function groupOfferings(subjects = [], cur = currentTerm()) {
  const curKey = termKey(cur)
  const byKhoa = new Map()
  for (const s of subjects) {
    const khoa = s.khoa || ''
    if (!byKhoa.has(khoa)) byKhoa.set(khoa, new Map())
    const tk = termKey(s) || ''
    const terms = byKhoa.get(khoa)
    if (!terms.has(tk)) terms.set(tk, { key: tk, namHoc: s.namHoc || '', ky: s.ky || 0, namThu: studyYear(khoa, s.namHoc) || (s.namThu ?? 0), current: !!tk && tk === curKey, items: [] })
    terms.get(tk).items.push(s)
  }
  return [...byKhoa.entries()]
    .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : startYear(b) - startYear(a)))
    .map(([khoa, terms]) => ({
      khoa,
      terms: [...terms.values()].sort((a, b) => (a.key === '' ? 1 : b.key === '' ? -1 : termSortValue(a.namHoc, a.ky) - termSortValue(b.namHoc, b.ky)))
        .map(t => ({ ...t, items: t.items.slice().sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')) || String(a.name || '').localeCompare(String(b.name || ''))) })),
    }))
}

// Tiêu đề nhóm: "Khóa 2024-2028 · Năm 2 · Học kỳ 1 (2025-2026)"; dữ liệu cũ → "Chưa gắn khóa / học kỳ"
export function groupTitle(khoa, term) {
  if (!khoa && !term?.key) return 'Chưa gắn khóa / học kỳ'
  const parts = []
  if (khoa) parts.push(`Khóa ${khoa}`)
  if (term?.namThu) parts.push(`Năm ${term.namThu}`)
  if (term?.key) parts.push(`Học kỳ ${term.ky} (${term.namHoc})`)
  return parts.join(' · ')
}

// ── Trang Quản lý lớp học: học phần mặc định và danh sách sinh viên của một học phần mở ─────────────────────────────
// Hồ sơ sinh viên chỉ lưu `subjectIds` của HỌC KỲ HIỆN TẠI, nên học phần đã kết thúc (hoặc kế hoạch) của khóa không
// tìm được sinh viên qua subjectIds. Mọi lớp của một khóa học cùng chương trình (một chuyên ngành), nên sinh viên của
// học phần = sinh viên đang có môn đó trong subjectIds, hoặc cùng khóa (`cohort` = `khoa` của học phần).
export function offeringRoster(user, users = [], subject) {
  if (!subject) return []
  const sid = subject.id
  const secs = teacherSections(user)
  return users.filter(u => {
    if (u.role !== 'student') return false
    const takes = (Array.isArray(u.subjectIds) && u.subjectIds.includes(sid)) || (!!subject.khoa && u.cohort === subject.khoa)
    if (!takes) return false
    if (seesAll(user)) return true
    if (secs && u.classId) return secs.some(s => s.classId === u.classId && s.subjectId === sid)   // giáo viên: đúng lớp học phần mình dạy
    return studentInScope(user, u)
  })
}

// Học phần chọn sẵn khi mở trang: học phần đầu tiên của học kỳ hiện tại (khóa mới nhất trước), không có thì học phần
// mới nhất đã gắn khóa; dữ liệu cũ chưa gắn khóa/học kỳ (môn demo ban đầu) chỉ chọn khi không còn gì khác.
export function defaultOfferingId(subjects = [], cur = currentTerm()) {
  if (!subjects.length) return null
  const groups = groupOfferings(subjects, cur)
  for (const g of groups) for (const t of g.terms) if (t.current && t.items.length) return t.items[0].id
  const tagged = subjects.filter(s => termKey(s)).sort((a, b) => termSortValue(b.namHoc, b.ky) - termSortValue(a.namHoc, a.ky))
  return (tagged[0] || subjects[0]).id
}

export const OFFERING_STATUS = { 'dang-hoc': 'Đang học', 'da-ket-thuc': 'Đã kết thúc', 'ke-hoach': 'Kế hoạch' }
