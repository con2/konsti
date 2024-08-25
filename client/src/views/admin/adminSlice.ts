import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { uniq } from "lodash-es";
import { AdminState, RootState } from "client/types/reduxTypes";
import { SettingsPayload } from "shared/types/api/settings";
import {
  LoginProvider,
  EventSignupStrategy,
} from "shared/config/eventConfigTypes";
import { ProgramItem } from "shared/types/models/programItem";
import { SignupQuestion } from "shared/types/models/settings";
import { SignupMessage } from "shared/types/models/signupMessage";
import { loadSession } from "client/utils/localStorage";
import { config } from "shared/config";
import { ActiveProgramType } from "shared/config/clientConfigTypes";

const getInitialActiveProgramType = (): ActiveProgramType => {
  const persistedState = loadSession();
  const { programTypeSelectOptions } = config.client();

  if (programTypeSelectOptions.length === 1) {
    return programTypeSelectOptions[0];
  }

  return persistedState?.admin?.activeProgramType ?? "all";
};

const initialState = (): AdminState => {
  return {
    hiddenProgramItems: [],
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
    submitUpdateHiddenAsync(
      state,
      action: PayloadAction<readonly ProgramItem[]>,
    ): AdminState {
      return { ...state, hiddenProgramItems: action.payload };
    },

    submitGetSettingsAsync(
      state,
      action: PayloadAction<SettingsPayload>,
    ): AdminState {
      return {
        ...state,
        hiddenProgramItems: action.payload.hiddenProgramItems,
        appOpen: action.payload.appOpen,
        signupQuestions: action.payload.signupQuestions,
        signupStrategy: action.payload.signupStrategy,
        loginProvider: action.payload.loginProvider,
      };
    },

    submitSetSignupStrategyAsync(
      state,
      action: PayloadAction<EventSignupStrategy>,
    ): AdminState {
      return { ...state, signupStrategy: action.payload };
    },

    submitSetLoginProviderAsync(
      state,
      action: PayloadAction<LoginProvider>,
    ): AdminState {
      return { ...state, loginProvider: action.payload };
    },

    submitToggleAppOpenAsync(
      state,
      action: PayloadAction<boolean>,
    ): AdminState {
      return { ...state, appOpen: action.payload };
    },

    submitAssignmentResponseMessageAsync(
      state,
      action: PayloadAction<string>,
    ): AdminState {
      return { ...state, assignmentResponseMessage: action.payload };
    },

    updateSignupQuestions(
      state,
      action: PayloadAction<readonly SignupQuestion[]>,
    ): AdminState {
      return { ...state, signupQuestions: action.payload };
    },

    addError(state, action: PayloadAction<string>): AdminState {
      return {
        ...state,
        errors: uniq([...state.errors, action.payload]),
      };
    },

    removeError(state, action: PayloadAction<string>): AdminState {
      return {
        ...state,
        errors: state.errors.filter((error) => error !== action.payload),
      };
    },

    setActiveProgramType(
      state,
      action: PayloadAction<ActiveProgramType>,
    ): AdminState {
      return { ...state, activeProgramType: action.payload };
    },

    submitGetSignupMessagesAsync(
      state,
      action: PayloadAction<SignupMessage[]>,
    ): AdminState {
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

const selectProgramItems = (state: RootState): readonly ProgramItem[] =>
  state.allProgramItems.programItems;

const selectActiveProgramType = (state: RootState): ActiveProgramType =>
  state.admin.activeProgramType;

export const selectActiveProgramItems = createSelector(
  [selectProgramItems, selectActiveProgramType],
  (programItems, activeProgramType) => {
    if (activeProgramType === "all") {
      return programItems;
    }
    return programItems.filter(
      (programItem) => programItem.programType === activeProgramType,
    );
  },
);
