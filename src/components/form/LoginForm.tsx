// src/components/form/LoginForm.tsx
import {
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  Link,
  Alert,
  useTheme,
  Grid,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { type Control, Controller, type FieldErrors } from "react-hook-form";
import FormHeader from "./FormHeader";
import FormField from "./FormField";
import PasswordField from "./PasswordField";
import AppButton from "../AppButton";
import AnimatedReceipt from "../illustrations/AnimatedReceipt"; // <-- NEW
import { useEffect, useState } from "react";

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
  const [isPasswordActive, setIsPasswordActive] = useState(false);

  useEffect(() => {
    const el = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement | null;
    if (!el) return;
    const onF = () => setIsPasswordActive(true);
    const onB = () => setIsPasswordActive(false);
    el.addEventListener("focus", onF);
    el.addEventListener("blur", onB);
    return () => {
      el.removeEventListener("focus", onF);
      el.removeEventListener("blur", onB);
    };
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await onSubmit(e as React.BaseSyntheticEvent);
  };

  const theme = useTheme();

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", px: 2 }}>
      <Grid
        container
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: { xs: "none", sm: 3 },
          bgcolor: "background.paper",
        }}
      >
        {/* Left animation panel (hidden on mobile) */}
        <Grid
          size={{
            xs: 12,
            sm: 5,
            md: 6,
          }}
          sx={{
            display: { xs: "none", sm: "flex" },
            alignItems: "center",
            justifyContent: "center",
            bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
            p: { sm: 3, md: 4 },
          }}
        >
          <AnimatedReceipt isPasswordActive={isPasswordActive} />
        </Grid>

        {/* Right form panel */}
        <Grid
          size={{
            xs: 12,
            sm: 5,
            md: 6,
          }}
        >
          <Box
            sx={{
              maxWidth: 450,
              mx: "auto",
              px: { xs: 0, sm: 4 },
              py: { xs: 2, sm: 4 },
            }}
          >
            <FormHeader
              title="Welcome Back"
              subtitle="Log in to your account."
            />

            {error && (
              <Alert
                severity="error"
                sx={{
                  mt: 2,
                  mb: 2,
                  "& .MuiAlert-message": { width: "100%" },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {error}
                </Typography>
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleFormSubmit}
              noValidate
              sx={{ mt: 2 }}
            >
              <FormField
                name="email"
                control={control}
                label="Email Address"
                type="email"
                placeholder="example@email.com"
                required
              />

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
                      <Checkbox
                        {...field}
                        checked={!!field.value}
                        color="default"
                      />
                    }
                    label="Remember me"
                  />
                )}
              />

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  mt: 3,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    width: "100%",
                    justifyContent: { xs: "center", sm: "flex-end" },
                  }}
                >
                  <AppButton
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    sx={{ minWidth: { xs: 200, sm: 120 } }}
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
        </Grid>
      </Grid>
    </Box>
  );
}
