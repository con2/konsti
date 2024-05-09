import { merge } from "lodash-es";
import { z } from "zod";
import { LocalStorageState } from "client/types/reduxTypes";
import { ProgramType } from "shared/types/models/programItem";
import { StringToJsonSchema } from "client/utils/zodUtils";
import { config } from "shared/config";
import { ActiveProgramType } from "shared/config/clientConfigTypes";
import { Locale } from "shared/types/locale";

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
  const newSession = previousSession ? merge(previousSession, state) : state;

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

// Locale uses same 'languageKey' as i18next but i18next has separate logic for handling localStorage
const languageKey = "i18nextLng";
const LanguageValueSchema = z.nativeEnum(Locale);

export const getLocalStorageLocale = (): string => {
  const serializedValue = localStorage.getItem(languageKey);

  const result = LanguageValueSchema.safeParse(serializedValue);
  if (!result.success) {
    localStorage.removeItem(languageKey);
    location.reload();
    return Locale.EN;
  }

  return result.data;
};
