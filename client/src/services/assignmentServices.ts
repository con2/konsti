import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostAssignmentRequest,
  PostAssignmentResponse,
} from "shared/types/api/assignment";

export const postAssignment = async (
  assignmentTime: string,
): Promise<PostAssignmentResponse> => {
  const response = await api.post<
    PostAssignmentResponse,
    PostAssignmentRequest
  >(ApiEndpoint.ASSIGNMENT, {
    assignmentTime,
  });
  return response.data;
};
