import {
  baseUrl,
  clientId,
} from "server/features/kompassiLogin/kompassiLoginService";
import { AuthEndpoint } from "shared/constants/apiEndpoints";

export const getAuthUrl = (origin: string): string => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${origin}${AuthEndpoint.KOMPASSI_LOGIN_CALLBACK}`,
    scope: "read",
  });

  return `${baseUrl}/oauth2/authorize?${params.toString()}`;
};
