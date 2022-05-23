import { Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  fetchTestSettings,
  updateTestSettings,
} from "server/test/test-settings/testSettingsService";
import {
  PostTestSettingsRequest,
  PostTestSettingsRequestSchema,
} from "shared/test-typings/api/testSettings";

export const getTestSettings = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.TEST_SETTINGS}`);

  const response = await fetchTestSettings();
  return res.json(response);
};

export const postTestSettings = async (
  req: Request<{}, {}, PostTestSettingsRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.TEST_SETTINGS}`);

  let testSettings;
  try {
    testSettings = PostTestSettingsRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(
        `Error validating postTestSettings parameters: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const response = await updateTestSettings(testSettings);
  return res.json(response);
};
