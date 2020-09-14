import axios, { AxiosInstance } from 'axios';
import { config } from 'config';
import { getJWT } from 'utils/getJWT';

export const api: AxiosInstance = axios.create({
  baseURL: `${config.apiServerURL}/api`,
  timeout: 60000, // 60s
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const authToken = getJWT();
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});
