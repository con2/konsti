import axios, { AxiosInstance } from "axios";
import { config } from "client/config";
import { getJWT } from "client/utils/getJWT";
import { ApiError } from "shared/typings/api/errors";

export const api: AxiosInstance = axios.create({
  baseURL: `${config.apiServerUrl}`,
  timeout: 60000, // 60s
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((requestConfig) => {
  const authToken = getJWT();
  if (authToken && requestConfig.headers) {
    requestConfig.headers.Authorization = `Bearer ${authToken}`;
  }
  return requestConfig;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const response = error.response;
    const url = response.config.url;
    const method = response.config.method;

    // eslint-disable-next-line no-console
    console.log(`Error while calling ${method} ${url}`);

    const data: ApiError = {
      code: 0,
      message: "Invalid API response",
      status: "error",
    };

    return {
      data,
    };
  }
);
