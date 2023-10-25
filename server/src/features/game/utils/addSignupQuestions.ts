import { findGames } from "server/features/game/gameRepository";
import { saveSignupQuestion } from "server/features/settings/settingsRepository";
import { logger } from "server/utils/logger";
import { getSharedConfig } from "shared/config/sharedConfig";
import { ProgramType } from "shared/typings/models/game";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const addSignupQuestions = async (): Promise<void> => {
  const {
    signupQuestions,
    tournamentSignupQuestion,
    tournamentSignupQuestionExcludeIds,
  } = getSharedConfig();

  const questionPromises = signupQuestions.map(async (signupQuestion) => {
    await saveSignupQuestion(signupQuestion);
  });
  await Promise.all(questionPromises);

  const gamesResult = await findGames();
  if (isErrorResult(gamesResult)) {
    logger.error(
      "%s",
      new Error(`Error finding games: ${unwrapResult(gamesResult)}`),
    );
    return;
  }
  const games = unwrapResult(gamesResult);

  const tournaments = games
    .filter((game) => game.programType === ProgramType.TOURNAMENT)
    .filter(
      (game) => !tournamentSignupQuestionExcludeIds.includes(game.gameId),
    );

  const tournamentPromises = tournaments.map(async (tournament) => {
    await saveSignupQuestion({
      ...tournamentSignupQuestion,
      gameId: tournament.gameId,
    });
  });
  await Promise.all(tournamentPromises);
};
