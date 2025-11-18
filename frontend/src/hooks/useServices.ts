import { useState } from 'react';
import type { ApiServiceResponse } from '@/helpers/BookingTypes';
import { fetchAllActiveServices } from '@/api/services';

export function useServices() {
  const [services, setServices] = useState<ApiServiceResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllActiveServices();
      if (!data) {
        setServices([]);
        setError('No services available');
        return;
      }

      if (!Array.isArray(data)) {
        setServices([]);
        setError('Invalid data format');
        return;
      }
      setServices(data);
    } catch (err) {
      setError((err as Error).message);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  return { services, loading, error, loadServices };
}
