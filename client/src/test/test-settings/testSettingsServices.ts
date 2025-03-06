import { api } from "client/utils/api";
import { ApiDevEndpoint } from "shared/constants/apiEndpoints";
import { ApiError } from "shared/types/api/errors";
import {
  GetTestSettingsResponse,
  PostTestSettingsRequest,
  PostTestSettingsResponse,
} from "shared/test-types/api/testSettings";

export const getTestSettings = async (): Promise<
  GetTestSettingsResponse | ApiError
> => {
  const response = await api.get<GetTestSettingsResponse>(
    ApiDevEndpoint.TEST_SETTINGS,
  );
  return response.data;
};

export const postTestSettings = async ({
  testTime,
}: {
  testTime: string;
}): Promise<PostTestSettingsResponse | ApiError> => {
  const response = await api.post<
    PostTestSettingsResponse,
    PostTestSettingsRequest
  >(ApiDevEndpoint.TEST_SETTINGS, {
    testTime,
  });
  return response.data;
};
