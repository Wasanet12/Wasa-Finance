import { useState, useEffect, useCallback } from 'react';
import { services } from '@/lib/firestore';
import type { Customer, Package, Expense, ApiResponse } from '@/lib/types';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STALE_WHILE_REVALIDATE = 30 * 1000; // 30 seconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isFetching: boolean;
}

interface UseFirestoreCacheOptions {
  cacheTime?: number;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
}

// Global cache storage
const cache = new Map<string, CacheEntry<unknown>>();

// Simple data cache hook
export function useFirestoreCache<T>(
  key: string,
  fetcher: () => Promise<ApiResponse<T>>,
  options: UseFirestoreCacheOptions = {}
) {
  const {
    cacheTime = CACHE_DURATION,
    revalidateOnFocus = true,
    revalidateOnReconnect = true
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStale = useCallback((timestamp: number) => {
    return Date.now() - timestamp > cacheTime;
  }, [cacheTime]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cached = cache.get(key);

    // Return cached data if available and not force refreshing
    if (cached && !forceRefresh && !isStale(cached.timestamp)) {
      setData(cached.data);
      setLoading(false);
      setError(null);
      return cached.data;
    }

    // Start fetching if no cached data or stale
    if (!cached || forceRefresh || isStale(cached.timestamp)) {
      setLoading(true);
      setError(null);

      try {
        const result = await fetcher();

        if (result.success && result.data) {
          const cacheEntry: CacheEntry<T> = {
            data: result.data,
            timestamp: Date.now(),
            isFetching: false
          };

          cache.set(key, cacheEntry);
          setData(result.data);
          setError(null);
        } else {
          setError(result.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    return cached?.data || null;
  }, [key, fetcher, isStale]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Revalidate on window focus
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      const cached = cache.get(key);
      if (cached && isStale(cached.timestamp)) {
        fetchData(); // Background revalidation
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [key, fetchData, isStale, revalidateOnFocus]);

  // Revalidate on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return;

    const handleOnline = () => {
      fetchData(); // Revalidate when coming back online
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchData, revalidateOnReconnect]);

  const mutate = useCallback(async (newData?: T) => {
    if (newData !== undefined) {
      // Optimistic update
      const cacheEntry: CacheEntry<T> = {
        data: newData,
        timestamp: Date.now(),
        isFetching: false
      };
      cache.set(key, cacheEntry);
      setData(newData);
    }

    // Revalidate from server
    return await fetchData(true);
  }, [key, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    mutate
  };
}

// Specialized hooks for common data types
export function useCustomers(options?: UseFirestoreCacheOptions) {
  return useFirestoreCache<Customer[]>(
    'customers',
    () => services.customer.getAll(),
    options
  );
}

export function useActiveCustomers(options?: UseFirestoreCacheOptions) {
  return useFirestoreCache<Customer[]>(
    'active-customers',
    () => services.customer.getByStatus('active'),
    options
  );
}

export function usePackages(options?: UseFirestoreCacheOptions) {
  return useFirestoreCache<Package[]>(
    'packages',
    () => services.package.getActive(),
    options
  );
}

export function useExpenses(options?: UseFirestoreCacheOptions) {
  return useFirestoreCache<Expense[]>(
    'expenses',
    () => services.expense.getAll(),
    options
  );
}

// Preload function for navigation optimization
export function preloadData(keys: string[]) {
  keys.forEach(key => {
    if (!cache.has(key)) {
      // Trigger background fetch for commonly accessed data
      switch (key) {
        case 'customers':
          services.customer.getAll();
          break;
        case 'packages':
          services.package.getActive();
          break;
        case 'expenses':
          services.expense.getAll();
          break;
      }
    }
  });
}

// Cache management utilities
export const cacheUtils = {
  clear: () => cache.clear(),

  invalidate: (key: string) => {
    cache.delete(key);
  },

  invalidateAll: (pattern: string) => {
    for (const [key] of cache.entries()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  },

  getCacheSize: () => cache.size,

  getCacheInfo: () => {
    const entries = Array.from(cache.entries());
    return {
      totalEntries: entries.length,
      entries: entries.map(([key, value]) => ({
        key,
        age: Date.now() - value.timestamp,
        size: JSON.stringify(value.data).length
      }))
    };
  }
};