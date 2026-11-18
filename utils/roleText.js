// utils/roleText.js – Nhãn hiển thị của nhóm "lịch" theo vai trò.
// Sinh viên: lịch học, lịch thi. Giáo viên: lịch giảng dạy, lịch thi (giám thị). Đào tạo / Admin: xếp lịch học và lịch thi cho các lớp.
// Dữ liệu không đổi; chỉ chữ trên giao diện đổi theo người xem, để cùng một trang không còn lẫn cách gọi của vai trò khác.

const TEACHER = 'teacher'
const MANAGER = ['admin', 'training']

export const isTeachingRole = (role) => role === TEACHER
export const isManagerRole = (role) => MANAGER.includes(role)

// Chữ dùng trên trang Lịch (tuần, tháng, thi) theo vai trò
export function scheduleText(role = 'student') {
  if (role === TEACHER) {
    return {
      nav: 'Lịch giảng dạy & Lịch thi', navMonth: 'Lịch giảng dạy theo tháng',
      title: 'Lịch giảng dạy & Lịch thi', subtitle: 'Lịch giảng dạy và lịch thi của các lớp bạn được phân công',
      weekTab: 'Lịch giảng dạy', examTab: 'Lịch thi', monthTitle: 'Lịch giảng dạy theo tháng',
      monthSub: 'Buổi giảng dạy hằng tuần và lịch thi của các lớp bạn phụ trách trên cùng một lịch',
      legendClass: 'Lịch giảng dạy', unit: 'buổi dạy', unitMonth: 'buổi giảng dạy',
      addClass: 'Thêm buổi dạy', addExam: 'Thêm lịch thi', editClass: 'Sửa buổi dạy', delClass: 'Xóa buổi dạy này?',
      joinClass: 'Vào dạy trực tuyến', noClassWeek: 'Tuần này bạn không có buổi dạy.',
      examNoItems: 'Chưa có lịch thi nào. Nhấn "Thêm lịch thi" để bắt đầu.', examBadge: 'Coi thi', examPerson: 'Giám thị',
      examRoom: 'Phòng thi', monthMore: 'Xem theo tuần / quản lý lịch giảng dạy',
      empty: 'Không có buổi dạy hay lịch thi.', notifExam: 'Lịch thi',
    }
  }
  if (MANAGER.includes(role)) {
    return {
      nav: 'Xếp lịch học & thi', navMonth: 'Lịch theo tháng',
      title: 'Xếp lịch học & Lịch thi', subtitle: 'Tạo và quản lý thời khóa biểu, lịch thi cho các lớp',
      weekTab: 'Thời khóa biểu', examTab: 'Lịch thi', monthTitle: 'Thời khóa biểu theo tháng',
      monthSub: 'Lịch học hằng tuần và lịch thi trong tháng trên cùng một lịch',
      legendClass: 'Lịch học', unit: 'tiết học', unitMonth: 'buổi học',
      addClass: 'Thêm tiết học', addExam: 'Thêm lịch thi', editClass: 'Sửa tiết học', delClass: 'Xóa tiết học này?',
      joinClass: 'Mở lớp trực tuyến', noClassWeek: 'Tuần này không có tiết học.',
      examNoItems: 'Chưa có lịch thi nào. Nhấn "Thêm lịch thi" để bắt đầu.', examBadge: 'Thi', examPerson: 'Giám thị',
      examRoom: 'Phòng thi', monthMore: 'Xem theo tuần / quản lý lịch',
      empty: 'Không có lịch học hay lịch thi.', notifExam: 'Lịch thi',
    }
  }
  return {
    nav: 'Lịch học & Lịch thi', navMonth: 'Lịch học theo tháng',
    title: 'Lịch học & Lịch thi', subtitle: 'Lịch học và lịch thi của bạn',
    weekTab: 'Lịch học', examTab: 'Lịch thi', monthTitle: 'Lịch học theo tháng',
    monthSub: 'Lịch học hằng tuần và lịch thi của bạn trong tháng trên cùng một lịch',
    legendClass: 'Lịch học', unit: 'tiết học', unitMonth: 'buổi học',
    addClass: '', addExam: '', editClass: '', delClass: '',
    joinClass: 'Vào lớp học trực tuyến', noClassWeek: 'Tuần này bạn không có tiết học.',
    examNoItems: 'Chưa có lịch thi.', examBadge: 'Thi', examPerson: 'Giám thị',
    examRoom: 'Vào phòng thi', monthMore: 'Xem theo tuần',
    empty: 'Không có lịch học hay lịch thi.', notifExam: 'Lịch thi',
  }
}

// Nhãn mục điều hướng theo vai trò (mục khác giữ nhãn mặc định trong NAV_ITEMS)
export function navLabel(item, role) {
  if (item.key === 'schedule') return scheduleText(role).nav
  if (item.key === 'calendar') return scheduleText(role).navMonth
  return item.label
}
