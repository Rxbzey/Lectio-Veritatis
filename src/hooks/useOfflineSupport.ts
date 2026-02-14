import { useOfflineBibleBootstrap } from '@/hooks/useOfflineBibleBootstrap';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useProgressSyncQueue } from '@/hooks/useProgressSyncQueue';
import { useServiceWorkerRegistration } from '@/hooks/useServiceWorkerRegistration';

export function useOfflineSupport() {
  useServiceWorkerRegistration();
  useOfflineBibleBootstrap();

  const { isOnline } = useNetworkStatus();
  useProgressSyncQueue(isOnline);

  return { isOnline };
}
