# Thiết kế 05 – Tách đáp án trắc nghiệm và chấm điểm trên máy chủ

Việc 8 của kế hoạch tuần 5, thực hiện ngày 03/11/2026 trong tuần 02/11–07/11/2026: thiết kế chức năng Trắc nghiệm để xử lý V3 và V4. Tuần này chỉ thiết kế, chưa lập trình; phần lập trình dự kiến thực hiện ở tuần 6 theo mục 6 [D3].

## 0. Cập nhật tuần 6: bản cài đặt trên máy chủ riêng (09/11/2026)

Việc 7 của kế hoạch tuần 6 (lập trình V3) do Trương Thanh Vui thực hiện theo thống nhất của nhóm (kế hoạch ghi Trần Đức Tùng). Từ tuần 5 hệ thống chạy trên API Python + SQLite ([D06]) nên các phần dưới đây viết theo Firestore và Worker được thay như sau. Phần mô tả hiện trạng (mục 2), nguyên tắc tách đề/khóa/kết quả (mục 3), luồng chấm (mục 5.2) và ca kiểm thử (mục 6) vẫn đúng về ý tưởng; tên collection giữ nguyên.

| Thiết kế gốc | Bản cài đặt |
|---|---|
| `quizzes` collection | Đề vẫn nằm trong `sharedData/global.quizzes` (để Bảng điểm, Báo cáo lớp, Quy chế điểm không phải đổi), nhưng máy chủ **lọc mọi `correct`** khi trả về cho người không có quyền và khi lưu |
| `quizKeys/{quizId}` | Có, trong bảng `docs`, định dạng `{quizId, subjectId, correctAnswers: {"<mã câu>": ["<mã đáp án>"]}}`. Không đọc/ghi được qua `/api/doc/*`; chỉ Admin và giáo viên dạy môn nhận lại `correct` ghép vào đề khi mở trang Trắc nghiệm |
| `quizResults/{quizId}_{uid}` | Có, ghi bằng `INSERT` với khóa chính `(col, id)` nên mỗi sinh viên chỉ nộp một lần (HTTP 409 khi nộp lại). Không đọc/ghi qua `/api/doc/*` |
| Cloud Function / Worker | Endpoint trong `server/studytask_api.py`: `POST /api/quiz/{id}/submit`, `GET /api/quiz/mine`, `GET /api/quiz/{id}/results` (Admin, giáo viên dạy môn) |
| Firestore Security Rules | Hàm `guard_quizzes()` ở máy chủ: đề mới chỉ ở `draft`; `draft → active → closed`, một chiều; sau `draft` chỉ đổi được `status`; chỉ xóa đề `draft` (đồng thời xóa khóa); không đổi môn; giáo viên chỉ ghi đề môn mình dạy; người không có quyền chỉ được gửi lại đúng bản họ thấy (nên trình duyệt tải rồi ghi ngược vẫn chạy); mở đề cần mỗi câu có đáp án đúng (câu một lựa chọn: đúng một đáp án) |
| Điểm vào Bảng điểm | Máy chủ ghi `quizResults` (nguồn chính thức) và **đồng thời** ghi một sự kiện `quiz` vào `activities/{uid}` để Bảng điểm và Báo cáo lớp tiếp tục chạy. Giao diện không còn ghi điểm trắc nghiệm. Việc 8 (V4) sẽ chặn sinh viên tự ghi sự kiện `quiz` và chuyển hai màn hình sang đọc `quizResults` |

**Quyết định đã cài đặt cho 3 câu còn mở ở mục 8** (đề xuất của người lập trình, cần nhóm xác nhận ở việc 3):

1. **Hạ tầng:** API Python của máy chủ riêng, không dùng Worker hay Cloud Function.
2. **Chế độ offline/demo:** tắt nộp bài trắc nghiệm (nút bị khóa kèm thông báo), vì không có máy chủ chấm.
3. **Điểm cũ không đối chiếu được:** di trú một lần khi máy chủ khởi động (có sao lưu `studytask.db.bak-pre-quiz-v3`): lấy sự kiện mới nhất từ `activities` và bài trong `userData.submissions`, đặt `migrated: true`, **không chấm lại**; sinh viên đã có điểm cũ không nộp lại được.
4. **Đáp án sau khi nộp:** chỉ trả điểm và số câu đúng; giao diện không hiển thị đáp án đúng (kể cả khi đề đã đóng; xem đáp án chi tiết là việc riêng).
5. **Hạn làm bài:** `dueDate` hết hiệu lực vào cuối ngày đó theo giờ Việt Nam (UTC+7); đề không có hạn hợp lệ thì không giới hạn.
6. **Đề đang mở bất biến:** kể cả `dueDate` và mô tả; muốn sửa phải tạo đề mới.

