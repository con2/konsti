import { ThunkAction } from "redux-thunk";
import { Action } from "redux";
import { Game, ProgramType, UserSignup } from "shared/typings/models/game";
import { GroupMember } from "shared/typings/models/groups";
import { store, combinedReducer } from "client/utils/store";
import { UserGames, UserGroup } from "shared/typings/models/user";
import { SignupQuestion } from "shared/typings/models/settings";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { BackendErrorType } from "client/components/ErrorBar";
import { SignupMessage } from "shared/typings/models/signupMessage";
import { EventLogItem } from "shared/typings/models/eventLog";

export interface AdminState {
  hiddenGames: readonly Game[];
  activeAssignmentTime: string;
  appOpen: boolean;
  assignmentResponseMessage: string;
  signupQuestions: readonly SignupQuestion[];
  signupStrategy: SignupStrategy | undefined;
  errors: readonly BackendErrorType[];
  activeProgramType: ProgramType;
  signupMessages: readonly SignupMessage[];
}

export interface UsersForGame {
  users: UserSignup[];
  gameId: string;
}

export interface AllGamesState {
  games: readonly Game[];
  signups: readonly UsersForGame[];
}

export interface LoginState {
  username: string;
  loggedIn: boolean;
  jwt: string;
  userGroup: UserGroup;
  serial: string;
  eventLogItems: EventLogItem[];
}

export interface GroupState {
  groupCode: string;
  groupMembers: readonly GroupMember[];
}

export type MyGamesState = UserGames;

export interface TestSettingsState {
  testTime: string;
}

export interface LocalStorageState {
  login: { jwt: string };
  admin: { activeProgramType: ProgramType };
}

export type AppDispatch = typeof store.dispatch;

export type RootState = ReturnType<typeof combinedReducer>;

export type AppThunk<ReturnType = Promise<void>> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
