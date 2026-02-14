import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useScrollProgress } from '@/hooks/useScrollProgress';

type AppView = 'home' | 'reader';

interface DynamicNavbarProps {
  view: AppView;
  totalVerses: number;
}

export function DynamicNavbar({
  view,
  totalVerses
}: DynamicNavbarProps) {
  const navRef = useRef<HTMLElement>(null);
  const { progress, isScrolling } = useScrollProgress();

  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(navRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 });
    }
  }, []);

  const showProgress = view === 'reader' && totalVerses > 0;


  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-700"
      style={{ opacity: 0 }}
    >
      {/* Progress line — only in reader */}
      {showProgress && (
        <div
          className="absolute top-0 left-0 h-px transition-opacity duration-500"
          style={{
            width: `${progress * 100}%`,
            opacity: isScrolling ? 1 : 0.4,
            background: 'linear-gradient(90deg, rgba(201,168,76,0.1), rgba(201,168,76,0.6))',
            boxShadow: isScrolling ? '0 0 10px rgba(201,168,76,0.25)' : 'none',
          }}
        />
      )}
    </nav>
  );
}
