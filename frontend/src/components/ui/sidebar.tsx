import Button from '@mui/material/Button';
import Logo from '../../assets/logo.svg';
import { NavLink } from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';

type sidebarProps = {
    isHidden: boolean;
}

function Sidebar({ isHidden }: sidebarProps) {

    const sidebarButtons = [
        {
        category: 'Orders & Bookings',
        buttons: [
            {id: 1, label: "Booking Requests", to:"/", icon: AssignmentOutlinedIcon},
            {id: 2, label: "Order Management", to:"/", icon: Inventory2OutlinedIcon},
        ]
        },
        {
            category: "Overview",
            buttons: [
                {id: 3, label: "Sales & Revenue", to:"/", icon: AttachMoneyIcon},
            ]
        },
        {
            category: "Management",
            buttons: [
                {id: 4, label: "Services", to:"/", icon: SettingsOutlinedIcon},
                {id: 5, label: "Customers", to:"/", icon: PeopleOutlineOutlinedIcon},
                {id: 6, label: "Inventory", to:"/", icon: WarehouseOutlinedIcon},
            ]
        },
        {
            category: "Support",
            buttons:[
                {id: 7, label: "Help", to:"/", icon: HelpOutlineOutlinedIcon},
            ]
        },
    ];

    return (
        <aside className={`fixed left-0 top-0 z-30 w-64 bg-black h-screen flex flex-col justify-between transition-transform duration-300 ease-in-out ${isHidden ? "-translate-x-full" : "translate-x-0"}`}>
            {/* Logo and Name */}
            <div className='flex items-center p-5'>
                <img src={Logo} alt="Logo" className='w-10 h-10 bg-white rounded' />
                <div className='ml-3'>
                    <h1 className='text-light text-lg'>LaverSavon</h1>
                    <h2 className='text-muted text-sm'>Silang Branch</h2>
                </div>
            </div>

            <h1 className='text-muted text-xs ml-5 mb-3'>System Version 1.0.0</h1>

            <Button variant="contained" sx={{textTransform: "none", ml:2, mb: 2,fontSize: '0.85rem', width: '85%', justifyContent: 'flex-start',}} startIcon={<AddCircleOutlineIcon />}
            component={NavLink} to="/">
            Create New Order
            </Button>

            {sidebarButtons.map((section) => (
                <div key={section.category} className='mb-5'>
                    <h1 className='ml-5 mb-1 text-light text-xs'>{section.category}</h1>

                    {section.buttons.map((button) => {
                        const Icon = button.icon;
                        return (
                            <Button
                            key={button.id}
                            variant='text'
                            sx = {{textTransform: "none", color: "white", ml: 2, width: "85%", justifyContent: "flex-start"}}
                            startIcon={<Icon />}
                            component={NavLink}
                            to={button.to}
                            >
                                {button.label}
                            </Button>
                        );
                    })}
                </div>
            ))}

            {/* Logout Button */}
            <Button variant="contained" sx={{textTransform: "none", ml: 2, mb: 3, fontSize: '0.85rem', width: '85%', justifyContent: 'flex-start', backgroundColor: 'white', color: 'black'}} startIcon={<LogoutOutlinedIcon />}
            component={NavLink} to="/">
            Logout
            </Button>

        </aside>
    )
}

export default Sidebar;