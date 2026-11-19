// utils/library.js – Kho sách điện tử của trang Thư viện (thuần, kiểm thử bằng node --test)
// Sách do scripts/import_library.py nạp vào docs libraryBooks/<mã>: tên, tác giả, thể loại, nguồn Internet Archive, giấy phép, bìa, số trang.

export const GENRES = {
  'van-hoc-vn':        { label: 'Văn học Việt Nam',        icon: 'book',            color: '#e74a3b' },
  'van-hoc-nn':        { label: 'Văn học nước ngoài',      icon: 'globe2',          color: '#4e73df' },
  'thieu-nhi':         { label: 'Thiếu nhi & cổ tích',     icon: 'balloon-heart',   color: '#f6a21e' },
  'khoa-hoc':          { label: 'Khoa học',                icon: 'rocket-takeoff',  color: '#1cc88a' },
  'chinh-tri-lich-su': { label: 'Chính trị – Lịch sử',     icon: 'bank',            color: '#6f42c1' },
  'ngon-ngu':          { label: 'Ngôn ngữ & ngoại ngữ',    icon: 'translate',       color: '#36b9cc' },
  'giao-trinh':        { label: 'Giáo trình',              icon: 'mortarboard',     color: '#2c9faf' },
  'tap-chi':           { label: 'Tạp chí',                 icon: 'newspaper',       color: '#e67e22' },
  'ton-giao':          { label: 'Tôn giáo',                icon: 'peace',           color: '#858796' },
  'nghe-thuat':        { label: 'Văn hóa – Nghệ thuật',    icon: 'palette',         color: '#d63384' },
  'ky-nang':           { label: 'Kỹ năng',                 icon: 'lightbulb',       color: '#20c997' },
  'khac':              { label: 'Khác',                    icon: 'three-dots',      color: '#6c757d' },
}
export const genreOf = (book) => GENRES[book?.genre] || GENRES.khac

// Chuẩn hóa để tìm không phân biệt hoa thường và dấu tiếng Việt ("duc nhan tam" tìm ra "Đắc nhân tâm")
export const foldText = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase()

// Lọc theo từ khóa (tên, tác giả, bộ sách, mô tả) và thể loại ('' = tất cả); mọi từ trong ô tìm đều phải có mặt
export function filterBooks(books = [], { q = '', genre = '' } = {}) {
  const words = foldText(q).split(/\s+/).filter(Boolean)
  return books.filter(b => {
    if (genre && b.genre !== genre && !(genre === 'khac' && !GENRES[b.genre])) return false
    if (!words.length) return true
    const hay = foldText([b.title, b.author, b.series, b.description].join(' '))
    return words.every(w => hay.includes(w))
  })
}

// Thứ tự: 'title' (A→Z theo tiếng Việt, "Tập 2" sau "Tập 1" nhờ so số tự nhiên), 'size' (nhỏ → lớn), 'pages' (ít → nhiều)
export function sortBooks(books = [], by = 'title') {
  const coll = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' })
  const arr = books.slice()
  if (by === 'size') return arr.sort((a, b) => (a.size || 0) - (b.size || 0) || coll.compare(a.title, b.title))
  if (by === 'pages') return arr.sort((a, b) => (a.pages || 0) - (b.pages || 0) || coll.compare(a.title, b.title))
  return arr.sort((a, b) => coll.compare(a.title, b.title))
}

// { 'van-hoc-vn': 17, ... } theo sách đang xét; thể loại lạ tính vào 'khac'
export function genreCounts(books = []) {
  const out = {}
  for (const b of books) { const k = GENRES[b.genre] ? b.genre : 'khac'; out[k] = (out[k] || 0) + 1 }
  return out
}

export function formatSize(bytes) {
  const n = Number(bytes) || 0
  if (n >= 1073741824) return `${(n / 1073741824).toFixed(1)} GB`
  if (n >= 1048576) return `${Math.round(n / 1048576)} MB`
  if (n >= 1024) return `${Math.round(n / 1024)} KB`
  return `${n} B`
}

// Đường dẫn đọc/tải PDF: chỉ qua API (cần đăng nhập), không có đường dẫn công khai tới tệp
export const bookFileUrl = (id) => `/api/files/library/${encodeURIComponent(id)}.pdf`

// Dòng ghi nguồn hiển thị dưới sách; luôn có tên nguồn, kèm mã mục Archive nếu có
export function sourceLine(b) {
  if (!b) return ''
  return b.sourceId ? `${b.sourceName || 'Internet Archive'} · ${b.sourceId}` : (b.sourceName || 'Nguồn chưa xác định')
}

// Chỉ cho mở liên kết nguồn nếu là https tới archive.org (tránh liên kết lạ trong dữ liệu)
export const safeSourceUrl = (u) => /^https:\/\/archive\.org\/details\/[^\s]+$/.test(String(u || '')) ? u : ''
