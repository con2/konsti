import {
  findTestSettings,
  saveTestSettings,
} from "server/test/test-settings/testSettingsRepository";
import { ApiError } from "shared/typings/api/errors";
import {
  GetTestSettingsResponse,
  PostTestSettingsRequest,
  PostTestSettingsResponse,
} from "shared/test-typings/api/testSettings";
import { isErrorResult, unwrapResult } from "shared/utils/asyncResult";

export const fetchTestSettings = async (): Promise<
  GetTestSettingsResponse | ApiError
> => {
  const responseAsyncResult = await findTestSettings();
  if (isErrorResult(responseAsyncResult)) {
    return {
      message: "Getting test settings failed",
      status: "error",
      errorId: "unknown",
    };
  }

  const response = unwrapResult(responseAsyncResult);

  return {
    message: "Getting test settings success",
    status: "success",
    testSettings: { testTime: response.testTime },
  };
};

export const updateTestSettings = async (
  settings: PostTestSettingsRequest
): Promise<PostTestSettingsResponse | ApiError> => {
  const responseAsyncResult = await saveTestSettings(settings);
  if (isErrorResult(responseAsyncResult)) {
    return {
      message: "Update test settings failure",
      status: "error",
      errorId: "unknown",
    };
  }

  const response = unwrapResult(responseAsyncResult);

  return {
    message: "Update test settings success",
    status: "success",
    testSettings: response,
  };
};
