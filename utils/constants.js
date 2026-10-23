// utils/constants.js – Hằng số & dữ liệu mẫu

export const DEMO_ACCOUNTS = [
  { id: 'u1', email: 'admin@studytask.vn',   password: 'admin123',   name: 'Quản trị viên',     role: 'admin',   subjectIds: null      }, // null = xem tất cả
  { id: 'u2', email: 'teacher@studytask.vn', password: 'teacher123', name: 'TS. Nguyễn Văn An', role: 'teacher', subjectIds: [1, 2]    }, // dạy Toán + Vật lý
  { id: 'u3', email: 'student@studytask.vn', password: 'student123', name: 'Trần Minh Khoa',    role: 'student', subjectIds: [1, 3, 4] }, // học Toán + Lập trình + Tiếng Anh
  { id: 'u4', email: 'daotao@studytask.vn',   password: 'daotao123',   name: 'Phòng Đào tạo',   role: 'training' },
  { id: 'u5', email: 'taichinh@studytask.vn', password: 'taichinh123', name: 'Phòng Tài chính', role: 'finance' },
]
// ✅ Email domain: studytask.vn (khớp với Firebase Auth)
export const DEMO_USER = DEMO_ACCOUNTS[2]

export const ROLES = {
  admin:   { label: 'Quản trị viên', icon: 'shield-fill-check',  color: '#e74a3b', badge: 'danger'  },
  teacher: { label: 'Giáo viên',     icon: 'person-workspace',   color: '#4e73df', badge: 'primary' },
  student: { label: 'Sinh viên',     icon: 'person-circle',      color: '#1cc88a', badge: 'success' },
  training:{ label: 'Phòng Đào tạo', icon: 'building-gear',      color: '#6f42c1', badge: 'primary' },
  finance: { label: 'Phòng Tài chính', icon: 'cash-coin',        color: '#e67e22', badge: 'warning' },
}
// Vai trò cán bộ phòng ban: không gán môn học, xem toàn bộ dữ liệu chung
export const STAFF_ROLES = ['training', 'finance']

export const PERMS = {
  admin:   { canEdit: true,  canDelete: true,  canManageUsers: true,  canGrade: true,  canManageLibrary: true  },
  teacher: { canEdit: true,  canDelete: true,  canManageUsers: false, canGrade: true,  canManageLibrary: false },
  student: { canEdit: false, canDelete: false, canManageUsers: false, canGrade: false, canManageLibrary: false },
  training:{ canEdit: true,  canDelete: true,  canManageUsers: false, canGrade: false, canManageLibrary: false },
  finance: { canEdit: false, canDelete: false, canManageUsers: false, canGrade: false, canManageLibrary: false },
}

