import { z } from "zod";
import {
  appUpdateReloadedBuildTimeKey,
  browserStorageEventPrefix,
  kompassiLoginStateKey,
} from "shared/constants/browserStorage";
import { AgeGroup, Language, Tag } from "shared/types/models/programItem";
import { StringToJsonSchema } from "client/utils/zodUtils";
import { StartingTimeOption } from "client/views/all-program-items/programListUtils";

// A const object instead of an enum because enum members can't hold the
// computed event-specific prefix
export const SessionStorageValue = {
  ALL_PROGRAM_ITEMS_SEARCH_TERM: `${browserStorageEventPrefix}-allProgramItemsSearchTerm`,
  ALL_PROGRAM_ITEMS_TAG: `${browserStorageEventPrefix}-allProgramItemsTag`,
  ALL_PROGRAM_ITEMS_SELECTED_VIEW: `${browserStorageEventPrefix}-allProgramItemsSelectedView`,
  ALL_PROGRAM_ITEMS_STARTING_TIME: `${browserStorageEventPrefix}-allProgramItemsStartingTime`,
  ALL_PROGRAM_ITEMS_HIDE_FULL: `${browserStorageEventPrefix}-allProgramItemsHideFull`,
  MY_PROGRAM_ITEMS_SHOW_ALL_PROGRAM_ITEMS: `${browserStorageEventPrefix}-myProgramItemsShowAllProgramItems`,
  APP_UPDATE_RELOADED_BUILD_TIME: appUpdateReloadedBuildTimeKey,
  KOMPASSI_LOGIN_STATE: kompassiLoginStateKey,
} as const;

// The OAuth state of the login this tab started, compared against the value
// Kompassi echoes back to prove the callback answers our own request. Stored
// as a plain string, so there is no shape to validate on the way out
export const getKompassiLoginState = (): string =>
  sessionStorage.getItem(SessionStorageValue.KOMPASSI_LOGIN_STATE) ?? "";

export const saveKompassiLoginState = (state: string): void => {
  sessionStorage.setItem(SessionStorageValue.KOMPASSI_LOGIN_STATE, state);
};

export const clearKompassiLoginState = (): void => {
  sessionStorage.removeItem(SessionStorageValue.KOMPASSI_LOGIN_STATE);
};

// The server build an automatic update reload was already attempted for.
// Session-scoped so a reload that fails to deliver the new build (e.g. stale
// HTML served again) is not retried in a loop in the same tab. Stored as a
// plain string, so there is no shape to validate on the way out
export const getAppUpdateReloadedBuildTime = (): string =>
  sessionStorage.getItem(SessionStorageValue.APP_UPDATE_RELOADED_BUILD_TIME) ??
  "";

export const saveAppUpdateReloadedBuildTime = (buildTime: string): void => {
  sessionStorage.setItem(
    SessionStorageValue.APP_UPDATE_RELOADED_BUILD_TIME,
    buildTime,
  );
};

const SavedSearchTermSchema = z.string();

export const getSavedSearchTerm = (): string => {
  const serializedValue = sessionStorage.getItem(
    SessionStorageValue.ALL_PROGRAM_ITEMS_SEARCH_TERM,
  );

  const result = SavedSearchTermSchema.safeParse(serializedValue);
  if (!result.success) {
    sessionStorage.removeItem(
      SessionStorageValue.ALL_PROGRAM_ITEMS_SEARCH_TERM,
    );
    return "";
  }

  return result.data;
};

const SavedTagsSchema = z.array(
  z.enum(Tag).or(z.enum(Language)).or(z.enum(AgeGroup)),
);

export const getSavedTags = (): (Tag | Language | AgeGroup)[] => {
  const serializedValue = sessionStorage.getItem(
    SessionStorageValue.ALL_PROGRAM_ITEMS_TAG,
  );

  const parseJsonResult = StringToJsonSchema.safeParse(serializedValue);
  if (!parseJsonResult.success) {
    return [];
  }

  const result = SavedTagsSchema.safeParse(parseJsonResult.data);
  if (!result.success) {
    sessionStorage.removeItem(SessionStorageValue.ALL_PROGRAM_ITEMS_TAG);
    return [];
  }

  return result.data;
};

const SavedHideFullSchema = z.preprocess((val) => {
  if (val === "true") return true;
  if (val === "false") return false;
  return;
}, z.boolean().nullable());

export const getSavedHideFull = (): boolean => {
  const serializedValue = sessionStorage.getItem(
    SessionStorageValue.ALL_PROGRAM_ITEMS_HIDE_FULL,
  );

  const result = SavedHideFullSchema.safeParse(serializedValue);
  if (!result.success) {
    sessionStorage.removeItem(SessionStorageValue.ALL_PROGRAM_ITEMS_HIDE_FULL);
    return false;
  }

  return result.data ?? false;
};

const SavedStartingTimeSchema = z.enum(StartingTimeOption);

export const getSavedStartingTime = (): StartingTimeOption => {
  const serializedValue = sessionStorage.getItem(
    SessionStorageValue.ALL_PROGRAM_ITEMS_STARTING_TIME,
  );

  const result = SavedStartingTimeSchema.safeParse(serializedValue);
  if (!result.success) {
    sessionStorage.removeItem(
      SessionStorageValue.ALL_PROGRAM_ITEMS_STARTING_TIME,
    );
    return StartingTimeOption.UPCOMING;
  }

  return result.data;
};

const SavedShowAllProgramItemsSchema = z.boolean();

export const getSavedShowAllProgramItems = (): boolean => {
  const serializedValue = sessionStorage.getItem(
    SessionStorageValue.MY_PROGRAM_ITEMS_SHOW_ALL_PROGRAM_ITEMS,
  );

  const parseJsonResult = StringToJsonSchema.safeParse(serializedValue);
  if (!parseJsonResult.success) {
    return false;
  }

  const result = SavedShowAllProgramItemsSchema.safeParse(parseJsonResult.data);
  if (!result.success) {
    sessionStorage.removeItem(
      SessionStorageValue.MY_PROGRAM_ITEMS_SHOW_ALL_PROGRAM_ITEMS,
    );
    return false;
  }

  return result.data;
};
