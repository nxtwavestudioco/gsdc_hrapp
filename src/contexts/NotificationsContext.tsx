/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type FC, type ReactNode } from 'react';

type NotificationsContextType = {
  expiringDriversCount: number | null;
  setExpiringDriversCount: (n: number | null) => void;
  expiringDrivers: Record<string, unknown>[] | null;
  setExpiringDrivers: (list: Record<string, unknown>[] | null) => void;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

type Employee = Record<string, unknown>;
const getStringProp = (o: Employee, ...keys: string[]) => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
  }
  return undefined;
};

export const NotificationsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [expiringDriversCount, setExpiringDriversCount] = useState<number | null>(null);
  const [expiringDrivers, setExpiringDrivers] = useState<Record<string, unknown>[] | null>(null);
  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      const apiBase = import.meta.env.VITE_API_BASE_URL;
      const apiKey = import.meta.env.VITE_API_KEY;
      if (!apiBase) {
        if (mounted) setExpiringDriversCount(0);
        return;
      }
      // Try fetching the full employees list first and derive expiries locally.
      // This avoids multiple failing notification endpoint requests on hosts
      // where those endpoints do not exist.
      try {
        const empRes = await fetch(`${apiBase}/employees`, { headers: { 'x-api-key': apiKey } });
        if (empRes.ok) {
          const employees = await empRes.json();
          if (Array.isArray(employees) && mounted) {
            const now = Date.now();
            const list = (employees as Employee[]).filter((it: Employee) => {
              const maybe = getStringProp(it, 'licenseExpiry', 'driversLicenseExpiry', 'DriversLicenseExpiryDate', 'drivers_license_expiry', 'license_expiry_date', 'licenseexpiry');
              if (!maybe) return false;
              const d = new Date(maybe).getTime();
              if (Number.isNaN(d)) return false;
              const daysLeft = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
              return daysLeft <= 30 && daysLeft >= 0;
            });
            setExpiringDriversCount(list.length);
            setExpiringDrivers(list as Record<string, unknown>[]);
            return; // done, no need to hit notification endpoints
          }
        }
      } catch {
        // ignore and fall through to notification endpoints
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
            const b = body as Record<string, unknown>;
            if (typeof b['count'] === 'number') count = b['count'] as number;
            else if (Array.isArray(b['items'])) count = (b['items'] as unknown[]).length;
            else if (Array.isArray(b['data'])) count = (b['data'] as unknown[]).length;
            else if (Array.isArray(b['drivers'])) count = (b['drivers'] as unknown[]).length;
          }
          if (mounted) {
            setExpiringDriversCount(count);
            // if endpoint returned array-like items, and we can normalize, set list too
            if (Array.isArray(body)) {
              setExpiringDrivers(body as Record<string, unknown>[]);
            } else if (body && typeof body === 'object') {
              const b = body as Record<string, unknown>;
              const arr = Array.isArray(b['items']) ? (b['items'] as unknown[]) : Array.isArray(b['data']) ? (b['data'] as unknown[]) : Array.isArray(b['drivers']) ? (b['drivers'] as unknown[]) : [];
              if (Array.isArray(arr)) setExpiringDrivers(arr as Record<string, unknown>[]);
            }
          }
          return;
        } catch {
          // try next endpoint
        }
      }
      if (mounted) {
        setExpiringDriversCount(0);
        setExpiringDrivers([]);
      }
    };
    fetchCount();
    return () => { mounted = false; };
  }, []);
  return (
    <NotificationsContext.Provider value={{ expiringDriversCount, setExpiringDriversCount, expiringDrivers, setExpiringDrivers }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}

