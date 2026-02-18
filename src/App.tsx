import { lazy, Suspense, useReducer, useCallback, useMemo } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { useReadingProgressStore, selectResumeTarget } from '@/hooks/useReadingProgress';
import { DynamicNavbar } from '@/components/DynamicNavbar';
import type { ChapterResponse } from '@/lib/api';
import { useOfflineSupport } from '@/hooks/useOfflineSupport';
import { useReadingProgressSyncActions } from '@/hooks/useReadingProgressSyncActions';

type AppView = 'home' | 'reader';

type State = {
  view: AppView;
  currentBook: string;
  currentChapter: number;
  indexOpen: boolean;
  chapterPickerBook: string | null;
  orbMode: 'index' | 'search';
  searchTarget: { book: string; chapter: number; verse: number; query: string; token: number } | null;
  chapterMeta: { bookName: string; totalVerses: number };
};

type Action =
  | { type: 'GO_TO_READER'; book: string; chapter: number }
  | { type: 'GO_HOME' }
  | { type: 'CHAPTER_CHANGE'; book: string; chapter: number }
  | { type: 'CHAPTER_LOADED'; bookName: string; totalVerses: number }
  | { type: 'SEARCH_NAVIGATE'; book: string; chapter: number; verse: number; query: string; token: number }
  | { type: 'OPEN_BOOKS' }
  | { type: 'OPEN_SEARCH' }
  | { type: 'OPEN_CHAPTERS'; book: string }
  | { type: 'CLOSE_INDEX' };

const initialState: State = {
  view: 'home',
  currentBook: 'genesis',
  currentChapter: 1,
  indexOpen: false,
  chapterPickerBook: null,
  orbMode: 'index',
  searchTarget: null,
  chapterMeta: { bookName: '', totalVerses: 0 },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'GO_TO_READER':
      return { ...state, view: 'reader', currentBook: action.book, currentChapter: action.chapter };
    case 'GO_HOME':
      return { ...state, view: 'home', chapterMeta: { bookName: '', totalVerses: 0 }, indexOpen: false, chapterPickerBook: null, orbMode: 'index' };
    case 'CHAPTER_CHANGE':
      return { ...state, currentBook: action.book, currentChapter: action.chapter };
    case 'CHAPTER_LOADED':
      return { ...state, chapterMeta: { bookName: action.bookName, totalVerses: action.totalVerses } };
    case 'SEARCH_NAVIGATE':
      return { ...state, searchTarget: { book: action.book, chapter: action.chapter, verse: action.verse, query: action.query, token: action.token } };
    case 'OPEN_BOOKS':
      return { ...state, orbMode: 'index', chapterPickerBook: null, indexOpen: true };
    case 'OPEN_SEARCH':
      return { ...state, orbMode: 'search', chapterPickerBook: null, indexOpen: true };
    case 'OPEN_CHAPTERS':
      return { ...state, orbMode: 'index', chapterPickerBook: action.book, indexOpen: true };
    case 'CLOSE_INDEX':
      return { ...state, indexOpen: false, chapterPickerBook: null };
  }
}

