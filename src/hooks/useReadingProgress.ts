import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChapterStatus = 'unread' | 'in-progress' | 'completed';
export type BookStatus = 'unread' | 'in-progress' | 'completed';

interface ChapterProgress {
  status: ChapterStatus;
  scrollPct: number;
  lastVerse: number;
  updatedAt: number;
}

interface BookProgress {
  chapters: Record<number, ChapterProgress>;
}

interface BookSummary {
  tracked: number;
  completed: number;
}

interface ReadingProgressData {
  books: Record<string, BookProgress>;
  summaries: Record<string, BookSummary>;
  lastPosition: {
    book: string;
    chapter: number;
  } | null;
}

interface ReadingProgressStore extends ReadingProgressData {
  updateChapterScroll: (book: string, chapter: number, scrollPct: number, lastVerse: number, totalVerses: number) => void;
  markChapterCompleted: (book: string, chapter: number, lastVerse?: number) => void;
  getChapterStatus: (book: string, chapter: number) => ChapterStatus;
  getChapterScrollPct: (book: string, chapter: number) => number;
  getChapterLastVerse: (book: string, chapter: number) => number;
  getBookStatus: (book: string, totalChapters: number) => BookStatus;
  setLastPosition: (book: string, chapter: number) => void;
  getLastPosition: () => { book: string; chapter: number } | null;
  getResumeTarget: () => { book: string; chapter: number } | null;
}

let lastComputedLatest: { book: string; chapter: number } | null = null;

function getStableLatestChapter(books: Record<string, BookProgress>) {
  const next = computeLatestChapter(books);
  if (
    next === lastComputedLatest ||
    (next != null &&
      lastComputedLatest != null &&
      next.book === lastComputedLatest.book &&
      next.chapter === lastComputedLatest.chapter)
  ) {
    return lastComputedLatest;
  }
  lastComputedLatest = next;
  return next;
}

export const selectResumeTarget = (state: ReadingProgressStore) =>
  state.lastPosition ?? getStableLatestChapter(state.books);

const STORAGE_KEY = 'living-scripture-reading-progress:v2';

const initialState: ReadingProgressData = {
  books: {},
  summaries: {},
  lastPosition: null,
};

export const useReadingProgressStore = create<ReadingProgressStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      updateChapterScroll: (book, chapter, scrollPct, lastVerse, totalVerses) =>
        set((state) => {
          const currentBook = state.books[book];
          const currentChapters = currentBook?.chapters ?? {};
          const existing = currentChapters[chapter];

          if (existing?.status === 'completed') return state;

          const newStatus: ChapterStatus =
            scrollPct >= 0.92 || lastVerse >= totalVerses ? 'completed' : 'in-progress';
          const prevStatus: ChapterStatus = existing?.status ?? 'unread';

          return {
            ...state,
            books: {
              ...state.books,
              [book]: {
                chapters: {
                  ...currentChapters,
                  [chapter]: {
                    status: newStatus,
                    scrollPct,
                    lastVerse,
                    updatedAt: Date.now(),
                  },
                },
              },
            },
            summaries:
              prevStatus === newStatus
                ? state.summaries
                : applySummaryChange(
                    state.summaries,
                    book,
                    adjustSummary(state.summaries[book], prevStatus, newStatus)
                  ),
          };
        }),

      markChapterCompleted: (book, chapter, lastVerse) =>
        set((state) => {
          const currentBook = state.books[book];
          const currentChapters = currentBook?.chapters ?? {};
          const existing = currentChapters[chapter];
          const prevStatus: ChapterStatus = existing?.status ?? 'unread';

          if (prevStatus === 'completed') return state;

          return {
            ...state,
            books: {
              ...state.books,
              [book]: {
                chapters: {
                  ...currentChapters,
                  [chapter]: {
                    status: 'completed',
                    scrollPct: 1,
                    lastVerse: lastVerse ?? existing?.lastVerse ?? 0,
                    updatedAt: Date.now(),
                  },
                },
              },
            },
            summaries: applySummaryChange(
              state.summaries,
              book,
              adjustSummary(state.summaries[book], prevStatus, 'completed')
            ),
          };
        }),

      getChapterStatus: (book, chapter) => get().books[book]?.chapters[chapter]?.status ?? 'unread',
      getChapterScrollPct: (book, chapter) => get().books[book]?.chapters[chapter]?.scrollPct ?? 0,
      getChapterLastVerse: (book, chapter) => get().books[book]?.chapters[chapter]?.lastVerse ?? 0,

      getBookStatus: (book, totalChapters) => {
        const summary = get().summaries[book];
        if (!summary || summary.tracked === 0) return 'unread';
        if (summary.completed >= totalChapters) return 'completed';
        return 'in-progress';
      },

      setLastPosition: (book, chapter) =>
        set((state) => ({
          ...state,
          lastPosition: { book, chapter },
        })),

      getLastPosition: () => get().lastPosition,

      getResumeTarget: () => {
        const last = get().lastPosition;
        if (last) return last;
        return computeLatestChapter(get().books);
      },
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      partialize: (state) => ({
        books: state.books,
        summaries: state.summaries,
        lastPosition: state.lastPosition,
      }),
      migrate: (persisted, version) => {
        if (!persisted || typeof persisted !== 'object') {
          return initialState;
        }

        const stored = persisted as Partial<ReadingProgressData>;
        const books = stored.books ?? {};
        const lastPosition = stored.lastPosition ?? null;
        const summaries =
          version < 2 || !('summaries' in stored) || !stored.summaries
            ? buildSummaries(books)
            : stored.summaries;

        return {
          books,
          summaries,
          lastPosition,
        } satisfies ReadingProgressData;
      },
    }
  )
);

