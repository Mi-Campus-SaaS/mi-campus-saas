import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Wifi, WifiOff, Clock, MapPin, User } from 'lucide-react';
import { api } from '../api/client';
import { queryKeys } from '../api/queryKeys';

interface ScheduleItem {
  id: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  day: string;
  duration: number;
}

const SchedulePage: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.schedule.all,
    queryFn: async () => (await api.get('/schedule/student/demo')).data,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes for offline access
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-6 h-6" />
          <h1 className="text-xl font-semibold dark:text-white">{t('schedule')}</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-6 h-6" />
          <h1 className="text-xl font-semibold dark:text-white">{t('schedule')}</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <WifiOff className="w-5 h-5" />
            <span>{t('failed_to_load_schedule')}</span>
          </div>
          {!isOnline && <p className="text-red-600 dark:text-red-400 mt-2 text-sm">{t('offline_cached_data')}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          <h1 className="text-xl font-semibold dark:text-white">{t('schedule')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Wifi className="w-4 h-4" />
              <span className="text-sm">{t('online')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm">{t('offline')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{t('todays_schedule')}</span>
          </div>
        </div>
        <div className="p-4">
          {data ? (
            <div className="space-y-4">
              {Array.isArray(data) && data.length > 0 ? (
                data.map((item: ScheduleItem) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex-shrink-0 w-20 text-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{formatTime(item.time)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.duration} {t('minutes')}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{item.subject}</div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{item.teacher}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{item.room}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p>{t('no_classes_today')}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p>{t('no_schedule_data')}</p>
            </div>
          )}
        </div>
      </div>

      {!isOnline && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">{t('offline_mode')}</span>
          </div>
          <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">{t('offline_hint')}</p>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
