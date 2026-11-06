// utils/sanitize.js – Kiểm tra link và xuất CSV an toàn (thuần logic, không phụ thuộc trình duyệt)

// Chỉ nhận link http(s): chặn javascript:, data:, ... khi đưa giá trị người dùng nhập vào href
export const isHttpUrl = (value) => /^https?:\/\/\S+$/i.test(String(value ?? '').trim())

// Excel, LibreOffice coi ô bắt đầu bằng = + - @ (kể cả sau khoảng trắng) là công thức.
// Thêm dấu ' để hiển thị như văn bản; số thật như -5 hay +84901234567 thì giữ nguyên.
const NUMBER = /^[+-]?\d+([.,]\d+)?$/
export const csvCell = (value) => {
  const text = String(value ?? '')
  const safe = /^\s*[=+\-@]/.test(text) && !NUMBER.test(text.trim()) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

export const toCSV = (rows) => rows.map(r => r.map(csvCell).join(',')).join('\r\n')
