import { api } from "client/utils/api";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostHiddenError,
  PostHiddenRequest,
  PostHiddenResponse,
} from "shared/types/api/settings";

export const postHidden = async (
  hiddenProgramItemIds: readonly string[],
): Promise<PostHiddenResponse | PostHiddenError> => {
  const response = await api.post<PostHiddenResponse, PostHiddenRequest>(
    ApiEndpoint.HIDDEN,
    {
      hiddenProgramItemIds,
    },
  );
  return response.data;
};
