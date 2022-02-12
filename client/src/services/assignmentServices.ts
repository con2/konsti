import { api } from "client/utils/api";
import { ServerError } from "shared/typings/api/errors";
import { ASSIGNMENT_ENDPOINT } from "shared/constants/apiEndpoints";
import { PostPlayerAssignmentResponse } from "shared/typings/api/assignment";

export const postPlayerAssignment = async (
  signupTime: string
): Promise<PostPlayerAssignmentResponse | ServerError> => {
  const response = await api.post<PostPlayerAssignmentResponse>(
    ASSIGNMENT_ENDPOINT,
    {
      startingTime: signupTime,
    }
  );
  return response.data;
};
