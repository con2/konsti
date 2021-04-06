import { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { Action, AnyAction } from 'redux';
import { RootState } from './redux.typings';

export interface WeekdayAndTime {
  time: string;
  capitalize: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export type AppThunkDispatch = ThunkDispatch<RootState, undefined, AnyAction>;
