// src/components/form/SignupForm.tsx
import { Box, Typography, Link, Alert } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { type Control, type FieldErrors } from 'react-hook-form';

import FormHeader from "./FormHeader";
import FormField from "./FormField";
import PasswordField from "./PasswordField";
import FileUploadField from "./FileUploadField";
import AppButton from "../AppButton";

interface SignupFormProps {
  control: Control<any>;
  isSubmitting: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  error?: string;
  errors?: FieldErrors;
}

export default function SignupForm({ 
  control, 
  isSubmitting, 
  onSubmit, 
  error,
  errors 
}: SignupFormProps) {
  return (
   <Box sx={{ maxWidth: "900px", mx: "auto", px: 2, pb: 8 }}>
      <FormHeader
        title="Create Your Account"
        subtitle="Set up your company and start invoicing in minutes."
      />

      {/* Show general error if exists */}
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Show root error from form validation */}
      {errors?.root && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {errors.root.message}
        </Alert>
      )}

      <Box component="form" onSubmit={onSubmit} noValidate>
        <Box
          sx={{
            display: "flex",
            gap: 4,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          {/* Left Column: User Info */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, borderBottom: "1px solid #ccc", pb: 1 }}
            >
              User Information
            </Typography>
            <FormField
              name="firstName"
              control={control}
              label="First Name"
              required
              maxLength={50}
            />
            <FormField
              name="lastName"
              control={control}
              label="Last Name"
              required
              maxLength={50}
            />
            <FormField
              name="email"
              control={control}
              label="Email Address"
              type="email"
              required
            />
            <PasswordField
              name="password"
              control={control}
              label="Password"
              maxLength={20}
              showStrengthMeter={true}
            />
          </Box>

          {/* Right Column: Company Info */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{ mb: 2, borderBottom: "1px solid #ccc", pb: 1 }}
            >
              Company Information
            </Typography>
            <FormField
              name="companyName"
              control={control}
              label="Company Name"
              required
              maxLength={100}
            />
            <FileUploadField
              name="companyLogo"
              control={control}
              label="Company Logo"
            />
            <FormField
              name="address"
              control={control}
              label="Company Address"
              required
              maxLength={500}
              rows={3}
            />
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <FormField 
                name="city" 
                control={control} 
                label="City" 
                required 
                maxLength={50} 
              />
              <FormField
                name="zipCode"
                control={control}
                label="Zip Code"
                type="text"  // Changed from "number" to "text" for better control
                required
                maxLength={6}
              />
            </Box>
            <FormField 
              name="industry" 
              control={control} 
              label="Industry" 
              maxLength={50} 
            />
            <FormField
              name="currencySymbol"
              control={control}
              label="Currency Symbol"
              placeholder="$, ₹, €, etc."
              required
              maxLength={5}
            />
          </Box>
        </Box>

        {/* Buttons Section */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            mt: 4,
            gap: 2,
          }}
        >
          <Box display="flex" width="100%" justifyContent="flex-end">
            <AppButton
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              sx={{
                width: { xs: "100%", sm: "auto" },
              }}
            >
              Sign Up
            </AppButton>
          </Box>
          <Typography variant="body2">
            Already have an account?{" "}
            <Link
              component={RouterLink}
              to="/login"
              sx={{ fontWeight: "bold" }}
            >
              Login
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}