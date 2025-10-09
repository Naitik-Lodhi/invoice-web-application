// src/components/common/FormHeader.tsx
import { Box, Typography } from '@mui/material';

// Define the props that this component will accept
interface FormHeaderProps {
  title: string;
  subtitle: string;
}

const FormHeader = ({ title, subtitle }: FormHeaderProps) => {
  return (
    <Box sx={{ width: '100%', textAlign: 'center',mb:3}}>
      {/* Main Title */}
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ fontWeight: '400' }}
      >
        {title}
      </Typography>

      {/* Subtitle/Caption */}
      <Typography variant="body1" color="#525252">
        {subtitle}
      </Typography>
    </Box>
  );
};

export default FormHeader;