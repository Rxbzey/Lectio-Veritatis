import { useMemo } from 'react';
import { useLocation } from 'wouter';

export type AppView = 'home' | 'reader';

export interface AppRoute {
  view: AppView;
  book: string;
  chapter: number;
  verse: number | null;
  verseEnd: number | null;
}

export const DEFAULT_ROUTE: AppRoute = {
  view: 'home',
  book: 'genesis',
  chapter: 1,
  verse: null,
  verseEnd: null,
};

function isValidSlug(value: string): boolean {
  return /^[a-z0-9-]+$/.test(value);
}

export function parseRoute(path: string): AppRoute {
  const [cleanPath] = path.split('?');
  const parts = cleanPath.split('/').filter(Boolean);
  if (parts.length === 0) return DEFAULT_ROUTE;

  const [rawBook, rawChapter, rawVerse] = parts;
  if (!rawBook || !isValidSlug(rawBook)) return DEFAULT_ROUTE;

  const chapter = Number(rawChapter);
  if (!rawChapter || !Number.isInteger(chapter) || chapter < 1) return DEFAULT_ROUTE;

  let verse: number | null = null;
  let verseEnd: number | null = null;
  if (rawVerse) {
    const rangeMatch = rawVerse.match(/^(\d+)(?:-(\d+))?$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      if (Number.isInteger(start) && start > 0) {
        verse = start;
        if (rangeMatch[2]) {
          const end = Number(rangeMatch[2]);
          if (Number.isInteger(end) && end >= start) {
            verseEnd = end;
          }
        }
      }
    }
  }

  return {
    view: 'reader',
    book: rawBook,
    chapter,
    verse,
    verseEnd,
  };
}

export function pathFor(
  book: string,
  chapter: number,
  verse?: number | null,
  verseEnd?: number | null,
): string {
  if (!book) return '/';
  if (verse && verse > 0) {
    if (verseEnd && verseEnd > verse) {
      return `/${book}/${chapter}/${verse}-${verseEnd}`;
    }
    return `/${book}/${chapter}/${verse}`;
  }
  return `/${book}/${chapter}`;
}

export function useAppRoute(): AppRoute {
  const [location] = useLocation();
  return useMemo(() => parseRoute(location), [location]);
}
