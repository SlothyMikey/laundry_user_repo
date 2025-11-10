import Logo from '@/components/ui/Logo';
import LoginForm from '@/forms/LoginForm';
import loginImage from '@/assets/loginImage.png';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '@/helpers/authUtils';

export default function Login() {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <>
      <section className="min-h-screen flex bg-gray-100">
        {/* Left Side - Image or Illustration */}
        <div
          className="w-1/2 bg-gradient-to-br from-pink-100 to-blue-100"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 100%)',
            backgroundImage: `url(${loginImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>
        {/* Container for Form */}
        <div className="w-1/2 flex flex-col justify-center items-center">
          {/* Top Section */}
          <div className="flex flex-col items-center gap-1">
            <Logo className="w-16 h-16 text-blue-500 mx-auto mt-4 p-2 bg-light rounded" />
            <p className="font-semibold text-lg text-txt-highlight">
              Laver Savon
            </p>
            <p className="text-lg">Laundry Management System</p>
          </div>
          {/* Login Form Section */}
          <LoginForm />
          {/* Bottom Note */}
          <p className="text-muted text-center mt-4 text-sm">
            For authorized personnel only. Unauthorized access is prohibited.
          </p>
        </div>
      </section>
    </>
  );
}
