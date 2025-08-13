import React from 'react';
import { Bell } from 'lucide-react';

const NotificationsBell: React.FC<{ count?: number }> = ({ count = 0 }) => {
  const label = count > 0 ? `Notifications, ${count} unread` : 'Notifications';
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

