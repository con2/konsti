import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MyProgramItemsState, RootState } from "client/types/reduxTypes";
import { selectProgramItems } from "client/views/all-program-items/allProgramItemsSlice";
import { ProgramItem } from "shared/types/models/programItem";
import {
  DirectSignup,
  FavoriteProgramItemId,
  LotterySignup,
  UserProgramItems,
} from "shared/types/models/user";

const initialState: MyProgramItemsState = {
  directSignups: [],
  favoriteProgramItemIds: [],
  lotterySignups: [],
};

const myProgramItemsSlice = createSlice({
  name: "myProgramItems",
  initialState,
  reducers: {
    submitGetUserAsync(
      state,
      action: PayloadAction<UserProgramItems>,
    ): MyProgramItemsState {
      return {
        ...state,
        directSignups: action.payload.directSignups,
        favoriteProgramItemIds: action.payload.favoriteProgramItemIds,
        lotterySignups: action.payload.lotterySignups,
      };
    },

    submitUpdateFavoritesAsync(
      state,
      action: PayloadAction<readonly FavoriteProgramItemId[]>,
    ): MyProgramItemsState {
      return {
        ...state,
        favoriteProgramItemIds: action.payload,
      };
    },

    submitPostLotterySignupAsync(
      state,
      action: PayloadAction<readonly LotterySignup[]>,
    ): MyProgramItemsState {
      return { ...state, lotterySignups: action.payload };
    },

    submitDeleteLotterySignupAsync(
      state,
      action: PayloadAction<string>,
    ): MyProgramItemsState {
      const lotterySignups = state.lotterySignups.filter(
        (lotterySignup) => lotterySignup.programItemId !== action.payload,
      );
      return { ...state, lotterySignups };
    },

    submitPostDirectSignupAsync(
      state,
      action: PayloadAction<DirectSignup>,
    ): MyProgramItemsState {
      const directSignups = [...state.directSignups, action.payload];
      return { ...state, directSignups };
    },

    submitDeleteDirectSignupAsync(
      state,
      action: PayloadAction<string>,
    ): MyProgramItemsState {
      const directSignups = state.directSignups.filter(
        (directSignup) => directSignup.programItemId !== action.payload,
      );
      return { ...state, directSignups };
    },
  },
});

export const {
  submitGetUserAsync,
  submitUpdateFavoritesAsync,
  submitPostLotterySignupAsync,
  submitDeleteLotterySignupAsync,
  submitPostDirectSignupAsync,
  submitDeleteDirectSignupAsync,
} = myProgramItemsSlice.actions;

export const myProgramItemsReducer = myProgramItemsSlice.reducer;

// SELECTORS

export type DirectSignupWithProgramItem = DirectSignup & {
  programItem: ProgramItem;
};

export const selectDirectSignups: (
  state: RootState,
) => DirectSignupWithProgramItem[] = createSelector(
  [
    selectProgramItems,
    (state: RootState) => state.myProgramItems.directSignups,
  ],
  (programItems, directSignups) => {
    return directSignups.flatMap((directSignup) => {
      const signedProgramItem = programItems.find(
        (programItem) =>
          programItem.programItemId === directSignup.programItemId,
      );

      if (!signedProgramItem) {
        return [];
      }

      return { ...directSignup, programItem: signedProgramItem };
    });
  },
);

export type LotterySignupWithProgramItem = LotterySignup & {
  programItem: ProgramItem;
};

export const selectLotterySignups: (
  state: RootState,
) => readonly LotterySignupWithProgramItem[] = createSelector(
  [
    selectProgramItems,
    (state: RootState) => state.myProgramItems.lotterySignups,
  ],
  (programItems, lotterySignups) => {
    return lotterySignups.flatMap((lotterySignup) => {
      const signedProgramItem = programItems.find(
        (programItem) =>
          programItem.programItemId === lotterySignup.programItemId,
      );

      if (!signedProgramItem) {
        return [];
      }

      return { ...lotterySignup, programItem: signedProgramItem };
    });
  },
);

const selectFavoriteProgramItemIds = (
  state: RootState,
): readonly FavoriteProgramItemId[] =>
  state.myProgramItems.favoriteProgramItemIds;

export const selectFavoriteProgramItems: (state: RootState) => ProgramItem[] =
  createSelector(
    [selectProgramItems, selectFavoriteProgramItemIds],
    (programItems, favoriteProgramItemIds) => {
      return programItems.filter((programItem) =>
        favoriteProgramItemIds.includes(programItem.programItemId),
      );
    },
  );
