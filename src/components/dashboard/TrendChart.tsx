// src/components/dashboard/TrendChart.tsx
import { Card, CardContent, Typography, Box, useTheme, useMediaQuery } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";

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

  // Calculate height based on screen size
  const chartHeight = isMobile ? 120 : isTablet ? 140 : 160;

  // ✅ Calculate max value for better Y-axis scaling
  const maxValue = Math.max(...seriesData);
  const yAxisMax = maxValue > 0 ? Math.ceil(maxValue * 1.1) : 100;

  return (
    <Card sx={{ 
      height: { xs: "160px", sm: "180px", md: "214px" },
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    }}>
      <CardContent sx={{ height: "100%", p: isMobile ? 1.5 : 2 }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            mb: 1, 
            fontWeight: 600,
            fontSize: isMobile ? '0.75rem' : '0.875rem'
          }}
        >
          Revenue Trend (12 Months)
        </Typography>
        
        <Box sx={{ width: '100%', height: chartHeight }}>
          <LineChart
            xAxis={[
              {
                data: xAxisData,
                scaleType: 'point',
                tickLabelStyle: {
                  fontSize: isMobile ? 8 : 10,
                  angle: isMobile ? -45 : 0,
                },
              }
            ]}
            yAxis={[
              {
                max: yAxisMax,
                tickLabelStyle: {
                  fontSize: isMobile ? 8 : 10,
                },
                valueFormatter: (value:any) => {
                  if (isMobile && value >= 1000) {
                    return `${currencySymbol}${(value / 1000).toFixed(0)}k`;
                  }
                  return `${currencySymbol}${value.toLocaleString()}`;
                },
              }
            ]}
            series={[
              {
                data: seriesData,
                curve: "linear",
                color: theme.palette.primary.main,
                area: false,
                showMark: !isMobile,
                valueFormatter: (value) => 
                  value !== null && value !== undefined
                    ? `${currencySymbol}${value.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : 'N/A',
              }
            ]}
            height={chartHeight}
            margin={{ 
              left: isMobile ? 40 : 50, 
              right: isMobile ? 10 : 20, 
              top: 10, 
              bottom: isMobile ? 30 : 25 
            }}
            grid={{ horizontal: true, vertical: false }}
            sx={{
              '& .MuiChartsAxis-tickLabel': {
                fontSize: isMobile ? '0.6rem !important' : '0.7rem !important',
              },
              '& .MuiChartsAxis-line': {
                stroke: '#e0e0e0',
              },
              '& .MuiChartsGrid-line': {
                stroke: '#f0f0f0',
                strokeDasharray: '3 3',
              },
              '& .MuiLineElement-root': {
                strokeWidth: 2,
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default TrendChart;