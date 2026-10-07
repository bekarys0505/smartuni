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
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import TeacherRequestsPage from './pages/TeacherRequestsPage';
import TeacherAssignmentsPage from './pages/TeacherAssignmentsPage';
import TeacherTestsPage from './pages/TeacherTestsPage';
import TeacherTestResultsPage from './pages/TeacherTestResultsPage';
import AdminDashboardPlaceholder from './pages/AdminDashboardPlaceholder';
import PlaceholderPage from './pages/PlaceholderPage';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';

import './styles.css';

function App() {
  return (
    <BrowserRouter>
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
              <AppShell userRole="STUDENT">
                <PlaceholderPage
                  title="Менің материалдарым"
                  subtitle="Электронды кітаптар, дәрістер мен силлабустар"
                  icon="folder"
                  breadcrumbs={[{ label: 'Студент' }, { label: 'Менің материалдарым' }]}
                  description="Оқытушылар жүктеген электронды дәрістер, әдістемелік нұсқаулықтар мен оқулықтар жиынтығы."
                />
              </AppShell>
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
              <AppShell userRole="STUDENT">
                <PlaceholderPage
                  title="Жеке профиль"
                  subtitle="Студент туралы академиялық мәліметтер және байланыс"
                  icon="user"
                  breadcrumbs={[{ label: 'Студент' }, { label: 'Профиль' }]}
                  description="Студенттің жеке деректері, факультеті, мамандығы, курсы және қауіпсіздік параметрлері."
                />
              </AppShell>
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
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Менің топтарым"
                  subtitle="Бекітілген академиялық топтар мен студенттер құрамы"
                  icon="users"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'Менің топтарым' }]}
                  description="Оқытушы жетекшілік ететін барлық оқу топтары, студенттер контингенті және топтық параметрлер."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 3. Groups - Dynamic detail */}
        <Route
          path="/teacher/groups/:groupId"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Топты басқару"
                  subtitle="Топ құрамындағы студенттер, сабақ кестесі және үлгерім"
                  icon="users"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'Менің топтарым', path: '/teacher/groups' }, { label: 'Топ парақшасы' }]}
                  description="Таңдалған топтың студенттер тізімі, қатысу журналдары, топтық хабарламалар және журнал бағалары."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 4. Subjects */}
        <Route
          path="/teacher/subjects"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Пәндер"
                  subtitle="Оқытылатын академиялық пәндер мен оқу жоспарлары"
                  icon="book"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'Пәндер' }]}
                  description="Оқытушы бекітілген пәндер тізімі, кредиттер саны және силлабус құрылымы."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 5. Topics */}
        <Route
          path="/teacher/topics"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Тақырыптар"
                  subtitle="Оқу пәндерінің апталық тақырыптық жоспары"
                  icon="layers"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'Тақырыптар' }]}
                  description="Дәрістер мен практикалық сабақтардың тақырыптары, оқу материалдарын байланыстыру."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 6. Materials */}
        <Route
          path="/teacher/materials"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Материалдар"
                  subtitle="Дәріс материалдарын жүктеу және басқару"
                  icon="folder"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'Материалдар' }]}
                  description="Пәндер бойынша дәрістер, тапсырмалар мен әдістемелік құралдарды жүктеу және басқару."
                />
              </AppShell>
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
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Электронды журнал"
                  subtitle="Ағымдағы бағалау және баллдық ведомос"
                  icon="chart"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'Электронды журнал' }]}
                  description="Студенттердің күнделікті бағаларын қою, аралық нәтижелерді шығару және рейтинг есептеу."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 11. Attendance */}
        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Қатысу"
                  subtitle="Сабаққа қатысу журналы және статистикасы"
                  icon="check"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'Қатысу' }]}
                  description="Студенттердің сабаққа қатысуын белгілеу (қатысты, себепті/себепсіз қатыспады) және мониторинг."
                />
              </AppShell>
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
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Рейтингтік бақылау 1 (РК-1)"
                  subtitle="1-аралық бақылау қорытынды ведомосы"
                  icon="award"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'РК-1' }]}
                  description="Бірінші аралық бақылау баллдарын қорытындылау, ведомості бекіту және нәтижелерді тіркеу."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 14. RK2 */}
        <Route
          path="/teacher/rk2"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Рейтингтік бақылау 2 (РК-2)"
                  subtitle="2-аралық бақылау қорытынды ведомосы"
                  icon="award"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'РК-2' }]}
                  description="Екінші аралық бақылау нәтижелерін енгізу және сессияға дейінгі рұқсат рейтингін анықтау."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 15. Session */}
        <Route
          path="/teacher/session"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Сессия"
                  subtitle="Емтихан ведомостары және қорытынды бағалар"
                  icon="graduation-cap"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'Сессия' }]}
                  description="Семестрлік емтихандар, қорытынды баллдарды шығару және ведомостарды ресми тапсыру."
                />
              </AppShell>
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
              <AppShell userRole="TEACHER">
                <PlaceholderPage
                  title="Профиль"
                  subtitle="Оқытушының жеке және академиялық парақшасы"
                  icon="user"
                  breadcrumbs={[{ label: 'Оқытушы' }, { label: 'Профиль' }]}
                  description="Кафедра, ғылыми дәреже, лауазым, байланыс ақпараты және профильді баптау."
                />
              </AppShell>
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
              <AdminDashboardPlaceholder />
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
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Пайдаланушылар"
                  subtitle="Жүйенің барлық аккаунттары мен рөлдері (RBAC)"
                  icon="user"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Пайдаланушылар' }]}
                  description="Қолданушыларды бұғаттау, рөлдерді тағайындау, мәртебесін бақылау (ACTIVE/BLOCKED)."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 5. Groups */}
        <Route
          path="/admin/groups"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Топтар"
                  subtitle="Академиялық топтар құрылымы және сыйымдылығы"
                  icon="layers"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Топтар' }]}
                  description="Топтарды құру, оқытушыларды бекіту, аудиториялар мен кесте параметрлерін енгізу."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* 6. Subjects */}
        <Route
          path="/admin/subjects"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Пәндер"
                  subtitle="Оқу жоспарлары, пәндер каталогы және кредиттер"
                  icon="book"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Пәндер' }]}
                  description="Академиялық пәндер каталогы, кодтары және оқу бағдарламаларын басқару."
                />
              </AppShell>
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

        {/* 9. Grades */}
        <Route
          path="/admin/grades"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Бағалар"
                  subtitle="Университет бойынша академиялық үлгерім ведомостары"
                  icon="chart"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Бағалар' }]}
                  description="Бағалар қорын модерациялау, түзетулер тарихы және GPA мониторингі."
                />
              </AppShell>
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
              <AppShell userRole="ADMIN">
                <PlaceholderPage
                  title="Профиль"
                  subtitle="Әкімшінің есептік жазбасы мен қауіпсіздігі"
                  icon="user"
                  phaseNumber={6}
                  breadcrumbs={[{ label: 'Әкімші' }, { label: 'Профиль' }]}
                  description="Әкімші аккаунтының параметрлері, құпия сөзді жаңарту және екі факторлы аутентификация."
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Белгісіз адрес → басты бет */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
