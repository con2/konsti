import { Request, Response } from "express";
import {
  fetchSettings,
  storeHidden,
  storeSignupQuestion,
  removeSignupQuestion,
  updateSettings,
} from "server/features/settings/settingsService";
import {
  DeleteSignupQuestionRequest,
  PostHiddenRequest,
  PostSettingsRequest,
  PostSignupQuestionRequest,
} from "shared/types/api/settings";

export const postHidden = async (
  req: Request<unknown, unknown, PostHiddenRequest>,
  res: Response,
): Promise<Response> => {
  const { hiddenProgramItemIds } = req.body;

  const response = await storeHidden(hiddenProgramItemIds);
  return res.json(response);
};

export const getSettings = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  const response = await fetchSettings();
  return res.json(response);
};

export const postSignupQuestion = async (
  req: Request<unknown, unknown, PostSignupQuestionRequest>,
  res: Response,
): Promise<Response> => {
  const { signupQuestion } = req.body;

  const response = await storeSignupQuestion(signupQuestion);
  return res.json(response);
};

export const deleteSignupQuestion = async (
  req: Request<unknown, unknown, DeleteSignupQuestionRequest>,
  res: Response,
): Promise<Response> => {
  const { programItemId } = req.body;

  const response = await removeSignupQuestion(programItemId);
  return res.json(response);
};

export const postSettings = async (
  req: Request<unknown, unknown, PostSettingsRequest>,
  res: Response,
): Promise<Response> => {
  const response = await updateSettings(req.body);
  return res.json(response);
};
