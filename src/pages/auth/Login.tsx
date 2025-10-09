// src/pages/auth/Login.tsx
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Link,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

// Import custom components and schema
import { loginSchema, type LoginFormData } from "../../utils/validationSchemas";
import FormHeader from "../../components/form/FormHeader";
import FormField from "../../components/form/FormField";
import AppButton from "../../components/AppButton";
import PasswordField from "../../components/PasswordField";

const Login = () => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit: SubmitHandler<LoginFormData> = (data) => {
    console.log("Login Data:", data);
    // Simulate API call for login
    return new Promise((resolve) => setTimeout(resolve, 1500));
  };

  return (
    <Box sx={{ maxWidth: "450px", mx: "auto", px: 2 }}>
      {" "}
      {/* Centered and narrower form */}
      <FormHeader title="Welcome Back" subtitle="Log in to your account." />
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ mt: 2 }}
      >
        <FormField
          name="email"
          control={control}
          label="Email Address"
          type="email"
          required
        />
        <PasswordField name="password" control={control} label="Password" />

        <Controller
          name="rememberMe"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox {...field} checked={field.value} color="primary" />
              }
              label="Remember me"
            />
          )}
        />

        {/* Buttons Section (similar to Signup) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box display={"flex"} width="100%" justifyContent={"right"}>
            <AppButton type="submit" isLoading={isSubmitting}>
              Login
            </AppButton>
          </Box>
          <Typography variant="body2">
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
};

export default Login;
