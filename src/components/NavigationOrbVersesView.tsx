import { VerseGrid } from '@/components/VerseGrid';

interface NavigationOrbVersesViewProps {
  selectedBook: string;
  selectedChapter: number;
  currentBook: string;
  currentChapter: number;
  currentVerse: number | null;
  verseTotal: number;
  isLoading: boolean;
  onVerseSelect: (verse: number) => void;
  onBackToBooks: () => void;
  onBackToChapters: () => void;
}

export function NavigationOrbVersesView({
  selectedBook,
  selectedChapter,
  currentBook,
  currentChapter,
  currentVerse,
  verseTotal,
  isLoading,
  onVerseSelect,
  onBackToBooks,
  onBackToChapters,
}: NavigationOrbVersesViewProps) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-14">
        <button
          onClick={onBackToBooks}
          className="font-sans text-[10px] tracking-[0.35em] uppercase text-cream/40 hover:text-gold cursor-pointer transition-colors duration-500 flex items-center gap-3"
          data-cursor-hover
        >
          <span className="w-4 h-px bg-current" />
          Libros
        </button>
        <span className="text-cream/20 select-none">/</span>
        <button
          onClick={onBackToChapters}
          className="font-sans text-[10px] tracking-[0.35em] uppercase text-cream/55 hover:text-gold cursor-pointer transition-colors duration-500"
          data-cursor-hover
        >
          Capítulos
        </button>
        <span className="text-cream/20 select-none">/</span>
        <span className="font-sans text-[10px] tracking-[0.35em] uppercase text-gold/70">
          Capítulo {selectedChapter}
        </span>
      </div>

      <VerseGrid
        totalVerses={verseTotal}
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        currentBook={currentBook}
        currentChapter={currentChapter}
        currentVerse={currentVerse}
        onVerseSelect={onVerseSelect}
        isLoading={isLoading}
      />
    </div>
  );
}
