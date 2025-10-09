// src/pages/auth/Signup.tsx
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import { Box, Typography, Link } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";

// Import custom components and schemas
import AppButton from "../../components/AppButton";
import FormField from "../../components/form/FormField";
import PasswordField from "../../components/PasswordField";
import FormHeader from "../../components/form/FormHeader";
import {
  signupSchema,
  type SignupFormData,
} from "../../utils/validationSchemas";
import FileUploadField from "../../components/form/FileUploadField";

const Signup = () => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema), // Connect Zod schema with react-hook-form
    mode: "onBlur",
    // --- FIX IS HERE ---
    // Explicitly define default values to avoid Zod's `undefined` error
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      companyName: "",
      address: "",
      city: "",
      zipCode: "",
      industry: "",
      currencySymbol: "",
      // companyLogo: undefined, // Default for file input
    },
  });

  const onSubmit: SubmitHandler<SignupFormData> = (data) => {
    console.log("Form Data:", data);
    // Simulate API call
    return new Promise((resolve) => setTimeout(resolve, 2000));
  };

  return (
    <Box sx={{ maxWidth: "900px", mx: "auto", px: 2, pb: 8 }}>
      <FormHeader
        title="Create Your Account"
        subtitle="Set up your company and start invoicing in minutes."
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
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
              label="Address"
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
              <FormField name="city" control={control} label="City" required maxLength={50} />
              <FormField
                name="zipCode"
                control={control}
                label="Zip Code"
                type="number"
                required
                maxLength={6}
              />
            </Box>
            <FormField name="industry" control={control} label="Industry" maxLength={50} />
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

        {/* Buttons Section - YOUR LAYOUT */}
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
              sx={{
                width: { xs: "100%", sm: "auto" }, // Full width on mobile
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
};

export default Signup;