**Kiểm thử:** `tests/server/test_quiz_v3.py` (chạy trong CI) chuyển các ca RULE-01…18 và API-01…12 sang kiểm thử máy chủ, thêm ca di trú. Chưa có ca cho API-13 (token Emulator) vì không còn Firebase.

**Chưa làm:** hạ cờ `correct` ở dữ liệu mẫu `utils/constants.js` (chỉ dùng ở chế độ offline); cập nhật `docs/phan-tich/03` và các mục 4, 5.1, 7 của tài liệu này theo máy chủ riêng (nội dung vẫn mô tả Firestore); thử trên web thật.

[D06]: 06-chuyen-firebase-sang-may-chu-rieng.md

## 1. Mục tiêu và phạm vi

Thiết kế cách lưu đề không chứa đáp án đúng trong dữ liệu sinh viên đọc được, giới hạn khóa đáp án cho giáo viên dạy môn và Admin, đồng thời chuyển việc chấm điểm và ghi kết quả sang một dịch vụ máy chủ đáng tin cậy. Kết quả chấm từ `quizResults` sẽ là nguồn điểm trắc nghiệm chính thức của Bảng điểm, thay cho điểm do trình duyệt ghi vào `activities`.

Tài liệu này chỉ thiết kế mô hình dữ liệu, quyền truy cập, luồng máy chủ, kiểm thử và chuyển đổi dữ liệu. Chưa triển khai mã, chưa thay đổi Firestore Security Rules, chưa deploy và chưa thao tác trên project đang vận hành.

**Ngoài phạm vi:** giới hạn thời gian làm bài; thiết kế chế độ offline/demo; quy trình nhập/sửa điểm thủ công trong `sharedData.grades`; cách xem đáp án đúng sau khi đề đóng; các loại hoạt động khác lưu trong `activities`. Riêng chế độ offline/demo, nhóm cần quyết định có tắt Trắc nghiệm hay không; tài liệu này không thiết kế cách chấm cho chế độ đó. Thứ tự ưu tiên điểm sửa tay so với điểm máy chủ trong Bảng điểm vẫn được giữ như quy định ở mục 3.4.

## 2. Hiện trạng và vấn đề

Theo báo cáo tuần 1, V3 và V4 được xác định bằng cách đọc mã; nhóm chưa thử khai thác trên hệ thống đang chạy. Vì vậy, bảng sau mô tả hiện trạng mã và rủi ro cần kiểm chứng trong môi trường riêng, không khẳng định đã có khai thác thực tế.

