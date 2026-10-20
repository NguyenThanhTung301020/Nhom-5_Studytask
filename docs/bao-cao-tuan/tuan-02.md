# Báo cáo tuần 2

- Đề tài: Xây dựng một website quản lý deadline học tập cho sinh viên (sản phẩm: StudyTask)
- GVHD: TS. Huỳnh Xuân Phụng
- Nhóm: Nguyễn Thanh Tùng (24TX810027) · Trần Đức Tùng (24TX810026) · Trương Thanh Vui (24TX810021)
- Thời gian: 12/10 – 17/10/2026 (các commit tài liệu được đẩy lên ngày 19/10 và 20/10, trước khi nộp báo cáo)
- Repo GitHub (public): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask
- Toàn bộ link minh chứng: xem mục 8. Các mã [C1], [D5], [S1]... trong bài trỏ tới mục này.

1. Trọng tâm tuần và tình trạng commit

Tuần 2 thực hiện kế hoạch đã trình ở tuần 1. Thầy đã đồng ý: "tuần 2 nhóm cứ triển khai theo phương án đã trình", và nhắc mỗi thành viên commit bằng tài khoản của mình.

Trong tuần 2, cả 3 thành viên đều có commit bằng tài khoản riêng:

| Mã | Commit | Người commit (tài khoản GitHub) | Ngày | Nội dung |
|---|---|---|---|---|
| [C1] | b9792bc | Trương Thanh Vui (Thanh-Vui-Minx) | 19/10 | `[AI] docs: them tai lieu thiet-ke (luu tru ho so, quy che tinh diem, phan quyen)`: 3 tệp trong docs/thiet-ke/ |
| [C2] | 03339cd | Trần Đức Tùng (TranDucTung-24tx810026) | 19/10 | `Thêm sơ đồ usecase tổng nhóm 5`: sơ đồ use case do nhóm tự vẽ |
| [C3] | (commit chứa báo cáo này) | Nguyễn Thanh Tùng (NguyenThanhTung301020) | 20/10 | `[AI] docs: bao cao tuan 2 + nhat ky AI tuan 2` |

Nói rõ để Thầy dễ đối chiếu: các việc sửa mã (mục 2, dòng 1–3b) **chưa có commit trên GitHub**. Trương Thanh Vui đã dùng AI làm thử trên máy cá nhân ngày 17/10 (chạy Emulator, sửa lỗi hồ sơ, vá V1/V2), nhưng mã đó chưa được nhóm review nên chưa đưa lên repo. Nhóm không liệt kê các việc này là "đã xong" vì chưa có minh chứng trên GitHub. Các việc này được chuyển sang kế hoạch tuần 3 (mục 5).

2. Công việc đã làm và phân công

