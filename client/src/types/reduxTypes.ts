import { Action } from "redux";
import { ThunkAction } from "redux-thunk";
import {
  EventSignupStrategy,
  LoginProvider,
} from "shared/config/eventConfigTypes";
import { EmailNotificationTrigger } from "shared/types/emailNotification";
import { EventLogItem } from "shared/types/models/eventLog";
import { GroupMember } from "shared/types/models/groups";
import {
  ProgramItem,
  ProgramType,
  UserSignup,
} from "shared/types/models/programItem";
import { SignupQuestion } from "shared/types/models/settings";
import { SignupMessage } from "shared/types/models/signupMessage";
import { UserGroup, UserProgramItems } from "shared/types/models/user";
import { BackendError } from "client/types/errorTypes";
import { combinedReducer, store } from "client/utils/store";

export interface AdminState {
  hiddenProgramItemIds: readonly string[];
  activeAssignmentTime: string;
  appOpen: boolean;
  adminMessageFi: string;
  adminMessageEn: string;
  assignmentResponseMessage: string;
  signupQuestions: readonly SignupQuestion[];
  signupStrategy: EventSignupStrategy | undefined;
  errors: readonly BackendError[];
  activeProgramTypes: readonly ProgramType[];
  signupMessages: readonly SignupMessage[];
  loginProvider: LoginProvider | undefined;
  emailNotificationTrigger: readonly EmailNotificationTrigger[];
  serverAppBuildTime: string;
  serverAppBuildTimeCandidate: string;
  serverAppBuildTimeCandidateSince: number;
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
  kompassiId: string;
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
