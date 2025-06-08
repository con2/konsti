import { api } from "client/utils/api";
import { ApiDevEndpoint } from "shared/constants/apiEndpoints";
import {
  GetTestSettingsError,
  GetTestSettingsResponse,
  PostTestSettingsError,
  PostTestSettingsRequest,
  PostTestSettingsResponse,
} from "shared/test-types/api/testSettings";

export const getTestSettings = async (): Promise<
  GetTestSettingsResponse | GetTestSettingsError
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
}): Promise<PostTestSettingsResponse | PostTestSettingsError> => {
  const response = await api.post<
    PostTestSettingsResponse,
    PostTestSettingsRequest
  >(ApiDevEndpoint.TEST_SETTINGS, {
    testTime,
  });
  return response.data;
};
