import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export interface VerseRange {
  start: number;
  end: number;
}

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 10;

function verseFromPoint(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const verseEl = (el as Element).closest?.('[data-verse-number]');
  if (!verseEl) return null;
  const raw = verseEl.getAttribute('data-verse-number');
  const n = raw ? Number(raw) : NaN;
  return Number.isInteger(n) ? n : null;
}

export function useVerseSelection(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const [range, setRange] = useState<VerseRange | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const anchorRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const activeRef = useRef(false);

  const clear = useCallback(() => {
    setRange(null);
    setIsDragging(false);
    anchorRef.current = null;
    activeRef.current = false;
    startPosRef.current = null;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const cancelLongPress = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startPosRef.current = { x: e.clientX, y: e.clientY };
      activeRef.current = false;
      cancelLongPress();
      const startX = e.clientX;
      const startY = e.clientY;
      longPressTimerRef.current = setTimeout(() => {
        const verse = verseFromPoint(startX, startY);
        if (verse != null) {
          anchorRef.current = verse;
          activeRef.current = true;
          setRange({ start: verse, end: verse });
          setIsDragging(true);
          if ('vibrate' in navigator) {
            try { navigator.vibrate?.(15); } catch { /* noop */ }
          }
        }
      }, LONG_PRESS_MS);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!activeRef.current) {
        const start = startPosRef.current;
        if (start) {
          const dx = e.clientX - start.x;
          const dy = e.clientY - start.y;
          if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) cancelLongPress();
        }
        return;
      }
      e.preventDefault();
      const anchor = anchorRef.current;
      if (anchor == null) return;
      const verse = verseFromPoint(e.clientX, e.clientY);
      if (verse == null) return;
      const start = Math.min(anchor, verse);
      const end = Math.max(anchor, verse);
      setRange((prev) => (prev && prev.start === start && prev.end === end ? prev : { start, end }));
    };

    const onPointerUp = () => {
      cancelLongPress();
      if (activeRef.current) {
        setIsDragging(false);
      }
      activeRef.current = false;
      anchorRef.current = null;
      startPosRef.current = null;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      cancelLongPress();
    };
  }, [containerRef, enabled]);

  return { range, isDragging, clear };
}
