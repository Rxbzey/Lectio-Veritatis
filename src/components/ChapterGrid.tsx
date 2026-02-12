import type { ChapterStatus } from '../hooks/useReadingProgress';

interface ChapterGridProps {
  totalChapters: number;
  selectedBook: string;
  currentBook: string;
  currentChapter: number;
  getChapterStatus?: (book: string, chapter: number) => ChapterStatus;
  onChapterSelect: (chapter: number) => void;
}

export function ChapterGrid({
  totalChapters,
  selectedBook,
  currentBook,
  currentChapter,
  getChapterStatus,
  onChapterSelect,
}: ChapterGridProps) {
  return (
    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1">
      {Array.from({ length: totalChapters }, (_, index) => index + 1).map((chapter) => {
        const chapterStatus = getChapterStatus?.(selectedBook, chapter) ?? 'unread';
        const isCurrent = selectedBook === currentBook && chapter === currentChapter;

        return (
          <button
            key={chapter}
            onClick={() => onChapterSelect(chapter)}
            className={`book-item aspect-square flex items-center justify-center font-sans text-xs md:text-sm cursor-pointer transition-all duration-500 relative ${
              isCurrent
                ? 'text-gold bg-gold/8'
                : chapterStatus === 'completed'
                ? 'text-emerald-400/80 bg-emerald-400/5 hover:bg-emerald-400/10'
                : chapterStatus === 'in-progress'
                ? 'text-amber-400/80 bg-amber-400/5 hover:bg-amber-400/10'
                : 'text-cream/60 hover:text-cream/80 hover:bg-cream/3'
            }`}
            data-cursor-hover
          >
            {chapter}
            {chapterStatus === 'completed' && !isCurrent && (
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400/50" />
            )}
            {chapterStatus === 'in-progress' && !isCurrent && (
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400/50" />
            )}
          </button>
        );
      })}
    </div>
  );
}
