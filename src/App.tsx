import { lazy, Suspense, useReducer, useCallback, useMemo } from 'react';
import { Router, useLocation } from 'wouter';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { useReadingProgressStore, selectResumeTarget } from '@/hooks/useReadingProgress';
import { DynamicNavbar } from '@/components/DynamicNavbar';
import { PWAInstallToast } from '@/components/PWAInstallToast';
import { PWAUpdateToast } from '@/components/PWAUpdateToast';
import type { ChapterResponse } from '@/lib/api';
import { useOfflineSupport } from '@/hooks/useOfflineSupport';
import { useReadingProgressSyncActions } from '@/hooks/useReadingProgressSyncActions';
import { useAppRoute, pathFor } from '@/lib/appRoute';

type State = {
  indexOpen: boolean;
  chapterPickerBook: string | null;
  chapterPickerChapter: number | null;
  orbMode: 'index' | 'search';
  searchTarget: { book: string; chapter: number; verse: number; query: string; token: number } | null;
  chapterMeta: { bookName: string; totalVerses: number };
};

type Action =
  | { type: 'CHAPTER_LOADED'; bookName: string; totalVerses: number }
  | { type: 'SEARCH_NAVIGATE'; book: string; chapter: number; verse: number; query: string; token: number }
  | { type: 'OPEN_BOOKS' }
  | { type: 'OPEN_SEARCH' }
  | { type: 'OPEN_CHAPTERS'; book: string }
  | { type: 'OPEN_VERSES'; book: string; chapter: number }
  | { type: 'CLOSE_INDEX' }
  | { type: 'RESET_READER_META' };

const initialState: State = {
  indexOpen: false,
  chapterPickerBook: null,
  chapterPickerChapter: null,
  orbMode: 'index',
  searchTarget: null,
  chapterMeta: { bookName: '', totalVerses: 0 },
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'CHAPTER_LOADED':
      return { ...state, chapterMeta: { bookName: action.bookName, totalVerses: action.totalVerses } };
    case 'SEARCH_NAVIGATE':
      return { ...state, searchTarget: { book: action.book, chapter: action.chapter, verse: action.verse, query: action.query, token: action.token } };
    case 'OPEN_BOOKS':
      return { ...state, orbMode: 'index', chapterPickerBook: null, chapterPickerChapter: null, indexOpen: true };
    case 'OPEN_SEARCH':
      return { ...state, orbMode: 'search', chapterPickerBook: null, chapterPickerChapter: null, indexOpen: true };
    case 'OPEN_CHAPTERS':
      return { ...state, orbMode: 'index', chapterPickerBook: action.book, chapterPickerChapter: null, indexOpen: true };
    case 'OPEN_VERSES':
      return { ...state, orbMode: 'index', chapterPickerBook: action.book, chapterPickerChapter: action.chapter, indexOpen: true };
    case 'CLOSE_INDEX':
      return { ...state, indexOpen: false, chapterPickerBook: null, chapterPickerChapter: null };
    case 'RESET_READER_META':
      return { ...state, chapterMeta: { bookName: '', totalVerses: 0 } };
  }
}

const Hero = lazy(() => import('@/components/Hero').then((module) => ({ default: module.Hero })));
const ScriptureReader = lazy(() => import('@/components/ScriptureReader').then((module) => ({ default: module.ScriptureReader })));
const NavigationOrb = lazy(() => import('@/components/NavigationOrb').then((module) => ({ default: module.NavigationOrb })));
const FilmGrain = lazy(() => import('@/components/FilmGrain').then((module) => ({ default: module.FilmGrain })));
const MercuryCursor = lazy(() => import('@/components/MercuryCursor').then((module) => ({ default: module.MercuryCursor })));
const DialNavigation = lazy(() => import('@/components/DialNavigation').then((module) => ({ default: module.DialNavigation })));

