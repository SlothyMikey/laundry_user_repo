import { useState, useMemo } from 'react';
import SearchBar from '@/components/ui/SearchBar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import RefreshIcon from '@mui/icons-material/Refresh';
import { statusStyle, type BookingStatus } from '@/helpers/BookingTypes';
import { useBookings } from '@/hooks/useBookings';
import ViewModal from '@/components/modals/ViewModal';
import IconButton from '@mui/material/IconButton';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';

const TABLE_HEADERS = [
  { label: 'Customer', align: 'left' as const },
  { label: 'Contact', align: 'left' as const },
  { label: 'Pickup Date', align: 'left' as const },
  { label: 'Services', align: 'left' as const },
  { label: 'Total', align: 'right' as const },
  { label: 'Status', align: 'center' as const },
  { label: 'Action', align: 'center' as const },
];

export default function BookingHistory() {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const historyHook = useBookings({
    notStatus: 'Pending',
    page: page + 1,
    limit: rowsPerPage,
    search: searchQuery,
    order: 'desc',
  });

  const loading = historyHook.loading;
  const error = historyHook.error;

  const bookings = useMemo(() => {
    return historyHook.data.map((b: any) => {
      const bundle = b.details?.find(
        (d: any) => d.service_type === 'bundle_package',
      );
      const mainServices = (b.details || []).filter(
        (d: any) => d.service_type === 'main_service',
      );
      const supplies = (b.details || []).filter(
        (d: any) => d.service_type === 'add_on_supply',
      );
      return {
        id: b.booking_id,
        customerName: b.customer_name,
        email: b.email,
        phone: b.phone_number,
        address: b.address,
        pickupDate: new Date(b.pickup_date).toLocaleDateString(),
        createdAt: new Date(b.created_at).toLocaleString(),
        services: bundle
          ? bundle.service_name
          : mainServices.map((m: any) => m.service_name).join(', '),
        serviceDetails: {
          bundle: bundle?.service_name,
          mainServices: mainServices.map((m: any) => ({
            name: m.service_name,
            quantity: m.quantity,
          })),
          supplies: supplies.map((s: any) => ({
            name: s.service_name,
            quantity: s.quantity,
          })),
        },
        paymentType: b.payment_type,
        specialInstructions: b.special_instruction,
        status: b.status,
        total: b.total_amount,
      };
    });
  }, [historyHook.data]);

  function handleChangePage(_event: unknown, newPage: number) {
    setPage(newPage);
  }

  function handleChangeRowsPerPage(event: React.ChangeEvent<HTMLInputElement>) {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }

  function handleRefresh() {
    historyHook.refetch();
  }

  function handleViewBooking(booking: any) {
    setSelectedBooking(booking);
    setViewModalOpen(true);
  }

  return (
    <div className="">
      <div className="card-container">
        <div className="md:flex md:justify-between items-center mb-6">
          <div>
            <h1 className="font-semibold text-lg">Booking History</h1>
            <p className="text-gray-500 text-sm">
              All accepted and declined booking requests
            </p>
          </div>
          <SearchBar
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="mt-4 md:mt-0 w-full md:w-sm"
          />
        </div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-gray-500">
            Showing {bookings.length} of {historyHook.total} results
          </p>
          <Button
            onClick={handleRefresh}
            startIcon={<RefreshIcon fontSize="small" />}
            size="small"
            sx={{ textTransform: 'none' }}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid #e5e7eb' }}
        >
          <Table
            sx={{ minWidth: 650 }}
            aria-label="booking history table"
            size="small"
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                {TABLE_HEADERS.map((header) => (
                  <TableCell
                    key={header.label}
                    align={header.align}
                    sx={{ fontWeight: 600, py: 1.5 }}
                  >
                    {header.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_HEADERS.length}
                    align="center"
                    sx={{ py: 3 }}
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_HEADERS.length}
                    align="center"
                    sx={{ py: 3, color: 'red' }}
                  >
                    Failed to load bookings
                  </TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_HEADERS.length}
                    align="center"
                    sx={{ py: 3, color: 'gray' }}
                  >
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell sx={{ py: 1.5 }}>
                      {booking.customerName}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{booking.email}</div>
                        <div className="text-gray-500 text-xs">
                          {booking.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: '0.875rem' }}>
                      {booking.pickupDate}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: '0.875rem' }}>
                      {booking.services}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ py: 1.5, fontSize: '0.875rem' }}
                    >
                      ₱{booking.total.toLocaleString()}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <span
                        className={`px-3 py-1 rounded-md text-[11px] font-medium text-white ${
                          statusStyle[
                            booking.status.toLowerCase() as BookingStatus
                          ]
                        }`}
                      >
                        {booking.status}
                      </span>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewBooking(booking)}
                        sx={{
                          color: 'black',
                          fontSize: '0.875rem',
                          gap: 0.5,
                          borderRadius: 1,
                          padding: '4px 8px',
                        }}
                        title="View details"
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                        View
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={historyHook.total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </div>

      {/* View Modal */}
      <ViewModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Booking Details"
        maxWidth="sm"
      >
        {selectedBooking && ModalContents({ selectedBooking })}
      </ViewModal>
    </div>
  );
}

