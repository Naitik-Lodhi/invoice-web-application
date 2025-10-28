// src/components/dashboard/DetailedViewDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InventoryIcon from "@mui/icons-material/Inventory";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

interface DetailedViewDialogProps {
  open: boolean;
  onClose: () => void;
  selectedItem: {
    name: string;
    value: number;
    quantity: number;
  } | null;
  allItems: Array<{
    name: string;
    value: number;
    quantity: number;
  }>;
  currencySymbol: string;
  currentFilter: string;
}

const DetailedViewDialog = ({
  open,
  onClose,
  selectedItem,
  allItems,
  currencySymbol,
  currentFilter,
}: DetailedViewDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!selectedItem) return null;

  // Calculate percentage of total
  const totalValue = allItems.reduce((sum, item) => sum + item.value, 0);
  const percentage = ((selectedItem.value / totalValue) * 100).toFixed(1);

  // Calculate average price per item
  const avgPrice = selectedItem.quantity > 0 
    ? selectedItem.value / selectedItem.quantity 
    : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h6" component="div">
            {selectedItem.name}
          </Typography>
          <Chip
            label={currentFilter}
            size="small"
            sx={{ mt: 0.5 }}
            color="primary"
            variant="outlined"
          />
        </Box>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {/* Key Metrics Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 2,
            mb: 3,
          }}
        >
          {/* Total Revenue */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: theme.palette.primary.main + "10",
              border: `1px solid ${theme.palette.primary.main}30`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <AttachMoneyIcon color="primary" fontSize="small" />
              <Typography variant="caption" color="text.secondary">
                Total Revenue
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold">
              {currencySymbol}
              {selectedItem.value.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </Typography>
          </Box>

          {/* Quantity Sold */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: theme.palette.success.main + "10",
              border: `1px solid ${theme.palette.success.main}30`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <InventoryIcon color="success" fontSize="small" />
              <Typography variant="caption" color="text.secondary">
                Quantity Sold
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold">
              {selectedItem.quantity.toLocaleString("en-US")}
            </Typography>
          </Box>

          {/* Average Price */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: theme.palette.warning.main + "10",
              border: `1px solid ${theme.palette.warning.main}30`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <TrendingUpIcon color="warning" fontSize="small" />
              <Typography variant="caption" color="text.secondary">
                Average Price
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold">
              {currencySymbol}
              {avgPrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Box>

          {/* Market Share */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: theme.palette.info.main + "10",
              border: `1px solid ${theme.palette.info.main}30`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <TrendingUpIcon color="info" fontSize="small" />
              <Typography variant="caption" color="text.secondary">
                Share of Total
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold">
              {percentage}%
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Comparison with other items */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Comparison with Other Items
          </Typography>
          <Box sx={{ mt: 2 }}>
            {allItems.map((item, index) => {
              const itemPercentage = ((item.value / totalValue) * 100).toFixed(1);
              const isSelected = item.name === selectedItem.name;
              
              return (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 1.5,
                    px: 1,
                    borderRadius: 1,
                    bgcolor: isSelected ? theme.palette.action.selected : "transparent",
                    "&:hover": {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="body2"
                      fontWeight={isSelected ? "bold" : "normal"}
                    >
                      {item.name}
                    </Typography>
                    {isSelected && (
                      <Chip label="Current" size="small" color="primary" />
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {item.quantity} units
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={isSelected ? "bold" : "normal"}
                    >
                      {currencySymbol}
                      {item.value.toLocaleString("en-US")}
                    </Typography>
                    <Chip
                      label={`${itemPercentage}%`}
                      size="small"
                      variant={isSelected ? "filled" : "outlined"}
                      color={isSelected ? "primary" : "default"}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" fullWidth={isMobile}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetailedViewDialog;