import Logo from '@/components/ui/Logo';
import LoginForm from '@/forms/LoginForm';
import loginImage from '@/assets/loginImage.png';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '@/helpers/authUtils';

export default function Login() {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  const location = useLocation();
  const authError = (location.state as any)?.authError as string | undefined;
  return (
    <>
      <section className="min-h-screen flex bg-gray-100">
        {/* Left Side - Image or Illustration */}
        <div
          className="w-1/2 hidden md:block bg-gradient-to-br from-pink-100 to-blue-100"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 100%)',
            backgroundImage: `url(${loginImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>
        {/* Container for Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6">
          {/* Top Section */}
          <div className="flex flex-col items-center gap-1">
            <Logo className="w-16 h-16 text-light mx-auto mt-4 p-2 bg-bg-highlight rounded-xl shadow-sm" />
            <p className="font-semibold text-lg text-txt-highlight">
              Laver Savon
            </p>
            <p className="text-lg font-thin">Laundry Management System</p>
          </div>
          {/* Login Form Section */}
          {authError && (
            <div className="max-w-md w-full mx-auto mt-8 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded">
              {authError}
            </div>
          )}
          <LoginForm />
          {/* Footer */}
          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Professional Laundry Services
            </p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              © 2025 Laver-Savon. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
