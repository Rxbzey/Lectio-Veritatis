import { useMemo } from 'react';
import type { ReactNode } from 'react';

export interface DialAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface UseDialActionsParams {
  isReader: boolean;
  onGoHome: () => void;
  onOpenBooks: () => void;
  onShowChapters: () => void;
  onShowVerses?: () => void;
  onOpenSearch?: () => void;
}

export function useDialActions({ isReader, onGoHome, onOpenBooks, onShowChapters, onShowVerses, onOpenSearch }: UseDialActionsParams): DialAction[] {
  return useMemo(() => {
    const actions: DialAction[] = [
      {
        id: 'home',
        label: 'Inicio',
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5" />
            <path d="M19 13v6a1 1 0 01-1 1h-4v-5h-4v5H6a1 1 0 01-1-1v-6" />
          </svg>
        ),
        onClick: onGoHome,
      },
      {
        id: 'books',
        label: 'Libros',
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            <path d="M8 7h8" />
            <path d="M8 11h5" />
          </svg>
        ),
        onClick: onOpenBooks,
      },
    ];

    if (onOpenSearch) {
      actions.push({
        id: 'search',
        label: 'Buscar',
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M16.5 16.5L21 21" />
          </svg>
        ),
        onClick: onOpenSearch,
      });
    }

    if (isReader) {
      actions.push({
        id: 'chapters',
        label: 'Capítulos',
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
        onClick: onShowChapters,
      });

      if (onShowVerses) {
        actions.push({
          id: 'verses',
          label: 'Versículo',
          icon: (
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h12" />
              <path d="M4 12h16" />
              <path d="M4 18h9" />
              <circle cx="19.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="16.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          ),
          onClick: onShowVerses,
        });
      }
    }

    return actions;
  }, [isReader, onGoHome, onOpenBooks, onShowChapters, onShowVerses, onOpenSearch]);
}
