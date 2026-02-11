import { useState, useCallback } from 'react';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { Hero } from './components/Hero';
import { ScriptureReader } from './components/ScriptureReader';
import { NavigationOrb } from './components/NavigationOrb';
import { SearchOverlay } from './components/SearchOverlay';
import { DynamicNavbar } from './components/DynamicNavbar';
import { FilmGrain } from './components/FilmGrain';
import { MercuryCursor } from './components/MercuryCursor';
import type { ChapterResponse } from './lib/api';

type AppView = 'home' | 'reader';

function App() {
  const [view, setView] = useState<AppView>('home');
  const [currentBook, setCurrentBook] = useState('gn');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [chapterMeta, setChapterMeta] = useState<{ bookName: string; totalVerses: number }>({
    bookName: '',
    totalVerses: 0,
  });
  useSmoothScroll();

  const goToReader = useCallback((abbrev: string, chapter: number) => {
    setCurrentBook(abbrev);
    setCurrentChapter(chapter);
    setView('reader');
    window.scrollTo({ top: 0 });
  }, []);

  const goHome = useCallback(() => {
    setView('home');
    setChapterMeta({ bookName: '', totalVerses: 0 });
    window.scrollTo({ top: 0 });
  }, []);

  const handleChapterChange = useCallback((abbrev: string, chapter: number) => {
    setCurrentBook(abbrev);
    setCurrentChapter(chapter);
  }, []);

  const handleChapterLoaded = useCallback((data: ChapterResponse) => {
    setChapterMeta({
      bookName: data.book.name,
      totalVerses: data.verses.length,
    });
  }, []);

  return (
    <>
      <MercuryCursor />
      <FilmGrain />

      {view === 'home' && (
        <DynamicNavbar
          view={view}
          bookName={chapterMeta.bookName}
          chapterNumber={currentChapter}
          totalVerses={chapterMeta.totalVerses}
          onGoHome={goHome}
          onOpenSearch={() => setSearchOpen(true)}
        />
      )}

      {view === 'home' && (
        <Hero
          onGetStarted={() => goToReader('gn', 1)}
          onExploreBooks={() => setIndexOpen(true)}
        />
      )}

      {view === 'reader' && (
        <ScriptureReader
          bookAbbrev={currentBook}
          chapter={currentChapter}
          onChapterChange={handleChapterChange}
          onChapterLoaded={handleChapterLoaded}
          onGoHome={goHome}
        />
      )}

      <NavigationOrb
        isOpen={indexOpen}
        onClose={() => setIndexOpen(false)}
        onNavigate={(abbrev, chapter) => goToReader(abbrev, chapter)}
        currentBook={currentBook}
        currentChapter={currentChapter}
      />

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(abbrev, chapter) => {
          goToReader(abbrev, chapter);
          setSearchOpen(false);
        }}
      />
    </>
  );
}

export default App;
