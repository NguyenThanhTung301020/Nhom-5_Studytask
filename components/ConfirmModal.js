// components/ConfirmModal.js
const { createElement: h } = window.React

export default function ConfirmModal({ message, onConfirm, onClose, confirmLabel = 'Xóa', confirmClass = 'btn-danger' }) {
  return (
    h('div', { className: 'modal show d-block', style: { backgroundColor: 'rgba(0,0,0,0.5)' } },
      h('div', { className: 'modal-dialog modal-dialog-centered modal-sm' },
        h('div', { className: 'modal-content' },
          h('div', { className: 'modal-body text-center py-4' },
            h('i', { className: 'bi bi-exclamation-triangle-fill text-warning fs-1 d-block mb-3' }),
            h('p', { className: 'mb-0' }, message)
          ),
          h('div', { className: 'modal-footer justify-content-center gap-2' },
            h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Hủy'),
            h('button', { className: `btn ${confirmClass}`, onClick: onConfirm }, confirmLabel)
          )
        )
      )
    )
  )
}
