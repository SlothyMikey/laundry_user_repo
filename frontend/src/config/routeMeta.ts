export interface RouteMeta {
  title: string;
  subtitle?: string;
}

export const routeMeta: Record<string, RouteMeta> = {
  '/createOrder': {
    title: 'Create New Order',
    subtitle: 'Add a new walk-in customer order',
  },
  '/overview': {
    title: 'Sales & Revenue',
    subtitle: 'Track your daily, weekly, and monthly revenue',
  },
  '/bookings': {
    title: 'Booking Requests',
    subtitle: 'Review and approve customer booking requests',
  },
  '/orders': {
    title: 'Order Management',
    subtitle: 'Monitor active orders and view order history',
  },
  '/services': {
    title: 'Service Management',
    subtitle: 'Manage services, pricing, and create service bundles',
  },
  '/customers': {
    title: 'Customers',
    subtitle: 'View and manage customer information',
  },
  '/inventory': {
    title: 'Inventory Management',
    subtitle: 'Track supplies and stock levels',
  },
  '/help': {
    title: 'Help & Support',
    subtitle: 'User guide and main branch contact information',
  },
};
