import { useState, useCallback } from 'react';
import { useSmoothScroll } from './hooks/useSmoothScroll';
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
