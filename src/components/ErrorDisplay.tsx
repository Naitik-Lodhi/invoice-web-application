// src/components/common/ErrorDisplay.tsx
import { Alert, AlertTitle, Button } from '@mui/material';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void; // A function to call when the "Retry" button is clicked
}

const ErrorDisplay = ({ 
  title = "Something went wrong", 
  message, 
  onRetry 
}: ErrorDisplayProps) => {
  return (
    <Alert 
      severity="error"
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Try Again
          </Button>
        )
      }
      sx={{ 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center' 
      }}
    >
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  );
};

export default ErrorDisplay;