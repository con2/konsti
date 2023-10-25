import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import _ from "lodash";
import { BackendErrorType } from "client/components/ErrorBar";
import { AdminState, RootState } from "client/typings/redux.typings";
import { SettingsPayload } from "shared/typings/api/settings";
import { LoginProvider, SignupStrategy } from "shared/config/sharedConfig";
import { Game, ProgramType } from "shared/typings/models/game";
import { SignupQuestion } from "shared/typings/models/settings";
import { SignupMessage } from "shared/typings/models/signupMessage";
import { loadSession } from "client/utils/localStorage";
import { getSharedConfig } from "shared/config/sharedConfig";

const getInitialActiveProgramType = (): ProgramType => {
  const persistedState = loadSession();

  if (getSharedConfig().activeProgramTypes.length === 1) {
    return getSharedConfig().activeProgramTypes[0];
  }

  return persistedState?.admin?.activeProgramType ?? ProgramType.TABLETOP_RPG;
};

const initialState = (): AdminState => {
  return {
    hiddenGames: [],
    activeAssignmentTime: "",
    appOpen: true,
    assignmentResponseMessage: "",
    signupQuestions: [],
    signupStrategy: undefined,
    errors: [],
    activeProgramType: getInitialActiveProgramType(),
    signupMessages: [],
    loginProvider: undefined,
  };
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    submitUpdateHiddenAsync(state, action: PayloadAction<readonly Game[]>) {
      return { ...state, hiddenGames: action.payload };
    },

    submitGetSettingsAsync(state, action: PayloadAction<SettingsPayload>) {
      return {
        ...state,
        hiddenGames: action.payload.hiddenGames,
        appOpen: action.payload.appOpen,
        signupQuestions: action.payload.signupQuestions,
        signupStrategy: action.payload.signupStrategy,
        loginProvider: action.payload.loginProvider,
      };
    },

    submitSetSignupStrategyAsync(state, action: PayloadAction<SignupStrategy>) {
      return { ...state, signupStrategy: action.payload };
    },

    submitSetLoginProviderAsync(state, action: PayloadAction<LoginProvider>) {
      return { ...state, loginProvider: action.payload };
    },

    submitToggleAppOpenAsync(state, action: PayloadAction<boolean>) {
      return { ...state, appOpen: action.payload };
    },

    submitAssignmentResponseMessageAsync(state, action: PayloadAction<string>) {
      return { ...state, assignmentResponseMessage: action.payload };
    },

    updateSignupQuestions(
      state,
      action: PayloadAction<readonly SignupQuestion[]>,
    ) {
      return { ...state, signupQuestions: action.payload };
    },

    addError(state, action: PayloadAction<BackendErrorType>) {
      return {
        ...state,
        errors: _.uniq([...state.errors, action.payload]),
      };
    },

    removeError(state, action: PayloadAction<BackendErrorType>) {
      return {
        ...state,
        errors: state.errors.filter((error) => error !== action.payload),
      };
    },

    setActiveProgramType(state, action: PayloadAction<ProgramType>) {
      return { ...state, activeProgramType: action.payload };
    },

    submitGetSignupMessagesAsync(
      state,
      action: PayloadAction<SignupMessage[]>,
    ) {
      return { ...state, signupMessages: action.payload };
    },
  },
});

export const {
  submitUpdateHiddenAsync,
  submitGetSettingsAsync,
  submitSetSignupStrategyAsync,
  submitSetLoginProviderAsync,
  submitToggleAppOpenAsync,
  submitAssignmentResponseMessageAsync,
  updateSignupQuestions,
  addError,
  removeError,
  setActiveProgramType,
  submitGetSignupMessagesAsync,
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
  },
);
