import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import type { Book, SearchResult } from '@/lib/api';
import { getBooks } from '@/lib/api';
import { useNavigationOrbSearch } from '@/hooks/useNavigationOrbSearch';
import { NavigationOrbSearchPanel } from '@/components/NavigationOrbSearchPanel';
import { BookIndexGrid } from '@/components/BookIndexGrid';
import { ChapterGrid } from '@/components/ChapterGrid';
import type { ChapterStatus, BookStatus } from '@/hooks/useReadingProgress';
import { toRoman } from '@/utils/toRoman';

interface NavigationOrbProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (abbrev: string, chapter: number) => void;
  currentBook: string;
  currentChapter: number;
  initialBook?: string | null;
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
  initialBook = null,
  getChapterStatus,
  getBookStatus,
  initialMode = 'index',
  onSearchNavigate,
  isOnline = true,
}: NavigationOrbProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [hoveredBook, setHoveredBook] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const [manualSelectedBook, setManualSelectedBook] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mode = initialMode;
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
    renderHighlightedText,
  } = useNavigationOrbSearch({ mode });

  useEffect(() => {
    getBooks().then(setBooks).catch(console.error);
  }, []);

  useEffect(() => {
    if (mode !== 'search') return;
    const timer = setTimeout(() => searchInputRef.current?.focus(), 200);
    return () => clearTimeout(timer);
  }, [mode]);

  const selectedBookBase = manualSelectedBook ?? (isOpen ? initialBook : null);
  const selectedBook = mode === 'search' ? null : selectedBookBase;
  const selectedBookData = books.find((b) => b.abbrev.pt === selectedBook);
  const selectedBookChapters = selectedBookData?.chapters ?? 0;
  const handleClose = useCallback(() => {
    const finishClose = () => {
      onClose();
      clearSearchState();
      setManualSelectedBook(null);
      setHoveredBook(null);
      setHoveredIndex(-1);
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
  }, [onClose, clearSearchState]);

  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    const activeQuery = debouncedQuery || query.trim();
    if (onSearchNavigate) {
      onSearchNavigate(result.book.abbrev.pt, result.chapter, result.number, activeQuery);
    } else {
      onNavigate(result.book.abbrev.pt, result.chapter);
    }
    handleClose();
  }, [debouncedQuery, onNavigate, onSearchNavigate, query, handleClose]);

  const renderSearchMode = () => (
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
      renderHighlightedText={renderHighlightedText}
    />
  );

  // Panel enter animation — stagger cascade
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const panel = panelRef.current;
    const tl = gsap.timeline();

    // Fade in backdrop
    tl.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });

    // Header elements
    const header = panel.querySelector('.idx-header');
    if (header) {
      tl.fromTo(header, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.2);
    }

    // Section titles
    const sectionTitles = panel.querySelectorAll('.section-title');
    if (sectionTitles.length > 0) {
      tl.fromTo(
        sectionTitles,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out' },
        0.35
      );
    }

    // Book items — stagger cascade row by row
    const items = panel.querySelectorAll('.book-item');
    if (items.length > 0) {
      tl.fromTo(
        items,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.02, ease: 'power3.out' },
        0.45
      );
    }

    // Divider
    const divider = panel.querySelector('.testament-divider');
    if (divider) {
      tl.fromTo(divider, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'expo.out' }, 0.6);
    }

    return () => { tl.kill(); };
  }, [isOpen, selectedBook]);

  // Close button hover rotation
  useEffect(() => {
    if (!closeRef.current) return;
    const btn = closeRef.current;
    const icon = btn.querySelector('.close-icon') as HTMLElement;
    if (!icon) return;

    const onEnter = () => gsap.to(icon, { rotation: 90, duration: 0.5, ease: 'power3.out' });
    const onLeave = () => gsap.to(icon, { rotation: 0, duration: 0.5, ease: 'power3.out' });

    btn.addEventListener('mouseenter', onEnter);
    btn.addEventListener('mouseleave', onLeave);
    return () => {
      btn.removeEventListener('mouseenter', onEnter);
      btn.removeEventListener('mouseleave', onLeave);
    };
  }, [isOpen]);

  // GSAP hover effect for book items
  const handleBookEnter = useCallback((e: React.MouseEvent, book: Book, index: number) => {
    setHoveredBook(book.abbrev.pt);
    setHoveredIndex(index);
    const target = e.currentTarget as HTMLElement;
    const nameEl = target.querySelector('.book-name');
    if (nameEl) {
      gsap.to(nameEl, { opacity: 1, x: 4, duration: 0.6, ease: 'power3.out' });
    }
  }, []);

  const handleBookLeave = useCallback((e: React.MouseEvent) => {
    setHoveredBook(null);
    setHoveredIndex(-1);
    const target = e.currentTarget as HTMLElement;
    const nameEl = target.querySelector('.book-name');
    if (nameEl) {
      gsap.to(nameEl, { opacity: 0.45, x: 0, duration: 0.5, ease: 'power2.inOut' });
    }
  }, []);

  const handleBookClick = (book: Book) => {
    setManualSelectedBook(book.abbrev.pt);
  };

  const handleChapterSelect = (chapter: number) => {
    if (selectedBook) {
      onNavigate(selectedBook, chapter);
      handleClose();
    }
  };



  const otBooks = books.filter((b) => b.testament === 'VT');
  const ntBooks = books.filter((b) => b.testament === 'NT');

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed inset-0 z-50 bg-black/97 backdrop-blur-2xl flex flex-col overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* Header — editorial style */}
      <div className="idx-header flex items-end justify-between shrink-0"
        style={{ padding: '3rem 10vw 0' }}
      >
        <div>
          <p className="font-sans text-[9px] md:text-[10px] tracking-[0.5em] uppercase text-gold/50 mb-3">
            {selectedBook
              ? 'Selecciona capítulo'
              : mode === 'search'
              ? 'Motor de búsqueda'
              : 'Índice Tipográfico'}
          </p>
          <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-cream/90 tracking-tight leading-none">
            {selectedBook
              ? books.find((b) => b.abbrev.pt === selectedBook)?.name || ''
              : mode === 'search'
              ? 'Buscar en las Escrituras'
              : 'Escrituras'}
          </h2>
        </div>

        {/* Minimal close — two lines, no circle, rotate on hover */}
        <button
          ref={closeRef}
          onClick={handleClose}
          className="cursor-pointer group mb-2"
          aria-label="Cerrar"
          data-cursor-hover
        >
          <div className="close-icon w-6 h-6 relative">
            <span className="block w-full h-px bg-cream/30 absolute top-1/2 left-0 rotate-45 group-hover:bg-gold transition-colors duration-500" />
            <span className="block w-full h-px bg-cream/30 absolute top-1/2 left-0 -rotate-45 group-hover:bg-gold transition-colors duration-500" />
          </div>
        </button>
      </div>

      {/* Hovered roman numeral — large background watermark */}
      {mode === 'index' && hoveredIndex >= 0 && !selectedBook && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span
            className="font-serif leading-none"
            style={{
              fontSize: 'clamp(12rem, 28vw, 36rem)',
              color: 'rgba(201,168,76,0.025)',
            }}
          >
            {toRoman(hoveredIndex + 1)}
          </span>
        </div>
      )}

      {/* Content — massive lateral margins */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ padding: '3rem 10vw 6rem' }}
        data-lenis-prevent
      >
        {mode === 'search' ? (
          renderSearchMode()
        ) : !selectedBook ? (
          <>
            <BookIndexGrid
              bookList={otBooks}
              label="Antiguo Testamento"
              startIndex={0}
              currentBook={currentBook}
              hoveredBook={hoveredBook}
              getBookStatus={getBookStatus}
              onBookClick={handleBookClick}
              onBookEnter={handleBookEnter}
              onBookLeave={handleBookLeave}
            />

            {/* Testament divider — ultra thin */}
            <div className="testament-divider flex items-center gap-8 my-12 md:my-16 origin-left" style={{ transformOrigin: 'left center' }}>
              <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.08)' }} />
              <span className="font-serif text-[10px] tracking-[0.5em] uppercase text-gold/15 italic">
                ✝
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.08)' }} />
            </div>

            <BookIndexGrid
              bookList={ntBooks}
              label="Nuevo Testamento"
              startIndex={otBooks.length}
              currentBook={currentBook}
              hoveredBook={hoveredBook}
              getBookStatus={getBookStatus}
              onBookClick={handleBookClick}
              onBookEnter={handleBookEnter}
              onBookLeave={handleBookLeave}
            />
          </>
        ) : (
          <div>
            <button
              onClick={() => setManualSelectedBook(null)}
              className="font-sans text-[10px] tracking-[0.35em] uppercase text-cream/55 hover:text-gold mb-14 cursor-pointer transition-colors duration-500 flex items-center gap-4"
              data-cursor-hover
            >
              <span className="w-5 h-px bg-current" />
              Volver al índice
            </button>

            <ChapterGrid
              totalChapters={selectedBookChapters}
              selectedBook={selectedBook}
              currentBook={currentBook}
              currentChapter={currentChapter}
              getChapterStatus={getChapterStatus}
              onChapterSelect={handleChapterSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
