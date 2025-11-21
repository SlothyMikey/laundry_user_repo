import { useMemo, useState } from 'react';
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
import ViewModal from '@/components/modals/ViewModal';
import EditOrderModal from '@/components/modals/EditOrderModal';
import { useOrders, type OrderRecord } from '@/hooks/useOrders';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';
import {
  cancelOrderApi,
  updateOrderStatusApi,
  updatePaymentStatusApi,
  editOrderApi,
} from '@/api/orders';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ConfirmationModal from '@/components/modals/confirmationModal';

const ORDER_STATUS_STYLES: Record<string, string> = {
  'Stand By': 'bg-sky-500',
  Processing: 'bg-blue-500',
  Ready: 'bg-indigo-600',
  Completed: 'bg-gray-600',
  Cancelled: 'bg-red-500',
};

const STATUS_SEQUENCE = ['Stand By', 'Processing', 'Ready', 'Completed'];

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  unpaid: 'text-amber-600',
  paid: 'text-emerald-600',
  partial: 'text-blue-600',
};

const TABLE_HEADERS = [
  { label: 'Order Code', align: 'left' as const },
  { label: 'Customer', align: 'left' as const },
  { label: 'Service', align: 'left' as const },
  { label: 'Order Status', align: 'left' as const },
  { label: 'Payment Status', align: 'left' as const },
  { label: 'Total', align: 'left' as const },
  { label: 'Paid Amount', align: 'left' as const },
  { label: 'Created At', align: 'center' as const },
  { label: 'Action', align: 'center' as const },
];

