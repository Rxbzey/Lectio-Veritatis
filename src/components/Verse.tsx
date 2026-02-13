import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface VerseProps {
  verses: { number: number; text: string }[];
  index: number;
  bookName: string;
  chapter: number;
  isOldTestament?: boolean;
  highlightedVerse?: number;
  highlightQuery?: string;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function Verse({ 
  verses,
  index, 
  bookName, 
  chapter,
  isOldTestament = false,
  highlightedVerse,
  highlightQuery,
}: VerseProps) {
  const verseRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);

  const rangeStart = verses[0]?.number ?? 0;
  const rangeEnd = verses[verses.length - 1]?.number ?? rangeStart;
  const isHighlighted = highlightedVerse != null && verses.some((verse) => verse.number === highlightedVerse);
  const activeQuery = isHighlighted && highlightQuery ? highlightQuery.trim() : '';
  const highlightRegex = activeQuery ? new RegExp(`(${escapeRegExp(activeQuery)})`, 'gi') : null;

  const renderVerseText = (verseNumber: number, verseText: string) => {
    if (!highlightRegex || highlightedVerse !== verseNumber) {
      return verseText;
    }

    return verseText.split(highlightRegex).map((segment, i) => (
      <span
        key={`${verseNumber}-segment-${i}`}
        className={i % 2 === 1 ? 'bg-gold/25 text-cream-bright px-1 rounded-sm' : ''}
      >
        {segment}
      </span>
    ));
  };

  useEffect(() => {
    const el = verseRef.current;
    const header = headerRef.current;
    if (!el) return;

    // Initial states
    gsap.set(el, { opacity: 0, y: 60 });
    if (header) {
      gsap.set(header, { opacity: 0, y: -15 });
    }
    if (numberRef.current) {
      gsap.set(numberRef.current, { opacity: 0, scale: 0.8 });
    }

    // Entrance animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top 82%',
        end: 'top 35%',
        scrub: 0.6,
      },
    });

    tl.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
    })
    .to(header, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
    }, '<0.1')
    .to(numberRef.current, {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: 'back.out(1.5)',
    }, '<0.2');

    // Exit fade animation
    const tlFade = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top 15%',
        end: 'top -15%',
        scrub: 0.6,
      },
    });

    tlFade.to(el, {
      opacity: 0.08,
      filter: 'blur(4px)',
      y: -15,
      duration: 1,
      ease: 'power2.in',
    });

    return () => {
      tl.kill();
      tlFade.kill();
      ScrollTrigger.getAll()
        .filter((st) => st.trigger === el)
        .forEach((st) => st.kill());
    };
  }, [index]);

  return (
    <>
      <style>{`
        .verse-paragraph {
          word-break: normal;
          overflow-wrap: break-word;
        }
      `}</style>

      <div
        ref={verseRef}
        data-verse-range={`${rangeStart}-${rangeEnd}`}
        className={`min-h-[45vh] md:min-h-[55vh] flex items-center justify-center py-12 md:py-20 will-change-transform transition-colors duration-600 ${
          isHighlighted ? 'bg-gold/5' : ''
        }`}
      >
        <div className={`w-full max-w-3xl mx-auto px-8 md:px-16 lg:px-20 ${isHighlighted ? 'rounded-3xl bg-cream/2 shadow-[0_0_50px_rgba(201,168,76,0.12)]' : ''}`}>
          {/* Header with book info */}
          <div 
            ref={headerRef}
            className="mb-8 md:mb-10 text-center"
          >
            {/* Book / chapter / testament row */}
            <div className="flex flex-wrap items-center justify-start gap-4 mb-4 text-center">
              <span className="font-serif text-lg md:text-xl lg:text-2xl text-gold/80 tracking-tight font-light">
                {bookName}
              </span>
              <span className="text-gold/30 select-none">/</span>
              <span className="font-sans text-[11px] md:text-sm uppercase tracking-[0.35em] text-gold/55">
                Capítulo <span className="font-serif text-base md:text-lg tracking-normal text-gold/70 tabular-nums ml-2">{chapter}</span>
              </span>
              <span className="text-gold/30 select-none">/</span>
              <span className={`flex items-center gap-3 text-[9px] md:text-[10px] tracking-[0.3em] uppercase font-sans font-light ${
                isOldTestament ? 'text-amber-400/70' : 'text-sky-300/70'
              }`}> 
                {isOldTestament ? 'Antiguo Testamento' : 'Nuevo Testamento'}
              </span>
            </div>

            <div className="flex items-center justify-start">
              <span
                ref={numberRef}
                className="font-serif text-lg md:text-2lg text-gold/40 tabular-nums select-none"
              >
                Versículos {rangeStart}-{rangeEnd}
              </span>
              
            </div>

            {/* Decorative divider */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-px bg-linear-to-r from-transparent via-gold/25 to-gold/35" />
              <span className="text-[9px] uppercase tracking-[0.4em] text-gold/35 select-none">
                ✢
              </span>
              <div className="w-16 h-px bg-linear-to-r from-gold/35 via-gold/20 to-transparent" />
            </div>
          </div>

          {/* Verse content */}
          <div className="space-y-4">
            {/* Verse text */}
            <p
              className={`font-serif text-lg sm:text-xl md:text-2xl lg:text-[1.75rem] leading-[1.75] sm:leading-[1.8] md:leading-[1.85] tracking-[0.005em] ${
                isHighlighted ? 'text-cream-bright' : 'text-cream-bright/85'
              } verse-paragraph`}
            >
              {verses.map((verse, verseIndex) => (
                <span
                  key={`${index}-verse-${verse.number}`}
                  data-verse-number={verse.number}
                  className="inline"
                >
                  <sup className="font-sans text-[11px] text-gold/65 tracking-[0.05em] mr-1 align-super">
                    {verse.number}
                  </sup>
                  {renderVerseText(verse.number, verse.text)}
                  {verseIndex < verses.length - 1 && ' '}
                </span>
              ))}
            </p>
          </div>

          {/* Decorative footer */}
          <div className="flex items-center gap-3 mt-8 md:mt-10">
            <div className="w-16 h-px bg-linear-to-r from-transparent via-gold/15 to-gold/30" />
            <span className="text-[9px] uppercase tracking-[0.4em] text-gold/30 select-none">
              †
            </span>
            <div className="flex-1 h-px bg-linear-to-r from-gold/30 via-gold/15 to-transparent" />
          </div>
        </div>
      </div>
    </>
  );
}