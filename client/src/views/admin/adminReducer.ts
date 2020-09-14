import {
  AdminActionTypes,
  SUBMIT_UPDATE_HIDDEN,
  SUBMIT_GET_SETTINGS,
  SUBMIT_SELECT_SIGNUP_TIME,
  SUBMIT_SET_TEST_TIME,
  SUBMIT_TOGGLE_APP_OPEN,
  SUBMIT_RESPONSE_MESSAGE,
} from 'typings/adminActions.typings';
import { AdminState } from 'typings/redux.typings';

const initialState: AdminState = {
  hiddenGames: [],
  signupTime: '',
  testTime: '',
  appOpen: true,
  responseMessage: '',
};

export const adminReducer = (
  state = initialState,
  action: AdminActionTypes
): AdminState => {
  switch (action.type) {
    case SUBMIT_UPDATE_HIDDEN:
      return { ...state, hiddenGames: action.hiddenGames };
    case SUBMIT_GET_SETTINGS:
      return {
        ...state,
        hiddenGames: action.hiddenGames,
        signupTime: action.signupTime,
        appOpen: action.appOpen,
      };
    case SUBMIT_SELECT_SIGNUP_TIME:
      return { ...state, signupTime: action.signupTime };
    case SUBMIT_SET_TEST_TIME:
      return { ...state, testTime: action.testTime };
    case SUBMIT_TOGGLE_APP_OPEN:
      return { ...state, appOpen: action.appOpen };
    case SUBMIT_RESPONSE_MESSAGE:
      return { ...state, responseMessage: action.responseMessage };
    default:
      return state;
  }
};