function AppInner() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { indexOpen, chapterPickerBook, chapterPickerChapter, orbMode, searchTarget, chapterMeta } = state;
  const route = useAppRoute();
  const [, setLocation] = useLocation();
  const { view, book: currentBook, chapter: currentChapter, verse: currentVerse, verseEnd: currentVerseEnd } = route;
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

  const goToReader = useCallback((abbrev: string, chapter: number, verse?: number | null) => {
    setLocation(pathFor(abbrev, chapter, verse));
    setLastPosition(abbrev, chapter);
    if (!verse) {
      window.scrollTo({ top: 0 });
    }
  }, [setLocation, setLastPosition]);

  const goHome = useCallback(() => {
    setLocation('/');
    dispatch({ type: 'RESET_READER_META' });
    dispatch({ type: 'CLOSE_INDEX' });
    window.scrollTo({ top: 0 });
  }, [setLocation]);

  const handleChapterChange = useCallback((abbrev: string, chapter: number) => {
    setLocation(pathFor(abbrev, chapter));
    setLastPosition(abbrev, chapter);
  }, [setLocation, setLastPosition]);

  const handleChapterLoaded = useCallback((data: ChapterResponse) => {
    dispatch({ type: 'CHAPTER_LOADED', bookName: data.book.name, totalVerses: data.verses.length });
  }, []);

  const handleSearchNavigate = useCallback((abbrev: string, chapter: number, verse: number, query: string) => {
    dispatch({ type: 'SEARCH_NAVIGATE', book: abbrev, chapter, verse, query, token: Date.now() });
    setLocation(pathFor(abbrev, chapter, verse));
    setLastPosition(abbrev, chapter);
  }, [setLocation, setLastPosition]);

  const activeHighlight = useMemo(() => {
    if (
      searchTarget &&
      searchTarget.book === currentBook &&
      searchTarget.chapter === currentChapter &&
      (currentVerse == null || searchTarget.verse === currentVerse)
    ) {
      return { verse: searchTarget.verse, query: searchTarget.query, token: searchTarget.token };
    }
    if (currentVerse != null) {
      return {
        verse: currentVerse,
        query: '',
        token: `v-${currentBook}-${currentChapter}-${currentVerse}`,
      };
    }
    return null;
  }, [searchTarget, currentBook, currentChapter, currentVerse]);

  const openBooks = useCallback(() => {
    dispatch({ type: 'OPEN_BOOKS' });
  }, []);

  const openSearch = useCallback(() => {
    dispatch({ type: 'OPEN_SEARCH' });
  }, []);


  return (
    <div lang="es" role="application" aria-label="Lectio Veritatis — Biblia Latinoamericana Digital">
      <PWAInstallToast />
      <PWAUpdateToast />
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
              key={`${currentBook}-${currentChapter}`}
              bookAbbrev={currentBook}
              chapter={currentChapter}
              onChapterChange={handleChapterChange}
              onChapterLoaded={handleChapterLoaded}
              onGoHome={goHome}
              onScrollProgress={updateChapterScroll}
              onChapterCompleted={markChapterCompleted}
              initialScrollPct={currentVerse != null ? 0 : getChapterScrollPct(currentBook, currentChapter)}
              initialLastVerse={currentVerse != null ? 0 : getChapterLastVerse(currentBook, currentChapter)}
              highlightFocus={activeHighlight}
              urlRange={currentVerse && currentVerseEnd ? { start: currentVerse, end: currentVerseEnd } : null}
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
              onNavigate={(abbrev, chapter, verse) => goToReader(abbrev, chapter, verse)}
              currentBook={currentBook}
              currentChapter={currentChapter}
              currentVerse={currentVerse}
              initialBook={chapterPickerBook}
              initialChapter={chapterPickerChapter}
              currentChapterTotalVerses={chapterMeta.totalVerses}
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
          currentChapter={currentChapter}
          onGoHome={goHome}
          onOpenBooks={openBooks}
          onOpenChapters={(abbrev) => dispatch({ type: 'OPEN_CHAPTERS', book: abbrev })}
          onOpenVerses={(abbrev, chapter) => dispatch({ type: 'OPEN_VERSES', book: abbrev, chapter })}
          onOpenSearch={openSearch}
        />
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}

export default App;
