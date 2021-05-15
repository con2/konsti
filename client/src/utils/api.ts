import axios, { AxiosInstance } from 'axios';
import { config } from 'client/config';
import { getJWT } from 'client/utils/getJWT';

export const api: AxiosInstance = axios.create({
  baseURL: `${config.apiServerUrl}`,
  timeout: 60000, // 60s
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((requestConfig) => {
  const authToken = getJWT();
  if (authToken) {
    requestConfig.headers.Authorization = `Bearer ${authToken}`;
  }
  return requestConfig;
});
