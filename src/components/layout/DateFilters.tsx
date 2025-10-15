// src/components/layout/DateFilters.tsx
import { useState } from 'react';
import { Box, Button } from '@mui/material';

const dateFilters = ['Today', 'Week', 'Month', 'Year', 'Custom'];

const DateFilters = () => {
  const [activeFilter, setActiveFilter] = useState('Today');

  return (
    <Box sx={{ display: 'flex',  gap: 1 }}>
      {dateFilters.map((filter) => (
        <Button
          key={filter}
          onClick={() => setActiveFilter(filter)}
          sx={{
            color: activeFilter === filter ? 'white' : 'black',
            backgroundColor: activeFilter === filter ? 'black' : 'transparent',
            borderRadius: '20px',
            px: 2,
            py: 0.5,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: activeFilter === filter ? '#333' : '#f0f0f0',
            },
          }}
        >
          {filter}
        </Button>
      ))}
    </Box>
  );
};

export default DateFilters;