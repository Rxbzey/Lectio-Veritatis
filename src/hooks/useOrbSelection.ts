import { useCallback, useState } from 'react';
import type { Book } from '@/lib/api';

interface UseOrbSelectionParams {
  isOpen: boolean;
  mode: 'index' | 'search';
  books: Book[];
  initialBook: string | null;
  initialChapter: number | null;
}

export function useOrbSelection({ isOpen, mode, books, initialBook, initialChapter }: UseOrbSelectionParams) {
  const [manualSelectedBook, setManualSelectedBook] = useState<string | null>(null);
  const [manualSelectedChapter, setManualSelectedChapter] = useState<number | null>(null);
  const [manualChapterTouched, setManualChapterTouched] = useState(false);

  const selectedBookBase = manualSelectedBook ?? (isOpen ? initialBook : null);
  const selectedBook = mode === 'search' ? null : selectedBookBase;
  const selectedBookData = books.find((b) => b.abbrev.pt === selectedBook);
  const selectedBookChapters = selectedBookData?.chapters ?? 0;

  const selectedChapterBase = manualChapterTouched
    ? manualSelectedChapter
    : isOpen
    ? initialChapter
    : null;
  const selectedChapter = mode === 'search' || !selectedBook ? null : selectedChapterBase;

  const selectBook = useCallback((book: string) => {
    setManualSelectedBook(book);
    setManualSelectedChapter(null);
    setManualChapterTouched(true);
  }, []);

  const selectChapter = useCallback((chapter: number) => {
    setManualSelectedChapter(chapter);
    setManualChapterTouched(true);
  }, []);

  const backToChapters = useCallback(() => {
    setManualSelectedChapter(null);
    setManualChapterTouched(true);
  }, []);

  const backToBooks = useCallback(() => {
    setManualSelectedBook(null);
    setManualSelectedChapter(null);
    setManualChapterTouched(true);
  }, []);

  const reset = useCallback(() => {
    setManualSelectedBook(null);
    setManualSelectedChapter(null);
    setManualChapterTouched(false);
  }, []);

  return {
    selectedBook,
    selectedChapter,
    selectedBookData,
    selectedBookChapters,
    selectBook,
    selectChapter,
    backToChapters,
    backToBooks,
    reset,
  };
}
