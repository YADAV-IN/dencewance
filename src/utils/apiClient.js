import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken') || '';
  if (token && !config.headers?.Authorization) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

export const getApiErrorMessage = (error, fallback = 'Request failed') => {
  const message = error?.response?.data?.error || error?.response?.data?.message || error?.message;
  return message || fallback;
};

export const apiGet = async (url, config = {}) => {
  const params = { ...(config.params || {}), _t: Date.now() };
  const response = await apiClient.get(url, { ...config, params });
  return response.data;
};

export const apiPost = async (url, data = {}, config = {}) => {
  const response = await apiClient.post(url, data, config);
  return response.data;
};

export const apiDelete = async (url, config = {}) => {
  const response = await apiClient.delete(url, config);
  return response.data;
};