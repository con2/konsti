import _ from "lodash";
import { z } from "zod";
import { LocalStorageState } from "client/typings/redux.typings";
import { ProgramType } from "shared/typings/models/game";

const LocalStorageSchema = z.object({
  login: z.object({ jwt: z.string() }).optional(),
  admin: z.object({ activeProgramType: z.nativeEnum(ProgramType) }).optional(),
});

type LocalStorage = z.infer<typeof LocalStorageSchema>;

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
    clearSessionStorage();
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
  }
};

export enum SessionStorageValue {
  ALL_GAMES_SEARCH_TERM = "allGamesSearchTerm",
  ALL_GAMES_TAG = "allGamesTag",
  ALL_GAMES_SELECTED_VIEW = "allGamesSelectedView",
  ALL_GAMES_STARTING_TIME = "allGamesStartingTime",
  MY_GAMES_SHOW_ALL_GAMES = "myGamesShowAllGames",
}

const clearSessionStorage = (): void => {
  Object.values(SessionStorageValue).map((value) => {
    sessionStorage.removeItem(value);
  });
};

export const getLocalStorageLanguage = (): string => {
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
