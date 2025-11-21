//Implement Abort Controller to cancel fetch on unmount or option change

import { useCallback, useEffect, useState } from 'react';
import type { BookingApi } from '@/helpers/BookingTypes';
import { useDebounce } from './useDebounce';

type BookingStatus = 'Pending' | 'Accepted' | 'Declined';

interface BaseOptions {
  page?: number;
  limit?: number;
  order?: 'asc' | 'desc';
  search?: string;
  from?: string;
  to?: string;
}

/**
 * UseBookingsOptions enforces that you provide EITHER `status` OR `notStatus`.
 * - To fetch only a specific status: { status: 'Pending' }
 * - To fetch all except a status: { notStatus: 'Declined' }
 * Providing both or neither will produce a TypeScript error.
 */
type UseBookingsOptions =
  | ({ status: BookingStatus; notStatus?: never } & BaseOptions)
  | ({ notStatus: BookingStatus; status?: never } & BaseOptions);

interface ApiResponse {
  page: number;
  limit: number;
  total: number;
  data: BookingApi[];
}

export function useBookings(options: UseBookingsOptions) {
  const {
    status,
    notStatus,
    page = 1,
    limit = 20,
    order = 'asc',
    search,
    from,
    to,
  } = options;

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 500);

  const [data, setData] = useState<BookingApi[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query params; only append not_status if provided
      const qsObj: Record<string, string> = {
        page: String(page),
        limit: String(limit),
        order,
      };
      if (status) qsObj.status = status;
      if (notStatus) qsObj['not_status'] = notStatus;
      if (debouncedSearch) qsObj.search = debouncedSearch;
      if (from) qsObj.from = from;
      if (to) qsObj.to = to;
      const qs = new URLSearchParams(qsObj).toString();
      const res = await fetch(`/api/bookings?${qs}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse = await res.json();
      let incoming = json.data || [];
      // Client-side exclusion fallback if backend still returned excluded status
      if (notStatus) {
        incoming = incoming.filter((b) => b.status !== notStatus);
      }
      setData(incoming);
      setTotal(json.total || incoming.length);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [status, notStatus, page, limit, order, debouncedSearch, from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    total,
    page,
    limit,
    order,
    notStatus,
    loading,
    error,
    refetch: fetchData,
  };
}
