import axios, { AxiosInstance } from "axios";
import { t } from "i18next";
import { config } from "client/config";
import { getJWT } from "client/utils/getJWT";
import { addError } from "client/views/admin/adminSlice";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { ApiError } from "shared/typings/api/errors";
import { store } from "client/utils/store";
import { ErrorMessageType } from "client/components/ErrorBar";

enum HttpMethod {
  GET = "GET",
  POST = "POST",
  DELETE = "DELETE",
}

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
    if (
      error.code === "ERR_NETWORK" ||
      !error.response ||
      error.response.status === 0
    ) {
      store.dispatch(
        addError(t(ErrorMessageType.NETWORK_ERROR) as ErrorMessageType)
      );
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
        // @ts-expect-error: i18next bug
        t(ErrorMessageType.API_ERROR, {
          method,
          url,
          errorReason,
        }) as ErrorMessageType
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

const getErrorReason = (status: number): string => {
  switch (status) {
    case 401:
      // @ts-expect-error: i18next bug
      return t("backendError.unauthorized");
    case 422:
      // @ts-expect-error: i18next bug
      return t("backendError.invalidRequest");
    default:
      // @ts-expect-error: i18next bug
      return t("error.unknown");
  }
};
