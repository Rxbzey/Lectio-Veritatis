import type { RefObject } from 'react';
import type { Book } from '@/lib/api';

interface NavigationOrbHeaderProps {
  selectedBook: string | null;
  selectedChapter: number | null;
  mode: 'index' | 'search';
  books: Book[];
  closeRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export function NavigationOrbHeader({
  selectedBook,
  selectedChapter,
  mode,
  books,
  closeRef,
  onClose,
}: NavigationOrbHeaderProps) {
  const bookName = selectedBook ? books.find((b) => b.abbrev.pt === selectedBook)?.name || '' : '';
  const inVerseStep = selectedBook && selectedChapter != null;
  const eyebrow = inVerseStep
    ? 'Selecciona versículo'
    : selectedBook
    ? 'Selecciona capítulo'
    : mode === 'search'
    ? 'Motor de búsqueda'
    : 'Índice Tipográfico';
  const title = inVerseStep
    ? `${bookName} ${selectedChapter}`
    : selectedBook
    ? bookName
    : mode === 'search'
    ? 'Buscar en las Escrituras'
    : 'Escrituras';

  return (
    <div className="idx-header flex items-end justify-between shrink-0" style={{ padding: '3rem 10vw 0' }}>
      <div>
        <p className="font-sans text-[9px] md:text-[10px] tracking-[0.5em] uppercase text-gold/50 mb-3">
          {eyebrow}
        </p>
        <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-cream/90 tracking-tight leading-none">
          {title}
        </h2>
      </div>

      <button
        ref={closeRef}
        onClick={onClose}
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
  );
}
