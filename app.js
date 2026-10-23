// app.js – StudyTask v3.0 – Root component
import { SAMPLE_SUBJECTS, SAMPLE_DEADLINES, SAMPLE_HOMEWORKS, SAMPLE_QUIZZES, SAMPLE_MATERIALS,
         SAMPLE_SCHEDULE, SAMPLE_EXAMS, SAMPLE_NEWS, SAMPLE_FORMS,
         DEFAULT_PROFILE, DEFAULT_TEACHER_PROFILE, DEFAULT_ADMIN_PROFILE, BLANK_STUDENT_PROFILE,
         DEFAULT_LIBRARY, DEFAULT_SETTINGS, DEMO_ACCOUNTS, SAMPLE_ACTIVITY, STAFF_ROLES } from './utils/constants.js'
import { load, save, applySettings, getDaysUntil } from './utils/helpers.js'
import { getDocument } from './utils/store.js'
import { DEFAULT_FINANCE_CONFIG, tuitionSummary, tuitionReminder } from './utils/tuition.js'
import { initFirebase, isFirebaseReady, onAuth, fbLogout,
         loadSharedData, saveSharedKey,
         loadUserData, saveUserKey,
         getUserProfile, setUserProfile, getAllUsers,
         logActivity, loadAllActivities } from './utils/firebase.js'

import Login          from './components/Login.js'
import Navbar         from './components/Navbar.js'
import Sidebar        from './components/Sidebar.js'
import SettingsDrawer from './components/SettingsDrawer.js'

import Dashboard  from './pages/Dashboard.js'
import Subjects   from './pages/Subjects.js'
import Deadlines  from './pages/Deadlines.js'
import Statistics from './pages/Statistics.js'
import Library    from './pages/Library.js'
import Contact    from './pages/Contact.js'
import Profile    from './pages/Profile.js'
import Admin      from './pages/Admin.js'
import Quiz       from './pages/Quiz.js'
import Tools      from './pages/Tools.js'
import Reports    from './pages/Reports.js'
import Schedule   from './pages/Schedule.js'
import News       from './pages/News.js'
import Forms      from './pages/Forms.js'
import Directory  from './pages/Directory.js'
import MonthCalendar from './pages/MonthCalendar.js'
import Tuition       from './pages/Tuition.js'
import GradingPolicy from './pages/GradingPolicy.js'
import Curriculum    from './pages/Curriculum.js'
import Graduation    from './pages/Graduation.js'
import Theses        from './pages/Theses.js'

const { useState, useEffect, useRef, useCallback, useMemo, createElement: h } = window.React

const FIREBASE_OK = initFirebase()

