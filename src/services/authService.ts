// src/api/authService.ts

import axiosInstance from "../api/axiosInstance";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

// Function to check if an email exists
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.auth.checkEmail, { email });
    // Assuming the API returns { exists: true } or { exists: false }
    return response.data.exists;
  } catch (error) {
    // If API fails, assume email doesn't exist to avoid blocking the user.
    // Or handle the error more gracefully.
    console.error("Error checking email:", error);
    return false;
  }
};