import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: number | null;
}

/**
 * Tracks browser online/offline status with reconnection awareness.
 * `wasOffline` is true if the user was recently offline and just reconnected,
 * useful for triggering data re-sync after network recovery.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(
    typeof navigator !== 'undefined' && navigator.onLine ? Date.now() : null
  );

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setWasOffline(true);
    setLastOnlineAt(Date.now());
    // Clear wasOffline flag after 10s
    setTimeout(() => setWasOffline(false), 10_000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline, lastOnlineAt };
}
