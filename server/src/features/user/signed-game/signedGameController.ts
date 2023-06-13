import { Request, Response } from "express";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostSignedGamesRequest,
  PostSignedGamesRequestSchema,
} from "shared/typings/api/myGames";
import { getAuthorizedUsername } from "server/utils/authHeader";
import { UserGroup } from "shared/typings/models/user";
import { storeSignedGames } from "server/features/user/signed-game/signedGameService";

export const postSignedGames = async (
  req: Request<{}, {}, PostSignedGamesRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.SIGNED_GAME}`);

  const username = getAuthorizedUsername(
    req.headers.authorization,
    UserGroup.USER
  );
  if (!username) {
    return res.sendStatus(401);
  }

  const result = PostSignedGamesRequestSchema.safeParse(req.body);
  if (!result.success) {
    logger.error("Error validating postSignedGames body: %s", result.error);
    return res.sendStatus(422);
  }

  const { selectedGames, startTime } = result.data;

  const response = await storeSignedGames(selectedGames, username, startTime);
  return res.json(response);
};
