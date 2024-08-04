import { z } from "zod";
import { UserGroup } from "shared/types/models/user";

export const JWTBodySchema = z.object({
  username: z.string(),
  userGroup: z.nativeEnum(UserGroup),
  iat: z.number(),
  exp: z.number(),
});

export type JWTBody = z.infer<typeof JWTBodySchema>;

export interface JWTResponse {
  body: JWTBody;
  status: string;
  message: string;
}