function App() {
  const [user,         setUser]         = useState(null)
  const [allUsers,     setAllUsers]     = useState([])   // danh sách tất cả user (cho subjectTeacherMap)
  const [authChecked,  setAuthChecked]  = useState(!FIREBASE_OK)
  const [page,         setPage]         = useState('dashboard')
  const [subjects,     setSubjects]     = useState(SAMPLE_SUBJECTS)
  const [deadlines,    setDeadlines]    = useState(SAMPLE_DEADLINES)
  const [homeworks,    setHomeworks]    = useState(SAMPLE_HOMEWORKS)   // ĐỊNH NGHĨA bài tập (dùng chung)
  const [homeworkSubs, setHomeworkSubs] = useState({})                 // trạng thái/nộp bài theo từng SV (cá nhân)
  const [quizzes,      setQuizzes]      = useState(SAMPLE_QUIZZES)
  const [materials,    setMaterials]    = useState(SAMPLE_MATERIALS) // tài liệu học phần
  const [schedule,     setSchedule]     = useState(SAMPLE_SCHEDULE)  // thời khóa biểu (dùng chung)
  const [exams,        setExams]        = useState(SAMPLE_EXAMS)     // lịch thi (dùng chung)
  const [news,         setNews]         = useState(SAMPLE_NEWS)      // tin tức (dùng chung)
  const [forms,        setForms]        = useState(SAMPLE_FORMS)     // biểu mẫu (dùng chung)
  const [submissions,  setSubmissions]  = useState([])          // kết quả làm bài của student
  const [profile,      setProfile]      = useState(DEFAULT_PROFILE)
  const [library,      setLibrary]      = useState(DEFAULT_LIBRARY)
  const [contacts,     setContacts]     = useState([])
  const [settings,     setSettings]     = useState(() => load('st_settings', DEFAULT_SETTINGS))
  const [showSettings, setShowSettings] = useState(false)
  const [sidebarOpen,  setSidebarOpen]  = useState(false)   // mở sidebar trên mobile
  const [notifSeen,    setNotifSeen]    = useState(() => load('st_notif_seen', []))
  const [dlFilter,     setDlFilter]     = useState({})

  // Flag ngăn useEffect ghi Firestore trước khi load xong
  const dataReady = useRef(false)

  // ── Tải dữ liệu (Firestore → localStorage → mặc định) ─────────
  // sharedData/global : subjects, deadlines, quizzes, materials  (dùng chung)
  // userData/{uid}    : profile, homeworks, submissions, library  (cá nhân)
  const loadAppData = useCallback(async (uid, fbUser) => {
    dataReady.current = false

    let shared = null
    let personal = null
    if (isFirebaseReady()) {
      try { shared   = await loadSharedData()     } catch (e) { console.warn('[Firebase] loadSharedData:', e.message) }
      if (uid) {
        try { personal = await loadUserData(uid)  } catch (e) { console.warn('[Firebase] loadUserData:', e.message) }
      }
    }

    const ss = shared   || {}
    const ps = personal || {}

    // Dữ liệu cá nhân trong localStorage chỉ dùng lại khi nó thuộc ĐÚNG tài khoản đang đăng nhập.
    // (Lỗi cũ: tài khoản B đăng nhập sau tài khoản A trên cùng máy sẽ nhận hồ sơ của A
    //  từ st_profile và bản đó còn bị ghi ngược lên Firestore của B.)
    const ownerKey  = uid || fbUser?.email || 'guest'
    const sameOwner = load('st_owner', null) === ownerKey
    const loadMine  = (key, fallback) => sameOwner ? load(key, fallback) : fallback

    // Hồ sơ mặc định theo vai trò; tài khoản thật (có uid) không nhận dữ liệu mẫu của sinh viên demo
    const roleDefault = fbUser?.role === 'teacher' ? DEFAULT_TEACHER_PROFILE
                      : ['admin', 'training', 'finance'].includes(fbUser?.role) ? DEFAULT_ADMIN_PROFILE
                      : uid ? BLANK_STUDENT_PROFILE : DEFAULT_PROFILE
    const defaultProfile = {
      ...roleDefault,
      name:  fbUser?.name  || roleDefault.name,
      email: fbUser?.email || roleDefault.email,
    }

    // ── Dữ liệu chung (tất cả user đọc chung) ──
    const dShared = {
      subjects:  ss.subjects  ?? load('st_subjects',  SAMPLE_SUBJECTS),
      deadlines: ss.deadlines ?? load('st_deadlines', SAMPLE_DEADLINES),
      quizzes:   ss.quizzes   ?? load('st_quizzes',   SAMPLE_QUIZZES),
      materials: ss.materials ?? load('st_materials', SAMPLE_MATERIALS),
      homeworks: ss.homeworks ?? load('st_homeworks', SAMPLE_HOMEWORKS),
      schedule:  ss.schedule  ?? load('st_schedule',  SAMPLE_SCHEDULE),
      exams:     ss.exams     ?? load('st_exams',     SAMPLE_EXAMS),
      news:      ss.news      ?? load('st_news',      SAMPLE_NEWS),
      forms:     ss.forms     ?? load('st_forms',     SAMPLE_FORMS),
    }

    // ── Dữ liệu cá nhân (mỗi user một bản) ──
    const dPersonal = {
      homeworkSubs: ps.homeworkSubs ?? loadMine('st_homeworkSubs', {}),
      submissions:  ps.submissions  ?? loadMine('st_submissions', []),
      profile:      ps.profile      ?? loadMine('st_profile',     defaultProfile),
      library:      ps.library      ?? loadMine('st_library',     DEFAULT_LIBRARY),
      contacts:     ps.contacts     ?? loadMine('st_contacts',    []),
    }

    setSubjects    (dShared.subjects)
    setDeadlines   (dShared.deadlines)
    setQuizzes     (dShared.quizzes)
    setMaterials   (dShared.materials)
    setSchedule    (dShared.schedule)
    setExams       (dShared.exams)
    setNews        (dShared.news)
    setForms       (dShared.forms)
    setHomeworks   (dShared.homeworks)
    setHomeworkSubs(dPersonal.homeworkSubs)
    setSubmissions (dPersonal.submissions)
    setProfile     (dPersonal.profile)
    setLibrary     (dPersonal.library)
    setContacts    (dPersonal.contacts)

    // Đồng bộ localStorage
    Object.entries(dShared).forEach(([k, v]) => save(`st_${k}`, v))
    Object.entries(dPersonal).forEach(([k, v]) => save(`st_${k}`, v))
    save('st_owner', ownerKey)

    dataReady.current = true

    if (isFirebaseReady()) {
      // Sync shared data lên Firestore nếu thiếu key
      const missingShared = shared ? Object.keys(dShared).filter(k => shared[k] === undefined) : Object.keys(dShared)
      if (missingShared.length > 0) {
        try {
          await Promise.all(missingShared.map(k => saveSharedKey(k, dShared[k])))
          console.info('[Firebase] Sync sharedData ✅:', missingShared.join(', '))
        } catch (e) { console.warn('[Firebase] Sync sharedData lỗi:', e.message) }
      }
      // Sync personal data nếu thiếu key
      if (uid) {
        const missingPersonal = personal ? Object.keys(dPersonal).filter(k => personal[k] === undefined) : Object.keys(dPersonal)
        if (missingPersonal.length > 0) {
          try {
            await Promise.all(missingPersonal.map(k => saveUserKey(uid, k, dPersonal[k])))
            console.info('[Firebase] Sync userData ✅:', missingPersonal.join(', '))
          } catch (e) { console.warn('[Firebase] Sync userData lỗi:', e.message) }
        }
      }
    }
  }, [])

  // ── Persistent login via Firebase onAuthStateChanged ──────────
  useEffect(() => {
    if (!FIREBASE_OK) { setAuthChecked(true); return }
    const unsub = onAuth(async (fbUser) => {
      if (fbUser) {
        const userDoc = await getUserProfile(fbUser.uid).catch(() => null)
        const u = {
          uid:        fbUser.uid,
          email:      fbUser.email,
          name:       userDoc?.name  || fbUser.email,
          role:       userDoc?.role  || 'student',
          subjectIds: userDoc?.subjectIds !== undefined ? userDoc.subjectIds : null,
        }
        setUser(u)
        await loadAppData(fbUser.uid, u)
        // Cache allUsers 5 phút để tránh đọc Firestore mỗi lần refresh
        const USERS_TTL     = 5 * 60 * 1000
        const cachedUsers   = load('st_allUsers_cache', null)
        const cachedUsersTs = load('st_allUsers_cache_ts', 0)
        if (cachedUsers && Date.now() - cachedUsersTs < USERS_TTL) {
          setAllUsers(cachedUsers)
        } else {
          const users = await getAllUsers()
          setAllUsers(users)
          save('st_allUsers_cache', users)
          save('st_allUsers_cache_ts', Date.now())
        }
      } else {
        const cached = load('st_user', null)
        if (cached) { setUser(cached); await loadAppData(null, cached) }
        // Chưa đăng nhập: giữ dataReady = false để các useEffect không ghi dữ liệu mẫu lên Firestore
        // ngay lúc vừa đăng nhập (trước khi loadAppData tải xong dữ liệu thật của tài khoản).
        else         { setUser(null);  dataReady.current = false }
        // Demo mode: dùng DEMO_ACCOUNTS làm danh sách users
        setAllUsers(DEMO_ACCOUNTS.map(a => ({ ...a, uid: a.id })))
      }
      setAuthChecked(true)
    })
    return unsub
  }, [loadAppData])

  // ── Login / Logout ────────────────────────────────────────────
  const handleLogin = async (u) => {
    setUser(u)
    save('st_user', u)
    if (!FIREBASE_OK) {
      await loadAppData(null, u)
      setAllUsers(DEMO_ACCOUNTS.map(a => ({ ...a, uid: a.id })))
    }
  }

  const handleLogout = () => {
    dataReady.current = false
    // Đăng xuất cả phiên Firebase (trước đây chỉ xóa state → tải lại trang là tự đăng nhập lại tài khoản cũ)
    if (isFirebaseReady()) fbLogout().catch(e => console.warn('[Firebase] signOut:', e.message))
    setUser(null)
    save('st_user', null)
    setSubjects(SAMPLE_SUBJECTS);   setDeadlines(SAMPLE_DEADLINES)
    setHomeworks(SAMPLE_HOMEWORKS); setQuizzes(SAMPLE_QUIZZES)
    setHomeworkSubs({})
    setMaterials(SAMPLE_MATERIALS); setSubmissions([])
    setSchedule(SAMPLE_SCHEDULE);   setExams(SAMPLE_EXAMS)
    setNews(SAMPLE_NEWS);           setForms(SAMPLE_FORMS)
    setProfile(DEFAULT_PROFILE);    setLibrary(DEFAULT_LIBRARY)
    setContacts([])
    setPage('dashboard')
  }

  // ── Lọc dữ liệu theo môn học được phân quyền ─────────────────
  const uid = user?.uid || null
  const seesAll = !!user && (user.role === 'admin' || STAFF_ROLES.includes(user.role))

  const mySubjects = useMemo(() => {
    if (!user || seesAll || user.subjectIds === null || user.subjectIds === undefined)
      return subjects
    return subjects.filter(s => (user.subjectIds || []).includes(s.id))
  }, [subjects, user, seesAll])

  const myDeadlines = useMemo(() => {
    if (!user || seesAll || !user.subjectIds) return deadlines
    const ids = new Set(user.subjectIds)
    return deadlines.filter(d => ids.has(d.subjectId))
  }, [deadlines, user, seesAll])

  // Ghép định nghĩa bài tập (chung) với trạng thái nộp bài của user hiện tại
  const homeworksView = useMemo(() =>
    homeworks.map(hw => ({
      ...hw,
      status: homeworkSubs[hw.id]?.status ?? 'pending',
      submission: homeworkSubs[hw.id] || null,
    })), [homeworks, homeworkSubs])

  const myHomeworks = useMemo(() => {
    if (!user || seesAll || !user.subjectIds) return homeworksView
    const ids = new Set(user.subjectIds)
    return homeworksView.filter(h => ids.has(h.subjectId))
  }, [homeworksView, user, seesAll])

  const myQuizzes = useMemo(() => {
    if (!user || seesAll || !user.subjectIds) return quizzes
    const ids = new Set(user.subjectIds)
    return quizzes.filter(q => ids.has(q.subjectId))
  }, [quizzes, user, seesAll])

  const myMaterials = useMemo(() => {
    if (!user || seesAll || !user.subjectIds) return materials
    const ids = new Set(user.subjectIds)
    return materials.filter(m => ids.has(m.subjectId))
  }, [materials, user, seesAll])

  const mySchedule = useMemo(() => {
    if (!user || seesAll || !user.subjectIds) return schedule
    const ids = new Set(user.subjectIds)
    return schedule.filter(c => ids.has(c.subjectId))
  }, [schedule, user, seesAll])

  const myExams = useMemo(() => {
    if (!user || seesAll || !user.subjectIds) return exams
    const ids = new Set(user.subjectIds)
    return exams.filter(e => ids.has(e.subjectId))
  }, [exams, user, seesAll])

  // ── Học phí của sinh viên (để nhắc công nợ đến hạn trên chuông thông báo) ──
  const [tuitionInfo, setTuitionInfo] = useState(null)   // { cfg, acc }
  useEffect(() => {
    if (!user || user.role !== 'student') { setTuitionInfo(null); return }
    let alive = true
    ;(async () => {
      try {
        const cfg = { ...DEFAULT_FINANCE_CONFIG, ...((await getDocument('financeConfig', 'current')) || {}) }
        const acc = (await getDocument('tuition', user.uid || user.id)) || {}
        if (alive) setTuitionInfo({ cfg, acc })
      } catch (e) { console.warn('[Học phí]', e.message) }
    })()
    return () => { alive = false }
  }, [user?.uid, user?.role])

  // ── Thông báo: deadline sắp tới/quá hạn, lịch thi, thông báo giáo viên, học phí ──
  const notifications = useMemo(() => {
    if (!user) return []
    const subName = (id) => (subjects.find(s => s.id === id) || {}).name || 'Môn học'
    const list = []
    const academic = user.role !== 'finance'   // Phòng Tài chính không cần nhắc deadline / lịch thi
    if (academic) myDeadlines.forEach(d => {
      if (d.status === 'completed') return
      const days = getDaysUntil(d.dueDate)
      if (days > 7) return
      list.push({
        id: 'dl-' + d.id, page: 'deadlines',
        icon: days < 0 ? 'exclamation-triangle-fill' : 'alarm-fill',
        color: days < 0 ? '#e74a3b' : days <= 2 ? '#f6c23e' : '#4e73df',
        title: d.title,
        desc: `${subName(d.subjectId)} · ${days < 0 ? `Quá hạn ${-days} ngày` : days === 0 ? 'Đến hạn hôm nay' : days === 1 ? 'Hạn ngày mai' : `Còn ${days} ngày`}`,
        sort: days,
      })
    })
    if (academic) myExams.forEach(e => {
      const days = getDaysUntil(e.date)
      if (days < 0 || days > 14) return
      list.push({
        id: 'ex-' + e.id, page: 'schedule', icon: 'clipboard-check-fill', color: '#e67e22',
        title: 'Lịch thi: ' + subName(e.subjectId),
        desc: `${days === 0 ? 'Thi hôm nay' : days === 1 ? 'Thi ngày mai' : `Còn ${days} ngày`}${e.start ? ' · ' + e.start : ''}${e.room ? ' · ' + e.room : ''}`,
        sort: days + 0.5,
      })
    })
    if (academic) mySubjects.forEach(s => {
      if (s.note && s.note.trim())
        list.push({ id: 'note-' + s.id + '-' + s.note.trim().length, page: 'subjects', icon: 'megaphone-fill', color: '#1cc88a', title: 'Thông báo: ' + s.name, desc: s.note, sort: -1 })
    })
    if (tuitionInfo && user.role === 'student') {
      const sum = tuitionSummary(user, subjects, tuitionInfo.cfg, tuitionInfo.acc)
      const rem = tuitionReminder(sum, tuitionInfo.cfg)
      if (rem) list.push({ id: `fee-${tuitionInfo.cfg.dueDate}-${rem.level}-${sum.debt}`, page: 'tuition', icon: 'cash-coin',
        color: rem.level === 'overdue' ? '#e74a3b' : '#e67e22', title: 'Học phí ' + (tuitionInfo.cfg.semester || ''), desc: rem.text, sort: -2 })
      ;(tuitionInfo.acc.notices || []).slice(-3).forEach((n, i) => list.push({ id: `fee-notice-${n.at}-${i}-${(n.message || '').length}`, page: 'tuition',
        icon: 'envelope-paper-fill', color: '#e67e22', title: 'Phòng Tài chính thông báo', desc: n.message, sort: -1.5 }))
    }
    return list.sort((a, b) => a.sort - b.sort)
  }, [user, myDeadlines, myExams, mySubjects, subjects, tuitionInfo])

  const unreadNotif = notifications.filter(n => !notifSeen.includes(n.id)).length
  const markNotifSeen = useCallback(() => {
    setNotifSeen(prev => {
      const ids = Array.from(new Set([...prev.filter(id => notifications.some(n => n.id === id)), ...notifications.map(n => n.id)]))
      save('st_notif_seen', ids); return ids
    })
  }, [notifications])

  // Map: subjectId → [{ uid, name }] – giáo viên được phân công dạy môn đó
  const subjectTeacherMap = useMemo(() => {
    const map = {}
    allUsers
      .filter(u => u.role === 'teacher' && Array.isArray(u.subjectIds))
      .forEach(u => {
        ;(u.subjectIds || []).forEach(sid => {
          if (!map[sid]) map[sid] = []
          if (!map[sid].find(t => t.uid === u.uid)) map[sid].push({ uid: u.uid, name: u.name || u.email })
        })
      })
    return map
  }, [allUsers])

  // Admin: callback sau khi gán môn xong (Admin.js đã tự ghi Firestore)
// Dùng để future-proof nếu cần sync global state
  const handleUpdateUserSubjects = useCallback((targetUid, newSubjectIds) => {}, [])

  // ── Profile save: trực tiếp Firebase, không qua useEffect ─────

  // Ghi lên Firestore TRƯỚC, thành công mới cập nhật state. Firestore Web SDK không báo lỗi khi mất mạng
  // mà giữ Promise chờ mãi → đặt thời hạn để giao diện không bị treo ở "Đang lưu…".
  const SAVE_TIMEOUT_MS = 10000
  const withTimeout = (p) => Promise.race([p, new Promise((_, rej) =>
    setTimeout(() => rej(new Error('Máy chủ chưa phản hồi. Kiểm tra kết nối mạng rồi lưu lại.')), SAVE_TIMEOUT_MS))])

  const handleProfileSave = useCallback(async (newProfile) => {
    const clean = { ...newProfile, name: (newProfile.name || '').trim() }
    if (uid) {
      await withTimeout(saveUserKey(uid, 'profile', clean))
      // Đồng bộ tên + số điện thoại sang user/{uid} (Admin, Danh bạ đọc từ đây).
      // Rules chỉ cho chủ tài khoản sửa 2 trường này (V2).
      try {
        await withTimeout(setUserProfile(uid, { name: clean.name, phone: clean.phone || '' }))
      } catch (e) {
        setProfile(clean); save('st_profile', clean)
        throw new Error('Đã lưu hồ sơ nhưng chưa cập nhật được tên/số điện thoại trong danh bạ: ' + e.message)
      }
      setUser(u => u ? { ...u, name: clean.name || u.name } : u)
      save('st_allUsers_cache_ts', 0)   // buộc tải lại danh sách người dùng ở lần sau
    }
    setProfile(clean)
    save('st_profile', clean)
  }, [uid])

  // ── Ghi nhật ký hoạt động (chỉ sinh viên) cho trang Quản lý lớp học ──
  const trackActivity = useCallback((event) => {
    if (!user || user.role !== 'student') return
    const ev = { ...event, at: new Date().toISOString().split('T')[0] }
    if (uid && isFirebaseReady()) {
      logActivity(uid, { name: user.name, email: user.email }, ev).catch(e => console.warn('[Firebase] logActivity:', e.message))
    } else {
      // Demo: lưu localStorage
      const all = load('st_activities', [])
      let rec = all.find(a => a.uid === user.uid)
      if (!rec) { rec = { uid: user.uid, name: user.name, email: user.email, subjectIds: user.subjectIds || [], events: [] }; all.push(rec) }
      rec.events.push(ev)
      save('st_activities', all)
    }
  }, [user, uid])

  // ── Tải toàn bộ nhật ký hoạt động (admin/giáo viên) ──
  const fetchActivities = useCallback(async () => {
    if (isFirebaseReady()) return await loadAllActivities()
    // Demo: gộp dữ liệu mẫu + nhật ký đã ghi ở localStorage
    const map = new Map()
    SAMPLE_ACTIVITY.forEach(a => map.set(a.uid, { ...a, events: [...a.events] }))
    load('st_activities', []).forEach(a => {
      if (map.has(a.uid)) { const m = map.get(a.uid); m.events = [...m.events, ...a.events] }
      else map.set(a.uid, a)
    })
    return Array.from(map.values())
  }, [])

  // ── Sinh viên nộp bài / đánh dấu hoàn thành bài tập ──
  const handleHomeworkSubmit = useCallback((hw, data = {}) => {
    setHomeworkSubs(prev => ({
      ...prev,
      [hw.id]: {
        status: data.status || 'completed',
        url:  data.url  || '',
        note: data.note || '',
        at:   new Date().toISOString().split('T')[0],
      },
    }))
    if (user?.role === 'student') trackActivity({ type: 'homework', subjectId: hw.subjectId, refId: hw.id, refTitle: hw.title, url: data.url || '', note: data.note || '' })
  }, [user, trackActivity])

  // Hủy nộp / bỏ đánh dấu hoàn thành
  const handleHomeworkUndo = useCallback((hwId) => {
    setHomeworkSubs(prev => { const ng = { ...prev }; delete ng[hwId]; return ng })
  }, [])

  // ── Sync localStorage + Firestore (chỉ sau khi data load xong) ─
  // Dữ liệu CHUNG → sharedData/global (chỉ admin/teacher ghi, student chỉ đọc)
  const canWriteShared = user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'training'

  useEffect(() => {
    if (!dataReady.current) return
    save('st_subjects', subjects)
    if (canWriteShared) saveSharedKey('subjects', subjects)
  }, [subjects, canWriteShared])

  useEffect(() => {
    if (!dataReady.current) return
    save('st_deadlines', deadlines)
    if (canWriteShared) saveSharedKey('deadlines', deadlines)
  }, [deadlines, canWriteShared])

  useEffect(() => {
    if (!dataReady.current) return
    save('st_quizzes', quizzes)
    if (canWriteShared) saveSharedKey('quizzes', quizzes)
  }, [quizzes, canWriteShared])

  useEffect(() => {
    if (!dataReady.current) return
    save('st_materials', materials)
    if (canWriteShared) saveSharedKey('materials', materials)
  }, [materials, canWriteShared])

  useEffect(() => {
    if (!dataReady.current) return
    save('st_homeworks', homeworks)
    if (canWriteShared) saveSharedKey('homeworks', homeworks)
  }, [homeworks, canWriteShared])

  useEffect(() => {
    if (!dataReady.current) return
    save('st_schedule', schedule)
    if (canWriteShared) saveSharedKey('schedule', schedule)
  }, [schedule, canWriteShared])

  useEffect(() => {
    if (!dataReady.current) return
    save('st_exams', exams)
    if (canWriteShared) saveSharedKey('exams', exams)
  }, [exams, canWriteShared])

  useEffect(() => {
    if (!dataReady.current) return
    save('st_news', news)
    if (canWriteShared) saveSharedKey('news', news)
  }, [news, canWriteShared])

  useEffect(() => {
    if (!dataReady.current) return
    save('st_forms', forms)
    if (canWriteShared) saveSharedKey('forms', forms)
  }, [forms, canWriteShared])

  // Dữ liệu CÁ NHÂN → userData/{uid}
  useEffect(() => {
    if (!dataReady.current) return
    save('st_homeworkSubs', homeworkSubs)
    if (uid) saveUserKey(uid, 'homeworkSubs', homeworkSubs)
  }, [homeworkSubs, uid])

  useEffect(() => {
    if (!dataReady.current) return
    save('st_submissions', submissions)
    if (uid) saveUserKey(uid, 'submissions', submissions)
  }, [submissions, uid])

  useEffect(() => {
    if (!dataReady.current) return
    save('st_library', library)
    if (uid) saveUserKey(uid, 'library', library)
  }, [library, uid])

  useEffect(() => {
    if (!dataReady.current) return
    save('st_contacts', contacts)
    if (uid) saveUserKey(uid, 'contacts', contacts)
  }, [contacts, uid])

  useEffect(() => { save('st_settings', settings); applySettings(settings) }, [settings])
  useEffect(() => { applySettings(load('st_settings', DEFAULT_SETTINGS)) }, [])

  const navigate = (pg, filter = {}) => {
    setPage(pg)
    if (pg === 'deadlines') setDlFilter({ ...filter, _ts: Date.now() })
  }

  if (!authChecked) {
    return h('div', { className: 'login-page' },
      h('div', { className: 'text-center' },
        h('div', { className: 'spinner-border text-primary', style: { width: '2.5rem', height: '2.5rem' } }),
        h('p', { className: 'mt-3 text-muted' }, 'Đang kiểm tra phiên đăng nhập…')
      )
    )
  }

  if (!user) return h(Login, { onLogin: handleLogin })

  return h(window.React.Fragment, null,
    h(Navbar, { user, profile, currentPage: page, onNavigate: navigate, onLogout: handleLogout, onOpenSettings: () => setShowSettings(true), onToggleSidebar: () => setSidebarOpen(v => !v), notifications, unreadNotif, onOpenNotifications: markNotifSeen }),
    h('div', { className: 'app-layout' },
      h(Sidebar, { user, currentPage: page, onNavigate: navigate, open: sidebarOpen, onClose: () => setSidebarOpen(false) }),
      h('main', { className: 'app-main' },
        page === 'dashboard'  && h(Dashboard,  { subjects: mySubjects, deadlines: myDeadlines, homeworks: myHomeworks, onNavigate: navigate }),
        page === 'subjects'   && h(Subjects,   { subjects: mySubjects, setSubjects, deadlines: myDeadlines, homeworks: myHomeworks, setHomeworks, materials: myMaterials, setMaterials, role: user.role, subjectTeacherMap, user, quizzes: myQuizzes, submissions, setSubmissions, onNavigate: navigate, onActivity: trackActivity, onSubmitHomework: handleHomeworkSubmit, onUndoHomework: handleHomeworkUndo }),
        page === 'deadlines'  && h(Deadlines,  { subjects: mySubjects, deadlines: myDeadlines, setDeadlines, filterPreset: dlFilter, role: user.role }),
        page === 'statistics' && h(Statistics, { subjects: mySubjects, deadlines: myDeadlines, homeworks: myHomeworks }),
        page === 'profile'    && h(Profile,    { profile, setProfile, onSave: handleProfileSave, subjects: mySubjects, deadlines: myDeadlines, homeworks: myHomeworks, user }),
        page === 'library'    && h(Library,    { libraryLinks: library, setLibraryLinks: setLibrary, role: user.role }),
        page === 'contact'    && h(Contact,    { contacts, setContacts }),
        page === 'quiz'       && h(Quiz,       { quizzes: myQuizzes, setQuizzes, submissions, setSubmissions, subjects: mySubjects, user, role: user.role, onActivity: trackActivity }),
        page === 'schedule'   && h(Schedule,   { schedule: mySchedule, setSchedule, exams: myExams, setExams, subjects: mySubjects, subjectTeacherMap, role: user.role }),
        page === 'tools'      && h(Tools,      {}),
        page === 'news'       && h(News,       { news, setNews, role: user.role }),
        page === 'forms'      && h(Forms,      { forms, setForms, role: user.role }),
        page === 'calendar'   && h(MonthCalendar, { schedule: mySchedule, exams: myExams, subjects: mySubjects, onNavigate: navigate }),
        page === 'tuition'    && ['student', 'finance', 'admin'].includes(user.role) && h(Tuition, { user, allUsers, subjects }),
        page === 'grading'    && h(GradingPolicy, { user, subjects: mySubjects, quizzes: myQuizzes, homeworks }),
        page === 'curriculum' && ['training', 'admin'].includes(user.role) && h(Curriculum, { subjects, setSubjects, schedule, exams, deadlines }),
        page === 'graduation' && ['student', 'training', 'admin'].includes(user.role) && h(Graduation, { user, profile, subjects }),
        page === 'theses'     && h(Theses, { user }),
        page === 'directory'  && ['admin', 'teacher', 'training', 'finance'].includes(user.role) && h(Directory, { allUsers, subjects, role: user.role, user }),
        page === 'reports'    && (user.role === 'admin' || user.role === 'teacher') && h(Reports, { subjects: mySubjects, quizzes: myQuizzes, materials: myMaterials, homeworks, allUsers, user, fetchActivities }),
        page === 'admin'      && user.role === 'admin' && h(Admin, { subjects, deadlines, homeworks: homeworksView, onUpdateUserSubjects: handleUpdateUserSubjects, allUsers, quizzes, fetchActivities }),
      )
    ),
    showSettings && h(SettingsDrawer, { settings, onChange: (s) => setSettings(s), onClose: () => setShowSettings(false) }),
    !showSettings && h('button', { className: 'fab-settings', title: 'Tùy chỉnh giao diện', onClick: () => setShowSettings(true) },
      h('i', { className: 'bi bi-palette-fill' })
    )
  )
}

const root = window.ReactDOM.createRoot(document.getElementById('root'))
root.render(h(App, null))
