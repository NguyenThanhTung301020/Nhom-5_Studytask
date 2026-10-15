# Nguyên tắc tách môi trường phát triển (tuần 1)

Người thực hiện: Trần Đức Tùng. Dùng cho mục công việc số 4 của báo cáo tuần 1.

Hệ thống hiện tại đang có người dùng thật. Để phát triển tính năng mới mà không ảnh hưởng tới dữ liệu và người dùng hiện tại, nhóm dùng ba môi trường tách biệt:

| Môi trường | Firebase | Địa chỉ chạy | Dữ liệu | Mục đích |
|---|---|---|---|---|
| Dev (máy cá nhân) | Firebase Emulator Suite (Auth, Firestore, Functions, Storage) | Máy local, cổng riêng (Vite dùng cổng 5173) | Dữ liệu giả, nạp bằng script seed | Từng thành viên phát triển trên nhánh feature/* |
| Staging | Firebase project riêng cho thử nghiệm (dự kiến tên studytask-dev) | Bản preview của dịch vụ hosting | Dữ liệu thử nghiệm | Nhóm, GVHD và người dùng thử kiểm tra trước khi phát hành |
| Production | Project Firebase hiện tại (sutdytask) | Bản đang vận hành | Dữ liệu thật | Chỉ nhận bản đã qua CI và staging; riêng bản vá bảo mật khẩn được phép đưa thẳng |

Quy tắc cụ thể:
- Mã của tính năng mới không bao giờ trỏ tới project Firebase production. Cấu hình Firebase đọc theo biến môi trường (.env.development / .env.production), không ghi cứng trong mã.
- Bản mới và bản cũ không chạy chung một địa chỉ local. localStorage dùng chung theo origin, mà bản cũ dùng khóa tiền tố `st_`, nên bản mới chạy ở cổng riêng và dùng tiền tố khóa riêng để không đọc nhầm dữ liệu cũ.
- Mỗi tính năng phát triển trên một nhánh `feature/...` riêng, gộp vào `master` qua Pull Request có thành viên khác review và CI đạt.
- Thay đổi cấu trúc dữ liệu chỉ áp dụng lên production bằng script chuyển dữ liệu đã chạy thử trên staging, có sao lưu (export Firestore) trước khi chạy.
- Bản đang vận hành chỉ nhận bản vá bảo mật khẩn (hotfix).
