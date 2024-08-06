import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  fetchTestSettings,
  updateTestSettings,
} from "server/test/test-settings/testSettingsService";
import { PostTestSettingsRequestSchema } from "shared/test-types/api/testSettings";

export const getTestSettings = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: GET ${ApiEndpoint.TEST_SETTINGS}`);

  const response = await fetchTestSettings();
  return res.json(response);
};

export const postTestSettings = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.TEST_SETTINGS}`);

  const result = PostTestSettingsRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(`Error validating postTestSettings body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  const response = await updateTestSettings(result.data);
  return res.json(response);
};
