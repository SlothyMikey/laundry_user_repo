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
    let body: any = {};
    try {
      body = await response.json();
    } catch {
      // ignore parse error and fall back to generic message
    }
    const message =
      body.error || body.message || 'Failed to create order. Please try again.';
    throw new Error(message);
  }
  return response.json();
}

type OrderStatus =
  | 'Stand By'
  | 'Processing'
  | 'Ready'
  | 'Completed'
  | 'Cancelled';

export async function fetchOrdersApi(
  page = 1,
  limit = 20,
  order: 'asc' | 'desc' = 'asc',
  notStatus?: OrderStatus | OrderStatus[],
): Promise<any> {
  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('limit', String(limit));
  qs.set('order', order);

  const excludedStatuses = Array.isArray(notStatus)
    ? notStatus
    : notStatus
      ? [notStatus]
      : [];
  if (excludedStatuses.length) {
    qs.set('notStatus', excludedStatuses.map((s) => s.toLowerCase()).join(','));
  }

  const response = await fetch(`/api/orders?${qs.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch orders (${response.status})`);
  }
  return response.json();
}

async function mutateOrderStatus(
  orderId: number | undefined,
  body: Record<string, unknown>,
  endpoint: string = `/api/orders/${orderId}/status`,
) {
  console.debug('[mutateOrderStatus] calling', endpoint, 'body:', body);

  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  const text = await response.text().catch(() => '');
  console.debug('[mutateOrderStatus] response:', {
    url: response.url,
    status: response.status,
    text,
  });

  if (!response.ok) {
    let errorBody: any = { text };
    try {
      errorBody = JSON.parse(text);
    } catch {
      // keep fallback shape
    }

    // Prefer backend-provided user-facing error text
    const backendMessage = errorBody.error || errorBody.message;
    const errMsg =
      backendMessage ||
      (response.status === 400
        ? 'Unable to update order. Please check the data and try again.'
        : 'Something went wrong while updating the order. Please try again.');

    console.error('[mutateOrderStatus] error', {
      status: response.status,
      url: response.url,
      backendMessage,
      rawText: text,
    });
    throw new Error(errMsg);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function updateOrderStatusApi(orderId: number, status: string) {
  return mutateOrderStatus(orderId, { status });
}

export function cancelOrderApi(orderId: number) {
  return mutateOrderStatus(orderId, { status: 'Cancelled' });
}

export function updatePaymentStatusApi(
  orderId: number,
  payment_status: string,
  paid_amount?: number,
) {
  const body: Record<string, unknown> = { payment_status };
  if (typeof paid_amount === 'number') {
    body.paid_amount = paid_amount;
  }
  return mutateOrderStatus(orderId, body, `/api/orders/${orderId}/payment`);
}

export async function editOrderApi(
  orderId: number,
  updatedDetails: any[],
): Promise<{ message: string }> {
  const response = await fetch(`/api/orders/${orderId}/edit`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ updatedDetails }),
  });
  if (!response.ok) {
    let body: any = {};
    try {
      body = await response.json();
    } catch {
      // ignore parse error and fall back to generic message
    }
    const message =
      body.error || body.message || 'Failed to edit order. Please try again.';
    throw new Error(message);
  }
  return response.json();
}
