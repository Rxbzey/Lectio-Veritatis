import { useCallback, useRef, useState } from 'react';
import { ShareImageTemplate } from '@/components/ShareImageTemplate';
import {
  downloadDataUrl,
  generateShareBlob,
  generateSharePng,
} from '@/lib/shareImage';

interface ShareSheetProps {
  bookName: string;
  bookAbbrev: string;
  chapter: number;
  rangeStart: number;
  rangeEnd: number;
  verses: { number: number; text: string }[];
  onClose: () => void;
}

type Status = 'idle' | 'copying' | 'copied' | 'rendering' | 'sharing' | 'error';

function buildShareUrl(bookAbbrev: string, chapter: number, start: number, end: number): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const path = start === end ? `/${bookAbbrev}/${chapter}/${start}` : `/${bookAbbrev}/${chapter}/${start}-${end}`;
  return `${base}${path}`;
}

function buildShareText(bookName: string, chapter: number, verses: { number: number; text: string }[]): string {
  const body = verses.map((v) => `${v.number}. ${v.text}`).join('\n');
  return `${bookName} ${chapter}\n\n${body}`;
}

export function ShareSheet({
  bookName,
  bookAbbrev,
  chapter,
  rangeStart,
  rangeEnd,
  verses,
  onClose,
}: ShareSheetProps) {
  const templateRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const url = buildShareUrl(bookAbbrev, chapter, rangeStart, rangeEnd);
  const text = buildShareText(bookName, chapter, verses);
  const filename = `${bookAbbrev}-${chapter}-${rangeStart}${rangeStart !== rangeEnd ? `-${rangeEnd}` : ''}.png`;

  const renderImage = useCallback(async (): Promise<Blob | null> => {
    if (!templateRef.current) return null;
    setStatus('rendering');
    try {
      const blob = await generateShareBlob(templateRef.current);
      return blob;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando imagen');
      setStatus('error');
      return null;
    }
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      setStatus('copying');
      await navigator.clipboard.writeText(url);
      setStatus('copied');
      setTimeout(() => setStatus('idle'), 1800);
    } catch {
      setError('No se pudo copiar el enlace');
      setStatus('error');
    }
  }, [url]);

  const handleDownloadImage = useCallback(async () => {
    try {
      if (!templateRef.current) return;
      setStatus('rendering');
      const dataUrl = await generateSharePng(templateRef.current);
      downloadDataUrl(dataUrl, filename);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando imagen');
      setStatus('error');
    }
  }, [filename]);

  const handleWebShare = useCallback(async () => {
    if (!navigator.share) {
      await handleCopyLink();
      return;
    }
    try {
      setStatus('sharing');
      const blob = await renderImage();
      const file = blob ? new File([blob], filename, { type: 'image/png' }) : null;

      const payload: ShareData = {
        title: `${bookName} ${chapter}`,
        text,
        url,
      };
      if (file && navigator.canShare?.({ files: [file] })) {
        payload.files = [file];
      }
      await navigator.share(payload);
      setStatus('idle');
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      setError('No se pudo compartir');
      setStatus('error');
    }
  }, [bookName, chapter, filename, handleCopyLink, renderImage, text, url]);

  const isSingle = rangeStart === rangeEnd;
  const rangeLabel = isSingle ? `Versículo ${rangeStart}` : `Versículos ${rangeStart}–${rangeEnd}`;
  const hasWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <>
      {/* Hidden template for image generation (positioned off-screen but rendered). */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          left: '-99999px',
          top: 0,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <ShareImageTemplate
          ref={templateRef}
          bookName={bookName}
          chapter={chapter}
          verses={verses}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          url={url}
        />
      </div>

      <style>{`
        @keyframes share-sheet-in {
          from { opacity: 0; transform: translate(-50%, 24px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <div
        role="dialog"
        aria-label="Compartir pasaje"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9998,
          width: 'min(94vw, 520px)',
          animation: 'share-sheet-in 350ms cubic-bezier(0.22,1,0.36,1) forwards',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #111111 0%, #1a1710 100%)',
            border: '1px solid rgba(201,168,76,0.35)',
            borderRadius: '1rem',
            padding: '1rem 1.15rem',
            boxShadow: '0 12px 50px rgba(0,0,0,0.75), 0 0 0 1px rgba(201,168,76,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontSize: '1rem',
                  color: '#c9a84c',
                  margin: 0,
                  lineHeight: 1.3,
                }}
              >
                {bookName} <span style={{ opacity: 0.7 }}>{chapter}</span>
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-sans, system-ui, sans-serif)',
                  fontSize: '0.72rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(212,207,197,0.55)',
                  margin: '0.2rem 0 0 0',
                }}
              >
                {rangeLabel}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar selección"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(212,207,197,0.55)',
                fontSize: '1.25rem',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '0.25rem 0.4rem',
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {hasWebShare && (
              <button
                onClick={handleWebShare}
                disabled={status === 'sharing' || status === 'rendering'}
                style={{
                  flex: '1 1 140px',
                  background: 'linear-gradient(135deg, #c9a84c, #a8883a)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#0a0a08',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '0.55rem 0.85rem',
                  cursor: status === 'sharing' ? 'wait' : 'pointer',
                  fontFamily: 'var(--font-sans, system-ui, sans-serif)',
                  letterSpacing: '0.04em',
                  opacity: status === 'sharing' ? 0.7 : 1,
                }}
              >
                {status === 'sharing' ? 'Preparando…' : 'Compartir'}
              </button>
            )}

            <button
              onClick={handleCopyLink}
              style={{
                flex: '1 1 120px',
                background: 'transparent',
                border: '1px solid rgba(201,168,76,0.35)',
                borderRadius: '0.5rem',
                color: '#c9a84c',
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '0.55rem 0.85rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans, system-ui, sans-serif)',
                letterSpacing: '0.04em',
              }}
            >
              {status === 'copied' ? '✓ Copiado' : 'Copiar enlace'}
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={status === 'rendering'}
              style={{
                flex: '1 1 120px',
                background: 'transparent',
                border: '1px solid rgba(201,168,76,0.35)',
                borderRadius: '0.5rem',
                color: '#c9a84c',
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '0.55rem 0.85rem',
                cursor: status === 'rendering' ? 'wait' : 'pointer',
                fontFamily: 'var(--font-sans, system-ui, sans-serif)',
                letterSpacing: '0.04em',
                opacity: status === 'rendering' ? 0.7 : 1,
              }}
            >
              {status === 'rendering' ? 'Generando…' : 'Descargar imagen'}
            </button>
          </div>

          {error && (
            <p
              style={{
                margin: 0,
                color: 'rgba(239,100,100,0.85)',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-sans, system-ui, sans-serif)',
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
