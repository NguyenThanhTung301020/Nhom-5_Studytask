# Nhật ký sử dụng AI – Tuần 2 (12/10 – 17/10/2026, bổ sung 20/10)

- **Công cụ:** Claude Code (Anthropic)
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`)
- **Người sử dụng:** Trương Thanh Vui (17/10); Nguyễn Thanh Tùng (20/10)
- **Công cụ AI khác:** không dùng

## Mã nguồn do AI sinh

**Trên GitHub: không có.** Các commit tuần 2 có nhãn `[AI]` chỉ chứa tài liệu:

| Commit | Người commit | Tệp | Nội dung AI tạo |
|---|---|---|---|
| [`b9792bc`](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/b9792bcf7c3a210b03bda44da12fb193a2d3e089) (19/10) | Trương Thanh Vui | `docs/thiet-ke/01-trang-luu-tru-ho-so-tai-khoan.md`, `02-quy-che-tinh-diem.md`, `03-phan-quyen-chuc-nang-moi.md` | Bản nháp 3 tài liệu thiết kế |
| Commit báo cáo tuần 2 (20/10) | Nguyễn Thanh Tùng | `docs/bao-cao-tuan/tuan-02.md`, `docs/ai-log/tuan-02.md` | Soạn lại báo cáo tuần 2 và tệp này theo đúng lịch sử commit |

Commit [`03339cd`](https://github.com/NguyenThanhTung301020/Nhom-5_Studytask/commit/03339cd2839d7fb61be77e5fc36beaab8cbf8f38) (Trần Đức Tùng, sơ đồ use case) **không dùng AI**. Sơ đồ do nhóm tự vẽ bằng draw.io.

**Mã làm thử trên máy cá nhân (chưa lên GitHub).** Ngày 17/10, AI có sinh mã trên máy Trương Thanh Vui (cấu hình Firebase Emulator, sửa luồng lưu hồ sơ, rules vá V1/V2 và tệp kiểm thử, các trang chức năng mới). Nhóm chưa review xong nên **chưa commit**. Khi đưa lên ở tuần 3, mỗi phần sẽ là một commit riêng có nhãn `[AI]`, có một thành viên khác review, và được ghi vào nhật ký tuần 3 kèm mã commit.

## Chi tiết từng lần sử dụng

| Ngày | Prompt chính (nguyên văn) | AI tạo ra | Sinh viên kiểm tra / tự làm |
|---|---|---|---|
| 17/10 (Trương Thanh Vui) | "Từ báo cáo tuần hãy xây dựng các tính năng yêu cầu trong tuần 2 giúp tôi ngoài ra cập nhật các file cần thiết theo yêu cầu của giáo viên trong file Nhan xet.txt" (kèm tệp nhận xét của GVHD về báo cáo tuần 1) | Mã làm thử trên máy cá nhân (Emulator, sửa lỗi hồ sơ, rules V1/V2, kiểm thử rules); bản nháp thiết kế trang lưu trữ hồ sơ (D5); bản nháp báo cáo tuần 2 | Chưa commit mã vì chưa review. Chỉ commit tài liệu thiết kế (`b9792bc`, 19/10) bằng tài khoản của mình |
| 17/10 (Trương Thanh Vui) | "Tôi cần bạn phát triển thêm các chức năng sau : Xây dựng trang thời khóa biểu theo tháng ( hiển thị cả lịch học và thi trong tháng ) . Ngoài ra tạo các phân quyền riêng dành cho các user phù hợp như tự động tính số tiền và thông báo học phí cho sinh viên dựa trên số tính chỉ và giá của mổi tính chỉ được sinh viên được phòng tài chính cung cấp và thông báo công nợ " nhắc đến hạn cho sinh viên " ,Ngoài ra cập nhật thêm quy chế tính điểm đầy đủ cho từng môn học với việc tự động chuyển tỉ lệ dựa trên số lượng bài tập được giao ( Phân quyền đào tạo được phép cập nhật lại tỉ lệ khi đó giáo viên sẽ là người quyết định cột bài tập nào được lưu số còn lại tính vào chuyên cần ) . Ngoài ra phân quyền đào tạo còn có chức năng kiểm tra các modun môn học có đủ đáp ứng với chương trình đào tạo từ đó thêm hoặc bớt môn học . Cũng như cập nhật thêm các chức năng phụ như phiếu đăng ký xét tốt nghiệp. Trang công bố khóa luận ." (kèm tệp PDF "Tỉ lệ và cách tính trọng số điểm theo loại môn") | Mã làm thử các trang mới trên máy cá nhân; bản nháp thiết kế D6 (quy chế tính điểm) và D7 (vai trò mới Đào tạo, Tài chính) | Đây là yêu cầu ngoài kế hoạch tuần 2. Nhóm chỉ commit phần thiết kế (`b9792bc`) và xin ý kiến Thầy về phạm vi trước khi đưa mã lên (mục 6 báo cáo tuần 2) |
| 19/10 | (không dùng AI) | – | Trần Đức Tùng tự vẽ sơ đồ use case tổng bằng draw.io, tự commit `03339cd` bằng tài khoản của mình |
| 20/10 (Nguyễn Thanh Tùng) | "sửa lại 2 file: tuan-02 trong file ai-log và tuan-02 (BaoCaoTuan) trong file (bao-cao-tuan) dựa theo những ý mà thầy đã đưa ra trong tuần 1 và lịch sử up git như trên hình." (kèm 2 nhận xét của GVHD về báo cáo tuần 1 và ảnh chụp lịch sử commit) | Đối chiếu bản nháp báo cáo với `git log`; phát hiện các commit được nêu trong bản nháp không có trên GitHub; viết lại báo cáo tuần 2 và tệp này, chỉ giữ việc có minh chứng | Nguyễn Thanh Tùng chọn phương án "chỉ ghi đúng những gì có trên GitHub"; kiểm tra lại mã commit và link trước khi push bằng tài khoản của mình |

## Sai sót của AI phát hiện trong tuần

1. **Báo cáo nêu commit không có thật trên GitHub.** Bản nháp báo cáo tuần 2 (AI soạn ngày 17/10) liệt kê 5 commit sửa mã, README, tệp kiểm thử, tài liệu sửa lỗi `docs/sua-loi/`, và ghi "25/25 ca kiểm thử đạt". Không tệp nào trong số đó có trên GitHub. Nhóm phát hiện ngày 20/10 khi đối chiếu với lịch sử commit và đã viết lại báo cáo. Bài học: báo cáo chỉ được soạn **sau** khi đã push, và mỗi mã commit phải mở được trên GitHub.
2. Tài liệu D6, D7 do AI soạn nhắc tới các tệp mã (`utils/grading.js`, `tests/logic.test.mjs`, `tests/firestore.rules.test.mjs`...) chưa có trên repo. Nhóm ghi rõ trong báo cáo tuần 2 rằng đây là thiết kế; mã sẽ được đưa lên và đối chiếu ở tuần 3.
3. AI làm luôn nhiều chức năng ngoài kế hoạch (học phí, xét tốt nghiệp, công bố khóa luận...), làm phạm vi đề tài phình ra. Nhóm dừng lại ở mức thiết kế và xin ý kiến Thầy.
4. Bảng giới hạn ở mục 6 của tài liệu quy chế mâu thuẫn với bộ L2 và Q70 ở mục 2. AI tự thêm nhóm giới hạn "môn nặng quá trình", **cần GVHD xác nhận** (D6, mục 5).

## Cơ chế kiểm soát (giữ từ tuần 1, bổ sung tuần 2)

- Mã do AI sinh được commit riêng, thông điệp commit có nhãn `[AI]`, và phải có một thành viên khác review.
- Mỗi thành viên commit bằng tài khoản GitHub của mình.
- **Mới:** chỉ đưa vào báo cáo những commit đã push; trước khi nộp, đối chiếu từng mã commit và từng link với GitHub.
