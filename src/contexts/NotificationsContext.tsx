import { createContext, useContext, useState, useEffect, type FC, type ReactNode } from 'react';

type NotificationsContextType = {
  expiringDriversCount: number | null;
  setExpiringDriversCount: (n: number | null) => void;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [expiringDriversCount, setExpiringDriversCount] = useState<number | null>(null);
  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      const apiBase = import.meta.env.VITE_API_BASE_URL;
      const apiKey = import.meta.env.VITE_API_KEY;
      if (!apiBase) {
        if (mounted) setExpiringDriversCount(0);
        return;
      }
      const endpoints = [
        '/notifications/drivers-license-expiry',
        '/drivers/expiring',
        '/drivers/license-expiry',
      ];
      for (const ep of endpoints) {
        try {
          const url = `${apiBase}${ep}?days=30`;
          const res = await fetch(url, { headers: { 'x-api-key': apiKey } });
          if (!res.ok) continue;
          const body = await res.json();
          let count = 0;
          if (Array.isArray(body)) count = body.length;
          else if (body && typeof body === 'object') {
            if (typeof (body as any).count === 'number') count = (body as any).count;
            else if (Array.isArray((body as any).items)) count = (body as any).items.length;
            else if (Array.isArray((body as any).data)) count = (body as any).data.length;
            else if (Array.isArray((body as any).drivers)) count = (body as any).drivers.length;
          }
          if (mounted) setExpiringDriversCount(count);
          return;
        } catch (e) {
          // try next endpoint
        }
      }
      if (mounted) setExpiringDriversCount(0);
    };
    fetchCount();
    return () => { mounted = false; };
  }, []);
  return (
    <NotificationsContext.Provider value={{ expiringDriversCount, setExpiringDriversCount }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}

export default NotificationsContext;
