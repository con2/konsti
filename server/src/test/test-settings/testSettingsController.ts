import { Request, Response } from "express";
import { PostTestSettingsRequest } from "shared/test-types/api/testSettings";
import {
  fetchTestSettings,
  updateTestSettings,
} from "server/test/test-settings/testSettingsService";

export const getTestSettings = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  const response = await fetchTestSettings();
  return res.json(response);
};

export const postTestSettings = async (
  req: Request<unknown, unknown, PostTestSettingsRequest>,
  res: Response,
): Promise<Response> => {
  const response = await updateTestSettings(req.body);
  return res.json(response);
};
