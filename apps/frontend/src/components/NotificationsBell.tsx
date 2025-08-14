import React from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NotificationsBell: React.FC<{ count?: number }> = ({ count = 0 }) => {
  const { t } = useTranslation();
  const label = count > 0 ? t('notifications_unread', { count }) : t('notifications');
  return (
    <button type="button" className="relative" aria-label={label} title={label}>
      <Bell size={20} aria-hidden />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1" aria-live="polite">
          {count}
        </span>
      )}
    </button>
  );
};

export default NotificationsBell;
