import axios from 'axios';
import { applyInterceptors } from './interceptors';

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

applyInterceptors(axiosInstance);

export default axiosInstance;
