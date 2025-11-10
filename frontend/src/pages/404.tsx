import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Stack } from '@mui/material';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        px: 2,
      }}
    >
      <Stack spacing={3} alignItems="center" textAlign="center">
        {/* Washing Machine Icon */}
        <Box
          sx={{
            position: 'relative',
            animation: 'spin 3s ease-in-out infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '50%': { transform: 'rotate(360deg)' },
              '75%': { transform: 'rotate(750deg)' },
              '100%': { transform: 'rotate(1800deg)' },
            },
          }}
        >
          <LocalLaundryServiceIcon
            sx={{ fontSize: 120, color: '#1976d2', opacity: 0.8 }}
          />
        </Box>

        {/* 404 Text */}
        <Typography variant="h1" fontWeight="700" color="primary">
          404
        </Typography>

        {/* Message */}
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight="600" color="text.primary">
            Oops! This Load Got Lost
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth="500px">
            The page you're looking for seems to have been tumbled away. Don't
            worry, we'll get you back on track!
          </Typography>
        </Stack>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
