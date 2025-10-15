// src/components/skeleton/DataGridSkeleton.tsx
import { Box, Skeleton, Card, useTheme, useMediaQuery } from '@mui/material';

const DataGridSkeleton = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card sx={{ height: '100%', width: '100%', p: 0 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          p: 2,
          borderBottom: '2px solid #e0e0e0',
          backgroundColor: '#fafafa',
        }}
      >
        {!isMobile && <Skeleton variant="rectangular" width={80} height={24} />}
        <Skeleton variant="rectangular" width={100} height={24} />
        <Skeleton variant="rectangular" width={150} height={24} sx={{ flex: 1 }} />
        {!isMobile && (
          <>
            <Skeleton variant="rectangular" width={80} height={24} />
            <Skeleton variant="rectangular" width={100} height={24} />
            <Skeleton variant="rectangular" width={80} height={24} />
          </>
        )}
        <Skeleton variant="rectangular" width={100} height={24} />
        <Skeleton variant="rectangular" width={100} height={24} />
      </Box>

      {/* Rows */}
      <Box sx={{ p: 0 }}>
        {[...Array(10)].map((_, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              gap: 2,
              p: 2,
              borderBottom: '1px solid #f0f0f0',
              alignItems: 'center',
            }}
          >
            {!isMobile && <Skeleton variant="rectangular" width={80} height={20} />}
            <Skeleton variant="rectangular" width={100} height={20} />
            <Skeleton variant="rectangular" width={150} height={20} sx={{ flex: 1 }} />
            {!isMobile && (
              <>
                <Skeleton variant="rectangular" width={80} height={20} />
                <Skeleton variant="rectangular" width={100} height={20} />
                <Skeleton variant="rectangular" width={80} height={20} />
              </>
            )}
            <Skeleton variant="rectangular" width={100} height={20} />
            <Skeleton variant="rectangular" width={100} height={20} />
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderTop: '2px solid #e0e0e0',
          backgroundColor: '#fafafa',
        }}
      >
        <Skeleton variant="rectangular" width={150} height={32} />
        <Skeleton variant="rectangular" width={200} height={32} />
      </Box>
    </Card>
  );
};

export default DataGridSkeleton;