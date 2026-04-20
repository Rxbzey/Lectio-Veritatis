import type { Book } from '@/lib/api';
import { BookIndexGrid } from '@/components/BookIndexGrid';
import type { ChapterStatus, BookStatus } from '@/hooks/useReadingProgress';

interface NavigationOrbBooksViewProps {
  books: Book[];
  currentBook: string;
  hoveredBook: string | null;
  getBookStatus?: (book: string, totalChapters: number) => BookStatus;
  getChapterStatus?: (book: string, chapter: number) => ChapterStatus;
  onBookClick: (book: Book) => void;
  onBookEnter: (e: React.MouseEvent, book: Book, index: number) => void;
  onBookLeave: (e: React.MouseEvent) => void;
}

export function NavigationOrbBooksView({
  books,
  currentBook,
  hoveredBook,
  getBookStatus,
  onBookClick,
  onBookEnter,
  onBookLeave,
}: NavigationOrbBooksViewProps) {
  const otBooks = books.filter((b) => b.testament === 'VT');
  const ntBooks = books.filter((b) => b.testament === 'NT');

  return (
    <>
      <BookIndexGrid
        bookList={otBooks}
        label="Antiguo Testamento"
        startIndex={0}
        currentBook={currentBook}
        hoveredBook={hoveredBook}
        getBookStatus={getBookStatus}
        onBookClick={onBookClick}
        onBookEnter={onBookEnter}
        onBookLeave={onBookLeave}
      />

      <div
        className="testament-divider flex items-center gap-8 my-12 md:my-16 origin-left"
        style={{ transformOrigin: 'left center' }}
      >
        <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.08)' }} />
        <span className="font-serif text-[10px] tracking-[0.5em] uppercase text-gold/15 italic">✝</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.08)' }} />
      </div>

      <BookIndexGrid
        bookList={ntBooks}
        label="Nuevo Testamento"
        startIndex={otBooks.length}
        currentBook={currentBook}
        hoveredBook={hoveredBook}
        getBookStatus={getBookStatus}
        onBookClick={onBookClick}
        onBookEnter={onBookEnter}
        onBookLeave={onBookLeave}
      />
    </>
  );
}
