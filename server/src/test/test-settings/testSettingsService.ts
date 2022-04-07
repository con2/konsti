import {
  findTestSettings,
  saveTestSettings,
} from "server/test/test-settings/testSettingsRepository";
import { logger } from "server/utils/logger";
import { ServerError } from "shared/typings/api/errors";
import {
  GetTestSettingsResponse,
  PostTestSettingsRequest,
  PostTestSettingsResponse,
} from "shared/test-typings/api/testSettings";

export const fetchTestSettings = async (): Promise<
  GetTestSettingsResponse | ServerError
> => {
  try {
    const response = await findTestSettings();

    return {
      message: "Getting test settings success",
      status: "success",
      testSettings: { testTime: response.testTime },
    };
  } catch (error) {
    logger.error(`Settings: ${error}`);
    return {
      message: "Getting test settings failed",
      status: "error",
      code: 0,
    };
  }
};

export const updateTestSettings = async (
  settings: PostTestSettingsRequest
): Promise<PostTestSettingsResponse | ServerError> => {
  try {
    const response = await saveTestSettings(settings);
    return {
      message: "Update test settings success",
      status: "success",
      testSettings: response,
    };
  } catch (error) {
    return {
      message: "Update test settings failure",
      status: "error",
      code: 0,
    };
  }
};
