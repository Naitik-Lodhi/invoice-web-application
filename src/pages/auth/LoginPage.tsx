// src/pages/auth/LoginPage.tsx
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { z } from "zod";
import { useAuth } from '../../context/AuthContext';
import { loginSchema } from "../../utils/validationSchemas";
type LoginFormData = z.infer<typeof loginSchema>;
import LoginForm from "../../components/form/LoginForm";
import { authService } from "../../services/authService";
import { toast } from '../../utils/toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const [apiError, setApiError] = useState<string>('');
  
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

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
  setApiError("");
  
  try {
    const response = await authService.login({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    });
    
    // ✅ Make sure this has await
    await setAuthData(response.user, response.company, response.token, data.rememberMe);
    
    toast.success("Login successful!");
    navigate("/");
      
    } catch (err: any) {
      console.error('❌ Login error:', err);
      console.error('❌ Error response:', err.response);
      
      let errorMessage = 'Login failed. Please try again.';
      
      // Check for 401 Unauthorized (wrong credentials)
      if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } 
      // Check for 400 Bad Request
      else if (err.response?.status === 400) {
        errorMessage = err.response?.data || 'Invalid request. Please check your input.';
      }
      // Check for other API errors
      else if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      }
      // Network error
      else if (err.message) {
        errorMessage = err.message;
      }
      
      console.log('📢 Showing error:', errorMessage);
      
      // Set form error (shows in form)
      setError('root', {
        type: 'manual',
        message: errorMessage
      });
      
      // Set API error state (shows in Alert component)
      setApiError(errorMessage);
      
      // Show toast notification
      toast.error(errorMessage);
    }
  };

  return (
    <LoginForm
      control={control}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
      error={apiError}
      errors={errors}
    />
  );
};

export default LoginPage;