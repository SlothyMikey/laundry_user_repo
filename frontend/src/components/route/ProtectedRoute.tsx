import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { isAuthenticated, verifyToken } from '@/helpers/authUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);

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

      const isValid = await verifyToken();
      if (!cancelled) {
        setValid(isValid);
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
    return;
  }

  if (!valid) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
