// components/SettingsDrawer.js
import { ACCENT_COLORS, DEFAULT_SETTINGS } from '../utils/constants.js'

const { createElement: h } = window.React

export default function SettingsDrawer({ settings, onChange, onClose }) {
  return (
    h(window.React.Fragment, null,
      h('div', { className: 'settings-overlay', onClick: onClose }),
      h('div', { className: 'settings-drawer' },
        h('div', { className: 'settings-drawer-header' },
          h('span', { className: 'fw-bold' }, h('i', { className: 'bi bi-palette me-2', style: { color: 'var(--primary)' } }), 'Tùy chỉnh giao diện'),
          h('button', { className: 'btn-close', onClick: onClose })
        ),
        h('div', { className: 'settings-drawer-body' },
          h('p', { className: 'settings-section-label' }, 'Màu chủ đạo'),
          h('div', { className: 'd-flex flex-wrap gap-2 mb-4' },
            ACCENT_COLORS.map((c) =>
              h('button', { key: c.value, title: c.name, className: `settings-color-btn ${settings.accentColor === c.value ? 'active' : ''}`, style: { backgroundColor: c.value }, onClick: () => onChange({ ...settings, accentColor: c.value }) },
                settings.accentColor === c.value && h('i', { className: 'bi bi-check2 text-white' })
              )
            )
          ),
          h('p', { className: 'settings-section-label' }, 'Giao diện'),
          h('div', { className: 'd-flex gap-2 mb-4' },
            h('button', { className: `settings-mode-btn ${!settings.darkMode ? 'active' : ''}`, onClick: () => onChange({ ...settings, darkMode: false }) }, h('i', { className: 'bi bi-sun-fill me-2' }), 'Sáng'),
            h('button', { className: `settings-mode-btn ${settings.darkMode ? 'active' : ''}`, onClick: () => onChange({ ...settings, darkMode: true }) }, h('i', { className: 'bi bi-moon-stars-fill me-2' }), 'Tối')
          ),
          h('p', { className: 'settings-section-label' }, 'Cỡ chữ'),
          h('div', { className: 'd-flex gap-2 mb-4' },
            h('button', { className: `settings-mode-btn ${settings.fontSize === 'normal' ? 'active' : ''}`, onClick: () => onChange({ ...settings, fontSize: 'normal' }) }, h('i', { className: 'bi bi-type me-2' }), 'Thường'),
            h('button', { className: `settings-mode-btn ${settings.fontSize === 'large' ? 'active' : ''}`, onClick: () => onChange({ ...settings, fontSize: 'large' }) }, h('i', { className: 'bi bi-type-bold me-2' }), 'Lớn')
          ),
          h('div', { className: 'border-top pt-3 mt-2' },
            h('p', { className: 'settings-section-label' }, 'Lưu trữ dữ liệu'),
            h('div', { className: 'settings-storage-info mb-3' }, h('i', { className: 'bi bi-database me-2' }), 'Lưu cục bộ – localStorage'),
            h('div', { className: 'settings-storage-info', style: { backgroundColor: 'rgba(78,115,223,.08)', color: 'var(--primary)' } },
              h('i', { className: 'bi bi-cloud me-2' }), 'Nâng cấp: kết nối Supabase'
            )
          )
        ),
        h('div', { className: 'settings-drawer-footer' },
          h('button', { className: 'btn btn-outline-secondary w-100', onClick: () => onChange(DEFAULT_SETTINGS) },
            h('i', { className: 'bi bi-arrow-counterclockwise me-2' }), 'Đặt lại mặc định'
          )
        )
      )
    )
  )
}
