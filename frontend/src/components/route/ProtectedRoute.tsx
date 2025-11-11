import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { isAuthenticated, verifyToken } from '@/helpers/authUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false; // Prevent state updates if component unmounts

    async function checkAuth() {
      if (!isAuthenticated()) {
        if (!cancelled) {
          setValid(false);
          setChecking(false);
        }
        return;
      }

      const result = await verifyToken();
      if (!cancelled) {
        setValid(!!result.ok);
        setAuthError(
          result.ok ? null : (result.error ?? 'Authentication required'),
        );
        setChecking(false);
      }
    }

    checkAuth();

    // Cleanup function
    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return null; // render nothing (could show spinner)
  }

  if (!valid) {
    // pass the auth error message to the login page so it can display a notice
    return <Navigate to="/login" replace state={{ authError }} />;
  }

  return <>{children}</>;
}
