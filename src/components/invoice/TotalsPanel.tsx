// src/components/invoice/TotalsPanel.tsx
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Grid,
  Tooltip,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

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
  isMobile,
}: TotalsPanelProps) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return `${companyCurrency}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <Card>
      <CardContent>
        <Grid container spacing={3}>
          {/* Left side: Label */}
          <Grid>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "1rem", sm: "1.125rem" },
                display: "flex",
                alignItems: "center",
                height: "100%",
              }}
            >
              Invoice Total
            </Typography>
          </Grid>

          {/* Right side: Calculations */}
          <Grid>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              {/* Sub Total */}
              <Box>
                <Typography sx={{ fontWeight: 500, color: "#666" }}>
                  Sub Total:
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "1.125rem",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(subTotal)}
                </Typography>
              </Box>

              {/* Tax Section */}
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "flex-start",
                    flexWrap: isMobile ? "wrap" : "nowrap",
                  }}
                >
                  {/* Tax Percent */}
                  <Box sx={{ flex: 1, minWidth: isMobile ? "100%" : "45%" }}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          color: "#666",
                        }}
                      >
                        Tax %
                      </Typography>
                      <Tooltip
                        title="Edit Tax % to auto-calculate Tax Amount"
                        arrow
                      >
                        <InfoOutlinedIcon
                          sx={{
                            fontSize: "1rem",
                            ml: 0.5,
                            color: "#999",
                            cursor: "help",
                          }}
                        />
                      </Tooltip>
                    </Box>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={taxPercent}
                      onChange={(e) =>
                        onTaxPercentChange(parseFloat(e.target.value) || 0)
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">%</InputAdornment>
                        ),
                      }}
                      inputProps={{
                        min: 0,
                        max: 100,
                        step: 0.01,
                        "aria-label": "Tax percentage",
                      }}
                      sx={{
                        // For Webkit browsers (Chrome, Safari, Edge)
                        "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                          {
                            WebkitAppearance: "none",
                            margin: 0,
                          },
                        // For Firefox
                        "& input[type=number]": {
                          MozAppearance: "textfield",
                        },
                        // Previous styling for border-radius and height
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "6px",
                          "& input": {
                            height: "42px",
                            padding: "0 14px",
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Tax Amount */}
                  <Box sx={{ flex: 1, minWidth: isMobile ? "100%" : "45%" }}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          color: "#666",
                        }}
                      >
                        Tax Amount
                      </Typography>
                      <Tooltip
                        title={
                          subTotal === 0
                            ? "No tax on zero subtotal"
                            : "Edit Tax Amount to auto-calculate Tax %"
                        }
                        arrow
                      >
                        <InfoOutlinedIcon
                          sx={{
                            fontSize: "1rem",
                            ml: 0.5,
                            color: "#999",
                            cursor: "help",
                          }}
                        />
                      </Tooltip>
                    </Box>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      value={taxAmount}
                      onChange={(e) =>
                        onTaxAmountChange(parseFloat(e.target.value) || 0)
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {companyCurrency}
                          </InputAdornment>
                        ),
                      }}
                      inputProps={{
                        min: 0,
                        step: 0.01,
                        "aria-label": "Tax amount",
                      }}
                      sx={{
                        // For Webkit browsers (Chrome, Safari, Edge)
                        "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                          {
                            WebkitAppearance: "none",
                            margin: 0,
                          },
                        // For Firefox
                        "& input[type=number]": {
                          MozAppearance: "textfield",
                        },
                        // Previous styling for border-radius and height
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "6px",
                          "& input": {
                            height: "42px",
                            padding: "0 14px",
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>

                {/* No tax hint */}
                {subTotal === 0 && (
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      color: "#999",
                      mt: 0.5,
                      fontStyle: "italic",
                    }}
                  >
                    No tax on zero subtotal
                  </Typography>
                )}
              </Box>

              {/* Divider */}
              <Box
                sx={{
                  height: "1px",
                  bgcolor: "#e0e0e0",
                  my: 1,
                }}
              />
              <Typography
                sx={{
                  color: "#1976d2",
                }}
              >
                Invoice Amount:
              </Typography>
              <Typography
                sx={{
                  color: "#1976d2",
                  textAlign: "right",
                }}
              >
                {formatCurrency(invoiceAmount)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default TotalsPanel;
