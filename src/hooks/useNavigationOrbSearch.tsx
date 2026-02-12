import { useState, useRef, useCallback, useEffect, useMemo, type ChangeEvent } from 'react';
import { searchVerses } from '../lib/api';
import type { SearchResult } from '../lib/api';

export type SearchStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

const MIN_QUERY_LENGTH = 3;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface UseNavigationOrbSearchParams {
  mode: 'index' | 'search';
}

export function useNavigationOrbSearch({ mode }: UseNavigationOrbSearchParams) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const latestSearchRequest = useRef(0);

  const resetSearchFeedback = useCallback(() => {
    latestSearchRequest.current += 1;
    setDebouncedQuery('');
    setSearchResults([]);
    setSearchStatus('idle');
    setSearchError(null);
    setHasSearched(false);
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
      setDebouncedQuery(trimmed);
    }, 300);
    return () => clearTimeout(handler);
  }, [query, mode]);

  useEffect(() => {
    if (mode !== 'search' || !debouncedQuery) return;

    const requestId = ++latestSearchRequest.current;
    let cancelled = false;

    const run = async () => {
      setSearchStatus('loading');
      setSearchError(null);

      try {
        const response = await searchVerses(debouncedQuery);
        if (cancelled || latestSearchRequest.current !== requestId) return;
        if (response.verses.length === 0) {
          setSearchResults([]);
          setSearchStatus('empty');
          setHasSearched(true);
          return;
        }
        setSearchResults(response.verses);
        setSearchStatus('ready');
        setHasSearched(true);
      } catch (err) {
        if (cancelled || latestSearchRequest.current !== requestId) return;
        setSearchStatus('error');
        setSearchError(err instanceof Error ? err.message : 'No se pudo buscar');
        setHasSearched(true);
      }
    };

    const timeout = setTimeout(run, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [debouncedQuery, mode]);

  const searchStatusLabel = useMemo(() => {
    switch (searchStatus) {
      case 'ready':
        return `${searchResults.length} coincidenc${searchResults.length === 1 ? 'ia' : 'ias'}`;
      case 'empty':
        return 'Sin resultados';
      case 'loading':
        return 'Buscando...';
      case 'error':
        return 'Error de búsqueda';
      default:
        return query.trim().length >= MIN_QUERY_LENGTH ? 'Buscando...' : 'Escribe para comenzar';
    }
  }, [searchStatus, searchResults.length, query]);

  const showHelper = mode === 'search' && query.trim().length < MIN_QUERY_LENGTH;

  const renderHighlightedText = useCallback((text: string) => {
    if (!debouncedQuery) return text;
    const regex = new RegExp(`(${escapeRegExp(debouncedQuery)})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => (
      index % 2 === 1 ? (
        <mark key={`${part}-${index}`} className="bg-gold/20 text-cream px-1 py-0.5 rounded-sm">{part}</mark>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      )
    ));
  }, [debouncedQuery]);

  return {
    query,
    debouncedQuery,
    searchResults,
    searchStatus,
    searchError,
    hasSearched,
    handleSearchInput,
    clearSearchState,
    showHelper,
    searchStatusLabel,
    renderHighlightedText,
  };
}
