import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export function PWAUpdateToast() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateSWRef = useRef<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    updateSWRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onRegisteredSW(_swUrl, registration) {
        // Periodically check for updates while the app is open (every hour).
        if (registration) {
          setInterval(() => {
            registration.update().catch(() => { /* noop */ });
          }, 60 * 60 * 1000);
        }
      },
    });
  }, []);

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'min(92vw, 380px)',
        animation: 'pwa-update-in 380ms cubic-bezier(0.22,1,0.36,1) forwards',
      }}
    >
      <style>{`
        @keyframes pwa-update-in {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div
        style={{
          background: 'linear-gradient(135deg, #111111 0%, #1a1710 100%)',
          border: '1px solid rgba(201,168,76,0.35)',
          borderRadius: '0.75rem',
          padding: '1rem 1.15rem',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08)',
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: 'var(--font-serif, Georgia, serif)',
              color: '#c9a84c',
              fontSize: '0.9rem',
              fontWeight: 600,
              margin: 0,
              marginBottom: '0.2rem',
            }}
          >
            Nueva versión disponible
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans, system-ui, sans-serif)',
              color: '#d4cfc5',
              fontSize: '0.74rem',
              opacity: 0.8,
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Actualiza para obtener los últimos cambios.
          </p>
        </div>

        <button
          onClick={() => updateSWRef.current?.(true)}
          style={{
            background: 'linear-gradient(135deg, #c9a84c, #a8883a)',
            border: 'none',
            borderRadius: '0.4rem',
            color: '#0a0a08',
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '0.45rem 0.95rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
            whiteSpace: 'nowrap',
            letterSpacing: '0.02em',
          }}
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
