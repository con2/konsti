import _ from "lodash";
import { z } from "zod";
import { LocalStorageState } from "client/typings/redux.typings";
import { ProgramType } from "shared/typings/models/game";
import { StringToJsonSchema } from "client/utils/zodUtils";
import { config } from "shared/config";
import { ActiveProgramType } from "shared/config/clientConfigTypes";

const isActive = (programType: ActiveProgramType): boolean =>
  config.client().activeProgramTypes.includes(programType);

const LocalStorageSchema = z
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

type LocalStorage = z.infer<typeof LocalStorageSchema>;

export const loadSession = (): LocalStorage | undefined => {
  const serializedState = localStorage.getItem("state");
  if (!serializedState) {
    return undefined;
  }

  const parseJsonResult = StringToJsonSchema.safeParse(serializedState);
  if (!parseJsonResult.success) {
    clearSession();
    return undefined;
  }

  const result = LocalStorageSchema.safeParse(parseJsonResult.data);
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

export enum SessionStorageValue {
  ALL_GAMES_SEARCH_TERM = "allGamesSearchTerm",
  ALL_GAMES_TAG = "allGamesTag",
  ALL_GAMES_SELECTED_VIEW = "allGamesSelectedView",
  ALL_GAMES_STARTING_TIME = "allGamesStartingTime",
  MY_GAMES_SHOW_ALL_GAMES = "myGamesShowAllGames",
}

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
