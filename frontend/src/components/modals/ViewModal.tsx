import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

interface ViewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  actions?: React.ReactNode;
}

export default function ViewModal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'md',
  fullWidth = true,
  actions,
}: ViewModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
    >
      <DialogTitle className="flex items-center justify-between border-b">
        <span className="text-lg font-semibold">{title}</span>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent className="custom-scrollbar" sx={{ p: 3 }}>
        {children}
      </DialogContent>
      {actions && (
        <DialogActions className="border-t px-6 py-3">{actions}</DialogActions>
      )}
      {!actions && (
        <DialogActions className="border-t px-6 py-3">
          <Button onClick={onClose} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
