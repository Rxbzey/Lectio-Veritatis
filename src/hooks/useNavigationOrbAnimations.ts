import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';

export function useNavigationOrbAnimations(
  panelRef: RefObject<HTMLDivElement | null>,
  closeRef: RefObject<HTMLButtonElement | null>,
  isOpen: boolean,
  selectedBook: string | null,
) {
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const panel = panelRef.current;
    const tl = gsap.timeline();

    tl.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });

    const header = panel.querySelector('.idx-header');
    if (header) {
      tl.fromTo(header, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.2);
    }

    const sectionTitles = panel.querySelectorAll('.section-title');
    if (sectionTitles.length > 0) {
      tl.fromTo(
        sectionTitles,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out' },
        0.35,
      );
    }

    const items = panel.querySelectorAll('.book-item');
    if (items.length > 0) {
      tl.fromTo(
        items,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.02, ease: 'power3.out' },
        0.45,
      );
    }

    const divider = panel.querySelector('.testament-divider');
    if (divider) {
      tl.fromTo(divider, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'expo.out' }, 0.6);
    }

    return () => {
      tl.kill();
    };
  }, [isOpen, selectedBook, panelRef]);

  useEffect(() => {
    if (!closeRef.current) return;
    const btn = closeRef.current;
    const icon = btn.querySelector('.close-icon') as HTMLElement | null;
    if (!icon) return;

    const onEnter = () => gsap.to(icon, { rotation: 90, duration: 0.5, ease: 'power3.out' });
    const onLeave = () => gsap.to(icon, { rotation: 0, duration: 0.5, ease: 'power3.out' });

    btn.addEventListener('mouseenter', onEnter);
    btn.addEventListener('mouseleave', onLeave);
    return () => {
      btn.removeEventListener('mouseenter', onEnter);
      btn.removeEventListener('mouseleave', onLeave);
    };
  }, [isOpen, closeRef]);
}
