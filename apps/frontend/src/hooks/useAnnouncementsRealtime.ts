import { useEffect } from 'react';
import { queryClient } from '../queryClient';
import { subscribeAnnouncementsRealtime } from '../realtime/announcements';
import { useAuth } from '../auth/useAuth';

export function useAnnouncementsRealtime(): void {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    const sub = subscribeAnnouncementsRealtime(() => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    });
    return () => sub.stop();
  }, [user?.id]);
}
