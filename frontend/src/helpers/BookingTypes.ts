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
