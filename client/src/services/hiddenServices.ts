import { api } from "client/utils/api";
import { ApiError } from "shared/types/api/errors";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostHiddenRequest,
  PostHiddenResponse,
} from "shared/types/api/settings";

export const postHidden = async (
  hiddenProgramItemIds: readonly string[],
): Promise<PostHiddenResponse | ApiError> => {
  const response = await api.post<PostHiddenResponse, PostHiddenRequest>(
    ApiEndpoint.HIDDEN,
    {
      hiddenProgramItemIds,
    },
  );
  return response.data;
};
