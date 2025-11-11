import type { LoginResponse } from '@/helpers/authTypes';

export async function verifyCredentials(
  username: string,
  password: string,
): Promise<LoginResponse> {
  try {
    const resp = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!resp.ok) {
      const data = await resp.json();
      return { ok: false, error: data.error || 'Invalid credentials' };
    }

    const data = await resp.json();
    console.log('Token received:', data.accessToken); // Debug log
    if (data.accessToken) localStorage.setItem('token', data.accessToken);
    return { ok: true, token: data.accessToken };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}

export async function refreshAccessToken(): Promise<LoginResponse> {
  try {
    const resp = await fetch('/api/users/refresh', {
      method: 'POST',
      credentials: 'include', // to include cookies
    });

    if (!resp.ok) {
      const data = await resp.json();
      return { ok: false, error: data.error || 'Failed to refresh token' };
    }

    const data = await resp.json();
    if (data.accessToken) localStorage.setItem('token', data.accessToken);
    return { ok: true, token: data.accessToken };
  } catch (e) {
    return { ok: false, error: 'Network error' };
  }
}

export async function verifyToken(): Promise<LoginResponse> {
  const token = localStorage.getItem('token');
  if (!token) return { ok: false, error: 'No token found' };

  try {
    const resp = await fetch('/api/users/verify', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resp.ok) {
      console.log('Token invalid, attempting to refresh'); // Debug log
      const refreshResult = await refreshAccessToken();
      if (!refreshResult.ok) {
        localStorage.removeItem('token');
        return refreshResult;
      }
      console.log('Token refreshed successfully'); // Debug log
      return refreshResult;
    }

    return { ok: true, token };
  } catch (e) {
    localStorage.removeItem('token');
    return { ok: false, error: 'Network error' };
  }
}

export function isAuthenticated(): boolean {
  const token = localStorage.getItem('token');
  return !!token;
}

export function logout() {
  localStorage.removeItem('token');
}
