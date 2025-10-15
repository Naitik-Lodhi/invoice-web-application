// src/components/layout/DashboardHeader.tsx
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Button,
  Popover,
  Stack,
} from '@mui/material';
import { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import MenuIcon from '@mui/icons-material/Menu';
import type { Dayjs } from 'dayjs';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onCustomDateChange: (start: Dayjs | null, end: Dayjs | null) => void;
  customDateRange: { start: Dayjs | null; end: Dayjs | null };
  searchText: string;
  onSearchChange: (text: string) => void;
  onClearFilter: () => void;
  isMobile: boolean;
}

const dateFilters = ['Today', 'Week', 'Month', 'Year', 'Custom'];

const DashboardHeader = ({ 
  onMenuClick,
  activeFilter,
  onFilterChange,
  onCustomDateChange,
  customDateRange,
  isMobile
}: DashboardHeaderProps) => {
  const [customDateAnchor, setCustomDateAnchor] = useState<null | HTMLElement>(null);
  const [tempDateRange, setTempDateRange] = useState(customDateRange);

  const handleCustomDateOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCustomDateAnchor(event.currentTarget);
  };

  const handleCustomDateClose = () => {
    setCustomDateAnchor(null);
  };

  const handleCustomDateApply = () => {
    if (tempDateRange.start && tempDateRange.end) {
      onCustomDateChange(tempDateRange.start, tempDateRange.end);
      handleCustomDateClose();
    }
  };

  // Desktop view - filters only
  const desktopFilters = (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {dateFilters.map((filter) => (
        <Button
          key={filter}
          onClick={() => filter === 'Custom' ? handleCustomDateOpen({ currentTarget: document.getElementById(`filter-${filter}`) } as any) : onFilterChange(filter)}
          id={`filter-${filter}`}
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

  // Custom Date Range Popover
  const customDatePopover = (
    <Popover
      open={Boolean(customDateAnchor)}
      anchorEl={customDateAnchor}
      onClose={handleCustomDateClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            <DatePicker
              label="Start Date"
              value={tempDateRange.start}
              onChange={(newValue) => setTempDateRange(prev => ({ ...prev, start: newValue }))}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                }
              }}
            />
            <DatePicker
              label="End Date"
              value={tempDateRange.end}
              onChange={(newValue) => setTempDateRange(prev => ({ ...prev, end: newValue }))}
              minDate={tempDateRange.start || undefined}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                }
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" onClick={handleCustomDateClose}>
                Cancel
              </Button>
              <Button 
                size="small" 
                variant="contained"
                onClick={handleCustomDateApply}
                disabled={!tempDateRange.start || !tempDateRange.end}
                sx={{
                  bgcolor: 'black',
                  '&:hover': { bgcolor: '#333' }
                }}
              >
                Apply
              </Button>
            </Box>
          </Stack>
        </Box>
      </LocalizationProvider>
    </Popover>
  );

  return (
    <>
      <AppBar 
        position="sticky" 
        sx={{ 
          backgroundColor: 'white', 
          color: 'black', 
          zIndex: (theme) => theme.zIndex.drawer + 1 
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton 
            color="inherit" 
            aria-label="open drawer" 
            edge="start" 
            onClick={onMenuClick} 
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ fontWeight: 'bold' }}
          >
            Invoices
          </Typography>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Desktop - only filters */}
          {!isMobile && desktopFilters}
        </Toolbar>
      </AppBar>
      
      {customDatePopover}
    </>
  );
};

export default DashboardHeader;