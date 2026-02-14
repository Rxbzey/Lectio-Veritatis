import type { MouseEvent } from 'react';
import type { Book } from '@/lib/api';
import type { BookStatus } from '@/hooks/useReadingProgress';
import { toRoman } from '@/utils/toRoman';

interface BookIndexGridProps {
  bookList: Book[];
  label: string;
  startIndex: number;
  currentBook: string;
  hoveredBook: string | null;
  getBookStatus?: (book: string, totalChapters: number) => BookStatus;
  onBookClick: (book: Book) => void;
  onBookEnter: (event: MouseEvent<HTMLButtonElement>, book: Book, index: number) => void;
  onBookLeave: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function BookIndexGrid({
  bookList,
  label,
  startIndex,
  currentBook,
  hoveredBook,
  getBookStatus,
  onBookClick,
  onBookEnter,
  onBookLeave,
}: BookIndexGridProps) {
  return (
    <div className="mb-4">
      <div className="section-title flex items-center gap-6 mb-10 md:mb-14">
        <h3
          className="font-sans text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-gold/40"
          style={{ fontVariant: 'small-caps' }}
        >
          {label}
        </h3>
        <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.06)' }} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-12 md:gap-x-16 lg:gap-x-20 gap-y-0">
        {bookList.map((book, i) => {
          const globalIdx = startIndex + i;
          const isActive = book.abbrev.pt === currentBook;
          const isHovered = hoveredBook === book.abbrev.pt;
          const bookStatus = getBookStatus?.(book.abbrev.pt, book.chapters) ?? 'unread';

          return (
            <button
              key={book.abbrev.pt}
              className="book-item relative text-left cursor-pointer py-3 md:py-4 overflow-hidden"
              onClick={() => onBookClick(book)}
              onMouseEnter={(event) => onBookEnter(event, book, globalIdx)}
              onMouseLeave={onBookLeave}
              data-cursor-hover
            >
              <span
                className="absolute right-0 top-1/2 -translate-y-1/2 font-serif text-[3.5rem] md:text-[4.5rem] pointer-events-none select-none transition-opacity duration-700"
                style={{
                  opacity: isHovered ? 0.05 : 0,
                  color: 'rgba(201,168,76,1)',
                }}
              >
                {toRoman(globalIdx + 1)}
              </span>

              <span
                className={`book-name relative z-10 font-serif text-[15px] md:text-[17px] lg:text-lg transition-colors duration-700 ${
                  isActive
                    ? 'text-gold italic'
                    : isHovered
                    ? 'text-gold italic'
                    : bookStatus === 'completed'
                    ? 'text-emerald-400/90'
                    : bookStatus === 'in-progress'
                    ? 'text-amber-400/80'
                    : 'text-cream/85'
                }`}
                style={{ opacity: isActive || isHovered ? 1 : bookStatus !== 'unread' ? 0.85 : 0.45 }}
              >
                {book.name}
              </span>

              {bookStatus === 'completed' && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[8px] text-emerald-400/50 z-10 pointer-events-none">✓</span>
              )}
              {bookStatus === 'in-progress' && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400/40 z-10 pointer-events-none" />
              )}

              {isActive && (
                <span className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full bg-gold/60" />
              )}

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
}
