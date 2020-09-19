import {
  SignupActionTypes,
  SUBMIT_SIGNUP_TIME,
  SUBMIT_SELECTED_GAMES,
  UPDATE_UNSAVED_CHANGES_STATUS,
} from 'typings/signupActions.typings';
import { SignupState } from 'typings/redux.typings';

const initialState: SignupState = {
  signupTime: '',
  selectedGames: [],
  unsavedChanges: false,
};

export const signupReducer = (
  state = initialState,
  action: SignupActionTypes
): SignupState => {
  switch (action.type) {
    case SUBMIT_SIGNUP_TIME:
      return { ...state, signupTime: action.signupTime };
    case SUBMIT_SELECTED_GAMES:
      return { ...state, selectedGames: action.selectedGames };
    case UPDATE_UNSAVED_CHANGES_STATUS:
      return { ...state, unsavedChanges: action.unsavedChanges };
    default:
      return state;
  }
};
