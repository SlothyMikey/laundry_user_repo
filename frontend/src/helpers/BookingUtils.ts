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
