import { useState, useCallback } from 'react';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { useReadingProgressStore, selectResumeTarget } from './hooks/useReadingProgress';
import { Hero } from './components/Hero';
import { ScriptureReader } from './components/ScriptureReader';
import { NavigationOrb } from './components/NavigationOrb';
import { DynamicNavbar } from './components/DynamicNavbar';
import { FilmGrain } from './components/FilmGrain';
import { MercuryCursor } from './components/MercuryCursor';
import { DialNavigation } from './components/DialNavigation';
import type { ChapterResponse } from './lib/api';

type AppView = 'home' | 'reader';

function App() {
  const [view, setView] = useState<AppView>('home');
  const [currentBook, setCurrentBook] = useState('genesis');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [indexOpen, setIndexOpen] = useState(false);
  const [chapterPickerBook, setChapterPickerBook] = useState<string | null>(null);
  const [chapterMeta, setChapterMeta] = useState<{ bookName: string; totalVerses: number }>({
    bookName: '',
    totalVerses: 0,
  });
  useSmoothScroll();
  const updateChapterScroll = useReadingProgressStore((state) => state.updateChapterScroll);
  const markChapterCompleted = useReadingProgressStore((state) => state.markChapterCompleted);
  const getChapterScrollPct = useReadingProgressStore((state) => state.getChapterScrollPct);
  const getChapterLastVerse = useReadingProgressStore((state) => state.getChapterLastVerse);
  const getChapterStatus = useReadingProgressStore((state) => state.getChapterStatus);
  const getBookStatus = useReadingProgressStore((state) => state.getBookStatus);
  const setLastPosition = useReadingProgressStore((state) => state.setLastPosition);
  const resumeTarget = useReadingProgressStore(selectResumeTarget);

  const goToReader = useCallback((abbrev: string, chapter: number) => {
    setCurrentBook(abbrev);
    setCurrentChapter(chapter);
    setView('reader');
    setLastPosition(abbrev, chapter);
    window.scrollTo({ top: 0 });
  }, [setLastPosition]);

  const goHome = useCallback(() => {
    setView('home');
    setChapterMeta({ bookName: '', totalVerses: 0 });
    window.scrollTo({ top: 0 });
  }, []);

  const handleChapterChange = useCallback((abbrev: string, chapter: number) => {
    setCurrentBook(abbrev);
    setCurrentChapter(chapter);
    setLastPosition(abbrev, chapter);
  }, [setLastPosition]);

  const handleChapterLoaded = useCallback((data: ChapterResponse) => {
    setChapterMeta({
      bookName: data.book.name,
      totalVerses: data.verses.length,
    });
  }, []);

  return (
    <div lang="es" role="application" aria-label="The Living Scripture — Biblia Latinoamericana Digital">
      <MercuryCursor />
      <FilmGrain />

      <header role="banner">
        <DynamicNavbar
          view={view}
          totalVerses={chapterMeta.totalVerses}
        />
      </header>

      <main role="main" aria-live="polite">
        {view === 'home' && (
          <Hero
            onGetStarted={() => goToReader('genesis', 1)}
            onExploreBooks={() => setIndexOpen(true)}
            onContinueReading={resumeTarget ? () => goToReader(resumeTarget.book, resumeTarget.chapter) : undefined}
            continueTarget={resumeTarget}
          />
        )}

        {view === 'reader' && (
          <ScriptureReader
            bookAbbrev={currentBook}
            chapter={currentChapter}
            onChapterChange={handleChapterChange}
            onChapterLoaded={handleChapterLoaded}
            onGoHome={goHome}
            onScrollProgress={updateChapterScroll}
            onChapterCompleted={markChapterCompleted}
            initialScrollPct={getChapterScrollPct(currentBook, currentChapter)}
            initialLastVerse={getChapterLastVerse(currentBook, currentChapter)}
          />
        )}
      </main>

      <nav role="navigation" aria-label="Navegación de libros">
        <NavigationOrb
          isOpen={indexOpen}
          onClose={() => {
            setIndexOpen(false);
            setChapterPickerBook(null);
          }}
          onNavigate={(abbrev, chapter) => goToReader(abbrev, chapter)}
          currentBook={currentBook}
          currentChapter={currentChapter}
          initialBook={chapterPickerBook}
          getChapterStatus={getChapterStatus}
          getBookStatus={getBookStatus}
        />
      </nav>

     

      <DialNavigation
        view={view}
        currentBook={currentBook}
        onGoHome={goHome}
        onOpenBooks={() => {
          setChapterPickerBook(null);
          setIndexOpen(true);
        }}
        onOpenChapters={(abbrev) => {
          setChapterPickerBook(abbrev);
          setIndexOpen(true);
        }}
      />
    </div>
  );
}

export default App;
