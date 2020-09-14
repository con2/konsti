import {
  ResultActionTypes,
  SUBMIT_GET_RESULTS,
} from 'typings/resultActions.typings';
import { ResultsState } from 'typings/redux.typings';

const initialState: ResultsState = { startTime: '', result: [] };

export const resultsReducer = (
  state = initialState,
  action: ResultActionTypes
): ResultsState => {
  switch (action.type) {
    case SUBMIT_GET_RESULTS:
      return { ...state, result: action.result, startTime: action.startTime };
    default:
      return state;
  }
};