| # | Công việc (kế hoạch tuần 2) | Người phụ trách | Kết quả | Minh chứng |
|---|---|---|---|---|
| 1 | Hoàn thiện repo: README, quy ước nhánh và commit; mỗi thành viên commit bằng tài khoản của mình | Nguyễn Thanh Tùng | Đạt một phần: cả 3 thành viên đã có commit bằng tài khoản riêng. README và quy ước nhánh **chưa có**, chuyển sang tuần 3 | [C1], [C2], [C3] |
| 2 | Chạy lại ứng dụng ở local, ghi các bước cài đặt và lỗi gặp phải | Trương Thanh Vui | Chưa đạt: đã chạy thử bằng Firebase Emulator trên máy cá nhân, nhưng hướng dẫn và mã cấu hình chưa lên GitHub. Chuyển sang tuần 3 | Chưa có |
| 3 | Tái hiện và sửa lỗi "gửi yêu cầu cập nhật hồ sơ" | Nguyễn Thanh Tùng | Chưa đạt: đã khoanh vùng nguyên nhân (mục 3.3) nhưng chưa có commit sửa. Chuyển sang tuần 3 | Code liên quan [P1], [P2] (tuần 1) |
| 3b | Vá V2, vá tạm V1 trên môi trường riêng (theo ý kiến Thầy ở mục 6 tuần 1) | Nguyễn Thanh Tùng | Chưa đạt: có bản làm thử trên máy cá nhân, chưa có commit. Chuyển sang tuần 3 | Chưa có |
| 4 | Tìm hiểu và thiết kế trang lưu trữ hồ sơ tài khoản | Trần Đức Tùng | Đạt (bản nháp, AI soạn, Trương Thanh Vui commit): bản thiết kế có chức năng LT1–LT7, cấu trúc dữ liệu `archivedAccounts`, rules dự kiến, luồng xử lý, phác thảo giao diện | [D5], commit [C1] |
| 4b | Thiết kế quy chế tính điểm theo loại môn và vai trò mới Phòng Đào tạo, Phòng Tài chính (phát sinh ngoài kế hoạch) | Trương Thanh Vui | Đạt ở mức thiết kế: tài liệu D6, D7. Phạm vi các chức năng này cần Thầy cho ý kiến (mục 6) | [D6], [D7], commit [C1] |
| 5 | Vẽ lại sơ đồ use case và luồng dữ liệu (nhóm tự vẽ, không dùng AI) | Cả nhóm (Trần Đức Tùng vẽ và commit) | Đạt một phần: đã có sơ đồ use case tổng của nhóm. Sơ đồ luồng dữ liệu chưa có, chuyển sang tuần 3 | [S1], commit [C2] |
| 6 | Nhật ký sử dụng AI tuần 2, đối chiếu với commit | Cả nhóm (Nguyễn Thanh Tùng tổng hợp) | Đạt | [R7], commit [C3] |

3. Kết quả chính

3.1. Thiết kế trang lưu trữ hồ sơ tài khoản (chi tiết ở [D5])

- Vấn đề hiện tại: Quản trị viên xóa tài khoản thì mất luôn hồ sơ và kết quả học tập, không khôi phục được; bản ghi đăng nhập vẫn còn nên người đó vẫn đăng nhập được vào một hồ sơ trống.
- Giải pháp: thay **xóa** bằng **lưu trữ**. Thêm collection `archivedAccounts/{uid}` lưu bản chụp hồ sơ, tóm tắt kết quả theo môn, người lưu trữ, lý do, hạn xóa (`purgeAfter`, đề xuất 12 tháng). Chỉ Quản trị viên đọc/ghi được.
- 7 chức năng LT1–LT7: lưu trữ một / hàng loạt tài khoản, xem danh sách, xem chi tiết, khôi phục, xuất CSV, xóa vĩnh viễn sau thời hạn (phải xác nhận lại email).
- Việc vô hiệu hóa đăng nhập cần Cloud Functions (`disableUser` / `enableUser`), làm cùng lúc với việc bỏ lưu mật khẩu (V1) ở tuần 3.

3.2. Quy chế tính điểm và vai trò mới (chi tiết ở [D6], [D7])

- Quy chế tính điểm: Phòng Đào tạo cập nhật tỉ lệ theo loại môn (tự động theo số bài tập hoặc nhập tay); giáo viên chọn cột bài tập nào tính điểm, các cột còn lại tính vào chuyên cần; hệ thống không cho lưu khi tổng khác 100% hoặc vượt giới hạn.
- Vai trò mới `training` (Phòng Đào tạo) và `finance` (Phòng Tài chính), có ma trận chức năng cho 5 vai trò và bảng quyền đọc/ghi từng collection.
- Điểm lệch so với tài liệu quy chế mà nhóm cần Thầy xác nhận: xem mục 5 của [D6].
- Các chức năng này phát sinh ngoài kế hoạch tuần 2 và vượt khỏi trọng tâm "quản lý deadline". Nhóm xin ý kiến Thầy trước khi lập trình (mục 6).

3.3. Lỗi "gửi yêu cầu cập nhật hồ sơ" (khoanh vùng, chưa sửa)

Đọc lại mã ở [P1], [P2], nhóm khoanh vùng được các nguyên nhân chính. Đây là kết quả đọc mã, **chưa có commit sửa**:
- Thông báo "Đã lưu" bị ẩn ngay sau khi lưu nên người dùng tưởng chưa gửi.
- Mất mạng thì nút treo ở "Đang lưu…", không báo lỗi.
- Số điện thoại không được chép sang hồ sơ mà trang Quản trị / Danh bạ đọc.
- Trên máy dùng chung, tài khoản sau có thể nhận hồ sơ của tài khoản trước (dữ liệu localStorage không gắn với tài khoản).
- Không kiểm tra dữ liệu nhập (tên, số điện thoại, GPA, email).

