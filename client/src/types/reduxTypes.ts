import { ThunkAction } from "redux-thunk";
import { Action } from "redux";
import { Game, UserSignup } from "shared/typings/models/game";
import { GroupMember } from "shared/typings/models/groups";
import { store, combinedReducer } from "client/utils/store";
import { UserGames, UserGroup } from "shared/typings/models/user";
import { SignupQuestion } from "shared/typings/models/settings";
import { LoginProvider, SignupStrategy } from "shared/config/sharedConfigTypes";
import { BackendErrorType } from "client/components/ErrorBar";
import { SignupMessage } from "shared/typings/models/signupMessage";
import { EventLogItem } from "shared/typings/models/eventLog";
import { ActiveProgramType } from "shared/config/clientConfigTypes";

export interface AdminState {
  hiddenGames: readonly Game[];
  activeAssignmentTime: string;
  appOpen: boolean;
  assignmentResponseMessage: string;
  signupQuestions: readonly SignupQuestion[];
  signupStrategy: SignupStrategy | undefined;
  errors: readonly BackendErrorType[];
  activeProgramType: ActiveProgramType;
  signupMessages: readonly SignupMessage[];
  loginProvider: LoginProvider | undefined;
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
  kompassiUsernameAccepted: boolean;
  kompassiId: number;
}

export interface GroupState {
  groupCode: string;
  isGroupCreator: boolean;
  groupMembers: readonly GroupMember[];
}

export type MyGamesState = UserGames;

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
  Action<string>
>;
