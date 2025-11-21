import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from './useDebounce';

export interface OrderDetail {
  service_id: number;
  service_name: string;
  service_type: 'main_service' | 'add_on_supply' | 'bundle_package';
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface OrderRecord {
  order_id: number;
  order_code: string;
  booking_id: number | null;
  guest_name: string | null;
  guest_phone: string | null;
  customer_name: string;
  customer_phone: string | null;
  total_amount: string;
  paid_amount: string | null;
  payment_type: 'Cash' | 'Online';
  payment_status: 'Paid' | 'Unpaid' | 'Partial';
  source: 'Booking' | 'Walk-in';
  status: string;
  created_at: string;
  details: OrderDetail[];
  calculated_total: number;
}

type OrderStatus =
  | 'Stand By'
  | 'Processing'
  | 'Ready'
  | 'Completed'
  | 'Cancelled';

interface UseOrdersOptions {
  status?: string;
  notStatus?: OrderStatus | OrderStatus[];
  search?: string;
  page?: number;
  limit?: number;
  order?: 'asc' | 'desc';
}

interface UseOrdersResult {
  data: OrderRecord[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOrders({
  status,
  notStatus,
  search,
  page = 1,
  limit = 20,
  order = 'desc',
}: UseOrdersOptions = {}): UseOrdersResult {
  const [data, setData] = useState<OrderRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    params.set('order', order);
    if (status) params.set('status', status);
    if (notStatus) {
      const excluded = Array.isArray(notStatus) ? notStatus : [notStatus];
      params.set(
        'notStatus',
        excluded.map((value) => value.toLowerCase()).join(','),
      );
    }
    if (debouncedSearch?.trim()) params.set('search', debouncedSearch.trim());
    return params.toString();
  }, [status, notStatus, debouncedSearch, page, limit, order]);

  const fetchOrders = useCallback(async () => {
    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders?${queryString}`, {
        signal: controller.signal,
        credentials: 'include',
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to load orders');
      }

      const json = await response.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 0);
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchOrders();
    return () => abortRef.current?.abort();
  }, [fetchOrders]);

  return { data, total, totalPages, loading, error, refetch: fetchOrders };
}
