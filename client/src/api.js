import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((request) => {
  const token = localStorage.getItem('smartcanteen_token');
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

export function errorMessage(error) {
  return error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
}
