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

const LocaleWrapper: React.FC = () => {
  const { locale = 'es' } = useParams();
  if (!['es', 'en'].includes(locale)) return <Navigate to="/es" replace />;
  return (
    <div>
      <NavBar />
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="login" element={<LoginPage />} />
        <Route element={<RequireRole roles={["admin", "teacher", "parent", "student"]} />}> 
          <Route path="students" element={<StudentsPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="finance" element={<FinancePage />} />
        </Route>
      </Routes>
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
