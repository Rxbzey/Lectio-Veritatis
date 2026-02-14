import { type ChangeEvent, type RefObject } from 'react';
import type { SearchResult } from '@/lib/api';
import type { SearchStatus } from '@/hooks/useNavigationOrbSearch';

interface NavigationOrbSearchPanelProps {
  searchInputRef: RefObject<HTMLInputElement | null>;
  query: string;
  onQueryChange: (event: ChangeEvent<HTMLInputElement>) => void;
  isOnline?: boolean;
  searchStatusLabel: string;
  showHelper: boolean;
  searchStatus: SearchStatus;
  searchError: string | null;
  hasSearched: boolean;
  debouncedQuery: string;
  searchResults: SearchResult[];
  onSelectResult: (result: SearchResult) => void;
  renderHighlightedText: (text: string) => React.ReactNode;
}

export function NavigationOrbSearchPanel({
  searchInputRef,
  query,
  onQueryChange,
  isOnline = true,
  searchStatusLabel,
  searchStatus,
  searchError,
  hasSearched,
  debouncedQuery,
  searchResults,
  onSelectResult,
  renderHighlightedText,
}: NavigationOrbSearchPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="font-sans text-[10px] md:text-[11px] tracking-[0.55em] uppercase text-gold/45">Buscar en toda la Biblia</div>
        <div className="relative group">
          <div className="absolute inset-0 translate-y-3 pointer-events-none opacity-0 group-focus-within:opacity-100 transition duration-700">
            <div className="w-full h-[120%] blur-3xl bg-linear-to-r from-gold/25 via-transparent to-gold/25" />
          </div>

          <input
            ref={searchInputRef}
            value={query}
            onChange={onQueryChange}
            className="w-full bg-transparent border-b border-white/15 focus:border-gold/80 focus:shadow-[0_15px_45px_rgba(201,168,76,0.15)] focus:outline-none font-serif text-xl text-cream placeholder:text-cream/30 py-3 pr-4 transition-all duration-500"
            placeholder={isOnline ? 'Ej. Misericordia, esperanza, pan de vida' : 'Sin conexión: búsqueda local disponible'}
            aria-label="Buscar versículos"
            autoComplete="off"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-gold/45">{searchStatusLabel}</p>
          {!isOnline && (
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-cream/45">Modo sin conexión</p>
          )}
        </div>
       
      </div>

      

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        

        {!isOnline && (
          <div className="text-cream/55 font-serif text-base">
            Estás sin conexión. Buscando sobre el contenido local descargado.
          </div>
        )}

        {searchStatus === 'loading' && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse bg-white/5 rounded-2xl h-20 border border-white/5" />
            ))}
          </div>
        )}

        {searchStatus === 'error' && searchError && (
          <div className="text-rose-300/80 font-serif text-base bg-rose-400/5 border border-rose-400/15 rounded-xl p-4">
            {searchError}
          </div>
        )}

        {searchStatus === 'empty' && hasSearched && (
          <div className="text-cream/55 font-serif text-base">
            No encontramos coincidencias para “{debouncedQuery}”. Prueba con otra palabra o un sinónimo.
          </div>
        )}

           <div className="flex flex-col gap-9">
          {searchStatus === 'ready' && searchResults.map((result, index) => (
            <div key={`${result.book.abbrev.pt}-${result.chapter}-${result.number}`} className="relative">
              {index > 0 && (
                <span className="absolute -top-3 left-6 right-6 h-px" aria-hidden="true" />
              )}
              <button
                onClick={() => onSelectResult(result)}
                className="w-full text-left transition-all duration-500 group relative overflow-hidden"
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 " />
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div>
                    <p className="font-serif text-xl text-gold/80">{result.book.name}</p>
                    <p className="font-sans text-[10px] tracking-[0.5em] uppercase text-gold/50">
                      Capítulo {result.chapter} · Versículo {result.number}
                    </p>
                  </div>
                </div>
                <p className="font-serif text-lg text-cream/80 leading-relaxed relative z-10">
                  {renderHighlightedText(result.text)}
                </p>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
