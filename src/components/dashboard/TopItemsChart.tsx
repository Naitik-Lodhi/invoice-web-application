// src/components/dashboard/TopItemsChart.tsx
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";

interface TopItemsChartProps {
  data: Array<{
    name: string;
    value: number;
    quantity: number;
  }>;
  currencySymbol: string;
  currentFilter: string;
}

const TopItemsChart = ({
  data,
  currencySymbol,
  currentFilter,
}: TopItemsChartProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // Prepare data for MUI PieChart
  const pieData = data.map((item, index) => ({
    id: index,
    value: item.value,
    label: item.name,
    quantity: item.quantity,
  }));

  // Define colors for pie slices
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
  ];

  // Calculate dimensions
  const chartHeight = isMobile ? 120 : isTablet ? 140 : 160;
  const chartWidth = "100%";

  return (
    <Card
      sx={{
        height: { xs: "160px", sm: "180px", md: "214px" },
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      }}
    >
      <CardContent sx={{ height: "100%", p: isMobile ? 1.5 : 2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            mb: 1,
            fontWeight: 600,
            fontSize: isMobile ? "0.75rem" : "0.875rem",
          }}
        >
          Top Items - {currentFilter}
        </Typography>

        <Box
          sx={{
            width: "100%",
            height: chartHeight,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <PieChart
            series={[
              {
                data: pieData,
                highlightScope: { fade: "global", highlight: "item" },
                faded: {
                  innerRadius: 30,
                  additionalRadius: -10,
                  color: "gray",
                },
                valueFormatter: (item) => {
                  const value = item.value ?? 0;
                  return `${currencySymbol}${value.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}`;
                },
              },
            ]}
            width={isMobile ? 280 : 100} 
            height={chartHeight}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            sx={{
              "& .MuiPieArc-root": {
                strokeWidth: 1,
                stroke: "#fff",
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default TopItemsChart;
