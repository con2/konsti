import { z } from "zod";

// Only the access token is used: the claims are read from the userinfo
// endpoint, and Konsti never refreshes. The rest are present in Kompassi's
// response but optional here so an unused field can't fail a login
export const KompassiTokensSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number().optional(),
  scope: z.string().optional(),
  refresh_token: z.string().optional(),
  id_token: z.string().optional(),
});

export type KompassiTokens = z.infer<typeof KompassiTokensSchema>;

// The full claim set Kompassi returns from /oidc/userinfo/. There is no
// username claim - Kompassi is removing usernames - so `sub` is the identity
export const KompassiUserinfoSchema = z.object({
  // Non-empty: "" is the local-account marker in `kompassiId`, so an empty sub
  // would look up and log in as an arbitrary local account
  sub: z.string().min(1),
  email: z.string(),
  name: z.string(),
  given_name: z.string(),
  family_name: z.string(),
  groups: z.array(z.string()),
});

export type KompassiUserinfo = z.infer<typeof KompassiUserinfoSchema>;
