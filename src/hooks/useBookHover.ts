import { useCallback, useState } from 'react';
import gsap from 'gsap';
import type { Book } from '@/lib/api';

export function useBookHover() {
  const [hoveredBook, setHoveredBook] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);

  const handleBookEnter = useCallback((e: React.MouseEvent, book: Book, index: number) => {
    setHoveredBook(book.abbrev.pt);
    setHoveredIndex(index);
    const target = e.currentTarget as HTMLElement;
    const nameEl = target.querySelector('.book-name');
    if (nameEl) {
      gsap.to(nameEl, { opacity: 1, x: 4, duration: 0.6, ease: 'power3.out' });
    }
  }, []);

  const handleBookLeave = useCallback((e: React.MouseEvent) => {
    setHoveredBook(null);
    setHoveredIndex(-1);
    const target = e.currentTarget as HTMLElement;
    const nameEl = target.querySelector('.book-name');
    if (nameEl) {
      gsap.to(nameEl, { opacity: 0.45, x: 0, duration: 0.5, ease: 'power2.inOut' });
    }
  }, []);

  const resetHover = useCallback(() => {
    setHoveredBook(null);
    setHoveredIndex(-1);
  }, []);

  return { hoveredBook, hoveredIndex, handleBookEnter, handleBookLeave, resetHover };
}
