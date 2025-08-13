import React from 'react';
import { Bell } from 'lucide-react';

const NotificationsBell: React.FC<{ count?: number }> = ({ count = 0 }) => {
  return (
    <div className="relative" role="button" aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}`} tabIndex={0}>
      <Bell size={20} aria-hidden />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1" aria-live="polite">
          {count}
        </span>
      )}
    </div>
  );
};

export default NotificationsBell;

