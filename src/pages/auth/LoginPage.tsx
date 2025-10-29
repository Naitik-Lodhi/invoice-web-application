// src/pages/auth/LoginPage.tsx
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { z } from "zod";
import { useAuth } from '../../context/AuthContext';
import { loginSchema } from "../../utils/validationSchemas";
import LoginForm from "../../components/form/LoginForm";
import { authService } from "../../services/authService";
import { toast } from '../../utils/toast';
import { handleAPIError, isRetryableError, getLoginErrorMessage } from '../../utils/errorHandler';

type LoginFormData = z.infer<typeof loginSchema>;

// Add this if you want to use gtag (Google Analytics)
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const [apiError, setApiError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const maxRetries = 3;
  
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsRetrying(true);
    // This will trigger form resubmission with last values
    const submitButton = document.querySelector('form button[type="submit"]') as HTMLButtonElement;
    if (submitButton) {
      submitButton.click();
    }
    setTimeout(() => setIsRetrying(false), 100);
  };

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setApiError("");
    
    try {
      console.log("🔐 Attempting login for:", data.email);
      
      const response = await authService.login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      
      // Reset retry count on success
      setRetryCount(0);
      
      // Set auth data
      await setAuthData(
        response.user, 
        response.company, 
        response.token, 
        data.rememberMe
      );
      
      toast.success("Welcome back! Login successful.");
      navigate("/");
      
    } catch (err: any) {
      console.error('❌ Login error:', err);
      
      // Use the error handler to get user-friendly message
      const apiError = handleAPIError(err);
      const errorMessage = getLoginErrorMessage(err);
      
      console.log('📢 Error details:', {
        code: apiError.code,
        status: apiError.status,
        isRetryable: apiError.isRetryable,
        message: errorMessage
      });
      
      // Set form error (shows in form)
      setError('root', {
        type: 'manual',
        message: errorMessage
      });
      
      // Set API error state (shows in Alert component if you have one)
      setApiError(errorMessage);
      
      // Show toast notification based on error type
      if (isRetryableError(apiError)) {
        // For retryable errors, show error with retry suggestion
        if (retryCount < maxRetries) {
          toast.error(`${errorMessage} Click to retry.`, {
            onClick: handleRetry,
            autoHideDuration: 6000,
          } as any);
        } else {
          toast.error(`${errorMessage} Maximum retry attempts reached.`);
        }
        
        // If it's a server timeout, also show a helpful tip
        if (apiError.code === 'SERVER_TIMEOUT' || apiError.code === 'DATABASE_ERROR') {
          setTimeout(() => {
            toast.info('Tip: If the problem persists, try again in a few minutes or contact support.');
          }, 2000);
        }
      } else {
        // For non-retryable errors (like wrong credentials)
        toast.error(errorMessage);
        
        // Focus on email field for credential errors
        if (apiError.code === 'INVALID_CREDENTIALS' || apiError.code === 'USER_NOT_FOUND') {
          setTimeout(() => {
            const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
            emailInput?.focus();
          }, 100);
        }
      }
      
      // Log to analytics/monitoring (if you have Google Analytics)
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'login_error', {
          error_code: apiError.code,
          error_status: apiError.status,
          retry_count: retryCount
        });
      }
    }
  };

  return (
    <>
      <LoginForm
        control={control}
        isSubmitting={isSubmitting || isRetrying}
        onSubmit={handleSubmit(onSubmit)}
        error={apiError}
        errors={errors}
      />
      
      {/* Optional: Show retry count if retrying */}
      {retryCount > 0 && (
        <div className="text-center mt-2 text-sm text-gray-500">
          Retry attempt {retryCount} of {maxRetries}
        </div>
      )}
    </>
  );
};

export default LoginPage;