import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { PostLotterySignupsRequestSchema } from "shared/types/api/myProgramItems";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { UserGroup } from "shared/types/models/user";
import { storeLotterySignups } from "server/features/user/lottery-signup/lotterySignupService";

export const postLotterySignups = async (
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

  const result = PostLotterySignupsRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error(
      "%s",
      new Error(`Error validating postLotterySignups body: ${result.error}`),
    );
    return res.sendStatus(422);
  }

  const { lotterySignups, startTime } = result.data;

  const response = await storeLotterySignups(
    lotterySignups,
    username,
    startTime,
  );
  return res.json(response);
};