3.4. Sơ đồ use case (minh chứng [S1])

Sơ đồ use case tổng của nhóm do Trần Đức Tùng vẽ bằng draw.io và tự commit bằng tài khoản của mình ([C2]). Sơ đồ không dùng AI tạo, đúng cam kết ở kế hoạch tuần 1.

4. Khó khăn, vướng mắc

- Mã AI sinh ra trên máy một thành viên khá lớn (nhiều tệp, nhiều chức năng cùng lúc), nhóm chưa kịp review hết nên chưa đưa lên GitHub. Từ tuần 3, mỗi việc sửa mã sẽ là một commit nhỏ, review xong mới push.
- Firestore Emulator cần Java 11 trở lên; máy thành viên nào chưa cài thì phải cài thêm.
- Các chức năng phát sinh (quy chế điểm, học phí, xét tốt nghiệp...) làm phạm vi đề tài phình ra, cần Thầy định hướng giữ hay bỏ.
- Việc vá V1/V2 trên hệ thống đang chạy cần thử xong ở môi trường riêng trước, nên chưa triển khai.

5. Kế hoạch tuần 3 (19/10 – 24/10/2026)

| # | Công việc | Người phụ trách | Kết quả cần đạt |
|---|---|---|---|
| 1 | Viết README (cấu trúc thư mục, cách chạy, quy ước nhánh và commit) | Nguyễn Thanh Tùng | README.md trên GitHub |
| 2 | Review mã chạy Emulator rồi commit: chạy được ở local, tách khỏi hệ thống đang chạy | Trương Thanh Vui (Nguyễn Thanh Tùng review) | Commit cấu hình Emulator; hướng dẫn chạy trong README |
| 3 | Sửa lỗi "gửi yêu cầu cập nhật hồ sơ" theo các nguyên nhân ở mục 3.3 | Nguyễn Thanh Tùng (Trương Thanh Vui review) | Commit sửa lỗi; tài liệu nguyên nhân và cách kiểm tra trong docs/ |
| 4 | Vá V2, vá tạm V1 trong firestore.rules, có kiểm thử tự động trên Emulator | Nguyễn Thanh Tùng (Trần Đức Tùng review) | Commit rules + tệp kiểm thử; kết quả chạy kiểm thử |
| 5 | Vẽ sơ đồ luồng dữ liệu (nhóm tự vẽ, không dùng AI) | Trần Đức Tùng | Sơ đồ trong docs/so do/ |
| 6 | Rà soát lại tính năng theo bảng Giữ/Bỏ/Sửa/Thêm [D3]: loại bỏ những tính năng không cần thiết với đề tài | Cả nhóm | Bảng cập nhật trong docs/phan-tich/ |
| 7 | Nhật ký sử dụng AI tuần 3, đối chiếu với commit | Cả nhóm | docs/ai-log/tuan-03.md |

6. Kính xin ý kiến Thầy

- Phạm vi chức năng: các chức năng phát sinh ở [D6], [D7] (quy chế tính điểm, học phí, chương trình đào tạo, xét tốt nghiệp, công bố khóa luận) có nên giữ trong đề tài "quản lý deadline học tập" không, hay nhóm chỉ tập trung vào các chức năng cốt lõi?
- Mục 5 của [D6]: nhóm tự thêm nhóm giới hạn "môn nặng quá trình" vì bảng giới hạn mâu thuẫn với bộ tỉ lệ L2 và Q70. Kính mong Thầy xác nhận cách xử lý này.
- Thời hạn lưu giữ hồ sơ tài khoản đã lưu trữ ([D5] đề xuất 12 tháng) có phù hợp không?

7. Khai báo sử dụng AI

