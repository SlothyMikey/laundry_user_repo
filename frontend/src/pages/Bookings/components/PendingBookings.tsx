import { useBookings } from '@/hooks/useBookings';
import BookingRequestCard from '@/components/cards/BookingRequestCard';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function PendingBookings() {
  const { data, loading, error, refetch } = useBookings({
    status: 'Pending',
    page: 1,
    limit: 20,
    order: 'asc',
  });

  if (loading)
    return <div className="mt-4 text-sm text-gray-500">Loading…</div>;
  if (error)
    return (
      <div className="mt-4 text-sm text-red-600">
        Failed.{' '}
        <button onClick={refetch} className="underline">
          Retry
        </button>
      </div>
    );

  return (
    <>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {data.length} pending booking{data.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={() => refetch()}
          disabled={loading}
          sx={{
            color: 'gray',
            textTransform: 'none',
            fontSize: '0.875rem',
            gap: 1,
          }}
          title="Refresh bookings"
        >
          <RefreshIcon fontSize="small" /> Refresh
        </Button>
      </div>

      {/* Cards grid */}
      {!data.length ? (
        <div className="text-sm text-gray-500">No pending bookings.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((b) => {
            const bundle = b.details.find(
              (d) => d.service_type === 'bundle_package',
            );
            const mainServices = b.details.filter(
              (d) => d.service_type === 'main_service',
            );
            const supplies = b.details.filter(
              (d) => d.service_type === 'add_on_supply',
            );

            return (
              <BookingRequestCard
                key={b.booking_id}
                booking={{
                  id: b.booking_id,
                  customerName: b.customer_name,
                  requestDate: new Date(b.pickup_date).toLocaleDateString(),
                  phone: b.phone_number,
                  email: b.email,
                  address: b.address,
                  pickupDate: new Date(b.pickup_date).toLocaleDateString(),
                  bundleName: bundle?.service_name || null,
                  services: mainServices.map((s) => ({
                    name: s.service_name,
                    quantity: s.quantity,
                    lineTotal: s.line_total,
                  })),
                  suppliesNeeded: supplies.map((s) => ({
                    name: s.service_name,
                    quantity: s.quantity,
                  })),
                  paymentType: b.payment_type,
                  specialInstructions: b.special_instruction,
                  totalAmount: b.total_amount,
                  status: 'pending',
                }}
                onAccept={(id) => console.log('Accept', id)}
                onDecline={(id) => console.log('Decline', id)}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
