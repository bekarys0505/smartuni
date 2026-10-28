import { BrowserRouter, Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentSubjectsPage from './pages/StudentSubjectsPage';
import StudentSubjectPage from './pages/StudentSubjectPage';
import StudentTopicPage from './pages/StudentTopicPage';
import StudentAssignmentsPage from './pages/StudentAssignmentsPage';
import StudentTestsPage from './pages/StudentTestsPage';
import StudentTestTakingPage from './pages/StudentTestTakingPage';
import StudentTestResultPage from './pages/StudentTestResultPage';
import StudentProgressPage from './pages/StudentProgressPage';
import { StudentCalendarPage } from './pages/StudentCalendarPage';
import { StudentDiaryPage } from './pages/StudentDiaryPage';
import { StudentMaterialsPage } from './pages/StudentMaterialsPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import TeacherRequestsPage from './pages/TeacherRequestsPage';
import TeacherGroupsPage from './pages/TeacherGroupsPage';
import TeacherGroupDetailPage from './pages/TeacherGroupDetailPage';
import { TeacherSubjectsPage } from './pages/TeacherSubjectsPage';
import TeacherTopicsPage from './pages/TeacherTopicsPage';
import TeacherMaterialsPage from './pages/TeacherMaterialsPage';
import TeacherAssignmentsPage from './pages/TeacherAssignmentsPage';
import TeacherTestsPage from './pages/TeacherTestsPage';
import TeacherTestResultsPage from './pages/TeacherTestResultsPage';
import { TeacherJournalPage } from './pages/TeacherJournalPage';
import TeacherAttendancePage from './pages/TeacherAttendancePage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminSubjectsPage from './pages/AdminSubjectsPage';
import AdminGroupsPage from './pages/AdminGroupsPage';
import AdminAcademicPage from './pages/AdminAcademicPage';
import TeacherGradesPage from './pages/TeacherGradesPage';
import PlaceholderPage from './pages/PlaceholderPage';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

import './styles.css';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
        {/* Ашық басты бет */}
        <Route path="/" element={<HomePage />} />

        {/* Авторизация беттері (жүйеге кірген қолданушы өз кабинетіне бағытталады) */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />

        {/* =================================================================
            СТУДЕНТ КЕҢІСТІГІ (STUDENT CANONICAL ROUTES)
           ================================================================= */}
        {/* 1. Real Page: Dashboard */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* 2. Subjects */}
        <Route
          path="/student/subjects"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentSubjectsPage />
            </ProtectedRoute>
          }
        />

        {/* 3. Subjects - Dynamic detail */}
        <Route
          path="/student/subjects/:subjectId"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentSubjectPage />
            </ProtectedRoute>
          }
        />

        {/* 4. Topics - Dynamic detail */}
        <Route
          path="/student/topics/:topicId"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentTopicPage />
            </ProtectedRoute>
          }
        />

        {/* 5. Assignments */}
        <Route
          path="/student/assignments"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentAssignmentsPage />
            </ProtectedRoute>
          }
        />

        {/* 6. Labs */}
        <Route
          path="/student/labs"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AppShell userRole="STUDENT">
                <PlaceholderPage
                  title="Зертханалар"
                  subtitle="Практикалық және зертханалық жұмыстар кешені"
                  icon="layers"
                  breadcrumbs={[{ label: 'Студент' }, { label: 'Зертханалар' }]}
                  description="Зертханалық тапсырмалар нұсқаулықтары, есептер тапсыру және оқытушы тексерісі."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 7. Tests */}
        <Route
          path="/student/tests"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentTestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/tests/:testId/attempt/:attemptId"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentTestTakingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/tests/:testId/result/:attemptId"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentTestResultPage />
            </ProtectedRoute>
          }
        />

        {/* 8. Calendar */}
        <Route
          path="/student/calendar"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentCalendarPage />
            </ProtectedRoute>
          }
        />

        {/* 9. Diary */}
        <Route
          path="/student/diary"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDiaryPage />
            </ProtectedRoute>
          }
        />

        {/* 10. Progress */}
        <Route
          path="/student/progress"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentProgressPage />
            </ProtectedRoute>
          }
        />

        {/* 11. History */}
        <Route
          path="/student/history"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AppShell userRole="STUDENT">
                <PlaceholderPage
                  title="Оқу тарихы"
                  subtitle="Өткен семестрлердегі бағалар мен академиялық жазбалар"
                  icon="clock"
                  breadcrumbs={[{ label: 'Студент' }, { label: 'Оқу тарихы' }]}
                  description="Барлық оқылған курстардың мұрағаты, жиналған кредиттер және семестрлік қорытынды ведомостар."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 12. Materials */}
        <Route
          path="/student/materials"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentMaterialsPage />
            </ProtectedRoute>
          }
        />

        {/* 13. Notifications */}
        <Route
          path="/student/notifications"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AppShell userRole="STUDENT">
                <PlaceholderPage
                  title="Хабарламалар"
                  subtitle="Университеттік және топтық ресми хабарландырулар"
                  icon="bell"
                  breadcrumbs={[{ label: 'Студент' }, { label: 'Хабарламалар' }]}
                  description="Университет әкімшілігі мен оқытушылардан келген маңызды жаңалықтар мен ескертулер."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 14. Chat */}
        <Route
          path="/student/chat"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AppShell userRole="STUDENT">
                <PlaceholderPage
                  title="Чат"
                  subtitle="Оқытушылармен және топтастармен жеке байланыс"
                  icon="message"
                  breadcrumbs={[{ label: 'Студент' }, { label: 'Чат' }]}
                  description="Нақты уақыттағы академиялық чат, топтық талқылаулар және файлдармен алмасу."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 15. Premium */}
        <Route
          path="/student/premium"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AppShell userRole="STUDENT">
                <PlaceholderPage
                  title="SmartUni Premium"
                  subtitle="Кеңейтілген оқу мүмкіндіктері мен артықшылықтар"
                  icon="star"
                  breadcrumbs={[{ label: 'Студент' }, { label: 'Premium' }]}
                  description="AI көмекші, файлдардың шексіз сақтау қоры, аналитика және жекелендірілген оқу тректері."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 16. Support */}
        <Route
          path="/student/support"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AppShell userRole="STUDENT">
                <PlaceholderPage
                  title="Қолдау орталығы"
                  subtitle="Техникалық көмек және жиі қойылатын сұрақтар (FAQ)"
                  icon="help"
                  breadcrumbs={[{ label: 'Студент' }, { label: 'Қолдау орталығы' }]}
                  description="Платформа жұмысына байланысты сұрақтар мен техникалық қолдау қызметіне өтініш жіберу."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 17. Profile */}
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* =================================================================
            ОҚЫТУШЫ КЕҢІСТІГІ (TEACHER CANONICAL ROUTES)
           ================================================================= */}
        {/* 1. Real Page: Dashboard */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* 2. Groups */}
        <Route
          path="/teacher/groups"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherGroupsPage />
            </ProtectedRoute>
          }
        />

        {/* 3. Groups - Dynamic detail */}
        <Route
          path="/teacher/groups/:groupId"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherGroupDetailPage />
            </ProtectedRoute>
          }
        />

        {/* 4. Subjects */}
        <Route
          path="/teacher/subjects"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherSubjectsPage />
            </ProtectedRoute>
          }
        />

        {/* 5. Topics */}
        <Route
          path="/teacher/topics"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherTopicsPage />
            </ProtectedRoute>
          }
        />

        {/* 6. Materials */}
        <Route
          path="/teacher/materials"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherMaterialsPage />
            </ProtectedRoute>
          }
        />

        {/* 7. Assignments */}
        <Route
          path="/teacher/assignments"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherAssignmentsPage />
            </ProtectedRoute>
          }
        />

        {/* 8. Labs */}
        <Route
          path="/teacher/labs"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Зертханалар"
                  subtitle="Зертханалық жұмыстарды басқару және тексеру"
                  icon="grid"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'Зертханалар' }]}
                  description="Зертханалық тапсырмаларды бекіту, студенттердің есептерін қабылдау және нәтижелерін бағалау."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 9. Tests */}
        <Route
          path="/teacher/tests"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherTestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/tests/:testId/results"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherTestResultsPage />
            </ProtectedRoute>
          }
        />

        {/* 10. Journal */}
        <Route
          path="/teacher/journal"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherJournalPage />
            </ProtectedRoute>
          }
        />

        {/* 11. Attendance */}
        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherAttendancePage />
            </ProtectedRoute>
          }
        />

        {/* 12. Calendar */}
        <Route
          path="/teacher/calendar"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Күнтізбе"
                  subtitle="Апталық сабақ кестесі және академиялық іс-шаралар"
                  icon="calendar"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'Күнтізбе' }]}
                  description="Оқытушының дәрістері, консультациялары (office hours) және емтихандар кестесі."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 13. RK1 */}
        <Route
          path="/teacher/rk1"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherGradesPage defaultPeriod="RK1" />
            </ProtectedRoute>
          }
        />

        {/* 14. RK2 */}
        <Route
          path="/teacher/rk2"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherGradesPage defaultPeriod="RK2" />
            </ProtectedRoute>
          }
        />

        {/* 15. Session */}
        <Route
          path="/teacher/session"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherGradesPage defaultPeriod="SESSION" />
            </ProtectedRoute>
          }
        />

        {/* 15.1 Generic Grades */}
        <Route
          path="/teacher/grades"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherGradesPage defaultPeriod="ALL" />
            </ProtectedRoute>
          }
        />

        {/* 16. Real Page: Requests */}
        <Route
          path="/teacher/requests"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/join-requests"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherRequestsPage />
            </ProtectedRoute>
          }
        />

        {/* 17. Notifications */}
        <Route
          path="/teacher/notifications"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Хабарламалар"
                  subtitle="Кафедра және университет әкімшілігінің хабарламалары"
                  icon="bell"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'Хабарламалар' }]}
                  description="Ресми хабарландырулар, деканат ескертулері және студенттерден түскен жүйелік хабарламалар."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 18. Chat */}
        <Route
          path="/teacher/chat"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Чат"
                  subtitle="Студенттермен және топтармен байланыс"
                  icon="message"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'Чат' }]}
                  description="Жеке және топтық академиялық чаттар, кеңес беру және хабарлама алмасу."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 19. Premium */}
        <Route
          path="/teacher/premium"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="SmartUni Premium"
                  subtitle="Оқытушыға арналған кеңейтілген құралдар мен AI ассистент"
                  icon="star"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'Premium' }]}
                  description="Автоматты тапсырма генерациясы, AI тесттер құрастыру және үлкен файлдарды сақтау кеңістігі."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 20. Support */}
        <Route
          path="/teacher/support"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Қолдау орталығы"
                  subtitle="Оқытушыға арналған техникалық қолдау және нұсқаулықтар"
                  icon="help"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'Қолдау орталығы' }]}
                  description="Платформа функциялары бойынша көмек, сұрақтар мен техникалық қолдау қызметі."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 21. Profile */}
        <Route
          path="/teacher/profile"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* =================================================================
            ӘКІМШІ КЕҢІСТІГІ (ADMIN CANONICAL ROUTES)
           ================================================================= */}
        {/* 1. Real Page: Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* 2. Students */}
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Студенттер"
                  subtitle="Студенттер базасы, курстар және мамандықтар бойынша мониторинг"
                  icon="graduation-cap"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Студенттер' }]}
                  description="Университет студенттерінің контингентін басқару, мәртебесін өзгерту және тіркеу."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 3. Teachers */}
        <Route
          path="/admin/teachers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Оқытушылар"
                  subtitle="Профессорлық-оқытушылық құрам және кафедралар"
                  icon="users"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Оқытушылар' }]}
                  description="Оқытушылардың есептік жазбаларын басқару, жүктемелер мен кафедралық бекітулер."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 4. Users */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />

        {/* 5. Groups */}
        <Route
          path="/admin/groups"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminGroupsPage />
            </ProtectedRoute>
          }
        />

        {/* 6. Subjects */}
        <Route
          path="/admin/subjects"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSubjectsPage />
            </ProtectedRoute>
          }
        />

        {/* 7. Materials */}
        <Route
          path="/admin/materials"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Материалдар"
                  subtitle="Университеттік бірыңғай цифрлық кітапхана және ресурстар"
                  icon="folder"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Материалдар' }]}
                  description="Жүйе бойынша жүктелген оқу материалдарын модерациялау және сақтау көлемін бақылау."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 8. Tests */}
        <Route
          path="/admin/tests"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Тесттер"
                  subtitle="Орталықтандырылған тестілеу базасы мен қауіпсіздік"
                  icon="check-circle"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Тесттер' }]}
                  description="Тестілеу жүйесінің параметрлері, прокторинг ережелері мен сұрақтар базасы."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 9. Academic Monitoring & Grades */}
        <Route
          path="/admin/academic"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAcademicPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/grades"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAcademicPage />
            </ProtectedRoute>
          }
        />

        {/* 10. RK */}
        <Route
          path="/admin/rk"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Рейтингтік бақылау (РК)"
                  subtitle="РК-1 және РК-2 өткізу кезеңдерін басқару"
                  icon="award"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'РК' }]}
                  description="Рейтингтік бақылау мерзімдерін жариялау, ведомостарды жабу және ашу."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 11. Session */}
        <Route
          path="/admin/session"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Сессия"
                  subtitle="Емтихан сессиясының ұйымдастырылуы мен нәтижелері"
                  icon="graduation-cap"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Сессия' }]}
                  description="Қорытынды емтихан ведомостары, аппеляциялар және сессия нәтижелерін бекіту."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 12. Statistics */}
        <Route
          path="/admin/statistics"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Статистика"
                  subtitle="Жүйелік белсенділік, академиялық аналитика және KPI"
                  icon="chart"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Статистика' }]}
                  description="Платформаның жүктемесі, пайдаланушылар белсенділігі және факультеттер бойынша үлгерім графиктері."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 13. Requests */}
        <Route
          path="/admin/requests"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Өтініштер"
                  subtitle="Жүйелік және академиялық өтініштер журналы"
                  icon="users"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Өтініштер' }]}
                  description="Студенттер мен оқытушылардан түскен барлық сұраныстарды модерациялау."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 14. Support */}
        <Route
          path="/admin/support"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Қолдау орталығы"
                  subtitle="Кері байланыс және қолдау қызметінің тикеттері"
                  icon="help"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Қолдау орталығы' }]}
                  description="Пайдаланушылардан келген техникалық сұрақтар мен мәселелерді шешу панелі."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 15. Notifications */}
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Хабарламалар"
                  subtitle="Жалпыуниверситеттік хабарландыру тарату"
                  icon="bell"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Хабарламалар' }]}
                  description="Барлық студенттер мен оқытушыларға жүйелік ескертулер мен жаңалықтар жіберу."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 16. Premium */}
        <Route
          path="/admin/premium"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Premium басқару"
                  subtitle="Премиум жазылымдар, тарифтер және лимиттер"
                  icon="star"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Premium' }]}
                  description="Премиум аккаунттар саясаты, қосымша квоталар мен қызметтер параметрлері."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 17. Audit Log */}
        <Route
          path="/admin/audit-log"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Әрекеттер журналы"
                  subtitle="Қауіпсіздік логтары, жүйеге кіру және әрекеттер тарихы"
                  icon="shield"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Әрекеттер журналы' }]}
                  description="Жүйеде жасалған барлық өзгерістер, кіру тарихы және қауіпсіздік оқиғаларының аудиті."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 18. Settings */}
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Жүйе параметрлері"
                  subtitle="Платформаның жаһандық конфигурациясы"
                  icon="settings"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Жүйе параметрлері' }]}
                  description="Платформаның интеграциялары, қауіпсіздік баптаулары мен жалпы жүйелік параметрлері."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 19. Profile */}
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Generic Profile Route for any authenticated role */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Белгісіз адрес → басты бет */}
        <Route path="*" element={<HomePage />} />
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