- Công cụ AI: Claude Code (Anthropic)
- Model: Claude Opus 5.5 (`claude-opus-5-5`)
- Người sử dụng:
  - Trương Thanh Vui (17/10/2026): làm thử mã tuần 2 trên máy cá nhân; soạn bản nháp 3 tài liệu thiết kế [D5], [D6], [D7]
  - Nguyễn Thanh Tùng (20/10/2026): đối chiếu báo cáo với lịch sử commit, soạn lại báo cáo tuần 2 và nhật ký AI tuần 2
- Công cụ AI khác: không dùng
- Mã nguồn do AI sinh trên GitHub: **không có**. Hai commit có nhãn [AI] trong tuần ([C1], [C3]) chỉ chứa tài liệu. Mã AI làm thử trên máy Trương Thanh Vui chưa được đưa lên repo; khi đưa lên ở tuần 3 sẽ commit riêng, có nhãn [AI] và có người review.
- Phần nhóm tự làm, không dùng AI: sơ đồ use case [S1] (Trần Đức Tùng vẽ bằng draw.io); quyết định chỉ báo cáo những việc có minh chứng trên GitHub; mỗi thành viên tự commit và push bằng tài khoản của mình.
- Phần nhóm tự kiểm tra: [D5], [D6], [D7] hiện là bản nháp do AI soạn, Trần Đức Tùng sẽ duyệt và chốt các trường dữ liệu ở tuần 3 (bước 1 trong mục 7 của [D5]); Nguyễn Thanh Tùng đối chiếu từng mã commit và từng link trong báo cáo này với GitHub.
- Sai sót của AI nhóm đã phát hiện: bản nháp báo cáo tuần 2 do AI soạn ngày 17/10 liệt kê 5 commit sửa mã kèm README, tệp kiểm thử, tài liệu sửa lỗi, nhưng các commit và tệp đó không có trên GitHub. Nhóm phát hiện khi đối chiếu với lịch sử commit ngày 20/10 và đã viết lại báo cáo theo đúng repo. Chi tiết và các sai sót khác ở [R7].
- Bằng chứng: nhật ký AI có prompt nguyên văn từng lần dùng tại [R7].

8. Danh sách link GitHub

8.1. Commit tuần 2

- [C1] b9792bc (Trương Thanh Vui) – thêm 3 tài liệu thiết kế: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/b9792bcf7c3a210b03bda44da12fb193a2d3e089
- [C2] 03339cd (Trần Đức Tùng) – thêm sơ đồ use case tổng nhóm 5: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/03339cd2839d7fb61be77e5fc36beaab8cbf8f38
- [C3] (Nguyễn Thanh Tùng) – báo cáo tuần 2 và nhật ký AI tuần 2: xem lịch sử commit của repo https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commits/master

8.2. Tài liệu và sơ đồ tuần 2

- [D5] Thiết kế 01 – Trang lưu trữ hồ sơ tài khoản: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/01-trang-luu-tru-ho-so-tai-khoan.md
- [D6] Thiết kế 02 – Quy chế tính điểm theo loại môn: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/02-quy-che-tinh-diem.md
- [D7] Thiết kế 03 – Vai trò mới và chức năng Đào tạo, Tài chính: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/thiet-ke/03-phan-quyen-chuc-nang-moi.md
- [S1] Sơ đồ use case tổng nhóm 5: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/so%20do/UsecaseNhom5-Update%20usecase%20t%E1%BB%95ng.drawio.png

8.3. Báo cáo và nhật ký AI

- [R6] Báo cáo tuần 2 (file này): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/bao-cao-tuan/tuan-02.md
- [R7] Nhật ký sử dụng AI tuần 2: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/ai-log/tuan-02.md
- [R5] Báo cáo tuần 1: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/bao-cao-tuan/tuan-01.md

8.4. Link dùng lại từ tuần 1

- [P1] pages/Profile.js (lỗi cập nhật hồ sơ): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/pages/Profile.js
- [P2] app.js dòng 334–341 (hàm handleProfileSave): https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/3ae6c68431e8474e8623e7164f5d20771c10a338/app.js#L334-L341
- [D3] Bảng Giữ / Bỏ / Sửa / Thêm: https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/blob/master/docs/phan-tich/03-giu-bo-sua-them.md
