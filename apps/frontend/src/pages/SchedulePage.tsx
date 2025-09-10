import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Wifi, WifiOff, Clock, MapPin, User } from 'lucide-react';
import { api } from '../api/client';
import { queryKeys } from '../api/queryKeys';
import styles from './SchedulePage.module.css';
import { toast } from 'sonner';

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

  const queryClient = useQueryClient();
  const [savedOrder, setSavedOrder] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('scheduleDemoOrder');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((x): x is string => typeof x === 'string')) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });
  const { data, isLoading, error } = useQuery<ScheduleItem[]>({
    queryKey: queryKeys.schedule.all,
    queryFn: async () => (await api.get('/schedule/student/demo')).data,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes for offline access
  });

  const items = useMemo(() => {
    const base = Array.isArray(data) ? [...data] : [];
    if (!savedOrder || savedOrder.length === 0) return base;
    const ids = new Set(base.map((i) => i.id));
    // Only apply saved order if it matches current items set
    const sameSet = savedOrder.length === base.length && savedOrder.every((id) => ids.has(id));
    if (!sameSet) return base;
    const byId = new Map(base.map((i) => [i.id, i] as const));
    return savedOrder.map((id) => byId.get(id)!).filter(Boolean);
  }, [data, savedOrder]);

  const mutation = useMutation<ScheduleItem[], unknown, string[], { previous?: ScheduleItem[] }>({
    mutationFn: async (ids: string[]) => {
      const res = await api.patch<ScheduleItem[]>('/schedule/student/demo/reorder', { ids });
      return res.data;
    },
    onMutate: async (newOrder: string[]) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.schedule.all });
      const previous = queryClient.getQueryData<ScheduleItem[] | undefined>(queryKeys.schedule.all);
      const reordered = (previous ?? [])
        .slice()
        .sort((a: ScheduleItem, b: ScheduleItem) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
      queryClient.setQueryData(queryKeys.schedule.all, reordered);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.schedule.all, context.previous);
      }
    },
    onSuccess: (serverOrder) => {
      queryClient.setQueryData(queryKeys.schedule.all, serverOrder);
    },
  });

  function handleReorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const next = items.slice();
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const ids = next.map((i) => i.id);
    setSavedOrder(ids);
    try {
      localStorage.setItem('scheduleDemoOrder', JSON.stringify(ids));
    } catch {
      // ignore
    }
    const undo = () => {
      queryClient.setQueryData(queryKeys.schedule.all, items);
      toast.success(t('undo_success'));
      try {
        localStorage.setItem('scheduleDemoOrder', JSON.stringify(items.map((i) => i.id)));
      } catch {
        // ignore
      }
    };
    // optimistic update is handled in onMutate, but we also set immediately for snappy UI
    queryClient.setQueryData(queryKeys.schedule.all, next);
    const tId = toast.loading(t('saving'));
    mutation.mutate(ids, {
      onSuccess: () => {
        toast.success(t('schedule_updated'), { id: tId, action: { label: t('undo'), onClick: undo } });
      },
      onError: () => {
        toast.error(t('schedule_update_failed'), { id: tId });
      },
      onSettled: () => {
        toast.dismiss(tId);
      },
    });
  }

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
          <Calendar className={`w-6 h-6 ${styles.icon}`} />
          <h1 className={`text-xl font-semibold ${styles.title}`}>{t('schedule')}</h1>
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
          <Calendar className={`w-6 h-6 ${styles.icon}`} />
          <h1 className={`text-xl font-semibold ${styles.title}`}>{t('schedule')}</h1>
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
          <Calendar className={`w-6 h-6 ${styles.icon}`} />
          <h1 className={`text-xl font-semibold ${styles.title}`}>{t('schedule')}</h1>
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

      <div className="card rounded-lg shadow-sm">
        <div className={`p-4 border-b ${styles.cardHeader}`}>
          <div className={`flex items-center gap-2 ${styles.cardHeaderContent}`}>
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{t('todays_schedule')}</span>
          </div>
        </div>
        <div className="p-4">
          {data ? (
            <div className="space-y-4">
              {items.length > 0 ? (
                items.map((item: ScheduleItem, index: number) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-full text-left flex items-center gap-4 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${styles.scheduleItem}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', String(index));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = Number(e.dataTransfer.getData('text/plain'));
                      const to = index;
                      if (!Number.isNaN(from)) handleReorder(from, to);
                    }}
                  >
                    <div className="flex-shrink-0 w-20 text-center">
                      <div className={`text-sm font-medium ${styles.timeText}`}>{formatTime(item.time)}</div>
                      <div className={`text-xs ${styles.durationText}`}>
                        {item.duration} {t('minutes')}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${styles.subjectText}`}>{item.subject}</div>
                      <div className={`flex items-center gap-4 mt-1 text-sm ${styles.metaText}`}>
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
                  </button>
                ))
              ) : (
                <div className={`text-center py-8 ${styles.emptyStateText}`}>
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p>{t('no_classes_today')}</p>
                </div>
              )}
            </div>
          ) : (
            <div className={`text-center py-8 ${styles.emptyStateText}`}>
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
