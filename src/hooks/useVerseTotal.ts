import { useEffect, useState } from 'react';
import { getChapter } from '@/lib/api';

interface UseVerseTotalParams {
  selectedBook: string | null;
  selectedChapter: number | null;
  currentBook: string;
  currentChapter: number;
  currentChapterTotalVerses: number;
}

interface FetchedVerses {
  book: string;
  chapter: number;
  total: number;
}

/**
 * Resolves the total number of verses for the currently selected book/chapter.
 * - If selection matches the currently open chapter, reuses the known total.
 * - Otherwise fetches on demand and caches the last result.
 * All synchronous cases are derived during render to avoid cascading renders
 * from calling setState inside effect bodies.
 */
export function useVerseTotal({
  selectedBook,
  selectedChapter,
  currentBook,
  currentChapter,
  currentChapterTotalVerses,
}: UseVerseTotalParams) {
  const [fetchedVerses, setFetchedVerses] = useState<FetchedVerses | null>(null);

  const hasCurrentChapterTotal =
    selectedBook != null &&
    selectedChapter != null &&
    selectedBook === currentBook &&
    selectedChapter === currentChapter &&
    currentChapterTotalVerses > 0;

  const hasFetchedMatch =
    !!fetchedVerses &&
    fetchedVerses.book === selectedBook &&
    fetchedVerses.chapter === selectedChapter;

  const needsFetch =
    selectedBook != null && selectedChapter != null && !hasCurrentChapterTotal;

  const verseTotal =
    selectedBook == null || selectedChapter == null
      ? 0
      : hasCurrentChapterTotal
      ? currentChapterTotalVerses
      : hasFetchedMatch
      ? fetchedVerses!.total
      : 0;

  const verseTotalLoading = needsFetch && !hasFetchedMatch;

  useEffect(() => {
    if (!needsFetch || !selectedBook || selectedChapter == null) return;
    if (hasFetchedMatch) return;

    let cancelled = false;
    getChapter(selectedBook, selectedChapter)
      .then((data) => {
        if (cancelled) return;
        setFetchedVerses({ book: selectedBook, chapter: selectedChapter, total: data.verses.length });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setFetchedVerses({ book: selectedBook, chapter: selectedChapter, total: 0 });
      });

    return () => {
      cancelled = true;
    };
  }, [needsFetch, hasFetchedMatch, selectedBook, selectedChapter]);

  return { verseTotal, verseTotalLoading };
}
