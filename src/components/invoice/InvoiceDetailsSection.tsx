// src/components/invoice/InvoiceDetailsSection.tsx - FIXED ALIGNMENT
import { Box, Typography, Card, CardContent, Grid } from "@mui/material";
import { type Control, type FieldErrors } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Controller } from "react-hook-form";
import dayjs from "dayjs";
import type { InvoiceFormData } from "./InvoiceEditor";
import FormField from "../form/FormField";

interface InvoiceDetailsSectionProps {
  control: Control<InvoiceFormData>;
  errors: FieldErrors<InvoiceFormData>;
  isMobile: boolean;
}

const InvoiceDetailsSection = ({ control }: InvoiceDetailsSectionProps) => {
  return (
    <Card sx={{ boxShadow: 1 }}>
      <CardContent
        sx={{
          p: { xs: 2, sm: 2.5 },
          "&:last-child": { pb: { xs: 2, sm: 2.5 } },
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            mb: 2,
            fontWeight: 600,
            fontSize: { xs: "0.9rem", sm: "1rem" },
          }}
        >
          Invoice Details
        </Typography>

        {/* ✅ FIXED: Proper Grid Layout */}
        <Grid container spacing={2} justifyContent={"center"} >
          {/* Row 1: Invoice No & Date */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormField
              name="invoiceNo"
              control={control}
              label="Invoice No"
              type="number"
              placeholder="1001"
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{pt:"13px"}}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Controller
                name="invoiceDate"
                control={control}
                rules={{ required: "Date required" }}
                render={({ field, fieldState: { error } }) => (
                  <Box sx={{ width: "100%" }}>
                    <Typography
                      component="label"
                      sx={{
                        display: "block",
                        fontWeight: 500,
                        fontSize: { xs: "0.875rem", sm: "0.875rem" },
                      }}
                    >
                      Date <span style={{ color: "red" }}>*</span>
                    </Typography>
                    <DatePicker
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date?.toDate())}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!error,
                          size: "small",
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              "& input": {
                                py:1,
                                fontSize: { xs: "0.875rem", sm: "1rem" },
                              },
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                )}
              />
            </LocalizationProvider>
          </Grid>

          {/* Row 1: Customer & City */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormField
              name="customerName"
              control={control}
              label="Customer"
              type="text"
              placeholder="Customer name"
              required
              maxLength={50}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormField
              name="city"
              control={control}
              label="City"
              type="text"
              placeholder="City"
              maxLength={50}
            />
          </Grid>

          {/* Row 2: Address & Notes - Full width on mobile, half on desktop */}
          <Grid size={{ xs: 12, sm: 12, md: 6 }}>
            <FormField
              name="address"
              control={control}
              label="Address"
              placeholder="Address"
              maxLength={200}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 12, md: 6 }}>
            <FormField
              name="notes"
              control={control}
              label="Notes"
              placeholder="Notes"
              maxLength={200}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default InvoiceDetailsSection;