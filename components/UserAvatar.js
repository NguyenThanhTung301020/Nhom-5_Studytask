// components/UserAvatar.js – Ảnh đại diện tròn (ảnh thật hoặc chữ cái đầu), có chấm online tùy chọn
const { createElement: h } = window.React

export const initialsOf = (name = '?') =>
  (name || '?').trim().split(/\s+/).map(w => w[0]).slice(-2).join('').toUpperCase() || '?'

export default function UserAvatar({ name, src, size = 36, color = '#4e73df', online }) {
  return h('span', {
    className: 'user-avatar', title: name || '',
    style: { width: size, height: size, fontSize: Math.round(size * 0.38),
             background: src ? 'transparent' : `linear-gradient(135deg, ${color}dd, ${color}88)` },
  },
    src ? h('img', { src, alt: name || '', loading: 'lazy' }) : initialsOf(name),
    online !== undefined && h('span', { className: `user-avatar-dot${online ? ' on' : ''}` })
  )
}
