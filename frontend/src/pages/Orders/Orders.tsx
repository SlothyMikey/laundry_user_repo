import { useState } from 'react';
import SegmentTabs from '@/components/ui/SegmentTabs';
import type { SegmentTab as SegmentTabType } from '@/components/ui/SegmentTabs';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import ActiveOrders from './components/ActiveOrders';
import OrderHistory from './components/OrderHistory';

export default function Orders() {
  const [active, setActive] = useState('active');

  const tabs: SegmentTabType[] = [
    {
      id: 'active',
      label: 'Active',
      icon: Inventory2OutlinedIcon,
    },
    { id: 'history', label: 'History', icon: HistoryOutlinedIcon },
  ];

  return (
    <>
      <SegmentTabs
        tabs={tabs}
        value={active}
        onChange={setActive}
        className="mb-4"
      />

      <div className="text-sm">
        {active === 'active' && <ActiveOrders />}
        {active === 'history' && <OrderHistory />}
      </div>
    </>
  );
}