export default function ActiveOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(
    null,
  );
  const [pendingAdvance, setPendingAdvance] = useState<OrderRecord | null>(
    null,
  );
  const [pendingPayment, setPendingPayment] = useState<OrderRecord | null>(
    null,
  );
  const [pendingCancel, setPendingCancel] = useState<OrderRecord | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<number | null>(
    null,
  );
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const { toast, showSuccess, showError, showInfo, hideToast } = useToast();

  const {
    data: orders,
    total,
    loading,
    error,
    refetch,
  } = useOrders({
    // Show only active-like orders: exclude completed/cancelled from this list
    notStatus: ['Completed', 'Cancelled'],
    page: page + 1,
    limit: rowsPerPage,
    order: 'asc',
    search: searchQuery,
  });

  const mappedOrders = useMemo(() => {
    return orders.map((order) => ({
      ...order,
      serviceSummary: summarizeServices(order.details),
    }));
  }, [orders]);

  function handleChangePage(_event: unknown, newPage: number) {
    setPage(newPage);
  }

  function requestMarkAsPaid(order: OrderRecord) {
    if (order.payment_status?.toLowerCase() === 'paid') return;
    setPendingPayment(order);
  }

  async function handleMarkAsPaid(order: OrderRecord) {
    if (order.payment_status?.toLowerCase() === 'paid') return;
    try {
      setUpdatingPaymentId(order.order_id);
      await updatePaymentStatusApi(order.order_id, 'Paid');
      showSuccess('Payment marked as Paid');
      refetch();
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Failed to update payment',
      );
    } finally {
      setUpdatingPaymentId(null);
      setPendingPayment(null);
    }
  }

  function handleChangeRowsPerPage(event: React.ChangeEvent<HTMLInputElement>) {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }

  function handleViewOrder(order: OrderRecord) {
    setSelectedOrder(order);
    setViewModalOpen(true);
  }

  function handleRefresh() {
    setSearchQuery('');
    setPage(0);
    refetch();
  }

  function requestAdvance(order: OrderRecord) {
    setPendingAdvance(order);
  }

  async function handleAdvanceStatus(order: OrderRecord) {
    const nextStatus = getNextStatus(order.status);
    if (!nextStatus) return;
    try {
      setUpdatingStatusId(order.order_id);
      await updateOrderStatusApi(order.order_id, nextStatus);
      showSuccess(`Order moved to ${nextStatus}`);
      refetch();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
      setPendingAdvance(null);
    }
  }

  function handleEditOrder(order: OrderRecord) {
    if (order.status !== 'Stand By') return;
    setEditingOrder(order);
    setEditModalOpen(true);
  }

  function requestCancelOrder(order: OrderRecord) {
    if (order.status !== 'Stand By') return;
    setPendingCancel(order);
  }

  async function handleCancelOrder(order: OrderRecord) {
    if (order.status !== 'Stand By') return;
    try {
      setCancellingOrderId(order.order_id);
      await cancelOrderApi(order.order_id);
      showSuccess('Order cancelled');
      refetch();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
      setPendingCancel(null);
    }
  }

  async function handleEditSubmit(updatedDetails: OrderRecord['details']) {
    if (!editingOrder) return;
    try {
      const sanitized = updatedDetails.filter((d) => {
        if (d.service_type === 'add_on_supply') return Number(d.quantity) > 0;
        return true;
      });
      await editOrderApi(editingOrder.order_id, sanitized);
      showSuccess('Order updated successfully');
      refetch();
      setEditModalOpen(false);
      setEditingOrder(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update order');
    }
  }

  return (
    <div>
      <div className="card-container">
        <div className="md:flex md:justify-between items-center mb-6">
          <div>
            <h1 className="font-semibold text-lg">Active Orders</h1>
            <p className="text-gray-500 text-sm">
              Monitor existing walk-in and delivery orders
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
            Showing {orders.length} of {total} results
          </p>
          <Button
            onClick={handleRefresh}
            startIcon={<RefreshIcon fontSize="small" />}
            size="small"
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>
        </div>

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid #e5e7eb' }}
        >
          <Table sx={{ minWidth: 650 }} aria-label="orders table" size="small">
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
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_HEADERS.length}
                    align="center"
                    sx={{ py: 3, color: 'red' }}
                  >
                    Failed to load orders
                  </TableCell>
                </TableRow>
              ) : mappedOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_HEADERS.length}
                    align="center"
                    sx={{ py: 3 }}
                  >
                    No orders to display yet
                  </TableCell>
                </TableRow>
              ) : (
                mappedOrders.map((order) => (
                  <TableRow
                    key={order.order_id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell sx={{ py: 1.5 }}>
                      <button
                        type="button"
                        onClick={() => handleViewOrder(order)}
                        className="text-blue-600 font-medium hover:underline"
                      >
                        {order.order_code || `Order #${order.order_id}`}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-gray-500 text-xs">
                          {order.customer_phone || order.guest_phone || '—'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: '0.875rem' }}>
                      {order.serviceSummary}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: '0.875rem' }}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-md text-[11px] font-medium text-white ${
                            ORDER_STATUS_STYLES[order.status] || 'bg-gray-400'
                          }`}
                        >
                          {order.status}
                        </span>
                        {getNextStatus(order.status) && (
                          <Tooltip
                            title={`Move to ${getNextStatus(order.status)}`}
                          >
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => requestAdvance(order)}
                                disabled={updatingStatusId === order.order_id}
                              >
                                <ChevronRightIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: '0.875rem' }}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            PAYMENT_STATUS_STYLES[
                              order.payment_status?.toLowerCase() || ''
                            ] || 'text-gray-700'
                          }`}
                        >
                          {order.payment_status || 'Unpaid'}
                        </span>
                        {order.payment_status?.toLowerCase() !== 'paid' && (
                          <Tooltip title="Mark as paid">
                            <span>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => requestMarkAsPaid(order)}
                                disabled={updatingPaymentId === order.order_id}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </div>
                      <span className="block text-xs text-gray-500">
                        {order.payment_type}
                      </span>
                    </TableCell>
                    <TableCell
                      align="left"
                      sx={{ py: 1.5, fontSize: '0.875rem' }}
                    >
                      ₱
                      {formatAmount(order.total_amount, order.calculated_total)}
                    </TableCell>
                    <TableCell
                      align="left"
                      sx={{ py: 1.5, fontSize: '0.875rem' }}
                    >
                      ₱{formatAmount(order.paid_amount ?? undefined)}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => handleEditOrder(order)}
                          disabled={order.status !== 'Stand By'}
                          sx={{ textTransform: 'none' }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="text"
                          size="small"
                          color="error"
                          onClick={() => requestCancelOrder(order)}
                          disabled={
                            order.status !== 'Stand By' ||
                            cancellingOrderId === order.order_id
                          }
                          sx={{ textTransform: 'none' }}
                        >
                          {cancellingOrderId === order.order_id
                            ? 'Cancelling...'
                            : 'Cancel'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </div>

      <ViewModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Order Details"
        maxWidth="sm"
      >
        {selectedOrder && <OrderDetails order={selectedOrder} />}
      </ViewModal>
      <Toast {...toast} onClose={hideToast} />
      <ConfirmationModal
        open={Boolean(pendingAdvance)}
        onClose={() => setPendingAdvance(null)}
        onConfirm={() => pendingAdvance && handleAdvanceStatus(pendingAdvance)}
        title="Move Order"
        message={`Move order ${
          pendingAdvance?.order_code || `# ${pendingAdvance?.order_id ?? ''}`
        } to ${getNextStatus(pendingAdvance?.status) ?? ''}?`}
        confirmText="Yes, move"
        loading={Boolean(
          pendingAdvance && updatingStatusId === pendingAdvance.order_id,
        )}
      />
      <ConfirmationModal
        open={Boolean(pendingPayment)}
        onClose={() => setPendingPayment(null)}
        onConfirm={() => pendingPayment && handleMarkAsPaid(pendingPayment)}
        title="Mark Order Paid"
        message={`Mark order ${
          pendingPayment?.order_code || `#${pendingPayment?.order_id ?? ''}`
        } as paid?`}
        confirmText="Mark as paid"
        loading={Boolean(
          pendingPayment && updatingPaymentId === pendingPayment.order_id,
        )}
      />
      <ConfirmationModal
        open={Boolean(pendingCancel)}
        onClose={() => setPendingCancel(null)}
        onConfirm={() => pendingCancel && handleCancelOrder(pendingCancel)}
        title="Cancel Order"
        message={`Cancel order ${
          pendingCancel?.order_code || `#${pendingCancel?.order_id ?? ''}`
        }? This action cannot be undone.`}
        confirmText="Yes, cancel"
        loading={Boolean(
          pendingCancel && cancellingOrderId === pendingCancel.order_id,
        )}
      />
      <EditOrderModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        order={editingOrder}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}

//View Modal
function OrderDetails({ order }: { order: OrderRecord }) {
  const bundles = order.details.filter(
    (detail) => detail.service_type === 'bundle_package',
  );
  const mainServices = order.details.filter(
    (detail) => detail.service_type === 'main_service',
  );
  const supplies = order.details.filter(
    (detail) => detail.service_type === 'add_on_supply',
  );

  const totalAmount = Number(order.total_amount ?? order.calculated_total ?? 0);
  const paidAmount = Number(order.paid_amount ?? 0);
  const balance = Math.max(totalAmount - paidAmount, 0);

  const createdDisplay = new Date(order.created_at).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-5 text-sm text-gray-700">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-blue-600 font-semibold">
            {order.order_code || `Order #${order.order_id}`}
          </p>
          <span
            className={`px-3 py-1 rounded-md text-xs font-semibold text-white ${
              ORDER_STATUS_STYLES[order.status] || 'bg-gray-400'
            }`}
          >
            {order.status}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Created {createdDisplay} · Source: {order.source}
        </p>
      </div>

      {/* Customer & Order Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500 mb-1">
            Customer
          </p>
          <div className="space-y-1">
            <p>{order.customer_name || order.guest_name || 'Walk-in Guest'}</p>
            <p className="text-gray-500">
              {order.customer_phone || order.guest_phone || 'No phone provided'}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500 mb-1">
            Order Info
          </p>
          <div className="space-y-1">
            <p>Payment Type: {order.payment_type}</p>
            <p>
              Payment Status:{' '}
              <span
                className={`font-semibold ${
                  PAYMENT_STATUS_STYLES[
                    order.payment_status?.toLowerCase() || ''
                  ] || 'text-gray-700'
                }`}
              >
                {order.payment_status}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 grid md:grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs uppercase text-gray-500">Total Amount</p>
          <p className="text-lg font-semibold text-gray-900">
            ₱{formatAmount(order.total_amount, order.calculated_total)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500">Paid Amount</p>
          <p className="text-lg font-semibold text-emerald-600">
            ₱{formatAmount(order.paid_amount ?? undefined)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500">Balance</p>
          <p className="text-lg font-semibold text-amber-600">
            ₱{balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Services */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase text-gray-500">
          Services & Supplies
        </p>
        <div className="space-y-3">
          {[
            { title: 'Bundles', rows: bundles },
            { title: 'Main Services', rows: mainServices },
            { title: 'Supplies', rows: supplies },
          ].map(
            ({ title, rows }) =>
              rows.length > 0 && (
                <div key={title}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    {title}
                  </p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100 text-gray-600">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">
                            Service
                          </th>
                          <th className="text-right px-3 py-2 font-medium">
                            Qty
                          </th>
                          <th className="text-right px-3 py-2 font-medium">
                            Unit Price
                          </th>
                          <th className="text-right px-3 py-2 font-medium">
                            Line Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((item) => {
                          const qty = Number(item.quantity);
                          const unitPrice = Number(item.unit_price);
                          const lineTotal = qty * unitPrice;
                          return (
                            <tr
                              key={`${title}-${item.service_id}`}
                              className="border-t border-gray-100"
                            >
                              <td className="px-3 py-2 text-gray-800">
                                {item.service_name}
                              </td>
                              <td className="px-3 py-2 text-right">{qty}</td>
                              <td className="px-3 py-2 text-right">
                                ₱{unitPrice.toLocaleString('en-PH')}
                              </td>
                              <td className="px-3 py-2 text-right font-medium">
                                ₱{lineTotal.toLocaleString('en-PH')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ),
          )}
        </div>
      </div>
    </div>
  );
}
function summarizeServices(details: OrderRecord['details']) {
  if (!details.length) return '—';
  const bundles = details.filter(
    (detail) => detail.service_type === 'bundle_package',
  );
  if (bundles.length) {
    return bundles
      .map((bundle) => `${bundle.service_name} x${bundle.quantity}`)
      .join(', ');
  }
  const mainServices = details.filter(
    (detail) => detail.service_type === 'main_service',
  );
  if (mainServices.length) {
    const uniqueQuantities = [
      ...new Set(mainServices.map((service) => service.quantity)),
    ];
    if (uniqueQuantities.length === 1) {
      return `${mainServices
        .map((service) => service.service_name)
        .join(', ')} x${uniqueQuantities[0]}`;
    }
    return mainServices
      .map((service) => `${service.service_name} x${service.quantity}`)
      .join(', ');
  }
  return details
    .map((detail) => `${detail.service_name} x${detail.quantity}`)
    .join(', ');
}

function formatAmount(totalAmount?: string, fallback?: number) {
  const numeric = Number(totalAmount ?? fallback ?? 0);
  return numeric.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getNextStatus(currentStatus?: string) {
  if (!currentStatus) return null;
  const idx = STATUS_SEQUENCE.indexOf(currentStatus);
  if (idx === -1 || idx === STATUS_SEQUENCE.length - 1) return null;
  return STATUS_SEQUENCE[idx + 1];
}
