import _ from "lodash";
import { z } from "zod";
import { LocalStorageState } from "client/typings/reduxTypes";
import { ProgramType } from "shared/typings/models/game";
import { StringToJsonSchema } from "client/utils/zodUtils";
import { config } from "shared/config";
import { ActiveProgramType } from "shared/config/clientConfigTypes";

const isActive = (programType: ActiveProgramType): boolean =>
  config.client().activeProgramTypes.includes(programType);

const SessionSchema = z
  .object({
    login: z.object({ jwt: z.string() }).optional(),
    admin: z
      .object({
        activeProgramType: z
          .nativeEnum(ProgramType)
          .or(z.literal("all"))
          .refine(isActive),
      })
      .optional(),
  })
  .strict();

type LocalStorage = z.infer<typeof SessionSchema>;

export const loadSession = (): LocalStorage | undefined => {
  const serializedValue = localStorage.getItem("state");
  if (!serializedValue) {
    return undefined;
  }

  const parseJsonResult = StringToJsonSchema.safeParse(serializedValue);
  if (!parseJsonResult.success) {
    clearSession();
    return undefined;
  }

  const result = SessionSchema.safeParse(parseJsonResult.data);
  if (!result.success) {
    clearSession();
    return undefined;
  }

  return result.data;
};

export const saveSession = (state: Partial<LocalStorageState>): void => {
  const previousSession = loadSession();
  const newSession = previousSession ? _.merge(previousSession, state) : state;

  try {
    const serializedState = JSON.stringify(newSession);
    localStorage.setItem("state", serializedState);
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
  }
};

export const clearSession = (): void => {
  try {
    localStorage.removeItem("state");
    sessionStorage.clear();
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
  }
};

const languageKey = "i18nextLng";
const LanguageValueSchema = z.string();

export const getLocalStorageLanguage = (): string => {
  const serializedValue = localStorage.getItem(languageKey);

  const result = LanguageValueSchema.safeParse(serializedValue);
  if (!result.success) {
    return "eng";
  }

  return result.data;
};
