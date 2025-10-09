// src/components/layout/Footer.tsx
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2, // Padding top and bottom
        px: 2,
        mt: 'auto', // Push footer to the bottom
        backgroundColor: '#f5f5f5',
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" color="#737373">
        {'© '}
        {new Date().getFullYear()}
        {' Invoice App. All Rights Reserved.'}
      </Typography>
    </Box>
  );
};

export default Footer;