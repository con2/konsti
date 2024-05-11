import { api } from "client/utils/api";
import { ApiError } from "shared/types/api/errors";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostAssignmentRequest,
  PostAssignmentResponse,
} from "shared/types/api/assignment";

export const postAssignment = async (
  startTime: string,
): Promise<PostAssignmentResponse | ApiError> => {
  const response = await api.post<
    PostAssignmentResponse,
    PostAssignmentRequest
  >(ApiEndpoint.ASSIGNMENT, {
    startTime,
  });
  return response.data;
};
