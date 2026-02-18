import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function MercuryCursor() {
  const lightRef = useRef<HTMLDivElement>(null);
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const light = lightRef.current;
    if (!light) return;

    gsap.to(light, {
      boxShadow: '0 0 20px 6px rgba(201,168,76,0.35), 0 0 40px 12px rgba(201,168,76,0.1)',
      duration: 2.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    const onMove = (e: MouseEvent) => {
      light.style.willChange = 'transform';
      clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = setTimeout(() => {
        light.style.willChange = 'auto';
      }, 150);

      gsap.to(light, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.15,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    // Hover: the light warms and grows slightly
    const onEnter = () => {
      gsap.to(light, {
        width: 14,
        height: 14,
        background: 'rgba(201,168,76,0.95)',
        boxShadow: '0 0 24px 8px rgba(201,168,76,0.45), 0 0 50px 16px rgba(201,168,76,0.12)',
        duration: 0.5,
        ease: 'power2.out',
      });
    };
    const onLeave = () => {
      gsap.to(light, {
        width: 10,
        height: 10,
        background: 'rgba(201,168,76,0.7)',
        boxShadow: '0 0 14px 4px rgba(201,168,76,0.25), 0 0 30px 8px rgba(201,168,76,0.08)',
        duration: 0.5,
        ease: 'power2.out',
      });
    };

    // Click: the light dims briefly then returns
    const onDown = () => {
      gsap.to(light, { scale: 0.7, opacity: 0.5, duration: 0.1, ease: 'power3.out' });
    };
    const onUp = () => {
      gsap.to(light, { scale: 1, opacity: 1, duration: 0.6, ease: 'power2.out' });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    const attachHovers = () => {
      const targets = document.querySelectorAll('button, a, [data-cursor-hover]');
      targets.forEach((el) => {
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });
      return targets;
    };

    const targets = attachHovers();
    const observer = new MutationObserver(() => attachHovers());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(moveTimeoutRef.current);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      observer.disconnect();
      targets.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-9999 hidden md:block">
      {/* A small warm light — the soul seeking the Word */}
      <div
        ref={lightRef}
        className="absolute rounded-full"
        style={{
          width: 10,
          height: 10,
          top: -5,
          left: -5,
          background: 'rgba(201, 168, 76, 0.7)',
          boxShadow: '0 0 14px 4px rgba(201,168,76,0.25), 0 0 30px 8px rgba(201,168,76,0.08)',
        }}
      />
    </div>
  );
}
