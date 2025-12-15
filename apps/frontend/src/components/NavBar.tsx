import React from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/useAuth';
import { persistLocale, type SupportedLocale } from '../i18n/persistedLocale';

import { FeatureGate } from './FeatureGate';
import NotificationsBell from './NotificationsBell';
import { Sun, Moon } from 'lucide-react';

const NavBar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { locale = 'es' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const changeLang = (lng: SupportedLocale) => {
    persistLocale(lng);
    i18n.changeLanguage(lng);

    const currentPrefix = `/${locale}`;
    const nextPrefix = `/${lng}`;
    const { pathname, search, hash } = location;
    const nextPathname = pathname.startsWith(currentPrefix) ? `${nextPrefix}${pathname.slice(currentPrefix.length)}` : nextPrefix;
    navigate(`${nextPathname}${search}${hash}`);
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
    const update = () => {
      if (isDark) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    };
    update();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const saved = localStorage.getItem('theme');
      if (!saved) {
        setIsDark(media.matches);
        update();
      }
    };
    media.addEventListener?.('change', handler);
    return () => media.removeEventListener?.('change', handler);
  }, [isDark]);

  const themeAria = isDark ? t('switch_to_light') : t('switch_to_dark');
  const themeLabel = isDark ? t('light') : t('dark');

  return (
    <nav className="flex items-center justify-between p-3 border-b border-base navbar backdrop-blur" aria-label="Main">
      <ul className="flex items-center gap-4">
        <li>
          <Link className="font-semibold" to={`/${locale}`}>
            {t('app_title')}
          </Link>
        </li>
        <FeatureGate feature="students.view">
          <li>
            <Link className="hover:underline" to={`/${locale}/students`}>
              {t('students')}
            </Link>
          </li>
        </FeatureGate>
        <FeatureGate feature="classes.view">
          <li>
            <Link className="hover:underline" to={`/${locale}/classes`}>
              {t('classes')}
            </Link>
          </li>
        </FeatureGate>
        <FeatureGate feature="schedule.view">
          <li>
            <Link className="hover:underline" to={`/${locale}/schedule`}>
              {t('schedule')}
            </Link>
          </li>
        </FeatureGate>
        <FeatureGate feature="announcements.view">
          <li>
            <Link className="hover:underline" to={`/${locale}/announcements`}>
              {t('announcements')}
            </Link>
          </li>
        </FeatureGate>
        <FeatureGate feature="finance.view">
          <li>
            <Link className="hover:underline" to={`/${locale}/finance`}>
              {t('finance')}
            </Link>
          </li>
        </FeatureGate>
      </ul>
      <div className="flex items-center gap-3">
        <FeatureGate feature="announcements.view">
          <NotificationsBell />
        </FeatureGate>
        <button
          className="inline-flex items-center gap-2 px-2 py-1 rounded border border-base hover-surface"
          onClick={() => setIsDark((d) => !d)}
          aria-label={themeAria}
          aria-pressed={isDark}
          title={themeLabel}
        >
          {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          <span className="text-xs">{themeLabel}</span>
        </button>
        <button
          className="px-2"
          onClick={() => changeLang('es')}
          aria-label={t('switch_to_spanish')}
          aria-current={locale === 'es' ? 'true' : undefined}
          title={t('spanish')}
        >
          {t('spanish')}
        </button>
        <button
          className="px-2"
          onClick={() => changeLang('en')}
          aria-label={t('switch_to_english')}
          aria-current={locale === 'en' ? 'true' : undefined}
          title={t('english')}
        >
          {t('english')}
        </button>
        {user ? (
          <button
            className="px-3 py-1 rounded border border-base hover-surface"
            onClick={logout}
            aria-label={t('logout')}
          >
            {t('logout')}
          </button>
        ) : (
          <Link
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500"
            to={`/${locale}/login`}
            aria-label={t('login')}
          >
            {t('login')}
          </Link>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
