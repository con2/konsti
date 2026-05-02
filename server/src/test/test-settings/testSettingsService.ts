import {
  findTestSettings,
  saveTestSettings,
} from "server/test/test-settings/testSettingsRepository";
import {
  GetTestSettingsResponse,
  PostTestSettingsRequest,
  PostTestSettingsResponse,
} from "shared/test-types/api/testSettings";
export const fetchTestSettings = async (): Promise<GetTestSettingsResponse> => {
  const responseResult = await findTestSettings();
  if (!responseResult.ok) {
    return {
      message: "Getting test settings failed",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "Getting test settings success",
    status: "success",
    testSettings: { testTime: responseResult.value.testTime },
  };
};

export const updateTestSettings = async (
  settings: PostTestSettingsRequest,
): Promise<PostTestSettingsResponse> => {
  const responseResult = await saveTestSettings(settings);
  if (!responseResult.ok) {
    return {
      message: "Update test settings failure",
      status: "error",
      errorId: "unknown",
    };
  }

  return {
    message: "Update test settings success",
    status: "success",
    testSettings: responseResult.value,
  };
};
