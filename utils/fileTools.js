// utils/fileTools.js – Chuyển đổi tệp ngay trên trình duyệt (trang Tiện ích): ghép ảnh thành PDF, nén ảnh.
// Thuần logic, không dùng thư viện ngoài, không gửi tệp lên máy chủ. Phần đọc ảnh bằng canvas nằm ở pages/Tools.js.

export const MAX_SUBMIT_MB = 15                      // giới hạn nộp bài của máy chủ (MAX_SUBMIT trong studytask_api.py)
export const A4 = { w: 595.28, h: 841.89 }           // khổ A4 tính bằng point (1/72 inch)

// Mức chất lượng: chất lượng JPEG và cạnh dài tối đa (px) khi vẽ lại ảnh
export const QUALITY = {
  high:   { label: 'Cao (rõ nét)',        q: 0.92, max: 2400 },
  medium: { label: 'Vừa (khuyên dùng)',   q: 0.8,  max: 1800 },
  low:    { label: 'Nhẹ (dung lượng nhỏ)', q: 0.6,  max: 1300 },
}

// Kích thước mới khi thu nhỏ để cạnh dài không quá `max` (không phóng to ảnh nhỏ)
export function scaleDown(w, h, max) {
  const k = Math.min(1, max / Math.max(w, h))
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) }
}

// Đặt ảnh vào trang, giữ tỉ lệ, căn giữa, chừa lề `margin` point
export function fitToPage(imgW, imgH, pageW = A4.w, pageH = A4.h, margin = 24) {
  const k = Math.min((pageW - 2 * margin) / imgW, (pageH - 2 * margin) / imgH)
  const w = imgW * k, h = imgH * k
  return { x: (pageW - w) / 2, y: (pageH - h) / 2, w, h }
}

// Trang ngang nếu ảnh ngang (chụp bảng, slide), trang dọc nếu ảnh dọc
export const pageFor = (imgW, imgH) => imgW > imgH ? { w: A4.h, h: A4.w } : { w: A4.w, h: A4.h }

const enc = (s) => new TextEncoder().encode(s)
const num = (x) => (Math.round(x * 100) / 100).toString()

// Ghép các ảnh JPEG thành một tệp PDF, mỗi ảnh một trang A4.
// images: [{ bytes: Uint8Array (JPEG), width, height }] → Uint8Array (nội dung tệp PDF)
export function buildPdf(images = []) {
  if (!images.length) throw new Error('Chưa có ảnh')
  const parts = [], offsets = []
  let size = 0
  const push = (b) => { const u = typeof b === 'string' ? enc(b) : b; parts.push(u); size += u.length }
  const obj = (id, body) => { offsets[id] = size; push(`${id} 0 obj\n`); body(); push('\nendobj\n') }

  const n = images.length
  const pageId = (i) => 3 + i * 3, contentId = (i) => 4 + i * 3, imageId = (i) => 5 + i * 3
  push('%PDF-1.4\n')
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'))
  obj(2, () => push(`<< /Type /Pages /Count ${n} /Kids [${images.map((_, i) => `${pageId(i)} 0 R`).join(' ')}] >>`))
  images.forEach((img, i) => {
    const page = pageFor(img.width, img.height)
    const box = fitToPage(img.width, img.height, page.w, page.h)
    obj(pageId(i), () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(page.w)} ${num(page.h)}] ` +
      `/Resources << /XObject << /Im${i} ${imageId(i)} 0 R >> >> /Contents ${contentId(i)} 0 R >>`))
    const draw = `q ${num(box.w)} 0 0 ${num(box.h)} ${num(box.x)} ${num(box.y)} cm /Im${i} Do Q`
    obj(contentId(i), () => { push(`<< /Length ${draw.length} >>\nstream\n`); push(draw); push('\nendstream') })
    obj(imageId(i), () => {
      push(`<< /Type /XObject /Subtype /Image /Width ${img.width} /Height ${img.height} /ColorSpace /DeviceRGB ` +
        `/BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >>\nstream\n`)
      push(img.bytes); push('\nendstream')
    })
  })
  const total = 3 + n * 3                               // số đối tượng + 1 (đối tượng 0)
  const xref = size
  push(`xref\n0 ${total}\n0000000000 65535 f \n`)
  for (let id = 1; id < total; id++) push(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`)
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`)

  const out = new Uint8Array(size)
  let p = 0
  for (const u of parts) { out.set(u, p); p += u.length }
  return out
}

// Tên tệp đầu ra: bỏ ký tự không hợp lệ, đổi đuôi
export function outputName(name, ext) {
  const base = String(name || '').replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'tep'
  return `${base.slice(0, 80)}.${ext}`
}

// Dung lượng dễ đọc: 1536 → "1,5 KB"
export function sizeText(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  return kb < 1024 ? `${kb.toFixed(1).replace('.', ',')} KB` : `${(kb / 1024).toFixed(1).replace('.', ',')} MB`
}

// Dời một mục trong danh sách (sắp xếp thứ tự trang)
export function moveItem(list = [], i, d) {
  const j = i + d
  if (j < 0 || j >= list.length) return list
  const a = [...list]; [a[i], a[j]] = [a[j], a[i]]; return a
}
