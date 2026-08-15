import { Request, Response } from "express";
import {
  DeleteDirectSignupRequest,
  PostDirectSignupRequest,
} from "shared/types/api/myProgramItems";
import {
  removeDirectSignup,
  storeDirectSignup,
} from "server/features/direct-signup/directSignupService";
import { getAuthUsername } from "server/middleware/requireAuth";

export const postDirectSignup = async (
  req: Request<unknown, unknown, PostDirectSignupRequest>,
  res: Response,
): Promise<Response> => {
  const response = await storeDirectSignup(req.body, getAuthUsername(req));
  return res.json(response);
};

export const deleteDirectSignup = async (
  req: Request<unknown, unknown, DeleteDirectSignupRequest>,
  res: Response,
): Promise<Response> => {
  const response = await removeDirectSignup(req.body, getAuthUsername(req));
  return res.json(response);
};
