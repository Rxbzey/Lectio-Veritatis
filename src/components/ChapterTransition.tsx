import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface ChapterTransitionProps {
  isActive: boolean;
  onComplete?: () => void;
}

export function ChapterTransition({ isActive, onComplete }: ChapterTransitionProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !overlayRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        onComplete?.();
      },
    });

    tl.set(overlayRef.current, { display: 'flex' })
      .fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: 'power2.inOut' }
      )
      .to(overlayRef.current, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
        delay: 0.3,
      })
      .set(overlayRef.current, { display: 'none' });

    return () => {
      tl.kill();
    };
  }, [isActive, onComplete]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[90] bg-void items-center justify-center hidden pointer-events-none"
    >
      <div className="w-16 h-[1px] bg-gold/40" />
    </div>
  );
}
