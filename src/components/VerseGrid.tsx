interface VerseGridProps {
  totalVerses: number;
  selectedBook: string;
  selectedChapter: number;
  currentBook: string;
  currentChapter: number;
  currentVerse?: number | null;
  onVerseSelect: (verse: number) => void;
  isLoading?: boolean;
}

export function VerseGrid({
  totalVerses,
  selectedBook,
  selectedChapter,
  currentBook,
  currentChapter,
  currentVerse,
  onVerseSelect,
  isLoading = false,
}: VerseGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 border border-gold/20 rounded-full animate-ping" />
          <div className="absolute inset-1 border border-gold/40 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (totalVerses <= 0) {
    return (
      <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-cream/40 py-8">
        No se encontraron versículos
      </p>
    );
  }

  const isCurrentChapter = selectedBook === currentBook && selectedChapter === currentChapter;

  return (
    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1">
      {Array.from({ length: totalVerses }, (_, index) => index + 1).map((verse) => {
        const isCurrent = isCurrentChapter && currentVerse === verse;

        return (
          <button
            key={verse}
            onClick={() => onVerseSelect(verse)}
            className={`book-item aspect-square flex items-center justify-center font-sans text-xs md:text-sm cursor-pointer transition-all duration-500 relative ${
              isCurrent
                ? 'text-gold bg-gold/8'
                : 'text-cream/60 hover:text-cream/80 hover:bg-cream/3'
            }`}
            data-cursor-hover
            aria-label={`Versículo ${verse}`}
          >
            {verse}
          </button>
        );
      })}
    </div>
  );
}
