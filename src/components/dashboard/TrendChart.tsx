// src/components/dashboard/TrendChart.tsx
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  useTheme, 
  useMediaQuery,
  Modal,
  IconButton,
  Paper
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { useState } from "react";

interface TrendChartProps {
  data: Array<{
    month: string;
    amount: number;
    count?: number;
  }>;
  currencySymbol: string;
}

const TrendChart = ({ data, currencySymbol }: TrendChartProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [openModal, setOpenModal] = useState(false);

  // ✅ Validate and prepare data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card sx={{ 
        height: { xs: "160px", sm: "180px", md: "214px" },
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}>
        <CardContent sx={{ 
          height: "100%", 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography color="text.secondary" variant="body2">
            No trend data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // ✅ Filter out invalid data and prepare chart data
  const validData = data.filter(item => 
    item && 
    item.month && 
    typeof item.amount === 'number' && 
    !isNaN(item.amount)
  );

  if (validData.length === 0) {
    return (
      <Card sx={{ 
        height: { xs: "160px", sm: "180px", md: "214px" },
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}>
        <CardContent sx={{ 
          height: "100%", 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Typography color="text.secondary" variant="body2">
            No valid trend data
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for MUI LineChart
  const xAxisData = validData.map(item => item.month);
  const seriesData = validData.map(item => item.amount);

  // ✅ Calculate height based on screen size
  const chartHeight = isMobile ? 100 : isTablet ? 120 : 140;

  // ✅ Calculate max value for better Y-axis scaling
  const maxValue = Math.max(...seriesData);
  const minValue = Math.min(...seriesData);
  const yAxisMax = maxValue > 0 ? Math.ceil(maxValue * 1.15) : 100;
  const yAxisMin = minValue > 0 ? Math.floor(minValue * 0.85) : 0;

  const handleCardClick = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // ✅ Smart number formatter - VERY SHORT
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toFixed(0);
  };

  const formatCurrency = (value: number) => {
    return `${currencySymbol}${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Common chart config
  const getChartConfig = (isModal = false) => {
    const height = isModal ? 400 : chartHeight;
    
    return {
      xAxis: [{
        data: xAxisData,
        scaleType: 'band' as const,
        tickLabelStyle: {
          fontSize: isModal ? 12 : (isMobile ? 8 : 10),
          angle: 0,  // ✅ NO ANGLE - straight labels
        },
        tickPlacement: 'middle' as const,
      }],
      yAxis: [{
        min: yAxisMin,
        max: yAxisMax,
        tickLabelStyle: {
          fontSize: isModal ? 12 : (isMobile ? 8 : 9),
        },
        // ✅ SHORT format WITHOUT currency symbol
        valueFormatter: isModal 
          ? (value: any) => `${currencySymbol}${value.toLocaleString()}`
          : formatYAxis,
      }],
      series: [{
        data: seriesData,
        curve: "natural" as const,
        area: true,
        showMark: isModal,
        valueFormatter: (value: any) => 
          value !== null && value !== undefined
            ? formatCurrency(value)
            : 'N/A',
      }],
      height,
      // ✅ MINIMAL MARGINS - Main fix!
      margin: isModal 
        ? { left: 70, right: 40, top: 40, bottom: 60 }
        : { 
            left:0,
            right:0,
            top: 0, 
            bottom:0
          },
    };
  };

  const chartConfig = getChartConfig(false);
  const modalChartConfig = getChartConfig(true);

  return (
    <>
      {/* Main Card - Clickable */}
      <Card 
        sx={{ 
          height: { xs: "160px", sm: "180px", md: "214px" },
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={handleCardClick}
      >
        <CardContent sx={{ 
          height: "100%", 
          p: { xs: 1.5, sm: 2 },
          '&:last-child': { pb: { xs: 1.5, sm: 2 } }  // ✅ Remove extra bottom padding
        }}>
          {/* Zoom Icon */}
          <Box sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            bgcolor: 'rgba(0,0,0,0.6)',
            borderRadius: '50%',
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}>
            <ZoomInIcon sx={{ fontSize: 16, color: 'white' }} />
          </Box>

          <Typography 
            variant="subtitle2" 
            sx={{ 
              mb: 0.5,
              fontWeight: 600,
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
            }}
          >
            📈 Revenue Trend
          </Typography>
          
          <Box sx={{ width: '100%', height: chartHeight, mt: 0.5 }}>
            <LineChart
              {...chartConfig}
              grid={{ horizontal: true, vertical: false }}
              sx={{
                '& .MuiChartsAxis-tickLabel': {
                  fontSize: isMobile ? '8px !important' : '10px !important',
                  fill: '#666',
                  fontWeight: 500,
                },
                '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': {
                  transform: 'translateY(5px)',  // ✅ Push labels down slightly
                },
                '& .MuiChartsAxis-left .MuiChartsAxis-tickLabel': {
                  transform: 'translateX(-2px)',  // ✅ Pull Y-axis labels closer
                },
                '& .MuiChartsAxis-line': {
                  stroke: '#e0e0e0',
                  strokeWidth: 1,
                },
                '& .MuiChartsGrid-line': {
                  stroke: '#f5f5f5',
                  strokeDasharray: '2 2',
                  strokeWidth: 0.5,
                },
                '& .MuiLineElement-root': {
                  strokeWidth: 2.5,
                  filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.15))',
                },
                '& .MuiAreaElement-root': {
                  fill: 'url(#gradient)',
                  fillOpacity: 0.25,
                },
              }}
            >
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.05} />
                </linearGradient>
              </defs>
            </LineChart>
          </Box>
        </CardContent>
      </Card>

      {/* Modal for Detailed Chart */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="trend-chart-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          sx={{
            width: { xs: '95%', sm: '90%', md: '80%', lg: '70%' },
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflow: 'auto',
            p: { xs: 2, sm: 3, md: 4 },
            position: 'relative',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.05)',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.1)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Modal Header */}
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3, 
              fontWeight: 600,
              pr: 5,
            }}
          >
            📈 Revenue Trend - Last 12 Months
          </Typography>

          {/* Stats Summary */}
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            mb: 3,
            flexWrap: 'wrap',
          }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Revenue
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {formatCurrency(seriesData.reduce((a, b) => a + b, 0))}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Average/Month
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {formatCurrency(seriesData.reduce((a, b) => a + b, 0) / seriesData.length)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Peak Month
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {xAxisData[seriesData.indexOf(maxValue)]}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Peak Amount
              </Typography>
              <Typography variant="h6" fontWeight={600} color="primary">
                {formatCurrency(maxValue)}
              </Typography>
            </Box>
          </Box>

          {/* Detailed Chart */}
          <Box sx={{ width: '100%', height: 400 }}>
            <LineChart
              {...modalChartConfig}
              grid={{ horizontal: true, vertical: true }}
              sx={{
                '& .MuiChartsAxis-tickLabel': {
                  fontSize: '0.875rem !important',
                },
                '& .MuiChartsAxis-line': {
                  stroke: '#e0e0e0',
                },
                '& .MuiChartsGrid-line': {
                  stroke: '#f0f0f0',
                  strokeDasharray: '3 3',
                },
                '& .MuiLineElement-root': {
                  strokeWidth: 4,
                  filter: 'drop-shadow(0px 3px 6px rgba(0,0,0,0.3))',
                },
                '& .MuiAreaElement-root': {
                  fill: 'url(#modalGradient)',
                  fillOpacity: 0.3,
                },
                '& .MuiMarkElement-root': {
                  fill: theme.palette.primary.main,
                  stroke: '#fff',
                  strokeWidth: 3,
                  r: 6,
                },
              }}
            >
              <defs>
                <linearGradient id="modalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.05} />
                </linearGradient>
              </defs>
            </LineChart>
          </Box>

          {/* Data Table */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Monthly Breakdown
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}>
              {validData.map((item, index) => (
                <Paper 
                  key={index}
                  sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(0,0,0,0.02)',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {item.month}
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatCurrency(item.amount)}
                  </Typography>
                  {item.count !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      {item.count} invoice{item.count !== 1 ? 's' : ''}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          </Box>
        </Paper>
      </Modal>
    </>
  );
};

export default TrendChart;