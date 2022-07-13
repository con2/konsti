import _ from "lodash";
import { z } from "zod";
import { LocalStorageState } from "client/typings/redux.typings";
import { ProgramType } from "shared/typings/models/game";

const LocalStorageSchema = z.object({
  login: z.object({ jwt: z.string() }).optional(),
  admin: z.object({ activeProgramType: z.nativeEnum(ProgramType) }).optional(),
});

type LocalStorage = z.infer<typeof LocalStorageSchema>;

export enum LocalStorageValue {
  ALL_GAMES_SEARCH_TERM = "allGamesSearchTerm",
  ALL_GAMES_TAG = "allGamesTag",
  ALL_GAMES_SELECTED_VIEW = "allGamesSelectedView",
}

export const loadSession = (): LocalStorage | undefined => {
  const serializedState = localStorage.getItem("state");
  if (!serializedState) return undefined;

  let parsedSession: LocalStorage;
  try {
    parsedSession = LocalStorageSchema.parse(JSON.parse(serializedState));
  } catch (error) {
    clearSession();
    return undefined;
  }

  if (parsedSession) {
    return parsedSession;
  }

  return undefined;
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
    const oldSession = loadSession();
    localStorage.removeItem("state");
    const newSession = _.omit(oldSession, "login");
    saveSession(newSession);
    Object.values(LocalStorageValue).map((value) => {
      localStorage.removeItem(value);
    });
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
  }
};

export const getLanguage = (): string => {
  let language;
  try {
    language = localStorage.getItem("i18nextLng");
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
  }

  if (typeof language !== "undefined" && typeof language === "string") {
    return language;
  }

  return "eng";
};
