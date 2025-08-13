import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/useAuth';
import NotificationsBell from './NotificationsBell';

const NavBar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { locale = 'es' } = useParams();

  const changeLang = (lng: 'es' | 'en') => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav className="flex items-center justify-between p-3 border-b" aria-label="Main">
      <div className="flex items-center gap-4" role="menubar" aria-label="Primary">
        <Link role="menuitem" to={`/${locale}`}>{t('app_title')}</Link>
        <Link role="menuitem" to={`/${locale}/students`}>{t('students')}</Link>
        <Link role="menuitem" to={`/${locale}/schedule`}>{t('schedule')}</Link>
        <Link role="menuitem" to={`/${locale}/announcements`}>{t('announcements')}</Link>
        <Link role="menuitem" to={`/${locale}/finance`}>{t('finance')}</Link>
      </div>
      <div className="flex items-center gap-3">
        <NotificationsBell count={3} />
        <button className="px-2" onClick={() => changeLang('es')} aria-label="Switch to Spanish" title={t('spanish') as string}>{t('spanish')}</button>
        <button className="px-2" onClick={() => changeLang('en')} aria-label="Switch to English" title={t('english') as string}>{t('english')}</button>
        {user ? (
          <button className="bg-gray-200 px-3 py-1 rounded" onClick={logout} aria-label={t('logout') as string}>{t('logout')}</button>
        ) : (
          <Link className="bg-blue-600 text-white px-3 py-1 rounded" to={`/${locale}/login`} aria-label={t('login') as string}>{t('login')}</Link>
        )}
      </div>
    </nav>
  );
};

export default NavBar;

