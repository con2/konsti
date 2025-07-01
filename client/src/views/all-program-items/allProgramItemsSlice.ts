import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { unique } from "remeda";
import {
  AllProgramItemsState,
  ProgramItemDirectSignups,
  RootState,
} from "client/types/reduxTypes";
import { Language, ProgramItem, Tag } from "shared/types/models/programItem";

interface DirectSignupUpdate {
  programItemId: string;
  updates: {
    username: string;
    signupMessage: string;
  }[];
}

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
      action: PayloadAction<ProgramItem[]>,
    ): AllProgramItemsState {
      return {
        ...state,
        programItems: action.payload,
      };
    },

    submitGetDirectSignupsAsync(
      state,
      action: PayloadAction<ProgramItemDirectSignups[]>,
    ): AllProgramItemsState {
      return {
        ...state,
        directSignups: action.payload,
      };
    },

    submitUpdateDirectSignupAsync(
      state,
      action: PayloadAction<DirectSignupUpdate>,
    ): AllProgramItemsState {
      const index = state.directSignups.findIndex(
        (directSignup) =>
          directSignup.programItemId === action.payload.programItemId,
      );
      if (index !== -1) {
        state.directSignups[index].users = action.payload.updates;
      }
      return state;
    },
  },
});

export const {
  submitGetProgramItemsAsync,
  submitGetDirectSignupsAsync,
  submitUpdateDirectSignupAsync,
} = allProgramItemsSlice.actions;

export const allProgramItemsReducer = allProgramItemsSlice.reducer;

// SELECTORS

export const selectProgramItems = (state: RootState): readonly ProgramItem[] =>
  state.allProgramItems.programItems;

export const selectTags = createSelector(
  [selectProgramItems],
  (programItems) => {
    const ignoredTags = new Set([Tag.GUEST_OF_HONOR, Tag.THEME, Tag.LGBT]);

    const tags = unique([
      Tag.BEGINNER_FRIENDLY,
      Tag.EVERYONE,
      Tag.SMALL_KIDS,
      Tag.KIDS,
      Tag.TEENS,
      Tag.ADULTS,
      Tag.ONLY_ADULTS,
      ...Object.values(Tag),
    ]);
    return tags
      .filter((tag) => {
        return programItems.some((programItem) =>
          programItem.tags.includes(tag),
        );
      })
      .filter((tag) => !ignoredTags.has(tag));
  },
);

export const selectLanguages = createSelector(
  [selectProgramItems],
  (programItems) => {
    const ignoredLanguages = new Set([Language.LANGUAGE_FREE]);

    const languages = unique([
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
      .filter((language) => !ignoredLanguages.has(language));
  },
);
