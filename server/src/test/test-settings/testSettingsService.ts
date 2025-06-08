import {
  findTestSettings,
  saveTestSettings,
} from "server/test/test-settings/testSettingsRepository";
import {
  GetTestSettingsError,
  GetTestSettingsResponse,
  PostTestSettingsError,
  PostTestSettingsRequest,
  PostTestSettingsResponse,
} from "shared/test-types/api/testSettings";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const fetchTestSettings = async (): Promise<
  GetTestSettingsResponse | GetTestSettingsError
> => {
  const responseResult = await findTestSettings();
  if (isErrorResult(responseResult)) {
    return {
      message: "Getting test settings failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const response = unwrapResult(responseResult);

  return {
    message: "Getting test settings success",
    status: "success",
    testSettings: { testTime: response.testTime },
  };
};

export const updateTestSettings = async (
  settings: PostTestSettingsRequest,
): Promise<PostTestSettingsResponse | PostTestSettingsError> => {
  const responseResult = await saveTestSettings(settings);
  if (isErrorResult(responseResult)) {
    return {
      message: "Update test settings failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const response = unwrapResult(responseResult);

  return {
    message: "Update test settings success",
    status: "success",
    testSettings: response,
  };
};
