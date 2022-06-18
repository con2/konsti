import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { logger } from "server/utils/logger";
import { ApiEndpoint } from "shared/constants/apiEndpoints";
import { SignupData } from "shared/typings/api/myGames";
import { GameSchema } from "shared/typings/models/game";
import { isAuthorized } from "server/utils/authHeader";
import { UserGroup } from "shared/typings/models/user";
import { storeSignedGames } from "server/features/user/signed-game/signedGameService";

const PostSignedGamesParameters = z.object({
  signupData: z.object({
    username: z.string(),
    selectedGames: z.array(
      z.object({
        gameDetails: GameSchema,
        priority: z.number(),
        time: z.string(),
        message: z.string(),
      })
    ),
    signupTime: z.string(),
  }),
});

export const postSignedGames = async (
  req: Request<{}, {}, { signupData: SignupData }>,
  res: Response
): Promise<Response> => {
  logger.info(`API call: POST ${ApiEndpoint.SIGNED_GAME}`);

  let parameters;
  try {
    parameters = PostSignedGamesParameters.parse(req.body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(
        `Error validating postSignedGames parameters: ${error.message}`
      );
    }
    return res.sendStatus(422);
  }

  const { selectedGames, username, signupTime } = parameters.signupData;

  if (!isAuthorized(req.headers.authorization, UserGroup.USER, username)) {
    return res.sendStatus(401);
  }

  const response = await storeSignedGames(selectedGames, username, signupTime);
  return res.json(response);
};
