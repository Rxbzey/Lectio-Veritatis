import { ChapterGrid } from '@/components/ChapterGrid';
import type { ChapterStatus } from '@/hooks/useReadingProgress';

interface NavigationOrbChaptersViewProps {
  selectedBook: string;
  totalChapters: number;
  currentBook: string;
  currentChapter: number;
  getChapterStatus?: (book: string, chapter: number) => ChapterStatus;
  onChapterSelect: (chapter: number) => void;
  onBackToBooks: () => void;
}

export function NavigationOrbChaptersView({
  selectedBook,
  totalChapters,
  currentBook,
  currentChapter,
  getChapterStatus,
  onChapterSelect,
  onBackToBooks,
}: NavigationOrbChaptersViewProps) {
  return (
    <div>
      <button
        onClick={onBackToBooks}
        className="font-sans text-[10px] tracking-[0.35em] uppercase text-cream/55 hover:text-gold mb-14 cursor-pointer transition-colors duration-500 flex items-center gap-4"
        data-cursor-hover
      >
        <span className="w-5 h-px bg-current" />
        Volver al índice
      </button>

      <ChapterGrid
        totalChapters={totalChapters}
        selectedBook={selectedBook}
        currentBook={currentBook}
        currentChapter={currentChapter}
        getChapterStatus={getChapterStatus}
        onChapterSelect={onChapterSelect}
      />
    </div>
  );
}
