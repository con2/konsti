import { Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import {
  PostSignedGamesRequest,
  PostSignedGamesRequestSchema,
} from "shared/typings/api/myGames";
import { isAuthorized } from "server/utils/authHeader";
import { UserGroup } from "shared/typings/models/user";
import { storeSignedGames } from "server/features/user/signed-game/signedGameService";

export const postSignedGames = async (
  req: Request<{}, {}, PostSignedGamesRequest>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.SIGNED_GAME}`);

  const username = isAuthorized(req.headers.authorization, UserGroup.USER);
  if (!username) {
    return res.sendStatus(401);
  }

  let parameters;
  try {
    parameters = PostSignedGamesRequestSchema.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(
        `Error validating postSignedGames parameters: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const { selectedGames, startTime } = parameters;

  const response = await storeSignedGames(selectedGames, username, startTime);
  return res.json(response);
};
