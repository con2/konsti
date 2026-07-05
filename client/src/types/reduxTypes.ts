import { ThunkAction } from "redux-thunk";
import { Action } from "redux";
import {
  ProgramItem,
  ProgramType,
  UserSignup,
} from "shared/types/models/programItem";
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
import { EmailNotificationTrigger } from "shared/types/emailNotification";

export interface AdminState {
  hiddenProgramItemIds: readonly string[];
  activeAssignmentTime: string;
  appOpen: boolean;
  adminMessageFi: string;
  adminMessageEn: string;
  assignmentResponseMessage: string;
  signupQuestions: readonly SignupQuestion[];
  signupStrategy: EventSignupStrategy | undefined;
  errors: readonly string[];
  activeProgramTypes: readonly ProgramType[];
  signupMessages: readonly SignupMessage[];
  loginProvider: LoginProvider | undefined;
  emailNotificationTrigger: readonly EmailNotificationTrigger[];
}

export interface ProgramItemDirectSignups {
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
  email: string;
  emailNotificationPermitAsked: boolean;
}

export interface GroupState {
  groupCode: string;
  isGroupCreator: boolean;
  groupMembers: readonly GroupMember[];
}

export type MyProgramItemsState = UserProgramItems;

export interface TestSettingsState {
  testTime: string | null;
}

export interface LocalStorageState {
  login: { jwt: string };
  admin: { activeProgramTypes: readonly ProgramType[] };
}

export type AppDispatch = typeof store.dispatch;

export type RootState = ReturnType<typeof combinedReducer>;

export type AppThunk<ReturnType = Promise<void>> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action
>;
