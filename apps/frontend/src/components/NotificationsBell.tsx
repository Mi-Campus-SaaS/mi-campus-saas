import React from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUnreadAnnouncements } from '../hooks/useUnreadAnnouncements';

const NotificationsBell: React.FC<{ count?: number }> = ({ count: propCount }) => {
  const { t } = useTranslation();
  const { count, markSeenNow } = useUnreadAnnouncements();
  const effectiveCount = typeof propCount === 'number' ? propCount : count;
  const label = effectiveCount > 0 ? t('notifications_unread', { count: effectiveCount }) : t('notifications');
  return (
    <button type="button" className="relative" aria-label={label} title={label} onClick={markSeenNow}>
      <Bell size={20} aria-hidden />
      {effectiveCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1" aria-live="polite">
          {effectiveCount}
        </span>
      )}
    </button>
  );
};

export default NotificationsBell;
