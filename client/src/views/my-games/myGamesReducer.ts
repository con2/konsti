import {
  MyGamesActionTypes,
  SUBMIT_GET_USER_GAMES,
  SUBMIT_UPDATE_FAVORITES,
} from 'typings/myGamesActions.typings';
import {
  SignupActionTypes,
  SUBMIT_SIGNED_GAMES,
} from 'typings/signupActions.typings';
import { MyGamesState } from 'typings/redux.typings';

const initialState: MyGamesState = {
  enteredGames: [],
  favoritedGames: [],
  signedGames: [],
};

export const myGamesReducer = (
  state = initialState,
  action: MyGamesActionTypes | SignupActionTypes
): MyGamesState => {
  switch (action.type) {
    case SUBMIT_GET_USER_GAMES:
      return {
        ...state,
        enteredGames: action.enteredGames,
        favoritedGames: action.favoritedGames,
        signedGames: action.signedGames,
      };
    case SUBMIT_UPDATE_FAVORITES:
      return {
        ...state,
        favoritedGames: action.favoritedGames,
      };
    case SUBMIT_SIGNED_GAMES:
      return { ...state, signedGames: action.signedGames };
    default:
      return state;
  }
};
