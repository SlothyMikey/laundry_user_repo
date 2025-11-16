import { useState } from 'react';
import Button from '@mui/material/Button';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { Shield } from '@mui/icons-material';

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleGoogleSuccess(credentialResponse: any) {
    setLoading(true);
    setError(null);

    try {
      const decoded: any = jwtDecode(credentialResponse.credential);

      const resp = await fetch('/api/users/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleToken: credentialResponse.credential,
          email: decoded.email,
          name: decoded.name,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      const data = await resp.json();
      localStorage.setItem('token', data.accessToken);
      navigate('/', { replace: true });
    } catch (err) {
      setError('Authentication failed');
      setLoading(false);
    }
  }

  return (
    <>
      {loading ? (
        <div className="loader mx-auto my-8"></div>
      ) : (
        <div className="max-w-md w-full mt-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Sign In
              </h2>
              <p className="text-sm text-gray-600">
                Access your laundry management overview
              </p>
            </div>

            {/* Google Sign In Button */}
            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google login failed')}
                text="signin_with"
                theme="outline"
                size="large"
                width="270"
              />
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-gray-500 bg-white uppercase tracking-wider">
                  Secure Login
                </span>
              </div>
            </div>

            {/* Access Notice */}
            <div className="flex items-center justify-center gap-2 bg-blue-50 py-3 px-4 rounded-lg">
              <Shield className="text-blue-600" sx={{ fontSize: 18 }} />
              <p className="text-sm text-blue-700 font-medium">
                Access for authorized staff only
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
