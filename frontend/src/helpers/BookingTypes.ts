export interface BookingDetail {
  service_id: number;
  service_name: string;
  service_type: 'main_service' | 'add_on_supply' | 'bundle_package';
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface BookingApi {
  booking_id: number;
  customer_name: string;
  phone_number: string;
  email: string;
  address: string;
  pickup_date: string;
  payment_type: string;
  special_instruction: string;
  status: 'Pending' | 'Accepted' | 'Declined';
  details: BookingDetail[];
  total_amount: number;
}

export interface PendingBookingsResponse {
  page: number;
  limit: number;
  total: number;
  data: BookingApi[];
}

export type PendingBookingsProps =
  | { response: PendingBookingsResponse; bookings?: never }
  | { bookings: BookingApi[]; response?: never };

export type BookingStatus = 'pending' | 'accepted' | 'declined';

export interface ServiceLine {
  name: string;
  quantity: number;
  lineTotal?: number;
}

export interface BookingRequestCardData {
  id: number;
  customerName: string;
  requestDate: string;
  phone?: string;
  email?: string;
  address?: string;
  pickupDate: string;
  loadSize: number;
  bundleName?: string | null;
  services?: ServiceLine[];
  suppliesNeeded?: { name: string; quantity: number }[];
  paymentType?: string;
  specialInstructions?: string;
  totalAmount?: number;
  status: BookingStatus;
}

export interface BookingRequestCardProps {
  booking: BookingRequestCardData;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  acceptingId?: number | null;
  decliningId?: number | null;
}

export const statusStyle: Record<BookingStatus, string> = {
  pending: 'text-blue-700 bg-blue-50',
  accepted: 'text-green-700 bg-green-50',
  declined: 'text-red-700 bg-red-50',
};
