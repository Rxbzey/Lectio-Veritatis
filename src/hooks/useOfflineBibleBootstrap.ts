import { useEffect } from 'react';
import { warmOfflineBooksCache, warmOfflineChaptersCache } from '@/lib/api';

export function useOfflineBibleBootstrap() {
  useEffect(() => {
    const abortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let warmupTimeout: number | null = null;

    const scheduleChaptersWarmup = () => {
      if (typeof window === 'undefined') return;
      warmupTimeout = window.setTimeout(() => {
        void warmOfflineChaptersCache({
          signal: abortController?.signal,
          batchSize: 6,
          onProgress: ({ processedChapters, totalChapters }) => {
            if (!import.meta.env.DEV) return;
            const pct = Math.round((processedChapters / totalChapters) * 100);
            if (pct % 10 === 0) {
              console.info(`[offline] precached ${pct}% de capítulos`);
            }
          },
        }).catch((error) => {
          if (!abortController?.signal.aborted) {
            console.warn('Failed warming chapter cache', error);
          }
        });
      }, 2000);
    };

    void warmOfflineBooksCache()
      .catch((error) => {
        console.warn('Failed warming offline book cache', error);
      })
      .finally(scheduleChaptersWarmup);

    return () => {
      abortController?.abort();
      if (warmupTimeout !== null && typeof window !== 'undefined') {
        window.clearTimeout(warmupTimeout);
      }
    };
  }, []);
}
