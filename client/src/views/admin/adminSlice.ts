import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { unique } from "remeda";
import { AdminState, RootState } from "client/types/reduxTypes";
import { SettingsPayload } from "shared/types/api/settings";
import {
  LoginProvider,
  EventSignupStrategy,
} from "shared/config/eventConfigTypes";
import { ProgramItem, ProgramType } from "shared/types/models/programItem";
import { SignupQuestion } from "shared/types/models/settings";
import { SignupMessage } from "shared/types/models/signupMessage";
import { loadSession } from "client/utils/localStorage";
import { ActiveProgramType } from "shared/config/clientConfigTypes";

// Empty selection means all program types
const getInitialActiveProgramTypes = (): readonly ProgramType[] => {
  const persistedState = loadSession();
  return persistedState?.admin?.activeProgramTypes ?? [];
};

const initialState = (): AdminState => {
  return {
    hiddenProgramItemIds: [],
    activeAssignmentTime: "",
    appOpen: true,
    assignmentResponseMessage: "",
    signupQuestions: [],
    signupStrategy: undefined,
    errors: [],
    activeProgramTypes: getInitialActiveProgramTypes(),
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
      action: PayloadAction<readonly string[]>,
    ): AdminState {
      return { ...state, hiddenProgramItemIds: action.payload };
    },

    submitGetSettingsAsync(
      state,
      action: PayloadAction<SettingsPayload>,
    ): AdminState {
      return {
        ...state,
        hiddenProgramItemIds: action.payload.hiddenProgramItemIds,
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
        errors: unique([...state.errors, action.payload]),
      };
    },

    removeError(state, action: PayloadAction<string>): AdminState {
      return {
        ...state,
        errors: state.errors.filter((error) => error !== action.payload),
      };
    },

    setActiveProgramTypes(
      state,
      action: PayloadAction<readonly ProgramType[]>,
    ): AdminState {
      return { ...state, activeProgramTypes: action.payload };
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
  setActiveProgramTypes,
  submitGetSignupMessagesAsync,
} = adminSlice.actions;

export const adminReducer = adminSlice.reducer;

// SELECTORS

const selectProgramItems = (state: RootState): readonly ProgramItem[] =>
  state.allProgramItems.programItems;

const selectActiveProgramTypes = (state: RootState): readonly ProgramType[] =>
  state.admin.activeProgramTypes;

// Only for translated texts: the grammatical program type variants (plural,
// genetive, ...) need a single program type, so use the selected one when
// exactly one is selected and otherwise fall back to the "all" texts
export const selectProgramTypeForTexts = createSelector(
  [selectActiveProgramTypes],
  (activeProgramTypes): ActiveProgramType =>
    activeProgramTypes.length === 1 ? activeProgramTypes[0] : "all",
);

export const selectActiveProgramItems = createSelector(
  [selectProgramItems, selectActiveProgramTypes],
  (programItems, activeProgramTypes) => {
    if (activeProgramTypes.length === 0) {
      return programItems;
    }
    const activeTypes = new Set(activeProgramTypes);
    return programItems.filter((programItem) =>
      activeTypes.has(programItem.programType),
    );
  },
);

const selectHiddenProgramItemIds = (state: RootState): readonly string[] =>
  state.admin.hiddenProgramItemIds;

export const selectHiddenProgramItems: (state: RootState) => ProgramItem[] =
  createSelector(
    [selectProgramItems, selectHiddenProgramItemIds],
    (programItems, hiddenProgramItemIds) => {
      return programItems.filter((programItem) =>
        hiddenProgramItemIds.includes(programItem.programItemId),
      );
    },
  );
