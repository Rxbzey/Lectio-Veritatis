import { useCallback, useRef } from 'react';
import gsap from 'gsap';
import type { SearchResult } from '@/lib/api';
import { useNavigationOrbSearch } from '@/hooks/useNavigationOrbSearch';
import { useNavigationOrbAnimations } from '@/hooks/useNavigationOrbAnimations';
import { useBooks } from '@/hooks/useBooks';
import { useOrbSelection } from '@/hooks/useOrbSelection';
import { useVerseTotal } from '@/hooks/useVerseTotal';
import { useBookHover } from '@/hooks/useBookHover';
import { useSearchInputFocus } from '@/hooks/useSearchInputFocus';
import { NavigationOrbSearchPanel } from '@/components/NavigationOrbSearchPanel';
import { NavigationOrbHeader } from '@/components/NavigationOrbHeader';
import { NavigationOrbRomanWatermark } from '@/components/NavigationOrbRomanWatermark';
import { NavigationOrbBooksView } from '@/components/NavigationOrbBooksView';
import { NavigationOrbChaptersView } from '@/components/NavigationOrbChaptersView';
import { NavigationOrbVersesView } from '@/components/NavigationOrbVersesView';
import type { ChapterStatus, BookStatus } from '@/hooks/useReadingProgress';

interface NavigationOrbProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (abbrev: string, chapter: number, verse?: number | null) => void;
  currentBook: string;
  currentChapter: number;
  currentVerse?: number | null;
  initialBook?: string | null;
  initialChapter?: number | null;
  currentChapterTotalVerses?: number;
  getChapterStatus?: (book: string, chapter: number) => ChapterStatus;
  getBookStatus?: (book: string, totalChapters: number) => BookStatus;
  initialMode?: 'index' | 'search';
  onSearchNavigate?: (abbrev: string, chapter: number, verse: number, query: string) => void;
  isOnline?: boolean;
}

export function NavigationOrb({
  isOpen,
  onClose,
  onNavigate,
  currentBook,
  currentChapter,
  currentVerse = null,
  initialBook = null,
  initialChapter = null,
  currentChapterTotalVerses = 0,
  getChapterStatus,
  getBookStatus,
  initialMode = 'index',
  onSearchNavigate,
  isOnline = true,
}: NavigationOrbProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const mode = initialMode;
  const books = useBooks();

  const {
    selectedBook,
    selectedChapter,
    selectedBookChapters,
    selectBook,
    selectChapter,
    backToChapters,
    backToBooks,
    reset: resetSelection,
  } = useOrbSelection({ isOpen, mode, books, initialBook, initialChapter });

  const { verseTotal, verseTotalLoading } = useVerseTotal({
    selectedBook,
    selectedChapter,
    currentBook,
    currentChapter,
    currentChapterTotalVerses,
  });

  const { hoveredBook, hoveredIndex, handleBookEnter, handleBookLeave, resetHover } = useBookHover();

  const {
    query,
    debouncedQuery,
    searchResults,
    searchStatus,
    searchError,
    hasSearched,
    handleSearchInput,
    clearSearchState,
    showHelper,
    searchStatusLabel,
  } = useNavigationOrbSearch({ mode });

  useSearchInputFocus(searchInputRef, mode);
  useNavigationOrbAnimations(panelRef, closeRef, isOpen, selectedBook);

  const handleClose = useCallback(() => {
    const finishClose = () => {
      onClose();
      clearSearchState();
      resetSelection();
      resetHover();
    };

    if (panelRef.current) {
      gsap.to(panelRef.current, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: finishClose,
      });
    } else {
      finishClose();
    }
  }, [onClose, clearSearchState, resetSelection, resetHover]);

  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
      const activeQuery = debouncedQuery || query.trim();
      if (onSearchNavigate) {
        onSearchNavigate(result.book.abbrev.pt, result.chapter, result.number, activeQuery);
      } else {
        onNavigate(result.book.abbrev.pt, result.chapter);
      }
      handleClose();
    },
    [debouncedQuery, onNavigate, onSearchNavigate, query, handleClose],
  );

  const handleVerseSelect = useCallback(
    (verse: number) => {
      if (!selectedBook || selectedChapter == null) return;
      const book = selectedBook;
      const chapter = selectedChapter;

      const finishClose = () => {
        onClose();
        clearSearchState();
        resetSelection();
        resetHover();
        onNavigate(book, chapter, verse);
      };

      if (panelRef.current) {
        gsap.to(panelRef.current, {
          opacity: 0,
          duration: 0.4,
          ease: 'power2.in',
          onComplete: finishClose,
        });
      } else {
        finishClose();
      }
    },
    [selectedBook, selectedChapter, onNavigate, onClose, clearSearchState, resetSelection, resetHover],
  );

  if (!isOpen) return null;

  const showRomanWatermark = mode === 'index' && hoveredIndex >= 0 && !selectedBook;

  return (
    <div
      ref={panelRef}
      className="fixed inset-0 z-50 bg-black/97 backdrop-blur-2xl flex flex-col overflow-hidden"
      style={{ opacity: 0 }}
    >
      <NavigationOrbHeader
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        mode={mode}
        books={books}
        closeRef={closeRef}
        onClose={handleClose}
      />

      {showRomanWatermark && <NavigationOrbRomanWatermark index={hoveredIndex} />}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ padding: '3rem 10vw 6rem' }}
        data-lenis-prevent
      >
        {mode === 'search' ? (
          <NavigationOrbSearchPanel
            searchInputRef={searchInputRef}
            query={query}
            onQueryChange={handleSearchInput}
            isOnline={isOnline}
            searchStatusLabel={searchStatusLabel}
            showHelper={showHelper}
            searchStatus={searchStatus}
            searchError={searchError}
            hasSearched={hasSearched}
            debouncedQuery={debouncedQuery}
            searchResults={searchResults}
            onSelectResult={handleSearchResultSelect}
          />
        ) : !selectedBook ? (
          <NavigationOrbBooksView
            books={books}
            currentBook={currentBook}
            hoveredBook={hoveredBook}
            getBookStatus={getBookStatus}
            getChapterStatus={getChapterStatus}
            onBookClick={(book) => selectBook(book.abbrev.pt)}
            onBookEnter={handleBookEnter}
            onBookLeave={handleBookLeave}
          />
        ) : selectedChapter == null ? (
          <NavigationOrbChaptersView
            selectedBook={selectedBook}
            totalChapters={selectedBookChapters}
            currentBook={currentBook}
            currentChapter={currentChapter}
            getChapterStatus={getChapterStatus}
            onChapterSelect={selectChapter}
            onBackToBooks={backToBooks}
          />
        ) : (
          <NavigationOrbVersesView
            selectedBook={selectedBook}
            selectedChapter={selectedChapter}
            currentBook={currentBook}
            currentChapter={currentChapter}
            currentVerse={currentVerse}
            verseTotal={verseTotal}
            isLoading={verseTotalLoading}
            onVerseSelect={handleVerseSelect}
            onBackToBooks={backToBooks}
            onBackToChapters={backToChapters}
          />
        )}
      </div>
    </div>
  );
}
