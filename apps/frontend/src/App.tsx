import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import StudentsPage from './pages/StudentsPage';
import StudentProfilePage from './pages/StudentProfilePage';
import ClassesPage from './pages/ClassesPage';
import SchedulePage from './pages/SchedulePage';
import FinancePage from './pages/FinancePage';
import NavBar from './components/NavBar';
import AnnouncementsPage from './pages/AnnouncementsPage';
import { RequireRole } from './auth/RequireRole';
import MaterialsPage from './pages/MaterialsPage';
import AttendancePage from './pages/AttendancePage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import TimeTestPage from './pages/TimeTestPage';
import { useTranslation } from 'react-i18next';

const LocaleWrapper: React.FC = () => {
  const { locale = 'es' } = useParams();
  const { i18n, t } = useTranslation();
  useEffect(() => {
    if (locale && i18n.language !== locale) i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
  }, [i18n, locale]);
  if (!['es', 'en'].includes(locale)) return <Navigate to="/es" replace />;
  return (
    <div className="min-h-screen">
      <a href="#main-content" className="skip-link">
        {t('skip_to_main_content')}
      </a>
      <NavBar />
      <main id="main-content">
        <ErrorBoundary>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="login" element={<LoginPage />} />
            {/* public */}
            {/* protected by role */}
            <Route element={<RequireRole roles={['admin', 'teacher', 'parent', 'student']} />}>
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="schedule" element={<SchedulePage />} />
            </Route>
            <Route element={<RequireRole roles={['admin', 'teacher']} />}>
              <Route path="students" element={<StudentsPage />} />
              <Route path="students/:studentId" element={<StudentProfilePage />} />
              <Route path="classes" element={<ClassesPage />} />
              <Route path="classes/:classId/materials" element={<MaterialsPage />} />
              <Route path="classes/:classId/sessions/:sessionId/attendance" element={<AttendancePage />} />
            </Route>
            <Route element={<RequireRole roles={['admin', 'parent']} />}>
              <Route path="finance" element={<FinancePage />} />
            </Route>
            {/* Testing route (not linked in UI) */}
            <Route path="time-test" element={<TimeTestPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <PWAInstallPrompt />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path=":locale/*" element={<LocaleWrapper />} />
      <Route path="*" element={<Navigate to="/es" replace />} />
    </Routes>
  );
};

export default App;
