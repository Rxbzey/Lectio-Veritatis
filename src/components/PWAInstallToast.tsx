import { useEffect, useRef, useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const DISMISS_KEY = 'pwa-toast-dismissed';
const DISMISS_UNTIL_DAYS = 7;

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() < Number(raw);
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    const until = Date.now() + DISMISS_UNTIL_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(until));
  } catch {
    /* noop */
  }
}

export function PWAInstallToast() {
  const { isInstallable, isInstalled, isPrompting, triggerInstall } = usePWAInstall();
  const [shown, setShown] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shouldShow = isInstallable && !isInstalled && !wasDismissedRecently();

  useEffect(() => {
    if (!shouldShow) return;
    timerRef.current = setTimeout(() => setShown(true), 1200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [shouldShow]);

  const visible = shown && shouldShow;

  function dismiss() {
    setExiting(true);
    markDismissed();
    setTimeout(() => {
      setShown(false);
      setExiting(false);
    }, 350);
  }

  async function handleInstall() {
    const outcome = await triggerInstall();
    if (outcome === 'accepted' || outcome === 'dismissed') {
      dismiss();
    }
  }

  if (!visible) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="false"
      aria-label="Instalar aplicación"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'min(92vw, 400px)',
        animation: exiting
          ? 'pwa-toast-out 350ms ease forwards'
          : 'pwa-toast-in 400ms cubic-bezier(0.22,1,0.36,1) forwards',
      }}
    >
      <style>{`
        @keyframes pwa-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pwa-toast-out {
          from { opacity: 1; transform: translateX(-50%) translateY(0); }
          to   { opacity: 0; transform: translateX(-50%) translateY(16px); }
        }
      `}</style>

      <div
        style={{
          background: 'linear-gradient(135deg, #111111 0%, #1a1710 100%)',
          border: '1px solid rgba(201,168,76,0.35)',
          borderRadius: '0.75rem',
          padding: '1.1rem 1.25rem',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.08)',
          display: 'flex',
          gap: '0.9rem',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: '1.6rem', lineHeight: 1, flexShrink: 0 }}>📖</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: 'var(--font-serif, Georgia, serif)',
              color: '#c9a84c',
              fontSize: '0.9rem',
              fontWeight: 600,
              marginBottom: '0.2rem',
              letterSpacing: '0.01em',
            }}
          >
            Instalar Lectio Veritatis
          </p>
          <p
            style={{
              fontFamily: 'var(--font-sans, system-ui, sans-serif)',
              color: '#d4cfc5',
              fontSize: '0.78rem',
              opacity: 0.85,
              lineHeight: 1.4,
            }}
          >
            Accede sin conexión, más rápido y sin navegador.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={dismiss}
            aria-label="Cerrar"
            style={{
              background: 'transparent',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '0.4rem',
              color: 'rgba(212,207,197,0.6)',
              fontSize: '0.75rem',
              padding: '0.35rem 0.6rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans, system-ui, sans-serif)',
              transition: 'border-color 0.2s, color 0.2s',
            }}
          >
            Ahora no
          </button>
          <button
            onClick={handleInstall}
            disabled={isPrompting}
            style={{
              background: 'linear-gradient(135deg, #c9a84c, #a8883a)',
              border: 'none',
              borderRadius: '0.4rem',
              color: '#0a0a08',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '0.35rem 0.85rem',
              cursor: isPrompting ? 'wait' : 'pointer',
              fontFamily: 'var(--font-sans, system-ui, sans-serif)',
              opacity: isPrompting ? 0.7 : 1,
              transition: 'opacity 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {isPrompting ? 'Instalando…' : 'Instalar'}
          </button>
        </div>
      </div>
    </div>
  );
}
