import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  DeleteLotterySignupRequestSchema,
  PostLotterySignupRequestSchema,
} from "shared/types/api/myProgramItems";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { UserGroup } from "shared/types/models/user";
import {
  removeLotterySignup,
  storeLotterySignup,
} from "server/features/user/lottery-signup/lotterySignupService";

export const postLotterySignup = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.LOTTERY_SIGNUP}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = PostLotterySignupRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      new Error(`Error validating postLotterySignup body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  const response = await storeLotterySignup({
    programItemId: result.data.programItemId,
    priority: result.data.priority,
    username,
  });

  return res.json(response);
};

export const deleteLotterySignup = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  logger.info(`API call: DELETE ${ApiEndpoint.LOTTERY_SIGNUP}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER,
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = DeleteLotterySignupRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      new Error(`Error validating deleteLotterySignup body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  const response = await removeLotterySignup(
    result.data.lotterySignupProgramItemId,
    username,
  );
  return res.json(response);
};
