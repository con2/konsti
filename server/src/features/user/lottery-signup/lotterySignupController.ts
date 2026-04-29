import { Request, Response } from "express";
import {
  DeleteLotterySignupRequest,
  PostLotterySignupRequest,
} from "shared/types/api/myProgramItems";
import { getAuthUsername } from "server/middleware/requireAuth";
import {
  removeLotterySignup,
  storeLotterySignup,
} from "server/features/user/lottery-signup/lotterySignupService";

export const postLotterySignup = async (
  req: Request<unknown, unknown, PostLotterySignupRequest>,
  res: Response,
): Promise<Response> => {
  const response = await storeLotterySignup({
    programItemId: req.body.programItemId,
    priority: req.body.priority,
    username: getAuthUsername(req),
  });

  return res.json(response);
};

export const deleteLotterySignup = async (
  req: Request<unknown, unknown, DeleteLotterySignupRequest>,
  res: Response,
): Promise<Response> => {
  const response = await removeLotterySignup(
    req.body.lotterySignupProgramItemId,
    getAuthUsername(req),
  );
  return res.json(response);
};
