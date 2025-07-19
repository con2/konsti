import { z } from "zod";
import { StartingTimeOption } from "client/views/all-program-items/components/SearchAndFilterCard";
import { Language, Tag } from "shared/types/models/programItem";
import { StringToJsonSchema } from "client/utils/zodUtils";

export enum SessionStorageValue {
  ALL_PROGRAM_ITEMS_SEARCH_TERM = "allProgramItemsSearchTerm",
  ALL_PROGRAM_ITEMS_TAG = "allProgramItemsTag",
  ALL_PROGRAM_ITEMS_SELECTED_VIEW = "allProgramItemsSelectedView",
  ALL_PROGRAM_ITEMS_STARTING_TIME = "allProgramItemsStartingTime",
  ALL_PROGRAM_ITEMS_HIDE_FULL = "allProgramItemsHideFull",
  MY_PROGRAM_ITEMS_SHOW_ALL_PROGRAM_ITEMS = "myProgramItemsShowAllProgramItems",
}

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

const SavedTagSchema = z.nativeEnum(Tag).or(z.nativeEnum(Language));

export const getSavedTag = (): Tag | Language | "" => {
  const serializedValue = sessionStorage.getItem(
    SessionStorageValue.ALL_PROGRAM_ITEMS_TAG,
  );

  const result = SavedTagSchema.safeParse(serializedValue);
  if (!result.success) {
    sessionStorage.removeItem(SessionStorageValue.ALL_PROGRAM_ITEMS_TAG);
    return "";
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

const SavedStartingTimeSchema = z.nativeEnum(StartingTimeOption);

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
