import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.MODE === 'development'
      ? 'http://localhost:3001/api'
      : 'https://whatsapp-bot-panel-render-1.onrender.com/api',
});

api.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
