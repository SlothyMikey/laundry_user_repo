import { useState } from 'react';
import SegmentTabs from '@/components/ui/SegmentTabs';
import type { SegmentTab as SegmentTabType } from '@/components/ui/SegmentTabs';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import PendingBookings from './components/PendingBookings';
import BookingHistory from './components/BookingHistory';

export default function Bookings() {
  const [active, setActive] = useState('pending');

  const tabs: SegmentTabType[] = [
    {
      id: 'pending',
      label: 'Pending',
      icon: PendingActionsOutlinedIcon,
    },
    { id: 'history', label: 'History', icon: HistoryOutlinedIcon },
  ];

  return (
    <>
      <h1 className="text-lg font-semibold">Bookings Management</h1>
      <p className="text-xs text-muted mb-6">
        Review and manage customer booking requests
      </p>

      <SegmentTabs
        tabs={tabs}
        value={active}
        onChange={setActive}
        className="mb-6"
      />

      <div className="mt-4 text-sm">
        {active === 'pending' && <PendingBookings />}
        {active === 'history' && <BookingHistory />}
      </div>
    </>
  );
}
