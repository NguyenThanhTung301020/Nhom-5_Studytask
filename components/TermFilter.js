// components/TermFilter.js – Ô lọc học kỳ có khoảng hiển thị N năm học gần nhất, và nút trích lục CSV
// Học kỳ trong N năm gần nhất hiện như cũ; học kỳ cũ hơn nằm trong nhóm "Dữ liệu cũ" (vẫn xem và trích lục được).
// N = settings/retention.displayYears (Admin đặt ở trang Quản trị, mặc định 3).
import { splitTermChoices, namHocFrom, TERM_RECENT, TERM_OLD, clampDisplayYears } from '../utils/scope.js'
import { toCSV } from '../utils/sanitize.js'

const { createElement: h } = window.React

export function TermSelect({ termOpts = [], value, onChange, years, allLabel = 'Tất cả học kỳ', style }) {
  const n = clampDisplayYears(years)
  const { recent, old, from } = splitTermChoices(termOpts, n)
  return h('select', { className: 'form-select form-select-sm', style: { width: 'auto', maxWidth: '100%', ...style }, value,
    onChange: (e) => onChange(e.target.value), 'aria-label': 'Lọc theo học kỳ' },
    h('option', { value: TERM_RECENT }, `${n} năm học gần đây (từ ${namHocFrom(from)})`),
    recent.length > 0 && h('optgroup', { label: 'Học kỳ' }, recent.map(t => h('option', { key: t.key, value: t.key }, t.label))),
    old.length > 0 && h('optgroup', { label: `Dữ liệu cũ (trước ${namHocFrom(from)}) – xem và trích lục` },
      h('option', { value: TERM_OLD }, `Toàn bộ dữ liệu cũ (${old.length} học kỳ)`),
      old.map(t => h('option', { key: t.key, value: t.key }, t.label))),
    h('option', { value: '' }, old.length ? `${allLabel}, kể cả dữ liệu cũ` : allLabel))
}

// Ô lọc khoảng thời gian cho danh sách không chia học kỳ (deadline…)
export function RangeSelect({ value, onChange, years, oldCount = 0 }) {
  const n = clampDisplayYears(years)
  return h('select', { className: 'form-select form-select-sm', style: { width: 'auto', maxWidth: '100%' }, value,
    onChange: (e) => onChange(e.target.value), 'aria-label': 'Lọc theo thời gian' },
    h('option', { value: TERM_RECENT }, `${n} năm học gần đây`),
    h('option', { value: TERM_OLD }, `Dữ liệu cũ hơn${oldCount ? ` (${oldCount})` : ''}`),
    h('option', { value: '' }, 'Tất cả thời gian'))
}

export function downloadCSV(filename, rows) {
  const blob = new Blob(['﻿' + toCSV(rows)], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

// Nút "Trích lục": tải danh sách ĐANG HIỂN THỊ (theo bộ lọc) ra CSV, mở được bằng Excel. rows() chỉ chạy khi bấm.
export function ExportButton({ filename, header, rows, count, label = 'Trích lục CSV' }) {
  return h('button', { className: 'btn btn-sm btn-outline-secondary', disabled: !count, title: 'Tải danh sách đang hiển thị (theo bộ lọc) ra tệp CSV',
    onClick: () => downloadCSV(filename, [header, ...rows()]) },
    h('i', { className: 'bi bi-download me-1' }), label)
}
