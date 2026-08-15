import { AuthEndpoint } from "shared/constants/apiEndpoints";
import {
  USERNAME_LENGTH_MAX,
  USERNAME_LENGTH_MIN,
} from "shared/constants/validation";
import { KompassiUserinfo } from "server/features/kompassi-login/KompassiLoginTypes";
import {
  clientId,
  getBaseUrl,
} from "server/features/kompassi-login/kompassiLoginService";

// openid is required for the userinfo endpoint to accept the access token at
// all; profile and email are conventional for the claims that come with it
const scope = "openid profile email";

export const getAuthUrl = (origin: string, state: string): string => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: `${origin}${AuthEndpoint.KOMPASSI_LOGIN_CALLBACK}`,
    scope,
    state,
  });

  return `${getBaseUrl()}/oidc/authorize/?${params.toString()}`;
};

// OIDC carries no username claim, so a new account needs a starting name for
// the form where the user confirms it. Kompassi's name claim is the full name,
// which usually quotes the nick - that's the closest thing to a chosen handle.
// Candidates that the form itself would reject are skipped rather than
// prefilled, and the Kompassi id backstop is never empty: an empty username
// still saves (the `required` validator accepts empty strings) into an account
// whose JWT then fails every authenticated request
export const deriveKonstiUsername = (userinfo: KompassiUserinfo): string => {
  const candidates = [
    // Kompassi quotes the nick with ASCII quotes today, but a name typed in an
    // editor that curls them would otherwise fall through to the real name
    /["“”]([^"“”]+)["“”]/.exec(userinfo.name)?.[1],
    userinfo.given_name,
    userinfo.email.split("@", 1)[0],
  ];
  const usable = candidates
    .map((candidate) => candidate?.trim() ?? "")
    .find((candidate) => candidate.length >= USERNAME_LENGTH_MIN);

  return (usable ?? `kompassi-${userinfo.sub}`).slice(0, USERNAME_LENGTH_MAX);
};

// Trims the name rather than the suffix, so the result stays unique to this
// Kompassi account even when the name uses up the whole length budget. The
// Kompassi id is opaque and could be long enough to crowd the name out
// entirely, so it too is capped - leaving a name worth reading, and a total
// the finalize form will accept
export const addKompassiIdSuffix = (username: string, sub: string): string => {
  const suffix = `-${sub.slice(0, USERNAME_LENGTH_MAX - USERNAME_LENGTH_MIN - 1)}`;
  return `${username.slice(0, USERNAME_LENGTH_MAX - suffix.length)}${suffix}`;
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
