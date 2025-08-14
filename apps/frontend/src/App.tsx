import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import StudentsPage from './pages/StudentsPage';
import SchedulePage from './pages/SchedulePage';
import FinancePage from './pages/FinancePage';
import NavBar from './components/NavBar';
import AnnouncementsPage from './pages/AnnouncementsPage';
import { RequireRole } from './auth/RequireRole';
import MaterialsPage from './pages/MaterialsPage';
import AttendancePage from './pages/AttendancePage';
import { ErrorBoundary } from './components/ErrorBoundary';

const LocaleWrapper: React.FC = () => {
  const { locale = 'es' } = useParams();
  if (!['es', 'en'].includes(locale)) return <Navigate to="/es" replace />;
  return (
    <div>
      <NavBar />
      <ErrorBoundary>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="login" element={<LoginPage />} />
        {/* public */}
        {/* protected by role */}
        <Route element={<RequireRole roles={["admin", "teacher", "parent", "student"]} />}>
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="schedule" element={<SchedulePage />} />
        </Route>
        <Route element={<RequireRole roles={["admin", "teacher"]} />}>
          <Route path="students" element={<StudentsPage />} />
          <Route path="classes/:classId/materials" element={<MaterialsPage />} />
          <Route path="classes/:classId/sessions/:sessionId/attendance" element={<AttendancePage />} />
        </Route>
        <Route element={<RequireRole roles={["admin", "parent"]} />}>
          <Route path="finance" element={<FinancePage />} />
        </Route>
      </Routes>
      </ErrorBoundary>
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
