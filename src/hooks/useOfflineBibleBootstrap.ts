import { useEffect } from 'react';
import { warmOfflineBooksCache } from '../lib/api';

export function useOfflineBibleBootstrap() {
  useEffect(() => {
    void warmOfflineBooksCache().catch((error) => {
      console.warn('Failed warming offline Bible cache', error);
    });
  }, []);
}
