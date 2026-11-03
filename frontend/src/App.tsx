import { BrowserRouter, Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentSubjectsPage from './pages/StudentSubjectsPage';
import StudentSubjectPage from './pages/StudentSubjectPage';
import StudentTopicPage from './pages/StudentTopicPage';
import StudentAssignmentsPage from './pages/StudentAssignmentsPage';
import StudentLabsPage from './pages/StudentLabsPage';
import StudentTestsPage from './pages/StudentTestsPage';
import StudentTestTakingPage from './pages/StudentTestTakingPage';
import StudentTestResultPage from './pages/StudentTestResultPage';
import StudentProgressPage from './pages/StudentProgressPage';
import { StudentCalendarPage } from './pages/StudentCalendarPage';
import { StudentDiaryPage } from './pages/StudentDiaryPage';
import StudentHistoryPage from './pages/StudentHistoryPage';
import { StudentMaterialsPage } from './pages/StudentMaterialsPage';
import NotificationsPage from './pages/NotificationsPage';
import ChatPage from './pages/ChatPage';
import PremiumPage from './pages/PremiumPage';
import SupportPage from './pages/SupportPage';

import TeacherDashboardPage from './pages/TeacherDashboardPage';
import TeacherRequestsPage from './pages/TeacherRequestsPage';
import TeacherGroupsPage from './pages/TeacherGroupsPage';
import TeacherGroupDetailPage from './pages/TeacherGroupDetailPage';
import { TeacherSubjectsPage } from './pages/TeacherSubjectsPage';
import TeacherTopicsPage from './pages/TeacherTopicsPage';
import TeacherMaterialsPage from './pages/TeacherMaterialsPage';
import TeacherAssignmentsPage from './pages/TeacherAssignmentsPage';
import TeacherLabsPage from './pages/TeacherLabsPage';
import TeacherTestsPage from './pages/TeacherTestsPage';
import TeacherTestResultsPage from './pages/TeacherTestResultsPage';
import { TeacherJournalPage } from './pages/TeacherJournalPage';
import TeacherAttendancePage from './pages/TeacherAttendancePage';
import TeacherCalendarPage from './pages/TeacherCalendarPage';
import TeacherGradesPage from './pages/TeacherGradesPage';

import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminStudentsPage from './pages/AdminStudentsPage';
import AdminTeachersPage from './pages/AdminTeachersPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminGroupsPage from './pages/AdminGroupsPage';
import AdminSubjectsPage from './pages/AdminSubjectsPage';
import AdminMaterialsPage from './pages/AdminMaterialsPage';
import AdminTestsPage from './pages/AdminTestsPage';
import AdminAcademicPage from './pages/AdminAcademicPage';
import AdminRkPage from './pages/AdminRkPage';
import AdminSessionPage from './pages/AdminSessionPage';
import AdminStatisticsPage from './pages/AdminStatisticsPage';
import AdminRequestsPage from './pages/AdminRequestsPage';
import AdminAuditLogPage from './pages/AdminAuditLogPage';
import AdminSettingsPage from './pages/AdminSettingsPage';

import ProfilePage from './pages/ProfilePage';
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

          {/* Авторизация беттері */}
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
          {/* 1. Dashboard */}
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
                <StudentLabsPage />
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
                <StudentHistoryPage />
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
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* 14. Chat */}
          <Route
            path="/student/chat"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          {/* 15. Premium */}
          <Route
            path="/student/premium"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <PremiumPage />
              </ProtectedRoute>
            }
          />

          {/* 16. Support */}
          <Route
            path="/student/support"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <SupportPage />
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
          {/* 1. Dashboard */}
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
                <TeacherLabsPage />
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
                <TeacherCalendarPage />
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

          {/* 16. Requests */}
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
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* 18. Chat */}
          <Route
            path="/teacher/chat"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          {/* 19. Premium */}
          <Route
            path="/teacher/premium"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <PremiumPage />
              </ProtectedRoute>
            }
          />

          {/* 20. Support */}
          <Route
            path="/teacher/support"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <SupportPage />
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
          {/* 1. Dashboard */}
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
                <AdminStudentsPage />
              </ProtectedRoute>
            }
          />

          {/* 3. Teachers */}
          <Route
            path="/admin/teachers"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminTeachersPage />
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
                <AdminMaterialsPage />
              </ProtectedRoute>
            }
          />

          {/* 8. Tests */}
          <Route
            path="/admin/tests"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminTestsPage />
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
                <AdminRkPage />
              </ProtectedRoute>
            }
          />

          {/* 11. Session */}
          <Route
            path="/admin/session"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminSessionPage />
              </ProtectedRoute>
            }
          />

          {/* 12. Statistics */}
          <Route
            path="/admin/statistics"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminStatisticsPage />
              </ProtectedRoute>
            }
          />

          {/* 13. Requests */}
          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminRequestsPage />
              </ProtectedRoute>
            }
          />

          {/* 14. Support */}
          <Route
            path="/admin/support"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <SupportPage />
              </ProtectedRoute>
            }
          />

          {/* 15. Notifications */}
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* 16. Premium */}
          <Route
            path="/admin/premium"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <PremiumPage />
              </ProtectedRoute>
            }
          />

          {/* 17. Audit Log */}
          <Route
            path="/admin/audit-log"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminAuditLogPage />
              </ProtectedRoute>
            }
          />

          {/* 18. Settings */}
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminSettingsPage />
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
