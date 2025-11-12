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
import { authService } from "../../services/authService";
import { AuthErrorBoundary } from "../../error/ErrorBoundary";
import { VALIDATION_MESSAGES } from "../../constants/messages";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [apiError, setApiError] = useState<string>("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
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
      currencySymbol: "",
      companyLogo: undefined,
    },
  });

  const handleEmailBlur = async (email: string): Promise<void> => {
    clearErrors("email");

    if (!email || !email.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return;

    setIsCheckingEmail(true);

    try {
      const isDuplicate = await authService.checkDuplicateEmail(email.trim());
      
      if (isDuplicate) {
        setError("email", {
          type: "manual",
          message: VALIDATION_MESSAGES.emailAlreadyExists,
        });
        toast.error("This email is already registered!");
      } else {
        clearErrors("email");
      }
    } catch (error) {
      console.error("Error checking email:", error);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const onSubmit: SubmitHandler<SignupFormData> = async (data) => {
    setApiError("");

    // Final email check before submission
    setIsCheckingEmail(true);
    
    try {
      const emailExists = await authService.checkDuplicateEmail(data.email.trim());
      
      if (emailExists) {
        setError("email", {
          type: "manual",
          message: VALIDATION_MESSAGES.emailAlreadyExists,
        });
        toast.error("Email already registered. Please use a different email.");
        setIsCheckingEmail(false);
        return;
      }
    } catch (error) {
      console.error("Final email check failed:", error);
    } finally {
      setIsCheckingEmail(false);
    }

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
      console.error("Signup error:", error);

      const errorMessage =
        error.response?.data || error.message || "Signup failed";

      if (
        errorMessage.toLowerCase().includes("email already exists") ||
        errorMessage.toLowerCase().includes("email is already registered") ||
        errorMessage.toLowerCase().includes("duplicate email")
      ) {
        setError("email", {
          type: "manual",
          message: VALIDATION_MESSAGES.emailAlreadyExists,
        });
        toast.error("Email already exists. Please use a different email.");
      } else if (error.response?.status === 400) {
        setError("root", {
          type: "manual",
          message: errorMessage,
        });
        setApiError(errorMessage);
        toast.error(errorMessage);
      } else {
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
        onEmailBlur={handleEmailBlur}
        error={apiError}
        errors={errors}
        isCheckingEmail={isCheckingEmail}
      />
    </AuthErrorBoundary>
  );
};

export default SignupPage;