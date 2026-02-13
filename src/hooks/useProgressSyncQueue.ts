import { useEffect, useRef } from 'react';
import { drainProgressSyncQueue, type ProgressSyncEvent } from '../storage/offlineBibleCache';

async function syncProgressEvent(event: ProgressSyncEvent): Promise<boolean> {
  // Placeholder for future backend sync.
  // Keeping this async boundary makes the queue mechanism production-ready.
  void event;
  return true;
}

export function useProgressSyncQueue(isOnline: boolean) {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!isOnline || isSyncingRef.current) return;

    let cancelled = false;
    isSyncingRef.current = true;

    const syncQueue = async () => {
      try {
        await drainProgressSyncQueue(async (event) => {
          if (cancelled) return false;
          return syncProgressEvent(event);
        });
      } finally {
        isSyncingRef.current = false;
      }
    };

    void syncQueue();

    return () => {
      cancelled = true;
    };
  }, [isOnline]);
}
