import { api } from "client/utils/api";
import { registerBackgroundRequest } from "client/utils/networkErrorPolicy";
import { ApiDevEndpoint } from "shared/constants/apiEndpoints";
import {
  GetTestSettingsResponse,
  PostTestSettingsRequest,
  PostTestSettingsResponse,
} from "shared/test-types/api/testSettings";

// The test-time poll below is part of the periodic data load, so its
// failures get the suppressed background error handling
registerBackgroundRequest("GET", ApiDevEndpoint.TEST_SETTINGS);

export const getTestSettings = async (): Promise<GetTestSettingsResponse> => {
  const response = await api.get<GetTestSettingsResponse>(
    ApiDevEndpoint.TEST_SETTINGS,
  );
  return response.data;
};

export const postTestSettings = async ({
  testTime,
}: {
  testTime: string;
}): Promise<PostTestSettingsResponse> => {
  const response = await api.post<
    PostTestSettingsResponse,
    PostTestSettingsRequest
  >(ApiDevEndpoint.TEST_SETTINGS, {
    testTime,
  });
  return response.data;
};
