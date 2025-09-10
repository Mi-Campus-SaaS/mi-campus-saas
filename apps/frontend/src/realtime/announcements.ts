import { buildSseUrl } from '../api/client';

export type AnnouncementEvent = {
  type: 'created' | 'updated' | 'deleted' | 'published';
  id: string;
  at: number;
};

export type RealtimeHandle = {
  stop: () => void;
};

/**
 * Connects to SSE endpoint if available; falls back to polling callback.
 * The callback should invalidate queries or update state.
 */
export function subscribeAnnouncementsRealtime(
  onEvent: (evt: AnnouncementEvent) => void,
  options?: { pollMs?: number },
): RealtimeHandle {
  const pollMs = options?.pollMs ?? 30_000;
  let stopped = false;
  let pollTimer: number | undefined;

  // Try SSE first
  let source: EventSource | null = null;
  try {
    const url = buildSseUrl('/announcements/stream');
    source = new EventSource(url, { withCredentials: false });
  } catch {
    // ignore
  }

  const startPolling = () => {
    const tick = () => {
      if (stopped) return;
      onEvent({ type: 'updated', id: 'poll', at: Date.now() });
      pollTimer = window.setTimeout(tick, pollMs);
    };
    pollTimer = window.setTimeout(tick, pollMs);
  };

  if (source) {
    const onMessage = (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data) as AnnouncementEvent | AnnouncementEvent[];
        if (Array.isArray(parsed)) parsed.forEach(onEvent);
        else onEvent(parsed);
      } catch {
        // unknown payload; trigger a generic refresh
        onEvent({ type: 'updated', id: 'unknown', at: Date.now() });
      }
    };
    const onError = () => {
      // SSE failed; close and fallback to polling
      source?.close();
      startPolling();
    };
    source.addEventListener('message', onMessage);
    source.addEventListener('error', onError);

    return {
      stop: () => {
        stopped = true;
        source?.removeEventListener('message', onMessage as EventListener);
        source?.removeEventListener('error', onError as EventListener);
        source?.close();
        if (pollTimer) window.clearTimeout(pollTimer);
      },
    };
  }

  // If SSE couldn't initialize, start polling immediately
  startPolling();
  return {
    stop: () => {
      stopped = true;
      if (pollTimer) window.clearTimeout(pollTimer);
    },
  };
}
