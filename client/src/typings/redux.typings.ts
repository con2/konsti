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

export interface AdminState {
  hiddenGames: readonly Game[];
  activeSignupTime: string;
  testTime: string;
  appOpen: boolean;
  responseMessage: string;
  signupMessages: readonly SignupMessage[];
  signupStrategy: SignupStrategy;
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
  groupCode: string;
  groupMembers: readonly GroupMember[];
}

export interface MyGamesState {
  enteredGames: readonly SelectedGame[];
  favoritedGames: readonly Game[];
  signedGames: readonly SelectedGame[];
}

export interface ResultsState {
  result: readonly Result[];
  startTime: string;
}

export interface SignupState {
  signupTime: string;
  selectedGames: readonly SelectedGame[];
  unsavedChanges: boolean;
}

export interface LocalStorageState {
  login: { jwt: string };
}

export type AppDispatch = typeof store.dispatch;

export type RootState = ReturnType<typeof combinedReducer>;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
