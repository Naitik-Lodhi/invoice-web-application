// src/api/axiosInstance.ts
import axios from 'axios';
import { BASE_URL } from '../constants/apiEndpoints'; // <-- Import BASE_URL

const axiosInstance = axios.create({
  baseURL: BASE_URL, // <-- Use the imported constant
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;