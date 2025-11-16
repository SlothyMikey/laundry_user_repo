import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Logo from '@/assets/logo.svg';
import { NavLink } from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import { sidebarButtons } from '@/config/sidebarConfig';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import ConfirmationModal from '@/components/modals/confirmationModal';
import { logout } from '@/helpers/authUtils';

type sidebarProps = {
  isHidden: boolean;
  onClose?: () => void;
};

function Sidebar({ isHidden, onClose }: sidebarProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    setLoggingOut(true);

    const success = await logout();

    if (success) {
      navigate('/login', { replace: true });
    } else {
      // Even if backend fails, still redirect (token is cleared)
      navigate('/login', { replace: true });
    }

    setLoggingOut(false);
    setShowLogoutModal(false);
  }

  return (
    <>
      <aside
        className={`fixed left-0 top-0 z-30 w-64 bg-black h-screen flex flex-col justify-between transition-transform duration-300 ease-in-out ${isHidden ? '-translate-x-full' : 'translate-x-0'}`}
      >
        {/* Header with logo and close button */}
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <img
                  src={Logo}
                  alt="Logo"
                  className="w-10 h-10"
                  style={{
                    filter:
                      'invert(48%) sepia(79%) saturate(2476%) hue-rotate(200deg) brightness(95%) contrast(97%)',
                  }}
                />
              </div>
              <div className="ml-3">
                <h1 className="text-light text-lg">LaverSavon</h1>
                <h2 className="text-muted text-sm">Silang Branch</h2>
              </div>
            </div>

            {/* Close icon - visible only on mobile */}
            {onClose && (
              <div className="lg:hidden">
                <IconButton
                  onClick={onClose}
                  sx={{ color: 'white' }}
                  size="small"
                >
                  <CloseIcon />
                </IconButton>
              </div>
            )}
          </div>
        </div>

        <h1 className="text-muted text-xs ml-5 mb-3">System Version 1.0.0</h1>

        <Button
          variant="contained"
          sx={{
            textTransform: 'none',
            ml: 2,
            mb: 2,
            fontSize: '0.85rem',
            width: '85%',
            justifyContent: 'flex-start',
          }}
          startIcon={<AddCircleOutlineIcon />}
          component={NavLink}
          to="/createOrder"
        >
          Create New Order
        </Button>

        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {sidebarButtons.map((section) => (
            <div key={section.category} className="mb-5">
              <h1 className="ml-5 mb-1 text-light text-xs">
                {section.category}
              </h1>

              {section.buttons.map((button) => {
                const Icon = button.icon;
                return (
                  <Button
                    key={button.id}
                    variant="text"
                    sx={{
                      textTransform: 'none',
                      color: 'white',
                      ml: 2,
                      width: '85%',
                      justifyContent: 'flex-start',
                    }}
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
          <Button
            variant="contained"
            sx={{
              textTransform: 'none',
              ml: 2,
              mb: 3,
              fontSize: '0.85rem',
              width: '85%',
              justifyContent: 'flex-start',
              backgroundColor: 'white',
              color: 'black',
            }}
            startIcon={<LogoutOutlinedIcon />}
            onClick={() => setShowLogoutModal(true)}
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out? You will need to sign in again to access the system."
        confirmText="Logout"
        cancelText="Cancel"
        loading={loggingOut}
      />
    </>
  );
}

export default Sidebar;
