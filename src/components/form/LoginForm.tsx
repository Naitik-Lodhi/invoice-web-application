// src/components/form/LoginForm.tsx
import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  Link,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import FormHeader from "./FormHeader";
import FormField from "./FormField";
import PasswordField from "./PasswordField";
import AppButton from "../AppButton";

interface LoginFormProps {
  control: Control<any>;
  isSubmitting: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  error?: string;
  errors?: FieldErrors<any>;
}

export default function LoginForm({
  control,
  isSubmitting,
  onSubmit,
  error,
  errors = {},
}: LoginFormProps) {
  // ✅ Prevent default form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page refresh
    e.stopPropagation(); // Stop event bubbling
    await onSubmit(e as React.BaseSyntheticEvent);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ maxWidth: "450px", mx: "auto", px: 2 }}>
      <FormHeader title="Welcome Back" subtitle="Log in to your account." />

      {/* ✅ Show API error - ALWAYS visible when error exists */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mt: 2,
            mb: 2,
            "& .MuiAlert-message": {
              width: "100%",
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {error}
          </Typography>
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleFormSubmit} // ✅ Use our custom handler
        noValidate
        sx={{ mt: 2 }}
      >
        {/* Email Field */}
        <FormField
          name="email"
          control={control}
          label="Email Address"
          type="email"
          placeholder="example@email.com"
          required
        />

        {/* Password Field */}
        <PasswordField
          name="password"
          control={control}
          label="Password"
          placeholder="Enter your password"
          maxLength={20}
        />

        <Controller
          name="rememberMe"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox {...field} checked={field.value} color="default" />
              }
              label="Remember me"
            />
          )}
        />

        {/* Buttons Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",

            gap: 2,
            mt: 3,
          }}
        >
          <Box  sx={{ 
              display: "flex",
              width: "100%",
              justifyContent: { 
                xs: "center", 
                sm: "flex-end" 
              }
            }}>
            <AppButton
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
                sx={{
                minWidth: { xs: 200, sm: 120 },
              }}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </AppButton>
          </Box>
          <Typography variant="body2" sx={{ textAlign: "center" }}>
            Don't have an account?{" "}
            <Link
              component={RouterLink}
              to="/signup"
              sx={{ fontWeight: "bold" }}
            >
              Create Account
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
