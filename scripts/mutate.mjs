// scripts/mutate.mjs – Kiểm thử đột biến firestore.rules (xem docs/kiem-thu/).
// Sinh các bản firestore.rules bị sửa sai cố ý, chạy cả bộ gốc và bộ chuyên sâu trên từng bản.
// Không sửa firestore.rules; các bản đột biến và kết quả nằm ở thư mục ngoài repo.
// Chạy trong `firebase emulators:exec` (cwd = thư mục dự án):
//   npx firebase emulators:exec --only firestore --project demo-studytask "node scripts/mutate.mjs [thư-mục-kết-quả] [số-bản]"
//   ONLY=14,89 ... chỉ chạy các bản có số thứ tự đã cho
//   SHARD=0/4 ... chỉ chạy lô 0 trong 4 lô, để chạy song song trên nhiều Emulator (mỗi lô một thư-mục-kết-quả riêng)
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const SP = process.argv[2] || join(tmpdir(), 'studytask-mutants')
// Chuẩn hóa về LF: tệp CRLF trên Windows làm các regex kết thúc bằng $ không khớp, thiếu đột biến
const orig = readFileSync('firestore.rules', 'utf8').replace(/\r\n/g, '\n')
const lines = orig.split('\n')
const mutants = []
const add = (desc, text) => { if (text !== orig) mutants.push({ desc, text }) }
const lineOf = (i) => `L${i + 1}`

