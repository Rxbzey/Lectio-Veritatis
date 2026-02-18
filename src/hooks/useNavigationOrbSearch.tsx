import { useState, useRef, useCallback, useEffect, useMemo, useReducer, type ChangeEvent } from 'react';
import { searchVerses } from '@/lib/api';
import type { SearchResult } from '@/lib/api';

export type SearchStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

const MIN_QUERY_LENGTH = 3;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface HighlightedTextProps {
  text: string;
  query: string;
}

export function HighlightedText({ text, query }: HighlightedTextProps) {
  if (!query) return <>{text}</>;
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  const parts = text.split(regex);
  let charOffset = 0;
  return (
    <>
      {parts.map((part, index) => {
        const key = `${part}-${charOffset}`;
        charOffset += part.length;
        return index % 2 === 1 ? (
          <mark key={key} className="bg-gold/20 text-cream px-1 py-0.5 rounded-sm">{part}</mark>
        ) : (
          <span key={key}>{part}</span>
        );
      })}
    </>
  );
}

interface SearchState {
  debouncedQuery: string;
  searchResults: SearchResult[];
  searchStatus: SearchStatus;
  searchError: string | null;
  hasSearched: boolean;
}

type SearchAction =
  | { type: 'SET_DEBOUNCED_QUERY'; query: string }
  | { type: 'SEARCH_START' }
  | { type: 'SEARCH_SUCCESS'; results: SearchResult[] }
  | { type: 'SEARCH_EMPTY' }
  | { type: 'SEARCH_ERROR'; error: string }
  | { type: 'RESET' };

const initialSearchState: SearchState = {
  debouncedQuery: '',
  searchResults: [],
  searchStatus: 'idle',
  searchError: null,
  hasSearched: false,
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_DEBOUNCED_QUERY':
      return { ...state, debouncedQuery: action.query };
    case 'SEARCH_START':
      return { ...state, searchStatus: 'loading', searchError: null };
    case 'SEARCH_SUCCESS':
      return { ...state, searchResults: action.results, searchStatus: 'ready', hasSearched: true };
    case 'SEARCH_EMPTY':
      return { ...state, searchResults: [], searchStatus: 'empty', hasSearched: true };
    case 'SEARCH_ERROR':
      return { ...state, searchStatus: 'error', searchError: action.error, hasSearched: true };
    case 'RESET':
      return initialSearchState;
  }
}

interface UseNavigationOrbSearchParams {
  mode: 'index' | 'search';
}

export function useNavigationOrbSearch({ mode }: UseNavigationOrbSearchParams) {
  const [query, setQuery] = useState('');
  const [state, dispatch] = useReducer(searchReducer, initialSearchState);
  const latestSearchRequest = useRef(0);

  const resetSearchFeedback = useCallback(() => {
    latestSearchRequest.current += 1;
    dispatch({ type: 'RESET' });
  }, []);

  const clearSearchState = useCallback(() => {
    setQuery('');
    resetSearchFeedback();
  }, [resetSearchFeedback]);

  const handleSearchInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);

    if (value.trim().length < MIN_QUERY_LENGTH) {
      resetSearchFeedback();
    }
  }, [resetSearchFeedback]);

  useEffect(() => {
    if (mode !== 'search') return;
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return;
    }
    const handler = setTimeout(() => {
      dispatch({ type: 'SET_DEBOUNCED_QUERY', query: trimmed });
    }, 300);
    return () => clearTimeout(handler);
  }, [query, mode]);

  useEffect(() => {
    if (mode !== 'search' || !state.debouncedQuery) return;

    const requestId = ++latestSearchRequest.current;
    let cancelled = false;

    const run = async () => {
      dispatch({ type: 'SEARCH_START' });

      try {
        const response = await searchVerses(state.debouncedQuery);
        if (cancelled || latestSearchRequest.current !== requestId) return;
        if (response.verses.length === 0) {
          dispatch({ type: 'SEARCH_EMPTY' });
          return;
        }
        dispatch({ type: 'SEARCH_SUCCESS', results: response.verses });
      } catch (err) {
        if (cancelled || latestSearchRequest.current !== requestId) return;
        dispatch({ type: 'SEARCH_ERROR', error: err instanceof Error ? err.message : 'No se pudo buscar' });
      }
    };

    const timeout = setTimeout(run, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [state.debouncedQuery, mode]);

  const searchStatusLabel = useMemo(() => {
    switch (state.searchStatus) {
      case 'ready':
        return `${state.searchResults.length} coincidenc${state.searchResults.length === 1 ? 'ia' : 'ias'}`;
      case 'empty':
        return 'Sin resultados';
      case 'loading':
        return 'Buscando...';
      case 'error':
        return 'Error de búsqueda';
      default:
        return query.trim().length >= MIN_QUERY_LENGTH ? 'Buscando...' : 'Escribe para comenzar';
    }
  }, [state.searchStatus, state.searchResults.length, query]);

  const showHelper = mode === 'search' && query.trim().length < MIN_QUERY_LENGTH;

  return {
    query,
    debouncedQuery: state.debouncedQuery,
    searchResults: state.searchResults,
    searchStatus: state.searchStatus,
    searchError: state.searchError,
    hasSearched: state.hasSearched,
    handleSearchInput,
    clearSearchState,
    showHelper,
    searchStatusLabel,
  };
}
