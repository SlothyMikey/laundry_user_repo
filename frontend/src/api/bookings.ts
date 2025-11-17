import type { PendingBookingsResponse } from '@/helpers/BookingTypes';

export async function fetchPendingBookings(
  page = 1,
  limit = 20,
  order: 'asc' | 'desc' = 'asc',
): Promise<PendingBookingsResponse> {
  const qs = new URLSearchParams({
    status: 'Pending', // no extra quotes
    page: String(page),
    limit: String(limit),
    order,
  }).toString();

  const response = await fetch(`/api/bookings?${qs}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch pending bookings (${response.status})`);
  }

  return response.json();
}

export async function fetchNonPendingBookings(
  page = 1,
  limit = 10,
  order: 'asc' | 'desc' = 'asc',
): Promise<PendingBookingsResponse> {
  const qs = new URLSearchParams({
    notStatus: 'Pending',
    page: String(page),
    limit: String(limit),
    order,
  }).toString();

  const response = await fetch(`/api/bookings?${qs}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch non-pending bookings (${response.status})`,
    );
  }

  return response.json();
}
