import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';

export type NavIcon = React.ElementType;

export interface NavButton {
  id: number;
  label: string;
  to: string;
  icon: NavIcon;
}

export interface NavSection {
  category: string;
  buttons: NavButton[];
}

export const sidebarButtons: NavSection[] = [
  {
    category: 'Orders & Bookings',
    buttons: [
      {
        id: 1,
        label: 'Booking Requests',
        to: '/bookings',
        icon: AssignmentOutlinedIcon,
      },
      {
        id: 2,
        label: 'Order Management',
        to: '/orders',
        icon: Inventory2OutlinedIcon,
      },
    ],
  },
  {
    category: 'Overview',
    buttons: [
      {
        id: 3,
        label: 'Sales & Revenue',
        to: '/overview',
        icon: AttachMoneyIcon,
      },
    ],
  },
  {
    category: 'Management',
    buttons: [
      { id: 4, label: 'Services', to: '/services', icon: SettingsOutlinedIcon },
      {
        id: 5,
        label: 'Customers',
        to: '/customers',
        icon: PeopleOutlineOutlinedIcon,
      },
      {
        id: 6,
        label: 'Inventory',
        to: '/inventory',
        icon: WarehouseOutlinedIcon,
      },
    ],
  },
  {
    category: 'Support',
    buttons: [
      { id: 7, label: 'Help', to: '/help', icon: HelpOutlineOutlinedIcon },
    ],
  },
];
