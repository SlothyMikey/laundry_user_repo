import Button from '@mui/material/Button';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import ConfirmationModal from '@/components/modals/confirmationModal';
import {
  type BookingRequestCardProps,
  statusStyle,
} from '@/helpers/BookingTypes';
import { useState } from 'react';

export default function BookingRequestCard({
  booking,
  onAccept,
  onDecline,
  acceptingId,
  decliningId,
}: BookingRequestCardProps) {
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const isAccepting = acceptingId === booking.id;
  const isDeclining = decliningId === booking.id;

  function handleAcceptConfirm() {
    setShowAcceptModal(false);
    onAccept(booking.id);
  }

  function handleDeclineConfirm() {
    setShowDeclineModal(false);
    onDecline(booking.id);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {booking.customerName}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <CalendarTodayOutlinedIcon sx={{ fontSize: 14 }} />
            <span>{booking.requestDate}</span>
          </div>
        </div>

        <span
          className={`px-2 py-1 rounded text-[11px] font-medium ${statusStyle[booking.status]}`}
        >
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </span>
      </div>

      {/* Contact */}
      <div className="mt-4 space-y-1.5">
        {booking.phone && (
          <div className="flex items-center gap-2 text-[13px] text-gray-700">
            <PhoneOutlinedIcon
              sx={{ fontSize: 16 }}
              className="text-gray-400"
            />
            <span>{booking.phone}</span>
          </div>
        )}
        {booking.email && (
          <div className="flex items-center gap-2 text-[13px] text-gray-700">
            <EmailOutlinedIcon
              sx={{ fontSize: 16 }}
              className="text-gray-400"
            />
            <span>{booking.email}</span>
          </div>
        )}
        {booking.address && (
          <div className="flex items-center gap-2 text-[13px] text-gray-700">
            <LocationOnOutlinedIcon
              sx={{ fontSize: 16 }}
              className="text-gray-400"
            />
            <span>{booking.address}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-[13px] text-gray-700">
          <CalendarTodayOutlinedIcon
            sx={{ fontSize: 16 }}
            className="text-gray-400"
          />
          <span>{booking.pickupDate}</span>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-gray-700">
          <PaymentOutlinedIcon
            sx={{ fontSize: 16 }}
            className="text-gray-400"
          />
          <span>{booking.paymentType}</span>
        </div>
      </div>

      {/* Bundle / Services */}
      {booking.bundleName && (
        <>
          <div className="my-3 h-px bg-gray-200" />
          <div className="flex">
            <p className="text-[12px] font-medium text-gray-600 mb-1">
              Package:
            </p>
            <div className="w-full flex justify-between items-center ml-2">
              <p className="text-sm font-medium text-gray-800">
                {booking.bundleName}
              </p>
              <p>
                {booking.loadSize} load{booking.loadSize !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </>
      )}
      {booking.services && booking.services.length > 0 && (
        <>
          <div className="my-3 h-px bg-gray-200" />
          <div className="flex">
            <p className="text-[12px] font-medium text-gray-600 mb-1">
              Services:
            </p>
            <div className="w-full flex justify-between items-center ml-2">
              <p className="text-sm font-medium text-gray-800">
                {booking.services.map((s) => s.name).join(' ')}
              </p>
              <p>
                {booking.loadSize} load{booking.loadSize !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Special Instructions */}
      {booking.specialInstructions &&
        booking.specialInstructions.trim() !== '' && (
          <>
            <div className="my-3 h-px bg-gray-200" />
            <div>
              <p className="text-[12px] font-medium text-gray-600 mb-1">
                Special Instructions:
              </p>
              <p className="text-sm text-gray-800">
                {booking.specialInstructions}
              </p>
            </div>
          </>
        )}

      {/* Supplies */}
      {booking.suppliesNeeded && booking.suppliesNeeded.length > 0 && (
        <>
          <div className="my-3 h-px bg-gray-200" />
          <div>
            <p className="text-[12px] font-medium text-gray-600 mb-2">
              Supplies Needed:
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {booking.suppliesNeeded.map((s, i) => (
                <span key={`${s.name}-${i}`} className="text-sm text-gray-800">
                  • {s.name}:{' '}
                  <span className="text-blue-600 font-medium">
                    {s.quantity}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Total (optional) */}
      {typeof booking.totalAmount === 'number' && (
        <>
          <div className="my-3 h-px bg-gray-200" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total</span>
            <span className="font-semibold text-gray-900">
              ₱{booking.totalAmount.toLocaleString()}
            </span>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Button
          variant="contained"
          fullWidth
          disabled={isAccepting || isDeclining}
          onClick={() => setShowAcceptModal(true)}
          sx={{ textTransform: 'none', py: 0.75 }}
        >
          {isAccepting ? 'Accepting…' : 'Accept'}
        </Button>
        <Button
          variant="outlined"
          fullWidth
          disabled={isAccepting || isDeclining}
          onClick={() => setShowDeclineModal(true)}
          sx={{ textTransform: 'none', py: 0.75 }}
        >
          {isDeclining ? 'Declining…' : 'Decline'}
        </Button>
        {/* Accept Confirmation Modal */}
        <ConfirmationModal
          open={showAcceptModal}
          onClose={() => setShowAcceptModal(false)}
          onConfirm={handleAcceptConfirm}
          title="Accept Booking"
          message={`Are you sure you want to accept the booking request from ${booking.customerName}? This will confirm the booking for ${booking.pickupDate}.`}
          confirmText="Accept"
          cancelText="Cancel"
          loading={isAccepting}
        />

        {/* Decline Confirmation Modal */}
        <ConfirmationModal
          open={showDeclineModal}
          onClose={() => setShowDeclineModal(false)}
          onConfirm={handleDeclineConfirm}
          title="Decline Booking"
          message={`Are you sure you want to decline the booking request from ${booking.customerName}? This action cannot be undone.`}
          confirmText="Decline"
          cancelText="Cancel"
          loading={isDeclining}
        />
      </div>
    </div>
  );
}
