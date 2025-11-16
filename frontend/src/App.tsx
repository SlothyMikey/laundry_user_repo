import '@/global.css';
import { Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import Login from '@/pages/Auth/Login';
import SalesOverview from '@/pages/Sales/SalesOverview';
import ProtectedRoute from '@/components/route/ProtectedRoute';
import Layout from '@/components/route/Layout';
import Customers from '@/pages/Customers/Customers';
import BookingRequest from '@/pages/Bookings/BookingsRequest';
import Orders from '@/pages/Orders/Orders';
import Help from '@/pages/Support/Help';
import Services from '@/pages/Services/Services';
import Inventory from '@/pages/Inventory/Inventory';
import CreateOrder from '@/pages/Orders/CreateOrders';

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
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="/createOrder" element={<CreateOrder />} />
          <Route path="/overview" element={<SalesOverview />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/bookings" element={<BookingRequest />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/services" element={<Services />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/help" element={<Help />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
