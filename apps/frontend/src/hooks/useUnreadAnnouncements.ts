import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAnnouncements } from '../api/announcements';
import { useAuth } from '../auth/useAuth';

const LS_KEY = (userId: string) => `unread_announcements:last_seen:${userId}`;

export function getAnnouncementsLastSeenMs(userId: string): number {
  const raw = localStorage.getItem(LS_KEY(userId));
  const ms = raw ? Number(raw) : 0;
  return Number.isFinite(ms) ? ms : 0;
}

export function setAnnouncementsLastSeenNow(userId: string): void {
  localStorage.setItem(LS_KEY(userId), String(Date.now()));
}

export function useUnreadAnnouncements(): { count: number; markSeenNow: () => void } {
  const { user } = useAuth();
  const userId = user?.id;
  const [lastSeen, setLastSeen] = useState<number>(0);

  useEffect(() => {
    if (userId) {
      setLastSeen(getAnnouncementsLastSeenMs(userId));
    } else {
      setLastSeen(0);
    }
  }, [userId]);

  const { data } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => listAnnouncements(),
    refetchInterval: 30_000,
    enabled: Boolean(userId),
    staleTime: 15_000,
  });

  const count = useMemo(() => {
    if (!userId) return 0;
    const now = Date.now();
    return (data ?? []).filter((a) => {
      const t = typeof a.publishAt === 'string' ? Date.parse(a.publishAt) : a.publishAt.getTime();
      return Number.isFinite(t) && t <= now && t > lastSeen;
    }).length;
  }, [data, userId, lastSeen]);

  const markSeenNow = () => {
    if (!userId) return;
    setAnnouncementsLastSeenNow(userId);
    setLastSeen(Date.now());
  };

  return { count, markSeenNow };
}
