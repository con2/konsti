import {
  AllGamesActionTypes,
  SUBMIT_GET_GAMES,
} from 'typings/allGamesActions.typings';
import { AllGamesState } from 'typings/redux.typings';

const initialState: AllGamesState = { games: [] };

export const allGamesReducer = (
  state = initialState,
  action: AllGamesActionTypes
): AllGamesState => {
  switch (action.type) {
    case SUBMIT_GET_GAMES:
      return { ...state, games: action.games };
    default:
      return state;
  }
};
