import { postPlayerAssignment } from 'client/services/assignmentServices';
import { getResults } from 'client/services/resultsServices';
import { AppThunk } from 'client/typings/utils.typings';
import { submitResponseMessageAsync } from 'client/views/admin/adminSlice';
import { submitGetResultsAsync } from 'client/views/results/resultsSlice';

export const submitGetResults = (startTime: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    const getResultsResponse = await getResults(startTime);

    if (getResultsResponse?.status === 'error') {
      return await Promise.reject(getResultsResponse);
    }

    if (getResultsResponse?.status === 'success') {
      dispatch(
        submitGetResultsAsync({
          result: getResultsResponse.results,
          startTime: getResultsResponse.startTime,
        })
      );
    }
  };
};

export const submitPlayersAssign = (signupTime: string): AppThunk => {
  return async (dispatch): Promise<void> => {
    const assignResponse = await postPlayerAssignment(signupTime);

    if (assignResponse?.status === 'error') {
      return await Promise.reject(assignResponse);
    }

    if (assignResponse?.status === 'success') {
      dispatch(
        submitGetResultsAsync({
          result: assignResponse.results,
          startTime: assignResponse.startTime,
        })
      );

      dispatch(submitResponseMessageAsync(assignResponse.resultMessage));
    }
  };
};
