import { t } from "i18next";
import { config } from "shared/config";
import { getJWT } from "client/utils/getJWT";
import { addError } from "client/views/admin/adminSlice";
import {
  ApiDevEndpoint,
  ApiEndpoint,
  AuthEndpoint,
} from "shared/constants/apiEndpoints";
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

interface ApiResponse<T> {
  data: T;
}

const baseURL = config.client().apiServerUrl;

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

// Requests failing around a connectivity change are expected (e.g. laptop
// wakes from sleep and polls before Wi-Fi has reconnected), so the network
// error toast is suppressed while offline and briefly after reconnecting
const RECONNECT_GRACE_PERIOD_MS = 5000;
let reconnectedAt = 0;

addEventListener("online", () => {
  reconnectedAt = Date.now();
});

const shouldShowNetworkError = (): boolean =>
  navigator.onLine && Date.now() - reconnectedAt > RECONNECT_GRACE_PERIOD_MS;

const networkErrorResponse = <T>(): ApiResponse<T> => {
  if (shouldShowNetworkError()) {
    store.dispatch(addError(t(BackendErrorType.NETWORK_ERROR)));
  }

  const error: ApiError = {
    errorId: "unknown",
    message: "Network error",
    status: "error",
  };
  return { data: error as T };
};

const apiFetch = async <T>(
  url: string,
  method: HttpMethod,
  body?: unknown,
): Promise<ApiResponse<T>> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const authToken = getJWT();
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  // Change to AbortSignal.timeout() at some point when browsers mature more
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  let response: Response;
  try {
    response = await fetch(`${baseURL}${url}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timeoutId);
    return networkErrorResponse<T>();
  }

  clearTimeout(timeoutId);

  // Reading the response body can reject with AbortError if the page unloads
  // mid-response, so json() calls need the same error handling as fetch()

  // Handle redirect responses (301/302 with JSON body containing location)
  if ([301, 302].includes(response.status)) {
    let data: { location: string };
    try {
      data = (await response.json()) as { location: string };
    } catch {
      return networkErrorResponse<T>();
    }
    location.href = data.location;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return new Promise<ApiResponse<T>>(() => {});
  }

  // Handle errors
  if (!response.ok) {
    const errorReason = getErrorReason(response.status);

    store.dispatch(
      addError(
        t(BackendErrorType.API_ERROR, {
          method,
          url,
          errorReason: t(errorReason),
        }),
      ),
    );

    const error: ApiError = {
      errorId: "unknown",
      message: "Invalid API response",
      status: "error",
    };
    return { data: error as T };
  }

  try {
    const data = (await response.json()) as T;
    return { data };
  } catch {
    return networkErrorResponse<T>();
  }
};

type Endpoint = ApiEndpoint | ApiDevEndpoint | AuthEndpoint;

export const api = {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  post: async <RES = never, REQ = never>(
    url: Endpoint,
    data?: REQ,
  ): Promise<ApiResponse<RES>> => {
    return await apiFetch<RES>(url, HttpMethod.POST, data);
  },

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  get: async <RES = never, REQ = never>(
    url: Endpoint,
    options?: { params?: REQ },
  ): Promise<ApiResponse<RES>> => {
    let fetchUrl: string = url;
    if (options?.params) {
      const searchParams = new URLSearchParams(options.params);
      fetchUrl = `${url}?${searchParams.toString()}`;
    }
    return await apiFetch<RES>(fetchUrl, HttpMethod.GET);
  },

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  delete: async <RES = never, REQ = never>(
    url: Endpoint,
    options?: { data?: REQ },
  ): Promise<ApiResponse<RES>> => {
    return await apiFetch<RES>(url, HttpMethod.DELETE, options?.data);
  },
};
