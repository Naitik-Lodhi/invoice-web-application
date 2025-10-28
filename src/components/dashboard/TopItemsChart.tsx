// src/components/dashboard/TopItemsChart.tsx
import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import DetailedViewDialog from "./DetailedViewDialog";

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
  
  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    name: string;
    value: number;
    quantity: number;
  } | null>(null);

  // Prepare data for MUI PieChart with original item reference
  const pieData = data.map((item, index) => ({
    id: index,
    value: item.value,
    label: item.name,
    quantity: item.quantity,
    originalData: item, // Keep reference to original item
  }));


  // Calculate dimensions
  const chartHeight = isMobile ? 120 : isTablet ? 140 : 160;

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedItem(null);
  };

  // Handle click on the entire chart area
  const handleChartClick = () => {
    // If there's data, show details for the first/largest item as default
    if (data && data.length > 0) {
      setSelectedItem(data[0]);
      setDialogOpen(true);
    }
  };

  return (
    <>
      <Card
        sx={{
          height: { xs: "160px", sm: "180px", md: "214px" },
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          cursor: "pointer",
        }}
        onClick={handleChartClick}
      >
        <CardContent sx={{ height: "100%", p: isMobile ? 1.5 : 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                fontSize: isMobile ? "0.75rem" : "0.875rem",
              }}
            >
              Top Items - {currentFilter}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.primary.main,
                fontSize: isMobile ? "0.65rem" : "0.75rem",
              }}
            >
              Click to view details
            </Typography>
          </Box>

          <Box
            sx={{
              width: "100%",
              height: chartHeight,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
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
                  // Add arc label to show which item can be clicked
                  arcLabel: (item) => {
                    const percent = ((item.value / data.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0);
                    return `${percent}%`;
                  },
                  arcLabelMinAngle: 35,
                },
              ]}
              width={isMobile ? 280 : 300}
              height={chartHeight}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              sx={{
                "& .MuiPieArc-root": {
                  strokeWidth: 1,
                  stroke: "#fff",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    filter: "brightness(1.1)",
                    transform: "scale(1.02)",
                  },
                },
                "& .MuiChartsTooltip-root": {
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Detailed View Dialog */}
      <DetailedViewDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        selectedItem={selectedItem}
        allItems={data}
        currencySymbol={currencySymbol}
        currentFilter={currentFilter}
      />
    </>
  );
};

export default TopItemsChart;