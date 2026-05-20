import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import AuthRedirect from '@/components/auth/AuthRedirect';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoadingScreen from '@/components/ui/LoadingScreen';

// Lazy load all pages
const Landing = lazy(() => import('@/pages/public/Landing'));
const LeadSpace = lazy(() => import('@/pages/public/LeadSpace'));
const StudentLogin = lazy(() => import('@/pages/auth/StudentLogin'));
const ProfessorLogin = lazy(() => import('@/pages/auth/ProfessorLogin'));
const AdminLogin = lazy(() => import('@/pages/auth/AdminLogin'));
const SuperAdminLogin = lazy(() => import('@/pages/auth/SuperAdminLogin'));

const StudentDashboard = lazy(() => import('@/pages/student/Dashboard'));
const StudentChat = lazy(() => import('@/pages/student/Chat'));
const StudentQuiz = lazy(() => import('@/pages/student/Quiz'));
const StudentQuizSession = lazy(() => import('@/pages/student/QuizSession'));
const StudentSessions = lazy(() => import('@/pages/student/Sessions'));
const StudentProfile = lazy(() => import('@/pages/student/Profile'));
const StudentNotifications = lazy(() => import('@/pages/notifications/StudentNotifications'));

const ProfessorDashboard = lazy(() => import('@/pages/professor/Dashboard'));
const ProfessorDocuments = lazy(() => import('@/pages/professor/Documents'));
const ProfessorQuestions = lazy(() => import('@/pages/professor/Questions'));
const ProfessorNotifications = lazy(() => import('@/pages/professor/Notifications'));

const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminLeads = lazy(() => import('@/pages/admin/Leads'));
const AdminStudents = lazy(() => import('@/pages/admin/Students'));
const AdminProfessors = lazy(() => import('@/pages/admin/Professors'));
const AdminDocuments = lazy(() => import('@/pages/admin/Documents'));
const AdminExports = lazy(() => import('@/pages/admin/Exports'));
const AdminStats = lazy(() => import('@/pages/admin/Stats'));
const AdminLevels = lazy(() => import('@/pages/admin/Levels'));
const AdminClasses = lazy(() => import('@/pages/admin/Classes'));
const AdminCourses = lazy(() => import('@/pages/admin/Courses'));
const AdminNotifications = lazy(() => import('@/pages/notifications/AdminNotifications'));

const SuperAdminSchools = lazy(() => import('@/pages/superadmin/Schools'));
const SuperAdminStats = lazy(() => import('@/pages/superadmin/GlobalStats'));

const NotFound = lazy(() => import('@/pages/public/NotFound'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      {children}
    </Suspense>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Public */}
          <Route path="/" element={<SuspenseWrapper><AuthRedirect><Landing /></AuthRedirect></SuspenseWrapper>} />
          <Route path="/lead/:schoolId" element={<SuspenseWrapper><LeadSpace /></SuspenseWrapper>} />

          {/* Auth */}
          <Route path="/auth/student" element={<SuspenseWrapper><StudentLogin /></SuspenseWrapper>} />
          <Route path="/auth/professor" element={<SuspenseWrapper><ProfessorLogin /></SuspenseWrapper>} />
          <Route path="/auth/admin" element={<SuspenseWrapper><AdminLogin /></SuspenseWrapper>} />
          <Route path="/auth/superadmin" element={<SuspenseWrapper><SuperAdminLogin /></SuspenseWrapper>} />

          {/* Student */}
          <Route path="/dashboard" element={<ProtectedRoute roles={['student']}><SuspenseWrapper><StudentDashboard /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute roles={['student']}><SuspenseWrapper><StudentChat /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/chat/:sessionId" element={<ProtectedRoute roles={['student']}><SuspenseWrapper><StudentChat /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute roles={['student']}><SuspenseWrapper><StudentQuiz /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/quiz/:sessionId" element={<ProtectedRoute roles={['student']}><SuspenseWrapper><StudentQuizSession /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute roles={['student']}><SuspenseWrapper><StudentSessions /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute roles={['student']}><SuspenseWrapper><StudentNotifications /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute roles={['student', 'professor', 'admin', 'superadmin']}><SuspenseWrapper><StudentProfile /></SuspenseWrapper></ProtectedRoute>} />

          {/* Professor */}
          <Route path="/professor/dashboard" element={<ProtectedRoute roles={['professor']}><SuspenseWrapper><ProfessorDashboard /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/professor/documents" element={<ProtectedRoute roles={['professor']}><SuspenseWrapper><ProfessorDocuments /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/professor/questions" element={<ProtectedRoute roles={['professor']}><SuspenseWrapper><ProfessorQuestions /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/professor/notifications" element={<ProtectedRoute roles={['professor']}><SuspenseWrapper><ProfessorNotifications /></SuspenseWrapper></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><SuspenseWrapper><AdminDashboard /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/leads" element={<ProtectedRoute roles={['admin']}><SuspenseWrapper><AdminLeads /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute roles={['admin']}><SuspenseWrapper><AdminStudents /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/professors" element={<ProtectedRoute roles={['admin']}><SuspenseWrapper><AdminProfessors /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/documents" element={<ProtectedRoute roles={['admin']}><SuspenseWrapper><AdminDocuments /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/exports" element={<ProtectedRoute roles={['admin']}><SuspenseWrapper><AdminExports /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute roles={['admin']}><SuspenseWrapper><AdminStats /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/levels" element={<ProtectedRoute roles={['admin']}><SuspenseWrapper><AdminLevels /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/classes" element={<ProtectedRoute roles={['admin']}><SuspenseWrapper><AdminClasses /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute roles={['admin']}><SuspenseWrapper><AdminCourses /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute roles={['admin']}><SuspenseWrapper><AdminNotifications /></SuspenseWrapper></ProtectedRoute>} />

          {/* Super Admin */}
          <Route path="/superadmin/schools" element={<ProtectedRoute roles={['superadmin']}><SuspenseWrapper><SuperAdminSchools /></SuspenseWrapper></ProtectedRoute>} />
          <Route path="/superadmin/stats" element={<ProtectedRoute roles={['superadmin']}><SuspenseWrapper><SuperAdminStats /></SuspenseWrapper></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<SuspenseWrapper><NotFound /></SuspenseWrapper>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
