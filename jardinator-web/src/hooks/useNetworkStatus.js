import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return isOnline;
}

// true = l'app tourne en local (version .deb ou dev)
export function useIsLocalMode() {
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}
