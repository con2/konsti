import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { t } from "i18next";
import { config } from "client/config";
import { getJWT } from "client/utils/getJWT";
import { addError } from "client/views/admin/adminSlice";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { ApiError } from "shared/typings/api/errors";
import { store } from "client/utils/store";
import { BackendErrorType } from "client/components/ErrorBar";

enum HttpMethod {
  GET = "GET",
  POST = "POST",
  DELETE = "DELETE",
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: config.apiServerUrl,
  timeout: 60000, // 60s
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth interceptor
axiosInstance.interceptors.request.use((requestConfig) => {
  const authToken = getJWT();
  if (authToken && requestConfig.headers) {
    requestConfig.headers.Authorization = `Bearer ${authToken}`;
  }
  return requestConfig;
});

// Error interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.code === "ERR_NETWORK" ||
      !error.response ||
      error.response.status === 0
    ) {
      store.dispatch(addError(t(BackendErrorType.NETWORK_ERROR)));
      return {
        errorId: "unknown",
        message: "Network error",
        status: "error",
      };
    }

    const response = error.response;
    const method: HttpMethod = response.config.method.toUpperCase();
    const url: ApiEndpoint = response.config.url;

    const errorReason = getErrorReason(Number(response.status) || 0);

    store.dispatch(
      addError(
        t(BackendErrorType.API_ERROR, {
          method,
          url,
          errorReason: t(errorReason),
        })
      )
    );

    const data: ApiError = {
      errorId: "unknown",
      message: "Invalid API response",
      status: "error",
    };

    return {
      data,
    };
  }
);

const getErrorReason = (status: number): BackendErrorType => {
  switch (status) {
    case 401:
      return BackendErrorType.UNAUTHORIZED;
    case 422:
      return BackendErrorType.INVALID_REQUEST;
    default:
      return BackendErrorType.UNKNOWN;
  }
};

interface AxiosRequestConfigGet<REQ> extends AxiosRequestConfig<REQ> {
  params?: REQ;
}

export const api = {
  post: async <RES = never, REQ = never, R = AxiosResponse<RES>>(
    url: string,
    data?: REQ,
    axiosRequestConfig?: AxiosRequestConfig<REQ>
  ): Promise<R> => {
    return await axiosInstance.post(url, data, axiosRequestConfig);
  },

  get: async <RES = never, REQ = never, R = AxiosResponse<RES>>(
    url: string,
    axiosRequestConfig?: AxiosRequestConfigGet<REQ>
  ): Promise<R> => {
    return await axiosInstance.get(url, axiosRequestConfig);
  },

  delete: async <RES = never, REQ = never, R = AxiosResponse<RES>>(
    url: string,
    axiosRequestConfig?: AxiosRequestConfig<REQ>
  ): Promise<R> => {
    return await axiosInstance.get(url, axiosRequestConfig);
  },
};
