import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { Action, AnyAction } from 'redux';
import { RootState } from './redux.typings';
import { Game } from 'typings/game.typings';

export interface WeekdayAndTime {
  time: string;
  capitalize: boolean;
}

export interface ServerError {
  code: string;
  message: string;
  status: 'error';
}

export interface GetSettingsResponse {
  appOpen: boolean;
  hiddenGames: Game[];
  message: string;
  signupTime: string;
  status: 'success';
}

export interface PostToggleAppOpenResponse {
  appOpen: boolean;
  message: string;
  status: 'success';
}

export interface PostSignupTimeResult {
  message: string;
  signupTime: string;
  status: 'success';
}

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export type AppThunkDispatch = ThunkDispatch<RootState, undefined, AnyAction>;
