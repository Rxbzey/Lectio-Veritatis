import { useOfflineBibleBootstrap } from './useOfflineBibleBootstrap';
import { useNetworkStatus } from './useNetworkStatus';
import { useProgressSyncQueue } from './useProgressSyncQueue';
import { useServiceWorkerRegistration } from './useServiceWorkerRegistration';

export function useOfflineSupport() {
  useServiceWorkerRegistration();
  useOfflineBibleBootstrap();

  const { isOnline } = useNetworkStatus();
  useProgressSyncQueue(isOnline);

  return { isOnline };
}
