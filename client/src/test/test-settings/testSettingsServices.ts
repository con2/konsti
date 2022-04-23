import { api } from "client/utils/api";
import { TEST_SETTINGS_ENDPOINT } from "shared/constants/apiEndpoints";
import { ApiError } from "shared/typings/api/errors";
import {
  GetTestSettingsResponse,
  PostTestSettingsResponse,
} from "shared/test-typings/api/testSettings";

export const getTestSettings = async (): Promise<
  GetTestSettingsResponse | ApiError
> => {
  const response = await api.get<GetTestSettingsResponse>(
    TEST_SETTINGS_ENDPOINT
  );
  return response.data;
};

export const postTestSettings = async ({
  testTime,
}: {
  testTime: string;
}): Promise<PostTestSettingsResponse | ApiError> => {
  const response = await api.post<PostTestSettingsResponse>(
    TEST_SETTINGS_ENDPOINT,
    {
      testTime,
    }
  );
  return response.data;
};
