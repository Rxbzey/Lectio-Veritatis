import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function MagneticButton({ children, onClick, variant = 'secondary', className = '' }: MagneticButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);

  // Underline hover animation
  useEffect(() => {
    const btn = btnRef.current;
    const line = lineRef.current;
    if (!btn || !line) return;

    const onEnter = () => {
      gsap.to(line, { scaleX: 1, duration: 0.8, ease: 'expo.out' });
      gsap.to(btn, { y: -2, duration: 0.4, ease: 'power2.out' });
    };

    const onLeave = () => {
      gsap.to(line, { scaleX: 0.3, duration: 0.5, ease: 'power2.inOut' });
      gsap.to(btn, { y: 0, duration: 0.4, ease: 'power2.out' });
    };

    btn.addEventListener('mouseenter', onEnter);
    btn.addEventListener('mouseleave', onLeave);
    return () => {
      btn.removeEventListener('mouseenter', onEnter);
      btn.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const isPrimary = variant === 'primary';

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center cursor-pointer ${className}`}
      data-cursor-hover
    >
      {/* Soft candle glow — primary only */}
      {isPrimary && (
        <span
          className="absolute -inset-6 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 70%)',
            filter: 'blur(12px)',
          }}
        />
      )}

      {/* Text */}
      <span
        className={`relative z-10 font-serif text-[13px] md:text-sm tracking-[0.35em] uppercase transition-colors duration-700 ${
          isPrimary
            ? 'text-gold group-hover:text-cream-bright'
            : 'text-cream/40 group-hover:text-cream/70'
        }`}
      >
        {children}
      </span>

      {/* Animated underline — starts at 30%, expands to 100% on hover */}
      <span
        ref={lineRef}
        className="absolute bottom-0 left-0 w-full h-px origin-center"
        style={{
          transform: 'scaleX(0.3)',
          background: isPrimary
            ? 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), rgba(201,168,76,0.7), rgba(201,168,76,0.5), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(212,207,197,0.15), rgba(212,207,197,0.25), rgba(212,207,197,0.15), transparent)',
        }}
      />
    </button>
  );
}