const Hero = lazy(() => import('@/components/Hero').then((module) => ({ default: module.Hero })));
const ScriptureReader = lazy(() => import('@/components/ScriptureReader').then((module) => ({ default: module.ScriptureReader })));
const NavigationOrb = lazy(() => import('@/components/NavigationOrb').then((module) => ({ default: module.NavigationOrb })));
const FilmGrain = lazy(() => import('@/components/FilmGrain').then((module) => ({ default: module.FilmGrain })));
const MercuryCursor = lazy(() => import('@/components/MercuryCursor').then((module) => ({ default: module.MercuryCursor })));
const DialNavigation = lazy(() => import('@/components/DialNavigation').then((module) => ({ default: module.DialNavigation })));

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { view, currentBook, currentChapter, indexOpen, chapterPickerBook, orbMode, searchTarget, chapterMeta } = state;
  useSmoothScroll();
  const { isOnline } = useOfflineSupport();
  const updateChapterScroll = useReadingProgressStore((state) => state.updateChapterScroll);
  const getChapterScrollPct = useReadingProgressStore((state) => state.getChapterScrollPct);
  const getChapterLastVerse = useReadingProgressStore((state) => state.getChapterLastVerse);
  const getChapterStatus = useReadingProgressStore((state) => state.getChapterStatus);
  const getBookStatus = useReadingProgressStore((state) => state.getBookStatus);
  const setLastPosition = useReadingProgressStore((state) => state.setLastPosition);
  const resumeTarget = useReadingProgressStore(selectResumeTarget);
  const { markChapterCompleted } = useReadingProgressSyncActions(isOnline);

  const goToReader = useCallback((abbrev: string, chapter: number) => {
    dispatch({ type: 'GO_TO_READER', book: abbrev, chapter });
    setLastPosition(abbrev, chapter);
    window.scrollTo({ top: 0 });
  }, [setLastPosition]);

  const goHome = useCallback(() => {
    dispatch({ type: 'GO_HOME' });
    window.scrollTo({ top: 0 });
  }, []);

  const handleChapterChange = useCallback((abbrev: string, chapter: number) => {
    dispatch({ type: 'CHAPTER_CHANGE', book: abbrev, chapter });
    setLastPosition(abbrev, chapter);
  }, [setLastPosition]);

  const handleChapterLoaded = useCallback((data: ChapterResponse) => {
    dispatch({ type: 'CHAPTER_LOADED', bookName: data.book.name, totalVerses: data.verses.length });
  }, []);

  const handleSearchNavigate = useCallback((abbrev: string, chapter: number, verse: number, query: string) => {
    dispatch({ type: 'SEARCH_NAVIGATE', book: abbrev, chapter, verse, query, token: Date.now() });
    goToReader(abbrev, chapter);
  }, [goToReader]);

  const activeHighlight = useMemo(() => {
    if (!searchTarget) return null;
    if (searchTarget.book !== currentBook || searchTarget.chapter !== currentChapter) return null;
    return { verse: searchTarget.verse, query: searchTarget.query, token: searchTarget.token };
  }, [searchTarget, currentBook, currentChapter]);

  const openBooks = useCallback(() => {
    dispatch({ type: 'OPEN_BOOKS' });
  }, []);

  const openSearch = useCallback(() => {
    dispatch({ type: 'OPEN_SEARCH' });
  }, []);


  return (
    <div lang="es" role="application" aria-label="The Living Scripture — Biblia Latinoamericana Digital">
      <SpeedInsights />
      <Suspense fallback={null}>
        <MercuryCursor />
        <FilmGrain />
      </Suspense>

      <header role="banner">
        <DynamicNavbar
          view={view}
          totalVerses={chapterMeta.totalVerses}
        />
      </header>

      <main role="main" aria-live="polite">
        {view === 'home' && (
          <Suspense fallback={<div className="min-h-[55vh]" />}>
            <Hero
              onGetStarted={() => goToReader('genesis', 1)}
              onExploreBooks={openBooks}
              onContinueReading={resumeTarget ? () => goToReader(resumeTarget.book, resumeTarget.chapter) : undefined}
              continueTarget={resumeTarget}
            />
          </Suspense>
        )}

        {view === 'reader' && (
          <Suspense fallback={<div className="min-h-screen" />}>
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
          </Suspense>
        )}
      </main>

      <nav aria-label="Navegación de libros">
        {indexOpen && (
          <Suspense fallback={null}>
            <NavigationOrb
              key={orbMode === 'search' ? 'orb-search' : 'orb-index'}
              isOpen={indexOpen}
              onClose={() => dispatch({ type: 'CLOSE_INDEX' })}
              onNavigate={(abbrev, chapter) => goToReader(abbrev, chapter)}
              currentBook={currentBook}
              currentChapter={currentChapter}
              initialBook={chapterPickerBook}
              getChapterStatus={getChapterStatus}
              getBookStatus={getBookStatus}
              initialMode={orbMode}
              onSearchNavigate={handleSearchNavigate}
              isOnline={isOnline}
            />
          </Suspense>
        )}
      </nav>

      <Suspense fallback={null}>
        <DialNavigation
          view={view}
          currentBook={currentBook}
          onGoHome={goHome}
          onOpenBooks={openBooks}
          onOpenChapters={(abbrev) => dispatch({ type: 'OPEN_CHAPTERS', book: abbrev })}
          onOpenSearch={openSearch}
        />
      </Suspense>
    </div>
  );
}

export default App;
