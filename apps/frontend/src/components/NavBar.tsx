import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import NotificationsBell from './NotificationsBell';

const NavBar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { locale = 'es' } = useParams();

  const changeLang = (lng: 'es' | 'en') => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center justify-between p-3 border-b">
      <div className="flex items-center gap-4">
        <Link to={`/${locale}`}>{t('app_title')}</Link>
        <Link to={`/${locale}/students`}>{t('students')}</Link>
        <Link to={`/${locale}/schedule`}>{t('schedule')}</Link>
        <Link to={`/${locale}/announcements`}>{t('announcements')}</Link>
        <Link to={`/${locale}/finance`}>{t('finance')}</Link>
      </div>
      <div className="flex items-center gap-3">
        <NotificationsBell count={3} />
        <button className="px-2" onClick={() => changeLang('es')}>{t('spanish')}</button>
        <button className="px-2" onClick={() => changeLang('en')}>{t('english')}</button>
        {user ? (
          <button className="bg-gray-200 px-3 py-1 rounded" onClick={logout}>{t('logout')}</button>
        ) : (
          <Link className="bg-blue-600 text-white px-3 py-1 rounded" to={`/${locale}/login`}>{t('login')}</Link>
        )}
      </div>
    </div>
  );
};

export default NavBar;

