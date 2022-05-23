import { api } from "client/utils/api";
import { ApiError } from "shared/typings/api/errors";
import { Game } from "shared/typings/models/game";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostHiddenResponse } from "shared/typings/api/settings";

export const postHidden = async (
  hiddenData: readonly Game[]
): Promise<PostHiddenResponse | ApiError> => {
  const response = await api.post<PostHiddenResponse>(ApiEndpoint.HIDDEN, {
    hiddenData,
  });
  return response.data;
};
