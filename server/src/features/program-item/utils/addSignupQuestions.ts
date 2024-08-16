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
  } = config.event();

  const questionPromises = signupQuestions.map(async (signupQuestion) => {
    await saveSignupQuestion(signupQuestion);
  });
  await Promise.all(questionPromises);

  if (!tournamentSignupQuestion) {
    return;
  }

  const programItemsResult = await findProgramItems();
  if (isErrorResult(programItemsResult)) {
    logger.error(
      "%s",
      new Error(
        `Error finding program items: ${unwrapResult(programItemsResult)}`,
      ),
    );
    return;
  }
  const programItems = unwrapResult(programItemsResult);

  const tournaments = programItems
    .filter((programItem) => programItem.programType === ProgramType.TOURNAMENT)
    .filter(
      (programItem) =>
        !tournamentSignupQuestionExcludeIds.includes(programItem.programItemId),
    );

  const tournamentPromises = tournaments.map(async (tournament) => {
    await saveSignupQuestion({
      ...tournamentSignupQuestion,
      programItemId: tournament.programItemId,
    });
  });
  await Promise.all(tournamentPromises);
};
