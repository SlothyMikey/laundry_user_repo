import type { ApiServiceResponse } from '@/helpers/BookingTypes';

export async function fetchAllActiveServices(): Promise<ApiServiceResponse[]> {
  const response = await fetch(`api/services/active`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch active services');
  }
  const data = await response.json();
  return data;
}
