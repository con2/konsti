import { config } from "shared/config";
import { getJWT } from "client/utils/getJWT";
import {
  ApiDevEndpoint,
  ApiEndpoint,
  AuthEndpoint,
} from "shared/constants/apiEndpoints";
import { ApiError } from "shared/types/api/errors";
import { fetchWithTimeout } from "client/utils/fetchWithTimeout";
import {
  isBackgroundRequest,
  onRequestFailure,
  onRequestSuccess,
  shouldTreatHttpErrorAsNetworkError,
  showApiError,
} from "client/utils/networkErrorPolicy";

enum HttpMethod {
  GET = "GET",
  POST = "POST",
  DELETE = "DELETE",
}

interface ApiResponse<T> {
  data: T;
}

const baseURL = config.client().apiServerUrl;

const REQUEST_TIMEOUT_MS = 60000;

const networkErrorResponse = <T>(background: boolean): ApiResponse<T> => {
  onRequestFailure(background);

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
  const background = isBackgroundRequest(method, url);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const authToken = getJWT();
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(`${baseURL}${url}`, REQUEST_TIMEOUT_MS, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return networkErrorResponse<T>(background);
  }

  onRequestSuccess();

  // Reading the response body can reject with AbortError if the page unloads
  // mid-response, so json() calls need the same error handling as fetch()

  // Handle redirect responses (301/302 with JSON body containing location)
  if ([301, 302].includes(response.status)) {
    let data: { location: string };
    try {
      data = (await response.json()) as { location: string };
    } catch {
      return networkErrorResponse<T>(background);
    }
    location.href = data.location;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return new Promise<ApiResponse<T>>(() => {});
  }

  // Handle errors
  if (!response.ok) {
    if (shouldTreatHttpErrorAsNetworkError(background)) {
      return networkErrorResponse<T>(background);
    }

    showApiError(method, url, response.status);

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
    return networkErrorResponse<T>(background);
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
