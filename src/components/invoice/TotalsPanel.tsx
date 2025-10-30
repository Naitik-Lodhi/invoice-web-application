// src/components/invoice/TotalsPanel.tsx
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
} from "@mui/material";

interface TotalsPanelProps {
  subTotal: number;
  taxPercent: number;
  taxAmount: number;
  invoiceAmount: number;
  onTaxPercentChange: (value: number) => void;
  onTaxAmountChange: (value: number) => void;
  companyCurrency: string;
  isMobile: boolean;
}

const TotalsPanel = ({
  subTotal,
  taxPercent,
  taxAmount,
  invoiceAmount,
  onTaxPercentChange,
  onTaxAmountChange,
  companyCurrency,
}: TotalsPanelProps) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return `${companyCurrency}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Card sx={{ boxShadow: 1 }}>
      <CardContent
        sx={{
          p: { xs: 1.5, sm: 2 },
          "&:last-child": { pb: { xs: 1.5, sm: 2 } },
        }}
      >
        {/* Horizontal Layout */}
        <Box
          sx={{
            display: "flex",
            gap: { xs: 2, sm: 3 },
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: { xs: 2, sm: 3 },
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Tax % */}
            <Box sx={{ minWidth: { xs: "45%", sm: 120 } }}>
              <Typography
                variant="caption"
                sx={{ color: "#666", display: "block", mb: 0.5 }}
              >
                Tax %
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={taxPercent}
                onChange={(e) =>
                  onTaxPercentChange(parseFloat(e.target.value) || 0)
                }
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    e.preventDefault();
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                }}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                sx={{
                  "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                    {
                      WebkitAppearance: "none",
                    },
                  "& input[type=number]": { MozAppearance: "textfield" },
                  "& .MuiOutlinedInput-root": {
                    "& input": {
                      py: 0.75,
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    },
                  },
                }}
              />
            </Box>

            {/* Tax Amount */}
            <Box sx={{ minWidth: { xs: "45%", sm: 140 } }}>
              <Typography
                variant="caption"
                sx={{ color: "#666", display: "block", mb: 0.5 }}
              >
                Tax Amount
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={taxAmount}
                onChange={(e) =>
                  onTaxAmountChange(parseFloat(e.target.value) || 0)
                }
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    e.preventDefault();
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {companyCurrency}
                    </InputAdornment>
                  ),
                }}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{
                  "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                    {
                      WebkitAppearance: "none",
                    },
                  "& input[type=number]": { MozAppearance: "textfield" },
                  "& .MuiOutlinedInput-root": {
                    "& input": {
                      py: 0.75,
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    },
                  },
                }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: { xs: 2, sm: 3 },
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Sub Total */}
            <Box sx={{ minWidth: { xs: "45%", sm: "auto" } }}>
              <Typography
                variant="caption"
                sx={{ color: "#666", display: "block" }}
              >
                Sub Total
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                }}
              >
                {formatCurrency(subTotal)}
              </Typography>
            </Box>

            {/* Divider */}
            <Box
              sx={{
                width: { xs: "100%", sm: "auto" },
                height: { xs: "1px", sm: "40px" },
                bgcolor: "#e0e0e0",
                mx: { xs: 0, sm: 1 },
              }}
            />

            {/* Invoice Amount */}
            <Box
              sx={{
                minWidth: { xs: "100%", sm: "auto" },
                textAlign: { xs: "center", sm: "left" },
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "#1976d2", display: "block" }}
              >
                Invoice Amount
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: "#1976d2",
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                }}
              >
                {formatCurrency(invoiceAmount)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TotalsPanel;
