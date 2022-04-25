import { ThunkAction } from "redux-thunk";
import { Action } from "redux";
import { Game } from "shared/typings/models/game";
import { GroupMember } from "shared/typings/api/groups";
import { Result } from "shared/typings/models/result";
import { store, combinedReducer } from "client/utils/store";
import { SelectedGame, UserGroup } from "shared/typings/models/user";
import { SignupMessage } from "shared/typings/models/settings";
import { UserSignup } from "shared/typings/api/games";
import { SignupStrategy } from "shared/config/sharedConfig.types";
import { UserGames } from "shared/typings/api/users";

export interface AdminState {
  hiddenGames: readonly Game[];
  activeSignupTime: string;
  appOpen: boolean;
  responseMessage: string;
  signupMessages: readonly SignupMessage[];
  signupStrategy: SignupStrategy | undefined;
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
}

export interface GroupState {
  groupCode: string;
  groupMembers: readonly GroupMember[];
}

export type MyGamesState = UserGames;

export interface ResultsState {
  result: readonly Result[];
  startTime: string;
}

export interface SignupState {
  signupTime: string;
  selectedGames: readonly SelectedGame[];
  unsavedChanges: boolean;
}

export interface TestSettingsState {
  testTime: string;
}

export interface LocalStorageState {
  login: { jwt: string };
}

export type AppDispatch = typeof store.dispatch;

export type RootState = ReturnType<typeof combinedReducer>;

export type AppThunk<ReturnType = Promise<void>> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
