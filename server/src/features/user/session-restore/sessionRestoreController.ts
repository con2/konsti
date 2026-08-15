import { Request, Response } from "express";
import { PostSessionRecoveryRequest } from "shared/types/api/login";
import { loginWithJwt } from "server/features/user/session-restore/sessionRestoreService";

export const postSessionRestore = async (
  req: Request<unknown, unknown, PostSessionRecoveryRequest>,
  res: Response,
): Promise<Response> => {
  const { jwt } = req.body;

  const response = await loginWithJwt(jwt);
  return res.json(response);
};
