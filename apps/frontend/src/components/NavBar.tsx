import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/useAuth';
import NotificationsBell from './NotificationsBell';
import { Sun, Moon } from 'lucide-react';

const NavBar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { locale = 'es' } = useParams();

  const changeLang = (lng: 'es' | 'en') => {
    i18n.changeLanguage(lng);
  };

  const [isDark, setIsDark] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  React.useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const apply = () => {
      if (isDark) {
        root.classList.add('dark');
        body.classList.remove('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    };
    apply();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const saved = localStorage.getItem('theme');
      if (!saved) {
        setIsDark(media.matches);
        // Ensure body/root are kept in sync even if no state change occurs
        apply();
      }
    };
    media.addEventListener?.('change', handler);
    return () => media.removeEventListener?.('change', handler);
  }, [isDark]);

  return (
    <nav className="flex items-center justify-between p-3 border-b border-base navbar backdrop-blur" aria-label="Main">
      <ul className="flex items-center gap-4">
        <li><Link className="font-semibold" to={`/${locale}`}>{t('app_title')}</Link></li>
        <li><Link className="hover:underline" to={`/${locale}/students`}>{t('students')}</Link></li>
        <li><Link className="hover:underline" to={`/${locale}/schedule`}>{t('schedule')}</Link></li>
        <li><Link className="hover:underline" to={`/${locale}/announcements`}>{t('announcements')}</Link></li>
        <li><Link className="hover:underline" to={`/${locale}/finance`}>{t('finance')}</Link></li>
      </ul>
      <div className="flex items-center gap-3">
        <NotificationsBell count={3} />
        <button
          className="inline-flex items-center gap-2 px-2 py-1 rounded border border-base hover-surface"
          onClick={() => setIsDark((d) => !d)}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light' : 'Dark'}
        >
          {isDark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
          <span className="text-xs">{isDark ? 'Light' : 'Dark'}</span>
        </button>
        <button className="px-2" onClick={() => changeLang('es')} aria-label="Switch to Spanish" title={t('spanish') || 'Spanish'}>{t('spanish')}</button>
        <button className="px-2" onClick={() => changeLang('en')} aria-label="Switch to English" title={t('english') || 'English'}>{t('english')}</button>
        {user ? (
          <button className="px-3 py-1 rounded border border-base hover-surface" onClick={logout} aria-label={t('logout') || 'Logout'}>{t('logout')}</button>
        ) : (
          <Link className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500" to={`/${locale}/login`} aria-label={t('login') || 'Login'}>{t('login')}</Link>
        )}
      </div>
    </nav>
  );
};

export default NavBar;

