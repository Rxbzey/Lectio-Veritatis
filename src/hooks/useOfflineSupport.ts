import { useOfflineBibleBootstrap } from '@/hooks/useOfflineBibleBootstrap';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useProgressSyncQueue } from '@/hooks/useProgressSyncQueue';

export function useOfflineSupport() {
  useOfflineBibleBootstrap();

  const { isOnline } = useNetworkStatus();
  useProgressSyncQueue(isOnline);

  return { isOnline };
}
