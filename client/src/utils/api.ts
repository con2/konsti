import axios, { AxiosInstance } from 'axios';
import { config } from 'client/config';
import { getJWT } from 'client/utils/getJWT';

export const api: AxiosInstance = axios.create({
  baseURL: `${config.apiServerUrl}/api`,
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
