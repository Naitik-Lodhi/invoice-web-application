// src/components/invoice/InvoiceDetailsSection.tsx
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
          p: { xs: 1.5, sm: 2 },
          "&:last-child": { pb: { xs: 1.5, sm: 2 } },
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            mb: 1,
            fontWeight: 600,
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          Invoice Details
        </Typography>

        <Grid container spacing={{ xs: 1, sm: 1.5 }}>
          {/* Invoice No & Date */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormField
              name="invoiceNo"
              control={control}
              label="Invoice No"
              type="number"
              placeholder="1001"
              required
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
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
                        mb: 0.5,
                        fontWeight: 500,
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
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
                                py: 0.75,
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

          {/* Customer & City */}
          <Grid size={{ xs: 12, sm: 3 }}>
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

          <Grid size={{ xs: 12, sm: 3 }}>
            <FormField
              name="city"
              control={control}
              label="City"
              type="text"
              placeholder="City"
              maxLength={50}
            />
          </Grid>

          {/* Address & Notes */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField
              name="address"
              control={control}
              label="Address"
              placeholder="Address"
              maxLength={200}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
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