| Hiện trạng | Vị trí | Rủi ro |
|---|---|---|
| Đề và đáp án đúng (`answers[].correct`) cùng nằm trong mảng `quizzes` của `sharedData/global`. | [app.js:113,476](../../app.js#L113) | Người đọc dữ liệu đề có thể nhận cả đáp án đúng. |
| Tài khoản đăng nhập đọc được `sharedData`; giáo viên và Phòng Đào tạo được ghi toàn bộ tài liệu dùng chung, không giới hạn theo môn. | [firestore.rules:78–82](../../firestore.rules#L78) | Sinh viên đọc được dữ liệu dùng chung; giáo viên có thể ghi đề ngoài môn được phân công. |
| Trình duyệt tự so sánh đáp án và tính điểm. | [pages/Quiz.js:222–233](../../pages/Quiz.js#L222) | Người dùng có thể sửa dữ liệu hoặc logic phía trình duyệt trước khi gửi điểm. |
| Bài nộp được lưu trong `userData/{uid}.submissions`, nơi chủ tài khoản tự ghi. | [app.js:524–525](../../app.js#L524) | Sinh viên có thể tự tạo hoặc sửa dữ liệu bài nộp của mình. |
| Sự kiện có điểm được ghi vào `activities/{uid}.events` bởi chính sinh viên. | [pages/Quiz.js:384](../../pages/Quiz.js#L384), [app.js:410](../../app.js#L410) | Người nộp có thể tự ghi điểm trắc nghiệm. |
| Bảng điểm và Báo cáo lớp cùng lấy điểm trắc nghiệm từ `activities`. | [components/GradeBook.js:62–67](../../components/GradeBook.js#L62), [pages/Reports.js:69–72](../../pages/Reports.js#L69) | Nguồn điểm hiện tại của cả hai màn hình phụ thuộc dữ liệu do máy khách ghi. |
| Sinh viên cũng có thể làm bài từ trang Môn học; luồng này dùng `QuizTaker` và ghi bài nộp/điểm. | [pages/Subjects.js:7](../../pages/Subjects.js#L7), [pages/Subjects.js:356–359](../../pages/Subjects.js#L356) | Chỉ sửa trang Trắc nghiệm sẽ bỏ sót một đường làm bài và ghi điểm. |
| Màn hình xem lại sau khi nộp hiện đáp án đúng ngay. | [pages/Quiz.js:259–271](../../pages/Quiz.js#L259) | Đáp án có thể được chia sẻ cho sinh viên chưa làm đề. |

Luồng hiện tại: **đề kèm đáp án đúng → trình duyệt chấm (từ trang Trắc nghiệm hoặc Môn học) → lưu bài trong `userData` → lưu điểm trong `activities` → Bảng điểm và Báo cáo lớp đọc `activities`**. Thiết kế mới chuyển thành: **đề công khai không có đáp án → máy khách gửi câu trả lời → dịch vụ máy chủ đọc khóa, chấm và ghi một kết quả bất biến → Bảng điểm và Báo cáo lớp đọc `quizResults`**.

## 3. Mô hình dữ liệu đề xuất

### 3.1. `quizzes/{quizId}` – đề sinh viên có thể đọc

```js
{
  id: 1, // giữ nguyên kiểu ID số hiện có
  subjectId: 123,
  title: "Kiểm tra chương 1",
  description: "Nội dung/mô tả đề",
  dueDate: "2026-11-07", // bắt buộc
  createdAt: "server timestamp",
  status: "draft", // draft -> active -> closed
  questions: [
    {
      id: 1, // giữ nguyên kiểu ID câu hỏi hiện có
      text: "Nội dung câu hỏi",
      type: "single", // single | multiple
      answers: [
        { id: "a", text: "Lựa chọn A" },
        { id: "b", text: "Lựa chọn B" }
      ]
    }
  ]
}
```

Tài liệu này **không chứa** `correct` hoặc bất kỳ trường nào cho phép suy ra đáp án đúng. Giữ nguyên ID số của đề và câu hỏi như dữ liệu hiện tại; ID tài liệu Firestore của đề là `String(id)`. ID lựa chọn phải ổn định để câu trả lời gửi lên máy chủ tham chiếu được. Các ID này cũng phải giữ nguyên để khóa cột `q:${id}` trong `gradingColumns` và thao tác đổi ID về số ở [utils/grading.js:204](../../utils/grading.js#L204), [components/GradeBook.js:119](../../components/GradeBook.js#L119) tiếp tục khớp.

### 3.2. `quizKeys/{quizId}` – khóa đáp án

```js
{
  quizId: 1,
  subjectId: 123,
  correctAnswers: {
    "1": ["b"]
  }
}
```

Chỉ Admin và giáo viên được phân công dạy `subjectId` tương ứng được đọc hoặc ghi. Máy chủ chấm điểm đọc tài liệu này bằng tài khoản dịch vụ; sinh viên không được đọc.

### 3.3. `quizResults/{quizId}_{uid}` – bài làm và kết quả chính thức

```js
// ID tài liệu Firestore: `${String(quizId)}_${uid}`
{
  uid: "firebase-auth-uid",
  quizId: 1,
  subjectId: 123,
  answers: { "1": ["b"] },
  score: 10,
  correct: 1,
  total: 1,
  submittedAt: "server timestamp",
  migrated: false
}
```

ID tài liệu ghép đề và UID bảo đảm mỗi sinh viên chỉ có một kết quả cho mỗi đề. Khi triển khai phải tạo ID một cách nhất quán, tránh nhập nhằng nếu ID nguồn có ký tự phân cách. `migrated` chỉ có mặt với dữ liệu chuyển từ hệ thống cũ; dữ liệu nộp mới có thể bỏ trường này hoặc đặt `false`.

### 3.4. Các quyết định thiết kế

1. **Gộp câu trả lời và kết quả vào một collection.** Máy chủ nhận câu trả lời, chấm và ghi cả bài làm lẫn điểm trong một lần tạo tài liệu. Tách thành hai collection không đem lại ranh giới bảo mật cần thiết vì máy khách không được quyền ghi collection nào; gộp giúp truy vấn và chuyển dữ liệu đơn giản hơn.
2. **Bảng điểm và Báo cáo lớp đọc `quizResults`, không lấy điểm trắc nghiệm chính thức từ `activities`.** Kết quả chỉ được tạo bởi máy chủ và là nguồn có thể kiểm soát quyền. Các sự kiện không liên quan đến điểm trắc nghiệm có thể tiếp tục dùng `activities`; không dùng sự kiện do sinh viên ghi làm điểm chính thức. Khi tổng hợp điểm tại Bảng điểm, vẫn ưu tiên điểm giáo viên sửa tay trong `sharedData.grades`; nếu chưa có điểm sửa tay thì dùng điểm máy chủ trong `quizResults`.
3. **Phản hồi sau khi nộp:** trả điểm và số câu đúng/tổng câu; không trả khóa đáp án hoặc đánh dấu lựa chọn đúng trước khi đề đóng. Việc mở xem đáp án chi tiết sau khi đề đóng cần được thiết kế và duyệt riêng, không nằm trong phạm vi tuần này.

## 4. Bản nháp Firestore Security Rules

Các quy tắc dưới đây là thiết kế, chưa chạy kiểm thử. Có thể dùng lại `signedIn()`, `hasRole()` và `teachesSubject()` đang có trong [firestore.rules](../../firestore.rules). Cần bổ sung helper `belongsToSubject()` để kiểm tra quyền sinh viên đọc đề theo môn; quyền đọc kết quả của sinh viên chỉ cần kiểm tra UID của tài liệu.

| Collection | Đọc | Ghi |
|---|---|---|
| `quizzes/{quizId}` | Admin; giáo viên dạy môn; sinh viên thuộc môn khi đề `active` hoặc `closed` | Admin; giáo viên dạy môn. Tạo mới ở `draft`; chỉ chuyển `draft → active → closed`; không sửa câu hỏi sau khi rời `draft`; chỉ xóa đề `draft`. |
| `quizKeys/{quizId}` | Admin; giáo viên dạy môn của đề tương ứng | Admin; giáo viên dạy môn chỉ khi đề còn `draft`. Sinh viên không được đọc. Khóa phải cùng môn với đề. |
| `quizResults/{resultId}` | Sinh viên chỉ đọc tài liệu có `uid` của mình; giáo viên dạy `subjectId`; Admin | Không cho phép máy khách tạo, sửa hoặc xóa. |
| `activities/{uid}` | Theo chính sách hiện hành/thiết kế V4 | Không dùng để ghi điểm trắc nghiệm; quyền ghi sự kiện khác cần được giữ hoặc giới hạn riêng trong công việc V4. |

Bản nháp minh họa (cần điều chỉnh kiểu `subjectId` cho thống nhất với dữ liệu môn hiện có):

```firestore
match /quizzes/{quizId} {
  function hasQuizKeyForSubject() {
    return exists(/databases/$(database)/documents/quizKeys/$(quizId))
      && get(/databases/$(database)/documents/quizKeys/$(quizId)).data.subjectId
         == request.resource.data.subjectId;
  }

  function validQuizTransition() {
    return (resource.data.status == 'draft'
            && (request.resource.data.status == 'draft'
                || (request.resource.data.status == 'active' && hasQuizKeyForSubject())))
      || (resource.data.status == 'active'
          && request.resource.data.status == 'closed'
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status']));
  }

  allow read: if isAdmin()
    || teachesSubject(string(resource.data.subjectId))
    || (hasRole(['student'])
        && resource.data.status in ['active', 'closed']
        && belongsToSubject(resource.data.subjectId));

  allow create: if request.resource.data.status == 'draft'
    && request.resource.data.subjectId is int
    && (isAdmin() || teachesSubject(string(request.resource.data.subjectId)));

  allow update: if (isAdmin() || teachesSubject(string(resource.data.subjectId)))
    && request.resource.data.subjectId == resource.data.subjectId
    && validQuizTransition();

  allow delete: if resource.data.status == 'draft'
    && (isAdmin() || teachesSubject(string(resource.data.subjectId)));
}

match /quizKeys/{quizId} {
  allow read: if isAdmin()
    || (teachesSubject(string(resource.data.subjectId))
        && get(/databases/$(database)/documents/quizzes/$(quizId)).data.subjectId
           == resource.data.subjectId);
  allow create: if get(/databases/$(database)/documents/quizzes/$(quizId)).data.status == 'draft'
    && request.resource.data.subjectId
       == get(/databases/$(database)/documents/quizzes/$(quizId)).data.subjectId
    && (isAdmin() || teachesSubject(string(request.resource.data.subjectId)));
  allow update: if get(/databases/$(database)/documents/quizzes/$(quizId)).data.status == 'draft'
    && request.resource.data.subjectId == resource.data.subjectId
    && request.resource.data.subjectId
       == get(/databases/$(database)/documents/quizzes/$(quizId)).data.subjectId
    && (isAdmin() || teachesSubject(string(resource.data.subjectId)));
  allow delete: if get(/databases/$(database)/documents/quizzes/$(quizId)).data.status == 'draft'
    && (isAdmin() || teachesSubject(string(resource.data.subjectId)));
}

match /quizResults/{resultId} {
  allow read: if isAdmin()
    || (hasRole(['student']) && resource.data.uid == request.auth.uid)
    || teachesSubject(string(resource.data.subjectId));
  allow create, update, delete: if false;
}
```

Đây là bản nháp chính sách, cần kiểm tra cú pháp và helper `belongsToSubject()` trong tuần 6 trước khi đưa vào kiểm thử. Khi đề còn `draft`, giáo viên được sửa nội dung hoặc chuyển sang `active`; khi đề đã `active`, chỉ được chuyển sang `closed`; đề `closed` không được cập nhật. Quy tắc một chiều áp dụng cho cả Admin và giáo viên. `quizKeys` chỉ được tạo/sửa/xóa khi đề đang `draft`. Đề chỉ được xóa khi còn `draft`; khi xóa đề nháp, phải xóa `quizKeys` trước rồi mới xóa đề để điều kiện trạng thái của khóa vẫn kiểm tra được. Firestore Security Rules không áp dụng cho Admin SDK hoặc REST API gọi bằng access token của service account. Nếu Worker gọi Firestore bằng ID token của người dùng thì Firestore Security Rules vẫn áp dụng.

**Hạn chế kiểm tra cấu trúc đề:** Firestore Security Rules không thể duyệt an toàn mọi phần tử lồng nhau trong mảng `questions` để bảo đảm không có trường `correct`. Vì vậy, không thể dựa riêng vào Firestore Security Rules để ngăn một mã giáo viên lỗi vô tình lưu đáp án vào `quizzes`. Mã lưu đề phải chủ động loại khóa đáp án khỏi payload; ca kiểm thử phải kiểm tra tài liệu lưu không có `correct` trong bất kỳ lựa chọn nào. Khóa đáp án được lưu riêng trong `quizKeys`.

Khi triển khai cần bảo đảm các truy vấn của ứng dụng tương thích với Firestore Security Rules: Firestore Security Rules không lọc kết quả truy vấn thay cho ứng dụng. Truy vấn danh sách đề phải giới hạn theo môn và trạng thái mà người dùng được phép xem; giáo viên cũng chỉ tải đề và kết quả của môn mình dạy. Sinh viên chỉ được query `quizResults` với điều kiện lọc `uid == request.auth.uid`; query không giới hạn UID phải bị từ chối. Sinh viên thuộc môn được đọc đề `active` và `closed` (có thể đọc cả đề đã đóng mà mình chưa làm); không đọc được đề `draft` hoặc đề môn khác.

## 5. Luồng chấm điểm trên máy chủ

### 5.1. Lựa chọn hạ tầng

| Tiêu chí | Firebase Cloud Function callable | Cloudflare Worker |
|---|---|---|
| Chi phí/hạ tầng | Cần Firebase Blaze; báo cáo tuần 1 ghi nhận việc nâng gói chưa được duyệt. | Có thể dùng gói Free; nhóm đã thử triển khai Worker ở tuần 4. |
| Xác thực | Với callable Cloud Functions thế hệ 2, kiểm tra danh tính qua `request.auth`. | Worker phải tự xác minh Firebase ID token, gồm chữ ký, `iss`, `aud` và `exp`. |
| Ghi Firestore | Admin SDK. | Firestore REST API; thông tin xác thực service account phải lưu trong secret, không đưa vào mã nguồn. |
| Công việc bổ sung | Ít hơn. | Cấu hình `ALLOWED_ORIGIN`, kiểm tra token, xử lý token truy cập Firestore và giới hạn tần suất. |

Chấm điểm là việc máy khách không thể làm an toàn, phù hợp nguyên tắc ở mục 5 [Thiết kế 04](./04-thu-cloudflare-worker-dat-lai-mat-khau.md). **Đề xuất để nhóm xem xét:** dùng Cloudflare Worker vì đã có bản thử triển khai và chưa cần dựa vào Blaze. Đây chưa phải quyết định đã được nhóm duyệt; cần chốt cùng phương án máy chủ ở việc 3 tuần 5 trước khi lập trình. Nếu chọn Cloud Function, thay phần xác thực và truy cập Firestore theo `onCall`/Admin SDK, còn chính sách dữ liệu và ca kiểm thử giữ nguyên.

### 5.2. Quy trình nộp và chấm

1. Người dùng đăng nhập Firebase; máy khách lấy ID token hiện hành.
2. Máy khách gửi `POST` đến endpoint chấm với `{ quizId, answers }` và token trong `Authorization: Bearer ...`. Không nhận `score`, `correct`, `total`, UID hoặc `subjectId` từ máy khách làm dữ liệu đáng tin.
3. Máy chủ xác minh token và lấy UID từ danh tính đã xác thực; từ chối token thiếu/sai/hết hạn hoặc sai project.
4. Máy chủ đọc hồ sơ `user/{uid}` và xác nhận vai trò là sinh viên, sinh viên thuộc môn của đề; đọc `quizzes/{quizId}` và xác nhận đề đang `active` và chưa quá `dueDate`. Vì `dueDate` hiện lưu dạng ngày, cần thống nhất múi giờ và thời điểm kết thúc ngày hạn trước khi lập trình.
5. Máy chủ đọc `quizKeys/{quizId}`, xác nhận khóa cùng môn với đề, rồi chấm từng câu. Giao diện cho phép nộp dù còn câu bỏ trống; câu không trả lời được tính sai kể cả khi tập đáp án đúng rỗng. Câu đơn hiện gửi đáp án dưới dạng chuỗi, câu nhiều lựa chọn gửi mảng; máy chủ chuẩn hóa chuỗi thành mảng một phần tử, giá trị thiếu thành mảng rỗng, rồi chuẩn hóa/sắp xếp ID để so sánh chính xác với tập đáp án đúng. Điểm thang 10 được tính theo công thức hiện tại `Math.round((correct / total) * 10 * 10) / 10`. Dùng thuật toán hiện tại trong [pages/Quiz.js:209,222–229](../../pages/Quiz.js#L209) làm căn cứ, tách thành hàm thuần để kiểm thử.
6. Máy chủ tạo `quizResults/{quizId}_{uid}` với UID, môn, câu trả lời, điểm và thời điểm do máy chủ đặt. Việc tạo phải có tính nguyên tử và thất bại nếu tài liệu đã tồn tại để chặn nộp lần hai; không được ghi đè kết quả cũ.
7. Máy chủ trả điểm và số câu đúng/tổng câu, không trả `correctAnswers`. Bảng điểm và Báo cáo lớp tải kết quả từ `quizResults`.

Đề và khóa đáp án được hoàn thiện khi đề còn `draft`; sau khi đề thành `active`, giáo viên chỉ được đổi trạng thái để đóng đề, không sửa câu hỏi hoặc khóa đáp án. Trạng thái chỉ chuyển một chiều `draft → active → closed`; đề `closed` bất biến và chỉ đề `draft` mới được xóa. Muốn sửa nội dung sau khi mở đề phải tạo đề mới. Thiết kế này chưa định nghĩa chấm lại.

## 6. Ca kiểm thử dự kiến cho tuần 6

Các ca dưới đây sẽ được viết và chạy trong Emulator/kiểm thử Worker riêng, trước khi triển khai. Không thử khai thác trên production.

| Mã ca | Người gọi | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| RULE-01 | Sinh viên | Đọc `quizKeys/{quizId}` | Bị từ chối. |
| RULE-02 | Giáo viên dạy môn | Đọc khóa đáp án môn mình dạy | Được phép. |
| RULE-03 | Giáo viên môn khác | Đọc/ghi khóa đáp án | Bị từ chối. |
| RULE-04 | Sinh viên | Tạo, sửa hoặc xóa `quizzes` | Bị từ chối. |
| RULE-05 | Giáo viên môn khác | Tạo đề cho môn không được phân công | Bị từ chối. |
| RULE-06 | Giáo viên | Đổi `subjectId` khi cập nhật đề | Bị từ chối. |
| RULE-07 | Giáo viên | Tạo đề mới với trạng thái `active` thay vì `draft` | Bị từ chối; đề chỉ được kích hoạt sau khi đã tạo ở dạng `draft` và có khóa đáp án. |
| RULE-08 | Sinh viên | Đọc đề `draft` hoặc đề thuộc môn khác | Bị từ chối. |
| RULE-09 | Sinh viên thuộc môn | Đọc đề `closed` trong môn mình học, kể cả đề chưa làm | Được phép đọc đề để nhận diện bài; khóa đáp án vẫn bị từ chối. |
| RULE-10 | Giáo viên | Sửa câu hỏi khi đề `active` hoặc `closed`, hoặc chuyển `active` về `draft` | Bị từ chối. |
| RULE-11 | Giáo viên | Tạo/sửa/xóa `quizKeys` khi đề không còn `draft` | Bị từ chối. |
| RULE-12 | Giáo viên | Xóa đề `active` hoặc `closed` | Bị từ chối; chỉ đề `draft` mới được xóa. |
| RULE-13 | Sinh viên | Tạo hoặc sửa `quizResults`, kể cả kết quả của mình | Bị từ chối. |
| RULE-14 | Sinh viên | Đọc kết quả của mình rồi đọc kết quả UID khác | Lần đầu được phép; lần sau bị từ chối. |
| RULE-15 | Sinh viên | Query `quizResults` không có điều kiện `uid == request.auth.uid` | Bị từ chối. |
| RULE-16 | Giáo viên dạy môn | Đọc kết quả môn mình dạy; sau đó thử môn khác | Chỉ môn được phân công được phép. |
| RULE-17 | Sinh viên | Ghi điểm trắc nghiệm vào `activities` | Bị từ chối hoặc không tạo điểm chính thức; xác định cùng với phạm vi V4. |
| RULE-18 | Giáo viên/Admin | Xóa `quizKeys` của đề `draft`, sau đó xóa đề đó | Cả hai thao tác được phép theo đúng thứ tự; xác nhận không để lại khóa mồ côi. |
| API-01 | Không xác thực / token không hợp lệ | Gọi endpoint nộp bài | Từ chối; không ghi kết quả. |
| API-02 | Tài khoản không phải sinh viên | Gọi endpoint | Từ chối; không ghi kết quả. |
| API-03 | Sinh viên không thuộc môn | Nộp đề môn khác | Từ chối; không ghi kết quả. |
| API-04 | Sinh viên | Nộp đề đã đóng | Từ chối; không ghi kết quả. |
| API-05 | Sinh viên | Nộp sau `dueDate` khi đề vẫn đang `active` | Từ chối; không ghi kết quả. |
| API-06 | Sinh viên | Nộp còn câu bỏ trống | Câu bỏ trống tính sai; bài vẫn được chấm và ghi nhận nếu còn hạn. |
| API-07 | Sinh viên | Nộp đúng câu đơn lựa chọn với đáp án gửi dạng chuỗi | Máy chủ chuẩn hóa thành mảng một phần tử; kết quả đúng. |
| API-08 | Sinh viên | Nộp đúng câu đơn/multiple lựa chọn và các trường hợp thiếu/thừa lựa chọn hoặc ID không tồn tại | Chỉ tập lựa chọn khớp chính xác mới được tính đúng; dữ liệu không hợp lệ bị xử lý theo chính sách lỗi đã định. |
| API-09 | Tính điểm | Chấm bộ dữ liệu có số câu đúng đã biết | Điểm thang 10, làm tròn 1 chữ số thập phân, khớp công thức hiện hành. |
| API-10 | Sinh viên | Nộp lần hai cùng đề | Bị từ chối; kết quả đầu tiên không bị thay đổi. |
| API-11 | Sinh viên | Gửi trường giả mạo `score`, `uid`, `subjectId` | Bị bỏ qua hoặc từ chối; không ảnh hưởng kết quả máy chủ ghi. |
| API-12 | Người chấm | Kiểm tra dữ liệu trả về sau nộp | Chỉ có điểm và số câu đúng/tổng; không lộ khóa đáp án. |
| API-13 | Môi trường Emulator | Dùng token Emulator không ký | Chỉ chấp nhận qua nhánh kiểm thử riêng; nhánh này không được bật hoặc triển khai production. |

## 7. Kế hoạch chuyển dữ liệu và quay lui

1. Sao lưu dữ liệu theo việc 2 của kế hoạch tuần 5 trước khi chuyển đổi.
2. Viết script dùng Admin SDK, chạy trước trên bản sao/Emulator: tách `sharedData/global.quizzes` thành `quizzes` (bỏ mọi `correct`) và `quizKeys` (chỉ đáp án đúng). Giữ nguyên ID số của đề/câu hỏi; tạo document ID bằng `String(quiz.id)`, đồng thời giữ `quizId` dạng số trong tài liệu kết quả để các cột `q:${id}` ở `gradingColumns` và điểm sửa tay hiện có tiếp tục khớp.
3. Chuyển bài cũ từ `userData/{uid}.submissions` và điểm trắc nghiệm liên quan trong `activities/{uid}.events` sang `quizResults`. Nếu `activities` có nhiều sự kiện cho cùng một sinh viên và đề, chỉ lấy sự kiện mới nhất (theo cách Báo cáo lớp hiện lấy điểm). Đặt `migrated: true`; điểm cũ do trình duyệt tính nên không thể xác minh lại chỉ từ điểm đã lưu. Nếu thiếu câu trả lời hoặc khóa đáp án để đối chiếu, giữ nguyên điểm cũ và ghi nhận là dữ liệu di trú, không tự chấm lại.
4. Kiểm tra số lượng tài liệu, liên kết UID/quizId/subjectId, kết quả lấy mẫu và xác nhận `quizzes` không còn đáp án đúng.
5. Chạy Firestore Security Rules và kiểm thử API trên Emulator; xác nhận Bảng điểm và Báo cáo lớp đọc điểm từ `quizResults`, đồng thời Bảng điểm vẫn ưu tiên điểm sửa tay.
6. Chuyển đổi ứng dụng, Firestore Security Rules và dịch vụ máy chủ theo một đợt có kiểm soát. Chỉ xóa `quizzes` khỏi `sharedData/global` sau khi xác nhận bản mới hoạt động và đã có sao lưu.

**Quay lui:** dừng endpoint nộp bài và quay ứng dụng về phiên bản trước theo kế hoạch triển khai; khôi phục Firestore Security Rules trước đó nếu cần. Không xóa các collection mới trong lúc xử lý sự cố. Dữ liệu cũ được sao lưu trước chuyển đổi; nếu phải quay lại, chỉ khôi phục dữ liệu từ bản sao đã kiểm tra và ghi nhận mọi bài nộp mới phát sinh trong thời gian chuyển đổi để đối soát. Không tiếp tục nhận bài trên cả hai luồng cùng lúc vì sẽ tạo hai nguồn điểm.

## 8. Rủi ro và việc cần chốt

| Rủi ro | Giảm thiểu / việc cần làm |
|---|---|
| Lộ khóa service account của Worker | Chỉ cấp quyền Firestore tối thiểu cần dùng; lưu trong Cloudflare Secret; luân chuyển khóa khi nghi bị lộ; tuyệt đối không ghi vào repo hoặc log. |
| Xác minh ID token sai hoặc bỏ qua kiểm tra môn học/trạng thái đề | Kiểm thử token thiếu/sai/hết hạn, vai trò, môn học và trạng thái đề; từ chối mặc định nếu không xác minh được. |
| Máy chủ bị gọi quá mức | Đặt `ALLOWED_ORIGIN`, giới hạn tần suất và kích thước payload; CORS không thay thế xác thực. |
| Đáp án bị lộ qua collection đề hoặc phản hồi API | Kiểm tra payload lưu đề không có `correct`; sinh viên không đọc được `quizKeys`; API không trả khóa; bổ sung kiểm thử hồi quy. |
| Sinh viên chia sẻ đáp án nhận được sau khi nộp | Chỉ trả điểm/số câu đúng ngay; không trả đáp án đúng trước khi đề đóng. |
| Chế độ offline/demo vẫn chấm trên trình duyệt | Quyết định trước khi lập trình: tắt Trắc nghiệm trong chế độ offline/demo hoặc ghi rõ đây chỉ là dữ liệu thử, không phải điểm chính thức. |
| Điểm cũ không thể xác minh | Gắn `migrated: true`, lưu bản sao và không tuyên bố các điểm này đã được chấm lại bởi máy chủ. |
| Bảng điểm hoặc Báo cáo lớp vẫn đọc `activities` hoặc hai nguồn điểm lệch nhau | Chuyển cả hai màn hình sang `quizResults`; xác nhận dữ liệu và giao diện trước khi bỏ nguồn cũ, đồng thời giữ ưu tiên điểm sửa tay trong Bảng điểm. |
| Nhánh Emulator chấp nhận token không ký lọt lên production | Tách cấu hình theo môi trường, kiểm tra cấu hình triển khai và có ca xác nhận production không bật nhánh Emulator. |
| Độ trễ máy chủ ảnh hưởng thao tác nộp | Đo thời gian phản hồi trên Emulator và môi trường thử; báo trạng thái đang gửi, tránh cho người dùng gửi lặp. Tài liệu 04 đo thao tác Worker đặt lại mật khẩu khoảng 1,2–1,4 giây; đây không phải số đo của endpoint chấm bài. |
| Ngày hạn có thể bị hiểu khác múi giờ | Chốt cách diễn giải `dueDate` dạng ngày (múi giờ và thời điểm hết hạn) và dùng cùng quy tắc ở giao diện lẫn máy chủ. |
| Form hiện tạo đề ở trạng thái `active` mặc định | Tuần 6 phải đổi form tạo đề sang `draft`; chỉ cho kích hoạt sau khi đề và khóa đáp án đã được lưu thành công. |

**Cần nhóm/GVHD thống nhất trước tuần 6:** phương án Worker hay Cloud Function; có tắt Trắc nghiệm ở chế độ offline/demo không; chính sách giữ hay xử lý lại các điểm cũ không có đủ dữ liệu đối chiếu. Tài liệu này đề xuất Worker và không trả đáp án chi tiết ngay sau nộp, nhưng chưa thay thế quyết định chính thức của nhóm.
