// src/components/layout/PublicLayout.tsx
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const PublicLayout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Container component="main" sx={{ mt: 4, mb: 4 }}>
        <Outlet /> 
      </Container>
      <Footer />
    </Box>
  );
};

export default PublicLayout;