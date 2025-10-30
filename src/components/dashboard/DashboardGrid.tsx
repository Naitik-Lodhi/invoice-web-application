// src/components/dashboard/DashboardGrid.tsx
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useState } from "react";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import type { Dayjs } from "dayjs";
import StatCard from "./StatCard";
import TrendChart from "./TrendChart";
import TopItemsChart from "./TopItemsChart";
import type { TopItemsData } from "../../pages/DashboardPage";

// Helper function to format numbers
const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num);
};

interface DashboardGridProps {
  // Metrics
  invoiceCount: number;
  totalAmount: number;
  companyCurrency: string;

  // Chart data
  trend12mData: any;
  topItemsData: TopItemsData;

  // Grid data
  invoices: any[];

  // Loading states
  isLoadingMetrics: boolean;
  isLoadingList: boolean;
  isLoadingTrend: boolean;
  isLoadingTopItems: boolean;

  // Display props
  currentFilter: string;
  searchText?: string;

  // Filter controls (for mobile)
  onFilterChange?: (filter: string) => void;
  onClearFilter?: () => void;
  onCustomDateChange?: (start: Dayjs | null, end: Dayjs | null) => void;

  onTotalAmountClick?: (event: React.MouseEvent<HTMLElement>) => void;
  topCustomers?: { name: string; amount: number; percentage: number }[];
}

const dateFilters = ["Today", "Week", "Month", "Year", "Custom"];

const DashboardGrid = ({
  invoiceCount,
  totalAmount,
  companyCurrency,
  trend12mData,
  topItemsData,
  isLoadingMetrics,
  isLoadingTrend,
  isLoadingTopItems,
  currentFilter,
  onFilterChange,
  onClearFilter,
  onTotalAmountClick,
  topCustomers,
}: DashboardGridProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };

  const handleFilterSelect = (filter: string) => {
    if (onFilterChange) {
      onFilterChange(filter);
    }
    handleFilterMenuClose();
  };

  // Mobile filters above cards
  const mobileFilters = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
      <Chip
        label={currentFilter}
        onClick={handleFilterMenuOpen}
        onDelete={
          currentFilter !== "Today" && onClearFilter ? onClearFilter : undefined
        }
        deleteIcon={<ClearIcon />}
        sx={{
          bgcolor: "black",
          color: "white",
          "& .MuiChip-deleteIcon": {
            color: "white",
            "&:hover": {
              color: "#ccc",
            },
          },
        }}
      />
      <IconButton size="small" onClick={handleFilterMenuOpen}>
        <FilterListIcon />
      </IconButton>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        {dateFilters.map((filter) => (
          <MenuItem
            key={filter}
            onClick={() => handleFilterSelect(filter)}
            selected={filter === currentFilter}
          >
            {filter}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );

  return (
    <Box>
      {/* Mobile filters at the top */}
      {isMobile && mobileFilters}

      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        {/* Card 1: Invoice Count */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {isLoadingMetrics ? (
            <Skeleton
              variant="rectangular"
              height={214}
              sx={{ borderRadius: 1 }}
            />
          ) : (
            <StatCard
              title="Invoices"
              value={formatNumber(invoiceCount)}
              subtext={currentFilter}
            />
          )}
        </Grid>

        {/* Card 2: Total Amount */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {isLoadingMetrics ? (
            <Skeleton
              variant="rectangular"
              height={214}
              sx={{ borderRadius: 1 }}
            />
          ) : (
            <Box
              onClick={onTotalAmountClick}
              sx={{
                cursor:
                  topCustomers && topCustomers.length > 0
                    ? "pointer"
                    : "default",
              }}
            >
              <StatCard
                title="Total Amount"
                value={`${companyCurrency}${formatNumber(totalAmount)}`}
                subtext={currentFilter}
              />
            </Box>
          )}
        </Grid>

        {/* Card 3: Line Chart - Last 12 Months */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {isLoadingTrend ? (
            <Skeleton
              variant="rectangular"
              height={214}
              sx={{ borderRadius: 1 }}
            />
          ) : trend12mData &&
            trend12mData.months &&
            trend12mData.months.length > 0 ? (
            <TrendChart
              data={trend12mData.months}
              currencySymbol={companyCurrency}
            />
          ) : (
            <Card
              sx={{
                height: { xs: "160px", sm: "180px", md: "214px" },
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              }}
            >
              <CardContent
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <Typography color="text.secondary" variant="body2">
                  No trend data available
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  {currentFilter === "Custom"
                    ? "Try selecting a different date range"
                    : "Data will appear once invoices are created"}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Card 4: Pie Chart - Top 5 Items */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {isLoadingTopItems ? (
            <Skeleton
              variant="circular"
              height={214}
              sx={{ borderRadius: 1 }}
            />
          ) : topItemsData && topItemsData.items ? (
            <TopItemsChart
              data={topItemsData.items}
              currencySymbol={companyCurrency}
              currentFilter={currentFilter}
            />
          ) : (
            <Card
              sx={{
                height: { xs: "160px", sm: "180px", md: "214px" },
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              }}
            >
              <CardContent
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography color="text.secondary">No items data</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardGrid;
