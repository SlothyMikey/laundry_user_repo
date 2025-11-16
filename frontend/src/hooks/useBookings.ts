import { useCallback, useEffect, useState } from 'react';
import type { BookingApi } from '@/helpers/BookingTypes';

interface UseBookingsOptions {
  status: 'Pending' | 'Accepted' | 'Declined' | 'History';
  page?: number;
  limit?: number;
  order?: 'asc' | 'desc';
}

interface ApiResponse {
  page: number;
  limit: number;
  total: number;
  data: BookingApi[];
}

export function useBookings({
  status,
  page = 1,
  limit = 20,
  order = 'asc',
}: UseBookingsOptions) {
  const [data, setData] = useState<BookingApi[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        status,
        page: String(page),
        limit: String(limit),
        order,
      }).toString();
      const res = await fetch(`/api/bookings?${qs}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [status, page, limit, order]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    total,
    page,
    limit,
    order,
    loading,
    error,
    refetch: fetchData,
  };
}
