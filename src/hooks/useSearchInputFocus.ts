import { useEffect, type RefObject } from 'react';

export function useSearchInputFocus(
  inputRef: RefObject<HTMLInputElement | null>,
  mode: 'index' | 'search',
  delay = 200,
) {
  useEffect(() => {
    if (mode !== 'search') return;
    const timer = setTimeout(() => inputRef.current?.focus(), delay);
    return () => clearTimeout(timer);
  }, [mode, delay, inputRef]);
}
