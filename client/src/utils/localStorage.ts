import { merge } from "remeda";
import { z } from "zod";
import { LocalStorageState } from "client/types/reduxTypes";
import { ProgramType } from "shared/types/models/programItem";
import { StringToJsonSchema } from "client/utils/zodUtils";
import { ActiveProgramType } from "shared/config/clientConfigTypes";
import { getProgramTypeSelectOptions } from "client/utils/getProgramTypeSelectOptions";
import { Locale } from "shared/types/locale";
import { localStorageStateKey } from "shared/constants/browserStorage";

const isActive = (programType: ActiveProgramType): boolean =>
  getProgramTypeSelectOptions().includes(programType);

const SessionSchema = z
  .object({
    login: z.object({ jwt: z.string() }).optional(),
    admin: z
      .object({
        activeProgramTypes: z.array(z.enum(ProgramType).refine(isActive)),
      })
      .optional(),
  })
  .strict();

type LocalStorage = z.infer<typeof SessionSchema>;

export const loadSession = (): LocalStorage | undefined => {
  const serializedValue = localStorage.getItem(localStorageStateKey);
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
  const serializedState = JSON.stringify(newSession);
  localStorage.setItem(localStorageStateKey, serializedState);
};

export const clearSession = (): void => {
  localStorage.removeItem(localStorageStateKey);
  sessionStorage.clear();
};

// Locale uses same 'languageKey' as i18next but i18next has separate logic for handling localStorage
const languageKey = "i18nextLng";
const LanguageValueSchema = z.enum(Locale);

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
