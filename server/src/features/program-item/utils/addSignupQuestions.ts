import { findProgramItems } from "server/features/program-item/programItemRepository";
import { saveSignupQuestion } from "server/features/settings/settingsRepository";
import { logger } from "server/utils/logger";
import { config } from "shared/config";
import { ProgramType } from "shared/types/models/programItem";
import { isErrorResult, unwrapResult } from "shared/utils/result";

export const addSignupQuestions = async (): Promise<void> => {
  const {
    signupQuestions,
    tournamentSignupQuestion,
    tournamentSignupQuestionExcludeIds,
  } = config.shared();

  const questionPromises = signupQuestions.map(async (signupQuestion) => {
    await saveSignupQuestion(signupQuestion);
  });
  await Promise.all(questionPromises);

  if (!tournamentSignupQuestion) {
    return;
  }

  const gamesResult = await findProgramItems();
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
      (game) =>
        !tournamentSignupQuestionExcludeIds.includes(game.programItemId),
    );

  const tournamentPromises = tournaments.map(async (tournament) => {
    await saveSignupQuestion({
      ...tournamentSignupQuestion,
      programItemId: tournament.programItemId,
    });
  });
  await Promise.all(tournamentPromises);
};
