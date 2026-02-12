import { useState, useCallback, useMemo } from 'react';
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
  const [orbMode, setOrbMode] = useState<'index' | 'search'>('index');
  const [searchTarget, setSearchTarget] = useState<{ book: string; chapter: number; verse: number; query: string; token: number } | null>(null);
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

  const handleSearchNavigate = useCallback((abbrev: string, chapter: number, verse: number, query: string) => {
    setSearchTarget({ book: abbrev, chapter, verse, query, token: Date.now() });
    goToReader(abbrev, chapter);
  }, [goToReader]);

  const activeHighlight = useMemo(() => {
    if (!searchTarget) return null;
    if (searchTarget.book !== currentBook || searchTarget.chapter !== currentChapter) return null;
    return { verse: searchTarget.verse, query: searchTarget.query, token: searchTarget.token };
  }, [searchTarget, currentBook, currentChapter]);

  const openBooks = useCallback(() => {
    setOrbMode('index');
    setChapterPickerBook(null);
    setIndexOpen(true);
  }, []);

  const openSearch = useCallback(() => {
    setOrbMode('search');
    setChapterPickerBook(null);
    setIndexOpen(true);
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
            onExploreBooks={openBooks}
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
            highlightFocus={activeHighlight}
          />
        )}
      </main>

      <nav role="navigation" aria-label="Navegación de libros">
        <NavigationOrb
          key={orbMode === 'search' ? 'orb-search' : 'orb-index'}
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
          initialMode={orbMode}
          onSearchNavigate={handleSearchNavigate}
        />
      </nav>

      <DialNavigation
        view={view}
        currentBook={currentBook}
        onGoHome={goHome}
        onOpenBooks={openBooks}
        onOpenChapters={(abbrev) => {
          setChapterPickerBook(abbrev);
          setIndexOpen(true);
        }}
        onOpenSearch={openSearch}
      />
    </div>
  );
}

export default App;
