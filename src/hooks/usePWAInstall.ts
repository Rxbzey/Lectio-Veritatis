import { useCallback, useEffect, useRef, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isPrompting: boolean;
  outcome: 'accepted' | 'dismissed' | null;
}

const AUTO_TRIGGER_PARAM = 'install';
const AUTO_TRIGGER_VALUE = 'true';

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia?.('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(mq || iosStandalone);
}

function hasAutoInstallFlag(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get(AUTO_TRIGGER_PARAM) === AUTO_TRIGGER_VALUE;
}

export function usePWAInstall() {
  const [state, setState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: isStandaloneDisplay(),
    isPrompting: false,
    outcome: null,
  });

  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const autoTriggeredRef = useRef(false);

  const triggerInstall = useCallback(async () => {
    const event = deferredRef.current;
    if (!event) return null;

    setState((prev) => ({ ...prev, isPrompting: true }));

    try {
      await event.prompt();
      const choice = await event.userChoice;
      deferredRef.current = null;
      setState((prev) => ({
        ...prev,
        isPrompting: false,
        outcome: choice.outcome,
        isInstallable: false,
        isInstalled: choice.outcome === 'accepted' ? true : prev.isInstalled,
      }));
      return choice.outcome;
    } catch {
      setState((prev) => ({ ...prev, isPrompting: false }));
      return null;
    }
  }, []);

  useEffect(() => {
    if (isStandaloneDisplay()) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredRef.current = event as BeforeInstallPromptEvent;
      setState((prev) => ({ ...prev, isInstallable: true }));

      if (!autoTriggeredRef.current && hasAutoInstallFlag()) {
        autoTriggeredRef.current = true;
        void triggerInstall();
      }
    };

    const handleAppInstalled = () => {
      deferredRef.current = null;
      setState((prev) => ({
        ...prev,
        isInstallable: false,
        isInstalled: true,
        isPrompting: false,
        outcome: 'accepted',
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [triggerInstall]);

  return {
    ...state,
    triggerInstall,
  };
}
