import { z } from "zod";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { GameSchema } from "shared/typings/models/game";

const SignupMessageSchema = z.object({
  gameId: z.string(),
  message: z.string(),
});

export type SignupMessage = z.infer<typeof SignupMessageSchema>;

export const SettingsSchema = z.object({
  hiddenGames: z.array(GameSchema),
  signupTime: z.string(),
  appOpen: z.boolean(),
  signupMessages: z.array(SignupMessageSchema),
  signupStrategy: z.nativeEnum(SignupStrategy),
});

export type Settings = z.infer<typeof SettingsSchema>;
