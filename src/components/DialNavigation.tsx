import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { getBooks } from '../lib/api';
import type { Book } from '../lib/api';

interface DialAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

type AppView = 'home' | 'reader';

interface DialNavigationProps {
  view: AppView;
  currentBook: string;
  currentChapter: number;
  onGoHome: () => void;
  onOpenBooks: () => void;
  onNavigateChapter: (abbrev: string, chapter: number) => void;
}

const RADIUS = 72;
const START_ANGLE = -90;

function getPosition(index: number, count: number) {
  const spread = count > 1 ? 90 : 0;
  const angleDeg = START_ANGLE - (count > 1 ? (index * spread) / (count - 1) : 0);
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.cos(angleRad) * RADIUS,
    y: Math.sin(angleRad) * RADIUS,
  };
}

export function DialNavigation({
  view,
  currentBook,
  currentChapter,
  onGoHome,
  onOpenBooks,
  onNavigateChapter,
}: DialNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const chapterPanelRef = useRef<HTMLDivElement>(null);

  const isReader = view === 'reader';

  // Load books data once
  useEffect(() => {
    getBooks().then(setBooks).catch(console.error);
  }, []);

  const currentBookData = useMemo(
    () => books.find((b) => b.abbrev.pt === currentBook),
    [books, currentBook]
  );

  const totalChapters = currentBookData?.chapters ?? 0;

  const actions: DialAction[] = useMemo(() => {
    const list: DialAction[] = [
      {
        id: 'home',
        label: 'Inicio',
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5" />
            <path d="M19 13v6a1 1 0 01-1 1h-4v-5h-4v5H6a1 1 0 01-1-1v-6" />
          </svg>
        ),
        onClick: onGoHome,
      },
      {
        id: 'books',
        label: 'Libros',
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            <path d="M8 7h8" />
            <path d="M8 11h5" />
          </svg>
        ),
        onClick: onOpenBooks,
      },
    ];

    if (isReader) {
      list.push({
        id: 'chapters',
        label: 'Capítulos',
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
        onClick: () => setShowChapters(true),
      });
    }

    return list;
  }, [isReader, onGoHome, onOpenBooks]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setShowChapters(false);
  }, []);

  const handleAction = useCallback((action: DialAction) => {
    if (action.id === 'chapters') {
      action.onClick();
      return;
    }
    setIsOpen(false);
    setShowChapters(false);
    action.onClick();
  }, []);

  const handleChapterSelect = useCallback((ch: number) => {
    setIsOpen(false);
    setShowChapters(false);
    onNavigateChapter(currentBook, ch);
  }, [currentBook, onNavigateChapter]);

  // GSAP open/close animation for dial items
  useEffect(() => {
    const fabIcon = fabRef.current?.querySelector('.fab-icon');
    const validItems = itemRefs.current.filter(Boolean);

    if (isOpen) {
      if (fabIcon) {
        gsap.to(fabIcon, { rotation: 45, duration: 0.4, ease: 'back.out(2)' });
      }
      validItems.forEach((el, i) => {
        if (!el) return;
        const pos = getPosition(i, actions.length);
        gsap.fromTo(
          el,
          { x: 0, y: 0, scale: 0, opacity: 0 },
          {
            x: pos.x,
            y: pos.y,
            scale: 1,
            opacity: 1,
            duration: 0.45,
            ease: 'back.out(1.7)',
            delay: 0.05 + i * 0.06,
          }
        );
      });
    } else {
      gsap.to(validItems, {
        x: 0,
        y: 0,
        scale: 0,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        stagger: { each: 0.03, from: 'end' },
      });
      if (fabIcon) {
        gsap.to(fabIcon, { rotation: 0, duration: 0.3, ease: 'power2.in' });
      }
    }
  }, [isOpen, actions.length]);

  // GSAP chapter panel animation
  useEffect(() => {
    if (!chapterPanelRef.current) return;
    if (showChapters) {
      gsap.fromTo(
        chapterPanelRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' }
      );
      const items = chapterPanelRef.current.querySelectorAll('.ch-btn');
      gsap.fromTo(
        items,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.3, stagger: 0.01, ease: 'power2.out', delay: 0.15 }
      );
    }
  }, [showChapters]);

  // Entrance animation for the FAB itself
  useEffect(() => {
    if (fabRef.current) {
      gsap.fromTo(
        fabRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)', delay: 1.2 }
      );
    }
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showChapters) {
          setShowChapters(false);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, showChapters]);

  return (
    <>
      {/* Backdrop — click to close */}
      {(isOpen || showChapters) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setIsOpen(false); setShowChapters(false); }}
          aria-hidden="true"
        />
      )}

      <div
        ref={containerRef}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50"
      >
        {/* Chapter picker panel */}
        {showChapters && totalChapters > 0 && (
          <div
            ref={chapterPanelRef}
            className="absolute bottom-16 md:bottom-18 right-0 w-64 sm:w-72 max-h-80 overflow-y-auto rounded-xl p-4"
            style={{
              background: 'rgba(10, 10, 8, 0.95)',
              border: '1px solid rgba(201, 168, 76, 0.1)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(20px)',
              opacity: 0,
            }}
          >
            {/* Header */}
            <div className="mb-3 pb-2" style={{ borderBottom: '1px solid rgba(201,168,76,0.06)' }}>
              <p className="font-sans text-[9px] tracking-[0.4em] uppercase text-gold/30">
                Capítulos
              </p>
              <p className="font-serif text-sm text-cream/70 mt-1">
                {currentBookData?.name ?? ''}
              </p>
            </div>

            {/* Chapter grid */}
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: totalChapters }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleChapterSelect(ch)}
                  className={`ch-btn aspect-square flex items-center justify-center rounded-md font-sans text-xs cursor-pointer transition-all duration-300 ${
                    ch === currentChapter
                      ? 'text-gold bg-gold/10'
                      : 'text-cream/25 hover:text-cream/80 hover:bg-cream/5'
                  }`}
                  data-cursor-hover
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action items — positioned absolutely from FAB center */}
        <div className="absolute bottom-0 right-0 flex items-center justify-center w-12 h-12 md:w-14 md:h-14">
          {actions.map((action, i) => (
            <button
              key={action.id}
              ref={(el) => { itemRefs.current[i] = el; }}
              onClick={() => handleAction(action)}
              className="absolute w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300 text-cream/50 hover:text-gold group"
              style={{
                background: 'rgba(10, 10, 8, 0.85)',
                border: '1px solid rgba(201, 168, 76, 0.12)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                opacity: 0,
                transform: 'scale(0)',
              }}
              aria-label={action.label}
              data-cursor-hover
            >
              {action.icon}
              {/* Tooltip */}
              <span
                className="absolute right-full mr-3 px-2.5 py-1 rounded font-sans text-[10px] tracking-[0.15em] uppercase text-cream/70 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'rgba(10, 10, 8, 0.9)',
                  border: '1px solid rgba(201, 168, 76, 0.08)',
                }}
              >
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Main FAB */}
        <button
          ref={fabRef}
          onClick={toggle}
          className="relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 hover:scale-105"
          style={{
            background: 'rgba(10, 10, 8, 0.9)',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            boxShadow: isOpen
              ? '0 0 30px rgba(201, 168, 76, 0.15), 0 8px 32px rgba(0,0,0,0.5)'
              : '0 4px 24px rgba(0,0,0,0.4)',
            opacity: 0,
          }}
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          data-cursor-hover
        >
          <div className="fab-icon text-gold/70 transition-colors duration-300 hover:text-gold">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
        </button>
      </div>
    </>
  );
}