export const relDate = (offset) => {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

export const SAMPLE_SUBJECTS = [
  { id: 1, name: 'Toán cao cấp',     code: 'MTH101', color: '#4e73df', teachers: ['TS. Nguyễn Văn An'],                        credits: 3 },
  { id: 2, name: 'Vật lý đại cương', code: 'PHY101', color: '#1cc88a', teachers: ['PGS. Trần Thị Bích', 'TS. Nguyễn Văn An'], credits: 4, practiceCredits: 1 },
  { id: 3, name: 'Lập trình cơ bản', code: 'CS101',  color: '#36b9cc', teachers: ['ThS. Lê Minh Châu'],                        credits: 3 },
  { id: 4, name: 'Tiếng Anh',         code: 'ENG101', color: '#f6c23e', teachers: ['ThS. Phạm Thị Dung'],                       credits: 2 },
  { id: 5, name: 'Cơ sở dữ liệu',    code: 'DB201',  color: '#e74a3b', teachers: ['TS. Hoàng Văn Hải'],                        credits: 3 },
]

export const SAMPLE_DEADLINES = [
  { id: 1,  title: 'Bài tập Chương 3',     subjectId: 1, dueDate: relDate(3),  priority: 'high',   status: 'pending',     description: 'Hoàn thành bài tập từ bài 3.1 đến 3.5' },
  { id: 2,  title: 'Báo cáo thí nghiệm',    subjectId: 2, dueDate: relDate(1),  priority: 'high',   status: 'in_progress', description: 'Viết báo cáo thí nghiệm điện từ trường' },
  { id: 3,  title: 'Bài tập lập trình',      subjectId: 3, dueDate: relDate(7),  priority: 'medium', status: 'pending',     description: 'Viết chương trình giải phương trình bậc 2' },
  { id: 4,  title: 'Kiểm tra giữa kỳ',       subjectId: 4, dueDate: relDate(-2), priority: 'high',   status: 'completed',   description: 'Ôn tập Unit 5 và 6' },
  { id: 5,  title: 'Đồ án CSDL',             subjectId: 5, dueDate: relDate(14), priority: 'high',   status: 'in_progress', description: 'Thiết kế và cài đặt hệ thống quản lý thư viện' },
  { id: 6,  title: 'Tiểu luận Toán',          subjectId: 1, dueDate: relDate(-5), priority: 'medium', status: 'pending',     description: 'Tiểu luận về ứng dụng tích phân' },
  { id: 7,  title: 'Thuyết trình Tiếng Anh', subjectId: 4, dueDate: relDate(5),  priority: 'low',    status: 'pending',     description: 'Chuẩn bị bài thuyết trình về môi trường' },
  { id: 8,  title: 'Quiz Vật lý Chương 4',   subjectId: 2, dueDate: relDate(2),  priority: 'medium', status: 'completed',   description: 'Làm quiz online chương 4' },
  { id: 9,  title: 'Project Lập trình',       subjectId: 3, dueDate: relDate(10), priority: 'high',   status: 'pending',     description: 'Xây dựng ứng dụng quản lý sinh viên' },
  { id: 10, title: 'Báo cáo Vật lý 2',        subjectId: 2, dueDate: relDate(-1), priority: 'medium', status: 'pending',     description: 'Báo cáo thí nghiệm quang học' },
]

export const HW_TYPES = {
  assign: { label: 'Giao bài tập',  icon: 'journal-plus',   color: '#4e73df', bg: 'rgba(78,115,223,0.12)'  },
  submit: { label: 'Nộp bài tập',   icon: 'cloud-upload',   color: '#1cc88a', bg: 'rgba(28,200,138,0.12)'  },
  quiz:   { label: 'Trắc nghiệm',   icon: 'patch-question', color: '#e67e22', bg: 'rgba(230,126,34,0.12)'  },
}

export const SAMPLE_HOMEWORKS = [
  { id: 1, subjectId: 1, title: 'Bài tập Chương 1',    type: 'assign', dueDate: relDate(5),  status: 'pending',   description: 'Hoàn thành bài 1.1 đến 1.5 trong giáo trình. Trình bày lời giải chi tiết, nộp file PDF.', fileUrl: 'https://drive.google.com', fileName: 'De_bai_chuong1.pdf', score: null },
  { id: 2, subjectId: 1, title: 'Nộp bài tuần 2',      type: 'submit', dueDate: relDate(2),  status: 'pending',   description: '', score: null },
  { id: 3, subjectId: 1, title: 'Quiz Chương 1',        type: 'quiz',   dueDate: relDate(3),  status: 'completed', description: '20 câu trắc nghiệm', score: 8.5 },
  { id: 4, subjectId: 2, title: 'Bài tập Thí nghiệm',  type: 'assign', dueDate: relDate(7),  status: 'pending',   description: 'Tổng hợp kết quả TN', score: null },
  { id: 5, subjectId: 2, title: 'Nộp báo cáo TN',      type: 'submit', dueDate: relDate(4),  status: 'pending',   description: '', score: null },
  { id: 6, subjectId: 3, title: 'Quiz Lập trình C',     type: 'quiz',   dueDate: relDate(1),  status: 'pending',   description: '20 câu', score: null },
  { id: 7, subjectId: 4, title: 'Bài tập ngữ pháp',    type: 'assign', dueDate: relDate(6),  status: 'pending',   description: 'Unit 5', score: null },
  { id: 8, subjectId: 5, title: 'Quiz CSDL lần 1',     type: 'quiz',   dueDate: relDate(8),  status: 'completed', description: '30 câu', score: 9 },
]

export const DEFAULT_PROFILE = {
  name:      DEMO_USER.name,
  studentId: '2021001234',
  faculty:   'Công nghệ thông tin',
  major:     'Kỹ thuật phần mềm',
  className: 'KTPM2021A',
  semester:  'HK2 2025–2026',
  gpa:       '3.20',
  email:     DEMO_USER.email,
  phone:     '0901234567',
}

// Hồ sơ trống cho sinh viên thật (tài khoản Firebase) – DEFAULT_PROFILE ở trên chỉ dùng cho chế độ demo
export const BLANK_STUDENT_PROFILE = {
  name: '', studentId: '', faculty: '', major: '', className: '', semester: '', gpa: '', email: '', phone: '',
}

export const DEFAULT_TEACHER_PROFILE = {
  name: '', teacherId: '', faculty: '', department: '', position: 'Giảng viên', email: '', phone: '',
}

export const DEFAULT_ADMIN_PROFILE = {
  name: '', email: '', phone: '', department: 'Phòng Đào tạo',
}

export const DEFAULT_LIBRARY = [
  { id: 1,  title: 'Google Scholar',       url: 'https://scholar.google.com',       category: 'research', note: 'Tìm kiếm bài báo khoa học quốc tế' },
  { id: 2,  title: 'Thư viện Quốc gia VN', url: 'https://nlv.gov.vn',               category: 'library',  note: 'Hệ thống thư viện điện tử Quốc gia' },
  { id: 3,  title: 'Coursera',             url: 'https://www.coursera.org',          category: 'course',   note: 'Khóa học từ các ĐH hàng đầu thế giới' },
  { id: 4,  title: 'Khan Academy',         url: 'https://www.khanacademy.org',       category: 'course',   note: 'Học miễn phí mọi môn, mọi lứa tuổi' },
  { id: 5,  title: 'ResearchGate',         url: 'https://www.researchgate.net',      category: 'research', note: 'Mạng lưới nghiên cứu khoa học toàn cầu' },
  { id: 6,  title: 'MIT OpenCourseWare',   url: 'https://ocw.mit.edu',               category: 'course',   note: 'Tài liệu khóa học MIT hoàn toàn miễn phí' },
  { id: 7,  title: 'Project Gutenberg',    url: 'https://www.gutenberg.org',         category: 'book',     note: 'Kho sách điện tử cổ điển miễn phí' },
  { id: 8,  title: 'Overleaf',             url: 'https://www.overleaf.com',          category: 'tool',     note: 'Soạn thảo LaTeX trực tuyến, cộng tác nhóm' },
  { id: 9,  title: 'Stack Overflow',       url: 'https://stackoverflow.com',         category: 'tool',     note: 'Cộng đồng hỏi đáp lập trình lớn nhất' },
  { id: 10, title: 'IEEE Xplore',          url: 'https://ieeexplore.ieee.org',       category: 'research', note: 'Tạp chí và hội nghị kỹ thuật IEEE' },
  // ── Thư viện số & sách điện tử miễn phí ──
  { id: 11, title: 'Z-Library',            url: 'https://z-lib.io',                  category: 'book',     note: 'Thư viện số lớn nhất – hàng triệu sách & bài báo' },
  { id: 12, title: 'Open Library',         url: 'https://openlibrary.org',           category: 'book',     note: 'Mượn sách điện tử miễn phí (Internet Archive)' },
  { id: 13, title: 'Library Genesis',      url: 'https://libgen.is',                 category: 'book',     note: 'Kho sách khoa học, giáo trình điện tử miễn phí' },
  { id: 14, title: 'Internet Archive',     url: 'https://archive.org',               category: 'library',  note: 'Thư viện số: sách, tài liệu, phim, âm thanh' },
  { id: 15, title: 'DOAB – Sách học thuật',url: 'https://www.doabooks.org',          category: 'book',     note: 'Directory of Open Access Books – sách học thuật mở' },
  { id: 16, title: 'DOAJ – Tạp chí mở',    url: 'https://doaj.org',                  category: 'research', note: 'Directory of Open Access Journals – tạp chí miễn phí' },
  { id: 17, title: 'ManyBooks',            url: 'https://manybooks.net',             category: 'book',     note: 'Hơn 50.000 đầu sách điện tử miễn phí mọi thể loại' },
  { id: 18, title: 'Thư viện số ĐHQG-HCM', url: 'https://www.vnulib.edu.vn',         category: 'library',  note: 'Thư viện Trung tâm ĐHQG TP.HCM' },
  { id: 19, title: 'Sách Việt – Wikisource',url: 'https://vi.wikisource.org',        category: 'library',  note: 'Kho văn bản tiếng Việt miễn phí, bản quyền mở' },
  { id: 20, title: 'PDFDrive',             url: 'https://www.pdfdrive.com',          category: 'book',     note: 'Công cụ tìm & tải sách PDF miễn phí' },
  { id: 21, title: 'Bookboon',             url: 'https://bookboon.com',              category: 'book',     note: 'Giáo trình đại học & sách kỹ năng miễn phí' },
]

export const DEFAULT_SETTINGS = { accentColor: '#4e73df', darkMode: false, fontSize: 'normal' }

export const QUOTES = [
  'Thành công là tổng hợp của những nỗ lực nhỏ được lặp đi lặp lại mỗi ngày.',
  'Đừng chờ cơ hội hoàn hảo. Hãy nắm lấy cơ hội và làm cho nó hoàn hảo.',
  'Học không bao giờ là đủ – mỗi ngày học một điều mới là bạn đã tiến xa hơn.',
  'Kỷ luật là cầu nối giữa mục tiêu và thành tựu.',
  'Đầu tư vào kiến thức luôn mang lại lợi nhuận cao nhất.',
  'Hôm nay bạn làm gì sẽ quyết định bạn là ai ngày mai.',
]

// Các thư viện số / kho sách điện tử miễn phí của Việt Nam (để cập nhật đầu sách)
export const VN_LIBRARIES = [
  { id: 'hoc10',      name: 'Hoc10',                 url: 'https://hoc10.vn',            desc: 'Sách giáo khoa & học liệu số miễn phí (NXB Giáo dục)', icon: 'book-half',        color: '#e74a3b' },
  { id: 'vietjack',   name: 'VietJack',              url: 'https://vietjack.com',        desc: 'Học liệu, giải bài tập, đề thi các cấp miễn phí',      icon: 'mortarboard',      color: '#1cc88a' },
  { id: 'voer',       name: 'VOER – Học liệu mở',    url: 'https://voer.edu.vn',         desc: 'Thư viện học liệu mở Việt Nam, giáo trình đại học',    icon: 'journal-bookmark', color: '#4e73df' },
  { id: 'nlv',        name: 'Thư viện Quốc gia',     url: 'https://nlv.gov.vn',          desc: 'Hệ thống thư viện điện tử Quốc gia Việt Nam',          icon: 'building',         color: '#36b9cc' },
  { id: 'wikisource', name: 'Wikisource Tiếng Việt', url: 'https://vi.wikisource.org',   desc: 'Kho văn bản, sách tiếng Việt bản quyền mở',           icon: 'file-earmark-text', color: '#e67e22' },
  { id: 'archive',    name: 'Internet Archive',      url: 'https://archive.org',         desc: 'Thư viện số toàn cầu: sách, tài liệu, âm thanh',       icon: 'archive',          color: '#6f42c1' },
  { id: 'tvhoclieu',  name: 'Thư viện Học liệu',     url: 'https://thuvienhoclieu.com',  desc: 'Tài liệu, giáo án, đề thi các cấp',                    icon: 'journal-richtext', color: '#f6c23e' },
  { id: 'tailieuvn',  name: 'TaiLieu.VN',            url: 'https://tailieu.vn',          desc: 'Kho tài liệu, luận văn, giáo trình lớn',              icon: 'collection',       color: '#858796' },
]

export const LIB_CAT = {
  research: { label: 'Nghiên cứu', color: '#6f42c1', bg: 'rgba(111,66,193,0.10)', icon: 'journal-richtext' },
  library:  { label: 'Thư viện',   color: '#4e73df', bg: 'rgba(78,115,223,0.10)', icon: 'building' },
  course:   { label: 'Khóa học',   color: '#e67e22', bg: 'rgba(230,126,34,0.10)', icon: 'mortarboard' },
  book:     { label: 'Sách',       color: '#1cc88a', bg: 'rgba(28,200,138,0.10)', icon: 'book-half' },
  tool:     { label: 'Công cụ',    color: '#36b9cc', bg: 'rgba(54,185,204,0.10)', icon: 'tools' },
  other:    { label: 'Khác',       color: '#858796', bg: 'rgba(133,135,150,0.10)', icon: 'link-45deg' },
}

export const PRIORITY_LABEL = { high: 'Cao', medium: 'Trung bình', low: 'Thấp' }
export const STATUS_LABEL   = { pending: 'Chưa làm', in_progress: 'Đang làm', completed: 'Hoàn thành' }
export const PRIORITY_CLASS = { high: 'danger', medium: 'warning', low: 'success' }
export const STATUS_CLASS   = { pending: 'secondary', in_progress: 'primary', completed: 'success' }
export const SUBJECT_COLORS = ['#4e73df','#1cc88a','#36b9cc','#f6c23e','#e74a3b','#858796','#6610f2','#fd7e14']
export const ACCENT_COLORS  = [
  { value: '#4e73df', name: 'Xanh dương' }, { value: '#1cc88a', name: 'Xanh lá' },
  { value: '#6f42c1', name: 'Tím' },        { value: '#e67e22', name: 'Cam' },
  { value: '#e74a3b', name: 'Đỏ' },         { value: '#36b9cc', name: 'Lam' },
]
export const SAMPLE_QUIZZES = [
  {
    id: 1, subjectId: 1,
    title: 'Quiz Chương 1 – Giới hạn hàm số',
    description: 'Kiểm tra kiến thức về giới hạn và liên tục',
    dueDate: relDate(7), status: 'active', createdAt: new Date().toISOString(),
    questions: [
      { id: 1, text: 'Giới hạn của f(x) = x² khi x → 2 là bao nhiêu?', type: 'single',
        answers: [{ id:'a', text:'2', correct:false },{ id:'b', text:'4', correct:true },{ id:'c', text:'6', correct:false },{ id:'d', text:'8', correct:false }] },
      { id: 2, text: 'Hàm số nào sau đây LIÊN TỤC tại x = 0? (chọn tất cả đúng)', type: 'multiple',
        answers: [{ id:'a', text:'f(x) = 1/x', correct:false },{ id:'b', text:'f(x) = |x|', correct:true },{ id:'c', text:'f(x) = x²', correct:true },{ id:'d', text:'f(x) = tan(x)', correct:false }] },
      { id: 3, text: 'Đạo hàm của f(x) = x³ là:', type: 'single',
        answers: [{ id:'a', text:'x²', correct:false },{ id:'b', text:'2x²', correct:false },{ id:'c', text:'3x²', correct:true },{ id:'d', text:'3x³', correct:false }] },
    ],
  },
  {
    id: 2, subjectId: 3,
    title: 'Quiz Lập trình C – Kiểu dữ liệu & vòng lặp',
    description: 'Kiểm tra cơ bản về C programming',
    dueDate: relDate(5), status: 'active', createdAt: new Date().toISOString(),
    questions: [
      { id: 1, text: 'Kiểu dữ liệu nào chiếm 4 bytes trong C?', type: 'single',
        answers: [{ id:'a', text:'char', correct:false },{ id:'b', text:'short', correct:false },{ id:'c', text:'int', correct:true },{ id:'d', text:'double', correct:false }] },
      { id: 2, text: 'Vòng lặp nào chạy ít nhất 1 lần dù điều kiện sai?', type: 'single',
        answers: [{ id:'a', text:'for', correct:false },{ id:'b', text:'while', correct:false },{ id:'c', text:'do-while', correct:true },{ id:'d', text:'Tất cả đều sai', correct:false }] },
      { id: 3, text: 'Chọn các cách khai báo mảng HỢP LỆ trong C:', type: 'multiple',
        answers: [{ id:'a', text:'int a[5];', correct:true },{ id:'b', text:'int a[] = {1,2,3};', correct:true },{ id:'c', text:'int a[0];', correct:false },{ id:'d', text:'float b[3] = {1.0, 2.0};', correct:true }] },
    ],
  },
]

export const MATERIAL_TYPES = {
  giaoTrinh: { label: 'Giáo trình',          icon: 'book-half',         color: '#4e73df' },
  slide:      { label: 'Slide bài giảng',     icon: 'easel2',            color: '#1cc88a' },
  baiTap:     { label: 'Bài tập / Đề thi',   icon: 'file-earmark-text', color: '#f6c23e' },
  thamKhao:   { label: 'Tài liệu tham khảo', icon: 'journal-bookmark',  color: '#36b9cc' },
  khac:       { label: 'Khác',               icon: 'file-earmark',      color: '#858796' },
}

export const SAMPLE_MATERIALS = [
  { id: 1, subjectId: 1, title: 'Giáo trình Toán cao cấp A1',      type: 'giaoTrinh', description: 'Tài liệu chính thức của môn học – NXB ĐHQG',   url: 'https://drive.google.com', uploadedBy: 'TS. Nguyễn Văn An',  uploadedAt: relDate(-30) },
  { id: 2, subjectId: 1, title: 'Slide Chương 1–3: Giới hạn',       type: 'slide',     description: 'Bài giảng điện tử tuần 1–3',                    url: 'https://drive.google.com', uploadedBy: 'TS. Nguyễn Văn An',  uploadedAt: relDate(-20) },
  { id: 3, subjectId: 1, title: 'Đề kiểm tra giữa kỳ các năm',     type: 'baiTap',    description: 'Tổng hợp đề + đáp án từ 2020–2024',             url: 'https://drive.google.com', uploadedBy: 'TS. Nguyễn Văn An',  uploadedAt: relDate(-15) },
  { id: 4, subjectId: 2, title: 'Giáo trình Vật lý đại cương',      type: 'giaoTrinh', description: 'Lương Duyên Bình & Nguyễn Quang Báu',           url: 'https://drive.google.com', uploadedBy: 'PGS. Trần Thị Bích', uploadedAt: relDate(-25) },
  { id: 5, subjectId: 2, title: 'Slide Điện từ trường – Chương 4',  type: 'slide',     description: '',                                              url: 'https://drive.google.com', uploadedBy: 'PGS. Trần Thị Bích', uploadedAt: relDate(-12) },
  { id: 6, subjectId: 3, title: 'Tài liệu lập trình C',             type: 'giaoTrinh', description: 'Ngôn ngữ lập trình C – NXB Giáo dục',          url: 'https://drive.google.com', uploadedBy: 'ThS. Lê Minh Châu',  uploadedAt: relDate(-28) },
  { id: 7, subjectId: 3, title: 'Slide Lập trình C – Tuần 1–4',    type: 'slide',     description: 'Kiểu dữ liệu, vòng lặp, hàm',                  url: 'https://drive.google.com', uploadedBy: 'ThS. Lê Minh Châu',  uploadedAt: relDate(-10) },
  { id: 8, subjectId: 4, title: 'Cambridge Grammar in Use',          type: 'thamKhao',  description: 'Tài liệu ngữ pháp tham khảo',                   url: 'https://drive.google.com', uploadedBy: 'ThS. Phạm Thị Dung', uploadedAt: relDate(-22) },
]

// ── Thời khóa biểu & Lịch thi ──
export const DAY_LABELS = { 2: 'Thứ Hai', 3: 'Thứ Ba', 4: 'Thứ Tư', 5: 'Thứ Năm', 6: 'Thứ Sáu', 7: 'Thứ Bảy', 8: 'Chủ nhật' }
export const DAY_ORDER  = [2, 3, 4, 5, 6, 7, 8]
// JS getDay(): 0=CN..6=T7 → nhãn
export const weekdayLabel = (dateStr) => {
  const d = new Date(dateStr).getDay()   // 0..6
  return d === 0 ? 'Chủ nhật' : `Thứ ${d + 1}`
}

export const CLASS_FORMATS = {
  offline: { label: 'Trực tiếp',  icon: 'building',     color: '#4e73df' },
  online:  { label: 'Trực tuyến', icon: 'camera-video', color: '#1cc88a' },
  hybrid:  { label: 'Kết hợp',    icon: 'diagram-2',    color: '#36b9cc' },
}
export const EXAM_FORMATS = {
  tracNghiem: { label: 'Trắc nghiệm', icon: 'ui-checks',          color: '#e67e22' },
  tuLuan:     { label: 'Tự luận',     icon: 'pencil-square',      color: '#4e73df' },
  vanDap:     { label: 'Vấn đáp',     icon: 'chat-dots',          color: '#6f42c1' },
  thucHanh:   { label: 'Thực hành',   icon: 'pc-display',         color: '#1cc88a' },
  online:     { label: 'Trực tuyến',  icon: 'camera-video',       color: '#36b9cc' },
}

export const SAMPLE_SCHEDULE = [
  { id: 1, subjectId: 1, day: 2, start: '07:00', end: '09:30', room: 'A1.203', teacher: 'TS. Nguyễn Văn An',  format: 'offline' },
  { id: 2, subjectId: 3, day: 2, start: '09:45', end: '11:30', room: 'B2.104', teacher: 'ThS. Lê Minh Châu',  format: 'offline' },
  { id: 3, subjectId: 2, day: 4, start: '13:00', end: '15:30', room: 'A3.301', teacher: 'PGS. Trần Thị Bích', format: 'offline' },
  { id: 4, subjectId: 4, day: 6, start: '07:00', end: '09:00', room: 'Online',  teacher: 'ThS. Phạm Thị Dung', format: 'online' },
]

export const SAMPLE_EXAMS = [
  { id: 1, subjectId: 1, date: relDate(20), start: '07:30', end: '09:00', room: 'A1.101', teacher: 'TS. Nguyễn Văn An',  format: 'tuLuan' },
  { id: 2, subjectId: 3, date: relDate(25), start: '09:30', end: '10:30', room: 'Phòng máy B2', teacher: 'ThS. Lê Minh Châu', format: 'thucHanh' },
  { id: 3, subjectId: 2, date: relDate(28), start: '13:00', end: '14:00', room: 'A3.201', teacher: 'PGS. Trần Thị Bích', format: 'tracNghiem' },
]

export const NAV_ITEMS = [
  { key: 'dashboard',  icon: 'speedometer2',        label: 'Dashboard', roles: ['admin','teacher','student','training','finance'] },
  { key: 'subjects',   icon: 'book',                label: 'Môn học',   roles: ['admin','teacher','student','training'] },
  { key: 'schedule',   icon: 'calendar-week',       label: 'Lịch học & Thi', roles: ['admin','teacher','student','training'] },
  { key: 'calendar',   icon: 'calendar3',           label: 'Lịch theo tháng', roles: ['admin','teacher','student','training'] },
  { key: 'deadlines',  icon: 'clock',               label: 'Deadline',  roles: ['admin','teacher','student'] },
  { key: 'statistics', icon: 'bar-chart',           label: 'Thống kê',  roles: ['admin','teacher','student'] },
  { key: 'library',    icon: 'journal-bookmark',    label: 'Thư viện',  roles: ['admin','teacher','student'] },
  { key: 'quiz',        icon: 'patch-question',      label: 'Trắc nghiệm', roles: ['admin','teacher','student'] },
  { key: 'tools',      icon: 'tools',               label: 'Tiện ích',    roles: ['admin','teacher','student'] },
  { key: 'news',       icon: 'newspaper',           label: 'Tin tức',     roles: ['admin','teacher','student','training','finance'] },
  { key: 'forms',      icon: 'file-earmark-ruled',  label: 'Biểu mẫu',    roles: ['admin','teacher','student','training','finance'] },
  { key: 'theses',     icon: 'journal-richtext',    label: 'Công bố khóa luận', roles: ['admin','teacher','student','training','finance'] },
  { key: 'graduation', icon: 'mortarboard',         label: 'Xét tốt nghiệp', roles: ['admin','student','training'] },
  { key: 'tuition',    icon: 'cash-coin',           label: 'Học phí',     roles: ['admin','student','finance'] },
  { key: 'grading',    icon: 'percent',             label: 'Quy chế điểm', roles: ['admin','teacher','student','training'] },
  { key: 'curriculum', icon: 'diagram-3',           label: 'Chương trình ĐT', roles: ['admin','training'] },
  { key: 'directory',  icon: 'person-vcard',        label: 'Hồ sơ SV-GV', roles: ['admin','teacher','training','finance'] },
  { key: 'reports',    icon: 'clipboard-data',      label: 'Quản lý lớp học', roles: ['admin','teacher'] },
  { key: 'contact',    icon: 'envelope',            label: 'Liên hệ',     roles: ['admin','teacher','student','training','finance'] },
  { key: 'admin',      icon: 'gear-wide-connected', label: 'Quản trị',    roles: ['admin'] },
]

// Nhóm điều hướng cho sidebar dọc – mỗi nhóm có thể mở/thu độc lập
export const NAV_GROUPS = [
  { id: 'hoctap',    title: 'Học tập',           icon: 'mortarboard-fill', keys: ['dashboard', 'subjects', 'schedule', 'calendar', 'deadlines', 'quiz'] },
  { id: 'tainguyen', title: 'Theo dõi & Tài nguyên', icon: 'collection-fill', keys: ['statistics', 'library', 'tools'] },
  { id: 'daotao',    title: 'Đào tạo & Tài chính', icon: 'building',       keys: ['grading', 'curriculum', 'tuition', 'graduation', 'theses'] },
  { id: 'nhatruong', title: 'Nhà trường',        icon: 'bank',             keys: ['news', 'forms'] },
  { id: 'hethong',   title: 'Quản lý & Hệ thống', icon: 'grid-1x2-fill',   keys: ['directory', 'reports', 'contact', 'admin'] },
]

// ── Tin tức nhà trường ──
export const NEWS_CATEGORIES = {
  thongBao: { label: 'Thông báo', icon: 'megaphone',        color: '#e74a3b' },
  hocVu:    { label: 'Học vụ',    icon: 'mortarboard',      color: '#4e73df' },
  suKien:   { label: 'Sự kiện',   icon: 'calendar-event',   color: '#1cc88a' },
  hocBong:  { label: 'Học bổng',  icon: 'award',            color: '#f6c23e' },
  khac:     { label: 'Khác',      icon: 'info-circle',      color: '#858796' },
}
export const SAMPLE_NEWS = [
  { id: 1, title: 'Thông báo lịch nghỉ Tết Nguyên đán 2026', category: 'thongBao', pinned: true,
    content: 'Nhà trường thông báo lịch nghỉ Tết Nguyên đán từ ngày 14/02 đến hết 22/02/2026. Sinh viên chú ý hoàn thành các học phần trước kỳ nghỉ.',
    author: 'Phòng Đào tạo', date: relDate(-2) },
  { id: 2, title: 'Đăng ký học phần học kỳ 2 năm học 2025-2026', category: 'hocVu', pinned: false,
    content: 'Cổng đăng ký học phần mở từ 00:00 ngày 25/01/2026. Sinh viên đăng nhập hệ thống để đăng ký theo đúng thời gian quy định của khoa.',
    author: 'Phòng Đào tạo', date: relDate(-5) },
  { id: 3, title: 'Học bổng khuyến khích học tập kỳ 1', category: 'hocBong', pinned: false,
    content: 'Danh sách sinh viên đạt học bổng khuyến khích học tập học kỳ 1 đã được công bố. Sinh viên xem chi tiết tại phòng Công tác sinh viên.',
    author: 'Phòng CTSV', date: relDate(-8) },
  { id: 4, title: 'Ngày hội việc làm & Kết nối doanh nghiệp 2026', category: 'suKien', pinned: false,
    content: 'Ngày hội việc làm được tổ chức ngày 15/03/2026 tại Hội trường A. Hơn 50 doanh nghiệp tham gia tuyển dụng và thực tập.',
    author: 'Trung tâm Hỗ trợ SV', date: relDate(-12) },
]

// ── Biểu mẫu / văn bản chung ──
export const FORM_CATEGORIES = {
  donTu:     { label: 'Đơn từ',        icon: 'file-earmark-text',  color: '#4e73df' },
  baoCao:    { label: 'Mẫu báo cáo',   icon: 'file-earmark-bar-graph', color: '#1cc88a' },
  huongDan:  { label: 'Hướng dẫn',     icon: 'file-earmark-check', color: '#36b9cc' },
  quyChe:    { label: 'Quy chế',       icon: 'file-earmark-lock',  color: '#e74a3b' },
  khac:      { label: 'Khác',          icon: 'file-earmark',       color: '#858796' },
}
export const SAMPLE_FORMS = [
  { id: 1, title: 'Đơn xin nghỉ học tạm thời',     category: 'donTu',    description: 'Mẫu đơn xin bảo lưu / nghỉ học tạm thời có xác nhận của khoa', url: 'https://drive.google.com', uploadedBy: 'Phòng Đào tạo', date: relDate(-20) },
  { id: 2, title: 'Đơn phúc khảo điểm thi',        category: 'donTu',    description: 'Dùng khi sinh viên có nhu cầu phúc khảo điểm thi kết thúc học phần', url: 'https://drive.google.com', uploadedBy: 'Phòng Đào tạo', date: relDate(-25) },
  { id: 3, title: 'Mẫu báo cáo thực tập tốt nghiệp', category: 'baoCao', description: 'Mẫu trình bày báo cáo thực tập chuẩn của nhà trường', url: 'https://drive.google.com', uploadedBy: 'Khoa CNTT', date: relDate(-30) },
  { id: 4, title: 'Hướng dẫn định dạng khóa luận',  category: 'huongDan', description: 'Quy định trình bày, font chữ, lề, mục lục cho khóa luận tốt nghiệp', url: 'https://drive.google.com', uploadedBy: 'Phòng Đào tạo', date: relDate(-35) },
  { id: 5, title: 'Quy chế đào tạo tín chỉ',        category: 'quyChe',   description: 'Quy chế học vụ, điểm, xếp loại theo hệ thống tín chỉ', url: 'https://drive.google.com', uploadedBy: 'Phòng Đào tạo', date: relDate(-40) },
]

// Dữ liệu hoạt động MẪU (chỉ dùng cho chế độ demo – không có Firebase)
// Mỗi phần tử = một sinh viên với danh sách sự kiện đã làm
export const SAMPLE_ACTIVITY = [
  { uid: 'sv1', name: 'Nguyễn Văn Bình',  email: 'binh@sv.vn',  subjectIds: [1, 2], events: [
    { type: 'material', subjectId: 1, refId: 1, refTitle: 'Giáo trình Toán cao cấp A1', at: relDate(-5) },
    { type: 'material', subjectId: 1, refId: 2, refTitle: 'Slide Chương 1–3: Giới hạn',  at: relDate(-4) },
    { type: 'homework', subjectId: 1, refId: 1, refTitle: 'Bài tập Chương 1',            url: 'https://drive.google.com', note: 'Em nộp bài, có 2 câu chưa chắc ạ.', at: relDate(-3) },
    { type: 'quiz',     subjectId: 1, refId: 1, refTitle: 'Quiz Chương 1 – Giới hạn hàm số', score: 8.5, total: 3, correct: 3, at: relDate(-2) },
    { type: 'material', subjectId: 2, refId: 4, refTitle: 'Giáo trình Vật lý đại cương', at: relDate(-2) },
  ]},
  { uid: 'sv2', name: 'Trần Thị Cúc',     email: 'cuc@sv.vn',   subjectIds: [1, 2], events: [
    { type: 'material', subjectId: 1, refId: 1, refTitle: 'Giáo trình Toán cao cấp A1', at: relDate(-6) },
    { type: 'quiz',     subjectId: 1, refId: 1, refTitle: 'Quiz Chương 1 – Giới hạn hàm số', score: 6.5, total: 3, correct: 2, at: relDate(-1) },
    { type: 'homework', subjectId: 2, refId: 4, refTitle: 'Bài tập Thí nghiệm',          at: relDate(-2) },
  ]},
  { uid: 'sv3', name: 'Lê Hoàng Dũng',    email: 'dung@sv.vn',  subjectIds: [1, 3], events: [
    { type: 'material', subjectId: 3, refId: 6, refTitle: 'Tài liệu lập trình C',        at: relDate(-4) },
    { type: 'material', subjectId: 3, refId: 7, refTitle: 'Slide Lập trình C – Tuần 1–4', at: relDate(-3) },
    { type: 'quiz',     subjectId: 3, refId: 2, refTitle: 'Quiz Lập trình C',            score: 9.0, total: 3, correct: 3, at: relDate(-1) },
    { type: 'homework', subjectId: 3, refId: 6, refTitle: 'Quiz Lập trình C',            url: 'https://github.com', note: '', at: relDate(-2) },
  ]},
  { uid: 'sv4', name: 'Phạm Minh Đức',    email: 'duc@sv.vn',   subjectIds: [1, 3], events: [
    { type: 'material', subjectId: 1, refId: 1, refTitle: 'Giáo trình Toán cao cấp A1', at: relDate(-7) },
    { type: 'quiz',     subjectId: 3, refId: 2, refTitle: 'Quiz Lập trình C',            score: 4.0, total: 3, correct: 1, at: relDate(-1) },
  ]},
  { uid: 'sv5', name: 'Võ Thị Hoa',       email: 'hoa@sv.vn',   subjectIds: [2, 4], events: [
    { type: 'material', subjectId: 4, refId: 8, refTitle: 'Cambridge Grammar in Use',    at: relDate(-3) },
    { type: 'homework', subjectId: 4, refId: 7, refTitle: 'Bài tập ngữ pháp',            at: relDate(-2) },
  ]},
]

// ── Chương trình đào tạo mẫu (để Phòng Đào tạo khởi tạo nhanh) ──
export const SAMPLE_CURRICULUM = {
  name: 'Kỹ thuật phần mềm – khóa 2024', major: 'Kỹ thuật phần mềm', cohort: '2024', totalCredits: 20,
  modules: [
    { id: 'dc', name: 'Kiến thức giáo dục đại cương', kind: 'required', courses: [
      { code: 'MTH101', name: 'Toán cao cấp', credits: 3 },
      { code: 'PHY101', name: 'Vật lý đại cương', credits: 4 },
      { code: 'ENG101', name: 'Tiếng Anh', credits: 2 },
    ]},
    { id: 'cs', name: 'Kiến thức cơ sở ngành', kind: 'required', courses: [
      { code: 'CS101', name: 'Lập trình cơ bản', credits: 3 },
      { code: 'DB201', name: 'Cơ sở dữ liệu', credits: 3 },
      { code: 'DS201', name: 'Cấu trúc dữ liệu và giải thuật', credits: 3 },
    ]},
    { id: 'tc', name: 'Tự chọn chuyên ngành', kind: 'elective', minCredits: 2, courses: [
      { code: 'WEB301', name: 'Lập trình Web', credits: 3 },
      { code: 'MOB301', name: 'Lập trình di động', credits: 3 },
    ]},
  ],
}

// ── Xét tốt nghiệp ──
export const GRAD_STATUS = {
  submitted: { label: 'Đã nộp – chờ duyệt', color: '#4e73df', icon: 'send-check' },
  needsFix:  { label: 'Cần bổ sung',         color: '#f6c23e', icon: 'exclamation-circle' },
  approved:  { label: 'Đủ điều kiện',        color: '#1cc88a', icon: 'check-circle-fill' },
  rejected:  { label: 'Không đủ điều kiện',  color: '#e74a3b', icon: 'x-circle-fill' },
}
export const GRAD_CERTS = [
  { key: 'english', label: 'Chuẩn đầu ra ngoại ngữ' },
  { key: 'it',      label: 'Chuẩn đầu ra tin học' },
  { key: 'gdqp',    label: 'Chứng chỉ Giáo dục quốc phòng – an ninh' },
  { key: 'gdtc',    label: 'Chứng chỉ Giáo dục thể chất' },
]
