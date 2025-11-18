export async function createOrderApi(
  payload: any,
): Promise<{ message: string }> {
  const response = await fetch(`/api/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const res = await response.json();
    throw new Error(res.status || 'Failed to create orders');
  }
  return response.json();
}
