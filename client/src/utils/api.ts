import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { t } from "i18next";
import { config } from "shared/config";
import { getJWT } from "client/utils/getJWT";
import { addError } from "client/views/admin/adminSlice";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { ApiError } from "shared/types/api/errors";
import { store } from "client/utils/store";

export enum BackendErrorType {
  NETWORK_ERROR = "backendError.networkError",
  API_ERROR = "backendError.apiError",
  UNAUTHORIZED = "backendError.unauthorized",
  INVALID_REQUEST = "backendError.invalidRequest",
  UNKNOWN = "backendError.unknown",
}

enum HttpMethod {
  GET = "GET",
  POST = "POST",
  DELETE = "DELETE",
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: config.client().apiServerUrl,
  timeout: 60000, // 60s
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth interceptor
axiosInstance.interceptors.request.use((requestConfig) => {
  const authToken = getJWT();
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (authToken && requestConfig.headers) {
    requestConfig.headers.Authorization = `Bearer ${authToken}`;
  }
  return requestConfig;
});

// Redirect interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && [301, 302].includes(error.response.status)) {
      // @ts-expect-error: TODO: Type this
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const redirectUrl = error.response.data.location;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      window.location.href = redirectUrl;
      return;
    }

    // Continue to error interceptor
    return Promise.reject(error);
  },
);

// Error interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error): { data: ApiError } => {
    if (
      error.code === "ERR_NETWORK" ||
      !error.response ||
      error.response.status === 0
    ) {
      store.dispatch(addError(t(BackendErrorType.NETWORK_ERROR)));

      return {
        data: {
          errorId: "unknown",
          message: "Network error",
          status: "error",
        },
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response = error.response;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const method: HttpMethod = response.config.method.toUpperCase();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const url: ApiEndpoint = response.config.url;

    const errorReason = getErrorReason(Number(response.status) || 0);

    store.dispatch(
      addError(
        t(BackendErrorType.API_ERROR, {
          method,
          url,
          errorReason: t(errorReason),
        }),
      ),
    );

    return {
      data: {
        errorId: "unknown",
        message: "Invalid API response",
        status: "error",
      },
    };
  },
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
    axiosRequestConfig?: AxiosRequestConfig<REQ>,
  ): Promise<R> => {
    return await axiosInstance.post(url, data, axiosRequestConfig);
  },

  get: async <RES = never, REQ = never, R = AxiosResponse<RES>>(
    url: string,
    axiosRequestConfig?: AxiosRequestConfigGet<REQ>,
  ): Promise<R> => {
    return await axiosInstance.get(url, axiosRequestConfig);
  },

  delete: async <RES = never, REQ = never, R = AxiosResponse<RES>>(
    url: string,
    axiosRequestConfig?: AxiosRequestConfig<REQ>,
  ): Promise<R> => {
    return await axiosInstance.delete(url, axiosRequestConfig);
  },
};
