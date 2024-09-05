import { z } from "zod";

export const KompassiTokensSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
  scope: z.string(),
  refresh_token: z.string(),
});

export type KompassiTokens = z.infer<typeof KompassiTokensSchema>;

export const KompassiProfileSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  surname: z.string(),
  nick: z.string(),
  full_name: z.string(),
  display_name: z.string(),
  preferred_name_display_style: z.string(),
  email: z.string(),
  birth_date: z.string().or(z.null()),
  phone: z.string(),
  username: z.string(),
  groups: z.array(z.string()),
});

export type KompassiProfile = z.infer<typeof KompassiProfileSchema>;
