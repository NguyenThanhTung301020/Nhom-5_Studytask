// components/Portal.js – Render con vào document.body
// Dùng cho modal để thoát khỏi thẻ có transform (position:fixed bị "giam" trong ancestor có transform).
export default function Portal({ children }) {
  return window.ReactDOM.createPortal(children, document.body)
}