function ModalContents({ selectedBooking }: { selectedBooking: any }) {
  const createdDisplay = selectedBooking.createdAt;
  const pickupDisplay = `${selectedBooking.pickupDate}`;
  const supplies = selectedBooking.serviceDetails.supplies || [];
  const mainServices = selectedBooking.serviceDetails.mainServices || [];

  return (
    <div className="space-y-5 text-sm text-gray-700">
      <div className="flex flex-col gap-2 border-b pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-blue-600 font-semibold">
            Booking #{selectedBooking.id}
          </p>
          <span
            className={`px-3 py-1 rounded-md text-xs font-semibold text-white ${
              statusStyle[selectedBooking.status.toLowerCase() as BookingStatus]
            }`}
          >
            {selectedBooking.status}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Created {createdDisplay} · Pickup {pickupDisplay}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-semibold mb-1">
            <PersonOutlineIcon sx={{ fontSize: 18 }} />
            Customer
          </div>
          <div className="space-y-1">
            <p>{selectedBooking.customerName}</p>
            <p className="text-gray-500">{selectedBooking.phone}</p>
            {selectedBooking.email && (
              <p className="text-gray-500">{selectedBooking.email}</p>
            )}
            {selectedBooking.address && (
              <p className="text-gray-500">{selectedBooking.address}</p>
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-semibold mb-1">
            <CalendarTodayOutlinedIcon sx={{ fontSize: 18 }} />
            Schedule
          </div>
          <div className="space-y-1">
            <p>Pickup Date: {selectedBooking.pickupDate}</p>
            {selectedBooking.paymentType && (
              <p>Payment Type: {selectedBooking.paymentType}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-semibold">
          <LocalShippingOutlinedIcon sx={{ fontSize: 18 }} />
          Services & Supplies
        </div>

        {selectedBooking.serviceDetails.bundle && (
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
            <p className="text-xs text-blue-700 uppercase font-semibold">
              Bundle
            </p>
            <p className="text-sm font-medium text-blue-900">
              {selectedBooking.serviceDetails.bundle}
            </p>
          </div>
        )}

        {mainServices.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Main Services
            </p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Service</th>
                    <th className="text-right px-3 py-2 font-medium">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {mainServices.map((item: any, idx: number) => (
                    <tr
                      key={`main-${idx}`}
                      className="border-t border-gray-100"
                    >
                      <td className="px-3 py-2 text-gray-800">{item.name}</td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {supplies.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Supplies
            </p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Item</th>
                    <th className="text-right px-3 py-2 font-medium">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {supplies.map((item: any, idx: number) => (
                    <tr
                      key={`supply-${idx}`}
                      className="border-t border-gray-100"
                    >
                      <td className="px-3 py-2 text-gray-800">{item.name}</td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedBooking.specialInstructions && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
          <p className="text-xs uppercase text-gray-500 font-semibold mb-1">
            Special Instructions
          </p>
          <p className="text-gray-700">{selectedBooking.specialInstructions}</p>
        </div>
      )}

      <div className="pt-3 border-t flex justify-between items-center">
        <span className="text-base font-semibold text-gray-700">
          Total Amount
        </span>
        <span className="text-lg font-bold text-gray-900">
          ₱{selectedBooking.total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
