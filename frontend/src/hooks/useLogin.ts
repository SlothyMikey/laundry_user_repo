import { useState } from 'react';
import { verifyCredentials } from '@/helpers/authUtils';

export default function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(username: string, password: string) {
    setLoading(true);
    setError(null);

    const result = await verifyCredentials(username, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? 'Login failed');
      return { ok: false, result };
    }

    return { ok: true, token: result.token };
  }

  return { loading, error, login };
}
