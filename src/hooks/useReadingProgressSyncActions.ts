import { useCallback } from 'react';
import { enqueueProgressSyncEvent } from '@/storage/offlineBibleCache';
import { useReadingProgressStore } from '@/hooks/useReadingProgress';

export function useReadingProgressSyncActions(isOnline: boolean) {
  const markChapterCompletedInStore = useReadingProgressStore((state) => state.markChapterCompleted);

  const markChapterCompleted = useCallback((book: string, chapter: number, lastVerse?: number) => {
    markChapterCompletedInStore(book, chapter, lastVerse);

    if (isOnline) return;

    void enqueueProgressSyncEvent({
      type: 'chapter-completed',
      payload: { book, chapter, lastVerse },
      createdAt: Date.now(),
    });
  }, [isOnline, markChapterCompletedInStore]);

  return {
    markChapterCompleted,
  };
}
