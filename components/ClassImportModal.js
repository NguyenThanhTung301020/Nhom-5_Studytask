// components/ClassImportModal.js – Hộp thoại nhập danh sách lớp từ CSV / dán từ Excel ([D3] mục 14)
// Chỉ Admin và Phòng Đào tạo mở được; máy chủ cũng kiểm tra lại quyền.
import { parseClassList, MAX_ROWS } from '../utils/classImport.js'
import { importStudents } from '../utils/firebase.js'
import { toCSV } from '../utils/sanitize.js'
import { download } from '../pages/QuizTools.js'
import { save } from '../utils/helpers.js'

const { useState, useMemo, createElement: h } = window.React

const overlay = { backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1060 }
const TEMPLATE = toCSV([['mssv', 'ho_ten', 'lop', 'khoa'], ['2401001', 'Nguyễn Văn A', 'CNTT24-01', '2024-2028']])

export default function ClassImportModal({ onClose }) {
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState(null)      // kết quả máy chủ trả về sau khi nhập
  const [error, setError] = useState('')

  // 1) Kiểm tra ngay khi có dữ liệu (xem trước, chưa gửi gì lên máy chủ)
  const parsed = useMemo(() => (text.trim() ? parseClassList(text) : null), [text])
  const canSubmit = parsed && parsed.rows.length > 0 && parsed.rows.length <= MAX_ROWS && !busy && !results

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 2 * 1024 * 1024) { alert('Tệp quá lớn (tối đa 2 MB).'); return }
    f.text().then(t => { setText(t); setFileName(f.name); setResults(null) })
  }

  // 2) Gửi lên máy chủ
  const submit = async () => {
    setBusy(true); setError('')
    try {
      const rows = parsed.rows.map(({ mssv, name, classId, cohort }) => ({ mssv, name, classId, cohort }))
      const res = await importStudents(rows)
      setResults(res)
      // Danh sách tài khoản được app.js giữ 5 phút trong trình duyệt: xóa để F5 thấy ngay sinh viên mới
      if (res.some(r => r.status === 'created')) save('st_allUsers_cache_ts', 0)
    } catch (e) {
      setError(e.message || 'Nhập thất bại.')
    } finally { setBusy(false) }
  }

  // 3) Tải mật khẩu ban đầu (chỉ có trong bộ nhớ trang này – đóng hộp thoại là mất)
  const created = (results || []).filter(r => r.status === 'created')
  const count = (s) => (results || []).filter(r => r.status === s).length
  const downloadPasswords = () => {
    const nameOf = Object.fromEntries(parsed.rows.map(r => [r.mssv, r]))
    download('mat-khau-ban-dau.csv', '\uFEFF' + toCSV([['mssv', 'ho_ten', 'lop', 'ten_dang_nhap', 'mat_khau'],
      ...created.map(r => [r.mssv, nameOf[r.mssv]?.name || '', nameOf[r.mssv]?.classId || '', r.username, r.password])]))
  }
  const close = () => {
    if (created.length && !confirm('Mật khẩu ban đầu chỉ xem được một lần. Bạn đã tải tệp mật khẩu chưa? Đóng hộp thoại?')) return
    onClose(created.length > 0)
  }

  return h('div', { className: 'modal show d-block', style: overlay },
    h('div', { className: 'modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable' },
      h('div', { className: 'modal-content' },
        h('div', { className: 'modal-header' },
          h('h5', { className: 'modal-title fw-bold' }, h('i', { className: 'bi bi-people me-2' }), 'Nhập danh sách lớp'),
          h('button', { className: 'btn-close', onClick: close })
        ),
        h('div', { className: 'modal-body' },
          h('div', { className: 'alert alert-light border small' },
            'Cột bắt buộc: ', h('code', null, 'mssv'), ', ', h('code', null, 'ho_ten'), ', ', h('code', null, 'lop'),
            '; không bắt buộc: ', h('code', null, 'khoa'), ' (dạng ', h('code', null, '2024-2028'), '). Lưu Excel dạng ', h('b', null, 'CSV UTF-8'),
            ' hoặc chọn vùng ô, Ctrl+C rồi dán vào ô bên dưới. Tên đăng nhập = ', h('code', null, 'sv + mã SV'),
            `. Tối đa ${MAX_ROWS} dòng. Sinh viên đã có tài khoản sẽ được bỏ qua, không ghi đè.`
          ),
          !results && h(window.React.Fragment, null,
            h('div', { className: 'd-flex flex-wrap gap-2 mb-3 align-items-center' },
              h('input', { type: 'file', accept: '.csv,.tsv,.txt', className: 'form-control form-control-sm', style: { maxWidth: 320 }, onChange: onFile }),
              h('button', { type: 'button', className: 'btn btn-sm btn-outline-secondary', onClick: () => download('mau-danh-sach-lop.csv', '\uFEFF' + TEMPLATE) },
                h('i', { className: 'bi bi-download me-1' }), 'Tải mẫu CSV'),
              fileName && h('small', { className: 'text-muted' }, fileName)
            ),
            h('textarea', { className: 'form-control mb-3', rows: 6, placeholder: 'Hoặc dán từ Excel vào đây…', value: text,
              onChange: e => { setText(e.target.value); setFileName('') } })
          ),

          // Xem trước: số dòng hợp lệ + danh sách lỗi theo số dòng
          parsed && !results && h('div', null,
            h('div', { className: 'mb-2 fw-semibold' },
              h('span', { className: parsed.rows.length ? 'text-success' : 'text-danger' }, `${parsed.rows.length} sinh viên hợp lệ`),
              parsed.errors.length > 0 && h('span', { className: 'text-danger ms-2' }, `· ${parsed.errors.length} lỗi`)
            ),
            parsed.errors.length > 0 && h('ul', { className: 'small text-danger mb-2' },
              parsed.errors.slice(0, 10).map((er, i) => h('li', { key: i }, er.line ? `Dòng ${er.line}: ${er.message}` : er.message)),
              parsed.errors.length > 10 && h('li', null, `… và ${parsed.errors.length - 10} lỗi khác`)),
            parsed.rows.length > 0 && h('table', { className: 'table table-sm small mb-0' },
              h('thead', null, h('tr', null, ['Dòng', 'Mã SV', 'Họ tên', 'Lớp', 'Khóa'].map(t => h('th', { key: t }, t)))),
              h('tbody', null, parsed.rows.slice(0, 8).map(r => h('tr', { key: r.mssv },
                h('td', null, r.line), h('td', null, r.mssv), h('td', null, r.name), h('td', null, r.classId), h('td', null, r.cohort))))),
            parsed.rows.length > 8 && h('div', { className: 'small text-muted' }, `… và ${parsed.rows.length - 8} dòng khác`)
          ),

          error && h('div', { className: 'alert alert-danger small mt-3 mb-0' }, error),

          // Kết quả sau khi nhập
          results && h('div', null,
            h('div', { className: 'alert alert-success' },
              h('div', null, `Đã tạo ${count('created')} tài khoản · đã có (bỏ qua) ${count('exists')} · lỗi ${count('invalid')}.`),
              created.length > 0 && h('div', { className: 'small' }, 'Tải lại trang để thấy sinh viên mới trong danh sách.')
            ),
            created.length > 0 && h('div', { className: 'alert alert-warning small mb-0' },
              h('button', { className: 'btn btn-sm btn-warning me-2', onClick: downloadPasswords },
                h('i', { className: 'bi bi-key me-1' }), 'Tải danh sách mật khẩu ban đầu'),
              'Chỉ tải được một lần, hãy phát cho sinh viên và yêu cầu đổi mật khẩu.')
          )
        ),
        h('div', { className: 'modal-footer' },
          h('button', { className: 'btn btn-secondary', onClick: close }, results ? 'Đóng' : 'Hủy'),
          !results && h('button', { className: 'btn btn-success', disabled: !canSubmit, onClick: submit },
            busy ? h('span', { className: 'spinner-border spinner-border-sm me-1' }) : h('i', { className: 'bi bi-upload me-1' }),
            parsed?.rows.length ? `Nhập ${parsed.rows.length} sinh viên` : 'Nhập')
        )
      )
    )
  )
}