// pages/Contact.js – Liên hệ hỗ trợ + FAQ
const { useState, createElement: h } = window.React

const SUPPORT_INFO = [
  { icon: 'geo-alt-fill',   label: 'Địa chỉ',     value: 'Trường Đại học ABC, 123 Đường XYZ, Phường Dĩ An, TP.HCM' },
  { icon: 'telephone-fill', label: 'Điện thoại',   value: '0909 090 090' },
  { icon: 'envelope-fill',  label: 'Email hỗ trợ', value: 'support@studytask.io.vn' },
  { icon: 'clock-fill',     label: 'Giờ làm việc', value: 'Thứ 2 – Thứ 6: 8:00 – 17:00' },
]

const FAQ_ITEMS = [
  { q: 'Dữ liệu của tôi có được lưu trữ an toàn không?', a: 'Dữ liệu hiện tại được lưu cục bộ trong trình duyệt (localStorage) của bạn. Dữ liệu không được gửi lên bất kỳ máy chủ nào, hoàn toàn riêng tư.' },
  { q: 'Tôi có thể dùng ứng dụng trên điện thoại không?', a: 'Có, giao diện được thiết kế responsive, hoạt động tốt trên mọi thiết bị từ máy tính đến điện thoại di động.' },
  { q: 'Làm thế nào để không mất dữ liệu khi xóa cache trình duyệt?', a: 'Hiện tại chưa có tính năng xuất/nhập dữ liệu. Khuyến khích không xóa localStorage hoặc chờ tính năng sao lưu trong phiên bản tiếp theo.' },
  { q: 'Tôi muốn thêm nhiều môn học hơn, có giới hạn không?', a: 'Không có giới hạn số lượng môn học hay deadline. Bạn có thể thêm tùy ý tùy vào dung lượng localStorage của trình duyệt (thường ~5MB).' },
  { q: 'Ứng dụng có hoạt động khi không có internet không?', a: 'Có, sau khi tải lần đầu, ứng dụng hoạt động hoàn toàn offline. Chỉ cần internet để tải trang lần đầu.' },
]

function FaqItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    h('div', { className: 'faq-item' },
      h('button', { className: 'faq-question', onClick: () => setOpen(!open) },
        h('span', null, item.q),
        h('i', { className: `bi bi-chevron-${open ? 'up' : 'down'} flex-shrink-0` })
      ),
      open && h('div', { className: 'faq-answer' }, item.a)
    )
  )
}

