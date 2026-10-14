// app.js – StudyTask v3.0 – Root component
import { SAMPLE_SUBJECTS, SAMPLE_DEADLINES, SAMPLE_HOMEWORKS, SAMPLE_QUIZZES, SAMPLE_MATERIALS,
         SAMPLE_SCHEDULE, SAMPLE_EXAMS, SAMPLE_NEWS, SAMPLE_FORMS,
         DEFAULT_PROFILE, DEFAULT_TEACHER_PROFILE, DEFAULT_ADMIN_PROFILE,
         DEFAULT_LIBRARY, DEFAULT_SETTINGS, DEMO_ACCOUNTS, SAMPLE_ACTIVITY } from './utils/constants.js'
import { load, save, applySettings, getDaysUntil } from './utils/helpers.js'
import { initFirebase, isFirebaseReady, onAuth,
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
    const defaultProfile = {
      ...DEFAULT_PROFILE,
      name:  fbUser?.name  || load('st_profile', DEFAULT_PROFILE).name,
      email: fbUser?.email || load('st_profile', DEFAULT_PROFILE).email,
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
      homeworkSubs: ps.homeworkSubs ?? load('st_homeworkSubs', {}),
      submissions:  ps.submissions  ?? load('st_submissions', []),
      profile:      ps.profile      ?? load('st_profile',     defaultProfile),
      library:      ps.library      ?? load('st_library',     DEFAULT_LIBRARY),
      contacts:     ps.contacts     ?? load('st_contacts',    []),
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
        else         { setUser(null);  dataReady.current = true }
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

  const mySubjects = useMemo(() => {
    if (!user || user.role === 'admin' || user.subjectIds === null || user.subjectIds === undefined)
      return subjects
    return subjects.filter(s => (user.subjectIds || []).includes(s.id))
  }, [subjects, user])

  const myDeadlines = useMemo(() => {
    if (!user || user.role === 'admin' || !user.subjectIds) return deadlines
    const ids = new Set(user.subjectIds)
    return deadlines.filter(d => ids.has(d.subjectId))
  }, [deadlines, user])

  // Ghép định nghĩa bài tập (chung) với trạng thái nộp bài của user hiện tại
  const homeworksView = useMemo(() =>
    homeworks.map(hw => ({
      ...hw,
      status: homeworkSubs[hw.id]?.status ?? 'pending',
      submission: homeworkSubs[hw.id] || null,
    })), [homeworks, homeworkSubs])

  const myHomeworks = useMemo(() => {
    if (!user || user.role === 'admin' || !user.subjectIds) return homeworksView
    const ids = new Set(user.subjectIds)
    return homeworksView.filter(h => ids.has(h.subjectId))
  }, [homeworksView, user])

  const myQuizzes = useMemo(() => {
    if (!user || user.role === 'admin' || !user.subjectIds) return quizzes
    const ids = new Set(user.subjectIds)
    return quizzes.filter(q => ids.has(q.subjectId))
  }, [quizzes, user])

  const myMaterials = useMemo(() => {
    if (!user || user.role === 'admin' || !user.subjectIds) return materials
    const ids = new Set(user.subjectIds)
    return materials.filter(m => ids.has(m.subjectId))
  }, [materials, user])

  const mySchedule = useMemo(() => {
    if (!user || user.role === 'admin' || !user.subjectIds) return schedule
    const ids = new Set(user.subjectIds)
    return schedule.filter(c => ids.has(c.subjectId))
  }, [schedule, user])

  const myExams = useMemo(() => {
    if (!user || user.role === 'admin' || !user.subjectIds) return exams
    const ids = new Set(user.subjectIds)
    return exams.filter(e => ids.has(e.subjectId))
  }, [exams, user])

  // ── Thông báo: deadline sắp tới/quá hạn, lịch thi, thông báo giáo viên ──
  const notifications = useMemo(() => {
    if (!user) return []
    const subName = (id) => (subjects.find(s => s.id === id) || {}).name || 'Môn học'
    const list = []
    myDeadlines.forEach(d => {
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
    myExams.forEach(e => {
      const days = getDaysUntil(e.date)
      if (days < 0 || days > 14) return
      list.push({
        id: 'ex-' + e.id, page: 'schedule', icon: 'clipboard-check-fill', color: '#e67e22',
        title: 'Lịch thi: ' + subName(e.subjectId),
        desc: `${days === 0 ? 'Thi hôm nay' : days === 1 ? 'Thi ngày mai' : `Còn ${days} ngày`}${e.start ? ' · ' + e.start : ''}${e.room ? ' · ' + e.room : ''}`,
        sort: days + 0.5,
      })
    })
    mySubjects.forEach(s => {
      if (s.note && s.note.trim())
        list.push({ id: 'note-' + s.id + '-' + s.note.trim().length, page: 'subjects', icon: 'megaphone-fill', color: '#1cc88a', title: 'Thông báo: ' + s.name, desc: s.note, sort: -1 })
    })
    return list.sort((a, b) => a.sort - b.sort)
  }, [user, myDeadlines, myExams, mySubjects, subjects])

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

  const handleProfileSave = useCallback(async (newProfile) => {
    setProfile(newProfile)
    save('st_profile', newProfile)
    if (uid) {
      await saveUserKey(uid, 'profile', newProfile)
      if (newProfile.name) setUserProfile(uid, { name: newProfile.name }).catch(() => {})
    }
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
  const canWriteShared = user?.role === 'admin' || user?.role === 'teacher'

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
        page === 'directory'  && (user.role === 'admin' || user.role === 'teacher') && h(Directory, { allUsers, subjects, role: user.role, user }),
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
