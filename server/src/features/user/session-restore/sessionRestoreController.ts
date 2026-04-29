import { Request, Response } from "express";
import { loginWithJwt } from "server/features/user/session-restore/sessionRestoreService";
import { PostSessionRecoveryRequest } from "shared/types/api/login";

export const postSessionRestore = async (
  req: Request<unknown, unknown, PostSessionRecoveryRequest>,
  res: Response,
): Promise<Response> => {
  const { jwt } = req.body;

  const response = await loginWithJwt(jwt);
  return res.json(response);
};
