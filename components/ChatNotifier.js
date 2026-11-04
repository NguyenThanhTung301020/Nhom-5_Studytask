// components/ChatNotifier.js – Thông báo nổi khi có tin nhắn hỗ trợ mới (góc dưới bên phải)
import UserAvatar from './UserAvatar.js'

const { useEffect, createElement: h } = window.React

function Toast({ t, onClose, onOpen }) {
  useEffect(() => {
    const id = setTimeout(() => onClose(t.id), 9000)
    return () => clearTimeout(id)
  }, [t.id])
  return h('div', { className: 'chat-toast', role: 'alert', onClick: () => onOpen(t) },
    h(UserAvatar, { name: t.name, src: t.avatar, size: 38 }),
    h('div', { className: 'flex-grow-1 min-w-0' },
      h('div', { className: 'fw-semibold small text-truncate' }, t.name),
      h('div', { className: 'small text-muted chat-toast-text' }, t.text)
    ),
    h('button', { className: 'btn-close btn-close-sm', 'aria-label': 'Đóng', onClick: (e) => { e.stopPropagation(); onClose(t.id) } })
  )
}

export default function ChatNotifier({ toasts, onClose, onOpen }) {
  if (!toasts.length) return null
  return h('div', { className: 'chat-toast-stack' },
    toasts.map(t => h(Toast, { key: t.id, t, onClose, onOpen })))
}
