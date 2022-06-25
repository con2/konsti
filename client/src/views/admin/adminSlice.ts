import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import _ from "lodash";
import { ErrorMessageType } from "client/components/ErrorBar";
import { AdminState, RootState } from "client/typings/redux.typings";
import { SubmitGetSettingsPayload } from "client/views/admin/adminTypes";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { Game, ProgramType } from "shared/typings/models/game";
import { SignupMessage } from "shared/typings/models/settings";

const initialState: AdminState = {
  hiddenGames: [],
  activeSignupTime: "",
  appOpen: true,
  responseMessage: "",
  signupMessages: [],
  signupStrategy: undefined,
  errors: [],
  activeProgramType: ProgramType.TABLETOP_RPG,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    submitUpdateHiddenAsync(state, action: PayloadAction<readonly Game[]>) {
      return { ...state, hiddenGames: action.payload };
    },

    submitGetSettingsAsync(
      state,
      action: PayloadAction<SubmitGetSettingsPayload>
    ) {
      return {
        ...state,
        hiddenGames: action.payload.hiddenGames,
        activeSignupTime: action.payload.signupTime,
        appOpen: action.payload.appOpen,
        signupMessages: action.payload.signupMessages,
        signupStrategy: action.payload.signupStrategy,
      };
    },

    submitActiveSignupTimeAsync(state, action: PayloadAction<string>) {
      return { ...state, activeSignupTime: action.payload };
    },

    submitSetSignupStrategyAsync(state, action: PayloadAction<SignupStrategy>) {
      return { ...state, signupStrategy: action.payload };
    },

    submitToggleAppOpenAsync(state, action: PayloadAction<boolean>) {
      return { ...state, appOpen: action.payload };
    },

    submitResponseMessageAsync(state, action: PayloadAction<string>) {
      return { ...state, responseMessage: action.payload };
    },

    updateSignupMessages(
      state,
      action: PayloadAction<readonly SignupMessage[]>
    ) {
      return { ...state, signupMessages: action.payload };
    },

    addError(state, action: PayloadAction<ErrorMessageType>) {
      return {
        ...state,
        errors: _.uniq([...state.errors, action.payload]),
      };
    },

    removeError(state, action: PayloadAction<ErrorMessageType>) {
      return {
        ...state,
        errors: state.errors.filter((error) => error !== action.payload),
      };
    },

    setActiveProgramType(state, action: PayloadAction<ProgramType>) {
      return { ...state, activeProgramType: action.payload };
    },
  },
});

export const {
  submitUpdateHiddenAsync,
  submitGetSettingsAsync,
  submitActiveSignupTimeAsync,
  submitSetSignupStrategyAsync,
  submitToggleAppOpenAsync,
  submitResponseMessageAsync,
  updateSignupMessages,
  addError,
  removeError,
  setActiveProgramType,
} = adminSlice.actions;

export const adminReducer = adminSlice.reducer;

// SELECTORS

const selectGames = (state: RootState): readonly Game[] => state.allGames.games;
const selectActiveProgramType = (state: RootState): ProgramType =>
  state.admin.activeProgramType;

export const selectActiveGames = createSelector(
  [selectGames, selectActiveProgramType],
  (games, activeProgramType) => {
    return games.filter((game) => game.programType === activeProgramType);
  }
);
