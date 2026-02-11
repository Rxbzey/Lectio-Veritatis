import { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { searchVerses } from '../lib/api';
import type { SearchResult } from '../lib/api';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (abbrev: string, chapter: number) => void;
}

export function SearchOverlay({ isOpen, onClose, onNavigate }: SearchOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (isOpen && overlayRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && results.length > 0 && overlayRef.current) {
      const items = overlayRef.current.querySelectorAll('.search-result');
      gsap.fromTo(
        items,
        { opacity: 0, y: 20, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.03, ease: 'power3.out' }
      );
    }
  }, [results, isOpen]);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || query.trim().length < 3) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchVerses(query.trim());
      setResults(data.verses?.slice(0, 40) || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') handleClose();
  };

  const handleClose = () => {
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          onClose();
          setQuery('');
          setResults([]);
          setSearched(false);
        },
      });
    } else {
      onClose();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onNavigate(result.book.abbrev.pt, result.chapter);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-60 bg-black/98 backdrop-blur-3xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 md:px-16 lg:px-24 pt-10 md:pt-14 shrink-0">
        <p className="font-sans text-[9px] tracking-[0.5em] uppercase text-gold/30">
          Buscar en las Escrituras
        </p>
        <button
          onClick={handleClose}
          className="w-14 h-14 flex items-center justify-center cursor-pointer group rounded-full"
          style={{ border: '1px solid rgba(201, 168, 76, 0.08)' }}
          aria-label="Close search"
        >
          <div className="w-5 h-5 relative">
            <span className="block w-full h-px bg-cream/40 absolute top-1/2 left-0 rotate-45 group-hover:bg-gold transition-colors duration-300" />
            <span className="block w-full h-px bg-cream/40 absolute top-1/2 left-0 -rotate-45 group-hover:bg-gold transition-colors duration-300" />
          </div>
        </button>
      </div>

      {/* Search input */}
      <div className="px-8 md:px-16 lg:px-24 mt-10 md:mt-20 shrink-0">
        <div className="max-w-4xl mx-auto relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe una palabra..."
            className="w-full bg-transparent font-serif text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-cream-bright/90 placeholder:text-cream/8 outline-none pb-6 text-center"
            style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.08)' }}
          />
          {loading && (
            <div className="absolute right-0 bottom-7 md:right-4">
              <div className="relative w-5 h-5">
                <div className="absolute inset-0 border border-gold/30 rounded-full animate-ping" />
                <div className="absolute inset-1 border border-gold/50 rounded-full animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-8 md:px-16 lg:px-24 mt-12 md:mt-16" data-lenis-prevent>
        {searched && results.length === 0 && !loading && (
          <div className="text-center mt-24">
            <div className="w-px h-8 bg-cream/5 mx-auto mb-6" />
            <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-cream/15">
              No se encontraron resultados
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <p className="font-sans text-[9px] tracking-[0.4em] uppercase text-gold/25 mb-10 text-center">
              {results.length} versículos
            </p>
            <div className="space-y-1">
              {results.map((result, i) => (
                <button
                  key={`${result.book.abbrev.pt}-${result.chapter}-${result.number}-${i}`}
                  onClick={() => handleResultClick(result)}
                  className="search-result w-full text-center py-5 md:py-6 cursor-pointer group transition-all duration-500"
                >
                  <p className="font-sans text-[8px] md:text-[9px] tracking-[0.5em] uppercase text-gold/25 mb-2 group-hover:text-gold/60 transition-colors duration-500">
                    {result.book.name} {result.chapter}:{result.number}
                  </p>
                  <p className="font-serif text-base sm:text-lg md:text-xl text-cream/30 group-hover:text-cream-bright/90 transition-colors duration-500 leading-relaxed max-w-2xl mx-auto">
                    {result.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
