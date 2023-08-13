import { api } from "client/utils/api";
import { ApiError } from "shared/typings/api/errors";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostPlayerAssignmentRequest,
  PostPlayerAssignmentResponse,
} from "shared/typings/api/assignment";

export const postPlayerAssignment = async (
  startTime: string,
): Promise<PostPlayerAssignmentResponse | ApiError> => {
  const response = await api.post<
    PostPlayerAssignmentResponse,
    PostPlayerAssignmentRequest
  >(ApiEndpoint.ASSIGNMENT, {
    startTime,
  });
  return response.data;
};
