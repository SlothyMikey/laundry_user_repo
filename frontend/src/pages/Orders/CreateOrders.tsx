import { useEffect, useState, useMemo } from 'react';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { useServices } from '@/hooks/useServices';
import { isPhoneNumberValid } from '@/helpers/OrderUtils';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/ui/Toast';
import { createOrderApi } from '@/api/orders';

export default function CreateOrder() {
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedBundle, setSelectedBundle] = useState('');
  const [mainServices, setMainServices] = useState<Record<string, boolean>>({});
  const [numberOfLoads, setNumberOfLoads] = useState(1);
  const [paymentType, setPaymentType] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const { services, loadServices, loading, error } = useServices();
  const [supplies, setSupplies] = useState<Record<string, number>>({});
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    loadServices();
  }, []);

  const bundleOptions = useMemo(
    () =>
      services
        .filter((svc) => svc.service_type === 'bundle_package')
        .map((plan) => ({
          label: plan.service_name,
          value: plan.service_name,
          price: Number(plan.price),
          unit: plan.unit_type,
          features:
            plan.description?.split(',').map((feat) => feat.trim()) || [],
        })),
    [services],
  );

  const mainServiceOptions = useMemo(
    () =>
      services
        .filter((svc) => svc.service_type === 'main_service')
        .map((svc) => ({
          label: svc.service_name,
          value: svc.service_name,
          price: Number(svc.price),
          unit: svc.unit_type,
          description: svc.description,
        })),
    [services],
  );

  const suppliesList = useMemo(
    () =>
      services
        .filter((svc) => svc.service_type === 'add_on_supply')
        .map((svc) => ({
          label: svc.service_name,
          value: svc.service_name,
          price: Number(svc.price),
          unit: svc.unit_type,
        })),
    [services],
  );

  // Initialize dynamic records once services load
  useEffect(() => {
    if (mainServiceOptions.length && Object.keys(mainServices).length === 0) {
      const init: Record<string, boolean> = {};
      mainServiceOptions.forEach((svc) => (init[svc.value] = false));
      setMainServices(init);
    }
    if (suppliesList.length && Object.keys(supplies).length === 0) {
      const supInit: Record<string, number> = {};
      suppliesList.forEach((sup) => (supInit[sup.value] = 0));
      setSupplies(supInit);
    }
  }, [mainServiceOptions, suppliesList]);

  const handleServiceChange = (serviceName: string) => {
    if (selectedBundle) setSelectedBundle('');
    setMainServices((prev) => ({
      ...prev,
      [serviceName]: !prev[serviceName],
    }));
  };

  const handleSupplyChange = (supplyName: string, delta: number) => {
    setSupplies((prev) => ({
      ...prev,
      [supplyName]: Math.max(0, (prev[supplyName] || 0) + delta),
    }));
  };

  const total = useMemo(() => {
    let sum = 0;
    if (selectedBundle) {
      const bundle = bundleOptions.find((b) => b.value === selectedBundle);
      if (bundle) sum += bundle.price * numberOfLoads;
    } else {
      Object.entries(mainServices)
        .filter(([, chosen]) => chosen)
        .forEach(([name]) => {
          const svc = mainServiceOptions.find((s) => s.value === name);
          if (svc) sum += svc.price * numberOfLoads;
        });
    }
    Object.entries(supplies)
      .filter(([, qty]) => qty > 0)
      .forEach(([name, qty]) => {
        const sup = suppliesList.find((s) => s.value === name);
        if (sup) sum += sup.price * qty;
      });
    return sum;
  }, [
    selectedBundle,
    bundleOptions,
    mainServices,
    mainServiceOptions,
    numberOfLoads,
    supplies,
    suppliesList,
  ]);

  const buildPayload = () => ({
    guest_name: customerName.trim(),
    guest_phone_number: phoneNumber.trim(),
    load: numberOfLoads,
    payment_type: paymentType,
    payment_status: paymentStatus,
    promo: selectedBundle
      ? { service_name: selectedBundle, quantity: numberOfLoads }
      : null,
    main_services: !selectedBundle
      ? Object.entries(mainServices)
          .filter(([, chosen]) => chosen)
          .map(([service_name]) => ({ service_name, quantity: numberOfLoads }))
      : [],
    supplies: Object.entries(supplies)
      .filter(([, qty]) => qty > 0)
      .map(([service_name, quantity]) => ({ service_name, quantity })),
    total_amount: total,
  });

  const handleCreateOrder = async () => {
    const payload = buildPayload();
    if (!payload.guest_name) {
      showError('Customer name is required');
      return;
    }
    if (
      payload.guest_phone_number &&
      !isPhoneNumberValid(payload.guest_phone_number)
    ) {
      showError('Enter a valid PH mobile number (e.g., 09XXXXXXXXX)');
      return;
    }
    if (!payload.promo && payload.main_services.length === 0) {
      showError('Select a bundle or at least one main service');
      return;
    }
    try {
      const res = await createOrderApi(payload);

      showSuccess(res.message || 'Order created successfully');

      handleClearForm();
    } catch (e: any) {
      showError(e.message || 'Error creating order');
    }
  };

  const handleClearForm = () => {
    setCustomerName('');
    setPhoneNumber('');
    setSelectedBundle('');
    const clearedMain: Record<string, boolean> = {};
    mainServiceOptions.forEach((s) => (clearedMain[s.value] = false));
    setMainServices(clearedMain);
    setNumberOfLoads(1);
    const clearedSup: Record<string, number> = {};
    suppliesList.forEach((s) => (clearedSup[s.value] = 0));
    setSupplies(clearedSup);
    setPaymentType('Cash');
    setPaymentStatus('Unpaid');
  };

  return (
    <>
      <h1 className="text-lg font-semibold">New Walk-in Order</h1>
      <p className="text-sm text-muted mb-6">
        Create a new order for walk-in customers
      </p>

      <div className="card-container">
        <div className="mb-6">
          <h1 className="text-md font-semibold flex items-center gap-2">
            <PersonAddIcon sx={{ fontSize: 20 }} />
            Order Information
          </h1>
          <p className="text-xs text-muted mb-4">
            Enter customer and service details
          </p>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              {/*This is for guest name */}
              <TextField
                fullWidth
                size="small"
                placeholder="John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                sx={{ backgroundColor: '#f9fafb' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number <span className="text-muted">(Optional)</span>
              </label>
              <TextField
                fullWidth
                size="small"
                placeholder="09123456789"
                value={phoneNumber}
                onChange={(e) => {
                  const digitsOnly = e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 11);
                  setPhoneNumber(digitsOnly);
                }}
                sx={{ backgroundColor: '#f9fafb' }}
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  maxLength: 11,
                }}
                error={
                  phoneNumber.trim() !== '' && !isPhoneNumberValid(phoneNumber)
                }
                helperText={
                  phoneNumber.trim() !== '' && !isPhoneNumberValid(phoneNumber)
                    ? 'Enter a valid PH mobile number (e.g., 09XXXXXXXXX)'
                    : ' '
                }
              />
            </div>
          </div>

          {/* Bundle Package */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Bundle Package
            </label>
            <FormControl
              fullWidth
              size="small"
              sx={{ backgroundColor: '#f9fafb' }}
            >
              <InputLabel>Select a bundle</InputLabel>
              <Select
                value={selectedBundle}
                label="Select a bundle"
                onChange={(e) => {
                  setSelectedBundle(e.target.value);
                  // Clear main services when bundle is selected
                  if (e.target.value) {
                    setMainServices({ wash: false, dry: false, fold: false });
                  }
                }}
                disabled={Object.values(mainServices).some((v) => v)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {bundleOptions.map((bundle) => (
                  <MenuItem key={bundle.value} value={bundle.value}>
                    {bundle.label} - ₱{bundle.price}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {/* OR Divider */}
          {!selectedBundle && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-gray-500 bg-white uppercase tracking-wider">
                  OR
                </span>
              </div>
            </div>
          )}

          {/* Main Services */}
          {!selectedBundle && (
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                Main Services <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-muted mb-2">
                Select individual services
              </p>
              <div className="space-y-2">
                {mainServiceOptions.map((service) => (
                  <div
                    key={service.value}
                    className={`flex items-center justify-between p-3 border border-gray-200 rounded-lg ${
                      selectedBundle ? 'bg-gray-100 opacity-60' : 'bg-gray-50'
                    }`}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={mainServices[service.value] || false}
                          onChange={() => handleServiceChange(service.value)}
                          size="small"
                          disabled={!!selectedBundle}
                        />
                      }
                      label={
                        <span className="text-sm font-medium">
                          {service.label}
                        </span>
                      }
                    />
                    <span className="text-sm text-blue-600 font-medium">
                      ₱{service.price} / load
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Number of Loads */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Number of Loads <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <IconButton
                onClick={() => setNumberOfLoads(Math.max(1, numberOfLoads - 1))}
                size="small"
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <TextField
                size="small"
                type="number"
                value={numberOfLoads}
                onChange={(e) =>
                  setNumberOfLoads(Math.max(1, parseInt(e.target.value) || 1))
                }
                sx={{
                  width: '100px',
                  '& input': { textAlign: 'center' },
                }}
              />
              <IconButton
                onClick={() => setNumberOfLoads(numberOfLoads + 1)}
                size="small"
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </div>
          </div>

          {/* Supplies Needed */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
              <InventoryOutlinedIcon sx={{ fontSize: 18 }} />
              Supplies Needed (Quantity)
            </label>
            <p className="text-xs text-muted mb-3">
              Enter 0 if customer has their own or doesn't need the supply
            </p>
            <div className="space-y-3">
              {suppliesList.map((supply) => (
                <div
                  key={supply.value}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <span className="text-sm font-medium">{supply.label}</span>
                  <div className="flex items-center gap-2">
                    <IconButton
                      onClick={() => handleSupplyChange(supply.value, -1)}
                      size="small"
                      sx={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 1,
                      }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <span className="w-12 text-center font-medium">
                      {supplies[supply.value] || 0}
                    </span>
                    <IconButton
                      onClick={() => handleSupplyChange(supply.value, 1)}
                      size="small"
                      sx={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 1,
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Payment Type <span className="text-red-500">*</span>
              </label>
              <FormControl
                fullWidth
                size="small"
                sx={{ backgroundColor: '#f9fafb' }}
              >
                <Select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="GCash">GCash</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Payment Status <span className="text-red-500">*</span>
              </label>
              <FormControl
                fullWidth
                size="small"
                sx={{ backgroundColor: '#f9fafb' }}
              >
                <Select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Unpaid">Unpaid</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">
              Estimated Total:
            </span>
            <span className="text-lg font-semibold text-gray-900">
              ₱{total.toLocaleString()}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="contained"
              onClick={handleCreateOrder}
              startIcon={<AddIcon />}
              sx={{
                textTransform: 'none',
                py: 1.2,
                backgroundColor: '#2563eb',
                '&:hover': {
                  backgroundColor: '#1d4ed8',
                },
              }}
            >
              Create Order
            </Button>
            <Button
              variant="outlined"
              onClick={handleClearForm}
              size="large"
              sx={{
                textTransform: 'none',
                py: 1.2,
                px: 4,
                color: '#6b7280',
                borderColor: '#d1d5db',
                '&:hover': {
                  borderColor: '#9ca3af',
                  backgroundColor: '#f9fafb',
                },
              }}
            >
              Clear Form
            </Button>
          </div>
        </div>
      </div>
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
