// src/components/invoice/InvoiceDetailsSection.tsx
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import {type Control,type FieldErrors } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Controller } from 'react-hook-form';
import dayjs from 'dayjs';
import type { InvoiceFormData } from './InvoiceEditor';
import FormField from '../form/FormField';

interface InvoiceDetailsSectionProps {
  control: Control<InvoiceFormData>;
  errors: FieldErrors<InvoiceFormData>;
  isMobile: boolean;
}

const InvoiceDetailsSection = ({
  control,
}: InvoiceDetailsSectionProps) => {
  return (
    <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <CardContent sx={{ p: { xs: 2, sm: 1 } }}>
        <Typography
          variant="h6"
          sx={{
            mb: 1,
            fontWeight: 600,
            fontSize: { xs: '1rem', sm: '1.125rem' },
          }}
        >
          Invoice Details
        </Typography>

        <Grid container spacing={1}>
          {/* Row 1: Invoice No & Invoice Date */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField
              name="invoiceNo"
              control={control}
              label="Invoice No"
              type="number"
              placeholder="INV-001"
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Controller
                name="invoiceDate"
                control={control}
                rules={{ required: 'Pick a date.' }}
                render={({ field, fieldState: { error } }) => (
                  <Box sx={{ width: '100%', mb:1 }}>
                    <Typography
                      component="label"
                      sx={{ display: 'block', mb: 1, fontWeight: '500' }}
                    >
                      Invoice Date
                      <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                    </Typography>
                    <DatePicker
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date?.toDate())}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!error,
                          helperText: error?.message,
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '6px',
                              '& input': {
                                height: '42px',
                                padding: '0 14px',
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

          {/* Row 2: Customer Name & City */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField
              name="customerName"
              control={control}
              label="Customer"
              type="text"
              placeholder="Enter customer name"
              required
              maxLength={50}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField
              name="city"
              control={control}
              label="City"
              type="text"
              placeholder="Enter city"
              maxLength={50}
            />
          </Grid>

          {/* Row 3: Address & Notes */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField
              name="address"
              control={control}
              label="Address"
              placeholder="Enter address"
              maxLength={500}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormField
              name="notes"
              control={control}
              label="Notes"
              placeholder="Enter notes"
              maxLength={500}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default InvoiceDetailsSection;