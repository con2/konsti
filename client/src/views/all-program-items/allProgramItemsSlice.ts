import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { uniq } from "lodash-es";
import { AllProgramItemsState, RootState } from "client/types/reduxTypes";
import {
  Language,
  ProgramItem,
  ProgramItemWithUserSignups,
  Tag,
} from "shared/types/models/programItem";

const initialState: AllProgramItemsState = {
  programItems: [],
  directSignups: [],
};

const allProgramItemsSlice = createSlice({
  name: "allProgramItems",
  initialState,
  reducers: {
    submitGetProgramItemsAsync(
      state,
      action: PayloadAction<readonly ProgramItemWithUserSignups[]>,
    ) {
      return {
        ...state,
        programItems: action.payload.map(
          (programItemWithAttendees) => programItemWithAttendees.programItem,
        ),
        directSignups: action.payload.map((programItemWithAttendees) => {
          return {
            users: programItemWithAttendees.users,
            programItemId: programItemWithAttendees.programItem.programItemId,
          };
        }),
      };
    },
  },
});

export const { submitGetProgramItemsAsync } = allProgramItemsSlice.actions;

export const allProgramItemsReducer = allProgramItemsSlice.reducer;

// SELECTORS

export const selectProgramItems = (state: RootState): readonly ProgramItem[] =>
  state.allProgramItems.programItems;

export const selectTags = createSelector(
  [selectProgramItems],
  (programItems) => {
    const ignoredTags = [
      Tag.GUEST_OF_HONOR,
      Tag.THEME_MONSTERS,
      Tag.INTENDED_FOR_EXPERIENCED_PARTICIPANTS,
    ];

    const tags = uniq([
      Tag.BEGINNER_FRIENDLY,
      Tag.CHILDREN_FRIENDLY,
      Tag.ALL_AGES,
      Tag.AIMED_UNDER_13,
      Tag.AIMED_BETWEEN_13_17,
      Tag.AIMED_ADULTS,
      Tag.FOR_18_PLUS_ONLY,
      ...Object.values(Tag),
    ]);
    return tags
      .filter((tag) => {
        return programItems.some((programItem) =>
          programItem.tags.includes(tag),
        );
      })
      .filter((tag) => !ignoredTags.includes(tag));
  },
);

export const selectLanguages = createSelector(
  [selectProgramItems],
  (programItems) => {
    const ignoredLanguages = [Language.LANGUAGE_FREE];

    const languages = uniq([
      Language.FINNISH,
      Language.ENGLISH,
      Language.SWEDISH,
      ...Object.values(Language),
    ]);
    return languages
      .filter((language) => {
        return programItems.some((programItem) =>
          programItem.languages.includes(language),
        );
      })
      .filter((language) => !ignoredLanguages.includes(language));
  },
);
