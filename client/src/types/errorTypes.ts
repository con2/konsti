export enum BackendErrorType {
  NETWORK_ERROR = "backendError.networkError",
  API_ERROR = "backendError.apiError",
  UNAUTHORIZED = "backendError.unauthorized",
  INVALID_REQUEST = "backendError.invalidRequest",
  UNKNOWN = "backendError.unknown",
}

// Errors are stored as translation keys and translated when rendered, so
// matching an error for removal keeps working across language switches. The
// message params exist only on the API error variant so that a plain
// { errorKey } payload always deep-equals the stored error when removing it
export type BackendError =
  | {
      errorKey: BackendErrorType.API_ERROR;
      method: string;
      url: string;
      errorReason: BackendErrorType;
    }
  | {
      errorKey: Exclude<BackendErrorType, BackendErrorType.API_ERROR>;
    };
