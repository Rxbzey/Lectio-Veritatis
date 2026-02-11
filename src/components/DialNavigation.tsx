import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useDialActions } from '../hooks/useDialActions';
import type { DialAction } from '../hooks/useDialActions';

type AppView = 'home' | 'reader';

interface DialNavigationProps {
  view: AppView;
  currentBook: string;
  onGoHome: () => void;
  onOpenBooks: () => void;
  onOpenChapters: (abbrev: string) => void;
}

const RADIUS = 72;
const START_ANGLE = -90;

function getPosition(index: number, count: number) {
  const spread = count > 1 ? 90 : 0;
  const angleDeg = START_ANGLE - (count > 1 ? (index * spread) / (count - 1) : 0);
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.cos(angleRad) * RADIUS,
    y: Math.sin(angleRad) * RADIUS,
  };
}

export function DialNavigation({
  view,
  currentBook,
  onGoHome,
  onOpenBooks,
  onOpenChapters,
}: DialNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isReader = view === 'reader';
  const handleShowChapters = useCallback(() => {
    onOpenChapters(currentBook);
  }, [currentBook, onOpenChapters]);
  const actions = useDialActions({
    isReader,
    onGoHome,
    onOpenBooks,
    onShowChapters: handleShowChapters,
  });

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleAction = useCallback((action: DialAction) => {
    if (action.id === 'chapters') {
      setIsOpen(false);
      action.onClick();
      return;
    }
    setIsOpen(false);
    action.onClick();
  }, []);


  // GSAP open/close animation for dial items
  useEffect(() => {
    const fabIcon = fabRef.current?.querySelector('.fab-icon');
    const validItems = itemRefs.current.filter(Boolean);

    if (isOpen) {
      if (fabIcon) {
        gsap.to(fabIcon, { rotation: 45, duration: 0.4, ease: 'back.out(2)' });
      }
      validItems.forEach((el, i) => {
        if (!el) return;
        const pos = getPosition(i, actions.length);
        gsap.fromTo(
          el,
          { x: 0, y: 0, scale: 0, opacity: 0 },
          {
            x: pos.x,
            y: pos.y,
            scale: 1,
            opacity: 1,
            duration: 0.45,
            ease: 'back.out(1.7)',
            delay: 0.05 + i * 0.06,
          }
        );
      });
    } else {
      gsap.to(validItems, {
        x: 0,
        y: 0,
        scale: 0,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        stagger: { each: 0.03, from: 'end' },
      });
      if (fabIcon) {
        gsap.to(fabIcon, { rotation: 0, duration: 0.3, ease: 'power2.in' });
      }
    }
  }, [isOpen, actions.length]);

  // Entrance animation for the FAB itself
  useEffect(() => {
    if (fabRef.current) {
      gsap.fromTo(
        fabRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.7)', delay: 1.2 }
      );
    }
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  return (
    <>
      {/* Backdrop — click to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setIsOpen(false); }}
          aria-hidden="true"
        />
      )}

      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50">
        {/* Action items — positioned absolutely from FAB center */}
        <div className="absolute bottom-0 right-0 flex items-center justify-center w-12 h-12 md:w-14 md:h-14">
          {actions.map((action, i) => (
            <button
              key={action.id}
              ref={(el) => { itemRefs.current[i] = el; }}
              onClick={() => handleAction(action)}
              className="absolute w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300 text-cream/80 hover:text-gold group"
              style={{
                background: 'rgba(10, 10, 8, 0.85)',
                border: '1px solid rgba(201, 168, 76, 0.12)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                opacity: 0,
                transform: 'scale(0)',
              }}
              aria-label={action.label}
              data-cursor-hover
            >
              {action.icon}
              {/* Tooltip */}
              <span
                className="absolute right-full mr-3 px-2.5 py-1 rounded font-sans text-[10px] tracking-[0.15em] uppercase text-cream/80 whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'rgba(10, 10, 8, 0.9)',
                  border: '1px solid rgba(201, 168, 76, 0.08)',
                }}
              >
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Main FAB */}
        <button
          ref={fabRef}
          onClick={toggle}
          className="relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 hover:scale-105"
          style={{
            background: 'rgba(10, 10, 8, 0.9)',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            boxShadow: isOpen
              ? '0 0 30px rgba(201, 168, 76, 0.15), 0 8px 32px rgba(0,0,0,0.5)'
              : '0 4px 24px rgba(0,0,0,0.4)',
            opacity: 0,
          }}
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          data-cursor-hover
        >
          <div className="fab-icon text-gold/70 transition-colors duration-300 hover:text-gold">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
        </button>
      </div>
    </>
  );
}