lines.forEach((ln, i) => {
  const rep = (desc, newLn) => { const c = [...lines]; c[i] = newLn; add(`${lineOf(i)} ${desc}: ${ln.trim()}`, c.join('\n')) }
  const isComment = ln.trim().startsWith('//')
  if (isComment) return
  // 1. bỏ từng vai trò khỏi hasRole([...])
  for (const m of ln.matchAll(/hasRole\(\[([^\]]*)\]\)/g)) {
    const roles = m[1].split(',').map((s) => s.trim())
    for (const r of roles) {
      const left = roles.filter((x) => x !== r)
      if (left.length) rep(`bỏ vai trò ${r}`, ln.replace(m[0], `hasRole([${left.join(', ')}])`))
    }
    if (!roles.includes("'student'")) rep('thêm vai trò student', ln.replace(m[0], `hasRole([${m[1]}, 'student'])`))
  }
  // 2. isOwner -> signedIn ; isAdmin -> signedIn
  if (/isOwner\((uid)\)/.test(ln) && !ln.includes('function')) rep('isOwner→signedIn', ln.replace(/isOwner\(uid\)/, 'signedIn()'))
  if (/isAdmin\(\)/.test(ln) && !ln.includes('function')) rep('isAdmin→signedIn', ln.replace(/isAdmin\(\)/, 'signedIn()'))
  // 3. allow ... : if <cond> -> if true
  const am = ln.match(/^(\s*allow [^:]+: if )(.*);$/)
  if (am) rep('điều kiện→true', `${am[1]}true;`)
  // 4. && -> || (từng chỗ)
  let idx = -1
  while ((idx = ln.indexOf('&&', idx + 1)) !== -1) rep('&&→||', ln.slice(0, idx) + '||' + ln.slice(idx + 2))
  // 5. == -> !=
  idx = -1
  while ((idx = ln.indexOf('==', idx + 1)) !== -1) rep('==→!=', ln.slice(0, idx) + '!=' + ln.slice(idx + 2))
  // 6. xóa riêng dòng điều kiện kết thúc bằng && (bỏ qua dòng nối của một danh sách viết nhiều dòng: xóa sẽ sai cú pháp)
  const closesEarlierBracket = /^[^[]*\]/.test(ln)
  if (ln.trim().endsWith('&&') && !closesEarlierBracket && !ln.includes('allow') && !ln.includes('function') && !ln.includes('return')) {
    const c = [...lines]; c.splice(i, 1); add(`${lineOf(i)} xóa điều kiện: ${ln.trim()}`, c.join('\n'))
  }
  // 7. biên số
  if (ln.includes('size() > 0')) rep('> 0 → >= 0', ln.replace('size() > 0', 'size() >= 0'))
  if (ln.includes('size() <= 100')) rep('<= 100 → <= 101', ln.replace('size() <= 100', 'size() <= 101'))
  if (ln.includes('size() <= 100')) rep('<= 100 → < 100', ln.replace('size() <= 100', 'size() < 100'))
  // 8. hasOnly/hasAny danh sách
  if (ln.includes("hasOnly(['name', 'phone'])")) rep("thêm 'role' vào hasOnly", ln.replace("['name', 'phone']", "['name', 'phone', 'role']"))
  if (ln.includes("hasOnly(['name', 'phone'])")) rep("bỏ 'phone' khỏi hasOnly", ln.replace("['name', 'phone']", "['name']"))
  if (ln.includes("hasOnly(['name', 'email', 'role'])")) rep("thêm 'subjectIds' vào hasOnly(create)", ln.replace("['name', 'email', 'role']", "['name', 'email', 'role', 'subjectIds']"))
  if (ln.includes("hasOnly(['password', 'updatedAt'])")) rep("thêm 'role' vào hasOnly(secrets)", ln.replace("['password', 'updatedAt']", "['password', 'updatedAt', 'role']"))
  if (ln.includes("hasAny(['review', 'reviewedBy', 'reviewedAt'])")) {
    for (const f of ['review', 'reviewedBy', 'reviewedAt'])
      rep(`bỏ ${f} khỏi danh sách cấm`, ln.replace(new RegExp(`'${f}',?\\s*`), '').replace(/,\s*\]/, ']'))
  }
  if (ln.includes("in ['submitted', 'needsFix']")) rep("cho sửa cả khi approved", ln.replace("['submitted', 'needsFix']", "['submitted', 'needsFix', 'approved']"))
  if (ln.includes("in ['submitted', 'needsFix']")) rep("bỏ needsFix", ln.replace("['submitted', 'needsFix']", "['submitted']"))
  if (ln.includes("data.get('subjectIds', [])")) rep('subjectIds mặc định không rỗng', ln.replace("get('subjectIds', [])", "get('subjectIds', [1,2,3,4,5])"))
  if (ln.includes('hasAny([int(subjectId)])')) rep('hasAny→hasAll(rỗng ok)', ln.replace('.hasAny([int(subjectId)])', '.hasAny([int(subjectId), 5])'))
  // 9. myRole/exists
  if (ln.includes('exists(/databases')) {
    const c = [...lines]; c.splice(i, 1)
    // bỏ cả && trước đó nếu dòng trước kết thúc bằng &&
    add(`${lineOf(i)} bỏ kiểm tra exists: ${ln.trim()}`, c.join('\n'))
  }
  // 10. read: signedIn -> true ; request.auth != null -> true
  if (ln.includes('request.auth != null')) rep('signedIn luôn đúng', ln.replace('request.auth != null', 'true'))
  if (ln.includes('request.auth.uid == uid')) rep('isOwner luôn đúng', ln.replace('request.auth.uid == uid', 'true'))
  // 11. || -> &&
  idx = -1
  while ((idx = ln.indexOf('||', idx + 1)) !== -1) rep('||→&&', ln.slice(0, idx) + '&&' + ln.slice(idx + 2))
  // 12. bỏ kiểm tra kiểu / định dạng
  for (const m of ln.matchAll(/[\w.]+(?:\([^()]*\))? is (?:string|number|int|list|map|bool)\b/g)) rep(`bỏ kiểm tra kiểu ${m[0]}`, ln.replace(m[0], 'true'))
  for (const m of ln.matchAll(/[\w.]+(?:\([^()]*\))?\.matches\('[^']*'\)/g)) rep('bỏ kiểm tra định dạng', ln.replace(m[0], 'true'))
  // 13. biên số: lệch 1 về mỗi phía
  for (const m of ln.matchAll(/(<=|>=|>|<) (\d+)\b/g)) {
    for (const d of [1, -1]) rep(`biên ${m[0]} → ${m[1]} ${+m[2] + d}`, ln.slice(0, m.index) + `${m[1]} ${+m[2] + d}` + ln.slice(m.index + m[0].length))
  }
  // 14. danh sách trường hasOnly: bỏ từng trường, thêm trường lạ
  for (const m of ln.matchAll(/hasOnly\(\[([^\]]*)\]\)/g)) {
    const keys = m[1].split(',').map((s) => s.trim())
    for (const k of keys) rep(`bỏ ${k} khỏi hasOnly`, ln.replace(m[0], `hasOnly([${keys.filter((x) => x !== k).join(', ')}])`))
    if (!keys.includes("'role'")) rep("thêm 'role' vào hasOnly", ln.replace(m[0], `hasOnly([${m[1]}, 'role'])`))
  }
  // 15. kiểm tra từng trường không bắt buộc: bỏ hẳn, hoặc nới giới hạn độ dài
  for (const m of ln.matchAll(/optional(?:String|Count)\((\w+), '(\w+)'(?:, (\d+))?\)/g)) {
    if (ln.includes('function')) continue
    rep(`bỏ kiểm tra trường ${m[2]}`, ln.replace(m[0], 'true'))
    if (m[3]) rep(`nới độ dài ${m[2]}`, ln.replace(m[0], m[0].replace(`, ${m[3]})`, `, ${+m[3] + 1})`)))
  }
  // 16. riêng activities
  if (ln.includes("e.type in [")) {
    for (const t of ['quiz', 'homework', 'material']) rep(`bỏ loại ${t}`, ln.replace(new RegExp(`'${t}',?\\s*`), '').replace(/,\s*\]/, ']'))
    rep('thêm loại sự kiện lạ', ln.replace("'material']", "'material', 'hacked']"))
  }
  if (ln.includes('old.size() + 1')) rep('cho thêm 2 sự kiện', ln.replace('old.size() + 1', 'old.size() + 2'))
  if (ln.includes('validActivityEvent(cur[old.size()])')) {
    rep('kiểm tra phần tử đầu thay vì phần tử mới', ln.replace('cur[old.size()]', 'cur[0]'))
    rep('bỏ kiểm tra sự kiện mới', ln.replace('validActivityEvent(cur[old.size()])', 'true'))
  }
  if (ln.includes('teachesStudent(uid);') && !ln.includes('function')) rep('giáo viên nào cũng đọc được', ln.replace('teachesStudent(uid)', "hasRole(['teacher'])"))
  if (ln.includes('.hasAny(get(')) rep('môn của sinh viên mặc định không rỗng', ln.replace(/get\('subjectIds', \[\]\)\);$/, "get('subjectIds', [1,2,3,4,5]));"))
  if (ln.includes('appendsOneEvent(') && !ln.includes('function')) rep('bỏ kiểm tra chỉ thêm cuối', ln.replace(/appendsOneEvent\((?:[^()]|\([^()]*\))*\)/, 'true'))
  if (ln.includes('validActivityDoc(uid)') && !ln.includes('function')) rep('bỏ kiểm tra tài liệu nhật ký', ln.replace('validActivityDoc(uid)', 'true'))
  if (ln.includes('validUserData()') && !ln.includes('function')) rep('bỏ kiểm tra userData', ln.replace('validUserData()', 'true'))
  if (ln.includes('validGraduationApp(uid)') && !ln.includes('function')) rep('bỏ kiểm tra phiếu', ln.replace('validGraduationApp(uid)', 'true'))
})

