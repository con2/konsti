import { z } from "zod";
import { StartingTimeOption } from "client/views/all-program-items/programListUtils";
import { AgeGroup, Language, Tag } from "shared/types/models/programItem";
import { StringToJsonSchema } from "client/utils/zodUtils";
import { browserStoragePrefix } from "shared/constants/browserStorage";

// A const object instead of an enum because enum members can't hold the
// computed event-specific prefix
export const SessionStorageValue = {
  ALL_PROGRAM_ITEMS_SEARCH_TERM: `${browserStoragePrefix}-allProgramItemsSearchTerm`,
  ALL_PROGRAM_ITEMS_TAG: `${browserStoragePrefix}-allProgramItemsTag`,
  ALL_PROGRAM_ITEMS_SELECTED_VIEW: `${browserStoragePrefix}-allProgramItemsSelectedView`,
  ALL_PROGRAM_ITEMS_STARTING_TIME: `${browserStoragePrefix}-allProgramItemsStartingTime`,
  ALL_PROGRAM_ITEMS_HIDE_FULL: `${browserStoragePrefix}-allProgramItemsHideFull`,
  MY_PROGRAM_ITEMS_SHOW_ALL_PROGRAM_ITEMS: `${browserStoragePrefix}-myProgramItemsShowAllProgramItems`,
} as const;

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
