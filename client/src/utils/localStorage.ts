import { merge } from "remeda";
import { captureException } from "@sentry/react";
import { z } from "zod";
import { LocalStorageState } from "client/types/reduxTypes";
import { ProgramType } from "shared/types/models/programItem";
import { StringToJsonSchema } from "client/utils/zodUtils";
import { ActiveProgramType } from "shared/config/clientConfigTypes";
import { getProgramTypeSelectOptions } from "client/utils/getProgramTypeSelectOptions";
import { Locale } from "shared/types/locale";
import {
  browserStoragePrefix,
  localStorageStateKey,
} from "shared/constants/browserStorage";

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
    // Clearing the session logs the user out, so make the reason visible: a
    // widespread parse failure would mean a persisted-shape change mid-event
    captureException(
      new Error("Invalid localStorage session, clearing session"),
      {
        extra: { zodError: result.error.message },
      },
    );
    // eslint-disable-next-line no-console
    console.error(
      "Invalid localStorage session, clearing session:",
      result.error,
    );
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

// Dismissed admin message is stored separately from the zod-strict 'state' object so a public
// (logged-out) visitor can remember their dismissal without a session. We store the dismissed
// message text itself, so a new or edited admin message no longer matches and shows again
const dismissedAdminMessageKey = `${browserStoragePrefix}-dismissedAdminMessage`;

export const getDismissedAdminMessage = (): string => {
  return localStorage.getItem(dismissedAdminMessageKey) ?? "";
};

export const saveDismissedAdminMessage = (adminMessage: string): void => {
  localStorage.setItem(dismissedAdminMessageKey, adminMessage);
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
