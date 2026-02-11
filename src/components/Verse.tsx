import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface VerseProps {
  number: number;
  text: string;
  index: number;
}

export function Verse({ number, text, index }: VerseProps) {
  const verseRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    const el = verseRef.current;
    if (!el) return;

    const words = el.querySelectorAll('.verse-word');

    gsap.set(el, { opacity: 0, y: 60, scale: 0.97 });
    gsap.set(words, { opacity: 0, y: 15 });
    if (numberRef.current) {
      gsap.set(numberRef.current, { opacity: 0, scale: 0.5, x: -10 });
    }

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
      scale: 1,
      duration: 1,
      ease: 'power3.out',
    })
    .to(numberRef.current, {
      opacity: 1,
      scale: 1,
      x: 0,
      duration: 0.6,
      ease: 'back.out(2)',
    }, '<0.1')
    .to(words, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.015,
      ease: 'power2.out',
    }, '<0.05');

    const tlFade = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top 15%',
        end: 'top -15%',
        scrub: 0.6,
      },
    });

    tlFade.to(el, {
      opacity: 0.06,
      scale: 0.96,
      filter: 'blur(6px)',
      y: -20,
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

  const normalizedText = text.replace(/\s+/g, ' ').trim();
  const words = normalizedText.split(' ');

  return (
    <div
      ref={verseRef}
      className="min-h-[50vh] md:min-h-[60vh] flex items-center justify-center py-16 md:py-24 will-change-transform relative"
    >
      <div className="text-center max-w-4xl mx-auto px-6 md:px-12 relative z-10">
        <span
          ref={numberRef}
          className="block font-sans text-[10px] md:text-xs tracking-[0.5em] uppercase text-gold/50 mb-4 md:mb-6 tabular-nums select-none"
        >
          {number}
        </span>
        <p className="font-serif text-xl sm:text-2xl md:text-[2rem] lg:text-[2.5rem] xl:text-[2.8rem] leading-[1.6] sm:leading-[1.7] md:leading-[1.8] tracking-[0.01em] text-cream-bright/90">
          {words.map((word, i) => (
            <span
              key={`${index}-${i}`}
              ref={(el) => { if (el) wordsRef.current[i] = el; }}
              className="verse-word"
              style={{ display: 'inline-block', marginRight: i < words.length - 1 ? '0.3em' : 0 }}
            >
              {word}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
