import { z } from "zod";
import { UserGroup } from "shared/types/models/user";

export const JWTBodySchema = z.object({
  username: z.string(),
  userGroup: z.nativeEnum(UserGroup),
  iat: z.number(),
  exp: z.number(),
});

export type JWTBody = z.infer<typeof JWTBodySchema>;

export const JWTResponseSchema = z.object({
  body: JWTBodySchema,
  status: z.string(),
  message: z.string(),
});

export type JWTResponse = z.infer<typeof JWTResponseSchema>;
