// src/pages/auth/SignupPage.tsx
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  signupSchema,
  type SignupFormData,
} from "../../utils/validationSchemas";
import SignupForm from "../../components/form/SignupForm";
import { toast } from "../../utils/toast";
import type { SignupData } from "../../services/authService";
import { AuthErrorBoundary } from "../../error/ErrorBoundary";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [apiError, setApiError] = useState<string>("");

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
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
      currencySymbol: "₹",
      companyLogo: undefined,
    },
  });

  const onSubmit: SubmitHandler<SignupFormData> = async (data) => {
    setApiError("");

    try {
      const signupData: SignupData = {
        FirstName: data.firstName.trim(),
        LastName: data.lastName.trim(),
        Email: data.email.trim(),
        Password: data.password,
        CompanyName: data.companyName.trim(),
        Address: data.address.trim(),
        City: data.city.trim(),
        ZipCode: data.zipCode.trim(),
        Industry: data.industry?.trim() || "",
        CurrencySymbol: data.currencySymbol.trim(),
        logo: data.companyLogo,
      };

      await signup(signupData);
      toast.success("Account created successfully! Welcome aboard!");
      navigate("/");
    } catch (error: any) {
      console.error("❌ Signup error:", error);

      // Check for specific error messages from backend
      const errorMessage =
        error.response?.data || error.message || "Signup failed";

      // Handle duplicate email error specifically
      if (
        errorMessage.toLowerCase().includes("email already exists") ||
        errorMessage.toLowerCase().includes("email is already registered") ||
        errorMessage.toLowerCase().includes("duplicate email")
      ) {
        // Set error on email field specifically
        setError("email", {
          type: "manual",
          message:
            "An account with this email already exists. Please use a different email or login.",
        });

        // Also show toast
        toast.error("Email already exists. Please use a different email.");
      } else if (error.response?.status === 400) {
        // Other validation errors
        setError("root", {
          type: "manual",
          message: errorMessage,
        });
        setApiError(errorMessage);
        toast.error(errorMessage);
      } else {
        // General errors
        setError("root", {
          type: "manual",
          message: "Failed to create account. Please try again.",
        });
        setApiError("Failed to create account. Please try again.");
        toast.error("Failed to create account. Please try again.");
      }
    }
  };

  return (
    <AuthErrorBoundary>
      <SignupForm
        control={control}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit(onSubmit)}
        error={apiError}
        errors={errors}
      />
    </AuthErrorBoundary>
  );
};

export default SignupPage;
