import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import type { Book } from '../lib/api';
import { getBooks } from '../lib/api';

interface NavigationOrbProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (abbrev: string, chapter: number) => void;
  currentBook: string;
  currentChapter: number;
  initialBook?: string | null;
}

// Roman numeral converter
function toRoman(num: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) {
      result += syms[i];
      num -= vals[i];
    }
  }
  return result;
}

export function NavigationOrb({
  isOpen,
  onClose,
  onNavigate,
  currentBook,
  currentChapter,
  initialBook = null,
}: NavigationOrbProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [hoveredBook, setHoveredBook] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const [manualSelectedBook, setManualSelectedBook] = useState<string | null>(null);

  useEffect(() => {
    getBooks().then(setBooks).catch(console.error);
  }, []);

  const selectedBook = manualSelectedBook ?? (isOpen ? initialBook : null);
  const selectedBookData = books.find((b) => b.abbrev.pt === selectedBook);
  const selectedBookChapters = selectedBookData?.chapters ?? 0;

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
    tl.fromTo(
      sectionTitles,
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out' },
      0.35
    );

    // Book items — stagger cascade row by row
    const items = panel.querySelectorAll('.book-item');
    tl.fromTo(
      items,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.02, ease: 'power3.out' },
      0.45
    );

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

  const handleClose = () => {
    if (panelRef.current) {
      gsap.to(panelRef.current, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
          onClose();
          setManualSelectedBook(null);
          setHoveredBook(null);
          setHoveredIndex(-1);
        },
      });
    } else {
      onClose();
      setManualSelectedBook(null);
    }
  };

  const otBooks = books.filter((b) => b.testament === 'VT');
  const ntBooks = books.filter((b) => b.testament === 'NT');

  const renderEditorialGrid = (bookList: Book[], label: string, startIndex: number) => (
    <div className="mb-4">
      {/* Section title — small caps with heavy tracking */}
      <div className="section-title flex items-center gap-6 mb-10 md:mb-14">
        <h3
          className="font-sans text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-gold/40"
          style={{ fontVariant: 'small-caps' }}
        >
          {label}
        </h3>
        <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.06)' }} />
      </div>

      {/* Editorial asymmetric grid — 3 cols on md, 4 on lg */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-12 md:gap-x-16 lg:gap-x-20 gap-y-0">
        {bookList.map((book, i) => {
          const globalIdx = startIndex + i;
          const isActive = book.abbrev.pt === currentBook;
          const isHovered = hoveredBook === book.abbrev.pt;

          return (
            <button
              key={book.abbrev.pt}
              className="book-item relative text-left cursor-pointer py-3 md:py-4 overflow-hidden"
              onClick={() => handleBookClick(book)}
              onMouseEnter={(e) => handleBookEnter(e, book, globalIdx)}
              onMouseLeave={handleBookLeave}
              data-cursor-hover
            >
              {/* Roman numeral background — appears on hover */}
              <span
                className="absolute right-0 top-1/2 -translate-y-1/2 font-serif text-[3.5rem] md:text-[4.5rem] pointer-events-none select-none transition-opacity duration-700"
                style={{
                  opacity: isHovered ? 0.05 : 0,
                  color: 'rgba(201,168,76,1)',
                }}
              >
                {toRoman(globalIdx + 1)}
              </span>

              {/* Book name */}
              <span
                className={`book-name relative z-10 font-serif text-[15px] md:text-[17px] lg:text-lg transition-colors duration-700 ${
                  isActive
                    ? 'text-gold italic'
                    : isHovered
                    ? 'text-gold italic'
                    : 'text-cream/85'
                }`}
                style={{ opacity: isActive || isHovered ? 1 : 0.45 }}
              >
                {book.name}
              </span>

              {/* Active indicator — subtle gold dot */}
              {isActive && (
                <span className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full bg-gold/60" />
              )}

              {/* Bottom line — subtle separator */}
              <span
                className="absolute bottom-0 left-0 w-full h-px transition-opacity duration-500"
                style={{
                  background: 'rgba(201,168,76,0.04)',
                  opacity: isHovered ? 0 : 1,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );

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
          <p className="font-sans text-[9px] md:text-[10px] tracking-[0.5em] uppercase text-gold/30 mb-3">
            {selectedBook ? 'Selecciona capítulo' : 'Índice Tipográfico'}
          </p>
          <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-cream/90 tracking-tight leading-none">
            {selectedBook
              ? books.find((b) => b.abbrev.pt === selectedBook)?.name || ''
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
      {hoveredIndex >= 0 && !selectedBook && (
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
        {!selectedBook ? (
          <>
            {renderEditorialGrid(otBooks, 'Antiguo Testamento', 0)}

            {/* Testament divider — ultra thin */}
            <div className="testament-divider flex items-center gap-8 my-12 md:my-16 origin-left" style={{ transformOrigin: 'left center' }}>
              <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.08)' }} />
              <span className="font-serif text-[10px] tracking-[0.5em] uppercase text-gold/15 italic">
                ✝
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.08)' }} />
            </div>

            {renderEditorialGrid(ntBooks, 'Nuevo Testamento', otBooks.length)}
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

            {/* Chapter grid */}
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1">
              {Array.from({ length: selectedBookChapters }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleChapterSelect(ch)}
                  className={`book-item aspect-square flex items-center justify-center font-sans text-xs md:text-sm cursor-pointer transition-all duration-500 ${
                    selectedBook === currentBook && ch === currentChapter
                      ? 'text-gold bg-gold/8'
                      : 'text-cream/60 hover:text-cream/80 hover:bg-cream/3'
                  }`}
                  data-cursor-hover
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
