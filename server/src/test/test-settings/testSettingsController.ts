import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiDevEndpoint } from "shared/constants/apiEndpoints";
import {
  fetchTestSettings,
  updateTestSettings,
} from "server/test/test-settings/testSettingsService";
import { PostTestSettingsRequestSchema } from "shared/test-types/api/testSettings";

export const getTestSettings = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: GET ${ApiDevEndpoint.TEST_SETTINGS}`);

  const response = await fetchTestSettings();
  return res.json(response);
};

export const postTestSettings = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiDevEndpoint.TEST_SETTINGS}`);

  const result = PostTestSettingsRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      new Error(`Error validating postTestSettings body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  const response = await updateTestSettings(result.data);
  return res.json(response);
};
