import { useState, useEffect } from 'react';
import { fetchAllActiveServices } from '@/api/services';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CloseIcon from '@mui/icons-material/Close';
import Divider from '@mui/material/Divider';
import { type OrderRecord } from '@/hooks/useOrders';

interface EditOrderModalProps {
  open: boolean;
  onClose: () => void;
  order: OrderRecord | null;
  onSubmit: (updatedDetails: OrderRecord['details']) => void;
}

export default function EditOrderModal({
  open,
  onClose,
  order,
  onSubmit,
}: EditOrderModalProps) {
  const [details, setDetails] = useState<OrderRecord['details']>([]);
  const [total, setTotal] = useState(0);
  // removed unused tab state
  const [load, setLoad] = useState(1);
  const [allSupplies, setAllSupplies] = useState<any[]>([]);
  // ...existing code...

  useEffect(() => {
    async function fetchSuppliesAndServices() {
      try {
        const all = await fetchAllActiveServices();
        // Ensure every service has a stable "service_id" (fallback to name)
        const normalized = all.map((s: any) => ({
          ...s,
          service_id: s.service_id ?? s.id ?? s.service_name,
        }));
        setAllSupplies(
          normalized.filter((s: any) => s.service_type === 'add_on_supply'),
        );
      } catch {
        setAllSupplies([]);
      }
    }
    fetchSuppliesAndServices();
  }, []);

  useEffect(() => {
    if (order) {
      // Merge all supplies with order details, defaulting missing ones to quantity 0
      let mergedDetails = [...order.details];
      if (allSupplies.length) {
        allSupplies.forEach((supply) => {
          // match by service_id, name, or price
          const found = details.find((d) => {
            const unitPrice = Number(supply.price ?? supply.unit_price ?? 0);
            const dId = d.service_id == null ? '' : String(d.service_id);
            const sId =
              supply.service_id == null ? '' : String(supply.service_id);
            const dName = (d.service_name || '').toLowerCase().trim();
            const sName = (supply.service_name || '').toLowerCase().trim();
            const sameId = dId !== '' && dId === sId;
            const exactName = dName && dName === sName;
            const priceMatch =
              Math.abs(Number(d.unit_price || 0) - unitPrice) < 0.01;
            return sameId || exactName || priceMatch;
          });
          if (!found) {
            mergedDetails.push({
              service_id: supply.service_id,
              service_name: supply.service_name,
              service_type: 'add_on_supply',
              quantity: 0,
              unit_price: Number(supply.price),
              line_total: 0,
            });
          }
        });
      }
      setDetails(mergedDetails);
      // ...existing code...
      setTotal(Number(order.total_amount ?? order.calculated_total ?? 0));
      // Find the first bundle or main service and use its quantity as the load
      const firstLoadItem = mergedDetails.find(
        (d) =>
          d.service_type === 'bundle_package' ||
          d.service_type === 'main_service',
      );
      setLoad(firstLoadItem ? Number(firstLoadItem.quantity) : 1);
    }
  }, [order, allSupplies]);

  // When load changes, update all bundle/main_service quantities
  const handleLoadChange = (newLoad: number) => {
    const updatedDetails = details.map((item) => {
      if (
        item.service_type === 'bundle_package' ||
        item.service_type === 'main_service'
      ) {
        return { ...item, quantity: newLoad };
      }
      return item;
    });
    setDetails(updatedDetails);
    setLoad(newLoad);
    // Recalculate total
    const newTotal = updatedDetails.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
      0,
    );
    setTotal(newTotal);
  };

  // Supplies still have individual quantity controls
  const handleSupplyQuantityChange = (index: number, delta: number) => {
    const updatedDetails = [...details];
    if (index < 0 || index >= updatedDetails.length) return;
    const newQuantity = Math.max(0, updatedDetails[index].quantity + delta);
    updatedDetails[index].quantity = newQuantity;
    setDetails(updatedDetails);
    // Recalculate total
    const newTotal = updatedDetails.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
      0,
    );
    setTotal(newTotal);
  };

  // Robust lookup by id or name (coerce to string and compare case-insensitively)
  // Returns { index, reason } for handler use
  const findDetailIndex = (
    serviceId: any,
    serviceName?: string,
    unitPrice?: number,
  ): { index: number; reason: string } => {
    for (let i = 0; i < details.length; i++) {
      const d = details[i];
      const dId = d.service_id == null ? '' : String(d.service_id);
      const sId = serviceId == null ? '' : String(serviceId);
      const dName = (d.service_name || '').toLowerCase();
      const sName = (serviceName || '').toLowerCase();
      const sameId = dId !== '' && dId === sId;
      const exactName = dName && dName === sName;
      const substringMatch =
        dName && sName && (dName.includes(sName) || sName.includes(dName));
      const priceMatch =
        typeof unitPrice === 'number' &&
        Number(d.unit_price || 0) === Number(unitPrice || 0);
      if (sameId) return { index: i, reason: 'sameId' };
      if (exactName) return { index: i, reason: 'exactName' };
      if (substringMatch) return { index: i, reason: 'substring' };
      if (priceMatch) return { index: i, reason: 'priceMatch' };
    }
    return { index: -1, reason: 'none' };
  };

  const handleSubmit = () => {
    onSubmit(details);
  };

  if (!order) return null;

  const bundles = details.filter((d) => d.service_type === 'bundle_package');
  const mainServices = details.filter((d) => d.service_type === 'main_service');
  // Build supplies list from allSupplies but prefer values from details when present
  // Use the robust `findDetailIndex` to allow id/name/substring/price fallbacks
  const supplies = allSupplies.map((supply) => {
    const unitPrice = Number(supply.price ?? supply.unit_price ?? 0);
    const idx = findDetailIndex(
      supply.service_id,
      supply.service_name,
      unitPrice,
    );
    const found = idx.index !== -1 ? details[idx.index] : undefined;
    const result = found || {
      service_id: supply.service_id,
      service_name: supply.service_name,
      service_type: 'add_on_supply',
      quantity: 0,
      unit_price: unitPrice,
      line_total: 0,
    };
    // ...existing code...
    return result;
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="body">
      <Box
        sx={{
          p: 2,
          pb: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography component="div" sx={{ fontSize: '16px' }}>
            Edit Order: {order.order_code || `Order #${order.order_id}`}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="large">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      {/* Service summary section */}
      <Box sx={{ px: 2, pt: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Services & Bundles
        </Typography>
        {/* Debug UI removed as requested */}
        <Card variant="outlined" sx={{ mb: 2, bgcolor: '#f8f8f8' }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {[...bundles, ...mainServices].map((item) => (
                <Box
                  key={item.service_id}
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: '#fff',
                    boxShadow: 1,
                    minWidth: 180,
                  }}
                >
                  <Typography variant="body1" fontWeight="medium">
                    {item.service_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.service_type === 'bundle_package'
                      ? 'Bundle'
                      : 'Main Service'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ₱{Number(item.unit_price).toLocaleString('en-PH')} per load
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 1,
                  bgcolor: '#fff',
                  border: '1px solid #e5e7eb',
                }}
              >
                <Inventory2Icon fontSize="small" color="action" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  Load
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Applies to bundles & main services
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                border: '1px solid #e5e7eb',
                borderRadius: 2,
                px: 1,
                py: 0.5,
              }}
            >
              <IconButton
                size="small"
                onClick={() => handleLoadChange(Math.max(1, load - 1))}
                disabled={load <= 1}
                sx={{ width: 28, height: 28 }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Box
                component="span"
                sx={{ width: 36, textAlign: 'center', fontWeight: 600 }}
              >
                {load}
              </Box>
              <IconButton
                size="small"
                onClick={() => handleLoadChange(load + 1)}
                sx={{ width: 28, height: 28 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Card>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Add-on Supplies
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            {supplies.map((item) => (
              <Card
                key={item.service_id ?? item.service_name}
                variant="outlined"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 1,
                      bgcolor: '#fff',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <Inventory2Icon fontSize="small" color="action" />
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {item.service_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ₱{Number(item.unit_price).toLocaleString('en-PH')} each
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0,
                    border: '1px solid #e5e7eb',
                    borderRadius: 2,
                    px: 1,
                    py: 0.5,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => {
                      const m = findDetailIndex(
                        item.service_id,
                        item.service_name,
                        item.unit_price,
                      );
                      handleSupplyQuantityChange(m.index, -1);
                    }}
                    disabled={item.quantity <= 0}
                    sx={{ width: 28, height: 28 }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Box
                    component="span"
                    sx={{ width: 36, textAlign: 'center', fontWeight: 600 }}
                  >
                    {item.quantity}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const m = findDetailIndex(
                        item.service_id,
                        item.service_name,
                        item.unit_price,
                      );
                      handleSupplyQuantityChange(m.index, 1);
                    }}
                    sx={{ width: 28, height: 28 }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>
      <Divider sx={{ mt: 3 }} />
      <Box
        sx={{
          px: 2,
          py: 2,
          position: 'sticky',
          bottom: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h6">New Total</Typography>
          <Typography variant="h6" color="primary">
            ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={onClose} variant="outlined" size="large">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" size="large">
            Save Changes
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

// ItemRow removed, now handled in Card inside modal