export default function Contact({ contacts, setContacts }) {
  const [form, setForm]           = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent]           = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const valid = form.name.trim() && form.email.trim() && form.message.trim()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!valid) return
    setContacts([{ id: Date.now(), ...form, date: new Date().toISOString() }, ...contacts])
    setForm({ name: '', email: '', subject: '', message: '' })
    setSent(true); setTimeout(() => setSent(false), 4000)
  }

  return (
    h('div', { className: 'container-fluid py-4' },
      h('div', { className: 'd-flex justify-content-between align-items-center mb-4' },
        h('div', null,
          h('h4', { className: 'fw-bold mb-1' }, h('i', { className: 'bi bi-envelope me-2', style: { color: 'var(--primary)' } }), 'Liên hệ hỗ trợ'),
          h('small', { className: 'text-muted' }, 'Chúng tôi luôn sẵn sàng hỗ trợ bạn')
        ),
        contacts.length > 0 && h('button', { className: 'btn btn-outline-secondary btn-sm', onClick: () => setShowHistory(!showHistory) },
          h('i', { className: `bi bi-${showHistory ? 'eye-slash' : 'clock-history'} me-1` }),
          showHistory ? 'Ẩn lịch sử' : `Lịch sử (${contacts.length})`
        )
      ),

      h('div', { className: 'row g-4' },
        // ── Thông tin liên hệ ──
        h('div', { className: 'col-12 col-lg-4' },
          h('div', { className: 'card border-0 shadow-sm p-4 h-100' },
            h('h6', { className: 'fw-bold mb-4', style: { color: 'var(--primary)' } }, h('i', { className: 'bi bi-headset me-2' }), 'Thông tin hỗ trợ'),
            SUPPORT_INFO.map((info) =>
              h('div', { key: info.label, className: 'contact-info-item d-flex align-items-start gap-3 mb-3' },
                h('div', { className: 'contact-info-icon' }, h('i', { className: `bi bi-${info.icon}` })),
                h('div', null,
                  h('div', { className: 'contact-info-label' }, info.label),
                  h('div', { className: 'contact-info-value' }, info.value)
                )
              )
            ),
            h('div', { className: 'border-top pt-3 mt-2' },
              h('p', { className: 'text-muted small fw-semibold mb-2' }, 'Theo dõi chúng tôi'),
              h('div', { className: 'd-flex gap-2' },
                h('a', { href: '#', className: 'social-btn social-btn-fb' }, h('i', { className: 'bi bi-facebook' })),
                h('a', { href: '#', className: 'social-btn social-btn-yt' }, h('i', { className: 'bi bi-youtube' })),
                h('a', { href: 'mailto:support@university.edu.vn', className: 'social-btn social-btn-em' }, h('i', { className: 'bi bi-envelope' }))
              )
            ),
            h('div', { className: 'border-top pt-3 mt-3' },
              h('p', { className: 'text-muted small fw-semibold mb-2' }, 'Phản hồi nhanh'),
              h('div', { className: 'd-flex flex-column gap-2' },
                h('div', { className: 'badge', style: { backgroundColor: 'rgba(28,200,138,.1)', color: '#1cc88a', padding: '8px 12px', borderRadius: 8, fontSize: '0.78rem', textAlign: 'left' } },
                  h('i', { className: 'bi bi-lightning-fill me-1' }), 'Thường phản hồi trong 24h'
                ),
                h('div', { className: 'badge', style: { backgroundColor: 'rgba(78,115,223,.1)', color: 'var(--primary)', padding: '8px 12px', borderRadius: 8, fontSize: '0.78rem', textAlign: 'left' } },
                  h('i', { className: 'bi bi-shield-check me-1' }), 'Bảo mật thông tin cá nhân'
                )
              )
            )
          )
        ),

        // ── Form gửi tin ──
        h('div', { className: 'col-12 col-lg-8' },
          h('div', { className: 'card border-0 shadow-sm p-4' },
            h('h6', { className: 'fw-bold mb-4', style: { color: 'var(--primary)' } }, h('i', { className: 'bi bi-pencil-square me-2' }), 'Gửi tin nhắn'),
            sent && h('div', { className: 'alert alert-success d-flex align-items-center gap-2 mb-3' },
              h('i', { className: 'bi bi-check-circle-fill flex-shrink-0' }),
              'Tin nhắn đã được ghi nhận! Chúng tôi sẽ liên hệ lại trong vòng 24 giờ.'
            ),
            h('form', { onSubmit: handleSubmit },
              h('div', { className: 'row g-3 mb-3' },
                h('div', { className: 'col-12 col-sm-6' },
                  h('label', { className: 'form-label fw-semibold' }, 'Họ và tên ', h('span', { className: 'text-danger' }, '*')),
                  h('input', { className: 'form-control', placeholder: 'Nhập họ và tên', value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) })
                ),
                h('div', { className: 'col-12 col-sm-6' },
                  h('label', { className: 'form-label fw-semibold' }, 'Email ', h('span', { className: 'text-danger' }, '*')),
                  h('input', { type: 'email', className: 'form-control', placeholder: 'email@example.com', value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }) })
                )
              ),
              h('div', { className: 'mb-3' },
                h('label', { className: 'form-label fw-semibold' }, 'Chủ đề'),
                h('select', { className: 'form-select', value: form.subject, onChange: (e) => setForm({ ...form, subject: e.target.value }) },
                  h('option', { value: '' }, '— Chọn chủ đề —'),
                  h('option', { value: 'Hỗ trợ kỹ thuật' }, 'Hỗ trợ kỹ thuật'),
                  h('option', { value: 'Góp ý tính năng' }, 'Góp ý tính năng'),
                  h('option', { value: 'Báo lỗi' }, 'Báo lỗi'),
                  h('option', { value: 'Câu hỏi khác' }, 'Câu hỏi khác')
                )
              ),
              h('div', { className: 'mb-3' },
                h('label', { className: 'form-label fw-semibold' }, 'Nội dung ', h('span', { className: 'text-danger' }, '*')),
                h('textarea', { className: 'form-control', rows: 5, placeholder: 'Mô tả vấn đề hoặc câu hỏi của bạn...', value: form.message, onChange: (e) => setForm({ ...form, message: e.target.value }) })
              ),
              h('button', { type: 'submit', className: 'btn btn-primary', disabled: !valid },
                h('i', { className: 'bi bi-send me-2' }), 'Gửi tin nhắn'
              )
            )
          )
        )
      ),

      // ── FAQ ──
      h('div', { className: 'card border-0 shadow-sm mt-4' },
        h('div', { className: 'card-header bg-transparent border-0 pt-3 pb-2' },
          h('h6', { className: 'fw-bold mb-0' }, h('i', { className: 'bi bi-patch-question me-2', style: { color: 'var(--primary)' } }), 'Câu hỏi thường gặp (FAQ)')
        ),
        h('div', { className: 'card-body' },
          h('div', { className: 'faq-list' },
            FAQ_ITEMS.map((item, i) => h(FaqItem, { key: i, item }))
          )
        )
      ),

      // ── Lịch sử tin nhắn ──
      showHistory && contacts.length > 0 && h('div', { className: 'card border-0 shadow-sm mt-4' },
        h('div', { className: 'card-header bg-transparent border-0 d-flex justify-content-between align-items-center pt-3 pb-2' },
          h('h6', { className: 'fw-bold mb-0' }, h('i', { className: 'bi bi-clock-history me-2', style: { color: 'var(--primary)' } }), `Lịch sử tin nhắn (${contacts.length})`),
          h('button', { className: 'btn btn-sm btn-outline-danger', onClick: () => { if (confirm('Xóa tất cả lịch sử?')) { setContacts([]); setShowHistory(false) } } },
            h('i', { className: 'bi bi-trash me-1' }), 'Xóa tất cả'
          )
        ),
        h('div', { className: 'list-group list-group-flush' },
          contacts.map((c) =>
            h('div', { key: c.id, className: 'list-group-item border-0 py-3 px-4' },
              h('div', { className: 'd-flex justify-content-between align-items-start gap-3' },
                h('div', { className: 'flex-grow-1' },
                  h('div', { className: 'fw-semibold' }, c.subject || h('em', { className: 'text-muted' }, '(Không có chủ đề)')),
                  h('small', { className: 'text-muted d-block' }, h('i', { className: 'bi bi-person me-1' }), c.name, ' – ', c.email),
                  h('p', { className: 'text-muted small mb-0 mt-1' }, c.message)
                ),
                h('small', { className: 'text-muted flex-shrink-0 text-nowrap' }, new Date(c.date).toLocaleDateString('vi-VN'))
              )
            )
          )
        )
      )
    )
  )
}