function adjustSummary(
  summary: BookSummary | undefined,
  prevStatus: ChapterStatus,
  nextStatus: ChapterStatus
): BookSummary | undefined {
  if (prevStatus === nextStatus) return summary;

  let tracked = summary?.tracked ?? 0;
  let completed = summary?.completed ?? 0;

  if (prevStatus === 'unread' && nextStatus !== 'unread') {
    tracked += 1;
  } else if (prevStatus !== 'unread' && nextStatus === 'unread') {
    tracked = Math.max(0, tracked - 1);
  }

  if (prevStatus !== 'completed' && nextStatus === 'completed') {
    completed += 1;
  } else if (prevStatus === 'completed' && nextStatus !== 'completed') {
    completed = Math.max(0, completed - 1);
  }

  if (tracked <= 0 && completed <= 0) return undefined;
  return { tracked, completed };
}

function applySummaryChange(
  summaries: Record<string, BookSummary>,
  book: string,
  nextSummary: BookSummary | undefined
): Record<string, BookSummary> {
  if (nextSummary === undefined) {
    if (!(book in summaries)) return summaries;
    const cloned = { ...summaries };
    delete cloned[book];
    return cloned;
  }
  return {
    ...summaries,
    [book]: nextSummary,
  };
}

function buildSummaries(books: Record<string, BookProgress>): Record<string, BookSummary> {
  const summaries: Record<string, BookSummary> = {};
  Object.entries(books).forEach(([book, progress]) => {
    let tracked = 0;
    let completed = 0;
    Object.values(progress.chapters).forEach((chapter) => {
      if (chapter.status !== 'unread') tracked += 1;
      if (chapter.status === 'completed') completed += 1;
    });
    if (tracked > 0 || completed > 0) {
      summaries[book] = { tracked, completed };
    }
  });
  return summaries;
}

function computeLatestChapter(books: Record<string, BookProgress>): { book: string; chapter: number } | null {
  let latest: { book: string; chapter: number; updatedAt: number } | null = null;
  Object.entries(books).forEach(([book, progress]) => {
    Object.entries(progress.chapters).forEach(([chapterStr, info]) => {
      if (!info) return;
      if (!latest || info.updatedAt > latest.updatedAt) {
        latest = { book, chapter: Number(chapterStr), updatedAt: info.updatedAt };
      }
    });
  });
  if (!latest) return null;
  const { book, chapter } = latest;
  return { book, chapter };
}