// loại trùng
const seen = new Set()
const list = mutants.filter((m) => (seen.has(m.text) ? false : (seen.add(m.text), true)))
console.log(`Tổng số đột biến: ${list.length}`)

mkdirSync(join(SP, 'mut'), { recursive: true })
// bản sao test gốc dùng cổng/đường dẫn rules tuỳ biến (không sửa tệp gốc)
const origTest = readFileSync('tests/firestore.rules.test.mjs', 'utf8')
  .replace("readFileSync('firestore.rules', 'utf8')", "readFileSync(process.env.RULES_FILE, 'utf8')")
  .replace('port: 8080', 'port: Number(process.env.FIRESTORE_EMULATOR_HOST.split(":")[1])')
const tmpOrig = `tests/.tmp-orig-mut-${process.pid}.test.mjs`
writeFileSync(tmpOrig, origTest)

const run = (testFile, rulesFile) => {
  const r = spawnSync('node', ['--test', testFile], { env: { ...process.env, RULES_FILE: rulesFile }, encoding: 'utf8', timeout: 180000 })
  const out = (r.stdout || '') + (r.stderr || '')
  const tests = +(out.match(/ℹ tests (\d+)/)?.[1] ?? 0)
  const fail = +(out.match(/ℹ fail (\d+)/)?.[1] ?? 0)
  const pass = +(out.match(/ℹ pass (\d+)/)?.[1] ?? 0)
  if (/ECONNREFUSED/.test(out)) return { status: 'infra-error', fail, tests }
  if (tests === 0) return { status: 'invalid', fail, tests }
  if (fail > 0) return { status: 'killed', fail, tests }
  return { status: pass === tests ? 'survived' : 'infra-error', fail, tests }
}

const results = []
try {
  const limit = +(process.argv[3] ?? list.length)
  const only = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null
  const [shard, shards] = (process.env.SHARD ?? '0/1').split('/').map(Number)
  for (const [n, m] of list.slice(0, limit).entries()) {
    if (only && !only.includes(n)) continue
    if (n % shards !== shard) continue
    const f = join(SP, 'mut', `m${n}.rules`)
    writeFileSync(f, m.text)
    const a = run(tmpOrig, f)
    const b = run('tests/firestore.rules.deep.test.mjs', f)
    const res = { n, desc: m.desc, orig: a.status, origFail: a.fail, deep: b.status, deepFail: b.fail }
    results.push(res)
    console.log(`#${n} orig=${a.status}(${a.fail}) deep=${b.status}(${b.fail})  ${m.desc}`)
    writeFileSync(join(SP, 'mut-results.json'), JSON.stringify(results, null, 1))
  }
} finally {
  try { unlinkSync(tmpOrig) } catch {}
}
const bad = results.filter((r) => [r.orig, r.deep].some((x) => x === 'infra-error'))
console.log(`Lỗi hạ tầng: ${bad.length}`)
const valid = results.filter((r) => ![r.orig, r.deep].some((x) => x === 'invalid' || x === 'infra-error'))
const surv = valid.filter((r) => r.orig === 'survived' && r.deep === 'survived')
console.log(`\nHợp lệ: ${valid.length}; sống sót cả hai bộ: ${surv.length}; chỉ bộ gốc bắt: ${valid.filter(r=>r.orig==='killed'&&r.deep==='survived').length}; chỉ bộ sâu bắt: ${valid.filter(r=>r.orig==='survived'&&r.deep==='killed').length}`)
