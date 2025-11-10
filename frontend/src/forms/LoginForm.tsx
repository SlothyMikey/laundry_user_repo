import { useState } from 'react';
import Button from '@mui/material/Button';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import useLogin from '@/hooks/useLogin';
import { useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { login, loading, error } = useLogin();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const username = String(data.get('username') ?? '');
    const password = String(data.get('password') ?? '');

    console.log('Logging in...'); // Debug log
    const { ok } = await login(username, password);
    console.log('Login result:', ok); // Debug log

    if (ok) {
      console.log('Navigating to dashboard'); // Debug log
      navigate('/dashboard', { replace: true });
    }
  }
  return (
    <>
      {loading ? (
        <div className="loader mx-auto my-8"></div>
      ) : (
        <>
          <div className="w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
            <div className="flex flex-col items-center mb-4 space-y-2">
              <p className="text-lg font-bold">Employee Access Only</p>
              <p className="text-muted">
                Sign in to manage orders, inventory, and more..
              </p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="username">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div className="relative mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  type={visible ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  required
                />
                <div
                  className="absolute right-3 top-10 cursor-pointer"
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <Visibility /> : <VisibilityOff />}
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
              >
                Sign In
              </Button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
