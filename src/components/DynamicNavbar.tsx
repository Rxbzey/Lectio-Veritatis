import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useScrollProgress } from '../hooks/useScrollProgress';

type AppView = 'home' | 'reader';

interface DynamicNavbarProps {
  view: AppView;
  bookName: string;
  chapterNumber: number;
  totalVerses: number;
  onGoHome: () => void;
  onOpenSearch: () => void;
}

export function DynamicNavbar({
  view,
  bookName,
  chapterNumber,
  totalVerses,
  onGoHome,
  onOpenSearch,
}: DynamicNavbarProps) {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const { progress, isScrolling } = useScrollProgress();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(navRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 });
    }
  }, []);

  const showProgress = view === 'reader' && totalVerses > 0;

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-700"
      style={{ opacity: 0 }}
    >
      {/* Progress line — only in reader */}
      {showProgress && (
        <div
          className="absolute top-0 left-0 h-px transition-opacity duration-500"
          style={{
            width: `${progress * 100}%`,
            opacity: isScrolling ? 1 : 0.4,
            background: 'linear-gradient(90deg, rgba(201,168,76,0.1), rgba(201,168,76,0.6))',
            boxShadow: isScrolling ? '0 0 10px rgba(201,168,76,0.25)' : 'none',
          }}
        />
      )}

      <div
        className={`flex items-center justify-between px-6 md:px-10 lg:px-16 h-16 md:h-[72px] transition-all duration-700 ${
          scrolled ? 'backdrop-blur-2xl' : ''
        }`}
        style={{
          background: scrolled
            ? 'rgba(0, 0, 0, 0.7)'
            : 'transparent',
          borderBottom: scrolled ? '1px solid rgba(201,168,76,0.04)' : '1px solid transparent',
        }}
      >
        {/* Left — Logo */}
        <button
          onClick={onGoHome}
          className="pointer-events-auto cursor-pointer group flex items-center gap-3"
        >
          <div
            className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-105"
            style={{ border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <span className="font-serif text-xs md:text-sm text-gold/70 group-hover:text-gold transition-colors duration-300 leading-none">
              ✝
            </span>
          </div>
          {view === 'reader' && bookName && (
            <span className="hidden sm:inline font-serif text-xs md:text-sm text-cream/40 group-hover:text-cream/70 transition-colors duration-300">
              {bookName} <span className="text-gold/30 ml-1">{chapterNumber}</span>
            </span>
          )}
        </button>

        {/* Right — Search icon only */}
        <button
          onClick={onOpenSearch}
          className="pointer-events-auto cursor-pointer group w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-105"
          style={{ border: '1px solid rgba(212, 207, 197, 0.08)' }}
          aria-label="Buscar"
        >
          <svg
            className="w-4 h-4 text-cream/30 group-hover:text-gold transition-colors duration-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
