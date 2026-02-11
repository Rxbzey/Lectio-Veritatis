import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { MagneticButton } from './MagneticButton';
import { getRandomVerse } from '../data/bibleVerses';

interface HeroProps {
  onGetStarted: () => void;
  onExploreBooks: () => void;
}

export function Hero({ onGetStarted, onExploreBooks }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const verse = useMemo(() => getRandomVerse(), []);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.6 });

    tl.fromTo(
      dividerRef.current,
      { scaleX: 0 },
      { scaleX: 1, duration: 1.2, ease: 'power3.inOut' }
    )
    .fromTo(
      subtitleRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      '-=0.6'
    )
    .fromTo(
      titleRef.current,
      { opacity: 0, y: 60, scale: 0.92 },
      { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: 'expo.out' },
      '-=0.5'
    )
    .fromTo(
      descRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.6'
    )
    .fromTo(
      ctaRef.current,
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.4'
    );

    return () => { tl.kill(); };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden transform -translate-y-6 md:-translate-y-10"
    >
      {/* Background decorative cross */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span
          className="font-serif text-[32rem] md:text-[52rem] leading-none text-cream/5"
          style={{ fontWeight: 900, textShadow: '0 0 40px rgba(236,231,219,0.08)' }}
        >
          ✝
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 md:px-12 max-w-5xl mx-auto flex flex-col items-center ">
        {/* Top label */}
        <p
          ref={subtitleRef}
          className="font-serif text-[9px] md:text-[10px] tracking-[0.6em] uppercase text-gold/40 "
        >
          Biblia Latinoamericana
        </p>

        {/* Divider */}
        <div ref={dividerRef} className="w-16 md:w-24 h-px bg-gold/25 mx-auto origin-center" />

        {/* Main title */}
        <h1
          ref={titleRef}
          className="font-serif text-5xl sm:text-6xl md:text-8xl lg:text-9xl xl:text-[9.5rem] text-cream-bright leading-[0.85] tracking-[-0.02em]"
        >
          The Living<br />
          <span className="italic text-gold/80">Scripture</span>
        </h1>

        <div className="w-full flex flex-col items-center gap-6 sm:gap-8 transform translate-y-8 md:translate-y-16">
          {/* Daily Verse */}
          <div
            ref={descRef}
            className="text-center max-w-xl mx-auto mb-12 md:mb-16"
          >
            <p className="font-serif italic text-sm md:text-base text-cream/90 leading-relaxed">
              “{verse.text}”
            </p>
            <span className="block mt-3 font-serif text-[10px] md:text-xs tracking-[0.3em] uppercase text-gold">
              {verse.reference}
            </span>
          </div>

          {/* CTA Buttons */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-16">
            <MagneticButton onClick={onGetStarted} variant="primary" className="py-3">
              Comenzar a Leer
            </MagneticButton>

            <MagneticButton onClick={onExploreBooks} variant="secondary" className="py-3">
              Explorar Libros
            </MagneticButton>
          </div>
        </div>
      </div>
    </div>
  );
}
