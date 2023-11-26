import { z } from "zod";
import { StartingTimeOption } from "client/views/all-games/components/SearchAndFilterCard";
import { Language, Tag } from "shared/typings/models/game";
import { StringToJsonSchema } from "client/utils/zodUtils";

export enum SessionStorageValue {
  ALL_GAMES_SEARCH_TERM = "allGamesSearchTerm",
  ALL_GAMES_TAG = "allGamesTag",
  ALL_GAMES_SELECTED_VIEW = "allGamesSelectedView",
  ALL_GAMES_STARTING_TIME = "allGamesStartingTime",
  MY_GAMES_SHOW_ALL_GAMES = "myGamesShowAllGames",
}

const SavedSearchTermSchema = z.string();

export const getSavedSearchTerm = (): string => {
  const serializedValue = sessionStorage.getItem(
    SessionStorageValue.ALL_GAMES_SEARCH_TERM,
  );

  const result = SavedSearchTermSchema.safeParse(serializedValue);
  if (!result.success) {
    sessionStorage.removeItem(SessionStorageValue.ALL_GAMES_SEARCH_TERM);
    return "";
  }

  return result.data;
};

const SavedTagSchema = z.nativeEnum(Tag).or(z.nativeEnum(Language));

export const getSavedTag = (): Tag | Language | "" => {
  const serializedValue = sessionStorage.getItem(
    SessionStorageValue.ALL_GAMES_TAG,
  );

  const result = SavedTagSchema.safeParse(serializedValue);
  if (!result.success) {
    sessionStorage.removeItem(SessionStorageValue.ALL_GAMES_TAG);
    return "";
  }

  return result.data;
};

const SavedStartingTimeSchema = z.nativeEnum(StartingTimeOption);

export const getSavedStartingTime = (): StartingTimeOption => {
  const serializedValue = sessionStorage.getItem(
    SessionStorageValue.ALL_GAMES_STARTING_TIME,
  );

  const result = SavedStartingTimeSchema.safeParse(serializedValue);
  if (!result.success) {
    sessionStorage.removeItem(SessionStorageValue.ALL_GAMES_STARTING_TIME);
    return StartingTimeOption.UPCOMING;
  }

  return result.data;
};

const SavedShowAllGamesSchema = z.boolean();

export const getSavedShowAllGames = (): boolean => {
  const serializedValue = sessionStorage.getItem(
    SessionStorageValue.MY_GAMES_SHOW_ALL_GAMES,
  );

  const parseJsonResult = StringToJsonSchema.safeParse(serializedValue);
  if (!parseJsonResult.success) {
    return false;
  }

  const result = SavedShowAllGamesSchema.safeParse(parseJsonResult.data);
  if (!result.success) {
    sessionStorage.removeItem(SessionStorageValue.MY_GAMES_SHOW_ALL_GAMES);
    return false;
  }

  return result.data;
};
