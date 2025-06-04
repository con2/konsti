import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { unique } from "remeda";
import { AllProgramItemsState, RootState } from "client/types/reduxTypes";
import {
  Language,
  ProgramItem,
  ProgramItemWithUserSignups,
  Tag,
} from "shared/types/models/programItem";

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
      action: PayloadAction<readonly ProgramItemWithUserSignups[]>,
    ): AllProgramItemsState {
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

export const { submitGetProgramItemsAsync, submitUpdateDirectSignupAsync } =
  allProgramItemsSlice.actions;

export const allProgramItemsReducer = allProgramItemsSlice.reducer;

// SELECTORS

export const selectProgramItems = (state: RootState): readonly ProgramItem[] =>
  state.allProgramItems.programItems;

export const selectTags = createSelector(
  [selectProgramItems],
  (programItems) => {
    const ignoredTags = new Set([
      Tag.GUEST_OF_HONOR,
      Tag.THEME_MONSTERS,
      Tag.INTENDED_FOR_EXPERIENCED_PARTICIPANTS,
    ]);

    const tags = unique([
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
