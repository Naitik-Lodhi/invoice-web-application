// src/components/common/AppButton.tsx
import { Button, type ButtonProps, CircularProgress } from '@mui/material';

// Allow all standard ButtonProps plus a new 'isLoading' prop
interface AppButtonProps extends ButtonProps {
  isLoading?: boolean;
}

const AppButton = ({ children, isLoading = false, ...props }: AppButtonProps) => {
  return (
    <Button
      variant="contained"
      disabled={isLoading}
      {...props}
      sx={{
        backgroundColor: '#525252',
        color: 'white',
        fontWeight: 'bold',
        px: 4, // Horizontal padding
        py: 1.5, // Vertical padding
        '&:hover': {
          backgroundColor: '#333', // Darken on hover
        },
        ...props.sx, // Allow overriding styles
      }}
    >
      {isLoading ? <CircularProgress size={24} color="inherit" /> : children}
    </Button>
  );
};

export default AppButton;