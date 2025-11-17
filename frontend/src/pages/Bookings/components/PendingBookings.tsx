import { useState } from 'react';
import { useBookings } from '@/hooks/useBookings';
import BookingRequestCard from '@/components/cards/BookingRequestCard';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import { declineBooking, acceptBooking } from '@/helpers/BookingUtils';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';

export default function PendingBookings() {
  const { data, loading, error, refetch } = useBookings({
    status: 'Pending',
    page: 1,
    limit: 20,
  });

  const { toast, showSuccess, showError, hideToast } = useToast();
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [decliningId, setDecliningId] = useState<number | null>(null);

  // API call to accept booking
  async function handleAccept(id: number) {
    setAcceptingId(id);
    try {
      const result = await acceptBooking(id);
      showSuccess(result.message || 'Booking accepted successfully!');
      await refetch();
    } catch (err) {
      console.error('Accept booking error:', err);
      showError(
        err instanceof Error ? err.message : `Failed to accept booking ${err}`,
      );
    } finally {
      setAcceptingId(null);
    }
  }

  // API call to decline booking
  async function handleDecline(id: number) {
    setDecliningId(id);
    try {
      await declineBooking(id);
      showSuccess('Booking declined successfully!');
      await refetch();
    } catch (err) {
      console.error('Decline booking error:', err);
      showError(
        err instanceof Error ? err.message : 'Failed to decline booking',
      );
    } finally {
      setDecliningId(null);
    }
  }

  async function handleRefresh() {
    try {
      await refetch();
      showSuccess('Bookings refreshed!');
    } catch (err) {
      showError('Failed to refresh bookings');
    }
  }

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
          onClick={handleRefresh}
          disabled={loading}
          startIcon={<RefreshIcon fontSize="small" />}
          sx={{
            textTransform: 'none',
          }}
          title="Refresh bookings"
        >
          Refresh
        </Button>
      </div>

      {/* Cards grid */}
      {!data.length ? (
        <div className="text-sm text-gray-500 flex justify-center">
          No pending bookings.
        </div>
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
                  loadSize: bundle
                    ? bundle?.quantity
                    : mainServices[0]?.quantity || 0,

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
                onAccept={handleAccept}
                onDecline={handleDecline}
                acceptingId={acceptingId}
                decliningId={decliningId}
              />
            );
          })}
        </div>
      )}

      {/* Toast notifications */}
      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={hideToast}
      />
    </>
  );
}
