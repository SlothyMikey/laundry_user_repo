import '@/global.css';
import { Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import ProtectedRoute from '@/components/route/ProtectedRoute';
import Layout from '@/components/route/Layout';
import Customers from '@/pages/Customers';
import Bookings from '@/pages/Bookings';
import NotFound from '@/pages/404';

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Protected routes with shared layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="bookings" element={<Bookings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
