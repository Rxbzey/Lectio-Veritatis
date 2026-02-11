import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getChapter, getNextChapter } from '../lib/api';
import type { ChapterResponse } from '../lib/api';
import { Verse } from './Verse';
import { ChapterTransition } from './ChapterTransition';

gsap.registerPlugin(ScrollTrigger);

interface ScriptureReaderProps {
  bookAbbrev: string;
  chapter: number;
  onChapterChange: (abbrev: string, chapter: number) => void;
  onChapterLoaded?: (data: ChapterResponse) => void;
  onGoHome: () => void;
}

export function ScriptureReader({ bookAbbrev, chapter, onChapterChange, onChapterLoaded, onGoHome }: ScriptureReaderProps) {
  const [chapterData, setChapterData] = useState<ChapterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const loadChapter = useCallback(async (abbrev: string, ch: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getChapter(abbrev, ch);
      setChapterData(data);
      onChapterLoaded?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading chapter');
    } finally {
      setLoading(false);
    }
  }, [onChapterLoaded]);

  useEffect(() => {
    loadChapter(bookAbbrev, chapter);
    window.scrollTo({ top: 0 });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [bookAbbrev, chapter, loadChapter]);

  useEffect(() => {
    if (!heroRef.current || loading || !chapterData) return;

    const tl = gsap.timeline({ delay: 0.3 });

    tl.fromTo(
      titleRef.current,
      { opacity: 0, y: 80, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 1.6, ease: 'expo.out' }
    )
    .fromTo(
      metaRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
      '-=0.8'
    );

    const heroTl = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.4,
      },
    });

    heroTl.to(titleRef.current, {
      y: -100,
      opacity: 0,
      scale: 0.85,
      filter: 'blur(12px)',
    })
    .to(metaRef.current, { y: -40, opacity: 0 }, '<');

    return () => {
      tl.kill();
      heroTl.kill();
    };
  }, [loading, chapterData]);

  // Reading progress tracker
  useEffect(() => {
    if (loading || !chapterData || !containerRef.current) return;

    const onScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const total = container.scrollHeight - window.innerHeight;
      const scrolled = -rect.top;
      const pct = Math.max(0, Math.min(1, scrolled / total));

      if (progressBarRef.current) {
        gsap.to(progressBarRef.current, {
          scaleX: pct,
          duration: 0.15,
          ease: 'power1.out',
          overwrite: true,
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [loading, chapterData]);

  const handleTransitionComplete = useCallback(() => {
    const next = getNextChapter(
      bookAbbrev,
      chapter,
      chapterData?.chapter.verses || 0
    );
    if (next) {
      setTransitioning(false);
      onChapterChange(next.abbrev, next.chapter);
    }
  }, [bookAbbrev, chapter, chapterData, onChapterChange]);

  const handleNextChapter = useCallback(() => {
    const next = getNextChapter(
      bookAbbrev,
      chapter,
      chapterData?.chapter.verses || 0
    );
    if (next) {
      setTransitioning(true);
    }
  }, [bookAbbrev, chapter, chapterData]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-8">
          <div className="w-12 h-px bg-gold/20 mx-auto mb-8" />
          <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-gold/40 mb-4">Error al cargar</p>
          <p className="font-serif text-xl md:text-2xl text-cream/50 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => loadChapter(bookAbbrev, chapter)}
            className="font-sans text-[10px] tracking-[0.3em] uppercase text-gold/50 hover:text-gold cursor-pointer transition-colors duration-500 pb-1"
            style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.2)' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (loading || !chapterData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border border-gold/20 rounded-full animate-ping" />
            <div className="absolute inset-2 border border-gold/40 rounded-full animate-pulse" />
          </div>
          <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-cream/20">
            Revelando la palabra
          </p>
        </div>
      </div>
    );
  }

  const nextChapter = chapterData ? getNextChapter(bookAbbrev, chapter, chapterData.chapter.verses) : null;

  return (
    <>
      <ChapterTransition isActive={transitioning} onComplete={handleTransitionComplete} />

      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-px">
        <div
          ref={progressBarRef}
          className="h-full origin-left"
          style={{
            transform: 'scaleX(0)',
            background: 'linear-gradient(90deg, rgba(201,168,76,0.1), rgba(201,168,76,0.5), rgba(201,168,76,0.7))',
            boxShadow: '0 0 8px rgba(201,168,76,0.2)',
          }}
        />
      </div>

      <div ref={containerRef} className="relative">
        {/* Hero section — full viewport centered */}
        <div
          ref={heroRef}
          className="h-screen flex items-center justify-center relative overflow-hidden"
        >
          <div className="chapter-watermark">
            {chapterData.chapter.number}
          </div>

          <div className="text-center relative z-10 px-8">
            <h1
              ref={titleRef}
              className="font-serif text-5xl sm:text-6xl md:text-8xl lg:text-9xl xl:text-[10rem] text-cream-bright leading-[0.85] tracking-[-0.02em] opacity-0"
            >
              {chapterData.book.name}
            </h1>

            <div ref={metaRef} className="mt-6 md:mt-10 opacity-0">
              <div className="flex items-center justify-center gap-6">
                <div className="w-8 md:w-16 h-px bg-gold/20" />
                <span className="font-sans text-[10px] md:text-xs tracking-[0.5em] uppercase text-gold/50">
                  Capítulo {chapterData.chapter.number}
                </span>
                <div className="w-8 md:w-16 h-px bg-gold/20" />
              </div>
              <p className="font-sans text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-cream/20 mt-4">
                {chapterData.book.author} · {chapterData.book.group}
              </p>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-30">
            <span className="font-sans text-[8px] tracking-[0.5em] uppercase text-cream/40">
              Scroll
            </span>
            <div className="w-px h-8 bg-gradient-to-b from-gold/40 to-transparent" />
          </div>
        </div>

        {/* Verses */}
        <div className="relative z-10">
          {chapterData.verses.map((verse, index) => (
            <Verse
              key={`${bookAbbrev}-${chapter}-${verse.number}`}
              number={verse.number}
              text={verse.text}
              index={index}
            />
          ))}
        </div>

        {/* End of chapter */}
        <div className="min-h-[55vh] flex items-center justify-center py-24">
          <div className="text-center space-y-6">
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-gold/30 to-transparent mx-auto" />
            <p className="font-sans text-[9px] tracking-[0.55em] uppercase text-cream/25">
              Fin del capítulo {chapterData.chapter.number}
            </p>
            <p className="font-serif text-2xl md:text-[2.5rem] text-cream/30 italic tracking-[0.08em]">
              {chapterData.book.name}
            </p>
            <p className="font-sans text-[10px] tracking-[0.45em] uppercase text-gold/40">
              continua la lectura
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-6">
              {/* Finalizar — go home */}
              <button
                onClick={onGoHome}
                className="group relative cursor-pointer py-2"
                data-cursor-hover
              >
                <span className="font-serif text-[12px] md:text-[13px] tracking-[0.4em] uppercase text-cream/35 group-hover:text-cream/70 transition-colors duration-700">
                  Finalizar
                </span>
                <span
                  className="absolute bottom-0 left-0 w-full h-px origin-center transition-transform duration-700 group-hover:scale-x-100 scale-x-50"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(212,207,197,0.25), rgba(212,207,197,0.4), rgba(212,207,197,0.25), transparent)' }}
                />
              </button>

              {/* Siguiente capítulo */}
              {nextChapter && (
                <button
                  onClick={handleNextChapter}
                  className="group relative cursor-pointer py-2"
                  data-cursor-hover
                >
                  <span className="font-serif text-[12px] md:text-[13px] tracking-[0.4em] uppercase text-gold/70 group-hover:text-gold transition-colors duration-700">
                    Siguiente Capítulo
                  </span>
                  <span
                    className="absolute bottom-0 left-0 w-full h-px origin-center transition-transform duration-700 group-hover:scale-x-100 scale-x-50"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.45), rgba(201,168,76,0.7), rgba(201,168,76,0.45), transparent)' }}
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
