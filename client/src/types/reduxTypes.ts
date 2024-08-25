import { ThunkAction } from "redux-thunk";
import { Action } from "redux";
import { ProgramItem, UserSignup } from "shared/types/models/programItem";
import { GroupMember } from "shared/types/models/groups";
import { store, combinedReducer } from "client/utils/store";
import { UserProgramItems, UserGroup } from "shared/types/models/user";
import { SignupQuestion } from "shared/types/models/settings";
import {
  LoginProvider,
  EventSignupStrategy,
} from "shared/config/eventConfigTypes";
import { SignupMessage } from "shared/types/models/signupMessage";
import { EventLogItem } from "shared/types/models/eventLog";
import { ActiveProgramType } from "shared/config/clientConfigTypes";

export interface AdminState {
  hiddenProgramItems: readonly ProgramItem[];
  activeAssignmentTime: string;
  appOpen: boolean;
  assignmentResponseMessage: string;
  signupQuestions: readonly SignupQuestion[];
  signupStrategy: EventSignupStrategy | undefined;
  errors: readonly string[];
  activeProgramType: ActiveProgramType;
  signupMessages: readonly SignupMessage[];
  loginProvider: LoginProvider | undefined;
}

interface ProgramItemDirectSignups {
  users: UserSignup[];
  programItemId: string;
}

export interface AllProgramItemsState {
  programItems: readonly ProgramItem[];
  directSignups: readonly ProgramItemDirectSignups[];
}

export interface LoginState {
  username: string;
  loggedIn: boolean;
  jwt: string;
  userGroup: UserGroup;
  serial: string;
  eventLogItems: EventLogItem[];
  kompassiUsernameAccepted: boolean;
  kompassiId: number;
}

export interface GroupState {
  groupCode: string;
  isGroupCreator: boolean;
  groupMembers: readonly GroupMember[];
}

export type MyProgramItemsState = UserProgramItems;

export interface TestSettingsState {
  testTime: string;
}

export interface LocalStorageState {
  login: { jwt: string };
  admin: { activeProgramType: ActiveProgramType };
}

export type AppDispatch = typeof store.dispatch;

export type RootState = ReturnType<typeof combinedReducer>;

export type AppThunk<ReturnType = Promise<void>> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action
>;
