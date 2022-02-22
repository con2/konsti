import { api } from "client/utils/api";
import { TEST_SETTINGS_ENDPOINT } from "shared/constants/apiEndpoints";
import { ServerError } from "shared/typings/api/errors";
import { PostTestSettingsResponse } from "shared/test-typings/api/testSettings";

export const postTestSettings = async ({
  testTime,
}: {
  testTime: string;
}): Promise<PostTestSettingsResponse | ServerError> => {
  const response = await api.post<PostTestSettingsResponse>(
    TEST_SETTINGS_ENDPOINT,
    {
      testTime,
    }
  );
  return response.data;
};
