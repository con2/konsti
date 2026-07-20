import {
  getBaseUrl,
  clientId,
} from "server/features/kompassi-login/kompassiLoginService";
import { AuthEndpoint } from "shared/constants/apiEndpoints";

export const getAuthUrl = (origin: string): string => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${origin}${AuthEndpoint.KOMPASSI_LOGIN_CALLBACK}`,
    scope: "read",
  });

  return `${getBaseUrl()}/oauth2/authorize?${params.toString()}`;
};

// The response body is logged when validation fails - hide token values in
// case the failure is a partially valid body rather than an OAuth error object
export const redactTokenValues = (data: unknown): unknown => {
  if (typeof data !== "object" || data === null) {
    return data;
  }
  const secretKeys = new Set(["access_token", "refresh_token", "id_token"]);
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      secretKeys.has(key) ? "[redacted]" : value,
    ]),
  );
};
