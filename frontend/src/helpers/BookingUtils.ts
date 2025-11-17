export async function declineBooking(id: number): Promise<Response> {
  const response = await fetch(`/api/bookings/decline/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to decline booking');
  }
  return response;
}

export async function acceptBooking(id: number): Promise<{ message: string }> {
  const response = await fetch(`/api/bookings/accept/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to accept booking');
  }

  return response.json();
}
