import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChapterStatus = 'unread' | 'in-progress' | 'completed';
export type BookStatus = 'unread' | 'in-progress' | 'completed';

export interface ChapterProgress {
  status: ChapterStatus;
  scrollPct: number;
  lastVerse: number;
  updatedAt: number;
}

export interface BookProgress {
  chapters: Record<number, ChapterProgress>;
}

export interface ReadingProgressData {
  books: Record<string, BookProgress>;
  lastPosition: {
    book: string;
    chapter: number;
  } | null;
}

export interface ReadingProgressStore extends ReadingProgressData {
  updateChapterScroll: (book: string, chapter: number, scrollPct: number, lastVerse: number, totalVerses: number) => void;
  markChapterCompleted: (book: string, chapter: number, lastVerse?: number) => void;
  getChapterStatus: (book: string, chapter: number) => ChapterStatus;
  getChapterScrollPct: (book: string, chapter: number) => number;
  getChapterLastVerse: (book: string, chapter: number) => number;
  getBookStatus: (book: string, totalChapters: number) => BookStatus;
  setLastPosition: (book: string, chapter: number) => void;
  getLastPosition: () => { book: string; chapter: number } | null;
}

const STORAGE_KEY = 'living-scripture-reading-progress:v1';

export const useReadingProgressStore = create<ReadingProgressStore>()(
  persist(
    (set, get) => ({
      books: {},
      lastPosition: null,

      updateChapterScroll: (book, chapter, scrollPct, lastVerse, totalVerses) =>
        set((state) => {
          const currentBook = state.books[book];
          const currentChapters = currentBook?.chapters ?? {};
          const existing = currentChapters[chapter];

          if (existing?.status === 'completed') return state;

          const newStatus: ChapterStatus =
            scrollPct >= 0.92 || lastVerse >= totalVerses ? 'completed' : 'in-progress';

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
          };
        }),

      markChapterCompleted: (book, chapter, lastVerse) =>
        set((state) => {
          const currentBook = state.books[book];
          const currentChapters = currentBook?.chapters ?? {};
          const existing = currentChapters[chapter];

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
          };
        }),

      getChapterStatus: (book, chapter) => get().books[book]?.chapters[chapter]?.status ?? 'unread',
      getChapterScrollPct: (book, chapter) => get().books[book]?.chapters[chapter]?.scrollPct ?? 0,
      getChapterLastVerse: (book, chapter) => get().books[book]?.chapters[chapter]?.lastVerse ?? 0,

      getBookStatus: (book, totalChapters) => {
        const bp = get().books[book];
        if (!bp) return 'unread';

        const chapters = bp.chapters;
        const chapterNumbers = Object.keys(chapters).map(Number);
        if (chapterNumbers.length === 0) return 'unread';

        const completedCount = chapterNumbers.filter(
          (ch) => chapters[ch]?.status === 'completed'
        ).length;

        if (completedCount >= totalChapters) return 'completed';
        return 'in-progress';
      },

      setLastPosition: (book, chapter) =>
        set((state) => ({
          ...state,
          lastPosition: { book, chapter },
        })),

      getLastPosition: () => get().lastPosition,
    }),
    { name: STORAGE_KEY }
  )
);
