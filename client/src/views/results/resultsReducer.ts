import {
  ResultActionTypes,
  SUBMIT_GET_RESULTS,
} from 'client/typings/resultActions.typings';
import { ResultsState } from 'client/typings/redux.typings';

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
