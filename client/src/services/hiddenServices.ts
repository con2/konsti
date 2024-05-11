import { api } from "client/utils/api";
import { ApiError } from "shared/types/api/errors";
import { ProgramItem } from "shared/types/models/programItem";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostHiddenRequest,
  PostHiddenResponse,
} from "shared/types/api/settings";

export const postHidden = async (
  hiddenData: readonly ProgramItem[],
): Promise<PostHiddenResponse | ApiError> => {
  const response = await api.post<PostHiddenResponse, PostHiddenRequest>(
    ApiEndpoint.HIDDEN,
    {
      hiddenData,
    },
  );
  return response.data;
};
